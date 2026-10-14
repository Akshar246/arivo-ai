import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import SalaryCheck from "./SalaryCheck";

const API = `${import.meta.env.VITE_API_URL}/api/scout`;

const when = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
};

// What the posting itself says about sponsorship, always with the sentence it came from
function Wording({ pick }) {
  const w = pick.wording || {};
  if (w.status === "sponsorship_offered") {
    return <p className="sc-note sc-note--ok"><strong>The posting says sponsorship is offered:</strong> “{w.quote}”</p>;
  }
  if (w.status === "right_to_work_required") {
    return <p className="sc-note sc-note--warn"><strong>The posting asks for existing permission to work:</strong> “{w.quote}”</p>;
  }
  return (
    <p className="sc-note">
      {pick.wordingBasis === "preview"
        ? "We only read a preview of this posting, so check the full text for sponsorship wording."
        : "The posting doesn't mention sponsorship either way."}
    </p>
  );
}

export default function ScoutPanel({ onTrackerChange }) {
  const { token } = useAuth();
  const headers = { Authorization: `Bearer ${token}` };
  const [state, setState] = useState({ loading: true, settings: null, picks: [], error: "" });
  const [busy, setBusy] = useState(false);
  const [last, setLast] = useState("");
  const [msg, setMsg] = useState("");

  const load = useCallback(async () => {
    try {
      const r = await axios.get(API, { headers: { Authorization: `Bearer ${token}` } });
      setState({ loading: false, settings: r.data.settings, picks: r.data.picks, error: "" });
    } catch {
      setState((s) => ({ ...s, loading: false, error: "Couldn't load the Scout right now." }));
    }
  }, [token]);

  useEffect(() => {
    const t = setTimeout(load, 0);
    return () => clearTimeout(t);
  }, [load]);

  const save = async (patch) => {
    setMsg("");
    try {
      const r = await axios.put(`${API}/settings`, patch, { headers });
      setState((s) => ({ ...s, settings: r.data.settings }));
    } catch (e) {
      setMsg(e.response?.data?.message || "Couldn't save that.");
    }
  };

  const search = async () => {
    setBusy(true);
    setMsg("");
    setLast("");
    try {
      const r = await axios.post(`${API}/run`, {}, { headers, timeout: 180000 });
      setLast(
        `Searched ${r.data.considered} roles: ${r.data.added} new pick${r.data.added === 1 ? "" : "s"}` +
          (r.data.skipped_no_sponsorship ? `, and ${r.data.skipped_no_sponsorship} skipped because their postings say they can't sponsor.` : "."),
      );
      await load();
    } catch (e) {
      setMsg(e.response?.data?.message || "The Scout couldn't search just now. Try again in a minute.");
    }
    setBusy(false);
  };

  const mark = async (pick, next) => {
    try {
      await axios.patch(`${API}/picks/${pick._id}`, { state: next }, { headers });
      setState((s) => ({
        ...s,
        picks: next === "dismissed" ? s.picks.filter((p) => p._id !== pick._id) : s.picks.map((p) => (p._id === pick._id ? { ...p, state: next } : p)),
      }));
      if (next === "saved" && onTrackerChange) onTrackerChange();
    } catch {
      setMsg("Couldn't update that role.");
    }
  };

  if (state.loading) return null;
  const { settings, picks } = state;
  if (!settings) return null;

  return (
    <section className="scout iv-card">
      <style>{CSS}</style>
      <div className="scout-head">
        <div>
          <p className="iv-eyebrow">Sponsorship Scout</p>
          <h2 className="scout-title iv-display">{settings.enabled ? "Roles picked for you" : "Let the Scout look for you"}</h2>
        </div>
        {settings.enabled && (
          <div className="scout-controls">
            <select
              className="scout-select"
              value={settings.frequency}
              onChange={(e) => save({ frequency: e.target.value })}
              aria-label="How often to email you"
            >
              <option value="weekly">Email me weekly</option>
              <option value="daily">Email me daily</option>
            </select>
            <button className="scout-link" onClick={() => save({ enabled: false })}>Turn off</button>
          </div>
        )}
      </div>

      {!settings.enabled && (
        <>
          <p className="scout-text">
            The Scout checks for new roles from employers on the sponsor register that fit your target role and skills. It reads each
            posting for what it says about sponsorship, quotes the line it found, and skips roles that say they can't sponsor. Turn it on
            to get a short list by email, or just search once now.
          </p>
          {!settings.emailConfirmed && (
            <p className="scout-text scout-text--small">Confirm your email address to receive the list by email. You can still see the picks here.</p>
          )}
          <div className="scout-actions">
            <button className="iv-btn iv-btn--primary" onClick={() => save({ enabled: true })}>Turn on the Scout</button>
            <button className="iv-btn iv-btn--ghost" onClick={search} disabled={busy}>{busy ? "Searching…" : "Search once now"}</button>
          </div>
        </>
      )}

      {settings.enabled && (
        <div className="scout-actions">
          <button className="iv-btn iv-btn--ghost" onClick={search} disabled={busy}>{busy ? "Searching…" : "Search now"}</button>
          <span className="scout-status">
            {settings.lastRunAt ? `Last searched ${when(settings.lastRunAt)}.` : "Not searched yet."}
            {!settings.emailConfirmed && " Confirm your email to get it by email."}
          </span>
        </div>
      )}

      {last && <p className="scout-text scout-text--small">{last}</p>}
      {(msg || state.error) && <p className="scout-error" role="alert">{msg || state.error}</p>}

      {picks.length > 0 && (
        <div className="scout-list">
          {picks.map((p) => (
            <article key={p._id} className="scout-pick">
              <div className="scout-pick-top">
                <div>
                  <h3 className="scout-pick-title">{p.title}</h3>
                  <p className="scout-pick-co">{[p.company, p.location].filter(Boolean).join(" · ")}</p>
                </div>
                <SalaryCheck check={p.salaryCheck} />
              </div>
              <p className="scout-reason">{p.reason}</p>
              <Wording pick={p} />
              <div className="scout-pick-actions">
                {p.url && <a className="scout-link" href={p.url} target="_blank" rel="noreferrer">Open the posting</a>}
                {p.state === "saved" ? (
                  <span className="scout-saved">Saved to your tracker</span>
                ) : (
                  <button className="scout-link" onClick={() => mark(p, "saved")}>Save to tracker</button>
                )}
                <button className="scout-link scout-link--quiet" onClick={() => mark(p, "dismissed")}>Not interested</button>
              </div>
            </article>
          ))}
        </div>
      )}
      {settings.enabled && picks.length === 0 && !busy && (
        <p className="scout-text scout-text--small">No picks yet. Press “Search now” and the Scout will look.</p>
      )}
      <p className="scout-foot">
        A posting isn't a promise. Confirm sponsorship and salary with the employer. General information, not immigration advice.
      </p>
    </section>
  );
}

const CSS = `
.scout { padding: clamp(20px, 4vw, 32px); margin-bottom: 28px; }
.scout-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; flex-wrap: wrap; }
.scout-title { font-size: clamp(1.5rem, 3vw, 1.9rem); font-weight: 400; margin: 6px 0 12px; }
.scout-controls { display: flex; align-items: center; gap: 14px; }
.scout-select { font: 500 0.82rem var(--font-body); color: var(--c-ink); background: var(--c-surface); border: 1px solid var(--c-line); border-radius: var(--radius); padding: 7px 10px; }
.scout-text { color: var(--c-ink-2); font-size: 0.93rem; line-height: 1.65; max-width: 66ch; margin: 0 0 16px; }
.scout-text--small { font-size: 0.84rem; margin-bottom: 12px; }
.scout-actions { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; margin-bottom: 14px; }
.scout-status { font-size: 0.82rem; color: var(--c-ink-3); }
.scout-error { color: var(--c-danger); font-size: 0.88rem; margin: 0 0 12px; }
.scout-link { background: none; border: none; padding: 0; color: var(--c-green); font: 600 0.85rem var(--font-body); cursor: pointer; text-decoration: underline; text-underline-offset: 3px; }
.scout-link--quiet { color: var(--c-ink-3); font-weight: 500; }
.scout-list { display: grid; gap: 14px; margin-top: 8px; }
.scout-pick { border: 1px solid var(--c-line); border-radius: var(--radius); padding: 16px 18px; background: var(--c-surface); }
.scout-pick-top { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; flex-wrap: wrap; }
.scout-pick-title { font-size: 1.02rem; font-weight: 600; margin: 0 0 2px; line-height: 1.35; }
.scout-pick-co { font-size: 0.86rem; color: var(--c-ink-2); margin: 0; }
.scout-reason { font-size: 0.88rem; color: var(--c-ink-2); line-height: 1.6; margin: 10px 0 8px; }
.sc-note { font-size: 0.83rem; line-height: 1.55; color: var(--c-ink-3); margin: 0 0 10px; }
.sc-note--ok { color: var(--c-ok); background: var(--c-ok-soft); border-radius: var(--radius); padding: 8px 11px; }
.sc-note--warn { color: var(--c-warn); background: var(--c-warn-soft); border-radius: var(--radius); padding: 8px 11px; }
.scout-pick-actions { display: flex; gap: 16px; flex-wrap: wrap; align-items: center; }
.scout-saved { font-size: 0.85rem; font-weight: 600; color: var(--c-ok); }
.scout-foot { font-size: 0.76rem; color: var(--c-ink-3); line-height: 1.55; margin: 16px 0 0; }
`;
