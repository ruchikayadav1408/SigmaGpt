import "./Chat.css";
import { useContext } from "react";
import { MyContext } from "./MyContext";
import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github-dark.css";

function Chat({ isGenerating })  {
  const { newChat, prevChats } = useContext(MyContext);

  return (
    <div className="chat">
      {newChat && (
        <div className="welcome">
          <h1>Welcome to SigmaGpt!</h1>
          <p>How can I help you today?</p>
        </div>
      )}

      <div className="chats">
        {prevChats?.map((chat, index) => {
  const isLastAssistant =
    chat.role === "assistant" &&
    index === prevChats.length - 1;

  return (
    <div
      className={chat.role === "user" ? "userDiv" : "gptDiv"}
      key={index}
    >
      {chat.role === "user" ? (
        <div>{chat.content}</div>
      ) : (
        <>
          <ReactMarkdown rehypePlugins={[rehypeHighlight]}>
            {chat.content}
          </ReactMarkdown>

          {isGenerating && isLastAssistant && (
            <span className="streaming-cursor"></span>
          )}
        </>
      )}
    </div>
  );
})}
        
      </div>
    </div>
  );
}

export default Chat;
