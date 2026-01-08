import { db, storage, auth } from '../utils/firebase';
import { collection, doc, setDoc, deleteDoc, getDocs, query } from 'firebase/firestore';
import { ref, uploadString, getDownloadURL, deleteObject } from 'firebase/storage';
import { Entry } from '../types';

// 將 Base64 轉換並上傳到 Firebase Storage (冷儲存)
export const uploadImageToCloud = async (base64Image: string, entryId: string): Promise<string> => {
  if (!auth.currentUser) throw new Error("User not authenticated");
  
  // 路徑結構: users/{userId}/images/{entryId}.jpg
  const storageRef = ref(storage, `users/${auth.currentUser.uid}/images/${entryId}.jpg`);
  
  // 上傳 (Firebase SDK 自動處理 Base64)
  await uploadString(storageRef, base64Image, 'data_url');
  
  // 取得公開下載連結 (這就是我們要存到熱儲存的字串)
  return await getDownloadURL(storageRef);
};

// 同步單筆紀錄到 Firestore (熱儲存)
export const syncEntryToCloud = async (entry: Entry) => {
  if (!auth.currentUser) return;

  const entryRef = doc(db, 'users', auth.currentUser.uid, 'entries', entry.id);
  
  // 確保我們只存 URL，不存 Base64 (如果有的話要移除，理論上這時已經是 URL 了)
  // 如果 entry.imageUrl 還是 base64，這裡就不該傳入，但為了保險起見，App層級應處理好
  
  await setDoc(entryRef, entry, { merge: true });
};

// 刪除雲端資料
export const deleteEntryFromCloud = async (entryId: string, hasImage: boolean) => {
  if (!auth.currentUser) return;

  // 1. 刪除 Firestore 文件 (熱)
  try {
    await deleteDoc(doc(db, 'users', auth.currentUser.uid, 'entries', entryId));
  } catch (e) {
    console.warn("Firestore delete failed", e);
  }

  // 2. 如果有圖片，刪除 Storage 檔案 (冷)
  if (hasImage) {
    const storageRef = ref(storage, `users/${auth.currentUser.uid}/images/${entryId}.jpg`);
    try {
      await deleteObject(storageRef);
    } catch (e) {
      console.warn("Image delete failed or not found", e);
    }
  }
};

// 從雲端拉取所有資料 (用於登入後同步)
export const fetchAllFromCloud = async (): Promise<Entry[]> => {
  if (!auth.currentUser) return [];

  const q = query(collection(db, 'users', auth.currentUser.uid, 'entries'));
  const querySnapshot = await getDocs(q);
  
  return querySnapshot.docs.map(doc => doc.data() as Entry);
};