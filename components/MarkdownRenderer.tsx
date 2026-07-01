"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

function CodeBlock({ children }: { children: React.ReactNode }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const text =
      typeof children === "string"
        ? children
        : (children as React.ReactElement)?.props?.children ?? "";
    navigator.clipboard.writeText(String(text)).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="relative group my-2">
      <button
        onClick={handleCopy}
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-700 hover:bg-gray-600 text-white text-xs px-2 py-1 rounded"
      >
        {copied ? "Copied!" : "Copy"}
      </button>
      <pre className="bg-gray-900 text-gray-100 rounded-lg px-4 py-3 overflow-x-auto text-xs">
        {children}
      </pre>
    </div>
  );
}

export default function MarkdownRenderer({ content }: { content: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        p: ({ children }) => <p className="mb-3 last:mb-0">{children}</p>,
        h1: ({ children }) => <h1 className="text-2xl font-bold mb-4 mt-6">{children}</h1>,
        h2: ({ children }) => <h2 className="text-xl font-semibold mb-3 mt-6">{children}</h2>,
        h3: ({ children }) => <h3 className="text-lg font-semibold mb-2 mt-4">{children}</h3>,
        ul: ({ children }) => <ul className="list-disc ml-5 mb-3">{children}</ul>,
        ol: ({ children }) => <ol className="list-decimal ml-5 mb-3">{children}</ol>,
        li: ({ children }) => <li className="mb-1">{children}</li>,
        strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
        blockquote: ({ children }) => (
          <blockquote className="border-l-4 border-blue-400 pl-4 italic text-gray-600 my-3">{children}</blockquote>
        ),
        hr: () => <hr className="my-6 border-gray-300" />,
        table: ({ children }) => (
          <div className="overflow-x-auto my-4">
            <table className="text-sm border-collapse border border-gray-300 w-full">{children}</table>
          </div>
        ),
        th: ({ children }) => (
          <th className="border border-gray-300 px-3 py-2 bg-gray-100 font-semibold text-left">{children}</th>
        ),
        td: ({ children }) => (
          <td className="border border-gray-300 px-3 py-2">{children}</td>
        ),
        pre: ({ children }) => <CodeBlock>{children}</CodeBlock>,
        code: ({ children }) => (
          <code className="bg-gray-100 text-gray-800 px-1 rounded text-xs font-mono">{children}</code>
        ),
        a: ({ href, children }) => (
          <a href={href} className="text-blue-600 underline hover:text-blue-800">{children}</a>
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  );
}
