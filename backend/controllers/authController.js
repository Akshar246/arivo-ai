const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { sendVerificationEmail, sendResetEmail } = require("../utils/mailer");

// ─────────────────────────────────────────────
// STANDARD EMAIL/PASSWORD AUTH
// ─────────────────────────────────────────────
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const authUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  targetRole: user.targetRole,
  visaType: user.visaType,
  onboarded: !!user.onboardedAt,
  emailVerified: !!user.emailVerifiedAt,
});

const sha = (v) => crypto.createHash("sha256").update(v).digest("hex");
const HOUR = 60 * 60 * 1000;

// Stores a hashed one-time token on the user and emails the raw one
async function issueVerification(user) {
  const raw = crypto.randomBytes(32).toString("hex");
  user.verifyTokenHash = sha(raw);
  user.verifyExpiresAt = new Date(Date.now() + 72 * HOUR);
  await user.save();
  await sendVerificationEmail(user, raw);
}

const checkPassword = (password) => {
  // bcrypt ignores everything past 72 bytes, so cap it rather than silently truncate
  if (password.length < 8) return "Password must be at least 8 characters.";
  if (Buffer.byteLength(password) > 72) return "Password is too long (72 bytes max).";
  return "";
};

const signToken = (user, remember = false) =>
  jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: remember ? "30d" : "7d" });

const register = async (req, res) => {
  try {
    const name = String(req.body.name || "").trim();
    const email = String(req.body.email || "").trim().toLowerCase();
    const password = String(req.body.password || "");

    if (!name) return res.status(400).json({ message: "Please enter your full name." });
    if (name.length > 80) return res.status(400).json({ message: "That name is too long." });
    if (!EMAIL_RE.test(email)) return res.status(400).json({ message: "Enter a valid email address." });
    const pwProblem = checkPassword(password);
    if (pwProblem) return res.status(400).json({ message: pwProblem });

    if (await User.findOne({ email })) {
      return res.status(400).json({ message: "An account with this email already exists. Try logging in." });
    }

    const hashedPassword = await bcrypt.hash(password, await bcrypt.genSalt(10));
    const user = await User.create({ name, email, password: hashedPassword });

    // Never block sign-up on email delivery
    issueVerification(user).catch((e) => console.error("Verification email failed:", e.message));

    res.status(201).json({ token: signToken(user, !!req.body.remember), user: authUser(user) });
  } catch (error) {
    console.error("Register error:", error.message);
    res.status(500).json({ message: "Server error during registration" });
  }
};

const login = async (req, res) => {
  try {
    const email = String(req.body.email || "").trim().toLowerCase();
    const password = String(req.body.password || "");

    const user = email ? await User.findOne({ email }) : null;
    const isMatch = user ? await bcrypt.compare(password, user.password) : false;
    if (!isMatch) return res.status(400).json({ message: "Incorrect email or password." });

    res.status(200).json({ token: signToken(user, !!req.body.remember), user: authUser(user) });
  } catch (error) {
    console.error("Login error:", error.message);
    res.status(500).json({ message: "Server error during login" });
  }
};

const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    res.status(200).json(user);
  } catch (error) {
    console.error("GetMe error:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

// ─────────────────────────────────────────────
// PASSWORD RESET AND EMAIL VERIFICATION
// ─────────────────────────────────────────────
const forgotPassword = async (req, res) => {
  // Same answer whether or not the address has an account, so this can't be used to find who is registered
  const reply = () =>
    res.status(200).json({ message: "If an account exists for that email, we've sent a link to reset the password." });
  try {
    const email = String(req.body.email || "").trim().toLowerCase();
    if (!EMAIL_RE.test(email)) return res.status(400).json({ message: "Enter a valid email address." });

    const user = await User.findOne({ email });
    if (user) {
      const raw = crypto.randomBytes(32).toString("hex");
      user.resetTokenHash = sha(raw);
      user.resetExpiresAt = new Date(Date.now() + HOUR);
      await user.save();
      sendResetEmail(user, raw).catch((e) => console.error("Reset email failed:", e.message));
    }
    reply();
  } catch (error) {
    console.error("Forgot password error:", error.message);
    res.status(500).json({ message: "Server error. Please try again." });
  }
};

const resetPassword = async (req, res) => {
  try {
    const token = String(req.body.token || "");
    const password = String(req.body.password || "");
    const pwProblem = checkPassword(password);
    if (pwProblem) return res.status(400).json({ message: pwProblem });

    const user = token
      ? await User.findOne({ resetTokenHash: sha(token), resetExpiresAt: { $gt: new Date() } }).select(
          "+resetTokenHash +resetExpiresAt",
        )
      : null;
    if (!user) return res.status(400).json({ message: "This reset link is invalid or has expired. Request a new one." });

    user.password = await bcrypt.hash(password, await bcrypt.genSalt(10));
    user.resetTokenHash = undefined;
    user.resetExpiresAt = undefined;
    // Signs out every session that existed before the reset
    user.passwordChangedAt = new Date();
    // Getting the link proves control of the inbox
    if (!user.emailVerifiedAt) user.emailVerifiedAt = new Date();
    await user.save();

    res.status(200).json({ message: "Password updated. You can log in now." });
  } catch (error) {
    console.error("Reset password error:", error.message);
    res.status(500).json({ message: "Server error. Please try again." });
  }
};

const verifyEmail = async (req, res) => {
  try {
    const token = String(req.body.token || "");
    const user = token
      ? await User.findOne({ verifyTokenHash: sha(token), verifyExpiresAt: { $gt: new Date() } }).select(
          "+verifyTokenHash +verifyExpiresAt",
        )
      : null;
    if (!user) {
      return res.status(400).json({ message: "This confirmation link is invalid, expired or already used." });
    }
    user.emailVerifiedAt = new Date();
    user.verifyTokenHash = undefined;
    user.verifyExpiresAt = undefined;
    await user.save();
    res.status(200).json({ message: "Email confirmed." });
  } catch (error) {
    console.error("Verify email error:", error.message);
    res.status(500).json({ message: "Server error. Please try again." });
  }
};

const resendVerification = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(401).json({ message: "Account not found. Please log in again." });
    if (user.emailVerifiedAt) return res.status(200).json({ message: "Your email is already confirmed." });
    await issueVerification(user);
    res.status(200).json({ message: `We've sent a confirmation link to ${user.email}.` });
  } catch (error) {
    console.error("Resend verification error:", error.message);
    res.status(500).json({ message: "We couldn't send the email. Please try again shortly." });
  }
};

module.exports = { register, login, getMe, forgotPassword, resetPassword, verifyEmail, resendVerification };