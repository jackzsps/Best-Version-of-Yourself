import React, { createContext, useContext, useState, useEffect } from 'react';
import { Entry, RecordMode, Language, Theme, UserSubscription } from "@shared/types";
import { DEFAULT_MODE, DEFAULT_LANGUAGE } from "@shared/constants";
import { TRANSLATIONS } from "@shared/translations";
import { toast } from './ToastContext';

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
import { auth, googleProvider, appleProvider, db } from '../utils/firebase';
import { 
    uploadImageToCloud, 
    syncEntryToCloud, 
    deleteEntryFromCloud, 
    listenToEntries, 
    fetchAllFromCloud 
} from '../services/cloudService';
import { Unsubscribe, doc, onSnapshot, setDoc, Timestamp } from 'firebase/firestore';

interface AppState {
  entries: Entry[];
  mode: RecordMode;
  language: Language;
  theme: Theme;
  user: User | null;
  subscription: UserSubscription;
  isPro: boolean;
  isWriting: boolean;
  t: typeof TRANSLATIONS['en'];
  addEntry: (entry: Entry) => Promise<void>;
  updateEntry: (entry: Entry) => Promise<void>;
  deleteEntry: (id: string) => Promise<void>;
  setMode: (mode: RecordMode) => void;
  setLanguage: (lang: Language) => void;
  setTheme: (theme: Theme) => void;
  setIsWriting: (isWriting: boolean) => void;
  loginGoogle: () => Promise<void>;
  loginApple: () => Promise<void>;
  loginEmail: (email: string, pass: string) => Promise<void>;
  registerEmail: (email: string, pass: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  setSubscription: (sub: UserSubscription) => Promise<void>;
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
  const [subscription, setSubscriptionState] = useState<UserSubscription>({ status: 'basic' });
  const [isWriting, setIsWriting] = useState(false);

  // Derived state: isPro is true only if status is active (trial or pro) AND not expired
  const isPro = (() => {
    if (subscription.status !== 'pro' && subscription.status !== 'trial') return false;
    if (!subscription.expiryDate) return false;
    
    // Convert Firestore Timestamp to Date for comparison
    const now = new Date();
    // Handle both Firestore Timestamp (has seconds/nanoseconds) and generic object cases
    const expiry = new Date(subscription.expiryDate.seconds * 1000);
    
    return expiry > now;
  })();

  // Helper to save entries to the correct local storage key
  const saveToLocal = (data: Entry[], uid: string | null) => {
    try {
      const key = getStorageKey(uid);
      localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
      console.error("Failed to save to local storage", e);
      // We don't throw here because local storage failure shouldn't block the app, 
      // but we could toast.
      toast.error("Failed to save data locally.");
    }
  };

  // 1. Initial Load for Settings (Global/Device specific)
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
    let userUnsubscribe: Unsubscribe | null = null;

    const authUnsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      
      // Stop listening to previous user's data
      if (unsubscribe) {
        (unsubscribe as Function)();
        unsubscribe = null;
      }
      if (userUnsubscribe) {
        (userUnsubscribe as Function)();
        userUnsubscribe = null;
      }

      if (!currentUser) {
          setSubscriptionState({ status: 'basic' }); // Reset subscription
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
        toast.success(`Welcome back, ${currentUser.displayName || 'User'}!`);
        
        // B. Start real-time listener to sync with Cloud
        unsubscribe = listenToEntries(currentUser.uid, (cloudEntries) => {
            console.log("Received real-time update from Firestore.");
            
            // [FIX] 排序邏輯
            const sortedEntries = cloudEntries.sort((a, b) => {
                const dateDiff = (b.date?.seconds || 0) - (a.date?.seconds || 0);
                if (dateDiff !== 0) return dateDiff;
                return b.id.localeCompare(a.id);
            });
            
            setEntries(sortedEntries);
            localStorage.setItem(storageKey, JSON.stringify(sortedEntries));
        });

        // C. Listen to User document for subscription status
        userUnsubscribe = onSnapshot(doc(db, "users", currentUser.uid), async (docSnapshot) => {
            if (docSnapshot.exists()) {
                const data = docSnapshot.data();
                if (data?.subscription?.status) {
                    setSubscriptionState(data.subscription as UserSubscription);
                } else {
                    // Initialize if missing
                    const trialExpiry = new Date();
                    trialExpiry.setDate(trialExpiry.getDate() + 14);
                    const initialSub: UserSubscription = {
                         status: 'trial',
                         expiryDate: Timestamp.fromDate(trialExpiry)
                    };
                    // Write to DB
                    try {
                        await setDoc(doc(db, "users", currentUser.uid), { subscription: initialSub }, { merge: true });
                        setSubscriptionState(initialSub);
                    } catch (e) {
                        console.error("Failed to init subscription", e);
                    }
                }
            } else {
                 // Document doesn't exist at all, create it with trial
                 const trialExpiry = new Date();
                 trialExpiry.setDate(trialExpiry.getDate() + 14);
                 const initialSub: UserSubscription = {
                      status: 'trial',
                      expiryDate: Timestamp.fromDate(trialExpiry)
                 };
                 try {
                     await setDoc(doc(db, "users", currentUser.uid), { subscription: initialSub }, { merge: true });
                     setSubscriptionState(initialSub);
                 } catch (e) {
                     console.error("Failed to create user doc with subscription", e);
                 }
            }
        });

      } else {
        // --- User is LOGGED OUT / GUEST ---
        console.log("User is guest. Using guest local data only.");
      }
    });

    return () => {
        authUnsubscribe();
        if (unsubscribe) (unsubscribe as Function)();
        if (userUnsubscribe) (userUnsubscribe as Function)();
    };
  }, []);

  const loginGoogle = async () => { 
    try {
      await signInWithPopup(auth, googleProvider); 
    } catch (error: any) {
      console.error("Login failed", error);
      toast.error(`Login failed: ${error.message}`);
    }
  };

  const loginApple = async () => {
    try {
      // Configure Apple provider scopes if needed, e.g. email, name
      appleProvider.addScope('email');
      appleProvider.addScope('name');
      
      await signInWithPopup(auth, appleProvider);
    } catch (error: any) {
      console.error("Apple Login failed", error);
      toast.error(`Apple Login failed: ${error.message}`);
    }
  };

  const loginEmail = async (email: string, pass: string) => { 
    try {
      await signInWithEmailAndPassword(auth, email, pass); 
    } catch (error: any) {
      console.error("Login failed", error);
      toast.error(`Login failed: ${error.message}`);
    }
  };

  const registerEmail = async (email: string, pass: string, name: string) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
      if (userCredential.user) {
        await updateProfile(userCredential.user, { displayName: name });
        setUser({ ...userCredential.user, displayName: name } as User);
        
        // Initialize 14-day trial
        const trialExpiry = new Date();
        trialExpiry.setDate(trialExpiry.getDate() + 14);
        const initialSub: UserSubscription = {
             status: 'trial',
             expiryDate: Timestamp.fromDate(trialExpiry)
        };
        await setDoc(doc(db, "users", userCredential.user.uid), { subscription: initialSub }, { merge: true });

        toast.success("Account created successfully!");
      }
    } catch (error: any) {
      console.error("Registration failed", error);
      toast.error(`Registration failed: ${error.message}`);
    }
  };

  const logout = async () => {
    console.log("Logout initiated.");
    try {
      await signOut(auth);
      setEntries([]);
      setMode(DEFAULT_MODE);
      setLanguage(DEFAULT_LANGUAGE);
      setTheme('default');
      toast.info("Logged out successfully.");
    } catch (error: any) {
      console.error("Logout failed", error);
      toast.error("Logout failed.");
    }
  };

  const addEntry = async (entry: Entry) => {
    // 1. 樂觀更新 (Optimistic Update)
    const newEntries = [entry, ...entries].sort((a, b) => {
        const dateDiff = (b.date?.seconds || 0) - (a.date?.seconds || 0);
        if (dateDiff !== 0) return dateDiff;
        return b.id.localeCompare(a.id);
    });

    setEntries(newEntries);
    saveToLocal(newEntries, user ? user.uid : null);

    // 2. 雲端同步 (Cloud Sync)
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
        console.error(`Failed to sync new entry ${entry.id} to cloud.`, error);
        // [關鍵修改] 拋出錯誤，讓 UI 層可以捕捉並顯示 Toast
        throw error; 
      }
    }
  };

  const updateEntry = async (updatedEntry: Entry) => {
    // 1. 樂觀更新
    const newEntries = entries.map(e => e.id === updatedEntry.id ? updatedEntry : e);
    setEntries(newEntries);
    saveToLocal(newEntries, user ? user.uid : null);

    // 2. 雲端同步
    if (user) {
      console.log(`Syncing updated entry ${updatedEntry.id} to the cloud.`);
      try {
        await syncEntryToCloud(updatedEntry, user.uid);
      } catch (error) {
        console.error(`Failed to update entry ${updatedEntry.id} in cloud.`, error);
        throw error;
      }
    }
  };

  const deleteEntry = async (id: string) => {
    // 1. 樂觀更新
    const target = entries.find(e => e.id === id);
    const newEntries = entries.filter(e => e.id !== id);
    setEntries(newEntries);
    saveToLocal(newEntries, user ? user.uid : null);

    // 2. 雲端同步
    if (user && target) {
      console.log(`Deleting entry ${id} from the cloud.`);
      try {
        await deleteEntryFromCloud(id, !!target.imageUrl, user.uid);
      } catch (error) {
        console.error(`Failed to delete entry ${id} from cloud.`, error);
        throw error;
      }
    }
  };
  
  const updateSubscription = async (sub: UserSubscription) => {
      if (!user) return;
      setSubscriptionState(sub); // Optimistic update
      
      try {
        await setDoc(doc(db, "users", user.uid), { subscription: sub }, { merge: true });
      } catch (error) {
          console.error("Failed to update subscription", error);
          // Rollback handled by real-time listener eventually, but could add manual rollback here
          toast.error("Failed to sync subscription status.");
      }
  }

  const updateMode = (m: RecordMode) => { setMode(m); localStorage.setItem('bvoy_mode', m); };
  const updateLang = (l: Language) => { setLanguage(l); localStorage.setItem('bvoy_language', l); };
  const updateTheme = (t: Theme) => { setTheme(t); localStorage.setItem('bvoy_theme', t); };

  const t = TRANSLATIONS[language];

  return (
    <AppContext.Provider value={{ 
      entries, mode, language, theme, user, subscription, isPro, isWriting, t, 
      addEntry, updateEntry, deleteEntry, 
      setMode: updateMode, setLanguage: updateLang, setTheme: updateTheme, setIsWriting,
      loginGoogle, loginApple, loginEmail, registerEmail, logout,
      setSubscription: updateSubscription
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
