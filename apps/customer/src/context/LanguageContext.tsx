import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { translations, type Locale, type Translations } from '../i18n';

interface LanguageContextType {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: () => Translations;
}

const LanguageContext = createContext<LanguageContextType | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>(() => {
    return (localStorage.getItem('locale') as Locale) || 'en';
  });

  const t = useCallback(() => translations[locale], [locale]);

  const handleSetLocale = useCallback((l: Locale) => {
    setLocale(l);
    localStorage.setItem('locale', l);
  }, []);

  return (
    <LanguageContext.Provider value={{ locale, setLocale: handleSetLocale, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}
