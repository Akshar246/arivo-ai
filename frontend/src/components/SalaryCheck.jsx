import { useState } from "react";

// Compares a job's published salary with the Skilled Worker salary figures.
// `check` comes from the AI service (visa_rules.assess). It is information with a source,
// not immigration advice, and it says so wherever the full explanation is shown.

const TONE = {
  meets_general: "ok",
  graduate_route: "warn",
  depends: "warn",
  below: "bad",
  unknown: "plain",
  estimate: "plain",
};

const longDate = (iso) => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
};

const ASK_STATUSES = ["unknown", "estimate", "depends", "graduate_route", "below"];

const askMessage = (job) =>
  `Hello,\n\nI'm interested in the ${job?.title || "role"}${job?.company ? ` at ${job.company}` : ""}. Before I apply, could you tell me the salary range, and whether this role can be sponsored under the Skilled Worker route? I would need visa sponsorship.\n\nThank you,\n[Your name]`;

export default function SalaryCheck({ check, variant = "badge", job }) {
  const [copied, setCopied] = useState(false);
  if (!check || !check.label) return null;
  const tone = TONE[check.status] || "plain";

  if (variant === "badge") {
    return (
      <span className={`sc-badge sc-badge--${tone}`} title="Salary compared with the Skilled Worker visa minimum">
        {check.label}
      </span>
    );
  }

  return (
    <div className={`sc-card sc-card--${tone}`}>
      <div className="sc-eyebrow">Visa salary check</div>
      <div className="sc-label">{check.label}</div>
      <p className="sc-detail">{check.detail}</p>
      {job && ASK_STATUSES.includes(check.status) && (
        <button
          type="button"
          className="sc-ask"
          onClick={() => {
            try {
              navigator.clipboard.writeText(askMessage(job)).then(() => setCopied(true));
            } catch {
              /* clipboard unavailable */
            }
          }}
        >
          {copied ? "Copied. Paste it into an email or message" : "Copy a message to ask the employer"}
        </button>
      )}
      <p className="sc-foot">
        Rules checked {longDate(check.rules_checked_on)} on{" "}
        <a href={check.source} target="_blank" rel="noreferrer">gov.uk</a>. General information, not immigration advice.
        Confirm the exact requirement with the employer or your university's international advisers.
      </p>
    </div>
  );
}
