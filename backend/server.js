const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const helmet = require("helmet");
const fs = require("fs");
const path = require("path");
const connectDB = require("./config/db");

// ─────────────────────────────────────────────
// LOAD ENV VARIABLES (Bulletproof Local Parser)
// Handles Anaconda conflicts, Windows CRLF line endings,
// and strips surrounding quotes (" / ') from values.
// ─────────────────────────────────────────────
const envPath = path.join(__dirname, ".env");
if (fs.existsSync(envPath)) {
  const envFile = fs.readFileSync(envPath, "utf8");
  envFile.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();
    // Skip empty lines and comments
    if (trimmed && !trimmed.startsWith("#")) {
      const [key, ...valueParts] = trimmed.split("=");
      if (key) {
        let val = valueParts.join("=").trim();
        // Remove surrounding single or double quotes if present
        if (
          (val.startsWith('"') && val.endsWith('"')) ||
          (val.startsWith("'") && val.endsWith("'"))
        ) {
          val = val.slice(1, -1);
        }
        process.env[key.trim()] = val;
      }
    }
  });
  console.log("✅ Loaded env from .env file (Local mode)");
} else {
  console.log("🐳 No .env file found — using injected environment variables (Docker mode)");
}

// ─────────────────────────────────────────────
// CONNECT TO MONGODB
// ─────────────────────────────────────────────
connectDB();

// Initialize Express App
const app = express();

// ─────────────────────────────────────────────
// MIDDLEWARE
// ─────────────────────────────────────────────

// Helmet adds security headers in production
if (process.env.NODE_ENV === "production") {
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: "cross-origin" }, // Prevents blocking static uploads/PDF previews
    })
  );
}

// CORS configuration for local dev and production
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:3000",
      process.env.FRONTEND_URL, // e.g. Vercel deployment URL
    ].filter(Boolean),
    credentials: true,
  })
);

// Logging
app.use(morgan("dev"));

// Request Parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─────────────────────────────────────────────
// ROUTES
// ─────────────────────────────────────────────

// Auth Routes (Register, Login, Me, Google & LinkedIn OAuth)
app.use("/api/auth", require("./routes/authRoutes"));

// CV Routes (Upload & Processing)
app.use("/api/cv", require("./routes/cvRoutes"));

// Health Check Endpoint
app.get("/", (req, res) => {
  res.json({
    status: "online",
    message: "Arivo AI Backend is running",
    timestamp: new Date().toISOString(),
  });
});

// ─────────────────────────────────────────────
// ERROR HANDLING MIDDLEWARE
// ─────────────────────────────────────────────

// 404 Handler for unknown routes
app.use((req, res, next) => {
  res.status(404).json({ message: `Route not found: ${req.originalUrl}` });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error("🔥 Global Error Handler Caught:", err.stack || err.message);
  res.status(err.status || 500).json({
    message: err.message || "Internal Server Error",
  });
});

// ─────────────────────────────────────────────
// START SERVER
// ─────────────────────────────────────────────
const PORT = process.env.PORT || 5001;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Arivo AI Backend listening on http://localhost:${PORT}`);
});