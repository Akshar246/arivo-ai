export const VISA_TYPES = [
  { value: "Student visa", hint: "Studying in the UK now" },
  { value: "Graduate visa", hint: "Post-study work route" },
  { value: "Skilled Worker visa", hint: "Already sponsored to work" },
  { value: "UK citizen / settled", hint: "No sponsorship needed" },
  { value: "Other", hint: "Something else" },
];
export const NEEDS_END_DATE = ["Student visa", "Graduate visa", "Skilled Worker visa"];
export const LOOKING_FOR = ["Graduate job", "Internship", "Placement year", "Part-time"];

// Wording that signals each role type in a posting's title or description.
// "Part-time" is not here: the job search filters on it directly.
const KIND_PATTERNS = {
  "Graduate job": /\b(graduate|junior|entry[- ]level|trainee|early careers?)\b/i,
  Internship: /\b(intern|internship|summer analyst|spring week)\b/i,
  "Placement year": /\b(placement|sandwich year|year in industry|industrial placement)\b/i,
};

// One preference means a clear default. Several means "any", so we never pick for them.
export const defaultKind = (lookingFor = []) => (lookingFor.length === 1 ? lookingFor[0] : "");

export const matchesKind = (job, kind) => {
  const re = KIND_PATTERNS[kind];
  if (!re) return true;
  return re.test(`${job.title || ""} ${job.description_full || job.description || ""}`);
};

export const searchBody = (role, kind, location = "london") => ({
  query: role,
  location,
  ...(kind === "Part-time" ? { part_time: true } : {}),
});
