const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// ─────────────────────────────────────────────
// REGISTER — creates a new user account
// Called when someone signs up for Arivo AI
// ─────────────────────────────────────────────
const register = async (req, res) => {
  try {
    // Pull the fields out of the request body
    // This is what the frontend sends us
    const { name, email, password, nationality, university, course, targetRole } = req.body;

    // Check if a user with this email already exists
    // We never want two accounts with the same email
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already registered" });
    }

    // Hash the password before saving to database
    // bcrypt adds a random salt and hashes 10 times
    // This means even if database is hacked — passwords are safe
    // NEVER store plain text passwords — ever
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create the new user in MongoDB
    const user = await User.create({
      name,
      email,
      password: hashedPassword, // store hashed version only
      nationality,
      university,
      course,
      targetRole,
    });

    // Create a JWT token for this user
    // Token contains user id and expires in 7 days
    // Frontend stores this token and sends it with every request
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // Return the token and basic user info
    // Frontend uses this to know who is logged in
    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        targetRole: user.targetRole,
      },
    });

  } catch (error) {
    // If anything goes wrong — return a clean error message
    // Never expose the raw error to the client in production
    console.error("Register error:", error.message);
    res.status(500).json({ message: "Server error during registration" });
  }
};

// ─────────────────────────────────────────────
// LOGIN — checks credentials and returns token
// Called when an existing user signs in
// ─────────────────────────────────────────────
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email in MongoDB
    const user = await User.findOne({ email });
    if (!user) {
      // Use vague message intentionally — 
      // never confirm whether an email exists or not
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Compare the plain text password with the hashed one
    // bcrypt.compare handles the unhashing internally
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Password is correct — create a new JWT token
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // Return token and user info to frontend
    res.status(200).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        targetRole: user.targetRole,
      },
    });

  } catch (error) {
    console.error("Login error:", error.message);
    res.status(500).json({ message: "Server error during login" });
  }
};

// ─────────────────────────────────────────────
// GET ME — returns the current logged in user
// Called when frontend needs to verify who is logged in
// ─────────────────────────────────────────────
const getMe = async (req, res) => {
  try {
    // req.user.id comes from the auth middleware
    // We find the user but exclude the password field
    const user = await User.findById(req.user.id).select("-password");
    res.status(200).json(user);
  } catch (error) {
    console.error("GetMe error:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

// Export all three functions so routes can use them
module.exports = { register, login, getMe };