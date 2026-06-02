import { useState } from "react";
import axios from "axios";

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

function SkillGap() {
  // Use a Set to track selected skills — simpler and cleaner
  const [selectedSkills, setSelectedSkills] = useState(new Set());
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const toggleSkill = (skill) => {
    // Create a new Set so React detects the change
    setSelectedSkills((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(skill)) {
        newSet.delete(skill); // remove if already selected
      } else {
        newSet.add(skill); // add if not selected
      }
      return newSet;
    });
  };

  const analyseGap = async () => {
    setLoading(true);

    // Convert Set to the skills object API expects
    // { python: 1, javascript: 1, ... }
    const skillsPayload = {};
    ALL_SKILLS.forEach((skill) => {
      skillsPayload[skill] = selectedSkills.has(skill) ? 1 : 0;
    });

    console.log("Sending skills:", skillsPayload);

    try {
      const response = await axios.post("http://127.0.0.1:8000/skill-gap", {
        skills: skillsPayload,
      });
      setResult(response.data);
    } catch (error) {
      alert("Could not connect to server. Is FastAPI running?");
    }
    setLoading(false);
  };

  return (
    <div className="skillgap-container">
      <h2>Select your current skills</h2>
      <p>Click all the skills you have — Arivo will analyse your readiness</p>

      <div className="skills-grid">
        {ALL_SKILLS.map((skill) => (
          <button
            key={skill}
            className={`skill-btn ${selectedSkills.has(skill) ? "selected" : ""}`}
            onClick={() => toggleSkill(skill)}
          >
            {skill.replace(/_/g, " ")}
          </button>
        ))}
      </div>

      <button className="analyse-btn" onClick={analyseGap} disabled={loading}>
        {loading ? "Analysing..." : "Analyse My Skills"}
      </button>

      {result && (
        <div className="result-box">
          <h3>Your ML Engineer Readiness</h3>
          <div className="score-bar-container">
            <div
              className="score-bar"
              style={{ width: `${result.readiness_score}%` }}
            />
          </div>
          <p className="score-text">{result.readiness_score}/100</p>
          <p>
            {result.skills_present} of {result.total_skills} skills present
          </p>
          <h4>Skills to learn next:</h4>
          <div className="missing-skills">
            {result.missing_skills.map((skill) => (
              <span key={skill} className="missing-badge">
                {skill.replace(/_/g, " ")}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default SkillGap;
