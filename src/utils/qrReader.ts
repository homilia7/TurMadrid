import jsQR from 'jsqr';
import QRCode from 'qrcode';

export interface QRScanResult {
  text: string;
  cropDataUrl?: string;
}

/**
 * Attempts to decode a QR code from an image data URL (PNG, JPG, WebP)
 * with multi-resolution scaling and contrast enhancements to reliably read real tickets.
 */
export async function decodeQRFromImage(dataUrl: string): Promise<QRScanResult | null> {
  return new Promise((resolve) => {
    if (!dataUrl || !dataUrl.startsWith('data:image')) {
      return resolve(null);
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const origW = img.naturalWidth || img.width;
        const origH = img.naturalHeight || img.height;

        // Scales to test: native, 1200px, 800px, 500px
        const maxDims = [Math.max(origW, origH), 1200, 800, 500];
        const testedScales: number[] = [];

        for (const targetMax of maxDims) {
          const scale = Math.min(1, targetMax / Math.max(origW, origH));
          if (testedScales.includes(scale) || scale <= 0) continue;
          testedScales.push(scale);

          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d', { willReadFrequently: true });
          if (!ctx) continue;

          canvas.width = Math.floor(origW * scale);
          canvas.height = Math.floor(origH * scale);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

          let imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          let code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: 'attemptBoth',
          });

          if (code && code.data) {
            let cropDataUrl: string | undefined = undefined;
            try {
              // Extract the physical cropped QR code from the original image
              const loc = code.location;
              const minX = Math.max(0, Math.min(loc.topLeftCorner.x, loc.bottomLeftCorner.x) / scale);
              const maxX = Math.min(origW, Math.max(loc.topRightCorner.x, loc.bottomRightCorner.x) / scale);
              const minY = Math.max(0, Math.min(loc.topLeftCorner.y, loc.topRightCorner.y) / scale);
              const maxY = Math.min(origH, Math.max(loc.bottomLeftCorner.y, loc.bottomRightCorner.y) / scale);

              const cropPad = Math.max(15, (maxX - minX) * 0.1);
              const cX = Math.max(0, minX - cropPad);
              const cY = Math.max(0, minY - cropPad);
              const cW = Math.min(origW - cX, (maxX - minX) + cropPad * 2);
              const cH = Math.min(origH - cY, (maxY - minY) + cropPad * 2);

              const cropCanvas = document.createElement('canvas');
              cropCanvas.width = cW;
              cropCanvas.height = cH;
              const cropCtx = cropCanvas.getContext('2d');
              if (cropCtx) {
                cropCtx.drawImage(img, cX, cY, cW, cH, 0, 0, cW, cH);
                cropDataUrl = cropCanvas.toDataURL('image/png');
              }
            } catch {
              // fallback without crop
            }

            return resolve({
              text: code.data,
              cropDataUrl,
            });
          }

          // Second attempt on this scale: increase contrast & binarize
          const data = imageData.data;
          for (let i = 0; i < data.length; i += 4) {
            const gray = (data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114);
            const binarized = gray < 128 ? 0 : 255;
            data[i] = binarized;
            data[i + 1] = binarized;
            data[i + 2] = binarized;
          }
          ctx.putImageData(imageData, 0, 0);

          code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: 'attemptBoth',
          });

          if (code && code.data) {
            return resolve({
              text: code.data,
            });
          }
        }

        resolve(null);
      } catch (err) {
        console.warn('Could not scan QR from image:', err);
        resolve(null);
      }
    };

    img.onerror = () => {
      resolve(null);
    };

    img.src = dataUrl;
  });
}

/**
 * Generates a crisp, high-resolution QR code data URL (PNG)
 * with maximum contrast and High error correction level for physical scanners.
 */
export async function generateLargeQR(text: string, size = 450): Promise<string> {
  if (!text || !text.trim()) return '';
  try {
    const url = await QRCode.toDataURL(text, {
      width: size,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
      errorCorrectionLevel: 'H',
    });
    return url;
  } catch (err) {
    console.error('Error generating large QR:', err);
    return '';
  }
}
