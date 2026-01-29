import React, { createContext, useContext, useState, useEffect } from 'react';
import { Entry, RecordMode, Language, Theme, UserSubscription } from '@shared/types';
import { DEFAULT_MODE, DEFAULT_LANGUAGE } from '@shared/constants';
import { TRANSLATIONS } from '@shared/translations';
import firestore from '@react-native-firebase/firestore';
import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { appleAuth } from '@invertase/react-native-apple-authentication';

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
  loginApple: () => Promise<void>;
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
  const [subscription, setSubscriptionState] = useState<UserSubscription>({ status: 'basic' }); // Default to basic

  // Derived state: isPro is true only if status is active (trial or pro) AND not expired
  const isPro = (() => {
    if (subscription.status !== 'pro' && subscription.status !== 'trial') return false;
    if (!subscription.expiryDate) return false;
    
    // Convert Firestore Timestamp to Date for comparison
    const now = new Date();
    // Handle both Firestore Timestamp (has seconds/nanoseconds) and generic object cases
    // React Native Firebase Timestamp often behaves slightly differently but usually has toDate() or seconds
    const expirySeconds = (subscription.expiryDate as any).seconds ?? 0;
    const expiry = new Date(expirySeconds * 1000);
    
    return expiry > now;
  })();

  // 1. Auth Listener
  useEffect(() => {
    const subscriber = auth().onAuthStateChanged(async (currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        setEntries([]); // Clear entries on logout
        setSubscriptionState({ status: 'basic' }); // Reset subscription
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
    // In React Native Firebase, you might not be able to name instances like in web if not configured.
    // Usually firestore() is enough if using default app. If using named app, firestore(app)
    const db = firestore(); 

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
               setSubscriptionState(data.subscription as UserSubscription);
            } else {
               // Fallback/Default for existing users who don't have this field yet
               // If no subscription data, consider it basic or check if we should init trial
               // Here we keep it basic to avoid infinite loops or overwrites without user action
               setSubscriptionState({ status: 'basic' });
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

  const loginApple = async () => {
    // Start the sign-in request
    const appleAuthRequestResponse = await appleAuth.performRequest({
      requestedOperation: appleAuth.Operation.LOGIN,
      requestedScopes: [appleAuth.Scope.EMAIL, appleAuth.Scope.FULL_NAME],
    });
  
    // Ensure Apple returned a user identityToken
    if (!appleAuthRequestResponse.identityToken) {
      throw new Error('Apple Sign-In failed - no identify token returned');
    }
  
    // Create a Firebase credential from the response
    const { identityToken, nonce } = appleAuthRequestResponse;
    const appleCredential = auth.AppleAuthProvider.credential(identityToken, nonce);
  
    // Sign the user in with the credential
    return auth().signInWithCredential(appleCredential);
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
      // setUser(auth().currentUser); // Force update state if needed, but onAuthStateChanged handles it
      
      // Initialize 14-day trial
      const trialExpiry = new Date();
      trialExpiry.setDate(trialExpiry.getDate() + 14);
      const initialSub: UserSubscription = {
           status: 'trial',
           expiryDate: firestore.Timestamp.fromDate(trialExpiry) as any
      };
      
      const db = firestore();
      await db.collection('users').doc(userCredential.user.uid).set({ subscription: initialSub }, { merge: true });
      setSubscriptionState(initialSub);
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

    const db = firestore();

    db.collection('users').doc(user.uid).collection('entries').add(entry);
  };

  const updateEntry = (updatedEntry: Entry) => {
    if (!user) {
      return;
    }
    const { id, ...data } = updatedEntry;

    const db = firestore();

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

    const db = firestore();

    db.collection('users').doc(user.uid).collection('entries').doc(id).delete();
  };
  
  const updateSubscription = (sub: UserSubscription) => {
      if (!user) return;
      setSubscriptionState(sub); // Optimistic update
      
      const db = firestore();
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
        loginApple,
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
