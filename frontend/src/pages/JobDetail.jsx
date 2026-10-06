import { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { useCareerProfile } from "../hooks/useCareerProfile";
import { trackJob } from "../hooks/useApplications";

const AI_URL = import.meta.env.VITE_AI_URL;

const mentions = (text, name) => {
  const n = name.trim();
  if (n.length < 2) return false;
  const esc = n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(^|[^a-z0-9])${esc}($|[^a-z0-9])`, "i").test(text);
};

const cleanSalary = (s) => (s && !/not specified/i.test(s) ? s : "");

export default function JobDetail({ jobData, allJobs, onNavigate, onBack }) {
  const { token } = useAuth();
  const { profile } = useCareerProfile();
  const job = jobData;

  const [full, setFull] = useState({ key: null, status: "loading", text: "", via: "" });
  const [saved, setSaved] = useState(false);

  const jobKey = job ? job.url || `${job.title}|${job.company}` : null;

  useEffect(() => {
    if (!job || !job.url || job.direct) return undefined;
    let alive = true;
    axios
      .post(
        `${AI_URL}/jobs/scrape-description`,
        {
          url: job.url,
          source: job.source || "reed",
          title: job.title,
          company: job.company,
          location: job.location || "london",
        },
        { timeout: 20000 },
      )
      .then((r) => {
        if (!alive) return;
        setFull({
          key: jobKey,
          status: r.data?.success ? "full" : "partial",
          text: r.data?.success ? r.data.description : "",
          via: r.data?.via || "",
        });
      })
      .catch(() => alive && setFull({ key: jobKey, status: "partial", text: "", via: "" }));
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobKey]);

  if (!job) {
    return (
      <div className="jd">
        <style>{CSS}</style>
        <p className="jd-muted">Job not found.</p>
        <button className="iv-btn iv-btn--ghost" onClick={onBack}>Back</button>
      </div>
    );
  }

  const ready = full.key === jobKey;
  const loading = !!job.url && !job.direct && !ready;
  // Jobs taken from an employer's own board already carry the whole posting
  const fullText = job.direct ? job.description_full || "" : ready && full.status === "full" ? full.text : "";
  const bodyText = fullText || job.description_full || job.description || "";
  const paras = bodyText.split(/\n+/).map((p) => p.trim()).filter(Boolean);
  const salary = cleanSalary(job.salary);
  const skills = profile?.skills || [];
  const hits = skills.filter((s) => mentions(bodyText, s.name));

  const similar = (allJobs || [])
    .filter(
      (j) =>
        j.company !== job.company &&
        j.title &&
        (j.title.includes(job.title.split(" ")[0]) || job.title.includes(j.title.split(" ")[0])),
    )
    .slice(0, 3);

  const save = () => {
    trackJob(token, job);
    setSaved(true);
  };

  const scan = () => {
    sessionStorage.setItem(
      "arivo_pending_scan",
      JSON.stringify({
        title: job.title,
        company: job.company,
        description: bodyText,
        isPartial: !fullText,
        url: job.url || "",
      }),
    );
    onNavigate("ats");
  };

  const facts = [
    ["Location", job.location || "London"],
    ["Salary", salary ? `${salary}${job.salary_is_predicted ? " (estimated)" : ""}` : "Not listed"],
    ["Type", [job.contract_time, job.contract_type].filter(Boolean).map((t) => t.replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase())).join(", ") || "Not listed"],
    ["Work mode", job.work_mode ? job.work_mode.replace(/^./, (c) => c.toUpperCase()) : "Not listed"],
    ["Source", job.direct ? "Employer's own job board" : job.source && job.source.includes("reed") ? "Reed" : "Adzuna"],
  ];

  return (
    <div className="jd">
      <style>{CSS}</style>

      <button className="jd-back" onClick={onBack}>← Back</button>

      <header className="jd-head">
        <p className="iv-eyebrow">{job.company}</p>
        <h1 className="jd-title iv-display">{job.title}</h1>
        <div className="jd-badges">
          {job.visa_sponsor ? (
            <span className="jd-badge jd-badge--ok">Employer is on the sponsor register</span>
          ) : (
            <span className="jd-badge">Sponsorship not confirmed</span>
          )}
        </div>
        <p className="jd-note">
          Being on the register doesn't mean this role is sponsored. Confirm with the employer before you apply.
        </p>
        <div className="jd-actions">
          {job.url && (
            <a className="iv-btn iv-btn--primary" href={job.url} target="_blank" rel="noreferrer">
              Open the posting
            </a>
          )}
          <button className="iv-btn iv-btn--ghost" onClick={save} disabled={saved}>
            {saved ? "Saved to tracker" : "Save to tracker"}
          </button>
          <button className="iv-btn iv-btn--ghost" onClick={scan}>Check my CV against this role</button>
        </div>
      </header>

      <dl className="jd-facts iv-card">
        {facts.map(([k, v]) => (
          <div key={k}>
            <dt>{k}</dt>
            <dd>{v}</dd>
          </div>
        ))}
      </dl>

      {skills.length > 0 && (
        <section className="jd-card iv-card">
          <h2 className="iv-display">Your skills in this posting</h2>
          {hits.length > 0 ? (
            <>
              <p className="jd-muted">
                {hits.length} of the {skills.length} skills on your profile appear in the text below.
              </p>
              <div className="jd-chips">
                {hits.map((s) => (
                  <span key={s.name} className="jd-chip">{s.name}</span>
                ))}
              </div>
            </>
          ) : (
            <p className="jd-muted">
              None of your profile skills are named in the text we have for this posting.
              {!fullText && " That text is only a preview, so this may undercount."}
            </p>
          )}
        </section>
      )}

      <section className="jd-card iv-card">
        <h2 className="iv-display">Description</h2>
        {loading && <p className="jd-muted">Loading the full description…</p>}
        {!loading && !fullText && job.url && (
          <p className="jd-warn">
            Only a preview is available for this posting. The job board limits how much text we can pull.{" "}
            <a href={job.url} target="_blank" rel="noreferrer">Open the full posting</a> for the complete requirements.
          </p>
        )}
        {fullText && job.direct && (
          <p className="jd-muted">Full text from {job.company}'s own job board.</p>
        )}
        {fullText && !job.direct && full.via === "reed_match" && (
          <p className="jd-muted">Full text taken from the matching Reed listing.</p>
        )}
        <div className="jd-desc">
          {paras.length ? paras.map((p, i) => <p key={i}>{p}</p>) : <p>No description available.</p>}
        </div>
      </section>

      {similar.length > 0 && (
        <section className="jd-similar">
          <h2 className="iv-display">Similar roles</h2>
          <div className="jd-sim-grid">
            {similar.map((s, i) => (
              <button key={`${s.url || s.title}-${i}`} className="jd-sim iv-card" onClick={() => onNavigate("jobDetail", s)}>
                <span className="jd-sim-t">{s.title}</span>
                <span className="jd-sim-c">{s.company}</span>
                <span className="jd-sim-m">{s.location}</span>
                {s.visa_sponsor && <span className="jd-badge jd-badge--ok">On sponsor register</span>}
              </button>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

const CSS = `
.jd { max-width: 880px; margin: 0 auto; padding: clamp(1.5rem, 4vw, 3rem) clamp(1rem, 3vw, 2rem) 5rem; }
.jd-back { background: none; border: none; color: var(--c-ink-2); font: 500 0.88rem var(--font-body); cursor: pointer; padding: 0; margin-bottom: 24px; }
.jd-back:hover { color: var(--c-ink); }
.jd-title { font-size: clamp(2rem, 5vw, 3rem); font-weight: 400; margin: 8px 0 16px; }
.jd-badges { display: flex; gap: 8px; flex-wrap: wrap; }
.jd-badge { font-size: 0.74rem; font-weight: 600; padding: 4px 11px; border-radius: 999px; background: var(--c-line); color: var(--c-ink-2); }
.jd-badge--ok { background: var(--c-ok-soft); color: var(--c-ok); }
.jd-note { font-size: 0.82rem; color: var(--c-ink-3); margin: 10px 0 22px; max-width: 62ch; line-height: 1.55; }
.jd-actions { display: flex; gap: 10px; flex-wrap: wrap; }
.jd-actions a { text-decoration: none; }
.jd-facts { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 20px; margin: 32px 0 20px; padding: 22px 24px; }
.jd-facts dt { font-size: 0.72rem; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; color: var(--c-ink-3); margin-bottom: 4px; }
.jd-facts dd { margin: 0; font-size: 0.95rem; font-weight: 500; }
.jd-card { padding: clamp(20px, 4vw, 32px); margin-bottom: 20px; }
.jd-card h2, .jd-similar h2 { font-size: 1.7rem; font-weight: 400; margin: 0 0 14px; }
.jd-muted { color: var(--c-ink-2); font-size: 0.92rem; line-height: 1.6; margin: 0 0 12px; }
.jd-warn { font-size: 0.88rem; color: var(--c-warn); background: var(--c-warn-soft); border: 1px solid var(--c-warn-line); border-radius: var(--radius); padding: 11px 14px; margin: 0 0 16px; line-height: 1.55; }
.jd-warn a { color: inherit; font-weight: 700; }
.jd-chips { display: flex; flex-wrap: wrap; gap: 8px; }
.jd-chip { font-size: 0.8rem; font-weight: 600; padding: 6px 12px; border-radius: 999px; background: var(--c-green-soft); color: var(--c-green); }
.jd-desc p { font-size: 0.95rem; line-height: 1.75; color: var(--c-ink-2); margin: 0 0 14px; }
.jd-similar { margin-top: 36px; }
.jd-sim-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(230px, 1fr)); gap: 14px; }
.jd-sim { display: flex; flex-direction: column; align-items: flex-start; gap: 5px; padding: 18px; text-align: left; cursor: pointer; font-family: inherit; color: inherit; transition: border-color var(--t) var(--ease); }
.jd-sim:hover { border-color: var(--c-green); }
.jd-sim-t { font-weight: 600; font-size: 0.95rem; }
.jd-sim-c { font-size: 0.85rem; color: var(--c-ink-2); }
.jd-sim-m { font-size: 0.8rem; color: var(--c-ink-3); }
`;
