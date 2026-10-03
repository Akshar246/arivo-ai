const TOOLS = [
  {
    title: "Sponsor Verification",
    desc: "Employers are checked against the Home Office register of licensed sponsors, so you can see who is on it before you apply."
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
    solution: "Many employers can't sponsor a visa. We flag the ones on the sponsor register, so you can put your effort where it counts."
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

function Reveal({ children, className = "" }) {
  return <div className={className}>{children}</div>;
}

export default function Landing({ onGetStarted }) {
  return (
    <div className="landing ivory">
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
            <p className="hero-desc">Stop applying blind. Employers are checked against the UK Home Office register of licensed sponsors. Built by an international student, for international students.</p>
          </Reveal>
          <Reveal delay={0.3}>
            <button onClick={onGetStarted} className="btn-hero">Explore Opportunities →</button>
          </Reveal>
        </div>
        <Reveal delay={0.4} className="hero-stats">
          <div className="stat">
            <div className="stat-num">Official</div>
            <div className="stat-txt">Home Office sponsor list</div>
          </div>
          <div className="stat">
            <div className="stat-num">Live</div>
            <div className="stat-txt">Reed and Adzuna postings</div>
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
            <p>Job boards show every role, whether or not the employer can sponsor a visa. You apply blindly, get rejected or ghosted, and never learn why.</p>
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
            <p>Browse roles from employers on the sponsor register. Check your CV against a job description to fix formatting and keyword gaps before applying.</p>
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
          <h2>Where the data comes from</h2>
          <p>We match each employer against the Home Office's published register of licensed Skilled Worker sponsors, and pull job postings from Reed and Adzuna. Being on the register doesn't mean every role is sponsored, so always confirm with the employer.</p>
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
            <p>We match each employer's name against the Home Office's published Skilled Worker sponsor register. Names can differ slightly between sources, so a missing match isn't proof that an employer can't sponsor.</p>
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
* {box-sizing:border-box;}

.landing {background:var(--c-surface-2);color:var(--c-ink);font-family:-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;min-height:100vh;position:relative;line-height:1.6;}

.reveal-wrap {transition:opacity 0.8s ease, transform 0.8s cubic-bezier(0.2, 0.8, 0.2, 1);}

/* NAV */
.nav {position:fixed;top:0;left:0;right:0;z-index:100;background:var(--c-bg);border-bottom:1px solid var(--c-line);}

.nav-inner {max-width:1200px;margin:0 auto;padding:1rem 2rem;display:flex;justify-content:space-between;align-items:center;}

.logo {font-size:1.2rem;font-weight:800;color:var(--c-ink);}

.btn-nav {background:rgba(15,61,46,0.1);border:1px solid rgba(15,61,46,0.3);color:var(--c-ink);padding:8px 16px;border-radius:6px;font-size:0.9rem;font-weight:600;cursor:pointer;transition:all 0.3s ease;}

.btn-nav:hover {background:rgba(15,61,46,0.2);border-color:rgba(15,61,46,0.5);}

/* HERO */
.hero {padding:8rem 2rem 5rem;max-width:1100px;margin:0 auto;}

.hero-content {margin-bottom:4rem;}

.hero-label {font-size:0.85rem;color:var(--c-green);text-transform:uppercase;letter-spacing:0.1em;margin:0 0 1rem;font-weight:600;}

.hero-title {font-size:clamp(2.5rem, 6vw, 3.8rem);font-weight:700;line-height:1.2;margin:0 0 1.5rem;color:var(--c-ink);}

.hero-desc {font-size:1.1rem;color:var(--c-ink-2);margin:0 0 2rem;line-height:1.7;max-width:700px;}

.btn-hero {background:var(--c-green);border:none;color:#f5f1e8;padding:14px 32px;border-radius:8px;font-size:1rem;font-weight:600;cursor:pointer;transition:all 0.3s ease;box-shadow:none;}

.btn-hero:hover {box-shadow:none;}

.hero-stats {display:grid;grid-template-columns:repeat(auto-fit, minmax(180px, 1fr));gap:2rem;padding:2.5rem;background:rgba(15,61,46,0.05);border:1px solid rgba(15,61,46,0.1);border-radius:12px;}

.stat {text-align:center;}

.stat-num {font-size:2.2rem;font-weight:700;color:var(--c-green);margin-bottom:0.5rem;}

.stat-txt {font-size:0.85rem;color:var(--c-ink-2);text-transform:uppercase;letter-spacing:0.05em;}

/* PROBLEM */
.problem {padding:5rem 2rem;max-width:1100px;margin:0 auto;background:var(--c-surface-2);}

.problem h2,
.why h2,
.benefits h2,
.jobs h2,
.how h2,
.trust h2,
.faq h2,
.cta h2 {font-size:2.2rem;font-weight:700;margin:0 0 3rem;text-align:center;color:var(--c-ink);}

.problem-grid {display:grid;grid-template-columns:repeat(auto-fit, minmax(300px, 1fr));gap:2rem;}

.problem-card {padding:2rem;background:rgba(15,61,46,0.05);border:1px solid rgba(15,61,46,0.1);border-radius:10px;}

.problem-card h3 {font-size:1.15rem;margin:0 0 1rem;color:var(--c-ink);}

.problem-card p {font-size:0.95rem;color:var(--c-ink-2);margin:0;line-height:1.6;}

/* WHY */
.why {padding:5rem 2rem;max-width:1000px;margin:0 auto;}

.why-grid {display:grid;grid-template-columns:repeat(auto-fit, minmax(300px, 1fr));gap:2rem;}

.why-card {display:block;}

.why-card > div {padding:2rem;background:rgba(15,61,46,0.06);border:1px solid rgba(15,61,46,0.12);border-radius:10px;}

.why-problem {font-size:1.1rem;font-weight:600;color:var(--c-danger);margin-bottom:0.8rem;}

.why-arrow {font-size:1.5rem;color:var(--c-green);margin:0.5rem 0;}

.why-solution {font-size:1.1rem;font-weight:600;color:var(--c-green);}

/* BENEFITS */
.benefits {padding:5rem 2rem;max-width:1100px;margin:0 auto;}

.benefits-grid {display:grid;grid-template-columns:repeat(auto-fit, minmax(280px, 1fr));gap:2rem;}

.benefit-item {display:block;padding:2rem;background:rgba(15,61,46,0.05);border:1px solid rgba(15,61,46,0.1);border-radius:10px;transition:all 0.3s ease;}

.benefit-item:hover {background:rgba(15,61,46,0.08);border-color:rgba(15,61,46,0.2);}

.benefit-item h3 {font-size:1.1rem;margin:0 0 1rem;color:var(--c-ink);}

.benefit-item p {font-size:0.95rem;color:var(--c-ink-2);margin:0;line-height:1.6;}

/* JOBS */
.jobs {padding:5rem 2rem;max-width:1100px;margin:0 auto;}

.jobs-desc {font-size:1rem;color:var(--c-ink-2);text-align:center;margin:0 0 3rem;max-width:600px;margin-left:auto;margin-right:auto;}

.jobs-grid {display:grid;grid-template-columns:repeat(auto-fit, minmax(300px, 1fr));gap:1.5rem;}

.job-card {padding:1.5rem;background:rgba(15,61,46,0.05);border:1px solid rgba(15,61,46,0.1);border-radius:10px;transition:all 0.3s ease;}

.job-card:hover {background:rgba(15,61,46,0.1);border-color:rgba(15,61,46,0.3);}

.job-header {display:flex;justify-content:space-between;align-items:flex-start;gap:1rem;margin-bottom:1rem;}

.job-title {font-size:1rem;font-weight:600;margin:0 0 0.3rem;color:var(--c-ink);}

.job-company {font-size:0.9rem;color:var(--c-ink-2);margin:0;}

.badge {display:inline-block;background:rgba(15,61,46,0.2);border:1px solid rgba(15,61,46,0.3);color:var(--c-green);padding:0.35rem 0.75rem;border-radius:4px;font-size:0.8rem;font-weight:600;white-space:nowrap;}

.job-details {display:flex;gap:1.5rem;font-size:0.9rem;color:var(--c-ink-2);}

/* HOW */
.how {padding:5rem 2rem;max-width:1000px;margin:0 auto;}

.how-grid {display:grid;grid-template-columns:repeat(auto-fit, minmax(280px, 1fr));gap:2rem;}

.how-card {display:block;padding:2.5rem;background:rgba(15,61,46,0.05);border:1px solid rgba(15,61,46,0.1);border-radius:10px;text-align:center;}

.step {font-size:2.5rem;font-weight:700;color:var(--c-green);margin-bottom:1rem;}

.how-card h3 {font-size:1.15rem;margin:0 0 0.8rem;color:var(--c-ink);}

.how-card p {font-size:0.95rem;color:var(--c-ink-2);margin:0;line-height:1.6;}

/* TRUST */
.trust {padding:5rem 2rem;max-width:1100px;margin:0 auto;text-align:center;}

.trust h2 {margin-bottom:0.5rem;}

.trust > p {font-size:1rem;color:var(--c-ink-2);margin:0 0 3rem;}

.trust-stats {display:grid;grid-template-columns:repeat(auto-fit, minmax(200px, 1fr));gap:2rem;}

.trust-stat {text-align:center;padding:2rem;background:rgba(15,61,46,0.05);border:1px solid rgba(15,61,46,0.1);border-radius:10px;}

.trust-num {font-size:2rem;font-weight:700;color:var(--c-green);display:block;margin-bottom:0.5rem;}

.trust-label {font-size:0.9rem;color:var(--c-ink-2);display:block;}

.sponsors-grid {display:flex;flex-wrap:wrap;gap:1rem;justify-content:center;}

.sponsor-badge {padding:0.7rem 1.3rem;background:rgba(15,61,46,0.08);border:1px solid rgba(15,61,46,0.12);border-radius:6px;font-size:0.9rem;color:var(--c-ink);}

/* FAQ */
.faq {padding:5rem 2rem;max-width:900px;margin:0 auto;}

.faq-grid {display:grid;grid-template-columns:repeat(auto-fit, minmax(280px, 1fr));gap:2rem;}

.faq-item {display:block;padding:2rem;background:rgba(15,61,46,0.05);border:1px solid rgba(15,61,46,0.1);border-radius:10px;}

.faq-item h4 {font-size:1.05rem;margin:0 0 1rem;color:var(--c-ink);}

.faq-item p {font-size:0.95rem;color:var(--c-ink-2);margin:0;line-height:1.6;}

/* CTA */
.cta {padding:5rem 2rem;text-align:center;max-width:800px;margin:0 auto;}

.cta h2 {margin-bottom:1rem;}

.cta > p {font-size:1.05rem;color:var(--c-ink-2);margin:0 0 2.5rem;line-height:1.6;}

.btn-cta {background:var(--c-green);border:none;color:#f5f1e8;padding:16px 40px;border-radius:8px;font-size:1.05rem;font-weight:600;cursor:pointer;transition:all 0.3s ease;box-shadow:none;}

.btn-cta:hover {box-shadow:none;}

/* FOOTER */
.footer {padding:3rem 2rem;border-top:1px solid rgba(15,61,46,0.1);background:rgba(15,61,46,0.02);}

.footer-inner {max-width:1200px;margin:0 auto;display:flex;justify-content:space-between;align-items:center;gap:2rem;}

.footer-links {display:flex;gap:2rem;font-size:0.9rem;color:var(--c-ink-2);}

/* RESPONSIVE */
@media (max-width: 768px) {
  .hero {padding:6rem 1.5rem 3rem;}

  .hero-title {font-size:1.8rem;}

  .problem h2,
  .why h2,
  .benefits h2,
  .jobs h2,
  .how h2,
  .trust h2,
  .faq h2,
  .cta h2 {font-size:1.8rem;}

  .footer-inner {flex-direction:column;text-align:center;}

  .footer-links {justify-content:center;}
}

/* ivory refinements */
.hero-title { font-family: var(--font-display); font-weight: 400; letter-spacing: -0.01em; line-height: 1.08; }

.logo { font-family: var(--font-display); font-weight: 400; font-size: 1.7rem; letter-spacing: -0.01em; }
.btn-nav { background: transparent; border: 1px solid var(--c-line-2); color: var(--c-ink); border-radius: 8px; }
.btn-nav:hover { background: transparent; border-color: var(--c-ink); }
.landing h2, .landing .stat-num, .landing .trust-num { font-family: var(--font-display); font-weight: 400; letter-spacing: -0.01em; }
.landing h2 { font-size: clamp(2rem, 4vw, 2.8rem); }
.landing .problem-card, .landing .why-card, .landing .benefit-item, .landing .how-card, .landing .faq-item, .landing .hero-stats, .landing .trust-stat { background: var(--c-surface); border: 1px solid var(--c-line); box-shadow: none; }
.landing .step { background: var(--c-green); color: #f5f1e8; }
`;
