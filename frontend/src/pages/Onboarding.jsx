import { useState } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { VISA_TYPES, NEEDS_END_DATE, LOOKING_FOR } from "../constants/profileOptions";

const API = `${import.meta.env.VITE_API_URL}/api/profile`;

const ROLE_IDEAS = ["Data Analyst", "Software Engineer", "Machine Learning Engineer", "Business Analyst", "Product Manager", "Marketing Executive"];

export default function Onboarding({ onDone }) {
  const { currentUser, token, updateUser } = useAuth();
  const [step, setStep] = useState(0);
  const [visaType, setVisaType] = useState("");
  const [visaEndDate, setVisaEndDate] = useState("");
  const [targetRole, setTargetRole] = useState("");
  const [lookingFor, setLookingFor] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const finish = async () => {
    setSaving(true);
    setError("");
    try {
      const res = await axios.put(
        API,
        {
          visaType,
          visaEndDate: NEEDS_END_DATE.includes(visaType) ? visaEndDate : "",
          targetRole: targetRole.trim(),
          lookingFor,
          onboarded: true,
        },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      updateUser({ onboarded: true, targetRole: res.data.targetRole, visaType: res.data.visaType });
      onDone();
    } catch (err) {
      setError(err.response?.data?.message || "Could not save. Check your connection and try again.");
    }
    setSaving(false);
  };

  const toggleLooking = (v) =>
    setLookingFor((prev) => (prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]));

  const steps = [
    {
      title: "What's your UK visa situation?",
      why: "We use this to tailor how we talk about sponsorship. It stays on your account and you can delete it any time.",
      canNext: !!visaType,
      body: (
        <>
          <div className="ob-options">
            {VISA_TYPES.map((v) => (
              <button
                key={v.value}
                type="button"
                className={`ob-option ${visaType === v.value ? "is-on" : ""}`}
                aria-pressed={visaType === v.value}
                onClick={() => setVisaType(v.value)}
              >
                <span className="ob-option-t">{v.value}</span>
                <span className="ob-option-h">{v.hint}</span>
              </button>
            ))}
          </div>
          {NEEDS_END_DATE.includes(visaType) && (
            <label className="ob-field">
              <span>When does it end? (optional)</span>
              <input type="date" value={visaEndDate} onChange={(e) => setVisaEndDate(e.target.value)} />
            </label>
          )}
        </>
      ),
    },
    {
      title: "What role are you aiming for?",
      why: "Jobs, the skills comparison and interview practice all start from this. You can change it any time.",
      canNext: targetRole.trim().length >= 2,
      body: (
        <>
          <input
            className="ob-input"
            value={targetRole}
            onChange={(e) => setTargetRole(e.target.value)}
            placeholder="e.g. Data Analyst"
            maxLength={100}
            autoFocus
          />
          <div className="ob-chips">
            {ROLE_IDEAS.map((r) => (
              <button key={r} type="button" className="ob-chip" onClick={() => setTargetRole(r)}>
                {r}
              </button>
            ))}
          </div>
        </>
      ),
    },
    {
      title: "What are you looking for?",
      why: "Pick any that apply. Students search very differently for a placement than for a graduate job.",
      canNext: lookingFor.length > 0,
      body: (
        <div className="ob-options">
          {LOOKING_FOR.map((v) => (
            <button
              key={v}
              type="button"
              className={`ob-option ${lookingFor.includes(v) ? "is-on" : ""}`}
              aria-pressed={lookingFor.includes(v)}
              onClick={() => toggleLooking(v)}
            >
              <span className="ob-option-t">{v}</span>
            </button>
          ))}
        </div>
      ),
    },
  ];
  const cur = steps[step];
  const last = step === steps.length - 1;

  return (
    <div className="ob ivory">
      <style>{CSS}</style>
      <div className="ob-card">
        <div className="ob-top">
          <div className="ob-brand">Arivo AI</div>
          <div className="ob-dots" aria-label={`Step ${step + 1} of ${steps.length}`}>
            {steps.map((_, i) => (
              <span key={i} className={`ob-dot ${i <= step ? "is-on" : ""}`} />
            ))}
          </div>
        </div>

        <p className="ob-hello">Welcome{currentUser?.name ? `, ${currentUser.name.split(" ")[0]}` : ""}. Three quick questions.</p>
        <h1 className="ob-title">{cur.title}</h1>
        <p className="ob-why">{cur.why}</p>

        {cur.body}

        {error && <div className="ob-error">{error}</div>}

        <div className="ob-actions">
          {step > 0 ? (
            <button type="button" className="ob-ghost" onClick={() => setStep(step - 1)} disabled={saving}>
              Back
            </button>
          ) : (
            <span />
          )}
          <button
            type="button"
            className="ob-primary"
            disabled={!cur.canNext || saving}
            onClick={last ? finish : () => setStep(step + 1)}
          >
            {last ? (saving ? "Saving…" : "Finish") : "Continue"}
          </button>
        </div>
        <button type="button" className="ob-skip" onClick={finish} disabled={saving}>
          Skip for now. You can fill this in from your profile.
        </button>
      </div>
    </div>
  );
}

const CSS = `
.ob { min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 24px 16px; }
.ob-card { width: 100%; max-width: 540px; background: var(--c-surface); border: 1px solid var(--c-line); border-radius: var(--radius-lg); padding: clamp(24px, 5vw, 44px); box-shadow: var(--shadow); animation: obFade 240ms var(--ease) both; }
@keyframes obFade { from { opacity: 0; } to { opacity: 1; } }
.ob-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 32px; }
.ob-brand { font-family: var(--font-display); font-size: 1.5rem; letter-spacing: -0.01em; }
.ob-dots { display: flex; gap: 6px; }
.ob-dot { width: 24px; height: 3px; border-radius: 99px; background: var(--c-line); transition: background var(--t) var(--ease); }
.ob-dot.is-on { background: var(--c-green); }
.ob-hello { font-size: 0.85rem; color: var(--c-ink-3); margin: 0 0 8px; }
.ob-title { font-family: var(--font-display); font-weight: 400; font-size: clamp(1.9rem, 5vw, 2.4rem); letter-spacing: -0.015em; line-height: 1.1; margin: 0 0 12px; }
.ob-why { font-size: 0.9rem; color: var(--c-ink-2); line-height: 1.6; margin: 0 0 24px; }
.ob-options { display: flex; flex-direction: column; gap: 10px; }
.ob-option { text-align: left; background: var(--c-surface); border: 1px solid var(--c-line-2); border-radius: var(--radius); padding: 14px 16px; color: var(--c-ink); cursor: pointer; font-family: inherit; display: flex; flex-direction: column; gap: 3px; transition: border-color var(--t) var(--ease), background var(--t) var(--ease); }
.ob-option:hover { border-color: var(--c-green); }
.ob-option.is-on { border-color: var(--c-green); background: var(--c-green-soft); box-shadow: inset 0 0 0 1px var(--c-green); }
.ob-option-t { font-size: 0.97rem; font-weight: 600; }
.ob-option-h { font-size: 0.8rem; color: var(--c-ink-3); }
.ob-field { display: flex; flex-direction: column; gap: 6px; margin-top: 18px; font-size: 0.82rem; color: var(--c-ink-2); }
.ob-field input, .ob-input { width: 100%; background: var(--c-surface); border: 1px solid var(--c-line-2); border-radius: var(--radius); padding: 13px 14px; color: var(--c-ink); font: 400 1rem var(--font-body); }
.ob-field input:focus, .ob-input:focus { outline: none; border-color: var(--c-green); box-shadow: 0 0 0 3px var(--c-green-soft); }
.ob-chips { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 14px; }
.ob-chip { background: var(--c-surface); border: 1px solid var(--c-line-2); border-radius: 999px; padding: 7px 14px; font: 500 0.8rem var(--font-body); color: var(--c-ink-2); cursor: pointer; transition: border-color var(--t) var(--ease), color var(--t) var(--ease); }
.ob-chip:hover { border-color: var(--c-green); color: var(--c-ink); }
.ob-error { margin-top: 16px; font-size: 0.85rem; color: var(--c-danger); background: var(--c-danger-soft); border: 1px solid #e3b8b1; border-radius: var(--radius); padding: 10px 14px; }
.ob-actions { display: flex; align-items: center; justify-content: space-between; margin-top: 30px; }
.ob-primary { background: var(--c-green); border: none; color: #f5f1e8; font: 600 0.95rem var(--font-body); padding: 12px 28px; border-radius: var(--radius); cursor: pointer; transition: background var(--t) var(--ease); }
.ob-primary:hover:not(:disabled) { background: var(--c-green-2); }
.ob-primary:disabled { opacity: 0.4; cursor: not-allowed; }
.ob-ghost { background: none; border: 1px solid var(--c-line-2); color: var(--c-ink); padding: 11px 22px; border-radius: var(--radius); cursor: pointer; font: 500 0.9rem var(--font-body); transition: border-color var(--t) var(--ease); }
.ob-ghost:hover:not(:disabled) { border-color: var(--c-ink); }
.ob-skip { display: block; margin: 20px auto 0; background: none; border: none; color: var(--c-ink-3); font: 400 0.82rem var(--font-body); cursor: pointer; text-decoration: underline; text-underline-offset: 3px; }
.ob-skip:hover { color: var(--c-ink); }
`;
