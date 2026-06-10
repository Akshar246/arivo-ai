import { useState } from "react";
import axios from "axios";

function Jobs() {
  const [query, setQuery] = useState("");
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [visaOnly, setVisaOnly] = useState(false);

  // ─────────────────────────────────────────────
  // SEARCH JOBS
  // Calls dedicated /jobs/search endpoint
  // Returns structured job objects — not chat text
  // Hybrid search handles ChromaDB + Adzuna live
  // ─────────────────────────────────────────────
  const searchJobs = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setSearched(true);
    setJobs([]);

    try {
      const response = await axios.post("http://localhost:8000/jobs/search", {
        query: query.trim(),
      });
      setJobs(response.data.jobs || []);
    } catch {
      setJobs([]);
    }

    setLoading(false);
  };

  // Filter by visa sponsorship if toggle is on
  const displayedJobs = visaOnly ? jobs.filter((j) => j.visa_sponsor) : jobs;

  return (
    <div
      style={{
        padding: "1.5rem",
        maxWidth: "800px",
        margin: "0 auto",
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: "1.5rem" }}>
        <div
          style={{
            fontSize: "20px",
            fontWeight: "600",
            color: "#fff",
            marginBottom: "4px",
          }}
        >
          Find Jobs in London 🔍
        </div>
        <div style={{ fontSize: "13px", color: "#888" }}>
          Search any role in any field — visa sponsorship verified against
          official Home Office data
        </div>
      </div>

      {/* Search bar */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "1rem" }}>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && searchJobs()}
          placeholder="e.g. teacher, nurse, ML engineer, finance analyst, lawyer..."
          style={{
            flex: 1,
            padding: "12px 16px",
            background: "#1a1a2e",
            border: "1px solid #333",
            borderRadius: "8px",
            color: "#fff",
            fontSize: "14px",
            outline: "none",
          }}
        />
        <button
          onClick={searchJobs}
          disabled={loading}
          style={{
            padding: "12px 24px",
            background: "linear-gradient(135deg, #667eea, #764ba2)",
            border: "none",
            borderRadius: "8px",
            color: "#fff",
            fontWeight: "600",
            cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.7 : 1,
            whiteSpace: "nowrap",
            fontSize: "14px",
          }}
        >
          {loading ? "Searching..." : "Search"}
        </button>
      </div>

      {/* Visa filter toggle */}
      {searched && jobs.length > 0 && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            marginBottom: "1rem",
          }}
        >
          <button
            onClick={() => setVisaOnly(!visaOnly)}
            style={{
              padding: "6px 14px",
              background: visaOnly
                ? "linear-gradient(135deg, #11998e, #38ef7d)"
                : "transparent",
              border: "1px solid #11998e",
              borderRadius: "999px",
              color: visaOnly ? "#fff" : "#11998e",
              cursor: "pointer",
              fontSize: "12px",
              fontWeight: "600",
            }}
          >
            ✓ Tier 2 Visa Only
          </button>
          <div style={{ fontSize: "12px", color: "#666" }}>
            {displayedJobs.length} jobs found
            {visaOnly &&
              ` · ${jobs.filter((j) => j.visa_sponsor).length} with visa sponsorship`}
          </div>
        </div>
      )}

      {/* Popular searches */}
      {!searched && (
        <div style={{ marginBottom: "1.5rem" }}>
          <div
            style={{
              fontSize: "12px",
              color: "#666",
              marginBottom: "8px",
            }}
          >
            Popular searches:
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
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
            ].map((term, i) => (
              <button
                key={i}
                onClick={() => setQuery(term)}
                style={{
                  padding: "6px 14px",
                  background: "transparent",
                  border: "1px solid #333",
                  borderRadius: "999px",
                  color: "#888",
                  cursor: "pointer",
                  fontSize: "12px",
                }}
              >
                {term}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div
          style={{
            background: "#1a1a2e",
            borderRadius: "12px",
            padding: "24px",
            border: "1px solid #333",
            textAlign: "center",
          }}
        >
          <div
            style={{
              color: "#667eea",
              fontSize: "14px",
              marginBottom: "8px",
            }}
          >
            Searching jobs...
          </div>
          <div style={{ color: "#666", fontSize: "12px" }}>
            Checking Home Office sponsor list and live job listings
          </div>
        </div>
      )}

      {/* No results */}
      {!loading && searched && displayedJobs.length === 0 && (
        <div
          style={{
            background: "#1a1a2e",
            borderRadius: "12px",
            padding: "24px",
            border: "1px solid #333",
            textAlign: "center",
          }}
        >
          <div style={{ color: "#888", fontSize: "14px" }}>
            No jobs found for "{query}"
          </div>
          <div style={{ color: "#666", fontSize: "12px", marginTop: "8px" }}>
            Try a different search term or remove the visa filter
          </div>
        </div>
      )}

      {/* Job cards */}
      {!loading &&
        displayedJobs.map((job, i) => (
          <div
            key={i}
            style={{
              background: "#1a1a2e",
              borderRadius: "12px",
              padding: "16px 20px",
              border: "1px solid #333",
              marginBottom: "10px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "16px",
            }}
          >
            {/* Left — company logo initial + details */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "14px",
                flex: 1,
                minWidth: 0,
              }}
            >
              {/* Company logo initial */}
              <div
                style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "10px",
                  background: "linear-gradient(135deg, #667eea22, #764ba222)",
                  border: "1px solid #667eea44",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "16px",
                  fontWeight: "700",
                  color: "#667eea",
                  flexShrink: 0,
                }}
              >
                {job.company[0]?.toUpperCase()}
              </div>

              {/* Job details */}
              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    fontSize: "14px",
                    fontWeight: "600",
                    color: "#fff",
                    marginBottom: "3px",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {job.title}
                </div>
                <div
                  style={{
                    fontSize: "12px",
                    color: "#888",
                    marginBottom: "6px",
                  }}
                >
                  {job.company} · {job.location}
                </div>
                <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                  {/* Visa badge */}
                  {job.visa_sponsor && (
                    <span
                      style={{
                        fontSize: "11px",
                        padding: "2px 8px",
                        borderRadius: "999px",
                        background: "#11998e22",
                        color: "#11998e",
                        border: "1px solid #11998e44",
                        fontWeight: "500",
                      }}
                    >
                      ✓ Tier 2 Sponsor
                    </span>
                  )}
                  {/* Salary badge */}
                  {job.salary !== "Salary not specified" && (
                    <span
                      style={{
                        fontSize: "11px",
                        padding: "2px 8px",
                        borderRadius: "999px",
                        background: "#667eea22",
                        color: "#667eea",
                        border: "1px solid #667eea44",
                      }}
                    >
                      {job.salary}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Right — apply button */}
            {job.url && (
              <a
                href={job.url}
                target="_blank"
                rel="noreferrer"
                style={{
                  padding: "8px 16px",
                  background: "linear-gradient(135deg, #667eea, #764ba2)",
                  borderRadius: "8px",
                  color: "#fff",
                  fontSize: "12px",
                  fontWeight: "600",
                  textDecoration: "none",
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                }}
              >
                Apply →
              </a>
            )}
          </div>
        ))}
    </div>
  );
}

export default Jobs;
