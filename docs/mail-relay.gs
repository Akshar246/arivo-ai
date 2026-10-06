// Free email sender for Arivo AI: a Google Apps Script web app that sends from your own Gmail.
// Setup steps are in docs/mail-relay.md. Paste this whole file into script.google.com.

// Must match MAIL_RELAY_SECRET on the backend. Generate one with: openssl rand -hex 24
const SECRET = "PASTE_YOUR_SECRET_HERE";

function doPost(e) {
  try {
    const d = JSON.parse(e.postData.contents);
    if (!d.secret || d.secret !== SECRET) return reply({ ok: false, error: "forbidden" });
    if (!d.to || !d.subject || !d.text) return reply({ ok: false, error: "missing fields" });

    MailApp.sendEmail({
      to: d.to,
      subject: d.subject,
      body: d.text,
      htmlBody: d.html || undefined,
      name: "Arivo AI",
    });
    return reply({ ok: true });
  } catch (err) {
    return reply({ ok: false, error: String(err) });
  }
}

function reply(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
