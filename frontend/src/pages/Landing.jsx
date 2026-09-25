import { useState, useEffect, useRef } from "react";

const SPONSORS = [
  "Revolut", "DeepMind", "Monzo", "Barclays", "Starling Bank",
  "GSK", "Deliveroo", "ASOS", "KPMG", "BT Group", "Deloitte", "Accenture"
];

const BENEFITS = [
  {
    title: "Jobs Verified by Home Office",
    desc: "Every role is cross-checked with the UK Skilled Worker register."
  },
  {
    title: "Your CV Analyzed by ATS",
    desc: "See exactly what recruiters' software sees and what to fix."
  },
  {
    title: "Interview Coaching Included",
    desc: "Practice with real job descriptions. Know what to expect."
  }
];

const SAMPLE_JOBS = [
  {
    title: "Senior Software Engineer",
    company: "TechCorp",
    salary: "£85-95k",
    location: "London"
  },
  {
    title: "Product Manager",
    company: "FinTech Startup",
    salary: "£75-90k",
    location: "London"
  },
  {
    title: "Data Scientist",
    company: "AI Company",
    salary: "£80-100k",
    location: "London"
  }
];

function Reveal({ children, delay = 0, className = "" }) {
  const [seen, setSeen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const ob = new IntersectionObserver(
      ([e]) => e.isIntersecting && (setSeen(true), ob.disconnect()),
      { threshold: 0.15 }
    );
    if (ref.current) ob.observe(ref.current);
    return () => ob.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`${className} reveal-wrap`}
      style={{
        opacity: seen ? 1 : 0,
        transform: seen ? "translateY(0)" : "translateY(20px)",
        transitionDelay: `${delay}s`,
      }}
    >
      {children}
    </div>
  );
}

export default function Landing({ onGetStarted }) {
  return (
    <div className="landing">
      <style>{styles}</style>

      <div className="bg-grid"></div>
      <div className="bg-gradient"></div>

      {/* Nav */}
      <nav className="nav">
        <div className="nav-inner">
          <span className="logo">Arivo</span>
          <button onClick={onGetStarted} className="btn-nav">
            Sign In
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section className="hero">
        <div className="hero-inner">
          <Reveal>
            <div className="hero-badge">
              For international students seeking UK jobs
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <h1 className="hero-title">
              Find Tier-2 Visa-<br />Sponsored Jobs
            </h1>
          </Reveal>

          <Reveal delay={0.2}>
            <p className="hero-subtitle">
              47 roles matched to your skills, verified by the UK Home Office.
              <br />
              No applications that will reject your visa status.
            </p>
          </Reveal>

          <Reveal delay={0.3}>
            <button onClick={onGetStarted} className="btn-hero">
              See Your Opportunities →
            </button>
          </Reveal>

          <Reveal delay={0.4}>
            <div className="hero-stats">
              <div className="stat-item">
                <span className="stat-number">120k+</span>
                <span className="stat-label">Verified Sponsors</span>
              </div>
              <div className="stat-divider"></div>
              <div className="stat-item">
                <span className="stat-number">Live</span>
                <span className="stat-label">Market Data</span>
              </div>
              <div className="stat-divider"></div>
              <div className="stat-item">
                <span className="stat-number">Free</span>
                <span className="stat-label">Forever</span>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Jobs Preview */}
      <section className="jobs-preview">
        <div className="preview-inner">
          <Reveal>
            <h2 className="section-title">Your Job Matches</h2>
          </Reveal>

          <div className="jobs-cards">
            {SAMPLE_JOBS.map((job, idx) => (
              <Reveal key={idx} delay={0.2 + idx * 0.1} className="job-card-wrap">
                <div className="job-card">
                  <div className="job-header">
                    <div>
                      <h3 className="job-title">{job.title}</h3>
                      <p className="job-company">{job.company}</p>
                    </div>
                    <span className="badge-tier2">Tier-2 Verified</span>
                  </div>
                  <div className="job-meta">
                    <span>{job.salary}</span>
                    <span>{job.location}</span>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal delay={0.5}>
            <p className="preview-note">
              Sign up to see all {SAMPLE_JOBS.length}7+ matched roles
            </p>
          </Reveal>
        </div>
      </section>

      {/* Benefits */}
      <section className="benefits">
        <div className="benefits-inner">
          <Reveal>
            <h2 className="section-title">How It Works</h2>
          </Reveal>

          <div className="benefits-grid">
            {BENEFITS.map((b, i) => (
              <Reveal key={i} delay={0.2 + i * 0.1} className="benefit-card-wrap">
                <div className="benefit-card">
                  <div className="benefit-icon">{b.icon}</div>
                  <h3 className="benefit-title">{b.title}</h3>
                  <p className="benefit-desc">{b.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Trust */}
      <section className="trust">
        <div className="trust-inner">
          <Reveal>
            <h3 className="trust-title">Trusted by Students at</h3>
          </Reveal>

          <Reveal delay={0.1}>
            <div className="sponsors-grid">
              {SPONSORS.map((s, i) => (
                <div key={i} className="sponsor-pill">
                  {s}
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* CTA */}
      <section className="cta">
        <div className="cta-inner">
          <Reveal>
            <h2 className="cta-title">Ready to find your place in the UK?</h2>
          </Reveal>

          <Reveal delay={0.1}>
            <p className="cta-subtitle">
              Join international students discovering Tier-2 opportunities—no visa rejection risk.
            </p>
          </Reveal>

          <Reveal delay={0.2}>
            <button onClick={onGetStarted} className="btn-cta">
              Start Free →
            </button>
          </Reveal>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-inner">
          <div className="footer-left">
            <span className="logo">Arivo</span>
            <p>AI-powered visa-sponsored job search for international students.</p>
          </div>
          <div className="footer-links">
            <span>Privacy</span>
            <span>Terms</span>
            <span>Contact</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

const styles = `
* { box-sizing: border-box; }

.landing {
  background: #030305;
  color: #F8FAFC;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  min-height: 100vh;
  position: relative;
  overflow-x: hidden;
}

.bg-grid {
  position: fixed;
  inset: 0;
  background-image:
    linear-gradient(to right, rgba(255,255,255,0.02) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(255,255,255,0.02) 1px, transparent 1px);
  background-size: 50px 50px;
  pointer-events: none;
  z-index: 0;
}

.bg-gradient {
  position: fixed;
  inset: 0;
  background: radial-gradient(600px at 50% 20%, rgba(139, 92, 246, 0.08), transparent);
  pointer-events: none;
  z-index: 0;
}

/* ── REVEAL ANIMATION ── */
.reveal-wrap {
  transition: opacity 0.8s ease, transform 0.8s cubic-bezier(0.2, 0.8, 0.2, 1);
}

/* ── NAV ── */
.nav {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  background: rgba(3, 3, 5, 0.5);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.nav-inner {
  max-width: 1200px;
  margin: 0 auto;
  padding: 1.2rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.logo {
  font-size: 1.2rem;
  font-weight: 800;
  letter-spacing: -0.01em;
}

.btn-nav {
  background: rgba(139, 92, 246, 0.1);
  border: 1px solid rgba(139, 92, 246, 0.3);
  color: #F8FAFC;
  padding: 8px 18px;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-nav:hover {
  background: rgba(139, 92, 246, 0.2);
  border-color: rgba(139, 92, 246, 0.5);
}

/* ── HERO ── */
.hero {
  position: relative;
  z-index: 1;
  min-height: 70vh;
  display: flex;
  align-items: center;
  padding-top: 4rem;
}

.hero-inner {
  max-width: 750px;
  margin: 0 auto;
  padding: 0 2rem;
  text-align: center;
}

.hero-badge {
  display: inline-block;
  background: rgba(139, 92, 246, 0.08);
  border: 1px solid rgba(139, 92, 246, 0.15);
  color: #8B5CF6;
  padding: 0.6rem 1.2rem;
  border-radius: 8px;
  font-size: 0.8rem;
  font-weight: 600;
  margin-bottom: 1.5rem;
}

.hero-title {
  font-size: clamp(2.2rem, 6vw, 3.5rem);
  font-weight: 800;
  letter-spacing: -0.02em;
  margin: 0 0 1rem;
  line-height: 1.2;
}

.hero-subtitle {
  font-size: 1rem;
  color: #A0AEC0;
  line-height: 1.6;
  margin: 0 0 2rem;
  max-width: 550px;
  margin-left: auto;
  margin-right: auto;
}

.btn-hero {
  background: linear-gradient(135deg, #8B5CF6, #D946EF);
  color: #fff;
  border: none;
  padding: 14px 28px;
  border-radius: 10px;
  font-size: 0.95rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 6px 20px rgba(139, 92, 246, 0.25);
  margin-bottom: 2.5rem;
}

.btn-hero:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 32px rgba(139, 92, 246, 0.4);
}

.hero-stats {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 2rem;
  background: rgba(20, 20, 30, 0.4);
  border: 1px solid rgba(139, 92, 246, 0.12);
  border-radius: 14px;
  padding: 2rem;
  backdrop-filter: blur(12px);
}

.stat-item {
  display: flex;
  flex-direction: column;
  text-align: center;
}

.stat-number {
  font-size: 1.5rem;
  font-weight: 800;
  color: #D946EF;
  line-height: 1;
  margin-bottom: 0.3rem;
}

.stat-label {
  font-size: 0.75rem;
  color: #94A3B8;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.stat-divider {
  width: 1px;
  height: 30px;
  background: rgba(255, 255, 255, 0.1);
}

/* ── JOBS PREVIEW ── */
.jobs-preview {
  position: relative;
  z-index: 1;
  padding: 4rem 2rem;
  background: linear-gradient(180deg, transparent, rgba(139, 92, 246, 0.03));
}

.preview-inner {
  max-width: 950px;
  margin: 0 auto;
}

.section-title {
  font-size: 1.8rem;
  font-weight: 800;
  margin: 0 0 2.5rem;
  text-align: center;
  letter-spacing: -0.01em;
}

.jobs-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
  margin-bottom: 2rem;
}

.job-card-wrap {
  display: block;
}

.job-card {
  background: rgba(20, 20, 30, 0.6);
  border: 1px solid rgba(139, 92, 246, 0.15);
  border-radius: 12px;
  padding: 2rem;
  transition: all 0.3s ease;
  backdrop-filter: blur(12px);
}

.job-card:hover {
  border-color: rgba(139, 92, 246, 0.3);
  background: rgba(20, 20, 30, 0.8);
  transform: translateY(-4px);
  box-shadow: 0 16px 32px rgba(139, 92, 246, 0.1);
}

.job-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.job-title {
  font-size: 1.1rem;
  font-weight: 700;
  margin: 0 0 0.3rem;
  color: #F8FAFC;
}

.job-company {
  font-size: 0.9rem;
  color: #94A3B8;
  margin: 0;
}

.badge-tier2 {
  background: rgba(16, 185, 129, 0.15);
  border: 1px solid rgba(16, 185, 129, 0.3);
  color: #10B981;
  padding: 0.4rem 0.8rem;
  border-radius: 6px;
  font-size: 0.8rem;
  font-weight: 600;
  white-space: nowrap;
}

.job-meta {
  display: flex;
  gap: 1.5rem;
  font-size: 0.9rem;
  color: #A0AEC0;
}

.job-meta span:first-child {
  color: #D946EF;
  font-weight: 600;
}

.preview-note {
  text-align: center;
  color: #94A3B8;
  font-size: 0.95rem;
  margin: 0;
}

/* ── BENEFITS ── */
.benefits {
  position: relative;
  z-index: 1;
  padding: 4rem 2rem;
}

.benefits-inner {
  max-width: 1000px;
  margin: 0 auto;
}

.benefits-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 2rem;
}

.benefit-card-wrap {
  display: block;
}

.benefit-card {
  background: rgba(20, 20, 30, 0.3);
  border: 1px solid rgba(139, 92, 246, 0.1);
  border-radius: 10px;
  padding: 2rem;
  text-align: center;
  transition: all 0.3s ease;
  backdrop-filter: blur(8px);
}

.benefit-card:hover {
  border-color: rgba(139, 92, 246, 0.25);
  background: rgba(20, 20, 30, 0.5);
  transform: translateY(-3px);
}

.benefit-title {
  font-size: 1rem;
  font-weight: 700;
  margin: 0 0 0.6rem;
  color: #F8FAFC;
}

.benefit-desc {
  font-size: 0.9rem;
  color: #A0AEC0;
  line-height: 1.5;
  margin: 0;
}

/* ── TRUST ── */
.trust {
  position: relative;
  z-index: 1;
  padding: 4rem 2rem;
  text-align: center;
  background: rgba(255, 255, 255, 0.005);
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.trust-inner {
  max-width: 900px;
  margin: 0 auto;
}

.trust-title {
  font-size: 0.8rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #94A3B8;
  margin-bottom: 2rem;
}

.sponsors-grid {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 1.5rem;
}

.sponsor-pill {
  background: rgba(20, 20, 30, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 10px;
  padding: 0.8rem 1.5rem;
  font-size: 0.9rem;
  font-weight: 600;
  color: #E2E8F0;
  transition: all 0.3s ease;
}

.sponsor-pill:hover {
  background: rgba(139, 92, 246, 0.1);
  border-color: rgba(139, 92, 246, 0.3);
}

/* ── CTA ── */
.cta {
  position: relative;
  z-index: 1;
  padding: 4rem 2rem;
}

.cta-inner {
  max-width: 550px;
  margin: 0 auto;
  text-align: center;
}

.cta-title {
  font-size: 1.9rem;
  font-weight: 800;
  margin: 0 0 1rem;
  letter-spacing: -0.01em;
}

.cta-subtitle {
  font-size: 1rem;
  color: #A0AEC0;
  line-height: 1.6;
  margin: 0 0 2rem;
}

.btn-cta {
  background: #10B981;
  color: #000;
  border: none;
  padding: 14px 32px;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 8px 20px rgba(16, 185, 129, 0.3);
}

.btn-cta:hover {
  transform: translateY(-2px);
  background: #34D399;
  box-shadow: 0 12px 28px rgba(16, 185, 129, 0.4);
}

/* ── FOOTER ── */
.footer {
  position: relative;
  z-index: 1;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  padding: 2.5rem 2rem;
  background: rgba(255, 255, 255, 0.005);
}

.footer-inner {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 3rem;
}

.footer-left {
  flex: 1;
  min-width: 250px;
}

.footer-left .logo {
  display: block;
  margin-bottom: 1rem;
  font-size: 1.1rem;
}

.footer-left p {
  font-size: 0.9rem;
  color: #94A3B8;
  line-height: 1.6;
  margin: 0;
}

.footer-links {
  display: flex;
  gap: 2rem;
}

.footer-links span {
  font-size: 0.9rem;
  color: #94A3B8;
  cursor: pointer;
  transition: color 0.3s ease;
}

.footer-links span:hover {
  color: #F8FAFC;
}

/* ── MOBILE ── */
@media (max-width: 768px) {
  .hero-inner {
    padding: 0 1.5rem;
  }

  .hero-title {
    font-size: 2rem;
  }

  .hero-subtitle {
    font-size: 1rem;
  }

  .hero-stats {
    flex-wrap: wrap;
    gap: 1.5rem;
    padding: 1.5rem;
  }

  .jobs-cards {
    grid-template-columns: 1fr;
  }

  .benefits-grid {
    grid-template-columns: 1fr;
  }

  .section-title {
    font-size: 1.5rem;
  }

  .cta-title {
    font-size: 1.6rem;
  }

  .footer-inner {
    flex-direction: column;
    gap: 2rem;
  }

  .nav-inner {
    padding: 1rem 1.5rem;
  }
}
`;
