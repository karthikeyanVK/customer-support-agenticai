"use client";

// Main chat window — holds message state, calls the API, streams tokens into the UI.

import { useState, useRef, useEffect } from "react";
import ChatMessage from "./ChatMessage";
import ChatInput from "./ChatInput";
import { Message } from "@/types/chat";

const WELCOME: Message = {
  role: "assistant",
  content:
    "Hi! I'm your customer support assistant. I can help you with orders, refunds, and support tickets.\n\nTry asking:\n- *Where is my order?*\n- *Show my recent orders*\n- *Can I cancel order #5?*\n- *Do I have any refund requests?*\n- *Show my open support tickets*",
};

export default function ChatWindow() {
  const [messages, setMessages] = useState<Message[]>([WELCOME]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to the latest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend(text: string) {
    const userMessage: Message = { role: "user", content: text };
    const updatedMessages = [...messages, userMessage];

    setMessages(updatedMessages);
    setInput("");
    setLoading(true);

    // Add an empty assistant message that we'll stream into
    const assistantMessage: Message = { role: "assistant", content: "" };
    setMessages([...updatedMessages, assistantMessage]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Only send the conversation history (exclude the welcome message)
        body: JSON.stringify({ messages: updatedMessages.slice(1) }),
      });

      if (!res.body) throw new Error("No response body");

      // Read the streamed response token-by-token
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        accumulated += decoder.decode(value, { stream: true });

        // Update the last message (assistant) with accumulated text
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            role: "assistant",
            content: accumulated,
          };
          return updated;
        });
      }
    } catch (err) {
      console.error(err);
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: "assistant",
          content: "Sorry, I ran into an error. Please try again.",
        };
        return updated;
      });
    } finally {
      setLoading(false);
    }
  }

  function handleClear() {
    setMessages([WELCOME]);
    setInput("");
  }

  return (
    <div className="flex flex-col w-full max-w-2xl h-[90vh] bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 bg-white">
        <div>
          <h1 className="text-base font-semibold text-gray-900">Customer Support</h1>
          <p className="text-xs text-gray-500">AI-powered • Workshop 1</p>
        </div>
        <button
          onClick={handleClear}
          className="text-xs text-gray-500 hover:text-gray-800 border border-gray-300 rounded-lg px-3 py-1.5 transition hover:bg-gray-50"
        >
          Clear Chat
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-1">
        {messages.map((msg, i) => (
          <ChatMessage key={i} message={msg} />
        ))}

        {/* Typing indicator — shown while loading and the assistant message is empty */}
        {loading && messages[messages.length - 1]?.content === "" && (
          <div className="flex justify-start mb-4">
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold mr-3 flex-shrink-0">
              AI
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
              <span className="flex gap-1 items-center h-4">
                <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce [animation-delay:0ms]" />
                <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce [animation-delay:150ms]" />
                <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce [animation-delay:300ms]" />
              </span>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <ChatInput
        value={input}
        onChange={setInput}
        onSend={handleSend}
        disabled={loading}
      />
    </div>
  );
}
