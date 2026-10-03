"use client";

import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";
import { buildDocument } from "../lib/documentBuilder";
import { getMargins, getPageDimensionsMm, pageSizeLabels, type PDFOptions } from "../lib/pdfStyles";
import { useTheme } from "./ThemeProvider";

interface PreviewPaneProps {
  content: string;
  mode: "markdown" | "html";
  options: PDFOptions;
  documentTitle?: string;
}

export interface PreviewPaneHandle {
  /** Open the browser print dialog for the rendered document */
  print: () => void;
}

const MM_TO_PX = 96 / 25.4;
const ZOOM_STEPS = [0.5, 0.67, 0.75, 0.9, 1, 1.1, 1.25, 1.5, 2];
const SHELL = "<!DOCTYPE html><html><head></head><body></body></html>";

/**
 * Screen-only CSS that turns the document body into a sheet of paper of the
 * chosen page size. Inside @media screen, so printing from the preview is unaffected.
 */
function paperStyles(options: PDFOptions, isDark: boolean): string {
  const { width, height } = getPageDimensionsMm(options);
  const m = getMargins(options);
  const scale = options.scale ?? 1;
  // Puppeteer scales content but not margins: lay out at 1/scale size, then zoom
  const div = (v: string) => `calc(${v} / ${scale})`;
  return `
@media screen {
  html {
    background: ${isDark ? "#171717" : "#e5e5e5"} !important;
    min-height: 100%;
  }
  body {
    box-sizing: border-box !important;
    width: ${div(`${width}mm`)} !important;
    max-width: none !important;
    min-height: ${div(`${height}mm`)} !important;
    margin: ${div("24px")} auto !important;
    padding: ${div(m.top)} ${div(m.right)} ${div(m.bottom)} ${div(m.left)} !important;
    background: white;
    box-shadow: 0 1px 3px rgb(0 0 0 / 0.12), 0 8px 24px rgb(0 0 0 / 0.08);
    zoom: ${scale};
  }
}`;
}

const PreviewPane = forwardRef<PreviewPaneHandle, PreviewPaneProps>(function PreviewPane(
  { content, mode, options, documentTitle },
  ref
) {
  const { theme } = useTheme();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const lastHead = useRef("");
  const lastBody = useRef("");
  const [frameReady, setFrameReady] = useState(false);
  const [builtHtml, setBuiltHtml] = useState("");
  const [isRendering, setIsRendering] = useState(false);
  const [zoom, setZoom] = useState<number | "fit">("fit");
  const [fitZoom, setFitZoom] = useState(1);

  const isEmpty = !content.trim();

  // The server-rendered iframe can finish loading before React attaches onLoad
  // (hydration), so also check its state on mount.
  useEffect(() => {
    if (iframeRef.current?.contentDocument?.readyState === "complete") setFrameReady(true);
  }, []);
  const effectiveZoom = zoom === "fit" ? fitZoom : zoom;

  // Build the document (debounced so typing stays smooth)
  useEffect(() => {
    if (isEmpty) return;
    let cancelled = false;
    setIsRendering(true);
    const id = setTimeout(async () => {
      try {
        const doc = await buildDocument(content, options, mode, documentTitle);
        if (!cancelled) setBuiltHtml(doc.html);
      } catch (error) {
        console.error("Preview render error:", error);
      } finally {
        if (!cancelled) setIsRendering(false);
      }
    }, 200);
    return () => {
      cancelled = true;
      clearTimeout(id);
    };
  }, [content, options, mode, documentTitle, isEmpty]);

  // Push the built document into the iframe without reloading it (keeps scroll position)
  useEffect(() => {
    const doc = iframeRef.current?.contentDocument;
    if (!frameReady || !doc || !builtHtml) return;

    const parsed = new DOMParser().parseFromString(builtHtml, "text/html");
    const head = parsed.head.innerHTML + `<style>${paperStyles(options, theme === "dark")}</style>`;
    if (head !== lastHead.current) {
      doc.head.innerHTML = head;
      lastHead.current = head;
    }

    doc.documentElement.lang = parsed.documentElement.lang || "en";
    doc.body.className = parsed.body.className;
    const bodyStyle = parsed.body.getAttribute("style");
    if (bodyStyle) doc.body.setAttribute("style", bodyStyle);
    else doc.body.removeAttribute("style");

    const body = parsed.body.innerHTML;
    if (body !== lastBody.current) {
      doc.body.innerHTML = body;
      lastBody.current = body;
    }
  }, [builtHtml, frameReady, options, theme]);

  // Links: in-document anchors scroll, external links open in a new tab
  useEffect(() => {
    const doc = iframeRef.current?.contentDocument;
    if (!frameReady || !doc) return;
    const onClick = (e: MouseEvent) => {
      const link = (e.target as Element | null)?.closest?.("a[href]");
      if (!link) return;
      const href = link.getAttribute("href") || "";
      e.preventDefault();
      if (href.startsWith("#")) {
        const id = decodeURIComponent(href.slice(1));
        doc.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
      } else if (/^(https?:|mailto:)/i.test(href)) {
        window.open(href, "_blank", "noopener,noreferrer");
      }
    };
    doc.addEventListener("click", onClick);
    return () => doc.removeEventListener("click", onClick);
  }, [frameReady]);

  // Fit-to-width zoom follows the pane size
  const pageWidthPx = getPageDimensionsMm(options).width * MM_TO_PX;
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const observer = new ResizeObserver(() => {
      const available = el.clientWidth - 48;
      setFitZoom(Math.max(0.25, Math.min(1.5, available / pageWidthPx)));
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [pageWidthPx]);

  useEffect(() => {
    const doc = iframeRef.current?.contentDocument;
    if (frameReady && doc) doc.documentElement.style.zoom = String(effectiveZoom);
  }, [effectiveZoom, frameReady, builtHtml]);

  const print = useCallback(() => {
    const frame = iframeRef.current;
    const doc = frame?.contentDocument;
    if (!frame?.contentWindow || !doc) return;
    // Zoom is a screen-only aid; print at 100%
    doc.documentElement.style.zoom = "1";
    frame.contentWindow.addEventListener(
      "afterprint",
      () => {
        doc.documentElement.style.zoom = String(effectiveZoom);
      },
      { once: true }
    );
    frame.contentWindow.focus();
    frame.contentWindow.print();
  }, [effectiveZoom]);

  useImperativeHandle(ref, () => ({ print }), [print]);

  const stepZoom = (direction: 1 | -1) => {
    const current = effectiveZoom;
    const next =
      direction === 1
        ? ZOOM_STEPS.find((z) => z > current + 0.001)
        : [...ZOOM_STEPS].reverse().find((z) => z < current - 0.001);
    if (next) setZoom(next);
  };

  const zoomButton =
    "flex items-center justify-center w-6 h-6 text-neutral-500 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700 hover:text-neutral-900 dark:hover:text-neutral-100 disabled:opacity-40 disabled:hover:bg-transparent transition-colors";

  return (
    <div className="h-full flex flex-col bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 overflow-hidden min-w-0">
      {/* Preview Header */}
      <div className="flex items-center justify-between gap-2 px-4 h-11 flex-shrink-0 bg-neutral-50 dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-sm font-medium text-neutral-600 dark:text-neutral-300">Preview</span>
          <span className="hidden sm:inline text-xs text-neutral-400 truncate">
            {pageSizeLabels[options.pageSize].split(" ")[0]}
            {options.orientation === "landscape" ? " · Landscape" : ""}
          </span>
          {isRendering && !isEmpty && (
            <span className="w-1.5 h-1.5 rounded-full bg-neutral-400 animate-pulse" aria-label="Updating preview" />
          )}
        </div>

        <div className="flex items-center gap-0.5" role="group" aria-label="Zoom">
          <button type="button" onClick={() => stepZoom(-1)} className={zoomButton} title="Zoom out" aria-label="Zoom out" disabled={effectiveZoom <= ZOOM_STEPS[0]}>
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeWidth={2} d="M5 12h14" /></svg>
          </button>
          <button
            type="button"
            onClick={() => setZoom(zoom === "fit" ? 1 : "fit")}
            className="min-w-[3.25rem] h-6 px-1 text-xs tabular-nums text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
            title={zoom === "fit" ? "Fit to width (click for 100%)" : "Click to fit width"}
          >
            {zoom === "fit" ? "Fit" : `${Math.round(effectiveZoom * 100)}%`}
          </button>
          <button type="button" onClick={() => stepZoom(1)} className={zoomButton} title="Zoom in" aria-label="Zoom in" disabled={effectiveZoom >= ZOOM_STEPS[ZOOM_STEPS.length - 1]}>
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeWidth={2} d="M12 5v14M5 12h14" /></svg>
          </button>
        </div>
      </div>

      {/* Preview Content */}
      <div ref={viewportRef} className="relative flex-1 min-h-0 bg-neutral-200 dark:bg-neutral-900">
        <iframe
          ref={iframeRef}
          title="PDF preview"
          srcDoc={SHELL}
          // No allow-scripts: user HTML can never run code. allow-same-origin
          // only lets this page update the document; allow-modals enables print().
          sandbox="allow-same-origin allow-modals"
          onLoad={() => setFrameReady(true)}
          className={`absolute inset-0 w-full h-full border-0 ${isEmpty ? "invisible" : ""}`}
        />
        {isEmpty && (
          <div className="absolute inset-0 flex items-center justify-center text-neutral-400 dark:text-neutral-500">
            <div className="text-center">
              <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-sm">Start typing to see the preview</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

export default PreviewPane;
