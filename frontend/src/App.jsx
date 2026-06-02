import { useState } from "react";
import Chat from "./components/Chat";
import SkillGap from "./components/SkillGap";
import "./App.css";

function App() {
  // Controls which tab is active — chat or skillgap
  const [activeTab, setActiveTab] = useState("chat");

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <h1>Arivo AI</h1>
        <p>Your AI career coach for the UK job market</p>
      </header>

      {/* Tab buttons */}
      <div className="tabs">
        <button
          className={activeTab === "chat" ? "tab active" : "tab"}
          onClick={() => setActiveTab("chat")}
        >
          Career Coach
        </button>
        <button
          className={activeTab === "skillgap" ? "tab active" : "tab"}
          onClick={() => setActiveTab("skillgap")}
        >
          Skill Gap Analyser
        </button>
      </div>

      {/* Show component based on active tab */}
      <main className="main">
        {activeTab === "chat" ? <Chat /> : <SkillGap />}
      </main>
    </div>
  );
}

export default App;
