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
        if (process.env[key.trim()] === undefined) process.env[key.trim()] = val;
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
// Sessions are signed with JWT_SECRET. A missing or very short secret would let anyone forge a
// login, so production refuses to start without one. Below 32 characters it still starts but warns.
const jwtSecretLength = (process.env.JWT_SECRET || "").length;
if (process.env.NODE_ENV === "production" && jwtSecretLength < 16) {
  console.error("FATAL: JWT_SECRET must be set and at least 16 characters (32 or more is recommended).");
  process.exit(1);
}
if (process.env.NODE_ENV === "production" && jwtSecretLength < 32) {
  console.warn("WARNING: JWT_SECRET is shorter than 32 characters. Replace it with a longer random value.");
}

connectDB();

// Initialize Express App
const app = express();

// Behind Render/other proxies req.ip would otherwise be the proxy for everyone
app.set("trust proxy", 1);

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
    // Sessions travel in the Authorization header, not cookies, so credentials are not needed
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    maxAge: 600,
  })
);

// Logging
// Log the path only: some links carry a token in the query string (e.g. unsubscribe)
morgan.token("path", (req) => req.path);
app.use(morgan(":method :path :status :response-time ms"));

// Request Parsers
app.use(express.json({ limit: "100kb" }));
app.use(express.urlencoded({ extended: false, limit: "100kb" }));

// A general ceiling per address on top of the stricter limits on sign-in, reset and AI routes
const { rateLimit } = require("./middleware/rateLimit");
app.use("/api", rateLimit({ windowMs: 15 * 60 * 1000, max: 600, message: "Too many requests. Please slow down." }));

// ─────────────────────────────────────────────
// ROUTES
// ─────────────────────────────────────────────

// Auth Routes (Register, Login, Me, Google & LinkedIn OAuth)
app.use("/api/auth", require("./routes/authRoutes"));

// CV Routes (Upload & Processing)
app.use("/api/cv", require("./routes/cvRoutes"));

// Career profile (skills, gap analysis, learning plan, ATS) and application tracker
app.use("/api/profile", require("./routes/profileRoutes"));
app.use("/api/applications", require("./routes/applicationRoutes"));
app.use("/api/scout", require("./routes/scoutRoutes"));
app.use("/api/feedback", require("./routes/feedbackRoutes"));

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
  res.status(404).json({ message: "Route not found" });
});

// Global Error Handler
app.use((err, req, res, next) => {
  // Known client mistakes get a short, fixed message. Nothing internal (parser wording, paths,
  // stack traces) is ever sent to the client; the detail stays in the server log.
  if (err.name === "MulterError") {
    const tooBig = err.code === "LIMIT_FILE_SIZE";
    return res.status(tooBig ? 413 : 400).json({ message: tooBig ? "That file is too large (5 MB maximum)." : "That upload isn't accepted." });
  }
  if (err.type === "entity.parse.failed") return res.status(400).json({ message: "Invalid request body" });
  if (err.type === "entity.too.large") return res.status(413).json({ message: "Request too large" });

  const status = err.status || err.statusCode || 500;
  if (status >= 500) console.error("🔥 Server error:", err.stack || err.message);
  res.status(status).json({ message: status >= 500 ? "Internal Server Error" : err.message || "Request failed" });
});

// ─────────────────────────────────────────────
// START SERVER
// ─────────────────────────────────────────────
const PORT = process.env.PORT || 5001;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Arivo AI Backend listening on http://localhost:${PORT}`);
});