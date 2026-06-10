import { useState } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

// ─────────────────────────────────────────────────────────────
// LOGIN / REGISTER  ·  Arivo AI
// Split layout: brand showcase (left) + focused form (right).
//
// Auth contract is UNCHANGED:
//   register → POST http://localhost:5001/api/auth/register  (full form)
//   login    → POST http://localhost:5001/api/auth/login     ({email,password})
//   on success → useAuth().login(user, token) then onLogin()
//   fields → name, email, password, nationality, university, course, targetRole
// ─────────────────────────────────────────────────────────────

const API = "http://localhost:5001/api/auth";
const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ── Icons ─────────────────────────────────────────────────────
const Ic = {
  mail: (s = 16) => (
    <svg
      viewBox="0 0 24 24"
      width={s}
      height={s}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m22 7-10 6L2 7" />
    </svg>
  ),
  lock: (s = 16) => (
    <svg
      viewBox="0 0 24 24"
      width={s}
      height={s}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  ),
  user: (s = 16) => (
    <svg
      viewBox="0 0 24 24"
      width={s}
      height={s}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
  globe: (s = 16) => (
    <svg
      viewBox="0 0 24 24"
      width={s}
      height={s}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18" />
    </svg>
  ),
  cap: (s = 16) => (
    <svg
      viewBox="0 0 24 24"
      width={s}
      height={s}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M22 10 12 5 2 10l10 5 10-5z" />
      <path d="M6 12v5c0 1 2.7 2.5 6 2.5s6-1.5 6-2.5v-5" />
    </svg>
  ),
  book: (s = 16) => (
    <svg
      viewBox="0 0 24 24"
      width={s}
      height={s}
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
  target: (s = 16) => (
    <svg
      viewBox="0 0 24 24"
      width={s}
      height={s}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1" />
    </svg>
  ),
  eye: (s = 16) => (
    <svg
      viewBox="0 0 24 24"
      width={s}
      height={s}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ),
  eyeOff: (s = 16) => (
    <svg
      viewBox="0 0 24 24"
      width={s}
      height={s}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M9.9 4.2A9.1 9.1 0 0 1 12 4c6.5 0 10 7 10 7a13 13 0 0 1-2.2 3M6.6 6.6A13 13 0 0 0 2 11s3.5 7 10 7a9 9 0 0 0 3.4-.6" />
      <path d="m4 4 16 16" />
    </svg>
  ),
  shield: (s = 14) => (
    <svg
      viewBox="0 0 24 24"
      width={s}
      height={s}
      fill="none"
      stroke="currentColor"
      strokeWidth="2.1"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 2 4 5v6c0 5 3.4 8.4 8 11 4.6-2.6 8-6 8-11V5z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  ),
  spark: (s = 14) => (
    <svg
      viewBox="0 0 24 24"
      width={s}
      height={s}
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M12 2l1.7 6.1c.2.7.5 1 1.2 1.2L21 11l-6.1 1.7c-.7.2-1 .5-1.2 1.2L12 20l-1.7-6.1c-.2-.7-.5-1-1.2-1.2L3 11l6.1-1.7c.7-.2 1-.5 1.2-1.2z" />
    </svg>
  ),
  free: (s = 14) => (
    <svg
      viewBox="0 0 24 24"
      width={s}
      height={s}
      fill="none"
      stroke="currentColor"
      strokeWidth="2.1"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M8 12h8M12 8v8" />
    </svg>
  ),
};

// ── Field with icon + label + focus glow ──────────────────────
function Field({
  icon,
  label,
  name,
  type = "text",
  value,
  onChange,
  onEnter,
  trailing,
  placeholder,
  autoComplete,
}) {
  return (
    <label className="au-field">
      <span className="au-label">{label}</span>
      <span className="au-input-wrap">
        <span className="au-input-ic">{icon}</span>
        <input
          className="au-input"
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          onKeyDown={(e) => e.key === "Enter" && onEnter?.()}
          placeholder={placeholder}
          autoComplete={autoComplete}
        />
        {trailing}
      </span>
    </label>
  );
}

function Login({ onLogin }) {
  const { login } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPw, setShowPw] = useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    nationality: "",
    university: "",
    course: "",
    targetRole: "",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (error) setError("");
  };

  const switchMode = (register) => {
    setIsRegister(register);
    setError("");
  };

  // ── Submit — same contract as before ────────────────────────
  const handleSubmit = async () => {
    if (loading) return;

    // Light client-side validation (server still validates)
    if (!emailRe.test(form.email)) {
      setError("Enter a valid email address.");
      return;
    }
    if (form.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (isRegister && !form.name.trim()) {
      setError("Please enter your full name.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const endpoint = isRegister ? `${API}/register` : `${API}/login`;
      const payload = isRegister
        ? form
        : { email: form.email, password: form.password };
      const response = await axios.post(endpoint, payload);
      login(response.data.user, response.data.token);
      onLogin();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Something went wrong. Is the server running?",
      );
    }
    setLoading(false);
  };

  const pwToggle = (
    <button
      type="button"
      className="au-eye"
      onClick={() => setShowPw((v) => !v)}
      aria-label={showPw ? "Hide password" : "Show password"}
    >
      {showPw ? Ic.eyeOff(16) : Ic.eye(16)}
    </button>
  );

  return (
    <div className="au">
      <style>{styles}</style>

      {/* ── Brand panel (left) ───────────────────────────── */}
      <aside className="au-brand">
        <div className="au-mesh" aria-hidden="true">
          <span className="au-blob au-blob-1" />
          <span className="au-blob au-blob-2" />
          <span className="au-blob au-blob-3" />
        </div>
        <div className="au-brand-inner">
          <div className="au-logo">{Ic.spark(18)} Arivo AI</div>
          <h1 className="au-pitch">
            The UK job market is brutal for international students.
          </h1>
          <p className="au-pitch-sub">
            Arivo finds the visa-sponsored roles, reads your CV, and shows
            exactly what you're missing — across every field, free.
          </p>
          <ul className="au-trust">
            <li>
              {Ic.shield(15)} Sponsors verified against the official Home Office
              register
            </li>
            <li>{Ic.spark(14)} Real London listings, not generic advice</li>
            <li>{Ic.free(15)} Free, forever — built for students</li>
          </ul>
        </div>
      </aside>

      {/* ── Form panel (right) ───────────────────────────── */}
      <main className="au-panel">
        <div className="au-form">
          <div className="au-logo au-logo--mobile">{Ic.spark(16)} Arivo AI</div>

          <div className="au-head">
            <h2 className="au-title">
              {isRegister ? "Create your account" : "Welcome back"}
            </h2>
            <p className="au-subtitle">
              {isRegister
                ? "Start your UK job search in minutes."
                : "Sign in to pick up where you left off."}
            </p>
          </div>

          {/* Mode toggle */}
          <div className="au-tabs" role="group" aria-label="Choose mode">
            <button
              className={!isRegister ? "is-active" : ""}
              onClick={() => switchMode(false)}
            >
              Sign in
            </button>
            <button
              className={isRegister ? "is-active" : ""}
              onClick={() => switchMode(true)}
            >
              Create account
            </button>
          </div>

          {/* Error */}
          {error && <div className="au-error">{error}</div>}

          {/* Fields */}
          <div className="au-fields">
            {isRegister && (
              <Field
                icon={Ic.user(16)}
                label="Full name"
                name="name"
                value={form.name}
                onChange={handleChange}
                onEnter={handleSubmit}
                placeholder="Akshar Chanchlani"
                autoComplete="name"
              />
            )}

            <Field
              icon={Ic.mail(16)}
              label="Email"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              onEnter={handleSubmit}
              placeholder="you@email.com"
              autoComplete="email"
            />

            <Field
              icon={Ic.lock(16)}
              label="Password"
              name="password"
              type={showPw ? "text" : "password"}
              value={form.password}
              onChange={handleChange}
              onEnter={handleSubmit}
              trailing={pwToggle}
              placeholder={isRegister ? "Create a password" : "Your password"}
              autoComplete={isRegister ? "new-password" : "current-password"}
            />

            {isRegister && (
              <>
                <Field
                  icon={Ic.globe(16)}
                  label="Nationality"
                  name="nationality"
                  value={form.nationality}
                  onChange={handleChange}
                  onEnter={handleSubmit}
                  placeholder="e.g. Indian"
                />
                <Field
                  icon={Ic.cap(16)}
                  label="University"
                  name="university"
                  value={form.university}
                  onChange={handleChange}
                  onEnter={handleSubmit}
                  placeholder="e.g. Brunel University London"
                />
                <div className="au-grid-2">
                  <Field
                    icon={Ic.book(16)}
                    label="Course"
                    name="course"
                    value={form.course}
                    onChange={handleChange}
                    onEnter={handleSubmit}
                    placeholder="e.g. MSc AI"
                  />
                  <Field
                    icon={Ic.target(16)}
                    label="Target role"
                    name="targetRole"
                    value={form.targetRole}
                    onChange={handleChange}
                    onEnter={handleSubmit}
                    placeholder="e.g. ML Engineer"
                  />
                </div>
              </>
            )}
          </div>

          <button
            className="au-submit"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <span className="au-btn-loading">
                <span className="au-spinner" />{" "}
                {isRegister ? "Creating account…" : "Signing in…"}
              </span>
            ) : isRegister ? (
              "Create account"
            ) : (
              "Sign in"
            )}
          </button>

          <div className="au-switch">
            {isRegister ? (
              <>
                Already have an account?{" "}
                <button onClick={() => switchMode(false)}>Sign in</button>
              </>
            ) : (
              <>
                New to Arivo?{" "}
                <button onClick={() => switchMode(true)}>
                  Create an account
                </button>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
const styles = `
.au {
  --brand-1:#667eea; --brand-2:#764ba2;
  --verify-1:#11998e; --verify-2:#38ef7d;
  --bg:#0d0d18; --surface:#15152a; --inset:#0f0f1e;
  --border:rgba(255,255,255,.08); --border-hi:rgba(102,126,234,.45);
  --text:#f2f2f8; --text-2:#9a9ab0; --text-3:#6a6a80;
 
  display:grid; grid-template-columns:1.05fr 1fr; min-height:100vh; background:var(--bg);
  color:var(--text); font-family:ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;
}
.au button:focus-visible, .au input:focus-visible { outline:2px solid var(--brand-1); outline-offset:2px; }
 
/* ── Brand panel ── */
.au-brand { position:relative; overflow:hidden; display:flex; align-items:center; padding:3rem;
  background:linear-gradient(150deg,#16162e 0%,#120f24 60%,#0e0c1e 100%); border-right:1px solid var(--border); }
.au-mesh { position:absolute; inset:0; filter:blur(60px); opacity:.55; }
.au-blob { position:absolute; width:340px; height:340px; border-radius:50%; }
.au-blob-1 { background:#667eea; top:-60px; left:-40px; animation:au-drift1 14s ease-in-out infinite; }
.au-blob-2 { background:#764ba2; bottom:-80px; right:-30px; animation:au-drift2 16s ease-in-out infinite; }
.au-blob-3 { background:#11998e; top:40%; left:30%; width:240px; height:240px; opacity:.5; animation:au-drift3 12s ease-in-out infinite; }
@keyframes au-drift1 { 0%,100%{transform:translate(0,0)} 50%{transform:translate(40px,30px)} }
@keyframes au-drift2 { 0%,100%{transform:translate(0,0)} 50%{transform:translate(-30px,-40px)} }
@keyframes au-drift3 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(20px,-20px) scale(1.1)} }
 
.au-brand-inner { position:relative; max-width:440px; }
.au-logo { display:inline-flex; align-items:center; gap:8px; font-size:20px; font-weight:800; letter-spacing:-.02em;
  background:linear-gradient(135deg,#fff,#c9c6ff); -webkit-background-clip:text; background-clip:text; -webkit-text-fill-color:transparent; margin-bottom:2.5rem; }
.au-logo svg { color:var(--brand-1); -webkit-text-fill-color:initial; }
.au-pitch { font-size:30px; line-height:1.15; font-weight:700; letter-spacing:-.03em; margin:0 0 16px; }
.au-pitch-sub { font-size:14.5px; line-height:1.6; color:var(--text-2); margin:0 0 32px; }
.au-trust { list-style:none; margin:0; padding:0; display:flex; flex-direction:column; gap:14px; }
.au-trust li { display:flex; align-items:center; gap:11px; font-size:13.5px; color:#c8c8da; }
.au-trust li svg { color:var(--verify-2); flex-shrink:0; }
 
/* ── Form panel ── */
.au-panel { display:flex; align-items:center; justify-content:center; padding:2.5rem 1.5rem; }
.au-form { width:100%; max-width:400px; }
.au-logo--mobile { display:none; font-size:18px; margin-bottom:1.5rem; }
 
.au-head { margin-bottom:22px; }
.au-title { margin:0 0 6px; font-size:24px; font-weight:700; letter-spacing:-.025em; }
.au-subtitle { margin:0; font-size:13.5px; color:var(--text-2); }
 
.au-tabs { display:flex; background:var(--inset); border:1px solid var(--border); border-radius:12px; padding:4px; margin-bottom:20px; }
.au-tabs button { flex:1; padding:9px; border:none; background:transparent; color:var(--text-2); font-size:13px; font-weight:600; border-radius:8px; cursor:pointer; transition:all .18s; }
.au-tabs button:hover { color:var(--text); }
.au-tabs button.is-active { background:linear-gradient(135deg,var(--brand-1),var(--brand-2)); color:#fff; box-shadow:0 4px 14px rgba(102,126,234,.3); }
 
.au-error { background:rgba(231,76,60,.10); border:1px solid rgba(231,76,60,.35); color:#ff8f8f; font-size:12.5px; padding:10px 14px; border-radius:10px; margin-bottom:16px; }
 
.au-fields { display:flex; flex-direction:column; gap:14px; margin-bottom:22px; }
.au-grid-2 { display:grid; grid-template-columns:1fr 1fr; gap:10px; }
.au-field { display:block; }
.au-label { display:block; font-size:12px; font-weight:600; color:var(--text-2); margin-bottom:6px; }
.au-input-wrap { display:flex; align-items:center; gap:10px; background:var(--inset); border:1px solid var(--border);
  border-radius:11px; padding:0 12px; transition:border-color .18s, box-shadow .18s, background .18s; }
.au-input-wrap:focus-within { border-color:var(--brand-1); box-shadow:0 0 0 3px rgba(102,126,234,.15); background:#131329; }
.au-input-ic { display:flex; color:var(--text-3); flex-shrink:0; transition:color .18s; }
.au-input-wrap:focus-within .au-input-ic { color:var(--brand-1); }
.au-input { flex:1; min-width:0; background:transparent; border:none; outline:none; color:var(--text); font-size:14px; padding:11px 0; font-family:inherit; }
.au-input::placeholder { color:#56566e; }
.au-eye { border:none; background:transparent; color:var(--text-3); cursor:pointer; display:flex; padding:4px; border-radius:6px; transition:color .15s; }
.au-eye:hover { color:var(--text); }
 
.au-submit { width:100%; padding:13px; border:none; border-radius:12px; background:linear-gradient(135deg,var(--brand-1),var(--brand-2));
  color:#fff; font-size:14.5px; font-weight:700; cursor:pointer; transition:filter .18s, transform .12s; box-shadow:0 6px 20px rgba(102,126,234,.28); }
.au-submit:hover:not(:disabled) { filter:brightness(1.1); }
.au-submit:active:not(:disabled) { transform:translateY(1px); }
.au-submit:disabled { opacity:.75; cursor:not-allowed; }
.au-btn-loading { display:inline-flex; align-items:center; gap:9px; }
.au-spinner { width:15px; height:15px; border-radius:50%; border:2px solid rgba(255,255,255,.35); border-top-color:#fff; animation:au-spin .7s linear infinite; }
@keyframes au-spin { to { transform:rotate(360deg); } }
 
.au-switch { text-align:center; font-size:13px; color:var(--text-2); margin-top:18px; }
.au-switch button { border:none; background:none; color:var(--brand-1); font-weight:600; cursor:pointer; font-size:13px; }
.au-switch button:hover { text-decoration:underline; }
 
/* Quality floor */
@media (prefers-reduced-motion: reduce) { .au * { animation:none !important; transition:none !important; } }
@media (max-width:860px) {
  .au { grid-template-columns:1fr; }
  .au-brand { display:none; }
  .au-logo--mobile { display:inline-flex; align-items:center; gap:8px;
    background:linear-gradient(135deg,#fff,#c9c6ff); -webkit-background-clip:text; background-clip:text; -webkit-text-fill-color:transparent; }
  .au-logo--mobile svg { color:var(--brand-1); -webkit-text-fill-color:initial; }
}
@media (max-width:420px) { .au-grid-2 { grid-template-columns:1fr; } }
`;

export default Login;
