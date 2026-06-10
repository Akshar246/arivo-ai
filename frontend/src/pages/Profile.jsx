import { useState } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

function Profile() {
  const { currentUser, token } = useAuth();

  // CV state
  const [cvFile, setCvFile] = useState(null);
  const [cvLoading, setCvLoading] = useState(false);
  const [cvSkills, setCvSkills] = useState([]);
  const [cvUploaded, setCvUploaded] = useState(false);

  // Skill gap state
  const [targetRole, setTargetRole] = useState(currentUser?.targetRole || "");
  const [visaOnly, setVisaOnly] = useState(false);
  const [gapLoading, setGapLoading] = useState(false);
  const [gapResult, setGapResult] = useState(null);
  const [manualSkill, setManualSkill] = useState("");
  const [allSkills, setAllSkills] = useState([]);

  // ─────────────────────────────────────────────
  // UPLOAD CV
  // Extracts skills automatically using AI
  // Auto populates the skill list — zero manual effort
  // ─────────────────────────────────────────────
  const uploadCV = async () => {
    if (!cvFile) return;
    setCvLoading(true);

    try {
      const formData = new FormData();
      formData.append("cv", cvFile);

      const response = await axios.post(
        "http://localhost:5001/api/cv/upload",
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        },
      );

      const extracted = response.data.skills_found || [];
      setCvSkills(extracted);
      setAllSkills(extracted);
      setCvUploaded(true);
    } catch (error) {
      alert(error.response?.data?.message || "CV upload failed");
    }

    setCvLoading(false);
  };

  // ─────────────────────────────────────────────
  // ADD MANUAL SKILL
  // User can type any skill not found in CV
  // ─────────────────────────────────────────────
  const addManualSkill = () => {
    if (!manualSkill.trim()) return;
    if (!allSkills.includes(manualSkill.trim())) {
      setAllSkills((prev) => [...prev, manualSkill.trim()]);
    }
    setManualSkill("");
  };

  // ─────────────────────────────────────────────
  // REMOVE SKILL
  // User can remove any skill from the list
  // ─────────────────────────────────────────────
  const removeSkill = (skill) => {
    setAllSkills((prev) => prev.filter((s) => s !== skill));
  };

  // ─────────────────────────────────────────────
  // ANALYSE SKILL GAP
  // Sends all skills + target role to smart endpoint
  // Returns real market based gap analysis
  // ─────────────────────────────────────────────
  const analyseGap = async () => {
    if (!targetRole.trim()) {
      alert("Please enter your target role first");
      return;
    }
    if (allSkills.length === 0) {
      alert("Please upload your CV or add skills manually");
      return;
    }

    setGapLoading(true);
    setGapResult(null);

    try {
      const response = await axios.post(
        "http://localhost:8000/skill-gap/analyse",
        {
          user_skills: allSkills,
          target_role: targetRole,
          visa_only: visaOnly,
        },
      );
      setGapResult(response.data);
    } catch {
      alert("Could not connect to AI service");
    }

    setGapLoading(false);
  };

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
          Your Profile 👤
        </div>
        <div style={{ fontSize: "13px", color: "#888" }}>
          {currentUser?.name} · {currentUser?.university}
        </div>
      </div>

      {/* Step 1 — CV Upload */}
      <div
        style={{
          background: "#1a1a2e",
          borderRadius: "12px",
          padding: "20px",
          border: "1px solid #333",
          marginBottom: "16px",
        }}
      >
        <div
          style={{
            fontSize: "14px",
            fontWeight: "600",
            color: "#fff",
            marginBottom: "4px",
          }}
        >
          Step 1 — Upload Your CV
        </div>
        <div
          style={{
            fontSize: "12px",
            color: "#888",
            marginBottom: "16px",
          }}
        >
          Arivo reads your CV and identifies all your skills automatically
        </div>

        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <input
            type="file"
            accept=".pdf"
            onChange={(e) => setCvFile(e.target.files[0])}
            style={{
              flex: 1,
              padding: "10px",
              background: "#0f0f1a",
              border: "1px solid #333",
              borderRadius: "8px",
              color: "#888",
              fontSize: "13px",
            }}
          />
          <button
            onClick={uploadCV}
            disabled={!cvFile || cvLoading}
            style={{
              padding: "10px 20px",
              background: cvFile
                ? "linear-gradient(135deg, #667eea, #764ba2)"
                : "#333",
              border: "none",
              borderRadius: "8px",
              color: "#fff",
              cursor: cvFile ? "pointer" : "not-allowed",
              fontSize: "13px",
              fontWeight: "600",
              whiteSpace: "nowrap",
            }}
          >
            {cvLoading ? "Reading CV..." : "Upload CV"}
          </button>
        </div>

        {/* Skills extracted from CV */}
        {cvUploaded && (
          <div style={{ marginTop: "16px" }}>
            <div
              style={{
                fontSize: "12px",
                color: "#11998e",
                marginBottom: "10px",
                fontWeight: "600",
              }}
            >
              ✅ {cvSkills.length} skills found in your CV
            </div>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "6px",
              }}
            >
              {allSkills.map((skill, i) => (
                <span
                  key={i}
                  onClick={() => removeSkill(skill)}
                  style={{
                    padding: "3px 10px",
                    background: "#667eea22",
                    border: "1px solid #667eea44",
                    borderRadius: "999px",
                    color: "#667eea",
                    fontSize: "11px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  {skill} ×
                </span>
              ))}
            </div>
            <div
              style={{
                fontSize: "11px",
                color: "#555",
                marginTop: "8px",
              }}
            >
              Click any skill to remove it
            </div>
          </div>
        )}
      </div>

      {/* Step 2 — Add skills manually */}
      <div
        style={{
          background: "#1a1a2e",
          borderRadius: "12px",
          padding: "20px",
          border: "1px solid #333",
          marginBottom: "16px",
        }}
      >
        <div
          style={{
            fontSize: "14px",
            fontWeight: "600",
            color: "#fff",
            marginBottom: "4px",
          }}
        >
          Step 2 — Add Any Missing Skills
        </div>
        <div
          style={{
            fontSize: "12px",
            color: "#888",
            marginBottom: "16px",
          }}
        >
          Type any skill Arivo might have missed from your CV
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          <input
            value={manualSkill}
            onChange={(e) => setManualSkill(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addManualSkill()}
            placeholder="e.g. Patient care, Tableau, Contract law..."
            style={{
              flex: 1,
              padding: "10px 14px",
              background: "#0f0f1a",
              border: "1px solid #333",
              borderRadius: "8px",
              color: "#fff",
              fontSize: "13px",
              outline: "none",
            }}
          />
          <button
            onClick={addManualSkill}
            style={{
              padding: "10px 20px",
              background: "linear-gradient(135deg, #667eea, #764ba2)",
              border: "none",
              borderRadius: "8px",
              color: "#fff",
              cursor: "pointer",
              fontSize: "13px",
              fontWeight: "600",
            }}
          >
            Add
          </button>
        </div>
      </div>

      {/* Step 3 — Target role and analyse */}
      <div
        style={{
          background: "#1a1a2e",
          borderRadius: "12px",
          padding: "20px",
          border: "1px solid #333",
          marginBottom: "16px",
        }}
      >
        <div
          style={{
            fontSize: "14px",
            fontWeight: "600",
            color: "#fff",
            marginBottom: "4px",
          }}
        >
          Step 3 — Analyse Your Skill Gap
        </div>
        <div
          style={{
            fontSize: "12px",
            color: "#888",
            marginBottom: "16px",
          }}
        >
          Enter your target role — Arivo analyses real London job listings to
          find your gap
        </div>

        <input
          value={targetRole}
          onChange={(e) => setTargetRole(e.target.value)}
          placeholder="e.g. ML Engineer, Teacher, Nurse, Finance Analyst..."
          style={{
            width: "100%",
            padding: "10px 14px",
            background: "#0f0f1a",
            border: "1px solid #333",
            borderRadius: "8px",
            color: "#fff",
            fontSize: "13px",
            outline: "none",
            marginBottom: "12px",
            boxSizing: "border-box",
          }}
        />

        {/* Visa only toggle */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            marginBottom: "16px",
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
            ✓ Tier 2 Visa Sponsors Only
          </button>
          <div style={{ fontSize: "12px", color: "#666" }}>
            Only analyse skills needed by visa sponsoring companies
          </div>
        </div>

        <button
          onClick={analyseGap}
          disabled={gapLoading}
          style={{
            width: "100%",
            padding: "12px",
            background: "linear-gradient(135deg, #667eea, #764ba2)",
            border: "none",
            borderRadius: "8px",
            color: "#fff",
            fontSize: "14px",
            fontWeight: "600",
            cursor: gapLoading ? "not-allowed" : "pointer",
            opacity: gapLoading ? 0.7 : 1,
          }}
        >
          {gapLoading ? "Analysing real job market..." : "Analyse My Skill Gap"}
        </button>
      </div>

      {/* Results */}
      {gapResult && !gapResult.error && (
        <div
          style={{
            background: "#1a1a2e",
            borderRadius: "12px",
            padding: "20px",
            border: "1px solid #333",
          }}
        >
          {/* Score */}
          <div
            style={{
              fontSize: "14px",
              fontWeight: "600",
              color: "#fff",
              marginBottom: "16px",
            }}
          >
            {gapResult.target_role} — Market Analysis
          </div>

          <div
            style={{
              background: "#0f0f1a",
              borderRadius: "999px",
              height: "10px",
              marginBottom: "8px",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${gapResult.readiness_score}%`,
                height: "100%",
                background:
                  gapResult.readiness_score > 60
                    ? "linear-gradient(135deg, #11998e, #38ef7d)"
                    : gapResult.readiness_score > 30
                      ? "linear-gradient(135deg, #f7971e, #ffd200)"
                      : "linear-gradient(135deg, #e74c3c, #c0392b)",
                borderRadius: "999px",
                transition: "width 0.5s ease",
              }}
            />
          </div>

          <div
            style={{
              fontSize: "28px",
              fontWeight: "700",
              color: "#667eea",
              marginBottom: "4px",
            }}
          >
            {gapResult.readiness_score}/100
          </div>

          <div
            style={{
              fontSize: "12px",
              color: "#888",
              marginBottom: "16px",
            }}
          >
            {gapResult.summary}
          </div>

          {/* Stats row */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: "10px",
              marginBottom: "16px",
            }}
          >
            {[
              {
                label: "Jobs analysed",
                value: gapResult.jobs_analysed,
                color: "#667eea",
              },
              {
                label: "Visa sponsors found",
                value: gapResult.visa_sponsors_found,
                color: "#11998e",
              },
              {
                label: "Skills matching",
                value: gapResult.matching_skills.length,
                color: "#764ba2",
              },
            ].map((stat, i) => (
              <div
                key={i}
                style={{
                  background: "#16213e",
                  borderRadius: "8px",
                  padding: "12px",
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    fontSize: "20px",
                    fontWeight: "700",
                    color: stat.color,
                  }}
                >
                  {stat.value}
                </div>
                <div
                  style={{
                    fontSize: "11px",
                    color: "#666",
                    marginTop: "2px",
                  }}
                >
                  {stat.label}
                </div>
              </div>
            ))}
          </div>

          {/* Visa sponsor companies */}
          {gapResult.visa_sponsor_companies.length > 0 && (
            <div style={{ marginBottom: "16px" }}>
              <div
                style={{
                  fontSize: "12px",
                  color: "#11998e",
                  fontWeight: "600",
                  marginBottom: "8px",
                }}
              >
                COMPANIES THAT CAN SPONSOR YOUR VISA
              </div>
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "6px",
                }}
              >
                {gapResult.visa_sponsor_companies.map((company, i) => (
                  <span
                    key={i}
                    style={{
                      padding: "4px 12px",
                      background: "#11998e22",
                      border: "1px solid #11998e44",
                      borderRadius: "999px",
                      color: "#11998e",
                      fontSize: "12px",
                      fontWeight: "500",
                    }}
                  >
                    {company}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Matching skills */}
          {gapResult.matching_skills.length > 0 && (
            <div style={{ marginBottom: "16px" }}>
              <div
                style={{
                  fontSize: "12px",
                  color: "#888",
                  fontWeight: "600",
                  marginBottom: "8px",
                }}
              >
                ✅ SKILLS YOU ALREADY HAVE
              </div>
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "6px",
                }}
              >
                {gapResult.matching_skills.map((skill, i) => (
                  <span
                    key={i}
                    style={{
                      padding: "4px 12px",
                      background: "#667eea22",
                      border: "1px solid #667eea44",
                      borderRadius: "999px",
                      color: "#667eea",
                      fontSize: "12px",
                      textTransform: "capitalize",
                    }}
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Missing required skills with resources */}
          {gapResult.missing_required.length > 0 && (
            <div style={{ marginBottom: "16px" }}>
              <div
                style={{
                  fontSize: "12px",
                  color: "#e74c3c",
                  fontWeight: "600",
                  marginBottom: "8px",
                }}
              >
                ❌ SKILLS TO LEARN — REQUIRED
              </div>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                }}
              >
                {gapResult.missing_required.map((skill, i) => {
                  const resource = gapResult.learning_resources[skill];
                  return (
                    <div
                      key={i}
                      style={{
                        background: "#16213e",
                        borderRadius: "8px",
                        padding: "12px",
                        border: "1px solid #e74c3c22",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "13px",
                          fontWeight: "600",
                          color: "#fff",
                          marginBottom: resource ? "6px" : "0",
                          textTransform: "capitalize",
                        }}
                      >
                        {skill}
                      </div>
                      {resource && (
                        <div
                          style={{
                            fontSize: "12px",
                            color: "#888",
                          }}
                        >
                          📚 {resource.resource} · ⏱ {resource.time}
                          {resource.url && (
                            <a
                              href={resource.url}
                              target="_blank"
                              rel="noreferrer"
                              style={{
                                color: "#667eea",
                                marginLeft: "8px",
                                fontSize: "11px",
                              }}
                            >
                              Learn free →
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Nice to have */}
          {gapResult.missing_nice_to_have.length > 0 && (
            <div>
              <div
                style={{
                  fontSize: "12px",
                  color: "#888",
                  fontWeight: "600",
                  marginBottom: "8px",
                }}
              >
                💡 NICE TO HAVE
              </div>
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "6px",
                }}
              >
                {gapResult.missing_nice_to_have.map((skill, i) => (
                  <span
                    key={i}
                    style={{
                      padding: "4px 12px",
                      background: "#ffd20011",
                      border: "1px solid #ffd20033",
                      borderRadius: "999px",
                      color: "#ffd200",
                      fontSize: "12px",
                      textTransform: "capitalize",
                    }}
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default Profile;
