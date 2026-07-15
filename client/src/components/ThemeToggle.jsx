import { Sun, Moon } from "lucide-react";
import { useTheme } from "../hooks/useTheme";

/**
 * Accessible light/dark theme switch. Native <button> gives keyboard
 * support (Tab + Enter/Space) for free; aria-label covers the icon-only UI.
 */
export default function ThemeToggle({ className = "" }) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      aria-pressed={isDark}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className={`inline-flex items-center justify-center rounded-md p-2 text-muted hover:bg-surface-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 focus-visible:ring-offset-background ${className}`}
    >
      <Sun
        size={18}
        className={`transition-transform duration-300 ${isDark ? "hidden scale-0" : "block scale-100"}`}
      />
      <Moon
        size={18}
        className={`transition-transform duration-300 ${isDark ? "block scale-100" : "hidden scale-0"}`}
      />
    </button>
  );
}
