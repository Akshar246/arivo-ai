import { useAuth } from "../context/AuthContext";
import { useState, useEffect } from "react";
import axios from "axios";

const TOOLS = [
  {
    icon: "📄",
    name: "Optimize Your CV",
    desc: "Beat ATS filters and match market demands",
    page: "profile",
  },
  {
    icon: "📊",
    name: "Check Your Readiness",
    desc: "Skill gap analysis for your target role",
    page: "profile",
  },
  {
    icon: "🎤",
    name: "Practice Interviews",
    desc: "AI coaching tailored to real UK roles",
    page: "chat",
  },
];

export default function Dashboard({ onNavigate, onJobsLoad }) {
  const { currentUser } = useAuth();
  const name = currentUser?.name?.split(" ")[0] || "there";
  const role = currentUser?.targetRole || "Software Engineer";

  const [dashboardStarted, setDashboardStarted] = useState(() => {
    try {
      return localStorage.getItem("arivo_dashboard_started") === "true";
    } catch {
      return false;
    }
  });

  const [jobs, setJobs] = useState([]);
  const [jobsLoading, setJobsLoading] = useState(false);
  const [jobsError, setJobsError] = useState(null);

  useEffect(() => {
    if (dashboardStarted) {
      fetchJobs();
    }
  }, [dashboardStarted]);

  const fetchJobs = async () => {
    setJobsLoading(true);
    setJobsError(null);
    try {
      const aiUrl = import.meta.env.VITE_AI_URL || "http://localhost:8000";
      const response = await axios.post(`${aiUrl}/jobs/search`, {
        query: role,
        location: "london",
      });
      const jobsList = response.data.jobs || [];
      setJobs(jobsList);
      if (onJobsLoad) onJobsLoad(jobsList);
    } catch (error) {
      console.error("Failed to fetch jobs:", error);
      setJobsError("Could not load jobs. Please try again.");
    } finally {
      setJobsLoading(false);
    }
  };

  const handleStartDashboard = () => {
    setDashboardStarted(true);
    try {
      localStorage.setItem("arivo_dashboard_started", "true");
    } catch {
      // Storage error
    }
  };

  // Calculate greeting
  const [timeState] = useState(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  });

  if (!dashboardStarted) {
    return (
      <div className="dashboard-container">
        <style>{welcomeStyles}</style>
        <div className="welcome-screen">
          <div className="welcome-bg"></div>
          <div className="welcome-content">
            <div className="welcome-icon">✨</div>
            <h1 className="welcome-title">Welcome to Arivo, {name}</h1>
            <p className="welcome-subtitle">
              Your AI-powered guide to visa-sponsored jobs in the UK
            </p>

            <div className="welcome-benefits">
              <div className="benefit">
                <span className="benefit-icon">🏆</span>
                <div>
                  <strong>Get Visa-Sponsored Jobs</strong>
                  <span>Only roles that can actually hire international talent</span>
                </div>
              </div>
              <div className="benefit">
                <span className="benefit-icon">📊</span>
                <div>
                  <strong>Optimize Your CV</strong>
                  <span>Beat ATS filters and match market demands</span>
                </div>
              </div>
              <div className="benefit">
                <span className="benefit-icon">🤖</span>
                <div>
                  <strong>Practice with AI</strong>
                  <span>Interview prep tailored to real UK roles</span>
                </div>
              </div>
            </div>

            <button className="btn-start" onClick={handleStartDashboard}>
              See Your Opportunities <span>→</span>
            </button>

            <p className="welcome-note">Visa-sponsored roles, verified and curated</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <style>{dashboardStyles}</style>
      <div className="dashboard-main">
        <div className="dashboard-bg"></div>

        <div className="dashboard-wrapper">
          {/* ── HERO SECTION ── */}
          <header className="hero-header">
            <div className="hero-left">
              <h1 className="hero-greeting">{timeState}, <span className="name-highlight">{name}</span></h1>
              <p className="hero-subtitle">Targeting <strong>{role}</strong> in London, UK</p>
            </div>
            <div className="hero-stats">
              <div className="stat">
                <span className="stat-value">120k+</span>
                <span className="stat-label">Verified Sponsors</span>
              </div>
              <div className="stat-divider"></div>
              <div className="stat">
                <span className="stat-value emerald">Live</span>
                <span className="stat-label">Market Data</span>
              </div>
            </div>
          </header>

          {/* ── JOBS SECTION ── */}
          <section className="jobs-section">
            <div className="section-header">
              <div className="title-row">
                <h2 className="section-title">Your Matched Opportunities</h2>
                {!jobsLoading && jobs.length > 0 && (
                  <span className="job-count-badge">{jobs.length}+ Roles</span>
                )}
              </div>
              <p className="section-subtitle">Tier-2 visa-sponsored roles verified against Home Office register</p>
            </div>

            {jobsLoading && (
              <div className="loading-state">
                <div className="spinner"></div>
                <p>Finding your matches...</p>
              </div>
            )}

            {jobsError && (
              <div className="error-state">
                <p>⚠️ {jobsError}</p>
                <button className="retry-btn" onClick={fetchJobs}>Try Again</button>
              </div>
            )}

            {!jobsLoading && jobs.length > 0 && (
              <div className="jobs-grid">
                {jobs.slice(0, 6).map((job, idx) => (
                  <div key={idx} className="job-card" style={{ animationDelay: `${idx * 50}ms` }}>
                    <div className="job-card-header">
                      <div className="job-info">
                        <h3 className="job-title">{job.title || "Job Title"}</h3>
                        <p className="job-company">{job.company || "Company"}</p>
                      </div>
                      <span className="tier2-badge">✓ Tier-2</span>
                    </div>

                    <div className="job-meta">
                      <span className="job-salary">{job.salary || "Competitive"}</span>
                      <span className="job-location">📍 {job.location || "London"}</span>
                    </div>

                    <button className="job-btn" onClick={() => onNavigate("jobDetail", job)}>
                      View & Apply →
                    </button>
                  </div>
                ))}
              </div>
            )}

            {!jobsLoading && jobs.length === 0 && !jobsError && (
              <div className="empty-state">
                <p>No jobs found yet. Check back soon!</p>
              </div>
            )}
          </section>

          {/* ── TOOLS SECTION ── */}
          <section className="tools-section">
            <div className="section-header">
              <h2 className="section-title">Optimize Your Application</h2>
              <p className="section-subtitle">Optional tools to boost your chances</p>
            </div>

            <div className="tools-grid">
              {TOOLS.map((tool, idx) => (
                <div key={idx} className="tool-card" style={{ animationDelay: `${600 + idx * 60}ms` }}>
                  <div className="tool-icon">{tool.icon}</div>
                  <h3 className="tool-name">{tool.name}</h3>
                  <p className="tool-desc">{tool.desc}</p>
                  <button className="tool-btn" onClick={() => onNavigate(tool.page)}>
                    Explore →
                  </button>
                </div>
              ))}
            </div>
          </section>

          {/* ── TRUST SIGNALS ── */}
          <section className="trust-section">
            <p className="trust-text">
              ✓ 120,000+ Home Office Tier-2 sponsors verified
              <br />✓ Real-time market data from 50+ job boards
              <br />✓ AI-powered matching from over 10,000 live listings
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

const welcomeStyles = `
.dashboard-container {
  background: #030305;
  min-height: calc(100vh - 56px);
  color: #F8FAFC;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  position: relative;
  overflow-x: hidden;
}

.welcome-screen {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: calc(100vh - 56px);
  position: relative;
  padding: 2rem;
}

.welcome-bg {
  position: absolute;
  inset: 0;
  background: radial-gradient(600px at 50% 50%, rgba(139, 92, 246, 0.08), transparent);
  pointer-events: none;
}

.welcome-content {
  position: relative;
  z-index: 1;
  max-width: 520px;
  text-align: center;
}

.welcome-icon {
  font-size: 4rem;
  margin-bottom: 2.5rem;
  display: inline-block;
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-12px); }
}

.welcome-title {
  font-size: 2.8rem;
  font-weight: 800;
  margin: 0 0 1rem;
  letter-spacing: -0.02em;
  line-height: 1.2;
}

.welcome-subtitle {
  font-size: 1.1rem;
  color: #A0AEC0;
  margin: 0 0 3rem;
  line-height: 1.6;
}

.welcome-benefits {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  margin-bottom: 2.5rem;
}

.benefit {
  display: flex;
  gap: 1rem;
  padding: 1.25rem;
  background: rgba(139, 92, 246, 0.05);
  border: 1px solid rgba(139, 92, 246, 0.12);
  border-radius: 12px;
  text-align: left;
  transition: all 0.3s ease;
}

.benefit:hover {
  background: rgba(139, 92, 246, 0.08);
  border-color: rgba(139, 92, 246, 0.25);
}

.benefit-icon {
  font-size: 1.5rem;
  flex-shrink: 0;
}

.benefit strong {
  display: block;
  margin-bottom: 0.3rem;
  color: #F8FAFC;
}

.benefit span {
  font-size: 0.85rem;
  color: #94A3B8;
}

.btn-start {
  background: linear-gradient(135deg, #8B5CF6 0%, #D946EF 100%);
  color: #fff;
  border: none;
  padding: 16px 36px;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  transition: all 0.3s ease;
  box-shadow: 0 12px 32px rgba(139, 92, 246, 0.25);
  margin-bottom: 1.5rem;
}

.btn-start:hover {
  transform: translateY(-2px);
  box-shadow: 0 16px 40px rgba(139, 92, 246, 0.35);
}

.welcome-note {
  font-size: 0.9rem;
  color: #718096;
  margin: 0;
}
`;

const dashboardStyles = `
html {
  scroll-behavior: smooth;
}

.dashboard-container {
  background: #030305;
  min-height: calc(100vh - 56px);
  color: #F8FAFC;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  position: relative;
  overflow-x: hidden;
}

.dashboard-main {
  min-height: calc(100vh - 56px);
  position: relative;
}

.dashboard-bg {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(to right, rgba(255, 255, 255, 0.02) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(255, 255, 255, 0.02) 1px, transparent 1px);
  background-size: 50px 50px;
  pointer-events: none;
  opacity: 0.5;
}

.dashboard-wrapper {
  position: relative;
  z-index: 1;
  max-width: 1320px;
  margin: 0 auto;
  padding: 4rem 2rem;
  animation: fadeInUp 0.6s ease-out 0.2s backwards;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* ── HERO SECTION ── */
.hero-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 3rem;
  margin-bottom: 5rem;
  padding-bottom: 3rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  animation: fadeInUp 0.6s ease-out backwards;
}

.hero-left {
  flex: 1;
}

.hero-greeting {
  font-size: 3.2rem;
  font-weight: 800;
  margin: 0 0 0.5rem;
  letter-spacing: -0.02em;
  line-height: 1.2;
}

.name-highlight {
  background: linear-gradient(135deg, #A78BFA, #D946EF);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.hero-subtitle {
  font-size: 1.1rem;
  color: #A0AEC0;
  margin: 0;
  line-height: 1.6;
}

.hero-stats {
  display: flex;
  gap: 2.5rem;
  align-items: center;
  background: rgba(20, 20, 30, 0.4);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(139, 92, 246, 0.12);
  border-radius: 16px;
  padding: 2rem 2.5rem;
}

.stat {
  text-align: center;
}

.stat-value {
  display: block;
  font-size: 1.8rem;
  font-weight: 800;
  color: #D946EF;
  margin-bottom: 0.25rem;
}

.stat-value.emerald {
  color: #10B981;
}

.stat-label {
  display: block;
  font-size: 0.85rem;
  color: #94A3B8;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.stat-divider {
  width: 1px;
  height: 40px;
  background: rgba(255, 255, 255, 0.1);
}

/* ── JOBS SECTION ── */
.jobs-section {
  margin-bottom: 6rem;
}

.section-header {
  margin-bottom: 3rem;
  animation: fadeInUp 0.6s ease-out 0.3s backwards;
}

.title-row {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  margin-bottom: 0.5rem;
}

.section-title {
  font-size: 2rem;
  font-weight: 800;
  margin: 0;
  letter-spacing: -0.01em;
}

.job-count-badge {
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(217, 70, 239, 0.2));
  border: 1px solid rgba(139, 92, 246, 0.3);
  color: #D946EF;
  padding: 0.6rem 1.2rem;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 600;
  white-space: nowrap;
  animation: slideInRight 0.5s ease-out 0.4s backwards;
}

@keyframes slideInRight {
  from {
    opacity: 0;
    transform: translateX(-10px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.section-subtitle {
  font-size: 1rem;
  color: #A0AEC0;
  margin: 0;
  animation: fadeInUp 0.6s ease-out 0.35s backwards;
}

.jobs-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: 2rem;
  margin-bottom: 2rem;
}

.job-card {
  background: rgba(20, 20, 30, 0.6);
  border: 1px solid rgba(139, 92, 246, 0.15);
  border-radius: 14px;
  padding: 2rem;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  backdrop-filter: blur(16px);
  cursor: pointer;
  position: relative;
  overflow: hidden;
  animation: fadeInUp 0.5s ease-out backwards;
}

.job-card::before {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(600px at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(139, 92, 246, 0.1), transparent 80%);
  opacity: 0;
  transition: opacity 0.3s ease;
  pointer-events: none;
}

.job-card:hover {
  border-color: rgba(139, 92, 246, 0.4);
  background: rgba(20, 20, 30, 0.9);
  transform: translateY(-8px);
  box-shadow: 0 32px 64px rgba(139, 92, 246, 0.2);
}

.job-card:hover::before {
  opacity: 1;
}

.job-card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.job-info {
  flex: 1;
}

.job-title {
  font-size: 1.15rem;
  font-weight: 700;
  margin: 0 0 0.3rem;
  color: #F8FAFC;
  line-height: 1.3;
}

.job-company {
  font-size: 0.95rem;
  color: #94A3B8;
  margin: 0;
}

.tier2-badge {
  background: rgba(16, 185, 129, 0.15);
  border: 1px solid rgba(16, 185, 129, 0.3);
  color: #10B981;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  font-size: 0.8rem;
  font-weight: 600;
  white-space: nowrap;
  flex-shrink: 0;
}

.job-meta {
  display: flex;
  gap: 2rem;
  margin-bottom: 2rem;
  font-size: 0.95rem;
}

.job-salary {
  color: #D946EF;
  font-weight: 600;
}

.job-location {
  color: #94A3B8;
}

.job-btn {
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.8), rgba(217, 70, 239, 0.8));
  color: #fff;
  border: none;
  padding: 12px 20px;
  border-radius: 10px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  width: 100%;
  text-align: center;
}

.job-btn:hover {
  background: linear-gradient(135deg, #8B5CF6, #D946EF);
  transform: translateX(2px);
  box-shadow: 0 8px 16px rgba(139, 92, 246, 0.3);
}

/* Loading State */
.loading-state {
  text-align: center;
  padding: 4rem 2rem;
}

.spinner {
  width: 48px;
  height: 48px;
  border: 3px solid rgba(139, 92, 246, 0.2);
  border-top-color: #8B5CF6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-state p {
  color: #A0AEC0;
  font-size: 1rem;
  margin: 0;
}

/* Error State */
.error-state {
  background: rgba(239, 68, 68, 0.08);
  border: 1px solid rgba(239, 68, 68, 0.2);
  border-radius: 12px;
  padding: 2rem;
  text-align: center;
  color: #FECACA;
}

.retry-btn {
  background: rgba(239, 68, 68, 0.2);
  color: #FECACA;
  border: 1px solid rgba(239, 68, 68, 0.3);
  padding: 10px 20px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s;
  margin-top: 1rem;
}

.retry-btn:hover {
  background: rgba(239, 68, 68, 0.3);
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  color: #A0AEC0;
}

/* ── TOOLS SECTION ── */
.tools-section {
  margin-bottom: 6rem;
  padding-top: 4rem;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  animation: fadeInUp 0.6s ease-out 0.6s backwards;
}

.tools-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
}

.tool-card {
  background: rgba(20, 20, 30, 0.6);
  border: 1px solid rgba(139, 92, 246, 0.15);
  border-radius: 14px;
  padding: 2.5rem;
  text-align: center;
  transition: all 0.3s ease;
  backdrop-filter: blur(16px);
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  animation: fadeInUp 0.5s ease-out backwards;
}

.tool-card:hover {
  border-color: rgba(139, 92, 246, 0.4);
  background: rgba(20, 20, 30, 0.9);
  transform: translateY(-8px);
  box-shadow: 0 32px 64px rgba(139, 92, 246, 0.2);
}

.tool-icon {
  font-size: 3rem;
  margin-bottom: 1.5rem;
}

.tool-name {
  font-size: 1.15rem;
  font-weight: 700;
  margin: 0 0 0.75rem;
  color: #F8FAFC;
}

.tool-desc {
  font-size: 0.95rem;
  color: #A0AEC0;
  margin: 0 0 2rem;
  line-height: 1.5;
  min-height: 2.8rem;
}

.tool-btn {
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.8), rgba(217, 70, 239, 0.8));
  color: #fff;
  border: none;
  padding: 12px 24px;
  border-radius: 10px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-top: auto;
}

.tool-btn:hover {
  background: linear-gradient(135deg, #8B5CF6, #D946EF);
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(139, 92, 246, 0.3);
}

/* ── TRUST SECTION ── */
.trust-section {
  text-align: center;
  padding: 3rem;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  animation: fadeInUp 0.6s ease-out 0.8s backwards;
}

.trust-text {
  font-size: 0.95rem;
  color: #94A3B8;
  margin: 0;
  line-height: 1.8;
  animation: fadeIn 0.6s ease-out 0.85s backwards;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

/* ── MOBILE ── */
@media (max-width: 768px) {
  .dashboard-wrapper {
    padding: 2rem 1rem;
  }

  .hero-header {
    flex-direction: column;
    gap: 2rem;
    margin-bottom: 3rem;
  }

  .hero-greeting {
    font-size: 2.2rem;
  }

  .hero-stats {
    width: 100%;
    gap: 1.5rem;
    padding: 1.5rem;
  }

  .jobs-grid {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }

  .tools-grid {
    grid-template-columns: 1fr;
  }

  .section-title {
    font-size: 1.5rem;
  }

  .job-card {
    padding: 1.5rem;
  }

  .tool-card {
    padding: 2rem;
  }
}
`;
