import React, { createContext, useContext, useState, useEffect } from 'react';
import { Entry, RecordMode, Language, Theme } from '../types';
import { DEFAULT_MODE, DEFAULT_LANGUAGE } from '../constants';
import { TRANSLATIONS } from '../translations';

// Firebase Imports (Modular)
import { 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  updateProfile,
  User
} from 'firebase/auth';
import { auth, googleProvider } from '../src/utils/firebase';
import { uploadImageToCloud, syncEntryToCloud, deleteEntryFromCloud, fetchAllFromCloud } from '../src/services/cloudService';

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
  loginGoogle: () => Promise<void>;
  loginEmail: (email: string, pass: string) => Promise<void>;
  registerEmail: (email: string, pass: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AppContext = createContext<AppState | undefined>(undefined);

export const AppProvider = ({ children }: React.PropsWithChildren<{}>) => {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [mode, setMode] = useState<RecordMode>(DEFAULT_MODE);
  const [language, setLanguage] = useState<Language>(DEFAULT_LANGUAGE);
  const [theme, setTheme] = useState<Theme>('default');
  const [user, setUser] = useState<User | null>(null);

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
      console.error("Local data load failed", e);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const cloudEntries = await fetchAllFromCloud(currentUser.uid);
          if (cloudEntries.length > 0) {
            setEntries(cloudEntries);
            localStorage.setItem('bvoy_entries', JSON.stringify(cloudEntries));
          }
        } catch (error) {
          console.error("Initial cloud sync failed", error);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  const loginGoogle = async () => { await signInWithPopup(auth, googleProvider); };
  const loginEmail = async (email: string, pass: string) => { await signInWithEmailAndPassword(auth, email, pass); };
  const registerEmail = async (email: string, pass: string, name: string) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
    if (userCredential.user) {
      await updateProfile(userCredential.user, { displayName: name });
      setUser({ ...userCredential.user, displayName: name } as User);
    }
  };

  const logout = async () => {
    await signOut(auth);
    setEntries([]);
    localStorage.removeItem('bvoy_entries');
  };

  const addEntry = async (entry: Entry) => {
    const newEntries = [entry, ...entries];
    setEntries(newEntries);
    localStorage.setItem('bvoy_entries', JSON.stringify(newEntries));
    if (user) {
      try {
        let entryToSync = { ...entry };
        if (entry.imageUrl && entry.imageUrl.startsWith('data:')) {
          const cloudUrl = await uploadImageToCloud(entry.imageUrl, entry.id, user.uid);
          entryToSync.imageUrl = cloudUrl; 
          setEntries(prev => {
             const updated = prev.map(e => e.id === entry.id ? entryToSync : e);
             localStorage.setItem('bvoy_entries', JSON.stringify(updated));
             return updated;
          });
        }
        await syncEntryToCloud(entryToSync, user.uid);
      } catch (error) {
        console.error("Entry cloud sync failed", error);
      }
    }
  };

  const updateEntry = async (updatedEntry: Entry) => {
    setEntries(prev => {
      const updated = prev.map(e => e.id === updatedEntry.id ? updatedEntry : e);
      localStorage.setItem('bvoy_entries', JSON.stringify(updated));
      return updated;
    });
    if (user) await syncEntryToCloud(updatedEntry, user.uid);
  };

  const deleteEntry = async (id: string) => {
    const target = entries.find(e => e.id === id);
    setEntries(prev => {
      const updated = prev.filter(e => e.id !== id);
      localStorage.setItem('bvoy_entries', JSON.stringify(updated));
      return updated;
    });
    if (user) await deleteEntryFromCloud(id, !!target?.imageUrl, user.uid);
  };

  const updateMode = (m: RecordMode) => { setMode(m); localStorage.setItem('bvoy_mode', m); };
  const updateLang = (l: Language) => { setLanguage(l); localStorage.setItem('bvoy_language', l); };
  const updateTheme = (t: Theme) => { setTheme(t); localStorage.setItem('bvoy_theme', t); };

  const t = TRANSLATIONS[language];

  return (
    <AppContext.Provider value={{ 
      entries, mode, language, theme, user, t, 
      addEntry, updateEntry, deleteEntry, 
      setMode: updateMode, setLanguage: updateLang, setTheme: updateTheme,
      loginGoogle, loginEmail, registerEmail, logout
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