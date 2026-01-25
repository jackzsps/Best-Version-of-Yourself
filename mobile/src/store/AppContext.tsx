import React, { createContext, useContext, useState, useEffect } from 'react';
import { Entry, RecordMode, Language, Theme, UserSubscription } from '../types';
import { DEFAULT_MODE, DEFAULT_LANGUAGE } from '../constants';
import { TRANSLATIONS } from '../../../shared/translations';
import firestore from '@react-native-firebase/firestore';
import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';
import { GoogleSignin } from '@react-native-google-signin/google-signin';

// Note: This file is a React Native specific implementation of AppContext.
// It uses @react-native-firebase which provides native bindings and better offline support (SQLite).

interface AppState {
  entries: Entry[];
  mode: RecordMode;
  language: Language;
  theme: Theme;
  user: FirebaseAuthTypes.User | null;
  subscription: UserSubscription; // Add subscription state
  isPro: boolean; // Derived state for easier UI usage
  t: (typeof TRANSLATIONS)['en'];
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
  setSubscription: (sub: UserSubscription) => void; // Add setter
}

const AppContext = createContext<AppState | undefined>(undefined);

export const AppProvider = ({ children }: React.PropsWithChildren<{}>) => {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [mode, setMode] = useState<RecordMode>(DEFAULT_MODE);
  const [language, setLanguage] = useState<Language>(DEFAULT_LANGUAGE);
  const [theme, setTheme] = useState<Theme>('default');
  const [user, setUser] = useState<FirebaseAuthTypes.User | null>(null);
  const [subscription, setSubscription] = useState<UserSubscription>({ status: 'inactive' }); // Default to inactive

  // Derived state: isPro is true only if status is active
  const isPro = subscription.status === 'active';

  // 1. Auth Listener
  useEffect(() => {
    const subscriber = auth().onAuthStateChanged(async (currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        setEntries([]); // Clear entries on logout
        setSubscription({ status: 'inactive' }); // Reset subscription
      }
    });
    return subscriber; // unsubscribe on unmount
  }, []);

  // 2. Data Synchronization (Optimized for React Native)
  // Uses onSnapshot with includeMetadataChanges to handle offline/online sync seamlessly.
  useEffect(() => {
    if (!user) {
      return;
    }

    // Use specific database instance 'bvoy'
    const db = firestore().app.firestore('bvoy');

    const unsubscribe = db
      .collection('users')
      .doc(user.uid)
      .collection('entries')
      .orderBy('date', 'desc')
      .onSnapshot(
        {
          includeMetadataChanges: true, // Critical for offline support (Risk A)
        },
        (snapshot) => {
          const newEntries = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
            // Metadata allows us to show "Syncing..." UI state if needed
            isSyncing: doc.metadata.hasPendingWrites,
          })) as Entry[];

          setEntries(newEntries);
        },
        (error) => {
          console.error('Firestore snapshot error:', error);
        },
      );
    
    // Sync Subscription Status (assuming it's stored in user document)
    // We listen to the user document itself
    const userUnsubscribe = db
      .collection('users')
      .doc(user.uid)
      .onSnapshot(
        (doc) => {
          if (doc.exists) {
            const data = doc.data();
            // Check if subscription field exists and has status
            if (data?.subscription?.status) {
               setSubscription(data.subscription as UserSubscription);
            } else {
               // Fallback/Default for existing users who don't have this field yet
               setSubscription({ status: 'inactive' });
            }
          }
        },
        (error) => console.error('Firestore user snapshot error:', error)
      );

    return () => {
      unsubscribe();
      userUnsubscribe();
    };
  }, [user]);

  const loginGoogle = async () => {
    // Check if your device supports Google Play
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    // Get the users ID token
    const { idToken } = await GoogleSignin.signIn();
    // Create a Google credential with the token
    const googleCredential = auth.GoogleAuthProvider.credential(idToken);
    // Sign-in the user with the credential
    await auth().signInWithCredential(googleCredential);
  };

  const loginEmail = async (email: string, pass: string) => {
    await auth().signInWithEmailAndPassword(email, pass);
  };

  const registerEmail = async (email: string, pass: string, name: string) => {
    const userCredential = await auth().createUserWithEmailAndPassword(
      email,
      pass,
    );
    if (userCredential.user) {
      await userCredential.user.updateProfile({ displayName: name });
      setUser(auth().currentUser); // Force update state
    }
  };

  const logout = async () => {
    await auth().signOut();
    // No need to manually clear entries, the useEffect will handle it
  };

  const addEntry = (entry: Entry) => {
    if (!user) {
      return;
    }
    // DIRECTLY write to Firestore.
    // The SDK handles local cache immediately (Optimistic UI) and syncs later.
    // No need for manual setEntries or local storage manipulation.

    // Use specific database instance 'bvoy'
    const db = firestore().app.firestore('bvoy');

    db.collection('users').doc(user.uid).collection('entries').add(entry);
  };

  const updateEntry = (updatedEntry: Entry) => {
    if (!user) {
      return;
    }
    const { id, ...data } = updatedEntry;

    // Use specific database instance 'bvoy'
    const db = firestore().app.firestore('bvoy');

    db.collection('users')
      .doc(user.uid)
      .collection('entries')
      .doc(id)
      .update(data);
  };

  const deleteEntry = (id: string) => {
    if (!user) {
      return;
    }

    // Use specific database instance 'bvoy'
    const db = firestore().app.firestore('bvoy');

    db.collection('users').doc(user.uid).collection('entries').doc(id).delete();
  };
  
  const updateSubscription = (sub: UserSubscription) => {
      if (!user) return;
      setSubscription(sub); // Optimistic update
      
      const db = firestore().app.firestore('bvoy');
      // Merge: true ensures we don't overwrite other user fields (like email, name if stored there)
      db.collection('users').doc(user.uid).set({ subscription: sub }, { merge: true });
  }

  const t = TRANSLATIONS[language];

  return (
    <AppContext.Provider
      value={{
        entries,
        mode,
        language,
        theme,
        user,
        subscription,
        isPro,
        t,
        addEntry,
        updateEntry,
        deleteEntry,
        setMode,
        setLanguage,
        setTheme,
        loginGoogle,
        loginEmail,
        registerEmail,
        logout,
        setSubscription: updateSubscription,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
};
