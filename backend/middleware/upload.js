const multer = require("multer");
const path = require("path");
const os = require("os");
const fs = require("fs");

// Storage config
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // For serverless (Vercel/Render): use /tmp
    // For local/Docker: use uploads/
    const isServerless = process.env.VERCEL || process.env.RENDER;

    let uploadsDir;
    if (isServerless) {
      // Serverless: use system temp (ephemeral)
      uploadsDir = path.join(os.tmpdir(), "cv-uploads");
    } else {
      // Local/Docker: use project uploads folder
      uploadsDir = path.join(__dirname, "../uploads");
    }

    // Ensure directory exists
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

// File filter - only PDF
const fileFilter = (req, file, cb) => {
  const isPDF =
    file.mimetype === "application/pdf" ||
    file.mimetype === "application/octet-stream" ||
    file.originalname.toLowerCase().endsWith(".pdf");

  if (isPDF) {
    cb(null, true);
  } else {
    cb(new Error("Only PDF files are allowed"), false);
  }
};

// Multer instance
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

module.exports = upload;
