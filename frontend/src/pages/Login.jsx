import { useState } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

// ─────────────────────────────────────────────
// LOGIN PAGE
// Handles both login and registration
// Toggles between two modes with one button
// On success — saves token via AuthContext
// and redirects to dashboard
// ─────────────────────────────────────────────
function Login({ onLogin }) {
  // Toggle between login and register mode
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Form fields
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    nationality: "",
    university: "",
    course: "",
    targetRole: "",
  });

  const { login } = useAuth();

  // ─────────────────────────────────────────────
  // UPDATE FORM STATE
  // One handler for all fields — keeps code clean
  // e.target.name matches the input name attribute
  // e.target.value is what the user typed
  // ─────────────────────────────────────────────
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // ─────────────────────────────────────────────
  // SUBMIT FORM
  // Calls register or login endpoint
  // On success — saves to context and redirects
  // ─────────────────────────────────────────────
  const handleSubmit = async () => {
    setLoading(true);
    setError("");

    try {
      const endpoint = isRegister
        ? "http://localhost:5001/api/auth/register"
        : "http://localhost:5001/api/auth/login";

      const payload = isRegister
        ? form
        : { email: form.email, password: form.password };

      const response = await axios.post(endpoint, payload);

      // Save token and user to global context
      login(response.data.user, response.data.token);

      // Tell parent component login was successful
      onLogin();
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong");
    }

    setLoading(false);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0f0f1a",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
      }}
    >
      <div
        style={{
          background: "#1a1a2e",
          borderRadius: "16px",
          padding: "2rem",
          width: "100%",
          maxWidth: "420px",
          border: "1px solid #333",
        }}
      >
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div
            style={{
              fontSize: "28px",
              fontWeight: "700",
              background: "linear-gradient(135deg, #667eea, #764ba2)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Arivo AI
          </div>
          <div style={{ color: "#888", fontSize: "13px", marginTop: "4px" }}>
            {isRegister ? "Create your account" : "Welcome back"}
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div
            style={{
              background: "#e74c3c22",
              border: "1px solid #e74c3c44",
              borderRadius: "8px",
              padding: "10px 14px",
              color: "#e74c3c",
              fontSize: "13px",
              marginBottom: "1rem",
            }}
          >
            {error}
          </div>
        )}

        {/* Form fields */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {/* Register only fields */}
          {isRegister && (
            <>
              {[
                { name: "name", placeholder: "Full name" },
                { name: "nationality", placeholder: "Nationality" },
                { name: "university", placeholder: "University" },
                { name: "course", placeholder: "Course e.g. MSc AI" },
                {
                  name: "targetRole",
                  placeholder: "Target role e.g. ML Engineer",
                },
              ].map((field) => (
                <input
                  key={field.name}
                  name={field.name}
                  placeholder={field.placeholder}
                  value={form[field.name]}
                  onChange={handleChange}
                  style={inputStyle}
                />
              ))}
            </>
          )}

          {/* Email and password — always shown */}
          <input
            name="email"
            type="email"
            placeholder="Email address"
            value={form.email}
            onChange={handleChange}
            style={inputStyle}
          />
          <input
            name="password"
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={handleChange}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            style={inputStyle}
          />

          {/* Submit button */}
          <button
            onClick={handleSubmit}
            disabled={loading}
            style={{
              padding: "12px",
              background: "linear-gradient(135deg, #667eea, #764ba2)",
              border: "none",
              borderRadius: "8px",
              color: "#fff",
              fontSize: "14px",
              fontWeight: "600",
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.7 : 1,
              marginTop: "4px",
            }}
          >
            {loading
              ? "Please wait..."
              : isRegister
                ? "Create Account"
                : "Sign In"}
          </button>

          {/* Toggle between login and register */}
          <div style={{ textAlign: "center", fontSize: "13px", color: "#888" }}>
            {isRegister ? "Already have an account?" : "New to Arivo AI?"}{" "}
            <span
              onClick={() => {
                setIsRegister(!isRegister);
                setError("");
              }}
              style={{ color: "#667eea", cursor: "pointer", fontWeight: "500" }}
            >
              {isRegister ? "Sign in" : "Create account"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Reusable input style — keeps code clean
const inputStyle = {
  padding: "10px 14px",
  background: "#0f0f1a",
  border: "1px solid #333",
  borderRadius: "8px",
  color: "#fff",
  fontSize: "13px",
  outline: "none",
  width: "100%",
  boxSizing: "border-box",
};

export default Login;
