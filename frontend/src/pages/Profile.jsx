import { useState } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

// ─────────────────────────────────────────────
// PROFILE PAGE
// Two features on this page:
// 1. CV Upload — user uploads PDF, Arivo extracts skills
// 2. Skill Gap — user selects skills, gets readiness score
// Both features are already built in the backend
// This page just connects them to a clean UI
// ─────────────────────────────────────────────
function Profile() {
  const { currentUser, token } = useAuth();

  // CV Upload state
  const [cvFile, setCvFile] = useState(null);
  const [cvLoading, setCvLoading] = useState(false);
  const [cvResult, setCvResult] = useState(null);

  // Skill Gap state
  const [selectedSkills, setSelectedSkills] = useState(new Set());
  const [gapResult, setGapResult] = useState(null);
  const [gapLoading, setGapLoading] = useState(false);

  const ALL_SKILLS = [
    "python",
    "javascript",
    "react",
    "node",
    "machine_learning",
    "deep_learning",
    "sql",
    "docker",
    "aws",
    "langchain",
    "nlp",
    "pytorch",
  ];

  // ─────────────────────────────────────────────
  // UPLOAD CV
  // Sends PDF to Node backend which sends to
  // Python AI service for text extraction
  // Then Groq identifies all skills from the text
  // ─────────────────────────────────────────────
  const uploadCV = async () => {
    if (!cvFile) return;
    setCvLoading(true);
    setCvResult(null);

    try {
      const formData = new FormData();
      formData.append("cv", cvFile);

      const response = await axios.post(
        "http://localhost:5001/api/cv/upload",
        formData,
        {
          headers: {
            // JWT token proves user is logged in
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        },
      );

      setCvResult(response.data);
    } catch (error) {
      setCvResult({
        error: error.response?.data?.message || "CV upload failed",
      });
    }

    setCvLoading(false);
  };

  // ─────────────────────────────────────────────
  // TOGGLE SKILL SELECTION
  // Uses a Set so skills can be toggled on and off
  // Set automatically handles duplicates
  // ─────────────────────────────────────────────
  const toggleSkill = (skill) => {
    setSelectedSkills((prev) => {
      const newSet = new Set(prev);
      newSet.has(skill) ? newSet.delete(skill) : newSet.add(skill);
      return newSet;
    });
    setGapResult(null);
  };

  // ─────────────────────────────────────────────
  // ANALYSE SKILL GAP
  // Sends selected skills to ML model
  // Returns readiness score and missing skills
  // ─────────────────────────────────────────────
  const analyseGap = async () => {
    setGapLoading(true);

    // Convert Set to object {skill: 0 or 1}
    const skillsPayload = {};
    ALL_SKILLS.forEach((skill) => {
      skillsPayload[skill] = selectedSkills.has(skill) ? 1 : 0;
    });

    try {
      const response = await axios.post("http://localhost:8000/skill-gap", {
        skills: skillsPayload,
      });
      setGapResult(response.data);
    } catch {
      alert("Could not connect to AI service");
    }

    setGapLoading(false);
  };

  return (
    <div style={{ padding: "1.5rem", maxWidth: "800px", margin: "0 auto" }}>
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

      {/* CV Upload Section */}
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
          Upload Your CV
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

        {/* File input */}
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
            {cvLoading ? "Analysing..." : "Upload CV"}
          </button>
        </div>

        {/* CV Results */}
        {cvResult && !cvResult.error && (
          <div style={{ marginTop: "16px" }}>
            <div
              style={{
                fontSize: "12px",
                color: "#11998e",
                marginBottom: "10px",
                fontWeight: "600",
              }}
            >
              ✅ {cvResult.skills_count} skills found in your CV
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
              {cvResult.skills_found.map((skill, i) => (
                <span
                  key={i}
                  style={{
                    padding: "3px 10px",
                    background: "#667eea22",
                    border: "1px solid #667eea44",
                    borderRadius: "999px",
                    color: "#667eea",
                    fontSize: "11px",
                  }}
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* CV Error */}
        {cvResult?.error && (
          <div
            style={{
              marginTop: "12px",
              color: "#e74c3c",
              fontSize: "13px",
            }}
          >
            {cvResult.error}
          </div>
        )}
      </div>

      {/* Skill Gap Section */}
      <div
        style={{
          background: "#1a1a2e",
          borderRadius: "12px",
          padding: "20px",
          border: "1px solid #333",
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
          Skill Gap Analyser
        </div>
        <div
          style={{
            fontSize: "12px",
            color: "#888",
            marginBottom: "16px",
          }}
        >
          Select your current skills and Arivo predicts your readiness score
        </div>

        {/* Skill buttons */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "8px",
            marginBottom: "16px",
          }}
        >
          {ALL_SKILLS.map((skill) => (
            <button
              key={skill}
              onClick={() => toggleSkill(skill)}
              style={{
                padding: "7px 14px",
                borderRadius: "999px",
                border: `1px solid ${selectedSkills.has(skill) ? "#667eea" : "#333"}`,
                background: selectedSkills.has(skill)
                  ? "linear-gradient(135deg, #667eea, #764ba2)"
                  : "transparent",
                color: selectedSkills.has(skill) ? "#fff" : "#888",
                cursor: "pointer",
                fontSize: "12px",
                fontWeight: selectedSkills.has(skill) ? "600" : "400",
                textTransform: "capitalize",
                transition: "all 0.15s",
              }}
            >
              {skill.replace(/_/g, " ")}
            </button>
          ))}
        </div>

        {/* Analyse button */}
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
            cursor: "pointer",
            marginBottom: "16px",
          }}
        >
          {gapLoading ? "Analysing..." : "Analyse My Skills"}
        </button>

        {/* Gap Results */}
        {gapResult && (
          <div
            style={{
              background: "#16213e",
              borderRadius: "10px",
              padding: "16px",
            }}
          >
            <div
              style={{
                fontSize: "13px",
                fontWeight: "600",
                color: "#fff",
                marginBottom: "12px",
              }}
            >
              ML Engineer Readiness
            </div>

            {/* Score bar */}
            <div
              style={{
                background: "#0f0f1a",
                borderRadius: "999px",
                height: "10px",
                marginBottom: "6px",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${gapResult.readiness_score}%`,
                  height: "100%",
                  background: "linear-gradient(135deg, #667eea, #764ba2)",
                  borderRadius: "999px",
                  transition: "width 0.5s ease",
                }}
              />
            </div>

            <div
              style={{
                fontSize: "24px",
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
                marginBottom: "12px",
              }}
            >
              {gapResult.skills_present} of {gapResult.total_skills} skills
              present
            </div>

            {/* Missing skills */}
            {gapResult.missing_skills.length > 0 && (
              <>
                <div
                  style={{
                    fontSize: "11px",
                    color: "#888",
                    fontWeight: "600",
                    marginBottom: "8px",
                  }}
                >
                  SKILLS TO LEARN NEXT
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                  {gapResult.missing_skills.map((skill, i) => (
                    <span
                      key={i}
                      style={{
                        padding: "3px 10px",
                        background: "#e74c3c22",
                        border: "1px solid #e74c3c44",
                        borderRadius: "999px",
                        color: "#e74c3c",
                        fontSize: "11px",
                        textTransform: "capitalize",
                      }}
                    >
                      {skill.replace(/_/g, " ")}
                    </span>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default Profile;
