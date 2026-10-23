import { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

const API = `${import.meta.env.VITE_API_URL}/api/feedback`;

const KINDS = [
  { id: "problem", label: "Something's broken" },
  { id: "confusing", label: "Something's confusing" },
  { id: "idea", label: "An idea" },
  { id: "praise", label: "Something worked well" },
];

// A short form that sends a note straight to the person who built the app.
export default function FeedbackModal({ page, onClose }) {
  const { token } = useAuth();
  const [kind, setKind] = useState("");
  const [message, setMessage] = useState("");
  const [rating, setRating] = useState(null);
  const [canContact, setCanContact] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const submit = async (e) => {
    e.preventDefault();
    if (busy) return;
    if (!kind) return setError("Choose what kind of note this is.");
    if (message.trim().length < 5) return setError("Please write a little more so I can act on it.");
    setBusy(true);
    setError("");
    try {
      await axios.post(API, { kind, message, rating, page, canContact }, { headers: { Authorization: `Bearer ${token}` }, timeout: 70000 });
      setSent(true);
    } catch (err) {
      setError(err.response?.data?.message || "Couldn't send that just now. Please try again in a minute.");
    }
    setBusy(false);
  };

  return (
    <div className="fb-overlay" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <style>{CSS}</style>
      <div className="fb-card iv-card" role="dialog" aria-modal="true" aria-labelledby="fb-title">
        <button className="fb-x" onClick={onClose} aria-label="Close">×</button>

        {sent ? (
          <div className="fb-done">
            <h2 id="fb-title" className="iv-display">Thank you</h2>
            <p>I read every note, and it directly decides what I fix next.</p>
            <button className="iv-btn iv-btn--primary" onClick={onClose}>Close</button>
          </div>
        ) : (
          <form onSubmit={submit} noValidate>
            <h2 id="fb-title" className="iv-display">Tell me what you think</h2>
            <p className="fb-sub">Arivo is built by one student and you're one of the first to use it. Honest is better than polite.</p>

            <div className="fb-kinds" role="group" aria-label="Kind of note">
              {KINDS.map((k) => (
                <button type="button" key={k.id} className={`iv-chip ${kind === k.id ? "is-on" : ""}`} onClick={() => setKind(k.id)} aria-pressed={kind === k.id}>
                  {k.label}
                </button>
              ))}
            </div>

            <label className="fb-label" htmlFor="fb-msg">What happened, or what would help?</label>
            <textarea id="fb-msg" className="iv-input fb-msg" rows={5} maxLength={2000} value={message} onChange={(e) => { setMessage(e.target.value); if (error) setError(""); }} autoFocus />

            <div className="fb-label" id="fb-rate">How useful has Arivo been so far? <span className="fb-opt">(optional)</span></div>
            <div className="fb-rate" role="group" aria-labelledby="fb-rate">
              {[1, 2, 3, 4, 5].map((n) => (
                <button type="button" key={n} className={`fb-star ${rating === n ? "is-on" : ""}`} onClick={() => setRating(rating === n ? null : n)} aria-pressed={rating === n} aria-label={`${n} out of 5`}>{n}</button>
              ))}
              <span className="fb-scale">1 = not at all, 5 = very</span>
            </div>

            <label className="fb-check">
              <input type="checkbox" checked={canContact} onChange={(e) => setCanContact(e.target.checked)} />
              <span>You can email me about this note</span>
            </label>
            <p className="fb-priv">Your note is stored with your account and deleted if you delete it. Your email is only shared with me if you tick the box.</p>

            {error && <p className="fb-error" role="alert">{error}</p>}
            <div className="fb-actions">
              <button type="submit" className="iv-btn iv-btn--primary" disabled={busy}>{busy ? "Sending…" : "Send"}</button>
              <button type="button" className="iv-btn iv-btn--ghost" onClick={onClose}>Cancel</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

const CSS = `
.fb-overlay { position: fixed; inset: 0; z-index: 1000; background: rgba(var(--c-ink-rgb), 0.45); display: grid; place-items: center; padding: 16px; overflow-y: auto; }
.fb-card { position: relative; width: 100%; max-width: 520px; padding: clamp(20px, 4vw, 32px); max-height: 100%; overflow-y: auto; }
.fb-x { position: absolute; top: 10px; right: 14px; background: none; border: none; font-size: 1.6rem; line-height: 1; color: var(--c-ink-3); cursor: pointer; }
.fb-x:hover { color: var(--c-ink); }
.fb-card h2 { font-size: 1.7rem; font-weight: 400; margin: 0 0 8px; }
.fb-sub { color: var(--c-ink-2); font-size: 0.9rem; line-height: 1.6; margin: 0 0 18px; }
.fb-kinds { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 18px; }
.fb-label { display: block; font-size: 0.82rem; font-weight: 600; color: var(--c-ink-2); margin: 0 0 6px; }
.fb-opt { font-weight: 400; color: var(--c-ink-3); }
.fb-msg { width: 100%; resize: vertical; font: inherit; margin-bottom: 16px; }
.fb-rate { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-bottom: 16px; }
.fb-star { width: 38px; height: 38px; border-radius: 50%; border: 1px solid var(--c-line); background: var(--c-surface); color: var(--c-ink); font: 600 0.9rem var(--font-body); cursor: pointer; }
.fb-star:hover { border-color: var(--c-green); }
.fb-star.is-on { background: var(--c-green); border-color: var(--c-green); color: var(--c-on-green); }
.fb-scale { font-size: 0.76rem; color: var(--c-ink-3); margin-left: 4px; }
.fb-check { display: flex; align-items: center; gap: 9px; font-size: 0.9rem; color: var(--c-ink); cursor: pointer; margin-bottom: 6px; }
.fb-priv { font-size: 0.76rem; line-height: 1.5; color: var(--c-ink-3); margin: 0 0 14px; }
.fb-error { color: var(--c-danger); font-size: 0.88rem; margin: 0 0 12px; }
.fb-actions { display: flex; gap: 10px; }
.fb-done p { color: var(--c-ink-2); line-height: 1.6; margin: 0 0 18px; }
`;
