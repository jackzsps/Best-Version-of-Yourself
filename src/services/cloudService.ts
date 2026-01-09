
import { db, storage } from '../utils/firebase';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  doc, 
  setDoc, 
  deleteDoc,
  Timestamp
} from 'firebase/firestore';
import { ref, uploadString, getDownloadURL, deleteObject } from 'firebase/storage';
import { Entry } from '../../types';
import { Unsubscribe } from 'firebase/auth';

// Helper to get the date 45 days ago
const getFortyFiveDaysAgo = (): Timestamp => {
  const date = new Date();
  date.setDate(date.getDate() - 45);
  return Timestamp.fromDate(date);
};

// --- WRITE OPERATIONS ---

/**
 * Uploads an image to Firebase Storage and returns the download URL.
 * Images are stored in a user-specific folder.
 */
export const uploadImageToCloud = async (imageDataUrl: string, entryId: string, userId: string): Promise<string> => {
  const imagePath = `users/${userId}/images/${entryId}.jpg`;
  const storageRef = ref(storage, imagePath);
  await uploadString(storageRef, imageDataUrl, 'data_url');
  const downloadURL = await getDownloadURL(storageRef);
  return downloadURL;
};

/**
 * Creates or updates an entry's data in Firestore.
 * This is the primary "write" operation for entry data.
 */
export const syncEntryToCloud = async (entry: Entry, userId: string): Promise<void> => {
  const entryRef = doc(db, 'users', userId, 'entries', entry.id);
  const sanitizedEntry = { ...entry };
  await setDoc(entryRef, sanitizedEntry, { merge: true });
};

// --- READ OPERATION ---

/**
 * Listens for real-time updates on recent entries (last 45 days).
 * This is the primary "read" operation.
 */
export const listenToEntries = (userId: string, callback: (entries: Entry[]) => void): Unsubscribe => {
  const entriesCollectionRef = collection(db, 'users', userId, 'entries');
  const fortyFiveDaysAgo = getFortyFiveDaysAgo();
  
  const q = query(entriesCollectionRef, where("date", ">=", fortyFiveDaysAgo));

  const unsubscribe = onSnapshot(q, (querySnapshot) => {
    const entries: Entry[] = [];
    querySnapshot.forEach((doc) => {
      entries.push(doc.data() as Entry);
    });
    callback(entries);
  }, (error) => {
    console.error("Error listening to Firestore entries:", error);
  });

  return unsubscribe;
};

// --- DELETE OPERATION ---

/**
 * Deletes an entry document from Firestore and its associated image from Storage.
 */
export const deleteEntryFromCloud = async (entryId: string, imageUrl: string | null, userId: string): Promise<void> => {
  const entryRef = doc(db, 'users', userId, 'entries', entryId);
  await deleteDoc(entryRef);

  if (imageUrl) {
    try {
      const imageRef = ref(storage, imageUrl);
      await deleteObject(imageRef);
    } catch (error: any) {
        console.warn(`Could not delete image ${imageUrl}. It may have already been deleted.`, error);
    }
  }
};
