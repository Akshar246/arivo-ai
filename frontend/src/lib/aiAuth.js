import axios from "axios";

// The AI service only answers signed-in students. This adds the student's login token to calls
// that go to it, and to nothing else, so the token is never sent to a third-party address.
const AI_URL = (import.meta.env.VITE_AI_URL || "").replace(/\/$/, "");

const currentToken = () => {
  try {
    return localStorage.getItem("arivo_token") || sessionStorage.getItem("arivo_token") || "";
  } catch {
    return "";
  }
};

axios.interceptors.request.use((config) => {
  const url = String(config.url || "");
  if (AI_URL && url.startsWith(AI_URL)) {
    const token = currentToken();
    if (token) config.headers = { ...config.headers, Authorization: `Bearer ${token}` };
  }
  return config;
});
