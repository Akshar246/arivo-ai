const fs = require("fs");
const path = require("path");
const axios = require("axios");
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://localhost:8000";
const FormData = require("form-data");

// ─────────────────────────────────────────────
// EXTRACT TEXT FROM PDF
// We send the PDF file directly to our Python
// AI service which uses pdfplumber — the most
// reliable PDF extraction library available
// Python handles PDF much better than Node.js
// ─────────────────────────────────────────────
const extractTextFromPDF = async (filePath) => {
  // Create a form with the PDF file attached
  const form = new FormData();
  form.append("file", fs.createReadStream(filePath), {
    filename: "cv.pdf",
    contentType: "application/pdf",
  });

  // Send to Python AI service for extraction
  const response = await axios.post(
    `${AI_SERVICE_URL}/extract-pdf`,
    form,
    { headers: form.getHeaders() }
  );

  console.log(`Extracted ${response.data.characters} characters from ${response.data.pages} pages`);
  return response.data.text;
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
      { cv_text: truncatedText }
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
const uploadCV = async (req, res) => {
  try {
    // Check file was actually uploaded
    if (!req.file) {
      return res.status(400).json({ message: "Please upload a PDF file" });
    }

    const filePath = req.file.path;

    // Step 1 — Extract text from PDF via Python
    console.log("Extracting text from PDF...");
    const rawText = await extractTextFromPDF(filePath);

    // Step 2 — Send text to Groq for skill extraction
    console.log("Extracting skills with AI...");
    const skills = await extractSkillsWithAI(rawText);

    // Step 3 — Delete temp PDF file after processing
    fs.unlinkSync(filePath);

    // Step 4 — Return results to frontend
    res.status(200).json({
      message: "CV analysed successfully",
      skills_found: skills,
      skills_count: skills.length,
      preview: rawText.substring(0, 800) + "...",
    });

  } catch (error) {
    console.error("CV upload error:", error.message);
    res.status(500).json({ message: "Error processing CV" });
  }
};

module.exports = { uploadCV };