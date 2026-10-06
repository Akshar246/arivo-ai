import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { useCareerProfile } from "../hooks/useCareerProfile";
import { useApplications } from "../hooks/useApplications";
import { defaultKind, matchesKind, searchBody } from "../constants/profileOptions";

const AI_URL = import.meta.env.VITE_AI_URL || "http://localhost:8000";

const greeting = () => {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
};

const monthsUntil = (iso) => {
  const end = new Date(iso);
  if (Number.isNaN(end.getTime())) return null;
  const now = new Date();
  return (end.getFullYear() - now.getFullYear()) * 12 + (end.getMonth() - now.getMonth());
};

export default function Dashboard({ onNavigate, onJobsLoad }) {
  const { currentUser } = useAuth();
  const { profile, loading: profileLoading } = useCareerProfile();
  const { apps } = useApplications();
  const name = currentUser?.name?.split(" ")[0] || "there";
  const role = profile?.targetRole || "";
  const kind = defaultKind(profile?.lookingFor);

  const [jobs, setJobs] = useState([]);
  const [jobsLoading, setJobsLoading] = useState(false);
  const [jobsError, setJobsError] = useState("");

  const fetchJobs = useCallback(async () => {
    if (!role) return;
    setJobsLoading(true);
    setJobsError("");
    try {
      const res = await axios.post(`${AI_URL}/jobs/search`, searchBody(role, kind));
      const list = res.data.jobs || [];
      setJobs(list);
      if (onJobsLoad) onJobsLoad(list);
    } catch {
      setJobsError("Could not load jobs. Check your connection and try again.");
    }
    setJobsLoading(false);
  }, [role, kind, onJobsLoad]);

  useEffect(() => {
    const t = setTimeout(fetchJobs, 0);
    return () => clearTimeout(t);
  }, [fetchJobs]);

  // The single most useful next action, from real profile data
  const interviewApp = apps.find((a) => a.status === "interview" && !(a.prep && a.prep.questions));
  const steps = profile
    ? [
        {
          done: profile.hasCv,
          title: "Upload your CV",
          detail: "We read your skills from it, so jobs, the skills comparison and interview practice can be personal to you.",
          cta: "Upload CV",
          go: () => onNavigate("profile", { tab: "skills" }),
        },
        {
          done: !!profile.gap && (profile.gapRole || "").toLowerCase() === role.toLowerCase(),
          title: "Compare your skills with real job postings",
          detail: `See which skills ${role || "your target role"} postings ask for that you don't list yet, with a learning plan.`,
          cta: "Run the comparison",
          go: () => onNavigate("profile", { tab: "gap" }),
        },
        {
          done: !!profile.ats,
          title: "Check your CV against a job description",
          detail: "Find the keywords a screening tool would miss before you apply.",
          cta: "Open the CV checker",
          go: () => onNavigate("ats"),
        },
        {
          done: apps.length > 0,
          title: "Save a job you like",
          detail: "Star a role in Jobs and it appears in your tracker, with its sponsor status.",
          cta: "Browse jobs",
          go: () => onNavigate("jobs"),
        },
      ]
    : [];
  const next = interviewApp
    ? {
        title: `Prepare for your interview at ${interviewApp.company}`,
        detail: "Build a pack from the job description: key requirements, practice questions and questions to ask.",
        cta: "Build my pack",
        go: () => onNavigate("profile", { tab: "interview" }),
      }
    : steps.find((s) => !s.done);

  // Roles that mention the type the student is after come first, senior roles go last, then sponsor-register employers
  const sponsored = [...jobs]
    .sort(
      (a, b) =>
        (matchesKind(b, kind) ? 1 : 0) - (matchesKind(a, kind) ? 1 : 0) ||
        (a.seniority === "senior" ? 1 : 0) - (b.seniority === "senior" ? 1 : 0) ||
        (b.visa_sponsor ? 1 : 0) - (a.visa_sponsor ? 1 : 0),
    )
    .slice(0, 6);
  const counts = ["saved", "applied", "interview", "offer"].map((st) => [st, apps.filter((a) => a.status === st).length]);
  const visaMonths = profile?.visaEndDate ? monthsUntil(profile.visaEndDate) : null;

  return (
    <div className="dash">
      <style>{CSS}</style>

      <header className="dash-head">
        <p className="iv-eyebrow">{greeting()}</p>
        <h1 className="dash-title iv-display">{name}, here's where you stand.</h1>
        <p className="dash-sub">
          {[role || "No target role yet", profile?.visaType, (profile?.lookingFor || []).join(", ")]
            .filter(Boolean)
            .join("  ·  ")}
        </p>
      </header>

      {profileLoading ? (
        <div className="dash-card dash-skeleton">Loading your profile…</div>
      ) : !role ? (
        <section className="dash-next iv-card">
          <p className="iv-eyebrow">Next step</p>
          <h2 className="dash-next-title iv-display">Choose the role you're aiming for</h2>
          <p className="dash-next-detail">Jobs, the skills comparison and interview practice all start from this.</p>
          <button className="iv-btn iv-btn--primary" onClick={() => onNavigate("profile", { tab: "overview" })}>
            Set my target role
          </button>
        </section>
      ) : next ? (
        <section className="dash-next iv-card">
          <p className="iv-eyebrow">Next step</p>
          <h2 className="dash-next-title iv-display">{next.title}</h2>
          <p className="dash-next-detail">{next.detail}</p>
          <button className="iv-btn iv-btn--primary" onClick={next.go}>{next.cta}</button>
        </section>
      ) : (
        <section className="dash-next iv-card">
          <p className="iv-eyebrow">Up to date</p>
          <h2 className="dash-next-title iv-display">You've done the essentials.</h2>
          <p className="dash-next-detail">Keep an eye out for new roles, and update your tracker as applications move.</p>
          <button className="iv-btn iv-btn--primary" onClick={() => onNavigate("jobs")}>Browse jobs</button>
        </section>
      )}

      <div className="dash-facts">
        {visaMonths !== null && (
          <div className="dash-fact iv-card">
            <span className="dash-fact-n iv-display">{visaMonths > 0 ? visaMonths : 0}</span>
            <span className="dash-fact-l">
              {visaMonths > 0 ? `months left on your ${profile.visaType || "visa"}` : "Your visa end date has passed"}
            </span>
          </div>
        )}
        {apps.length > 0 && (
          <button className="dash-fact dash-fact--btn iv-card" onClick={() => onNavigate("profile", { tab: "tracker" })}>
            <span className="dash-fact-n iv-display">{apps.length}</span>
            <span className="dash-fact-l">
              tracked: {counts.filter(([, n]) => n > 0).map(([st, n]) => `${n} ${st}`).join(", ")}
            </span>
          </button>
        )}
      </div>

      {role && (
        <section className="dash-section">
          <div className="dash-section-head">
            <h2 className="iv-display">Roles for {role}</h2>
            <button className="dash-link" onClick={() => onNavigate("jobs")}>See all →</button>
          </div>
          <p className="dash-note">
            London postings from Reed and Adzuna. A badge means the employer appears on the Home Office register of
            licensed sponsors. It doesn't guarantee that a particular role is sponsored.
          </p>

          {jobsLoading && <p className="dash-muted">Finding roles…</p>}
          {jobsError && (
            <p className="dash-error">
              {jobsError} <button className="dash-link" onClick={fetchJobs}>Try again</button>
            </p>
          )}
          {!jobsLoading && !jobsError && sponsored.length === 0 && (
            <p className="dash-muted">No roles came back for "{role}" just now.</p>
          )}

          <div className="dash-jobs">
            {sponsored.map((job, i) => (
              <button key={`${job.url || job.title}-${i}`} className="dash-job iv-card" onClick={() => onNavigate("jobDetail", job)}>
                <span className="dash-job-title">{job.title || "Untitled role"}</span>
                <span className="dash-job-co">{job.company || "Company"}</span>
                <span className="dash-job-meta">
                  {[job.salary && job.salary !== "Not specified" && job.salary !== "Salary not specified" ? job.salary : "", job.location]
                    .filter(Boolean)
                    .join("  ·  ")}
                </span>
                {job.visa_sponsor ? (
                  <span className="dash-badge dash-badge--ok">On sponsor register</span>
                ) : (
                  <span className="dash-badge">Sponsorship not confirmed</span>
                )}
              </button>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

const CSS = `
.dash { max-width: 1080px; margin: 0 auto; padding: clamp(2rem, 5vw, 3.5rem) clamp(1rem, 3vw, 2rem) 5rem; }
.dash-head { margin-bottom: 28px; }
.dash-title { font-size: clamp(2.1rem, 5vw, 3.2rem); margin: 10px 0 12px; font-weight: 400; }
.dash-sub { color: var(--c-ink-2); font-size: 0.95rem; margin: 0; }

.dash-next { padding: clamp(24px, 4vw, 40px); margin-bottom: 20px; box-shadow: var(--shadow); }
.dash-next-title { font-size: clamp(1.7rem, 3.5vw, 2.3rem); font-weight: 400; margin: 10px 0 12px; }
.dash-next-detail { color: var(--c-ink-2); font-size: 0.97rem; line-height: 1.6; max-width: 58ch; margin: 0 0 24px; }
.dash-skeleton { padding: 40px; color: var(--c-ink-3); }

.dash-facts { display: flex; gap: 16px; flex-wrap: wrap; margin-bottom: 44px; }
.dash-fact { display: flex; align-items: baseline; gap: 14px; padding: 16px 22px; text-align: left; font-family: inherit; color: inherit; }
.dash-fact--btn { cursor: pointer; transition: border-color var(--t) var(--ease); }
.dash-fact--btn:hover { border-color: var(--c-green); }
.dash-fact-n { font-size: 2.4rem; line-height: 1; color: var(--c-green); }
.dash-fact-l { font-size: 0.88rem; color: var(--c-ink-2); }

.dash-section-head { display: flex; align-items: baseline; justify-content: space-between; gap: 16px; }
.dash-section-head h2 { font-size: clamp(1.6rem, 3vw, 2rem); font-weight: 400; margin: 0; }
.dash-link { background: none; border: none; color: var(--c-green); font: 600 0.88rem var(--font-body); cursor: pointer; padding: 0; text-decoration: underline; text-underline-offset: 3px; }
.dash-note { font-size: 0.82rem; color: var(--c-ink-3); line-height: 1.55; max-width: 70ch; margin: 8px 0 22px; }
.dash-muted { color: var(--c-ink-3); font-size: 0.92rem; }
.dash-error { color: var(--c-danger); font-size: 0.92rem; }

.dash-jobs { display: grid; grid-template-columns: repeat(auto-fill, minmax(290px, 1fr)); gap: 16px; }
.dash-job { display: flex; flex-direction: column; align-items: flex-start; gap: 6px; padding: 20px; text-align: left; cursor: pointer; font-family: inherit; color: inherit; transition: border-color var(--t) var(--ease); }
.dash-job:hover { border-color: var(--c-green); }
.dash-job-title { font-size: 1.02rem; font-weight: 600; line-height: 1.35; }
.dash-job-co { font-size: 0.9rem; color: var(--c-ink-2); }
.dash-job-meta { font-size: 0.82rem; color: var(--c-ink-3); min-height: 1.2em; }
.dash-badge { margin-top: 8px; font-size: 0.72rem; font-weight: 600; padding: 4px 10px; border-radius: 999px; background: var(--c-line); color: var(--c-ink-2); }
.dash-badge--ok { background: var(--c-ok-soft); color: var(--c-ok); }

@media (max-width: 640px) { .dash-fact { width: 100%; } }
`;
