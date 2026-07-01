"use client";

// Chat input — Enter to send, Shift+Enter for new line, auto-resizes.

import { useRef, KeyboardEvent } from "react";

interface Props {
  onSend: (text: string) => void;
  disabled: boolean;
  value: string;
  onChange: (value: string) => void;
}

export default function ChatInput({ onSend, disabled, value, onChange }: Props) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  }

  function submit() {
    const text = value.trim();
    if (!text || disabled) return;
    onSend(text);
    // Reset height after send
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  }

  function handleInput() {
    // Auto-resize textarea
    const el = textareaRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
    }
  }

  return (
    <div className="flex items-end gap-2 border-t border-gray-200 bg-white px-4 py-3">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        onInput={handleInput}
        disabled={disabled}
        placeholder="Ask a customer support question… (Enter to send, Shift+Enter for new line)"
        rows={1}
        className="flex-1 resize-none rounded-xl border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50 transition"
      />
      <button
        onClick={submit}
        disabled={disabled || !value.trim()}
        className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
      >
        Send
      </button>
    </div>
  );
}
