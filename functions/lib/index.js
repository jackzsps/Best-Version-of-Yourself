"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.scheduledArchiveEntries = void 0;
const logger = __importStar(require("firebase-functions/logger"));
const functions = __importStar(require("firebase-functions/v1"));
const admin = __importStar(require("firebase-admin"));
admin.initializeApp();
const db = admin.firestore();
const storage = admin.storage();
/**
 * 每月自動執行的排程函式，用於歸檔超過 6 個月的舊紀錄。
 * 執行時間：每個月 1 號的凌晨 00:00 (UTC)
 */
exports.scheduledArchiveEntries = functions
    .region("asia-east2") // 建議指定與您的 Firestore 相同的區域
    .pubsub.schedule("0 0 1 * *") // 每月 1 號午夜
    .timeZone("UTC") // 使用 UTC 以避免夏令時問題
    .onRun(async (context) => {
    logger.info("開始執行排程歸檔任務", { structuredData: true });
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const thresholdTimestamp = admin.firestore.Timestamp.fromDate(sixMonthsAgo);
    try {
        // 1. 取得所有使用者
        const usersSnapshot = await db.collection("users").get();
        if (usersSnapshot.empty) {
            logger.info("未找到任何使用者，歸檔任務結束。");
            return null;
        }
        // 2. 針對每個使用者，執行歸檔邏輯
        const archivePromises = usersSnapshot.docs.map(async (userDoc) => {
            const userId = userDoc.id;
            const entriesRef = db.collection('users').doc(userId).collection('entries');
            const q = entriesRef.where("date", "<", thresholdTimestamp);
            const entriesToArchive = await q.get();
            if (entriesToArchive.empty) {
                logger.info(`使用者 ${userId} 沒有需要歸檔的紀錄。`);
                return;
            }
            logger.info(`找到 ${entriesToArchive.size} 筆紀錄，準備為使用者 ${userId} 進行歸檔。`);
            const batch = db.batch();
            const storageUploadPromises = [];
            entriesToArchive.forEach((doc) => {
                const entry = doc.data();
                const entryId = doc.id;
                // 【防禦性檢查】確保日期欄位存在且為有效時間戳
                if (!entry.date || !(entry.date instanceof admin.firestore.Timestamp)) {
                    logger.warn(`紀錄 ${entryId} 的日期格式不正確，已跳過歸檔。`);
                    return; // 跳過此筆紀錄
                }
                // 準備上傳到 Storage
                const archivePath = `archive/${userId}/${entryId}.json`;
                const file = storage.bucket().file(archivePath);
                storageUploadPromises.push(file.save(JSON.stringify(entry), { contentType: "application/json" }));
                // 將刪除操作加入批次處理
                batch.delete(doc.ref);
            });
            // 等待所有檔案都上傳至 Storage
            await Promise.all(storageUploadPromises);
            // 執行批次刪除 Firestore 中的紀錄
            await batch.commit();
            logger.info(`成功為使用者 ${userId} 歸檔了 ${storageUploadPromises.length} 筆紀錄。`);
        });
        await Promise.all(archivePromises);
        logger.info("排程歸檔任務成功執行完畢。");
        return null;
    }
    catch (error) {
        logger.error("排程歸檔任務執行期間發生錯誤:", error);
        // 拋出錯誤以便在 Firebase 控制台收到失敗通知
        throw error;
    }
});
//# sourceMappingURL=index.js.map