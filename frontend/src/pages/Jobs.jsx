import { useState } from "react";
import axios from "axios";

// ─────────────────────────────────────────────────────────────
// JOBS PAGE · Arivo AI
// Full-bleed master-detail: scannable list (left) + full description
// panel (right). Palette matches the new Dashboard + Landing.
// Saved roles + recent searches persist locally. No fake data.
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

const jobType = (time, type) => {
  const t = (time || "").toLowerCase();
  const k = (type || "").toLowerCase();
  if (k === "contract") return "Contract";
  if (t === "part_time") return "Part-time";
  if (t === "full_time") return "Full-time";
  if (k === "permanent") return "Permanent";
  return "";
};

const cleanSalary = (s) => {
  if (!s || typeof s !== "string") return s;
  const m = s.match(/^(£[\d,]+)\s*-\s*(£[\d,]+)$/);
  if (m && m[1] === m[2]) return m[1];
  return s;
};

const hueFor = (name = "") => {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % 360;
  return h;
};

// ── Icons ─────────────────────────────────────────────────────
const SearchIcon = ({ size = 18 }) => (
  <svg
    width={size}
    height={size}
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
const Clock = ({ size = 12 }) => (
  <svg
    width={size}
    height={size}
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
const Back = () => (
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
  >
    <path d="M19 12H5M11 18l-6-6 6-6" />
  </svg>
);

// ── Compact list card ─────────────────────────────────────────
function ListCard({ job, active, saved, onSelect, onToggleSave }) {
  const posted = postedAgo(job.created);
  const type = jobType(job.contract_time, job.contract_type);
  const salary = cleanSalary(job.salary);
  const hue = hueFor(job.company);

  return (
    <div
      className={`aj-lc ${active ? "is-active" : ""}`}
      onClick={() => onSelect(job)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) =>
        (e.key === "Enter" || e.key === " ") &&
        (e.preventDefault(), onSelect(job))
      }
    >
      <div className="aj-lc-top">
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
        <button
          className={`aj-save-sm ${saved ? "is-saved" : ""}`}
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
      </div>
      <div className="aj-lc-title">{job.title}</div>
      <div className="aj-lc-meta">
        {job.company} · {job.location}
      </div>
      <div className="aj-lc-badges">
        {job.visa_sponsor && (
          <span className="aj-badge aj-badge--verified">
            <ShieldCheck size={10} /> Sponsor
          </span>
        )}
        {salary && salary !== "Salary not specified" && (
          <span className="aj-badge aj-badge--salary">{salary}</span>
        )}
        {type && <span className="aj-badge aj-badge--type">{type}</span>}
      </div>
      {posted && (
        <div className="aj-lc-posted">
          <Clock size={11} /> {posted}
        </div>
      )}
    </div>
  );
}

// ── Detail panel (the in-app description view) ────────────────
function Detail({ job, saved, onToggleSave, onClose }) {
  if (!job) {
    return (
      <div className="aj-detail-empty">
        <div className="aj-detail-empty-ic">📋</div>
        <div className="aj-detail-empty-t">
          Select a role to see the details
        </div>
        <div className="aj-detail-empty-s">
          Full description, salary, and whether they can sponsor your visa — all
          in one place.
        </div>
      </div>
    );
  }

  const posted = postedAgo(job.created);
  const type = jobType(job.contract_time, job.contract_type);
  const salary = cleanSalary(job.salary);
  const hue = hueFor(job.company);
  const hasDesc = !!(job.description && job.description.trim());
  // Split the snippet into readable paragraphs
  const paras = hasDesc
    ? job.description
        .split(/\n+/)
        .map((p) => p.trim())
        .filter(Boolean)
    : [];

  return (
    <div className="aj-detail-inner">
      <button className="aj-detail-back" onClick={onClose}>
        <Back /> Back to list
      </button>

      <div className="aj-detail-head">
        <div
          className="aj-logo aj-logo-lg"
          style={{
            background: `linear-gradient(135deg, hsla(${hue},70%,60%,.18), hsla(${hue + 40},70%,55%,.18))`,
            borderColor: `hsla(${hue},70%,60%,.35)`,
            color: `hsl(${hue},75%,72%)`,
          }}
        >
          {job.company?.[0]?.toUpperCase() || "?"}
        </div>
        <div style={{ minWidth: 0 }}>
          <h2 className="aj-detail-title">{job.title}</h2>
          <div className="aj-detail-company">
            {job.company} · {job.location}
          </div>
        </div>
      </div>

      {/* Plain-English facts */}
      <div className="aj-facts">
        {salary && salary !== "Salary not specified" && (
          <div className="aj-fact">
            <div className="aj-fact-lbl">Salary</div>
            <div className="aj-fact-val">{salary}</div>
          </div>
        )}
        {type && (
          <div className="aj-fact">
            <div className="aj-fact-lbl">Type</div>
            <div className="aj-fact-val">{type}</div>
          </div>
        )}
        {posted && (
          <div className="aj-fact">
            <div className="aj-fact-lbl">Posted</div>
            <div className="aj-fact-val">{posted.replace("Posted ", "")}</div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="aj-detail-actions">
        {job.url && (
          <a
            className="aj-apply"
            href={job.url}
            target="_blank"
            rel="noreferrer"
          >
            Apply on employer site <Arrow />
          </a>
        )}
        <button
          className={`aj-save ${saved ? "is-saved" : ""}`}
          onClick={() => onToggleSave(job)}
          aria-pressed={saved}
        >
          <Bookmark filled={saved} /> {saved ? "Saved" : "Save"}
        </button>
      </div>

      {/* What sponsorship means — honest, plain-English */}
      <div className={`aj-visa ${job.visa_sponsor ? "is-ok" : "is-unknown"}`}>
        <div className="aj-visa-ic">
          {job.visa_sponsor ? <ShieldCheck size={16} /> : "?"}
        </div>
        <div>
          <div className="aj-visa-t">
            {job.visa_sponsor
              ? "This company can sponsor your visa"
              : "Sponsorship not confirmed"}
          </div>
          <div className="aj-visa-s">
            {job.visa_sponsor
              ? `${job.company} is on the UK government's official Skilled Worker register — that means they're licensed to sponsor a work visa for an international hire.`
              : `We couldn't match ${job.company} on the official sponsor register. They might still sponsor — it's worth confirming with them directly before you apply.`}
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="aj-section-h">About this role</div>
      {hasDesc ? (
        <div className="aj-desc-body">
          {paras.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
          {job.description.length >= 290 && (
            <p className="aj-desc-more">
              This is a preview from the listing. The full job description is on
              the employer's site.
            </p>
          )}
        </div>
      ) : (
        <div className="aj-desc-body">
          <p>
            No description was provided for this role. Open the full listing to
            read more.
          </p>
        </div>
      )}

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
  const [tab, setTab] = useState("results"); // results | saved

  const [savedJobs, setSavedJobs] = useState(() => readLS(SAVED_KEY, []));
  const [recent, setRecent] = useState(() => readLS(RECENT_KEY, []));
  const [selectedKey, setSelectedKey] = useState(null);

  const runSearch = async (term) => {
    const q = (term ?? query).trim();
    if (!q) return;
    setQuery(q);
    setTab("results");
    setLoading(true);
    setSearched(true);
    setError(false);
    setJobs([]);
    setSelectedKey(null);
    try {
      const res = await axios.post(
        `${import.meta.env.VITE_AI_URL}/jobs/search`,
        { query: q },
      );
      const list = res.data.jobs || [];
      setJobs(list);
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
    setTab("results");
    setSelectedKey(null);
  };

  const base = tab === "saved" ? savedJobs : jobs;
  const filtered = visaOnly ? base.filter((j) => j.visa_sponsor) : base;
  const displayed =
    sortBy === "sponsors"
      ? [...filtered].sort(
          (a, b) => (b.visa_sponsor ? 1 : 0) - (a.visa_sponsor ? 1 : 0),
        )
      : filtered;

  const active =
    displayed.find((j) => jobKey(j) === selectedKey) || displayed[0] || null;
  const sponsorCount = base.filter((j) => j.visa_sponsor).length;

  const showSplit =
    (tab === "saved" && savedJobs.length > 0) ||
    (tab === "results" && searched && !loading && !error && jobs.length > 0);

  const showDiscovery = tab === "results" && !searched && !loading;

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

      {/* Tabs (always available once there's something to show) */}
      {(searched || savedJobs.length > 0) && (
        <div className="aj-tabs">
          <div className="aj-tabset">
            <button
              className={tab === "results" ? "is-active" : ""}
              onClick={() => {
                setTab("results");
                setSelectedKey(null);
              }}
            >
              Results{jobs.length > 0 ? ` (${jobs.length})` : ""}
            </button>
            <button
              className={tab === "saved" ? "is-active" : ""}
              onClick={() => {
                setTab("saved");
                setSelectedKey(null);
              }}
            >
              Saved{savedJobs.length > 0 ? ` (${savedJobs.length})` : ""}
            </button>
          </div>
          {showSplit && (
            <div className="aj-controls">
              <div className="aj-seg" role="group" aria-label="Sort">
                <button
                  className={sortBy === "match" ? "is-active" : ""}
                  onClick={() => setSortBy("match")}
                >
                  {tab === "saved" ? "Recently saved" : "Best match"}
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
          )}
        </div>
      )}

      {/* Discovery (pre-search) */}
      {showDiscovery && (
        <>
          <div className="aj-props">
            <div className="aj-prop">
              <div className="aj-prop-ic">
                <ShieldCheck size={18} />
              </div>
              <div className="aj-prop-title">Verified sponsors</div>
              <div className="aj-prop-sub">
                Every role checked against the official Home Office register
              </div>
            </div>
            <div className="aj-prop">
              <div className="aj-prop-ic">
                <Clock size={18} />
              </div>
              <div className="aj-prop-title">Live London jobs</div>
              <div className="aj-prop-sub">
                Fresh listings pulled in real time, dated so you skip stale
                leads
              </div>
            </div>
            <div className="aj-prop">
              <div className="aj-prop-ic">
                <SearchIcon size={18} />
              </div>
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
        </>
      )}

      {/* Loading */}
      {loading && (
        <div className="aj-loadwrap" aria-live="polite">
          <p className="aj-note">
            Checking the Home Office sponsor register and live listings…
          </p>
          <div className="aj-skel-list">
            {[0, 1, 2, 3].map((i) => (
              <div className="aj-lc aj-lc--skel" key={i}>
                <div className="aj-skel aj-skel-logo" />
                <div
                  className="aj-skel"
                  style={{ width: "70%", height: 14, margin: "12px 0 8px" }}
                />
                <div
                  className="aj-skel"
                  style={{ width: "45%", height: 11, marginBottom: 12 }}
                />
                <div
                  className="aj-skel"
                  style={{ width: 120, height: 18, borderRadius: 999 }}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="aj-state aj-state--error">
          <div className="aj-state-title">Couldn't reach the job service</div>
          <div className="aj-state-sub">
            The search server didn't respond. Make sure it's running, then try
            again.
          </div>
          <button className="aj-retry" onClick={() => runSearch()}>
            Try again
          </button>
        </div>
      )}

      {/* Empty */}
      {!loading &&
        !error &&
        ((tab === "results" && searched) || tab === "saved") &&
        displayed.length === 0 && (
          <div className="aj-state">
            <div className="aj-state-title">
              {tab === "saved"
                ? "No saved roles yet"
                : `No roles match “${query}” yet`}
            </div>
            <div className="aj-state-sub">
              {tab === "saved"
                ? "Tap the bookmark on any role to keep it here for later."
                : visaOnly
                  ? "Turn off the visa filter, or try a broader search term."
                  : "Try a broader term — or search a related job title."}
            </div>
          </div>
        )}

      {/* Master-detail */}
      {showSplit && displayed.length > 0 && (
        <div className="aj-split">
          <div className="aj-list">
            {displayed.map((job) => (
              <ListCard
                key={jobKey(job)}
                job={job}
                active={active && jobKey(active) === jobKey(job)}
                saved={isSaved(job)}
                onSelect={(j) => setSelectedKey(jobKey(j))}
                onToggleSave={toggleSave}
              />
            ))}
            <div className="aj-end">
              {displayed.length} {displayed.length === 1 ? "role" : "roles"}{" "}
              shown
            </div>
          </div>

          <div className={`aj-detail ${selectedKey ? "is-open" : ""}`}>
            <Detail
              job={active}
              saved={active ? isSaved(active) : false}
              onToggleSave={toggleSave}
              onClose={() => setSelectedKey(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
}

const styles = `
.aj {
  --bg:#08080f; --panel:rgba(255,255,255,0.025); --panel-2:rgba(255,255,255,0.045);
  --border:rgba(255,255,255,0.06); --border-hi:rgba(124,111,239,0.4);
  --pur:#7c6fef; --pur2:#9b6ef3; --mag:#e879f9; --teal:#00d4aa; --gold:#f5c451;
  --text:#f0f0ff; --text-2:#8888aa; --text-3:#55556a; --verify:#00d4aa;
  background:var(--bg); min-height:calc(100vh - 56px); color:var(--text);
  font-family:'Inter', system-ui, -apple-system, sans-serif;
  padding:2rem clamp(1.5rem,4vw,4.5rem) 4rem;
}
.aj button:focus-visible, .aj a:focus-visible, .aj [role=button]:focus-visible { outline:2px solid var(--pur); outline-offset:2px; }

/* Header */
.aj-head { margin-bottom:1.5rem; }
.aj-title { margin:0 0 7px; font-size:clamp(1.7rem,2.6vw,2.2rem); font-weight:800; letter-spacing:-0.03em; line-height:1.1; }
.aj-sub { margin:0; max-width:560px; font-size:13.5px; line-height:1.55; color:var(--text-2); }

/* Search */
.aj-searchbar { display:flex; align-items:center; gap:8px; max-width:760px; background:var(--panel); border:1px solid var(--border); border-radius:14px; padding:6px 6px 6px 16px; transition:border-color .2s, box-shadow .2s; }
.aj-searchbar:focus-within { border-color:var(--pur); box-shadow:0 0 0 4px rgba(124,111,239,.15); }
.aj-search-ic { display:flex; color:var(--text-3); transition:color .2s; }
.aj-searchbar:focus-within .aj-search-ic { color:var(--pur); }
.aj-input { flex:1; min-width:0; background:transparent; border:none; outline:none; color:var(--text); font-size:15px; padding:10px 0; }
.aj-input::placeholder { color:#5a5a72; }
.aj-clear { display:flex; align-items:center; justify-content:center; width:30px; height:30px; border:none; background:transparent; color:var(--text-3); cursor:pointer; border-radius:8px; transition:all .15s; }
.aj-clear:hover { color:var(--text); background:rgba(255,255,255,.06); }
.aj-go { flex-shrink:0; padding:10px 22px; border:none; border-radius:10px; background:linear-gradient(135deg,var(--pur),var(--pur2)); color:#fff; font-size:13.5px; font-weight:700; cursor:pointer; transition:filter .18s, transform .12s; }
.aj-go:hover:not(:disabled) { filter:brightness(1.12); }
.aj-go:active:not(:disabled) { transform:scale(.97); }
.aj-go:disabled { opacity:.6; cursor:not-allowed; }

/* Tabs */
.aj-tabs { display:flex; align-items:center; justify-content:space-between; gap:14px; margin:1.5rem 0 1.25rem; flex-wrap:wrap; }
.aj-tabset { display:inline-flex; background:var(--panel); border:1px solid var(--border); border-radius:11px; padding:4px; }
.aj-tabset button { padding:8px 16px; border:none; background:transparent; color:var(--text-2); font-size:13px; font-weight:600; border-radius:8px; cursor:pointer; transition:all .15s; }
.aj-tabset button:hover { color:var(--text); }
.aj-tabset button.is-active { background:linear-gradient(135deg,var(--pur),var(--pur2)); color:#fff; }
.aj-controls { display:flex; align-items:center; gap:8px; flex-wrap:wrap; }
.aj-seg { display:inline-flex; background:var(--panel); border:1px solid var(--border); border-radius:10px; padding:3px; }
.aj-seg button { padding:6px 12px; border:none; background:transparent; color:var(--text-2); font-size:12px; font-weight:600; border-radius:7px; cursor:pointer; transition:all .15s; }
.aj-seg button:hover { color:var(--text); }
.aj-seg button.is-active { background:rgba(124,111,239,.2); color:var(--text); }
.aj-toggle { display:inline-flex; align-items:center; gap:7px; padding:7px 14px; border-radius:999px; cursor:pointer; background:transparent; border:1px solid var(--verify); color:var(--verify); font-size:12.5px; font-weight:600; transition:all .18s; }
.aj-toggle:hover { background:rgba(0,212,170,.10); }
.aj-toggle.is-on { background:var(--verify); color:#04201b; border-color:transparent; }

/* Value props */
.aj-props { display:grid; grid-template-columns:repeat(3,1fr); gap:14px; margin-top:1.75rem; max-width:960px; }
.aj-prop { background:var(--panel); border:1px solid var(--border); border-radius:14px; padding:20px; transition:border-color .18s, transform .18s; }
.aj-prop:hover { border-color:var(--border-hi); transform:translateY(-2px); }
.aj-prop-ic { width:40px; height:40px; border-radius:10px; display:flex; align-items:center; justify-content:center; color:var(--pur); background:rgba(124,111,239,.12); border:1px solid rgba(124,111,239,.22); margin-bottom:13px; }
.aj-prop-title { font-size:14px; font-weight:700; margin-bottom:5px; }
.aj-prop-sub { font-size:12px; color:var(--text-3); line-height:1.5; }

/* Blocks + chips */
.aj-block { margin-top:1.75rem; max-width:960px; }
.aj-block-head { display:flex; align-items:center; justify-content:space-between; margin-bottom:11px; }
.aj-eyebrow { font-size:11px; font-weight:700; letter-spacing:.1em; text-transform:uppercase; color:var(--text-3); }
.aj-text-btn { border:none; background:none; color:var(--text-3); font-size:11px; cursor:pointer; transition:color .15s; }
.aj-text-btn:hover { color:var(--text); }
.aj-chips { display:flex; flex-wrap:wrap; gap:8px; }
.aj-chip { padding:8px 15px; border-radius:999px; cursor:pointer; background:transparent; border:1px solid var(--border); color:var(--text-2); font-size:12.5px; transition:all .16s; }
.aj-chip:hover { border-color:var(--border-hi); color:var(--text); background:rgba(124,111,239,.08); transform:translateY(-1px); }

/* Master-detail split */
.aj-split { display:grid; grid-template-columns:minmax(340px, 420px) 1fr; gap:16px; align-items:start; }
.aj-list { display:flex; flex-direction:column; gap:10px; }

/* List card */
.aj-lc { background:var(--panel); border:1px solid var(--border); border-radius:14px; padding:16px; cursor:pointer; transition:all .18s; }
.aj-lc:hover { border-color:var(--border-hi); background:var(--panel-2); }
.aj-lc.is-active { border-color:var(--pur); background:rgba(124,111,239,.08); box-shadow:0 0 0 1px var(--pur) inset; }
.aj-lc-top { display:flex; align-items:flex-start; justify-content:space-between; margin-bottom:12px; }
.aj-logo { width:42px; height:42px; flex-shrink:0; border-radius:11px; display:flex; align-items:center; justify-content:center; border:1px solid; font-size:16px; font-weight:700; }
.aj-logo-lg { width:54px; height:54px; border-radius:14px; font-size:21px; }
.aj-save-sm { display:flex; align-items:center; justify-content:center; width:32px; height:32px; border:1px solid var(--border); background:transparent; color:var(--text-3); border-radius:9px; cursor:pointer; transition:all .18s; }
.aj-save-sm:hover { color:var(--text); border-color:var(--border-hi); }
.aj-save-sm.is-saved { color:var(--pur); border-color:var(--border-hi); background:rgba(124,111,239,.12); }
.aj-lc-title { font-size:14.5px; font-weight:700; color:var(--text); margin-bottom:3px; line-height:1.3; }
.aj-lc-meta { font-size:12.5px; color:var(--text-2); margin-bottom:10px; }
.aj-lc-badges { display:flex; gap:6px; flex-wrap:wrap; }
.aj-badge { display:inline-flex; align-items:center; gap:5px; font-size:11px; font-weight:600; padding:3px 9px; border-radius:999px; }
.aj-badge--verified { background:rgba(0,212,170,.14); color:var(--verify); border:1px solid rgba(0,212,170,.4); }
.aj-badge--salary { background:rgba(124,111,239,.14); color:#a89cf7; border:1px solid rgba(124,111,239,.3); }
.aj-badge--type { background:rgba(255,255,255,.05); color:var(--text-2); border:1px solid rgba(255,255,255,.1); }
.aj-lc-posted { display:flex; align-items:center; gap:5px; font-size:11px; color:var(--text-3); margin-top:10px; }

/* Detail panel */
.aj-detail { position:sticky; top:74px; background:var(--panel); border:1px solid var(--border); border-radius:18px; min-height:400px; }
.aj-detail-inner { padding:28px; }
.aj-detail-back { display:none; align-items:center; gap:7px; border:none; background:none; color:var(--text-2); font-size:13px; font-weight:600; cursor:pointer; margin-bottom:16px; padding:0; }
.aj-detail-head { display:flex; gap:16px; align-items:center; margin-bottom:22px; }
.aj-detail-title { font-size:21px; font-weight:800; letter-spacing:-0.02em; margin:0 0 5px; line-height:1.25; }
.aj-detail-company { font-size:13.5px; color:var(--text-2); }

.aj-facts { display:flex; gap:10px; flex-wrap:wrap; margin-bottom:20px; }
.aj-fact { background:rgba(255,255,255,0.03); border:1px solid var(--border); border-radius:12px; padding:11px 16px; min-width:90px; }
.aj-fact-lbl { font-size:10.5px; color:var(--text-3); text-transform:uppercase; letter-spacing:0.06em; font-weight:600; margin-bottom:3px; }
.aj-fact-val { font-size:14px; font-weight:700; color:var(--text); }

.aj-detail-actions { display:flex; gap:10px; margin-bottom:22px; flex-wrap:wrap; }
.aj-apply { display:inline-flex; align-items:center; gap:7px; padding:11px 20px; border-radius:11px; text-decoration:none; background:linear-gradient(135deg,var(--pur),var(--pur2)); color:#fff; font-size:13.5px; font-weight:700; transition:filter .18s; }
.aj-apply:hover { filter:brightness(1.12); }
.aj-arrow { transition:transform .18s; }
.aj-apply:hover .aj-arrow { transform:translateX(3px); }
.aj-save { display:inline-flex; align-items:center; gap:7px; padding:11px 18px; border:1px solid var(--border); background:transparent; color:var(--text-2); border-radius:11px; cursor:pointer; font-size:13.5px; font-weight:600; transition:all .18s; }
.aj-save:hover { color:var(--text); border-color:var(--border-hi); }
.aj-save.is-saved { color:var(--pur); border-color:var(--border-hi); background:rgba(124,111,239,.1); }

/* Visa explainer */
.aj-visa { display:flex; gap:13px; padding:16px 18px; border-radius:14px; margin-bottom:24px; }
.aj-visa.is-ok { background:rgba(0,212,170,.07); border:1px solid rgba(0,212,170,.25); }
.aj-visa.is-unknown { background:rgba(255,255,255,.025); border:1px solid var(--border); }
.aj-visa-ic { width:30px; height:30px; border-radius:50%; flex-shrink:0; display:flex; align-items:center; justify-content:center; font-weight:800; }
.aj-visa.is-ok .aj-visa-ic { background:rgba(0,212,170,.15); color:var(--verify); }
.aj-visa.is-unknown .aj-visa-ic { background:rgba(255,255,255,.06); color:var(--text-3); }
.aj-visa-t { font-size:14px; font-weight:700; color:var(--text); margin-bottom:4px; }
.aj-visa-s { font-size:12.5px; color:var(--text-2); line-height:1.6; }

.aj-section-h { font-size:13px; font-weight:700; text-transform:uppercase; letter-spacing:0.08em; color:var(--text-2); margin-bottom:12px; }
.aj-desc-body p { font-size:13.5px; line-height:1.75; color:var(--text-2); margin:0 0 14px; }
.aj-desc-more { font-size:12px !important; color:var(--text-3) !important; font-style:italic; }
.aj-desc-link { display:inline-flex; align-items:center; gap:6px; font-size:13px; font-weight:700; color:var(--pur); text-decoration:none; margin-top:4px; }
.aj-desc-link:hover { text-decoration:underline; }

/* Empty detail */
.aj-detail-empty { display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center; padding:60px 30px; min-height:400px; }
.aj-detail-empty-ic { font-size:40px; margin-bottom:16px; opacity:0.5; }
.aj-detail-empty-t { font-size:15px; font-weight:700; color:var(--text); margin-bottom:8px; }
.aj-detail-empty-s { font-size:13px; color:var(--text-3); line-height:1.6; max-width:320px; }

/* States */
.aj-state { background:var(--panel); border:1px solid var(--border); border-radius:16px; padding:32px; text-align:center; margin-top:1rem; max-width:560px; }
.aj-state--error { border-color:rgba(244,99,99,.25); }
.aj-state-title { font-size:15px; font-weight:700; color:var(--text); margin-bottom:6px; }
.aj-state-sub { font-size:12.5px; color:var(--text-3); line-height:1.5; }
.aj-retry { margin-top:16px; padding:9px 20px; border:none; border-radius:10px; background:linear-gradient(135deg,var(--pur),var(--pur2)); color:#fff; font-size:12.5px; font-weight:700; cursor:pointer; transition:filter .18s; }
.aj-retry:hover { filter:brightness(1.12); }
.aj-end { text-align:center; font-size:11.5px; color:var(--text-3); padding:14px 0 4px; }

/* Skeleton */
.aj-skel-list { display:grid; grid-template-columns:minmax(340px,420px) 1fr; gap:16px; align-items:start; }
.aj-skel-list { grid-template-columns:1fr; max-width:420px; }
.aj-lc--skel { pointer-events:none; }
.aj-skel { background:linear-gradient(90deg,#13131f 25%,#1e1e2e 50%,#13131f 75%); background-size:200% 100%; animation:aj-shimmer 1.4s ease-in-out infinite; border-radius:6px; }
.aj-skel-logo { width:42px; height:42px; border-radius:11px; }
@keyframes aj-shimmer { 0% { background-position:200% 0; } 100% { background-position:-200% 0; } }

/* Responsive — collapse to list + overlay detail */
@media (max-width:960px) {
  .aj-split { grid-template-columns:1fr; }
  .aj-detail {
    position:fixed; inset:0; z-index:200; border-radius:0; margin:0; top:0;
    transform:translateX(100%); transition:transform .28s cubic-bezier(.4,0,.2,1);
    overflow-y:auto; background:var(--bg);
  }
  .aj-detail.is-open { transform:translateX(0); }
  .aj-detail-back { display:inline-flex; }
}
@media (prefers-reduced-motion: reduce) { .aj * { animation:none !important; transition:none !important; } }
@media (max-width:600px) {
  .aj { padding:1.5rem 1.1rem 3rem; }
  .aj-props { grid-template-columns:1fr; }
}
`;

export default Jobs;
