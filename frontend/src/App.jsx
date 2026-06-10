import { useState } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Jobs from "./pages/Jobs";
import Profile from "./pages/Profile";
import Chat from "./components/Chat";
import "./App.css";

// ─────────────────────────────────────────────
// NAVIGATION BAR
// Defined outside AppRouter so React does not
// recreate it on every render — avoids errors
// Receives page and setPage as props
// ─────────────────────────────────────────────
function NavBar({ page, setPage }) {
  return (
    <div
      style={{
        background: "#1a1a2e",
        borderBottom: "1px solid #333",
        padding: "0 1.5rem",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        height: "56px",
        position: "sticky",
        top: 0,
        zIndex: 100,
      }}
    >
      {/* Logo — clicking takes you home */}
      <div
        onClick={() => setPage("dashboard")}
        style={{
          fontSize: "16px",
          fontWeight: "700",
          background: "linear-gradient(135deg, #667eea, #764ba2)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          cursor: "pointer",
        }}
      >
        Arivo AI
      </div>

      {/* Nav links — active page gets purple highlight */}
      <div style={{ display: "flex", gap: "4px" }}>
        {[
          { id: "dashboard", label: "Home" },
          { id: "jobs", label: "Jobs" },
          { id: "chat", label: "Coach" },
          { id: "profile", label: "Profile" },
        ].map((nav) => (
          <button
            key={nav.id}
            onClick={() => setPage(nav.id)}
            style={{
              padding: "6px 14px",
              background:
                page === nav.id
                  ? "linear-gradient(135deg, #667eea, #764ba2)"
                  : "transparent",
              border: "none",
              borderRadius: "999px",
              color: page === nav.id ? "#fff" : "#888",
              cursor: "pointer",
              fontSize: "13px",
              fontWeight: page === nav.id ? "600" : "400",
            }}
          >
            {nav.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// APP ROUTER
// Checks if user is logged in
// If not — shows Login page
// If yes — shows navbar and correct page
// ─────────────────────────────────────────────
function AppRouter() {
  const { currentUser } = useAuth();
  const [page, setPage] = useState("dashboard");

  // Not logged in — show login page
  if (!currentUser) {
    return <Login onLogin={() => setPage("dashboard")} />;
  }

  // ─────────────────────────────────────────────
  // RENDER CORRECT PAGE
  // Switch statement picks the right component
  // based on current page state
  // ─────────────────────────────────────────────
  const renderPage = () => {
    switch (page) {
      case "dashboard":
        return <Dashboard onNavigate={setPage} />;
      case "jobs":
        return <Jobs />;
      case "chat":
        return <Chat />;
      case "profile":
        return <Profile />;
      default:
        return <Dashboard onNavigate={setPage} />;
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0f0f1a",
        color: "#fff",
      }}
    >
      {/* Navbar stays at top on every page */}
      <NavBar page={page} setPage={setPage} />

      {/* Page content renders below navbar */}
      {renderPage()}
    </div>
  );
}

// ─────────────────────────────────────────────
// MAIN APP
// AuthProvider wraps everything so every page
// can access currentUser and token anywhere
// ─────────────────────────────────────────────
function App() {
  return (
    <AuthProvider>
      <AppRouter />
    </AuthProvider>
  );
}

export default App;
