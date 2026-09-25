import { useState, useEffect, useRef } from "react";

const SPONSORS = [
  "Revolut", "DeepMind", "Monzo", "Barclays", "Starling Bank",
  "GSK", "Deliveroo", "ASOS", "KPMG", "BT Group", "Deloitte", "Accenture"
];

const SAMPLE_JOBS = [
  { title: "Senior Software Engineer", company: "TechCorp", salary: "£85-95k", location: "London" },
  { title: "Product Manager", company: "FinTech Startup", salary: "£75-90k", location: "London" },
  { title: "Data Scientist", company: "AI Company", salary: "£80-100k", location: "London" }
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

      {/* Nav */}
      <nav className="nav">
        <div className="nav-inner">
          <span className="logo">Arivo</span>
          <button onClick={onGetStarted} className="btn-nav">Sign In</button>
        </div>
      </nav>

      {/* Hero */}
      <section className="hero">
        <Reveal>
          <h1 className="hero-title">Tier-2 Visa-Sponsored Jobs for International Students</h1>
        </Reveal>
        <Reveal delay={0.1}>
          <p className="hero-subtitle">Verified by Home Office. Zero rejection risk. Completely free.</p>
        </Reveal>
        <Reveal delay={0.2}>
          <button onClick={onGetStarted} className="btn-hero">See Opportunities →</button>
        </Reveal>
      </section>

      {/* Stats */}
      <section className="stats">
        <Reveal className="stat-box">
          <div className="stat-number">120k+</div>
          <div className="stat-label">Verified Sponsors</div>
        </Reveal>
        <Reveal delay={0.05} className="stat-box">
          <div className="stat-number">Live</div>
          <div className="stat-label">Market Data</div>
        </Reveal>
        <Reveal delay={0.1} className="stat-box">
          <div className="stat-number">Free</div>
          <div className="stat-label">Forever</div>
        </Reveal>
      </section>

      {/* Jobs Preview */}
      <section className="jobs-preview">
        <Reveal>
          <h2>Sample Roles</h2>
        </Reveal>
        <div className="jobs-grid">
          {SAMPLE_JOBS.map((job, idx) => (
            <Reveal key={idx} delay={0.1 * idx} className="job-card-wrap">
              <div className="job-card">
                <div className="job-top">
                  <div>
                    <div className="job-title">{job.title}</div>
                    <div className="job-company">{job.company}</div>
                  </div>
                  <span className="badge">Tier-2</span>
                </div>
                <div className="job-meta">
                  <span>{job.salary}</span>
                  <span>{job.location}</span>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="how">
        <Reveal>
          <h2>How It Works</h2>
        </Reveal>
        <div className="how-grid">
          <Reveal delay={0.05} className="how-card">
            <div className="how-step">1</div>
            <h3>Sign Up</h3>
            <p>Tell us your target role and visa status</p>
          </Reveal>
          <Reveal delay={0.1} className="how-card">
            <div className="how-step">2</div>
            <h3>Browse Matches</h3>
            <p>Every job verified against Home Office register</p>
          </Reveal>
          <Reveal delay={0.15} className="how-card">
            <div className="how-step">3</div>
            <h3>Apply Confidently</h3>
            <p>No applications rejected due to visa status</p>
          </Reveal>
        </div>
      </section>

      {/* Sponsors */}
      <section className="sponsors">
        <Reveal>
          <p className="sponsors-label">Trusted by students applying to:</p>
        </Reveal>
        <Reveal delay={0.05}>
          <div className="sponsors-grid">
            {SPONSORS.map((s, i) => (
              <div key={i} className="sponsor-tag">{s}</div>
            ))}
          </div>
        </Reveal>
      </section>

      {/* CTA */}
      <section className="cta">
        <Reveal>
          <h2>Ready to start?</h2>
        </Reveal>
        <Reveal delay={0.1}>
          <p>Join students finding visa-sponsored roles with confidence</p>
        </Reveal>
        <Reveal delay={0.2}>
          <button onClick={onGetStarted} className="btn-cta">Get Started Free →</button>
        </Reveal>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-inner">
          <span className="logo">Arivo</span>
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
  background: linear-gradient(135deg, #030305 0%, #0a0810 100%);
  color: #e0e0e0;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  min-height: 100vh;
  position: relative;
}

.reveal-wrap {
  transition: opacity 0.8s ease, transform 0.8s cubic-bezier(0.2, 0.8, 0.2, 1);
}

/* NAV */
.nav {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  background: rgba(3, 3, 5, 0.7);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(200, 100, 255, 0.1);
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
  color: #fff;
  letter-spacing: -0.01em;
}

.btn-nav {
  background: rgba(200, 100, 255, 0.1);
  border: 1px solid rgba(200, 100, 255, 0.3);
  color: #e0e0e0;
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-nav:hover {
  background: rgba(200, 100, 255, 0.2);
  border-color: rgba(200, 100, 255, 0.5);
}

/* HERO */
.hero {
  padding: 8rem 2rem 4rem;
  max-width: 900px;
  margin: 0 auto;
  text-align: center;
}

.hero-title {
  font-size: clamp(2.5rem, 7vw, 4rem);
  font-weight: 700;
  margin: 0 0 1.5rem;
  line-height: 1.2;
  background: linear-gradient(135deg, #ffffff 0%, #c864ff 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.hero-subtitle {
  font-size: 1.1rem;
  color: #a0a0a0;
  margin: 0 0 2.5rem;
  line-height: 1.6;
}

.btn-hero {
  background: linear-gradient(135deg, #c864ff 0%, #ff00ff 100%);
  border: none;
  color: #030305;
  padding: 14px 32px;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 8px 32px rgba(200, 100, 255, 0.3);
}

.btn-hero:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 48px rgba(200, 100, 255, 0.4);
}

/* STATS */
.stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1.5rem;
  padding: 3rem 2rem;
  max-width: 800px;
  margin: 0 auto;
}

.stat-box {
  padding: 2rem;
  background: rgba(200, 100, 255, 0.05);
  border: 1px solid rgba(200, 100, 255, 0.1);
  border-radius: 12px;
  text-align: center;
  backdrop-filter: blur(10px);
}

.stat-number {
  font-size: 2rem;
  font-weight: 700;
  color: #c864ff;
  margin-bottom: 0.5rem;
}

.stat-label {
  font-size: 0.85rem;
  color: #888;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

/* JOBS PREVIEW */
.jobs-preview {
  padding: 4rem 2rem;
  max-width: 1100px;
  margin: 0 auto;
}

.jobs-preview h2 {
  font-size: 1.8rem;
  font-weight: 700;
  margin: 0 0 2rem;
  text-align: center;
}

.jobs-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
}

.job-card-wrap {
  display: block;
}

.job-card {
  padding: 1.5rem;
  background: rgba(200, 100, 255, 0.05);
  border: 1px solid rgba(200, 100, 255, 0.1);
  border-radius: 10px;
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
}

.job-card:hover {
  background: rgba(200, 100, 255, 0.1);
  border-color: rgba(200, 100, 255, 0.3);
  transform: translateY(-2px);
}

.job-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  margin-bottom: 1rem;
}

.job-title {
  font-size: 1rem;
  font-weight: 600;
  color: #fff;
  margin-bottom: 0.3rem;
}

.job-company {
  font-size: 0.9rem;
  color: #888;
}

.badge {
  display: inline-block;
  background: rgba(0, 217, 255, 0.2);
  border: 1px solid rgba(0, 217, 255, 0.3);
  color: #00d9ff;
  padding: 0.35rem 0.75rem;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: 600;
  white-space: nowrap;
}

.job-meta {
  display: flex;
  gap: 1rem;
  font-size: 0.9rem;
  color: #a0a0a0;
}

/* HOW IT WORKS */
.how {
  padding: 4rem 2rem;
  max-width: 1000px;
  margin: 0 auto;
}

.how h2 {
  font-size: 1.8rem;
  font-weight: 700;
  margin: 0 0 2.5rem;
  text-align: center;
}

.how-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 2rem;
}

.how-card {
  display: block;
}

.how-card > div {
  padding: 2rem;
  background: rgba(200, 100, 255, 0.05);
  border: 1px solid rgba(200, 100, 255, 0.1);
  border-radius: 12px;
  backdrop-filter: blur(10px);
  text-align: center;
}

.how-step {
  font-size: 2.5rem;
  font-weight: 700;
  color: #c864ff;
  margin-bottom: 1rem;
}

.how-card h3 {
  font-size: 1.1rem;
  margin: 0 0 0.5rem;
  color: #fff;
}

.how-card p {
  font-size: 0.9rem;
  color: #888;
  margin: 0;
}

/* SPONSORS */
.sponsors {
  padding: 4rem 2rem;
  max-width: 1100px;
  margin: 0 auto;
}

.sponsors-label {
  text-align: center;
  color: #888;
  margin: 0 0 2rem;
  font-size: 0.95rem;
}

.sponsors-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  justify-content: center;
  align-items: center;
}

.sponsor-tag {
  padding: 0.6rem 1.2rem;
  background: rgba(200, 100, 255, 0.08);
  border: 1px solid rgba(200, 100, 255, 0.1);
  border-radius: 6px;
  font-size: 0.9rem;
  color: #d0d0d0;
  backdrop-filter: blur(10px);
}

/* CTA */
.cta {
  padding: 4rem 2rem;
  text-align: center;
  max-width: 700px;
  margin: 0 auto;
}

.cta h2 {
  font-size: 2rem;
  font-weight: 700;
  margin: 0 0 1rem;
}

.cta p {
  font-size: 1.05rem;
  color: #a0a0a0;
  margin: 0 0 2rem;
}

.btn-cta {
  background: linear-gradient(135deg, #c864ff 0%, #ff00ff 100%);
  border: none;
  color: #030305;
  padding: 16px 36px;
  border-radius: 8px;
  font-size: 1.05rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 8px 32px rgba(200, 100, 255, 0.3);
}

.btn-cta:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 48px rgba(200, 100, 255, 0.4);
}

/* FOOTER */
.footer {
  padding: 2.5rem;
  border-top: 1px solid rgba(200, 100, 255, 0.1);
  background: rgba(200, 100, 255, 0.02);
}

.footer-inner {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 2rem;
}

.footer-links {
  display: flex;
  gap: 2rem;
  font-size: 0.9rem;
  color: #888;
}

/* RESPONSIVE */
@media (max-width: 768px) {
  .hero {
    padding: 6rem 1.5rem 2rem;
  }

  .hero-title {
    font-size: 2rem;
  }

  .stats {
    grid-template-columns: 1fr;
    padding: 2rem 1.5rem;
  }

  .how-grid {
    grid-template-columns: 1fr;
  }

  .footer-inner {
    flex-direction: column;
    text-align: center;
  }

  .footer-links {
    justify-content: center;
  }
}
`;
