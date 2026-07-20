import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import * as SecureStore from 'expo-secure-store';

type Theme = 'dark' | 'light';

type ThemeContextValue = {
  theme: Theme;
  toggleTheme: () => Promise<void>;
  setTheme: (t: Theme) => Promise<void>;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>('dark');
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    (async () => {
      try {
        const stored = await SecureStore.getItemAsync('theme');
        if (mountedRef.current && (stored === 'light' || stored === 'dark')) {
          setThemeState(stored);
        }
      } catch (e) {
        // ignore
      }
    })();

    return () => {
      mountedRef.current = false;
    };
  }, []);

  async function setTheme(t: Theme) {
    if (mountedRef.current) setThemeState(t);
    try {
      await SecureStore.setItemAsync('theme', t);
    } catch (e) {
      // ignore
    }
  }

  async function toggleTheme() {
    await setTheme(theme === 'dark' ? 'light' : 'dark');
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}

export default ThemeProvider;
