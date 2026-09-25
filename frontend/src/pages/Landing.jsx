import { useState, useEffect, useRef } from "react";

const SAMPLE_JOBS = [
  { title: "Senior Software Engineer", company: "DeepMind", salary: "£85-95k", location: "London", sponsor: true },
  { title: "Machine Learning Engineer", company: "Monzo", salary: "£75-90k", location: "London", sponsor: true },
  { title: "Data Scientist", company: "Revolut", salary: "£80-100k", location: "London", sponsor: true }
];

const TOOLS = [
  {
    title: "Sponsor Verification",
    desc: "Every company checked live against the UK Home Office register (120,000+ sponsors). Know who actually sponsors before you apply."
  },
  {
    title: "ATS Readiness Analyzer",
    desc: "CV scored the way hiring software actually reads it. Catch parsing issues, weak keywords, and international CV conventions (like photos) that quietly fail UK screening."
  },
  {
    title: "AI Career Coach",
    desc: "Grounded in real job postings, not generic advice. Get coached on the actual roles companies are hiring for right now."
  },
  {
    title: "Skill Gap Analysis",
    desc: "See what skills you're missing for your target role against real London market demand. Get free resources to close each gap."
  }
];

const WHY_ARIVO = [
  {
    problem: "Wasted applications",
    solution: "Most UK jobs aren't open to international hires. We filter to sponsored roles only—so you apply to opportunities that exist."
  },
  {
    problem: "CV rejection uncertainty",
    solution: "Know if rejection was your CV or your visa status. ATS analyzer catches formatting issues that generic tools miss."
  },
  {
    problem: "Generic job advice",
    solution: "Built for international students by an international student. Advice grounded in real UK market data, not copied from blogs."
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

      {/* Nav */}
      <nav className="nav">
        <div className="nav-inner">
          <span className="logo">Arivo AI</span>
          <button onClick={onGetStarted} className="btn-nav">Sign In</button>
        </div>
      </nav>

      {/* Hero */}
      <section className="hero">
        <div className="hero-content">
          <Reveal>
            <p className="hero-label">FOR INTERNATIONAL STUDENTS NAVIGATING UK HIRING</p>
          </Reveal>
          <Reveal delay={0.1}>
            <h1 className="hero-title">Find Jobs from Companies That Actually Sponsor Visas</h1>
          </Reveal>
          <Reveal delay={0.2}>
            <p className="hero-desc">Stop applying to roles that don't sponsor. Every job verified against the UK Home Office register in real time. Built by an international student. Built for you.</p>
          </Reveal>
          <Reveal delay={0.3}>
            <button onClick={onGetStarted} className="btn-hero">Explore Opportunities →</button>
          </Reveal>
        </div>
        <Reveal delay={0.4} className="hero-stats">
          <div className="stat">
            <div className="stat-num">120k+</div>
            <div className="stat-txt">Sponsors Verified Live</div>
          </div>
          <div className="stat">
            <div className="stat-num">Real-time</div>
            <div className="stat-txt">Market Data</div>
          </div>
          <div className="stat">
            <div className="stat-num">Free</div>
            <div className="stat-txt">Early Access</div>
          </div>
        </Reveal>
      </section>

      {/* The Problem */}
      <section className="problem">
        <Reveal>
          <h2>Why Generic Job Boards Don't Work</h2>
        </Reveal>
        <div className="problem-grid">
          <Reveal delay={0.1} className="problem-card">
            <h3>No visa sponsorship filter</h3>
            <p>Job boards show all roles. 94% don't sponsor international hires. You apply blindly and get rejected or ghosted—wasting weeks with no feedback on why.</p>
          </Reveal>
          <Reveal delay={0.2} className="problem-card">
            <h3>Your CV gets silently rejected</h3>
            <p>ATS software parses CVs in seconds. International conventions like photos or dates quietly fail UK screening. You never know if rejection was your skills or your formatting.</p>
          </Reveal>
          <Reveal delay={0.3} className="problem-card">
            <h3>Generic advice doesn't fit your situation</h3>
            <p>Most job coaching is written for UK citizens. Visa timelines, sponsorship threshold salary, visa status disclosure in applications—nobody covers this.</p>
          </Reveal>
        </div>
      </section>

      {/* Why Arivo */}
      <section className="why">
        <Reveal>
          <h2>Arivo AI's Approach</h2>
        </Reveal>
        <div className="why-grid">
          {WHY_ARIVO.map((item, i) => (
            <Reveal key={i} delay={0.1 * (i + 1)} className="why-card">
              <div>
                <div className="why-problem">{item.problem}</div>
                <div className="why-arrow">↓</div>
                <div className="why-solution">{item.solution}</div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Tools */}
      <section className="benefits">
        <Reveal>
          <h2>The Tools You Get</h2>
        </Reveal>
        <div className="benefits-grid">
          {TOOLS.map((tool, i) => (
            <Reveal key={i} delay={0.1 * (i + 1)} className="benefit-item">
              <h3>{tool.title}</h3>
              <p>{tool.desc}</p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Sample Jobs */}
      <section className="jobs">
        <Reveal>
          <h2>Sample Roles from Verified Sponsors</h2>
          <p className="jobs-desc">Real opportunities from companies on the UK Home Office sponsor register. Sign in to see roles matched to your skills.</p>
        </Reveal>
        <div className="jobs-grid">
          {SAMPLE_JOBS.map((job, idx) => (
            <Reveal key={idx} delay={0.1 * idx} className="job-card">
              <div className="job-header">
                <div>
                  <h4 className="job-title">{job.title}</h4>
                  <p className="job-company">{job.company}</p>
                </div>
                <span className="badge">✓ Verified Sponsor</span>
              </div>
              <div className="job-details">
                <span className="job-salary">{job.salary}</span>
                <span className="job-location">{job.location}</span>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="how">
        <Reveal>
          <h2>Your Workflow</h2>
        </Reveal>
        <div className="how-grid">
          <Reveal delay={0.1} className="how-card">
            <div className="step">1</div>
            <h3>Create Your Profile</h3>
            <p>Tell us your target role, experience, and visa type. We use this to match and filter.</p>
          </Reveal>
          <Reveal delay={0.2} className="how-card">
            <div className="step">2</div>
            <h3>Get Job Matches + CV Feedback</h3>
            <p>Browse AI-matched roles from verified sponsors. Get ATS readiness score on your CV to fix formatting issues before applying.</p>
          </Reveal>
          <Reveal delay={0.3} className="how-card">
            <div className="step">3</div>
            <h3>Apply Strategically</h3>
            <p>Use the AI coach to understand each role and company better. Apply with better context than generic job boards give you.</p>
          </Reveal>
        </div>
      </section>

      {/* Trust */}
      <section className="trust">
        <Reveal>
          <h2>Built on Real Data</h2>
          <p>Every company on our platform is verified against the UK Home Office's official Skilled Worker sponsor register, updated live.</p>
        </Reveal>
        <Reveal delay={0.1} className="trust-stats">
          <div className="trust-stat">
            <div className="trust-num">120,000+</div>
            <div className="trust-label">Verified Companies</div>
          </div>
          <div className="trust-stat">
            <div className="trust-num">Live</div>
            <div className="trust-label">Data Updates Daily</div>
          </div>
          <div className="trust-stat">
            <div className="trust-num">100%</div>
            <div className="trust-label">Real Market Data</div>
          </div>
        </Reveal>
      </section>

      {/* FAQ */}
      <section className="faq">
        <Reveal>
          <h2>Questions We Get Asked</h2>
        </Reveal>
        <div className="faq-grid">
          <Reveal delay={0.1} className="faq-item">
            <h4>Is this really free?</h4>
            <p>Yes. Early access is free. Arivo AI is in active development, and we're building tools for international students, not a paid product (yet).</p>
          </Reveal>
          <Reveal delay={0.2} className="faq-item">
            <h4>How do you verify sponsorship?</h4>
            <p>We cross-check every company against the UK Home Office's official Skilled Worker register. It's updated daily from government data—the same list employers are on.</p>
          </Reveal>
          <Reveal delay={0.3} className="faq-item">
            <h4>Why build this?</h4>
            <p>I'm an international MSc student. I spent months checking if companies sponsor by opening 10 tabs and manually cross-referencing the Home Office register. This tool should exist. So I built it.</p>
          </Reveal>
          <Reveal delay={0.4} className="faq-item">
            <h4>What if I still get rejected?</h4>
            <p>We find roles from companies that sponsor. Rejection can happen for many reasons—CV format, skills gap, competition. That's why we have ATS analysis and a coach to help you improve.</p>
          </Reveal>
        </div>
      </section>

      {/* CTA */}
      <section className="cta">
        <Reveal>
          <h2>Start With Better Information</h2>
          <p>Know which companies actually sponsor before you apply. Get CV feedback before you hit send.</p>
        </Reveal>
        <Reveal delay={0.1}>
          <button onClick={onGetStarted} className="btn-cta">Sign In Free →</button>
        </Reveal>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-inner">
          <span className="logo">Arivo AI</span>
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
  color: #d0d0d0;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  min-height: 100vh;
  position: relative;
  line-height: 1.6;
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
  padding: 1rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.logo {
  font-size: 1.2rem;
  font-weight: 800;
  color: #fff;
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
  padding: 8rem 2rem 5rem;
  max-width: 1100px;
  margin: 0 auto;
}

.hero-content {
  margin-bottom: 4rem;
}

.hero-label {
  font-size: 0.85rem;
  color: #c864ff;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  margin: 0 0 1rem;
  font-weight: 600;
}

.hero-title {
  font-size: clamp(2.5rem, 6vw, 3.8rem);
  font-weight: 700;
  line-height: 1.2;
  margin: 0 0 1.5rem;
  color: #fff;
}

.hero-desc {
  font-size: 1.1rem;
  color: #a0a0a0;
  margin: 0 0 2rem;
  line-height: 1.7;
  max-width: 700px;
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

.hero-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 2rem;
  padding: 2.5rem;
  background: rgba(200, 100, 255, 0.05);
  border: 1px solid rgba(200, 100, 255, 0.1);
  border-radius: 12px;
  backdrop-filter: blur(10px);
}

.stat {
  text-align: center;
}

.stat-num {
  font-size: 2.2rem;
  font-weight: 700;
  color: #c864ff;
  margin-bottom: 0.5rem;
}

.stat-txt {
  font-size: 0.85rem;
  color: #888;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

/* PROBLEM */
.problem {
  padding: 5rem 2rem;
  max-width: 1100px;
  margin: 0 auto;
  background: linear-gradient(180deg, rgba(200, 100, 255, 0.02) 0%, transparent 100%);
}

.problem h2,
.why h2,
.benefits h2,
.jobs h2,
.how h2,
.trust h2,
.faq h2,
.cta h2 {
  font-size: 2.2rem;
  font-weight: 700;
  margin: 0 0 3rem;
  text-align: center;
  color: #fff;
}

.problem-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
}

.problem-card {
  padding: 2rem;
  background: rgba(200, 100, 255, 0.05);
  border: 1px solid rgba(200, 100, 255, 0.1);
  border-radius: 10px;
  backdrop-filter: blur(10px);
}

.problem-card h3 {
  font-size: 1.15rem;
  margin: 0 0 1rem;
  color: #fff;
}

.problem-card p {
  font-size: 0.95rem;
  color: #a0a0a0;
  margin: 0;
  line-height: 1.6;
}

/* WHY */
.why {
  padding: 5rem 2rem;
  max-width: 1000px;
  margin: 0 auto;
}

.why-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
}

.why-card {
  display: block;
}

.why-card > div {
  padding: 2rem;
  background: rgba(200, 100, 255, 0.06);
  border: 1px solid rgba(200, 100, 255, 0.12);
  border-radius: 10px;
  backdrop-filter: blur(10px);
}

.why-problem {
  font-size: 1.1rem;
  font-weight: 600;
  color: #ff6b9d;
  margin-bottom: 0.8rem;
}

.why-arrow {
  font-size: 1.5rem;
  color: #c864ff;
  margin: 0.5rem 0;
}

.why-solution {
  font-size: 1.1rem;
  font-weight: 600;
  color: #00d9ff;
}

/* BENEFITS */
.benefits {
  padding: 5rem 2rem;
  max-width: 1100px;
  margin: 0 auto;
}

.benefits-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 2rem;
}

.benefit-item {
  display: block;
  padding: 2rem;
  background: rgba(200, 100, 255, 0.05);
  border: 1px solid rgba(200, 100, 255, 0.1);
  border-radius: 10px;
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
}

.benefit-item:hover {
  background: rgba(200, 100, 255, 0.08);
  border-color: rgba(200, 100, 255, 0.2);
}

.benefit-item h3 {
  font-size: 1.1rem;
  margin: 0 0 1rem;
  color: #fff;
}

.benefit-item p {
  font-size: 0.95rem;
  color: #a0a0a0;
  margin: 0;
  line-height: 1.6;
}

/* JOBS */
.jobs {
  padding: 5rem 2rem;
  max-width: 1100px;
  margin: 0 auto;
}

.jobs-desc {
  font-size: 1rem;
  color: #a0a0a0;
  text-align: center;
  margin: 0 0 3rem;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
}

.jobs-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
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

.job-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  margin-bottom: 1rem;
}

.job-title {
  font-size: 1rem;
  font-weight: 600;
  margin: 0 0 0.3rem;
  color: #fff;
}

.job-company {
  font-size: 0.9rem;
  color: #888;
  margin: 0;
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

.job-details {
  display: flex;
  gap: 1.5rem;
  font-size: 0.9rem;
  color: #a0a0a0;
}

/* HOW */
.how {
  padding: 5rem 2rem;
  max-width: 1000px;
  margin: 0 auto;
}

.how-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 2rem;
}

.how-card {
  display: block;
  padding: 2.5rem;
  background: rgba(200, 100, 255, 0.05);
  border: 1px solid rgba(200, 100, 255, 0.1);
  border-radius: 10px;
  backdrop-filter: blur(10px);
  text-align: center;
}

.step {
  font-size: 2.5rem;
  font-weight: 700;
  color: #c864ff;
  margin-bottom: 1rem;
}

.how-card h3 {
  font-size: 1.15rem;
  margin: 0 0 0.8rem;
  color: #fff;
}

.how-card p {
  font-size: 0.95rem;
  color: #a0a0a0;
  margin: 0;
  line-height: 1.6;
}

/* TRUST */
.trust {
  padding: 5rem 2rem;
  max-width: 1100px;
  margin: 0 auto;
  text-align: center;
}

.trust h2 {
  margin-bottom: 0.5rem;
}

.trust > p {
  font-size: 1rem;
  color: #a0a0a0;
  margin: 0 0 3rem;
}

.trust-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 2rem;
}

.trust-stat {
  text-align: center;
  padding: 2rem;
  background: rgba(200, 100, 255, 0.05);
  border: 1px solid rgba(200, 100, 255, 0.1);
  border-radius: 10px;
  backdrop-filter: blur(10px);
}

.trust-num {
  font-size: 2rem;
  font-weight: 700;
  color: #c864ff;
  display: block;
  margin-bottom: 0.5rem;
}

.trust-label {
  font-size: 0.9rem;
  color: #a0a0a0;
  display: block;
}

.sponsors-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  justify-content: center;
}

.sponsor-badge {
  padding: 0.7rem 1.3rem;
  background: rgba(200, 100, 255, 0.08);
  border: 1px solid rgba(200, 100, 255, 0.12);
  border-radius: 6px;
  font-size: 0.9rem;
  color: #d0d0d0;
  backdrop-filter: blur(10px);
}

/* FAQ */
.faq {
  padding: 5rem 2rem;
  max-width: 900px;
  margin: 0 auto;
}

.faq-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 2rem;
}

.faq-item {
  display: block;
  padding: 2rem;
  background: rgba(200, 100, 255, 0.05);
  border: 1px solid rgba(200, 100, 255, 0.1);
  border-radius: 10px;
  backdrop-filter: blur(10px);
}

.faq-item h4 {
  font-size: 1.05rem;
  margin: 0 0 1rem;
  color: #fff;
}

.faq-item p {
  font-size: 0.95rem;
  color: #a0a0a0;
  margin: 0;
  line-height: 1.6;
}

/* CTA */
.cta {
  padding: 5rem 2rem;
  text-align: center;
  max-width: 800px;
  margin: 0 auto;
}

.cta h2 {
  margin-bottom: 1rem;
}

.cta > p {
  font-size: 1.05rem;
  color: #a0a0a0;
  margin: 0 0 2.5rem;
  line-height: 1.6;
}

.btn-cta {
  background: linear-gradient(135deg, #c864ff 0%, #ff00ff 100%);
  border: none;
  color: #030305;
  padding: 16px 40px;
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
  padding: 3rem 2rem;
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
    padding: 6rem 1.5rem 3rem;
  }

  .hero-title {
    font-size: 1.8rem;
  }

  .problem h2,
  .why h2,
  .benefits h2,
  .jobs h2,
  .how h2,
  .trust h2,
  .faq h2,
  .cta h2 {
    font-size: 1.8rem;
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
