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
import { auth, googleProvider } from '../utils/firebase';
import { 
    uploadImageToCloud, 
    syncEntryToCloud, 
    deleteEntryFromCloud, 
    listenToEntries, 
    fetchAllFromCloud 
} from '../services/cloudService';
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

// Helper function to generate storage key based on user ID
const getStorageKey = (uid: string | null) => {
  return uid ? `bvoy_entries_${uid}` : 'bvoy_entries_guest';
};

export const AppProvider = ({ children }: React.PropsWithChildren<{}>) => {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [mode, setMode] = useState<RecordMode>(DEFAULT_MODE);
  const [language, setLanguage] = useState<Language>(DEFAULT_LANGUAGE);
  const [theme, setTheme] = useState<Theme>('default');
  const [user, setUser] = useState<User | null>(null);

  // Helper to save entries to the correct local storage key
  const saveToLocal = (data: Entry[], uid: string | null) => {
    try {
      const key = getStorageKey(uid);
      localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
      console.error("Failed to save to local storage", e);
    }
  };

  // 1. Initial Load for Settings (Global/Device specific)
  // Settings like Theme/Language often remain device-specific, so we keep using static keys for them.
  useEffect(() => {
    try {
      console.log("Loading initial settings...");
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

  // 2. Auth State Change & Data Synchronization
  useEffect(() => {
    let unsubscribe: Unsubscribe | null = null;

    const authUnsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      
      // Stop listening to previous user's data
      if (unsubscribe) {
        (unsubscribe as Function)();
        unsubscribe = null;
      }

      const storageKey = getStorageKey(currentUser ? currentUser.uid : null);

      // A. Always load local cache first (Immediate Feedback)
      try {
        const cachedData = localStorage.getItem(storageKey);
        if (cachedData) {
          console.log(`Loaded cached data from ${storageKey}`);
          setEntries(JSON.parse(cachedData));
        } else {
          console.log(`No cache found for ${storageKey}, starting empty.`);
          setEntries([]);
        }
      } catch (e) {
        console.error("Error parsing cached entries", e);
        setEntries([]);
      }

      if (currentUser) {
        // --- User is LOGGED IN ---
        console.log(`User ${currentUser.uid} logged in. Setting up real-time listener.`);
        
        // B. Start real-time listener to sync with Cloud
        unsubscribe = listenToEntries(currentUser.uid, (cloudEntries) => {
            console.log("Received real-time update from Firestore.");
            
            // [FIX START] 修正排序邏輯：
            // 1. 先比日期 (date.seconds)
            // 2. 日期相同 (都是中午 12:00) 時，比對 ID (建立時間)，確保最新建立的在上面
            const sortedEntries = cloudEntries.sort((a, b) => {
                const dateDiff = (b.date?.seconds || 0) - (a.date?.seconds || 0);
                if (dateDiff !== 0) return dateDiff;
                return b.id.localeCompare(a.id);
            });
            // [FIX END]
            
            setEntries(sortedEntries);
            
            // Update the SPECIFIC user's local cache
            localStorage.setItem(storageKey, JSON.stringify(sortedEntries));
        });

      } else {
        // --- User is LOGGED OUT / GUEST ---
        console.log("User is guest. Using guest local data only.");
        // We already loaded guest cache in step A.
      }
    });

    return () => {
        authUnsubscribe();
        if (unsubscribe) (unsubscribe as Function)();
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
    console.log("Logout initiated.");
    // FIX: DO NOT clear localStorage. Preserve cache for next login.
    // Only reset in-memory state.
    setEntries([]);
    setMode(DEFAULT_MODE);
    setLanguage(DEFAULT_LANGUAGE);
    setTheme('default');
    
    await signOut(auth);
  };

  const addEntry = async (entry: Entry) => {
    // [FIX START] 新增本地資料時，同樣應用 ID 排序補償
    const newEntries = [entry, ...entries].sort((a, b) => {
        const dateDiff = (b.date?.seconds || 0) - (a.date?.seconds || 0);
        if (dateDiff !== 0) return dateDiff;
        return b.id.localeCompare(a.id);
    });
    // [FIX END]

    setEntries(newEntries);
    
    // Save to current user's (or guest's) specific storage key
    saveToLocal(newEntries, user ? user.uid : null);

    if (user) {
      console.log(`Syncing new entry ${entry.id} to the cloud.`);
      try {
        let entryToSync = { ...entry };
        if (entry.imageUrl && entry.imageUrl.startsWith('data:')) {
          const cloudUrl = await uploadImageToCloud(entry.imageUrl, entry.id, user.uid);
          entryToSync.imageUrl = cloudUrl; 
          await syncEntryToCloud(entryToSync, user.uid); 
        } else {
          await syncEntryToCloud(entryToSync, user.uid);
        }
      } catch (error) {
        console.error(`Failed to sync new entry ${entry.id} to cloud. It is saved locally.`, error);
      }
    }
  };

  const updateEntry = async (updatedEntry: Entry) => {
    const newEntries = entries.map(e => e.id === updatedEntry.id ? updatedEntry : e);
    setEntries(newEntries);
    
    saveToLocal(newEntries, user ? user.uid : null);

    if (user) {
      console.log(`Syncing updated entry ${updatedEntry.id} to the cloud.`);
      await syncEntryToCloud(updatedEntry, user.uid);
    }
  };

  const deleteEntry = async (id: string) => {
    const target = entries.find(e => e.id === id);
    const newEntries = entries.filter(e => e.id !== id);
    setEntries(newEntries);
    
    saveToLocal(newEntries, user ? user.uid : null);

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