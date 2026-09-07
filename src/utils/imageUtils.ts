/**
 * Utilities for optimizing images and avoiding localStorage quota exceeded errors
 */

export async function optimizeImageForUpload(
  dataUrl: string,
  maxDimension = 1600,
  quality = 0.82
): Promise<{ dataUrl: string; fileSize: string }> {
  return new Promise((resolve) => {
    if (!dataUrl || !dataUrl.startsWith('data:image')) {
      const sizeKb = Math.round((dataUrl.length * 0.75) / 1024);
      return resolve({ dataUrl, fileSize: `${sizeKb} KB` });
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const origW = img.naturalWidth || img.width;
        const origH = img.naturalHeight || img.height;
        const maxSide = Math.max(origW, origH);

        let targetW = origW;
        let targetH = origH;

        if (maxSide > maxDimension) {
          const ratio = maxDimension / maxSide;
          targetW = Math.round(origW * ratio);
          targetH = Math.round(origH * ratio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = targetW;
        canvas.height = targetH;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          const sizeKb = Math.round((dataUrl.length * 0.75) / 1024);
          return resolve({ dataUrl, fileSize: `${sizeKb} KB` });
        }

        ctx.drawImage(img, 0, 0, targetW, targetH);
        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
        const sizeKb = Math.round((compressedDataUrl.length * 0.75) / 1024);
        resolve({
          dataUrl: compressedDataUrl,
          fileSize: `${sizeKb} KB`,
        });
      } catch (err) {
        console.warn('Error compressing image, using original:', err);
        const sizeKb = Math.round((dataUrl.length * 0.75) / 1024);
        resolve({ dataUrl, fileSize: `${sizeKb} KB` });
      }
    };

    img.onerror = () => {
      const sizeKb = Math.round((dataUrl.length * 0.75) / 1024);
      resolve({ dataUrl, fileSize: `${sizeKb} KB` });
    };

    img.src = dataUrl;
  });
}
