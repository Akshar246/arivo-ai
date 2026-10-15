const multer = require("multer");
const path = require("path");
const os = require("os");
const fs = require("fs");
const crypto = require("crypto");

// CVs are processed and deleted straight away. They go to a private temp folder under a name the
// server chooses, never the name the client sent.
const uploadsDir = path.join(os.tmpdir(), "arivo-cv-uploads");
fs.mkdirSync(uploadsDir, { recursive: true, mode: 0o700 });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => cb(null, `${crypto.randomBytes(16).toString("hex")}.pdf`),
});

// The type the browser reports can be faked, so this is only a first filter.
// The controller also checks the file really starts with the PDF signature.
const fileFilter = (req, file, cb) => {
  const okType = file.mimetype === "application/pdf" || file.mimetype === "application/octet-stream";
  const okName = file.originalname.toLowerCase().endsWith(".pdf");
  if (okType && okName) return cb(null, true);
  const err = new Error("Only PDF files are allowed");
  err.status = 400;
  cb(err, false);
};

module.exports = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024, files: 1, fields: 0 },
});
