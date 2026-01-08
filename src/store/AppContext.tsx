import React, { createContext, useContext, useState, useEffect } from 'react';
import { Entry, RecordMode, Language, Theme } from '../types';
import { DEFAULT_MODE, DEFAULT_LANGUAGE } from '../constants';
import { TRANSLATIONS } from '../translations';

// Firebase Imports
import { auth, googleProvider } from '../utils/firebase';
import { onAuthStateChanged, User, signInWithPopup, signOut } from 'firebase/auth';
import { uploadImageToCloud, syncEntryToCloud, deleteEntryFromCloud, fetchAllFromCloud } from '../services/cloudService';

interface AppState {
  entries: Entry[];
  mode: RecordMode;
  language: Language;
  theme: Theme;
  user: User | null;
  t: typeof TRANSLATIONS['en'];
  addEntry: (entry: Entry) => void;
  updateEntry: (entry: Entry) => void;
  deleteEntry: (id: string) => void;
  setMode: (mode: RecordMode) => void;
  setLanguage: (lang: Language) => void;
  setTheme: (theme: Theme) => void;
  login: () => Promise<void>;
  logout: () => Promise<void>;
}

const AppContext = createContext<AppState | undefined>(undefined);

export const AppProvider = ({ children }: React.PropsWithChildren<{}>) => {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [mode, setMode] = useState<RecordMode>(DEFAULT_MODE);
  const [language, setLanguage] = useState<Language>(DEFAULT_LANGUAGE);
  const [theme, setTheme] = useState<Theme>('default');
  const [user, setUser] = useState<User | null>(null);

  // Load local data on mount
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

  // Sync with Firebase Auth
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Option: Merge cloud data with local data or just overwrite
        // For simplicity here, we'll fetch cloud data and use it to ensure sync across devices
        try {
          const cloudEntries = await fetchAllFromCloud();
          if (cloudEntries.length > 0) {
            setEntries(cloudEntries);
            saveEntriesToLocal(cloudEntries);
          }
        } catch (error) {
          console.error("Failed to fetch initial data from cloud", error);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  const saveEntriesToLocal = (newEntries: Entry[]) => {
    try {
      localStorage.setItem('bvoy_entries', JSON.stringify(newEntries));
    } catch (e) {
      console.error("LocalStorage full", e);
      // If full, we might want to alert the user, but with Cloud Sync this is less critical
    }
  };

  const login = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Login failed", error);
      alert("Login failed. Please try again.");
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setEntries([]); // Clear sensitive data on logout
      saveEntriesToLocal([]);
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  const addEntry = async (entry: Entry) => {
    // 1. Optimistic Update (Local First)
    // Add the entry (potentially with Base64 image) immediately to state
    const newEntries = [entry, ...entries];
    setEntries(newEntries);
    saveEntriesToLocal(newEntries);

    // 2. Cloud Sync (Background)
    if (user) {
      try {
        let entryToSync = { ...entry };

        // Handle Image: Cold Storage -> Hot Storage URL
        if (entry.imageUrl && entry.imageUrl.startsWith('data:')) {
          const cloudUrl = await uploadImageToCloud(entry.imageUrl, entry.id);
          entryToSync.imageUrl = cloudUrl; // Replace Base64 with URL
          
          // IMPORTANT: Update local state/storage with the URL version to free up LocalStorage space
          setEntries(prev => {
             const updated = prev.map(e => e.id === entry.id ? entryToSync : e);
             saveEntriesToLocal(updated);
             return updated;
          });
        }

        // Sync metadata to Firestore
        await syncEntryToCloud(entryToSync);

      } catch (error) {
        console.error("Background cloud sync failed", error);
        // TODO: Implement offline queue or retry mechanism
      }
    }
  };

  const updateEntry = async (updatedEntry: Entry) => {
    setEntries((prev) => {
      const updated = prev.map(e => e.id === updatedEntry.id ? updatedEntry : e);
      saveEntriesToLocal(updated);
      return updated;
    });

    if (user) {
      try {
        await syncEntryToCloud(updatedEntry);
      } catch (error) {
        console.error("Update cloud sync failed", error);
      }
    }
  };

  const deleteEntry = async (id: string) => {
    const targetEntry = entries.find(e => e.id === id);
    
    setEntries((prev) => {
      const updated = prev.filter(e => e.id !== id);
      saveEntriesToLocal(updated);
      return updated;
    });

    if (user) {
      try {
        await deleteEntryFromCloud(id, !!targetEntry?.imageUrl);
      } catch (error) {
        console.error("Delete cloud sync failed", error);
      }
    }
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
    <AppContext.Provider value={{ 
      entries, mode, language, theme, user, t, 
      addEntry, updateEntry, deleteEntry, 
      setMode: updateMode, setLanguage: updateLanguage, setTheme: updateTheme,
      login, logout
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used within AppProvider");
  return context;
};