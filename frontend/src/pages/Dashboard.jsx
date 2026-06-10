import { useAuth } from "../context/AuthContext";

function Dashboard({ onNavigate }) {
  const { currentUser } = useAuth();
  const name = currentUser?.name?.split(" ")[0] || "there";
  const role = currentUser?.targetRole || "your target role";

  const actions = [
    {
      label: "Find Jobs",
      desc: "Search visa-sponsored roles across every field. Verified against the Home Office Tier 2 register in real time.",
      tag: "320+ live jobs",
      color: "#7c6fef",
      page: "jobs",
      number: "01",
    },
    {
      label: "Career Coach",
      desc: "Ask Arivo anything about UK job hunting, interview prep, visa questions, cover letters, and the STAR method.",
      tag: "AI powered · 24/7",
      color: "#e879f9",
      page: "chat",
      number: "02",
    },
    {
      label: "Skill Gap",
      desc: "Upload your CV. Get a readiness score against real London job market demand — with free learning resources.",
      tag: "Upload your CV",
      color: "#00d4aa",
      page: "profile",
      number: "03",
    },
  ];

  const journey = [
    { label: "Create your account", done: true },
    { label: "Upload your CV", done: false, page: "profile" },
    { label: "Run your skill gap analysis", done: false, page: "profile" },
    { label: "Search for visa sponsored jobs", done: false, page: "jobs" },
    { label: "Chat with Arivo about interviews", done: false, page: "chat" },
  ];

  const platformStats = [
    { value: "120,000+", label: "Official Tier 2 Sponsors", color: "#7c6fef" },
    { value: "320+", label: "Live Jobs Today", color: "#e879f9" },
    { value: "Every", label: "Field Supported", color: "#00d4aa" },
    { value: "100%", label: "Free Forever", color: "#f5a623" },
  ];

  return (
    <div
      style={{
        minHeight: "100vh",
        padding: "0",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Top welcome banner — full width */}
      <div
        style={{
          background:
            "linear-gradient(135deg, rgba(124,111,239,0.1) 0%, rgba(232,121,249,0.05) 60%, transparent 100%)",
          borderBottom: "1px solid rgba(124,111,239,0.1)",
          padding: "2.5rem 3rem",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Glow */}
        <div
          style={{
            position: "absolute",
            top: "-50%",
            right: "5%",
            width: "400px",
            height: "400px",
            background:
              "radial-gradient(circle, rgba(124,111,239,0.1) 0%, transparent 65%)",
            pointerEvents: "none",
          }}
        />

        <div style={{ maxWidth: "100%", position: "relative" }}>
          <div
            style={{
              fontSize: "11px",
              color: "#7c6fef",
              fontWeight: "700",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              marginBottom: "8px",
            }}
          >
            Dashboard
          </div>
          <h1
            style={{
              fontSize: "2rem",
              fontWeight: "900",
              letterSpacing: "-0.03em",
              lineHeight: "1.1",
              marginBottom: "6px",
            }}
          >
            Good to see you,{" "}
            <span
              style={{
                background: "linear-gradient(135deg, #7c6fef, #e879f9)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              {name}
            </span>
          </h1>
          <p style={{ fontSize: "13px", color: "#8888aa" }}>
            Targeting{" "}
            <span style={{ color: "#a89cf7", fontWeight: "500" }}>{role}</span>{" "}
            · London
          </p>
        </div>
      </div>

      {/* Main grid */}
      <div
        style={{
          flex: 1,
          padding: "2rem 3rem",
          display: "grid",
          gridTemplateRows: "auto 1fr auto",
          gap: "1.5rem",
        }}
      >
        {/* Stats row */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: "10px",
          }}
        >
          {platformStats.map((s, i) => (
            <div
              key={i}
              style={{
                background: "rgba(255,255,255,0.02)",
                border: "1px solid rgba(255,255,255,0.04)",
                borderRadius: "12px",
                padding: "16px 18px",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = `${s.color}33`;
                e.currentTarget.style.background = `${s.color}08`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.04)";
                e.currentTarget.style.background = "rgba(255,255,255,0.02)";
              }}
            >
              <div
                style={{
                  fontSize: "1.4rem",
                  fontWeight: "800",
                  color: s.color,
                  letterSpacing: "-0.02em",
                  marginBottom: "4px",
                }}
              >
                {s.value}
              </div>
              <div
                style={{
                  fontSize: "11px",
                  color: "#55556a",
                  fontWeight: "500",
                  lineHeight: "1.3",
                }}
              >
                {s.label}
              </div>
            </div>
          ))}
        </div>

        {/* Action cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "12px",
          }}
        >
          {actions.map((a, i) => (
            <button
              key={i}
              onClick={() => onNavigate(a.page)}
              style={{
                background: "rgba(255,255,255,0.02)",
                border: `1px solid rgba(255,255,255,0.05)`,
                borderRadius: "16px",
                padding: "24px",
                cursor: "pointer",
                textAlign: "left",
                transition: "all 0.3s ease",
                fontFamily: "inherit",
                display: "flex",
                flexDirection: "column",
                height: "100%",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = `${a.color}44`;
                e.currentTarget.style.background = `${a.color}0a`;
                e.currentTarget.style.transform = "translateY(-3px)";
                e.currentTarget.style.boxShadow = `0 16px 40px ${a.color}12`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.05)";
                e.currentTarget.style.background = "rgba(255,255,255,0.02)";
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              {/* Number + tag row */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "20px",
                }}
              >
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: "800",
                    color: a.color,
                    opacity: 0.5,
                    letterSpacing: "0.05em",
                  }}
                >
                  {a.number}
                </span>
                <span
                  style={{
                    fontSize: "10px",
                    fontWeight: "600",
                    color: a.color,
                    padding: "3px 10px",
                    background: `${a.color}12`,
                    border: `1px solid ${a.color}28`,
                    borderRadius: "999px",
                  }}
                >
                  {a.tag}
                </span>
              </div>

              {/* Color bar */}
              <div
                style={{
                  width: "32px",
                  height: "3px",
                  borderRadius: "999px",
                  background: `linear-gradient(90deg, ${a.color}, ${a.color}44)`,
                  marginBottom: "16px",
                }}
              />

              <div
                style={{
                  fontSize: "16px",
                  fontWeight: "700",
                  color: "#f0f0ff",
                  marginBottom: "10px",
                  letterSpacing: "-0.01em",
                }}
              >
                {a.label}
              </div>

              <div
                style={{
                  fontSize: "12px",
                  color: "#8888aa",
                  lineHeight: "1.7",
                  flex: 1,
                }}
              >
                {a.desc}
              </div>

              <div
                style={{
                  marginTop: "20px",
                  fontSize: "12px",
                  color: a.color,
                  fontWeight: "600",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                Open
                <span style={{ fontSize: "14px" }}>→</span>
              </div>
            </button>
          ))}
        </div>

        {/* Bottom row */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1.6fr",
            gap: "12px",
          }}
        >
          {/* Journey checklist */}
          <div
            style={{
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.04)",
              borderRadius: "16px",
              padding: "20px",
            }}
          >
            <div
              style={{
                fontSize: "11px",
                fontWeight: "700",
                color: "#f0f0ff",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                marginBottom: "16px",
              }}
            >
              Your Journey
            </div>
            {journey.map((item, i) => (
              <div
                key={i}
                onClick={() => item.page && onNavigate(item.page)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "9px 0",
                  borderBottom:
                    i < journey.length - 1
                      ? "1px solid rgba(255,255,255,0.03)"
                      : "none",
                  cursor: item.page && !item.done ? "pointer" : "default",
                  transition: "opacity 0.15s",
                }}
                onMouseEnter={(e) => {
                  if (item.page && !item.done)
                    e.currentTarget.style.opacity = "0.7";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.opacity = "1";
                }}
              >
                <div
                  style={{
                    width: "18px",
                    height: "18px",
                    borderRadius: "50%",
                    background: item.done
                      ? "linear-gradient(135deg, #7c6fef, #9b6ef3)"
                      : "transparent",
                    border: item.done
                      ? "none"
                      : "1px solid rgba(255,255,255,0.1)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "9px",
                    color: "white",
                    flexShrink: 0,
                  }}
                >
                  {item.done ? "✓" : ""}
                </div>
                <span
                  style={{
                    fontSize: "12px",
                    color: item.done ? "#333344" : "#8888aa",
                    textDecoration: item.done ? "line-through" : "none",
                    flex: 1,
                  }}
                >
                  {item.label}
                </span>
                {item.page && !item.done && (
                  <span style={{ fontSize: "11px", color: "#7c6fef" }}>→</span>
                )}
              </div>
            ))}
          </div>

          {/* Why Arivo */}
          <div
            style={{
              background:
                "linear-gradient(145deg, rgba(124,111,239,0.08), rgba(232,121,249,0.03))",
              border: "1px solid rgba(124,111,239,0.14)",
              borderRadius: "16px",
              padding: "20px",
              display: "flex",
              gap: "2rem",
            }}
          >
            {/* Left */}
            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontSize: "11px",
                  fontWeight: "700",
                  color: "#7c6fef",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  marginBottom: "14px",
                }}
              >
                Why Arivo is Different
              </div>
              {[
                {
                  label: "Home Office verified",
                  desc: "Every job checked against the official UK register",
                },
                {
                  label: "Real market data",
                  desc: "Skill gap based on live London job listings",
                },
                {
                  label: "Every field",
                  desc: "Tech, medical, finance, law — not just developers",
                },
              ].map((point, i) => (
                <div key={i} style={{ marginBottom: "14px" }}>
                  <div
                    style={{
                      fontSize: "12px",
                      fontWeight: "600",
                      color: "#f0f0ff",
                      marginBottom: "2px",
                    }}
                  >
                    {point.label}
                  </div>
                  <div
                    style={{
                      fontSize: "12px",
                      color: "#55556a",
                      lineHeight: "1.5",
                    }}
                  >
                    {point.desc}
                  </div>
                </div>
              ))}
            </div>

            {/* Right — CTA */}
            <div
              style={{
                width: "180px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                gap: "10px",
                flexShrink: 0,
              }}
            >
              <button
                onClick={() => onNavigate("jobs")}
                style={{
                  padding: "11px 16px",
                  background: "linear-gradient(135deg, #7c6fef, #9b6ef3)",
                  border: "none",
                  borderRadius: "10px",
                  color: "white",
                  fontSize: "12px",
                  fontWeight: "700",
                  cursor: "pointer",
                  fontFamily: "inherit",
                  boxShadow: "0 4px 20px rgba(124,111,239,0.3)",
                }}
              >
                Find Jobs →
              </button>
              <button
                onClick={() => onNavigate("profile")}
                style={{
                  padding: "11px 16px",
                  background: "transparent",
                  border: "1px solid rgba(124,111,239,0.25)",
                  borderRadius: "10px",
                  color: "#a89cf7",
                  fontSize: "12px",
                  fontWeight: "600",
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                Upload CV →
              </button>
              <button
                onClick={() => onNavigate("chat")}
                style={{
                  padding: "11px 16px",
                  background: "transparent",
                  border: "1px solid rgba(255,255,255,0.06)",
                  borderRadius: "10px",
                  color: "#55556a",
                  fontSize: "12px",
                  fontWeight: "600",
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                Chat with Arivo →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
