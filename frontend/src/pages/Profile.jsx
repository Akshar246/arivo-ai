import { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

// ─────────────────────────────────────────────────────────────
// PROFILE  ·  Arivo AI  — Two-column cockpit redesign
// Backend contract (unchanged):
//   POST ${VITE_API_URL}/api/cv/upload   (multipart, Bearer)
//        → { skills_found: string[] }
//   POST ${VITE_AI_URL}/skill-gap/analyse
//        { user_skills, target_role, visa_only }
//        → { target_role, readiness_score, summary, jobs_analysed,
//            visa_sponsors_found, matching_skills[],
//            visa_sponsor_companies[], missing_required[],
//            missing_nice_to_have[], learning_resources{} }
// ─────────────────────────────────────────────────────────────

const CV_ENDPOINT = `${import.meta.env.VITE_API_URL}/api/cv/upload`;
const GAP_ENDPOINT = `${import.meta.env.VITE_AI_URL}/skill-gap/analyse`;

// ── Utilities ─────────────────────────────────────────────────
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
  if (s >= 60)
    return { label: "Strong match", grad: "url(#g-good)", text: "#00d4aa" };
  if (s >= 30)
    return { label: "Getting there", grad: "url(#g-mid)", text: "#f5c451" };
  return { label: "Early days", grad: "url(#g-low)", text: "#ff7a7a" };
};
const initials = (name) => {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  return parts.length === 1
    ? parts[0][0].toUpperCase()
    : (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

// ── Count-up hook ─────────────────────────────────────────────
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

// ── Inline icons ──────────────────────────────────────────────
const Ic = {
  upload: (s = 20) => (
    <svg
      width={s}
      height={s}
      viewBox="0 0 24 24"
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
  file: (s = 16) => (
    <svg
      width={s}
      height={s}
      viewBox="0 0 24 24"
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
  check: (s = 13) => (
    <svg
      width={s}
      height={s}
      viewBox="0 0 24 24"
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
  plus: (s = 15) => (
    <svg
      width={s}
      height={s}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M12 5v14M5 12h14" />
    </svg>
  ),
  x: (s = 11) => (
    <svg
      width={s}
      height={s}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  ),
  shield: (s = 13) => (
    <svg
      width={s}
      height={s}
      viewBox="0 0 24 24"
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
  book: (s = 13) => (
    <svg
      width={s}
      height={s}
      viewBox="0 0 24 24"
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
  clock: (s = 13) => (
    <svg
      width={s}
      height={s}
      viewBox="0 0 24 24"
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
  ext: (s = 12) => (
    <svg
      width={s}
      height={s}
      viewBox="0 0 24 24"
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
  alert: (s = 14) => (
    <svg
      width={s}
      height={s}
      viewBox="0 0 24 24"
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
  building: (s = 12) => (
    <svg
      width={s}
      height={s}
      viewBox="0 0 24 24"
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
  sparkle: (s = 14) => (
    <svg
      width={s}
      height={s}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M12 2l2.4 7.6H22l-6.4 4.6 2.4 7.8L12 17.4l-6 4.6 2.4-7.8L2 9.6h7.6z" />
    </svg>
  ),
  chevron: (s = 14) => (
    <svg
      width={s}
      height={s}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  ),
};

// ── Toast ─────────────────────────────────────────────────────
function Toast({ toast }) {
  if (!toast) return null;
  return (
    <div
      className={`pf-toast pf-toast--${toast.type}`}
      role="status"
      aria-live="polite"
    >
      {Ic.alert(14)} {toast.msg}
    </div>
  );
}

// ── Step header (collapsible) ──────────────────────────────────
function StepHeader({ n, done, title, sub, open, onToggle }) {
  return (
    <button
      className={`pf-step-hd ${done ? "is-done" : ""} ${open ? "is-open" : ""}`}
      onClick={onToggle}
      aria-expanded={open}
    >
      <div className={`pf-step-node ${done ? "is-done" : ""}`}>
        {done ? Ic.check(13) : <span>{n}</span>}
      </div>
      <div className="pf-step-label">
        <div className="pf-step-title">{title}</div>
        {sub && <div className="pf-step-sub">{sub}</div>}
      </div>
      <div className={`pf-step-chevron ${open ? "is-open" : ""}`}>
        {Ic.chevron(14)}
      </div>
    </button>
  );
}

// ── Dropzone ──────────────────────────────────────────────────
function Dropzone({ file, loading, uploaded, onPick, onClear, onUpload }) {
  const inputRef = useRef(null);
  const [drag, setDrag] = useState(false);

  const handleFiles = (files) => {
    const f = files?.[0];
    if (f) onPick(f);
  };
  const onDrop = (e) => {
    e.preventDefault();
    setDrag(false);
    handleFiles(e.dataTransfer.files);
  };

  if (uploaded && file) {
    return (
      <div className="pf-file pf-file--done">
        <div className="pf-file-ic pf-file-ic--done">{Ic.check(16)}</div>
        <div className="pf-file-info">
          <div className="pf-file-name">{file.name}</div>
          <div className="pf-file-meta">
            Extracted · {formatBytes(file.size)}
          </div>
        </div>
        <button
          className="pf-link-btn"
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
      <div className="pf-file-selected">
        <div className="pf-file">
          <div className="pf-file-ic">{Ic.file(16)}</div>
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
              {Ic.x(12)}
            </button>
          )}
        </div>
        <button
          className="pf-primary pf-primary--block"
          onClick={onUpload}
          disabled={loading}
        >
          {loading ? (
            <span className="pf-btn-spin">
              <span className="pf-spinner" /> Reading your CV…
            </span>
          ) : (
            "Extract skills"
          )}
        </button>
      </div>
    );
  }

  return (
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
      <div className="pf-drop-ic">{Ic.upload(22)}</div>
      <div className="pf-drop-title">
        Drop your CV here, or <span>browse</span>
      </div>
      <div className="pf-drop-hint">PDF only · read locally, never stored</div>
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

// ── Radial gauge ──────────────────────────────────────────────
function RadialGauge({ score }) {
  const safe = Math.max(0, Math.min(100, Number(score) || 0));
  const shown = useCountUp(safe, 1200);
  const band = scoreBand(safe);
  const r = 52;
  const C = 2 * Math.PI * r;
  const offset = C * (1 - shown / 100);

  return (
    <div className="pf-gauge">
      <svg viewBox="0 0 120 120" className="pf-gauge-svg" aria-hidden="true">
        <defs>
          <linearGradient id="g-good" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#00d4aa" />
            <stop offset="100%" stopColor="#7c6fef" />
          </linearGradient>
          <linearGradient id="g-mid" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#f5c451" />
            <stop offset="100%" stopColor="#e879f9" />
          </linearGradient>
          <linearGradient id="g-low" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#ff7a7a" />
            <stop offset="100%" stopColor="#e879f9" />
          </linearGradient>
        </defs>
        <circle cx="60" cy="60" r={r} className="pf-gauge-track" />
        <circle
          cx="60"
          cy="60"
          r={r}
          className="pf-gauge-arc"
          stroke={band.grad}
          strokeDasharray={C}
          strokeDashoffset={offset}
          transform="rotate(-90 60 60)"
        />
      </svg>
      <div className="pf-gauge-inner">
        <div className="pf-gauge-num">
          {shown}
          <span>/100</span>
        </div>
        <div className="pf-gauge-band" style={{ color: band.text }}>
          {band.label}
        </div>
      </div>
    </div>
  );
}

// ── Stat tile ─────────────────────────────────────────────────
function Stat({ value, label, color }) {
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

// ── Resource card ─────────────────────────────────────────────
function ResourceCard({ skill, resource }) {
  return (
    <div className="pf-res">
      <div className="pf-res-row">
        <span className="pf-res-skill">{skill}</span>
        {resource?.url && (
          <a
            className="pf-res-link"
            href={resource.url}
            target="_blank"
            rel="noreferrer"
          >
            Free course {Ic.ext(11)}
          </a>
        )}
      </div>
      {resource && (
        <div className="pf-res-meta">
          {resource.resource && (
            <span>
              {Ic.book(12)} {resource.resource}
            </span>
          )}
          {resource.time && (
            <span>
              {Ic.clock(12)} {resource.time}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

// ── Right pane: identity card (pre-analysis) ──────────────────
function IdentityCard({
  currentUser,
  allSkills,
  step1done,
  step2done,
  step3done,
}) {
  const tips = [
    "Tip — upload your CV first so Arivo reads your actual skills, not guesses.",
    "Tip — add skills manually that might not appear on your CV.",
    "Tip — toggle 'Visa sponsors only' to filter to companies that can hire you.",
    "Tip — run multiple analyses with different target roles to compare readiness.",
  ];
  const completed = [step1done, step2done, step3done].filter(Boolean).length;
  const tipIndex = Math.min(completed, tips.length - 1);

  return (
    <div className="pf-identity">
      <div className="pf-avatar-wrap">
        <div className="pf-avatar">{initials(currentUser?.name)}</div>
        <div className="pf-avatar-ring" />
      </div>
      <div className="pf-identity-name">
        {currentUser?.name || "Your profile"}
      </div>
      {currentUser?.university && (
        <div className="pf-identity-uni">{currentUser.university}</div>
      )}

      <div className="pf-id-stats">
        <div className="pf-id-stat">
          <div className="pf-id-stat-val">{allSkills.length}</div>
          <div className="pf-id-stat-lbl">Skills</div>
        </div>
        <div className="pf-id-divider" />
        <div className="pf-id-stat">
          <div className="pf-id-stat-val">{completed}/3</div>
          <div className="pf-id-stat-lbl">Steps done</div>
        </div>
        <div className="pf-id-divider" />
        <div className="pf-id-stat">
          <div className="pf-id-stat-val">
            {completed === 3 ? "Ready" : "Setup"}
          </div>
          <div className="pf-id-stat-lbl">Status</div>
        </div>
      </div>

      <div className="pf-tip">
        {Ic.sparkle(13)}
        <span>{tips[tipIndex]}</span>
      </div>

      <div className="pf-steps-mini">
        {["Upload CV", "Add skills", "Run analysis"].map((label, i) => {
          const done = [step1done, step2done, step3done][i];
          return (
            <div key={i} className={`pf-step-mini ${done ? "is-done" : ""}`}>
              <div className="pf-step-mini-dot">
                {done ? Ic.check(10) : null}
              </div>
              <span>{label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Right pane: results ───────────────────────────────────────
function Results({ r }) {
  const score = Math.max(0, Math.min(100, Number(r.readiness_score) || 0));
  const matching = r.matching_skills || [];
  const sponsors = r.visa_sponsor_companies || [];
  const missingReq = r.missing_required || [];
  const missingNice = r.missing_nice_to_have || [];
  const resources = r.learning_resources || {};

  return (
    <div className="pf-results">
      <div className="pf-res-hero">
        <RadialGauge score={score} />
        <div className="pf-res-hero-text">
          <div className="pf-res-role">{r.target_role || "Your role"}</div>
          <div className="pf-res-sub-label">Market readiness</div>
          {r.summary && <p className="pf-res-summary">{r.summary}</p>}
        </div>
      </div>

      <div className="pf-stats-row">
        <Stat value={r.jobs_analysed} label="Jobs analysed" color="#9b6ef3" />
        <Stat
          value={r.visa_sponsors_found}
          label="Visa sponsors"
          color="#00d4aa"
        />
        <Stat value={matching.length} label="Skills matched" color="#e879f9" />
      </div>

      {sponsors.length > 0 && (
        <div className="pf-block">
          <div className="pf-block-hd pf-block-hd--teal">
            {Ic.building(12)} Visa sponsor companies
          </div>
          <div className="pf-tag-row">
            {sponsors.map((c) => (
              <span key={c} className="pf-tag pf-tag--teal">
                {c}
              </span>
            ))}
          </div>
        </div>
      )}

      {matching.length > 0 && (
        <div className="pf-block">
          <div className="pf-block-hd pf-block-hd--purple">
            {Ic.check(12)} Skills you already have
          </div>
          <div className="pf-tag-row">
            {matching.map((s) => (
              <span key={s} className="pf-tag pf-tag--purple">
                {s}
              </span>
            ))}
          </div>
        </div>
      )}

      {missingReq.length > 0 && (
        <div className="pf-block">
          <div className="pf-block-hd pf-block-hd--magenta">
            {Ic.sparkle(12)} Your learning roadmap
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

      {missingNice.length > 0 && (
        <div className="pf-block">
          <div className="pf-block-hd pf-block-hd--gold">Nice to have</div>
          <div className="pf-tag-row">
            {missingNice.map((s) => (
              <span key={s} className="pf-tag pf-tag--gold">
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
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════
function Profile() {
  const { currentUser, token } = useAuth();

  // CV
  const [cvFile, setCvFile] = useState(null);
  const [cvLoading, setCvLoading] = useState(false);
  const [cvSkills, setCvSkills] = useState([]);
  const [cvUploaded, setCvUploaded] = useState(false);

  // Skills
  const [allSkills, setAllSkills] = useState([]);
  const [manualSkill, setManualSkill] = useState("");

  // Gap analysis
  const [targetRole, setTargetRole] = useState(currentUser?.targetRole || "");
  const [roleError, setRoleError] = useState(false);
  const [visaOnly, setVisaOnly] = useState(false);
  const [gapLoading, setGapLoading] = useState(false);
  const [gapResult, setGapResult] = useState(null);
  const [gapError, setGapError] = useState(false);
  const [analysisId, setAnalysisId] = useState(0);

  // UI state — which steps are open
  const [openStep, setOpenStep] = useState(1);

  // Toast
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);
  const flash = useCallback((type, msg) => {
    setToast({ type, msg });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 3400);
  }, []);
  useEffect(() => () => clearTimeout(toastTimer.current), []);

  // ── CV upload ─────────────────────────────────────────────
  const pickFile = (f) => {
    if (
      f.type &&
      f.type !== "application/pdf" &&
      !f.name.toLowerCase().endsWith(".pdf")
    ) {
      flash("error", "Please upload your CV as a PDF file.");
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
      setAllSkills((prev) => Array.from(new Set([...found, ...prev])));
      setCvUploaded(true);
      flash(
        "success",
        `Found ${found.length} skill${found.length === 1 ? "" : "s"} in your CV.`,
      );
      setOpenStep(2);
    } catch (err) {
      flash(
        "error",
        err.response?.data?.message ||
          "Upload failed — is the backend running?",
      );
    }
    setCvLoading(false);
  };

  // ── Skills ────────────────────────────────────────────────
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

  // ── Analyse ───────────────────────────────────────────────
  const analyseGap = async () => {
    if (!targetRole.trim()) {
      setRoleError(true);
      flash("error", "Enter your target role first.");
      return;
    }
    if (!allSkills.length) {
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

  // ── Derived ───────────────────────────────────────────────
  const step1done = cvUploaded;
  const step2done = allSkills.length > 0;
  const step3done = !!gapResult && !gapResult?.error;

  const toggleStep = (n) => setOpenStep((prev) => (prev === n ? null : n));

  return (
    <div className="pf">
      <style>{CSS}</style>
      <Toast toast={toast} />

      {/* ── Full-bleed header ─────────────────────────────── */}
      <header className="pf-header">
        <div className="pf-header-left">
          <div className="pf-eyebrow">Profile</div>
          <h1 className="pf-title">{currentUser?.name || "Your profile"}</h1>
          {currentUser?.university && (
            <p className="pf-uni">{currentUser.university}</p>
          )}
        </div>
        <div className="pf-header-right">
          <div className="pf-prog-wrap">
            <svg viewBox="0 0 44 44" className="pf-prog-svg" aria-hidden="true">
              <defs>
                <linearGradient id="prog-grad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#7c6fef" />
                  <stop offset="100%" stopColor="#e879f9" />
                </linearGradient>
              </defs>
              <circle cx="22" cy="22" r="18" className="pf-prog-track" />
              <circle
                cx="22"
                cy="22"
                r="18"
                className="pf-prog-arc"
                strokeDasharray={`${([step1done, step2done, step3done].filter(Boolean).length / 3) * 113.1} 113.1`}
                transform="rotate(-90 22 22)"
              />
            </svg>
            <div className="pf-prog-label">
              {[step1done, step2done, step3done].filter(Boolean).length}/3
            </div>
          </div>
        </div>
      </header>

      {/* ── Two-column cockpit ────────────────────────────── */}
      <div className="pf-cockpit">
        {/* LEFT — action panel */}
        <div className="pf-left">
          {/* Step 1 */}
          <div className="pf-step-card">
            <StepHeader
              n={1}
              done={step1done}
              title="Upload your CV"
              sub={
                step1done
                  ? `${cvSkills.length} skills extracted`
                  : "PDF · we read it, we don't store it"
              }
              open={openStep === 1}
              onToggle={() => toggleStep(1)}
            />
            {openStep === 1 && (
              <div className="pf-step-body">
                <Dropzone
                  file={cvFile}
                  loading={cvLoading}
                  uploaded={cvUploaded}
                  onPick={pickFile}
                  onClear={clearFile}
                  onUpload={uploadCV}
                />
              </div>
            )}
          </div>

          {/* Step 2 */}
          <div className="pf-step-card">
            <StepHeader
              n={2}
              done={step2done}
              title="Your skills"
              sub={
                allSkills.length > 0
                  ? `${allSkills.length} skills in your pool`
                  : "Review, add or remove"
              }
              open={openStep === 2}
              onToggle={() => toggleStep(2)}
            />
            {openStep === 2 && (
              <div className="pf-step-body">
                <div className="pf-skill-add">
                  <input
                    className="pf-input"
                    value={manualSkill}
                    onChange={(e) => setManualSkill(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addManualSkill()}
                    placeholder="e.g. React, Tableau, Patient care…"
                    aria-label="Add a skill"
                  />
                  <button className="pf-add-btn" onClick={addManualSkill}>
                    {Ic.plus(15)}
                  </button>
                </div>
                {allSkills.length > 0 ? (
                  <div className="pf-skill-pool">
                    {allSkills.map((skill) => (
                      <span
                        key={skill}
                        className={`pf-chip ${isManual(skill) ? "is-manual" : ""}`}
                        title={
                          isManual(skill) ? "Added by you" : "From your CV"
                        }
                      >
                        {skill}
                        <button
                          className="pf-chip-x"
                          onClick={() => removeSkill(skill)}
                          aria-label={`Remove ${skill}`}
                        >
                          {Ic.x(10)}
                        </button>
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="pf-hint">
                    Upload your CV above, or type a skill and press Enter.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Step 3 */}
          <div className="pf-step-card">
            <StepHeader
              n={3}
              done={step3done}
              title="Analyse skill gap"
              sub={
                step3done
                  ? `Results ready for ${gapResult?.target_role}`
                  : "Match your skills to the market"
              }
              open={openStep === 3}
              onToggle={() => toggleStep(3)}
            />
            {openStep === 3 && (
              <div className="pf-step-body">
                <input
                  className={`pf-input pf-input--block ${roleError ? "is-err" : ""}`}
                  value={targetRole}
                  onChange={(e) => {
                    setTargetRole(e.target.value);
                    setRoleError(false);
                  }}
                  placeholder="e.g. ML Engineer, Nurse, Finance Analyst…"
                  aria-label="Target role"
                />
                {roleError && (
                  <p className="pf-err-msg">Enter your target role first.</p>
                )}

                <button
                  className={`pf-visa-toggle ${visaOnly ? "is-on" : ""}`}
                  onClick={() => setVisaOnly((v) => !v)}
                  aria-pressed={visaOnly}
                >
                  {Ic.shield(13)} Skilled Worker sponsors only
                </button>
                <p className="pf-visa-hint">
                  Only weigh skills from visa-sponsoring companies
                </p>

                <button
                  className="pf-cta"
                  onClick={analyseGap}
                  disabled={gapLoading}
                >
                  {gapLoading ? (
                    <span className="pf-btn-spin">
                      <span className="pf-spinner" /> Reading the London market…
                    </span>
                  ) : (
                    <>{Ic.sparkle(15)} Analyse my skill gap</>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT — context / results pane */}
        <div className="pf-right">
          {/* Skeleton while loading */}
          {gapLoading && (
            <div className="pf-right-inner">
              <div
                className="pf-skel"
                style={{
                  width: 120,
                  height: 120,
                  borderRadius: "50%",
                  margin: "0 auto 20px",
                }}
              />
              <div
                className="pf-skel"
                style={{ height: 16, width: "60%", margin: "0 auto 10px" }}
              />
              <div
                className="pf-skel"
                style={{ height: 12, width: "80%", margin: "0 auto 8px" }}
              />
              <div
                className="pf-skel"
                style={{ height: 12, width: "70%", margin: "0 auto 24px" }}
              />
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 1fr",
                  gap: 10,
                }}
              >
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

          {/* Error */}
          {!gapLoading && gapError && (
            <div className="pf-right-inner pf-error-state">
              <div className="pf-error-ico">{Ic.alert(24)}</div>
              <div className="pf-error-title">
                Couldn't reach the AI service
              </div>
              <p className="pf-error-sub">
                Make sure the FastAPI service is running on port 8000, then try
                again.
              </p>
              <button className="pf-primary" onClick={analyseGap}>
                Try again
              </button>
            </div>
          )}

          {/* Results */}
          {!gapLoading && gapResult && !gapResult.error && (
            <Results key={analysisId} r={gapResult} />
          )}

          {/* Identity card — shown when no results yet */}
          {!gapLoading && !gapResult && !gapError && (
            <IdentityCard
              currentUser={currentUser}
              allSkills={allSkills}
              step1done={step1done}
              step2done={step2done}
              step3done={step3done}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// DESIGN SYSTEM — Arivo cinematic purple, two-column cockpit
// ═══════════════════════════════════════════════════════════════
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

/* ── Tokens ─────────────────────────────────────────────────── */
.pf {
  --p1:#7c6fef; --p2:#9b6ef3; --mg:#e879f9; --tl:#00d4aa; --gold:#f5c451; --red:#ff6b6b;
  --bg:#08080f;
  --s1:#0d0d1a; --s2:#111122; --s3:#181830;
  --bd:rgba(255,255,255,.055); --bd2:rgba(124,111,239,.28);
  --tx:#f0f0ff; --tx2:#8888aa; --tx3:#4e4e66;

  width:100%;
  padding: clamp(1.5rem,4vw,2.5rem) clamp(1rem,3vw,2rem) 4rem;
  box-sizing:border-box;
  color:var(--tx);
  font-family:'Inter',ui-sans-serif,system-ui,sans-serif;
  font-feature-settings:'cv11','ss01';
  -webkit-font-smoothing:antialiased;
}
.pf *,
.pf *::before,
.pf *::after { box-sizing:border-box; }

.pf button:focus-visible,
.pf a:focus-visible,
.pf input:focus-visible,
.pf [role=button]:focus-visible {
  outline:2px solid var(--p1); outline-offset:2px;
}

/* ── Header ─────────────────────────────────────────────────── */
.pf-header {
  display:flex; align-items:flex-end; justify-content:space-between;
  gap:16px;
  padding-bottom:clamp(1.25rem,3vw,2rem);
  margin-bottom:clamp(1.25rem,3vw,2rem);
  border-bottom:1px solid var(--bd);
}
.pf-eyebrow {
  font-size:11px; font-weight:700; letter-spacing:.12em;
  text-transform:uppercase; color:var(--p2); margin-bottom:6px;
}
.pf-title {
  margin:0 0 3px; font-size:clamp(20px,3vw,28px);
  font-weight:800; letter-spacing:-.03em; line-height:1.1; color:var(--tx);
}
.pf-uni { margin:0; font-size:13px; color:var(--tx2); }

/* Progress ring in header */
.pf-header-right { flex-shrink:0; }
.pf-prog-wrap { position:relative; width:48px; height:48px; }
.pf-prog-svg  { width:48px; height:48px; }
.pf-prog-track { fill:none; stroke:var(--bd); stroke-width:3.5; }
.pf-prog-arc {
  fill:none; stroke:url(#prog-grad); stroke-width:3.5; stroke-linecap:round;
  transition:stroke-dasharray .5s cubic-bezier(.4,0,.2,1);
}
.pf-prog-label {
  position:absolute; inset:0; display:flex; align-items:center; justify-content:center;
  font-size:11px; font-weight:700; color:var(--tx); letter-spacing:-.02em;
}

/* ── Two-column cockpit ──────────────────────────────────────── */
.pf-cockpit {
  display:grid;
  grid-template-columns:minmax(0,1fr) minmax(0,1fr);
  gap:clamp(12px,2vw,20px);
  align-items:start;
}

/* ── LEFT — action panel ─────────────────────────────────────── */
.pf-left {
  display:flex; flex-direction:column; gap:10px;
  position:sticky; top:clamp(1rem,2vw,1.5rem);
}

/* Step cards (accordion) */
.pf-step-card {
  background:var(--s1);
  border:1px solid var(--bd);
  border-radius:18px;
  overflow:hidden;
  transition:border-color .2s;
}
.pf-step-card:has(.is-open) {
  border-color:var(--bd2);
}

/* Step header / toggle button */
.pf-step-hd {
  width:100%; display:flex; align-items:center; gap:13px;
  padding:16px 18px; background:transparent; border:none; cursor:pointer;
  text-align:left; font-family:inherit; transition:background .15s;
}
.pf-step-hd:hover { background:rgba(255,255,255,.025); }

.pf-step-node {
  width:30px; height:30px; border-radius:50%; flex-shrink:0;
  display:flex; align-items:center; justify-content:center;
  font-size:13px; font-weight:700; color:var(--tx2);
  background:var(--s2); border:1px solid var(--bd);
  transition:background .25s, border-color .25s, box-shadow .25s;
}
.pf-step-node.is-done {
  background:linear-gradient(135deg,var(--p1),var(--p2));
  color:#fff; border-color:transparent;
  box-shadow:0 0 14px rgba(124,111,239,.4);
}
.pf-step-label { flex:1; min-width:0; }
.pf-step-title {
  font-size:13.5px; font-weight:600; color:var(--tx);
  white-space:nowrap; overflow:hidden; text-overflow:ellipsis;
}
.pf-step-sub {
  font-size:11.5px; color:var(--tx3); margin-top:2px;
  white-space:nowrap; overflow:hidden; text-overflow:ellipsis;
}
.pf-step-hd.is-done .pf-step-sub { color:var(--tl); }
.pf-step-chevron {
  flex-shrink:0; color:var(--tx3);
  transition:transform .2s cubic-bezier(.4,0,.2,1), color .2s;
}
.pf-step-chevron.is-open { transform:rotate(180deg); color:var(--p2); }

/* Step body */
.pf-step-body {
  padding:0 18px 18px;
  animation:pf-slide .2s ease;
}
@keyframes pf-slide {
  from { opacity:0; transform:translateY(-6px); }
  to   { opacity:1; transform:translateY(0); }
}

/* ── Dropzone ──────────────────────────────────────────────── */
.pf-drop {
  border:1.5px dashed rgba(124,111,239,.2);
  border-radius:14px; padding:clamp(20px,3vw,28px) 16px;
  text-align:center; cursor:pointer;
  background:var(--s2);
  transition:border-color .2s, background .2s, transform .18s;
}
.pf-drop:hover  { border-color:var(--bd2); background:rgba(124,111,239,.04); }
.pf-drop.is-drag { border-color:var(--p1); background:rgba(124,111,239,.08); transform:scale(1.01); }
.pf-drop-ic {
  width:48px; height:48px; margin:0 auto 12px; border-radius:14px;
  display:flex; align-items:center; justify-content:center;
  color:var(--p2); background:rgba(124,111,239,.1); border:1px solid rgba(124,111,239,.2);
}
.pf-drop-title  { font-size:13px; font-weight:600; margin-bottom:4px; color:var(--tx); }
.pf-drop-title span { color:var(--p2); text-decoration:underline; text-underline-offset:2px; }
.pf-drop-hint   { font-size:11.5px; color:var(--tx3); }

/* Selected / done file row */
.pf-file-selected { display:flex; flex-direction:column; gap:10px; }
.pf-file {
  display:flex; align-items:center; gap:11px;
  background:var(--s2); border:1px solid var(--bd);
  border-radius:12px; padding:11px 14px;
}
.pf-file--done { border-color:rgba(0,212,170,.2); background:rgba(0,212,170,.04); }
.pf-file-ic {
  width:36px; height:36px; flex-shrink:0; border-radius:10px;
  display:flex; align-items:center; justify-content:center;
  color:var(--p2); background:rgba(124,111,239,.1);
}
.pf-file-ic--done { color:var(--tl); background:rgba(0,212,170,.1); }
.pf-file-info { flex:1; min-width:0; }
.pf-file-name { font-size:12.5px; font-weight:600; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; color:var(--tx); }
.pf-file-meta { font-size:11px; color:var(--tx3); margin-top:2px; }
.pf-icon-btn {
  width:28px; height:28px; flex-shrink:0; border:none; background:transparent;
  color:var(--tx3); border-radius:7px; cursor:pointer;
  display:flex; align-items:center; justify-content:center;
  transition:color .15s, background .15s; font-family:inherit;
}
.pf-icon-btn:hover { color:var(--tx); background:rgba(255,255,255,.07); }
.pf-link-btn {
  border:none; background:none; color:var(--p2); font-size:11.5px;
  font-weight:600; cursor:pointer; flex-shrink:0; font-family:inherit;
  transition:color .15s; padding:0;
}
.pf-link-btn:hover { color:var(--mg); }

/* ── Inputs ──────────────────────────────────────────────────── */
.pf-input {
  background:var(--s2); border:1px solid var(--bd); border-radius:11px;
  color:var(--tx); font-size:13px; padding:10px 13px; outline:none;
  transition:border-color .18s, box-shadow .18s; font-family:inherit; width:100%;
}
.pf-input::placeholder { color:var(--tx3); }
.pf-input:focus { border-color:var(--p1); box-shadow:0 0 0 3px rgba(124,111,239,.13); }
.pf-input.is-err { border-color:rgba(255,107,107,.5); }
.pf-input--block { display:block; margin-bottom:12px; }
.pf-err-msg { font-size:11.5px; color:var(--red); margin:-6px 0 12px; }

/* Skills */
.pf-skill-add { display:flex; gap:8px; margin-bottom:13px; }
.pf-skill-add .pf-input { flex:1; }
.pf-add-btn {
  width:40px; height:40px; flex-shrink:0; border:none;
  background:linear-gradient(135deg,var(--p1),var(--p2));
  color:#fff; border-radius:11px; cursor:pointer;
  display:flex; align-items:center; justify-content:center;
  transition:filter .18s, transform .12s; font-family:inherit;
}
.pf-add-btn:hover { filter:brightness(1.12); }
.pf-add-btn:active { transform:scale(.95); }

.pf-skill-pool {
  display:flex; flex-wrap:wrap; gap:6px;
  max-height:148px; overflow-y:auto; padding-right:4px;
  scrollbar-width:thin; scrollbar-color:var(--s3) transparent;
}
.pf-chip {
  display:inline-flex; align-items:center; gap:4px;
  padding:4px 6px 4px 11px; border-radius:999px;
  background:rgba(124,111,239,.12); border:1px solid rgba(124,111,239,.22);
  color:#b0a8ff; font-size:11.5px; font-weight:500; text-transform:capitalize;
  transition:border-color .15s;
}
.pf-chip:hover { border-color:rgba(124,111,239,.45); }
.pf-chip.is-manual { background:rgba(232,121,249,.08); border-color:rgba(232,121,249,.2); color:#e8a0f9; }
.pf-chip-x {
  width:16px; height:16px; border:none; background:transparent; color:inherit;
  opacity:.5; cursor:pointer; border-radius:50%;
  display:flex; align-items:center; justify-content:center;
  transition:opacity .15s, background .15s; font-family:inherit;
}
.pf-chip-x:hover { opacity:1; background:rgba(255,255,255,.12); }

.pf-hint { font-size:12px; color:var(--tx3); margin:0; }

/* Visa toggle */
.pf-visa-toggle {
  display:inline-flex; align-items:center; gap:7px; padding:8px 15px;
  border-radius:999px; cursor:pointer; background:transparent;
  border:1px solid rgba(0,212,170,.3); color:var(--tl);
  font-size:12px; font-weight:600; font-family:inherit;
  transition:background .18s, box-shadow .18s; margin-bottom:0;
}
.pf-visa-toggle:hover { background:rgba(0,212,170,.07); }
.pf-visa-toggle.is-on {
  background:linear-gradient(135deg,#005a4a,var(--tl));
  color:#002e27; border-color:transparent;
  box-shadow:0 3px 14px rgba(0,212,170,.22);
}
.pf-visa-hint { font-size:11px; color:var(--tx3); margin:8px 0 16px; display:block; }

/* CTA */
.pf-cta {
  width:100%; padding:14px; border:none; border-radius:13px;
  background:linear-gradient(135deg,var(--p1) 0%,var(--p2) 50%,var(--mg) 100%);
  color:#fff; font-size:14px; font-weight:700; font-family:inherit;
  cursor:pointer; letter-spacing:-.01em;
  display:flex; align-items:center; justify-content:center; gap:9px;
  transition:filter .2s, transform .12s, box-shadow .2s;
  box-shadow:0 6px 24px rgba(124,111,239,.3);
}
.pf-cta:hover:not(:disabled) { filter:brightness(1.08); box-shadow:0 10px 32px rgba(124,111,239,.42); }
.pf-cta:active:not(:disabled) { transform:translateY(1px); }
.pf-cta:disabled { opacity:.6; cursor:not-allowed; }

/* Primary button */
.pf-primary {
  display:inline-flex; align-items:center; justify-content:center; gap:7px;
  padding:10px 18px; border:none; border-radius:11px;
  background:linear-gradient(135deg,var(--p1),var(--p2));
  color:#fff; font-size:12.5px; font-weight:600; font-family:inherit;
  cursor:pointer; transition:filter .18s, transform .12s; white-space:nowrap;
}
.pf-primary:hover:not(:disabled) { filter:brightness(1.12); }
.pf-primary:active:not(:disabled) { transform:scale(.98); }
.pf-primary:disabled { opacity:.5; cursor:not-allowed; }
.pf-primary--block { width:100%; }

/* Spinner */
.pf-btn-spin { display:inline-flex; align-items:center; gap:8px; }
.pf-spinner {
  width:14px; height:14px; border-radius:50%;
  border:2px solid rgba(255,255,255,.3); border-top-color:#fff;
  animation:pf-spin .7s linear infinite;
}
@keyframes pf-spin { to { transform:rotate(360deg); } }

/* ── RIGHT — context pane ────────────────────────────────────── */
.pf-right {
  min-height:420px;
  background:var(--s1);
  border:1px solid var(--bd);
  border-radius:20px;
  overflow:hidden;
  position:sticky;
  top:clamp(1rem,2vw,1.5rem);
}
.pf-right-inner { padding:clamp(20px,3vw,28px); }

/* Identity card */
.pf-identity {
  padding:clamp(24px,3.5vw,36px) clamp(20px,3vw,28px);
  display:flex; flex-direction:column; align-items:center; text-align:center;
}
.pf-avatar-wrap { position:relative; margin-bottom:16px; }
.pf-avatar {
  width:68px; height:68px; border-radius:50%;
  background:linear-gradient(135deg,var(--p1),var(--mg));
  display:flex; align-items:center; justify-content:center;
  font-size:24px; font-weight:800; color:#fff; letter-spacing:-.02em;
}
.pf-avatar-ring {
  position:absolute; inset:-4px; border-radius:50%;
  border:1.5px solid rgba(124,111,239,.35);
  pointer-events:none;
}
.pf-identity-name { font-size:17px; font-weight:700; letter-spacing:-.02em; color:var(--tx); margin-bottom:3px; }
.pf-identity-uni  { font-size:12px; color:var(--tx2); margin-bottom:22px; }

.pf-id-stats {
  display:flex; align-items:center; gap:0;
  background:var(--s2); border:1px solid var(--bd);
  border-radius:14px; padding:14px 20px;
  margin-bottom:20px; width:100%;
}
.pf-id-stat   { flex:1; text-align:center; }
.pf-id-stat-val { font-size:20px; font-weight:800; letter-spacing:-.03em; color:var(--tx); line-height:1; }
.pf-id-stat-lbl { font-size:10.5px; color:var(--tx3); margin-top:4px; text-transform:uppercase; letter-spacing:.05em; font-weight:500; }
.pf-id-divider  { width:1px; height:36px; background:var(--bd); flex-shrink:0; margin:0 8px; }

.pf-tip {
  display:flex; align-items:flex-start; gap:8px;
  background:rgba(124,111,239,.08); border:1px solid rgba(124,111,239,.18);
  border-radius:12px; padding:12px 14px; margin-bottom:20px;
  font-size:12.5px; color:var(--tx2); line-height:1.5; text-align:left;
}
.pf-tip svg { flex-shrink:0; color:var(--p2); margin-top:1px; }

.pf-steps-mini { display:flex; flex-direction:column; gap:8px; width:100%; }
.pf-step-mini {
  display:flex; align-items:center; gap:10px;
  font-size:12.5px; color:var(--tx3); font-weight:500;
}
.pf-step-mini.is-done { color:var(--tx2); }
.pf-step-mini-dot {
  width:18px; height:18px; border-radius:50%; flex-shrink:0;
  background:var(--s2); border:1px solid var(--bd);
  display:flex; align-items:center; justify-content:center; transition:all .25s;
}
.pf-step-mini.is-done .pf-step-mini-dot {
  background:linear-gradient(135deg,var(--p1),var(--p2));
  border-color:transparent; color:#fff;
}

/* ── Results panel ───────────────────────────────────────────── */
.pf-results {
  padding:clamp(20px,3vw,28px);
  animation:pf-fade .3s ease;
}
@keyframes pf-fade { from { opacity:0; transform:translateY(5px); } to { opacity:1; transform:translateY(0); } }

.pf-res-hero {
  display:flex; align-items:center; gap:20px; margin-bottom:20px;
  padding-bottom:20px; border-bottom:1px solid var(--bd);
}
.pf-res-hero-text { flex:1; min-width:0; }
.pf-res-role { font-size:17px; font-weight:800; letter-spacing:-.025em; text-transform:capitalize; color:var(--tx); }
.pf-res-sub-label { font-size:10px; font-weight:700; color:var(--tx3); text-transform:uppercase; letter-spacing:.08em; margin:3px 0 9px; }
.pf-res-summary { margin:0; font-size:12px; line-height:1.65; color:var(--tx2); }

/* Gauge */
.pf-gauge { position:relative; width:110px; height:110px; flex-shrink:0; }
.pf-gauge-svg { width:110px; height:110px; }
.pf-gauge-track { fill:none; stroke:rgba(255,255,255,.05); stroke-width:8; }
.pf-gauge-arc   { fill:none; stroke-width:8; stroke-linecap:round; }
.pf-gauge-inner {
  position:absolute; inset:0;
  display:flex; flex-direction:column; align-items:center; justify-content:center;
}
.pf-gauge-num { font-size:26px; font-weight:800; letter-spacing:-.04em; color:var(--tx); line-height:1; }
.pf-gauge-num span { font-size:11px; font-weight:500; color:var(--tx3); }
.pf-gauge-band { font-size:9.5px; font-weight:700; margin-top:4px; text-transform:uppercase; letter-spacing:.07em; }

/* Stats row */
.pf-stats-row {
  display:grid; grid-template-columns:repeat(3,1fr); gap:8px; margin-bottom:20px;
}
.pf-stat {
  background:var(--s2); border:1px solid var(--bd); border-radius:12px;
  padding:13px 10px; text-align:center; transition:border-color .2s;
}
.pf-stat:hover { border-color:var(--bd2); }
.pf-stat-val   { font-size:22px; font-weight:800; letter-spacing:-.03em; line-height:1; }
.pf-stat-label { font-size:10px; color:var(--tx3); margin-top:4px; font-weight:500; }

/* Blocks */
.pf-block        { margin-bottom:18px; }
.pf-block:last-child { margin-bottom:0; }
.pf-block-hd {
  display:flex; align-items:center; gap:6px;
  font-size:10.5px; font-weight:700; letter-spacing:.07em; text-transform:uppercase;
  color:var(--tx2); margin-bottom:10px;
}
.pf-block-hd--teal    { color:var(--tl);  }
.pf-block-hd--purple  { color:var(--p2);  }
.pf-block-hd--magenta { color:var(--mg);  }
.pf-block-hd--gold    { color:var(--gold);}

.pf-tag-row { display:flex; flex-wrap:wrap; gap:6px; }
.pf-tag {
  padding:4px 11px; border-radius:999px;
  font-size:11.5px; font-weight:500; text-transform:capitalize;
}
.pf-tag--teal   { background:rgba(0,212,170,.1);   color:var(--tl);  border:1px solid rgba(0,212,170,.22); }
.pf-tag--purple { background:rgba(155,110,243,.12); color:#b0a8ff;    border:1px solid rgba(155,110,243,.26); }
.pf-tag--gold   { background:rgba(245,196,81,.08);  color:var(--gold);border:1px solid rgba(245,196,81,.18); }

/* Roadmap */
.pf-roadmap { display:flex; flex-direction:column; gap:8px; }
.pf-res {
  background:var(--s2); border:1px solid rgba(232,121,249,.12);
  border-radius:12px; padding:12px 15px; transition:border-color .18s;
}
.pf-res:hover { border-color:rgba(232,121,249,.32); }
.pf-res-row  { display:flex; align-items:center; justify-content:space-between; gap:10px; }
.pf-res-skill { font-size:12.5px; font-weight:600; color:var(--tx); text-transform:capitalize; }
.pf-res-link {
  display:inline-flex; align-items:center; gap:3px;
  font-size:11px; font-weight:600; color:var(--p2); text-decoration:none; flex-shrink:0;
  transition:color .15s;
}
.pf-res-link:hover { color:var(--mg); }
.pf-res-meta {
  display:flex; flex-wrap:wrap; gap:12px;
  margin-top:7px; font-size:11px; color:var(--tx2);
}
.pf-res-meta span { display:inline-flex; align-items:center; gap:4px; }

/* ── Skeleton ─────────────────────────────────────────────────── */
.pf-skel {
  background:linear-gradient(90deg,var(--s1) 25%,var(--s3) 50%,var(--s1) 75%);
  background-size:200% 100%;
  animation:pf-shim 1.5s ease-in-out infinite; border-radius:8px;
}
@keyframes pf-shim { 0% { background-position:200% 0; } 100% { background-position:-200% 0; } }

/* Error state */
.pf-error-state {
  padding:clamp(24px,4vw,40px) clamp(20px,3vw,28px);
  display:flex; flex-direction:column; align-items:center; text-align:center;
}
.pf-error-ico   { color:var(--red); margin-bottom:12px; }
.pf-error-title { font-size:15px; font-weight:700; margin:0 0 8px; color:var(--tx); }
.pf-error-sub   { font-size:12.5px; color:var(--tx2); line-height:1.55; margin:0 0 18px; }

/* ── Toast ───────────────────────────────────────────────────── */
.pf-toast {
  position:fixed; left:50%; bottom:28px; transform:translateX(-50%); z-index:9000;
  display:flex; align-items:center; gap:8px; padding:12px 18px; border-radius:13px;
  font-size:13px; font-weight:500; font-family:inherit;
  backdrop-filter:blur(16px); animation:pf-rise .22s ease;
  box-shadow:0 14px 44px rgba(0,0,0,.5); max-width:min(90vw,420px);
}
@keyframes pf-rise {
  from { opacity:0; transform:translate(-50%,10px); }
  to   { opacity:1; transform:translate(-50%,0); }
}
.pf-toast--error   { background:rgba(28,10,12,.92); border:1px solid rgba(255,107,107,.3); color:#ffc9c9; }
.pf-toast--success { background:rgba(8,24,20,.92);  border:1px solid rgba(0,212,170,.3);   color:#99f5e4; }

/* ── Quality floor ───────────────────────────────────────────── */
@media (prefers-reduced-motion: reduce) {
  .pf * { animation:none !important; transition:none !important; }
}

@media (max-width:820px) {
  .pf-cockpit { grid-template-columns:1fr; }
  .pf-left    { position:static; }
  .pf-right   { position:static; min-height:auto; }
}

@media (max-width:480px) {
  .pf-stats-row { grid-template-columns:1fr 1fr; }
  .pf-id-stats  { padding:12px 14px; }
}
`;

export default Profile;
