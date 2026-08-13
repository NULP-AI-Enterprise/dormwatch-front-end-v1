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

const DEFAULT_THEME = "dark";
const THEME_STORAGE_KEY = "dormwatch-theme";
const THEMES: Theme[] = ["dark", "light", "system"];

const ThemeProviderContext = createContext<ThemeProviderState | undefined>(undefined);

function readStoredTheme(storageKey: string, fallback: Theme): Theme {
  const stored = localStorage.getItem(storageKey) as Theme | null;
  return stored && THEMES.includes(stored) ? stored : fallback;
}

function applyTheme(theme: Theme): ResolvedTheme {
  const root = window.document.documentElement;
  const resolved: ResolvedTheme =
    theme === "system"
      ? window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light"
      : theme;
  root.classList.remove("light", "dark");
  root.classList.add(resolved);
  return resolved;
}

export function ThemeProvider({
  children,
  defaultTheme = DEFAULT_THEME,
  storageKey = THEME_STORAGE_KEY,
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(() => readStoredTheme(storageKey, defaultTheme));
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>(defaultTheme === "light" ? "light" : "dark");

  useEffect(() => {
    const resolved = applyTheme(theme);
    setResolvedTheme(resolved);

    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const onSystemChange = () => {
      if (theme === "system") {
        setResolvedTheme(applyTheme("system"));
      }
    };
    mql.addEventListener("change", onSystemChange);
    return () => mql.removeEventListener("change", onSystemChange);
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
