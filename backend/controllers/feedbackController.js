const User = require("../models/User");
const Feedback = require("../models/Feedback");
const { sendMail } = require("../utils/mailer");

const KINDS = ["problem", "confusing", "idea", "praise"];
const KIND_LABEL = { problem: "Something's broken", confusing: "Something's confusing", idea: "An idea", praise: "Something worked well" };

const create = async (req, res) => {
  try {
    const kind = String(req.body.kind || "");
    const message = String(req.body.message || "").trim();
    if (!KINDS.includes(kind)) return res.status(400).json({ message: "Choose what kind of note this is." });
    if (message.length < 5) return res.status(400).json({ message: "Please write a little more so I can act on it." });
    if (message.length > 2000) return res.status(400).json({ message: "That's too long. Please keep it under 2,000 characters." });

    let rating = Number(req.body.rating);
    rating = Number.isInteger(rating) && rating >= 1 && rating <= 5 ? rating : null;

    const user = await User.findById(req.user.id).select("name email");
    if (!user) return res.status(401).json({ message: "Account not found. Log in again." });

    const doc = await Feedback.create({
      user: user._id,
      kind,
      message,
      rating,
      page: String(req.body.page || "").slice(0, 60),
      canContact: req.body.canContact === true,
    });

    // Optional heads-up to the owner. Only includes the student's email if they said it is OK to reply.
    const to = (process.env.FEEDBACK_NOTIFY_EMAIL || "").trim();
    if (to) {
      const who = doc.canContact ? `${user.name} <${user.email}>` : "a student (no reply permission)";
      sendMail({
        to,
        subject: `Arivo feedback: ${KIND_LABEL[kind]}`,
        text: `${KIND_LABEL[kind]}${rating ? `, rated ${rating}/5` : ""}\nScreen: ${doc.page || "unknown"}\nFrom: ${who}\n\n${message}\n`,
      }).catch((e) => console.error("Feedback notification failed:", e.message));
    }

    res.status(201).json({ ok: true });
  } catch (err) {
    console.error("Feedback error:", err.message);
    res.status(500).json({ message: "Couldn't send that just now. Please try again." });
  }
};

module.exports = { create };
