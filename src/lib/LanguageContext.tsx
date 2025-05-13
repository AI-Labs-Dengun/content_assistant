'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'pt' | 'en' | 'es' | 'fr' | 'de';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mounted, setMounted] = useState(false);
  const [language, setLanguage] = useState<Language>('en');

  useEffect(() => {
    setMounted(true);
    // Primeiro tenta obter o idioma salvo no localStorage
    const savedLanguage = localStorage.getItem('language') as Language;
    if (savedLanguage && ['pt', 'en', 'es', 'fr', 'de'].includes(savedLanguage)) {
      setLanguage(savedLanguage);
    } else {
      // Se não houver idioma salvo, usa o idioma do navegador
      const browserLang = navigator.language.split('-')[0];
      const supportedLang = ['pt', 'en', 'es', 'fr', 'de'].includes(browserLang) ? browserLang : 'en';
      setLanguage(supportedLang as Language);
      localStorage.setItem('language', supportedLang);
    }
  }, []);

  const handleSetLanguage = (newLang: Language) => {
    setLanguage(newLang);
    localStorage.setItem('language', newLang);
    document.documentElement.lang = newLang;
  };

  if (!mounted) {
    return null;
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage: handleSetLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}; 