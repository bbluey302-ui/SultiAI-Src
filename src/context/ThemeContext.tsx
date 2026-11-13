import React, { createContext, useContext, useEffect, useState } from 'react';

export type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextType {
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  isDark: boolean;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = 'sultiai_theme_preference';

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [themeMode, setThemeModeState] = useState<ThemeMode>(() => {
    try {
      const saved = localStorage.getItem(THEME_STORAGE_KEY) as ThemeMode | null;
      if (saved === 'light' || saved === 'dark' || saved === 'system') {
        return saved;
      }
    } catch {
      // ignore
    }
    return 'system';
  });

  const [isDark, setIsDark] = useState<boolean>(false);

  // Compute and apply actual theme class to root
  useEffect(() => {
    const updateActualTheme = () => {
      let resolvedDark = false;
      if (themeMode === 'system') {
        resolvedDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      } else {
        resolvedDark = themeMode === 'dark';
      }

      setIsDark(resolvedDark);

      const root = document.documentElement;
      if (resolvedDark) {
        root.classList.add('dark');
        document.body.classList.add('dark');
      } else {
        root.classList.remove('dark');
        document.body.classList.remove('dark');
      }

      const themeColor = document.querySelector('meta[name="theme-color"]');
      if (themeColor) {
        themeColor.setAttribute('content', resolvedDark ? '#08121D' : '#F7F9FA');
      }
    };

    updateActualTheme();

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemChange = () => {
      if (themeMode === 'system') {
        updateActualTheme();
      }
    };

    mediaQuery.addEventListener('change', handleSystemChange);
    return () => mediaQuery.removeEventListener('change', handleSystemChange);
  }, [themeMode]);

  const setThemeMode = (mode: ThemeMode) => {
    setThemeModeState(mode);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, mode);
    } catch {
      // ignore
    }
  };

  const toggleTheme = () => {
    if (isDark) {
      setThemeMode('light');
    } else {
      setThemeMode('dark');
    }
  };

  return (
    <ThemeContext.Provider value={{ themeMode, setThemeMode, isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
