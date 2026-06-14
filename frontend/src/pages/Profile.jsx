import { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

// ─────────────────────────────────────────────────────────────
// PROFILE  ·  Arivo AI
// CV upload → skill extraction → market-based skill-gap analysis.
//
// Backend contract (unchanged):
//   POST http://localhost:5001/api/cv/upload   (multipart, Bearer)
//        → { skills_found: string[] }
//   POST http://localhost:8000/skill-gap/analyse
//        { user_skills, target_role, visa_only }
//        → { target_role, readiness_score, summary, jobs_analysed,
//            visa_sponsors_found, matching_skills[],
//            visa_sponsor_companies[], missing_required[],
//            missing_nice_to_have[], learning_resources{} }
//
// Every field is read defensively — a missing key never crashes
// the page. No data is invented beyond what the API returns.
// ─────────────────────────────────────────────────────────────

const CV_ENDPOINT = `${import.meta.env.VITE_API_URL}/api/cv/upload`;
const GAP_ENDPOINT = `${import.meta.env.VITE_AI_URL}/skill-gap/analyse`;

// ── Small utilities ───────────────────────────────────────────
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
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(0)} KB`;
  return `${(b / 1024 / 1024).toFixed(1)} MB`;
};

// Score → encouraging band + gauge gradient (thresholds match the
// original colour logic: 60 / 30)
const scoreBand = (s) => {
  if (s >= 60)
    return { label: "Strong match", grad: "url(#pf-good)", text: "#38ef7d" };
  if (s >= 30)
    return { label: "Getting there", grad: "url(#pf-mid)", text: "#ffd200" };
  return { label: "Early days", grad: "url(#pf-low)", text: "#ff7a7a" };
};

// Count-up hook — respects reduced motion (jumps to target)
function useCountUp(target, duration = 1000) {
  const end = Number(target) || 0;
  const reduced = prefersReducedMotion();
  // Reduced motion: no animation, no effect — just show the final value.
  const [value, setValue] = useState(reduced ? end : 0);

  useEffect(() => {
    if (reduced) return; // nothing to animate, no setState here
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

// ── Icons (inline, themed via currentColor) ───────────────────
const I = {
  upload: (p) => (
    <svg
      viewBox="0 0 24 24"
      width={p?.s || 22}
      height={p?.s || 22}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <path d="m17 8-5-5-5 5" />
      <path d="M12 3v12" />
    </svg>
  ),
  file: (p) => (
    <svg
      viewBox="0 0 24 24"
      width={p?.s || 18}
      height={p?.s || 18}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6" />
    </svg>
  ),
  check: (p) => (
    <svg
      viewBox="0 0 24 24"
      width={p?.s || 14}
      height={p?.s || 14}
      fill="none"
      stroke="currentColor"
      strokeWidth="2.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  ),
  plus: (p) => (
    <svg
      viewBox="0 0 24 24"
      width={p?.s || 16}
      height={p?.s || 16}
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M12 5v14M5 12h14" />
    </svg>
  ),
  x: (p) => (
    <svg
      viewBox="0 0 24 24"
      width={p?.s || 12}
      height={p?.s || 12}
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  ),
  shield: (p) => (
    <svg
      viewBox="0 0 24 24"
      width={p?.s || 13}
      height={p?.s || 13}
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 2 4 5v6c0 5 3.4 8.4 8 11 4.6-2.6 8-6 8-11V5z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  ),
  book: (p) => (
    <svg
      viewBox="0 0 24 24"
      width={p?.s || 14}
      height={p?.s || 14}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  ),
  clock: (p) => (
    <svg
      viewBox="0 0 24 24"
      width={p?.s || 14}
      height={p?.s || 14}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  ),
  ext: (p) => (
    <svg
      viewBox="0 0 24 24"
      width={p?.s || 13}
      height={p?.s || 13}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M15 3h6v6" />
      <path d="M10 14 21 3" />
      <path d="M21 14v7H3V3h7" />
    </svg>
  ),
  alert: (p) => (
    <svg
      viewBox="0 0 24 24"
      width={p?.s || 15}
      height={p?.s || 15}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v4" />
      <path d="M12 16h.01" />
    </svg>
  ),
  building: (p) => (
    <svg
      viewBox="0 0 24 24"
      width={p?.s || 12}
      height={p?.s || 12}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="4" y="3" width="16" height="18" rx="1.5" />
      <path d="M9 7h.01M15 7h.01M9 11h.01M15 11h.01M9 15h6" />
    </svg>
  ),
};

// ── Toast ─────────────────────────────────────────────────────
function Toast({ toast }) {
  if (!toast) return null;
  return (
    <div className={`pf-toast pf-toast--${toast.type}`} role="status">
      {I.alert({ s: 15 })} {toast.msg}
    </div>
  );
}

// ── Dropzone ──────────────────────────────────────────────────
function Dropzone({ file, loading, uploaded, onPick, onClear, onUpload }) {
  const inputRef = useRef(null);
  const [drag, setDrag] = useState(false);

  const handleFiles = (files) => {
    const f = files?.[0];
    if (!f) return;
    onPick(f);
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDrag(false);
    handleFiles(e.dataTransfer.files);
  };

  if (uploaded && file) {
    return (
      <div className="pf-file pf-file--done">
        <div className="pf-file-ic pf-file-ic--done">{I.check({ s: 18 })}</div>
        <div className="pf-file-info">
          <div className="pf-file-name">{file.name}</div>
          <div className="pf-file-meta">
            Read successfully · {formatBytes(file.size)}
          </div>
        </div>
        <button
          className="pf-text-btn"
          onClick={() => inputRef.current?.click()}
        >
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
      <>
        <div className="pf-file">
          <div className="pf-file-ic">{I.file({ s: 18 })}</div>
          <div className="pf-file-info">
            <div className="pf-file-name">{file.name}</div>
            <div className="pf-file-meta">{formatBytes(file.size)}</div>
          </div>
          {!loading && (
            <button
              className="pf-icon-btn"
              onClick={onClear}
              aria-label="Remove file"
            >
              {I.x({ s: 14 })}
            </button>
          )}
        </div>
        <button
          className="pf-primary pf-primary--block"
          onClick={onUpload}
          disabled={loading}
        >
          {loading ? (
            <span className="pf-btn-loading">
              <span className="pf-spinner" /> Reading your CV…
            </span>
          ) : (
            "Extract skills"
          )}
        </button>
      </>
    );
  }

  return (
    <>
      <div
        className={`pf-drop ${drag ? "is-drag" : ""}`}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={onDrop}
        role="button"
        tabIndex={0}
        onKeyDown={(e) =>
          (e.key === "Enter" || e.key === " ") && inputRef.current?.click()
        }
      >
        <div className="pf-drop-ic">{I.upload({ s: 24 })}</div>
        <div className="pf-drop-title">
          Drop your CV here, or <span>browse</span>
        </div>
        <div className="pf-drop-sub">
          PDF only · we read it, we don't store the file
        </div>
      </div>
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
    </>
  );
}

// ── Radial gauge (results hero) ───────────────────────────────
function RadialGauge({ score }) {
  const safe = Math.max(0, Math.min(100, Number(score) || 0));
  const shown = useCountUp(safe, 1100);
  const band = scoreBand(safe);
  const r = 54;
  const C = 2 * Math.PI * r;
  const offset = C * (1 - shown / 100);

  return (
    <div className="pf-gauge">
      <svg viewBox="0 0 120 120" className="pf-gauge-svg" aria-hidden="true">
        <defs>
          <linearGradient id="pf-good" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#11998e" />
            <stop offset="100%" stopColor="#38ef7d" />
          </linearGradient>
          <linearGradient id="pf-mid" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#f7971e" />
            <stop offset="100%" stopColor="#ffd200" />
          </linearGradient>
          <linearGradient id="pf-low" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#e74c3c" />
            <stop offset="100%" stopColor="#ff7a7a" />
          </linearGradient>
        </defs>
        <circle cx="60" cy="60" r={r} className="pf-gauge-track" />
        <circle
          cx="60"
          cy="60"
          r={r}
          className="pf-gauge-prog"
          stroke={band.grad}
          strokeDasharray={C}
          strokeDashoffset={offset}
          transform="rotate(-90 60 60)"
        />
      </svg>
      <div className="pf-gauge-center">
        <div className="pf-gauge-num">
          {shown}
          <span>/100</span>
        </div>
        <div className="pf-gauge-label" style={{ color: band.text }}>
          {band.label}
        </div>
      </div>
    </div>
  );
}

// ── Stat tile (count-up) ──────────────────────────────────────
function StatTile({ value, label, color }) {
  const n = useCountUp(Number(value) || 0, 900);
  return (
    <div className="pf-stat">
      <div className="pf-stat-val" style={{ color }}>
        {n}
      </div>
      <div className="pf-stat-label">{label}</div>
    </div>
  );
}

// ── Resource (roadmap) card ───────────────────────────────────
function ResourceCard({ skill, resource }) {
  return (
    <div className="pf-res">
      <div className="pf-res-top">
        <div className="pf-res-skill">{skill}</div>
        {resource?.url && (
          <a
            className="pf-res-link"
            href={resource.url}
            target="_blank"
            rel="noreferrer"
          >
            Learn free {I.ext({ s: 12 })}
          </a>
        )}
      </div>
      {resource && (
        <div className="pf-res-meta">
          <span>
            {I.book({ s: 13 })} {resource.resource}
          </span>
          {resource.time && (
            <span>
              {I.clock({ s: 13 })} {resource.time}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

// ── Timeline node ─────────────────────────────────────────────
function Node({ n, done, last }) {
  return (
    <div className="pf-rail">
      <div className={`pf-node ${done ? "is-done" : ""}`}>
        {done ? I.check({ s: 14 }) : n}
      </div>
      {!last && <div className="pf-line" />}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
function Profile() {
  const { currentUser, token } = useAuth();

  // CV
  const [cvFile, setCvFile] = useState(null);
  const [cvLoading, setCvLoading] = useState(false);
  const [cvSkills, setCvSkills] = useState([]);
  const [cvUploaded, setCvUploaded] = useState(false);

  // Skills pool
  const [allSkills, setAllSkills] = useState([]);
  const [manualSkill, setManualSkill] = useState("");

  // Gap
  const [targetRole, setTargetRole] = useState(currentUser?.targetRole || "");
  const [roleError, setRoleError] = useState(false);
  const [visaOnly, setVisaOnly] = useState(false);
  const [gapLoading, setGapLoading] = useState(false);
  const [gapResult, setGapResult] = useState(null);
  const [gapError, setGapError] = useState(false);
  const [analysisId, setAnalysisId] = useState(0);

  // Toast
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);
  const flash = useCallback((type, msg) => {
    setToast({ type, msg });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 3200);
  }, []);
  useEffect(() => () => clearTimeout(toastTimer.current), []);

  // ── CV upload ───────────────────────────────────────────────
  const pickFile = (f) => {
    if (
      f.type &&
      f.type !== "application/pdf" &&
      !f.name.toLowerCase().endsWith(".pdf")
    ) {
      flash("error", "That's not a PDF — please upload your CV as a PDF.");
      return;
    }
    setCvFile(f);
    setCvUploaded(false);
  };
  const clearFile = () => {
    setCvFile(null);
    setCvUploaded(false);
  };

  const uploadCV = async () => {
    if (!cvFile) return;
    setCvLoading(true);
    try {
      const fd = new FormData();
      fd.append("cv", cvFile);
      const res = await axios.post(CV_ENDPOINT, fd, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });
      const found = res.data?.skills_found || [];
      setCvSkills(found);
      // Merge with anything already added manually, de-duped
      setAllSkills((prev) => Array.from(new Set([...found, ...prev])));
      setCvUploaded(true);
      flash(
        "success",
        `Found ${found.length} skill${found.length === 1 ? "" : "s"} in your CV.`,
      );
    } catch (err) {
      flash(
        "error",
        err.response?.data?.message ||
          "CV upload failed. Is the server running?",
      );
    }
    setCvLoading(false);
  };

  // ── Skills pool ─────────────────────────────────────────────
  const addManualSkill = () => {
    const s = manualSkill.trim();
    if (!s) return;
    if (!allSkills.some((x) => x.toLowerCase() === s.toLowerCase())) {
      setAllSkills((prev) => [...prev, s]);
    }
    setManualSkill("");
  };
  const removeSkill = (skill) =>
    setAllSkills((prev) => prev.filter((s) => s !== skill));
  const isManual = (skill) => !cvSkills.includes(skill);

  // ── Analyse ─────────────────────────────────────────────────
  const analyseGap = async () => {
    if (!targetRole.trim()) {
      setRoleError(true);
      flash("error", "Enter your target role first.");
      return;
    }
    if (allSkills.length === 0) {
      flash("error", "Add at least one skill before analysing.");
      return;
    }

    setGapLoading(true);
    setGapResult(null);
    setGapError(false);
    try {
      const res = await axios.post(GAP_ENDPOINT, {
        user_skills: allSkills,
        target_role: targetRole,
        visa_only: visaOnly,
      });
      setGapResult(res.data);
      setAnalysisId((id) => id + 1);
    } catch {
      setGapError(true);
    }
    setGapLoading(false);
  };

  // ── Derived ─────────────────────────────────────────────────
  const step1done = cvUploaded;
  const step2done = allSkills.length > 0;
  const step3done = !!gapResult && !gapResult?.error;
  const completed = [step1done, step2done, step3done].filter(Boolean).length;

  return (
    <div className="pf">
      <style>{styles}</style>
      <Toast toast={toast} />

      {/* ── Header ─────────────────────────────────────────── */}
      <header className="pf-head">
        <div>
          <h1 className="pf-title">Your profile</h1>
          <div className="pf-sub">
            {currentUser?.name}
            {currentUser?.university ? ` · ${currentUser.university}` : ""}
          </div>
        </div>
        <div className="pf-pill">{completed}/3 complete</div>
      </header>

      {/* ── Step 1 — Upload CV ─────────────────────────────── */}
      <section className="pf-step">
        <Node n={1} done={step1done} />
        <div className="pf-card">
          <div className="pf-card-head">
            <h2 className="pf-h2">Upload your CV</h2>
            <p className="pf-p">
              Arivo reads your CV and pulls out your skills automatically.
            </p>
          </div>
          <Dropzone
            file={cvFile}
            loading={cvLoading}
            uploaded={cvUploaded}
            onPick={pickFile}
            onClear={clearFile}
            onUpload={uploadCV}
          />
          {cvUploaded && (
            <div className="pf-extracted">
              {I.check({ s: 13 })} Pulled {cvSkills.length} skill
              {cvSkills.length === 1 ? "" : "s"} — review and edit them below.
            </div>
          )}
        </div>
      </section>

      {/* ── Step 2 — Skills pool ───────────────────────────── */}
      <section className="pf-step">
        <Node n={2} done={step2done} />
        <div className="pf-card">
          <div className="pf-card-head">
            <h2 className="pf-h2">
              Your skills{" "}
              {allSkills.length > 0 && (
                <span className="pf-badge">{allSkills.length}</span>
              )}
            </h2>
            <p className="pf-p">
              Everything we'll match against the market. Add anything we missed;
              remove anything off.
            </p>
          </div>

          <div className="pf-add">
            <input
              className="pf-input"
              value={manualSkill}
              onChange={(e) => setManualSkill(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addManualSkill()}
              placeholder="e.g. Patient care, Tableau, Contract law…"
              aria-label="Add a skill"
            />
            <button className="pf-primary" onClick={addManualSkill}>
              {I.plus({ s: 16 })} Add
            </button>
          </div>

          {allSkills.length > 0 ? (
            <div className="pf-skills">
              {allSkills.map((skill) => (
                <span
                  key={skill}
                  className={`pf-skill ${isManual(skill) ? "is-manual" : ""}`}
                  title={isManual(skill) ? "Added by you" : "From your CV"}
                >
                  {skill}
                  <button
                    className="pf-skill-x"
                    onClick={() => removeSkill(skill)}
                    aria-label={`Remove ${skill}`}
                  >
                    {I.x({ s: 11 })}
                  </button>
                </span>
              ))}
            </div>
          ) : (
            <div className="pf-empty-hint">
              Upload your CV above, or add a skill to get started.
            </div>
          )}
        </div>
      </section>

      {/* ── Step 3 — Analyse ───────────────────────────────── */}
      <section className="pf-step">
        <Node n={3} done={step3done} last />
        <div className="pf-card">
          <div className="pf-card-head">
            <h2 className="pf-h2">Analyse your skill gap</h2>
            <p className="pf-p">
              Arivo reads real London listings for this role and finds exactly
              what you're missing.
            </p>
          </div>

          <input
            className={`pf-input pf-input--block ${roleError ? "is-error" : ""}`}
            value={targetRole}
            onChange={(e) => {
              setTargetRole(e.target.value);
              setRoleError(false);
            }}
            placeholder="e.g. ML Engineer, Teacher, Nurse, Finance Analyst…"
            aria-label="Target role"
          />
          {roleError && (
            <div className="pf-field-error">
              Tell us the role you're aiming for.
            </div>
          )}

          <button
            className={`pf-toggle ${visaOnly ? "is-on" : ""}`}
            onClick={() => setVisaOnly(!visaOnly)}
            aria-pressed={visaOnly}
          >
            {I.shield({ s: 13 })} Skilled Worker sponsors only
          </button>
          <span className="pf-toggle-hint">
            Only weigh skills wanted by companies that can sponsor a visa
          </span>

          <button className="pf-cta" onClick={analyseGap} disabled={gapLoading}>
            {gapLoading ? (
              <span className="pf-btn-loading">
                <span className="pf-spinner" /> Reading the London market…
              </span>
            ) : (
              "Analyse my skill gap"
            )}
          </button>
        </div>
      </section>

      {/* ── Results: loading skeleton ──────────────────────── */}
      {gapLoading && (
        <div className="pf-results">
          <div className="pf-res-hero">
            <div
              className="pf-skel"
              style={{ width: 130, height: 130, borderRadius: "50%" }}
            />
            <div style={{ flex: 1 }}>
              <div
                className="pf-skel"
                style={{ width: "60%", height: 16, marginBottom: 12 }}
              />
              <div
                className="pf-skel"
                style={{ width: "90%", height: 12, marginBottom: 8 }}
              />
              <div className="pf-skel" style={{ width: "75%", height: 12 }} />
            </div>
          </div>
          <div className="pf-stats">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="pf-skel"
                style={{ height: 64, borderRadius: 12 }}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── Results: error ─────────────────────────────────── */}
      {!gapLoading && gapError && (
        <div className="pf-results pf-state pf-state--error">
          <div className="pf-state-title">
            Couldn't reach the analysis service
          </div>
          <div className="pf-state-sub">
            The AI service didn't respond. Make sure it's running on port 8000,
            then try again.
          </div>
          <button className="pf-primary" onClick={analyseGap}>
            Try again
          </button>
        </div>
      )}

      {/* ── Results ────────────────────────────────────────── */}
      {!gapLoading && gapResult && !gapResult.error && (
        <Results key={analysisId} r={gapResult} />
      )}
    </div>
  );
}

// ── Results block (keyed so animations replay each analysis) ──
function Results({ r }) {
  const score = Math.max(0, Math.min(100, Number(r.readiness_score) || 0));
  const matching = r.matching_skills || [];
  const sponsors = r.visa_sponsor_companies || [];
  const missingReq = r.missing_required || [];
  const missingNice = r.missing_nice_to_have || [];
  const resources = r.learning_resources || {};

  return (
    <div className="pf-results">
      {/* Hero: gauge + summary */}
      <div className="pf-res-hero">
        <RadialGauge score={score} />
        <div className="pf-res-summary">
          <div className="pf-res-role">{r.target_role || "Target role"}</div>
          <div className="pf-res-headline">Market readiness</div>
          {r.summary && <p className="pf-res-text">{r.summary}</p>}
        </div>
      </div>

      {/* Stats */}
      <div className="pf-stats">
        <StatTile
          value={r.jobs_analysed}
          label="Jobs analysed"
          color="#8b9bff"
        />
        <StatTile
          value={r.visa_sponsors_found}
          label="Visa sponsors"
          color="#38ef7d"
        />
        <StatTile
          value={matching.length}
          label="Skills matched"
          color="#b794f6"
        />
      </div>

      {/* Sponsor companies */}
      {sponsors.length > 0 && (
        <div className="pf-block">
          <div className="pf-block-title pf-block-title--green">
            {I.building({ s: 13 })} Companies that can sponsor your visa
          </div>
          <div className="pf-tags">
            {sponsors.map((c) => (
              <span key={c} className="pf-tag pf-tag--green">
                {c}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Matching skills */}
      {matching.length > 0 && (
        <div className="pf-block">
          <div className="pf-block-title">
            {I.check({ s: 13 })} Skills you already have
          </div>
          <div className="pf-tags">
            {matching.map((s) => (
              <span key={s} className="pf-tag pf-tag--blue">
                {s}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Roadmap: required */}
      {missingReq.length > 0 && (
        <div className="pf-block">
          <div className="pf-block-title pf-block-title--red">
            Your roadmap — skills to learn
          </div>
          <div className="pf-roadmap">
            {missingReq.map((skill) => (
              <ResourceCard
                key={skill}
                skill={skill}
                resource={resources[skill]}
              />
            ))}
          </div>
        </div>
      )}

      {/* Nice to have */}
      {missingNice.length > 0 && (
        <div className="pf-block">
          <div className="pf-block-title pf-block-title--amber">
            Nice to have
          </div>
          <div className="pf-tags">
            {missingNice.map((s) => (
              <span key={s} className="pf-tag pf-tag--amber">
                {s}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// SCOPED DESIGN SYSTEM
// ═══════════════════════════════════════════════════════════════
const styles = `
.pf {
  --brand-1:#667eea; --brand-2:#764ba2;
  --verify-1:#11998e; --verify-2:#38ef7d;
  --surface:#15152a; --surface-2:#1b1b34; --inset:#0f0f1e;
  --border:rgba(255,255,255,.07); --border-hi:rgba(102,126,234,.40);
  --text:#f2f2f8; --text-2:#9595aa; --text-3:#6a6a80;
  --red:#ff7a7a; --amber:#ffd200;
 
  max-width:760px; margin:0 auto; padding:2rem 1.5rem 5rem; color:var(--text);
  font-family:ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;
}
.pf button:focus-visible, .pf a:focus-visible, .pf input:focus-visible, .pf [role=button]:focus-visible {
  outline:2px solid var(--brand-1); outline-offset:2px;
}
 
/* Header */
.pf-head { display:flex; align-items:flex-start; justify-content:space-between; gap:16px; margin-bottom:1.75rem; }
.pf-title { margin:0 0 5px; font-size:26px; font-weight:700; letter-spacing:-.025em; }
.pf-sub { font-size:13px; color:var(--text-2); }
.pf-pill { flex-shrink:0; font-size:12px; font-weight:600; color:var(--brand-1); background:rgba(102,126,234,.12); border:1px solid rgba(102,126,234,.25); padding:6px 14px; border-radius:999px; }
 
/* Step row = timeline rail + card */
.pf-step { display:flex; gap:18px; }
.pf-rail { display:flex; flex-direction:column; align-items:center; flex-shrink:0; }
.pf-node {
  width:32px; height:32px; border-radius:50%; display:flex; align-items:center; justify-content:center;
  font-size:14px; font-weight:700; color:var(--text-2);
  background:var(--surface); border:1px solid var(--border); transition:all .25s;
}
.pf-node.is-done { background:linear-gradient(135deg,var(--verify-1),var(--verify-2)); color:#06241f; border-color:transparent; }
.pf-line { flex:1; width:2px; background:var(--border); margin:6px 0; min-height:20px; }
 
/* Card */
.pf-card { flex:1; min-width:0; background:var(--surface); border:1px solid var(--border); border-radius:16px; padding:22px; margin-bottom:18px; }
.pf-card-head { margin-bottom:16px; }
.pf-h2 { margin:0 0 5px; font-size:16px; font-weight:600; display:flex; align-items:center; gap:8px; }
.pf-p { margin:0; font-size:12.5px; color:var(--text-2); line-height:1.5; }
.pf-badge { font-size:11px; font-weight:700; color:var(--brand-1); background:rgba(102,126,234,.16); border-radius:999px; padding:1px 9px; }
 
/* Dropzone */
.pf-drop {
  border:1.5px dashed rgba(255,255,255,.14); border-radius:14px; padding:32px 20px; text-align:center;
  cursor:pointer; transition:all .2s; background:rgba(255,255,255,.015);
}
.pf-drop:hover { border-color:var(--border-hi); background:rgba(102,126,234,.05); }
.pf-drop.is-drag { border-color:var(--brand-1); background:rgba(102,126,234,.10); transform:scale(1.01); }
.pf-drop-ic { width:52px; height:52px; margin:0 auto 12px; border-radius:14px; display:flex; align-items:center; justify-content:center; color:var(--brand-1); background:rgba(102,126,234,.12); border:1px solid rgba(102,126,234,.25); }
.pf-drop-title { font-size:14px; font-weight:600; margin-bottom:4px; }
.pf-drop-title span { color:var(--brand-1); }
.pf-drop-sub { font-size:11.5px; color:var(--text-3); }
 
/* Selected file */
.pf-file { display:flex; align-items:center; gap:12px; background:var(--inset); border:1px solid var(--border); border-radius:12px; padding:12px 14px; margin-bottom:12px; }
.pf-file--done { margin-bottom:0; }
.pf-file-ic { width:38px; height:38px; flex-shrink:0; border-radius:10px; display:flex; align-items:center; justify-content:center; color:var(--brand-1); background:rgba(102,126,234,.12); }
.pf-file-ic--done { color:var(--verify-2); background:rgba(56,239,125,.12); }
.pf-file-info { flex:1; min-width:0; }
.pf-file-name { font-size:13px; font-weight:600; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.pf-file-meta { font-size:11px; color:var(--text-3); margin-top:2px; }
.pf-icon-btn { width:30px; height:30px; flex-shrink:0; border:none; background:transparent; color:var(--text-3); border-radius:8px; cursor:pointer; display:flex; align-items:center; justify-content:center; transition:all .15s; }
.pf-icon-btn:hover { color:var(--text); background:rgba(255,255,255,.06); }
.pf-text-btn { border:none; background:none; color:var(--brand-1); font-size:12px; font-weight:600; cursor:pointer; flex-shrink:0; }
 
.pf-extracted { margin-top:14px; display:flex; align-items:center; gap:7px; font-size:12.5px; font-weight:600; color:var(--verify-2); }
 
/* Inputs + buttons */
.pf-input { background:var(--inset); border:1px solid var(--border); border-radius:10px; color:var(--text); font-size:13.5px; padding:11px 14px; outline:none; transition:border-color .18s, box-shadow .18s; font-family:inherit; }
.pf-input:focus { border-color:var(--brand-1); box-shadow:0 0 0 3px rgba(102,126,234,.14); }
.pf-input.is-error { border-color:rgba(255,122,122,.55); }
.pf-input--block { width:100%; box-sizing:border-box; margin-bottom:14px; }
.pf-field-error { font-size:12px; color:var(--red); margin:-8px 0 14px; }
 
.pf-add { display:flex; gap:10px; margin-bottom:16px; }
.pf-add .pf-input { flex:1; }
 
.pf-primary { display:inline-flex; align-items:center; justify-content:center; gap:7px; padding:11px 18px; border:none; border-radius:10px; background:linear-gradient(135deg,var(--brand-1),var(--brand-2)); color:#fff; font-size:13px; font-weight:600; cursor:pointer; transition:filter .18s, transform .12s; white-space:nowrap; }
.pf-primary:hover:not(:disabled) { filter:brightness(1.12); }
.pf-primary:active:not(:disabled) { transform:scale(.98); }
.pf-primary:disabled { opacity:.6; cursor:not-allowed; }
.pf-primary--block { width:100%; }
 
.pf-cta { width:100%; margin-top:16px; padding:14px; border:none; border-radius:12px; background:linear-gradient(135deg,var(--brand-1),var(--brand-2)); color:#fff; font-size:14.5px; font-weight:700; cursor:pointer; transition:filter .18s, transform .12s; box-shadow:0 6px 20px rgba(102,126,234,.25); }
.pf-cta:hover:not(:disabled) { filter:brightness(1.1); }
.pf-cta:active:not(:disabled) { transform:translateY(1px); }
.pf-cta:disabled { opacity:.75; cursor:not-allowed; }
 
.pf-btn-loading { display:inline-flex; align-items:center; gap:9px; }
.pf-spinner { width:15px; height:15px; border-radius:50%; border:2px solid rgba(255,255,255,.35); border-top-color:#fff; animation:pf-spin .7s linear infinite; }
@keyframes pf-spin { to { transform:rotate(360deg); } }
 
/* Skills pool */
.pf-skills { display:flex; flex-wrap:wrap; gap:7px; }
.pf-skill {
  display:inline-flex; align-items:center; gap:4px; padding:5px 6px 5px 12px; border-radius:999px;
  background:rgba(102,126,234,.14); border:1px solid rgba(102,126,234,.28); color:#a9b4ff;
  font-size:12px; text-transform:capitalize; transition:all .15s;
}
.pf-skill.is-manual { background:rgba(118,75,162,.16); border-color:rgba(118,75,162,.34); color:#c3a6f0; }
.pf-skill-x { width:18px; height:18px; border:none; background:transparent; color:inherit; opacity:.55; cursor:pointer; border-radius:50%; display:flex; align-items:center; justify-content:center; transition:all .15s; }
.pf-skill-x:hover { opacity:1; background:rgba(255,255,255,.12); }
.pf-empty-hint { font-size:12.5px; color:var(--text-3); padding:6px 0; }
 
/* Visa toggle */
.pf-toggle { display:inline-flex; align-items:center; gap:7px; padding:8px 14px; border-radius:999px; cursor:pointer; background:transparent; border:1px solid var(--verify-1); color:var(--verify-1); font-size:12.5px; font-weight:600; transition:all .18s; }
.pf-toggle:hover { background:rgba(17,153,142,.10); }
.pf-toggle.is-on { background:linear-gradient(135deg,var(--verify-1),var(--verify-2)); color:#06241f; border-color:transparent; }
.pf-toggle-hint { display:block; font-size:11.5px; color:var(--text-3); margin-top:8px; }
 
/* Toast */
.pf-toast {
  position:fixed; left:50%; bottom:28px; transform:translateX(-50%); z-index:50;
  display:flex; align-items:center; gap:9px; padding:12px 18px; border-radius:12px;
  font-size:13px; font-weight:500; backdrop-filter:blur(12px);
  animation:pf-rise .25s ease; box-shadow:0 12px 40px rgba(0,0,0,.45); max-width:90vw;
}
@keyframes pf-rise { from { opacity:0; transform:translate(-50%,10px); } to { opacity:1; transform:translate(-50%,0); } }
.pf-toast--error { background:rgba(40,16,18,.92); border:1px solid rgba(255,122,122,.4); color:#ffc9c9; }
.pf-toast--success { background:rgba(14,32,28,.92); border:1px solid rgba(56,239,125,.4); color:#b6f5d2; }
 
/* ── Results ── */
.pf-results { margin-top:8px; background:var(--surface); border:1px solid var(--border); border-radius:18px; padding:24px; }
.pf-res-hero { display:flex; align-items:center; gap:24px; margin-bottom:22px; }
@media (max-width:560px){ .pf-res-hero { flex-direction:column; text-align:center; gap:16px; } }
 
/* Gauge */
.pf-gauge { position:relative; width:130px; height:130px; flex-shrink:0; }
.pf-gauge-svg { width:130px; height:130px; }
.pf-gauge-track { fill:none; stroke:rgba(255,255,255,.07); stroke-width:9; }
.pf-gauge-prog { fill:none; stroke-width:9; stroke-linecap:round; }
.pf-gauge-center { position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; justify-content:center; }
.pf-gauge-num { font-size:30px; font-weight:800; letter-spacing:-.03em; color:#fff; line-height:1; }
.pf-gauge-num span { font-size:13px; font-weight:600; color:var(--text-3); }
.pf-gauge-label { font-size:11px; font-weight:700; margin-top:5px; text-transform:uppercase; letter-spacing:.05em; }
 
.pf-res-summary { flex:1; min-width:0; }
.pf-res-role { font-size:18px; font-weight:700; letter-spacing:-.02em; text-transform:capitalize; }
.pf-res-headline { font-size:12px; font-weight:600; color:var(--text-3); text-transform:uppercase; letter-spacing:.06em; margin:2px 0 10px; }
.pf-res-text { margin:0; font-size:13px; line-height:1.6; color:var(--text-2); }
 
/* Stat tiles */
.pf-stats { display:grid; grid-template-columns:repeat(3,1fr); gap:10px; margin-bottom:22px; }
.pf-stat { background:var(--inset); border:1px solid var(--border); border-radius:12px; padding:14px; text-align:center; }
.pf-stat-val { font-size:24px; font-weight:800; letter-spacing:-.02em; }
.pf-stat-label { font-size:11px; color:var(--text-3); margin-top:3px; }
 
/* Result blocks */
.pf-block { margin-bottom:20px; }
.pf-block:last-child { margin-bottom:0; }
.pf-block-title { display:flex; align-items:center; gap:7px; font-size:12px; font-weight:700; letter-spacing:.04em; text-transform:uppercase; color:var(--text-2); margin-bottom:11px; }
.pf-block-title--green { color:var(--verify-2); }
.pf-block-title--red { color:var(--red); }
.pf-block-title--amber { color:var(--amber); }
 
.pf-tags { display:flex; flex-wrap:wrap; gap:6px; }
.pf-tag { padding:4px 12px; border-radius:999px; font-size:12px; font-weight:500; text-transform:capitalize; }
.pf-tag--green { background:rgba(17,153,142,.14); color:#38ef7d; border:1px solid rgba(17,153,142,.4); }
.pf-tag--blue { background:rgba(102,126,234,.14); color:#a9b4ff; border:1px solid rgba(102,126,234,.34); }
.pf-tag--amber { background:rgba(255,210,0,.10); color:#ffd200; border:1px solid rgba(255,210,0,.28); }
 
/* Roadmap */
.pf-roadmap { display:flex; flex-direction:column; gap:10px; }
.pf-res { background:var(--inset); border:1px solid rgba(231,76,60,.18); border-radius:12px; padding:14px 16px; transition:border-color .18s; }
.pf-res:hover { border-color:rgba(231,76,60,.4); }
.pf-res-top { display:flex; align-items:center; justify-content:space-between; gap:12px; }
.pf-res-skill { font-size:13.5px; font-weight:600; color:#fff; text-transform:capitalize; }
.pf-res-link { display:inline-flex; align-items:center; gap:4px; font-size:11.5px; font-weight:600; color:var(--brand-1); text-decoration:none; flex-shrink:0; }
.pf-res-link:hover { text-decoration:underline; }
.pf-res-meta { display:flex; flex-wrap:wrap; gap:14px; margin-top:8px; font-size:12px; color:var(--text-2); }
.pf-res-meta span { display:inline-flex; align-items:center; gap:5px; }
 
/* Skeleton + states */
.pf-skel { background:linear-gradient(90deg,#1a1a30 25%,#26263f 50%,#1a1a30 75%); background-size:200% 100%; animation:pf-shim 1.4s ease-in-out infinite; border-radius:8px; }
@keyframes pf-shim { 0% { background-position:200% 0; } 100% { background-position:-200% 0; } }
.pf-state { text-align:center; }
.pf-state--error { border-color:rgba(255,122,122,.3); }
.pf-state-title { font-size:15px; font-weight:600; margin-bottom:6px; }
.pf-state-sub { font-size:12.5px; color:var(--text-3); line-height:1.5; margin-bottom:16px; }
 
/* Quality floor */
@media (prefers-reduced-motion: reduce) { .pf * { animation:none !important; transition:none !important; } }
@media (max-width:560px) {
  .pf { padding:1.5rem 1rem 4rem; }
  .pf-step { gap:12px; }
  .pf-stats { grid-template-columns:1fr 1fr; }
  .pf-add { flex-direction:column; }
  .pf-add .pf-primary { width:100%; }
}
`;

export default Profile;
