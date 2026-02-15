"use client";

import React, { useCallback, useRef, useState, useEffect } from "react";
import { createPortal } from "react-dom";

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  mode?: "markdown" | "html";
}

interface FormatAction {
  label: string;
  icon: React.ReactNode;
  type: "wrap" | "prefix";
  before: string;
  after?: string;
  shortcut?: string;
}

const FORMATS: FormatAction[] = [
  {
    label: "Bold",
    type: "wrap",
    before: "**",
    after: "**",
    shortcut: "B",
    icon: <span className="font-extrabold">B</span>,
  },
  {
    label: "Italic",
    type: "wrap",
    before: "*",
    after: "*",
    shortcut: "I",
    icon: <span className="font-semibold italic">I</span>,
  },
  {
    label: "Strikethrough",
    type: "wrap",
    before: "~~",
    after: "~~",
    icon: <span className="font-semibold line-through">S</span>,
  },
  { label: "divider", type: "wrap", before: "", icon: null },
  {
    label: "Inline Code",
    type: "wrap",
    before: "`",
    after: "`",
    icon: (
      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <polyline points="16 18 22 12 16 6" />
        <polyline points="8 6 2 12 8 18" />
      </svg>
    ),
  },
  {
    label: "Code Block",
    type: "wrap",
    before: "```\n",
    after: "\n```",
    icon: (
      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <polyline points="9 8 5 12 9 16" />
        <polyline points="15 8 19 12 15 16" />
      </svg>
    ),
  },
  { label: "divider", type: "wrap", before: "", icon: null },
  {
    label: "H1",
    type: "prefix",
    before: "# ",
    icon: <span className="text-[10px] font-bold">H1</span>,
  },
  {
    label: "H2",
    type: "prefix",
    before: "## ",
    icon: <span className="text-[10px] font-bold">H2</span>,
  },
  {
    label: "H3",
    type: "prefix",
    before: "### ",
    icon: <span className="text-[10px] font-bold">H3</span>,
  },
  { label: "divider", type: "wrap", before: "", icon: null },
  {
    label: "Bullet List",
    type: "prefix",
    before: "- ",
    icon: (
      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <line x1="9" y1="6" x2="20" y2="6" />
        <line x1="9" y1="12" x2="20" y2="12" />
        <line x1="9" y1="18" x2="20" y2="18" />
        <circle cx="5" cy="6" r="1.5" fill="currentColor" stroke="none" />
        <circle cx="5" cy="12" r="1.5" fill="currentColor" stroke="none" />
        <circle cx="5" cy="18" r="1.5" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  {
    label: "Numbered List",
    type: "prefix",
    before: "1. ",
    icon: (
      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <line x1="11" y1="6" x2="20" y2="6" />
        <line x1="11" y1="12" x2="20" y2="12" />
        <line x1="11" y1="18" x2="20" y2="18" />
        <text x="3" y="9" fontSize="9" fill="currentColor" stroke="none" fontWeight="bold" fontFamily="monospace">1</text>
        <text x="3" y="15" fontSize="9" fill="currentColor" stroke="none" fontWeight="bold" fontFamily="monospace">2</text>
        <text x="3" y="21" fontSize="9" fill="currentColor" stroke="none" fontWeight="bold" fontFamily="monospace">3</text>
      </svg>
    ),
  },
  {
    label: "Task List",
    type: "prefix",
    before: "- [ ] ",
    icon: (
      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <line x1="14" y1="6.5" x2="21" y2="6.5" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <path d="M5 17.5l1.5 1.5L9 15.5" strokeWidth="1.5" />
        <line x1="14" y1="17.5" x2="21" y2="17.5" />
      </svg>
    ),
  },
  { label: "divider", type: "wrap", before: "", icon: null },
  {
    label: "Blockquote",
    type: "prefix",
    before: "> ",
    icon: (
      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M4.583 17.321C3.553 16.227 3 15 3 13.011c0-3.5 2.457-6.637 6.03-8.188l.893 1.378c-3.335 1.804-3.987 4.145-4.247 5.621.537-.278 1.24-.375 1.929-.311 1.804.167 3.226 1.648 3.226 3.489a3.5 3.5 0 01-3.5 3.5c-1.073 0-2.099-.49-2.748-1.179zm10 0C13.553 16.227 13 15 13 13.011c0-3.5 2.457-6.637 6.03-8.188l.893 1.378c-3.335 1.804-3.987 4.145-4.247 5.621.537-.278 1.24-.375 1.929-.311 1.804.167 3.226 1.648 3.226 3.489a3.5 3.5 0 01-3.5 3.5c-1.073 0-2.099-.49-2.748-1.179z" />
      </svg>
    ),
  },
  {
    label: "Link",
    type: "wrap",
    before: "[",
    after: "](url)",
    icon: (
      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
        <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
      </svg>
    ),
  },
];

/**
 * Get the pixel coordinates of a caret position inside a textarea.
 * Uses a hidden mirror div that replicates the textarea's text layout.
 */
function getCaretCoordinates(
  textarea: HTMLTextAreaElement,
  position: number,
): { top: number; left: number } {
  const mirror = document.createElement("div");
  const computed = getComputedStyle(textarea);

  // Copy all relevant styles
  const props = [
    "fontFamily",
    "fontSize",
    "fontWeight",
    "fontStyle",
    "letterSpacing",
    "textTransform",
    "wordSpacing",
    "textIndent",
    "whiteSpace",
    "wordWrap",
    "overflowWrap",
    "tabSize",
    "MozTabSize",
    "lineHeight",
    "paddingTop",
    "paddingRight",
    "paddingBottom",
    "paddingLeft",
    "borderTopWidth",
    "borderRightWidth",
    "borderBottomWidth",
    "borderLeftWidth",
    "boxSizing",
  ] as const;

  mirror.style.position = "absolute";
  mirror.style.top = "0";
  mirror.style.left = "-9999px";
  mirror.style.visibility = "hidden";
  mirror.style.overflow = "hidden";
  mirror.style.width = `${textarea.clientWidth}px`;
  mirror.style.height = "auto";
  mirror.style.whiteSpace = "pre-wrap";
  mirror.style.wordWrap = "break-word";

  for (const prop of props) {
    mirror.style.setProperty(
      prop.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`),
      computed.getPropertyValue(
        prop.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`),
      ),
    );
  }

  document.body.appendChild(mirror);

  const text = textarea.value.substring(0, position);
  const textNode = document.createTextNode(text);
  const marker = document.createElement("span");
  marker.textContent = "\u200b"; // zero-width space

  mirror.appendChild(textNode);
  mirror.appendChild(marker);

  const markerRect = marker.getBoundingClientRect();
  const mirrorRect = mirror.getBoundingClientRect();

  const coords = {
    top: markerRect.top - mirrorRect.top - textarea.scrollTop,
    left: markerRect.left - mirrorRect.left - textarea.scrollLeft,
  };

  document.body.removeChild(mirror);
  return coords;
}

export default function MarkdownEditor({
  value,
  onChange,
  placeholder = "# Start typing your markdown here...\n\nSupports **bold**, *italic*, `code`, tables, and more!",
  mode = "markdown",
}: MarkdownEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);
  const [selStart, setSelStart] = useState(0);
  const [selEnd, setSelEnd] = useState(0);
  const [toolbarStyle, setToolbarStyle] = useState<React.CSSProperties | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      onChange(e.target.value);
    },
    [onChange],
  );

  // Compute floating toolbar position based on selection
  const showToolbar = useCallback(() => {
    const ta = textareaRef.current;
    if (!ta || mode !== "markdown") {
      setToolbarStyle(null);
      return;
    }

    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    if (start === end) {
      setToolbarStyle(null);
      return;
    }

    setSelStart(start);
    setSelEnd(end);

    // Get caret pixel position within the textarea
    const coords = getCaretCoordinates(ta, start);
    const taRect = ta.getBoundingClientRect();

    // Position above the selection start
    let top = taRect.top + coords.top - 48;
    let left = taRect.left + coords.left;

    // Clamp: keep toolbar on screen
    const toolbarWidth = 420;
    left = Math.max(8, Math.min(left - toolbarWidth / 2 + 20, window.innerWidth - toolbarWidth - 8));
    top = Math.max(8, top);

    // If toolbar would overlap the textarea top, show below the line instead
    if (top < taRect.top) {
      top = taRect.top + coords.top + 24;
    }

    setToolbarStyle({
      position: "fixed",
      top,
      left,
      zIndex: 9999,
    });
  }, [mode]);

  const hideToolbar = useCallback(() => {
    setToolbarStyle(null);
  }, []);

  // Listen for selection
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;

    const onSelect = () => showToolbar();
    const onMouseUp = () => {
      // Small delay so selectionStart/End update
      requestAnimationFrame(() => showToolbar());
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.shiftKey || e.key === "Shift") showToolbar();
    };
    const onBlur = (e: FocusEvent) => {
      const related = e.relatedTarget as HTMLElement | null;
      if (related?.closest("[data-format-toolbar]")) return;
      hideToolbar();
    };
    const onScroll = () => {
      if (toolbarStyle) showToolbar();
    };

    ta.addEventListener("select", onSelect);
    ta.addEventListener("mouseup", onMouseUp);
    ta.addEventListener("keyup", onKeyUp);
    ta.addEventListener("blur", onBlur);
    ta.addEventListener("scroll", onScroll);

    return () => {
      ta.removeEventListener("select", onSelect);
      ta.removeEventListener("mouseup", onMouseUp);
      ta.removeEventListener("keyup", onKeyUp);
      ta.removeEventListener("blur", onBlur);
      ta.removeEventListener("scroll", onScroll);
    };
  }, [showToolbar, hideToolbar, toolbarStyle]);

  // Close toolbar on click outside
  useEffect(() => {
    if (!toolbarStyle) return;
    const onClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (
        !target.closest("[data-format-toolbar]") &&
        target !== textareaRef.current
      ) {
        hideToolbar();
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [toolbarStyle, hideToolbar]);

  /**
   * Insert text into the textarea using execCommand so that
   * the browser's native undo stack (Ctrl+Z) is preserved.
   */
  const insertText = useCallback(
    (
      ta: HTMLTextAreaElement,
      replacement: string,
      start: number,
      end: number,
    ) => {
      ta.focus();
      ta.setSelectionRange(start, end);
      // execCommand('insertText') is the only way to preserve undo in textareas
      document.execCommand("insertText", false, replacement);
      // React picks up the change via the input event automatically
    },
    [],
  );

  // Apply format
  const applyFormat = useCallback(
    (format: FormatAction) => {
      const ta = textareaRef.current;
      if (!ta) return;

      const selected = value.substring(selStart, selEnd);
      let replacement: string;
      let cursorStart: number;
      let cursorEnd: number;

      if (format.type === "wrap") {
        const before = format.before;
        const after = format.after ?? "";
        replacement = before + selected + after;
        cursorStart = selStart + before.length;
        cursorEnd = cursorStart + selected.length;
      } else {
        const lines = selected.split("\n");
        replacement = lines
          .map((line, i) => {
            if (format.before === "1. ") return `${i + 1}. ${line}`;
            return format.before + line;
          })
          .join("\n");
        cursorStart = selStart;
        cursorEnd = selStart + replacement.length;
      }

      insertText(ta, replacement, selStart, selEnd);
      hideToolbar();

      requestAnimationFrame(() => {
        ta.focus();
        ta.selectionStart = cursorStart;
        ta.selectionEnd = cursorEnd;
      });
    },
    [value, selStart, selEnd, hideToolbar, insertText],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Tab") {
        e.preventDefault();
        const target = e.target as HTMLTextAreaElement;
        const start = target.selectionStart;
        const end = target.selectionEnd;
        insertText(target, "  ", start, end);
        requestAnimationFrame(() => {
          target.selectionStart = target.selectionEnd = start + 2;
        });
        return;
      }

      if (e.key === "Escape") {
        hideToolbar();
        return;
      }

      // Ctrl/Cmd shortcuts
      if ((e.ctrlKey || e.metaKey) && toolbarStyle) {
        let format: FormatAction | undefined;
        if (e.key === "b") format = FORMATS.find((f) => f.label === "Bold");
        if (e.key === "i") format = FORMATS.find((f) => f.label === "Italic");
        if (format) {
          e.preventDefault();
          applyFormat(format);
        }
      }
    },
    [toolbarStyle, hideToolbar, applyFormat, insertText],
  );

  // Render toolbar via portal so it's not clipped by overflow
  const toolbar =
    toolbarStyle && mounted
      ? createPortal(
          <div
            ref={toolbarRef}
            data-format-toolbar
            style={toolbarStyle}
            className="format-toolbar"
          >
            <div
              className="flex items-center px-1 py-1 gap-0.5"
              style={{
                backgroundColor: "rgb(23, 23, 23)",
                borderRadius: "8px",
                boxShadow: "0 25px 50px -12px rgba(0,0,0,0.4)",
                border: "1px solid rgba(64,64,64,0.8)",
              }}
            >
              {FORMATS.map((format, i) => {
                if (format.label === "divider") {
                  return (
                    <div
                      key={`div-${i}`}
                      style={{ width: "1px", height: "20px", backgroundColor: "rgb(64,64,64)", margin: "0 2px", flexShrink: 0 }}
                    />
                  );
                }
                return (
                  <button
                    key={format.label}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      applyFormat(format);
                    }}
                    title={
                      format.shortcut
                        ? `${format.label} (Ctrl+${format.shortcut})`
                        : format.label
                    }
                    className="flex items-center justify-center w-7 h-7 rounded-md flex-shrink-0 transition-all text-xs"
                    style={{ color: "rgb(163,163,163)" }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = "white";
                      e.currentTarget.style.backgroundColor = "rgb(64,64,64)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = "rgb(163,163,163)";
                      e.currentTarget.style.backgroundColor = "transparent";
                    }}
                  >
                    {format.icon}
                  </button>
                );
              })}
            </div>
            {/* Arrow */}
            <div style={{ display: "flex", justifyContent: "center", pointerEvents: "none" }}>
              <div style={{
                width: "10px",
                height: "10px",
                backgroundColor: "rgb(23,23,23)",
                borderRight: "1px solid rgba(64,64,64,0.8)",
                borderBottom: "1px solid rgba(64,64,64,0.8)",
                transform: "rotate(45deg)",
                marginTop: "-6px",
                marginLeft: "16px",
              }} />
            </div>
          </div>,
          document.body,
        )
      : null;

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
          ref={textareaRef}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="editor-textarea w-full h-full resize-none bg-transparent border-none outline-none font-mono text-sm leading-relaxed p-4 text-neutral-800 dark:text-neutral-200 placeholder-neutral-400 dark:placeholder-neutral-500"
          spellCheck={false}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="none"
        />
      </div>

      {toolbar}
    </div>
  );
}
