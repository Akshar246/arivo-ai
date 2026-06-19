import { useState, useEffect, useRef } from "react";

// ─────────────────────────────────────────────────────────────
// LANDING · Arivo AI  ·  "The Sponsor Wall"
// Cinematic full-screen hero: a living field of real verified UK
// sponsors drifting behind the headline. Below: a scroll-revealed
// story of the product. Emerald + gold, tasteful slow motion.
// All ambient motion is CSS (GPU) — no per-frame React re-renders.
// ─────────────────────────────────────────────────────────────

const T = {
  bg: "#050508",
  panel: "#11111c",
  panel2: "#0d0d16",
  emerald: "#7c6fef",
  emerald2: "#9b6ef3",
  emeraldBright: "#00d4aa",
  gold: "#e879f9",
  gold2: "#d65ee8",
  textHi: "#f0f0ff",
  textMid: "#8888aa",
  textLo: "#55556a",
  textFaint: "#333344",
  brandGrad: "linear-gradient(135deg, #7c6fef, #9b6ef3)",
  emGoldGrad: "linear-gradient(120deg, #7c6fef 0%, #e879f9 50%, #00d4aa 100%)",
};

// Real UK sponsors for the wall, placed across 3 depth layers.
// layer: "near" (bright/large), "mid", "far" (dim/small/blur)
const wall = [
  { n: "Revolut", t: 14, l: 8, layer: "mid", a: 0 },
  { n: "DeepMind", t: 9, l: 30, layer: "near", a: 1 },
  { n: "Monzo", t: 7, l: 64, layer: "far", a: 2 },
  { n: "Barclays", t: 13, l: 84, layer: "mid", a: 0 },
  { n: "Starling Bank", t: 24, l: 18, layer: "far", a: 2 },
  { n: "GSK", t: 22, l: 90, layer: "near", a: 1 },
  { n: "Deliveroo", t: 30, l: 6, layer: "near", a: 2 },
  { n: "NHS", t: 27, l: 74, layer: "far", a: 0 },
  { n: "ASOS", t: 44, l: 4, layer: "mid", a: 1 },
  { n: "KPMG", t: 47, l: 92, layer: "far", a: 2 },
  { n: "BT Group", t: 62, l: 9, layer: "far", a: 0 },
  { n: "Deloitte", t: 60, l: 30, layer: "mid", a: 2 },
  { n: "Wipro", t: 66, l: 70, layer: "near", a: 1 },
  { n: "Accenture", t: 63, l: 88, layer: "mid", a: 0 },
  { n: "Babylon Health", t: 80, l: 16, layer: "far", a: 1 },
  { n: "Infosys", t: 83, l: 48, layer: "mid", a: 0 },
  { n: "Barclays UK", t: 78, l: 80, layer: "far", a: 2 },
  { n: "Starling", t: 88, l: 66, layer: "near", a: 1 },
];

const features = [
  {
    eyebrow: "Visa-Intelligent Search",
    title: "Only jobs that can actually hire you",
    desc: "Every listing is checked against the official Home Office Skilled Worker register in real time. No more applying to roles that can't sponsor your visa.",
    visual: "jobs",
  },
  {
    eyebrow: "ATS Readiness",
    title: "See your CV the way the robots do",
    desc: "Before a human reads it, software screens your CV. Arivo scores it honestly and shows exactly what to fix — including conventions that quietly hurt international students.",
    visual: "ats",
  },
  {
    eyebrow: "AI Interview Coach",
    title: "A career coach that knows real listings",
    desc: "Ask anything about UK interviews, the STAR method, or a specific role. Arivo answers from live job data — not generic advice copied off the internet.",
    visual: "coach",
  },
  {
    eyebrow: "Skill Gap Analysis",
    title: "Know exactly what you're missing",
    desc: "Upload your CV, pick a target role, and get a readiness score based on real London market demand — plus free resources to close every gap.",
    visual: "skills",
  },
];

// ── Reveal on scroll (IntersectionObserver) ──────────────────
function Reveal({ children, delay = 0, y = 30, style = {} }) {
  const [seen, setSeen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const reduce =
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setSeen(true);
      return;
    }
    const el = ref.current;
    if (!el) return;
    const ob = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setSeen(true);
          ob.disconnect();
        }
      },
      { threshold: 0.15 },
    );
    ob.observe(el);
    return () => ob.disconnect();
  }, []);
  return (
    <div
      ref={ref}
      style={{
        opacity: seen ? 1 : 0,
        transform: seen ? "none" : `translateY(${y}px)`,
        transition: `opacity 0.7s cubic-bezier(0.22,1,0.36,1) ${delay}s, transform 0.7s cubic-bezier(0.22,1,0.36,1) ${delay}s`,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// ── Sponsor Wall chip ────────────────────────────────────────
function SponsorChip({ item }) {
  const styles = {
    near: { fontSize: "15px", opacity: 0.5, blur: 0, dur: 11 },
    mid: { fontSize: "13px", opacity: 0.3, blur: 0.4, dur: 14 },
    far: { fontSize: "11.5px", opacity: 0.16, blur: 1.2, dur: 18 },
  }[item.layer];

  return (
    <div
      style={{
        position: "absolute",
        top: `${item.t}%`,
        left: `${item.l}%`,
        transform: "translate(-50%,-50%)",
        display: "flex",
        alignItems: "center",
        gap: "7px",
        padding: "7px 14px",
        borderRadius: "999px",
        background: "rgba(17,17,28,0.55)",
        border: "1px solid rgba(124,111,239,0.14)",
        backdropFilter: "blur(2px)",
        whiteSpace: "nowrap",
        opacity: styles.opacity,
        filter: styles.blur ? `blur(${styles.blur}px)` : "none",
        animation: `wallFloat${item.a} ${styles.dur}s ease-in-out infinite`,
        willChange: "transform",
      }}
    >
      <span
        style={{
          width: "15px",
          height: "15px",
          borderRadius: "50%",
          background: "rgba(0,212,170,0.16)",
          color: T.emeraldBright,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "9px",
          fontWeight: 800,
        }}
      >
        ✓
      </span>
      <span
        style={{ fontSize: styles.fontSize, color: T.textMid, fontWeight: 500 }}
      >
        {item.n}
      </span>
    </div>
  );
}

// ── Mock visuals (stylized, not screenshots) ─────────────────
function JobsMock() {
  return (
    <div style={mockCard}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          marginBottom: "14px",
        }}
      >
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            background: T.brandGrad,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 800,
            color: "#fff",
          }}
        >
          R
        </div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: T.textHi }}>
            Associate Data Scientist
          </div>
          <div style={{ fontSize: 12, color: T.textLo }}>
            Revolut · London, UK
          </div>
        </div>
      </div>
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
        <span
          style={pill(
            T.emeraldBright,
            "rgba(0,212,170,0.12)",
            "rgba(0,212,170,0.3)",
          )}
        >
          ✓ Skilled Worker sponsor
        </span>
        <span
          style={pill(
            T.textMid,
            "rgba(255,255,255,0.05)",
            "rgba(255,255,255,0.08)",
          )}
        >
          £57,574
        </span>
        <span
          style={pill(
            T.textMid,
            "rgba(255,255,255,0.05)",
            "rgba(255,255,255,0.08)",
          )}
        >
          Full-time
        </span>
      </div>
      <div style={{ fontSize: 11, color: T.textFaint, marginTop: 14 }}>
        Posted 1 week ago
      </div>
    </div>
  );
}

function AtsMock() {
  const r = 40,
    c = 2 * Math.PI * r,
    off = c * (1 - 0.84);
  return (
    <div
      style={{
        ...mockCard,
        display: "flex",
        alignItems: "center",
        gap: "20px",
      }}
    >
      <div
        style={{ position: "relative", width: 110, height: 110, flexShrink: 0 }}
      >
        <svg viewBox="0 0 100 100" style={{ width: "100%", height: "100%" }}>
          <defs>
            <linearGradient id="lm-g" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#7c6fef" />
              <stop offset="100%" stopColor="#00d4aa" />
            </linearGradient>
          </defs>
          <circle
            cx="50"
            cy="50"
            r={r}
            fill="none"
            stroke="#0d0d16"
            strokeWidth="9"
          />
          <circle
            cx="50"
            cy="50"
            r={r}
            fill="none"
            stroke="url(#lm-g)"
            strokeWidth="9"
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={off}
            transform="rotate(-90 50 50)"
          />
        </svg>
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              fontSize: 26,
              fontWeight: 800,
              color: T.textHi,
              lineHeight: 1,
            }}
          >
            84
          </div>
          <div
            style={{ fontSize: 10, color: T.emeraldBright, fontWeight: 700 }}
          >
            ATS-ready
          </div>
        </div>
      </div>
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          gap: "9px",
        }}
      >
        {[
          ["Parse-ability", 1, T.emeraldBright],
          ["Keyword Match", 0.55, T.gold],
          ["Sections", 1, T.emeraldBright],
        ].map(([lbl, p, col], i) => (
          <div key={i}>
            <div style={{ fontSize: 11, color: T.textMid, marginBottom: 4 }}>
              {lbl}
            </div>
            <div style={{ height: 5, background: "#0d0d16", borderRadius: 99 }}>
              <div
                style={{
                  width: `${p * 100}%`,
                  height: "100%",
                  background: col,
                  borderRadius: 99,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CoachMock() {
  return (
    <div
      style={{
        ...mockCard,
        display: "flex",
        flexDirection: "column",
        gap: "10px",
      }}
    >
      <div
        style={{
          alignSelf: "flex-end",
          maxWidth: "80%",
          padding: "10px 14px",
          borderRadius: "14px 14px 4px 14px",
          background: T.brandGrad,
          color: "#fff",
          fontSize: 12.5,
          lineHeight: 1.5,
        }}
      >
        Which London fintechs sponsor visas for data roles?
      </div>
      <div
        style={{
          alignSelf: "flex-start",
          maxWidth: "85%",
          padding: "10px 14px",
          borderRadius: "14px 14px 14px 4px",
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(124,111,239,0.15)",
          color: T.textHi,
          fontSize: 12.5,
          lineHeight: 1.55,
        }}
      >
        Based on live listings:{" "}
        <strong style={{ color: T.emeraldBright }}>Revolut</strong>,{" "}
        <strong style={{ color: T.emeraldBright }}>Monzo</strong> and{" "}
        <strong style={{ color: T.emeraldBright }}>Starling</strong> are all
        verified Skilled Worker sponsors hiring now. Want me to tailor your CV
        for one?
      </div>
    </div>
  );
}

function SkillsMock() {
  const have = ["Python", "SQL", "Pandas"];
  const miss = ["AWS", "Docker"];
  return (
    <div style={mockCard}>
      <div style={{ fontSize: 12, color: T.textMid, marginBottom: 12 }}>
        Readiness for{" "}
        <strong style={{ color: T.textHi }}>Data Scientist</strong>
      </div>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "7px",
          marginBottom: "14px",
        }}
      >
        {have.map((s) => (
          <span
            key={s}
            style={pill(
              T.emeraldBright,
              "rgba(0,212,170,0.12)",
              "rgba(0,212,170,0.3)",
            )}
          >
            ✓ {s}
          </span>
        ))}
        {miss.map((s) => (
          <span
            key={s}
            style={pill(
              T.gold,
              "rgba(232,121,249,0.1)",
              "rgba(232,121,249,0.28)",
            )}
          >
            + {s}
          </span>
        ))}
      </div>
      <div
        style={{
          height: 7,
          background: "#0d0d16",
          borderRadius: 99,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: "68%",
            height: "100%",
            background: "linear-gradient(90deg,#7c6fef,#00d4aa)",
            borderRadius: 99,
          }}
        />
      </div>
      <div style={{ fontSize: 11, color: T.textLo, marginTop: 8 }}>
        68% match · 2 skills to close
      </div>
    </div>
  );
}

const mockVisuals = {
  jobs: JobsMock,
  ats: AtsMock,
  coach: CoachMock,
  skills: SkillsMock,
};

const mockCard = {
  background: "rgba(17,17,28,0.7)",
  border: "1px solid rgba(124,111,239,0.18)",
  borderRadius: "18px",
  padding: "22px",
  boxShadow: "0 30px 60px rgba(0,0,0,0.4)",
  width: "100%",
  maxWidth: "380px",
};
const pill = (color, bg, border) => ({
  fontSize: 11.5,
  fontWeight: 600,
  color,
  background: bg,
  border: `1px solid ${border}`,
  padding: "4px 11px",
  borderRadius: "999px",
});

function Landing({ onGetStarted }) {
  return (
    <div
      style={{
        background: T.bg,
        minHeight: "100vh",
        fontFamily: "'Inter', system-ui, sans-serif",
        color: T.textHi,
        overflowX: "hidden",
      }}
    >
      <style>{`
        @keyframes wallFloat0 { 0%,100% { transform: translate(-50%,-50%); } 50% { transform: translate(-50%,calc(-50% - 12px)); } }
        @keyframes wallFloat1 { 0%,100% { transform: translate(-50%,-50%); } 50% { transform: translate(-50%,calc(-50% + 10px)); } }
        @keyframes wallFloat2 { 0%,100% { transform: translate(-50%,-50%) scale(1); } 50% { transform: translate(-50%,calc(-50% - 8px)) scale(1.03); } }
        @keyframes auroraA { 0%,100% { transform: translate(0,0) scale(1); } 50% { transform: translate(6%,4%) scale(1.1); } }
        @keyframes auroraB { 0%,100% { transform: translate(0,0) scale(1); } 50% { transform: translate(-5%,-4%) scale(1.08); } }
        @keyframes pulseDot { 0%,100% { opacity:1; box-shadow:0 0 8px ${T.emeraldBright}; } 50% { opacity:0.55; box-shadow:0 0 3px ${T.emeraldBright}; } }
        @keyframes heroIn { from { opacity:0; transform:translateY(22px);} to { opacity:1; transform:translateY(0);} }
        @media (prefers-reduced-motion: reduce) {
          [data-anim] { animation: none !important; }
        }
      `}</style>

      {/* Ambient aurora (CSS only) */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          pointerEvents: "none",
          overflow: "hidden",
        }}
      >
        <div
          data-anim
          style={{
            position: "absolute",
            top: "-10%",
            left: "10%",
            width: "55vw",
            height: "55vw",
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(124,111,239,0.16), transparent 60%)",
            filter: "blur(40px)",
            animation: "auroraA 18s ease-in-out infinite",
          }}
        />
        <div
          data-anim
          style={{
            position: "absolute",
            bottom: "-15%",
            right: "5%",
            width: "50vw",
            height: "50vw",
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(232,121,249,0.08), transparent 60%)",
            filter: "blur(50px)",
            animation: "auroraB 22s ease-in-out infinite",
          }}
        />
      </div>

      {/* Nav */}
      <nav
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          padding: "0 clamp(1.2rem,4vw,3rem)",
          height: "64px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "rgba(5,5,8,0.7)",
          backdropFilter: "blur(30px)",
          borderBottom: "1px solid rgba(124,111,239,0.1)",
        }}
      >
        <span
          style={{
            fontSize: "18px",
            fontWeight: 800,
            background: T.brandGrad,
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            letterSpacing: "-0.02em",
          }}
        >
          Arivo AI
        </span>
        <div style={{ display: "flex", gap: "8px" }}>
          <button onClick={onGetStarted} style={btnGhost}>
            Sign In
          </button>
          <button onClick={onGetStarted} style={btnPrimarySm}>
            Get Started Free
          </button>
        </div>
      </nav>

      {/* HERO — the Sponsor Wall */}
      <section
        style={{
          position: "relative",
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "6rem 1.5rem 4rem",
          textAlign: "center",
          overflow: "hidden",
        }}
      >
        {/* Wall layer */}
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
          {wall.map((item, i) => (
            <SponsorChip key={i} item={item} />
          ))}
        </div>
        {/* Vignette to keep headline crisp */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            background:
              "radial-gradient(ellipse 60% 50% at 50% 45%, rgba(5,5,8,0.92) 0%, rgba(5,5,8,0.6) 45%, transparent 75%)",
          }}
        />

        {/* Hero content */}
        <div
          style={{
            position: "relative",
            zIndex: 2,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
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
              fontWeight: 500,
              color: T.emeraldBright,
              marginBottom: "2rem",
              animation: "heroIn 0.7s ease both",
            }}
          >
            <span
              data-anim
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: T.emeraldBright,
                animation: "pulseDot 2s infinite",
              }}
            />
            Powered by real Home Office data · Updated daily
          </div>

          <h1
            style={{
              fontSize: "clamp(2.6rem, 6vw, 5.2rem)",
              fontWeight: 900,
              lineHeight: 1.05,
              letterSpacing: "-0.04em",
              marginBottom: "1.4rem",
              maxWidth: "16ch",
              animation: "heroIn 0.7s ease 0.1s both",
            }}
          >
            Every UK sponsor.
            <br />
            <span
              style={{
                background: T.emGoldGrad,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Verified for you.
            </span>
          </h1>

          <p
            style={{
              fontSize: "clamp(1rem,1.6vw,1.15rem)",
              color: T.textMid,
              maxWidth: "540px",
              lineHeight: 1.75,
              marginBottom: "2.5rem",
              animation: "heroIn 0.7s ease 0.2s both",
            }}
          >
            The career platform for international students. Arivo finds
            visa-sponsored jobs, reads your CV like a recruiter, and coaches you
            for UK interviews — all checked against official government data.
          </p>

          <div
            style={{
              display: "flex",
              gap: "12px",
              flexWrap: "wrap",
              justifyContent: "center",
              animation: "heroIn 0.7s ease 0.3s both",
            }}
          >
            <button onClick={onGetStarted} style={btnPrimaryLg}>
              Get Started — It's Free →
            </button>
            <button onClick={onGetStarted} style={btnGhostLg}>
              Sign In
            </button>
          </div>
        </div>

        {/* Scroll cue */}
        <div
          style={{
            position: "absolute",
            bottom: "28px",
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 2,
            fontSize: "11px",
            color: T.textLo,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
          }}
        >
          Scroll to explore
        </div>
      </section>

      {/* Stats band */}
      <Reveal>
        <div
          style={{
            position: "relative",
            zIndex: 2,
            display: "flex",
            gap: "clamp(1.5rem,5vw,4.5rem)",
            flexWrap: "wrap",
            justifyContent: "center",
            padding: "3rem 1.5rem",
            borderTop: "1px solid rgba(255,255,255,0.04)",
            borderBottom: "1px solid rgba(255,255,255,0.04)",
          }}
        >
          {[
            ["120,000+", "Verified Sponsors"],
            ["Real-time", "Live Job Data"],
            ["Every", "Field & Role"],
            ["100%", "Free Forever"],
          ].map(([num, lbl], i) => (
            <div key={i} style={{ textAlign: "center" }}>
              <div
                style={{
                  fontSize: "clamp(1.5rem,2.5vw,2rem)",
                  fontWeight: 800,
                  background: "linear-gradient(135deg,#7c6fef,#e879f9)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                {num}
              </div>
              <div
                style={{
                  fontSize: "11px",
                  color: T.textLo,
                  marginTop: 4,
                  fontWeight: 500,
                  letterSpacing: "0.04em",
                }}
              >
                {lbl}
              </div>
            </div>
          ))}
        </div>
      </Reveal>

      {/* Feature story — alternating rows */}
      <section
        style={{
          position: "relative",
          zIndex: 2,
          maxWidth: "1080px",
          margin: "0 auto",
          padding: "5rem 1.5rem 2rem",
        }}
      >
        <Reveal>
          <div style={{ textAlign: "center", marginBottom: "4rem" }}>
            <h2
              style={{
                fontSize: "clamp(1.9rem,3.5vw,2.7rem)",
                fontWeight: 800,
                letterSpacing: "-0.03em",
                marginBottom: "1rem",
              }}
            >
              Everything to{" "}
              <span
                style={{
                  background: T.emGoldGrad,
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                land your placement
              </span>
            </h2>
            <p
              style={{
                color: T.textMid,
                fontSize: "14px",
                maxWidth: "460px",
                margin: "0 auto",
                lineHeight: 1.7,
              }}
            >
              Built for every student in every field — not just tech. Any role,
              any background.
            </p>
          </div>
        </Reveal>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "clamp(3rem,6vw,5.5rem)",
          }}
        >
          {features.map((f, i) => {
            const Visual = mockVisuals[f.visual];
            const flip = i % 2 === 1;
            return (
              <Reveal key={i} y={40}>
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    alignItems: "center",
                    gap: "clamp(2rem,5vw,4rem)",
                    flexDirection: flip ? "row-reverse" : "row",
                  }}
                >
                  <div
                    style={{
                      flex: "1 1 320px",
                      display: "flex",
                      justifyContent: "center",
                    }}
                  >
                    <Visual />
                  </div>
                  <div style={{ flex: "1 1 320px" }}>
                    <div
                      style={{
                        fontSize: "12px",
                        fontWeight: 700,
                        letterSpacing: "0.1em",
                        textTransform: "uppercase",
                        color: T.emeraldBright,
                        marginBottom: "12px",
                      }}
                    >
                      {f.eyebrow}
                    </div>
                    <h3
                      style={{
                        fontSize: "clamp(1.4rem,2.4vw,1.9rem)",
                        fontWeight: 800,
                        letterSpacing: "-0.02em",
                        lineHeight: 1.2,
                        marginBottom: "14px",
                      }}
                    >
                      {f.title}
                    </h3>
                    <p
                      style={{
                        fontSize: "14.5px",
                        color: T.textMid,
                        lineHeight: 1.75,
                      }}
                    >
                      {f.desc}
                    </p>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>
      </section>

      {/* Final cinematic CTA */}
      <section
        style={{
          position: "relative",
          zIndex: 2,
          padding: "5rem 1.5rem 6rem",
          textAlign: "center",
        }}
      >
        <Reveal>
          <div
            style={{
              maxWidth: "680px",
              margin: "0 auto",
              padding: "clamp(2.5rem,5vw,4.5rem) 2rem",
              background:
                "linear-gradient(135deg, rgba(124,111,239,0.12), rgba(232,121,249,0.05), rgba(0,0,0,0))",
              border: "1px solid rgba(124,111,239,0.25)",
              borderRadius: "28px",
              boxShadow: "0 0 90px rgba(124,111,239,0.12)",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                fontSize: "11px",
                color: T.gold,
                fontWeight: 700,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                marginBottom: "1rem",
              }}
            >
              Start today
            </div>
            <h2
              style={{
                fontSize: "clamp(1.7rem,3.2vw,2.4rem)",
                fontWeight: 800,
                marginBottom: "1rem",
                letterSpacing: "-0.03em",
                lineHeight: 1.18,
              }}
            >
              Ready to find your place
              <br />
              in the UK job market?
            </h2>
            <p
              style={{
                color: T.textMid,
                marginBottom: "2.5rem",
                fontSize: "14.5px",
                lineHeight: 1.75,
                maxWidth: "440px",
                marginLeft: "auto",
                marginRight: "auto",
              }}
            >
              Join students using Arivo to navigate visa sponsorship, skill
              gaps, and UK interviews — for free.
            </p>
            <div
              style={{
                display: "flex",
                gap: "10px",
                justifyContent: "center",
                flexWrap: "wrap",
              }}
            >
              <button onClick={onGetStarted} style={btnPrimaryLg}>
                Start For Free →
              </button>
              <button onClick={onGetStarted} style={btnGhostLg}>
                Sign In
              </button>
            </div>
          </div>
        </Reveal>
      </section>

      {/* Footer */}
      <footer
        style={{
          position: "relative",
          zIndex: 2,
          borderTop: "1px solid rgba(255,255,255,0.05)",
          padding: "4rem 0 2rem",
        }}
      >
        <div
          style={{
            maxWidth: "1080px",
            margin: "0 auto",
            padding: "0 clamp(1.2rem,4vw,3rem)",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))",
              gap: "2.5rem",
              marginBottom: "3rem",
            }}
          >
            <div>
              <div
                style={{
                  fontSize: "18px",
                  fontWeight: 800,
                  background: T.brandGrad,
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
                  color: T.textLo,
                  lineHeight: 1.7,
                  maxWidth: "220px",
                  marginBottom: "16px",
                }}
              >
                The AI career platform for international students navigating the
                UK job market.
              </p>
              <a
                href="https://github.com/Akshar246/arivo-ai"
                target="_blank"
                rel="noreferrer"
                style={{
                  fontSize: "12px",
                  color: T.textLo,
                  textDecoration: "none",
                  padding: "5px 12px",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: "6px",
                }}
              >
                GitHub →
              </a>
            </div>
            <div>
              <div style={footHead}>PRODUCT</div>
              {[
                "Job Search",
                "ATS Readiness",
                "Interview Coach",
                "Skill Gap",
              ].map((x, i) => (
                <div key={i} onClick={onGetStarted} style={footLink}>
                  {x}
                </div>
              ))}
            </div>
            <div>
              <div style={footHead}>FOR STUDENTS</div>
              {[
                "International Students",
                "UK Graduates",
                "Placement Year",
                "Any Field",
              ].map((x, i) => (
                <div key={i} style={{ ...footLink, cursor: "default" }}>
                  {x}
                </div>
              ))}
            </div>
            <div>
              <div style={footHead}>DATA SOURCES</div>
              {[
                ["UK Home Office", "Sponsor Register"],
                ["Adzuna API", "Live Listings"],
                ["Groq LLaMA 3.3", "AI Inference"],
                ["HuggingFace", "Embeddings"],
              ].map(([a, b], i) => (
                <div key={i} style={{ marginBottom: "10px" }}>
                  <div
                    style={{
                      fontSize: "12px",
                      color: T.textLo,
                      fontWeight: 500,
                    }}
                  >
                    {a}
                  </div>
                  <div style={{ fontSize: "11px", color: T.textFaint }}>
                    {b}
                  </div>
                </div>
              ))}
            </div>
          </div>
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
            <span style={{ fontSize: "12px", color: T.textFaint }}>
              © {new Date().getFullYear()} Arivo AI · Built by an international
              student, for every student
            </span>
            <div style={{ display: "flex", gap: "20px" }}>
              {["Privacy", "Terms", "GitHub"].map((x, i) => (
                <span
                  key={i}
                  style={{
                    fontSize: "12px",
                    color: T.textFaint,
                    cursor: "pointer",
                  }}
                >
                  {x}
                </span>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

// ── Button + footer styles ───────────────────────────────────
const btnGhost = {
  padding: "8px 18px",
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: "8px",
  color: T.textMid,
  cursor: "pointer",
  fontSize: "13px",
  fontFamily: "inherit",
};
const btnPrimarySm = {
  padding: "8px 18px",
  background: T.brandGrad,
  border: "none",
  borderRadius: "8px",
  color: "white",
  cursor: "pointer",
  fontSize: "13px",
  fontWeight: 700,
  fontFamily: "inherit",
  boxShadow: "0 0 20px rgba(124,111,239,0.35)",
};
const btnPrimaryLg = {
  padding: "14px 34px",
  background: T.brandGrad,
  border: "none",
  borderRadius: "12px",
  color: "white",
  fontSize: "15px",
  fontWeight: 700,
  cursor: "pointer",
  fontFamily: "inherit",
  boxShadow: "0 10px 34px rgba(124,111,239,0.4)",
};
const btnGhostLg = {
  padding: "14px 30px",
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: "12px",
  color: T.textMid,
  fontSize: "15px",
  cursor: "pointer",
  fontFamily: "inherit",
};
const footHead = {
  fontSize: "12px",
  fontWeight: 600,
  color: T.textHi,
  marginBottom: "16px",
  letterSpacing: "0.05em",
};
const footLink = {
  fontSize: "13px",
  color: T.textLo,
  marginBottom: "10px",
  cursor: "pointer",
};

export default Landing;
