import { LEGAL, LEGAL_UPDATED, CONTACT_EMAIL } from "../constants/legal";
import ThemeToggle from "../components/ThemeToggle";

// The privacy policy and terms. Reachable without signing in, at #/privacy and #/terms.
export default function Legal({ kind, onBack }) {
  const doc = LEGAL[kind];
  if (!doc) return null;

  return (
    <div className="ivory lg-page">
      <style>{CSS}</style>
      <div className="lg-theme"><ThemeToggle /></div>
      <article className="lg-doc">
        <button className="lg-back" onClick={onBack}>← Back</button>
        <p className="iv-eyebrow">Arivo AI</p>
        <h1 className="iv-display lg-title">{doc.title}</h1>
        <p className="lg-updated">Last updated {LEGAL_UPDATED}</p>
        <p className="lg-intro">{doc.intro}</p>

        {doc.sections.map((s) => (
          <section key={s.h} className="lg-section">
            <h2 className="lg-h">{s.h}</h2>
            {s.body && <p>{s.body}</p>}
            {s.items && (
              <ul>
                {s.items.map((i) => (
                  <li key={i}>{i}</li>
                ))}
              </ul>
            )}
          </section>
        ))}

        <section className="lg-section">
          <h2 className="lg-h">Contact</h2>
          <p>
            Questions or requests: <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
          </p>
        </section>

        <p className="lg-other">
          <a href={kind === "privacy" ? "#/terms" : "#/privacy"}>
            {kind === "privacy" ? "Read the terms of use" : "Read the privacy policy"}
          </a>
        </p>
      </article>
    </div>
  );
}

const CSS = `
.lg-page { min-height: 100vh; background: var(--c-bg); color: var(--c-ink); padding: clamp(24px, 5vw, 56px) 16px 80px; position: relative; }
.lg-theme { position: absolute; top: 20px; right: 20px; }
.lg-doc { max-width: 720px; margin: 0 auto; }
.lg-back { background: none; border: none; padding: 0; margin-bottom: 28px; color: var(--c-ink-2); font: 500 0.88rem var(--font-body); cursor: pointer; }
.lg-back:hover { color: var(--c-ink); }
.lg-title { font-size: clamp(2.1rem, 5vw, 3rem); font-weight: 400; margin: 8px 0 6px; }
.lg-updated { color: var(--c-ink-3); font-size: 0.84rem; margin: 0 0 22px; }
.lg-intro { font-size: 1.02rem; line-height: 1.7; color: var(--c-ink-2); margin: 0 0 8px; }
.lg-section { margin-top: 34px; }
.lg-h { font-family: var(--font-display); font-weight: 400; font-size: 1.5rem; margin: 0 0 10px; }
.lg-section p, .lg-section li { font-size: 0.96rem; line-height: 1.75; color: var(--c-ink-2); }
.lg-section p { margin: 0 0 10px; }
.lg-section ul { margin: 0; padding-left: 20px; }
.lg-section li { margin-bottom: 8px; }
.lg-section a, .lg-other a { color: var(--c-green); font-weight: 600; }
.lg-other { margin-top: 40px; font-size: 0.92rem; }
`;
