"use client";

import React, { useCallback, useRef, useState } from "react";

export type ViewMode = "editor" | "split" | "preview";

interface SplitViewProps {
  first: React.ReactNode;
  second: React.ReactNode;
  viewMode: ViewMode;
  /** Size of the first pane, in percent */
  ratio: number;
  onRatioChange: (ratio: number) => void;
  direction: "horizontal" | "vertical";
}

const MIN_RATIO = 20;
const MAX_RATIO = 80;

const clamp = (value: number) => Math.min(MAX_RATIO, Math.max(MIN_RATIO, value));

/**
 * Two panes with a draggable divider. The divider works with mouse, touch and
 * keyboard (arrows, Home/End); double-click resets it to 50/50.
 */
export default function SplitView({
  first,
  second,
  viewMode,
  ratio,
  onRatioChange,
  direction,
}: SplitViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const isHorizontal = direction === "horizontal";

  const updateFromPointer = useCallback(
    (clientX: number, clientY: number) => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const position = isHorizontal
        ? ((clientX - rect.left) / rect.width) * 100
        : ((clientY - rect.top) / rect.height) * 100;
      onRatioChange(clamp(Math.round(position * 10) / 10));
    },
    [isHorizontal, onRatioChange]
  );

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    setIsDragging(true);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDragging) updateFromPointer(e.clientX, e.clientY);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.releasePointerCapture(e.pointerId);
    setIsDragging(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const step = e.shiftKey ? 10 : 2;
    const decrease = isHorizontal ? "ArrowLeft" : "ArrowUp";
    const increase = isHorizontal ? "ArrowRight" : "ArrowDown";
    if (e.key === decrease) onRatioChange(clamp(ratio - step));
    else if (e.key === increase) onRatioChange(clamp(ratio + step));
    else if (e.key === "Home") onRatioChange(MIN_RATIO);
    else if (e.key === "End") onRatioChange(MAX_RATIO);
    else return;
    e.preventDefault();
  };

  const showFirst = viewMode !== "preview";
  const showSecond = viewMode !== "editor";
  const isSplit = showFirst && showSecond;

  const firstStyle: React.CSSProperties = isSplit
    ? { flexBasis: `${ratio}%`, flexGrow: 0, flexShrink: 0 }
    : { flex: 1 };

  return (
    <div
      ref={containerRef}
      className={`h-full min-h-0 min-w-0 flex ${isHorizontal ? "flex-row" : "flex-col"} ${
        isDragging ? (isHorizontal ? "cursor-col-resize select-none" : "cursor-row-resize select-none") : ""
      }`}
    >
      {/* Hidden panes stay mounted so they keep their state (scroll, zoom, preview) */}
      <div className={`min-h-0 min-w-0 flex-col ${showFirst ? "flex" : "hidden"}`} style={firstStyle}>
        {first}
      </div>

      {isSplit && (
        <div
          role="separator"
          aria-orientation={isHorizontal ? "vertical" : "horizontal"}
          aria-valuenow={Math.round(ratio)}
          aria-valuemin={MIN_RATIO}
          aria-valuemax={MAX_RATIO}
          aria-label="Resize editor and preview"
          title="Drag to resize · double-click to reset"
          tabIndex={0}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onDoubleClick={() => onRatioChange(50)}
          onKeyDown={handleKeyDown}
          className={`group relative flex-shrink-0 flex items-center justify-center touch-none ${
            isHorizontal ? "w-3 cursor-col-resize" : "h-3 cursor-row-resize"
          } focus-visible:outline-none`}
        >
          <div
            className={`transition-colors ${
              isHorizontal ? "w-px h-full" : "h-px w-full"
            } ${
              isDragging
                ? "bg-neutral-900 dark:bg-neutral-100"
                : "bg-transparent group-hover:bg-neutral-400 dark:group-hover:bg-neutral-500 group-focus-visible:bg-neutral-900 dark:group-focus-visible:bg-neutral-100"
            }`}
          />
          {/* Grip */}
          <div
            className={`absolute flex gap-0.5 ${isHorizontal ? "flex-col" : "flex-row"} px-0.5 py-0.5 bg-neutral-100 dark:bg-neutral-950`}
          >
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className={`block w-1 h-1 rounded-full ${
                  isDragging ? "bg-neutral-900 dark:bg-neutral-100" : "bg-neutral-400 dark:bg-neutral-600"
                }`}
              />
            ))}
          </div>
        </div>
      )}

      <div className={`min-h-0 min-w-0 flex-col flex-1 ${showSecond ? "flex" : "hidden"}`}>
        {second}
      </div>

      {/* While dragging, a shield stops the preview iframe from swallowing pointer events */}
      {isDragging && <div className="fixed inset-0 z-50" style={{ cursor: isHorizontal ? "col-resize" : "row-resize" }} />}
    </div>
  );
}
