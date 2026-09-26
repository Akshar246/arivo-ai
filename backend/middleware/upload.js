const multer = require("multer");
const path = require("path");
const os = require("os");
const fs = require("fs");

// Storage config
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Try local uploads folder first
    // If it doesn't exist or not writable → use /tmp (production safe)
    const localUploadsDir = path.join(__dirname, "../uploads");

    let uploadsDir;
    try {
      // Check if we can write to local uploads folder
      if (fs.existsSync(localUploadsDir) && fs.accessSync(localUploadsDir, fs.constants.W_OK)) {
        uploadsDir = localUploadsDir;
      } else {
        throw new Error("Local uploads not writable");
      }
    } catch (err) {
      // Fall back to system temp (safe for production)
      uploadsDir = path.join(os.tmpdir(), "cv-uploads");
    }

    // Ensure directory exists
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    console.log("CV upload to: " + uploadsDir);
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
