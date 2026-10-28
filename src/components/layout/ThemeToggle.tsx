"use client";

import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const isDark = document.documentElement.classList.contains("dark");
    setTheme(isDark ? "dark" : "light");
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);

    if (newTheme === "dark") {
      document.documentElement.classList.add("dark");
      localStorage.setItem("echoed_theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("echoed_theme", "light");
    }
  };

  if (!mounted) {
    return (
      <div className="w-9 h-9 rounded-full bg-black/5 dark:bg-white/10" />
    );
  }

  return (
    <button
      onClick={toggleTheme}
      type="button"
      aria-label="Toggle theme"
      className="relative inline-flex items-center justify-center w-9 h-9 rounded-full bg-white/70 dark:bg-gray-800/80 hover:bg-white dark:hover:bg-gray-700 border border-gray-300/80 dark:border-gray-700 text-gray-700 dark:text-amber-300 transition-all shadow-sm hover:scale-105 active:scale-95"
      title={theme === "light" ? "Switch to Dark Mode" : "Switch to Silver-Titanium Matte Mode"}
    >
      {theme === "light" ? (
        <span className="text-sm select-none" role="img" aria-label="Dark mode">🌙</span>
      ) : (
        <span className="text-sm select-none" role="img" aria-label="Light mode">☀️</span>
      )}
    </button>
  );
}
