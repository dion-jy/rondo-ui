import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { DEFAULT_THEME, STORAGE_KEY, themes } from "../themes";

interface ThemeCtx {
  theme: string;
  setTheme: (id: string) => void;
}

const ThemeContext = createContext<ThemeCtx>({
  theme: DEFAULT_THEME,
  setTheme: () => {},
});

export function useTheme() {
  return useContext(ThemeContext);
}

function getInitialTheme(): string {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && themes.some((t) => t.id === stored)) return stored;
  } catch {}
  return DEFAULT_THEME;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState(getInitialTheme);

  const setTheme = useCallback((id: string) => {
    setThemeState(id);
    try {
      localStorage.setItem(STORAGE_KEY, id);
    } catch {}
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
