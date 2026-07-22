import { useAuth } from "../context/AuthContext";
import { useState } from "react";

// ─────────────────────────────────────────────────────────────
// DASHBOARD · Arivo AI (V2 Premium Architecture + Blueprint)
// Full-bleed, glassmorphic layout with custom hover physics
// and the Daily 15-Minute Anti-Overwhelm Blueprint.
// ─────────────────────────────────────────────────────────────

const tools = [
  {
    icon: "💼",
    name: "Find Sponsored Jobs",
    desc: "Visa-sponsored roles, checked against the Home Office register in real time.",
    page: "jobs",
    color: "#8B5CF6", // Violet
  },
  {
    icon: "🎯",
    name: "ATS Semantic Engine",
    desc: "Score your CV against implicit biases and semantic market demands.",
    page: "ats",
    color: "#D946EF", // Fuchsia
  },
  {
    icon: "💬",
    name: "AI Career Coach",
    desc: "Simulate interviews and ask questions backed by live UK listing data.",
    page: "chat",
    color: "#10B981", // Emerald
  },
  {
    icon: "📊",
    name: "Skill Gap Analysis",
    desc: "Map your readiness against real London market demand.",
    page: "profile",
    color: "#F59E0B", // Amber
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
    label: "Check ATS readiness",
    sub: "See what recruiters' software flags.",
    page: "ats",
  },
  {
    n: "03",
    label: "Run skill-gap analysis",
    sub: "Your readiness vs real market demand.",
    page: "profile",
  },
  {
    n: "04",
    label: "Search visa jobs",
    sub: "Only roles that can actually hire you.",
    page: "jobs",
  },
  {
    n: "05",
    label: "Practise with AI",
    sub: "Interview prep from live listings.",
    page: "chat",
  },
];

export default function Dashboard({ onNavigate }) {
  const { currentUser } = useAuth();
  const name = currentUser?.name?.split(" ")[0] || "there";
  const role = currentUser?.targetRole || "Software Engineer";

  // Calculate greeting based on user's local time
  const [timeState] = useState(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  });

  // ── DAILY BLUEPRINT STATE & PERSISTENCE ──
  const [completedTasks, setCompletedTasks] = useState(() => {
    try {
      const today = new Date().toISOString().slice(0, 10);
      const saved = localStorage.getItem("arivo_blueprint_tasks");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.date === today) return parsed.completed || [];
      }
    } catch (error) {
      console.warn("Storage read error:", error);
    }
    return [];
  });

  // UX FIX: Calculate tasks synchronously on mount to avoid cascading renders
  const [dailyBlueprint] = useState(() => {
    let missingSkill = null;
    try {
      const gapData = JSON.parse(
        localStorage.getItem("arivo_pf_gap_result") || "null",
      );
      if (gapData?.missing_required?.[0]) {
        missingSkill = gapData.missing_required[0];
      }
    } catch (error) {
      console.warn("Storage read error:", error);
    }

    return [
      {
        id: "task-1",
        time: "5 MINS",
        title: missingSkill
          ? `Build Study Plan for ${missingSkill}`
          : "Scan CV for ATS Bottlenecks",
        desc: missingSkill
          ? `Your gap analysis flagged ${missingSkill}. Generate a 4-week study plan with AI Coach.`
          : "Run your CV through our ATS parser to eliminate invisible formatting flags.",
        page: missingSkill ? "profile" : "ats",
        badge: "High Impact",
      },
      {
        id: "task-2",
        time: "5 MINS",
        title: "Review Verified Tier 2 Sponsors",
        desc: "Filter live London openings by Skilled Worker sponsor license status.",
        page: "jobs",
        badge: "Sponsorship",
      },
      {
        id: "task-3",
        time: "5 MINS",
        title: "Simulate UK Behavioral Interview",
        desc: "Ask the AI Coach 1 STAR-method question tailored for UK recruiters.",
        page: "chat",
        badge: "Prep",
      },
    ];
  });

  const toggleTask = (taskId) => {
    const today = new Date().toISOString().slice(0, 10);
    const updated = completedTasks.includes(taskId)
      ? completedTasks.filter((id) => id !== taskId)
      : [...completedTasks, taskId];

    setCompletedTasks(updated);
    try {
      localStorage.setItem(
        "arivo_blueprint_tasks",
        JSON.stringify({ date: today, completed: updated }),
      );
    } catch (error) {
      console.warn("Storage write error:", error);
    }
  };

  // UX Physics: Tracks mouse position for card glow
  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    e.currentTarget.style.setProperty("--mouse-x", `${x}px`);
    e.currentTarget.style.setProperty("--mouse-y", `${y}px`);
  };

  const completedCount = completedTasks.length;

  return (
    <div className="dash-container">
      <style>{styles}</style>

      {/* Deep Background Elements */}
      <div className="dash-grid-bg"></div>

      <div className="dash-wrapper">
        {/* ── TOP BAR: Greeting & Quick Stats ── */}
        <header
          className="dash-header fade-up"
          style={{ animationDelay: "0s" }}
        >
          <div className="header-titles">
            <span className="badge-subtle">Command Center</span>
            <h1 className="greet-title">
              {timeState}, <span className="text-gradient">{name}</span>
            </h1>
            <p className="greet-sub">
              Targeting <strong className="text-highlight">{role}</strong> in
              London, UK
            </p>
          </div>

          <div className="stats-pill glass-panel">
            <div className="stat-block">
              <span className="stat-val">120k+</span>
              <span className="stat-lbl">Verified Sponsors</span>
            </div>
            <div className="stat-div"></div>
            <div className="stat-block">
              <span className="stat-val text-emerald">Live</span>
              <span className="stat-lbl">Market Data</span>
            </div>
            <div className="stat-div"></div>
            <div className="stat-block">
              <span className="stat-val">Free</span>
              <span className="stat-lbl">Forever</span>
            </div>
          </div>
        </header>

        {/* ── DAILY 15-MINUTE BLUEPRINT (THE ANTI-OVERWHELM ENGINE) ── */}
        <section
          className="blueprint-zone glass-panel fade-up"
          style={{ animationDelay: "0.05s" }}
        >
          <div className="blueprint-header">
            <div className="blueprint-title-wrap">
              <span className="blueprint-tag">
                ⚡ TODAY'S 15-MINUTE BLUEPRINT
              </span>
              <h2>Daily Micro-Actions</h2>
              <p>
                Execute these 3 small steps today to keep your job hunt moving
                forward.
              </p>
            </div>
            <div className="blueprint-progress">
              <div className="progress-bar-bg">
                <div
                  className="progress-bar-fill"
                  style={{ width: `${(completedCount / 3) * 100}%` }}
                ></div>
              </div>
              <span className="progress-text">
                {completedCount}/3 Completed Today
              </span>
            </div>
          </div>

          <div className="blueprint-tasks">
            {dailyBlueprint.map((task) => {
              const isDone = completedTasks.includes(task.id);
              return (
                <div
                  key={task.id}
                  className={`blueprint-task-card ${isDone ? "is-completed" : ""}`}
                >
                  <div
                    className="task-checkbox"
                    onClick={() => toggleTask(task.id)}
                  >
                    {isDone ? "✓" : ""}
                  </div>
                  <div className="task-info">
                    <div className="task-top-row">
                      <span className="task-badge">{task.badge}</span>
                      <span className="task-time">{task.time}</span>
                    </div>
                    <h3 className="task-title">{task.title}</h3>
                    <p className="task-desc">{task.desc}</p>
                  </div>
                  <button
                    className="task-action-btn"
                    onClick={() => onNavigate(task.page)}
                  >
                    Start <span>→</span>
                  </button>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── HERO ZONE ── */}
        <section
          className="hero-zone fade-up"
          style={{ animationDelay: "0.15s" }}
        >
          {/* Spotlight Main Card */}
          <div className="spotlight-card glass-panel interactive-glow">
            <div className="spotlight-content">
              <span className="spotlight-eyebrow">Start Here</span>
              <h2 className="spotlight-title">
                Turn your CV into an unfair advantage.
              </h2>
              <p className="spotlight-desc">
                Upload your resume once to instantly unlock your ATS readiness,
                semantic skill-gap score, and visa-sponsored matches.
              </p>
              <div className="spotlight-actions">
                <button
                  className="btn-primary"
                  onClick={() => onNavigate("profile")}
                >
                  Upload CV & Analyze <span>→</span>
                </button>
                <button className="btn-ghost" onClick={() => onNavigate("ats")}>
                  Open ATS Engine
                </button>
              </div>
            </div>

            {/* Animated CSS Orb */}
            <div className="spotlight-visual">
              <div className="orb-container">
                <div className="orb-ring ring-1"></div>
                <div className="orb-ring ring-2"></div>
                <div className="orb-core">📄</div>
              </div>
            </div>
          </div>

          {/* Activity & Trust Sidebar */}
          <div className="sidebar-zone">
            <div
              className="action-card glass-panel fade-up"
              style={{ animationDelay: "0.2s" }}
            >
              <div className="action-head">
                <span className="live-dot"></span>
                <h3>System Status</h3>
              </div>
              <div className="action-body">
                <div className="action-row">
                  <span className="action-icon">🎯</span>
                  <div className="action-text">
                    <strong>ATS Scanner</strong>
                    <span>Ready for analysis</span>
                  </div>
                  <button
                    className="action-btn-small"
                    onClick={() => onNavigate("ats")}
                  >
                    Run
                  </button>
                </div>
                <div className="action-row">
                  <span className="action-icon">💼</span>
                  <div className="action-text">
                    <strong>Visa Matches</strong>
                    <span>Live data streaming</span>
                  </div>
                  <button
                    className="action-btn-small"
                    onClick={() => onNavigate("jobs")}
                  >
                    View
                  </button>
                </div>
              </div>
            </div>

            <div
              className="trust-card glass-panel fade-up"
              style={{ animationDelay: "0.25s" }}
            >
              <h3 className="trust-title">Why Arivo Works</h3>
              <ul className="trust-list">
                <li>
                  <span className="check-icon">✓</span>
                  <div>
                    <strong>Home Office Verified</strong>
                    <span>Checked against official UK sponsor registers.</span>
                  </div>
                </li>
                <li>
                  <span className="check-icon">✓</span>
                  <div>
                    <strong>Real Market Data</strong>
                    <span>Built from live London job postings.</span>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* ── TOOLKIT GRID ── */}
        <div
          className="section-header fade-up"
          style={{ animationDelay: "0.3s" }}
        >
          <h2>Your Toolkit</h2>
          <div className="section-line"></div>
        </div>

        <div className="tools-grid">
          {tools.map((t, i) => (
            <div
              key={i}
              className="tool-card glass-panel fade-up"
              style={{
                animationDelay: `${0.35 + i * 0.08}s`,
                "--hover-color": t.color,
              }}
              onMouseMove={handleMouseMove}
              onClick={() => onNavigate(t.page)}
            >
              <div
                className="tool-icon-wrap"
                style={{
                  background: `${t.color}15`,
                  border: `1px solid ${t.color}30`,
                  color: t.color,
                }}
              >
                {t.icon}
              </div>
              <h3 className="tool-name">{t.name}</h3>
              <p className="tool-desc">{t.desc}</p>
              <div className="tool-footer" style={{ color: t.color }}>
                Launch Tool <span>→</span>
              </div>
            </div>
          ))}
        </div>

        {/* ── PATHWAY ── */}
        <div
          className="section-header fade-up"
          style={{ animationDelay: "0.5s" }}
        >
          <h2>How to win with Arivo</h2>
          <div className="section-line"></div>
        </div>

        <div className="path-grid">
          {path.map((step, i) => (
            <div
              key={i}
              className="path-step glass-panel fade-up"
              style={{ animationDelay: `${0.55 + i * 0.05}s` }}
              onClick={() => onNavigate(step.page)}
            >
              <div className="step-number">{step.n}</div>
              <h4 className="step-label">{step.label}</h4>
              <p className="step-sub">{step.sub}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// PURE CSS MAGIC
// ─────────────────────────────────────────────────────────────
const styles = `
.dash-container {
  background-color: #030305;
  min-height: calc(100vh - 56px);
  color: #F8FAFC;
  font-family: 'Inter', system-ui, sans-serif;
  position: relative;
  overflow-x: hidden;
}

/* Ambient Background Grid & Glows */
.dash-grid-bg {
  position: absolute;
  inset: 0;
  background-image: 
    linear-gradient(to right, rgba(255,255,255,0.02) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(255,255,255,0.02) 1px, transparent 1px);
  background-size: 40px 40px;
  mask-image: radial-gradient(circle at 50% 0%, black, transparent 70%);
  -webkit-mask-image: radial-gradient(circle at 50% 0%, black, transparent 70%);
  pointer-events: none;
  z-index: 0;
}

.dash-wrapper {
  position: relative;
  z-index: 1;
  padding: 3rem clamp(1.5rem, 5vw, 6rem) 5rem;
  max-width: 1400px;
  margin: 0 auto;
}

/* Glassmorphism Utilities */
.glass-panel {
  background: rgba(20, 20, 30, 0.4);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 20px;
}

/* Animations */
@keyframes dashFadeUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
.fade-up {
  opacity: 0;
  animation: dashFadeUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

/* Header */
.dash-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 2rem;
  margin-bottom: 2rem;
  flex-wrap: wrap;
}
.badge-subtle {
  display: inline-block;
  font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em;
  color: #8B5CF6; background: rgba(139, 92, 246, 0.1);
  padding: 6px 12px; border-radius: 99px; margin-bottom: 12px;
  border: 1px solid rgba(139, 92, 246, 0.2);
}
.greet-title {
  font-size: clamp(2rem, 4vw, 3rem); font-weight: 800;
  letter-spacing: -0.03em; margin: 0 0 8px; line-height: 1.1;
}
.text-gradient {
  background: linear-gradient(135deg, #8B5CF6, #D946EF, #10B981);
  -webkit-background-clip: text; -webkit-text-fill-color: transparent;
}
.greet-sub { font-size: 1.1rem; color: #8888aa; margin: 0; }
.text-highlight { color: #E2E8F0; font-weight: 600; }

.stats-pill {
  display: flex; align-items: center; gap: 1.5rem;
  padding: 16px 24px; border-radius: 16px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.2);
}
.stat-block { display: flex; flex-direction: column; align-items: flex-start; }
.stat-val { font-size: 1.2rem; font-weight: 800; color: #fff; }
.text-emerald { color: #10B981; text-shadow: 0 0 10px rgba(16, 185, 129, 0.4); }
.stat-lbl { font-size: 0.75rem; color: #8888aa; text-transform: uppercase; letter-spacing: 0.05em; margin-top: 4px; }
.stat-div { width: 1px; height: 30px; background: rgba(255,255,255,0.1); }

/* ── DAILY 15-MINUTE BLUEPRINT STYLES ── */
.blueprint-zone {
  padding: 24px 28px;
  margin-bottom: 2.5rem;
  border: 1px solid rgba(139, 92, 246, 0.25);
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.05), rgba(20, 20, 30, 0.4));
}
.blueprint-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
  gap: 16px;
  flex-wrap: wrap;
}
.blueprint-tag {
  font-size: 11px;
  font-weight: 800;
  color: #10B981;
  letter-spacing: 0.08em;
  display: inline-block;
  margin-bottom: 6px;
}
.blueprint-title-wrap h2 {
  margin: 0 0 4px;
  font-size: 1.4rem;
  font-weight: 800;
  letter-spacing: -0.02em;
}
.blueprint-title-wrap p {
  margin: 0;
  font-size: 0.9rem;
  color: #8888aa;
}
.blueprint-progress {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  min-width: 160px;
}
.progress-bar-bg {
  width: 160px;
  height: 8px;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 99px;
  overflow: hidden;
  margin-bottom: 6px;
}
.progress-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #8B5CF6, #10B981);
  border-radius: 99px;
  transition: width 0.4s ease;
}
.progress-text {
  font-size: 0.75rem;
  font-weight: 700;
  color: #10B981;
}

.blueprint-tasks {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}
.blueprint-task-card {
  background: rgba(10, 10, 15, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 14px;
  padding: 18px;
  display: flex;
  align-items: flex-start;
  gap: 14px;
  transition: all 0.2s ease;
}
.blueprint-task-card:hover {
  border-color: rgba(139, 92, 246, 0.3);
  transform: translateY(-2px);
}
.blueprint-task-card.is-completed {
  opacity: 0.55;
  background: rgba(16, 185, 129, 0.03);
  border-color: rgba(16, 185, 129, 0.2);
}
.task-checkbox {
  width: 22px;
  height: 22px;
  border-radius: 6px;
  border: 2px solid rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
  margin-top: 2px;
  font-size: 13px;
  font-weight: 900;
  color: #10B981;
  transition: all 0.2s;
}
.blueprint-task-card.is-completed .task-checkbox {
  background: rgba(16, 185, 129, 0.2);
  border-color: #10B981;
}
.task-info {
  flex: 1;
  min-width: 0;
}
.task-top-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}
.task-badge {
  font-size: 10px;
  font-weight: 800;
  text-transform: uppercase;
  padding: 2px 6px;
  border-radius: 4px;
  background: rgba(139, 92, 246, 0.15);
  color: #A78BFA;
}
.task-time {
  font-size: 10px;
  font-weight: 700;
  color: #718096;
}
.task-title {
  font-size: 0.95rem;
  font-weight: 700;
  margin: 0 0 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.task-desc {
  font-size: 0.8rem;
  color: #8888aa;
  margin: 0;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.task-action-btn {
  background: transparent;
  border: none;
  color: #8B5CF6;
  font-size: 0.8rem;
  font-weight: 700;
  cursor: pointer;
  align-self: flex-end;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 0;
  transition: gap 0.2s;
}
.task-action-btn:hover {
  gap: 8px;
  color: #A78BFA;
}

/* Hero Zone */
.hero-zone {
  display: grid;
  grid-template-columns: 1.6fr 1fr;
  gap: 1.5rem;
  margin-bottom: 4rem;
}

.spotlight-card {
  display: flex; align-items: center; justify-content: space-between;
  padding: clamp(2rem, 4vw, 3.5rem);
  background: linear-gradient(145deg, rgba(139, 92, 246, 0.1), rgba(0,0,0,0) 60%);
  position: relative; overflow: hidden;
}
.spotlight-content { position: relative; z-index: 2; max-width: 500px; }
.spotlight-eyebrow { font-size: 12px; font-weight: 800; color: #F59E0B; text-transform: uppercase; letter-spacing: 0.1em; }
.spotlight-title { font-size: clamp(1.8rem, 3vw, 2.4rem); font-weight: 800; line-height: 1.2; margin: 12px 0 16px; letter-spacing: -0.02em; }
.spotlight-desc { font-size: 1rem; color: #A0AEC0; line-height: 1.6; margin-bottom: 24px; }

.spotlight-actions { display: flex; gap: 12px; flex-wrap: wrap; }
.btn-primary {
  background: #F8FAFC; color: #030305;
  border: none; padding: 14px 24px; border-radius: 12px;
  font-size: 0.95rem; font-weight: 700; cursor: pointer;
  display: flex; align-items: center; gap: 8px; justify-content: center;
  transition: all 0.2s ease;
  box-shadow: 0 0 20px rgba(255,255,255,0.1);
}
.btn-primary:hover { transform: translateY(-2px); background: #fff; box-shadow: 0 8px 25px rgba(255,255,255,0.2); }
.btn-ghost {
  background: rgba(255,255,255,0.05); color: #E2E8F0;
  border: 1px solid rgba(255,255,255,0.1); padding: 14px 20px; border-radius: 12px;
  font-size: 0.95rem; font-weight: 600; cursor: pointer; justify-content: center;
  transition: all 0.2s ease; display: flex; align-items: center;
}
.btn-ghost:hover { background: rgba(255,255,255,0.1); border-color: rgba(255,255,255,0.2); }

/* Animated Orb */
.spotlight-visual { position: relative; z-index: 1; flex-shrink: 0; padding-right: 2rem; pointer-events: none; }
.orb-container { position: relative; width: 140px; height: 140px; display: flex; align-items: center; justify-content: center; }
.orb-ring { position: absolute; inset: 0; border-radius: 50%; border: 2px solid rgba(139, 92, 246, 0.3); }
.ring-1 { animation: spin 8s linear infinite; border-top-color: #8B5CF6; border-right-color: transparent; }
.ring-2 { animation: spinReverse 12s linear infinite; border-bottom-color: #D946EF; border-left-color: transparent; scale: 1.2; }
.orb-core {
  width: 80px; height: 80px; border-radius: 50%;
  background: radial-gradient(circle, #8B5CF6, #4C1D95);
  display: flex; align-items: center; justify-content: center; font-size: 2rem;
  box-shadow: 0 0 40px rgba(139, 92, 246, 0.6);
  animation: pulse 3s ease-in-out infinite;
}

@keyframes spin { 100% { transform: rotate(360deg); } }
@keyframes spinReverse { 100% { transform: rotate(-360deg); } }
@keyframes pulse { 0%, 100% { transform: scale(1); box-shadow: 0 0 40px rgba(139, 92, 246, 0.4); } 50% { transform: scale(1.05); box-shadow: 0 0 60px rgba(139, 92, 246, 0.8); } }

/* Sidebar */
.sidebar-zone { display: flex; flex-direction: column; gap: 1.5rem; }

.action-card { padding: 20px; }
.action-head { display: flex; align-items: center; gap: 8px; margin-bottom: 16px; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 12px; }
.live-dot { width: 8px; height: 8px; background: #10B981; border-radius: 50%; box-shadow: 0 0 10px #10B981; animation: pulse 2s infinite; }
.action-head h3 { font-size: 0.9rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #A0AEC0; margin: 0; }
.action-row { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }
.action-row:last-child { margin-bottom: 0; }
.action-icon { width: 36px; height: 36px; background: rgba(255,255,255,0.05); border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 1.2rem; flex-shrink: 0; }
.action-text { display: flex; flex-direction: column; flex: 1; }
.action-text strong { font-size: 0.95rem; font-weight: 600; color: #E2E8F0; }
.action-text span { font-size: 0.8rem; color: #718096; }
.action-btn-small { background: rgba(139, 92, 246, 0.15); color: #A78BFA; border: none; padding: 6px 12px; border-radius: 6px; font-size: 0.8rem; font-weight: 700; cursor: pointer; transition: all 0.2s; }
.action-btn-small:hover { background: rgba(139, 92, 246, 0.3); color: #fff; }

.trust-card { padding: 20px; flex: 1; }
.trust-title { font-size: 0.9rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #A0AEC0; margin: 0 0 16px; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 12px; }
.trust-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 16px; }
.trust-list li { display: flex; gap: 12px; align-items: flex-start; }
.check-icon { width: 20px; height: 20px; background: rgba(16, 185, 129, 0.15); color: #10B981; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 900; margin-top: 2px; flex-shrink: 0; }
.trust-list strong { display: block; font-size: 0.9rem; color: #E2E8F0; margin-bottom: 4px; }
.trust-list span { display: block; font-size: 0.8rem; color: #718096; line-height: 1.4; }

/* Sections */
.section-header { display: flex; align-items: center; gap: 16px; margin-bottom: 1.5rem; }
.section-header h2 { font-size: 1rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #A0AEC0; margin: 0; }
.section-line { flex: 1; height: 1px; background: linear-gradient(to right, rgba(255,255,255,0.1), transparent); }

/* Tools Grid */
.tools-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 1.5rem;
  margin-bottom: 4rem;
}
.tool-card {
  padding: 24px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  display: flex; flex-direction: column;
  position: relative;
  overflow: hidden;
}
.tool-card::before {
  content: ''; position: absolute; inset: 0;
  background: radial-gradient(600px circle at var(--mouse-x) var(--mouse-y), var(--hover-color), transparent 40%);
  opacity: 0; transition: opacity 0.3s; z-index: 0; mix-blend-mode: overlay; pointer-events: none;
}
.tool-card:hover { transform: translateY(-4px); border-color: rgba(255,255,255,0.15); box-shadow: 0 20px 40px rgba(0,0,0,0.4); }
.tool-card:hover::before { opacity: 0.15; }

.tool-icon-wrap { width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; margin-bottom: 16px; z-index: 1; position: relative; }
.tool-name { font-size: 1.1rem; font-weight: 700; margin: 0 0 8px; z-index: 1; position: relative; }
.tool-desc { font-size: 0.85rem; color: #A0AEC0; line-height: 1.5; flex: 1; margin: 0 0 20px; z-index: 1; position: relative; }
.tool-footer { font-size: 0.85rem; font-weight: 700; display: flex; align-items: center; gap: 4px; z-index: 1; position: relative; transition: gap 0.2s; }
.tool-card:hover .tool-footer { gap: 8px; }

/* Path Grid */
.path-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}
.path-step {
  padding: 20px;
  cursor: pointer;
  transition: all 0.2s ease;
  border-top: 2px solid transparent;
}
.path-step:hover { background: rgba(255,255,255,0.05); border-top-color: #8B5CF6; transform: translateY(-2px); }
.step-number { font-size: 0.8rem; font-weight: 900; color: #8B5CF6; margin-bottom: 12px; letter-spacing: 0.05em; }
.step-label { font-size: 0.95rem; font-weight: 700; margin: 0 0 6px; }
.step-sub { font-size: 0.8rem; color: #718096; margin: 0; line-height: 1.4; }

/* ── MOBILE OPTIMIZATIONS ── */
@media (max-width: 1024px) {
  .hero-zone { grid-template-columns: 1fr; }
  .spotlight-card { padding: 2rem; }
  .blueprint-tasks { grid-template-columns: 1fr; }
}

@media (max-width: 768px) {
  .dash-wrapper { padding: 2rem 1.25rem 5rem; }
  .dash-header { flex-direction: column; align-items: flex-start; gap: 1.5rem; }
  .stats-pill { width: 100%; flex-wrap: wrap; justify-content: center; padding: 16px; gap: 12px; }
  .stat-block { width: 45%; align-items: center; text-align: center; }
  .stat-div { display: none; }
  
  .blueprint-zone { padding: 20px 16px; }
  .blueprint-header { flex-direction: column; gap: 16px; }
  .blueprint-progress { align-items: flex-start; width: 100%; }
  .progress-bar-bg { width: 100%; }
  
  .spotlight-card { flex-direction: column; text-align: left; padding: 2rem 1.5rem; }
  .spotlight-actions { flex-direction: column; width: 100%; }
  .btn-primary, .btn-ghost { width: 100%; }
  .spotlight-content { z-index: 2; width: 100%; }
  .spotlight-visual { 
    position: absolute; 
    right: -40px; 
    bottom: -40px; 
    opacity: 0.2; 
    padding: 0; 
    transform: scale(0.8);
  }
}
`;
