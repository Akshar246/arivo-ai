from fastapi import FastAPI, UploadFile, File
from pydantic import BaseModel
from langchain_groq import ChatGroq
from langchain_chroma import Chroma
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.messages import HumanMessage, AIMessage
from langchain_core.output_parsers import StrOutputParser
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import uvicorn
import joblib
import tempfile
import os
import json
import pdfplumber

load_dotenv()

app = FastAPI(title="Arivo AI Service", version="1.0.0")

# Allow React frontend and Node backend to talk to FastAPI
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# LLM
llm = ChatGroq(model="llama-3.3-70b-versatile", temperature=0.4)

# RAG setup
embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
vectorstore = Chroma(persist_directory="./arivo_db", embedding_function=embeddings)
retriever = vectorstore.as_retriever(search_kwargs={"k": 3})

# Session memory
sessions = {}


# ─────────────────────────────────────────────
# REQUEST MODELS
# ─────────────────────────────────────────────
class ChatRequest(BaseModel):
    message: str
    session_id: str = "default"


class SkillGapRequest(BaseModel):
    skills: dict


class CVRequest(BaseModel):
    cv_text: str


# ─────────────────────────────────────────────
# ENDPOINTS
# ─────────────────────────────────────────────
@app.get("/")
def health_check():
    return {"status": "Arivo AI Service is running"}


@app.post("/chat")
def chat(request: ChatRequest):
    if request.session_id not in sessions:
        sessions[request.session_id] = []

    history = sessions[request.session_id]

    # Step 1 — Retrieve relevant jobs from ChromaDB
    relevant_docs = retriever.invoke(request.message)
    context = "\n".join([doc.page_content for doc in relevant_docs])

    # Step 2 — Build prompt with real job data injected
    prompt = ChatPromptTemplate.from_messages(
        [
            (
                "system",
                """You are Arivo, an AI career coach helping
        international students navigate the UK job market.

Use the following REAL job listings to answer the user's question.
Only recommend jobs from this list — do not make up jobs.

Real job listings:
{context}

If the question is not about jobs, answer from your general knowledge.""",
            ),
            MessagesPlaceholder(variable_name="history"),
            ("human", "{input}"),
        ]
    )

    chain = prompt | llm | StrOutputParser()

    response = chain.invoke(
        {"context": context, "history": history, "input": request.message}
    )

    # Step 3 — Save to memory
    history.append(HumanMessage(content=request.message))
    history.append(AIMessage(content=response))

    return {"response": response, "session_id": request.session_id}


@app.post("/skill-gap")
def skill_gap(request: SkillGapRequest):
    # Load pre-trained model — trained in skill_gap.py
    model = joblib.load("skill_gap_model.pkl")

    SKILLS = [
        "python",
        "javascript",
        "react",
        "node",
        "machine_learning",
        "deep_learning",
        "sql",
        "docker",
        "aws",
        "langchain",
        "nlp",
        "pytorch",
    ]

    # Convert skills dict to ordered array
    vector = [request.skills.get(skill, 0) for skill in SKILLS]

    # Predict readiness score
    score = model.predict([vector])[0]

    # Find missing skills
    missing = [s for s in SKILLS if request.skills.get(s, 0) == 0]

    return {
        "readiness_score": round(score),
        "missing_skills": missing,
        "total_skills": len(SKILLS),
        "skills_present": sum(vector),
    }


@app.post("/extract-skills")
def extract_skills(request: CVRequest):
    # ─────────────────────────────────────────────
    # AI POWERED SKILL EXTRACTION
    # Send entire CV text to Groq
    # Groq reads it intelligently and returns
    # every skill regardless of field or industry
    # ─────────────────────────────────────────────
    prompt = ChatPromptTemplate.from_messages(
        [
            (
                "system",
                """You are an expert CV analyser.

Your job is to extract every skill from the CV text provided.

Include ALL of the following if present:
- Technical skills and tools
- Programming languages and frameworks
- Soft skills and interpersonal skills
- Domain knowledge and industry expertise
- Certifications and qualifications
- Software and platforms
- Languages spoken

Return ONLY a valid JSON array of strings.
No explanation. No extra text. Just the JSON array.

Example output:
["Python", "React", "Team Leadership", "Financial Modelling", "French"]
""",
            ),
            ("human", "Extract all skills from this CV:\n\n{cv_text}"),
        ]
    )

    chain = prompt | llm | StrOutputParser()
    response = chain.invoke({"cv_text": request.cv_text})

    try:
        cleaned = response.strip()
        if cleaned.startswith("```"):
            cleaned = cleaned.split("```")[1]
            if cleaned.startswith("json"):
                cleaned = cleaned[4:]
        skills = json.loads(cleaned)
    except:
        skills = []

    return {"skills": skills, "count": len(skills)}


@app.post("/extract-pdf")
async def extract_pdf(file: UploadFile = File(...)):
    # ─────────────────────────────────────────────
    # PDF TEXT EXTRACTION using pdfplumber
    # pdfplumber is the most reliable Python
    # PDF library — handles complex layouts,
    # tables, and multi-column CVs perfectly
    # We save to a temp file, extract, then delete
    # ─────────────────────────────────────────────

    # Save uploaded file to a temporary location
    with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
        content = await file.read()
        tmp.write(content)
        tmp_path = tmp.name

    try:
        text = ""
        with pdfplumber.open(tmp_path) as pdf:
            # Loop through every page and extract text
            for page in pdf.pages:
                # extract_text() returns None for image pages
                # so we use "or empty string" as fallback
                text += page.extract_text() or ""

        print(f"PDF extracted: {len(text)} characters from {len(pdf.pages)} pages")

        return {"text": text, "pages": len(pdf.pages), "characters": len(text)}

    finally:
        # Always delete temp file — clean up after ourselves
        os.unlink(tmp_path)


# ─────────────────────────────────────────────
# Always keep this at the very bottom
# ─────────────────────────────────────────────
if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
