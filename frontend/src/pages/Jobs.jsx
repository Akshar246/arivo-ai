import { useState, useEffect, useRef } from "react";
import axios from "axios";

// ─────────────────────────────────────────────────────────────
// JOBS PAGE · Arivo AI (V2 Premium Architecture)
// Features Zero-Click Auto-Feed & The "Backdoor Application" Coach Bridge.
// ─────────────────────────────────────────────────────────────

const SAVED_KEY = "arivo_savedJobs";
const RECENT_KEY = "arivo_recentSearches";

const readLS = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (err) {
    console.warn("Storage read error:", err);
    return fallback;
  }
};
const writeLS = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.warn("Storage write error:", err);
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

const workModeLabel = (m) => {
  if (m === "remote") return "Remote";
  if (m === "hybrid") return "Hybrid";
  return "On-site";
};

const stalenessMessage = (fetchedAt) => {
  if (!fetchedAt) return null;
  const then = new Date(fetchedAt);
  if (isNaN(then)) return null;
  const days = Math.floor((Date.now() - then.getTime()) / 86400000);
  if (days < 14) return null;
  if (days < 30)
    return `Listing data is ${days} days old — verify it's still open.`;
  return `Listing data is over a month old — may be filled.`;
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
const Ic = {
  search: () => (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  ),
  shield: () => (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 2 4 5v6c0 5 3.4 8.4 8 11 4.6-2.6 8-6 8-11V5z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  ),
  arrow: () => (
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
    >
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </svg>
  ),
  bookmark: (filled) => (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
    </svg>
  ),
  close: () => (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
    >
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  ),
  clock: () => (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  ),
  back: () => (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M19 12H5M11 18l-6-6 6-6" />
    </svg>
  ),
  filter: () => (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 6h16M7 12h10M10 18h4" />
    </svg>
  ),
  scan: () => (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 7V5a2 2 0 0 1 2-2h2" />
      <path d="M17 3h2a2 2 0 0 1 2 2v2" />
      <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
      <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
      <circle cx="12" cy="12" r="3" />
      <path d="m16 16-1.9-1.9" />
    </svg>
  ),
  sparkle: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2l2.4 7.6H22l-6.4 4.6 2.4 7.8L12 17.4l-6 4.6 2.4-7.8L2 9.6h7.6z" />
    </svg>
  ),
};

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
    >
      <div className="aj-lc-top">
        <div
          className="aj-logo"
          style={{
            background: `linear-gradient(135deg, hsla(${hue},70%,60%,.18), hsla(${hue + 40},70%,55%,.18))`,
            color: `hsl(${hue},75%,72%)`,
            borderColor: `hsla(${hue},70%,60%,.35)`,
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
        >
          {Ic.bookmark(saved)}
        </button>
      </div>
      <div className="aj-lc-title">{job.title}</div>
      <div className="aj-lc-meta">
        {job.company} · {job.location}
      </div>
      <div className="aj-lc-badges">
        {job.visa_sponsor && (
          <span className="aj-badge aj-badge--verified">
            {Ic.shield()} Sponsor
          </span>
        )}
        {salary && salary !== "Salary not specified" && (
          <span className="aj-badge aj-badge--salary">{salary}</span>
        )}
        {type && <span className="aj-badge aj-badge--type">{type}</span>}
        {job.work_mode && job.work_mode !== "onsite" && (
          <span className="aj-badge aj-badge--mode">
            {workModeLabel(job.work_mode)}
          </span>
        )}
      </div>
      <div className="aj-lc-posted-row">
        {posted && (
          <div className="aj-lc-posted">
            {Ic.clock()} {posted}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Detail panel (the in-app description view) ────────────────
function Detail({ job, saved, onToggleSave, onClose, onScan, onNavigate }) {
  // UNIQUE FEATURE: Application Intelligence Dashboard when empty
  if (!job) {
    return (
      <div className="aj-detail-empty fade-in">
        <div className="aj-empty-card">
          <div className="aj-empty-ic">📡</div>
          <h3 className="aj-empty-h">Select a role to view intelligence</h3>
          <p className="aj-empty-p">
            We map descriptions directly against the Home Office register to
            verify sponsorship viability.
          </p>
        </div>
        <div className="aj-empty-tips">
          <h4>International Student Strategy</h4>
          <ul>
            <li>
              <strong>Don't just apply online:</strong> The ATS will filter out
              international passports. Find the hiring manager on LinkedIn.
            </li>
            <li>
              <strong>The Coach is your secret weapon:</strong> Use the "Draft
              Networking Message" button inside any job to get an instant,
              tailored outreach script.
            </li>
            <li>
              <strong>Scan before applying:</strong> Use the ATS Scanner to
              ensure your CV matches the semantic keywords of the job.
            </li>
          </ul>
        </div>
      </div>
    );
  }

  const type = jobType(job.contract_time, job.contract_type);
  const salary = cleanSalary(job.salary);
  const hue = hueFor(job.company);
  const hasDesc = !!(job.description && job.description.trim());
  const paras = hasDesc
    ? job.description
        .split(/\n+/)
        .map((p) => p.trim())
        .filter(Boolean)
    : [];

  // RARE FEATURE: The Backdoor Application (Networking Bridge)
  const handleNetworkBridge = () => {
    const prompt = `I want to apply for the ${job.title} role at ${job.company}. Write a highly-tailored, 75-word LinkedIn connection request to the hiring manager. I am an international student looking for sponsorship. Make it sound professional, confident, and focus on value, not begging for a visa.`;
    sessionStorage.setItem("arivo_pending_coach_prompt", prompt);
    if (onNavigate) onNavigate("chat");
  };

  return (
    <div className="aj-detail-inner fade-in">
      <button className="aj-detail-back" onClick={onClose}>
        {Ic.back()} Back
      </button>

      <div className="aj-detail-head">
        <div
          className="aj-logo aj-logo-lg"
          style={{
            background: `linear-gradient(135deg, hsla(${hue},70%,60%,.18), hsla(${hue + 40},70%,55%,.18))`,
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
        {job.work_mode && (
          <div className="aj-fact">
            <div className="aj-fact-lbl">Mode</div>
            <div className="aj-fact-val">{workModeLabel(job.work_mode)}</div>
          </div>
        )}
      </div>

      {/* THE $100M ACTION BAR */}
      <div className="aj-detail-actions">
        {job.url && (
          <a
            className="aj-apply"
            href={job.url}
            target="_blank"
            rel="noreferrer"
          >
            Apply Direct {Ic.arrow()}
          </a>
        )}

        {/* NEW FEATURE: Networking Bridge */}
        <button className="aj-network-btn" onClick={handleNetworkBridge}>
          {Ic.sparkle()} Draft Networking Message
        </button>

        {hasDesc && (
          <button className="aj-scan" onClick={() => onScan(job)}>
            {Ic.scan()} Scan CV
          </button>
        )}

        <button
          className={`aj-save-btn ${saved ? "is-saved" : ""}`}
          onClick={() => onToggleSave(job)}
        >
          {Ic.bookmark(saved)} {saved ? "Saved" : "Save"}
        </button>
      </div>

      <div className={`aj-visa ${job.visa_sponsor ? "is-ok" : "is-unknown"}`}>
        <div className="aj-visa-ic">{job.visa_sponsor ? Ic.shield() : "?"}</div>
        <div>
          <div className="aj-visa-t">
            {job.visa_sponsor
              ? "Verified Tier 2 Sponsor"
              : "Sponsorship unconfirmed"}
          </div>
          <div className="aj-visa-s">
            {job.visa_sponsor
              ? `${job.company} is on the official UK Skilled Worker register.`
              : `We couldn't verify ${job.company} on the official sponsor register.`}
          </div>
        </div>
      </div>

      <div className="aj-section-h">Role Description</div>
      {hasDesc ? (
        <div className="aj-desc-body">
          {paras.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
      ) : (
        <div className="aj-desc-body">
          <p>No description provided. Click Apply to view on employer site.</p>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// MAIN JOBS COMPONENT
// ─────────────────────────────────────────────────────────────
export default function Jobs({ onNavigate }) {
  // ESLINT FIX: Initialize all default values dynamically inside useState
  const [query, setQuery] = useState(() => {
    const context = readLS("arivo_pf_context", {});
    return context.targetRole || "Software Engineer";
  });
  const [location, setLocation] = useState("London");
  const [category, setCategory] = useState("");
  const [categories, setCategories] = useState([]);

  // ESLINT FIX: Pre-set loading and searched to true for the Auto-Feed
  const [loading, setLoading] = useState(true);
  const [searched, setSearched] = useState(true);
  const [error, setError] = useState(false);
  const [jobs, setJobs] = useState([]);

  const [visaOnly, setVisaOnly] = useState(false);
  const [sortBy, setSortBy] = useState("sponsors");
  const [savedJobs, setSavedJobs] = useState(() => readLS(SAVED_KEY, []));
  const [recent, setRecent] = useState(() => readLS(RECENT_KEY, []));
  const [selectedKey, setSelectedKey] = useState(null);

  // ZERO-CLICK AUTO-FEED FEATURE (ESLint Strict Fix)
  useEffect(() => {
    let isMounted = true;
    const fetchInitialJobs = async () => {
      try {
        const res = await axios.post(
          `${import.meta.env.VITE_AI_URL}/jobs/search`,
          {
            query: query,
            location: location,
            category: category || undefined,
          },
        );

        if (isMounted) {
          setJobs(res.data.jobs || []);
          const next = [
            query,
            ...recent.filter((r) => r.toLowerCase() !== query.toLowerCase()),
          ].slice(0, 5);
          setRecent(next);
          writeLS(RECENT_KEY, next);
          setLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          console.warn("Auto-feed error:", err);
          setError(true);
          setLoading(false);
        }
      }
    };

    fetchInitialJobs();
    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    axios
      .get(`${import.meta.env.VITE_AI_URL}/jobs/categories`)
      .then((res) => setCategories(res.data?.categories || []))
      .catch((err) => {
        console.warn("Categories fetch error:", err);
        setCategories([]);
      });
  }, []);

  const runSearch = async (term = query, loc = location) => {
    const q = term.trim();
    if (!q) return;
    setQuery(q);
    setLocation(loc);
    setLoading(true);
    setSearched(true);
    setError(false);
    setSelectedKey(null);

    try {
      const res = await axios.post(
        `${import.meta.env.VITE_AI_URL}/jobs/search`,
        {
          query: q,
          location: loc,
          category: category || undefined,
        },
      );
      setJobs(res.data.jobs || []);
      const next = [
        q,
        ...recent.filter((r) => r.toLowerCase() !== q.toLowerCase()),
      ].slice(0, 5);
      setRecent(next);
      writeLS(RECENT_KEY, next);
    } catch (err) {
      console.warn("Manual search error:", err);
      setError(true);
    }
    setLoading(false);
  };

  const isSaved = (job) => savedJobs.some((s) => jobKey(s) === jobKey(job));
  const toggleSave = (job) => {
    const next = isSaved(job)
      ? savedJobs.filter((s) => jobKey(s) !== jobKey(job))
      : [{ ...job, savedAt: new Date().toISOString() }, ...savedJobs];
    setSavedJobs(next);
    writeLS(SAVED_KEY, next);
  };

  const handleScanMatch = (job) => {
    const payload = {
      title: job.title,
      company: job.company,
      description: job.description,
      isPartial: true,
    };
    sessionStorage.setItem("arivo_pending_scan", JSON.stringify(payload));
    if (onNavigate) onNavigate("ats");
  };

  const filtered = visaOnly ? jobs.filter((j) => j.visa_sponsor) : jobs;
  const displayed =
    sortBy === "sponsors"
      ? [...filtered].sort(
          (a, b) => (b.visa_sponsor ? 1 : 0) - (a.visa_sponsor ? 1 : 0),
        )
      : filtered;
  const active =
    displayed.find((j) => jobKey(j) === selectedKey) || displayed[0] || null;

  return (
    <div className="aj-wrapper">
      <style>{styles}</style>

      <div className="aj-container">
        <header className="aj-head">
          <h1 className="aj-title">Market Intelligence Feed</h1>
          <p className="aj-sub">
            Auto-calibrated to your profile. Every listing checked against the
            official Home Office sponsor register.
          </p>
        </header>

        {/* Search & Filter Bar */}
        <div className="aj-search-bar">
          <div className="aj-search-inputs">
            <div className="aj-input-wrap">
              {Ic.search()}
              <input
                className="aj-input"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && runSearch()}
                placeholder="Target role..."
              />
            </div>
            <div className="aj-divider"></div>
            <div className="aj-input-wrap">
              {Ic.filter()}
              <input
                className="aj-input"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && runSearch()}
                placeholder="London"
              />
            </div>
          </div>
          <button
            className="aj-btn-primary"
            onClick={() => runSearch()}
            disabled={loading}
          >
            {loading ? "Scanning..." : "Search Market"}
          </button>
        </div>

        <div className="aj-controls-row">
          <div className="aj-tabs">
            <button
              className={sortBy === "match" ? "active" : ""}
              onClick={() => setSortBy("match")}
            >
              Relevance
            </button>
            <button
              className={sortBy === "sponsors" ? "active" : ""}
              onClick={() => setSortBy("sponsors")}
            >
              Sponsors First
            </button>
          </div>
          <button
            className={`aj-visa-toggle ${visaOnly ? "is-on" : ""}`}
            onClick={() => setVisaOnly(!visaOnly)}
          >
            {Ic.shield()} Visa Sponsors Only
          </button>
        </div>

        {/* Main Split View */}
        <div className="aj-split-view">
          {/* Left Column: Job List */}
          <div className="aj-list-col">
            {loading ? (
              <div className="aj-loading">
                <div className="aj-spinner"></div>
                <p>Querying live endpoints & Home Office register...</p>
              </div>
            ) : error ? (
              <div className="aj-msg-card">
                <h3>Backend Disconnected</h3>
                <p>
                  Unable to reach the Python APIs. Please ensure the server is
                  running on port 8000.
                </p>
                <button className="aj-btn-primary" onClick={() => runSearch()}>
                  Retry
                </button>
              </div>
            ) : displayed.length === 0 ? (
              <div className="aj-msg-card">
                <h3>No roles found</h3>
                <p>
                  Try adjusting your search terms or expanding your location.
                </p>
              </div>
            ) : (
              <div className="aj-feed">
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
                <div className="aj-feed-end">End of results for "{query}"</div>
              </div>
            )}
          </div>

          {/* Right Column: Detail Panel */}
          <div
            className={`aj-detail-col ${selectedKey || (displayed.length > 0 && active) ? "is-open" : ""}`}
          >
            <Detail
              job={active}
              saved={active ? isSaved(active) : false}
              onToggleSave={toggleSave}
              onClose={() => setSelectedKey(null)}
              onScan={handleScanMatch}
              onNavigate={onNavigate}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// ENTERPRISE CSS (Mobile Optimized)
// ─────────────────────────────────────────────────────────────
const styles = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

:root {
  --bg: #08080f; --surface: #0f0f18; --surface-2: rgba(255,255,255,0.03);
  --border: rgba(255,255,255,0.08); --border-hi: rgba(124, 111, 239, 0.4);
  --pur: #7c6fef; --pur2: #9b6ef3; --teal: #00d4aa; --gold: #f5c451; --red: #ff7a7a;
  --tx: #f0f0ff; --tx2: #8888aa; --tx3: #55556a;
}

.aj-wrapper { background: var(--bg); min-height: calc(100vh - 56px); color: var(--tx); font-family: 'Inter', system-ui, sans-serif; }
.aj-wrapper * { box-sizing: border-box; }

.aj-container { max-width: 1400px; margin: 0 auto; padding: 40px 24px; }

/* Header */
.aj-head { margin-bottom: 32px; }
.aj-title { font-size: clamp(24px, 4vw, 32px); font-weight: 800; letter-spacing: -0.02em; margin: 0 0 8px; }
.aj-sub { font-size: 15px; color: var(--tx2); margin: 0; max-width: 600px; line-height: 1.5; }

/* Search Bar */
.aj-search-bar { display: flex; gap: 12px; margin-bottom: 24px; flex-wrap: wrap; }
.aj-search-inputs { flex: 1; display: flex; align-items: center; background: var(--surface); border: 1px solid var(--border); border-radius: 14px; padding: 0 16px; transition: border-color 0.2s; }
.aj-search-inputs:focus-within { border-color: var(--pur); box-shadow: 0 0 0 3px rgba(124, 111, 239, 0.15); }
.aj-input-wrap { display: flex; align-items: center; gap: 10px; flex: 1; color: var(--tx3); padding: 12px 0; }
.aj-input { flex: 1; min-width: 0; background: transparent; border: none; outline: none; color: var(--tx); font-size: 15px; font-family: inherit; }
.aj-input::placeholder { color: var(--tx3); }
.aj-divider { width: 1px; height: 24px; background: var(--border); margin: 0 16px; }

.aj-btn-primary { background: linear-gradient(135deg, var(--pur), var(--pur2)); color: #fff; border: none; padding: 0 32px; border-radius: 14px; font-size: 15px; font-weight: 700; cursor: pointer; transition: all 0.2s; white-space: nowrap; height: 48px; }
.aj-btn-primary:hover:not(:disabled) { filter: brightness(1.1); transform: translateY(-1px); box-shadow: 0 8px 20px rgba(124, 111, 239, 0.3); }
.aj-btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }

/* Controls */
.aj-controls-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; flex-wrap: wrap; gap: 16px; }
.aj-tabs { display: flex; background: var(--surface); border: 1px solid var(--border); border-radius: 10px; padding: 4px; }
.aj-tabs button { background: transparent; border: none; padding: 8px 16px; border-radius: 6px; color: var(--tx2); font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.2s; }
.aj-tabs button:hover { color: var(--tx); }
.aj-tabs button.active { background: rgba(124, 111, 239, 0.15); color: var(--pur); }
.aj-visa-toggle { display: flex; align-items: center; gap: 8px; background: transparent; border: 1px solid var(--teal); color: var(--teal); padding: 8px 16px; border-radius: 99px; font-size: 13px; font-weight: 700; cursor: pointer; transition: all 0.2s; }
.aj-visa-toggle:hover { background: rgba(0, 212, 170, 0.1); }
.aj-visa-toggle.is-on { background: var(--teal); color: #000; }

/* Split View Architecture */
.aj-split-view { display: grid; grid-template-columns: 420px 1fr; gap: 24px; align-items: start; }
.aj-list-col { display: flex; flex-direction: column; gap: 12px; height: calc(100vh - 280px); overflow-y: auto; padding-right: 8px; scrollbar-width: thin; scrollbar-color: var(--border) transparent; }

/* Job Cards */
.aj-lc { background: var(--surface); border: 1px solid var(--border); border-radius: 16px; padding: 20px; cursor: pointer; transition: all 0.2s; }
.aj-lc:hover { border-color: var(--border-hi); background: var(--surface-2); transform: translateY(-2px); }
.aj-lc.is-active { border-color: var(--pur); background: rgba(124, 111, 239, 0.08); box-shadow: inset 0 0 0 1px var(--pur); transform: translateY(0); }
.aj-lc-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px; }
.aj-logo { width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 18px; font-weight: 800; border: 1px solid; flex-shrink: 0; }
.aj-save-sm { background: transparent; border: 1px solid var(--border); border-radius: 8px; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; color: var(--tx3); cursor: pointer; transition: all 0.2s; }
.aj-save-sm:hover { color: var(--tx); border-color: var(--tx2); }
.aj-save-sm.is-saved { color: var(--pur); border-color: var(--pur); background: rgba(124, 111, 239, 0.1); }
.aj-lc-title { font-size: 16px; font-weight: 700; color: var(--tx); margin-bottom: 4px; line-height: 1.3; }
.aj-lc-meta { font-size: 13px; color: var(--tx2); margin-bottom: 12px; }
.aj-lc-badges { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 12px; }
.aj-badge { font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 6px; display: flex; align-items: center; gap: 4px; }
.aj-badge--verified { background: rgba(0, 212, 170, 0.1); color: var(--teal); border: 1px solid rgba(0, 212, 170, 0.2); }
.aj-badge--salary { background: rgba(124, 111, 239, 0.1); color: #b0a8ff; border: 1px solid rgba(124, 111, 239, 0.2); }
.aj-badge--type { background: rgba(255, 255, 255, 0.05); color: var(--tx2); border: 1px solid var(--border); }
.aj-badge--mode { background: rgba(245, 196, 81, 0.1); color: var(--gold); border: 1px solid rgba(245, 196, 81, 0.2); }
.aj-lc-posted-row { font-size: 11.5px; color: var(--tx3); display: flex; align-items: center; gap: 6px; }

/* Detail Column */
.aj-detail-col { background: var(--surface); border: 1px solid var(--border); border-radius: 20px; height: calc(100vh - 280px); overflow-y: auto; position: sticky; top: 140px; scrollbar-width: none; }
.aj-detail-inner { padding: 40px; }
.aj-detail-back { display: none; }

/* Empty States */
.aj-detail-empty { padding: 40px; display: flex; flex-direction: column; gap: 24px; height: 100%; justify-content: center; }
.aj-empty-card { background: rgba(124, 111, 239, 0.05); border: 1px solid rgba(124, 111, 239, 0.2); border-radius: 16px; padding: 32px; text-align: center; }
.aj-empty-ic { font-size: 32px; margin-bottom: 16px; }
.aj-empty-h { font-size: 18px; font-weight: 700; margin: 0 0 8px; color: var(--tx); }
.aj-empty-p { font-size: 14px; color: var(--tx2); margin: 0; line-height: 1.5; }
.aj-empty-tips { background: var(--bg); border: 1px solid var(--border); border-radius: 16px; padding: 24px; }
.aj-empty-tips h4 { font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--pur); margin: 0 0 16px; }
.aj-empty-tips ul { margin: 0; padding-left: 20px; color: var(--tx2); font-size: 13.5px; line-height: 1.6; display: flex; flex-direction: column; gap: 12px; }
.aj-empty-tips strong { color: var(--tx); }

/* Detail Content */
.aj-detail-head { display: flex; align-items: center; gap: 20px; margin-bottom: 32px; }
.aj-logo-lg { width: 64px; height: 64px; border-radius: 16px; font-size: 24px; }
.aj-detail-title { font-size: 24px; font-weight: 800; letter-spacing: -0.02em; margin: 0 0 8px; line-height: 1.2; }
.aj-detail-company { font-size: 15px; color: var(--tx2); }

.aj-facts { display: flex; gap: 12px; flex-wrap: wrap; margin-bottom: 32px; }
.aj-fact { background: rgba(255, 255, 255, 0.03); border: 1px solid var(--border); border-radius: 12px; padding: 12px 20px; min-width: 100px; }
.aj-fact-lbl { font-size: 11px; font-weight: 700; color: var(--tx3); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px; }
.aj-fact-val { font-size: 15px; font-weight: 700; color: var(--tx); }

/* The Action Bar */
.aj-detail-actions { display: flex; gap: 12px; flex-wrap: wrap; margin-bottom: 32px; padding-bottom: 32px; border-bottom: 1px solid var(--border); }
.aj-apply { display: inline-flex; align-items: center; gap: 8px; background: linear-gradient(135deg, var(--pur), var(--pur2)); color: #fff; padding: 12px 24px; border-radius: 12px; font-size: 14px; font-weight: 700; text-decoration: none; transition: all 0.2s; box-shadow: 0 4px 15px rgba(124, 111, 239, 0.3); }
.aj-apply:hover { transform: translateY(-2px); box-shadow: 0 8px 25px rgba(124, 111, 239, 0.4); }
.aj-network-btn { display: inline-flex; align-items: center; gap: 8px; background: rgba(255, 255, 255, 0.05); color: #fff; border: 1px solid var(--border); padding: 12px 20px; border-radius: 12px; font-size: 14px; font-weight: 700; cursor: pointer; transition: all 0.2s; }
.aj-network-btn:hover { background: rgba(255, 255, 255, 0.1); border-color: rgba(255, 255, 255, 0.2); transform: translateY(-2px); }
.aj-scan { display: inline-flex; align-items: center; gap: 8px; background: rgba(0, 212, 170, 0.1); color: var(--teal); border: 1px solid rgba(0, 212, 170, 0.2); padding: 12px 20px; border-radius: 12px; font-size: 14px; font-weight: 700; cursor: pointer; transition: all 0.2s; }
.aj-scan:hover { background: rgba(0, 212, 170, 0.15); border-color: var(--teal); transform: translateY(-2px); }
.aj-save-btn { display: inline-flex; align-items: center; gap: 8px; background: transparent; border: 1px solid var(--border); color: var(--tx2); padding: 12px 20px; border-radius: 12px; font-size: 14px; font-weight: 700; cursor: pointer; transition: all 0.2s; }
.aj-save-btn:hover { color: var(--tx); border-color: var(--tx3); }
.aj-save-btn.is-saved { background: rgba(124, 111, 239, 0.1); color: var(--pur); border-color: var(--pur); }

/* Visa Box */
.aj-visa { display: flex; gap: 16px; padding: 20px; border-radius: 16px; margin-bottom: 32px; }
.aj-visa.is-ok { background: rgba(0, 212, 170, 0.05); border: 1px solid rgba(0, 212, 170, 0.2); }
.aj-visa.is-unknown { background: rgba(255, 255, 255, 0.02); border: 1px solid var(--border); }
.aj-visa-ic { width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 20px; flex-shrink: 0; }
.aj-visa.is-ok .aj-visa-ic { background: rgba(0, 212, 170, 0.15); color: var(--teal); }
.aj-visa.is-unknown .aj-visa-ic { background: rgba(255, 255, 255, 0.05); color: var(--tx3); }
.aj-visa-t { font-size: 15px; font-weight: 700; color: var(--tx); margin-bottom: 6px; }
.aj-visa-s { font-size: 13.5px; color: var(--tx2); line-height: 1.5; }

/* Description */
.aj-section-h { font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--tx2); margin-bottom: 16px; }
.aj-desc-body { font-size: 15px; line-height: 1.8; color: #cbd5e1; }
.aj-desc-body p { margin: 0 0 20px; }

/* Loading & States */
.aj-loading { text-align: center; padding: 60px 20px; color: var(--tx2); }
.aj-spinner { width: 40px; height: 40px; border: 3px solid var(--border); border-top-color: var(--pur); border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 20px; }
@keyframes spin { to { transform: rotate(360deg); } }
.aj-msg-card { background: var(--surface); border: 1px solid var(--border); border-radius: 16px; padding: 40px 20px; text-align: center; }
.aj-msg-card h3 { margin: 0 0 8px; font-size: 18px; }
.aj-msg-card p { margin: 0 0 24px; color: var(--tx2); }
.aj-feed-end { text-align: center; padding: 24px 0; font-size: 13px; color: var(--tx3); font-weight: 600; }
.fade-in { animation: fadeIn 0.3s ease-out forwards; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

/* ── STRICT MOBILE OPTIMIZATION ── */
@media (max-width: 1024px) {
  .aj-split-view { grid-template-columns: 350px 1fr; gap: 16px; }
}

@media (max-width: 768px) {
  .aj-container { padding: 24px 16px; }
  .aj-head { margin-bottom: 24px; }
  .aj-search-inputs { flex-direction: column; padding: 0; background: transparent; border: none; }
  .aj-input-wrap { width: 100%; background: var(--surface); border: 1px solid var(--border); border-radius: 12px; padding: 12px 16px; margin-bottom: 12px; }
  .aj-divider { display: none; }
  .aj-btn-primary { width: 100%; }
  
  .aj-controls-row { flex-direction: column; align-items: stretch; gap: 12px; }
  .aj-tabs { width: 100%; }
  .aj-tabs button { flex: 1; text-align: center; }
  
  .aj-split-view { display: block; }
  .aj-list-col { height: auto; padding-right: 0; }
  
  /* Mobile Detail Takeover */
  .aj-detail-col { 
    position: fixed; inset: 0; z-index: 1000; background: var(--bg); border: none; border-radius: 0; 
    height: 100vh; transform: translateX(100%); transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1); 
    display: none; 
  }
  .aj-detail-col.is-open { transform: translateX(0); display: block; }
  .aj-detail-inner { padding: 24px 16px 80px; }
  
  /* Mobile Back Button */
  .aj-detail-back { display: flex; align-items: center; gap: 8px; background: transparent; border: none; color: var(--tx2); font-size: 15px; font-weight: 700; padding: 16px 0; margin-bottom: 16px; cursor: pointer; }
  
  /* Mobile Action Bar */
  .aj-detail-actions { flex-direction: column; border-bottom: none; }
  .aj-apply, .aj-network-btn, .aj-scan, .aj-save-btn { width: 100%; justify-content: center; }
}
`;
