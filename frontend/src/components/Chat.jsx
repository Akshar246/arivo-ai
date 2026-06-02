import { useState } from "react";
import axios from "axios";

function Chat() {
  // Stores all messages in the conversation
  const [messages, setMessages] = useState([
    {
      role: "arivo",
      text: "Hi! I am Arivo, your UK career coach. How can I help you today?",
    },
  ]);

  // Stores what the user is currently typing
  const [input, setInput] = useState("");

  // Prevents sending multiple messages while waiting
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    // Do nothing if input is empty
    if (!input.trim()) return;

    // Add user message to chat immediately
    const userMessage = { role: "user", text: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      // Call your FastAPI backend
      const response = await axios.post("http://127.0.0.1:8000/chat", {
        message: input,
        session_id: "user-session",
      });

      // Add Arivo's response to chat
      const arivoMessage = {
        role: "arivo",
        text: response.data.response,
      };
      setMessages((prev) => [...prev, arivoMessage]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          role: "arivo",
          text: "Sorry, I could not connect to the server. Is your FastAPI running?",
        },
      ]);
    }

    setLoading(false);
  };

  return (
    <div className="chat-container">
      {/* Message history */}
      <div className="messages">
        {messages.map((msg, i) => (
          <div key={i} className={`message ${msg.role}`}>
            <span className="label">
              {msg.role === "arivo" ? "Arivo" : "You"}
            </span>
            <p>{msg.text}</p>
          </div>
        ))}
        {loading && (
          <div className="message arivo">
            <span className="label">Arivo</span>
            <p>Thinking...</p>
          </div>
        )}
      </div>

      {/* Input box */}
      <div className="input-row">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          placeholder="Ask Arivo anything about UK jobs..."
        />
        <button onClick={sendMessage} disabled={loading}>
          Send
        </button>
      </div>
    </div>
  );
}

export default Chat;
