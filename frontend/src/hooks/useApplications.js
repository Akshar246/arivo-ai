import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

const API = `${import.meta.env.VITE_API_URL}/api/applications`;

export const STATUSES = ["saved", "applied", "interview", "offer", "rejected"];

// Fire-and-forget helpers used by Jobs, which doesn't need the full list
export const trackJob = (token, job) => {
  if (!token) return;
  axios
    .post(
      API,
      {
        title: job.title,
        company: job.company,
        location: job.location,
        url: job.url,
        sponsorVerified: !!job.visa_sponsor,
        status: "saved",
      },
      { headers: { Authorization: `Bearer ${token}` } },
    )
    .catch(() => {});
};

export const untrackJob = (token, job) => {
  if (!token) return;
  axios
    .post(
      `${API}/unsave`,
      { title: job.title, company: job.company },
      { headers: { Authorization: `Bearer ${token}` } },
    )
    .catch(() => {});
};

export function useApplications() {
  const { token } = useAuth();
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(!!token);
  const [error, setError] = useState("");

  const headers = { Authorization: `Bearer ${token}` };

  const load = useCallback(() => {
    if (!token) return Promise.resolve();
    return axios
      .get(API, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => {
        setApps(r.data);
        setError("");
      })
      .catch(() => setError("Could not load your applications"))
      .finally(() => setLoading(false));
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  const add = async (job) => {
    const r = await axios.post(
      API,
      {
        title: job.title,
        company: job.company,
        location: job.location,
        url: job.url,
        sponsorVerified: job.sponsorVerified ?? !!job.visa_sponsor,
        status: "saved",
      },
      { headers },
    );
    setApps((prev) => [r.data, ...prev.filter((a) => a._id !== r.data._id)]);
    return r.data;
  };

  const patch = async (id, body) => {
    const r = await axios.patch(`${API}/${id}`, body, { headers });
    setApps((prev) => prev.map((a) => (a._id === id ? r.data : a)));
    return r.data;
  };

  const remove = async (id) => {
    await axios.delete(`${API}/${id}`, { headers });
    setApps((prev) => prev.filter((a) => a._id !== id));
  };

  return {
    apps,
    loading: token ? loading : false,
    error,
    reload: load,
    add,
    setStatus: (id, status) => patch(id, { status }),
    setNotes: (id, notes) => patch(id, { notes }),
    setPrep: (id, prep) => patch(id, { prep }),
    remove,
  };
}
