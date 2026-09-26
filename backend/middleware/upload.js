const multer = require("multer");
const path = require("path");
const os = require("os");
const fs = require("fs");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    console.log("\n===== MULTER DESTINATION DEBUG =====");
    console.log("Current __dirname:", __dirname);

    const localUploadsDir = path.join(__dirname, "../uploads");
    console.log("Local uploads path:", localUploadsDir);
    console.log("Local uploads EXISTS:", fs.existsSync(localUploadsDir));

    let localIsWritable = false;
    if (fs.existsSync(localUploadsDir)) {
      try {
        fs.accessSync(localUploadsDir, fs.constants.W_OK);
        localIsWritable = true;
        console.log("Local uploads IS WRITABLE");
      } catch (e) {
        console.log("Local uploads NOT WRITABLE:", e.code);
      }
    }

    let uploadsDir;
    if (fs.existsSync(localUploadsDir) && localIsWritable) {
      uploadsDir = localUploadsDir;
      console.log("CHOICE: Using LOCAL folder");
    } else {
      uploadsDir = path.join(os.tmpdir(), "cv-uploads");
      console.log("CHOICE: Using /TMP folder (reason: local not available)");
    }

    try {
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
        console.log("Created:", uploadsDir);
      }
    } catch (mkErr) {
      console.log("ERROR creating dir:", mkErr.message);
    }

    console.log("FINAL PATH:", uploadsDir);
    console.log("====================================\n");

    cb(null, uploadsDir);
  },

  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

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

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

module.exports = upload;
