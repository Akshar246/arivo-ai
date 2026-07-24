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
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "http://frontend:80",
    ],
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

    if sponsors_cache and sponsors_cache_date == datetime.now().strftime("%Y-%m-%d"):
        return sponsors_cache

    try:
        print("Loading Home Office sponsor list...")

        govuk_page = http_requests.get(
            "https://www.gov.uk/government/publications/register-of-licensed-sponsors-workers"
        )

        # Fixed: the government renamed the CSV to include a
        # "_Web_Register_-_YYYY-MM-DD" suffix. The old regex required
        # the filename to end exactly in "Worker_and_Temporary_Worker.csv",
        # which no longer matches — every load was silently failing and
        # returning an empty sponsor set. This now matches any .csv asset
        # on the page instead of a rigid filename, so future renames
        # don't quietly break this again.
        pattern = r'https://assets\.publishing\.service\.gov\.uk/media/[^"]+\.csv'
        matches = re.findall(pattern, govuk_page.text)

        if not matches:
            print("Could not find CSV URL — keeping previous cache if any")
            return sponsors_cache or set()

        csv_response = http_requests.get(matches[0])
        sponsors = set()
        content = csv_response.content.decode("utf-8", errors="ignore")
        reader = csv.DictReader(io.StringIO(content))

        for row in reader:
            org_name = row.get("Organisation Name", "").strip().lower()
            if org_name:
                sponsors.add(org_name)

        # Sanity check — the real register has 120,000+ entries. If
        # parsing produced far fewer, the column name or format
        # probably changed too. Don't let a broken parse silently
        # replace a good cache with an almost-empty one.
        if len(sponsors) < 10000:
            print(f"Suspiciously low sponsor count ({len(sponsors)}) — keeping previous cache")
            return sponsors_cache or set()

        sponsors_cache = sponsors
        sponsors_cache_date = datetime.now().strftime("%Y-%m-%d")
        print(f"Loaded {len(sponsors):,} official sponsors")
        return sponsors

    except Exception as e:
        print(f"Sponsor load error: {e} — keeping previous cache if any")
        return sponsors_cache or set()


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
def rescue_sponsor_via_reed(title, company, location="london"):
    # ─────────────────────────────────────────────
    # SPONSOR RESCUE VIA REED
    # Called only when Adzuna's display name failed to match the
    # register — e.g. "Trainline" vs the register's "Trainline.com
    # Ltd". Searches Reed for the same role, and if a close match is
    # found, hands back Reed's version of the company name so it can
    # be checked against the register too. Two sources, two chances
    # at the real legal name, before we honestly say "not confirmed."
    # ─────────────────────────────────────────────
    try:
        reed_key = os.getenv("REED_API_KEY")
        if not reed_key:
            return None

        url = "https://www.reed.co.uk/api/1.0/search"
        params = {
            "keywords": title,
            "locationName": location or "london",
            "resultsToTake": 5,
        }
        response = http_requests.get(url, params=params, auth=(reed_key, ""))
        if response.status_code != 200:
            return None

        results = response.json().get("results", [])
        title_low = title.lower()
        for r in results:
            reed_title = (r.get("jobTitle") or "").lower()
            # Loose title match — good enough since this only runs on
            # jobs that already failed the Adzuna-name check, low risk
            # of a false rescue on an unrelated role.
            if title_low[:20] in reed_title or reed_title[:20] in title_low:
                return r.get("employerName", "")
        return None

    except Exception as e:
        print(f"Reed rescue error: {e}")
        return None


def fetch_live_jobs(query, max_results=10, location="london", full_time=None, part_time=None, category=None):
    try:
        app_id = os.getenv("ADZUNA_APP_ID")
        api_key = os.getenv("ADZUNA_API_KEY")

        url = "https://api.adzuna.com/v1/api/jobs/gb/search/1"
        params = {
            "app_id": app_id,
            "app_key": api_key,
            "results_per_page": max_results,
            "what": query,
            "where": location or "london",
            "content-type": "application/json",
        }
        if full_time:
            params["full_time"] = 1
        if part_time:
            params["part_time"] = 1
        if category:
            params["category"] = category

        response = http_requests.get(url, params=params)

        if response.status_code != 200:
            print(f"Adzuna error: {response.status_code}")
            return []

        jobs = response.json().get("results", [])
        documents = []

        sponsors = load_sponsors_quick()

        for job in jobs:
            company = job.get("company", {}).get("display_name", "Unknown")
            title = job.get("title", "Unknown")
            job_location = job.get("location", {}).get("display_name", location or "London")
            salary_min = job.get("salary_min", 0)
            salary_max = job.get("salary_max", 0)
            raw_desc = job.get("description", "") or ""
            raw_desc = raw_desc.strip()
            if raw_desc.lower().startswith("description"):
                raw_desc = raw_desc[len("description"):].lstrip(" :–-")
            description = raw_desc[:300]
            if len(raw_desc) > 300:
                description = description.rsplit(" ", 1)[0].rstrip(".,;: ") + "…"
            job_url = job.get("redirect_url", "")

            created = job.get("created", "")
            contract_time = job.get("contract_time", "")
            contract_type = job.get("contract_type", "")

            # Check against official Home Office data — try Adzuna's
            # name first, and if that fails, give Reed's name a shot
            # too before honestly calling it unconfirmed.
            visa_sponsor = is_sponsor(company, sponsors)
            sponsor_verified_via = "adzuna" if visa_sponsor else None

            if not visa_sponsor:
                reed_company = rescue_sponsor_via_reed(title, company, location)
                if reed_company and is_sponsor(reed_company, sponsors):
                    visa_sponsor = True
                    sponsor_verified_via = "reed_name_variant"

            if salary_min and salary_max:
                salary = f"£{int(salary_min):,} - £{int(salary_max):,}"
            elif salary_min:
                salary = f"£{int(salary_min):,}+"
            else:
                salary = "Salary not specified"

            blob = f"{title} {description}".lower()
            if "hybrid" in blob:
                work_mode = "hybrid"
            elif "remote" in blob or "work from home" in blob or "wfh" in blob:
                work_mode = "remote"
            else:
                work_mode = "onsite"

            doc = Document(
                page_content=f"{company} | {title} | {job_location} | {salary} | {'Official Tier 2 Visa Sponsor' if visa_sponsor else 'Sponsorship not confirmed'} | {description}",
                metadata={
                    "company": company,
                    "title": title,
                    "location": job_location,
                    "salary": salary,
                    "visa_sponsor": visa_sponsor,
                    "sponsor_verified_via": sponsor_verified_via,
                    "url": job_url,
                    "source": "adzuna_live",
                    "fetched_at": datetime.now().strftime("%Y-%m-%d"),
                    "description": description,
                    "created": created,
                    "contract_time": contract_time,
                    "contract_type": contract_type,
                    "work_mode": work_mode,
                },
            )
            documents.append(doc)

        print(f"Fetched {len(documents)} live jobs from Adzuna for: {query} (location={location})")
        return documents

    except Exception as e:
        print(f"Live fetch error: {e}")
        return []
    
def fetch_reed_jobs(query, max_results=6, location="london"):
    # ─────────────────────────────────────────────
    # SECOND LIVE SOURCE FOR SEARCH RESULTS — not just sponsor
    # rescue. Adzuna is an aggregator and doesn't carry everything;
    # blending in Reed's own listings means more real nursing,
    # teaching, and finance roles show up, not just more tech.
    # Duplicate postings across both sources get collapsed by the
    # existing company+title dedup in /jobs/search — no new logic
    # needed there.
    # ─────────────────────────────────────────────
    try:
        reed_key = os.getenv("REED_API_KEY")
        if not reed_key:
            return []

        url = "https://www.reed.co.uk/api/1.0/search"
        params = {
            "keywords": query,
            "locationName": location or "london",
            "resultsToTake": max_results,
        }
        response = http_requests.get(url, params=params, auth=(reed_key, ""))
        if response.status_code != 200:
            print(f"Reed error: {response.status_code}")
            return []

        results = response.json().get("results", [])
        sponsors = load_sponsors_quick()
        documents = []

        for job in results:
            company = job.get("employerName", "Unknown")
            title = job.get("jobTitle", "Unknown")
            job_location = job.get("locationName", location or "London")
            salary_min = job.get("minimumSalary")
            salary_max = job.get("maximumSalary")
            description = (job.get("jobDescription") or "")[:300]
            job_url = job.get("jobUrl", "")
            created = job.get("date", "")

            visa_sponsor = is_sponsor(company, sponsors)

            if salary_min and salary_max:
                salary = f"£{int(salary_min):,} - £{int(salary_max):,}"
            elif salary_min:
                salary = f"£{int(salary_min):,}+"
            else:
                salary = "Salary not specified"

            blob = f"{title} {description}".lower()
            if "hybrid" in blob:
                work_mode = "hybrid"
            elif "remote" in blob or "work from home" in blob or "wfh" in blob:
                work_mode = "remote"
            else:
                work_mode = "onsite"

            doc = Document(
                page_content=f"{company} | {title} | {job_location} | {salary} | {'Official Tier 2 Visa Sponsor' if visa_sponsor else 'Sponsorship not confirmed'} | {description}",
                metadata={
                    "company": company,
                    "title": title,
                    "location": job_location,
                    "salary": salary,
                    "visa_sponsor": visa_sponsor,
                    "sponsor_verified_via": "adzuna" if visa_sponsor else None,
                    "url": job_url,
                    "source": "reed_live",
                    "fetched_at": datetime.now().strftime("%Y-%m-%d"),
                    "description": description,
                    "created": created,
                    "contract_time": "",
                    "contract_type": "",
                    "work_mode": work_mode,
                },
            )
            documents.append(doc)

        print(f"Fetched {len(documents)} live jobs from Reed for: {query}")
        return documents

    except Exception as e:
        print(f"Reed fetch error: {e}")
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

def hybrid_job_search(query, k=5, location="london", full_time=None, part_time=None, category=None):

    # Step 1 — Search ChromaDB with SCORES
    results_with_scores = vectorstore.similarity_search_with_score(query, k=k)

    fresh_results = []
    cutoff_date = datetime.now() - timedelta(days=30)

    for doc, score in results_with_scores:
        if score > 1.0:
            print(
                f"Skipping irrelevant result (score: {score:.2f}): {doc.metadata.get('title', '')}"
            )
            continue

        if not doc.metadata.get("company"):
            continue

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

    # Step 2 — If less than 3 RELEVANT results — fetch live, from BOTH
    # Adzuna and Reed, not just Adzuna. Wider net, more fields covered.
    if len(fresh_results) < 3:
        print(f"Not enough relevant results — fetching live from Adzuna + Reed")

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

        adzuna_jobs = fetch_live_jobs(
            clean_query,
            location=location,
            full_time=full_time,
            part_time=part_time,
            category=category,
        )
        reed_jobs = fetch_reed_jobs(clean_query, max_results=6, location=location)

        live_jobs = adzuna_jobs + reed_jobs

        if live_jobs:
            vectorstore.add_documents(live_jobs)
            print(f"Stored {len(live_jobs)} new jobs in ChromaDB ({len(adzuna_jobs)} Adzuna, {len(reed_jobs)} Reed)")
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
    mode: str = "general" 


class SkillGapRequest(BaseModel):
    skills: dict  # dictionary of skill name to 0 or 1


class CVRequest(BaseModel):
    cv_text: str  # raw extracted text from CV


class SkillGapAnalyseRequest(BaseModel):
    user_skills: list  # skills from CV or manually entered
    target_role: str  # e.g. "ML Engineer", "Teacher", "Nurse"
    visa_only: bool = False  # focus only on Tier 2 sponsor jobs


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

    # Dynamic Prompts based on User Module Selection
    system_prompts = {
        "general": """You are Arivo, an elite AI career coach for international students in the UK. 
Use the provided job listings to answer. Do not make up jobs. Be direct, confident, and highly strategic.""",
        
        "localizer": """You are a top-tier UK tech recruiter and 'Prestige Translator'. 
The user is providing their home-country experience. 
Your job: 
1. Translate the prestige of their foreign companies to UK equivalents (e.g., if they say HDFC Bank, say "That is India's largest private bank, equivalent to Barclays UK"). 
2. Rewrite their bullet points to be quantifiable, highly confident, and culturally aligned with London's corporate scene. Remove all passive/deferential language.""",
        
        "visa": """You are a ruthless but highly strategic UK Immigration Advisor. 
Look at the SYSTEM ALERTS in the context below regarding the company's sponsor status. 
If they ARE a sponsor: Give the user a confident, non-desperate script on exactly when and how to ask for the Skilled Worker Visa (e.g., wait until the end of the HR screen). 
If they ARE NOT a sponsor: Tell them bluntly NOT to waste their time interviewing. Do not give generic advice. Give tactical, script-based advice.""",
        
        "interview": """You are a strict hiring manager at a top UK company. The user wants to practice an interview. 
Ask them ONE tough technical or behavioral question based on their message. Wait for them to answer. 
Grade their answer out of 10 based on the STAR method, give a quick blunt critique, and ask the next question.""",
        
        "tone": """You are an expert in UK Corporate Culture and Communications. 
The user will provide an email, cover letter, or interview answer. 
Analyze it for: 1) Overly deferential/subservient language ("Respected Sir", "Kindly", "Do the needful"). 2) Passive voice. 3) Lack of directness. 
Rewrite the text to be polite, confident, and direct—the standard for the UK market. Explain exactly what you changed and why."""
    }

    selected_prompt = system_prompts.get(request.mode, system_prompts["general"])
    context_data = ""

    # THE VISA INTERCEPTOR: Automatically check the DB if using the Visa mode
    if request.mode == "visa":
        extract_prompt = f"""Extract ALL company names the user is asking about in this message.
Return ONLY a valid JSON list of strings. If no companies are mentioned, return an empty list [].
Do not include any other text.
Message: {request.message}"""
        
        try:
            raw_companies = llm.invoke(extract_prompt).content.strip()
            if raw_companies.startswith("```"):
                raw_companies = raw_companies.split("```")[1]
                if raw_companies.startswith("json"):
                    raw_companies = raw_companies[4:]
            
            companies = json.loads(raw_companies)
            
            if companies and len(companies) > 0:
                sponsors = load_sponsors_quick()
                alerts = []
                for comp in companies:
                    is_sponsored = is_sponsor(comp, sponsors)
                    if is_sponsored:
                        alerts.append(f"- '{comp}' IS AN ACTIVE A-RATED SPONSOR. Tell the user this is confirmed.")
                    else:
                        alerts.append(f"- '{comp}' IS NOT ON THE SPONSOR REGISTER. Warn the user heavily.")
                
                context_data = "\n\nSYSTEM ALERTS FROM HOME OFFICE DB:\n" + "\n".join(alerts)
        except Exception as e:
            print(f"Visa extraction error: {e}")
            pass # Fallback to standard prompt if extraction fails

    # Standard job fallback for general mode
    elif request.mode == "general":
        relevant_docs = hybrid_job_search(request.message, k=5)
        context_data = "\n\nReal UK Job Listings Context:\n" + "\n".join([doc.page_content for doc in relevant_docs])

    final_system_prompt = selected_prompt + context_data

    prompt = ChatPromptTemplate.from_messages([
        ("system", final_system_prompt),
        MessagesPlaceholder(variable_name="history"),
        ("human", "{input}"),
    ])

    chain = prompt | llm | StrOutputParser()

    response = chain.invoke(
        {"history": history, "input": request.message}
    )

    # Save this exchange to memory
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


# ─────────────────────────────────────────────
# ATS READINESS ANALYSER
# Honest checks for what ATS systems + recruiters
# actually look at. Most checks are pure Python
# (fast, free, deterministic). Only the judgment
# check (action verbs) uses Groq.
# ─────────────────────────────────────────────
class ATSRequest(BaseModel):
    cv_text: str
    job_description: str


# ── CHECK 1: Parse-ability ───────────────────
# WHY: If pdfplumber pulled almost no text, the CV is
# likely a scanned image or graphic-heavy. ATS reads
# TEXT, not pictures. No text = invisible to ATS.
def check_parseability(cv):
    chars = len(cv.strip())
    if chars > 600:
        return 20, "pass", "Your CV is text-based and fully readable by ATS."
    elif chars > 200:
        return 13, "warn", "Readable, but quite short. Make sure all content is selectable text, not images."
    else:
        return 4, "fail", "Very little readable text found. If your CV is a scanned image, ATS cannot read it — export it as a text-based PDF."


# ── CHECK 2: Standard sections ───────────────
# WHY: ATS looks for labelled sections to sort your
# info into its database. Missing headers = data lost.
def check_sections(cv):
    low = cv.lower()
    wanted = {
        "experience": ["experience", "employment", "work history"],
        "education": ["education", "academic", "qualifications"],
        "skills": ["skills", "technical skills", "competencies"],
    }
    found = []
    missing = []
    for name, variants in wanted.items():
        if any(v in low for v in variants):
            found.append(name)
        else:
            missing.append(name)
    score = round((len(found) / len(wanted)) * 15)
    if not missing:
        return score, "pass", "All key sections found: Experience, Education, Skills."
    return score, "warn", f"Missing clearly-labelled section(s): {', '.join(missing)}. Add plain headers so ATS can sort your info."


# ── CHECK 3: Contact info ────────────────────
# WHY: If ATS can't find your email/phone, a recruiter
# literally cannot contact you even if you're shortlisted.
def check_contact(cv):
    email = re.search(r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}", cv)
    phone = re.search(r"(\+?\d[\d\s().-]{7,}\d)", cv)
    linkedin = "linkedin.com" in cv.lower()

    score = 0
    notes = []
    if email: score += 5
    else: notes.append("no email")
    if phone: score += 3
    else: notes.append("no phone number")
    if linkedin: score += 2
    else: notes.append("no LinkedIn")

    if score == 10:
        return 10, "pass", "Email, phone and LinkedIn all detected."
    return score, "warn" if score >= 5 else "fail", f"Contact gaps: {', '.join(notes)}. Add these at the top in plain text."


# ── CHECK 4: Keyword match vs the job (Groq-powered) ──
# WHY: A dumb word-grab treats "passionate" and "responsibilities"
# as keywords — unfair scores, junk suggestions. Instead we ask
# Groq to pull the REAL skills/tools/requirements from the job
# (same trick as skill-gap), then match those against the CV.
# Result: fair score + genuinely useful missing-keyword list.
def check_keywords(cv, jd):
    cv_low = cv.lower()

    # Ask Groq for the real, concrete keywords a recruiter/ATS wants
    prompt = f"""Extract the concrete skills, tools, technologies, and hard
requirements from this job description. Only real, specific terms a recruiter
would search for (e.g. "Python", "AWS", "stakeholder management", "Agile").
NO generic filler ("passionate", "team player", "responsibilities", "looking").

Return ONLY a JSON array of 8-15 lowercase strings. No explanation.

Job description:
{jd[:2500]}"""

    keywords = []
    try:
        raw = llm.invoke(prompt).content.strip()
        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
        keywords = [k.lower().strip() for k in json.loads(raw) if k.strip()]
    except:
        keywords = []

    # Fallback: if Groq fails, use a light regex grab (still works)
    if not keywords:
        stop = {"and","the","for","with","you","are","our","this","that","will",
                "have","your","from","they","their","what","who","all","any","can",
                "able","role","work","team","job","etc","need","want","experience",
                "skills","looking","strong","good","essential"}
        raw = re.findall(r"[a-zA-Z][a-zA-Z+#]{3,}", jd.lower())
        keywords = sorted(set(w for w in raw if w not in stop))[:15]

    if not keywords:
        return 20, "pass", "No specific keywords to match.", []

    # Step 1 — cheap exact/substring match. Still correct for concrete
    # named tools — "python" either appears or it doesn't, no need to
    # spend an LLM call on that.
    present = [k for k in keywords if k in cv_low]
    missing_raw = [k for k in keywords if k not in cv_low]

    # Step 2 — semantic rescue, ONLY on what exact-matching missed.
    # A CV saying "managed 5 direct reports" genuinely satisfies a JD
    # asking for "led a team" — that's the same experience in different
    # words, not a real gap. Exact-string matching alone would wrongly
    # penalise a well-written CV for phrasing, which this app refuses
    # to do. Runs on the leftover set only, so most keywords still
    # resolve instantly via the cheap check above.
    missing = missing_raw
    if missing_raw:
        rescue_prompt = f"""A candidate's CV is being checked against a list of
job requirements. Some requirements didn't appear as exact text in the CV,
but the CV might express the same skill or responsibility in different words.

For each requirement below, check the CV text and decide: does the CV
genuinely demonstrate this, just phrased differently? Only say yes if it's
a real match in substance, not a stretch. Being strict matters — this app
never inflates a score.

Requirements to check: {json.dumps(missing_raw)}

CV text:
{cv[:3000]}

Return ONLY a JSON object mapping each requirement (exact string from the
list) to true or false. Example: {{"led a team": true, "kubernetes": false}}
No explanation, just the JSON object."""

        try:
            raw = llm.invoke(rescue_prompt).content.strip()
            if raw.startswith("```"):
                raw = raw.split("```")[1]
                if raw.startswith("json"):
                    raw = raw[4:]
            verdicts = json.loads(raw)
            missing = [k for k in missing_raw if not verdicts.get(k, False)]
            present = present + [k for k in missing_raw if verdicts.get(k, False)]
        except:
            # Rescue call failed for any reason — fall back to the exact
            # match result rather than guessing. Never silently invent a pass.
            missing = missing_raw

    match_ratio = len(present) / len(keywords)
    score = round(match_ratio * 20)

    if match_ratio >= 0.75:
        status = "pass"
        msg = f"Strong match — {len(present)} of {len(keywords)} requirements found, including skills expressed in different words."
    elif match_ratio >= 0.45:
        status = "warn"
        msg = f"Partial match — {len(present)} of {len(keywords)} requirements found. Real gaps below, not just phrasing."
    else:
        status = "fail"
        msg = f"Weak match — only {len(present)} of {len(keywords)} requirements found. Worth reviewing whether this role is the right target."

    return score, status, msg, missing


# ── CHECK 5: Formatting red flags ────────────
# WHY: ATS reads top-to-bottom, left-to-right. Tables
# and columns scramble that order. We can't see the PDF
# layout here, but weird spacing patterns in the
# extracted text hint at columns/tables.
def check_formatting(cv):
    issues = []
    # Many lines with big internal gaps = likely columns/tables
    lines = cv.split("\n")
    gappy = sum(1 for l in lines if re.search(r"\S {4,}\S", l))
    if gappy > len(lines) * 0.15 and len(lines) > 10:
        issues.append("possible multi-column or table layout (ATS may scramble this)")
    # Tabs often mean tables
    if cv.count("\t") > 5:
        issues.append("tab characters suggest a table — flatten into single-column text")

    if not issues:
        return 20, "pass", "No obvious formatting red flags. Looks like clean single-column text."
    score = 20 - (len(issues) * 6)
    return max(score, 5), "warn", "Formatting risks: " + "; ".join(issues) + "."


# ── CHECK 6: Action verbs + quantification (Groq) ──
# WHY: This needs JUDGMENT, not pattern-matching.
# Recruiters reward "Led a team of 5, cutting costs 20%"
# over "responsible for things". Only an LLM can judge this well.
def check_action_verbs(cv):
    prompt = f"""You are a CV reviewer. Look at this CV text and judge ONLY the
bullet points / experience descriptions.

Return ONLY valid JSON:
{{
  "score": <0-15 integer>,
  "status": "pass" | "warn" | "fail",
  "message": "<one short sentence of feedback>",
  "weak_examples": ["<up to 2 weak phrases found, or empty>"]
}}

Scoring guide:
- 12-15: strong action verbs AND quantified results (numbers, %, scale)
- 7-11: decent verbs but little quantification
- 0-6: passive/weak language ("responsible for", "duties included")

CV text:
{cv[:2500]}"""
    try:
        raw = llm.invoke(prompt).content.strip()
        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
        data = json.loads(raw)
        return (int(data.get("score", 7)), data.get("status", "warn"),
                data.get("message", ""), data.get("weak_examples", []))
    except:
        return 7, "warn", "Could not fully analyse phrasing — aim for strong verbs and numbers.", []

# ── INTERNATIONAL STUDENT LENS (the hero feature) ──
# WHY: International students often format CVs to home-country
# norms — photo, DOB, nationality, marital status, "CV" title.
# These are NORMAL abroad but in the UK they: (1) break some ATS
# parsers, (2) trigger anti-discrimination filters (UK recruiters
# are trained to discard CVs with photos/personal data), and
# (3) signal "not familiar with UK norms". Nobody tells students
# this. We catch it automatically. This is Arivo's signature.
def check_international_lens(cv):
    low = cv.lower()
    flags = []

    # Date of birth / age
    if re.search(r"\b(date of birth|d\.?o\.?b\.?|born on)\b", low) or \
       re.search(r"\b(age)\s*[:\-]?\s*\d{1,2}\b", low):
        flags.append({
            "issue": "Date of birth / age detected",
            "why": "UK CVs never include age or DOB. Recruiters must avoid age data by law — many discard CVs that show it.",
            "fix": "Delete your date of birth and age completely."
        })

    # Nationality / visa status line
    if re.search(r"\b(nationality|citizenship|passport|visa status)\b", low):
        flags.append({
            "issue": "Nationality / passport details detected",
            "why": "UK CVs omit nationality. You only state 'Eligible to work in the UK' if relevant — never passport or citizenship details.",
            "fix": "Remove nationality and passport lines. If needed, add one line: 'Eligible to work in the UK with Skilled Worker sponsorship.'"
        })

    # Marital status / gender / religion
    if re.search(r"\b(marital status|married|single|divorced|gender|sex|religion)\b", low):
        flags.append({
            "issue": "Personal details (marital status / gender / religion)",
            "why": "These are illegal for UK employers to consider. CVs that include them look unprofessional and risk being discarded.",
            "fix": "Delete marital status, gender, and religion entirely."
        })

    # "Curriculum Vitae" as a title header
    if re.search(r"\bcurriculum vitae\b", low):
        flags.append({
            "issue": "'Curriculum Vitae' used as a title",
            "why": "UK CVs don't put 'Curriculum Vitae' or 'Resume' as a heading. The page should start with your name.",
            "fix": "Replace the 'Curriculum Vitae' header with just your full name."
        })

    # Photo (we can't see images, but these words hint at one)
    if re.search(r"\b(photo|photograph|passport size|passport-size)\b", low):
        flags.append({
            "issue": "A photo may be included",
            "why": "UK CVs never include a photo. Many recruiters auto-reject CVs with photos to avoid bias claims.",
            "fix": "Remove any photo from your CV."
        })

    # Full home address (line with postal patterns common abroad)
    if re.search(r"\b(father'?s name|mother'?s name|parent'?s name)\b", low):
        flags.append({
            "issue": "Parent / family details detected",
            "why": "Common on CVs in some countries, but never used in the UK and seen as unprofessional here.",
            "fix": "Remove all family/parent details."
        })

    # Build the verdict
    if not flags:
        return {
            "status": "clear",
            "headline": "No home-country CV conventions detected — your CV follows UK norms.",
            "flags": []
        }
    return {
        "status": "flags_found",
        "headline": f"Found {len(flags)} thing(s) that are normal abroad but hurt you in the UK market.",
        "flags": flags
    }

def generate_recruiter_notes(cv, jd, overall_score, missing_keywords, weak_bullets):
    # ─────────────────────────────────────────────
    # THE RECRUITER'S SIMULATED NOTES
    # Blunt, realistic first-scan impressions, grounded only in
    # legitimate resume-craft signals: dates/gaps, how clearly scale
    # and impact are quantified, generic vs specific phrasing, and how
    # directly the CV maps to the actual role. Explicitly never touches
    # anything protected-characteristic-adjacent — that's not what a
    # recruiter is legally or ethically evaluating, and it's not what
    # this feature is for.
    # ─────────────────────────────────────────────
    prompt = f"""You are a blunt, experienced tech recruiter who has screened
thousands of CVs. Write quick, honest internal notes after a 20-second scan
of this CV against a specific job — the kind of notes a recruiter jots to
themselves, not a polished summary for the candidate.

Base your notes ONLY on legitimate resume-craft signals: employment date
gaps or frequent short stints (perceived job-hopping), how clearly scale
and impact are quantified ("led a team" vs "led a team of 12, cut delivery
time 30%"), whether bullets read as generic/boilerplate vs specific, and
how directly the CV's experience maps to what this role actually asks for.

Never comment on name, age, gender, ethnicity, nationality, accent, photo,
or any protected characteristic — only on the craft and content of the
document itself, exactly how a professional recruiter should evaluate it.

Write 3-5 sentences, first-person, as if thinking out loud. Be direct,
including real criticism if warranted, but not needlessly harsh.

CV:
{cv[:2500]}

Job description:
{jd[:1500]}

Current ATS score: {overall_score}/100
Missing requirements: {", ".join(missing_keywords[:5]) if missing_keywords else "none major"}
"""
    try:
        return llm.invoke(prompt).content.strip()
    except Exception as e:
        print(f"Recruiter notes error: {e}")
        return "Couldn't generate recruiter notes this time — try analysing again."

@app.post("/ats/analyse")
def ats_analyse(request: ATSRequest):
    cv = request.cv_text
    jd = request.job_description

    # Run all six scored checks
    p_score, p_status, p_msg = check_parseability(cv)
    s_score, s_status, s_msg = check_sections(cv)
    c_score, c_status, c_msg = check_contact(cv)
    k_score, k_status, k_msg, missing_keywords = check_keywords(cv, jd)
    f_score, f_status, f_msg = check_formatting(cv)
    v_score, v_status, v_msg, weak_bullets = check_action_verbs(cv)

    # Run the International Student Lens (separate hero — not scored)
    international_lens = check_international_lens(cv)

    categories = [
        {"name": "Parse-ability", "score": p_score, "max": 20, "status": p_status, "detail": p_msg},
        {"name": "Keyword Match", "score": k_score, "max": 20, "status": k_status, "detail": k_msg},
        {"name": "Standard Sections", "score": s_score, "max": 15, "status": s_status, "detail": s_msg},
        {"name": "Contact Info", "score": c_score, "max": 10, "status": c_status, "detail": c_msg},
        {"name": "Formatting", "score": f_score, "max": 20, "status": f_status, "detail": f_msg},
        {"name": "Action Verbs", "score": v_score, "max": 15, "status": v_status, "detail": v_msg},
    ]

    overall = sum(c["score"] for c in categories)

    recruiter_notes = generate_recruiter_notes(cv, jd, overall, missing_keywords, weak_bullets)

    return {
        "overall_score": overall,
        "categories": categories,
        "missing_keywords": missing_keywords,
        "weak_bullets": weak_bullets,
        "international_lens": international_lens,
        "recruiter_notes": recruiter_notes,
    }


@app.get("/jobs/categories")
def get_job_categories():
    # ─────────────────────────────────────────────
    # Returns Adzuna's real, current category list so
    # the frontend Industry dropdown always matches valid
    # values — never a hardcoded guess that can silently
    # go stale and return zero results with no error.
    # ─────────────────────────────────────────────
    try:
        app_id = os.getenv("ADZUNA_APP_ID")
        api_key = os.getenv("ADZUNA_API_KEY")
        url = "https://api.adzuna.com/v1/api/jobs/gb/categories"
        params = {
            "app_id": app_id,
            "app_key": api_key,
            "content-type": "application/json",
        }
        response = http_requests.get(url, params=params)
        if response.status_code != 200:
            return {"categories": []}
        raw = response.json().get("results", [])
        categories = [
            {"tag": c.get("tag", ""), "label": c.get("label", "")}
            for c in raw
            if c.get("tag")
        ]
        return {"categories": categories}
    except Exception as e:
        print(f"Categories fetch error: {e}")
        return {"categories": []}


@app.post("/jobs/search")
def search_jobs(request: dict):
    # ─────────────────────────────────────────────
    # DEDICATED JOB SEARCH ENDPOINT
    # Returns structured job data — not a chat response
    # Frontend can display clean job cards from this
    # Uses hybrid search — ChromaDB first, Adzuna live fallback
    # Works for every role in every field
    # Supports location, industry, employment type, and an
    # inferred remote/hybrid/on-site filter
    # ─────────────────────────────────────────────
    query = request.get("query", "")
    if not query:
        return {"jobs": [], "count": 0}

    location = request.get("location") or "london"
    full_time = request.get("full_time")
    part_time = request.get("part_time")
    category = request.get("category") or None
    work_mode = request.get("work_mode") or None  # "remote" | "hybrid" | "onsite"

    # Run hybrid search with the query and filters
    docs = hybrid_job_search(
        query,
        k=10,
        location=location,
        full_time=full_time,
        part_time=part_time,
        category=category,
    )

    # Convert documents to structured job objects
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
                "description": doc.metadata.get("description", ""),
                "created": doc.metadata.get("created", ""),
                "contract_time": doc.metadata.get("contract_time", ""),
                "contract_type": doc.metadata.get("contract_type", ""),
                # Older cached docs won't have this — defaults to
                # "onsite" rather than crashing or showing blank.
                "work_mode": doc.metadata.get("work_mode", "onsite"),
                "sponsor_verified_via": doc.metadata.get("sponsor_verified_via"),
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

    # Post-filter by inferred work mode. Applied here rather than sent
    # to Adzuna, since Adzuna has no native remote/hybrid field.
    if work_mode in ("remote", "hybrid", "onsite"):
        unique_jobs = [j for j in unique_jobs if j.get("work_mode") == work_mode]

    print(f"Job search for '{query}' returned {len(unique_jobs)} unique results")

    return {"jobs": unique_jobs, "count": len(unique_jobs), "query": query}

class RecheckRequest(BaseModel):
    title: str
    company: str
    location: str = "london"


@app.post("/jobs/recheck")
def recheck_job(request: RecheckRequest):
    # ─────────────────────────────────────────────
    # LIVE RECHECK — upgrades the staleness warning from a guess
    # (based on how long ago it was fetched) to real evidence
    # (checked against Adzuna and Reed right now, this moment).
    # ─────────────────────────────────────────────
    title = request.title
    company = request.company
    location = request.location or "london"
    company_low = company.lower()

    found_adzuna = False
    try:
        app_id = os.getenv("ADZUNA_APP_ID")
        api_key = os.getenv("ADZUNA_API_KEY")
        url = "https://api.adzuna.com/v1/api/jobs/gb/search/1"
        params = {
            "app_id": app_id,
            "app_key": api_key,
            "results_per_page": 10,
            "what": title,
            "where": location,
            "content-type": "application/json",
        }
        resp = http_requests.get(url, params=params)
        if resp.status_code == 200:
            for r in resp.json().get("results", []):
                r_company = r.get("company", {}).get("display_name", "").lower()
                if company_low in r_company or r_company in company_low:
                    found_adzuna = True
                    break
    except Exception as e:
        print(f"Recheck Adzuna error: {e}")

    found_reed = False
    try:
        reed_key = os.getenv("REED_API_KEY")
        if reed_key:
            url = "https://www.reed.co.uk/api/1.0/search"
            params = {"keywords": title, "locationName": location, "resultsToTake": 10}
            resp = http_requests.get(url, params=params, auth=(reed_key, ""))
            if resp.status_code == 200:
                for r in resp.json().get("results", []):
                    r_company = (r.get("employerName") or "").lower()
                    if company_low in r_company or r_company in company_low:
                        found_reed = True
                        break
    except Exception as e:
        print(f"Recheck Reed error: {e}")

    still_live = found_adzuna or found_reed
    sources = [s for s, ok in [("Adzuna", found_adzuna), ("Reed", found_reed)] if ok]

    if still_live:
        message = f"Still listed on {' and '.join(sources)} as of right now."
    else:
        message = "No longer found on Adzuna or Reed — this role has likely been filled or removed."

    return {
        "still_live": still_live,
        "found_adzuna": found_adzuna,
        "found_reed": found_reed,
        "message": message,
    }


@app.post("/skill-gap/analyse")
def analyse_skill_gap(request: SkillGapAnalyseRequest):
    # ─────────────────────────────────────────────
    # SMART SKILL GAP ANALYSER
    # Works for every role in every field
    # Not hardcoded — uses real job data from our DB
    #
    # Step 1 — Search real job listings for target role
    # Step 2 — Extract required skills from those jobs
    # Step 3 — Compare with user's actual skills
    # Step 4 — Return rich gap report with resources
    # ─────────────────────────────────────────────

    user_skills_lower = [s.lower() for s in request.user_skills]
    target_role = request.target_role

    # Step 1 — Get real job listings for this role
    # Uses hybrid search — ChromaDB first, Adzuna live fallback
    print(f"Analysing skill gap for: {target_role}")
    job_docs = hybrid_job_search(target_role, k=10)

    # Filter for visa sponsors only if requested
    if request.visa_only:
        job_docs = [d for d in job_docs if d.metadata.get("visa_sponsor", False)]
        print(f"Filtered to {len(job_docs)} visa sponsor jobs")

    if not job_docs:
        return {
            "error": "No job listings found for this role",
            "target_role": target_role,
        }

    # Step 2 — Ask Groq to extract required skills
    # Combines real job data WITH Groq's knowledge
    # for a comprehensive and specific skill list
    job_context = "\n".join([doc.page_content for doc in job_docs])

    extraction_prompt = f"""You are an expert UK career analyst with deep knowledge of the London job market.

Analyse these real job listings for {target_role} in London:
{job_context}

Combined with your knowledge of what {target_role} roles in London require in 2026,
provide a comprehensive skill analysis.

Return a JSON object with exactly this structure:
{{
    "required_skills": ["skill1", "skill2", ...],
    "nice_to_have": ["skill1", "skill2", ...],
    "total_jobs_analysed": {len(job_docs)}
}}

Rules:
- required_skills: 8-12 specific, concrete skills (e.g. "Python", "PyTorch", "SQL" not "engineering")
- nice_to_have: 4-6 additional skills that give an edge
- Be specific — write exact skill names not generic categories
- Focus on skills a hiring manager would actually look for
- Include both technical AND soft skills

Return ONLY the JSON. No explanation. No markdown."""

    response = llm.invoke(extraction_prompt).content.strip()

    # Parse the JSON response from Groq
    try:
        if response.startswith("```"):
            response = response.split("```")[1]
            if response.startswith("json"):
                response = response[4:]
        market_data = json.loads(response)
    except:
        market_data = {
            "required_skills": [],
            "nice_to_have": [],
            "total_jobs_analysed": len(job_docs),
        }

    required_skills = [s.lower() for s in market_data.get("required_skills", [])]
    nice_to_have = [s.lower() for s in market_data.get("nice_to_have", [])]

    # Step 3 — Compare user skills with market requirements
    # Uses fuzzy matching — "PyTorch" matches "pytorch"
    # "machine learning" matches "ML" etc
    matching_skills = []
    missing_required = []
    missing_nice = []

    for skill in required_skills:
        # Check if user has this skill — partial match
        has_skill = any(
            skill in user_skill.lower() or user_skill.lower() in skill
            for user_skill in request.user_skills
        )
        if has_skill:
            matching_skills.append(skill)
        else:
            missing_required.append(skill)

    for skill in nice_to_have:
        has_skill = any(
            skill in user_skill.lower() or user_skill.lower() in skill
            for user_skill in request.user_skills
        )
        if not has_skill:
            missing_nice.append(skill)

    # Step 4 — Calculate readiness score
    # Percentage of required skills the user already has
    if required_skills:
        score = round((len(matching_skills) / len(required_skills)) * 100)
    else:
        score = 50

    # Step 5 — Generate free learning resources
    # Only for top 5 missing required skills
    resources = {}
    if missing_required:
        resource_prompt = f"""For each of these skills needed for {target_role} in London,
suggest ONE completely free learning resource.

Skills: {", ".join(missing_required[:5])}

Return a JSON object where each key is the skill name and value has:
{{
    "resource": "name of free course or resource",
    "url": "actual working URL",
    "time": "estimated weeks to learn"
}}

Only suggest genuinely free resources — Coursera audit, YouTube, fast.ai, 
freeCodeCamp, official docs, Kaggle, etc.

Return ONLY the JSON. No explanation."""

        resource_response = llm.invoke(resource_prompt).content.strip()
        try:
            if resource_response.startswith("```"):
                resource_response = resource_response.split("```")[1]
                if resource_response.startswith("json"):
                    resource_response = resource_response[4:]
            resources = json.loads(resource_response)
        except:
            resources = {}

    # Collect visa sponsor companies from results
    visa_sponsors = [
        d.metadata.get("company", "")
        for d in job_docs
        if d.metadata.get("visa_sponsor", False)
    ]

    return {
        "target_role": target_role,
        "readiness_score": score,
        "jobs_analysed": len(job_docs),
        "visa_sponsors_found": len(visa_sponsors),
        "visa_sponsor_companies": list(set(visa_sponsors))[:5],
        "matching_skills": matching_skills,
        "missing_required": missing_required,
        "missing_nice_to_have": missing_nice,
        "learning_resources": resources,
        "summary": f"You have {len(matching_skills)} of {len(required_skills)} required skills for {target_role} roles in London.",
    }


# ─────────────────────────────────────────────
# Always keep this at the very bottom
# This only runs when you execute main.py directly
# Not when uvicorn imports it
# ─────────────────────────────────────────────
if __name__ == "__main__":
    import os
    port = int(os.environ.get("PORT", 7860))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=False)