const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Storage config - save to absolute path
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Absolute path: /project-root/uploads/
    // Works from any working directory
    const uploadsDir = path.join(__dirname, "../uploads");

    // Auto-create if missing
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    // Timestamp + original name to avoid collisions
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
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

module.exports = upload;
