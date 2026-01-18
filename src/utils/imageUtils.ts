import imageCompression from 'browser-image-compression';

/**
 * 圖片壓縮工具
 * 使用 browser-image-compression 處理壓縮與 EXIF 旋轉問題。
 * 將圖片限制在指定寬度內，並調整品質以減少檔案大小。
 * @param file 原始 File 物件 (來自 input type="file")
 * @param maxWidth 最大寬度 (預設 1280px，保留收據細節)
 * @param quality 圖片品質 0.1~1.0 (預設 0.7，兼顧 AI 辨識率與檔案大小)
 * @returns Promise<string> 壓縮後的 Base64 Data URL
 */
export const compressImage = async (
  file: File, 
  maxWidth: number = 1280, 
  quality: number = 0.7
): Promise<string> => {
  const options = {
    maxSizeMB: 0.8, // 設定為 0.8MB，實測通常產出 150KB-400KB，大幅節省空間
    maxWidthOrHeight: maxWidth,
    useWebWorker: true,
    initialQuality: quality,
    fileType: 'image/jpeg' as const,
  };

  try {
    // browser-image-compression 自動處理 EXIF 旋轉
    const compressedFile = await imageCompression(file, options);
    // 轉回 Data URL
    return await imageCompression.getDataUrlFromFile(compressedFile);
  } catch (error) {
    console.error('Image compression failed:', error);
    throw new Error('Image compression failed');
  }
};
