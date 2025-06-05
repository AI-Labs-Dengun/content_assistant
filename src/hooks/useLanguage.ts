import { useState, useEffect } from 'react';

export type Language = 'en' | 'es' | 'pt' | 'fr' | 'de' | 'it' | 'nl' | 'ru' | 'zh' | 'ja' | 'ko';

export const useLanguage = () => {
  const [language, setLanguage] = useState<Language>('en');

  useEffect(() => {
    // Tenta recuperar o idioma salvo no localStorage
    const savedLanguage = localStorage.getItem('language') as Language;
    if (savedLanguage && ['en', 'es', 'pt', 'fr', 'de', 'it', 'nl', 'ru', 'zh', 'ja', 'ko'].includes(savedLanguage)) {
      setLanguage(savedLanguage);
    } else {
      // Se não houver idioma salvo, tenta detectar o idioma do navegador
      const browserLanguage = navigator.language.split('-')[0];
      if (['en', 'es', 'pt', 'fr', 'de', 'it', 'nl', 'ru', 'zh', 'ja', 'ko'].includes(browserLanguage)) {
        setLanguage(browserLanguage as Language);
        localStorage.setItem('language', browserLanguage);
      }
    }
  }, []);

  const updateLanguage = (newLanguage: Language) => {
    setLanguage(newLanguage);
    localStorage.setItem('language', newLanguage);
  };

  return { language, setLanguage: updateLanguage };
}; 