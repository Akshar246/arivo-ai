import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import ThemeToggle from "../components/ThemeToggle";

const API = `${import.meta.env.VITE_API_URL}/api/auth`;

const clearLink = () => {
  try {
    window.history.replaceState({}, document.title, window.location.pathname);
  } catch {
    /* ignore */
  }
};

const errorText = (err, fallback) =>
  err.response?.data?.message || (err.response ? fallback : "Can't reach the server. Check your connection and try again.");

export default function EmailLink({ link, onDone }) {
  const { currentUser, updateUser } = useAuth();
  const [status, setStatus] = useState(link.kind === "verify" ? "working" : "form"); // working | form | done | error
  const [message, setMessage] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [busy, setBusy] = useState(false);
  const started = useRef(false);

  // Verification happens as soon as the page opens. The ref stops React's
  // dev double-run from spending the one-time link twice.
  useEffect(() => {
    if (link.kind !== "verify" || started.current) return;
    started.current = true;
    axios
      .post(`${API}/verify-email`, { token: link.token })
      .then(() => {
        if (currentUser) updateUser({ emailVerified: true });
        setStatus("done");
      })
      .catch((err) => {
        setMessage(errorText(err, "This confirmation link is invalid, expired or already used."));
        setStatus("error");
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const finish = () => {
    clearLink();
    onDone();
  };

  const submitReset = async (e) => {
    e.preventDefault();
    if (busy) return;
    if (password.length < 8) return setMessage("Password must be at least 8 characters.");
    setBusy(true);
    setMessage("");
    try {
      await axios.post(`${API}/reset-password`, { token: link.token, password });
      setStatus("done");
    } catch (err) {
      setMessage(errorText(err, "Could not reset your password."));
    }
    setBusy(false);
  };

  const isReset = link.kind === "reset";

  return (
    <div className="ivory el-page">
      <style>{CSS}</style>
      <div className="el-theme"><ThemeToggle /></div>
      <div className="el-card iv-card">
        <p className="el-brand iv-display">Arivo AI</p>

        {status === "working" && (
          <>
            <h1 className="iv-display">Confirming your email…</h1>
            <p className="el-text">One moment.</p>
          </>
        )}

        {status === "form" && isReset && (
          <form onSubmit={submitReset} noValidate>
            <h1 className="iv-display">Choose a new password</h1>
            <p className="el-text">Use at least 8 characters. Any device you're signed in on will be signed out.</p>
            {message && <p className="el-error" role="alert">{message}</p>}
            <label className="el-label" htmlFor="el-pw">New password</label>
            <div className="el-pw">
              <input
                id="el-pw"
                className="iv-input"
                type={showPw ? "text" : "password"}
                autoComplete="new-password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (message) setMessage("");
                }}
                autoFocus
              />
              <button type="button" className="el-show" onClick={() => setShowPw((v) => !v)}>
                {showPw ? "Hide" : "Show"}
              </button>
            </div>
            <button className="iv-btn iv-btn--primary el-full" type="submit" disabled={busy}>
              {busy ? "Saving…" : "Save new password"}
            </button>
          </form>
        )}

        {status === "done" && (
          <>
            <h1 className="iv-display">{isReset ? "Password updated" : "Email confirmed"}</h1>
            <p className="el-text">
              {isReset ? "You can log in with your new password now." : "Thanks. We can reach you if you ever lose access."}
            </p>
            <button className="iv-btn iv-btn--primary el-full" onClick={finish}>
              {isReset ? "Go to log in" : "Continue"}
            </button>
          </>
        )}

        {status === "error" && (
          <>
            <h1 className="iv-display">That link didn't work</h1>
            <p className="el-text">{message}</p>
            <button className="iv-btn iv-btn--primary el-full" onClick={finish}>
              {currentUser ? "Continue" : "Go to log in"}
            </button>
          </>
        )}

        {status === "form" && isReset && (
          <button className="el-link" onClick={finish}>Back to log in</button>
        )}
      </div>
    </div>
  );
}

const CSS = `
.el-page { min-height: 100vh; display: grid; place-items: center; padding: 24px 16px; position: relative; background: var(--c-bg); }
.el-theme { position: absolute; top: 20px; right: 20px; }
.el-card { width: 100%; max-width: 440px; padding: clamp(24px, 5vw, 40px); }
.el-brand { font-size: 1.5rem; margin: 0 0 28px; }
.el-card h1 { font-size: 1.9rem; font-weight: 400; margin: 0 0 12px; }
.el-text { color: var(--c-ink-2); font-size: 0.95rem; line-height: 1.6; margin: 0 0 22px; }
.el-error { color: var(--c-danger); background: var(--c-danger-soft); border: 1px solid var(--c-danger-line); border-radius: var(--radius); padding: 10px 13px; font-size: 0.9rem; margin: 0 0 16px; }
.el-label { display: block; font-size: 0.8rem; font-weight: 600; color: var(--c-ink-2); margin: 0 0 6px; }
.el-pw { position: relative; margin-bottom: 18px; }
.el-pw .iv-input { padding-right: 64px; }
.el-show { position: absolute; right: 10px; top: 50%; transform: translateY(-50%); background: none; border: none; color: var(--c-ink-2); font: 600 0.82rem var(--font-body); cursor: pointer; }
.el-full { width: 100%; }
.el-link { display: block; margin: 18px auto 0; background: none; border: none; color: var(--c-ink-2); font: 500 0.88rem var(--font-body); cursor: pointer; text-decoration: underline; text-underline-offset: 3px; }
`;
