import "./Sidebar.css";
import { useContext, useEffect } from "react";
import { MyContext } from "./MyContext";
import { v1 as uuidv1 } from "uuid";
function Sidebar() {
  const {
    allThreads,
    setAllThreads,
    currThreadId,
    setNewChat,
    setPrompt,
    setReply,
    setCurrThreadId,
    setPrevChats,
  } = useContext(MyContext);

  const getAllThreads = async () => {
    try {
      const response = await fetch("http://localhost:8080/api/threads");
      const res = await response.json();
      const filteredData = res.map((thread) => ({
        threadID: thread.threadID,
        title: thread.title,
      }));
      setAllThreads(filteredData);
      console.log("All threads:", res);
    } catch (error) {
      console.error("Error fetching all threads:", error);
    }
  };

  useEffect(() => {
    getAllThreads();
  }, [currThreadId]);

  const createNewChat = () => {
    setNewChat(true);
    setPrompt("");
    setReply(null);
    setPrevChats([]);
    setCurrThreadId(uuidv1());
  };

  
const changeThread = async (newThreadID) => {
  setCurrThreadId(newThreadID);
  setNewChat(false);
  setPrompt("");
  setReply(null);

  try {
    const response = await fetch(
      `http://localhost:8080/api/chats/${newThreadID}`
    );

    if (!response.ok) {
      throw new Error("Unable to load previous chats");
    }

    const res = await response.json();

    setPrevChats(res);
    console.log("Previous chats:", res);

  } catch (error) {
    console.error("Error fetching previous chats:", error);
  }
};


  const deleteThread = async (threadID) => {
    try {
      const response = await fetch(
        `http://localhost:8080/api/threads/${threadID}`,
        {
          method: "DELETE",
        });
      const res = await response.json();
      console.log("Thread deleted:", res);
      // Update the list of threads after deletion
      setAllThreads(prev=> prev.filter((thread) => thread.threadID !== threadID));
      if(threadID === currThreadId) {
        createNewChat();
      }

    
    }
    catch (error) {
      console.error("Error deleting thread:", error);
    }
  }



  return (
    <section className="sidebar">
      <div>
        <div className="sidebar-header">
          <img
            src="/src/assets/blacklogo.png"
            alt="SigmaGpt logo"
            className="logo"
          />
          <h2>SigmaGpt</h2>
        </div>

        <button onClick={createNewChat} className="new-chat">
          <span>＋ New chat</span>
          <span>✎</span>
        </button>

        <h4 className="history-title">Recent</h4>

      <ul className="history">
  {allThreads?.map((thread) => (
    <li
      key={thread.threadID}
      onClick={() => changeThread(thread.threadID)}
      className={
        thread.threadID === currThreadId ? "highlighted" : ""
      }
    >
      <span className="thread-title">{thread.title}</span>

      <i
        className="fa-solid fa-trash"
        title="Delete chat"
        onClick={(e) => {
          e.stopPropagation();
          deleteThread(thread.threadID);
        }}
      ></i>
    </li>
  ))}
</ul>
      </div>

      <div className="sign">
        <p>Made by Ruchika</p>
      </div>
    </section>
  );
}

export default Sidebar;
