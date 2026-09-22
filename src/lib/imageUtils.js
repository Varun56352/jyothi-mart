/**
 * Compresses an image file using browser Canvas to a lightweight WebP/JPEG base64 data URL.
 * Automatically scales down high-res phone camera shots (typically 3-10MB) to ~60-120KB.
 */
export async function compressImage(file, { maxWidth = 1000, maxHeight = 1000, quality = 0.82 } = {}) {
  return new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith('image/')) {
      return reject(new Error('Selected file is not an image'));
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read image file'));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error('Failed to decode image data'));
      img.onload = () => {
        let { width, height } = img;

        // Proportional resize
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return reject(new Error('Failed to get canvas 2D context'));
        }

        // Draw image onto canvas
        ctx.drawImage(img, 0, 0, width, height);

        // Attempt export as webp, fallback to jpeg
        let dataUrl;
        try {
          dataUrl = canvas.toDataURL('image/webp', quality);
          // Some older browsers return image/png if webp is unsupported
          if (!dataUrl.startsWith('data:image/webp')) {
            dataUrl = canvas.toDataURL('image/jpeg', quality);
          }
        } catch {
          dataUrl = canvas.toDataURL('image/jpeg', quality);
        }

        resolve(dataUrl);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}
