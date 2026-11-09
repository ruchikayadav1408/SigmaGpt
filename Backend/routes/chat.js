
import express from "express";
import Thread from "../models/Thread.js";
import getopenaiResponse from "../utils/openai.js";

const router = express.Router();

// Get all threads
router.get("/threads", async (req, res) => {
  try {
    const threads = await Thread.find({})
      .sort({ updatedAt: -1 });

    res.json(
      threads.map((thread) => ({
        threadID: thread.threadId,
        title: thread.title,
      }))
    );
  } catch (err) {
    console.error("Fetch threads error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// Get messages for a thread
router.get("/chats/:threadID", async (req, res) => {
  try {
    const thread = await Thread.findOne({
      threadId: req.params.threadID,
    });

    if (!thread) {
      return res.status(404).json({
        error: "Thread not found",
      });
    }

    res.json(thread.messages);
  } catch (err) {
    console.error("Fetch chat error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// Delete a thread
router.delete("/threads/:threadID", async (req, res) => {
  try {
    const deletedThread = await Thread.findOneAndDelete({
      threadId: req.params.threadID,
    });

    if (!deletedThread) {
      return res.status(404).json({
        error: "Thread not found",
      });
    }

    res.json({
      message: "Thread deleted successfully",
    });
  } catch (err) {
    console.error("Delete thread error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// Send message

router.post("/chat", async (req, res) => {
  const { threadID, message } = req.body;

  if (
    typeof threadID !== "string" ||
    !threadID.trim() ||
    typeof message !== "string" ||
    !message.trim()
  ) {
    return res.status(400).json({
      error: "threadID and message are required.",
    });
  }

  try {
    let thread = await Thread.findOne({
      threadId: threadID.trim(),
    });

    const isNewThread = !thread;

    if (!thread) {
      thread = new Thread({
        threadId: threadID.trim(),
        title: message.trim().slice(0, 60),
        messages: [],
      });
    }

    // Prepare streaming response
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("X-Accel-Buffering", "no");

    res.flushHeaders();

    // Get response chunks from Groq
    const assistantReply = await getopenaiResponse(
      message,
      (token) => {
        res.write(token);
      }
    );

    // Save conversation in MongoDB
    thread.messages.push(
      {
        role: "user",
        content: message.trim(),
      },
      {
        role: "assistant",
        content: assistantReply,
      }
    );

    thread.updatedAt = new Date();

    await thread.save();

    res.end();

  } catch (err) {
    console.error("Streaming chat error:", err.message);

    if (!res.headersSent) {
      return res.status(500).json({
        error: err.message || "Failed to process chat.",
      });
    }

    res.end();
  }
});

// Test endpoint
router.post("/test", async (req, res) => {
  try {
    const thread = await Thread.create({
      threadId: `test-${Date.now()}`,
      title: "Sample Thread",
    });

    res.status(201).json({
      message: "Thread created successfully",
      thread,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
