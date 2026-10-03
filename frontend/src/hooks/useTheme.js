import { useState, useEffect } from "react";

const KEY = "arivo_theme";

const apply = (theme) => document.documentElement.setAttribute("data-theme", theme);

// The saved choice wins; otherwise follow the device setting
export function useTheme() {
  const [theme, setTheme] = useState(() => document.documentElement.getAttribute("data-theme") || "light");

  useEffect(() => {
    if (!window.matchMedia) return undefined;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = (e) => {
      try {
        if (localStorage.getItem(KEY)) return;
      } catch {
        /* storage unavailable */
      }
      const next = e.matches ? "dark" : "light";
      apply(next);
      setTheme(next);
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const toggle = () => {
    const next = theme === "dark" ? "light" : "dark";
    apply(next);
    try {
      localStorage.setItem(KEY, next);
    } catch {
      /* storage unavailable */
    }
    setTheme(next);
  };

  return { theme, toggle };
}
