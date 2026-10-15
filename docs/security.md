# Security

What is protected, how it is protected, how to switch the new protections on safely, and the risks
that are accepted for now. Nothing here replaces a professional review before a wide launch.

## What is protected

| Area | Protection |
|---|---|
| **AI service** | Every route needs a signed login token (or the backend's service key). Per-caller rate limits. Request bodies capped at 1 MB (6 MB for CV upload). Every field has a length limit. API docs hidden. CORS allows only listed sites. |
| **Fetching job pages** | The only place the service fetches a client-supplied URL. HTTPS only, only reed.co.uk and adzuna sites, every redirect re-checked, never to private or internal addresses (prevents server-side request forgery). |
| **Sign-in** | bcrypt passwords. Signed sessions (7 days, or 30 with "keep me signed in"). Rate limits on sign-in, sign-up, reset and email routes. Sessions issued before a password reset stop working. A login token in the address bar is never accepted. |
| **Reset and confirmation links** | Random one-time tokens, only their SHA-256 hash is stored. Same answer whether or not an address has an account. |
| **CV uploads** | PDF only, 5 MB, server-chosen file name, checked for the real PDF signature in both services, deleted after processing even on failure, page and text caps in the AI service. |
| **Backend** | Security headers (helmet) in production, request size limits, a general rate limit, no internal error text sent to clients, refuses to start in production without a signing secret of at least 16 characters. |
| **Website** | Content Security Policy, clickjacking protection, HSTS, strict referrer and permissions policies (`frontend/vercel.json`). The login token is sent only to our backend and AI service. |
| **Email** | User-supplied text is escaped in HTML emails. One-click unsubscribe uses a signed token. Digests go only to confirmed addresses. |
| **Dependencies** | `npm audit` clean for both Node projects. Python upgrades verified in a clean environment. |
| **Secrets** | None in git history (scanned). `.env` ignored. Scheduler endpoint compares its secret in constant time. |

## Switching on the AI service's authentication (do it in this order)

The AI service enforces authentication as soon as `JWT_SECRET` is set on it, so the order matters:

1. **Deploy the website and backend first** (push to GitHub). They already send the right headers, which an unprotected AI service simply ignores.
2. **Choose a service key:** run `openssl rand -hex 24`. Add it to **Render** as `AI_SERVICE_KEY`.
3. **Update the Hugging Face Space code** (push the Space repo). Authentication is still off at this point.
4. **Add three secrets to the Space** (Settings, Variables and secrets), then let it restart:
   - `JWT_SECRET`: exactly the same value as on Render
   - `AI_SERVICE_KEY`: the same value you gave Render
   - `ALLOWED_ORIGINS`: `https://arivo-ai-xi.vercel.app` (comma separated if there are several)
5. **Check:** open the Space's address. It should say `"auth":"on"`. Then sign in on the site and use Jobs.

**Roll back** by deleting `JWT_SECRET` from the Space. The service goes back to open and keeps working.

If the site's address changes, update `ALLOWED_ORIGINS` on the Space and the `connect-src` list in `frontend/vercel.json`.

## Risks accepted for now

- **chromadb** has published advisories with no fixed release yet. It runs inside the AI service on its own disk and is not exposed as a server.
- **Login tokens live in the browser's storage.** Script injection could read them, which is why the Content Security Policy is strict. Moving to cookies would be the next step.
- **Sign-up reveals whether an email already has an account.** Common trade-off for a friendlier message. The reset form does not.
- **Rate limits are in memory** and reset on restart. Fine for one instance per service.
- **A signed token cannot be revoked individually.** A password reset invalidates all earlier sessions; otherwise tokens expire on their own.
- **The AI model can be talked into odd answers** (prompt injection). Its output is never executed, and what it says about a student is checked against their own text where it matters.

## If something goes wrong

- **Suspected leaked `JWT_SECRET`:** change it on Render and the Space together. Everyone is signed out, which is the point.
- **Suspected leaked `AI_SERVICE_KEY`:** change it on Render and the Space.
- **A key for a third-party service leaked:** revoke it with that provider first, then replace it.
- **Reporting a problem:** email the address in the README.
