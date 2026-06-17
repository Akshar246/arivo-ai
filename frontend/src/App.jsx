import { useState } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Jobs from "./pages/Jobs";
import Profile from "./pages/Profile";
import Chat from "./components/Chat";
import "./App.css";
import Landing from "./pages/Landing";
import ATS from "./pages/ATS";

// ─────────────────────────────────────────────
// NAVIGATION BAR
// Defined outside AppRouter so React does not
// recreate it on every render — avoids errors
// Receives page and setPage as props
// ─────────────────────────────────────────────
function NavBar({ page, setPage }) {
  const { logout } = useAuth();

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

      {/* Right side — nav links + logout grouped together */}
      <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
        {[
          { id: "dashboard", label: "Home" },
          { id: "jobs", label: "Jobs" },
          { id: "chat", label: "Coach" },
          { id: "ats", label: "ATS" },
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

        {/* Divider */}
        <div
          style={{
            width: "1px",
            height: "22px",
            background: "#333",
            margin: "0 6px",
          }}
        />

        {/* Logout */}
        <button
          onClick={logout}
          title="Log out"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            padding: "6px 14px",
            background: "transparent",
            border: "1px solid #333",
            borderRadius: "999px",
            color: "#888",
            cursor: "pointer",
            fontSize: "13px",
            transition: "all 0.18s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = "#fff";
            e.currentTarget.style.borderColor = "#667eea66";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = "#888";
            e.currentTarget.style.borderColor = "#333";
          }}
        >
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <path d="m16 17 5-5-5-5" />
            <path d="M21 12H9" />
          </svg>
          Log out
        </button>
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
  const [showLanding, setShowLanding] = useState(true);

  if (!currentUser) {
    if (showLanding) {
      return <Landing onGetStarted={() => setShowLanding(false)} />;
    }
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
      case "ats":
        return <ATS onNavigate={setPage} />;
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
