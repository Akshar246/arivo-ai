# Arivo AI - System Architecture

## Overview

Arivo AI is a full stack AI career platform with three
independent services that communicate via REST APIs.

## Services

### 1. Frontend (React)

- Port: 5173 (dev) / 80 (production)
- Responsibility: User interface
- Communicates with: Backend only

### 2. Backend (Node.js + Express)

- Port: 5000
- Responsibility: User auth, CV storage, job management
- Communicates with: MongoDB, AI Service

### 3. AI Service (Python + FastAPI)

- Port: 8000
- Responsibility: RAG pipeline, LLM, skill gap ML model
- Communicates with: ChromaDB, Groq API, HuggingFace

## Database

- MongoDB Atlas: Users, CVs, job history
- ChromaDB: Job listing vectors, visa data vectors

## External APIs

- Groq API: LLM inference
- Adzuna API: Live job listings
- Reed API: UK job listings
- Home Office: Tier 2 sponsor list

## User Flow

1. User signs up / logs in (Frontend → Backend → MongoDB)
2. User uploads CV (Frontend → Backend → MongoDB)
3. User searches jobs (Frontend → Backend → AI Service → ChromaDB)
4. AI returns results (ChromaDB → AI Service → Backend → Frontend)
5. User chats with Arivo (Frontend → AI Service → Groq → Frontend)
6. Skill gap analysis (Frontend → AI Service → ML Model → Frontend)

## Database Schema

### Users Collection

``````json
{
  "_id": "ObjectId",
  "name": "Akshar Chanchlani",
  "email": "akshar@email.com",
  "password": "hashed_password",
  "nationality": "Indian",
  "university": "Brunel University",
  "course": "MSc Artificial Intelligence",
  "visa_type": "Student Visa",
  "graduation_date": "2027-06",
  "target_role": "ML Engineer",
  "created_at": "timestamp"
}

### CVs Collection
`````json
{
  "_id": "ObjectId",
  "user_id": "ObjectId (ref: Users)",
  "filename": "akshar_cv.pdf",
  "raw_text": "extracted text from CV",
  "skills": ["python", "react", "docker"],
  "experience_years": 2,
  "education": "MSc AI Brunel University",
  "uploaded_at": "timestamp"
}

### Jobs Collection
````json
{
  "_id": "ObjectId",
  "title": "ML Engineer",
  "company": "Revolut",
  "location": "London",
  "salary": "80000",
  "visa_sponsor": true,
  "graduate_route": false,
  "skills_required": ["python", "pytorch", "mlops"],
  "source": "adzuna",
  "url": "https://adzuna.com/job/123",
  "fetched_at": "timestamp"
}

### ChatHistory Collection
```json
{
  "_id": "ObjectId",
  "user_id": "ObjectId (ref: Users)",
  "session_id": "uuid",
  "messages": [
    {"role": "user", "content": "Find ML jobs", "timestamp": ""},
    {"role": "arivo", "content": "Here are...", "timestamp": ""}
  ],
  "created_at": "timestamp"
}
``````

## API Endpoints

### Backend (Node.js — Port 5000)

#### Auth Routes

POST /api/auth/register → Create new user account
POST /api/auth/login → Login, returns JWT token
GET /api/auth/me → Get current user profile

#### CV Routes

POST /api/cv/upload → Upload and parse CV (PDF)
GET /api/cv/me → Get user's current CV
DELETE /api/cv/me → Delete user's CV

#### Jobs Routes

GET /api/jobs → Get all jobs (with filters)
GET /api/jobs?visa=true → Filter visa sponsored only
GET /api/jobs?role=ml → Filter by role
POST /api/jobs/save → Save a job to favourites
GET /api/jobs/saved → Get user's saved jobs

#### User Routes

GET /api/user/profile → Get full user profile
PUT /api/user/profile → Update profile
GET /api/user/history → Get chat history

### AI Service (FastAPI — Port 8000)

#### Chat Routes

POST /chat → Send message, get AI response
DELETE /chat/history → Clear conversation history

#### Analysis Routes

POST /skill-gap → Analyse skill gap from skills
POST /cv-analysis → Analyse uploaded CV text
POST /job-match → Match CV against job listing

#### Data Routes

POST /jobs/sync → Fetch and store latest jobs
GET /jobs/search → Semantic job search

## Complete User Journey

### Journey 1 — New User Onboarding

1. User lands on Arivo AI homepage
2. Clicks "Get Started"
3. Fills signup form (name, email, password, nationality,
   university, target role)
4. Backend creates user in MongoDB
5. JWT token returned and stored in browser
6. User redirected to dashboard

### Journey 2 — CV Upload and Analysis

1. User clicks "Upload CV"
2. PDF uploaded to backend
3. Backend extracts raw text from PDF
4. Raw text sent to AI service
5. AI service identifies skills, experience, education
6. Results stored in CVs collection in MongoDB
7. Dashboard shows skill summary

### Journey 3 — Job Search

1. User types job search query
2. Frontend sends query to AI service
3. AI service converts query to vector
4. ChromaDB returns top 5 matching jobs
5. Jobs filtered by visa sponsorship if user needs it
6. Results displayed with match score and missing skills

### Journey 4 — Interview Prep

1. User selects a job listing
2. Clicks "Prepare for Interview"
3. AI service loads job description into RAG context
4. User chats with Arivo about the role
5. Arivo coaches using UK STAR method
6. Chat history saved to MongoDB

### Journey 5 — Daily Job Sync (Automated)

1. Every 24 hours a scheduled job runs
2. Fetches latest listings from Adzuna and Reed APIs
3. Downloads latest Home Office Tier 2 sponsor list
4. Converts all to vectors and updates ChromaDB
5. MongoDB jobs collection updated
6. Users see fresh data every day

## Security

- All passwords hashed with bcrypt
- JWT tokens expire after 7 days
- API keys stored in .env never committed to GitHub
- MongoDB connection string in .env
- CORS configured for production domain only
- Rate limiting on all endpoints

## Deployment Architecture

Frontend → Vercel (free)
Backend → AWS EC2 t2.micro (free tier)
AI Service → AWS EC2 t2.micro (free tier)
Database → MongoDB Atlas M0 (free)
ChromaDB → Stored on EC2 instance
CI/CD → GitHub Actions (free)
