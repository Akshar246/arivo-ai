const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const helmet = require("helmet");
const fs = require("fs");
const path = require("path");
const connectDB = require("./config/db");

// ─────────────────────────────────────────────
// LOAD ENV VARIABLES MANUALLY
// We do this manually because Anaconda has a global
// dotenv interceptor that breaks the standard approach
// This reads the .env file directly and loads each line
// into process.env ourselves — no third party needed
// ─────────────────────────────────────────────
const envPath = path.join(__dirname, ".env");
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
    origin: "http://localhost:5173", // React dev server
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

// ─────────────────────────────────────────────
// HEALTH CHECK — confirms server is running
// Hit GET / to verify everything is working
// ─────────────────────────────────────────────
app.get("/", (req, res) => {
  res.json({ message: "Arivo AI Backend is running" });
});

// ─────────────────────────────────────────────
// START SERVER — listen for incoming requests
// Uses PORT from .env or defaults to 5000
// ─────────────────────────────────────────────
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Arivo AI Backend running on port ${PORT}`);
});