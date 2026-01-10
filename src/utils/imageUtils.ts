/**
 * 圖片壓縮工具
 * 將圖片限制在指定寬度內，並調整品質以減少檔案大小。
 * * @param file 原始 File 物件 (來自 input type="file")
 * @param maxWidth 最大寬度 (預設 1280px，極致效能版設定)
 * @param quality 圖片品質 0.1~1.0 (預設 0.7，兼顧清晰度與檔案大小)
 * @returns Promise<string> 壓縮後的 Base64 Data URL
 */
export const compressImage = (
  file: File, 
  maxWidth: number = 1280, 
  quality: number = 0.7
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // 計算等比例縮放
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context not available'));
          return;
        }
        
        // 繪製圖片到 Canvas
        ctx.drawImage(img, 0, 0, width, height);

        // 輸出壓縮後的 Data URL (強制使用 jpeg 格式以獲得最佳壓縮率)
        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedDataUrl);
      };
      
      img.onerror = (err) => reject(new Error('Image load failed'));
    };
    
    reader.onerror = (err) => reject(new Error('File read failed'));
  });
};