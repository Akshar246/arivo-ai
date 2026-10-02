import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

const API = `${import.meta.env.VITE_API_URL}/api/profile`;
export const PF_CONTEXT_KEY = "arivo_pf_context";

// Jobs reads this key for its default search role
const cacheContext = (p) => {
  try {
    localStorage.setItem(
      PF_CONTEXT_KEY,
      JSON.stringify({
        targetRole: p.targetRole || "",
        skills: (p.skills || []).map((s) => s.name),
        visaType: p.visaType || "",
      }),
    );
  } catch {
    /* storage unavailable */
  }
};

export function useCareerProfile() {
  const { token } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const headers = { Authorization: `Bearer ${token}` };

  const apply = useCallback((data) => {
    setProfile(data);
    cacheContext(data);
    return data;
  }, []);

  useEffect(() => {
    let alive = true;
    if (!token) return undefined;
    axios
      .get(API, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => alive && apply(r.data))
      .catch(() => alive && setError("Could not load your profile"))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [token, apply]);

  const call = async (method, path, body) => {
    const r = await axios({ method, url: `${API}${path}`, data: body, headers });
    return apply(r.data);
  };

  return {
    profile,
    loading,
    error,
    setProfile: apply,
    updateProfile: (body) => call("put", "", body),
    saveSkills: (skills) => call("put", "/skills", { skills }),
    saveGap: (gap) => call("put", "/gap", { gap }),
    setPlanItem: (skill, done) => call("patch", "/plan", { skill, done }),
  };
}

// Used by ATS: saves the latest scan to the shared profile
export async function saveAtsResult(token, score, missingKeywords) {
  if (!token) return;
  try {
    await axios.post(
      `${API}/ats`,
      { score, missingKeywords },
      { headers: { Authorization: `Bearer ${token}` } },
    );
  } catch {
    /* non-blocking */
  }
}
