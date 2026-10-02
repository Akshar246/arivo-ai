import { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { useCareerProfile } from "../hooks/useCareerProfile";

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
// HELPERS
// ─────────────────────────────────────────────
const hasSkill = (skills, req) => {
  const r = req.toLowerCase();
  return skills.some((s) => {
    const n = s.name.toLowerCase();
    return n.includes(r) || r.includes(n);
  });
};

const SOURCE_LABEL = { cv: "From CV", manual: "Added by you", learned: "Learned" };

// ─────────────────────────────────────────────
// MAIN PROFILE
// ─────────────────────────────────────────────
export default function Profile({ onNavigate }) {
  const { currentUser, token } = useAuth();
  const { profile, loading, error, setProfile, updateProfile, saveSkills, saveGap, setPlanItem } =
    useCareerProfile();

  const [activeTab, setActiveTab] = useState("overview");
  const [editingRole, setEditingRole] = useState(false);
  const [roleDraft, setRoleDraft] = useState("");
  const [cvFile, setCvFile] = useState(null);
  const [cvLoading, setCvLoading] = useState(false);
  const [manualSkill, setManualSkill] = useState("");
  const [gapLoading, setGapLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);

  const flash = useCallback((type, msg) => {
    setToast({ type, msg });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 3400);
  }, []);
  useEffect(() => () => clearTimeout(toastTimer.current), []);

  const skills = profile?.skills || [];
  const targetRole = profile?.targetRole || "";
  const gap = profile?.gap || null;
  const plan = profile?.plan || [];
  const ats = profile?.ats || null;
  const gapStale = !!gap && profile.gapRole.toLowerCase() !== targetRole.toLowerCase();

  // Readiness is recomputed from current skills so ticking the plan moves it
  const required = gap ? gap.required_skills || [...(gap.matching_skills || []), ...(gap.missing_required || [])] : [];
  const matched = required.filter((r) => hasSkill(skills, r));
  const stillMissing = required.filter((r) => !hasSkill(skills, r));
  const liveScore = required.length ? Math.round((matched.length / required.length) * 100) : 0;
  const planDone = plan.filter((p) => p.done).length;
  const cvSkills = skills.filter((s) => s.source === "cv");
  const withEvidence = cvSkills.filter((s) => s.evidence).length;

  const run = async (fn, failMsg) => {
    try {
      return await fn();
    } catch (err) {
      flash("error", err.response?.data?.message || failMsg);
      return null;
    }
  };

  const saveRole = async () => {
    setEditingRole(false);
    const next = roleDraft.trim();
    if (next === targetRole) return;
    const ok = await run(() => updateProfile({ targetRole: next }), "Could not save role");
    if (ok) flash("success", "Target role updated");
  };

  const pickFile = (f) => {
    if (f.type && f.type !== "application/pdf" && !f.name.toLowerCase().endsWith(".pdf")) {
      flash("error", "PDF only");
      return;
    }
    setCvFile(f);
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
      setProfile({
        ...profile,
        skills: res.data.skills || skills,
        hasCv: true,
        cvUploadedAt: new Date().toISOString(),
      });
      setCvFile(null);
      flash("success", `Found ${res.data?.skills_count ?? 0} skills in your CV`);
    } catch (err) {
      flash("error", err.response?.data?.message || "Upload failed");
    }
    setCvLoading(false);
  };

  const addSkill = async () => {
    const name = manualSkill.trim();
    if (!name) return;
    setManualSkill("");
    if (skills.some((s) => s.name.toLowerCase() === name.toLowerCase())) return;
    await run(() => saveSkills([...skills, { name, source: "manual", evidence: "" }]), "Could not add skill");
  };

  const removeSkill = async (skill) => {
    if (skill.source === "learned" && plan.some((p) => p.skill.toLowerCase() === skill.name.toLowerCase())) {
      await run(() => setPlanItem(skill.name, false), "Could not remove skill");
      return;
    }
    await run(() => saveSkills(skills.filter((s) => s.name !== skill.name)), "Could not remove skill");
  };

  const analyseGap = async () => {
    if (!targetRole) return flash("error", "Set a target role first");
    if (!skills.length) return flash("error", "Add at least one skill first");
    setGapLoading(true);
    try {
      const res = await axios.post(GAP_ENDPOINT, {
        user_skills: skills.map((s) => s.name),
        target_role: targetRole,
        visa_only: false,
      });
      if (res.data?.error) {
        flash("error", res.data.error);
      } else {
        await saveGap(res.data);
        flash("success", "Analysis saved to your profile");
      }
    } catch {
      flash("error", "Analysis failed. Check the AI service is running.");
    }
    setGapLoading(false);
  };

  const togglePlan = (item) => run(() => setPlanItem(item.skill, !item.done), "Could not update plan");

  // Strength checklist — every item reads real profile data
  const checks = [
    {
      id: "cv",
      done: !!profile?.hasCv,
      title: "Upload your CV",
      detail: profile?.hasCv ? `${cvSkills.length} skills read from your CV` : "Skills are read from your CV, not guessed",
      action: "Upload",
      go: () => setActiveTab("skills"),
    },
    {
      id: "role",
      done: !!targetRole,
      title: "Set a target role",
      detail: targetRole || "Jobs and the gap analysis both use this",
      action: "Set role",
      go: () => {
        setRoleDraft(targetRole);
        setEditingRole(true);
      },
    },
    {
      id: "evidence",
      done: cvSkills.length > 0 && withEvidence === cvSkills.length,
      title: "Back every skill with CV evidence",
      detail: cvSkills.length
        ? `${withEvidence} of ${cvSkills.length} CV skills have a matching line in your CV`
        : "Appears once a CV is uploaded",
      action: "Review",
      go: () => setActiveTab("skills"),
    },
    {
      id: "gap",
      done: !!gap && !gapStale,
      title: "Compare against real job postings",
      detail: gap
        ? gapStale
          ? `Analysis is for "${profile.gapRole}", not "${targetRole}"`
          : `${matched.length} of ${required.length} required skills matched`
        : "Uses live postings for your target role",
      action: gap ? "Re-run" : "Analyse",
      go: () => setActiveTab("gap"),
    },
    {
      id: "ats",
      done: !!ats,
      title: "Scan your CV against a job description",
      detail: ats
        ? `Last ATS score ${ats.score}/100${ats.missingKeywords.length ? `, ${ats.missingKeywords.length} keywords missing` : ""}`
        : "See which keywords a screening tool would miss",
      action: "Open ATS",
      go: () => onNavigate && onNavigate("ats"),
    },
    {
      id: "plan",
      done: plan.length > 0 && planDone === plan.length,
      title: "Work through your learning plan",
      detail: plan.length ? `${planDone} of ${plan.length} skills done` : "Created when you run the gap analysis",
      action: "Open plan",
      go: () => setActiveTab("gap"),
    },
  ];
  const strength = Math.round((checks.filter((c) => c.done).length / checks.length) * 100);
  const nextStep = checks.find((c) => !c.done);

  const tabs = [
    { id: "overview", label: "Overview", icon: Ic.target },
    { id: "skills", label: "Skills", icon: Ic.sparkle },
    { id: "gap", label: "Gap & Plan", icon: Ic.briefcase },
  ];

  if (loading) {
    return (
      <div className="prof">
        <style>{CSS}</style>
        <p className="prof-hint">Loading your profile…</p>
      </div>
    );
  }
  if (error || !profile) {
    return (
      <div className="prof">
        <style>{CSS}</style>
        <p className="prof-hint">{error || "Profile unavailable"}</p>
      </div>
    );
  }

  return (
    <div className="prof">
      <style>{CSS}</style>
      <Toast toast={toast} />

      <header className="prof-header">
        <div className="prof-header-content">
          <div className="prof-avatar-lg">{initials(currentUser?.name)}</div>
          <div className="prof-header-info">
            <h1 className="prof-name">{currentUser?.name || "Your Profile"}</h1>
            <div className="prof-meta">
              <span className="prof-visa">{profile.visaType || "Visa not set"}</span>
              <span className="prof-separator">•</span>
              <span className="prof-role-display">
                {editingRole ? (
                  <input
                    type="text"
                    value={roleDraft}
                    onChange={(e) => setRoleDraft(e.target.value)}
                    onBlur={saveRole}
                    onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
                    autoFocus
                    className="prof-role-input"
                  />
                ) : (
                  <span
                    onClick={() => {
                      setRoleDraft(targetRole);
                      setEditingRole(true);
                    }}
                    className="prof-role-clickable"
                  >
                    {targetRole || "Set target role"}
                  </span>
                )}
              </span>
            </div>
          </div>
        </div>
      </header>

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

      <div className="prof-content">
        {activeTab === "overview" && (
          <div className="prof-panel">
            <div className="prof-panel-title">Profile strength</div>
            <div className="prof-bar-row">
              <div className="prof-bar"><div className="prof-bar-fill" style={{ width: `${strength}%` }} /></div>
              <span className="prof-bar-num">{strength}%</span>
            </div>
            {nextStep && (
              <p className="prof-next">
                Next: <strong>{nextStep.title}</strong>
              </p>
            )}
            <div className="prof-checks">
              {checks.map((c) => (
                <div key={c.id} className={`prof-check ${c.done ? "is-done" : ""}`}>
                  <span className="prof-check-dot">{c.done ? Ic.check(12) : null}</span>
                  <div className="prof-check-body">
                    <div className="prof-check-title">{c.title}</div>
                    <div className="prof-check-detail">{c.detail}</div>
                  </div>
                  <button className="prof-link-btn" onClick={c.go}>{c.action}</button>
                </div>
              ))}
            </div>
            {targetRole && (
              <button className="prof-primary prof-primary--block" onClick={() => onNavigate && onNavigate("jobs")}>
                Browse {targetRole} jobs
              </button>
            )}
          </div>
        )}

        {activeTab === "skills" && (
          <div className="prof-panel">
            <div className="prof-panel-title">Skills and evidence</div>
            <Dropzone
              file={cvFile}
              loading={cvLoading}
              uploaded={false}
              onPick={pickFile}
              onClear={() => setCvFile(null)}
              onUpload={uploadCV}
            />
            {profile.cvUploadedAt && (
              <p className="prof-hint">CV last read {new Date(profile.cvUploadedAt).toLocaleDateString()}</p>
            )}
            <div className="prof-skills-section">
              <div className="prof-skill-add">
                <input
                  className="prof-input"
                  value={manualSkill}
                  onChange={(e) => setManualSkill(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addSkill()}
                  placeholder="Add skill manually…"
                />
                <button className="prof-add-btn" onClick={addSkill} aria-label="Add skill">{Ic.plus(15)}</button>
              </div>
              {skills.length > 0 ? (
                <div className="prof-skill-rows">
                  {skills.map((s) => (
                    <div key={s.name} className="prof-skill-row">
                      <div className="prof-skill-main">
                        <span className="prof-skill-name">{s.name}</span>
                        <span className={`prof-badge prof-badge--${s.source}`}>{SOURCE_LABEL[s.source]}</span>
                      </div>
                      <div className="prof-skill-ev">
                        {s.source === "cv"
                          ? s.evidence
                            ? `"${s.evidence}"`
                            : "No CV line mentions this by name. Add it to your experience or projects."
                          : s.source === "learned"
                            ? "Marked as learned from your plan. Add it to your CV so ATS can see it."
                            : "Not on your CV yet."}
                      </div>
                      <button className="prof-chip-x prof-skill-x" onClick={() => removeSkill(s)} aria-label={`Remove ${s.name}`}>
                        {Ic.x(11)}
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="prof-hint">Upload your CV or add skills to get started</p>
              )}
            </div>
          </div>
        )}

        {activeTab === "gap" && (
          <div className="prof-panel">
            <div className="prof-panel-title">Gap and learning plan</div>
            {!gap ? (
              <>
                <p className="prof-hint">
                  Compares your skills with live postings for {targetRole || "your target role"}.
                </p>
                <button className="prof-primary prof-primary--block" onClick={analyseGap} disabled={gapLoading}>
                  {gapLoading ? "Analysing…" : "Analyse against job postings"}
                </button>
              </>
            ) : (
              <>
                {gapStale && (
                  <p className="prof-warn">
                    This analysis was for "{profile.gapRole}". Re-run it for "{targetRole}".
                  </p>
                )}
                <div className="prof-gap-top">
                  <RadialGauge score={liveScore} />
                  <div className="prof-gap-sum">
                    <div className="prof-gap-line">
                      {matched.length} of {required.length} skills asked for in {gap.jobs_analysed} postings are on your profile.
                    </div>
                    {liveScore !== gap.readiness_score && (
                      <div className="prof-gap-sub">Was {gap.readiness_score}% when you ran the analysis.</div>
                    )}
                    <button className="prof-link-btn" onClick={analyseGap} disabled={gapLoading}>
                      {gapLoading ? "Analysing…" : "Re-run analysis"}
                    </button>
                  </div>
                </div>

                {matched.length > 0 && (
                  <div className="prof-block">
                    <div className="prof-block-title">Matched</div>
                    <div className="prof-tags">
                      {matched.map((s) => (
                        <span key={s} className="prof-tag prof-tag--good">{Ic.check(11)} {s}</span>
                      ))}
                    </div>
                  </div>
                )}

                {plan.length > 0 && (
                  <div className="prof-block">
                    <div className="prof-block-title">
                      Learning plan <span>{planDone}/{plan.length}</span>
                    </div>
                    <div className="prof-plan">
                      {plan.map((p) => (
                        <div key={p.skill} className={`prof-plan-item ${p.done ? "is-done" : ""}`}>
                          <button
                            className="prof-plan-box"
                            onClick={() => togglePlan(p)}
                            aria-label={`Mark ${p.skill} as ${p.done ? "not learned" : "learned"}`}
                          >
                            {p.done ? Ic.check(12) : null}
                          </button>
                          <div className="prof-plan-body">
                            <div className="prof-plan-skill">{p.skill}</div>
                            {p.resource && (
                              <div className="prof-plan-res">
                                {p.url ? (
                                  <a href={p.url} target="_blank" rel="noreferrer">{p.resource}</a>
                                ) : (
                                  p.resource
                                )}
                                {p.time ? ` · about ${p.time}` : ""}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                    <p className="prof-hint">
                      Resource suggestions are AI-generated, so check the links. Ticking a skill adds it to your profile as self-reported.
                    </p>
                  </div>
                )}

                {stillMissing.length > 0 && plan.length === 0 && (
                  <div className="prof-block">
                    <div className="prof-block-title">Still missing</div>
                    <div className="prof-gaps">
                      {stillMissing.map((s) => <div key={s} className="prof-gap">{s}</div>)}
                    </div>
                  </div>
                )}

                {ats && ats.missingKeywords.length > 0 && (
                  <div className="prof-block">
                    <div className="prof-block-title">Keywords your last ATS scan missed</div>
                    <div className="prof-gaps">
                      {ats.missingKeywords.map((k) => <div key={k} className="prof-gap">{k}</div>)}
                    </div>
                  </div>
                )}

                <div className="prof-block">
                  <div className="prof-block-title">Postings from licensed sponsors</div>
                  {gap.sponsor_roles && gap.sponsor_roles.length > 0 ? (
                    <>
                      <p className="prof-hint">
                        {gap.sponsor_roles.length} of {gap.jobs_analysed} analysed postings are from employers on the Home Office
                        register of licensed sponsors. Being listed does not mean this role is sponsored, so confirm with the employer. Skill matches only use the short preview text job boards share, so they undercount.
                      </p>
                      <div className="prof-roles">
                        {gap.sponsor_roles.map((r, i) => (
                          <div key={`${r.company}-${r.title}-${i}`} className="prof-role-card">
                            <div className="prof-role-title">{r.title}</div>
                            <div className="prof-role-co">{r.company}{r.location ? `, ${r.location}` : ""}</div>
                            <div className="prof-role-match">
                              {r.skills_mentioned.length
                                ? `Mentions ${r.skills_mentioned.length} of your skills: ${r.skills_mentioned.slice(0, 4).join(", ")}`
                                : "Your skills aren't named in the short listing text we can see. Open the posting for the full requirements."}
                            </div>
                            {r.url && <a className="prof-role-link" href={r.url} target="_blank" rel="noreferrer">View posting</a>}
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <p className="prof-hint">None of the {gap.jobs_analysed} analysed postings were from employers on the register.</p>
                  )}
                </div>
              </>
            )}
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

/* STRENGTH */
.prof-bar-row { display: flex; align-items: center; gap: 12px; }
.prof-bar { flex: 1; height: 8px; border-radius: 99px; background: var(--s3); overflow: hidden; }
.prof-bar-fill { height: 100%; border-radius: 99px; background: linear-gradient(90deg, var(--p1), var(--tl)); transition: width 0.6s cubic-bezier(0.2,0.8,0.2,1); }
.prof-bar-num { font-size: 14px; font-weight: 700; min-width: 40px; text-align: right; }
.prof-next { font-size: 13px; color: var(--tx2); margin: 12px 0 20px; }
.prof-next strong { color: var(--tx); font-weight: 600; }
.prof-checks { display: flex; flex-direction: column; gap: 10px; margin-bottom: 24px; }
.prof-check { display: flex; align-items: center; gap: 14px; background: var(--s2); border: 1px solid var(--bd); border-radius: 14px; padding: 14px 16px; }
.prof-check.is-done { border-color: rgba(0,212,170,0.25); }
.prof-check-dot { width: 22px; height: 22px; border-radius: 50%; border: 1.5px solid var(--tx3); display: flex; align-items: center; justify-content: center; flex-shrink: 0; color: #08080f; }
.prof-check.is-done .prof-check-dot { background: var(--tl); border-color: var(--tl); }
.prof-check-body { flex: 1; min-width: 0; }
.prof-check-title { font-size: 14px; font-weight: 600; }
.prof-check-detail { font-size: 12px; color: var(--tx2); margin-top: 2px; }

/* SKILL ROWS */
.prof-skill-rows { display: flex; flex-direction: column; gap: 8px; margin-top: 16px; }
.prof-skill-row { position: relative; background: var(--s2); border: 1px solid var(--bd); border-radius: 12px; padding: 12px 40px 12px 14px; }
.prof-skill-main { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.prof-skill-name { font-size: 14px; font-weight: 600; }
.prof-badge { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; padding: 3px 8px; border-radius: 99px; }
.prof-badge--cv { background: rgba(124,111,239,0.15); color: var(--p2); }
.prof-badge--manual { background: rgba(245,196,81,0.14); color: var(--gold); }
.prof-badge--learned { background: rgba(0,212,170,0.14); color: var(--tl); }
.prof-skill-ev { font-size: 12px; color: var(--tx2); margin-top: 6px; line-height: 1.45; overflow-wrap: anywhere; }
.prof-skill-x { position: absolute; top: 12px; right: 12px; }

/* GAP */
.prof-warn { font-size: 13px; color: var(--gold); background: rgba(245,196,81,0.08); border: 1px solid rgba(245,196,81,0.25); padding: 10px 14px; border-radius: 12px; margin: 0 0 16px; }
.prof-gap-top { display: flex; align-items: center; gap: 28px; flex-wrap: wrap; margin-bottom: 8px; }
.prof-gap-top .prof-gauge { margin: 0; flex-shrink: 0; }
.prof-gap-sum { flex: 1; min-width: 220px; }
.prof-gap-line { font-size: 15px; font-weight: 600; line-height: 1.45; }
.prof-gap-sub { font-size: 12px; color: var(--tx2); margin: 6px 0; }
.prof-block { margin-top: 28px; }
.prof-block-title { font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: var(--tx2); margin-bottom: 12px; }
.prof-block-title span { color: var(--p2); margin-left: 6px; }
.prof-tags, .prof-gaps { display: flex; flex-wrap: wrap; gap: 8px; }
.prof-tag { display: inline-flex; align-items: center; gap: 5px; padding: 7px 12px; border-radius: 12px; font-size: 12px; font-weight: 600; }
.prof-tag--good { background: rgba(0,212,170,0.12); color: var(--tl); }
.prof-gap { background: rgba(255,107,107,0.15); color: var(--red); padding: 8px 12px; border-radius: 12px; font-size: 12px; font-weight: 600; }

.prof-plan { display: flex; flex-direction: column; gap: 8px; }
.prof-plan-item { display: flex; gap: 12px; align-items: flex-start; background: var(--s2); border: 1px solid var(--bd); border-radius: 12px; padding: 12px 14px; }
.prof-plan-item.is-done { opacity: 0.6; }
.prof-plan-item.is-done .prof-plan-skill { text-decoration: line-through; }
.prof-plan-box { width: 22px; height: 22px; border-radius: 6px; border: 1.5px solid var(--tx3); background: transparent; color: #08080f; display: flex; align-items: center; justify-content: center; cursor: pointer; flex-shrink: 0; padding: 0; }
.prof-plan-item.is-done .prof-plan-box { background: var(--tl); border-color: var(--tl); }
.prof-plan-skill { font-size: 14px; font-weight: 600; }
.prof-plan-res { font-size: 12px; color: var(--tx2); margin-top: 3px; }
.prof-plan-res a { color: var(--p2); text-decoration: none; }
.prof-plan-res a:hover { text-decoration: underline; }

.prof-roles { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 12px; }
.prof-role-card { background: var(--s2); border: 1px solid var(--bd); border-radius: 14px; padding: 14px 16px; }
.prof-role-title { font-size: 14px; font-weight: 600; }
.prof-role-co { font-size: 12px; color: var(--tx2); margin-top: 2px; }
.prof-role-match { font-size: 12px; margin-top: 10px; line-height: 1.45; }
.prof-role-link { display: inline-block; margin-top: 10px; font-size: 12px; font-weight: 600; color: var(--p2); text-decoration: none; }
.prof-role-link:hover { text-decoration: underline; }

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

  .prof-header-content {
    flex-direction: column;
    text-align: center;
  }

  .prof-avatar-lg {
    margin-bottom: 8px;
  }
}
`;
