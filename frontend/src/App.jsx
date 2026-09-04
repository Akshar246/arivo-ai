import { useState } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Jobs from "./pages/Jobs";
import Profile from "./pages/Profile";
import Chat from "./components/Chat";
import Landing from "./pages/Landing";
import ATS from "./pages/ATS";
import "./App.css";

/// ─────────────────────────────────────────────
// NAVIGATION
// Desktop/tablet (≥768px): unchanged top row, exactly as before.
// Mobile (<768px): top bar simplifies to logo + logout icon.
// A fixed bottom tab bar takes over primary navigation — always
// visible, thumb-reachable, no menu to open or close.
// ─────────────────────────────────────────────
function NavBar({ page, setPage }) {
  const { logout } = useAuth();

  const navItems = [
    { id: "dashboard", label: "Home", icon: IconHome },
    { id: "jobs", label: "Jobs", icon: IconJobs },
    { id: "chat", label: "Coach", icon: IconCoach },
    { id: "ats", label: "ATS", icon: IconATS },
    { id: "profile", label: "Profile", icon: IconProfile },
  ];

  return (
    <>
      <nav className="nb">
        <style>{navStyles}</style>

        <div className="nb-bar">
          <div className="nb-logo" onClick={() => setPage("dashboard")}>
            Arivo AI
          </div>

          {/* Desktop / tablet — full row, unchanged */}
          <div className="nb-desktop">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setPage(item.id)}
                className={`nb-link ${page === item.id ? "is-active" : ""}`}
              >
                {item.label}
              </button>
            ))}
            <div className="nb-divider" />
            <button className="nb-logout" onClick={logout} title="Log out">
              <IconLogout />
              Log out
            </button>
          </div>

          {/* Mobile — logo + icon-only logout, primary nav lives in the bottom bar */}
          <button
            className="nb-logout-mobile"
            onClick={logout}
            aria-label="Log out"
          >
            <IconLogout />
          </button>
        </div>
      </nav>

      {/* Fixed bottom tab bar — mobile only */}
      <div className="nb-tabbar">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = page === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setPage(item.id)}
              className={`nb-tab ${active ? "is-active" : ""}`}
            >
              <span className="nb-tab-icon">
                <Icon />
              </span>
              <span className="nb-tab-label">{item.label}</span>
              {active && <span className="nb-tab-glow" />}
            </button>
          );
        })}
      </div>
    </>
  );
}

// ── Icons — simple inline SVGs, consistent stroke style ─────────
const IconHome = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M3 9.5 12 3l9 6.5V21a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" />
  </svg>
);
const IconJobs = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="3" y="7" width="18" height="13" rx="2" />
    <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
);
const IconCoach = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
  </svg>
);
const IconATS = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="9" />
    <circle cx="12" cy="12" r="4.5" />
    <circle cx="12" cy="12" r="0.5" fill="currentColor" />
  </svg>
);
const IconProfile = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21c0-4 3.6-7 8-7s8 3 8 7" />
  </svg>
);
const IconLogout = () => (
  <svg
    width="16"
    height="16"
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
);

const navStyles = `
.nb {
  position: sticky; top: 0; z-index: 100;
  background: #0d0d16; border-bottom: 1px solid rgba(255,255,255,0.07);
}
.nb-bar {
  display: flex; align-items: center; justify-content: space-between;
  height: 56px; padding: 0 1.5rem;
}
.nb-logo {
  font-size: 16px; font-weight: 800; cursor: pointer; flex-shrink: 0;
  background: linear-gradient(135deg, #10b981, #059669);
  -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent;
}

/* Desktop row */
.nb-desktop { display: flex; align-items: center; gap: 4px; }
.nb-link {
  padding: 7px 15px; background: transparent; border: none; border-radius: 999px;
  color: #8888aa; cursor: pointer; font-size: 13px; font-weight: 500;
  font-family: inherit; transition: all 0.18s;
}
.nb-link:hover { color: #f0f4f1; background: rgba(255,255,255,0.05); }
.nb-link.is-active { background: linear-gradient(135deg, #10b981, #059669); color: #fff; font-weight: 700; }
.nb-divider { width: 1px; height: 22px; background: rgba(255,255,255,0.1); margin: 0 6px; }
.nb-logout {
  display: flex; align-items: center; gap: 6px; padding: 7px 15px;
  background: transparent; border: 1px solid rgba(255,255,255,0.1); border-radius: 999px;
  color: #8888aa; cursor: pointer; font-size: 13px; font-family: inherit; transition: all 0.18s;
}
.nb-logout:hover { color: #f0f4f1; border-color: rgba(16,185,129,0.4); }

/* Mobile-only logout icon in top bar — hidden on desktop */
.nb-logout-mobile {
  display: none; align-items: center; justify-content: center;
  width: 40px; height: 40px; border-radius: 10px;
  background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.1);
  color: #8888aa; cursor: pointer;
}

/* Fixed bottom tab bar — hidden on desktop */
.nb-tabbar {
  display: none;
  position: fixed; bottom: 0; left: 0; right: 0; z-index: 100;
  background: rgba(13,13,22,0.92); backdrop-filter: blur(20px);
  border-top: 1px solid rgba(255,255,255,0.08);
  padding-bottom: env(safe-area-inset-bottom, 0px);
}
.nb-tab {
  flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 3px; padding: 9px 4px 8px; background: transparent; border: none; cursor: pointer;
  color: #7a7a94; font-family: inherit; position: relative; min-height: 56px;
  transition: color 0.18s;
}
.nb-tab.is-active { color: #34d399; }
.nb-tab-icon { display: flex; }
.nb-tab-label { font-size: 10.5px; font-weight: 600; }
.nb-tab-glow {
  position: absolute; top: 0; left: 50%; transform: translateX(-50%);
  width: 28px; height: 2px; border-radius: 2px;
  background: linear-gradient(90deg, #10b981, #34d399);
  box-shadow: 0 0 8px rgba(52,211,153,0.6);
}

@media (max-width: 768px) {
  .nb-desktop { display: none; }
  .nb-logout-mobile { display: flex; }
  .nb-tabbar { display: flex; }
  /* Room at the bottom of every page so the fixed tab bar never
     covers the last bit of content */
  body { padding-bottom: 76px; }
}
`;

// ─────────────────────────────────────────────
// APP ROUTER
// ─────────────────────────────────────────────
function AppRouter() {
  const { currentUser } = useAuth();
  const [page, setPage] = useState("dashboard");
  const [showLanding, setShowLanding] = useState(true);

  // Not logged in — route to Landing or Login
  if (!currentUser) {
    if (showLanding) {
      return <Landing onGetStarted={() => setShowLanding(false)} />;
    }
    return <Login onLogin={() => setPage("dashboard")} />;
  }

  // Logged in — Render the correct protected page
  const renderPage = () => {
    switch (page) {
      case "dashboard":
        return <Dashboard onNavigate={setPage} />;
      case "jobs":
        return <Jobs onNavigate={setPage} />;
      case "chat":
        return <Chat />;
      case "profile":
        return <Profile onNavigate={setPage} />;
      case "ats":
        return <ATS onNavigate={setPage} />;
      default:
        return <Dashboard onNavigate={setPage} />;
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0f0f1a", color: "#fff" }}>
      <NavBar page={page} setPage={setPage} />
      {renderPage()}
    </div>
  );
}

// ─────────────────────────────────────────────
// MAIN APP
// ─────────────────────────────────────────────
function App() {
  return (
    <AuthProvider>
      <AppRouter />
    </AuthProvider>
  );
}

export default App;
