import { db, storage } from '../utils/firebase';
import { 
  collection, doc, setDoc, deleteDoc, getDocs, query, onSnapshot, Unsubscribe
} from 'firebase/firestore';
import { 
  ref, uploadString, getDownloadURL, deleteObject 
} from 'firebase/storage';
import { Entry } from '../types';

// 將 Base64 轉換並上傳到 Firebase Storage (Modular API)
export const uploadImageToCloud = async (base64Image: string, entryId: string, userId: string): Promise<string> => {
  const storageRef = ref(storage, `users/${userId}/images/${entryId}.jpg`);
  await uploadString(storageRef, base64Image, 'data_url');
  return await getDownloadURL(storageRef);
};

// 同步單筆紀錄到 Firestore (Modular API)
export const syncEntryToCloud = async (entry: Entry, userId: string) => {
  const entryRef = doc(db, 'users', userId, 'entries', entry.id);
  await setDoc(entryRef, entry, { merge: true });
};

// 刪除雲端資料
export const deleteEntryFromCloud = async (entryId: string, hasImage: boolean, userId: string) => {
  try {
    await deleteDoc(doc(db, 'users', userId, 'entries', entryId));
  } catch (e) {
    console.warn("Firestore delete failed", e);
  }

  if (hasImage) {
    const storageRef = ref(storage, `users/${userId}/images/${entryId}.jpg`);
    try {
      await deleteObject(storageRef);
    } catch (e) {
      console.warn("Image delete failed", e);
    }
  }
};

// 從雲端拉取所有資料 (一次性)
export const fetchAllFromCloud = async (userId: string): Promise<Entry[]> => {
  const q = query(collection(db, 'users', userId, 'entries'));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => doc.data() as Entry);
};

// 監聽雲端資料變化 (即時)
export const listenToEntries = (userId: string, callback: (entries: Entry[]) => void): Unsubscribe => {
  const q = query(collection(db, 'users', userId, 'entries'));
  const unsubscribe = onSnapshot(q, (querySnapshot) => {
    const entries = querySnapshot.docs.map(doc => doc.data() as Entry);
    callback(entries);
  });
  return unsubscribe;
};
