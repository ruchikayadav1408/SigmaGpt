import "dotenv/config";

const getopenaiResponse = async (message, onToken) => {
  if (!message || typeof message !== "string" || !message.trim()) {
    throw new Error("Please provide a valid message.");
  }

  if (!process.env.GROQ_API_KEY) {
    throw new Error("GROQ_API_KEY is missing from the .env file.");
  }

  const response = await fetch(
    "https://api.groq.com/openai/v1/chat/completions",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: "openai/gpt-oss-20b",
        messages: [
          {
            role: "user",
            content: message.trim(),
          },
        ],
        stream: true,
      }),
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(
      errorData.error?.message || "Groq API request failed."
    );
  }

  if (!response.body) {
    throw new Error("Groq did not return a response stream.");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  let buffer = "";
  let fullReply = "";

  const processLine = (line) => {
    const trimmedLine = line.trim();

    if (!trimmedLine.startsWith("data:")) return;

    const data = trimmedLine.slice(5).trim();

    if (!data || data === "[DONE]") return;

    try {
      const parsed = JSON.parse(data);
      const token = parsed.choices?.[0]?.delta?.content;

      if (typeof token === "string" && token.length > 0) {
        fullReply += token;
        onToken(token);
      }
    } catch (error) {
      console.error("Error parsing Groq stream:", error);
    }
  };

  try {
    while (true) {
      const { value, done } = await reader.read();

      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        processLine(line);
      }
    }

    buffer += decoder.decode();

    if (buffer.trim()) {
      processLine(buffer);
    }
  } finally {
    reader.releaseLock();
  }

  if (!fullReply.trim()) {
    throw new Error("Groq returned an empty response.");
  }

  return fullReply;
};

export default getopenaiResponse;