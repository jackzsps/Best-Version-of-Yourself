
import React, { createContext, useContext, useState, useEffect } from 'react';
import { Entry, RecordMode, Language, Theme } from '../types';
import { DEFAULT_MODE, DEFAULT_LANGUAGE } from '../constants';
import { TRANSLATIONS } from '../translations';
import {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  User
} from 'firebase/auth';
import { auth, googleProvider } from '../utils/firebase';
import {
    uploadImageToCloud,
    syncEntryToCloud,
    deleteEntryFromCloud,
    listenToEntries
} from '../services/cloudService';
import { Unsubscribe, Timestamp } from 'firebase/firestore';

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
    let unsubscribeFromEntries: Unsubscribe | null = null;

    const unsubscribeFromAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);

      if (unsubscribeFromEntries) {
        unsubscribeFromEntries();
        unsubscribeFromEntries = null;
      }

      if (currentUser) {
        unsubscribeFromEntries = listenToEntries(currentUser.uid, (cloudEntries) => {
            const sortedEntries = cloudEntries.sort((a, b) => {
                const dateA = a.date?.seconds ?? 0;
                const dateB = b.date?.seconds ?? 0;
                return dateB - dateA;
            });
            setEntries(sortedEntries);
            localStorage.setItem('bvoy_entries', JSON.stringify(sortedEntries));
        });
      } else {
        setEntries([]);
        localStorage.removeItem('bvoy_entries');
      }
    });

    return () => {
      unsubscribeFromAuth();
      if (unsubscribeFromEntries) {
        unsubscribeFromEntries();
      }
    };
  }, []);

  const t = TRANSLATIONS[language];

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
    localStorage.removeItem('bvoy_mode');
    localStorage.removeItem('bvoy_language');
    localStorage.removeItem('bvoy_theme');
    setMode(DEFAULT_MODE);
    setLanguage(DEFAULT_LANGUAGE);
    setTheme('default');
  };

  const addEntry = async (entry: Entry) => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    setIsWriting(true);
    try {
        const entryToSync = { 
            ...entry,
            date: entry.date && entry.date.seconds ? entry.date : Timestamp.now(),
        };

        if (entry.imageUrl && entry.imageUrl.startsWith('data:')) {
          const cloudUrl = await uploadImageToCloud(entry.imageUrl, entry.id, currentUser.uid);
          entryToSync.imageUrl = cloudUrl;
        }
        await syncEntryToCloud(entryToSync, currentUser.uid);
    } catch (error) {
        console.error(`Failed to sync new entry ${entry.id}.`, error);
        alert('Failed to save entry. Please try again.');
    } finally {
        setIsWriting(false);
    }
  };

  const updateEntry = async (updatedEntry: Entry) => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    setIsWriting(true);
    try {
        const entryToSync = { 
            ...updatedEntry,
            date: updatedEntry.date && updatedEntry.date.seconds ? updatedEntry.date : Timestamp.now(),
        };

        if (updatedEntry.imageUrl && updatedEntry.imageUrl.startsWith('data:')) {
             const cloudUrl = await uploadImageToCloud(updatedEntry.imageUrl, updatedEntry.id, currentUser.uid);
             entryToSync.imageUrl = cloudUrl;
        }
        await syncEntryToCloud(entryToSync, currentUser.uid);
    } catch (error) {
        console.error(`Failed to update entry ${updatedEntry.id}.`, error);
        alert('Failed to update entry. Please try again.');
    } finally {
        setIsWriting(false);
    }
  };

  const deleteEntry = async (id: string) => {
    const target = entries.find(e => e.id === id);
    if (!target) return;

    const confirmed = window.confirm(
        theme === 'vintage'
        ? `${t.dashboard.vintageDelete.title}\n\n${t.dashboard.vintageDelete.message}`
        : `${t.dashboard.confirmDelete}\n\n${t.dashboard.deleteWarning}`
    );

    if (confirmed) {
        const currentUser = auth.currentUser;
        if (!currentUser) return;

        setIsWriting(true);
        try {
            await deleteEntryFromCloud(id, target.imageUrl || null, currentUser.uid);
        } catch (error) {
            console.error(`Failed to delete entry ${id}.`, error);
            alert('Failed to delete entry. Please try again.');
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
