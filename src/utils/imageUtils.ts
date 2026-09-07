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

/**
 * Takes a crisp screenshot/crop of the framed region inside a container/viewfinder
 */
export async function captureFramedArea(
  imgElement: HTMLImageElement,
  frameElement: HTMLElement,
  outputSize = 700
): Promise<string> {
  return new Promise((resolve) => {
    try {
      const imgRect = imgElement.getBoundingClientRect();
      const frameRect = frameElement.getBoundingClientRect();

      // Determine the crop coordinates relative to the rendered image element
      const scaleX = imgElement.naturalWidth / imgRect.width;
      const scaleY = imgElement.naturalHeight / imgRect.height;

      const cropX = Math.max(0, (frameRect.left - imgRect.left) * scaleX);
      const cropY = Math.max(0, (frameRect.top - imgRect.top) * scaleY);
      const cropWidth = Math.min(imgElement.naturalWidth - cropX, Math.max(10, frameRect.width * scaleX));
      const cropHeight = Math.min(imgElement.naturalHeight - cropY, Math.max(10, frameRect.height * scaleY));

      const canvas = document.createElement('canvas');
      canvas.width = outputSize;
      canvas.height = outputSize;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        return resolve('');
      }

      // White background for optimal QR contrast
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, outputSize, outputSize);

      ctx.drawImage(
        imgElement,
        cropX,
        cropY,
        cropWidth,
        cropHeight,
        0,
        0,
        outputSize,
        outputSize
      );

      const croppedUrl = canvas.toDataURL('image/jpeg', 0.92);
      resolve(croppedUrl);
    } catch (err) {
      console.error('Error capturing framed area:', err);
      resolve('');
    }
  });
}

