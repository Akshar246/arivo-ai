import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

// ─────────────────────────────────────────────
// CHAT COMPONENT — Arivo AI Career Coach
// Uses the user's ID as session_id so
// conversation history is unique per user
// Auto scrolls to latest message
// Handles loading state gracefully
// ─────────────────────────────────────────────
function Chat() {
  const { currentUser } = useAuth();

  const [messages, setMessages] = useState([
    {
      role: "arivo",
      text: `Hi ${currentUser?.name?.split(" ")[0] || "there"}! 👋 I am Arivo, your UK career coach. I can help you find visa sponsored jobs, prepare for interviews, and navigate the UK job market. What would you like to know?`,
    },
  ]);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  // Ref to scroll to bottom on new message
  const bottomRef = useRef(null);

  // Auto scroll to latest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ─────────────────────────────────────────────
  // SEND MESSAGE
  // Uses user ID as session_id — unique per user
  // Adds message instantly — response streams in
  // ─────────────────────────────────────────────
  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage = { role: "user", text: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const response = await axios.post("http://localhost:8000/chat", {
        message: input,
        // Use user ID as session — keeps memory per user
        session_id: currentUser?.id || "default",
      });

      setMessages((prev) => [
        ...prev,
        {
          role: "arivo",
          text: response.data.response,
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "arivo",
          text: "Sorry, I could not connect to the server. Please make sure the AI service is running.",
        },
      ]);
    }

    setLoading(false);
  };

  // Suggested questions for new users
  const suggestions = [
    "Which companies sponsor Tier 2 visas for ML engineers?",
    "How do I write a UK style cover letter?",
    "What is the STAR method for interviews?",
    "What skills do I need for a data science role?",
  ];

  return (
    <div
      style={{
        padding: "1.5rem",
        maxWidth: "800px",
        margin: "0 auto",
        height: "calc(100vh - 80px)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: "1rem" }}>
        <div
          style={{
            fontSize: "20px",
            fontWeight: "600",
            color: "#fff",
            marginBottom: "4px",
          }}
        >
          Career Coach 🧠
        </div>
        <div style={{ fontSize: "13px", color: "#888" }}>
          Powered by RAG — answers from real UK job data
        </div>
      </div>

      {/* Messages area */}
      <div
        style={{
          flex: 1,
          background: "#1a1a2e",
          borderRadius: "12px",
          border: "1px solid #333",
          padding: "16px",
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: "12px",
          marginBottom: "12px",
        }}
      >
        {messages.map((msg, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: msg.role === "user" ? "flex-end" : "flex-start",
              maxWidth: "85%",
              alignSelf: msg.role === "user" ? "flex-end" : "flex-start",
            }}
          >
            {/* Sender label */}
            <div
              style={{
                fontSize: "11px",
                fontWeight: "600",
                color: msg.role === "arivo" ? "#667eea" : "#764ba2",
                marginBottom: "4px",
                paddingLeft: "4px",
              }}
            >
              {msg.role === "arivo"
                ? "Arivo AI"
                : currentUser?.name?.split(" ")[0] || "You"}
            </div>

            {/* Message bubble */}
            <div
              style={{
                background: msg.role === "arivo" ? "#16213e" : "#2d1b4e",
                border: `1px solid ${msg.role === "arivo" ? "#667eea33" : "#764ba233"}`,
                borderRadius:
                  msg.role === "arivo"
                    ? "4px 12px 12px 12px"
                    : "12px 4px 12px 12px",
                padding: "10px 14px",
                fontSize: "13px",
                lineHeight: "1.7",
                color: "#ddd",
                whiteSpace: "pre-wrap",
              }}
            >
              {msg.text.replace(/\*\*(.*?)\*\*/g, "$1")}
            </div>
          </div>
        ))}

        {/* Loading indicator */}
        {loading && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start",
              maxWidth: "85%",
            }}
          >
            <div
              style={{
                fontSize: "11px",
                fontWeight: "600",
                color: "#667eea",
                marginBottom: "4px",
                paddingLeft: "4px",
              }}
            >
              Arivo AI
            </div>
            <div
              style={{
                background: "#16213e",
                border: "1px solid #667eea33",
                borderRadius: "4px 12px 12px 12px",
                padding: "10px 14px",
                fontSize: "13px",
                color: "#667eea",
              }}
            >
              Thinking...
            </div>
          </div>
        )}

        {/* Scroll anchor */}
        <div ref={bottomRef} />
      </div>

      {/* Suggestions — shown only when 1 message */}
      {messages.length === 1 && (
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "8px",
            marginBottom: "12px",
          }}
        >
          {suggestions.map((s, i) => (
            <button
              key={i}
              onClick={() => setInput(s)}
              style={{
                padding: "6px 12px",
                background: "transparent",
                border: "1px solid #333",
                borderRadius: "999px",
                color: "#888",
                cursor: "pointer",
                fontSize: "11px",
                textAlign: "left",
              }}
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input area */}
      <div style={{ display: "flex", gap: "10px" }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
          placeholder="Ask Arivo about jobs, visas, interviews..."
          disabled={loading}
          style={{
            flex: 1,
            padding: "12px 16px",
            background: "#1a1a2e",
            border: "1px solid #333",
            borderRadius: "8px",
            color: "#fff",
            fontSize: "14px",
            outline: "none",
            opacity: loading ? 0.7 : 1,
          }}
        />
        <button
          onClick={sendMessage}
          disabled={loading || !input.trim()}
          style={{
            padding: "12px 24px",
            background: input.trim()
              ? "linear-gradient(135deg, #667eea, #764ba2)"
              : "#333",
            border: "none",
            borderRadius: "8px",
            color: "#fff",
            fontWeight: "600",
            cursor: input.trim() ? "pointer" : "not-allowed",
            fontSize: "14px",
          }}
        >
          Send
        </button>
      </div>
    </div>
  );
}

export default Chat;
