// providers/ThemeProvider.tsx
import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import * as SecureStore from 'expo-secure-store';

type Theme = 'dark' | 'light';

// Colors from tailwind.config.js - central source of truth
const COLORS = {
  primary: '#D5E726',
  secondary: '#10110E',
  background: '#0A0B09',
  surface: '#161814',
  text: '#FFFFFF',
  textSecondary: '#C7C7C7',
  border: '#2F332B',
  error: '#FF4D4F',
  success: '#52C41A',
};

// Light theme overrides
const LIGHT_COLORS = {
  ...COLORS,
  background: '#FAFAFA',
  surface: '#FFFFFF',
  text: '#0A0B09',
  textSecondary: '#6B7280',
  border: '#E2E8F0',
};

type ThemeColors = typeof COLORS;

type ThemeContextValue = {
  theme: Theme;
  colors: ThemeColors;
  toggleTheme: () => Promise<void>;
  setTheme: (t: Theme) => Promise<void>;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>('dark');
  const mountedRef = useRef(true);

  // Get colors based on current theme
  const colors = theme === 'dark' ? COLORS : LIGHT_COLORS;

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
    <ThemeContext.Provider value={{ theme, colors, toggleTheme, setTheme }}>
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