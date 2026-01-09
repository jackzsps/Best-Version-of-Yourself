
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
    listenToEntries, // Import the real-time listener
    fetchAllFromCloud // Keep for initial anonymous sync
} from '../src/services/cloudService';
import { Unsubscribe } from 'firebase/firestore';

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

  // Effect for loading ALL settings and initial ENTRIES from localStorage on mount
  useEffect(() => {
    try {
      console.log("Attempting to load data from localStorage on initial mount.");
      const savedEntries = localStorage.getItem('bvoy_entries'); // <-- FIX: Load entries on start
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
    let unsubscribe: Unsubscribe | null = null;

    const authUnsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      
      // Stop listening to old user's data if there was one
      if (unsubscribe) unsubscribe();

      if (currentUser) {
        // --- User is LOGGED IN ---
        console.log(`User ${currentUser.uid} logged in. Setting up real-time listener.`);
        
        // Start real-time listener
        unsubscribe = listenToEntries(currentUser.uid, (cloudEntries) => {
            console.log("Received real-time update from Firestore.");
            const sortedEntries = cloudEntries.sort((a, b) => b.date.seconds - a.date.seconds);
            setEntries(sortedEntries);
            localStorage.setItem('bvoy_entries', JSON.stringify(sortedEntries));
        });

      } else {
        // --- User is LOGGED OUT (or in anonymous state) ---
        console.log("User is not logged in. Using local data only.");
        // FIX: No longer clearing cache here. This is handled by the logout function.
        // We still need to load from local storage in case they just refreshed the page.
        const localData = localStorage.getItem('bvoy_entries');
        setEntries(localData ? JSON.parse(localData) : []);
      }
    });

    return () => {
        authUnsubscribe();
        if (unsubscribe) unsubscribe();
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
    console.log("Logout initiated. Clearing all local user data.");
    // FIX: Clear local storage ONLY on explicit logout
    localStorage.removeItem('bvoy_entries');
    localStorage.removeItem('bvoy_mode');
    localStorage.removeItem('bvoy_language');
    localStorage.removeItem('bvoy_theme');
    setEntries([]);
    setMode(DEFAULT_MODE);
    setLanguage(DEFAULT_LANGUAGE);
    setTheme('default');
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
          await syncEntryToCloud(entryToSync, user.uid); // Update the entry with the final URL
        }
        await syncEntryToCloud(entryToSync, user.uid);
      } catch (error) {
        console.error(`Failed to sync new entry ${entry.id} to cloud. It is saved locally.`, error);
      }
    }
  };

  const updateEntry = async (updatedEntry: Entry) => {
    const newEntries = entries.map(e => e.id === updatedEntry.id ? updatedEntry : e);
    setEntries(newEntries);
    localStorage.setItem('bvoy_entries', JSON.stringify(newEntries));
    if (user) {
      console.log(`Syncing updated entry ${updatedEntry.id} to the cloud.`);
      await syncEntryToCloud(updatedEntry, user.uid);
    }
  };

  const deleteEntry = async (id: string) => {
    const target = entries.find(e => e.id === id);
    const newEntries = entries.filter(e => e.id !== id);
    setEntries(newEntries);
    localStorage.setItem('bvoy_entries', JSON.stringify(newEntries));
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