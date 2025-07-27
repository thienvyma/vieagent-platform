'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

// Import translation files
import viTranslations from '@/translations/vi.json';
import enTranslations from '@/translations/en.json';

type TranslationKey = string;
type TranslationValue = string | Record<string, any>;
type Translations = Record<string, TranslationValue>;

interface TranslationContextType {
  language: string;
  setLanguage: (lang: string) => void;
  t: (key: TranslationKey, params?: Record<string, string>) => string;
  availableLanguages: { code: string; name: string; flag: string }[];
}

const translations: Record<string, Translations> = {
  vi: viTranslations,
  en: enTranslations,
};

const TranslationContext = createContext<TranslationContextType | undefined>(undefined);

export const useTranslation = () => {
  const context = useContext(TranslationContext);
  if (!context) {
    throw new Error('useTranslation must be used within a TranslationProvider');
  }
  return context;
};

export const TranslationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { data: session } = useSession();
  const [language, setLanguageState] = useState('vi');

  const availableLanguages = [
    { code: 'vi', name: 'Tiếng Việt', flag: '🇻🇳' },
    { code: 'en', name: 'English', flag: '🇺🇸' },
  ];

  // Load user language preference
  useEffect(() => {
    const loadUserLanguage = async () => {
      if (session?.user?.id) {
        try {
          const response = await fetch('/api/user/settings');
          if (response.ok) {
            const result = await response.json();
            if (result.success && result.data?.language) {
              setLanguageState(result.data.language);
            }
          }
        } catch (error) {
          console.error('Error loading user language:', error);
        }
      } else {
        // Load from localStorage for non-authenticated users
        const savedLanguage = localStorage.getItem('preferred-language');
        if (savedLanguage && translations[savedLanguage]) {
          setLanguageState(savedLanguage);
        }
      }
    };

    loadUserLanguage();
  }, [session]);

  const setLanguage = async (lang: string) => {
    setLanguageState(lang);
    
    // Save to localStorage
    localStorage.setItem('preferred-language', lang);
    
    // Update HTML lang attribute
    document.documentElement.lang = lang;
    
    // Save to user settings if authenticated
    if (session?.user?.id) {
      try {
        await fetch('/api/user/settings', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ language: lang }),
        });
      } catch (error) {
        console.error('Error saving language preference:', error);
      }
    }
  };

  const getNestedValue = (obj: any, path: string): string => {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : null;
    }, obj);
  };

  const t = (key: TranslationKey, params?: Record<string, string>): string => {
    const currentTranslations = translations[language] || translations['vi'];
    let translation = getNestedValue(currentTranslations, key);
    
    if (!translation) {
      // Fallback to Vietnamese if key not found
      translation = getNestedValue(translations['vi'], key);
      if (!translation) {
        console.warn(`Translation missing for key: ${key} in language: ${language}`);
        return key; // Return key as fallback
      }
    }
    
    // Replace parameters
    if (params) {
      Object.entries(params).forEach(([param, value]) => {
        translation = translation.replace(`{{${param}}}`, value);
      });
    }
    
    return translation;
  };

  // Update HTML lang attribute when language changes
  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  return (
    <TranslationContext.Provider value={{ language, setLanguage, t, availableLanguages }}>
      {children}
    </TranslationContext.Provider>
  );
}; 