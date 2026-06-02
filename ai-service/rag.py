from langchain_chroma import Chroma
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_core.documents import Document
from dotenv import load_dotenv

load_dotenv()

# Load the free embedding model
embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")

print("Embedding model loaded successfully!")

# Sample UK job listings — in real Arivo AI these come from Adzuna API
job_listings = [
    "Revolut | ML Engineer | London | Tier 2 visa sponsor | 80k | Python, TensorFlow, MLOps required",
    "DeepMind | Research Engineer | London | Visa sponsorship | 95k | PyTorch, PhD preferred",
    "Monzo | Data Scientist | London | Graduate route eligible | 65k | Python, SQL, scikit-learn",
    "Babylon Health | AI Engineer | London | Tier 2 sponsor | 75k | NLP, transformers, RAG experience",
    "Revolut | Backend Engineer | London | Tier 2 sponsor | 70k | Node.js, Python, distributed systems",
    "NHS Digital | Data Analyst | London | No sponsorship | 45k | SQL, Power BI, Excel",
    "Google DeepMind | Software Engineer | London | Visa sponsor | 110k | Algorithms, ML, Python",
    "Starling Bank | ML Engineer | London | Tier 2 sponsor | 85k | Python, PyTorch, AWS",
]

# Wrap each job in a Document object with metadata
documents = [
    Document(
        page_content=job,
        metadata={"source": "sample_data", "visa_sponsor": "sponsor" in job.lower()},
    )
    for job in job_listings
]

print(f"Created {len(documents)} job documents")

import os

if not os.path.exists("./arivo_db"):
    vectorstore = Chroma.from_documents(
        documents=documents, embedding=embeddings, persist_directory="./arivo_db"
    )
    print(f"Stored {len(documents)} jobs in ChromaDB!")
else:
    print("Database already exists — loading from disk")

# Store all job documents in ChromaDB
# This converts each job to a vector and saves it to disk
vectorstore = Chroma.from_documents(
    documents=documents, embedding=embeddings, persist_directory="./arivo_db"
)

print(f"Stored {len(documents)} jobs in ChromaDB!")

# Load the saved database
vectorstore = Chroma(persist_directory="./arivo_db", embedding_function=embeddings)

# Search by MEANING — not keywords
query = "I want a machine learning job in London that sponsors my visa"

results = vectorstore.similarity_search(query, k=5)

# Remove duplicates by page_content
seen = set()
unique_results = []
for doc in results:
    if doc.page_content not in seen:
        seen.add(doc.page_content)
        unique_results.append(doc)

print(f"\nTop jobs matching: '{query}'\n")
for i, doc in enumerate(unique_results[:3], 1):
    print(f"{i}. {doc.page_content}")
    print(f"   Visa sponsor: {doc.metadata['visa_sponsor']}\n")
