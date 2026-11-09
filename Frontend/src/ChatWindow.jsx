import "./ChatWindow.css";
import Chat from "./Chat";
import { MyContext } from "./MyContext";
import { useContext, useState } from "react";
import { ScaleLoader } from "react-spinners";


function ChatWindow() {
  const {
    prompt,
    setPrompt,
    currThreadId,
    setPrevChats,
    setNewChat,
  } = useContext(MyContext);

  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const question = prompt.trim();

    if (!question || loading) return;

    setPrompt("");
    setNewChat(false);
    setLoading(true);

    // Show user message and an empty assistant message immediately
    setPrevChats((prev) => [
      ...prev,
      { role: "user", content: question },
      { role: "assistant", content: "" },
    ]);

    try {
      const response = await fetch(
        "http://localhost:8080/api/chat",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: question,
            threadID: currThreadId,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || `Request failed: ${response.status}`
        );
      }

      if (!response.body) {
        throw new Error("Response stream is unavailable.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { value, done } = await reader.read();

        if (done) break;

        const chunk = decoder.decode(value, { stream: true });

        if (chunk) {
          setPrevChats((prev) => {
            const updated = [...prev];
            const lastIndex = updated.length - 1;

            updated[lastIndex] = {
              ...updated[lastIndex],
              content: updated[lastIndex].content + chunk,
            };

            return updated;
          });
        }
      }

      // Process any remaining decoded text
      const remaining = decoder.decode();

      if (remaining) {
        setPrevChats((prev) => {
          const updated = [...prev];
          const lastIndex = updated.length - 1;

          updated[lastIndex] = {
            ...updated[lastIndex],
            content: updated[lastIndex].content + remaining,
          };

          return updated;
        });
      }

    } catch (error) {
      console.error("Chat error:", error);

      setPrevChats((prev) => {
        const updated = [...prev];
        const lastIndex = updated.length - 1;

        updated[lastIndex] = {
          ...updated[lastIndex],
          content: updated[lastIndex].content ||
            `Unable to get a response: ${error.message}`,
        };

        return updated;
      });

    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="chatWindow">

      <div className="navbar">
        <span>
          SigmaGpt <span className="arrow">⌄</span>
        </span>

        <div
          className="userIconDiv"
          onClick={() => setIsOpen(!isOpen)}
        >
          <span className="userIcon">
            <i className="fa-solid fa-user"></i>
          </span>
        </div>
      </div>

      {isOpen && (
        <div className="dropDown">
          <div className="dropDownItem">Upgrade plan</div>
          <div className="dropDownItem">Settings</div>
          <div className="dropDownItem">Logout</div>
        </div>
      )}

      <Chat isGenerating={loading} />

      <ScaleLoader
        color="#36d7b7"
        loading={loading}
        cssOverride={{
          display: "block",
          margin: "0 auto",
        }}
      />

      <div className="chatInput">
        <form className="inputbox" onSubmit={handleSubmit}>

          <input
            className="input"
            type="text"
            placeholder="Ask Anything..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            disabled={loading}
          />

          <button
            id="submit"
            type="submit"
            disabled={!prompt.trim() || loading}
            aria-label="Send message"
          >
            <i className="fa-solid fa-paper-plane"></i>
          </button>

        </form>

        <p className="info">
          SigmaGpt is an AI-powered chatbot. Responses may not
          always be accurate, so verify important information.
        </p>
      </div>

    </div>
  );
}

export default ChatWindow;