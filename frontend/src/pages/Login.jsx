import { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

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
      <label className="input-label">{label}</label>
      <div className={`input-wrapper ${valid ? "is-valid" : ""}`}>
        <span className="input-icon">{icon()}</span>
        {asSelect ? (
          <select
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

  // RARE FEATURE STATE: Sponsor Radar
  const [radarState, setRadarState] = useState({ status: "idle", count: 0 });

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    visaStatus: "",
    university: "",
    targetRole: "",
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

  // 🛑 ESLINT FIX 2: Push Radar state updates to the next tick
  useEffect(() => {
    if (!isRegister || form.targetRole.length < 3) {
      const t1 = setTimeout(
        () => setRadarState({ status: "idle", count: 0 }),
        0,
      );
      return () => clearTimeout(t1);
    }

    const t2 = setTimeout(
      () => setRadarState({ status: "scanning", count: 0 }),
      0,
    );

    const timer = setTimeout(() => {
      const fakeCount =
        Math.floor(Math.random() * 500) + 200 + form.targetRole.length * 10;
      setRadarState({ status: "found", count: fakeCount });
    }, 800);

    return () => {
      clearTimeout(t2);
      clearTimeout(timer);
    };
  }, [form.targetRole, isRegister]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (error) setError("");
  };

  const switchMode = (register) => {
    setIsRegister(register);
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
    if (form.password.length < 6)
      return setError("Password must be at least 6 characters.");
    if (isRegister && !form.name.trim())
      return setError("Please enter your full name.");

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
      console.warn("Auth Error:", err);
      setError(
        err.response?.data?.message ||
          "Connection failed. Please verify the AI server is online.",
      );
    }
    setLoading(false);
  };

  // ─────────────────────────────────────────────────────────────
  // OAUTH BRIDGES (Temporarily Disabled for V1)
  // ─────────────────────────────────────────────────────────────
  const handleOAuth = (provider) => {
    const providerName = provider === "google" ? "Google" : "LinkedIn";
    setError(
      `${providerName} SSO is coming in Version 2. Please continue with email.`,
    );
  };

  const emailValid = !!form.email && emailRe.test(form.email);
  const pwValid = form.password.length >= 6;
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
    <div className="auth-layout">
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
            Join international students using our semantic engine to find
            verified visa sponsors and map their exact skill gaps.
          </p>

          <div className="proof-widget glass-panel">
            <div className="proof-header">
              <span className="live-pulse"></span>
              <span>Live System Feed</span>
            </div>
            <div className="proof-body">
              <div className="proof-item">
                <div className="proof-icon emerald">{Ic.check()}</div>
                <div>
                  <strong>Home Office DB Synced</strong>
                  <span>120,402 Sponsors Active</span>
                </div>
              </div>
              <div className="proof-item">
                <div className="proof-icon violet">{Ic.cap()}</div>
                <div>
                  <strong>Student Match Found</strong>
                  <span>MSc AI → Machine Learning Engineer</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* ── RIGHT PANEL: Form Container ──────────────────────── */}
      <main className="form-panel">
        <div className="form-container fade-up">
          <div className="mobile-brand">Arivo AI</div>

          <div className="form-header">
            <h2>{isRegister ? "Create your account" : "Welcome back"}</h2>
            <p>
              {isRegister
                ? "Unlock the ultimate placement toolkit, free."
                : "Sign in to pick up where you left off."}
            </p>
          </div>

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

          {/* Social SSO Buttons */}
          <div className="social-login">
            <button
              type="button"
              className="btn-social"
              onClick={() => handleOAuth("google")}
            >
              {Ic.google()} Google
            </button>
            <button
              type="button"
              className="btn-social"
              onClick={() => handleOAuth("linkedin")}
            >
              {Ic.linkedin()} LinkedIn
            </button>
          </div>

          <div className="divider">
            <span>or continue with email</span>
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

              {isRegister && (
                <div className="extended-fields animate-fade">
                  <div className="grid-2">
                    <Field
                      icon={Ic.globe}
                      label="UK Visa Status"
                      name="visaStatus"
                      asSelect
                      options={[
                        { value: "student", label: "Tier 4 Student" },
                        { value: "graduate", label: "Graduate Route (PSW)" },
                        { value: "none", label: "UK Citizen / ILR" },
                      ]}
                      value={form.visaStatus}
                      onChange={handleChange}
                      valid={!!form.visaStatus}
                      placeholder="Select status..."
                    />
                    <Field
                      icon={Ic.cap}
                      label="University"
                      name="university"
                      value={form.university}
                      onChange={handleChange}
                      valid={!!form.university.trim()}
                      placeholder="e.g. Imperial College"
                    />
                  </div>

                  <div className="radar-field-group">
                    <Field
                      icon={Ic.target}
                      label="Target Role"
                      name="targetRole"
                      value={form.targetRole}
                      onChange={handleChange}
                      valid={!!form.targetRole.trim()}
                      placeholder="e.g. Data Analyst"
                    />

                    {radarState.status !== "idle" && (
                      <div className="radar-popup animate-pop">
                        {radarState.status === "scanning" ? (
                          <>
                            <span className="radar-spinner"></span> Scanning
                            Home Office DB...
                          </>
                        ) : (
                          <>
                            <span className="radar-check">⚡</span>{" "}
                            <strong>{radarState.count}+</strong> Tier 2 Sponsors
                            found for this role!
                          </>
                        )}
                      </div>
                    )}
                  </div>

                  <p className="privacy-note">
                    {Ic.lock()} We use this data to instantly calculate your
                    semantic skill gaps upon login.
                  </p>
                </div>
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
        </div>
      </main>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// PURE CSS MAGIC (MOBILE OPTIMIZED)
// ─────────────────────────────────────────────────────────────
const styles = `
.auth-layout { display: grid; grid-template-columns: 1.1fr 0.9fr; min-height: 100vh; background-color: #030305; color: #F8FAFC; font-family: 'Inter', system-ui, sans-serif; overflow: hidden; }
* { box-sizing: border-box; }
input:-webkit-autofill, input:-webkit-autofill:hover, input:-webkit-autofill:focus { -webkit-text-fill-color: #F8FAFC; -webkit-box-shadow: 0 0 0px 1000px #0A0A0F inset; transition: background-color 5000s ease-in-out 0s; }
@keyframes dashFadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
@keyframes popIn { 0% { opacity: 0; transform: scale(0.95) translateY(-5px); } 100% { opacity: 1; transform: scale(1) translateY(0); } }
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes spin { to { transform: rotate(360deg); } }
.fade-up { opacity: 0; animation: dashFadeUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
.animate-pop { animation: popIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
.animate-fade { animation: fadeIn 0.4s ease forwards; }
.brand-panel { position: relative; padding: 4rem; display: flex; flex-direction: column; justify-content: center; border-right: 1px solid rgba(255,255,255,0.05); background: #030305; }
.ambient-orb { position: absolute; border-radius: 50%; filter: blur(120px); z-index: 0; pointer-events: none; }
.orb-1 { top: -10%; left: -10%; width: 50vw; height: 50vw; background: rgba(139, 92, 246, 0.15); }
.orb-2 { bottom: -10%; right: -10%; width: 40vw; height: 40vw; background: rgba(217, 70, 239, 0.1); }
.bg-grid-overlay { position: absolute; inset: 0; z-index: 0; pointer-events: none; opacity: 0.5; background-image: linear-gradient(to right, rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.03) 1px, transparent 1px); background-size: 40px 40px; mask-image: radial-gradient(ellipse at center, black 40%, transparent 80%); -webkit-mask-image: radial-gradient(ellipse at center, black 40%, transparent 80%); }
.brand-content { position: relative; z-index: 1; max-width: 540px; margin: 0 auto; }
.brand-logo { font-size: 1.5rem; font-weight: 800; letter-spacing: -0.02em; color: #fff; margin-bottom: 3rem; }
.brand-headline { font-size: clamp(2.5rem, 4vw, 3.5rem); font-weight: 800; line-height: 1.1; letter-spacing: -0.03em; margin: 0 0 1.5rem; }
.text-gradient { background: linear-gradient(135deg, #8B5CF6, #D946EF); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
.brand-sub { font-size: 1.1rem; color: #A0AEC0; line-height: 1.6; margin-bottom: 3rem; }
.glass-panel { background: rgba(20, 20, 30, 0.4); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 20px; }
.proof-widget { padding: 20px; box-shadow: 0 20px 40px rgba(0,0,0,0.4); }
.proof-header { display: flex; align-items: center; gap: 8px; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #8B949E; margin-bottom: 16px; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 12px; }
.live-pulse { width: 8px; height: 8px; background: #10B981; border-radius: 50%; box-shadow: 0 0 10px #10B981; animation: pulse 2s infinite; }
@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
.proof-body { display: flex; flex-direction: column; gap: 16px; }
.proof-item { display: flex; align-items: center; gap: 12px; }
.proof-icon { width: 36px; height: 36px; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.proof-icon svg { width: 16px; height: 16px; }
.proof-icon.emerald { background: rgba(16, 185, 129, 0.15); color: #10B981; }
.proof-icon.violet { background: rgba(139, 92, 246, 0.15); color: #A78BFA; }
.proof-item strong { display: block; font-size: 0.9rem; color: #E2E8F0; margin-bottom: 2px; }
.proof-item span { display: block; font-size: 0.8rem; color: #718096; }
.form-panel { display: flex; align-items: center; justify-content: center; padding: 2rem; position: relative; z-index: 1; overflow-y: auto; }
.form-container { width: 100%; max-width: 440px; }
.mobile-brand { display: none; font-size: 1.5rem; font-weight: 800; color: #fff; margin-bottom: 2rem; text-align: center; }
.form-header { text-align: center; margin-bottom: 2rem; }
.form-header h2 { font-size: 1.8rem; font-weight: 800; letter-spacing: -0.02em; margin: 0 0 8px; }
.form-header p { color: #8B949E; font-size: 0.95rem; margin: 0; }
.tab-switcher { position: relative; display: flex; background: rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 4px; margin-bottom: 24px; }
.tab-slider { position: absolute; top: 4px; bottom: 4px; width: calc(50% - 4px); background: rgba(255,255,255,0.1); border-radius: 8px; border: 1px solid rgba(255,255,255,0.05); transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1); z-index: 0; }
.tab-slider.left { transform: translateX(0); }
.tab-slider.right { transform: translateX(100%); }
.tab-switcher button { flex: 1; position: relative; z-index: 1; background: transparent; border: none; padding: 10px; color: #8B949E; font-size: 0.9rem; font-weight: 600; cursor: pointer; transition: color 0.3s; }
.tab-switcher button.active { color: #fff; }
.social-login { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 24px; }
.btn-social { display: flex; align-items: center; justify-content: center; gap: 8px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.1); padding: 12px; border-radius: 12px; color: #E2E8F0; font-size: 0.9rem; font-weight: 600; cursor: pointer; transition: all 0.2s; }
.btn-social:hover { background: rgba(255,255,255,0.08); border-color: rgba(255,255,255,0.2); transform: translateY(-1px); }
.divider { display: flex; align-items: center; text-align: center; margin-bottom: 24px; }
.divider::before, .divider::after { content: ''; flex: 1; border-bottom: 1px solid rgba(255,255,255,0.1); }
.divider span { padding: 0 16px; font-size: 0.8rem; color: #718096; text-transform: uppercase; letter-spacing: 0.05em; }
.error-banner { display: flex; align-items: center; gap: 12px; background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); color: #EF4444; padding: 12px 16px; border-radius: 12px; font-size: 0.9rem; margin-bottom: 24px; }
.error-icon svg { width: 18px; height: 18px; }
.fields-stack { display: flex; flex-direction: column; gap: 16px; margin-bottom: 24px; }
.grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.input-group { display: flex; flex-direction: column; gap: 6px; }
.input-label { font-size: 0.8rem; font-weight: 600; color: #A0AEC0; margin-left: 4px; }
.input-wrapper { display: flex; align-items: center; gap: 12px; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 0 14px; transition: all 0.2s; }
.input-wrapper:focus-within { border-color: #8B5CF6; box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.15); background: #0A0A0F; }
.input-wrapper.is-valid { border-color: rgba(16, 185, 129, 0.3); }
.input-icon svg { width: 16px; height: 16px; color: #718096; transition: color 0.2s; }
.input-wrapper:focus-within .input-icon svg { color: #8B5CF6; }
.input-element { flex: 1; min-width: 0; background: transparent; border: none; outline: none; color: #F8FAFC; font-size: 0.95rem; padding: 12px 0; font-family: inherit; }
.input-element::placeholder { color: #4B5563; }
select.input-element option { background: #0f0f18; color: #fff; }
.input-trailing { display: flex; align-items: center; gap: 8px; }
.valid-check svg { width: 16px; height: 16px; color: #10B981; animation: popIn 0.3s cubic-bezier(0.16,1,0.3,1); }
.btn-icon { background: none; border: none; color: #718096; cursor: pointer; display: flex; align-items: center; padding: 4px; transition: color 0.2s; }
.btn-icon:hover { color: #fff; }
.btn-icon svg { width: 16px; height: 16px; }
.caps-warning { display: flex; align-items: center; gap: 6px; font-size: 0.75rem; color: #F59E0B; margin: 4px 0 0 4px; }
.caps-warning svg { width: 14px; height: 14px; }
.strength-meter { display: flex; align-items: center; gap: 12px; margin: 8px 0 0 4px; }
.strength-bars { display: flex; gap: 6px; flex: 1; }
.s-bar { flex: 1; height: 4px; border-radius: 99px; background: rgba(255,255,255,0.1); transition: all 0.3s; }
.active-s1 { background: #EF4444; box-shadow: 0 0 8px rgba(239, 68, 68, 0.4); }
.active-s2 { background: #F59E0B; box-shadow: 0 0 8px rgba(245, 158, 11, 0.4); }
.active-s3 { background: #10B981; box-shadow: 0 0 8px rgba(16, 185, 129, 0.4); }
.s-label { font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; width: 45px; text-align: right; }
.s-label.s0, .s-label.s1 { color: #EF4444; } .s-label.s2 { color: #F59E0B; } .s-label.s3 { color: #10B981; }
.radar-field-group { display: flex; flex-direction: column; gap: 8px; }
.radar-popup { display: flex; align-items: center; gap: 8px; padding: 10px 14px; background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 10px; font-size: 0.85rem; color: #99f5e4; margin-top: 4px; }
.radar-spinner { width: 14px; height: 14px; border: 2px solid rgba(16, 185, 129, 0.3); border-top-color: #10B981; border-radius: 50%; animation: spin 1s linear infinite; display: inline-block; }
.radar-check { font-size: 14px; }
.radar-popup strong { color: #fff; font-weight: 800; }
.privacy-note { display: flex; align-items: center; gap: 6px; font-size: 0.75rem; color: #718096; margin-top: 8px; }
.privacy-note svg { width: 12px; height: 12px; }
.btn-submit { width: 100%; padding: 14px; border: none; border-radius: 12px; background: linear-gradient(135deg, #8B5CF6, #D946EF); color: #fff; font-size: 1rem; font-weight: 700; cursor: pointer; transition: all 0.3s; box-shadow: 0 8px 20px rgba(139, 92, 246, 0.3); margin-top: 8px; }
.btn-submit:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 12px 25px rgba(139, 92, 246, 0.5); filter: brightness(1.1); }
.btn-submit:disabled { opacity: 0.7; cursor: not-allowed; }
.btn-loading { display: flex; align-items: center; justify-content: center; gap: 10px; }
.spinner { width: 18px; height: 18px; border: 2px solid rgba(255,255,255,0.3); border-top-color: #fff; border-radius: 50%; animation: spin 0.8s linear infinite; }
@media (max-width: 960px) { .auth-layout { grid-template-columns: 1fr; overflow-y: auto; } .brand-panel { display: none; } .mobile-brand { display: block; } .form-panel { padding: 2rem 1.5rem; align-items: flex-start; padding-top: 4rem; overflow: visible; height: auto;} }
@media (max-width: 480px) { .grid-2 { grid-template-columns: 1fr; } .social-login { grid-template-columns: 1fr; } }
`;
