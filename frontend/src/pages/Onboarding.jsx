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
    <div className="ob">
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
.ob { min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 24px 16px; background: #030305; color: #F8FAFC; font-family: 'Inter', system-ui, sans-serif; box-sizing: border-box; }
.ob * { box-sizing: border-box; }
.ob-card { width: 100%; max-width: 520px; background: rgba(20,20,30,0.6); border: 1px solid rgba(255,255,255,0.08); border-radius: 20px; padding: clamp(20px, 5vw, 36px); }
.ob-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; }
.ob-brand { font-size: 1.1rem; font-weight: 800; }
.ob-dots { display: flex; gap: 6px; }
.ob-dot { width: 22px; height: 4px; border-radius: 99px; background: rgba(255,255,255,0.12); }
.ob-dot.is-on { background: linear-gradient(90deg, #8B5CF6, #D946EF); }
.ob-hello { font-size: 0.85rem; color: #A0AEC0; margin: 0 0 6px; }
.ob-title { font-size: clamp(1.4rem, 4vw, 1.7rem); font-weight: 800; letter-spacing: -0.02em; margin: 0 0 8px; }
.ob-why { font-size: 0.85rem; color: #8B949E; line-height: 1.5; margin: 0 0 20px; }
.ob-options { display: flex; flex-direction: column; gap: 10px; }
.ob-option { text-align: left; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 13px 16px; color: inherit; cursor: pointer; font-family: inherit; display: flex; flex-direction: column; gap: 2px; transition: border-color 0.15s, background 0.15s; }
.ob-option:hover { border-color: rgba(139,92,246,0.5); }
.ob-option.is-on { border-color: #8B5CF6; background: rgba(139,92,246,0.14); }
.ob-option-t { font-size: 0.95rem; font-weight: 600; }
.ob-option-h { font-size: 0.78rem; color: #8B949E; }
.ob-field { display: flex; flex-direction: column; gap: 6px; margin-top: 16px; font-size: 0.82rem; color: #A0AEC0; }
.ob-field input, .ob-input { width: 100%; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.12); border-radius: 12px; padding: 13px 14px; color: #F8FAFC; font-size: 1rem; font-family: inherit; color-scheme: dark; }
.ob-input:focus, .ob-field input:focus { outline: none; border-color: #8B5CF6; }
.ob-chips { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 14px; }
.ob-chip { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.1); border-radius: 99px; padding: 7px 13px; font-size: 0.8rem; color: #CBD5E1; cursor: pointer; font-family: inherit; }
.ob-chip:hover { border-color: rgba(139,92,246,0.5); }
.ob-error { margin-top: 16px; font-size: 0.85rem; color: #EF4444; background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.3); border-radius: 10px; padding: 10px 14px; }
.ob-actions { display: flex; align-items: center; justify-content: space-between; margin-top: 26px; }
.ob-primary { background: linear-gradient(135deg, #8B5CF6, #D946EF); border: none; color: #fff; font-weight: 700; font-size: 0.95rem; padding: 12px 26px; border-radius: 12px; cursor: pointer; font-family: inherit; }
.ob-primary:disabled { opacity: 0.4; cursor: not-allowed; }
.ob-ghost { background: none; border: 1px solid rgba(255,255,255,0.12); color: #CBD5E1; padding: 11px 20px; border-radius: 12px; cursor: pointer; font-family: inherit; font-size: 0.9rem; }
.ob-skip { display: block; margin: 18px auto 0; background: none; border: none; color: #718096; font-size: 0.8rem; cursor: pointer; font-family: inherit; text-decoration: underline; text-underline-offset: 3px; }
.ob-skip:hover { color: #A0AEC0; }
`;
