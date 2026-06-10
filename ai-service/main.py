# ─────────────────────────────────────────────
# This stops the default urllib request from
# conflicting with our requests library
# ─────────────────────────────────────────────
from fastapi import FastAPI, UploadFile, File
from pydantic import BaseModel
from langchain_groq import ChatGroq
from langchain_chroma import Chroma
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.messages import HumanMessage, AIMessage
from langchain_core.output_parsers import StrOutputParser
from langchain_core.documents import Document
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from datetime import datetime, timedelta
import uvicorn
import joblib
import tempfile
import os
import json
import pdfplumber
import requests as http_requests
import csv
import io
import re

# Load all environment variables from .env file
load_dotenv()

# Create the FastAPI application
app = FastAPI(title="Arivo AI Service", version="1.0.0")

# ─────────────────────────────────────────────
# CORS MIDDLEWARE
# Allows React frontend and Node backend to
# send requests to this Python service
# Without this — browser blocks all requests
# ─────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─────────────────────────────────────────────
# LLM SETUP
# Connect to Groq — runs LLaMA 3.3 70B for free
# temperature=0.4 means fairly factual responses
# not too creative, not too robotic
# ─────────────────────────────────────────────
llm = ChatGroq(model="llama-3.3-70b-versatile", temperature=0.4)

# ─────────────────────────────────────────────
# RAG SETUP
# embeddings — converts text to vectors (numbers)
# vectorstore — ChromaDB stores and searches vectors
# retriever — searches ChromaDB for relevant docs
# ─────────────────────────────────────────────
embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
vectorstore = Chroma(persist_directory="./arivo_db", embedding_function=embeddings)
retriever = vectorstore.as_retriever(search_kwargs={"k": 3})

# Stores conversation history per user session
# Key = session_id, Value = list of messages
sessions = {}

# ─────────────────────────────────────────────
# SPONSOR CACHE
# We download the Home Office CSV once per day
# and cache it in memory so we dont download
# 9MB on every single search request
# ─────────────────────────────────────────────
sponsors_cache = None
sponsors_cache_date = None


# ─────────────────────────────────────────────
# LOAD HOME OFFICE SPONSOR LIST
# Downloads the official UK government CSV
# containing 120,000+ registered Tier 2 sponsors
# across every industry — tech, medical, law,
# finance, education, retail, everything
# Caches the result for the whole day
# ─────────────────────────────────────────────
def load_sponsors_quick():
    global sponsors_cache, sponsors_cache_date

    # If we already loaded today — use cached version
    # No need to download 9MB again
    if sponsors_cache and sponsors_cache_date == datetime.now().strftime("%Y-%m-%d"):
        return sponsors_cache

    try:
        print("Loading Home Office sponsor list...")

        # Fetch the GOV.UK page to find the current CSV link
        # The link changes every month so we find it dynamically
        govuk_page = http_requests.get(
            "https://www.gov.uk/government/publications/register-of-licensed-sponsors-workers"
        )

        # Use regex to extract the CSV download URL from the page
        pattern = r'https://assets\.publishing\.service\.gov\.uk/media/[^"]+Worker_and_Temporary_Worker\.csv'
        matches = re.findall(pattern, govuk_page.text)

        if not matches:
            print("Could not find CSV URL")
            return set()

        # Download the CSV file
        csv_response = http_requests.get(matches[0])
        sponsors = set()
        content = csv_response.content.decode("utf-8", errors="ignore")
        reader = csv.DictReader(io.StringIO(content))

        # Extract all company names into a set
        # A set gives us O(1) lookup speed — very fast
        for row in reader:
            org_name = row.get("Organisation Name", "").strip().lower()
            if org_name:
                sponsors.add(org_name)

        # Save to cache with today's date
        sponsors_cache = sponsors
        sponsors_cache_date = datetime.now().strftime("%Y-%m-%d")
        print(f"Loaded {len(sponsors):,} official sponsors")
        return sponsors

    except Exception as e:
        print(f"Sponsor load error: {e}")
        return set()


# ─────────────────────────────────────────────
# CHECK IF COMPANY IS OFFICIAL TIER 2 SPONSOR
# Checks the company name against the real
# Home Office register — not a hardcoded list
# Uses partial matching to handle variations like
# "Revolut Ltd" matching "Revolut"
# ─────────────────────────────────────────────
def is_sponsor(company_name, sponsors_set):
    if not sponsors_set:
        return False

    company_lower = company_name.strip().lower()

    # Direct match first — fastest
    if company_lower in sponsors_set:
        return True

    # Partial match — handles name variations
    for sponsor in sponsors_set:
        if company_lower in sponsor or sponsor in company_lower:
            return True

    return False


# ─────────────────────────────────────────────
# FETCH LIVE JOBS FROM ADZUNA
# Called only when ChromaDB doesnt have enough
# relevant results for the user query
# Fetches real current jobs for ANY role or field
# Checks each job against Home Office data
# ─────────────────────────────────────────────
def fetch_live_jobs(query, max_results=10):
    try:
        app_id = os.getenv("ADZUNA_APP_ID")
        api_key = os.getenv("ADZUNA_API_KEY")

        url = "https://api.adzuna.com/v1/api/jobs/gb/search/1"
        params = {
            "app_id": app_id,
            "app_key": api_key,
            "results_per_page": max_results,
            "what": query,  # the clean job role search term
            "where": "london",  # always London for now
            "content-type": "application/json",
        }

        response = http_requests.get(url, params=params)

        if response.status_code != 200:
            print(f"Adzuna error: {response.status_code}")
            return []

        jobs = response.json().get("results", [])
        documents = []

        # Load sponsor list to verify visa sponsorship
        sponsors = load_sponsors_quick()

        for job in jobs:
            company = job.get("company", {}).get("display_name", "Unknown")
            title = job.get("title", "Unknown")
            location = job.get("location", {}).get("display_name", "London")
            salary_min = job.get("salary_min", 0)
            salary_max = job.get("salary_max", 0)
            description = job.get("description", "")[:300]
            job_url = job.get("redirect_url", "")

            # Check against official Home Office data
            visa_sponsor = is_sponsor(company, sponsors)

            # Format salary range nicely
            if salary_min and salary_max:
                salary = f"£{int(salary_min):,} - £{int(salary_max):,}"
            elif salary_min:
                salary = f"£{int(salary_min):,}+"
            else:
                salary = "Salary not specified"

            # Create a Document for ChromaDB storage
            # page_content is what gets converted to vectors and searched
            # metadata is extra info we store alongside it
            doc = Document(
                page_content=f"{company} | {title} | {location} | {salary} | {'Official Tier 2 Visa Sponsor' if visa_sponsor else 'Sponsorship not confirmed'} | {description}",
                metadata={
                    "company": company,
                    "title": title,
                    "location": location,
                    "salary": salary,
                    "visa_sponsor": visa_sponsor,
                    "url": job_url,
                    "source": "adzuna_live",
                    "fetched_at": datetime.now().strftime("%Y-%m-%d"),
                },
            )
            documents.append(doc)

        print(f"Fetched {len(documents)} live jobs from Adzuna for: {query}")
        return documents

    except Exception as e:
        print(f"Live fetch error: {e}")
        return []


# ─────────────────────────────────────────────
# HYBRID JOB SEARCH — the heart of Arivo AI
# This is what makes Arivo work for every student
# in every field — not just tech students
#
# Step 1 — Search ChromaDB first (fast, free)
# Step 2 — Extract clean job role from user message
# Step 3 — Fetch from Adzuna live if needed
# Step 4 — Store new results for next time
# Step 5 — Return the best results
# ─────────────────────────────────────────────
def hybrid_job_search(query, k=5):

    # Step 1 — Search ChromaDB with SCORES
    # similarity_search_with_score returns (document, score)
    # Lower score = more similar = more relevant
    # Score above 1.0 means the result is not relevant
    results_with_scores = vectorstore.similarity_search_with_score(query, k=k)

    # Only keep results that are actually relevant
    # Score threshold of 1.0 — anything above is irrelevant
    fresh_results = []
    cutoff_date = datetime.now() - timedelta(days=30)

    for doc, score in results_with_scores:
        # Skip irrelevant results — too different from query
        if score > 1.0:
            print(
                f"Skipping irrelevant result (score: {score:.2f}): {doc.metadata.get('title', '')}"
            )
            continue

        # Check job is not expired
        fetched_at = doc.metadata.get("fetched_at", "")
        if fetched_at:
            try:
                job_date = datetime.strptime(fetched_at, "%Y-%m-%d")
                if job_date > cutoff_date:
                    fresh_results.append(doc)
            except:
                fresh_results.append(doc)
        else:
            fresh_results.append(doc)

    print(f"ChromaDB returned {len(fresh_results)} relevant fresh results")

    # Step 2 — If less than 3 RELEVANT results — fetch live
    if len(fresh_results) < 3:
        print(f"Not enough relevant results — fetching live from Adzuna")

        extraction_prompt = f"""Extract just the job role or field from this message.
Return ONLY 1-3 words. Nothing else.

Examples:
"Find me teaching jobs in London" → teacher
"I am a nurse looking for work" → nurse
"ML engineer roles with visa" → machine learning engineer
"Find accounting jobs" → accountant
"I want to work in finance" → finance analyst

Message: {query}
Job role:"""

        clean_query = llm.invoke(extraction_prompt).content.strip()
        print(f"Extracted search term: {clean_query}")

        live_jobs = fetch_live_jobs(clean_query)

        if live_jobs:
            vectorstore.add_documents(live_jobs)
            print(f"Stored {len(live_jobs)} new jobs in ChromaDB")
            fresh_results.extend(live_jobs)

    return fresh_results[:k]


# ─────────────────────────────────────────────
# REQUEST MODELS
# Pydantic models define exactly what data
# each endpoint expects to receive
# FastAPI validates automatically — no extra code
# ─────────────────────────────────────────────
class ChatRequest(BaseModel):
    message: str
    session_id: str = "default"  # default session if not provided


class SkillGapRequest(BaseModel):
    skills: dict  # dictionary of skill name to 0 or 1


class CVRequest(BaseModel):
    cv_text: str  # raw extracted text from CV


# ─────────────────────────────────────────────
# ENDPOINTS
# ─────────────────────────────────────────────


@app.get("/")
def health_check():
    # Simple check to confirm service is running
    return {"status": "Arivo AI Service is running"}


@app.post("/chat")
def chat(request: ChatRequest):
    # Create new session if this session_id is new
    if request.session_id not in sessions:
        sessions[request.session_id] = []

    history = sessions[request.session_id]

    # Step 1 — Hybrid search for relevant jobs
    # ChromaDB first, Adzuna live if needed
    relevant_docs = hybrid_job_search(request.message, k=5)

    # Join all job listings into one context string
    # This gets injected into the prompt for the LLM
    context = "\n".join([doc.page_content for doc in relevant_docs])

    # Step 2 — Build the prompt with real job data
    # The LLM can only answer from what we give it here
    # This prevents hallucination — no making up jobs
    prompt = ChatPromptTemplate.from_messages(
        [
            (
                "system",
                """You are Arivo, an AI career coach helping
students navigate the UK job market.

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

    # Step 3 — Save this exchange to memory
    # Next message will include this conversation history
    history.append(HumanMessage(content=request.message))
    history.append(AIMessage(content=response))

    return {"response": response, "session_id": request.session_id}


@app.post("/skill-gap")
def skill_gap(request: SkillGapRequest):
    # Load the pre-trained ML model from disk
    # We trained this in skill_gap.py — no retraining needed
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
    # Order must match exactly how the model was trained
    vector = [request.skills.get(skill, 0) for skill in SKILLS]

    # Predict readiness score — returns a number 0 to 100
    score = model.predict([vector])[0]

    # Find which skills are missing — value is 0
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
    # We send the entire CV text to Groq
    # Groq reads it like a human recruiter would
    # and identifies every skill regardless of field
    # Works for tech, medical, law, finance, anything
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
        # Remove markdown code blocks if Groq added them
        if cleaned.startswith("```"):
            cleaned = cleaned.split("```")[1]
            if cleaned.startswith("json"):
                cleaned = cleaned[4:]
        skills = json.loads(cleaned)
    except:
        # If JSON parsing fails — return empty list
        skills = []

    return {"skills": skills, "count": len(skills)}


@app.post("/extract-pdf")
async def extract_pdf(file: UploadFile = File(...)):
    # ─────────────────────────────────────────────
    # PDF TEXT EXTRACTION using pdfplumber
    # pdfplumber is the most reliable Python PDF
    # library — handles complex CV layouts perfectly
    # We save to temp file, extract text, then delete
    # ─────────────────────────────────────────────

    # Save uploaded PDF to a temporary file
    # We need a file path for pdfplumber to read
    with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
        content = await file.read()
        tmp.write(content)
        tmp_path = tmp.name

    try:
        text = ""
        with pdfplumber.open(tmp_path) as pdf:
            for page in pdf.pages:
                # extract_text() returns None for image-based pages
                # "or empty string" handles that gracefully
                text += page.extract_text() or ""

        print(f"PDF extracted: {len(text)} characters from {len(pdf.pages)} pages")

        return {"text": text, "pages": len(pdf.pages), "characters": len(text)}

    finally:
        # Always delete temp file — never leave files behind
        os.unlink(tmp_path)


@app.post("/jobs/search")
def search_jobs(request: dict):
    # ─────────────────────────────────────────────
    # DEDICATED JOB SEARCH ENDPOINT
    # Returns structured job data — not a chat response
    # Frontend can display clean job cards from this
    # Uses hybrid search — ChromaDB first, Adzuna live fallback
    # Works for every role in every field
    # ─────────────────────────────────────────────
    query = request.get("query", "")
    if not query:
        return {"jobs": [], "count": 0}

    # Run hybrid search with the query
    docs = hybrid_job_search(query, k=10)

    # Convert documents to structured job objects
    # Frontend can map over these easily
    jobs = []
    for doc in docs:
        jobs.append(
            {
                "company": doc.metadata.get("company", "Unknown"),
                "title": doc.metadata.get("title", "Unknown"),
                "location": doc.metadata.get("location", "London"),
                "salary": doc.metadata.get("salary", "Not specified"),
                "visa_sponsor": doc.metadata.get("visa_sponsor", False),
                "url": doc.metadata.get("url", ""),
                "source": doc.metadata.get("source", "adzuna"),
                "fetched_at": doc.metadata.get("fetched_at", ""),
            }
        )

    # Remove duplicate companies — keep best match only
    seen = set()
    unique_jobs = []
    for job in jobs:
        key = f"{job['company']}-{job['title']}"
        if key not in seen:
            seen.add(key)
            unique_jobs.append(job)

    print(f"Job search for '{query}' returned {len(unique_jobs)} unique results")

    return {"jobs": unique_jobs, "count": len(unique_jobs), "query": query}


# ─────────────────────────────────────────────
# Always keep this at the very bottom
# This only runs when you execute main.py directly
# Not when uvicorn imports it
# ─────────────────────────────────────────────
if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
