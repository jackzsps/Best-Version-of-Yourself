
import { collection, query, where, getDocs, writeBatch, Timestamp } from "firebase/firestore";
import { ref, uploadString, getDownloadURL } from "firebase/storage";
import { db, storage } from "../utils/firebase";
import { Entry } from "@shared/types";

const ARCHIVE_THRESHOLD_MONTHS = 6;

/**
 * 將 Firestore 中超過 ARCHIVE_THRESHOLD_MONTHS 的舊資料歸檔至 Google Cloud Storage
 */
export const archiveOldEntries = async (userId: string): Promise<void> => {
  try {
    const thresholdDate = new Date();
    thresholdDate.setMonth(thresholdDate.getMonth() - ARCHIVE_THRESHOLD_MONTHS);
    const thresholdTimestamp = Timestamp.fromDate(thresholdDate);

    const entriesRef = collection(db, "users", userId, "entries");
    const q = query(entriesRef, where("date", "<", thresholdTimestamp));

    const querySnapshot = await getDocs(q);
    const batch = writeBatch(db);

    for (const doc of querySnapshot.docs) {
      const entry = doc.data() as Entry;
      const entryId = doc.id;
      const archivePath = `archive/${userId}/${entryId}.json`;
      const storageRef = ref(storage, archivePath);

      // 1. 將資料上傳至 GCS
      await uploadString(storageRef, JSON.stringify(entry));

      // 2. 將 Firestore 中的文件加入批次刪除
      batch.delete(doc.ref);
    }

    // 3. 執行批次刪除
    await batch.commit();

    console.log("成功歸檔舊資料");

  } catch (error) {
    console.error("歸檔失敗:", error);
    throw error;
  }
};

/**
 * 從 Google Cloud Storage 讀取已歸檔的資料
 */
export const getArchivedEntries = async (userId: string): Promise<Entry[]> => {
  try {
    const archivePath = `archive/${userId}/`;
    const storageRef = ref(storage, archivePath);
    // 這是一個簡化的範例，實際應用中您可能需要更複雜的邏輯來列出所有歸檔的檔案
    // 例如，您可以使用 Cloud Functions 來取得檔案列表
    const downloadURL = await getDownloadURL(storageRef);

    // 從 downloadURL 下載並解析 JSON 內容
    const response = await fetch(downloadURL);
    const entries: Entry[] = await response.json();

    return entries;
  } catch (error) {
    console.error("讀取歸檔資料失敗:", error);
    throw error;
  }
};
