# Arivo AI

**The career platform for international students navigating the UK job market, built by one.**

Arivo verifies visa sponsorship against the UK government's official register in real time, scores your CV the way an ATS actually reads it, and coaches you through the parts of UK job hunting nobody explains. All backed by live market data, not guesses.

**🔗 [Live app](https://arivo-ai-xi.vercel.app)** · **[Backend API](https://arivo-backend-vp35.onrender.com)** · **[AI service](https://itsakshar-arivo-ai.hf.space)**

---

## Why this exists

Only 3% of international graduates who found UK employment used their university's career service to get there. Less than half of recent graduates are in full time work six months after finishing their degree. International students carry an extra layer most job tools ignore completely: can this specific company legally sponsor a visa, and does this specific role even pay enough to qualify for one.

I'm an international MSc student. I got tired of opening ten tabs just to cross reference one job listing against the Home Office sponsor register by hand, with no way to know if a rejection was about my CV, my visa status, or a role that was never really sponsoring in the first place. So I'm building the tool I wished existed.

## What it does today

- **Visa verified job search.** Every result checked live against the UK government's Skilled Worker sponsor register, over 120,000 companies, not a stale scraped list.
- **ATS Readiness Analyser.** Scores a CV the way applicant tracking software actually parses it: parseability, keyword match against the job description, section structure, action verb strength. Includes an **International Student Lens** that flags home country CV conventions, like a photo, date of birth, or marital status, that quietly fail UK screening and that I haven't found any other tool checking for.
- **AI Career Coach.** A retrieval augmented chat grounded in live job listings, not generic advice copied from a blog.
- **Skill Gap Analysis.** Upload a CV, get a readiness score against real London market demand for a target role, with free resources to close each gap.
- **CV extraction.** Real PDF parsing through pdfplumber, not a regex hack against raw text.

Every number on every screen comes from a live source or a real computation. If the backend can't support a stat, it doesn't ship. That rule has already cost me a few UI ideas that looked great and had to be cut.

## Why it's different

Most visa sponsorship tools, including some well funded ones, answer one question: can this company sponsor you. That's necessary but shallow. The harder, more personal questions are the ones students actually lose sleep over: does this role's salary clear my specific visa threshold, how many months do I realistically have left on my Graduate visa to find something, and why do I keep getting rejected when my CV looks fine to me. Arivo is being built to answer those, not just the company lookup everyone else already does.

## Architecture

Three independently deployed services, talking over REST:

```
┌──────────────────┐      ┌──────────────────┐      ┌───────────────────────┐
│  Frontend         │ ───▶ │  Backend           │ ───▶ │  AI Service            │
│  React + Vite      │      │  Node / Express    │      │  FastAPI               │
│  (Vercel)          │      │  (Render)          │      │  (Hugging Face Spaces) │
└──────────────────┘      └──────────────────┘      └───────────────────────┘
                                    │                            │
                                    ▼                            ▼
                            MongoDB Atlas                 ChromaDB + Groq
                            (users, CVs, JWT auth)         (RAG, embeddings,
                                                            live Adzuna search)
```

| Layer | Stack |
|---|---|
| Frontend | React, Vite, custom CSS design system, no UI framework |
| Backend | Node.js, Express, JWT auth, Multer for file upload, MongoDB Atlas |
| AI service | FastAPI, LangChain, ChromaDB, Groq (`llama-3.3-70b-versatile`), HuggingFace sentence transformers, pdfplumber, scikit learn |
| Data | UK Home Office Skilled Worker sponsor register, live CSV cached daily, and the Adzuna Jobs API, live |
| Deployment | Vercel for the frontend, Render for the backend, Hugging Face Spaces with Docker for the AI service. Zero pounds a month |

## Engineering decisions worth mentioning

- **Live first job search, not cache first.** Early versions served ChromaDB cached listings that could silently go stale, so clicking a "live" job sometimes led to a dead listing. Search now checks the cache and falls back to a live Adzuna fetch whenever there are fewer than three relevant matches, so results stay fast without going stale.
- **Honesty over polish, as a rule, not a preference.** Several early UI drafts had plausible looking placeholder stats and fake progress trackers that the backend couldn't actually support. All of them were removed once I noticed. Every number a user sees now is either live or computed.
- **No secrets in source, checked every time.** API keys live only in environment variables and platform secrets, and every deploy is checked with `git ls-files` before pushing to make sure nothing sensitive is tracked.
- **Three platforms, chosen deliberately, not by default.** Hugging Face Spaces for the AI service because it gives generous free RAM for embeddings and ChromaDB, which a typical free tier would choke on. Render for the lightweight Node API. Vercel for the static frontend build. Each platform is doing the job it's actually good at instead of forcing everything onto one.

## Where this is going

I built the first version from the CV point of view, as a personal tool. I now think there's a real product here, so the roadmap below isn't a feature wishlist, it's an attempt to build the layer that the closest competitors in this space don't have yet: something that understands the user's actual visa timeline and application history, not just a company database.

**Next, in build order:**

- [ ] **Application Tracker.** Save a role and move it through applied, interview, offer. This is the piece the rest of the roadmap depends on, since a visa clock or a rejection pattern is only useful once there's a history to look at.
- [ ] **Auto CV Tailor.** Take the missing keywords and weak bullets the ATS analyser already finds, and use them to rewrite specific CV lines for a specific job, rather than just pointing out the problem and leaving the user to fix it alone.
- [ ] **Visa Clock.** The feature I'm most excited about. A Graduate visa holder enters their visa start date, and gets a countdown alongside a month by month plan generated from the current job market for their field, so "18 months left" turns into "here's what to do this month."
- [ ] **Rejection Diagnostic.** Paste a handful of roles that led nowhere, and get a pattern read: was the CV missing the same keyword every time, were some of these companies never actually on the sponsor register, that kind of thing. Turns silence into feedback.
- [ ] **Weekly Job Digest.** A short, personalised list of new sponsored roles that match a saved profile, so the product still brings value on the days a user isn't actively searching.

**Longer term, if this keeps growing:**

- A scheduled sync job that refreshes and prunes the job cache on a timer, replacing the current on demand live fetch, once the traffic justifies the added infrastructure.
- Salary threshold checking per role, shown against the visa type the user actually holds, not a generic sponsorship flag.
- Expanding past Adzuna to a second live job source, behind the same search interface, for coverage the way a listings aggregator would build it.

## Running it locally

```bash
git clone https://github.com/Akshar246/arivo-ai.git
cd arivo-ai
docker compose up --build
```

This starts all three services together: frontend on `:3000`, backend on `:5001`, AI service on `:8000`. You'll need your own `.env` files for `MONGODB_URI`, `JWT_SECRET`, `GROQ_API_KEY`, `ADZUNA_APP_ID`, and `ADZUNA_API_KEY`. None are included in this repo, see `.env.example` in each service folder.

## Known limitations

Naming these on purpose, since a project that claims to have no rough edges is less convincing than one that's honest about them.

- The backend runs on Render's free tier, which sleeps after 15 minutes of inactivity. The first request after idle time can take 30 to 50 seconds while it wakes up.
- Job descriptions show the snippet Adzuna's API provides, not the full listing text. A "view full listing" link covers the rest.
- Sponsor register matching is name based against the official government CSV, so a handful of edge cases around subsidiaries or name variations can be missed.

## About

Built by **Akshar Chanchlani**. MSc Artificial Intelligence, Brunel University London. BSc Computer Science, Middlesex University. International student, building the tool I needed and couldn't find.

[LinkedIn](https://linkedin.com/in/akshar-chanchlani) · [aksharchanchlani7006@gmail.com](mailto:your.email@example.com)

## License

MIT, see [LICENSE](./LICENSE).
