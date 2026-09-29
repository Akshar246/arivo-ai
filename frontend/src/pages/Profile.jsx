import { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

const CV_ENDPOINT = `${import.meta.env.VITE_API_URL}/api/cv/upload`;
const GAP_ENDPOINT = `${import.meta.env.VITE_AI_URL}/skill-gap/analyse`;

// ─────────────────────────────────────────────
// UTILITIES
// ─────────────────────────────────────────────
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

// ─────────────────────────────────────────────
// ICONS
// ─────────────────────────────────────────────
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
  plus: (s = 16) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 5v14M5 12h14" />
    </svg>
  ),
  map: (s = 18) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  ),
  target: (s = 18) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="1" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="9" />
    </svg>
  ),
  briefcase: (s = 18) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
      <path d="M16 7v-2a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
    </svg>
  ),
  mic: (s = 18) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 1a3 3 0 0 0-3 3v12a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="23" />
      <line x1="8" y1="23" x2="16" y2="23" />
    </svg>
  ),
};

// ─────────────────────────────────────────────
// TOAST COMPONENT
// ─────────────────────────────────────────────
function Toast({ toast }) {
  if (!toast) return null;
  return (
    <div className={`prof-toast prof-toast--${toast.type}`} role="status" aria-live="polite">
      {Ic.alert(14)} {toast.msg}
    </div>
  );
}

// ─────────────────────────────────────────────
// RADIAL GAUGE
// ─────────────────────────────────────────────
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

// ─────────────────────────────────────────────
// STAT COMPONENT
// ─────────────────────────────────────────────
function Stat({ value, label, color }) {
  const n = useCountUp(Number(value) || 0, 900);
  return (
    <div className="prof-stat">
      <div className="prof-stat-val" style={{ color }}>{n}</div>
      <div className="prof-stat-label">{label}</div>
    </div>
  );
}

// ─────────────────────────────────────────────
// DROPZONE COMPONENT
// ─────────────────────────────────────────────
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

// ─────────────────────────────────────────────
// CAREER ROADMAP COMPONENT
// ─────────────────────────────────────────────
function CareerRoadmap({ currentRole, targetRole, currentSkills, gapResult }) {
  const stages = [
    { level: "Current", label: "Your Profile", skills: currentSkills?.length || 0, icon: "🎓" },
    { level: "Intermediate", label: "Consolidate", skills: Math.ceil((currentSkills?.length || 0) * 1.3), icon: "📈" },
    { level: "Advanced", label: "Specialize", skills: Math.ceil((currentSkills?.length || 0) * 1.7), icon: "⭐" },
    { level: "Expert", label: targetRole || "Target Role", skills: Math.ceil((currentSkills?.length || 0) * 2.2), icon: "🚀" },
  ];

  return (
    <div className="prof-roadmap">
      <div className="prof-roadmap-title">Career Progression</div>
      <div className="prof-roadmap-stages">
        {stages.map((stage, i) => (
          <div key={i} className="prof-stage">
            <div className="prof-stage-circle">{stage.icon}</div>
            <div className="prof-stage-label">{stage.label}</div>
            <div className="prof-stage-skills">{stage.skills} skills</div>
            {i < stages.length - 1 && <div className="prof-stage-arrow">{Ic.chevron(12)}</div>}
          </div>
        ))}
      </div>
      <div className="prof-roadmap-timeline">
        <div className="prof-timeline-line" />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// INTERVIEW PREP COMPONENT
// ─────────────────────────────────────────────
function InterviewPrep({ targetRole, skills, gapResult }) {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);

  const generateQuestions = async () => {
    if (!targetRole || !skills.length) return;
    setLoading(true);
    try {
      const response = await axios.post(GAP_ENDPOINT, {
        user_skills: skills,
        target_role: targetRole,
        visa_only: false,
        interview_mode: true,
      });
      setQuestions(response.data?.interview_questions || []);
    } catch (err) {
      console.error("Failed to generate interview questions:", err);
    }
    setLoading(false);
  };

  return (
    <div className="prof-interview">
      <div className="prof-interview-header">
        <div>
          <div className="prof-interview-title">Interview Preparation</div>
          <div className="prof-interview-sub">Practice questions for {targetRole}</div>
        </div>
        <button className="prof-primary" onClick={generateQuestions} disabled={loading || !targetRole}>
          {loading ? "Generating…" : "Generate Questions"}
        </button>
      </div>
      {questions.length > 0 && (
        <div className="prof-questions">
          {questions.map((q, i) => (
            <div key={i} className="prof-question-card">
              <div className="prof-question-num">Q{i + 1}</div>
              <div className="prof-question-text">{q}</div>
            </div>
          ))}
        </div>
      )}
      {!questions.length && !loading && (
        <div className="prof-hint">Generate questions to start practicing</div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// MAIN PROFILE COMPONENT
// ─────────────────────────────────────────────
export default function Profile() {
  const { currentUser, token } = useAuth();

  // Navigation state
  const [activeTab, setActiveTab] = useState("overview");

  // Profile state
  const [visaStatus, setVisaStatus] = useState("student");
  const [targetRole, setTargetRole] = useState("");
  const [editingRole, setEditingRole] = useState(false);

  // CV state
  const [cvFile, setCvFile] = useState(null);
  const [cvLoading, setCvLoading] = useState(false);
  const [cvSkills, setCvSkills] = useState([]);
  const [cvUploaded, setCvUploaded] = useState(false);

  // Skills state
  const [allSkills, setAllSkills] = useState([]);
  const [manualSkill, setManualSkill] = useState("");

  // Gap analysis state
  const [gapLoading, setGapLoading] = useState(false);
  const [gapResult, setGapResult] = useState(null);

  // UI state
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
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" },
      });
      const found = res.data?.skills_found || [];
      setCvSkills(found);
      setAllSkills((prev) => Array.from(new Set([...found, ...prev])));
      setCvUploaded(true);
      flash("success", `Found ${found.length} skill${found.length === 1 ? "" : "s"}`);
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
      flash("success", "Skill added");
    }
    setManualSkill("");
  };

  const removeSkill = (skill) => setAllSkills((prev) => prev.filter((s) => s !== skill));
  const isManual = (skill) => !cvSkills.includes(skill);

  // Analysis
  const analyseGap = async () => {
    if (!targetRole.trim()) {
      flash("error", "Enter target role");
      return;
    }
    if (!allSkills.length) {
      flash("error", "Add at least one skill");
      return;
    }
    setGapLoading(true);
    try {
      const res = await axios.post(GAP_ENDPOINT, {
        user_skills: allSkills,
        target_role: targetRole,
        visa_only: false,
      });
      setGapResult(res.data);
      flash("success", "Analysis complete!");
    } catch (err) {
      flash("error", "Analysis failed");
    }
    setGapLoading(false);
  };

  const tabs = [
    { id: "overview", label: "Overview", icon: Ic.target },
    { id: "skills", label: "Skills", icon: Ic.sparkle },
    { id: "roadmap", label: "Roadmap", icon: Ic.map },
    { id: "insights", label: "Market", icon: Ic.briefcase },
    { id: "interview", label: "Interview", icon: Ic.mic },
  ];

  return (
    <div className="prof">
      <style>{CSS}</style>
      <Toast toast={toast} />

      {/* HEADER */}
      <header className="prof-header">
        <div className="prof-header-content">
          <div className="prof-avatar-lg">{initials(currentUser?.name)}</div>
          <div className="prof-header-info">
            <h1 className="prof-name">{currentUser?.name || "Your Profile"}</h1>
            <div className="prof-meta">
              <span className="prof-visa">{visaStatus === "student" ? "Tier 4 Student" : "Graduate Route"}</span>
              <span className="prof-separator">•</span>
              <span className="prof-role-display">
                {editingRole ? (
                  <input
                    type="text"
                    value={targetRole}
                    onChange={(e) => setTargetRole(e.target.value)}
                    onBlur={() => setEditingRole(false)}
                    onKeyDown={(e) => e.key === "Enter" && setEditingRole(false)}
                    autoFocus
                    className="prof-role-input"
                  />
                ) : (
                  <span onClick={() => setEditingRole(true)} className="prof-role-clickable">
                    {targetRole || "Set target role"}
                  </span>
                )}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* TABS */}
      <nav className="prof-tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`prof-tab ${activeTab === tab.id ? "is-active" : ""}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span className="prof-tab-icon">{tab.icon(16)}</span>
            {tab.label}
          </button>
        ))}
      </nav>

      {/* CONTENT */}
      <div className="prof-content">
        {/* OVERVIEW */}
        {activeTab === "overview" && (
          <div className="prof-panel">
            <div className="prof-panel-title">Profile Overview</div>
            <div className="prof-overview-grid">
              <div className="prof-overview-card">
                <div className="prof-card-label">Current Skills</div>
                <div className="prof-card-value">{allSkills.length}</div>
                <div className="prof-card-sub">in your profile</div>
              </div>
              {gapResult && (
                <>
                  <div className="prof-overview-card">
                    <div className="prof-card-label">Market Readiness</div>
                    <div className="prof-card-value">{gapResult.readiness_score}%</div>
                    <div className="prof-card-sub">{scoreBand(gapResult.readiness_score).label}</div>
                  </div>
                  <div className="prof-overview-card">
                    <div className="prof-card-label">Skills Match</div>
                    <div className="prof-card-value">{(gapResult.matching_skills || []).length}</div>
                    <div className="prof-card-sub">of required skills</div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* SKILLS */}
        {activeTab === "skills" && (
          <div className="prof-panel">
            <div className="prof-panel-title">Skill Assessment</div>
            <Dropzone
              file={cvFile}
              loading={cvLoading}
              uploaded={cvUploaded}
              onPick={pickFile}
              onClear={() => setCvFile(null)}
              onUpload={uploadCV}
            />
            <div className="prof-skills-section">
              <div className="prof-skill-add">
                <input
                  className="prof-input"
                  value={manualSkill}
                  onChange={(e) => setManualSkill(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addSkill()}
                  placeholder="Add skill manually…"
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
                <p className="prof-hint">Upload CV or add skills to get started</p>
              )}
            </div>
            {allSkills.length > 0 && !gapResult && (
              <button className="prof-primary prof-primary--block" onClick={analyseGap} disabled={gapLoading}>
                {gapLoading ? "Analysing…" : "Analyse Market Readiness"}
              </button>
            )}
          </div>
        )}

        {/* ROADMAP */}
        {activeTab === "roadmap" && (
          <div className="prof-panel">
            <CareerRoadmap
              currentRole={currentUser?.name || "Your Profile"}
              targetRole={targetRole}
              currentSkills={allSkills}
              gapResult={gapResult}
            />
          </div>
        )}

        {/* MARKET INSIGHTS */}
        {activeTab === "insights" && (
          <div className="prof-panel">
            <div className="prof-panel-title">Market Insights</div>
            {gapResult ? (
              <div className="prof-insights">
                <div className="prof-insight-card">
                  <div className="prof-insight-label">Jobs in Market</div>
                  <div className="prof-insight-value">{gapResult.jobs_analysed || 0}</div>
                  <div className="prof-insight-sub">for {targetRole}</div>
                </div>
                <div className="prof-insight-card">
                  <div className="prof-insight-label">Visa Sponsoring</div>
                  <div className="prof-insight-value">{gapResult.visa_sponsors_found || 0}</div>
                  <div className="prof-insight-sub">companies hiring</div>
                </div>
                {gapResult.matching_skills && gapResult.matching_skills.length > 0 && (
                  <div className="prof-insight-block">
                    <div className="prof-insight-title">Your Strengths</div>
                    <div className="prof-tags">
                      {gapResult.matching_skills.map((s) => (
                        <span key={s} className="prof-tag prof-tag--good">{Ic.check(11)} {s}</span>
                      ))}
                    </div>
                  </div>
                )}
                {gapResult.missing_required && gapResult.missing_required.length > 0 && (
                  <div className="prof-insight-block">
                    <div className="prof-insight-title">Critical Gaps</div>
                    <div className="prof-gaps">
                      {gapResult.missing_required.map((s) => (
                        <div key={s} className="prof-gap">{s}</div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="prof-hint">Run skill analysis to see market insights</p>
            )}
          </div>
        )}

        {/* INTERVIEW PREP */}
        {activeTab === "interview" && (
          <div className="prof-panel">
            <InterviewPrep targetRole={targetRole} skills={allSkills} gapResult={gapResult} />
          </div>
        )}
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
  min-height: 100vh;
  padding: clamp(2rem, 5vw, 3rem) clamp(1rem, 3vw, 2rem);
  box-sizing: border-box;
  color: var(--tx);
  font-family: 'Inter', sans-serif;
  background: var(--bg);
}

.prof * { box-sizing: border-box; }

/* HEADER */
.prof-header {
  padding-bottom: 2.5rem;
  margin-bottom: 2.5rem;
  border-bottom: 1px solid var(--bd);
}

.prof-header-content {
  display: flex;
  align-items: center;
  gap: 20px;
}

.prof-avatar-lg {
  width: 70px;
  height: 70px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--p1), var(--p2));
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  font-weight: 800;
  color: #fff;
  box-shadow: 0 8px 24px rgba(124,111,239,0.3);
}

.prof-header-info { flex: 1; }
.prof-name { margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.02em; }

.prof-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 8px;
  font-size: 13px;
  color: var(--tx2);
}

.prof-visa {
  background: rgba(0,212,170,0.1);
  color: var(--tl);
  padding: 4px 10px;
  border-radius: 6px;
  font-weight: 600;
}

.prof-separator { opacity: 0.3; }

.prof-role-clickable {
  cursor: pointer;
  color: var(--p2);
  font-weight: 600;
  padding: 4px 8px;
  border-radius: 6px;
  transition: background 0.2s;
}

.prof-role-clickable:hover {
  background: rgba(124,111,239,0.2);
}

.prof-role-input {
  background: rgba(124,111,239,0.1);
  border: 1px solid var(--bd2);
  border-radius: 6px;
  color: var(--tx);
  padding: 6px 10px;
  font-size: 13px;
  font-family: inherit;
}

.prof-role-input:focus {
  outline: none;
  border-color: var(--p2);
  box-shadow: 0 0 8px rgba(124,111,239,0.3);
}

/* TABS */
.prof-tabs {
  display: flex;
  gap: 8px;
  padding-bottom: 2rem;
  border-bottom: 1px solid var(--bd);
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.prof-tab {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background: transparent;
  border: none;
  cursor: pointer;
  color: var(--tx2);
  font-size: 14px;
  font-weight: 600;
  border-radius: 8px;
  transition: all 0.2s;
  white-space: nowrap;
}

.prof-tab:hover {
  color: var(--tx);
  background: rgba(124,111,239,0.1);
}

.prof-tab.is-active {
  color: var(--p2);
  background: rgba(124,111,239,0.15);
  border-bottom: 2px solid var(--p2);
}

.prof-tab-icon { display: flex; }

/* CONTENT */
.prof-content {
  max-width: 1200px;
  animation: prof-fade 0.3s ease;
}

@keyframes prof-fade {
  from { opacity: 0; transform: translateY(4px); }
  to { opacity: 1; transform: translateY(0); }
}

.prof-panel {
  background: var(--s1);
  border: 1px solid var(--bd);
  border-radius: 20px;
  padding: clamp(24px, 4vw, 36px);
  animation: prof-slide 0.3s cubic-bezier(0.2,0.8,0.2,1);
}

@keyframes prof-slide {
  from { opacity: 0; transform: translateY(-8px); }
  to { opacity: 1; transform: translateY(0); }
}

.prof-panel-title {
  font-size: 18px;
  font-weight: 700;
  margin-bottom: 24px;
  letter-spacing: -0.01em;
}

/* OVERVIEW GRID */
.prof-overview-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.prof-overview-card {
  background: linear-gradient(135deg, rgba(124,111,239,0.1), rgba(232,121,249,0.05));
  border: 1px solid var(--bd);
  border-radius: 16px;
  padding: 20px;
  text-align: center;
  transition: all 0.3s cubic-bezier(0.2,0.8,0.2,1);
}

.prof-overview-card:hover {
  border-color: var(--bd2);
  transform: translateY(-2px);
}

.prof-card-label { font-size: 12px; font-weight: 600; color: var(--tx2); text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 8px; }
.prof-card-value { font-size: 32px; font-weight: 800; background: linear-gradient(135deg, var(--p1), var(--p2)); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin-bottom: 4px; }
.prof-card-sub { font-size: 12px; color: var(--tx3); }

/* SKILLS SECTION */
.prof-skills-section {
  margin-top: 24px;
}

.prof-skill-add {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

.prof-input {
  flex: 1;
  background: var(--s2);
  border: 1px solid var(--bd);
  border-radius: 12px;
  padding: 12px 16px;
  color: var(--tx);
  font-family: inherit;
  font-size: 14px;
  transition: all 0.2s;
}

.prof-input:focus {
  outline: none;
  border-color: var(--bd2);
  box-shadow: 0 0 12px rgba(124,111,239,0.2);
  background: var(--s2);
}

.prof-add-btn {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: linear-gradient(135deg, var(--p1), var(--p2));
  border: none;
  color: #fff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.prof-add-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(124,111,239,0.4);
}

.prof-skills {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.prof-chip {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: rgba(124,111,239,0.2);
  border: 1px solid var(--bd2);
  border-radius: 20px;
  padding: 8px 12px;
  font-size: 13px;
  font-weight: 600;
  color: var(--tl);
  animation: prof-pop 0.3s cubic-bezier(0.2,0.8,0.2,1);
}

@keyframes prof-pop {
  from { opacity: 0; transform: scale(0.9); }
  to { opacity: 1; transform: scale(1); }
}

.prof-chip.is-manual {
  border-color: rgba(232,121,249,0.3);
  color: var(--mg);
}

.prof-chip-x {
  background: none;
  border: none;
  cursor: pointer;
  color: inherit;
  padding: 2px;
  display: flex;
  align-items: center;
  opacity: 0.6;
  transition: opacity 0.2s;
}

.prof-chip-x:hover {
  opacity: 1;
}

.prof-hint {
  text-align: center;
  color: var(--tx3);
  font-size: 13px;
  padding: 20px;
}

.prof-primary {
  background: linear-gradient(135deg, var(--p1), var(--p2));
  border: none;
  color: #fff;
  padding: 12px 24px;
  border-radius: 12px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 14px;
}

.prof-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(124,111,239,0.3);
}

.prof-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.prof-primary--block {
  width: 100%;
  margin-top: 20px;
}

.prof-btn-spin {
  display: flex;
  align-items: center;
  gap: 8px;
}

.prof-spinner {
  display: inline-block;
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255,255,255,0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* ROADMAP */
.prof-roadmap {
  background: rgba(124,111,239,0.05);
  border: 1px solid var(--bd);
  border-radius: 16px;
  padding: 32px 24px;
  margin-top: 16px;
}

.prof-roadmap-title {
  font-size: 16px;
  font-weight: 700;
  margin-bottom: 28px;
  text-align: center;
}

.prof-roadmap-stages {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 16px;
  position: relative;
}

.prof-stage {
  text-align: center;
  position: relative;
}

.prof-stage-circle {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: linear-gradient(135deg, rgba(124,111,239,0.2), rgba(232,121,249,0.2));
  border: 2px solid var(--bd2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  margin: 0 auto 12px;
  transition: all 0.3s;
}

.prof-stage-circle:hover {
  border-color: var(--p2);
  transform: scale(1.1);
}

.prof-stage-label {
  font-size: 13px;
  font-weight: 700;
  color: var(--tx);
  margin-bottom: 4px;
}

.prof-stage-skills {
  font-size: 11px;
  color: var(--tx2);
}

.prof-stage-arrow {
  position: absolute;
  right: -12px;
  top: 8px;
  color: var(--p2);
  opacity: 0.5;
}

.prof-roadmap-timeline {
  position: relative;
  height: 2px;
  margin-top: 20px;
}

.prof-timeline-line {
  height: 2px;
  background: linear-gradient(90deg, var(--p1), var(--p2), var(--mg));
  border-radius: 1px;
}

/* INSIGHTS */
.prof-insights {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.prof-insight-card {
  background: var(--s2);
  border: 1px solid var(--bd);
  border-radius: 14px;
  padding: 18px;
  text-align: center;
}

.prof-insight-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--tx2);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-bottom: 8px;
}

.prof-insight-value {
  font-size: 28px;
  font-weight: 800;
  color: var(--p2);
  margin-bottom: 4px;
}

.prof-insight-sub {
  font-size: 11px;
  color: var(--tx3);
}

.prof-insight-block {
  grid-column: 1 / -1;
  margin-top: 16px;
}

.prof-insight-title {
  font-size: 14px;
  font-weight: 700;
  margin-bottom: 12px;
}

.prof-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.prof-tag {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
}

.prof-tag--good {
  background: rgba(0,212,170,0.2);
  color: var(--tl);
}

.prof-gaps {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.prof-gap {
  background: rgba(255,107,107,0.15);
  color: var(--red);
  padding: 8px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
}

/* INTERVIEW */
.prof-interview-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}

.prof-interview-title {
  font-size: 16px;
  font-weight: 700;
}

.prof-interview-sub {
  font-size: 12px;
  color: var(--tx2);
  margin-top: 4px;
}

.prof-questions {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
  margin-top: 20px;
}

.prof-question-card {
  background: var(--s2);
  border: 1px solid var(--bd);
  border-radius: 14px;
  padding: 16px;
  transition: all 0.3s;
}

.prof-question-card:hover {
  border-color: var(--bd2);
  transform: translateY(-2px);
}

.prof-question-num {
  font-size: 11px;
  font-weight: 700;
  color: var(--p2);
  text-transform: uppercase;
  margin-bottom: 8px;
}

.prof-question-text {
  font-size: 13px;
  line-height: 1.5;
  color: var(--tx);
}

/* DROPZONE */
.prof-drop {
  border: 1.5px dashed rgba(124,111,239,0.2);
  border-radius: 14px;
  padding: clamp(20px, 3vw, 28px) 16px;
  text-align: center;
  cursor: pointer;
  background: var(--s2);
  transition: all 0.2s, transform 0.18s;
}

.prof-drop:hover {
  border-color: var(--bd2);
  background: rgba(124,111,239,0.05);
}

.prof-drop.is-drag {
  border-color: var(--p2);
  background: rgba(124,111,239,0.1);
  transform: scale(1.02);
}

.prof-drop-ic {
  font-size: 32px;
  margin-bottom: 12px;
  color: var(--p2);
}

.prof-drop-title {
  font-size: 15px;
  font-weight: 600;
  margin-bottom: 4px;
}

.prof-drop-title span {
  color: var(--p2);
  font-weight: 700;
}

.prof-drop-hint {
  font-size: 12px;
  color: var(--tx2);
}

.prof-file-selected {
  margin-bottom: 16px;
}

.prof-file {
  background: var(--s2);
  border: 1px solid var(--bd2);
  border-radius: 12px;
  padding: 12px 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.prof-file-ic {
  color: var(--p2);
  flex-shrink: 0;
}

.prof-file-ic--done {
  color: var(--tl);
}

.prof-file-info {
  flex: 1;
  min-width: 0;
}

.prof-file-name {
  font-size: 13px;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.prof-file-meta {
  font-size: 11px;
  color: var(--tx2);
  margin-top: 2px;
}

.prof-file--done {
  background: rgba(0,212,170,0.08);
  border: 1px solid rgba(0,212,170,0.2);
  border-radius: 12px;
  padding: 12px 16px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.prof-icon-btn {
  background: none;
  border: none;
  color: var(--tx2);
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  transition: color 0.2s;
}

.prof-icon-btn:hover {
  color: var(--tx);
}

.prof-link-btn {
  background: none;
  border: none;
  color: var(--p2);
  cursor: pointer;
  font-size: 12px;
  font-weight: 600;
  padding: 4px 8px;
  border-radius: 6px;
  transition: background 0.2s;
}

.prof-link-btn:hover {
  background: rgba(124,111,239,0.2);
}

/* TOAST */
.prof-toast {
  position: fixed;
  bottom: 24px;
  right: 24px;
  padding: 12px 16px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 13px;
  font-weight: 600;
  backdrop-filter: blur(8px);
  animation: prof-toast-in 0.3s cubic-bezier(0.2,0.8,0.2,1);
  z-index: 1000;
}

.prof-toast--success {
  background: rgba(0,212,170,0.2);
  border: 1px solid rgba(0,212,170,0.3);
  color: var(--tl);
}

.prof-toast--error {
  background: rgba(255,107,107,0.2);
  border: 1px solid rgba(255,107,107,0.3);
  color: var(--red);
}

@keyframes prof-toast-in {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}

/* GAUGE */
.prof-gauge {
  position: relative;
  width: 140px;
  height: 140px;
  margin: 0 auto;
}

.prof-gauge-svg {
  width: 100%;
  height: 100%;
}

.prof-gauge-track {
  fill: none;
  stroke: var(--s2);
  stroke-width: 8;
}

.prof-gauge-arc {
  fill: none;
  stroke-width: 8;
  stroke-linecap: round;
  transition: stroke-dashoffset 1.2s cubic-bezier(0.2,0.8,0.2,1);
}

.prof-gauge-inner {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
}

.prof-gauge-num {
  font-size: 32px;
  font-weight: 800;
  background: linear-gradient(135deg, var(--p1), var(--p2));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.prof-gauge-num span {
  font-size: 14px;
  opacity: 0.7;
}

.prof-gauge-band {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin-top: 4px;
}

/* RESPONSIVE */
@media (max-width: 768px) {
  .prof-tabs {
    gap: 4px;
  }

  .prof-tab {
    padding: 10px 12px;
    font-size: 12px;
  }

  .prof-tab-icon {
    display: none;
  }

  .prof-overview-grid {
    grid-template-columns: 1fr;
  }

  .prof-roadmap-stages {
    grid-template-columns: repeat(2, 1fr);
  }

  .prof-header-content {
    flex-direction: column;
    text-align: center;
  }

  .prof-avatar-lg {
    margin-bottom: 8px;
  }
}
`;
