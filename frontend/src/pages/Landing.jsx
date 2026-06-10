import { useState, useEffect, useRef } from "react";

const features = [
  {
    icon: "🔍",
    title: "Visa-Intelligent Job Search",
    desc: "Every job verified against the official Home Office Tier 2 sponsor register. 120,000+ companies checked automatically in real time.",
  },
  {
    icon: "🧠",
    title: "AI Skill Gap Analysis",
    desc: "Upload your CV. Get a personalised readiness score based on real London job market demand - not generic skill lists.",
  },
  {
    icon: "💬",
    title: "UK Interview Coach",
    desc: "Chat with Arivo about UK interview culture, STAR method, and role-specific prep. Available 24/7. Completely free.",
  },
  {
    icon: "📄",
    title: "Smart CV Analysis",
    desc: "Arivo reads your CV like a senior recruiter - extracting every skill across any field. Tech, medical, finance, law.",
  },
];

const steps = [
  {
    n: "01",
    title: "Upload Your CV",
    desc: "Arivo reads your PDF and extracts every skill automatically using AI - no manual entry needed.",
  },
  {
    n: "02",
    title: "Set Your Target Role",
    desc: "Tell Arivo what role you want - ML Engineer, Nurse, Teacher, Finance Analyst - any field.",
  },
  {
    n: "03",
    title: "Get Your Gap Report",
    desc: "Arivo analyses real London job listings and tells you exactly what skills you have, what you are missing, and where to learn them free.",
  },
  {
    n: "04",
    title: "Find Visa Sponsored Jobs",
    desc: "Search any role. Every result is checked against the official Home Office Tier 2 register so you only see jobs that can hire you.",
  },
];

const companies = [
  "Revolut",
  "DeepMind",
  "Monzo",
  "Starling Bank",
  "Deliveroo",
  "Babylon Health",
  "Barclays",
  "ASOS",
  "BT Group",
  "Wipro",
  "Infosys",
  "GSK",
  "NHS",
  "KPMG",
  "Deloitte",
  "Accenture",
];
const roles = [
  "ML Engineer",
  "Teacher",
  "Nurse",
  "Finance Analyst",
  "Lawyer",
  "Data Scientist",
  "UX Designer",
  "DevOps Engineer",
  "Pharmacist",
  "Product Manager",
];

function useCountUp(target, duration = 2000) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let start = 0;
    const step = target / (duration / 16);
    const t = setInterval(() => {
      start += step;
      if (start >= target) {
        setCount(target);
        clearInterval(t);
      } else setCount(Math.floor(start));
    }, 16);
    return () => clearInterval(t);
  }, [target, duration]);
  return count;
}

function TypingText() {
  const [text, setText] = useState("");
  const [cursor, setCursor] = useState(true);
  const [pi, setPi] = useState(0);
  const [deleting, setDeleting] = useState(false);
  const phrases = [
    "Find visa sponsored jobs in London",
    "Analyse your skill gap instantly",
    "Prepare for UK interviews with AI",
    "Upload your CV - get matched in seconds",
  ];

  useEffect(() => {
    const phrase = phrases[pi];
    const t = setTimeout(
      () => {
        if (!deleting) {
          if (text.length < phrase.length)
            setText(phrase.slice(0, text.length + 1));
          else setTimeout(() => setDeleting(true), 1800);
        } else {
          if (text.length > 0) setText(phrase.slice(0, text.length - 1));
          else {
            setDeleting(false);
            setPi((p) => (p + 1) % phrases.length);
          }
        }
      },
      deleting ? 35 : 65,
    );
    return () => clearTimeout(t);
  }, [text, deleting, pi]);

  useEffect(() => {
    const c = setInterval(() => setCursor((p) => !p), 500);
    return () => clearInterval(c);
  }, []);

  return (
    <span>
      {text}
      <span style={{ opacity: cursor ? 1 : 0, color: "#7c6fef" }}>|</span>
    </span>
  );
}

function Marquee({ items }) {
  return (
    <div
      style={{
        overflow: "hidden",
        width: "100%",
        maskImage:
          "linear-gradient(90deg, transparent, black 10%, black 90%, transparent)",
        WebkitMaskImage:
          "linear-gradient(90deg, transparent, black 10%, black 90%, transparent)",
      }}
    >
      <div
        style={{
          display: "flex",
          gap: "24px",
          animation: "marquee 28s linear infinite",
          width: "max-content",
        }}
      >
        {[...items, ...items].map((item, i) => (
          <span
            key={i}
            style={{
              fontSize: "13px",
              color: "#55556a",
              fontWeight: "500",
              whiteSpace: "nowrap",
              padding: "7px 18px",
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.05)",
              borderRadius: "999px",
            }}
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

function Landing({ onGetStarted }) {
  const [tick, setTick] = useState(0);
  const [mouse, setMouse] = useState({ x: 50, y: 50 });
  const containerRef = useRef(null);
  const c120k = useCountUp(120000, 2000);

  useEffect(() => {
    const t = setInterval(() => setTick((p) => p + 1), 40);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e) => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) {
        setMouse({
          x: ((e.clientX - rect.left) / rect.width) * 100,
          y: ((e.clientY - rect.top) / rect.height) * 100,
        });
      }
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const btnGlow = 20 + Math.sin(tick * 0.06) * 8;

  return (
    <div
      ref={containerRef}
      style={{
        background: "#050508",
        minHeight: "100vh",
        fontFamily: "'Inter', system-ui, sans-serif",
        color: "#f0f0ff",
        overflowX: "hidden",
      }}
    >
      <style>{`
        @keyframes marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse { 0%,100% { opacity:1; box-shadow: 0 0 8px #00d4aa; } 50% { opacity:0.6; box-shadow: 0 0 3px #00d4aa; } }
      `}</style>

      {/* Animated gradient mesh */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          pointerEvents: "none",
          background: `
          radial-gradient(ellipse at ${50 + Math.sin(tick * 0.018) * 12}% ${25 + Math.cos(tick * 0.014) * 10}%, rgba(124,111,239,0.18) 0%, transparent 50%),
          radial-gradient(ellipse at ${65 + Math.cos(tick * 0.022) * 15}% ${65 + Math.sin(tick * 0.016) * 12}%, rgba(232,121,249,0.1) 0%, transparent 45%),
          radial-gradient(ellipse at ${30 + Math.sin(tick * 0.02) * 10}% ${50 + Math.cos(tick * 0.019) * 8}%, rgba(0,212,170,0.07) 0%, transparent 40%),
          radial-gradient(ellipse at ${mouse.x}% ${mouse.y}%, rgba(124,111,239,0.08) 0%, transparent 30%)`,
        }}
      />

      {/* Noise texture */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          pointerEvents: "none",
          opacity: 0.03,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundSize: "150px",
        }}
      />

      {/* Particles */}
      {[...Array(20)].map((_, i) => (
        <div
          key={i}
          style={{
            position: "fixed",
            width: i % 5 === 0 ? "3px" : "2px",
            height: i % 5 === 0 ? "3px" : "2px",
            borderRadius: "50%",
            background:
              i % 3 === 0
                ? "rgba(0,212,170,0.5)"
                : i % 3 === 1
                  ? "rgba(124,111,239,0.4)"
                  : "rgba(232,121,249,0.35)",
            left: `${(i * 5.3 + 2) % 100}%`,
            top: `${((tick * 0.2 + i * 17) % 110) - 5}%`,
            pointerEvents: "none",
            transition: "top 0.04s linear",
          }}
        />
      ))}

      {/* Nav */}
      <nav
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          padding: "0 3rem",
          height: "64px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "rgba(5,5,8,0.85)",
          backdropFilter: "blur(30px)",
          borderBottom: "1px solid rgba(124,111,239,0.12)",
        }}
      >
        <span
          style={{
            fontSize: "18px",
            fontWeight: "800",
            background: "linear-gradient(135deg, #7c6fef, #e879f9)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            letterSpacing: "-0.02em",
          }}
        >
          Arivo AI
        </span>
        <div style={{ display: "flex", gap: "8px" }}>
          <button
            onClick={onGetStarted}
            style={{
              padding: "8px 18px",
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "8px",
              color: "#8888aa",
              cursor: "pointer",
              fontSize: "13px",
              fontFamily: "inherit",
            }}
          >
            Sign In
          </button>
          <button
            onClick={onGetStarted}
            style={{
              padding: "8px 18px",
              background: "linear-gradient(135deg, #7c6fef, #9b6ef3)",
              border: "none",
              borderRadius: "8px",
              color: "white",
              cursor: "pointer",
              fontSize: "13px",
              fontWeight: "700",
              fontFamily: "inherit",
              boxShadow: "0 0 20px rgba(124,111,239,0.4)",
            }}
          >
            Get Started Free
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "8rem 2rem 5rem",
          textAlign: "center",
        }}
      >
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            padding: "6px 16px",
            background: "rgba(0,212,170,0.08)",
            border: "1px solid rgba(0,212,170,0.28)",
            borderRadius: "999px",
            fontSize: "12px",
            fontWeight: "500",
            color: "#00d4aa",
            marginBottom: "2.5rem",
            boxShadow: "0 0 20px rgba(0,212,170,0.1)",
            animation: "fadeUp 0.6s ease both",
          }}
        >
          <span
            style={{
              width: "6px",
              height: "6px",
              borderRadius: "50%",
              background: "#00d4aa",
              animation: "pulse 2s infinite",
            }}
          />
          Powered by real Home Office data · Updated daily
        </div>

        <h1
          style={{
            fontSize: "clamp(2.5rem, 5.5vw, 5rem)",
            fontWeight: "900",
            lineHeight: "1.06",
            letterSpacing: "-0.04em",
            marginBottom: "1.5rem",
            maxWidth: "850px",
            animation: "fadeUp 0.6s ease 0.1s both",
          }}
        >
          The UK Job Market Is Hard
          <br />
          <span
            style={{
              background:
                "linear-gradient(135deg, #7c6fef 0%, #e879f9 50%, #00d4aa 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            For International Students.
          </span>
        </h1>

        <p
          style={{
            fontSize: "1.1rem",
            color: "#8888aa",
            maxWidth: "520px",
            lineHeight: "1.8",
            marginBottom: "3rem",
            animation: "fadeUp 0.6s ease 0.2s both",
          }}
        >
          Arivo AI finds visa-sponsored jobs, analyses your skill gaps, and
          coaches you for UK interviews - powered by official government data
          and real AI.
        </p>

        <div
          style={{
            width: "100%",
            maxWidth: "600px",
            marginBottom: "3rem",
            animation: "fadeUp 0.6s ease 0.3s both",
          }}
        >
          <div
            style={{
              background: "rgba(17,17,28,0.95)",
              border: "1px solid rgba(124,111,239,0.4)",
              borderRadius: "16px",
              padding: "16px 22px",
              display: "flex",
              alignItems: "center",
              gap: "14px",
              boxShadow: `0 0 ${btnGlow + 15}px rgba(124,111,239,0.2), inset 0 1px 0 rgba(255,255,255,0.05)`,
            }}
          >
            <span style={{ fontSize: "18px", flexShrink: 0 }}>🔍</span>
            <span
              style={{
                color: "#f0f0ff",
                fontSize: "15px",
                flex: 1,
                textAlign: "left",
              }}
            >
              <TypingText />
            </span>
            <button
              onClick={onGetStarted}
              style={{
                padding: "9px 22px",
                background: "linear-gradient(135deg, #7c6fef, #9b6ef3)",
                border: "none",
                borderRadius: "10px",
                color: "white",
                fontSize: "13px",
                fontWeight: "700",
                cursor: "pointer",
                fontFamily: "inherit",
                boxShadow: "0 4px 20px rgba(124,111,239,0.5)",
                flexShrink: 0,
              }}
            >
              Search
            </button>
          </div>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "8px",
              justifyContent: "center",
              marginTop: "14px",
            }}
          >
            {roles.slice(0, 7).map((r, i) => (
              <span
                key={i}
                onClick={onGetStarted}
                style={{
                  padding: "4px 14px",
                  background: "rgba(124,111,239,0.08)",
                  border: "1px solid rgba(124,111,239,0.2)",
                  borderRadius: "999px",
                  fontSize: "12px",
                  color: "#9b6ef3",
                  cursor: "pointer",
                }}
              >
                {r}
              </span>
            ))}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            gap: "12px",
            flexWrap: "wrap",
            justifyContent: "center",
            marginBottom: "4rem",
            animation: "fadeUp 0.6s ease 0.4s both",
          }}
        >
          <button
            onClick={onGetStarted}
            style={{
              padding: "14px 36px",
              background: "linear-gradient(135deg, #7c6fef, #9b6ef3)",
              border: "none",
              borderRadius: "12px",
              color: "white",
              fontSize: "15px",
              fontWeight: "700",
              cursor: "pointer",
              fontFamily: "inherit",
              boxShadow: `0 ${Math.floor(btnGlow / 3)}px ${btnGlow + 5}px rgba(124,111,239,0.45)`,
              transform: `translateY(${Math.sin(tick * 0.05) * 0.8}px)`,
              transition: "transform 0.05s",
            }}
          >
            Get Started — It's Free →
          </button>
          <button
            onClick={onGetStarted}
            style={{
              padding: "14px 36px",
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "12px",
              color: "#8888aa",
              fontSize: "15px",
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            Sign In
          </button>
        </div>

        <div
          style={{
            display: "flex",
            gap: "4rem",
            flexWrap: "wrap",
            justifyContent: "center",
            animation: "fadeUp 0.6s ease 0.5s both",
          }}
        >
          {[
            { display: `${c120k.toLocaleString()}+`, label: "Visa Sponsors" },
            { display: "Real-time", label: "Job Data" },
            { display: "Every", label: "Field & Role" },
            { display: "100%", label: "Free Forever" },
          ].map((s, i) => (
            <div key={i} style={{ textAlign: "center" }}>
              <div
                style={{
                  fontSize: "1.4rem",
                  fontWeight: "800",
                  background: "linear-gradient(135deg, #7c6fef, #e879f9)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                {s.display}
              </div>
              <div
                style={{
                  fontSize: "11px",
                  color: "#55556a",
                  marginTop: "3px",
                  fontWeight: "500",
                }}
              >
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Marquee */}
      <div
        style={{
          padding: "2rem 0 4rem",
          borderTop: "1px solid rgba(255,255,255,0.04)",
          borderBottom: "1px solid rgba(255,255,255,0.04)",
        }}
      >
        <div
          style={{
            textAlign: "center",
            fontSize: "11px",
            color: "#333344",
            fontWeight: "600",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            marginBottom: "1.5rem",
          }}
        >
          Companies verified as official Tier 2 sponsors
        </div>
        <Marquee items={companies} />
      </div>

      {/* Features */}
      <section
        style={{ padding: "6rem 2rem", maxWidth: "960px", margin: "0 auto" }}
      >
        <div style={{ textAlign: "center", marginBottom: "3.5rem" }}>
          <h2
            style={{
              fontSize: "clamp(1.8rem, 3.5vw, 2.5rem)",
              fontWeight: "800",
              letterSpacing: "-0.03em",
              marginBottom: "1rem",
            }}
          >
            Everything to{" "}
            <span
              style={{
                background: "linear-gradient(135deg, #7c6fef, #e879f9)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              land your placement
            </span>
          </h2>
          <p
            style={{
              color: "#8888aa",
              fontSize: "14px",
              maxWidth: "440px",
              margin: "0 auto",
              lineHeight: "1.7",
            }}
          >
            Built for every student in every field - not just tech. Any role,
            any background.
          </p>
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: "16px",
          }}
        >
          {features.map((f, i) => (
            <div
              key={i}
              style={{
                background:
                  "linear-gradient(145deg, rgba(124,111,239,0.07), rgba(232,121,249,0.02), rgba(0,0,0,0))",
                border: "1px solid rgba(124,111,239,0.14)",
                borderRadius: "18px",
                padding: "28px",
                transition: "all 0.3s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "rgba(124,111,239,0.45)";
                e.currentTarget.style.transform = "translateY(-5px)";
                e.currentTarget.style.boxShadow =
                  "0 24px 50px rgba(124,111,239,0.15)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "rgba(124,111,239,0.14)";
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <div style={{ fontSize: "2rem", marginBottom: "14px" }}>
                {f.icon}
              </div>
              <div
                style={{
                  fontSize: "15px",
                  fontWeight: "600",
                  marginBottom: "8px",
                }}
              >
                {f.title}
              </div>
              <div
                style={{
                  fontSize: "13px",
                  color: "#8888aa",
                  lineHeight: "1.7",
                }}
              >
                {f.desc}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section
        style={{
          padding: "2rem 2rem 6rem",
          maxWidth: "960px",
          margin: "0 auto",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "3.5rem" }}>
          <h2
            style={{
              fontSize: "clamp(1.8rem, 3.5vw, 2.5rem)",
              fontWeight: "800",
              letterSpacing: "-0.03em",
              marginBottom: "1rem",
            }}
          >
            How Arivo{" "}
            <span
              style={{
                background: "linear-gradient(135deg, #7c6fef, #e879f9)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              works
            </span>
          </h2>
          <p style={{ color: "#8888aa", fontSize: "14px", lineHeight: "1.7" }}>
            Four steps. Less than 5 minutes. Completely free.
          </p>
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: "16px",
          }}
        >
          {steps.map((s, i) => (
            <div
              key={i}
              style={{
                background: "rgba(255,255,255,0.02)",
                border: "1px solid rgba(255,255,255,0.05)",
                borderRadius: "16px",
                padding: "24px",
                display: "flex",
                gap: "16px",
                transition: "all 0.25s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "rgba(124,111,239,0.3)";
                e.currentTarget.style.background = "rgba(124,111,239,0.05)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.05)";
                e.currentTarget.style.background = "rgba(255,255,255,0.02)";
              }}
            >
              <div
                style={{
                  fontSize: "13px",
                  fontWeight: "800",
                  color: "#7c6fef",
                  opacity: 0.7,
                  flexShrink: 0,
                  paddingTop: "2px",
                  letterSpacing: "0.05em",
                }}
              >
                {s.n}
              </div>
              <div>
                <div
                  style={{
                    fontSize: "14px",
                    fontWeight: "600",
                    marginBottom: "6px",
                  }}
                >
                  {s.title}
                </div>
                <div
                  style={{
                    fontSize: "12px",
                    color: "#8888aa",
                    lineHeight: "1.65",
                  }}
                >
                  {s.desc}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section style={{ padding: "2rem 2rem 6rem", textAlign: "center" }}>
        <div
          style={{
            maxWidth: "600px",
            margin: "0 auto",
            padding: "4rem 3rem",
            background:
              "linear-gradient(135deg, rgba(124,111,239,0.1), rgba(232,121,249,0.05), rgba(0,212,170,0.03))",
            border: "1px solid rgba(124,111,239,0.22)",
            borderRadius: "28px",
            boxShadow: "0 0 80px rgba(124,111,239,0.1)",
          }}
        >
          <div
            style={{
              fontSize: "11px",
              color: "#7c6fef",
              fontWeight: "600",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              marginBottom: "1rem",
            }}
          >
            Start today
          </div>
          <h2
            style={{
              fontSize: "clamp(1.6rem, 3vw, 2.2rem)",
              fontWeight: "800",
              marginBottom: "1rem",
              letterSpacing: "-0.03em",
              lineHeight: "1.2",
            }}
          >
            Ready to find your place
            <br />
            in the UK job market?
          </h2>
          <p
            style={{
              color: "#8888aa",
              marginBottom: "2.5rem",
              fontSize: "14px",
              lineHeight: "1.75",
            }}
          >
            Join students already using Arivo AI to navigate visa sponsorship,
            skill gaps, and UK interviews.
          </p>
          <div
            style={{ display: "flex", gap: "10px", justifyContent: "center" }}
          >
            <button
              onClick={onGetStarted}
              style={{
                padding: "13px 38px",
                background: "linear-gradient(135deg, #7c6fef, #9b6ef3)",
                border: "none",
                borderRadius: "12px",
                color: "white",
                fontSize: "15px",
                fontWeight: "700",
                cursor: "pointer",
                fontFamily: "inherit",
                boxShadow: "0 8px 30px rgba(124,111,239,0.45)",
              }}
            >
              Start For Free →
            </button>
            <button
              onClick={onGetStarted}
              style={{
                padding: "13px 24px",
                background: "transparent",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "12px",
                color: "#8888aa",
                fontSize: "14px",
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              Sign In
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer
        style={{
          borderTop: "1px solid rgba(255,255,255,0.05)",
          padding: "4rem 0 2rem",
        }}
      >
        <div
          style={{
            maxWidth: "960px",
            margin: "0 auto",
            padding: "0 3rem",
          }}
        >
          {/* Top row */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "2fr 1fr 1fr 1fr",
              gap: "3rem",
              marginBottom: "3rem",
            }}
          >
            {/* Brand */}
            <div>
              <div
                style={{
                  fontSize: "18px",
                  fontWeight: "800",
                  background: "linear-gradient(135deg, #7c6fef, #e879f9)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  marginBottom: "10px",
                }}
              >
                Arivo AI
              </div>
              <p
                style={{
                  fontSize: "13px",
                  color: "#55556a",
                  lineHeight: "1.7",
                  maxWidth: "220px",
                  marginBottom: "16px",
                }}
              >
                The AI career platform for international students navigating the
                UK job market.
              </p>
              {/* Social links */}
              <div style={{ display: "flex", gap: "10px" }}>
                <a
                  href="https://github.com/Akshar246/arivo-ai"
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    fontSize: "12px",
                    color: "#55556a",
                    textDecoration: "none",
                    padding: "5px 12px",
                    border: "1px solid rgba(255,255,255,0.06)",
                    borderRadius: "6px",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.color = "#f0f0ff";
                    e.target.style.borderColor = "rgba(255,255,255,0.15)";
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.color = "#55556a";
                    e.target.style.borderColor = "rgba(255,255,255,0.06)";
                  }}
                >
                  GitHub →
                </a>
              </div>
            </div>

            {/* Product */}
            <div>
              <div
                style={{
                  fontSize: "12px",
                  fontWeight: "600",
                  color: "#f0f0ff",
                  marginBottom: "16px",
                  letterSpacing: "0.05em",
                }}
              >
                PRODUCT
              </div>
              {[
                "Job Search",
                "Skill Gap",
                "Interview Coach",
                "CV Analysis",
              ].map((item, i) => (
                <div
                  key={i}
                  onClick={onGetStarted}
                  style={{
                    fontSize: "13px",
                    color: "#55556a",
                    marginBottom: "10px",
                    cursor: "pointer",
                    transition: "color 0.2s",
                  }}
                  onMouseEnter={(e) => (e.target.style.color = "#f0f0ff")}
                  onMouseLeave={(e) => (e.target.style.color = "#55556a")}
                >
                  {item}
                </div>
              ))}
            </div>

            {/* For */}
            <div>
              <div
                style={{
                  fontSize: "12px",
                  fontWeight: "600",
                  color: "#f0f0ff",
                  marginBottom: "16px",
                  letterSpacing: "0.05em",
                }}
              >
                FOR STUDENTS
              </div>
              {[
                "International Students",
                "UK Graduates",
                "Placement Year",
                "Any Field",
              ].map((item, i) => (
                <div
                  key={i}
                  style={{
                    fontSize: "13px",
                    color: "#55556a",
                    marginBottom: "10px",
                  }}
                >
                  {item}
                </div>
              ))}
            </div>

            {/* Data */}
            <div>
              <div
                style={{
                  fontSize: "12px",
                  fontWeight: "600",
                  color: "#f0f0ff",
                  marginBottom: "16px",
                  letterSpacing: "0.05em",
                }}
              >
                DATA SOURCES
              </div>
              {[
                { label: "UK Home Office", sub: "Tier 2 Sponsor Register" },
                { label: "Adzuna API", sub: "Live Job Listings" },
                { label: "Groq LLaMA 3.3", sub: "AI Inference" },
                { label: "HuggingFace", sub: "Embeddings" },
              ].map((item, i) => (
                <div key={i} style={{ marginBottom: "10px" }}>
                  <div
                    style={{
                      fontSize: "12px",
                      color: "#55556a",
                      fontWeight: "500",
                    }}
                  >
                    {item.label}
                  </div>
                  <div style={{ fontSize: "11px", color: "#333344" }}>
                    {item.sub}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom bar */}
          <div
            style={{
              paddingTop: "1.5rem",
              borderTop: "1px solid rgba(255,255,255,0.04)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "1rem",
            }}
          >
            <span style={{ fontSize: "12px", color: "#333344" }}>
              © {new Date().getFullYear()} Arivo AI · Built by an international
              student, for every student
            </span>
            <div style={{ display: "flex", gap: "20px" }}>
              {["Privacy", "Terms", "GitHub"].map((item, i) => (
                <span
                  key={i}
                  style={{
                    fontSize: "12px",
                    color: "#333344",
                    cursor: "pointer",
                    transition: "color 0.2s",
                  }}
                  onMouseEnter={(e) => (e.target.style.color = "#8888aa")}
                  onMouseLeave={(e) => (e.target.style.color = "#333344")}
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Landing;
