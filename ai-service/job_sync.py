import requests
import os
import csv
import io
import shutil
import re
from dotenv import load_dotenv
from langchain_chroma import Chroma
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_core.documents import Document

load_dotenv()

# ─────────────────────────────────────────────
# CONFIGURATION
# ─────────────────────────────────────────────
ADZUNA_APP_ID = os.getenv("ADZUNA_APP_ID")
ADZUNA_API_KEY = os.getenv("ADZUNA_API_KEY")

# Official GOV.UK page for sponsor list
GOVUK_SPONSOR_PAGE = (
    "https://www.gov.uk/government/publications/register-of-licensed-sponsors-workers"
)


# ─────────────────────────────────────────────
# GET LATEST CSV URL FROM GOV.UK
# The Home Office updates the CSV link every month
# Instead of hardcoding the URL — we automatically
# find the current download link from the GOV.UK page
# This means our system always uses the latest data
# ─────────────────────────────────────────────
def get_latest_csv_url():
    print("Finding latest Home Office sponsor list...")

    response = requests.get(GOVUK_SPONSOR_PAGE)

    # Use regex to find the CSV URL pattern in the page
    # The URL always contains Worker_and_Temporary_Worker.csv
    pattern = r'https://assets\.publishing\.service\.gov\.uk/media/[^"]+Worker_and_Temporary_Worker\.csv'
    matches = re.findall(pattern, response.text)

    if matches:
        url = matches[0]
        print(f"Found latest CSV: {url}")
        return url
    else:
        raise Exception("Could not find CSV URL on GOV.UK page")


# ─────────────────────────────────────────────
# LOAD OFFICIAL TIER 2 SPONSORS
# Downloads the real Home Office CSV and extracts
# all company names into a Python set
# A set allows O(1) lookup — extremely fast
# We get 120,000+ real sponsors across all industries
# Medical, Finance, Tech, Law, Retail — everything
# ─────────────────────────────────────────────
def load_official_sponsors():
    csv_url = get_latest_csv_url()

    print("Downloading official sponsor list from Home Office...")
    response = requests.get(csv_url)

    if response.status_code != 200:
        raise Exception(f"Failed to download CSV: {response.status_code}")

    # Parse CSV content
    # The CSV has columns: Organisation Name, Town/City, County, Type & Rating, Route
    sponsors = set()
    content = response.content.decode("utf-8", errors="ignore")
    reader = csv.DictReader(io.StringIO(content))

    for row in reader:
        # Get company name from first column
        org_name = row.get("Organisation Name", "").strip().lower()
        if org_name:
            sponsors.add(org_name)

    print(f"Loaded {len(sponsors):,} official Tier 2 sponsors")
    return sponsors


# ─────────────────────────────────────────────
# CHECK IF COMPANY IS AN OFFICIAL TIER 2 SPONSOR
# Checks the company name against the official
# Home Office register — not a hardcoded list
# Uses partial matching so "Revolut Ltd" matches "Revolut"
# ─────────────────────────────────────────────
def is_tier2_sponsor(company_name, sponsors_set):
    company_lower = company_name.strip().lower()

    # Direct match first — fastest
    if company_lower in sponsors_set:
        return True

    # Partial match — handles "Revolut Ltd" vs "Revolut"
    for sponsor in sponsors_set:
        if company_lower in sponsor or sponsor in company_lower:
            return True

    return False


# ─────────────────────────────────────────────
# FETCH JOBS FROM ADZUNA API
# Searches for jobs by role in London
# pages=2 means we get 40 jobs per role
# ─────────────────────────────────────────────
def fetch_jobs(role, pages=2):
    all_jobs = []

    for page in range(1, pages + 1):
        url = f"https://api.adzuna.com/v1/api/jobs/gb/search/{page}"
        params = {
            "app_id": ADZUNA_APP_ID,
            "app_key": ADZUNA_API_KEY,
            "results_per_page": 20,
            "what": role,
            "where": "london",
            "content-type": "application/json",
        }

        response = requests.get(url, params=params)

        if response.status_code == 200:
            jobs = response.json().get("results", [])
            all_jobs.extend(jobs)
            print(f"  Page {page} — {len(jobs)} jobs fetched")
        else:
            print(f"  Error on page {page}: {response.status_code}")

    return all_jobs


# ─────────────────────────────────────────────
# FORMAT JOB FOR CHROMADB STORAGE
# Converts raw Adzuna job into a clean string
# Includes all important fields for semantic search
# ─────────────────────────────────────────────
def format_job(job, sponsors_set):
    company = job.get("company", {}).get("display_name", "Unknown")
    title = job.get("title", "Unknown")
    location = job.get("location", {}).get("display_name", "London")
    salary_min = job.get("salary_min", 0)
    salary_max = job.get("salary_max", 0)
    description = job.get("description", "")[:300]
    url = job.get("redirect_url", "")

    # Check against official Home Office data
    visa_sponsor = is_tier2_sponsor(company, sponsors_set)

    # Format salary
    if salary_min and salary_max:
        salary = f"£{int(salary_min):,} - £{int(salary_max):,}"
    elif salary_min:
        salary = f"£{int(salary_min):,}+"
    else:
        salary = "Salary not specified"

    return {
        "text": f"{company} | {title} | {location} | {salary} | {'Official Tier 2 Visa Sponsor' if visa_sponsor else 'Sponsorship not confirmed'} | {description}",
        "metadata": {
            "company": company,
            "title": title,
            "location": location,
            "salary": salary,
            "visa_sponsor": visa_sponsor,
            "url": url,
            "source": "adzuna",
        },
    }


# ─────────────────────────────────────────────
# MAIN SYNC FUNCTION
# Ties everything together:
# 1. Load official sponsors from Home Office
# 2. Fetch real jobs from Adzuna
# 3. Check each job for visa sponsorship
# 4. Store everything in ChromaDB
# ─────────────────────────────────────────────
def sync_jobs_to_chromadb():
    print("=" * 50)
    print("ARIVO AI — Job Sync Starting")
    print("=" * 50)

    # Step 1 — Load official Home Office sponsor list
    sponsors_set = load_official_sponsors()

    # Step 2 — Fetch real jobs for multiple roles
    # Covering tech, data, AI, and general software
    roles = [
        "machine learning engineer",
        "data scientist",
        "AI engineer",
        "software engineer python",
        "full stack developer",
        "data analyst",
        "backend engineer",
        "frontend developer react",
    ]

    all_documents = []

    for role in roles:
        print(f"\nFetching: {role}")
        jobs = fetch_jobs(role, pages=2)

        for job in jobs:
            formatted = format_job(job, sponsors_set)
            doc = Document(
                page_content=formatted["text"], metadata=formatted["metadata"]
            )
            all_documents.append(doc)

    print(f"\nTotal jobs fetched: {len(all_documents)}")

    # Count visa sponsored jobs
    sponsored = sum(1 for d in all_documents if d.metadata["visa_sponsor"])
    print(f"Visa sponsored jobs: {sponsored}")

    # Step 3 — Store in ChromaDB
    print("\nLoading embedding model...")
    embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")

    # Delete old database and create fresh one
    if os.path.exists("./arivo_db"):
        shutil.rmtree("./arivo_db")
        print("Old database cleared")

    print("Storing jobs in ChromaDB...")
    vectorstore = Chroma.from_documents(
        documents=all_documents, embedding=embeddings, persist_directory="./arivo_db"
    )

    print("=" * 50)
    print(f"Job sync complete!")
    print(f"Total jobs stored: {len(all_documents)}")
    print(f"Visa sponsored: {sponsored}")
    print(f"Industries covered: Tech, Data, AI, Software")
    print("=" * 50)

    return len(all_documents)


if __name__ == "__main__":
    sync_jobs_to_chromadb()
