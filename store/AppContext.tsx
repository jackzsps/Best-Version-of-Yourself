import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Entry, RecordMode, Language, Theme } from '../types';
import { DEFAULT_MODE, DEFAULT_LANGUAGE } from '../constants';
import { TRANSLATIONS } from '../translations';

interface AppState {
  entries: Entry[];
  mode: RecordMode;
  language: Language;
  theme: Theme;
  t: typeof TRANSLATIONS['en'];
  addEntry: (entry: Entry) => void;
  updateEntry: (entry: Entry) => void;
  deleteEntry: (id: string) => void;
  setMode: (mode: RecordMode) => void;
  setLanguage: (lang: Language) => void;
  setTheme: (theme: Theme) => void;
}

const AppContext = createContext<AppState | undefined>(undefined);

export const AppProvider = ({ children }: React.PropsWithChildren<{}>) => {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [mode, setMode] = useState<RecordMode>(DEFAULT_MODE);
  const [language, setLanguage] = useState<Language>(DEFAULT_LANGUAGE);
  const [theme, setTheme] = useState<Theme>('default');

  // Load from local storage on mount
  useEffect(() => {
    try {
      const savedEntries = localStorage.getItem('bvoy_entries');
      const savedMode = localStorage.getItem('bvoy_mode');
      const savedLang = localStorage.getItem('bvoy_language');
      const savedTheme = localStorage.getItem('bvoy_theme');
      
      if (savedEntries) setEntries(JSON.parse(savedEntries));
      if (savedMode) setMode(savedMode as RecordMode);
      if (savedLang) setLanguage(savedLang as Language);
      if (savedTheme) setTheme(savedTheme as Theme);
    } catch (e) {
      console.error("Failed to load data from local storage", e);
    }
  }, []);

  const saveEntries = (newEntries: Entry[]) => {
    try {
      localStorage.setItem('bvoy_entries', JSON.stringify(newEntries));
    } catch (e) {
      console.error("LocalStorage full", e);
      alert("Storage full! Changes might not be saved properly. Please clear old data.");
    }
  };

  const addEntry = (entry: Entry) => {
    setEntries((prev) => {
      const updated = [entry, ...prev];
      saveEntries(updated);
      return updated;
    });
  };

  const updateEntry = (updatedEntry: Entry) => {
    setEntries((prev) => {
      const updated = prev.map(e => e.id === updatedEntry.id ? updatedEntry : e);
      saveEntries(updated);
      return updated;
    });
  };

  const deleteEntry = (id: string) => {
    setEntries((prev) => {
      const updated = prev.filter(e => e.id !== id);
      saveEntries(updated);
      return updated;
    });
  };

  const updateMode = (newMode: RecordMode) => {
    setMode(newMode);
    localStorage.setItem('bvoy_mode', newMode);
  };

  const updateLanguage = (newLang: Language) => {
    setLanguage(newLang);
    localStorage.setItem('bvoy_language', newLang);
  }

  const updateTheme = (newTheme: Theme) => {
    setTheme(newTheme);
    localStorage.setItem('bvoy_theme', newTheme);
  }

  // Get current translations based on language
  const t = TRANSLATIONS[language];

  return (
    <AppContext.Provider value={{ entries, mode, language, theme, t, addEntry, updateEntry, deleteEntry, setMode: updateMode, setLanguage: updateLanguage, setTheme: updateTheme }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used within AppProvider");
  return context;
};