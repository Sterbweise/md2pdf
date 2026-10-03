"use client";

import { useCallback, useEffect, useRef, useState, type RefObject } from "react";

/**
 * useState backed by localStorage. Starts with `initial` (so server and client
 * render the same markup), then loads the stored value after mount.
 * Returns [value, setValue, loaded].
 */
export function usePersistentState<T>(
  key: string,
  initial: T,
  merge: (stored: unknown, initial: T) => T = (stored) => stored as T
): [T, React.Dispatch<React.SetStateAction<T>>, boolean] {
  const [value, setValue] = useState<T>(initial);
  const [loaded, setLoaded] = useState(false);
  const initialRef = useRef(initial);
  const mergeRef = useRef(merge);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw !== null) setValue(mergeRef.current(JSON.parse(raw), initialRef.current));
    } catch {
      // Storage unavailable or corrupt: keep the initial value
    }
    setLoaded(true);
  }, [key]);

  useEffect(() => {
    if (!loaded) return;
    const id = setTimeout(() => {
      try {
        localStorage.setItem(key, JSON.stringify(value));
      } catch {
        // Quota exceeded or storage disabled: persistence is best-effort
      }
    }, 300);
    return () => clearTimeout(id);
  }, [key, value, loaded]);

  return [value, setValue, loaded];
}

/** Whether a CSS media query matches (false during SSR) */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia(query);
    const update = () => setMatches(mql.matches);
    update();
    mql.addEventListener("change", update);
    return () => mql.removeEventListener("change", update);
  }, [query]);

  return matches;
}

/**
 * Fullscreen for one element. Uses the Fullscreen API when available and
 * falls back to a CSS "fill the viewport" mode (e.g. iPhone Safari).
 */
export function useFullscreen(ref: RefObject<HTMLElement | null>) {
  const [isNative, setIsNative] = useState(false);
  const [isFallback, setIsFallback] = useState(false);

  useEffect(() => {
    const onChange = () => setIsNative(document.fullscreenElement === ref.current);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, [ref]);

  // Escape leaves the CSS fallback mode, like it does for native fullscreen
  useEffect(() => {
    if (!isFallback) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsFallback(false);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [isFallback]);

  const toggle = useCallback(async () => {
    const el = ref.current;
    if (!el) return;
    if (document.fullscreenElement) {
      await document.exitFullscreen().catch(() => {});
      return;
    }
    if (isFallback) {
      setIsFallback(false);
      return;
    }
    if (document.fullscreenEnabled && el.requestFullscreen) {
      try {
        await el.requestFullscreen();
        return;
      } catch {
        // Fall through to the CSS fallback
      }
    }
    setIsFallback(true);
  }, [ref, isFallback]);

  return { isFullscreen: isNative || isFallback, isFallback, toggle };
}
