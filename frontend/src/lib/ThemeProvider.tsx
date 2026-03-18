"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";

type Theme = "light" | "dark";

interface ThemeContextValue {
  theme: Theme;
  setTheme: (t: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: "dark",
  setTheme: () => {},
  toggleTheme: () => {},
});

export function useTheme() {
  return useContext(ThemeContext);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("dark");

  useEffect(() => {
    const stored = localStorage.getItem("aeos-theme") as Theme | null;
    if (stored === "light" || stored === "dark") {
      setThemeState(stored);
    } else if (!window.matchMedia("(prefers-color-scheme: dark)").matches) {
      setThemeState("light");
    }
  }, []);

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t);
    localStorage.setItem("aeos-theme", t);
    const root = document.documentElement;
    // Only animate if user hasn't requested reduced motion
    const prefersMotion = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersMotion) root.classList.add("theme-transitioning");
    if (t === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    if (prefersMotion) setTimeout(() => root.classList.remove("theme-transitioning"), 300);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(theme === "dark" ? "light" : "dark");
  }, [theme, setTheme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
