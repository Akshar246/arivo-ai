import { useState, useRef, useEffect } from "react";
import axios from "axios";

// ─────────────────────────────────────────────────────────────
// ATS READINESS PAGE · Arivo AI
// 3-state journey: invite (live console) → analysing → results.
// Backend contract unchanged:
//   POST /extract-pdf  → { text }
//   POST /ats/analyse  → { overall_score, categories[], missing_keywords[],
//                          weak_bullets[], international_lens{status,headline,flags[]} }
// Palette aligned to the new purple system.
// ─────────────────────────────────────────────────────────────

const AI_URL = import.meta.env.VITE_AI_URL;
const EXTRACT_ENDPOINT = `${AI_URL}/extract-pdf`;
const ATS_ENDPOINT = `${AI_URL}/ats/analyse`;

const C = {
  bg: "#08080f",
  panel: "#0f0f18",
  panel2: "#15151f",
  inset: "#0b0b12",
  border: "rgba(255,255,255,0.07)",
  borderHi: "rgba(124,111,239,0.4)",
  text: "#f0f0ff",
  text2: "#8888aa",
  text3: "#55556a",
  grad: "linear-gradient(135deg, #7c6fef, #9b6ef3)",
  green: "#00d4aa",
  amber: "#f5c451",
  red: "#ff7a7a",
};

const STEPS = [
  "Reading your CV",
  "Checking ATS parse-ability",
  "Matching keywords to the job",
  "Scanning sections & contact details",
  "Judging your bullet points",
  "Running the International Student Lens",
];

// What the right-hand console advertises (educational + builds trust)
const CHECKS = [
  { t: "Parse-ability", d: "Can the software read your CV at all?" },
  { t: "Keyword match", d: "Do your words match what the job asks for?" },
  {
    t: "Sections & contact",
    d: "Are the expected sections and details there?",
  },
  {
    t: "Action verbs & impact",
    d: "Do your bullets show real, measurable results?",
  },
  { t: "Formatting", d: "Anything that quietly breaks an automated parser?" },
];

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

function useCountUp(target, duration = 1100) {
  const end = Number(target) || 0;
  const reduced = prefersReducedMotion();
  const [value, setValue] = useState(reduced ? end : 0);
  useEffect(() => {
    if (reduced) return;
    let raf;
    const start = performance.now();
    const tick = (now) => {
      const p = Math.min((now - start) / duration, 1);
      setValue(Math.round(end * easeOutCubic(p)));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [end, duration, reduced]);
  return value;
}

const scoreBand = (s) => {
  if (s >= 75)
    return { label: "ATS-ready", grad: "url(#ats-good)", text: C.green };
  if (s >= 50)
    return { label: "Good foundation", grad: "url(#ats-mid)", text: C.amber };
  return { label: "Needs work", grad: "url(#ats-low)", text: C.red };
};

const statusColor = (status) =>
  status === "pass" ? C.green : status === "warn" ? C.amber : C.red;

function ATS({ onNavigate }) {
  const [stage, setStage] = useState("invite");
  const [jobText, setJobText] = useState("");
  const [file, setFile] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState("");
  const [stepDone, setStepDone] = useState(-1);
  const [result, setResult] = useState(null);
  const fileInput = useRef(null);

  const pickFile = (f) => {
    if (!f) return;
    if (f.type !== "application/pdf") {
      setError("Please upload a PDF file — that's what ATS systems read.");
      return;
    }
    if (f.size > 5 * 1024 * 1024) {
      setError("That file is over 5MB. Try a smaller PDF.");
      return;
    }
    setError("");
    setFile(f);
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    pickFile(e.dataTransfer.files?.[0]);
  };

  const analyse = async () => {
    setError("");
    if (!jobText.trim()) {
      setError(
        "Paste the job description first — we match your CV against it.",
      );
      return;
    }
    if (!file) {
      setError("Upload your CV as a PDF so we can read it the way ATS does.");
      return;
    }

    setStage("analysing");
    setStepDone(-1);

    let tick = 0;
    const timer = setInterval(() => {
      tick += 1;
      setStepDone((d) => (d < STEPS.length - 2 ? d + 1 : d));
      if (tick >= STEPS.length - 1) clearInterval(timer);
    }, 650);

    try {
      const fd = new FormData();
      fd.append("file", file);
      const ex = await axios.post(EXTRACT_ENDPOINT, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const cvText = ex.data?.text || "";

      const res = await axios.post(ATS_ENDPOINT, {
        cv_text: cvText,
        job_description: jobText,
      });

      clearInterval(timer);
      setStepDone(STEPS.length - 1);
      setResult(res.data);
      setTimeout(() => setStage("results"), 600);
    } catch (err) {
      clearInterval(timer);
      setStage("invite");
      setError(
        err.response?.data?.detail ||
          "Couldn't analyse the CV. Make sure the AI service is running and try again.",
      );
    }
  };

  const reset = () => {
    setStage("invite");
    setResult(null);
    setFile(null);
    setJobText("");
    setStepDone(-1);
    setError("");
  };

  return (
    <div style={{ background: C.bg, minHeight: "calc(100vh - 56px)" }}>
      <style>{css}</style>
      <div className="ats-wrap">
        {stage === "invite" && (
          <Invite
            jobText={jobText}
            setJobText={setJobText}
            file={file}
            dragOver={dragOver}
            setDragOver={setDragOver}
            onDrop={onDrop}
            fileInput={fileInput}
            pickFile={pickFile}
            error={error}
            analyse={analyse}
          />
        )}
        {stage === "analysing" && <Analysing stepDone={stepDone} />}
        {stage === "results" && result && (
          <Results result={result} reset={reset} onNavigate={onNavigate} />
        )}
      </div>
    </div>
  );
}

function Invite(props) {
  const {
    jobText,
    setJobText,
    file,
    dragOver,
    setDragOver,
    onDrop,
    fileInput,
    pickFile,
    error,
    analyse,
  } = props;

  const jobReady = jobText.trim().length > 80;
  const cvReady = !!file;
  const bothReady = jobReady && cvReady;

  return (
    <>
      <header className="ats-hero">
        <span className="ats-eyebrow">ATS Readiness</span>
        <h1 className="ats-title">
          See your CV the way a recruiter's robot does.
        </h1>
        <p className="ats-sub">
          Most CVs are filtered by software before a human ever reads them.
          Arivo checks what those systems actually look at — and shows you
          exactly what to fix. No fake guarantees, just the truth.
        </p>
      </header>

      <div className="ats-console">
        {/* LEFT — the workbench */}
        <div className="ats-work">
          <div className="ats-card">
            <label className="ats-label">
              <span className="ats-step-num">1</span> Paste the job description
              {jobReady && <span className="ats-ready-tag">✓ ready</span>}
            </label>
            <textarea
              className="ats-textarea"
              placeholder="Paste the full job posting here — responsibilities, requirements, everything. The more complete, the better we match your keywords."
              value={jobText}
              onChange={(e) => setJobText(e.target.value)}
            />
            <span className="ats-hint">
              {jobText.length} characters
              {jobReady ? " · looks good" : " · paste the full posting"}
            </span>
          </div>

          <div className="ats-card">
            <label className="ats-label">
              <span className="ats-step-num">2</span> Upload your CV
              {cvReady && <span className="ats-ready-tag">✓ ready</span>}
            </label>
            <div
              className={`ats-drop ${dragOver ? "is-over" : ""} ${file ? "has-file" : ""}`}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={onDrop}
              onClick={() => fileInput.current?.click()}
            >
              <input
                ref={fileInput}
                type="file"
                accept="application/pdf"
                hidden
                onChange={(e) => pickFile(e.target.files?.[0])}
              />
              {file ? (
                <div className="ats-file">
                  <div className="ats-file-ic">✓</div>
                  <div>
                    <div className="ats-file-name">{file.name}</div>
                    <div className="ats-file-meta">
                      {(file.size / 1024).toFixed(0)} KB · click to replace
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <div className="ats-drop-ic">
                    <svg
                      width="26"
                      height="26"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <path d="M17 8l-5-5-5 5" />
                      <path d="M12 3v12" />
                    </svg>
                  </div>
                  <div className="ats-drop-main">Drop your CV here</div>
                  <div className="ats-drop-sub">
                    or click to browse · PDF only
                  </div>
                </>
              )}
            </div>
          </div>

          {error && <div className="ats-error">{error}</div>}

          <button
            className={`ats-btn ${bothReady ? "is-ready" : ""}`}
            onClick={analyse}
          >
            {bothReady ? "Analyse my CV" : "Add both to analyse"}
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </button>
          <span className="ats-cta-note">
            Your CV is analysed in the moment and never shared.
          </span>
        </div>

        {/* RIGHT — live readiness console */}
        <aside className="ats-preview">
          <div className="ats-preview-head">What Arivo checks</div>

          <div className="ats-ready">
            <div className={`ats-ready-pill ${jobReady ? "on" : ""}`}>
              <span className="ats-ready-ic">{jobReady ? "✓" : "1"}</span> Job
              description
            </div>
            <div className={`ats-ready-pill ${cvReady ? "on" : ""}`}>
              <span className="ats-ready-ic">{cvReady ? "✓" : "2"}</span> Your
              CV
            </div>
          </div>

          <div className="ats-lens-hero">
            <span className="ats-lens-hero-badge">
              🌍 International Student Lens
            </span>
            <div className="ats-lens-hero-t">The check no one else runs</div>
            <div className="ats-lens-hero-d">
              We flag home-country CV habits — a photo, date of birth,
              nationality, marital status — that are normal elsewhere but
              quietly fail UK screening.
            </div>
          </div>

          <div className="ats-checks">
            {CHECKS.map((c) => (
              <div className="ats-check" key={c.t}>
                <span className="ats-check-ic">
                  <svg
                    width="13"
                    height="13"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                </span>
                <div>
                  <div className="ats-check-t">{c.t}</div>
                  <div className="ats-check-d">{c.d}</div>
                </div>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </>
  );
}

function Analysing({ stepDone }) {
  return (
    <div className="ats-analysing">
      <div className="ats-pulse">
        <div className="ats-pulse-ring" />
        <div className="ats-pulse-core">🌍</div>
      </div>
      <h2 className="ats-analysing-title">
        Reading your CV like an ATS would…
      </h2>
      <ul className="ats-steps">
        {STEPS.map((s, i) => {
          const done = i <= stepDone;
          const active = i === stepDone + 1;
          return (
            <li
              key={s}
              className={`ats-stepline ${done ? "done" : ""} ${active ? "active" : ""}`}
            >
              <span className="ats-tick">
                {done ? (
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                ) : (
                  <span className="ats-dot" />
                )}
              </span>
              {s}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function Results({ result, reset, onNavigate }) {
  const {
    overall_score = 0,
    categories = [],
    missing_keywords = [],
    weak_bullets = [],
    international_lens = { status: "clear", headline: "", flags: [] },
  } = result;

  const lensHasFlags =
    international_lens.status === "flags_found" &&
    (international_lens.flags || []).length > 0;

  return (
    <div className="ats-res">
      <div className="ats-res-hero">
        <RadialGauge score={overall_score} />
        <div className="ats-res-verdict">
          <h2 className="ats-res-h">Your ATS Readiness</h2>
          <p className="ats-res-p">
            This is how well your CV holds up against automated screening for
            the job you pasted. Work through the fixes below — each one lifts
            your real-world chances.
          </p>
          <button className="ats-btn-ghost" onClick={reset}>
            ← Analyse another CV
          </button>
        </div>
      </div>

      <section className={`ats-lens ${lensHasFlags ? "has-flags" : "clear"}`}>
        <div className="ats-lens-head">
          <span className="ats-lens-badge">🌍 International Student Lens</span>
          <span className="ats-lens-headline">
            {international_lens.headline}
          </span>
        </div>
        {lensHasFlags ? (
          <div className="ats-lens-flags">
            {international_lens.flags.map((f, i) => (
              <div key={i} className="ats-flag">
                <div className="ats-flag-issue">
                  <span className="ats-flag-warn">!</span>
                  {f.issue}
                </div>
                <div className="ats-flag-why">{f.why}</div>
                <div className="ats-flag-fix">
                  <span className="ats-flag-fix-tag">Fix</span>
                  {f.fix}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="ats-lens-clear">
            Your CV follows UK conventions — no home-country formatting issues
            found.
          </div>
        )}
      </section>

      <section className="ats-cats">
        <h3 className="ats-section-h">The breakdown</h3>
        <div className="ats-cat-grid">
          {categories.map((c) => (
            <CategoryCard key={c.name} c={c} />
          ))}
        </div>
      </section>

      {missing_keywords.length > 0 && (
        <section className="ats-block">
          <h3 className="ats-section-h">
            Keywords the job wants — missing from your CV
          </h3>
          <p className="ats-block-sub">
            Weave the real ones into your experience and skills (only if they're
            true for you).
          </p>
          <div className="ats-chips">
            {missing_keywords.map((k) => (
              <span key={k} className="ats-chip">
                {k}
              </span>
            ))}
          </div>
        </section>
      )}

      {weak_bullets.length > 0 && (
        <section className="ats-block">
          <h3 className="ats-section-h">Bullets worth rewriting</h3>
          <p className="ats-block-sub">
            These read as passive. Start with a strong verb and add a number or
            result.
          </p>
          <ul className="ats-weak">
            {weak_bullets.map((b, i) => (
              <li key={i} className="ats-weak-item">
                <span className="ats-weak-quote">"{b}"</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="ats-bridges">
        <h3 className="ats-section-h">Keep going</h3>
        <div className="ats-bridge-grid">
          <button className="ats-bridge" onClick={() => onNavigate("profile")}>
            <div className="ats-bridge-ic">🎯</div>
            <div className="ats-bridge-t">See your full skill gap</div>
            <div className="ats-bridge-d">
              Find exactly which skills UK employers want for your target role.
            </div>
          </button>
          <button className="ats-bridge" onClick={() => onNavigate("jobs")}>
            <div className="ats-bridge-ic">💼</div>
            <div className="ats-bridge-t">Browse visa-sponsored jobs</div>
            <div className="ats-bridge-d">
              Real London roles checked against the official sponsor register.
            </div>
          </button>
          <button className="ats-bridge" onClick={() => onNavigate("chat")}>
            <div className="ats-bridge-ic">💬</div>
            <div className="ats-bridge-t">Ask your Coach</div>
            <div className="ats-bridge-d">
              Get help rewriting a bullet or tailoring your CV to a role.
            </div>
          </button>
        </div>
        <p className="ats-bridge-note">
          Use the menu above to jump to any of these.
        </p>
      </section>
    </div>
  );
}

function RadialGauge({ score }) {
  const safe = Math.max(0, Math.min(100, Number(score) || 0));
  const shown = useCountUp(safe, 1100);
  const band = scoreBand(safe);
  const r = 54;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - shown / 100);

  return (
    <div className="ats-gauge">
      <svg viewBox="0 0 120 120" className="ats-gauge-svg" aria-hidden="true">
        <defs>
          <linearGradient id="ats-good" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#00b894" />
            <stop offset="100%" stopColor="#00d4aa" />
          </linearGradient>
          <linearGradient id="ats-mid" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#e0a83c" />
            <stop offset="100%" stopColor="#f5c451" />
          </linearGradient>
          <linearGradient id="ats-low" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#e74c3c" />
            <stop offset="100%" stopColor="#ff7a7a" />
          </linearGradient>
        </defs>
        <circle cx="60" cy="60" r={r} className="ats-gauge-track" />
        <circle
          cx="60"
          cy="60"
          r={r}
          className="ats-gauge-prog"
          stroke={band.grad}
          strokeDasharray={circ}
          strokeDashoffset={offset}
          transform="rotate(-90 60 60)"
        />
      </svg>
      <div className="ats-gauge-center">
        <div className="ats-gauge-num">
          {shown}
          <span>/100</span>
        </div>
        <div className="ats-gauge-label" style={{ color: band.text }}>
          {band.label}
        </div>
      </div>
    </div>
  );
}

function CategoryCard({ c }) {
  const color = statusColor(c.status);
  const pct = Math.round((c.score / c.max) * 100);
  return (
    <div className="ats-cat">
      <div className="ats-cat-top">
        <span className="ats-cat-name">{c.name}</span>
        <span className="ats-cat-score" style={{ color }}>
          {c.score}
          <span className="ats-cat-max">/{c.max}</span>
        </span>
      </div>
      <div className="ats-cat-bar">
        <div
          className="ats-cat-fill"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
      <p className="ats-cat-detail">{c.detail}</p>
    </div>
  );
}

const css = `
.ats-wrap {
  padding: 2.5rem clamp(1.5rem,4vw,4.5rem) 5rem;
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
  color: ${C.text};
}
@keyframes ats-up { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }

/* Hero (left-aligned, compact) */
.ats-hero { max-width: 680px; margin: 0 0 2rem; animation: ats-up .5s ease both; }
.ats-eyebrow { display:inline-block; font-size:11px; font-weight:700; letter-spacing:.14em; text-transform:uppercase; color:#a89cf7; margin-bottom:14px; padding:5px 12px; border:1px solid ${C.borderHi}; border-radius:999px; background:rgba(124,111,239,.08); }
.ats-title { font-size:clamp(1.9rem,3.2vw,2.4rem); line-height:1.12; font-weight:800; letter-spacing:-.03em; margin:0 0 14px; }
.ats-sub { font-size:14.5px; line-height:1.65; color:${C.text2}; margin:0; }

/* Console */
.ats-console { display:grid; grid-template-columns:1.05fr 0.95fr; gap:18px; align-items:start; animation: ats-up .5s ease .08s both; }
.ats-work { display:flex; flex-direction:column; gap:16px; }
.ats-card { background:${C.panel}; border:1px solid ${C.border}; border-radius:16px; padding:20px; display:flex; flex-direction:column; }
.ats-label { display:flex; align-items:center; gap:9px; font-size:14px; font-weight:700; color:${C.text}; margin-bottom:13px; }
.ats-step-num { display:inline-flex; align-items:center; justify-content:center; width:22px; height:22px; border-radius:50%; background:${C.grad}; color:#fff; font-size:12px; font-weight:700; flex-shrink:0; }
.ats-ready-tag { margin-left:auto; font-size:11px; font-weight:700; color:${C.green}; background:rgba(0,212,170,.12); border:1px solid rgba(0,212,170,.3); padding:3px 10px; border-radius:999px; }
.ats-textarea { flex:1; min-height:170px; resize:vertical; background:${C.inset}; border:1px solid ${C.border}; border-radius:11px; padding:13px; color:${C.text}; font-size:13.5px; line-height:1.55; font-family:inherit; outline:none; transition:border-color .18s, box-shadow .18s; }
.ats-textarea:focus { border-color:#7c6fef; box-shadow:0 0 0 3px rgba(124,111,239,.15); }
.ats-textarea::placeholder { color:${C.text3}; }
.ats-hint { font-size:11.5px; color:${C.text3}; margin-top:8px; align-self:flex-end; }
.ats-drop { flex:1; min-height:150px; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:7px; cursor:pointer; background:${C.inset}; border:1.5px dashed ${C.border}; border-radius:11px; transition:all .18s; text-align:center; padding:20px; }
.ats-drop:hover { border-color:${C.borderHi}; background:rgba(124,111,239,.04); }
.ats-drop.is-over { border-color:#7c6fef; background:rgba(124,111,239,.08); transform:scale(1.01); }
.ats-drop.has-file { border-style:solid; border-color:rgba(0,212,170,.4); background:rgba(0,212,170,.05); }
.ats-drop-ic { color:${C.text3}; }
.ats-drop:hover .ats-drop-ic { color:#a89cf7; }
.ats-drop-main { font-size:14.5px; font-weight:700; color:${C.text}; }
.ats-drop-sub { font-size:12.5px; color:${C.text3}; }
.ats-file { display:flex; align-items:center; gap:13px; }
.ats-file-ic { width:38px; height:38px; border-radius:50%; background:rgba(0,212,170,.15); color:${C.green}; display:flex; align-items:center; justify-content:center; font-size:18px; font-weight:700; flex-shrink:0; }
.ats-file-name { font-size:14px; font-weight:700; color:${C.text}; word-break:break-all; }
.ats-file-meta { font-size:12px; color:${C.text3}; margin-top:2px; }
.ats-error { background:rgba(255,122,122,.10); border:1px solid rgba(255,122,122,.35); color:${C.red}; font-size:13px; padding:11px 15px; border-radius:10px; text-align:center; }
.ats-btn { display:inline-flex; align-items:center; justify-content:center; gap:9px; padding:14px 30px; background:${C.grad}; color:#fff; border:none; border-radius:12px; font-size:15px; font-weight:700; cursor:pointer; box-shadow:0 8px 24px rgba(124,111,239,.3); transition:filter .18s, transform .12s, box-shadow .2s; opacity:.78; }
.ats-btn.is-ready { opacity:1; box-shadow:0 10px 30px rgba(124,111,239,.5); animation:ats-glow 2.2s ease-in-out infinite; }
@keyframes ats-glow { 0%,100%{ box-shadow:0 10px 30px rgba(124,111,239,.4); } 50%{ box-shadow:0 10px 38px rgba(124,111,239,.65); } }
.ats-btn:hover { filter:brightness(1.1); }
.ats-btn:active { transform:translateY(1px); }
.ats-cta-note { font-size:12px; color:${C.text3}; text-align:center; }

/* Right console */
.ats-preview { background:linear-gradient(160deg, rgba(124,111,239,.06), rgba(0,0,0,0)); border:1px solid ${C.border}; border-radius:18px; padding:22px; position:sticky; top:74px; }
.ats-preview-head { font-size:11px; font-weight:700; letter-spacing:.1em; text-transform:uppercase; color:${C.text2}; margin-bottom:16px; }
.ats-ready { display:flex; gap:8px; margin-bottom:18px; }
.ats-ready-pill { flex:1; display:flex; align-items:center; gap:8px; font-size:12.5px; font-weight:600; color:${C.text3}; background:${C.inset}; border:1px solid ${C.border}; border-radius:10px; padding:9px 12px; transition:all .25s; }
.ats-ready-pill .ats-ready-ic { width:18px; height:18px; border-radius:50%; display:inline-flex; align-items:center; justify-content:center; font-size:10px; font-weight:800; background:${C.panel2}; color:${C.text3}; flex-shrink:0; }
.ats-ready-pill.on { color:${C.text}; border-color:rgba(0,212,170,.35); background:rgba(0,212,170,.07); }
.ats-ready-pill.on .ats-ready-ic { background:${C.green}; color:#04201b; }

.ats-lens-hero { background:linear-gradient(135deg, rgba(124,111,239,.16), rgba(232,121,249,.08)); border:1px solid ${C.borderHi}; border-radius:14px; padding:18px; margin-bottom:18px; }
.ats-lens-hero-badge { display:inline-block; font-size:12px; font-weight:800; color:#fff; background:rgba(255,255,255,.08); padding:5px 11px; border-radius:999px; border:1px solid rgba(255,255,255,.1); margin-bottom:11px; }
.ats-lens-hero-t { font-size:15px; font-weight:800; letter-spacing:-.01em; margin-bottom:6px; }
.ats-lens-hero-d { font-size:12.5px; line-height:1.6; color:${C.text2}; }

.ats-checks { display:flex; flex-direction:column; gap:3px; }
.ats-check { display:flex; gap:11px; padding:10px; border-radius:10px; transition:background .15s; }
.ats-check:hover { background:rgba(255,255,255,.02); }
.ats-check-ic { width:22px; height:22px; flex-shrink:0; border-radius:50%; background:rgba(124,111,239,.12); color:#a89cf7; display:flex; align-items:center; justify-content:center; }
.ats-check-t { font-size:13px; font-weight:700; color:${C.text}; }
.ats-check-d { font-size:12px; color:${C.text3}; line-height:1.45; margin-top:2px; }

/* Analysing */
.ats-analysing { text-align:center; padding:40px 0 20px; max-width:460px; margin:0 auto; }
.ats-pulse { position:relative; width:92px; height:92px; margin:0 auto 28px; }
.ats-pulse-ring { position:absolute; inset:0; border-radius:50%; background:${C.grad}; opacity:.25; animation:ats-pulse 1.6s ease-in-out infinite; }
.ats-pulse-core { position:absolute; inset:0; display:flex; align-items:center; justify-content:center; font-size:38px; }
@keyframes ats-pulse { 0%,100%{ transform:scale(.85); opacity:.25; } 50%{ transform:scale(1.15); opacity:.45; } }
.ats-analysing-title { font-size:19px; font-weight:800; color:${C.text}; margin:0 0 28px; letter-spacing:-.02em; }
.ats-steps { list-style:none; margin:0; padding:0; text-align:left; display:flex; flex-direction:column; gap:4px; }
.ats-stepline { display:flex; align-items:center; gap:12px; padding:11px 14px; border-radius:10px; font-size:14px; color:${C.text3}; transition:all .3s; }
.ats-stepline.active { color:${C.text}; background:${C.panel}; }
.ats-stepline.done { color:${C.text2}; }
.ats-tick { width:22px; height:22px; border-radius:50%; display:flex; align-items:center; justify-content:center; flex-shrink:0; transition:all .3s; }
.ats-stepline.done .ats-tick { background:rgba(0,212,170,.15); color:${C.green}; }
.ats-stepline:not(.done) .ats-tick { background:${C.panel2}; }
.ats-dot { width:7px; height:7px; border-radius:50%; background:${C.text3}; }
.ats-stepline.active .ats-dot { background:#a89cf7; animation:ats-blink 1s ease-in-out infinite; }
@keyframes ats-blink { 50%{ opacity:.3; } }

/* Results */
.ats-res { display:flex; flex-direction:column; gap:30px; animation: ats-up .5s ease both; }
.ats-res-hero { display:flex; align-items:center; gap:32px; background:${C.panel}; border:1px solid ${C.border}; border-radius:20px; padding:30px 32px; }
.ats-res-verdict { flex:1; }
.ats-res-h { font-size:22px; font-weight:800; letter-spacing:-.02em; color:${C.text}; margin:0 0 8px; }
.ats-res-p { font-size:14px; line-height:1.6; color:${C.text2}; margin:0 0 16px; }
.ats-gauge { position:relative; width:150px; height:150px; flex-shrink:0; }
.ats-gauge-svg { width:100%; height:100%; }
.ats-gauge-track { fill:none; stroke:${C.inset}; stroke-width:11; }
.ats-gauge-prog { fill:none; stroke-width:11; stroke-linecap:round; transition:stroke-dashoffset .3s ease; }
.ats-gauge-center { position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; justify-content:center; }
.ats-gauge-num { font-size:34px; font-weight:800; color:${C.text}; letter-spacing:-.03em; line-height:1; }
.ats-gauge-num span { font-size:14px; color:${C.text3}; font-weight:600; }
.ats-gauge-label { font-size:12.5px; font-weight:700; margin-top:5px; }
.ats-lens { border-radius:20px; padding:26px 28px; }
.ats-lens.has-flags { background:linear-gradient(135deg, rgba(124,111,239,.14), rgba(232,121,249,.08)); border:1px solid ${C.borderHi}; }
.ats-lens.clear { background:rgba(0,212,170,.06); border:1px solid rgba(0,212,170,.2); }
.ats-lens-head { display:flex; flex-direction:column; gap:8px; margin-bottom:18px; }
.ats-lens-badge { align-self:flex-start; font-size:13px; font-weight:800; color:${C.text}; background:rgba(255,255,255,.06); padding:6px 13px; border-radius:999px; border:1px solid ${C.border}; }
.ats-lens-headline { font-size:17px; font-weight:700; color:${C.text}; letter-spacing:-.02em; line-height:1.3; }
.ats-lens-flags { display:flex; flex-direction:column; gap:12px; }
.ats-flag { background:${C.inset}; border:1px solid ${C.border}; border-radius:13px; padding:16px 18px; }
.ats-flag-issue { display:flex; align-items:center; gap:10px; font-size:14.5px; font-weight:700; color:${C.text}; margin-bottom:7px; }
.ats-flag-warn { width:20px; height:20px; border-radius:50%; background:rgba(245,196,81,.18); color:${C.amber}; display:inline-flex; align-items:center; justify-content:center; font-weight:800; font-size:13px; flex-shrink:0; }
.ats-flag-why { font-size:13px; line-height:1.55; color:${C.text2}; margin-bottom:11px; }
.ats-flag-fix { display:flex; align-items:flex-start; gap:9px; font-size:13px; line-height:1.5; color:${C.text}; }
.ats-flag-fix-tag { font-size:10.5px; font-weight:800; text-transform:uppercase; letter-spacing:.06em; color:${C.green}; background:rgba(0,212,170,.12); padding:3px 8px; border-radius:6px; flex-shrink:0; margin-top:1px; }
.ats-lens-clear { font-size:14px; color:${C.text2}; }
.ats-section-h { font-size:16px; font-weight:700; color:${C.text}; margin:0 0 16px; letter-spacing:-.02em; }
.ats-cat-grid { display:grid; grid-template-columns:repeat(auto-fit, minmax(240px, 1fr)); gap:14px; }
.ats-cat { background:${C.panel}; border:1px solid ${C.border}; border-radius:14px; padding:18px; }
.ats-cat-top { display:flex; align-items:baseline; justify-content:space-between; margin-bottom:11px; }
.ats-cat-name { font-size:14px; font-weight:600; color:${C.text}; }
.ats-cat-score { font-size:19px; font-weight:800; }
.ats-cat-max { font-size:12px; color:${C.text3}; font-weight:600; }
.ats-cat-bar { height:6px; background:${C.inset}; border-radius:999px; overflow:hidden; margin-bottom:11px; }
.ats-cat-fill { height:100%; border-radius:999px; transition:width .9s ease; }
.ats-cat-detail { font-size:12.5px; line-height:1.5; color:${C.text2}; margin:0; }
.ats-block { background:${C.panel}; border:1px solid ${C.border}; border-radius:16px; padding:22px 24px; }
.ats-block-sub { font-size:13px; color:${C.text2}; margin:-8px 0 16px; line-height:1.5; }
.ats-chips { display:flex; flex-wrap:wrap; gap:8px; }
.ats-chip { font-size:13px; font-weight:600; color:#c9c2f8; background:rgba(124,111,239,.12); border:1px solid ${C.borderHi}; padding:6px 13px; border-radius:999px; }
.ats-weak { list-style:none; margin:0; padding:0; display:flex; flex-direction:column; gap:9px; }
.ats-weak-item { background:${C.inset}; border-left:3px solid ${C.amber}; border-radius:8px; padding:11px 15px; }
.ats-weak-quote { font-size:13.5px; color:${C.text2}; font-style:italic; }
.ats-bridge-grid { display:grid; grid-template-columns:repeat(auto-fit, minmax(220px, 1fr)); gap:14px; }
.ats-bridge { background:${C.panel}; border:1px solid ${C.border}; border-radius:14px; padding:18px; transition:border-color .18s, transform .12s; font-family:inherit; text-align:left; width:100%; cursor:pointer; }
.ats-bridge:hover { border-color:${C.borderHi}; transform:translateY(-2px); }
.ats-bridge-ic { font-size:22px; margin-bottom:10px; }
.ats-bridge-t { font-size:14px; font-weight:700; color:${C.text}; margin-bottom:6px; }
.ats-bridge-d { font-size:12.5px; line-height:1.5; color:${C.text2}; }
.ats-bridge-note { font-size:12px; color:${C.text3}; text-align:center; margin:16px 0 0; }
.ats-btn-ghost { background:transparent; border:1px solid ${C.border}; color:${C.text2}; padding:10px 18px; border-radius:999px; cursor:pointer; font-size:13px; font-family:inherit; }
.ats-btn-ghost:hover { color:${C.text}; border-color:${C.borderHi}; }

@media (max-width:880px) {
  .ats-console { grid-template-columns:1fr; }
  .ats-preview { position:static; }
}
@media (max-width:600px) {
  .ats-wrap { padding:1.75rem 1.1rem 3rem; }
  .ats-res-hero { flex-direction:column; text-align:center; }
}
@media (prefers-reduced-motion: reduce) {
  .ats-pulse-ring, .ats-dot, .ats-btn.is-ready { animation:none !important; }
  .ats-gauge-prog, .ats-cat-fill { transition:none !important; }
  [class*="ats-"] { animation:none !important; }
}
`;

export default ATS;
