"use client";

// Renders a single chat message — user messages on the right, assistant on the left.
// Assistant messages support Markdown (tables, bold, bullet points).

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Message } from "@/types/chat";

interface Props {
  message: Message;
}

export default function ChatMessage({ message }: Props) {
  const isUser = message.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-4`}>
      {/* Assistant avatar */}
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold mr-3 flex-shrink-0 mt-1">
          AI
        </div>
      )}

      <div
        className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
          isUser
            ? "bg-blue-600 text-white rounded-tr-sm"
            : "bg-white border border-gray-200 text-gray-800 rounded-tl-sm shadow-sm"
        }`}
      >
        {isUser ? (
          // User messages: plain text, preserve newlines
          <span className="whitespace-pre-wrap">{message.content}</span>
        ) : (
          // Assistant messages: render Markdown
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              // Style markdown elements to fit the chat bubble
              p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
              ul: ({ children }) => <ul className="list-disc ml-4 mb-2">{children}</ul>,
              ol: ({ children }) => <ol className="list-decimal ml-4 mb-2">{children}</ol>,
              li: ({ children }) => <li className="mb-1">{children}</li>,
              strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
              table: ({ children }) => (
                <div className="overflow-x-auto my-2">
                  <table className="text-xs border-collapse border border-gray-300">{children}</table>
                </div>
              ),
              th: ({ children }) => (
                <th className="border border-gray-300 px-2 py-1 bg-gray-100 font-semibold">{children}</th>
              ),
              td: ({ children }) => (
                <td className="border border-gray-300 px-2 py-1">{children}</td>
              ),
              code: ({ children }) => (
                <code className="bg-gray-100 text-gray-800 px-1 rounded text-xs">{children}</code>
              ),
            }}
          >
            {message.content}
          </ReactMarkdown>
        )}
      </div>

      {/* User avatar */}
      {isUser && (
        <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-gray-700 text-sm font-bold ml-3 flex-shrink-0 mt-1">
          You
        </div>
      )}
    </div>
  );
}
