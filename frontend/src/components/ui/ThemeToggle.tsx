"use client";

import { Sun, Moon } from "lucide-react";
import { useTheme } from "@/lib/ThemeProvider";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
      className="flex w-full items-center rounded-lg bg-white/[0.06] p-0.5"
    >
      <span
        className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium transition-all ${
          theme === "light"
            ? "bg-aeos-500/15 text-aeos-400"
            : "text-slate-500 hover:text-slate-400"
        }`}
      >
        <Sun size={12} />
        <span>Light</span>
      </span>
      <span
        className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium transition-all ${
          theme === "dark"
            ? "bg-aeos-500/15 text-aeos-400"
            : "text-slate-500 hover:text-slate-400"
        }`}
      >
        <Moon size={12} />
        <span>Dark</span>
      </span>
    </button>
  );
}
