import { db, storage } from '../utils/firebase';
import { 
  collection, doc, setDoc, deleteDoc, getDocs, query, onSnapshot, Unsubscribe
} from 'firebase/firestore';
import { 
  ref, uploadString, getDownloadURL, deleteObject 
} from 'firebase/storage';
import { Entry } from '../types';

// Uploads a Base64 image to Firebase Storage and returns the download URL.
export const uploadImageToCloud = async (base64Image: string, entryId: string, userId: string): Promise<string> => {
  const storageRef = ref(storage, `users/${userId}/images/${entryId}.jpg`);
  await uploadString(storageRef, base64Image, 'data_url');
  return await getDownloadURL(storageRef);
};

// Syncs a single entry to Firestore.
export const syncEntryToCloud = async (entry: Entry, userId: string) => {
  const entryRef = doc(db, 'users', userId, 'entries', entry.id);
  await setDoc(entryRef, entry, { merge: true });
};

// Deletes an entry from both Firestore and Firebase Storage (if an image URL exists).
export const deleteEntryFromCloud = async (entryId: string, imageUrl: string | null, userId: string) => {
  // 1. Delete the document from Firestore.
  await deleteDoc(doc(db, 'users', userId, 'entries', entryId));

  // 2. If an imageUrl exists, delete the corresponding file from Storage.
  if (imageUrl) {
    try {
      // Create a reference directly from the HTTPS download URL.
      // This is the most robust way to ensure the correct file is deleted.
      const storageRef = ref(storage, imageUrl);
      await deleteObject(storageRef);
    } catch (error) {
      // Log errors, e.g., if the object doesn't exist or rules prevent deletion.
      console.warn(`Image deletion failed for URL: ${imageUrl}`, error);
    }
  }
};

// Fetches all entries for a user from the cloud (one-time fetch).
export const fetchAllFromCloud = async (userId: string): Promise<Entry[]> => {
  const q = query(collection(db, 'users', userId, 'entries'));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => doc.data() as Entry);
};

// Listens for real-time updates to a user's entries.
export const listenToEntries = (userId: string, callback: (entries: Entry[]) => void): Unsubscribe => {
  const q = query(collection(db, 'users', userId, 'entries'));
  const unsubscribe = onSnapshot(q, (querySnapshot) => {
    const entries = querySnapshot.docs.map(doc => doc.data() as Entry);
    callback(entries);
  });
  return unsubscribe;
};
