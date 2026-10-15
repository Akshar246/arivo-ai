const fs = require("fs");
const path = require("path");
const axios = require("axios");
const { aiHeaders } = require("../utils/aiHeaders");
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://localhost:8000";
const FormData = require("form-data");
const User = require("../models/User");

// Find the CV line that mentions a skill — real evidence, not a guess
const findEvidence = (cvText, skill) => {
  const escaped = skill.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(`(^|[^a-z0-9])${escaped}($|[^a-z0-9])`, "i");
  const line = cvText.split(/\r?\n/).map((l) => l.trim()).find((l) => l.length > 3 && re.test(l));
  return line ? line.slice(0, 160) : "";
};

// ─────────────────────────────────────────────
// EXTRACT TEXT FROM PDF
// We send the PDF file directly to our Python
// AI service which uses pdfplumber — the most
// reliable PDF extraction library available
// Python handles PDF much better than Node.js
// ─────────────────────────────────────────────
const extractTextFromPDF = async (filePath) => {
  try {
    // Check file exists before trying to read
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found at: ${filePath}`);
    }

    console.log(`Reading file: ${filePath}`);

    // Create a form with the PDF file attached
    const form = new FormData();
    form.append("file", fs.createReadStream(filePath), {
      filename: "cv.pdf",
      contentType: "application/pdf",
    });

    console.log(`Sending to AI service: ${AI_SERVICE_URL}/extract-pdf`);

    // Send to Python AI service for extraction
    const response = await axios.post(
      `${AI_SERVICE_URL}/extract-pdf`,
      form,
      { headers: { ...form.getHeaders(), ...aiHeaders() } }
    );

    console.log(`Extracted ${response.data.characters} characters from ${response.data.pages} pages`);
    return response.data.text;
  } catch (error) {
    console.error("PDF extraction error:", error.message);
    throw error;
  }
};

// ─────────────────────────────────────────────
// EXTRACT SKILLS USING AI
// Send extracted CV text to Groq via AI service
// Groq identifies every skill intelligently
// Works for any field — tech, medical, law etc
// ─────────────────────────────────────────────
const extractSkillsWithAI = async (cvText) => {
  try {
    // Truncate to first 3000 characters
    // More than enough for skill extraction
    // Prevents token limit errors with Groq
    const truncatedText = cvText.substring(0, 3000);

    const response = await axios.post(
      `${AI_SERVICE_URL}/extract-skills`,
      { cv_text: truncatedText },
      { headers: aiHeaders(), timeout: 60000 }
    );
    return response.data.skills;
  } catch (error) {
    console.error("AI extraction error:", error.message);
    return [];
  }
};
// ─────────────────────────────────────────────
// UPLOAD CV — main controller
// Flow: receive PDF → send to Python for text
//       extraction → send text to Groq for
//       skill identification → return results
// ─────────────────────────────────────────────
const looksLikePdf = (filePath) => {
  const fd = fs.openSync(filePath, "r");
  try {
    const buf = Buffer.alloc(5);
    fs.readSync(fd, buf, 0, 5, 0);
    return buf.toString("latin1") === "%PDF-";
  } finally {
    fs.closeSync(fd);
  }
};

const uploadCV = async (req, res) => {
  // The uploaded file holds personal data, so it is deleted on every path, success or failure
  const filePath = req.file?.path;
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Please upload a PDF file" });
    }
    if (!looksLikePdf(filePath)) {
      return res.status(400).json({ message: "That file isn't a valid PDF." });
    }

    // Step 1 — Extract text from the PDF in the AI service
    const rawText = await extractTextFromPDF(filePath);

    // Step 2 — Send text to the language model for skill extraction
    const skills = await extractSkillsWithAI(rawText);

    // Step 3b — Save to the career profile. CV skills are replaced;
    // manual and learned skills are kept.
    const user = await User.findById(req.user.id);
    if (!user) return res.status(401).json({ message: "Account not found. Log in again." });
    const kept = user.careerProfile.skills.filter((s) => s.source !== "cv");
    const keptNames = new Set(kept.map((s) => s.name.toLowerCase()));
    const cvSkills = skills
      .filter((n) => typeof n === "string" && n.trim() && !keptNames.has(n.trim().toLowerCase()))
      .map((n) => ({ name: n.trim(), source: "cv", evidence: findEvidence(rawText, n.trim()) }));
    user.careerProfile.skills = [...cvSkills, ...kept];
    user.careerProfile.cvText = rawText.slice(0, 20000);
    user.careerProfile.cvUploadedAt = new Date();
    await user.save();

    // Step 4 — Return results to frontend
    res.status(200).json({
      message: "CV analysed successfully",
      skills_found: skills,
      skills: user.careerProfile.skills,
      skills_count: skills.length,
      preview: rawText.substring(0, 800) + "...",
    });

  } catch (error) {
    // Log the detail server side; the client only gets a generic message
    console.error("CV upload error:", error.message);
    res.status(500).json({ message: "We couldn't process that CV. Please try again." });
  } finally {
    if (filePath) fs.unlink(filePath, () => {});
  }
};

module.exports = { uploadCV };