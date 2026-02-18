"use client";

import { useTheme } from "@/contexts";
import styles from "./ThemeToggle.module.css";

interface ThemeToggleProps {
  variant?: "icon" | "text" | "full";
  className?: string;
}

export function ThemeToggle({
  variant = "icon",
  className = "",
}: ThemeToggleProps) {
  const { theme, setTheme, resolvedTheme } = useTheme();

  const cycleTheme = () => {
    const themes: Array<"light" | "dark" | "system"> = [
      "light",
      "dark",
      "system",
    ];
    const currentIndex = themes.indexOf(theme);
    const nextIndex = (currentIndex + 1) % themes.length;
    setTheme(themes[nextIndex]);
  };

  const getIcon = () => {
    if (theme === "system") return "💻";
    return resolvedTheme === "light" ? "☀️" : "🌙";
  };

  const getLabel = () => {
    switch (theme) {
      case "light":
        return "Claro";
      case "dark":
        return "Oscuro";
      case "system":
        return "Sistema";
      default:
        return "";
    }
  };

  return (
    <button
      onClick={cycleTheme}
      className={`${styles.toggle} ${styles[variant]} ${className}`}
      aria-label={`Cambiar tema (actual: ${getLabel()})`}
      title={`Tema actual: ${getLabel()}`}
    >
      {variant === "icon" && <span className={styles.icon}>{getIcon()}</span>}

      {variant === "text" && <span className={styles.text}>{getLabel()}</span>}

      {variant === "full" && (
        <>
          <span className={styles.icon}>{getIcon()}</span>
          <span className={styles.text}>{getLabel()}</span>
        </>
      )}
    </button>
  );
}
