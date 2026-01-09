
import { db, storage } from '../utils/firebase';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  doc, 
  setDoc, 
  deleteDoc,
  Timestamp,
  orderBy
} from 'firebase/firestore';
import { ref, uploadString, getDownloadURL, deleteObject } from 'firebase/storage';
import { Entry } from '../../types';
import { Unsubscribe } from 'firebase/auth';

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
 * Listens for real-time updates on all entries, ordered by date.
 * This is a simplified query for debugging purposes.
 */
export const listenToEntries = (userId: string, callback: (entries: Entry[]) => void): Unsubscribe => {
  const entriesCollectionRef = collection(db, 'users', userId, 'entries');
  
  // DEBUG: Querying all entries and ordering by date to isolate indexing/filtering issues.
  const q = query(entriesCollectionRef, orderBy("date", "desc"));

  const unsubscribe = onSnapshot(q, (querySnapshot) => {
    const entries: Entry[] = [];
    querySnapshot.forEach((doc) => {
      entries.push(doc.data() as Entry);
    });
    callback(entries);
  }, (error) => {
    console.error("Error listening to Firestore entries:", error);
    // If there is an index issue, Firestore will log a detailed error here
    // with a link to create the required index in the Firebase console.
    alert("An error occurred while fetching data. Check the browser console for details.");
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
