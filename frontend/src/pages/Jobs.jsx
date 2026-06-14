import { useState } from "react";
import axios from "axios";

// ─────────────────────────────────────────────────────────────
// JOBS PAGE  ·  Arivo AI
// Search visa-sponsored roles across every field.
// Backend now returns per job:
//   company, title, location, salary, visa_sponsor, url,
//   source, fetched_at, description, created, contract_time,
//   contract_type
// Saved jobs + recent searches persist locally (no backend).
// ─────────────────────────────────────────────────────────────

const SAVED_KEY = "arivo:savedJobs";
const RECENT_KEY = "arivo:recentSearches";

const readLS = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};
const writeLS = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage off */
  }
};

const jobKey = (j) => j.url || `${j.title}__${j.company}`;

// "Posted X ago" from an ISO date — returns "" if unparseable
const postedAgo = (iso) => {
  if (!iso) return "";
  const then = new Date(iso);
  if (isNaN(then)) return "";
  const days = Math.floor((Date.now() - then.getTime()) / 86400000);
  if (days <= 0) return "Posted today";
  if (days === 1) return "Posted yesterday";
  if (days < 7) return `Posted ${days} days ago`;
  if (days < 14) return "Posted 1 week ago";
  if (days < 30) return `Posted ${Math.floor(days / 7)} weeks ago`;
  if (days < 60) return "Posted 1 month ago";
  return `Posted ${Math.floor(days / 30)} months ago`;
};

// Map Adzuna contract fields → a clean label, or "" if none
const jobType = (time, type) => {
  const t = (time || "").toLowerCase();
  const k = (type || "").toLowerCase();
  if (k === "contract") return "Contract";
  if (t === "part_time") return "Part-time";
  if (t === "full_time") return k === "permanent" ? "Full-time" : "Full-time";
  if (k === "permanent") return "Permanent";
  return "";
};

// Safety net: collapse "£80,000 - £80,000" → "£80,000" for old cached data
const cleanSalary = (s) => {
  if (!s || typeof s !== "string") return s;
  const m = s.match(/^(£[\d,]+)\s*-\s*(£[\d,]+)$/);
  if (m && m[1] === m[2]) return m[1];
  return s;
};

// ── Icons ─────────────────────────────────────────────────────
const SearchIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <circle cx="11" cy="11" r="7" />
    <path d="m21 21-4.3-4.3" />
  </svg>
);
const ShieldCheck = ({ size = 13 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M12 2 4 5v6c0 5 3.4 8.4 8 11 4.6-2.6 8-6 8-11V5z" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);
const Arrow = () => (
  <svg
    className="aj-arrow"
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.4"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M5 12h14" />
    <path d="m13 6 6 6-6 6" />
  </svg>
);
const Bookmark = ({ filled }) => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill={filled ? "currentColor" : "none"}
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
  </svg>
);
const Close = () => (
  <svg
    width="15"
    height="15"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
    aria-hidden="true"
  >
    <path d="M18 6 6 18M6 6l12 12" />
  </svg>
);
const Chevron = ({ open }) => (
  <svg
    width="15"
    height="15"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    style={{
      transform: open ? "rotate(180deg)" : "none",
      transition: "transform .2s",
    }}
  >
    <path d="m6 9 6 6 6-6" />
  </svg>
);
const Clock = () => (
  <svg
    width="12"
    height="12"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </svg>
);

// Deterministic hue per company so logo squares aren't all identical
const hueFor = (name = "") => {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % 360;
  return h;
};

// ── Job card (with accordion description) ─────────────────────
function JobCard({ job, saved, onToggleSave }) {
  const [open, setOpen] = useState(false);
  const posted = postedAgo(job.created);
  const type = jobType(job.contract_time, job.contract_type);
  const salary = cleanSalary(job.salary);
  const hasDesc = !!(job.description && job.description.trim());
  const hue = hueFor(job.company);

  return (
    <article className={`aj-card ${open ? "is-open" : ""}`}>
      <div
        className={`aj-card-main ${hasDesc ? "is-clickable" : ""}`}
        onClick={() => hasDesc && setOpen((o) => !o)}
        role={hasDesc ? "button" : undefined}
        tabIndex={hasDesc ? 0 : undefined}
        onKeyDown={(e) =>
          hasDesc &&
          (e.key === "Enter" || e.key === " ") &&
          (e.preventDefault(), setOpen((o) => !o))
        }
        aria-expanded={hasDesc ? open : undefined}
      >
        <div className="aj-card-left">
          <div
            className="aj-logo"
            style={{
              background: `linear-gradient(135deg, hsla(${hue},70%,60%,.18), hsla(${hue + 40},70%,55%,.18))`,
              borderColor: `hsla(${hue},70%,60%,.35)`,
              color: `hsl(${hue},75%,72%)`,
            }}
          >
            {job.company?.[0]?.toUpperCase() || "?"}
          </div>

          <div className="aj-card-body">
            <div className="aj-job-title">{job.title}</div>
            <div className="aj-job-meta">
              {job.company} · {job.location}
            </div>
            <div className="aj-badges">
              {job.visa_sponsor && (
                <span className="aj-badge aj-badge--verified">
                  <ShieldCheck size={11} /> Skilled Worker sponsor
                </span>
              )}
              {salary !== "Salary not specified" && (
                <span className="aj-badge aj-badge--salary">{salary}</span>
              )}
              {type && <span className="aj-badge aj-badge--type">{type}</span>}
            </div>
            {posted && (
              <div className="aj-posted">
                <Clock /> {posted}
              </div>
            )}
          </div>
        </div>

        <div className="aj-actions">
          <button
            className={`aj-save ${saved ? "is-saved" : ""}`}
            onClick={(e) => {
              e.stopPropagation();
              onToggleSave(job);
            }}
            aria-pressed={saved}
            aria-label={saved ? "Remove from saved" : "Save role"}
            title={saved ? "Saved" : "Save"}
          >
            <Bookmark filled={saved} />
          </button>
          {job.url && (
            <a
              className="aj-apply"
              href={job.url}
              target="_blank"
              rel="noreferrer"
              onClick={(e) => e.stopPropagation()}
            >
              Apply <Arrow />
            </a>
          )}
          {hasDesc && (
            <span className="aj-expand" aria-hidden="true">
              <Chevron open={open} />
            </span>
          )}
        </div>
      </div>

      {open && hasDesc && (
        <div className="aj-desc">
          <p>
            {job.description}
            {job.description.length >= 290 ? "…" : ""}
          </p>
          {job.url && (
            <a
              className="aj-desc-link"
              href={job.url}
              target="_blank"
              rel="noreferrer"
            >
              View full listing <Arrow />
            </a>
          )}
        </div>
      )}
    </article>
  );
}

function Jobs() {
  const [query, setQuery] = useState("");
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState(false);

  const [visaOnly, setVisaOnly] = useState(false);
  const [sortBy, setSortBy] = useState("match");
  const [showSaved, setShowSaved] = useState(false);

  const [savedJobs, setSavedJobs] = useState(() => readLS(SAVED_KEY, []));
  const [recent, setRecent] = useState(() => readLS(RECENT_KEY, []));

  const runSearch = async (term) => {
    const q = (term ?? query).trim();
    if (!q) return;
    setQuery(q);
    setShowSaved(false);
    setLoading(true);
    setSearched(true);
    setError(false);
    setJobs([]);
    try {
      const res = await axios.post(
        `${import.meta.env.VITE_AI_URL}/jobs/search`,
        {
          query: q,
        },
      );
      setJobs(res.data.jobs || []);
      const next = [
        q,
        ...recent.filter((r) => r.toLowerCase() !== q.toLowerCase()),
      ].slice(0, 6);
      setRecent(next);
      writeLS(RECENT_KEY, next);
    } catch {
      setError(true);
    }
    setLoading(false);
  };

  const isSaved = (job) => savedJobs.some((s) => jobKey(s) === jobKey(job));
  const toggleSave = (job) => {
    const next = isSaved(job)
      ? savedJobs.filter((s) => jobKey(s) !== jobKey(job))
      : [job, ...savedJobs];
    setSavedJobs(next);
    writeLS(SAVED_KEY, next);
  };

  const clearAll = () => {
    setQuery("");
    setJobs([]);
    setSearched(false);
    setError(false);
    setShowSaved(false);
  };

  const base = showSaved ? savedJobs : jobs;
  const filtered = visaOnly ? base.filter((j) => j.visa_sponsor) : base;
  const displayed =
    sortBy === "sponsors"
      ? [...filtered].sort(
          (a, b) => (b.visa_sponsor ? 1 : 0) - (a.visa_sponsor ? 1 : 0),
        )
      : filtered;
  const sponsorCount = base.filter((j) => j.visa_sponsor).length;
  const showToolbar =
    (showSaved || (searched && !loading && !error)) && base.length > 0;

  return (
    <div className="aj">
      <style>{styles}</style>

      {/* Header */}
      <header className="aj-head">
        <h1 className="aj-title">Find your next role</h1>
        <p className="aj-sub">
          Search London roles in any field — every listing checked for visa
          sponsorship against the official Home Office register.
        </p>
      </header>

      {/* Search */}
      <div className="aj-searchbar">
        <span className="aj-search-ic">
          <SearchIcon />
        </span>
        <input
          className="aj-input"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && runSearch()}
          placeholder="e.g. teacher, nurse, ML engineer, finance analyst, lawyer…"
          aria-label="Search for roles"
        />
        {query && (
          <button
            className="aj-clear"
            onClick={clearAll}
            aria-label="Clear search"
          >
            <Close />
          </button>
        )}
        <button
          className="aj-go"
          onClick={() => runSearch()}
          disabled={loading}
          aria-label="Search jobs"
        >
          {loading ? "Searching…" : "Search"}
        </button>
      </div>

      {/* Discovery (pre-search) */}
      {!searched && !showSaved && (
        <>
          {/* Value props fill the empty space */}
          <div className="aj-props">
            <div className="aj-prop">
              <div className="aj-prop-ic">{<ShieldCheck size={18} />}</div>
              <div className="aj-prop-title">Verified sponsors</div>
              <div className="aj-prop-sub">
                Every role checked against the official Home Office register
              </div>
            </div>
            <div className="aj-prop">
              <div className="aj-prop-ic">{<Clock />}</div>
              <div className="aj-prop-title">Live London jobs</div>
              <div className="aj-prop-sub">
                Fresh listings pulled in real time, dated so you skip stale
                leads
              </div>
            </div>
            <div className="aj-prop">
              <div className="aj-prop-ic">{<SearchIcon />}</div>
              <div className="aj-prop-title">Every field</div>
              <div className="aj-prop-sub">
                Tech, healthcare, finance, law, teaching — not just developers
              </div>
            </div>
          </div>

          {recent.length > 0 && (
            <section className="aj-block">
              <div className="aj-block-head">
                <div className="aj-eyebrow">Recent</div>
                <button
                  className="aj-text-btn"
                  onClick={() => {
                    setRecent([]);
                    writeLS(RECENT_KEY, []);
                  }}
                >
                  Clear
                </button>
              </div>
              <div className="aj-chips">
                {recent.map((term) => (
                  <button
                    key={term}
                    className="aj-chip"
                    onClick={() => runSearch(term)}
                  >
                    {term}
                  </button>
                ))}
              </div>
            </section>
          )}

          <section className="aj-block">
            <div className="aj-eyebrow">Popular searches</div>
            <div className="aj-chips">
              {[
                "ML engineer",
                "data scientist",
                "software engineer",
                "teacher",
                "nurse",
                "finance analyst",
                "product manager",
                "UX designer",
                "lawyer",
                "pharmacist",
                "data analyst",
                "DevOps engineer",
              ].map((term) => (
                <button
                  key={term}
                  className="aj-chip"
                  onClick={() => runSearch(term)}
                >
                  {term}
                </button>
              ))}
            </div>
          </section>

          {savedJobs.length > 0 && (
            <button
              className="aj-saved-entry"
              onClick={() => setShowSaved(true)}
            >
              <Bookmark filled />
              <span>View saved roles</span>
              <span className="aj-saved-count">{savedJobs.length}</span>
            </button>
          )}
        </>
      )}

      {/* Toolbar */}
      {showToolbar && (
        <div className="aj-toolbar">
          <div className="aj-context">
            {showSaved ? (
              <button className="aj-back" onClick={() => setShowSaved(false)}>
                ← Back to search
              </button>
            ) : (
              <div className="aj-count">
                <strong>{displayed.length}</strong>{" "}
                {displayed.length === 1 ? "role" : "roles"}
                {sponsorCount > 0 && (
                  <span className="aj-ratio">
                    <ShieldCheck size={12} /> {sponsorCount} sponsor{" "}
                    {sponsorCount === 1 ? "visas" : "visas"}
                  </span>
                )}
              </div>
            )}
          </div>
          <div className="aj-controls">
            <div className="aj-seg" role="group" aria-label="Sort">
              <button
                className={sortBy === "match" ? "is-active" : ""}
                onClick={() => setSortBy("match")}
              >
                Best match
              </button>
              <button
                className={sortBy === "sponsors" ? "is-active" : ""}
                onClick={() => setSortBy("sponsors")}
              >
                Sponsors first
              </button>
            </div>
            <button
              className={`aj-toggle ${visaOnly ? "is-on" : ""}`}
              onClick={() => setVisaOnly(!visaOnly)}
              aria-pressed={visaOnly}
            >
              <ShieldCheck /> Visa only
            </button>
          </div>
        </div>
      )}

      {/* Loading skeletons */}
      {loading && (
        <div aria-live="polite">
          <p className="aj-note">
            Checking the Home Office sponsor register and live listings…
          </p>
          {[0, 1, 2].map((i) => (
            <div className="aj-card aj-card--skel" key={i}>
              <div className="aj-card-main">
                <div className="aj-card-left">
                  <div className="aj-skel aj-skel-logo" />
                  <div style={{ flex: 1 }}>
                    <div
                      className="aj-skel"
                      style={{ width: "55%", height: 14, marginBottom: 8 }}
                    />
                    <div
                      className="aj-skel"
                      style={{ width: "38%", height: 11, marginBottom: 10 }}
                    />
                    <div
                      className="aj-skel"
                      style={{ width: 130, height: 18, borderRadius: 999 }}
                    />
                  </div>
                </div>
                <div
                  className="aj-skel"
                  style={{ width: 76, height: 34, borderRadius: 10 }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="aj-state aj-state--error">
          <div className="aj-state-title">Couldn't reach the job service</div>
          <div className="aj-state-sub">
            The search server didn't respond. Make sure it's running on port
            8000, then try again.
          </div>
          <button className="aj-retry" onClick={() => runSearch()}>
            Try again
          </button>
        </div>
      )}

      {/* Empty (no matches) */}
      {!loading &&
        !error &&
        (searched || showSaved) &&
        displayed.length === 0 && (
          <div className="aj-state">
            <div className="aj-state-title">
              {showSaved
                ? "No saved roles yet"
                : `No roles match “${query}” yet`}
            </div>
            <div className="aj-state-sub">
              {showSaved
                ? "Tap the bookmark on any role to keep it here."
                : visaOnly
                  ? "Turn off the visa filter, or try a broader search term."
                  : "Try a broader term — or search a related job title."}
            </div>
          </div>
        )}

      {/* Results */}
      {!loading &&
        !error &&
        displayed.map((job) => (
          <JobCard
            key={jobKey(job)}
            job={job}
            saved={isSaved(job)}
            onToggleSave={toggleSave}
          />
        ))}

      {/* Scroll-end cue */}
      {!loading && !error && displayed.length >= 6 && (
        <div className="aj-end">
          You've reached the end · {displayed.length} roles shown
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
const styles = `
.aj {
  --brand-1:#667eea; --brand-2:#764ba2;
  --verify-1:#11998e; --verify-2:#38ef7d;
  --surface:#15152a; --surface-2:#1b1b34;
  --border:rgba(255,255,255,.07); --border-hi:rgba(102,126,234,.40);
  --text:#f5f5fa; --text-2:#9595aa; --text-3:#6a6a80;
  --r-card:16px; --r-field:14px;

  max-width:860px; margin:0 auto; padding:1.75rem 1.5rem 4rem; color:var(--text);
  font-family:ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;
}
.aj button:focus-visible, .aj a:focus-visible, .aj [role=button]:focus-visible { outline:2px solid var(--brand-1); outline-offset:2px; }

/* Header */
.aj-head { margin-bottom:1.5rem; }
.aj-title { margin:0 0 6px; font-size:26px; font-weight:700; letter-spacing:-.025em; line-height:1.1; }
.aj-sub { margin:0; max-width:540px; font-size:13.5px; line-height:1.55; color:var(--text-2); }

/* Search */
.aj-searchbar { display:flex; align-items:center; gap:8px; background:var(--surface); border:1px solid var(--border); border-radius:var(--r-field); padding:6px 6px 6px 16px; transition:border-color .2s, box-shadow .2s, background .2s; }
.aj-searchbar:focus-within { border-color:var(--brand-1); box-shadow:0 0 0 4px rgba(102,126,234,.15); background:#181834; }
.aj-search-ic { display:flex; color:var(--text-3); transition:color .2s; }
.aj-searchbar:focus-within .aj-search-ic { color:var(--brand-1); }
.aj-input { flex:1; min-width:0; background:transparent; border:none; outline:none; color:var(--text); font-size:15px; padding:9px 0; }
.aj-input::placeholder { color:#5a5a72; }
.aj-clear { display:flex; align-items:center; justify-content:center; width:30px; height:30px; border:none; background:transparent; color:var(--text-3); cursor:pointer; border-radius:8px; transition:all .15s; }
.aj-clear:hover { color:var(--text); background:rgba(255,255,255,.06); }
.aj-go { flex-shrink:0; padding:10px 22px; border:none; border-radius:10px; background:linear-gradient(135deg,var(--brand-1),var(--brand-2)); color:#fff; font-size:13.5px; font-weight:600; cursor:pointer; transition:filter .18s, transform .12s; }
.aj-go:hover:not(:disabled) { filter:brightness(1.12); }
.aj-go:active:not(:disabled) { transform:scale(.97); }
.aj-go:disabled { opacity:.6; cursor:not-allowed; }

/* Value props (empty state) */
.aj-props { display:grid; grid-template-columns:repeat(3,1fr); gap:12px; margin-top:1.5rem; }
.aj-prop { background:var(--surface); border:1px solid var(--border); border-radius:14px; padding:18px; transition:border-color .18s, transform .18s; }
.aj-prop:hover { border-color:var(--border-hi); transform:translateY(-2px); }
.aj-prop-ic { width:38px; height:38px; border-radius:10px; display:flex; align-items:center; justify-content:center; color:var(--brand-1); background:rgba(102,126,234,.12); border:1px solid rgba(102,126,234,.22); margin-bottom:12px; }
.aj-prop-title { font-size:13.5px; font-weight:600; margin-bottom:5px; }
.aj-prop-sub { font-size:12px; color:var(--text-3); line-height:1.5; }

/* Blocks + chips */
.aj-block { margin-top:1.5rem; }
.aj-block-head { display:flex; align-items:center; justify-content:space-between; margin-bottom:10px; }
.aj-eyebrow { font-size:11px; font-weight:600; letter-spacing:.08em; text-transform:uppercase; color:var(--text-3); }
.aj-text-btn { border:none; background:none; color:var(--text-3); font-size:11px; cursor:pointer; transition:color .15s; }
.aj-text-btn:hover { color:var(--text); }
.aj-chips { display:flex; flex-wrap:wrap; gap:8px; }
.aj-chip { padding:7px 14px; border-radius:999px; cursor:pointer; background:transparent; border:1px solid var(--border); color:var(--text-2); font-size:12.5px; transition:all .16s; }
.aj-chip:hover { border-color:var(--border-hi); color:var(--text); background:rgba(102,126,234,.08); transform:translateY(-1px); }

.aj-saved-entry { display:inline-flex; align-items:center; gap:9px; margin-top:1.75rem; padding:10px 16px; background:var(--surface); border:1px solid var(--border); border-radius:12px; color:var(--text-2); font-size:13px; font-weight:600; cursor:pointer; transition:all .18s; }
.aj-saved-entry:hover { border-color:var(--border-hi); color:var(--text); }
.aj-saved-count { background:rgba(102,126,234,.20); color:#8b9bff; border-radius:999px; padding:1px 9px; font-size:12px; }

/* Toolbar */
.aj-toolbar { display:flex; align-items:center; justify-content:space-between; gap:12px; margin:1.5rem 0 1rem; flex-wrap:wrap; }
.aj-count { display:flex; align-items:center; gap:12px; font-size:13px; color:var(--text-2); flex-wrap:wrap; }
.aj-count strong { color:var(--text); font-weight:600; }
.aj-ratio { display:inline-flex; align-items:center; gap:5px; font-size:12px; font-weight:600; color:var(--verify-2); background:rgba(17,153,142,.12); border:1px solid rgba(17,153,142,.3); padding:3px 10px; border-radius:999px; }
.aj-back { border:none; background:none; color:var(--text-2); font-size:13px; font-weight:600; cursor:pointer; padding:0; transition:color .15s; }
.aj-back:hover { color:var(--text); }
.aj-controls { display:flex; align-items:center; gap:8px; flex-wrap:wrap; }
.aj-seg { display:inline-flex; background:var(--surface); border:1px solid var(--border); border-radius:10px; padding:3px; }
.aj-seg button { padding:6px 12px; border:none; background:transparent; color:var(--text-2); font-size:12px; font-weight:600; border-radius:7px; cursor:pointer; transition:all .15s; }
.aj-seg button:hover { color:var(--text); }
.aj-seg button.is-active { background:rgba(102,126,234,.18); color:var(--text); }
.aj-toggle { display:inline-flex; align-items:center; gap:7px; padding:7px 14px; border-radius:999px; cursor:pointer; background:transparent; border:1px solid var(--verify-1); color:var(--verify-1); font-size:12.5px; font-weight:600; transition:all .18s; }
.aj-toggle:hover { background:rgba(17,153,142,.10); }
.aj-toggle.is-on { background:linear-gradient(135deg,var(--verify-1),var(--verify-2)); color:#06241f; border-color:transparent; }

/* Cards */
.aj-note { font-size:12.5px; color:var(--text-3); margin:0 0 12px; }
.aj-card { background:var(--surface); border:1px solid var(--border); border-radius:var(--r-card); margin-bottom:12px; transition:border-color .18s, background .18s; overflow:hidden; }
.aj-card.is-open { border-color:var(--border-hi); }
.aj-card-main { display:flex; align-items:center; justify-content:space-between; gap:16px; padding:18px 20px; transition:transform .18s, background .18s; }
.aj-card-main.is-clickable { cursor:pointer; }
.aj-card:not(.aj-card--skel):not(.is-open) .aj-card-main.is-clickable:hover { transform:translateY(-2px); background:var(--surface-2); }
.aj-card-left { display:flex; align-items:center; gap:14px; flex:1; min-width:0; }
.aj-logo { width:46px; height:46px; flex-shrink:0; border-radius:12px; display:flex; align-items:center; justify-content:center; border:1px solid; font-size:17px; font-weight:700; }
.aj-card-body { min-width:0; }
.aj-job-title { font-size:15px; font-weight:600; color:var(--text); margin-bottom:3px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.aj-job-meta { font-size:12.5px; color:var(--text-2); margin-bottom:8px; }
.aj-badges { display:flex; gap:6px; flex-wrap:wrap; }
.aj-badge { display:inline-flex; align-items:center; gap:5px; font-size:11px; font-weight:500; padding:3px 9px; border-radius:999px; }
.aj-badge--verified { background:rgba(17,153,142,.14); color:#38ef7d; border:1px solid rgba(17,153,142,.40); }
.aj-badge--salary { background:rgba(102,126,234,.14); color:#8b9bff; border:1px solid rgba(102,126,234,.30); }
.aj-badge--type { background:rgba(255,255,255,.05); color:var(--text-2); border:1px solid rgba(255,255,255,.10); }
.aj-posted { display:flex; align-items:center; gap:5px; font-size:11px; color:var(--text-3); margin-top:8px; }

.aj-actions { display:flex; align-items:center; gap:8px; flex-shrink:0; }
.aj-save { display:flex; align-items:center; justify-content:center; width:38px; height:38px; border:1px solid var(--border); background:transparent; color:var(--text-3); border-radius:10px; cursor:pointer; transition:all .18s; }
.aj-save:hover { color:var(--text); border-color:var(--border-hi); }
.aj-save.is-saved { color:var(--brand-1); border-color:var(--border-hi); background:rgba(102,126,234,.10); }
.aj-apply { display:inline-flex; align-items:center; gap:6px; padding:9px 16px; border-radius:10px; text-decoration:none; background:linear-gradient(135deg,var(--brand-1),var(--brand-2)); color:#fff; font-size:12.5px; font-weight:600; transition:filter .18s; }
.aj-apply:hover { filter:brightness(1.12); }
.aj-arrow { transition:transform .18s; }
.aj-apply:hover .aj-arrow { transform:translateX(3px); }
.aj-expand { display:flex; align-items:center; color:var(--text-3); }

/* Accordion description */
.aj-desc { padding:0 20px 18px 80px; animation:aj-open .22s ease; }
@keyframes aj-open { from { opacity:0; transform:translateY(-4px); } to { opacity:1; transform:translateY(0); } }
.aj-desc p { margin:0 0 12px; font-size:13px; line-height:1.65; color:var(--text-2); }
.aj-desc-link { display:inline-flex; align-items:center; gap:6px; font-size:12.5px; font-weight:600; color:var(--brand-1); text-decoration:none; }
.aj-desc-link:hover { text-decoration:underline; }

/* States */
.aj-state { background:var(--surface); border:1px solid var(--border); border-radius:var(--r-card); padding:28px; text-align:center; margin-top:1rem; }
.aj-state--error { border-color:rgba(244,99,99,.25); }
.aj-state-title { font-size:14.5px; font-weight:600; color:var(--text); margin-bottom:6px; }
.aj-state-sub { font-size:12.5px; color:var(--text-3); line-height:1.5; }
.aj-retry { margin-top:14px; padding:8px 18px; border:none; border-radius:9px; background:linear-gradient(135deg,var(--brand-1),var(--brand-2)); color:#fff; font-size:12.5px; font-weight:600; cursor:pointer; transition:filter .18s; }
.aj-retry:hover { filter:brightness(1.12); }

.aj-end { text-align:center; font-size:11.5px; color:var(--text-3); padding:18px 0 4px; }

/* Skeleton */
.aj-skel { background:linear-gradient(90deg,#1a1a30 25%,#26263f 50%,#1a1a30 75%); background-size:200% 100%; animation:aj-shimmer 1.4s ease-in-out infinite; border-radius:6px; }
.aj-skel-logo { width:46px; height:46px; border-radius:12px; flex-shrink:0; }
@keyframes aj-shimmer { 0% { background-position:200% 0; } 100% { background-position:-200% 0; } }

/* Quality floor */
@media (prefers-reduced-motion: reduce) { .aj * { animation:none !important; transition:none !important; } }
@media (max-width:600px) {
  .aj-props { grid-template-columns:1fr; }
}
@media (max-width:560px) {
  .aj { padding:1.25rem 1rem 3rem; }
  .aj-card-main { flex-direction:column; align-items:stretch; }
  .aj-actions { justify-content:space-between; }
  .aj-apply { flex:1; justify-content:center; }
  .aj-desc { padding-left:20px; }
  .aj-toolbar { gap:10px; }
}
`;

export default Jobs;
