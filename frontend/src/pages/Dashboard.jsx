import { useAuth } from "../context/AuthContext";

// ─────────────────────────────────────────────────────────────
// DASHBOARD · Arivo AI
// Full-bleed, left-aligned, Vercel-style layout that fills the
// viewport (no narrow centered column). Balanced horizontal zones.
// Honest content only — no fake progress tracking, no fake stats.
// ─────────────────────────────────────────────────────────────

const tools = [
  {
    icon: "💼",
    name: "Find Jobs",
    desc: "Visa-sponsored roles, checked against the Home Office register in real time.",
    page: "jobs",
    color: "#7c6fef",
  },
  {
    icon: "🎯",
    name: "ATS Readiness",
    desc: "Score your CV the way recruiters' software does — and see exactly what to fix.",
    page: "ats",
    color: "#e879f9",
  },
  {
    icon: "💬",
    name: "Career Coach",
    desc: "Ask anything about UK job hunting — answered from real, live listings.",
    page: "chat",
    color: "#00d4aa",
  },
  {
    icon: "📊",
    name: "Skill Gap",
    desc: "Your readiness against real London market demand, with free resources.",
    page: "profile",
    color: "#f5c451",
  },
];

const path = [
  {
    n: "01",
    label: "Upload your CV",
    sub: "Arivo extracts every skill automatically.",
    page: "profile",
  },
  {
    n: "02",
    label: "Check your ATS readiness",
    sub: "See what recruiters' software flags.",
    page: "ats",
  },
  {
    n: "03",
    label: "Run your skill-gap analysis",
    sub: "Your readiness vs real market demand.",
    page: "profile",
  },
  {
    n: "04",
    label: "Search visa-sponsored jobs",
    sub: "Only roles that can actually hire you.",
    page: "jobs",
  },
  {
    n: "05",
    label: "Practise with your AI coach",
    sub: "Interview prep from live listings.",
    page: "chat",
  },
];

const trust = [
  {
    label: "Home Office verified",
    desc: "Every job checked against the official UK Skilled Worker register.",
  },
  {
    label: "Real market data",
    desc: "Skill gaps built from live London listings — not generic skill lists.",
  },
  {
    label: "Built for every field",
    desc: "Tech, healthcare, finance, law, and beyond — not just developers.",
  },
];

function Dashboard({ onNavigate }) {
  const { currentUser } = useAuth();
  const name = currentUser?.name?.split(" ")[0] || "there";
  const role = currentUser?.targetRole || "your target role";

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <div className="dash">
      <style>{css}</style>
      <div className="dash-wrap">
        {/* ── Top bar: greeting (left) + quick facts (right) ── */}
        <div className="dash-topbar rv" style={{ animationDelay: "0s" }}>
          <div>
            <div className="dash-eyebrow">Dashboard</div>
            <h1 className="dash-greet">
              {greeting}, <span className="dash-grad-name">{name}</span>
            </h1>
            <p className="dash-sub">
              Targeting <span className="dash-role">{role}</span> · London
            </p>
          </div>
          <div className="dash-quickfacts">
            <div className="dash-qf">
              <div className="dash-qf-num">120k+</div>
              <div className="dash-qf-lbl">Verified sponsors</div>
            </div>
            <div className="dash-qf-divider" />
            <div className="dash-qf">
              <div className="dash-qf-num">Live</div>
              <div className="dash-qf-lbl">London job data</div>
            </div>
            <div className="dash-qf-divider" />
            <div className="dash-qf">
              <div className="dash-qf-num">Free</div>
              <div className="dash-qf-lbl">Forever</div>
            </div>
          </div>
        </div>

        {/* ── Top zone: spotlight + companion (fills width) ── */}
        <div className="dash-top">
          <div
            className="dash-spotlight rv"
            style={{ animationDelay: "0.06s" }}
          >
            <div className="dash-spot-text">
              <span className="dash-spot-eyebrow">Start here</span>
              <h2 className="dash-spot-title">
                Turn your CV into your unfair advantage
              </h2>
              <p className="dash-spot-desc">
                Upload it once and instantly unlock your skill-gap score, ATS
                readiness, and visa-sponsored matches — all from real UK market
                data.
              </p>
              <div className="dash-spot-btns">
                <button
                  className="dash-btn-primary"
                  onClick={() => onNavigate("profile")}
                >
                  Upload your CV →
                </button>
                <button
                  className="dash-btn-ghost"
                  onClick={() => onNavigate("ats")}
                >
                  Try the ATS analyser
                </button>
              </div>
            </div>
            <div className="dash-spot-visual">
              <div className="dash-ring">
                <div className="dash-ring-core">📄</div>
              </div>
            </div>
          </div>

          <div className="dash-companion rv" style={{ animationDelay: "0.1s" }}>
            <div className="dash-panel-label">Why students trust Arivo</div>
            <div className="dash-trust-list">
              {trust.map((p, i) => (
                <div key={i} className="dash-trust-item">
                  <div className="dash-trust-dot" />
                  <div>
                    <div className="dash-trust-label">{p.label}</div>
                    <div className="dash-trust-desc">{p.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Toolkit (full-width 4 across) ── */}
        <div
          className="dash-section-label rv"
          style={{ animationDelay: "0.14s" }}
        >
          Your toolkit
        </div>
        <div className="dash-tools">
          {tools.map((t, i) => (
            <button
              key={i}
              className="dash-tool rv"
              style={{ animationDelay: `${0.16 + i * 0.05}s` }}
              onClick={() => onNavigate(t.page)}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = `${t.color}55`;
                e.currentTarget.style.background = `${t.color}0c`;
                e.currentTarget.style.transform = "translateY(-4px)";
                e.currentTarget.style.boxShadow = `0 18px 40px ${t.color}1a`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "";
                e.currentTarget.style.background = "";
                e.currentTarget.style.transform = "";
                e.currentTarget.style.boxShadow = "";
              }}
            >
              <div
                className="dash-tool-icon"
                style={{
                  background: `${t.color}18`,
                  border: `1px solid ${t.color}30`,
                }}
              >
                {t.icon}
              </div>
              <div className="dash-tool-name">{t.name}</div>
              <div className="dash-tool-desc">{t.desc}</div>
              <div className="dash-tool-open" style={{ color: t.color }}>
                Open <span>→</span>
              </div>
            </button>
          ))}
        </div>

        {/* ── Path (full-width horizontal steps) ── */}
        <div
          className="dash-section-label rv"
          style={{ animationDelay: "0.36s" }}
        >
          How Arivo works
        </div>
        <div className="dash-path">
          {path.map((step, i) => (
            <button
              key={i}
              className="dash-pathstep rv"
              style={{ animationDelay: `${0.38 + i * 0.04}s` }}
              onClick={() => onNavigate(step.page)}
            >
              <div className="dash-pathstep-n">{step.n}</div>
              <div className="dash-pathstep-label">{step.label}</div>
              <div className="dash-pathstep-sub">{step.sub}</div>
              <div className="dash-pathstep-go">Open →</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

const css = `
.dash {
  --bg:#08080f; --panel:rgba(255,255,255,0.025); --border:rgba(255,255,255,0.06);
  --pur:#7c6fef; --pur2:#9b6ef3; --mag:#e879f9; --teal:#00d4aa; --gold:#f5c451;
  --hi:#f0f0ff; --mid:#8888aa; --lo:#55556a; --faint:#333344;
  background:var(--bg); min-height:calc(100vh - 56px);
  color:var(--hi); font-family:'Inter', system-ui, sans-serif;
}
/* Full-bleed: fills the viewport with comfortable edge padding (no narrow centered column) */
.dash-wrap { padding:2.25rem clamp(1.5rem,4vw,4.5rem) 4rem; }

@keyframes dashUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
.rv { opacity:0; animation:dashUp 0.55s cubic-bezier(0.22,1,0.36,1) forwards; }

/* Top bar */
.dash-topbar { display:flex; align-items:flex-end; justify-content:space-between; gap:2rem; flex-wrap:wrap; margin-bottom:1.75rem; }
.dash-eyebrow { font-size:11px; color:var(--pur); font-weight:700; letter-spacing:0.12em; text-transform:uppercase; margin-bottom:9px; }
.dash-greet { font-size:clamp(1.8rem,3vw,2.4rem); font-weight:900; letter-spacing:-0.03em; line-height:1.1; margin:0 0 7px; }
.dash-grad-name { background:linear-gradient(135deg,#7c6fef,#e879f9,#00d4aa); -webkit-background-clip:text; background-clip:text; -webkit-text-fill-color:transparent; }
.dash-sub { font-size:14px; color:var(--mid); margin:0; }
.dash-role { color:#a89cf7; font-weight:500; }
.dash-quickfacts { display:flex; align-items:center; gap:1.4rem; padding:14px 22px; background:var(--panel); border:1px solid var(--border); border-radius:14px; }
.dash-qf { text-align:center; }
.dash-qf-num { font-size:1.15rem; font-weight:800; color:var(--hi); letter-spacing:-0.02em; }
.dash-qf-lbl { font-size:10.5px; color:var(--lo); margin-top:2px; }
.dash-qf-divider { width:1px; height:30px; background:rgba(255,255,255,0.08); }

/* Top zone */
.dash-top { display:grid; grid-template-columns:1.8fr 1fr; gap:16px; margin-bottom:2.5rem; }
.dash-spotlight {
  display:flex; align-items:center; gap:1.5rem;
  background:linear-gradient(135deg, rgba(124,111,239,0.13), rgba(232,121,249,0.05), rgba(0,0,0,0));
  border:1px solid rgba(124,111,239,0.22); border-radius:20px;
  padding:clamp(1.6rem,2.5vw,2.4rem); position:relative; overflow:hidden;
  box-shadow:0 20px 50px rgba(0,0,0,0.3);
}
.dash-spot-text { flex:1; }
.dash-spot-eyebrow { font-size:11px; font-weight:700; letter-spacing:0.12em; text-transform:uppercase; color:var(--gold); }
.dash-spot-title { font-size:clamp(1.35rem,2vw,1.8rem); font-weight:800; letter-spacing:-0.02em; line-height:1.2; margin:11px 0 11px; max-width:20ch; }
.dash-spot-desc { font-size:13.5px; color:var(--mid); line-height:1.65; max-width:46ch; margin:0 0 20px; }
.dash-spot-btns { display:flex; gap:11px; flex-wrap:wrap; }
.dash-btn-primary { padding:11px 24px; background:linear-gradient(135deg,#7c6fef,#9b6ef3); border:none; border-radius:11px; color:#fff; font-size:13.5px; font-weight:700; cursor:pointer; font-family:inherit; box-shadow:0 8px 24px rgba(124,111,239,0.38); transition:filter 0.18s, transform 0.12s; }
.dash-btn-primary:hover { filter:brightness(1.1); }
.dash-btn-primary:active { transform:translateY(1px); }
.dash-btn-ghost { padding:11px 20px; background:rgba(255,255,255,0.04); border:1px solid rgba(124,111,239,0.3); border-radius:11px; color:#a89cf7; font-size:13.5px; font-weight:600; cursor:pointer; font-family:inherit; transition:all 0.18s; }
.dash-btn-ghost:hover { background:rgba(124,111,239,0.1); color:#c9c2f8; }
.dash-spot-visual { flex-shrink:0; }
.dash-ring { width:118px; height:118px; border-radius:50%; position:relative; background:conic-gradient(from 140deg, #7c6fef, #e879f9, #00d4aa, #7c6fef); display:flex; align-items:center; justify-content:center; box-shadow:0 0 40px rgba(124,111,239,0.3); }
.dash-ring::after { content:""; position:absolute; inset:8px; border-radius:50%; background:#0b0b14; }
.dash-ring-core { position:relative; z-index:1; font-size:40px; }

/* Companion */
.dash-companion { background:linear-gradient(145deg, rgba(124,111,239,0.06), rgba(0,0,0,0)); border:1px solid var(--border); border-radius:20px; padding:24px; display:flex; flex-direction:column; justify-content:center; }
.dash-panel-label { font-size:11px; font-weight:700; letter-spacing:0.1em; text-transform:uppercase; color:var(--hi); margin-bottom:18px; }
.dash-trust-list { display:flex; flex-direction:column; gap:15px; }
.dash-trust-item { display:flex; gap:11px; }
.dash-trust-dot { width:8px; height:8px; border-radius:50%; background:linear-gradient(135deg,#7c6fef,#00d4aa); margin-top:5px; flex-shrink:0; box-shadow:0 0 10px rgba(124,111,239,0.5); }
.dash-trust-label { font-size:13px; font-weight:600; color:var(--hi); margin-bottom:3px; }
.dash-trust-desc { font-size:12px; color:var(--lo); line-height:1.55; }

/* Section label */
.dash-section-label { font-size:12px; font-weight:700; letter-spacing:0.1em; text-transform:uppercase; color:var(--mid); margin-bottom:15px; }

/* Toolkit — full width 4 across */
.dash-tools { display:grid; grid-template-columns:repeat(4,1fr); gap:14px; margin-bottom:2.5rem; }
.dash-tool { background:var(--panel); border:1px solid var(--border); border-radius:18px; padding:22px; cursor:pointer; text-align:left; font-family:inherit; display:flex; flex-direction:column; transition:all 0.3s ease; }
.dash-tool-icon { width:44px; height:44px; border-radius:12px; display:flex; align-items:center; justify-content:center; font-size:22px; margin-bottom:16px; }
.dash-tool-name { font-size:15px; font-weight:700; color:var(--hi); margin-bottom:8px; letter-spacing:-0.01em; }
.dash-tool-desc { font-size:12.5px; color:var(--mid); line-height:1.6; flex:1; margin-bottom:16px; }
.dash-tool-open { font-size:12.5px; font-weight:700; display:flex; align-items:center; gap:5px; }

/* Path — full width horizontal steps */
.dash-path { display:grid; grid-template-columns:repeat(5,1fr); gap:12px; }
.dash-pathstep { background:var(--panel); border:1px solid var(--border); border-radius:16px; padding:20px; cursor:pointer; text-align:left; font-family:inherit; display:flex; flex-direction:column; transition:all 0.25s ease; position:relative; }
.dash-pathstep:hover { border-color:rgba(124,111,239,0.4); background:rgba(124,111,239,0.05); transform:translateY(-3px); }
.dash-pathstep-n { font-size:13px; font-weight:800; color:var(--pur); letter-spacing:0.05em; margin-bottom:14px; opacity:0.8; }
.dash-pathstep-label { font-size:13.5px; font-weight:700; color:var(--hi); margin-bottom:6px; line-height:1.3; }
.dash-pathstep-sub { font-size:11.5px; color:var(--lo); line-height:1.5; flex:1; margin-bottom:14px; }
.dash-pathstep-go { font-size:11.5px; font-weight:700; color:var(--pur); opacity:0; transition:opacity 0.2s; }
.dash-pathstep:hover .dash-pathstep-go { opacity:1; }

/* Responsive */
@media (max-width:1100px) {
  .dash-top { grid-template-columns:1fr; }
  .dash-tools { grid-template-columns:repeat(2,1fr); }
  .dash-path { grid-template-columns:repeat(3,1fr); }
}
@media (max-width:680px) {
  .dash-quickfacts { display:none; }
  .dash-spotlight { flex-direction:column; text-align:center; }
  .dash-spot-title, .dash-spot-desc { max-width:none; }
  .dash-spot-btns { justify-content:center; }
  .dash-tools { grid-template-columns:1fr; }
  .dash-path { grid-template-columns:1fr; }
}
@media (prefers-reduced-motion: reduce) { .rv { animation:none; opacity:1; } }
`;

export default Dashboard;
