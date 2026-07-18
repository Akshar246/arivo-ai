import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

// ─────────────────────────────────────────────────────────────
// ARIVO CAREER ENGINE · The "Anti-ChatGPT" UI
// Bulletproof Flexbox Layout to prevent vertical floating.
// Original Arivo Color Palette restored.
// ─────────────────────────────────────────────────────────────

const AI_URL = import.meta.env.VITE_AI_URL;
const now = () =>
  new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

// ── Icons ─────────────────────────────────────────────────────
const Ic = {
  spark: (s = 16) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2l1.7 6.1c.2.7.5 1 1.2 1.2L21 11l-6.1 1.7c-.7.2-1 .5-1.2 1.2L12 20l-1.7-6.1c-.2-.7-.5-1-1.2-1.2L3 11l6.1-1.7c.7-.2 1-.5 1.2-1.2z" />
    </svg>
  ),
  send: () => (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 19V5" />
      <path d="m5 12 7-7 7 7" />
    </svg>
  ),
  copy: () => (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="9" y="9" width="12" height="12" rx="2" />
      <path d="M5 15V5a2 2 0 0 1 2-2h10" />
    </svg>
  ),
  check: () => (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  ),
  globe: () => (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  ),
  shield: () => (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  ),
  target: () => (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  ),
  pen: () => (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
    </svg>
  ),
  server: () => (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="2" y="2" width="20" height="8" rx="2" ry="2" />
      <rect x="2" y="14" width="20" height="8" rx="2" ry="2" />
      <line x1="6" y1="6" x2="6.01" y2="6" />
      <line x1="6" y1="18" x2="6.01" y2="18" />
    </svg>
  ),
  arrowRight: () => (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  ),
};

// ── Modules ───────────────────────────────────────────────────
const COACH_MODES = [
  {
    id: "general",
    icon: Ic.spark(),
    name: "General Intelligence",
    desc: "Ask anything. Grounded in live UK data.",
  },
  {
    id: "localizer",
    icon: Ic.globe(),
    name: "Experience Localizer",
    desc: "Translate home-country roles to UK scale.",
    status: "beta",
  },
  {
    id: "visa",
    icon: Ic.shield(),
    name: "Visa Strategist",
    desc: "How and when to ask for sponsorship.",
  },
  {
    id: "interview",
    icon: Ic.target(),
    name: "Mock Interviewer",
    desc: "Simulate interviews from live URLs.",
  },
  {
    id: "tone",
    icon: Ic.pen(),
    name: "Tone & Culture Scanner",
    desc: "Check your emails for UK corporate fit.",
  },
];

const LOADING_PHRASES = [
  "Initializing semantic engine...",
  "Cross-referencing Home Office DB...",
  "Analyzing UK market vectors...",
  "Evaluating cultural tone fit...",
];

// ── Rich Text Parser ──────────────────────────────────────────
function inline(text) {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return parts.map((p, i) => {
    if (p.startsWith("**") && p.endsWith("**"))
      return (
        <strong key={i} className="rt-bold">
          {p.slice(2, -2)}
        </strong>
      );
    if (p.startsWith("`") && p.endsWith("`"))
      return (
        <code key={i} className="rt-code">
          {p.slice(1, -1)}
        </code>
      );
    return p;
  });
}
function parseBlocks(text) {
  const lines = (text || "").split("\n");
  const blocks = [];
  let list = null;
  const flush = () => {
    if (list) {
      blocks.push(list);
      list = null;
    }
  };
  for (const raw of lines) {
    const t = raw.replace(/\s+$/, "");
    if (/^#{1,6}\s+/.test(t)) {
      flush();
      blocks.push({ type: "h", text: t.replace(/^#{1,6}\s+/, "") });
      continue;
    }
    const isUl = /^\s*[-*]\s+/.test(t);
    const isOl = /^\s*\d+\.\s+/.test(t);
    if (isUl || isOl) {
      const kind = isUl ? "ul" : "ol";
      if (!list || list.type !== kind) {
        flush();
        list = { type: kind, items: [] };
      }
      list.items.push(t.replace(/^\s*(?:[-*]|\d+\.)\s+/, ""));
      continue;
    }
    flush();
    if (t.trim() !== "") blocks.push({ type: "p", text: t });
  }
  flush();
  return blocks;
}
function RichText({ text }) {
  const blocks = parseBlocks(text);
  return (
    <div className="rt-container">
      {blocks.map((b, i) => {
        if (b.type === "h") return <h4 key={i}>{inline(b.text)}</h4>;
        if (b.type === "p") return <p key={i}>{inline(b.text)}</p>;
        const Tag = b.type;
        return (
          <Tag key={i}>
            {b.items.map((it, j) => (
              <li key={j}>{inline(it)}</li>
            ))}
          </Tag>
        );
      })}
    </div>
  );
}

export default function Chat() {
  const { currentUser } = useAuth();
  const firstName = currentUser?.name?.split(" ")[0] || "there";

  const [activeMode, setActiveMode] = useState("general");
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState(LOADING_PHRASES[0]);
  const [lastUserText, setLastUserText] = useState("");
  const [copiedIdx, setCopiedIdx] = useState(null);

  const bottomRef = useRef(null);
  const taRef = useRef(null);

  useEffect(() => {
    setMessages([
      {
        role: "arivo",
        text: `System ready, ${firstName}. I am the Arivo Career Engine. Unlike standard AI, I am directly hooked into the UK Home Office database and your personal CV context. Select a module on the left to begin.`,
      },
    ]);
  }, [firstName]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    if (!loading) return;
    let i = 0;
    const interval = setInterval(() => {
      i = (i + 1) % LOADING_PHRASES.length;
      setLoadingText(LOADING_PHRASES[i]);
    }, 1500);
    return () => clearInterval(interval);
  }, [loading]);

  const grow = () => {
    const el = taRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 150) + "px";
  };
  useEffect(grow, [input]);

  const send = async (textArg, isRetry = false) => {
    const text = (textArg ?? input).trim();
    if (!text || loading) return;

    if (isRetry) setMessages((prev) => prev.filter((m) => !m.isError));
    else setMessages((prev) => [...prev, { role: "user", text, time: now() }]);

    setLastUserText(text);
    setInput("");
    setLoading(true);
    setLoadingText(LOADING_PHRASES[0]);

    try {
      const res = await axios.post(`${AI_URL}/chat`, {
        message: text,
        session_id: currentUser?.id || "default",
        mode: activeMode,
      });
      setMessages((prev) => [
        ...prev,
        { role: "arivo", text: res.data.response, time: now() },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "arivo",
          isError: true,
          text: "System Error: Unable to reach the AI Engine. Please check your connection.",
          time: now(),
        },
      ]);
    }
    setLoading(false);
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const copy = async (text, idx) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIdx(idx);
      setTimeout(() => setCopiedIdx(null), 1500);
    } catch {}
  };

  const currentModeData = COACH_MODES.find((m) => m.id === activeMode);

  return (
    <div className="engine-wrapper">
      <style>{styles}</style>

      <div className="engine-layout">
        {/* ── LEFT: The Arsenal ── */}
        <aside className="panel panel-left">
          <div className="panel-header">
            <span className="eyebrow">Command Modules</span>
          </div>
          <div className="sidebar-nav">
            {COACH_MODES.map((mode) => (
              <button
                key={mode.id}
                className={`nav-item ${activeMode === mode.id ? "is-active" : ""}`}
                onClick={() => setActiveMode(mode.id)}
              >
                <div className="nav-icon">{mode.icon}</div>
                <div className="nav-text">
                  <div className="nav-name">
                    {mode.name}
                    {mode.status === "beta" && (
                      <span className="tag-beta">BETA</span>
                    )}
                  </div>
                  <div className="nav-desc">{mode.desc}</div>
                </div>
              </button>
            ))}
          </div>
        </aside>

        {/* ── CENTER: The Console ── */}
        <main className="panel panel-center">
          <header className="console-header">
            <div className="ch-left">
              <div className="ch-icon">{currentModeData.icon}</div>
              <h2 className="ch-title">{currentModeData.name}</h2>
            </div>
            <div className="ch-right">
              <span className="status-dot"></span>
              <span className="status-text text-teal">Engine Online</span>
            </div>
          </header>

          <div className="console-thread">
            {messages.length === 1 && !loading && (
              <div className="empty-state">
                <div className="es-icon">{currentModeData.icon}</div>
                <h3>{currentModeData.name}</h3>
                <p>
                  Not just another chatbot. Grounded in verified UK Home Office
                  data and your personal CV context.
                </p>
                <div className="es-suggestions">
                  <button
                    onClick={() =>
                      send(
                        "Which companies sponsor Skilled Worker visas for ML engineers?",
                      )
                    }
                  >
                    Who sponsors ML Engineers? {Ic.arrowRight()}
                  </button>
                  <button
                    onClick={() =>
                      send("How do I write a UK-style cover letter?")
                    }
                  >
                    UK Cover Letter format {Ic.arrowRight()}
                  </button>
                </div>
              </div>
            )}

            {messages.map((msg, i) => {
              if (i === 0 && messages.length === 1) return null;
              const isArivo = msg.role === "arivo";
              return (
                <div
                  className={`msg-block ${isArivo ? "msg-arivo" : "msg-user"}`}
                  key={i}
                >
                  {isArivo && <div className="msg-avatar">{Ic.spark(16)}</div>}
                  <div className="msg-content">
                    <div className="msg-meta">
                      <span className="meta-author">
                        {isArivo ? "Arivo System" : firstName}
                      </span>
                      {msg.time && (
                        <span className="meta-time">{msg.time}</span>
                      )}
                    </div>

                    <div
                      className={`msg-body ${isArivo ? "bg-arivo" : "bg-user"} ${msg.isError ? "bg-error" : ""}`}
                    >
                      {isArivo ? (
                        <RichText text={msg.text} />
                      ) : (
                        <span className="user-text-format">{msg.text}</span>
                      )}
                      {msg.isError && (
                        <button
                          className="btn-retry"
                          onClick={() => send(lastUserText, true)}
                        >
                          ↻ Retry Connection
                        </button>
                      )}
                    </div>

                    {isArivo && !msg.isError && (
                      <div className="msg-actions">
                        <button
                          className="btn-action"
                          onClick={() => copy(msg.text, i)}
                        >
                          {copiedIdx === i ? (
                            <span className="action-success">
                              {Ic.check()} Copied
                            </span>
                          ) : (
                            <>{Ic.copy()} Copy</>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {loading && (
              <div className="msg-block msg-arivo">
                <div className="msg-avatar is-loading">{Ic.spark(16)}</div>
                <div className="msg-content">
                  <div className="msg-meta">
                    <span className="meta-author">Arivo System</span>
                  </div>
                  <div className="msg-body bg-arivo telemetry">
                    <span className="t-spinner"></span>
                    {loadingText}
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <div className="console-input-area">
            <div className="input-box">
              <textarea
                ref={taRef}
                rows={1}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder={`Query ${currentModeData.name}...`}
              />
              <button
                className="btn-send"
                onClick={() => send()}
                disabled={loading || !input.trim()}
              >
                {Ic.send()}
              </button>
            </div>
            <div className="input-footer">
              Press Enter to send · Shift + Enter for new line
            </div>
          </div>
        </main>

        {/* ── RIGHT: Context Board ── */}
        <aside className="panel panel-right">
          <div className="panel-header">
            <span className="eyebrow">The Arivo Edge</span>
          </div>

          <div className="context-scroll">
            <div className="ctx-group">
              <div className="ctx-group-label">Why Arivo ≠ ChatGPT</div>

              <div className="ctx-card active">
                <div className="ctx-header">
                  {Ic.shield()} Real-Time DB Hooks
                </div>
                <div className="ctx-desc">
                  Your answers are cross-referenced with 120,402 active UK Visa
                  Sponsors.
                </div>
                <div className="ctx-value text-teal">Status: Synced</div>
              </div>

              <div className="ctx-card active">
                <div className="ctx-header">{Ic.server()} Adzuna Live Feed</div>
                <div className="ctx-desc">
                  Scoring against current London job market requirements.
                </div>
                <div className="ctx-value text-teal">Status: Online</div>
              </div>
            </div>

            <div className="ctx-group">
              <div className="ctx-group-label">Context Loaded</div>

              <div className="ctx-card">
                <div className="ctx-header">
                  {Ic.target()} Profile Targeting
                </div>
                <div className="ctx-value">
                  {currentUser?.targetRole || "Software Engineer"}
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// STRICT FLEXBOX CSS (No Grid Vertical Floating)
// ─────────────────────────────────────────────────────────────
const styles = `
:root {
  --bg: #08080f;
  --surface: #0f0f18;
  --surface-hover: rgba(255,255,255,0.04);
  --border: rgba(255,255,255,0.08);
  --border-hi: rgba(124, 111, 239, 0.4);
  
  --pur: #7c6fef;
  --pur2: #9b6ef3;
  --teal: #00d4aa;
  
  --text: #f0f0ff;
  --text-2: #8888aa;
  --text-3: #55556a;
  
  --red: #ff7a7a;
  --red-bg: rgba(255, 122, 122, 0.1);
}

.engine-wrapper {
  background-color: var(--bg);
  height: calc(100vh - 56px); /* Exact height minus navbar */
  padding: 24px;
  box-sizing: border-box;
  font-family: 'Inter', system-ui, sans-serif;
  color: var(--text);
  overflow: hidden; /* Prevent page scroll */
  display: flex;
  flex-direction: column;
}
* { box-sizing: border-box; }

/* ── BULLETPROOF FLEX LAYOUT ── */
.engine-layout {
  display: flex;
  flex-direction: row;
  align-items: stretch; /* Forces equal height */
  gap: 20px;
  flex: 1;
  min-height: 0;
  width: 100%;
  max-width: 1600px;
  margin: 0 auto;
}

/* Base Panel */
.panel {
  display: flex;
  flex-direction: column;
  height: 100%; /* Locks to wrapper */
  min-height: 0;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 16px;
  overflow: hidden;
}

.panel-left, .panel-right {
  flex: 0 0 300px; /* Fixed width sidebars */
}
.panel-center {
  flex: 1; /* Takes remaining space */
  min-width: 0;
}

.panel-header {
  padding: 16px 20px;
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
  background: rgba(255,255,255,0.01);
}
.eyebrow {
  font-size: 11px; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.1em; color: var(--text-2);
}

/* ── LEFT PANEL ── */
.sidebar-nav {
  padding: 12px; overflow-y: auto; display: flex; flex-direction: column; gap: 4px;
}
.sidebar-nav::-webkit-scrollbar { width: 4px; }
.sidebar-nav::-webkit-scrollbar-thumb { background: var(--border); border-radius: 4px; }

.nav-item {
  display: flex; align-items: flex-start; gap: 12px; padding: 14px 12px; width: 100%; text-align: left;
  background: transparent; border: 1px solid transparent; border-radius: 10px; cursor: pointer;
  transition: all 0.2s; color: var(--text-2); font-family: inherit;
}
.nav-item:hover { background: var(--surface-hover); color: var(--text); }
.nav-item.is-active {
  background: rgba(124, 111, 239, 0.08); border-color: var(--border-hi);
  color: var(--text);
}
.nav-icon {
  width: 28px; height: 28px; border-radius: 8px; background: rgba(255,255,255,0.05);
  display: flex; align-items: center; justify-content: center; flex-shrink: 0; transition: all 0.2s;
}
.nav-item.is-active .nav-icon { background: rgba(124, 111, 239, 0.2); color: var(--pur); }
.nav-text { flex: 1; min-width: 0; }
.nav-name { font-size: 13px; font-weight: 700; margin-bottom: 4px; display: flex; align-items: center; gap: 6px; }
.tag-beta { font-size: 9px; padding: 2px 6px; background: rgba(245, 196, 81, 0.15); color: #f5c451; border: 1px solid rgba(245, 196, 81, 0.3); border-radius: 4px; font-weight: 800; }
.nav-desc { font-size: 12px; color: var(--text-3); line-height: 1.4; }

/* ── CENTER CONSOLE ── */
.console-header {
  padding: 16px 24px; border-bottom: 1px solid var(--border);
  display: flex; align-items: center; justify-content: space-between; flex-shrink: 0;
  background: rgba(255,255,255,0.01);
}
.ch-left { display: flex; align-items: center; gap: 14px; }
.ch-icon { width: 36px; height: 36px; border-radius: 10px; background: rgba(124, 111, 239, 0.15); border: 1px solid var(--border-hi); display: flex; align-items: center; justify-content: center; color: var(--pur); }
.ch-title { margin: 0; font-size: 16px; font-weight: 800; color: var(--text); letter-spacing: -0.01em; }
.ch-right { display: flex; align-items: center; gap: 8px; }
.status-dot { width: 8px; height: 8px; background-color: var(--teal); border-radius: 50%; box-shadow: 0 0 8px rgba(0, 212, 170, 0.6); animation: pulse 2s infinite; }
@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
.status-text { font-size: 12px; font-weight: 600; }
.text-teal { color: var(--teal); }

.console-thread {
  flex: 1; overflow-y: auto; padding: 24px; display: flex; flex-direction: column; gap: 24px;
}
.console-thread::-webkit-scrollbar { width: 6px; }
.console-thread::-webkit-scrollbar-thumb { background: var(--border); border-radius: 6px; }

/* Empty State */
.empty-state { margin: auto; max-width: 480px; text-align: center; display: flex; flex-direction: column; align-items: center; }
.es-icon { width: 56px; height: 56px; border-radius: 16px; background: var(--surface-hover); display: flex; align-items: center; justify-content: center; color: var(--text); margin-bottom: 20px; border: 1px solid var(--border); }
.empty-state h3 { margin: 0 0 10px; font-size: 20px; font-weight: 800; letter-spacing: -0.02em; }
.empty-state p { margin: 0 0 24px; font-size: 14px; color: var(--text-2); line-height: 1.6; }
.es-suggestions { display: flex; flex-direction: column; gap: 10px; width: 100%; }
.es-suggestions button {
  display: flex; align-items: center; justify-content: space-between; width: 100%; padding: 14px 18px;
  background: transparent; border: 1px solid var(--border); border-radius: 12px;
  color: var(--text-2); font-size: 13.5px; font-weight: 600; cursor: pointer; transition: all 0.2s; font-family: inherit;
}
.es-suggestions button:hover { background: rgba(124, 111, 239, 0.08); color: var(--text); border-color: var(--border-hi); transform: translateY(-1px); }

/* Chat Messages */
.msg-block { display: flex; gap: 14px; max-width: 85%; }
.msg-arivo { align-self: flex-start; }
.msg-user { align-self: flex-end; flex-direction: row-reverse; }

.msg-avatar {
  width: 32px; height: 32px; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;
  background: linear-gradient(135deg, var(--pur), var(--pur2)); box-shadow: 0 4px 10px rgba(124, 111, 239, 0.3); color: #fff;
}
.msg-avatar.is-loading { animation: pulse 2s infinite; }

.msg-content { display: flex; flex-direction: column; min-width: 0; }
.msg-user .msg-content { align-items: flex-end; }

.msg-meta { display: flex; align-items: baseline; gap: 8px; margin: 0 4px 6px; }
.meta-author { font-size: 12px; font-weight: 700; color: var(--pur2); text-transform: uppercase; letter-spacing: 0.05em; }
.msg-user .meta-author { color: var(--text); }
.meta-time { font-size: 10px; color: var(--text-3); }

.msg-body { font-size: 14px; line-height: 1.6; padding: 14px 18px; border-radius: 14px; }
.bg-arivo { background: #111119; border: 1px solid var(--border); border-top-left-radius: 4px; color: var(--text); }
.bg-user { background: linear-gradient(135deg, var(--pur), var(--pur2)); border: 1px solid var(--border-hi); border-top-right-radius: 4px; color: #fff; }
.bg-error { background: var(--red-bg); border-color: rgba(255, 122, 122, 0.3); color: var(--red); }
.user-text-format { white-space: pre-wrap; }

.msg-actions { margin-top: 6px; display: flex; gap: 8px; }
.btn-action { background: transparent; border: none; padding: 4px; display: flex; align-items: center; gap: 6px; font-size: 11px; color: var(--text-3); font-weight: 600; cursor: pointer; transition: color 0.15s; }
.btn-action:hover { color: var(--text); }
.action-success { color: var(--teal); display: flex; align-items: center; gap: 4px; }

/* Rich Text */
.rt-container p { margin: 0 0 12px; } .rt-container p:last-child { margin-bottom: 0; }
.rt-container h4 { margin: 16px 0 8px; font-size: 14px; font-weight: 700; color: #fff; }
.rt-container h4:first-child { margin-top: 0; }
.rt-container ul, .rt-container ol { margin: 0 0 12px; padding-left: 20px; }
.rt-container li { margin-bottom: 6px; }
.rt-bold { font-weight: 700; color: #fff; }
.rt-code { font-family: ui-monospace, Menlo, monospace; font-size: 12px; padding: 2px 6px; background: rgba(124, 111, 239, 0.15); border-radius: 4px; color: #c9c2f8; }

/* Telemetry */
.telemetry { display: flex; align-items: center; gap: 10px; font-family: ui-monospace, Menlo, monospace; font-size: 12px; color: var(--pur2); border-color: var(--border-hi); background: rgba(124, 111, 239, 0.05); }
.t-spinner { width: 14px; height: 14px; border: 2px solid rgba(124, 111, 239, 0.3); border-top-color: var(--pur2); border-radius: 50%; animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

/* Composer */
.console-input-area { padding: 0 24px 24px; flex-shrink: 0; }
.input-box {
  display: flex; align-items: flex-end; gap: 12px; background: var(--bg); border: 1px solid var(--border);
  border-radius: 14px; padding: 10px 10px 10px 18px; transition: border-color 0.2s, box-shadow 0.2s;
}
.input-box:focus-within { border-color: var(--pur); box-shadow: 0 0 0 4px rgba(124, 111, 239, 0.15); }
.input-box textarea { flex: 1; resize: none; border: none; outline: none; background: transparent; color: var(--text); font-size: 14px; line-height: 1.5; padding: 6px 0; max-height: 150px; font-family: inherit; }
.input-box textarea::placeholder { color: var(--text-3); }
.btn-send {
  width: 40px; height: 40px; border-radius: 10px; background: linear-gradient(135deg, var(--pur), var(--pur2)); color: #fff;
  border: none; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s; flex-shrink: 0;
}
.btn-send:hover:not(:disabled) { transform: translateY(-2px); filter: brightness(1.1); box-shadow: 0 4px 15px rgba(124, 111, 239, 0.3); }
.btn-send:disabled { background: rgba(255,255,255,0.05); color: var(--text-3); cursor: not-allowed; box-shadow: none; transform: none; }
.input-footer { text-align: center; font-size: 11px; color: var(--text-3); margin-top: 10px; }

/* ── RIGHT PANEL (The Moat Context) ── */
.context-scroll { padding: 20px; overflow-y: auto; display: flex; flex-direction: column; gap: 24px; }

.ctx-group { display: flex; flex-direction: column; gap: 12px; }
.ctx-group-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: var(--text-3); margin-left: 4px; }

.ctx-card { background: rgba(0,0,0,0.2); border: 1px solid var(--border); border-radius: 12px; padding: 16px; }
.ctx-card.active { border-color: rgba(0, 212, 170, 0.3); background: rgba(0, 212, 170, 0.05); }
.ctx-header { display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 700; color: var(--text); margin-bottom: 6px; }
.ctx-header svg { color: var(--text-3); }
.ctx-card.active .ctx-header svg { color: var(--teal); }
.ctx-desc { font-size: 12px; color: var(--text-2); margin-bottom: 12px; line-height: 1.4; }
.ctx-value { font-size: 12px; font-weight: 700; color: var(--text); }

/* Responsive */
@media (max-width: 1100px) {
  .engine-layout { grid-template-columns: 260px 1fr; }
  .panel-right { display: none; }
}
@media (max-width: 860px) {
  .engine-wrapper { padding: 12px; }
  .engine-layout { flex-direction: column; }
  .panel-left { display: none; }
  .panel-center { flex: 1; min-height: 600px; }
}
`;
