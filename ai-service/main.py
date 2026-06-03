from fastapi import FastAPI
from pydantic import BaseModel
from langchain_groq import ChatGroq
from langchain_chroma import Chroma
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.messages import HumanMessage, AIMessage
from langchain_core.output_parsers import StrOutputParser
from dotenv import load_dotenv
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import joblib

load_dotenv()

app = FastAPI(title="Arivo AI Service", version="1.0.0")
# Allow React frontend to talk to FastAPI
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
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
# Request models — define what each endpoint expects
# ─────────────────────────────────────────────
class ChatRequest(BaseModel):
    message: str
    session_id: str = "default"


class SkillGapRequest(BaseModel):
    skills: dict


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


# ─────────────────────────────────────────────
# Always keep this at the very bottom
# ─────────────────────────────────────────────
if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
