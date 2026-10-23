import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";

type Theme = "dark" | "light" | "system";
type ResolvedTheme = "dark" | "light";

type ThemeProviderProps = {
  children: ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
};

type ThemeProviderState = {
  theme: Theme;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: Theme) => void;
};

const THEME_STORAGE_KEY = "dormwatch-theme";

const ThemeProviderContext = createContext<ThemeProviderState | undefined>(undefined);

function getSystemTheme(): ResolvedTheme {
  if (typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches) {
    return "dark";
  }
  return "light";
}

function readStoredTheme(storageKey: string, fallback?: Theme): Theme {
  const stored = localStorage.getItem(storageKey);
  if (stored === "dark" || stored === "light" || stored === "system") {
    return stored;
  }
  if (fallback === "dark" || fallback === "light" || fallback === "system") {
    return fallback;
  }
  return "system";
}

function applyTheme(theme: Theme): ResolvedTheme {
  const root = window.document.documentElement;
  root.classList.remove("light", "dark");
  const resolved = theme === "system" ? getSystemTheme() : theme;
  root.classList.add(resolved);
  return resolved;
}

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = THEME_STORAGE_KEY,
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(() => readStoredTheme(storageKey, defaultTheme));
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>(() =>
    theme === "system" ? getSystemTheme() : theme
  );

  useEffect(() => {
    const resolved = applyTheme(theme);
    setResolvedTheme(resolved);

    if (theme === "system") {
      const media = window.matchMedia("(prefers-color-scheme: dark)");
      const listener = () => {
        const next = applyTheme("system");
        setResolvedTheme(next);
      };
      media.addEventListener("change", listener);
      return () => media.removeEventListener("change", listener);
    }
  }, [theme]);

  const value: ThemeProviderState = {
    theme,
    resolvedTheme,
    setTheme: (nextTheme) => {
      localStorage.setItem(storageKey, nextTheme);
      setThemeState(nextTheme);
    },
  };

  return (
    <ThemeProviderContext.Provider value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeProviderContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
