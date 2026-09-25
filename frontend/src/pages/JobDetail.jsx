import { useState, useEffect } from "react";
import axios from "axios";

export default function JobDetail({ jobData, allJobs, onNavigate, onBack }) {
  const [job, setJob] = useState(jobData);
  const [similarJobs, setSimilarJobs] = useState([]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (job && allJobs) {
      const similar = allJobs
        .filter(
          (j) =>
            j.company !== job.company &&
            (j.title.includes(job.title.split(" ")[0]) ||
              job.title.includes(j.title.split(" ")[0]))
        )
        .slice(0, 3);
      setSimilarJobs(similar);
    }
  }, [job, allJobs]);

  const calculateMatchScore = () => {
    let score = 70;
    if (job.visa_sponsor) score += 15;
    if (job.salary && job.salary !== "Not specified") score += 10;
    if (job.description_full && job.description_full.length > 500) score += 5;
    return Math.min(score, 100);
  };

  const matchScore = calculateMatchScore();

  const handleApply = () => {
    if (job.url) {
      window.open(job.url, "_blank");
    }
  };

  const copyToClipboard = () => {
    const text = `${job.title} at ${job.company} - ${job.location}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!job) {
    return (
      <div className="job-detail-container">
        <style>{jobDetailStyles}</style>
        <div className="error-state">
          <p>Job not found</p>
          <button onClick={onBack} className="back-button">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="job-detail-container">
      <style>{jobDetailStyles}</style>

      {/* Header */}
      <header className="job-header">
        <button onClick={onBack} className="back-button">
          ← Back
        </button>
        <button onClick={copyToClipboard} className="share-button">
          {copied ? "Copied!" : "Share"}
        </button>
      </header>

      {/* Hero Section */}
      <section className="job-hero">
        <div className="hero-content">
          <div className="company-logo">{job.company.charAt(0).toUpperCase()}</div>
          <div className="hero-text">
            <h1 className="job-title">{job.title}</h1>
            <p className="job-company">{job.company}</p>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="quick-stats">
          <div className="stat">
            <span className="stat-label">Location</span>
            <span className="stat-value">{job.location}</span>
          </div>
          <div className="stat">
            <span className="stat-label">Salary</span>
            <span className="stat-value">
              {job.salary === "Not specified" ? "Competitive" : job.salary}
            </span>
          </div>
          <div className="stat">
            <span className="stat-label">Type</span>
            <span className="stat-value">{job.contract_type || "Full-time"}</span>
          </div>
          {job.visa_sponsor && (
            <div className="stat visa-stat">
              <span className="stat-label">Visa Sponsor</span>
              <span className="stat-value visa-badge">Tier-2</span>
            </div>
          )}
        </div>
      </section>

      {/* Match Score Card */}
      <section className="match-score-section">
        <div className="match-card">
          <div className="match-ring-container">
            <svg viewBox="0 0 120 120" className="match-ring">
              <circle cx="60" cy="60" r="50" className="ring-bg" />
              <circle
                cx="60"
                cy="60"
                r="50"
                className="ring-progress"
                style={{
                  strokeDasharray: `${(matchScore / 100) * 314} 314`,
                }}
              />
            </svg>
            <div className="match-percentage">{matchScore}%</div>
          </div>
          <div className="match-text">
            <h3>Perfect Match</h3>
            <p>
              {job.visa_sponsor
                ? "You're eligible for Tier-2 visa sponsorship for this role"
                : "This role aligns with your profile and goals"}
            </p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="job-content">
        {/* Key Info Grid */}
        <div className="info-grid">
          <div className="info-card">
            <h4>Work Mode</h4>
            <p className="capitalize">{job.work_mode || "On-site"}</p>
          </div>
          <div className="info-card">
            <h4>Contract</h4>
            <p>{job.contract_time || "Permanent"}</p>
          </div>
          <div className="info-card">
            <h4>Posted</h4>
            <p>
              {job.fetched_at
                ? new Date(job.fetched_at).toLocaleDateString()
                : "Recently"}
            </p>
          </div>
          {job.salary_is_predicted && (
            <div className="info-card">
              <h4>Salary Info</h4>
              <p>Estimated</p>
            </div>
          )}
        </div>

        {/* Job Description */}
        <div className="description-section">
          <h2>Job Description</h2>
          <div className="description-text">
            {job.description_full ? (
              job.description_full.split("\n").map((line, i) => (
                line.trim() && <p key={i}>{line}</p>
              ))
            ) : (
              <p>{job.description || "No description available"}</p>
            )}
          </div>
        </div>

        {/* Why This Role */}
        {job.visa_sponsor && (
          <div className="why-section">
            <h2>Why This Role is Perfect for You</h2>
            <div className="why-list">
              <div className="why-item">
                <div className="why-icon">✓</div>
                <div>
                  <h4>Tier-2 Visa Sponsorship Available</h4>
                  <p>
                    {job.company} is a verified UK sponsor — you're eligible to
                    apply
                  </p>
                </div>
              </div>
              <div className="why-item">
                <div className="why-icon">✓</div>
                <div>
                  <h4>International Student Friendly</h4>
                  <p>This company actively sponsors visa applications</p>
                </div>
              </div>
              <div className="why-item">
                <div className="why-icon">✓</div>
                <div>
                  <h4>Strong Career Progression</h4>
                  <p>Verified sponsor with track record of hiring talent</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <button onClick={handleApply} className="apply-button">
          Apply Now
        </button>
        <p className="cta-text">
          Opening in new tab • Your profile will be reviewed within 48 hours
        </p>
      </section>

      {/* Similar Jobs */}
      {similarJobs.length > 0 && (
        <section className="similar-jobs-section">
          <h2>Similar Opportunities</h2>
          <div className="similar-jobs-grid">
            {similarJobs.map((similarJob, idx) => (
              <div
                key={idx}
                className="similar-job-card"
                onClick={() => onNavigate("jobDetail", similarJob)}
                style={{ animationDelay: `${idx * 0.1}s` }}
              >
                <div className="similar-job-logo">
                  {similarJob.company.charAt(0).toUpperCase()}
                </div>
                <h4>{similarJob.title}</h4>
                <p className="similar-company">{similarJob.company}</p>
                <p className="similar-location">{similarJob.location}</p>
                {similarJob.visa_sponsor && (
                  <div className="similar-badge">Tier-2 Sponsor</div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="job-footer">
        <p>
          Source: {job.source === "reed" ? "Reed" : "Adzuna"} •{" "}
          {job.sponsor_verified_via
            ? `Verified by ${job.sponsor_verified_via}`
            : "Job Posted Recently"}
        </p>
      </footer>
    </div>
  );
}

const jobDetailStyles = `
  .job-detail-container {
    min-height: 100vh;
    background: linear-gradient(135deg, #030305 0%, #0a0810 100%);
    color: #e0e0e0;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  }

  .job-header {
    position: sticky;
    top: 0;
    z-index: 100;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.5rem 2rem;
    backdrop-filter: blur(10px);
    background: rgba(3, 3, 5, 0.8);
    border-bottom: 1px solid rgba(200, 100, 255, 0.1);
  }

  .back-button,
  .share-button {
    background: rgba(200, 100, 255, 0.1);
    border: 1px solid rgba(200, 100, 255, 0.3);
    color: #e0e0e0;
    padding: 0.75rem 1.5rem;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.3s ease;
    font-size: 0.95rem;
    font-weight: 500;
  }

  .back-button:hover,
  .share-button:hover {
    background: rgba(200, 100, 255, 0.2);
    border-color: rgba(200, 100, 255, 0.5);
    transform: translateY(-2px);
  }

  /* Hero Section */
  .job-hero {
    padding: 4rem 2rem;
    max-width: 1200px;
    margin: 0 auto;
    animation: fadeInUp 0.8s ease;
  }

  .hero-content {
    display: flex;
    align-items: flex-start;
    gap: 2rem;
    margin-bottom: 3rem;
  }

  .company-logo {
    width: 80px;
    height: 80px;
    background: linear-gradient(135deg, #c864ff 0%, #ff00ff 100%);
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 2rem;
    font-weight: bold;
    color: #030305;
    flex-shrink: 0;
  }

  .hero-text {
    flex: 1;
  }

  .job-title {
    font-size: 2.5rem;
    font-weight: 700;
    margin: 0 0 0.5rem 0;
    background: linear-gradient(135deg, #ffffff 0%, #c864ff 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .job-company {
    font-size: 1.1rem;
    color: #b0b0b0;
    margin: 0;
  }

  /* Quick Stats */
  .quick-stats {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1.5rem;
    padding: 2rem;
    background: rgba(200, 100, 255, 0.05);
    border-radius: 12px;
    border: 1px solid rgba(200, 100, 255, 0.1);
    backdrop-filter: blur(10px);
  }

  .stat {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .stat-label {
    font-size: 0.85rem;
    color: #888;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .stat-value {
    font-size: 1.2rem;
    font-weight: 600;
    color: #fff;
  }

  .visa-stat .stat-value {
    color: #00d9ff;
  }

  .visa-badge {
    display: inline-block;
    background: rgba(0, 217, 255, 0.2);
    border: 1px solid #00d9ff;
    padding: 0.4rem 1rem;
    border-radius: 6px;
  }

  /* Match Score Section */
  .match-score-section {
    padding: 3rem 2rem;
    max-width: 1200px;
    margin: 0 auto;
    animation: fadeInUp 0.8s ease 0.2s both;
  }

  .match-card {
    display: flex;
    align-items: center;
    gap: 3rem;
    padding: 2.5rem;
    background: linear-gradient(135deg, rgba(200, 100, 255, 0.1) 0%, rgba(255, 0, 255, 0.05) 100%);
    border: 1px solid rgba(200, 100, 255, 0.2);
    border-radius: 16px;
    backdrop-filter: blur(10px);
  }

  .match-ring-container {
    position: relative;
    width: 140px;
    height: 140px;
    flex-shrink: 0;
  }

  .match-ring {
    width: 100%;
    height: 100%;
    transform: rotate(-90deg);
  }

  .ring-bg {
    fill: none;
    stroke: rgba(200, 100, 255, 0.1);
    stroke-width: 6;
  }

  .ring-progress {
    fill: none;
    stroke: url(#gradient);
    stroke-width: 6;
    stroke-linecap: round;
    transition: stroke-dasharray 0.8s ease;
    filter: drop-shadow(0 0 10px rgba(200, 100, 255, 0.5));
  }

  .match-percentage {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-size: 2rem;
    font-weight: 700;
    color: #c864ff;
  }

  .match-text h3 {
    font-size: 1.5rem;
    margin: 0 0 0.5rem 0;
    color: #fff;
  }

  .match-text p {
    margin: 0;
    color: #b0b0b0;
    line-height: 1.6;
  }

  /* Job Content */
  .job-content {
    padding: 3rem 2rem;
    max-width: 1200px;
    margin: 0 auto;
  }

  .info-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 1.5rem;
    margin-bottom: 3rem;
    animation: fadeInUp 0.8s ease 0.3s both;
  }

  .info-card {
    padding: 1.5rem;
    background: rgba(200, 100, 255, 0.05);
    border: 1px solid rgba(200, 100, 255, 0.1);
    border-radius: 12px;
    backdrop-filter: blur(10px);
  }

  .info-card h4 {
    font-size: 0.85rem;
    color: #888;
    text-transform: uppercase;
    margin: 0 0 0.5rem 0;
    letter-spacing: 0.05em;
  }

  .info-card p {
    margin: 0;
    font-size: 1.1rem;
    font-weight: 600;
    color: #fff;
  }

  .capitalize {
    text-transform: capitalize;
  }

  /* Description Section */
  .description-section {
    margin-bottom: 3rem;
    animation: fadeInUp 0.8s ease 0.4s both;
  }

  .description-section h2,
  .why-section h2,
  .similar-jobs-section h2 {
    font-size: 1.8rem;
    margin-bottom: 1.5rem;
    color: #fff;
  }

  .description-text {
    padding: 2rem;
    background: rgba(200, 100, 255, 0.05);
    border: 1px solid rgba(200, 100, 255, 0.1);
    border-radius: 12px;
    backdrop-filter: blur(10px);
    line-height: 1.8;
  }

  .description-text p {
    margin: 1rem 0;
    color: #d0d0d0;
  }

  .description-text p:first-child {
    margin-top: 0;
  }

  .description-text p:last-child {
    margin-bottom: 0;
  }

  /* Why Section */
  .why-section {
    margin-bottom: 3rem;
    animation: fadeInUp 0.8s ease 0.5s both;
  }

  .why-list {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .why-item {
    display: flex;
    gap: 1.5rem;
    padding: 1.5rem;
    background: rgba(0, 217, 255, 0.05);
    border: 1px solid rgba(0, 217, 255, 0.2);
    border-radius: 12px;
    backdrop-filter: blur(10px);
  }

  .why-icon {
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0, 217, 255, 0.2);
    border-radius: 50%;
    color: #00d9ff;
    font-weight: bold;
    flex-shrink: 0;
  }

  .why-item h4 {
    margin: 0 0 0.5rem 0;
    color: #fff;
    font-size: 1.1rem;
  }

  .why-item p {
    margin: 0;
    color: #b0b0b0;
    font-size: 0.95rem;
  }

  /* CTA Section */
  .cta-section {
    padding: 3rem 2rem;
    max-width: 1200px;
    margin: 0 auto;
    text-align: center;
    animation: fadeInUp 0.8s ease 0.6s both;
  }

  .apply-button {
    background: linear-gradient(135deg, #c864ff 0%, #ff00ff 100%);
    border: none;
    color: #030305;
    padding: 1rem 3rem;
    font-size: 1.1rem;
    font-weight: 600;
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: 0 8px 32px rgba(200, 100, 255, 0.3);
  }

  .apply-button:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 48px rgba(200, 100, 255, 0.4);
  }

  .apply-button:active {
    transform: translateY(-2px);
  }

  .cta-text {
    margin-top: 1rem;
    color: #888;
    font-size: 0.95rem;
  }

  /* Similar Jobs */
  .similar-jobs-section {
    padding: 3rem 2rem;
    max-width: 1200px;
    margin: 0 auto;
    animation: fadeInUp 0.8s ease 0.7s both;
  }

  .similar-jobs-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 1.5rem;
  }

  .similar-job-card {
    padding: 1.5rem;
    background: rgba(200, 100, 255, 0.05);
    border: 1px solid rgba(200, 100, 255, 0.1);
    border-radius: 12px;
    backdrop-filter: blur(10px);
    cursor: pointer;
    transition: all 0.3s ease;
    animation: fadeInUp 0.6s ease forwards;
  }

  .similar-job-card:hover {
    background: rgba(200, 100, 255, 0.1);
    border-color: rgba(200, 100, 255, 0.3);
    transform: translateY(-4px);
  }

  .similar-job-logo {
    width: 50px;
    height: 50px;
    background: linear-gradient(135deg, #c864ff 0%, #ff00ff 100%);
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
    color: #030305;
    margin-bottom: 1rem;
  }

  .similar-job-card h4 {
    font-size: 1.1rem;
    margin: 0.5rem 0;
    color: #fff;
  }

  .similar-company {
    color: #888;
    font-size: 0.95rem;
    margin: 0.3rem 0;
  }

  .similar-location {
    color: #666;
    font-size: 0.9rem;
    margin: 0.3rem 0 1rem 0;
  }

  .similar-badge {
    display: inline-block;
    background: rgba(0, 217, 255, 0.2);
    border: 1px solid rgba(0, 217, 255, 0.3);
    color: #00d9ff;
    padding: 0.35rem 0.75rem;
    border-radius: 4px;
    font-size: 0.8rem;
    font-weight: 600;
  }

  /* Footer */
  .job-footer {
    padding: 2rem;
    text-align: center;
    border-top: 1px solid rgba(200, 100, 255, 0.1);
    color: #666;
    font-size: 0.9rem;
  }

  .job-footer p {
    margin: 0;
  }

  /* Error State */
  .error-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    gap: 2rem;
  }

  .error-state p {
    font-size: 1.2rem;
    color: #888;
  }

  /* Animations */
  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(30px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  /* Responsive */
  @media (max-width: 768px) {
    .job-hero {
      padding: 2rem 1rem;
    }

    .hero-content {
      flex-direction: column;
      gap: 1rem;
    }

    .job-title {
      font-size: 1.8rem;
    }

    .quick-stats {
      grid-template-columns: repeat(2, 1fr);
      gap: 1rem;
      padding: 1.5rem;
    }

    .match-card {
      flex-direction: column;
      gap: 1.5rem;
      padding: 1.5rem;
    }

    .similar-jobs-grid {
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    }

    .job-header {
      padding: 1rem;
    }

    .back-button,
    .share-button {
      padding: 0.6rem 1.2rem;
      font-size: 0.9rem;
    }
  }
`;
