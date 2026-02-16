"use client";

import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { applyTheme, getInitialTheme, setTheme, type Theme } from "../lib/theme";

interface ThemeContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Sync with DOM (init script may have run) to avoid hydration mismatch
    const isDark = document.documentElement.classList.contains("dark");
    setThemeState(isDark ? "dark" : "light");
    setMounted(true);
  }, []);

  const handleSetTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
    setTheme(newTheme);
  }, []);

  const toggleTheme = useCallback(() => {
    const next: Theme = theme === "dark" ? "light" : "dark";
    handleSetTheme(next);
  }, [theme, handleSetTheme]);

  // Sync when theme changes (e.g. from another tab)
  useEffect(() => {
    if (!mounted) return;
    applyTheme(theme);
  }, [theme, mounted]);

  const value: ThemeContextValue = {
    theme,
    setTheme: handleSetTheme,
    toggleTheme,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return ctx;
}
