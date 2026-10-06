const axios = require("axios");

// Values pasted into a host's settings page often pick up spaces, newlines or wrapping quotes
const env = (name) => (process.env[name] || "").trim().replace(/^["']|["']$/g, "").trim();

const FROM = () => env("MAIL_FROM") || "Arivo AI <onboarding@resend.dev>";

// Mail goes out through one of two free routes, tried in this order:
//  1. A Google Apps Script web app that sends from the owner's Gmail (MAIL_RELAY_URL + MAIL_RELAY_SECRET).
//     Needs no domain, which suits a zero-budget start. Gmail's own limits apply (about 100 a day).
//  2. Resend (RESEND_API_KEY). Only delivers to arbitrary addresses once a domain is verified.
// With neither set, nothing is sent: development prints the message, production logs the misconfiguration.
async function sendViaRelay({ to, subject, text, html }) {
  let res;
  try {
    res = await axios.post(
      env("MAIL_RELAY_URL"),
      { secret: env("MAIL_RELAY_SECRET"), to, subject, text, html },
      { timeout: 20000, headers: { "Content-Type": "application/json" } },
    );
  } catch (err) {
    throw new Error(`Mail relay unreachable (${err.response?.status || err.code || err.message})`);
  }
  // Apps Script answers 200 with a JSON body even when it refuses, so check the body
  if (!res.data || res.data.ok !== true) {
    throw new Error(`Mail relay refused the email: ${JSON.stringify(res.data).slice(0, 200)}`);
  }
}

async function sendViaResend({ to, subject, text, html }) {
  try {
    await axios.post(
      "https://api.resend.com/emails",
      { from: FROM(), to: [to], subject, text, html },
      { headers: { Authorization: `Bearer ${env("RESEND_API_KEY")}` }, timeout: 15000 },
    );
  } catch (err) {
    // Resend explains refusals in the response body; the bare status code hides the cause
    const detail = err.response?.data ? JSON.stringify(err.response.data) : err.message;
    throw new Error(`Resend rejected the email (${err.response?.status || "no response"}): ${detail}`);
  }
}

async function sendMail(message) {
  if (env("MAIL_RELAY_URL") && env("MAIL_RELAY_SECRET")) {
    await sendViaRelay(message);
    return { sent: true, via: "relay" };
  }
  if (env("RESEND_API_KEY")) {
    await sendViaResend(message);
    return { sent: true, via: "resend" };
  }
  if (process.env.NODE_ENV === "production") {
    console.error(`Mail not sent to ${message.to}: no mail relay or RESEND_API_KEY is configured`);
  } else {
    console.log(`\n[mail:dev] To: ${message.to}\nSubject: ${message.subject}\n${message.text}\n`);
  }
  return { sent: false };
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
