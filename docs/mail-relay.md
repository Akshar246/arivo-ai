# Free email sending (no domain needed)

Password-reset and confirmation emails go out through a small Google Apps Script that sends from
your own Gmail account. Gmail's limit applies (about 100 emails a day on a normal account).

## One-time setup

1. Generate a secret in a terminal: `openssl rand -hex 24` and keep it.
2. Go to https://script.google.com, click **New project**, delete the sample code, and paste in `docs/mail-relay.gs`.
3. Replace `PASTE_YOUR_SECRET_HERE` with the secret from step 1.
4. Click **Deploy → New deployment → Select type: Web app**.
   - Execute as: **Me**
   - Who has access: **Anyone**
5. Click **Deploy**, then **Authorize access** and allow it to send email as you.
   (If Google warns the app is unverified, choose **Advanced → Go to project**. It is your own script.)
6. Copy the **Web app URL**. It ends in `/exec`.
7. In Render, add two environment variables to the backend and save:
   - `MAIL_RELAY_URL` = the Web app URL
   - `MAIL_RELAY_SECRET` = the secret from step 1

The backend uses the relay when both are set, otherwise Resend (`RESEND_API_KEY`), otherwise nothing is sent.

## Changing the script later

After any edit, use **Deploy → Manage deployments → edit (pencil) → Version: New version → Deploy**.
The URL stays the same.
