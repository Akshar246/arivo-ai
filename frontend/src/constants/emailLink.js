// Links in our emails look like /?reset=TOKEN or /?verify=TOKEN
export const readEmailLink = () => {
  try {
    const p = new URLSearchParams(window.location.search);
    if (p.get("reset")) return { kind: "reset", token: p.get("reset") };
    if (p.get("verify")) return { kind: "verify", token: p.get("verify") };
  } catch {
    /* no window.location */
  }
  return null;
};

