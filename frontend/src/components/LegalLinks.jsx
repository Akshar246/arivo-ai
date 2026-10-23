import { CONTACT_EMAIL } from "../constants/legal";

// Small row of links to the policies, shown at the foot of the app.
export default function LegalLinks({ className = "", onFeedback }) {
  return (
    <nav className={`legal-links ${className}`} aria-label="Legal">
      <style>{CSS}</style>
      {onFeedback && (
        <button type="button" className="legal-links-btn" onClick={onFeedback}>Feedback</button>
      )}
      <a href="#/privacy">Privacy</a>
      <a href="#/terms">Terms</a>
      <a href={`mailto:${CONTACT_EMAIL}`}>Contact</a>
    </nav>
  );
}

const CSS = `
.legal-links { display: flex; justify-content: center; gap: 22px; padding: 28px 16px 24px; font-size: 0.8rem; }
.legal-links a { color: var(--c-ink-3); text-decoration: none; }
.legal-links a:hover, .legal-links-btn:hover { color: var(--c-ink); text-decoration: underline; }
.legal-links-btn { background: none; border: none; padding: 0; font: inherit; color: var(--c-ink-3); cursor: pointer; }
@media (max-width: 767px) { .legal-links { padding-bottom: 96px; } }
`;
