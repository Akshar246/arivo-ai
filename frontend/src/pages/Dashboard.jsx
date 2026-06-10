import { useAuth } from "../context/AuthContext";

// ─────────────────────────────────────────────
// DASHBOARD PAGE
// First page user sees after logging in
// Shows personalised greeting, stats, and
// quick action buttons to navigate the app
// ─────────────────────────────────────────────
function Dashboard({ onNavigate }) {
  const { currentUser, logout } = useAuth();

  return (
    <div style={{ padding: "1.5rem", maxWidth: "800px", margin: "0 auto" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "2rem",
        }}
      >
        <div>
          <div
            style={{
              fontSize: "22px",
              fontWeight: "600",
              color: "#fff",
            }}
          >
            Good day, {currentUser?.name?.split(" ")[0]} 👋
          </div>
          <div style={{ fontSize: "13px", color: "#888", marginTop: "4px" }}>
            Targeting {currentUser?.targetRole || "your dream role"} in London
          </div>
        </div>

        {/* Logout button */}
        <button
          onClick={logout}
          style={{
            padding: "8px 16px",
            background: "transparent",
            border: "1px solid #333",
            borderRadius: "8px",
            color: "#888",
            cursor: "pointer",
            fontSize: "13px",
          }}
        >
          Logout
        </button>
      </div>

      {/* Stats cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
          gap: "12px",
          marginBottom: "1.5rem",
        }}
      >
        {[
          {
            label: "Your University",
            value: currentUser?.university || "Not set",
            color: "#667eea",
          },
          {
            label: "Course",
            value: currentUser?.course || "Not set",
            color: "#764ba2",
          },
          {
            label: "Nationality",
            value: currentUser?.nationality || "Not set",
            color: "#11998e",
          },
          {
            label: "Target Role",
            value: currentUser?.targetRole || "Not set",
            color: "#f093fb",
          },
        ].map((stat, i) => (
          <div
            key={i}
            style={{
              background: "#1a1a2e",
              borderRadius: "12px",
              padding: "16px",
              border: "1px solid #333",
            }}
          >
            <div
              style={{
                fontSize: "11px",
                color: "#666",
                marginBottom: "6px",
              }}
            >
              {stat.label}
            </div>
            <div
              style={{
                fontSize: "14px",
                fontWeight: "600",
                color: stat.color,
              }}
            >
              {stat.value}
            </div>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div
        style={{
          background: "#1a1a2e",
          borderRadius: "12px",
          padding: "20px",
          border: "1px solid #333",
          marginBottom: "1.5rem",
        }}
      >
        <div
          style={{
            fontSize: "13px",
            fontWeight: "600",
            color: "#aaa",
            marginBottom: "14px",
          }}
        >
          Quick Actions
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "10px",
          }}
        >
          {[
            {
              label: "Find Jobs",
              desc: "Search visa sponsored roles",
              color: "#667eea",
              page: "jobs",
            },
            {
              label: "Career Coach",
              desc: "Chat with Arivo AI",
              color: "#764ba2",
              page: "chat",
            },
            {
              label: "Skill Gap",
              desc: "Analyse your readiness",
              color: "#11998e",
              page: "profile",
            },
          ].map((action, i) => (
            <button
              key={i}
              onClick={() => onNavigate(action.page)}
              style={{
                background: "transparent",
                border: `1px solid ${action.color}44`,
                borderRadius: "10px",
                padding: "14px 10px",
                cursor: "pointer",
                textAlign: "left",
              }}
            >
              <div
                style={{
                  fontSize: "13px",
                  fontWeight: "600",
                  color: action.color,
                  marginBottom: "4px",
                }}
              >
                {action.label}
              </div>
              <div
                style={{
                  fontSize: "11px",
                  color: "#666",
                }}
              >
                {action.desc}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Welcome message */}
      <div
        style={{
          background: "#1a1a2e",
          borderRadius: "12px",
          padding: "20px",
          border: "1px solid #333",
        }}
      >
        <div
          style={{
            fontSize: "13px",
            fontWeight: "600",
            color: "#667eea",
            marginBottom: "8px",
          }}
        >
          Welcome to Arivo AI 🚀
        </div>
        <div
          style={{
            fontSize: "13px",
            color: "#888",
            lineHeight: "1.7",
          }}
        >
          Arivo helps you find visa sponsored jobs, analyse your skill gaps, and
          prepare for UK interviews — all powered by AI and real government
          data. Start by searching for jobs or uploading your CV in your
          profile.
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
