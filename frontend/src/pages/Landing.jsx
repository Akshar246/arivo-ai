import { useState, useEffect, useRef } from "react";

// ─────────────────────────────────────────────────────────────
// PREMIUM LANDING PAGE · Arivo AI (V2 Architecture)
// Deep glassmorphism, dynamic data-pipeline aesthetics,
// and cohesive violet/fuchsia/emerald color grading.
// ─────────────────────────────────────────────────────────────

const C = {
  bg: "#030305",
  surface: "rgba(20, 20, 30, 0.4)",
  surfaceHover: "rgba(30, 30, 45, 0.6)",
  border: "rgba(255, 255, 255, 0.08)",
  borderGlow: "rgba(139, 92, 246, 0.3)",
  primary: "#8B5CF6", // Violet
  accent: "#D946EF", // Fuchsia
  success: "#10B981", // Emerald
  text: "#F8FAFC",
  textMuted: "#8B949E",
};

const sponsors = [
  "Revolut",
  "DeepMind",
  "Monzo",
  "Barclays",
  "Starling Bank",
  "GSK",
  "Deliveroo",
  "NHS",
  "ASOS",
  "KPMG",
  "BT Group",
  "Deloitte",
  "Wipro",
  "Accenture",
  "Infosys",
];

const verifyNames = [
  "Revolut",
  "DeepMind",
  "Monzo",
  "GSK",
  "Barclays",
  "Deliveroo",
];

const features = [
  {
    icon: "🛡️",
    eyebrow: "Visa-Intelligent Search",
    title: "Only roles that can actually hire you.",
    desc: "Every listing is cross-referenced with the official Home Office Skilled Worker register in real time.",
    span: "col-span-2 row-span-2",
  },
  {
    icon: "🎯",
    eyebrow: "ATS Semantic Engine",
    title: "See what the robots see.",
    desc: "Uncover hidden biases and formatting errors that quietly hurt international applicants.",
    span: "col-span-1 row-span-2",
  },
  {
    icon: "💬",
    eyebrow: "AI Career Coach",
    title: "Grounded in real market data.",
    desc: "No generic blog advice. Pure data.",
    span: "col-span-1 row-span-1",
  },
  {
    icon: "📊",
    eyebrow: "Skill Gap Analysis",
    title: "Quantify your readiness.",
    desc: "Scored against live London demand.",
    span: "col-span-1 row-span-1",
  },
  {
    icon: "📄",
    eyebrow: "Deep Document Extraction",
    title: "Real PDF parsing, not a text hack.",
    desc: "Our engine maps your document structure exactly how enterprise ATS systems do.",
    span: "col-span-2 row-span-1",
  },
];

const steps = [
  {
    n: "01",
    t: "Upload your CV",
    d: "Instantly extract your skills and structure.",
  },
  { n: "02", t: "Set Target Role", d: "Define your ideal London placement." },
  {
    n: "03",
    t: "Analyze Gaps",
    d: "See exactly what recruiters want you to add.",
  },
  { n: "04", t: "Find Matches", d: "Apply to pre-verified sponsor companies." },
];

const dataSources = [
  {
    icon: "🏛️",
    name: "UK Home Office",
    sub: "Skilled Worker Sponsor Register",
  },
  {
    icon: "📡",
    name: "Live API Pipelines",
    sub: "Real-time Job Market Aggregation",
  },
  { icon: "⚡", name: "Vector Embedding", sub: "ChromaDB Semantic Matching" },
];

// ── Reveal Component ──
function Reveal({ children, delay = 0, className = "" }) {
  const [seen, setSeen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const ob = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setSeen(true);
          ob.disconnect();
        }
      },
      { threshold: 0.1 },
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
        transform: seen ? "translateY(0)" : "translateY(30px)",
        transitionDelay: `${delay}s`,
      }}
    >
      {children}
    </div>
  );
}

// ── The "Signature Moment" Scanner Widget ──
function VerifyWidget() {
  const [idx, setIdx] = useState(0);
  const [phase, setPhase] = useState("scan"); // scan -> verified

  useEffect(() => {
    const scanT = setTimeout(() => setPhase("verified"), 1800);
    const nextT = setTimeout(() => {
      setPhase("scan");
      setIdx((i) => (i + 1) % verifyNames.length);
    }, 4000);
    return () => {
      clearTimeout(scanT);
      clearTimeout(nextT);
    };
  }, [idx]);

  const company = verifyNames[idx];

  return (
    <div className="scanner-widget interactive-glass">
      <div className="scanner-header">
        <div className="scanner-title">
          <span className="live-pulse"></span>
          <span>Data Pipeline: Home Office API</span>
        </div>
        <span className="scanner-badge">SYS.ACTIVE</span>
      </div>

      <div className="scanner-body">
        <div className="target-info">
          <div className="target-avatar">{company[0]}</div>
          <div className="target-text">
            <div className="target-name">{company}</div>
            <div className="target-status">
              {phase === "scan"
                ? "Cross-referencing database..."
                : "Verification complete."}
            </div>
          </div>
        </div>

        <div className="scan-window">
          {phase === "scan" && <div className="scan-laser"></div>}
          <div className="scan-code">
            <p>{`> FETCH /api/sponsors?q=${company.toLowerCase()}`}</p>
            <p className={phase === "verified" ? "text-emerald" : "text-muted"}>
              {phase === "scan"
                ? "> Awaiting response..."
                : `> STATUS 200: SPONSOR_FOUND`}
            </p>
          </div>
        </div>
      </div>

      <div
        className={`scanner-footer ${phase === "verified" ? "verified" : ""}`}
      >
        {phase === "scan" ? (
          <span className="footer-scanning">Scanning 120,000+ records...</span>
        ) : (
          <span className="footer-success">
            <span className="check-icon">✓</span> Licensed UK Sponsor
          </span>
        )}
      </div>
    </div>
  );
}

export default function Landing({ onGetStarted }) {
  return (
    <div className="landing-page">
      <style>{css}</style>

      {/* Ambient Background Glows */}
      <div className="ambient-orb orb-1"></div>
      <div className="ambient-orb orb-2"></div>
      <div className="bg-grid-overlay"></div>

      {/* Navigation */}
      <nav className="glass-nav">
        <div className="nav-container">
          <span className="brand-logo">Arivo AI</span>
          <div className="nav-actions">
            <button onClick={onGetStarted} className="btn-ghost">
              Sign In
            </button>
            <button onClick={onGetStarted} className="btn-glow">
              Get Started Free
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <Reveal>
            <div className="hero-badge">
              <span className="badge-glow"></span>
              Built exclusively for International Students
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <h1 className="hero-title">
              Stop guessing. <br />
              Start <span className="text-gradient">targeting.</span>
            </h1>
          </Reveal>
          <Reveal delay={0.2}>
            <p className="hero-subtitle">
              Arivo cross-references live job listings with the UK Home Office
              register, reads your CV through a semantic ATS engine, and maps
              your skill gaps.
              <strong>Your unfair advantage, for free.</strong>
            </p>
          </Reveal>
          <Reveal delay={0.3}>
            <div className="hero-cta-group">
              <button onClick={onGetStarted} className="btn-primary-large">
                Launch Platform <span className="arrow">→</span>
              </button>
              <div className="hero-stats">
                <div className="stat">
                  <span className="stat-num">120k+</span> Sponsors
                </div>
                <div className="stat-divider"></div>
                <div className="stat">
                  <span className="stat-num">Live</span> Market Data
                </div>
              </div>
            </div>
          </Reveal>
        </div>
        <div className="hero-visual">
          <Reveal delay={0.4}>
            <VerifyWidget />
          </Reveal>
        </div>
      </section>

      {/* Infinite Marquee */}
      <div className="marquee-container">
        <div className="marquee-fade left"></div>
        <div className="marquee-fade right"></div>
        <div className="marquee-track">
          {[...sponsors, ...sponsors, ...sponsors].map((s, i) => (
            <div key={i} className="marquee-pill">
              <span className="pill-dot"></span> {s}
            </div>
          ))}
        </div>
      </div>

      {/* Bento Grid Features */}
      <section className="feature-section">
        <Reveal>
          <div className="section-header">
            <h2>
              The ultimate{" "}
              <span className="text-gradient-alt">placement toolkit.</span>
            </h2>
            <p>
              Everything you need to bypass the noise and land the interview.
            </p>
          </div>
        </Reveal>

        <div className="bento-grid">
          {features.map((f, i) => (
            <Reveal
              key={i}
              delay={i * 0.1}
              className={`bento-card interactive-glass ${f.span}`}
            >
              <div className="bento-icon-wrapper">{f.icon}</div>
              <span className="bento-eyebrow">{f.eyebrow}</span>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Pathway Section */}
      <section className="pathway-section">
        <Reveal>
          <div className="section-header center">
            <h2>Four steps. Five minutes.</h2>
          </div>
        </Reveal>

        <div className="steps-container">
          <div className="steps-glow-line"></div>
          {steps.map((s, i) => (
            <Reveal
              key={s.n}
              delay={i * 0.15}
              className="step-card interactive-glass"
            >
              <div className="step-number">{s.n}</div>
              <h4>{s.t}</h4>
              <p>{s.d}</p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Data Trust Section */}
      <section className="trust-section">
        <Reveal>
          <h3 className="trust-header">Powered by Enterprise Infrastructure</h3>
        </Reveal>
        <div className="trust-grid">
          {dataSources.map((d, i) => (
            <Reveal
              key={d.name}
              delay={i * 0.1}
              className="trust-card interactive-glass"
            >
              <div className="trust-icon">{d.icon}</div>
              <div className="trust-info">
                <h4>{d.name}</h4>
                <p>{d.sub}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="cta-section">
        <Reveal>
          <div className="cta-box interactive-glass">
            <div className="cta-glow"></div>
            <h2>Ready to find your place in the UK?</h2>
            <p>
              Join students using Arivo to navigate visa sponsorship and conquer
              the ATS.
            </p>
            <button onClick={onGetStarted} className="btn-glow-large">
              Start Building Your Profile
            </button>
          </div>
        </Reveal>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-content">
          <div className="footer-brand">
            <span className="brand-logo">Arivo AI</span>
            <p>The semantic career engine for international students.</p>
            <span className="copyright">
              © {new Date().getFullYear()} Arivo AI
            </span>
          </div>
          <div className="footer-links">
            <div className="link-col">
              <h4>Platform</h4>
              <span>Job Search</span>
              <span>ATS Engine</span>
              <span>Skill Gap</span>
            </div>
            <div className="link-col">
              <h4>Legal</h4>
              <span>Privacy Policy</span>
              <span>Terms of Service</span>
              <span>Data Sources</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// PURE CSS MAGIC
// ─────────────────────────────────────────────────────────────
const css = `
/* Base & Resets */
.landing-page {
  background-color: ${C.bg};
  min-height: 100vh;
  color: ${C.text};
  font-family: 'Inter', system-ui, sans-serif;
  overflow-x: hidden;
  position: relative;
}
* { box-sizing: border-box; }

/* Ambient Backgrounds */
.ambient-orb { position: absolute; border-radius: 50%; filter: blur(120px); z-index: 0; pointer-events: none; }
.orb-1 { top: -10%; left: -10%; width: 50vw; height: 50vw; background: rgba(139, 92, 246, 0.15); }
.orb-2 { top: 40%; right: -20%; width: 60vw; height: 60vw; background: rgba(217, 70, 239, 0.08); }

.bg-grid-overlay {
  position: absolute; inset: 0; z-index: 0; pointer-events: none;
  background-image: linear-gradient(to right, rgba(255,255,255,0.02) 1px, transparent 1px),
                    linear-gradient(to bottom, rgba(255,255,255,0.02) 1px, transparent 1px);
  background-size: 50px 50px;
  mask-image: radial-gradient(ellipse at top, black 40%, transparent 80%);
  -webkit-mask-image: radial-gradient(ellipse at top, black 40%, transparent 80%);
}

/* Glassmorphism Utilities */
.interactive-glass {
  background: ${C.surface};
  backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
  border: 1px solid ${C.border}; border-radius: 24px;
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  position: relative; overflow: hidden;
}
.interactive-glass::before {
  content: ''; position: absolute; inset: 0; pointer-events: none;
  background: radial-gradient(800px circle at var(--mouse-x, 50%) var(--mouse-y, -50%), rgba(255,255,255,0.06), transparent 40%);
  transition: opacity 0.3s; opacity: 0;
}
.interactive-glass:hover {
  transform: translateY(-4px); border-color: rgba(255,255,255,0.15);
  box-shadow: 0 20px 40px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1);
}
.interactive-glass:hover::before { opacity: 1; }

.text-gradient { background: linear-gradient(135deg, ${C.primary}, ${C.accent}); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
.text-gradient-alt { background: linear-gradient(135deg, ${C.success}, #34D399); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }

/* Reveal Animation */
.reveal-wrap { transition: opacity 0.8s ease, transform 0.8s cubic-bezier(0.2, 0.8, 0.2, 1); }

/* Navigation */
.glass-nav {
  position: fixed; top: 0; left: 0; right: 0; z-index: 100;
  background: rgba(3, 3, 5, 0.6); backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px);
  border-bottom: 1px solid ${C.border};
}
.nav-container { display: flex; justify-content: space-between; align-items: center; max-width: 1280px; margin: 0 auto; padding: 1rem 2rem; }
.brand-logo { font-size: 1.25rem; font-weight: 800; letter-spacing: -0.02em; color: #fff; }
.nav-actions { display: flex; gap: 1rem; align-items: center; }
.btn-ghost { background: transparent; border: none; color: ${C.textMuted}; font-weight: 600; cursor: pointer; transition: color 0.2s; }
.btn-ghost:hover { color: #fff; }
.btn-glow {
  background: rgba(139, 92, 246, 0.1); border: 1px solid rgba(139, 92, 246, 0.4); color: #fff;
  padding: 8px 20px; border-radius: 99px; font-weight: 600; cursor: pointer; font-size: 0.9rem;
  transition: all 0.3s; box-shadow: 0 0 15px rgba(139, 92, 246, 0.2);
}
.btn-glow:hover { background: rgba(139, 92, 246, 0.2); box-shadow: 0 0 25px rgba(139, 92, 246, 0.4); transform: translateY(-1px); }

/* Hero Section */
.hero-section {
  position: relative; z-index: 1; max-width: 1280px; margin: 0 auto;
  padding: 10rem 2rem 6rem; display: flex; align-items: center; gap: 4rem; min-height: 90vh;
}
.hero-content { flex: 1.2; }
.hero-badge {
  display: inline-flex; align-items: center; gap: 8px; padding: 6px 16px; border-radius: 99px;
  background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.1);
  font-size: 0.85rem; font-weight: 600; color: #E2E8F0; margin-bottom: 2rem;
}
.badge-glow { width: 8px; height: 8px; background: ${C.primary}; border-radius: 50%; box-shadow: 0 0 10px ${C.primary}; animation: pulse 2s infinite; }
.hero-title { font-size: clamp(3rem, 5vw, 4.5rem); font-weight: 800; line-height: 1.1; letter-spacing: -0.03em; margin: 0 0 1.5rem; }
.hero-subtitle { font-size: 1.1rem; color: ${C.textMuted}; line-height: 1.6; max-width: 540px; margin: 0 0 2.5rem; }
.hero-subtitle strong { color: #fff; font-weight: 600; }
.hero-cta-group { display: flex; align-items: center; gap: 2rem; flex-wrap: wrap; }

.btn-primary-large {
  background: #fff; color: #000; border: none; padding: 16px 32px; border-radius: 14px;
  font-size: 1.05rem; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 8px;
  box-shadow: 0 0 30px rgba(255,255,255,0.15); transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}
.btn-primary-large .arrow { transition: transform 0.2s; }
.btn-primary-large:hover { transform: translateY(-2px); box-shadow: 0 10px 40px rgba(255,255,255,0.25); }
.btn-primary-large:hover .arrow { transform: translateX(4px); }

.hero-stats { display: flex; align-items: center; gap: 1rem; }
.stat { display: flex; flex-direction: column; font-size: 0.75rem; color: ${C.textMuted}; text-transform: uppercase; letter-spacing: 0.05em; }
.stat-num { font-size: 1.25rem; font-weight: 800; color: #fff; letter-spacing: -0.02em; text-transform: none; }
.stat-divider { width: 1px; height: 30px; background: ${C.border}; }

.hero-visual { flex: 0.8; display: flex; justify-content: flex-end; }

/* The Scanner Widget */
.scanner-widget {
  width: 100%; max-width: 420px; padding: 0; background: #0A0A0F;
  border-color: rgba(139, 92, 246, 0.3); box-shadow: 0 30px 60px rgba(0,0,0,0.5), 0 0 40px rgba(139, 92, 246, 0.1);
}
.scanner-header { display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; border-bottom: 1px solid ${C.border}; background: rgba(255,255,255,0.02); }
.scanner-title { display: flex; align-items: center; gap: 8px; font-size: 0.75rem; font-weight: 700; color: #A0AEC0; text-transform: uppercase; letter-spacing: 0.05em; }
.live-pulse { width: 6px; height: 6px; background: ${C.accent}; border-radius: 50%; box-shadow: 0 0 8px ${C.accent}; animation: pulse 1.5s infinite; }
.scanner-badge { font-size: 0.65rem; background: rgba(16, 185, 129, 0.1); color: ${C.success}; padding: 4px 8px; border-radius: 4px; font-weight: 800; border: 1px solid rgba(16, 185, 129, 0.2); }

.scanner-body { padding: 24px 20px; }
.target-info { display: flex; align-items: center; gap: 16px; margin-bottom: 24px; }
.target-avatar { width: 48px; height: 48px; border-radius: 12px; background: linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(217, 70, 239, 0.2)); border: 1px solid rgba(139, 92, 246, 0.3); display: flex; align-items: center; justify-content: center; font-size: 1.25rem; font-weight: 800; color: #fff; }
.target-name { font-size: 1.2rem; font-weight: 700; color: #fff; margin-bottom: 4px; }
.target-status { font-size: 0.8rem; color: ${C.textMuted}; }

.scan-window { background: #050508; border: 1px solid ${C.border}; border-radius: 8px; height: 80px; position: relative; overflow: hidden; padding: 12px; }
.scan-laser { position: absolute; left: 0; right: 0; height: 2px; background: ${C.primary}; box-shadow: 0 0 10px 2px ${C.primary}; animation: scanLaser 1.5s ease-in-out infinite alternate; opacity: 0.8; }
.scan-code p { margin: 0 0 6px; font-family: 'Fira Code', monospace; font-size: 0.75rem; color: #6B7280; }
.scan-code .text-emerald { color: ${C.success}; text-shadow: 0 0 8px rgba(16, 185, 129, 0.4); }

.scanner-footer { padding: 16px 20px; background: rgba(255,255,255,0.02); border-top: 1px solid ${C.border}; font-size: 0.8rem; font-weight: 600; display: flex; align-items: center; transition: all 0.3s; }
.scanner-footer.verified { background: rgba(16, 185, 129, 0.08); border-top-color: rgba(16, 185, 129, 0.2); }
.footer-scanning { color: ${C.textMuted}; }
.footer-success { color: ${C.success}; display: flex; align-items: center; gap: 8px; }
.check-icon { background: ${C.success}; color: #000; width: 16px; height: 16px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 900; }

@keyframes scanLaser { 0% { top: 0; } 100% { top: 100%; } }
@keyframes pulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.5; transform: scale(1.2); } }

/* Infinite Marquee */
.marquee-container { position: relative; max-width: 1280px; margin: 0 auto 6rem; padding: 2rem 0; overflow: hidden; border-top: 1px solid ${C.border}; border-bottom: 1px solid ${C.border}; background: rgba(255,255,255,0.01); }
.marquee-fade { position: absolute; top: 0; bottom: 0; width: 150px; z-index: 2; pointer-events: none; }
.marquee-fade.left { left: 0; background: linear-gradient(to right, ${C.bg}, transparent); }
.marquee-fade.right { right: 0; background: linear-gradient(to left, ${C.bg}, transparent); }
.marquee-track { display: flex; width: max-content; gap: 2rem; animation: marqueeScroll 40s linear infinite; }
.marquee-pill { display: flex; align-items: center; gap: 10px; font-size: 0.95rem; font-weight: 600; color: #A0AEC0; padding: 10px 24px; background: rgba(255,255,255,0.03); border: 1px solid ${C.border}; border-radius: 99px; }
.pill-dot { width: 8px; height: 8px; background: rgba(255,255,255,0.2); border-radius: 50%; }
@keyframes marqueeScroll { to { transform: translateX(-50%); } }

/* Sections Common */
.section-header { text-align: left; margin-bottom: 3rem; max-width: 600px; }
.section-header.center { text-align: center; margin: 0 auto 4rem; }
.section-header h2 { font-size: clamp(2rem, 3vw, 2.5rem); font-weight: 800; margin: 0 0 1rem; letter-spacing: -0.02em; }
.section-header p { font-size: 1.1rem; color: ${C.textMuted}; margin: 0; line-height: 1.6; }

/* Bento Grid */
.feature-section { max-width: 1280px; margin: 0 auto 8rem; padding: 0 2rem; }
.bento-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.5rem; grid-auto-rows: minmax(220px, auto); }
.bento-card { padding: 32px; display: flex; flex-direction: column; }
.bento-icon-wrapper { width: 48px; height: 48px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 14px; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; margin-bottom: 24px; box-shadow: inset 0 2px 10px rgba(255,255,255,0.05); }
.bento-eyebrow { font-size: 0.75rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; color: ${C.primary}; margin-bottom: 8px; }
.bento-card h3 { font-size: 1.4rem; font-weight: 700; margin: 0 0 12px; letter-spacing: -0.01em; color: #fff; }
.bento-card p { font-size: 0.95rem; color: ${C.textMuted}; line-height: 1.6; margin: 0; }

.col-span-2 { grid-column: span 2; }
.col-span-1 { grid-column: span 1; }
.row-span-2 { grid-row: span 2; }
.row-span-1 { grid-row: span 1; }

/* Pathway Section */
.pathway-section { max-width: 1280px; margin: 0 auto 8rem; padding: 0 2rem; }
.steps-container { display: grid; grid-template-columns: repeat(4, 1fr); gap: 2rem; position: relative; }
.steps-glow-line { position: absolute; top: 28px; left: 0; right: 0; height: 2px; background: linear-gradient(90deg, transparent, ${C.primary}, ${C.accent}, transparent); opacity: 0.3; z-index: 0; }
.step-card { padding: 32px 24px; text-align: center; z-index: 1; }
.step-number { width: 56px; height: 56px; margin: 0 auto 20px; background: ${C.bg}; border: 2px solid ${C.primary}; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.1rem; font-weight: 800; color: ${C.primary}; box-shadow: 0 0 20px rgba(139, 92, 246, 0.2); }
.step-card h4 { font-size: 1.1rem; font-weight: 700; margin: 0 0 10px; color: #fff; }
.step-card p { font-size: 0.9rem; color: ${C.textMuted}; line-height: 1.5; margin: 0; }

/* Trust Section */
.trust-section { max-width: 1000px; margin: 0 auto 8rem; padding: 0 2rem; text-align: center; }
.trust-header { font-size: 0.85rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; color: ${C.textMuted}; margin-bottom: 2rem; }
.trust-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.5rem; }
.trust-card { display: flex; align-items: center; gap: 16px; padding: 20px; text-align: left; }
.trust-icon { font-size: 2rem; }
.trust-info h4 { font-size: 0.95rem; font-weight: 700; margin: 0 0 4px; color: #fff; }
.trust-info p { font-size: 0.75rem; color: ${C.textMuted}; margin: 0; }

/* Final CTA */
.cta-section { max-width: 800px; margin: 0 auto 8rem; padding: 0 2rem; }
.cta-box { padding: 4rem 3rem; text-align: center; border-color: rgba(16, 185, 129, 0.3); background: linear-gradient(180deg, rgba(20,20,30,0.4), rgba(16,185,129,0.05)); }
.cta-glow { position: absolute; top: -50%; left: 50%; transform: translateX(-50%); width: 300px; height: 300px; background: rgba(16, 185, 129, 0.2); filter: blur(80px); border-radius: 50%; pointer-events: none; }
.cta-box h2 { font-size: 2.2rem; font-weight: 800; margin: 0 0 1rem; letter-spacing: -0.02em; }
.cta-box p { font-size: 1.1rem; color: ${C.textMuted}; margin: 0 auto 2.5rem; max-width: 400px; line-height: 1.6; }
.btn-glow-large { background: ${C.success}; color: #000; border: none; padding: 18px 36px; border-radius: 14px; font-size: 1.1rem; font-weight: 700; cursor: pointer; box-shadow: 0 0 30px rgba(16,185,129,0.3); transition: all 0.3s; }
.btn-glow-large:hover { transform: translateY(-2px); box-shadow: 0 10px 40px rgba(16,185,129,0.5); background: #34D399; }

/* Footer */
.footer { border-top: 1px solid ${C.border}; background: rgba(255,255,255,0.01); padding: 4rem 2rem 2rem; }
.footer-content { max-width: 1280px; margin: 0 auto; display: flex; justify-content: space-between; flex-wrap: wrap; gap: 4rem; }
.footer-brand { max-width: 300px; }
.footer-brand .brand-logo { color: #fff; display: block; margin-bottom: 1rem; }
.footer-brand p { font-size: 0.9rem; color: ${C.textMuted}; line-height: 1.6; margin: 0 0 1.5rem; }
.copyright { font-size: 0.8rem; color: rgba(255,255,255,0.3); }
.footer-links { display: flex; gap: 4rem; }
.link-col h4 { font-size: 0.9rem; font-weight: 700; color: #fff; margin: 0 0 1.5rem; }
.link-col span { display: block; font-size: 0.85rem; color: ${C.textMuted}; margin-bottom: 1rem; cursor: pointer; transition: color 0.2s; }
.link-col span:hover { color: #fff; }

/* Responsive */
@media (max-width: 1024px) {
  .hero-section { flex-direction: column; text-align: center; padding-top: 8rem; }
  .hero-subtitle { margin: 0 auto 2.5rem; }
  .hero-cta-group { justify-content: center; }
  .hero-visual { width: 100%; justify-content: center; margin-top: 2rem; }
  
  .bento-grid { grid-template-columns: repeat(2, 1fr); }
  .col-span-2 { grid-column: span 2; }
  .col-span-1 { grid-column: span 1; }
}

@media (max-width: 768px) {
  .bento-grid { grid-template-columns: 1fr; }
  .col-span-2, .col-span-1, .row-span-2 { grid-column: span 1; grid-row: span 1; }
  
  .steps-container { grid-template-columns: 1fr; gap: 1rem; }
  .steps-glow-line { display: none; }
  
  .trust-grid { grid-template-columns: 1fr; }
  .footer-content { flex-direction: column; gap: 2rem; }
}
`;
