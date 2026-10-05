import { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import ThemeToggle from "../components/ThemeToggle";

// ─────────────────────────────────────────────────────────────
// PREMIUM AUTHENTICATION · Arivo AI (V2 Architecture)
// Features: Pre-Signup Sponsor Radar, Strict ESLint fixes,
// OAuth Bridges, and unified Profile alignment.
// ─────────────────────────────────────────────────────────────

const API = `${import.meta.env.VITE_API_URL}/api/auth`;
const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const pwStrength = (pw) => {
  let s = 0;
  if (pw.length >= 6) s++;
  if (pw.length >= 10) s++;
  if (/[0-9]/.test(pw) && /[a-zA-Z]/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  return Math.min(s, 3);
};

// ── V2 Icons ──────────────────────────────────────────────────
const Ic = {
  mail: () => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m22 7-10 6L2 7" />
    </svg>
  ),
  lock: () => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  ),
  user: () => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
  globe: () => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18" />
    </svg>
  ),
  cap: () => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 10 12 5 2 10l10 5 10-5z" />
      <path d="M6 12v5c0 1 2.7 2.5 6 2.5s6-1.5 6-2.5v-5" />
    </svg>
  ),
  target: () => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1" />
    </svg>
  ),
  eye: () => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ),
  eyeOff: () => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9.9 4.2A9.1 9.1 0 0 1 12 4c6.5 0 10 7 10 7a13 13 0 0 1-2.2 3M6.6 6.6A13 13 0 0 0 2 11s3.5 7 10 7a9 9 0 0 0 3.4-.6" />
      <path d="m4 4 16 16" />
    </svg>
  ),
  check: () => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  ),
  alert: () => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  ),
  google: () => (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  ),
  linkedin: () => (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="#0A66C2"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  ),
};

// ── Interactive Field Component ───────────────────────────────
function Field({
  icon,
  label,
  name,
  type = "text",
  value,
  onChange,
  valid,
  trailing,
  placeholder,
  extra,
  asSelect,
  options,
}) {
  return (
    <div className="input-group">
      <label className="input-label" htmlFor={`auth-${name}`}>{label}</label>
      <div className={`input-wrapper ${valid ? "is-valid" : ""}`}>
        <span className="input-icon">{icon()}</span>
        {asSelect ? (
          <select
            id={`auth-${name}`}
            className="input-element"
            name={name}
            value={value}
            onChange={onChange}
            {...(extra || {})}
          >
            <option value="" disabled>
              {placeholder}
            </option>
            {options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        ) : (
          <input
            id={`auth-${name}`}
            className="input-element"
            name={name}
            type={type}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            {...(extra || {})}
          />
        )}
        <span className="input-trailing">
          {valid && <span className="valid-check">{Ic.check()}</span>}
          {trailing}
        </span>
      </div>
    </div>
  );
}

export default function Login({ onLogin }) {
  const { login } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [capsOn, setCapsOn] = useState(false);

  const [remember, setRemember] = useState(true);

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });

  // 🛑 ESLINT FIX 1: Push Token Catcher state updates to the next tick to prevent cascading renders
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    const oauthError = params.get("error");

    if (token) {
      setTimeout(() => {
        login(null, token);
        window.history.replaceState(
          {},
          document.title,
          window.location.pathname,
        );
        onLogin();
      }, 0);
    }

    if (oauthError) {
      setTimeout(() => {
        setError("Social login failed. Please try again or use email.");
        window.history.replaceState(
          {},
          document.title,
          window.location.pathname,
        );
      }, 0);
    }
  }, [login, onLogin]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (error) setError("");
  };

  const switchMode = (register) => {
    setIsRegister(register);
    setError("");
  };

  const [forgot, setForgot] = useState(false);
  const [sentTo, setSentTo] = useState("");

  const sendReset = async (e) => {
    if (e) e.preventDefault();
    if (loading) return;
    if (!emailRe.test(form.email)) return setError("Enter the email you signed up with.");
    setLoading(true);
    setError("");
    try {
      await axios.post(`${API}/forgot-password`, { email: form.email });
      setSentTo(form.email);
    } catch (err) {
      setError(err.response?.data?.message || "Could not reach the server. Please try again.");
    }
    setLoading(false);
  };

  const leaveForgot = () => {
    setForgot(false);
    setSentTo("");
    setError("");
  };

  const onPwKey = (e) => {
    if (e.getModifierState) setCapsOn(e.getModifierState("CapsLock"));
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (loading) return;

    if (!emailRe.test(form.email))
      return setError("Enter a valid email address.");
    if (form.password.length < 8)
      return setError("Password must be at least 8 characters.");
    if (isRegister && !form.name.trim())
      return setError("Please enter your full name.");

    setLoading(true);
    setError("");

    try {
      const endpoint = isRegister ? `${API}/register` : `${API}/login`;
      const payload = isRegister
        ? { name: form.name, email: form.email, password: form.password, remember }
        : { email: form.email, password: form.password, remember };
      const response = await axios.post(endpoint, payload);
      login(response.data.user, response.data.token, remember);
      onLogin();
    } catch (err) {
      console.warn("Auth Error:", err);
      setError(
        err.response?.data?.message ||
          "Connection failed. Please verify the AI server is online.",
      );
    }
    setLoading(false);
  };

  const emailValid = !!form.email && emailRe.test(form.email);
  const pwValid = form.password.length >= 8;
  const strength = pwStrength(form.password);

  const pwToggle = (
    <button
      type="button"
      className="btn-icon"
      onClick={() => setShowPw((v) => !v)}
      aria-label="Toggle password visibility"
    >
      {showPw ? Ic.eyeOff() : Ic.eye()}
    </button>
  );

  return (
    <div className="auth-layout ivory">
      <style>{styles}</style>

      {/* ── LEFT PANEL: Brand & Proof ────────────────────────── */}
      <aside className="brand-panel">
        <div className="ambient-orb orb-1"></div>
        <div className="ambient-orb orb-2"></div>
        <div className="bg-grid-overlay"></div>

        <div className="brand-content fade-up">
          <div className="brand-logo">Arivo AI</div>
          <h1 className="brand-headline">
            Stop sending CVs into the{" "}
            <span className="text-gradient">void.</span>
          </h1>
          <p className="brand-sub">
            Find roles at employers on the Home Office sponsor register, and
            see how your CV compares with real job postings.
          </p>

          <div className="proof-widget glass-panel">
            <div className="proof-body">
              <div className="proof-item">
                <div className="proof-icon emerald">{Ic.check()}</div>
                <div>
                  <strong>Sponsor register checks</strong>
                  <span>Employers are matched against the Home Office list of licensed sponsors</span>
                </div>
              </div>
              <div className="proof-item">
                <div className="proof-icon violet">{Ic.cap()}</div>
                <div>
                  <strong>Skills from your own CV</strong>
                  <span>Compared with live job postings for the role you want</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* ── RIGHT PANEL: Form Container ──────────────────────── */}
      <main className="form-panel">
        <div className="auth-theme"><ThemeToggle /></div>
        <div className="form-container fade-up">
          <div className="mobile-brand">Arivo AI</div>

          <div className="form-header">
            <h2>{forgot ? "Reset your password" : isRegister ? "Create your account" : "Welcome back"}</h2>
            <p>
              {forgot
                ? "We'll email you a link to choose a new one."
                : isRegister
                  ? "Free to use. It takes about a minute."
                  : "Sign in to pick up where you left off."}
            </p>
          </div>

          {forgot && (
            <>
              {error && (
                <div className="error-banner animate-pop">
                  <span className="error-icon">{Ic.alert()}</span>
                  {error}
                </div>
              )}
              {sentTo ? (
                <div className="forgot-sent">
                  <p>
                    If an account exists for <strong>{sentTo}</strong>, a reset link is on its way. It works for 1
                    hour. Check your spam folder if you don't see it.
                  </p>
                  <button type="button" className="btn-submit" onClick={leaveForgot}>
                    Back to sign in
                  </button>
                </div>
              ) : (
                <form onSubmit={sendReset} noValidate className="auth-form">
                  <div className="fields-stack">
                    <Field
                      icon={Ic.mail}
                      label="Email Address"
                      name="email"
                      type="email"
                      value={form.email}
                      onChange={handleChange}
                      valid={emailValid}
                      placeholder="jane@example.com"
                      extra={{ inputMode: "email", autoCapitalize: "none", spellCheck: false }}
                    />
                  </div>
                  <button type="submit" className="btn-submit" disabled={loading}>
                    {loading ? "Sending..." : "Send reset link"}
                  </button>
                  <button type="button" className="forgot-link forgot-back" onClick={leaveForgot}>
                    Back to sign in
                  </button>
                </form>
              )}
            </>
          )}

          {!forgot && (<>
          <div className="tab-switcher">
            <div
              className={`tab-slider ${isRegister ? "right" : "left"}`}
            ></div>
            <button
              type="button"
              className={!isRegister ? "active" : ""}
              onClick={() => switchMode(false)}
            >
              Sign in
            </button>
            <button
              type="button"
              className={isRegister ? "active" : ""}
              onClick={() => switchMode(true)}
            >
              Create account
            </button>
          </div>

          {error && (
            <div className="error-banner animate-pop">
              <span className="error-icon">{Ic.alert()}</span>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="auth-form">
            <div className="fields-stack">
              {isRegister && (
                <Field
                  icon={Ic.user}
                  label="Full Name"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  valid={!!form.name.trim()}
                  placeholder="e.g. Jane Doe"
                />
              )}

              <Field
                icon={Ic.mail}
                label="Email Address"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                valid={emailValid}
                placeholder="jane@example.com"
                extra={{
                  inputMode: "email",
                  autoCapitalize: "none",
                  spellCheck: false,
                }}
              />

              <div className="password-group">
                <Field
                  icon={Ic.lock}
                  label="Password"
                  name="password"
                  type={showPw ? "text" : "password"}
                  value={form.password}
                  onChange={handleChange}
                  valid={pwValid && !isRegister}
                  trailing={pwToggle}
                  placeholder={
                    isRegister ? "Create a secure password" : "Your password"
                  }
                  extra={{ onKeyUp: onPwKey, onKeyDown: onPwKey }}
                />

                {capsOn && (
                  <div className="caps-warning">
                    {Ic.alert()} Caps Lock is on
                  </div>
                )}

                {isRegister && form.password && (
                  <div className="strength-meter animate-fade">
                    <div className="strength-bars">
                      {[0, 1, 2].map((i) => (
                        <div
                          key={i}
                          className={`s-bar ${i < strength ? `active-s${strength}` : ""}`}
                        />
                      ))}
                    </div>
                    <span className={`s-label s${strength}`}>
                      {strength <= 1
                        ? "Weak"
                        : strength === 2
                          ? "Good"
                          : "Strong"}
                    </span>
                  </div>
                )}
              </div>

              <div className="remember-line">
                <label className="remember-row">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                  />
                  <span>Keep me signed in on this device</span>
                </label>
                {!isRegister && (
                  <button
                    type="button"
                    className="forgot-link"
                    onClick={() => {
                      setForgot(true);
                      setError("");
                    }}
                  >
                    Forgot password?
                  </button>
                )}
              </div>

              {isRegister && (
                <p className="privacy-note animate-fade">
                  {Ic.lock()} We only use your details to personalise Arivo. You can
                  delete your account and data any time from your profile.
                </p>
              )}
            </div>

            <button type="submit" className="btn-submit" disabled={loading}>
              {loading ? (
                <span className="btn-loading">
                  <span className="spinner" />{" "}
                  {isRegister ? "Creating..." : "Authenticating..."}
                </span>
              ) : isRegister ? (
                "Create Account →"
              ) : (
                "Sign In →"
              )}
            </button>
          </form>
          </>)}
        </div>
      </main>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// PURE CSS MAGIC (MOBILE OPTIMIZED)
// ─────────────────────────────────────────────────────────────
const styles = `
.auth-layout { display: grid; grid-template-columns: 1.05fr 0.95fr; min-height: 100vh; }
@keyframes spin { to { transform: rotate(360deg); } }
.fade-up, .animate-pop, .animate-fade { animation: authFade 240ms var(--ease) both; }
@keyframes authFade { from { opacity: 0; } to { opacity: 1; } }

/* Brand panel */
.brand-panel { display: flex; flex-direction: column; justify-content: center; padding: 4rem; background: var(--c-brand); color: #f5f1e8; }
.brand-content { max-width: 500px; margin: 0 auto; width: 100%; }
.brand-logo { font-family: var(--font-display); font-size: 2rem; letter-spacing: -0.01em; margin-bottom: 4rem; }
.brand-headline { font-family: var(--font-display); font-weight: 400; font-size: clamp(2.6rem, 4.4vw, 3.9rem); line-height: 1.04; letter-spacing: -0.02em; margin: 0 0 1.5rem; }
.text-gradient { font-style: italic; color: #dcc78f; }
.brand-sub { font-size: 1.05rem; line-height: 1.65; color: rgba(245, 241, 232, 0.72); margin: 0 0 3rem; max-width: 440px; }
.proof-widget { border-top: 1px solid rgba(245, 241, 232, 0.18); }
.proof-body { display: flex; flex-direction: column; }
.proof-item { display: flex; align-items: flex-start; gap: 16px; padding: 18px 0; border-bottom: 1px solid rgba(245, 241, 232, 0.18); }
.proof-icon { width: 30px; height: 30px; border-radius: 50%; border: 1px solid rgba(220, 199, 143, 0.55); color: #dcc78f; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.proof-icon svg { width: 14px; height: 14px; }
.proof-item strong { display: block; font-size: 0.95rem; font-weight: 600; margin-bottom: 3px; }
.proof-item span { display: block; font-size: 0.85rem; line-height: 1.5; color: rgba(245, 241, 232, 0.68); }

/* Form panel */
.form-panel { display: flex; align-items: center; justify-content: center; padding: 2rem; overflow-y: auto; }
.form-container { width: 100%; max-width: 420px; }
.mobile-brand { display: none; font-family: var(--font-display); font-size: 1.9rem; margin-bottom: 2rem; text-align: center; }
.form-header { margin-bottom: 1.75rem; }
.form-header h2 { font-family: var(--font-display); font-weight: 400; font-size: 2.3rem; letter-spacing: -0.015em; margin: 0 0 8px; line-height: 1.1; }
.form-header p { color: var(--c-ink-2); font-size: 0.95rem; margin: 0; }
.tab-switcher { position: relative; display: flex; border-bottom: 1px solid var(--c-line); margin-bottom: 28px; }
.tab-slider { position: absolute; bottom: -1px; left: 0; width: 50%; height: 2px; background: var(--c-green); transition: transform 220ms var(--ease); }
.tab-slider.left { transform: translateX(0); }
.tab-slider.right { transform: translateX(100%); }
.tab-switcher button { flex: 1; background: transparent; border: none; padding: 12px; color: var(--c-ink-3); font: 600 0.92rem var(--font-body); cursor: pointer; transition: color var(--t) var(--ease); }
.tab-switcher button.active { color: var(--c-ink); }

.error-banner { display: flex; align-items: center; gap: 10px; background: var(--c-danger-soft); border: 1px solid var(--c-danger-line); color: var(--c-danger); padding: 11px 14px; border-radius: var(--radius); font-size: 0.9rem; margin-bottom: 20px; }
.error-icon svg { width: 17px; height: 17px; }

.fields-stack { display: flex; flex-direction: column; gap: 16px; margin-bottom: 24px; }
.input-group { display: flex; flex-direction: column; gap: 6px; }
.input-label { font-size: 0.8rem; font-weight: 600; color: var(--c-ink-2); }
.input-wrapper { display: flex; align-items: center; gap: 10px; background: var(--c-surface); border: 1px solid var(--c-line-2); border-radius: var(--radius); padding: 0 14px; transition: border-color var(--t) var(--ease), box-shadow var(--t) var(--ease); }
.input-wrapper:focus-within { border-color: var(--c-green); box-shadow: 0 0 0 3px var(--c-green-soft); }
.input-icon svg { width: 16px; height: 16px; color: var(--c-ink-3); display: block; }
.input-wrapper:focus-within .input-icon svg { color: var(--c-green); }
.input-element { flex: 1; min-width: 0; background: transparent; border: none; outline: none; color: var(--c-ink); font: 400 0.97rem var(--font-body); padding: 13px 0; }
.input-element::placeholder { color: var(--c-placeholder); }
.input-trailing { display: flex; align-items: center; gap: 8px; }
.valid-check svg { width: 16px; height: 16px; color: var(--c-ok); }
.btn-icon { background: none; border: none; color: var(--c-ink-3); cursor: pointer; display: flex; align-items: center; padding: 4px; transition: color var(--t) var(--ease); }
.btn-icon:hover { color: var(--c-ink); }
.btn-icon svg { width: 16px; height: 16px; }
.caps-warning { display: flex; align-items: center; gap: 6px; font-size: 0.78rem; color: var(--c-warn); margin-top: 4px; }
.caps-warning svg { width: 14px; height: 14px; }
.strength-meter { display: flex; align-items: center; gap: 12px; margin-top: 8px; }
.strength-bars { display: flex; gap: 6px; flex: 1; }
.s-bar { flex: 1; height: 3px; border-radius: 99px; background: var(--c-line); transition: background var(--t) var(--ease); }
.active-s1 { background: var(--c-danger); }
.active-s2 { background: var(--c-warn); }
.active-s3 { background: var(--c-ok); }
.s-label { font-size: 0.72rem; font-weight: 600; letter-spacing: 0.05em; text-transform: uppercase; min-width: 48px; text-align: right; }
.s-label.s0, .s-label.s1 { color: var(--c-danger); } .s-label.s2 { color: var(--c-warn); } .s-label.s3 { color: var(--c-ok); }
.remember-row { display: flex; align-items: center; gap: 10px; font-size: 0.87rem; color: var(--c-ink-2); cursor: pointer; margin-top: 2px; }
.remember-row input { width: 16px; height: 16px; accent-color: var(--c-green); cursor: pointer; }
.privacy-note { display: flex; align-items: flex-start; gap: 8px; font-size: 0.78rem; line-height: 1.5; color: var(--c-ink-3); margin: 0; }
.privacy-note svg { width: 13px; height: 13px; flex-shrink: 0; margin-top: 2px; }
.btn-submit { width: 100%; padding: 14px; border: none; border-radius: var(--radius); background: var(--c-green); color: var(--c-on-green); font: 600 0.98rem var(--font-body); cursor: pointer; transition: background var(--t) var(--ease); }
.btn-submit:hover:not(:disabled) { background: var(--c-green-2); }
.btn-submit:disabled { opacity: 0.6; cursor: not-allowed; }
.btn-loading { display: flex; align-items: center; justify-content: center; gap: 10px; }
.spinner { width: 16px; height: 16px; border: 2px solid rgba(var(--c-ink-rgb), 0.25); border-top-color: var(--c-on-green); border-radius: 50%; animation: spin 0.8s linear infinite; }

@media (max-width: 960px) { .auth-layout { grid-template-columns: 1fr; } .brand-panel { display: none; } .mobile-brand { display: block; } .form-panel { align-items: flex-start; padding: 2rem 1.25rem; } }
.form-panel { position: relative; }
.auth-theme { position: absolute; top: 20px; right: 20px; }
.remember-line { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
.forgot-link { background: none; border: none; padding: 0; color: var(--c-green); font: 600 0.87rem var(--font-body); cursor: pointer; text-decoration: underline; text-underline-offset: 3px; }
.forgot-back { display: block; margin: 16px auto 0; color: var(--c-ink-2); font-weight: 500; }
.forgot-sent p { color: var(--c-ink-2); font-size: 0.95rem; line-height: 1.6; margin: 0 0 22px; }
`;
