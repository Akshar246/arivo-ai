import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

// ─────────────────────────────────────────────────────────────
// CAREER COACH  ·  Arivo AI
// RAG-backed chat. Uses the user's id as session_id so memory
// is unique per user. Same backend contract as before:
//   POST http://localhost:8000/chat  { message, session_id }
//
// Renders the assistant's markdown (bold / lists / headings)
// safely without any extra dependency — no dangerouslySetInnerHTML.
// ─────────────────────────────────────────────────────────────

const now = () =>
  new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

// ── Lightweight, safe markdown → JSX ──────────────────────────
// Handles **bold**, `code`, bullet/numbered lists, and # headings.
function inline(text) {
  // split on **bold** and `code`, keep delimiters
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return parts.map((p, i) => {
    if (p.startsWith("**") && p.endsWith("**"))
      return <strong key={i}>{p.slice(2, -2)}</strong>;
    if (p.startsWith("`") && p.endsWith("`"))
      return (
        <code className="ac-code" key={i}>
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
      const item = t.replace(/^\s*(?:[-*]|\d+\.)\s+/, "");
      const kind = isUl ? "ul" : "ol";
      if (!list || list.type !== kind) {
        flush();
        list = { type: kind, items: [] };
      }
      list.items.push(item);
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
    <>
      {blocks.map((b, i) => {
        if (b.type === "h")
          return (
            <div className="ac-h" key={i}>
              {inline(b.text)}
            </div>
          );
        if (b.type === "p")
          return (
            <p className="ac-p" key={i}>
              {inline(b.text)}
            </p>
          );
        if (b.type === "ul")
          return (
            <ul className="ac-list" key={i}>
              {b.items.map((it, j) => (
                <li key={j}>{inline(it)}</li>
              ))}
            </ul>
          );
        return (
          <ol className="ac-list" key={i}>
            {b.items.map((it, j) => (
              <li key={j}>{inline(it)}</li>
            ))}
          </ol>
        );
      })}
    </>
  );
}

// ── Icons ─────────────────────────────────────────────────────
const Spark = ({ size = 18 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
  >
    <path d="M12 2l1.7 6.1c.2.7.5 1 1.2 1.2L21 11l-6.1 1.7c-.7.2-1 .5-1.2 1.2L12 20l-1.7-6.1c-.2-.7-.5-1-1.2-1.2L3 11l6.1-1.7c.7-.2 1-.5 1.2-1.2z" />
  </svg>
);
const SendIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M12 19V5" />
    <path d="m5 12 7-7 7 7" />
  </svg>
);
const CopyIcon = () => (
  <svg
    width="13"
    height="13"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <rect x="9" y="9" width="12" height="12" rx="2" />
    <path d="M5 15V5a2 2 0 0 1 2-2h10" />
  </svg>
);
const CheckIcon = () => (
  <svg
    width="13"
    height="13"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.4"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M20 6 9 17l-5-5" />
  </svg>
);

function Chat() {
  const { currentUser } = useAuth();
  const firstName = currentUser?.name?.split(" ")[0] || "there";

  const [messages, setMessages] = useState([
    {
      role: "arivo",
      text: `Hi ${firstName}! 👋 I'm Arivo, your UK career coach. I can help you find visa-sponsored jobs, prep for interviews, and navigate the UK job market. What would you like to know?`,
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [lastUserText, setLastUserText] = useState("");
  const [copiedIdx, setCopiedIdx] = useState(null);

  const bottomRef = useRef(null);
  const taRef = useRef(null);

  // Auto-scroll to newest
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Auto-grow textarea
  const grow = () => {
    const el = taRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 140) + "px";
  };
  useEffect(grow, [input]);

  const suggestions = [
    "Which companies sponsor Skilled Worker visas for ML engineers?",
    "How do I write a UK-style cover letter?",
    "What is the STAR method for interviews?",
    "What skills do I need for a data science role?",
  ];

  // ── Send / retry ────────────────────────────────────────────
  const send = async (textArg, isRetry = false) => {
    const text = (textArg ?? input).trim();
    if (!text || loading) return;

    if (isRetry) {
      setMessages((prev) => prev.filter((m) => !m.isError));
    } else {
      setMessages((prev) => [...prev, { role: "user", text, time: now() }]);
    }
    setLastUserText(text);
    setInput("");
    setLoading(true);

    try {
      const res = await axios.post("http://localhost:8000/chat", {
        message: text,
        session_id: currentUser?.id || "default",
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
          text: "I couldn't reach the AI service. Make sure it's running on port 8000, then try again.",
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
    } catch {
      /* clipboard blocked */
    }
  };

  const isWelcome = messages.length === 1 && !loading;

  return (
    <div className="ac">
      <style>{styles}</style>

      {/* ── Header ─────────────────────────────────────────── */}
      <header className="ac-head">
        <div className="ac-head-main">
          <div className="ac-avatar ac-avatar--head">
            <Spark size={16} />
          </div>
          <div>
            <h1 className="ac-title">Career Coach</h1>
            <div className="ac-status">
              <span className="ac-dot-live" /> Grounded in real UK job data
            </div>
          </div>
        </div>
      </header>

      {/* ── Conversation ───────────────────────────────────── */}
      <div className="ac-thread">
        {isWelcome ? (
          // Welcome state — fills the space, invites the first message
          <div className="ac-welcome">
            <div className="ac-avatar ac-avatar--xl">
              <Spark size={28} />
            </div>
            <div className="ac-welcome-title">How can I help, {firstName}?</div>
            <div className="ac-welcome-sub">
              Ask about visa sponsorship, interview prep, cover letters, or the
              UK job market.
            </div>
            <div className="ac-suggest ac-suggest--grid">
              {suggestions.map((s) => (
                <button key={s} className="ac-chip" onClick={() => send(s)}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg, i) => {
              const isArivo = msg.role === "arivo";
              return (
                <div
                  className={`ac-row ${isArivo ? "is-arivo" : "is-user"}`}
                  key={i}
                >
                  {isArivo && (
                    <div className="ac-avatar ac-avatar--msg">
                      <Spark size={14} />
                    </div>
                  )}
                  <div className="ac-col">
                    <div className="ac-meta">
                      <span className="ac-name">
                        {isArivo ? "Arivo AI" : firstName}
                      </span>
                      {msg.time && <span className="ac-time">{msg.time}</span>}
                    </div>
                    <div
                      className={`ac-bubble ${isArivo ? "is-arivo" : "is-user"} ${msg.isError ? "is-error" : ""}`}
                    >
                      {isArivo ? (
                        <RichText text={msg.text} />
                      ) : (
                        <span className="ac-usertext">{msg.text}</span>
                      )}
                      {msg.isError && (
                        <button
                          className="ac-retry"
                          onClick={() => send(lastUserText, true)}
                        >
                          Try again
                        </button>
                      )}
                    </div>
                    {isArivo && !msg.isError && (
                      <button
                        className="ac-copy"
                        onClick={() => copy(msg.text, i)}
                      >
                        {copiedIdx === i ? (
                          <>
                            <CheckIcon /> Copied
                          </>
                        ) : (
                          <>
                            <CopyIcon /> Copy
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Typing indicator */}
            {loading && (
              <div className="ac-row is-arivo">
                <div className="ac-avatar ac-avatar--msg">
                  <Spark size={14} />
                </div>
                <div className="ac-col">
                  <div className="ac-meta">
                    <span className="ac-name">Arivo AI</span>
                  </div>
                  <div className="ac-bubble is-arivo">
                    <span className="ac-typing">
                      <span className="ac-dot" />
                      <span className="ac-dot" />
                      <span className="ac-dot" />
                    </span>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
        <div ref={bottomRef} />
      </div>

      {/* ── Composer ───────────────────────────────────────── */}
      <div className="ac-composer">
        <textarea
          ref={taRef}
          rows={1}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Ask Arivo about jobs, visas, interviews…"
          aria-label="Message Arivo"
        />
        <button
          className="ac-send"
          onClick={() => send()}
          disabled={loading || !input.trim()}
          aria-label="Send message"
        >
          <SendIcon />
        </button>
      </div>
      <div className="ac-hint">
        Press Enter to send · Shift + Enter for a new line
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// SCOPED DESIGN SYSTEM
// ─────────────────────────────────────────────────────────────
const styles = `
.ac {
  --brand-1:#667eea; --brand-2:#764ba2;
  --surface:#15152a; --surface-2:#1b1b34;
  --bubble-arivo:#16213e; --bubble-user:#2a1d4a;
  --border:rgba(255,255,255,.07); --border-hi:rgba(102,126,234,.40);
  --text:#f0f0f6; --text-2:#9595aa; --text-3:#6a6a80;
 
  max-width:840px; margin:0 auto; padding:1.5rem;
  /* Adjust the offset to match your top bar / sidebar height */
  height:calc(100vh - 80px);
  display:flex; flex-direction:column;
  color:var(--text);
  font-family:ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;
}
.ac button:focus-visible, .ac textarea:focus-visible { outline:2px solid var(--brand-1); outline-offset:2px; }
 
/* Avatar */
.ac-avatar {
  display:flex; align-items:center; justify-content:center; flex-shrink:0;
  background:linear-gradient(135deg,var(--brand-1),var(--brand-2)); color:#fff;
  border-radius:50%; box-shadow:0 2px 10px rgba(102,126,234,.35);
}
.ac-avatar--head { width:34px; height:34px; }
.ac-avatar--msg { width:28px; height:28px; }
.ac-avatar--xl { width:60px; height:60px; border-radius:18px; margin-bottom:18px; }
 
/* Header */
.ac-head { margin-bottom:1rem; }
.ac-head-main { display:flex; align-items:center; gap:12px; }
.ac-title { margin:0; font-size:19px; font-weight:700; letter-spacing:-.02em; }
.ac-status { display:flex; align-items:center; gap:6px; font-size:12px; color:var(--text-2); margin-top:2px; }
.ac-dot-live { width:7px; height:7px; border-radius:50%; background:#38ef7d; box-shadow:0 0 8px #38ef7d99; }
 
/* Thread */
.ac-thread {
  flex:1; overflow-y:auto; display:flex; flex-direction:column; gap:18px;
  background:var(--surface); border:1px solid var(--border); border-radius:16px;
  padding:20px; margin-bottom:12px;
}
.ac-thread::-webkit-scrollbar { width:8px; }
.ac-thread::-webkit-scrollbar-thumb { background:rgba(255,255,255,.08); border-radius:8px; }
.ac-thread::-webkit-scrollbar-thumb:hover { background:rgba(255,255,255,.16); }
 
/* Welcome state */
.ac-welcome { margin:auto; max-width:560px; text-align:center; padding:24px 8px; }
.ac-welcome-title { font-size:22px; font-weight:700; letter-spacing:-.02em; margin-bottom:8px; }
.ac-welcome-sub { font-size:13.5px; color:var(--text-2); line-height:1.55; margin-bottom:24px; }
.ac-suggest--grid { display:grid; grid-template-columns:1fr 1fr; gap:10px; }
@media (max-width:560px){ .ac-suggest--grid { grid-template-columns:1fr; } }
 
/* Rows + bubbles */
.ac-row { display:flex; gap:10px; max-width:88%; }
.ac-row.is-arivo { align-self:flex-start; }
.ac-row.is-user { align-self:flex-end; flex-direction:row-reverse; }
.ac-col { display:flex; flex-direction:column; min-width:0; }
.ac-row.is-user .ac-col { align-items:flex-end; }
.ac-meta { display:flex; align-items:baseline; gap:8px; margin:0 4px 4px; }
.ac-name { font-size:11px; font-weight:600; color:var(--brand-1); }
.ac-row.is-user .ac-name { color:#a98bff; }
.ac-time { font-size:10px; color:var(--text-3); }
 
.ac-bubble {
  font-size:13.5px; line-height:1.65; padding:11px 15px; border-radius:14px;
  word-wrap:break-word; overflow-wrap:anywhere;
}
.ac-bubble.is-arivo {
  background:var(--bubble-arivo); border:1px solid rgba(102,126,234,.22);
  border-top-left-radius:4px; color:#dfe2ee;
}
.ac-bubble.is-user {
  background:linear-gradient(135deg,#2a1d4a,#3a2160); border:1px solid rgba(118,75,162,.35);
  border-top-right-radius:4px; color:#efe9fb;
}
.ac-bubble.is-error { background:rgba(244,99,99,.08); border-color:rgba(244,99,99,.35); color:#f3c0c0; }
.ac-usertext { white-space:pre-wrap; }
 
/* Rich text inside bubbles */
.ac-p { margin:0 0 8px; }
.ac-p:last-child { margin-bottom:0; }
.ac-h { font-weight:700; font-size:14px; margin:4px 0 6px; color:#fff; }
.ac-list { margin:4px 0 8px; padding-left:20px; }
.ac-list li { margin:3px 0; }
.ac-list:last-child { margin-bottom:0; }
.ac-code { background:rgba(255,255,255,.08); padding:1px 6px; border-radius:5px; font-size:12px; font-family:ui-monospace,Menlo,monospace; }
 
/* Copy + retry */
.ac-copy {
  display:inline-flex; align-items:center; gap:5px; margin:6px 0 0 4px; padding:3px 8px;
  background:transparent; border:none; color:var(--text-3); font-size:11px; cursor:pointer;
  border-radius:6px; opacity:0; transition:opacity .15s, color .15s, background .15s;
}
.ac-row:hover .ac-copy { opacity:1; }
.ac-copy:hover { color:var(--text); background:rgba(255,255,255,.06); }
.ac-retry {
  display:block; margin-top:10px; padding:6px 14px; border:none; border-radius:8px;
  background:linear-gradient(135deg,var(--brand-1),var(--brand-2)); color:#fff;
  font-size:12px; font-weight:600; cursor:pointer; transition:filter .18s;
}
.ac-retry:hover { filter:brightness(1.12); }
 
/* Typing dots */
.ac-typing { display:inline-flex; align-items:center; gap:5px; padding:2px 0; }
.ac-dot { width:6px; height:6px; border-radius:50%; background:var(--brand-1); animation:ac-bounce 1.2s infinite ease-in-out; }
.ac-dot:nth-child(2){ animation-delay:.16s; } .ac-dot:nth-child(3){ animation-delay:.32s; }
@keyframes ac-bounce { 0%,60%,100%{ transform:translateY(0); opacity:.45; } 30%{ transform:translateY(-4px); opacity:1; } }
 
/* Chips */
.ac-chip {
  padding:11px 14px; border-radius:12px; cursor:pointer; text-align:left;
  background:var(--surface-2); border:1px solid var(--border); color:var(--text-2);
  font-size:12.5px; line-height:1.4; transition:all .16s;
}
.ac-chip:hover { border-color:var(--border-hi); color:var(--text); background:#20203c; transform:translateY(-1px); }
 
/* Composer */
.ac-composer {
  display:flex; align-items:flex-end; gap:10px; background:var(--surface);
  border:1px solid var(--border); border-radius:16px; padding:8px 8px 8px 16px;
  transition:border-color .2s, box-shadow .2s, background .2s;
}
.ac-composer:focus-within { border-color:var(--brand-1); box-shadow:0 0 0 4px rgba(102,126,234,.15); background:#181834; }
.ac-composer textarea {
  flex:1; resize:none; border:none; outline:none; background:transparent; color:var(--text);
  font-size:14px; line-height:1.5; padding:8px 0; max-height:140px;
  font-family:inherit;
}
.ac-composer textarea::placeholder { color:#5a5a72; }
.ac-send {
  flex-shrink:0; width:40px; height:40px; border:none; border-radius:11px; cursor:pointer;
  display:flex; align-items:center; justify-content:center; color:#fff;
  background:linear-gradient(135deg,var(--brand-1),var(--brand-2));
  transition:filter .18s, transform .12s, opacity .18s;
}
.ac-send:hover:not(:disabled) { filter:brightness(1.14); }
.ac-send:active:not(:disabled) { transform:scale(.94); }
.ac-send:disabled { opacity:.4; cursor:not-allowed; }
.ac-hint { text-align:center; font-size:11px; color:var(--text-3); margin-top:8px; }
 
/* Quality floor */
@media (prefers-reduced-motion: reduce) { .ac * { animation:none !important; transition:none !important; } }
@media (max-width:560px) {
  .ac { padding:1rem; height:calc(100vh - 64px); }
  .ac-row { max-width:95%; }
}
`;

export default Chat;
