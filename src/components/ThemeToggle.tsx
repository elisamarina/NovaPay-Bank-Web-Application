"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useSyncExternalStore } from "react";

const THEME_CHANGE_EVENT = "themechange";

const getIsDark = () => {
  if (typeof window === "undefined") return false;

  const storedTheme = localStorage.getItem("theme");

  return storedTheme
    ? storedTheme === "dark"
    : window.matchMedia("(prefers-color-scheme: dark)").matches;
};

const subscribeToTheme = (onStoreChange: () => void) => {
  if (typeof window === "undefined") return () => {};

  const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

  window.addEventListener("storage", onStoreChange);
  window.addEventListener(THEME_CHANGE_EVENT, onStoreChange);
  mediaQuery.addEventListener("change", onStoreChange);

  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(THEME_CHANGE_EVENT, onStoreChange);
    mediaQuery.removeEventListener("change", onStoreChange);
  };
};

const ThemeToggle = () => {
  const isDark = useSyncExternalStore(subscribeToTheme, getIsDark, () => false);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
  }, [isDark]);

  const toggleTheme = () => {
    const nextIsDark = !isDark;

    localStorage.setItem("theme", nextIsDark ? "dark" : "light");
    window.dispatchEvent(new Event(THEME_CHANGE_EVENT));
  };

  return (
    <button
      type="button"
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      onClick={toggleTheme}
      className="flex size-10 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-700 transition-all duration-200 hover:border-bankGradient hover:text-bankGradient dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-bankGradient dark:hover:text-purple-300"
    >
      {isDark ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
};

export default ThemeToggle;
