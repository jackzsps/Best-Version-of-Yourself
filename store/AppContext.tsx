
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

  // Effect for loading ALL initial data from localStorage on mount
  useEffect(() => {
    try {
      console.log("Attempting to load data from localStorage on initial mount.");
      const savedEntries = localStorage.getItem('bvoy_entries');
      const savedMode = localStorage.getItem('bvoy_mode');
      const savedLang = localStorage.getItem('bvoy_language');
      const savedTheme = localStorage.getItem('bvoy_theme');
      if (savedEntries) setEntries(JSON.parse(savedEntries));
      if (savedMode) setMode(savedMode as RecordMode);
      if (savedLang) setLanguage(savedLang as Language);
      if (savedTheme) setTheme(savedTheme as Theme);
    } catch (e) {
      console.error("Initial local data load failed", e);
    }
  }, []);

  // Auth state change and data synchronization effect
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);

      if (currentUser) {
        // --- User is LOGGED IN ---
        try {
          console.log(`User ${currentUser.uid} logged in. Starting data sync.`);
          const localEntriesJSON = localStorage.getItem('bvoy_entries');
          const localEntries: Entry[] = localEntriesJSON ? JSON.parse(localEntriesJSON) : [];
          const cloudEntries = await fetchAllFromCloud(currentUser.uid);

          const cloudEntryIds = new Set(cloudEntries.map(e => e.id));
          const localOnlyEntries = localEntries.filter(local => !cloudEntryIds.has(local.id));
          
          let combinedEntries = [...cloudEntries];

          if (localOnlyEntries.length > 0) {
            console.log(`Syncing ${localOnlyEntries.length} local-only entries to the cloud.`);
            for (const entry of localOnlyEntries) {
              let entryToSync = { ...entry };
              if (entry.imageUrl && entry.imageUrl.startsWith('data:')) {
                const cloudUrl = await uploadImageToCloud(entry.imageUrl, entry.id, currentUser.uid);
                entryToSync.imageUrl = cloudUrl;
              }
              await syncEntryToCloud(entryToSync, currentUser.uid);
              combinedEntries.push(entryToSync); // Add the synced entry to the combined list
            }
          }

          const sortedEntries = combinedEntries.sort((a, b) => b.date.seconds - a.date.seconds);
          setEntries(sortedEntries);
          localStorage.setItem('bvoy_entries', JSON.stringify(sortedEntries));
          console.log("Data sync complete. Local and cloud data are merged.");

        } catch (error) {
          console.error("Failed to sync data on login:", error);
          // Fallback to local data if cloud sync fails
          const localEntriesJSON = localStorage.getItem('bvoy_entries');
          setEntries(localEntriesJSON ? JSON.parse(localEntriesJSON) : []);
        }
      } else {
        // --- User is LOGGED OUT (or initial state before login check) ---
        console.log("User is logged out or auth state is initializing.");
        const localEntriesJSON = localStorage.getItem('bvoy_entries');
        setEntries(localEntriesJSON ? JSON.parse(localEntriesJSON) : []);
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
    console.log("Logout initiated.");
    await signOut(auth);
  };

  const addEntry = async (entry: Entry) => {
    const newEntries = [entry, ...entries].sort((a, b) => b.date.seconds - a.date.seconds);
    setEntries(newEntries);
    localStorage.setItem('bvoy_entries', JSON.stringify(newEntries));
    if (user) {
      console.log(`Syncing new entry ${entry.id} to the cloud.`);
      try {
        let entryToSync = { ...entry };
        if (entry.imageUrl && entry.imageUrl.startsWith('data:')) {
          const cloudUrl = await uploadImageToCloud(entry.imageUrl, entry.id, user.uid);
          entryToSync.imageUrl = cloudUrl; 
          // Update entry in the state with the cloud URL
          setEntries(prev => {
             const updated = prev.map(e => e.id === entry.id ? entryToSync : e);
             localStorage.setItem('bvoy_entries', JSON.stringify(updated));
             return updated;
          });
        }
        await syncEntryToCloud(entryToSync, user.uid);
      } catch (error) {
        console.error(`Failed to sync new entry ${entry.id} to cloud. It is saved locally.`, error);
      }
    }
  };

  const updateEntry = async (updatedEntry: Entry) => {
    setEntries(prev => {
      const updated = prev.map(e => e.id === updatedEntry.id ? updatedEntry : e);
      localStorage.setItem('bvoy_entries', JSON.stringify(updated));
      return updated;
    });
    if (user) {
      console.log(`Syncing updated entry ${updatedEntry.id} to the cloud.`);
      await syncEntryToCloud(updatedEntry, user.uid);
    }
  };

  const deleteEntry = async (id: string) => {
    const target = entries.find(e => e.id === id);
    setEntries(prev => {
      const updated = prev.filter(e => e.id !== id);
      localStorage.setItem('bvoy_entries', JSON.stringify(updated));
      return updated;
    });
    if (user && target) {
      console.log(`Deleting entry ${id} from the cloud.`);
      await deleteEntryFromCloud(id, !!target.imageUrl, user.uid);
    }
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