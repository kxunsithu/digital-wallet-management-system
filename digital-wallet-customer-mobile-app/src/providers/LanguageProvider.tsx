// src/providers/LanguageProvider.tsx
import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import * as SecureStore from 'expo-secure-store';
import { Language, getTranslation } from '../i18n/translations';

const LANGUAGE_KEY = 'app_language';

type LanguageContextValue = {
  language: Language;
  setLanguage: (lang: Language) => Promise<void>;
  toggleLanguage: () => Promise<void>;
  t: (key: string, params?: Record<string, string | number>) => string;
};

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>('en');
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    (async () => {
      try {
        const stored = await SecureStore.getItemAsync(LANGUAGE_KEY);
        if (mountedRef.current && (stored === 'en' || stored === 'my')) {
          setLanguageState(stored as Language);
        }
      } catch (e) {
        // ignore storage errors
      }
    })();

    return () => {
      mountedRef.current = false;
    };
  }, []);

  const setLanguage = useCallback(async (lang: Language) => {
    if (mountedRef.current) {
      setLanguageState(lang);
    }
    try {
      await SecureStore.setItemAsync(LANGUAGE_KEY, lang);
    } catch (e) {
      // ignore
    }
  }, []);

  const toggleLanguage = useCallback(async () => {
    const nextLang: Language = language === 'en' ? 'my' : 'en';
    await setLanguage(nextLang);
  }, [language, setLanguage]);

  const t = useCallback(
    (key: string, params?: Record<string, string | number>) => {
      return getTranslation(language, key, params);
    },
    [language]
  );

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}

export default LanguageProvider;
