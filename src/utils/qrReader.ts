import jsQR from 'jsqr';
import QRCode from 'qrcode';

/**
 * Attempts to decode a QR code from an image data URL (PNG, JPG, WebP)
 */
export async function decodeQRFromImage(dataUrl: string): Promise<string | null> {
  return new Promise((resolve) => {
    if (!dataUrl || !dataUrl.startsWith('data:image')) {
      return resolve(null);
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) return resolve(null);

        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: 'attemptBoth',
        });

        if (code && code.data) {
          resolve(code.data);
        } else {
          resolve(null);
        }
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
export async function generateLargeQR(text: string, size = 420): Promise<string> {
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
