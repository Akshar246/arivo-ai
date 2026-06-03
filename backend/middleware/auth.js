const jwt = require("jsonwebtoken");

// ─────────────────────────────────────────────
// AUTH MIDDLEWARE — protects private routes
// Runs BEFORE the controller on protected routes
// Think of it as a security guard at the door
// If you have a valid token — you get in
// If not — you are turned away immediately
// ─────────────────────────────────────────────
const protect = async (req, res, next) => {
  try {
    let token;

    // Check if the request has an Authorization header
    // Tokens are sent as: "Bearer eyJhbGc..."
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      // Extract just the token part — remove "Bearer " prefix
      token = req.headers.authorization.split(" ")[1];
    }

    // If no token found — reject the request immediately
    if (!token) {
      return res.status(401).json({ message: "Not authorised — no token" });
    }

    // Verify the token using our JWT secret
    // If token is fake or expired — jwt.verify throws an error
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach the user id to the request object
    // This makes req.user available in every protected controller
    req.user = { id: decoded.id };

    // Call next() to pass control to the actual controller
    // Without this line — the request would hang forever
    next();

  } catch (error) {
    // Token was invalid or expired
    console.error("Auth middleware error:", error.message);
    res.status(401).json({ message: "Not authorised — invalid token" });
  }
};

module.exports = { protect };