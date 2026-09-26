const multer = require("multer");
const path = require("path");
const os = require("os");
const fs = require("fs");

// ─────────────────────────────────────────────
// STORAGE CONFIG — tells multer where to save
// uploaded files and what to name them
// Uses system temp directory for Vercel/Render
// compatibility (files are deleted after use)
// ─────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Use system temp directory for cloud compatibility
    // Files are temporary and deleted after extraction
    let uploadsDir;

    // Try local uploads folder first (Docker/local dev)
    const localUploads = path.join(__dirname, "../uploads");
    if (fs.existsSync(path.dirname(localUploads))) {
      uploadsDir = localUploads;
    } else {
      // Fall back to system temp (Vercel/Render)
      uploadsDir = path.join(os.tmpdir(), "cv-uploads");
    }

    // Ensure directory exists
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    // Name the file with timestamp + original name
    // This prevents two users overwriting each other
    // e.g. 1234567890-akshar_cv.pdf
    cb(null, Date.now() + "-" + file.originalname);
  },
});

// ─────────────────────────────────────────────
// FILE FILTER — only accept PDF files
// If someone tries to upload a .exe or .jpg
// we reject it immediately
// ─────────────────────────────────────────────
const fileFilter = (req, file, cb) => {
  // Check both mimetype AND file extension
  // Postman sometimes sends PDFs as octet-stream
  const isPDF =
    file.mimetype === "application/pdf" ||
    file.mimetype === "application/octet-stream" ||
    file.originalname.toLowerCase().endsWith(".pdf");

  if (isPDF) {
    cb(null, true); // accept the file
  } else {
    cb(new Error("Only PDF files are allowed"), false);
  }
};

// ─────────────────────────────────────────────
// CREATE MULTER INSTANCE
// Combines storage config and file filter
// maxSize: 5MB — prevents huge file uploads
// ─────────────────────────────────────────────
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
});

module.exports = upload;