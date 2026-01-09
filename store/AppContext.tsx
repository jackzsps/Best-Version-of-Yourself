
import React, { createContext, useContext, useState, useEffect } from 'react';
import { Entry, RecordMode, Language, Theme } from '../types';
import { DEFAULT_MODE, DEFAULT_LANGUAGE } from '../constants';
import { TRANSLATIONS } from '../translations';

// Firebase Imports
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
import { 
    uploadImageToCloud, 
    syncEntryToCloud, 
    deleteEntryFromCloud, 
    listenToEntries
} from '../src/services/cloudService';
import { Unsubscribe } from 'firebase/firestore';

interface AppState {
  entries: Entry[];
  mode: RecordMode;
  language: Language;
  theme: Theme;
  user: User | null;
  isWriting: boolean; 
  t: typeof TRANSLATIONS['en'];
  addEntry: (entry: Entry) => Promise<void>;
  updateEntry: (entry: Entry) => Promise<void>;
  deleteEntry: (id: string) => Promise<void>;
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
  const [isWriting, setIsWriting] = useState<boolean>(false);

  useEffect(() => {
    try {
      const savedMode = localStorage.getItem('bvoy_mode');
      const savedLang = localStorage.getItem('bvoy_language');
      const savedTheme = localStorage.getItem('bvoy_theme');
      if (savedMode) setMode(savedMode as RecordMode);
      if (savedLang) setLanguage(savedLang as Language);
      if (savedTheme) setTheme(savedTheme as Theme);
    } catch (e) {
      console.error("Initial settings load failed", e);
    }
  }, []);

  useEffect(() => {
    let unsubscribe: Unsubscribe | null = null;

    const authUnsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      
      if (unsubscribe) {
        unsubscribe();
        unsubscribe = null;
      }

      if (currentUser) {
        // **Cloud is King**: When a user logs in, the cloud is the single source of truth.
        unsubscribe = listenToEntries(currentUser.uid, (cloudEntries) => {
            const sortedEntries = cloudEntries.sort((a, b) => b.date.seconds - a.date.seconds);
            setEntries(sortedEntries);
            localStorage.setItem('bvoy_entries', JSON.stringify(sortedEntries));
        });
      } else {
        // User is logged out, clear all personal data.
        setEntries([]);
        localStorage.removeItem('bvoy_entries');
      }
    });

    return () => {
      authUnsubscribe();
      if (unsubscribe) {
        unsubscribe();
      }
    };
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
    if (isWriting) {
      alert(t.logoutWarning);
      return;
    }
    await signOut(auth);
    // The onAuthStateChanged listener will handle clearing the state.
    localStorage.clear(); // Also clear settings etc.
    setMode(DEFAULT_MODE);
    setLanguage(DEFAULT_LANGUAGE);
    setTheme('default');
  };

  const t = TRANSLATIONS[language];

  const addEntry = async (entry: Entry) => {
    const currentUser = auth.currentUser;
    if (!currentUser) return; 

    // Optimistic UI update
    const newEntries = [entry, ...entries].sort((a, b) => b.date.seconds - a.date.seconds);
    setEntries(newEntries);
    localStorage.setItem('bvoy_entries', JSON.stringify(newEntries));

    setIsWriting(true); 
    try {
      let entryToSync = { ...entry };
      if (entry.imageUrl && entry.imageUrl.startsWith('data:')) {
        const cloudUrl = await uploadImageToCloud(entry.imageUrl, entry.id, currentUser.uid);
        entryToSync.imageUrl = cloudUrl; 
      }
      await syncEntryToCloud(entryToSync, currentUser.uid);
    } catch (error) {
      console.error(`Sync failed for new entry ${entry.id}. It is saved locally.`, error);
      // The listener will eventually correct the state if sync fails.
    } finally {
      setIsWriting(false); 
    }
  };

  const updateEntry = async (updatedEntry: Entry) => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    // Optimistic UI update
    const newEntries = entries.map(e => e.id === updatedEntry.id ? updatedEntry : e);
    setEntries(newEntries);
    localStorage.setItem('bvoy_entries', JSON.stringify(newEntries));

    setIsWriting(true); 
    try {
      await syncEntryToCloud(updatedEntry, currentUser.uid);
    } finally {
      setIsWriting(false); 
    }
  };

  const deleteEntry = async (id: string) => {
    const target = entries.find(e => e.id === id);
    if (!target) return;

    const confirmed = theme === 'vintage'
      ? window.confirm(`${t.vintageDelete.title}\n\n${t.vintageDelete.message}`)
      : window.confirm(`${t.confirmDelete}\n\n${t.deleteWarning}`);

    if (confirmed) {
      const currentUser = auth.currentUser;
      if (!currentUser) return;

      // Optimistic UI update
      const newEntries = entries.filter(e => e.id !== id);
      setEntries(newEntries);
      localStorage.setItem('bvoy_entries', JSON.stringify(newEntries));

      setIsWriting(true);
      try {
        await deleteEntryFromCloud(id, target.imageUrl || null, currentUser.uid);
      } catch (error) {
        console.error(`Cloud delete failed for entry ${id}.`, error);
        // The listener will eventually restore the entry if deletion fails.
      } finally {
        setIsWriting(false);
      }
    }
  };

  const updateMode = (m: RecordMode) => { setMode(m); localStorage.setItem('bvoy_mode', m); };
  const updateLang = (l: Language) => { setLanguage(l); localStorage.setItem('bvoy_language', l); };
  const updateTheme = (t: Theme) => { setTheme(t); localStorage.setItem('bvoy_theme', t); };

  return (
    <AppContext.Provider value={{ 
      entries, mode, language, theme, user, isWriting, t, 
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
