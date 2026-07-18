"use client";

import { useChat } from "ai/react";

const SUGGESTIONS = [
  "Show me all sci-fi movies",
  "Find users over 25",
  "Get movies with rating above 8.5",
  "Count total movies by genre",
  "Tell me about the movie Interstellar",
  "Tell me a programming joke",
];

export default function Page() {
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: "/api/chat",
    maxSteps: 5,
  });

  return (
    <div className="chat-shell">
      <div className="chat-header">
        <h1>AI SDK Exercise</h1>
        <p>Database chat · Movie lookup (OMDb) · Dad jokes — all via tool calling</p>
      </div>

      <div className="chat-log">
        {messages.length === 0 && (
          <div className="suggestions">
            {SUGGESTIONS.map((s) => (
              <button key={s} onClick={() => sendPromptFallback(s, handleSubmit, handleInputChange)}>
                {s}
              </button>
            ))}
          </div>
        )}

        {messages.map((m) => (
          <div key={m.id}>
            {m.parts?.map((part, i) => {
              if (part.type === "text") {
                return (
                  <div key={i} className={`msg ${m.role}`}>
                    {part.text}
                  </div>
                );
              }
              if (part.type === "tool-invocation") {
                const { toolName, state } = part.toolInvocation as any;
                return (
                  <div key={i} className="msg tool">
                    🔧 {toolName} {state === "result" ? "→ done" : "→ running..."}
                  </div>
                );
              }
              return null;
            })}
          </div>
        ))}

        {isLoading && <div className="msg assistant">Thinking…</div>}
      </div>

      <form className="chat-form" onSubmit={handleSubmit}>
        <input
          value={input}
          onChange={handleInputChange}
          placeholder="Ask about movies, users, or request a joke..."
        />
        <button type="submit" disabled={isLoading}>
          Send
        </button>
      </form>
    </div>
  );
}

// Small helper so suggestion chips can pre-fill and submit without extra wiring
function sendPromptFallback(
  text: string,
  handleSubmit: (e?: any) => void,
  handleInputChange: (e: any) => void
) {
  handleInputChange({ target: { value: text } } as any);
  setTimeout(() => handleSubmit(), 0);
}
