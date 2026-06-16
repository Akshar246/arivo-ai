const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const helmet = require("helmet");
const fs = require("fs");
const path = require("path");
const connectDB = require("./config/db");

// ─────────────────────────────────────────────
// LOAD ENV VARIABLES
// In Docker: env vars are injected directly by
// docker-compose — no .env file exists in the
// container (blocked by .dockerignore for security).
// Locally: we read the .env file manually because
// Anaconda breaks the standard dotenv approach.
//
// This guard handles both cases cleanly:
// - Docker: file doesn't exist → skip, use injected vars
// - Local:  file exists → read and load it
// ─────────────────────────────────────────────
const envPath = path.join(__dirname, ".env");
if (fs.existsSync(envPath)) {
  const envFile = fs.readFileSync(envPath, "utf8");
  envFile.split("\n").forEach(line => {
    const trimmed = line.trim();
    // Skip empty lines and comments starting with #
    if (trimmed && !trimmed.startsWith("#")) {
      // Split on first = only — values may contain = signs
      const [key, ...valueParts] = trimmed.split("=");
      process.env[key.trim()] = valueParts.join("=").trim();
    }
  });
  console.log("Loaded env from .env file (local mode)");
} else {
  console.log("No .env file found — using injected environment variables (Docker mode)");
}

// ─────────────────────────────────────────────
// CONNECT TO MONGODB
// This runs once when server starts
// If connection fails — server shuts down
// ─────────────────────────────────────────────
connectDB();

// Create the Express application
const app = express();

// ─────────────────────────────────────────────
// MIDDLEWARE — runs on every single request
// Order matters — these run top to bottom
// ─────────────────────────────────────────────

// helmet adds security headers to every response
// Protects against common web vulnerabilities
if (process.env.NODE_ENV === "production") {
  app.use(helmet());
}

// cors allows our React frontend to talk to this server
// Without this — browser blocks all frontend requests
app.use(
  cors({
    origin: [
      "http://localhost:5173", // React dev server (local)
      "http://localhost:3000", // Docker frontend (nginx)
    ],
    credentials: true,
  })
);

// morgan logs every request to the console
// e.g. POST /api/auth/login 200 45ms
// Extremely useful for debugging
app.use(morgan("dev"));

// express.json() parses incoming JSON request bodies
// Without this — req.body would be undefined everywhere
app.use(express.json());

// ─────────────────────────────────────────────
// ROUTES — connect URL paths to route handlers
// ─────────────────────────────────────────────

// All auth routes start with /api/auth
// e.g. /api/auth/register → register function
//      /api/auth/login    → login function
//      /api/auth/me       → getMe function (protected)
app.use("/api/auth", require("./routes/authRoutes"));

// CV routes — upload and analyse CVs
app.use("/api/cv", require("./routes/cvRoutes"));

// ─────────────────────────────────────────────
// HEALTH CHECK — confirms server is running
// Hit GET / to verify everything is working
// ─────────────────────────────────────────────
app.get("/", (req, res) => {
  res.json({ message: "Arivo AI Backend is running" });
});

// ─────────────────────────────────────────────
// START SERVER — listen for incoming requests
// Uses PORT from .env or defaults to 5001
// 0.0.0.0 is required in Docker — without it the
// server only listens inside the container and
// nothing outside can reach it
// ─────────────────────────────────────────────
const PORT = process.env.PORT || 5001;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Arivo AI Backend running on port ${PORT}`);
});