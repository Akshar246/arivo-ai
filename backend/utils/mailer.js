const axios = require("axios");

const FROM = () => process.env.MAIL_FROM || "Arivo AI <onboarding@resend.dev>";

// Sends through Resend's REST API. Without RESEND_API_KEY nothing is sent:
// in development the message is printed so the flow can still be tested,
// in production it is logged as a misconfiguration (never the link itself).
async function sendMail({ to, subject, text, html }) {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    if (process.env.NODE_ENV === "production") {
      console.error(`Mail not sent to ${to}: RESEND_API_KEY is not set`);
    } else {
      console.log(`\n[mail:dev] To: ${to}\nSubject: ${subject}\n${text}\n`);
    }
    return { sent: false };
  }
  await axios.post(
    "https://api.resend.com/emails",
    { from: FROM(), to: [to], subject, text, html },
    { headers: { Authorization: `Bearer ${key}` }, timeout: 15000 },
  );
  return { sent: true };
}

const appUrl = () => (process.env.FRONTEND_URL || "http://localhost:5173").replace(/\/$/, "");

const shell = (heading, body, buttonLabel, url) => `
<div style="font-family:Georgia,serif;background:#f5f1e8;padding:32px">
  <div style="max-width:480px;margin:0 auto;background:#fffdf8;border:1px solid #e3dccb;border-radius:12px;padding:32px;color:#15231c">
    <p style="font-size:22px;margin:0 0 20px">Arivo AI</p>
    <h1 style="font-size:20px;font-weight:400;margin:0 0 12px">${heading}</h1>
    <p style="font-family:Arial,sans-serif;font-size:15px;line-height:1.6;color:#3d4a43;margin:0 0 24px">${body}</p>
    <a href="${url}" style="display:inline-block;font-family:Arial,sans-serif;font-size:15px;font-weight:600;background:#0f3d2e;color:#f5f1e8;text-decoration:none;padding:12px 22px;border-radius:8px">${buttonLabel}</a>
    <p style="font-family:Arial,sans-serif;font-size:12px;line-height:1.5;color:#7a847d;margin:24px 0 0">If the button doesn't work, paste this link into your browser:<br>${url}</p>
  </div>
</div>`;

const sendVerificationEmail = (user, token) => {
  const url = `${appUrl()}/?verify=${token}`;
  return sendMail({
    to: user.email,
    subject: "Confirm your email for Arivo AI",
    text: `Hi ${user.name},\n\nConfirm your email address so we can reach you if you ever lose access:\n${url}\n\nThis link works for 3 days. If you didn't create an Arivo account, ignore this email.`,
    html: shell("Confirm your email", `Hi ${user.name}, confirm your address so we can reach you if you ever lose access. The link works for 3 days.`, "Confirm email", url),
  });
};

const sendResetEmail = (user, token) => {
  const url = `${appUrl()}/?reset=${token}`;
  return sendMail({
    to: user.email,
    subject: "Reset your Arivo AI password",
    text: `Hi ${user.name},\n\nChoose a new password here:\n${url}\n\nThis link works for 1 hour. If you didn't ask for this, ignore this email and your password stays the same.`,
    html: shell("Reset your password", `Hi ${user.name}, use the button below to choose a new password. The link works for 1 hour. If you didn't ask for this, ignore this email and your password stays the same.`, "Choose a new password", url),
  });
};

module.exports = { sendMail, sendVerificationEmail, sendResetEmail };
