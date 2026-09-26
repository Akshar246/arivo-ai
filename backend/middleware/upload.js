const multer = require("multer");
const path = require("path");
const os = require("os");
const fs = require("fs");

// Storage config
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Production (Vercel/Render/any) → /tmp
    // Local/Dev → uploads/
    const isProduction = process.env.NODE_ENV === "production" ||
                        process.env.VERCEL ||
                        process.env.RENDER ||
                        process.env.RAILWAY;

    let uploadsDir;
    if (isProduction) {
      // Production: use system temp (ephemeral, works on serverless)
      uploadsDir = path.join(os.tmpdir(), "cv-uploads");
    } else {
      // Local/Dev: use project uploads folder
      uploadsDir = path.join(__dirname, "../uploads");
    }

    // Ensure directory exists
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    console.log(`CV upload destination: ${uploadsDir} (production: ${isProduction})`);
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
