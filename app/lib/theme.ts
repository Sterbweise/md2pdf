/**
 * Theme utilities for light/dark mode toggle.
 * Persists preference in localStorage and syncs with document class.
 */

export type Theme = "light" | "dark";

const STORAGE_KEY = "md2pdf-theme";

/**
 * Get stored theme or infer from system preference.
 */
export function getInitialTheme(): Theme {
  if (typeof window === "undefined") return "dark";
  const stored = localStorage.getItem(STORAGE_KEY) as Theme | null;
  if (stored === "light" || stored === "dark") return stored;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

/**
 * Apply theme to document (add/remove .dark class and data-theme on html).
 */
export function applyTheme(theme: Theme): void {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  if (theme === "dark") {
    root.classList.add("dark");
    root.setAttribute("data-theme", "dark");
  } else {
    root.classList.remove("dark");
    root.setAttribute("data-theme", "light");
  }
}

/**
 * Initialize theme on first load (run before React hydration to avoid flash).
 */
export function initTheme(): void {
  const theme = getInitialTheme();
  applyTheme(theme);
}

/**
 * Set theme and persist to localStorage.
 */
export function setTheme(theme: Theme): void {
  localStorage.setItem(STORAGE_KEY, theme);
  applyTheme(theme);
}
