"use client";

import React, { useCallback } from "react";

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  mode?: "markdown" | "html";
}

export default function MarkdownEditor({
  value,
  onChange,
  placeholder = "# Start typing your markdown here...\n\nSupports **bold**, *italic*, `code`, tables, and more!",
  mode = "markdown",
}: MarkdownEditorProps) {
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      onChange(e.target.value);
    },
    [onChange]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Tab") {
        e.preventDefault();
        const target = e.target as HTMLTextAreaElement;
        const start = target.selectionStart;
        const end = target.selectionEnd;

        const newValue =
          value.substring(0, start) + "  " + value.substring(end);
        onChange(newValue);

        requestAnimationFrame(() => {
          target.selectionStart = target.selectionEnd = start + 2;
        });
      }
    },
    [value, onChange]
  );

  return (
    <div className="h-full flex flex-col bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 overflow-hidden min-w-0">
      {/* Editor Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-neutral-50 dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700">
        <span className="text-sm font-medium text-neutral-600 dark:text-neutral-300">
          {mode === "html" ? "HTML" : "Markdown"}
        </span>
        <span className="text-xs text-neutral-400">{value.length} chars</span>
      </div>

      {/* Editor Area */}
      <div className="flex-1 relative">
        <textarea
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="editor-textarea w-full h-full resize-none bg-transparent border-none outline-none font-mono text-sm leading-relaxed p-4 text-neutral-800 dark:text-neutral-200 placeholder-neutral-400 dark:placeholder-neutral-500"
          spellCheck={false}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
        />
      </div>
    </div>
  );
}
