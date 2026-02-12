"use client";

import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import rehypeRaw from "rehype-raw";
import type { Components } from "react-markdown";

interface PreviewPaneProps {
  markdown: string;
  mode?: "markdown" | "html";
}

function sanitizeHtmlForPreview(html: string): string {
  let sanitized = html.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "");
  sanitized = sanitized.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "");
  sanitized = sanitized.replace(/\s+on\w+\s*=\s*["'][^"']*["']/gi, "");
  return sanitized;
}

const components: Components = {
  table: ({ children, ...props }) => (
    <div className="overflow-x-auto my-4">
      <table className="min-w-full border-collapse text-sm" {...props}>
        {children}
      </table>
    </div>
  ),
  thead: ({ children, ...props }) => (
    <thead className="bg-neutral-100 dark:bg-neutral-800" {...props}>
      {children}
    </thead>
  ),
  th: ({ children, ...props }) => (
    <th
      className="px-4 py-2 text-left font-semibold border border-neutral-300 dark:border-neutral-600"
      {...props}
    >
      {children}
    </th>
  ),
  td: ({ children, ...props }) => (
    <td
      className="px-4 py-2 border border-neutral-300 dark:border-neutral-600"
      {...props}
    >
      {children}
    </td>
  ),
  tr: ({ children, ...props }) => (
    <tr
      className="even:bg-neutral-50 dark:even:bg-neutral-900 hover:bg-neutral-100 dark:hover:bg-neutral-800"
      {...props}
    >
      {children}
    </tr>
  ),
  code: ({ children, className, ...props }) => {
    const isInline = !className;
    if (isInline) {
      return (
        <code
          className="bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5 text-sm font-mono text-pink-600 dark:text-pink-400"
          {...props}
        >
          {children}
        </code>
      );
    }
    return (
      <code className={className} {...props}>
        {children}
      </code>
    );
  },
  pre: ({ children, ...props }) => (
    <pre
      className="bg-neutral-900 dark:bg-neutral-950 text-neutral-100 p-4 overflow-x-auto my-4 text-sm"
      {...props}
    >
      {children}
    </pre>
  ),
  h1: ({ children, ...props }) => (
    <h1
      className="text-3xl font-bold mb-4 mt-6 pb-2 border-b border-neutral-200 dark:border-neutral-700"
      {...props}
    >
      {children}
    </h1>
  ),
  h2: ({ children, ...props }) => (
    <h2
      className="text-2xl font-semibold mb-3 mt-5 pb-1 border-b border-neutral-100 dark:border-neutral-800"
      {...props}
    >
      {children}
    </h2>
  ),
  h3: ({ children, ...props }) => (
    <h3 className="text-xl font-semibold mb-2 mt-4" {...props}>
      {children}
    </h3>
  ),
  h4: ({ children, ...props }) => (
    <h4 className="text-lg font-medium mb-2 mt-3" {...props}>
      {children}
    </h4>
  ),
  p: ({ children, ...props }) => (
    <p className="mb-4 leading-relaxed" {...props}>
      {children}
    </p>
  ),
  ul: ({ children, ...props }) => (
    <ul className="mb-4 pl-6 list-disc" {...props}>
      {children}
    </ul>
  ),
  ol: ({ children, ...props }) => (
    <ol className="mb-4 pl-6 list-decimal" {...props}>
      {children}
    </ol>
  ),
  li: ({ children, ...props }) => (
    <li className="mb-1" {...props}>
      {children}
    </li>
  ),
  blockquote: ({ children, ...props }) => (
    <blockquote
      className="border-l-4 border-neutral-300 dark:border-neutral-600 pl-4 py-1 my-4 italic text-neutral-600 dark:text-neutral-400"
      {...props}
    >
      {children}
    </blockquote>
  ),
  aside: ({ children, ...props }: React.ComponentPropsWithoutRef<"aside">) => (
    <aside
      className="my-4 p-4 bg-neutral-50 dark:bg-neutral-800 border-l-4 border-neutral-300 dark:border-neutral-600"
      {...props}
    >
      {children}
    </aside>
  ),
  a: ({ children, href, ...props }) => (
    <a
      href={href}
      className="text-neutral-900 dark:text-neutral-100 underline hover:no-underline"
      target="_blank"
      rel="noopener noreferrer"
      {...props}
    >
      {children}
    </a>
  ),
  img: ({ src, alt, ...props }) => {
    if (!src || (typeof src === "string" && src.trim() === "")) {
      return null;
    }
    return (
      <img
        src={typeof src === "string" ? src : ""}
        alt={alt || ""}
        className="max-w-full h-auto my-4"
        {...props}
      />
    );
  },
  hr: ({ ...props }) => (
    <hr className="my-6 border-neutral-200 dark:border-neutral-700" {...props} />
  ),
  input: ({ type, checked, ...props }) => {
    if (type === "checkbox") {
      return (
        <input
          type="checkbox"
          checked={checked}
          readOnly
          className="mr-2"
          {...props}
        />
      );
    }
    return <input type={type} {...props} />;
  },
};

export default function PreviewPane({
  markdown,
  mode = "markdown",
}: PreviewPaneProps) {
  const isEmpty = !markdown.trim();

  return (
    <div className="h-full flex flex-col bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 overflow-hidden min-w-0">
      {/* Preview Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-neutral-50 dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700">
        <span className="text-sm font-medium text-neutral-600 dark:text-neutral-300">
          Preview
        </span>
        <span className="text-xs text-neutral-400">
          {mode === "html" ? "HTML Mode" : "Markdown Mode"}
        </span>
      </div>

      {/* Preview Content */}
      <div className="flex-1 overflow-auto p-6 min-w-0">
        {isEmpty ? (
          <div className="h-full flex items-center justify-center text-neutral-400 dark:text-neutral-500">
            <div className="text-center">
              <svg
                className="w-16 h-16 mx-auto mb-4 opacity-50"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <p className="text-sm">Start typing to see the preview</p>
            </div>
          </div>
        ) : mode === "html" ? (
          <div className="html-preview-container">
            <div
              className="html-preview-content"
              dangerouslySetInnerHTML={{
                __html: sanitizeHtmlForPreview(markdown),
              }}
            />
          </div>
        ) : (
          <div className="markdown-preview prose prose-neutral dark:prose-invert max-w-none">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeHighlight, rehypeRaw]}
              components={components}
            >
              {markdown}
            </ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
}
