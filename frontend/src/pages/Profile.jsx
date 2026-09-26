import { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

const CV_ENDPOINT = `${import.meta.env.VITE_API_URL}/api/cv/upload`;
const GAP_ENDPOINT = `${import.meta.env.VITE_AI_URL}/skill-gap/analyse`;

// Utilities
const prefersReducedMotion = () => {
  try {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return false;
  }
};

const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

const formatBytes = (b) => {
  if (!b && b !== 0) return "";
  if (b < 1024) return `${b} B`;
  if (b < 1048576) return `${(b / 1024).toFixed(0)} KB`;
  return `${(b / 1048576).toFixed(1)} MB`;
};

const scoreBand = (s) => {
  if (s >= 60) return { label: "Strong match", text: "#00d4aa" };
  if (s >= 30) return { label: "Getting there", text: "#f5c451" };
  return { label: "Early days", text: "#ff7a7a" };
};

const initials = (name) => {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  return parts.length === 1
    ? parts[0][0].toUpperCase()
    : (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

// Count-up hook
function useCountUp(target, duration = 1000) {
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

// Icons
const Ic = {
  upload: (s = 20) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <path d="m17 8-5-5-5 5" />
      <path d="M12 3v12" />
    </svg>
  ),
  file: (s = 16) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6" />
    </svg>
  ),
  check: (s = 13) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  ),
  x: (s = 11) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  ),
  chevron: (s = 14) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m6 9 6 6 6-6" />
    </svg>
  ),
  sparkle: (s = 14) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2l2.4 7.6H22l-6.4 4.6 2.4 7.8L12 17.4l-6 4.6 2.4-7.8L2 9.6h7.6z" />
    </svg>
  ),
  alert: (s = 14) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v4M12 16h.01" />
    </svg>
  ),
};

// Toast
function Toast({ toast }) {
  if (!toast) return null;
  return (
    <div className={`prof-toast prof-toast--${toast.type}`} role="status" aria-live="polite">
      {Ic.alert(14)} {toast.msg}
    </div>
  );
}

// Step Header
function StepHeader({ n, done, title, sub, open, onToggle }) {
  return (
    <button
      className={`prof-step-hd ${done ? "is-done" : ""} ${open ? "is-open" : ""}`}
      onClick={onToggle}
      aria-expanded={open}
    >
      <div className={`prof-step-node ${done ? "is-done" : ""}`}>
        {done ? Ic.check(13) : <span>{n}</span>}
      </div>
      <div className="prof-step-label">
        <div className="prof-step-title">{title}</div>
        {sub && <div className="prof-step-sub">{sub}</div>}
      </div>
      <div className={`prof-step-chevron ${open ? "is-open" : ""}`}>
        {Ic.chevron(14)}
      </div>
    </button>
  );
}

// Dropzone
function Dropzone({ file, loading, uploaded, onPick, onClear, onUpload }) {
  const inputRef = useRef(null);
  const [drag, setDrag] = useState(false);

  const handleFiles = (files) => {
    const f = files?.[0];
    if (f) onPick(f);
  };

  if (uploaded && file) {
    return (
      <div className="prof-file prof-file--done">
        <div className="prof-file-ic prof-file-ic--done">{Ic.check(16)}</div>
        <div className="prof-file-info">
          <div className="prof-file-name">{file.name}</div>
          <div className="prof-file-meta">Extracted · {formatBytes(file.size)}</div>
        </div>
        <button className="prof-link-btn" onClick={() => inputRef.current?.click()}>
          Replace
        </button>
        <input
          ref={inputRef}
          type="file"
          accept=".pdf"
          hidden
          onChange={(e) => {
            handleFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>
    );
  }

  if (file) {
    return (
      <div className="prof-file-selected">
        <div className="prof-file">
          <div className="prof-file-ic">{Ic.file(16)}</div>
          <div className="prof-file-info">
            <div className="prof-file-name">{file.name}</div>
            <div className="prof-file-meta">{formatBytes(file.size)}</div>
          </div>
          {!loading && (
            <button className="prof-icon-btn" onClick={onClear} aria-label="Remove file">
              {Ic.x(12)}
            </button>
          )}
        </div>
        <button className="prof-primary prof-primary--block" onClick={onUpload} disabled={loading}>
          {loading ? <span className="prof-btn-spin"><span className="prof-spinner" /> Reading your CV…</span> : "Extract skills"}
        </button>
      </div>
    );
  }

  return (
    <div
      className={`prof-drop ${drag ? "is-drag" : ""}`}
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => {
        e.preventDefault();
        setDrag(true);
      }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDrag(false);
        handleFiles(e.dataTransfer.files);
      }}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && inputRef.current?.click()}
    >
      <div className="prof-drop-ic">{Ic.upload(22)}</div>
      <div className="prof-drop-title">Drop your CV here, or <span>browse</span></div>
      <div className="prof-drop-hint">PDF only · processed locally</div>
      <input
        ref={inputRef}
        type="file"
        accept=".pdf"
        hidden
        onChange={(e) => {
          handleFiles(e.target.files);
          e.target.value = "";
        }}
      />
    </div>
  );
}

// Radial Gauge
function RadialGauge({ score }) {
  const safe = Math.max(0, Math.min(100, Number(score) || 0));
  const shown = useCountUp(safe, 1200);
  const band = scoreBand(safe);
  const r = 52;
  const C = 2 * Math.PI * r;
  const offset = C * (1 - shown / 100);

  return (
    <div className="prof-gauge">
      <svg viewBox="0 0 120 120" className="prof-gauge-svg" aria-hidden="true">
        <defs>
          <linearGradient id="g-good-prof" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#00d4aa" />
            <stop offset="100%" stopColor="#7c6fef" />
          </linearGradient>
          <linearGradient id="g-mid-prof" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#f5c451" />
            <stop offset="100%" stopColor="#e879f9" />
          </linearGradient>
          <linearGradient id="g-low-prof" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#ff7a7a" />
            <stop offset="100%" stopColor="#e879f9" />
          </linearGradient>
        </defs>
        <circle cx="60" cy="60" r={r} className="prof-gauge-track" />
        <circle
          cx="60"
          cy="60"
          r={r}
          className="prof-gauge-arc"
          stroke={safe >= 60 ? "url(#g-good-prof)" : safe >= 30 ? "url(#g-mid-prof)" : "url(#g-low-prof)"}
          strokeDasharray={C}
          strokeDashoffset={offset}
          transform="rotate(-90 60 60)"
        />
      </svg>
      <div className="prof-gauge-inner">
        <div className="prof-gauge-num">{shown}<span>/100</span></div>
        <div className="prof-gauge-band" style={{ color: band.text }}>{band.label}</div>
      </div>
    </div>
  );
}

// Stat
function Stat({ value, label, color }) {
  const n = useCountUp(Number(value) || 0, 900);
  return (
    <div className="prof-stat">
      <div className="prof-stat-val" style={{ color }}>{n}</div>
      <div className="prof-stat-label">{label}</div>
    </div>
  );
}

// Main Component
export default function Profile() {
  const { currentUser, token } = useAuth();

  // CV state
  const [cvFile, setCvFile] = useState(null);
  const [cvLoading, setCvLoading] = useState(false);
  const [cvSkills, setCvSkills] = useState([]);
  const [cvUploaded, setCvUploaded] = useState(false);

  // Skills
  const [allSkills, setAllSkills] = useState([]);
  const [manualSkill, setManualSkill] = useState("");

  // Gap analysis
  const [targetRole, setTargetRole] = useState("");
  const [roleError, setRoleError] = useState(false);
  const [gapLoading, setGapLoading] = useState(false);
  const [gapResult, setGapResult] = useState(null);
  const [gapError, setGapError] = useState(false);

  // UI
  const [openStep, setOpenStep] = useState(1);
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);

  const flash = useCallback((type, msg) => {
    setToast({ type, msg });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 3400);
  }, []);

  useEffect(() => () => clearTimeout(toastTimer.current), []);

  // CV Upload
  const pickFile = (f) => {
    if (f.type && f.type !== "application/pdf" && !f.name.toLowerCase().endsWith(".pdf")) {
      flash("error", "PDF only");
      return;
    }
    setCvFile(f);
    setCvUploaded(false);
  };

  const uploadCV = async () => {
    if (!cvFile) return;
    setCvLoading(true);
    try {
      const fd = new FormData();
      fd.append("cv", cvFile);
      const res = await axios.post(CV_ENDPOINT, fd, {
        "headers": { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" },
      });
      const found = res.data?.skills_found || [];
      setCvSkills(found);
      setAllSkills((prev) => Array.from(new Set([...found, ...prev])));
      setCvUploaded(true);
      flash("success", `Found ${found.length} skill${found.length === 1 ? "" : "s"}`);
      setOpenStep(2);
    } catch (err) {
      flash("error", err.response?.data?.message || "Upload failed");
    }
    setCvLoading(false);
  };

  // Skills
  const addSkill = () => {
    const s = manualSkill.trim();
    if (!s) return;
    if (!allSkills.some((x) => x.toLowerCase() === s.toLowerCase())) {
      setAllSkills((prev) => [...prev, s]);
    }
    setManualSkill("");
  };

  const removeSkill = (skill) => setAllSkills((prev) => prev.filter((s) => s !== skill));
  const isManual = (skill) => !cvSkills.includes(skill);

  // Analysis
  const analyseGap = async () => {
    if (!targetRole.trim()) {
      setRoleError(true);
      flash("error", "Enter target role");
      return;
    }
    if (!allSkills.length) {
      flash("error", "Add at least one skill");
      return;
    }
    setGapLoading(true);
    setGapResult(null);
    try {
      const res = await axios.post(GAP_ENDPOINT, {
        user_skills: allSkills,
        target_role: targetRole,
        visa_only: false,
      });
      setGapResult(res.data);
    } catch {
      setGapError(true);
    }
    setGapLoading(false);
  };

  const step1done = cvUploaded;
  const step2done = allSkills.length > 0;
  const step3done = !!gapResult && !gapResult?.error;

  return (
    <div className="prof">
      <style>{CSS}</style>
      <Toast toast={toast} />

      <header className="prof-header">
        <div className="prof-header-left">
          <div className="prof-eyebrow">Profile</div>
          <h1 className="prof-title">{currentUser?.name || "Your profile"}</h1>
        </div>
        <div className="prof-header-right">
          <div className="prof-progress">
            <div className="prof-progress-val">{[step1done, step2done, step3done].filter(Boolean).length}/3</div>
          </div>
        </div>
      </header>

      <div className="prof-layout">
        {/* LEFT PANEL */}
        <div className="prof-left">
          {/* Step 1: Upload CV */}
          <div className="prof-step-card">
            <StepHeader
              n={1}
              done={step1done}
              title="Upload your CV"
              sub={step1done ? `${cvSkills.length} skills found` : "Extract your skills"}
              open={openStep === 1}
              onToggle={() => setOpenStep((p) => (p === 1 ? null : 1))}
            />
            {openStep === 1 && (
              <div className="prof-step-body">
                <Dropzone file={cvFile} loading={cvLoading} uploaded={cvUploaded} onPick={pickFile} onClear={() => setCvFile(null)} onUpload={uploadCV} />
              </div>
            )}
          </div>

          {/* Step 2: Skills */}
          <div className="prof-step-card">
            <StepHeader
              n={2}
              done={step2done}
              title="Your skills"
              sub={allSkills.length > 0 ? `${allSkills.length} in pool` : "Add your skills"}
              open={openStep === 2}
              onToggle={() => setOpenStep((p) => (p === 2 ? null : 2))}
            />
            {openStep === 2 && (
              <div className="prof-step-body">
                <div className="prof-skill-add">
                  <input
                    className="prof-input"
                    value={manualSkill}
                    onChange={(e) => setManualSkill(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addSkill()}
                    placeholder="e.g. React, Python, Design…"
                  />
                  <button className="prof-add-btn" onClick={addSkill}>{Ic.plus(15)}</button>
                </div>
                {allSkills.length > 0 ? (
                  <div className="prof-skills">
                    {allSkills.map((skill) => (
                      <span key={skill} className={`prof-chip ${isManual(skill) ? "is-manual" : ""}`}>
                        {skill}
                        <button className="prof-chip-x" onClick={() => removeSkill(skill)}>{Ic.x(10)}</button>
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="prof-hint">Upload CV or type to add</p>
                )}
              </div>
            )}
          </div>

          {/* Step 3: Analyse */}
          <div className="prof-step-card">
            <StepHeader
              n={3}
              done={step3done}
              title="Market readiness"
              sub={step3done ? `Analysis complete` : "Run gap analysis"}
              open={openStep === 3}
              onToggle={() => setOpenStep((p) => (p === 3 ? null : 3))}
            />
            {openStep === 3 && (
              <div className="prof-step-body">
                <input
                  className={`prof-input prof-input--block ${roleError ? "is-err" : ""}`}
                  value={targetRole}
                  onChange={(e) => {
                    setTargetRole(e.target.value);
                    setRoleError(false);
                  }}
                  placeholder="e.g. Software Engineer, Data Scientist…"
                />
                {roleError && <p className="prof-err-msg">Enter target role</p>}
                <button className="prof-cta" onClick={analyseGap} disabled={gapLoading}>
                  {gapLoading ? <span className="prof-btn-spin"><span className="prof-spinner" /> Analysing…</span> : <>Analyse skill gap</>}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div className="prof-right">
          {gapLoading && (
            <div className="prof-right-inner">
              <div className="prof-skel" style={{ width: 120, height: 120, borderRadius: "50%", margin: "0 auto 20px" }} />
              <div className="prof-skel" style={{ height: 16, width: "60%", margin: "0 auto 10px" }} />
              <div className="prof-skel" style={{ height: 12, width: "80%", margin: "0 auto" }} />
            </div>
          )}

          {!gapLoading && gapError && (
            <div className="prof-right-inner prof-error-state">
              <div className="prof-error-ico">{Ic.alert(24)}</div>
              <div className="prof-error-title">Analysis failed</div>
              <p className="prof-error-sub">Check your connection and try again</p>
              <button className="prof-primary" onClick={analyseGap}>Retry</button>
            </div>
          )}

          {!gapLoading && gapResult && !gapResult.error && (
            <div className="prof-right-inner">
              <div className="prof-results-hero">
                <RadialGauge score={gapResult.readiness_score} />
                <div className="prof-results-text">
                  <div className="prof-results-role">{gapResult.target_role}</div>
                  <div className="prof-results-label">Market Readiness</div>
                  {gapResult.summary && <p className="prof-results-summary">{gapResult.summary}</p>}
                </div>
              </div>

              <div className="prof-stats">
                <Stat value={gapResult.jobs_analysed} label="Jobs in market" color="#9b6ef3" />
                <Stat value={gapResult.visa_sponsors_found} label="Sponsor roles" color="#00d4aa" />
                <Stat value={(gapResult.matching_skills || []).length} label="Skills match" color="#e879f9" />
              </div>

              {(gapResult.matching_skills || []).length > 0 && (
                <div className="prof-block">
                  <div className="prof-block-title">Your strengths</div>
                  <div className="prof-tags">
                    {gapResult.matching_skills.map((s) => (
                      <span key={s} className="prof-tag prof-tag--good">{Ic.check(11)} {s}</span>
                    ))}
                  </div>
                </div>
              )}

              {(gapResult.missing_required || []).length > 0 && (
                <div className="prof-block">
                  <div className="prof-block-title">Critical gaps</div>
                  <div className="prof-gaps">
                    {gapResult.missing_required.map((s) => (
                      <div key={s} className="prof-gap">{s}</div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {!gapLoading && !gapResult && !gapError && (
            <div className="prof-right-inner prof-identity">
              <div className="prof-avatar">{initials(currentUser?.name)}</div>
              <div className="prof-identity-name">{currentUser?.name || "Your profile"}</div>
              <div className="prof-identity-hint">Complete the steps to unlock your analysis</div>
              <div className="prof-tip">{Ic.sparkle(13)} <span>Upload your CV to extract skills and see market readiness</span></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');

.prof {
  --p1: #7c6fef;
  --p2: #9b6ef3;
  --mg: #e879f9;
  --tl: #00d4aa;
  --gold: #f5c451;
  --red: #ff6b6b;
  --bg: #08080f;
  --s1: #0d0d1a;
  --s2: #111122;
  --s3: #181830;
  --bd: rgba(255,255,255,0.055);
  --bd2: rgba(124,111,239,0.28);
  --tx: #f0f0ff;
  --tx2: #8888aa;
  --tx3: #4e4e66;

  width: 100%;
  padding: clamp(1.5rem, 4vw, 2.5rem) clamp(1rem, 3vw, 2rem) 4rem;
  box-sizing: border-box;
  color: var(--tx);
  font-family: 'Inter', sans-serif;
  background: var(--bg);
}

.prof * { box-sizing: border-box; }

.prof-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
  padding-bottom: clamp(1.25rem, 3vw, 2rem);
  margin-bottom: clamp(1.25rem, 3vw, 2rem);
  border-bottom: 1px solid var(--bd);
}

.prof-header-left { flex: 1; }
.prof-eyebrow { font-size: 11px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: var(--p2); margin-bottom: 6px; }
.prof-title { margin: 0; font-size: clamp(20px, 3vw, 28px); font-weight: 800; letter-spacing: -0.03em; line-height: 1.1; }

.prof-header-right { flex-shrink: 0; }
.prof-progress { width: 48px; height: 48px; display: flex; align-items: center; justify-content: center; background: var(--s2); border: 1px solid var(--bd); border-radius: 50%; font-size: 11px; font-weight: 700; }
.prof-progress-val { color: var(--p2); }

.prof-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: clamp(12px, 2vw, 20px);
  align-items: start;
}

.prof-left { display: flex; flex-direction: column; gap: 10px; position: sticky; top: clamp(1rem, 2vw, 1.5rem); }
.prof-right { background: var(--s1); border: 1px solid var(--bd); border-radius: 20px; overflow: hidden; position: sticky; top: clamp(1rem, 2vw, 1.5rem); min-height: 420px; }
.prof-right-inner { padding: clamp(20px, 3vw, 28px); }

.prof-step-card { background: var(--s1); border: 1px solid var(--bd); border-radius: 18px; overflow: hidden; transition: border-color 0.2s; }
.prof-step-card:has(.is-open) { border-color: var(--bd2); }

.prof-step-hd {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 13px;
  padding: 16px 18px;
  background: transparent;
  border: none;
  cursor: pointer;
  text-align: left;
  font-family: inherit;
  transition: background 0.15s;
}

.prof-step-hd:hover { background: rgba(255,255,255,0.025); }

.prof-step-node {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 700;
  color: var(--tx2);
  background: var(--s2);
  border: 1px solid var(--bd);
  transition: all 0.25s;
}

.prof-step-node.is-done {
  background: linear-gradient(135deg, var(--p1), var(--p2));
  color: #fff;
  border-color: transparent;
  box-shadow: 0 0 14px rgba(124,111,239,0.4);
}

.prof-step-label { flex: 1; min-width: 0; }
.prof-step-title { font-size: 13.5px; font-weight: 600; color: var(--tx); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.prof-step-sub { font-size: 11.5px; color: var(--tx3); margin-top: 2px; }

.prof-step-chevron { flex-shrink: 0; color: var(--tx3); transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1); }
.prof-step-chevron.is-open { transform: rotate(180deg); color: var(--p2); }

.prof-step-body {
  padding: 0 18px 18px;
  animation: prof-slide 0.2s ease;
}

@keyframes prof-slide {
  from { opacity: 0; transform: translateY(-6px); }
  to { opacity: 1; transform: translateY(0); }
}

.prof-drop {
  border: 1.5px dashed rgba(124,111,239,0.2);
  border-radius: 14px;
  padding: clamp(20px, 3vw, 28px) 16px;
  text-align: center;
  cursor: pointer;
  background: var(--s2);
  transition: all 0.2s, transform 0.18s;
}

.prof-drop:hover { border-color: var(--bd2); background: rgba(124,111,239,0.04); }
.prof-drop.is-drag { border-color: var(--p1); background: rgba(124,111,239,0.08); transform: scale(1.01); }

.prof-drop-ic { width: 48px; height: 48px; margin: 0 auto 12px; border-radius: 14px; display: flex; align-items: center; justify-content: center; color: var(--p2); background: rgba(124,111,239,0.1); border: 1px solid rgba(124,111,239,0.2); }
.prof-drop-title { font-size: 13px; font-weight: 600; margin-bottom: 4px; color: var(--tx); }
.prof-drop-title span { color: var(--p2); text-decoration: underline; text-underline-offset: 2px; }
.prof-drop-hint { font-size: 11.5px; color: var(--tx3); }

.prof-file { display: flex; align-items: center; gap: 11px; background: var(--s2); border: 1px solid var(--bd); border-radius: 12px; padding: 11px 14px; }
.prof-file--done { border-color: rgba(0,212,170,0.2); background: rgba(0,212,170,0.04); }
.prof-file-ic { width: 36px; height: 36px; flex-shrink: 0; border-radius: 10px; display: flex; align-items: center; justify-content: center; color: var(--p2); background: rgba(124,111,239,0.1); }
.prof-file-ic--done { color: var(--tl); background: rgba(0,212,170,0.1); }
.prof-file-name { font-size: 12.5px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: var(--tx); }
.prof-file-meta { font-size: 11px; color: var(--tx3); margin-top: 2px; }
.prof-file-selected { display: flex; flex-direction: column; gap: 10px; }

.prof-input {
  background: var(--s2);
  border: 1px solid var(--bd);
  border-radius: 11px;
  color: var(--tx);
  font-size: 13px;
  padding: 10px 13px;
  outline: none;
  transition: border-color 0.18s, box-shadow 0.18s;
  font-family: inherit;
  width: 100%;
}

.prof-input::placeholder { color: var(--tx3); }
.prof-input:focus { border-color: var(--p1); box-shadow: 0 0 0 3px rgba(124,111,239,0.13); }
.prof-input.is-err { border-color: rgba(255,107,107,0.5); }
.prof-input--block { display: block; margin-bottom: 12px; }

.prof-err-msg { font-size: 11.5px; color: var(--red); margin: -6px 0 12px; }

.prof-skill-add { display: flex; gap: 8px; margin-bottom: 13px; }
.prof-skill-add .prof-input { flex: 1; }

.prof-add-btn {
  width: 40px;
  height: 40px;
  flex-shrink: 0;
  border: none;
  background: linear-gradient(135deg, var(--p1), var(--p2));
  color: #fff;
  border-radius: 11px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: filter 0.18s, transform 0.12s;
  font-family: inherit;
}

.prof-add-btn:hover { filter: brightness(1.12); }
.prof-add-btn:active { transform: scale(0.95); }

.prof-skills { display: flex; flex-wrap: wrap; gap: 6px; max-height: 148px; overflow-y: auto; }

.prof-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 6px 4px 11px;
  border-radius: 999px;
  background: rgba(124,111,239,0.12);
  border: 1px solid rgba(124,111,239,0.22);
  color: #b0a8ff;
  font-size: 11.5px;
  font-weight: 500;
  text-transform: capitalize;
  transition: border-color 0.15s;
}

.prof-chip:hover { border-color: rgba(124,111,239,0.45); }
.prof-chip.is-manual { background: rgba(232,121,249,0.08); border-color: rgba(232,121,249,0.2); color: #e8a0f9; }

.prof-chip-x {
  width: 16px;
  height: 16px;
  border: none;
  background: transparent;
  color: inherit;
  opacity: 0.5;
  cursor: pointer;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: opacity 0.15s, background 0.15s;
  font-family: inherit;
}

.prof-chip-x:hover { opacity: 1; background: rgba(255,255,255,0.12); }

.prof-hint { font-size: 12px; color: var(--tx3); margin: 0; }

.prof-cta {
  width: 100%;
  padding: 14px;
  border: none;
  border-radius: 13px;
  background: linear-gradient(135deg, var(--p1) 0%, var(--p2) 50%, var(--mg) 100%);
  color: #fff;
  font-size: 14px;
  font-weight: 700;
  font-family: inherit;
  cursor: pointer;
  letter-spacing: -0.01em;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 9px;
  transition: filter 0.2s, transform 0.12s, box-shadow 0.2s;
  box-shadow: 0 6px 24px rgba(124,111,239,0.3);
}

.prof-cta:hover:not(:disabled) { filter: brightness(1.08); box-shadow: 0 10px 32px rgba(124,111,239,0.42); }
.prof-cta:active:not(:disabled) { transform: translateY(1px); }
.prof-cta:disabled { opacity: 0.6; cursor: not-allowed; }

.prof-primary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  padding: 10px 18px;
  border: none;
  border-radius: 11px;
  background: linear-gradient(135deg, var(--p1), var(--p2));
  color: #fff;
  font-size: 12.5px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: filter 0.18s, transform 0.12s;
  white-space: nowrap;
}

.prof-primary:hover:not(:disabled) { filter: brightness(1.12); }
.prof-primary:disabled { opacity: 0.5; cursor: not-allowed; }

.prof-primary--block { width: 100%; }

.prof-btn-spin { display: inline-flex; align-items: center; gap: 8px; }
.prof-spinner {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  border: 2px solid rgba(255,255,255,0.3);
  border-top-color: #fff;
  animation: prof-spin 0.7s linear infinite;
}

@keyframes prof-spin { to { transform: rotate(360deg); } }

.prof-identity {
  padding: clamp(24px, 3.5vw, 36px) clamp(20px, 3vw, 28px);
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.prof-avatar {
  width: 68px;
  height: 68px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--p1), var(--mg));
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  font-weight: 800;
  color: #fff;
  letter-spacing: -0.02em;
  margin-bottom: 16px;
}

.prof-identity-name { font-size: 17px; font-weight: 700; letter-spacing: -0.02em; color: var(--tx); margin-bottom: 8px; }
.prof-identity-hint { font-size: 12px; color: var(--tx2); margin-bottom: 22px; }

.prof-tip {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  background: rgba(124,111,239,0.08);
  border: 1px solid rgba(124,111,239,0.18);
  border-radius: 12px;
  padding: 12px 14px;
  margin-bottom: 20px;
  font-size: 12.5px;
  color: var(--tx2);
  line-height: 1.5;
  text-align: left;
}

.prof-tip svg { flex-shrink: 0; color: var(--p2); margin-top: 1px; }

.prof-results-hero {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 20px;
  padding-bottom: 20px;
  border-bottom: 1px solid var(--bd);
}

.prof-results-text { flex: 1; min-width: 0; }
.prof-results-role { font-size: 17px; font-weight: 800; letter-spacing: -0.025em; text-transform: capitalize; color: var(--tx); }
.prof-results-label { font-size: 10px; font-weight: 700; color: var(--tx3); text-transform: uppercase; letter-spacing: 0.08em; margin: 3px 0 9px; }
.prof-results-summary { margin: 0; font-size: 12px; line-height: 1.65; color: var(--tx2); }

.prof-gauge { position: relative; width: 110px; height: 110px; flex-shrink: 0; }
.prof-gauge-svg { width: 110px; height: 110px; }
.prof-gauge-track { fill: none; stroke: rgba(255,255,255,0.05); stroke-width: 8; }
.prof-gauge-arc { fill: none; stroke-width: 8; stroke-linecap: round; }
.prof-gauge-inner {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.prof-gauge-num { font-size: 26px; font-weight: 800; letter-spacing: -0.04em; color: var(--tx); line-height: 1; }
.prof-gauge-num span { font-size: 11px; font-weight: 500; color: var(--tx3); }
.prof-gauge-band { font-size: 9.5px; font-weight: 700; margin-top: 4px; text-transform: uppercase; letter-spacing: 0.07em; }

.prof-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  margin-bottom: 20px;
}

.prof-stat {
  background: var(--s2);
  border: 1px solid var(--bd);
  border-radius: 12px;
  padding: 13px 10px;
  text-align: center;
  transition: border-color 0.2s;
}

.prof-stat:hover { border-color: var(--bd2); }
.prof-stat-val { font-size: 22px; font-weight: 800; letter-spacing: -0.03em; line-height: 1; }
.prof-stat-label { font-size: 10px; color: var(--tx3); margin-top: 4px; font-weight: 500; }

.prof-block { margin-bottom: 18px; }
.prof-block:last-child { margin-bottom: 0; }
.prof-block-title { font-size: 10.5px; font-weight: 700; letter-spacing: 0.07em; text-transform: uppercase; color: var(--tx2); margin-bottom: 10px; }

.prof-tags { display: flex; flex-wrap: wrap; gap: 6px; }
.prof-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 11px;
  border-radius: 999px;
  font-size: 11.5px;
  font-weight: 500;
  text-transform: capitalize;
}

.prof-tag--good { background: rgba(0,212,170,0.1); color: var(--tl); border: 1px solid rgba(0,212,170,0.22); }

.prof-gaps { display: flex; flex-direction: column; gap: 8px; }
.prof-gap {
  background: var(--s2);
  border: 1px solid rgba(255,107,107,0.2);
  border-radius: 10px;
  padding: 10px 12px;
  font-size: 12px;
  color: var(--tx2);
}

.prof-skel {
  background: linear-gradient(90deg, var(--s1) 25%, var(--s3) 50%, var(--s1) 75%);
  background-size: 200% 100%;
  animation: prof-shim 1.5s ease-in-out infinite;
  border-radius: 8px;
}

@keyframes prof-shim {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

.prof-error-state {
  padding: clamp(24px, 4vw, 40px) clamp(20px, 3vw, 28px);
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.prof-error-ico { color: var(--red); margin-bottom: 12px; }
.prof-error-title { font-size: 15px; font-weight: 700; margin: 0 0 8px; color: var(--tx); }
.prof-error-sub { font-size: 12.5px; color: var(--tx2); line-height: 1.55; margin: 0 0 18px; }

.prof-toast {
  position: fixed;
  left: 50%;
  bottom: 28px;
  transform: translateX(-50%);
  z-index: 9000;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 18px;
  border-radius: 13px;
  font-size: 13px;
  font-weight: 500;
  font-family: inherit;
  backdrop-filter: blur(16px);
  animation: prof-rise 0.22s ease;
  box-shadow: 0 14px 44px rgba(0,0,0,0.5);
  max-width: min(90vw, 420px);
}

@keyframes prof-rise {
  from { opacity: 0; transform: translate(-50%, 10px); }
  to { opacity: 1; transform: translate(-50%, 0); }
}

.prof-toast--error { background: rgba(28,10,12,0.92); border: 1px solid rgba(255,107,107,0.3); color: #ffc9c9; }
.prof-toast--success { background: rgba(8,24,20,0.92); border: 1px solid rgba(0,212,170,0.3); color: #99f5e4; }

@media (prefers-reduced-motion: reduce) {
  .prof * { animation: none !important; transition: none !important; }
}

@media (max-width: 820px) {
  .prof-layout { grid-template-columns: 1fr; }
  .prof-left { position: static; }
  .prof-right { position: static; }
}
`;
