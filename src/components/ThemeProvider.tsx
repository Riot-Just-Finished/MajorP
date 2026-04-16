"use client";

import { createContext, useContext, useEffect, useState } from "react";

type Theme = "dark" | "light";

const ThemeContext = createContext<{
  theme: Theme;
  toggleTheme: () => void;
}>({ theme: "dark", toggleTheme: () => {} });

export function useTheme() {
  return useContext(ThemeContext);
}

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("theme") as Theme | null;
    const preferred = saved ?? "dark";
    setTheme(preferred);
    applyTheme(preferred);
    setMounted(true);
  }, []);

  function applyTheme(t: Theme) {
    const html = document.documentElement;
    const body = document.body;

    if (t === "dark") {
      html.classList.add("dark");
      html.classList.remove("light");
      body.style.background = "#000";
      body.style.color = "#f4f4f5";
    } else {
      html.classList.remove("dark");
      html.classList.add("light");
      body.style.background = "#f8f9fa";
      body.style.color = "#18181b";
    }
  }

  function toggleTheme() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("theme", next);
    applyTheme(next);
  }

  // Prevent flash: hide content until theme is resolved
  if (!mounted) return null;

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
