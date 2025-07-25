import Canvas from 'react-native-canvas';
import RNFS from 'react-native-fs';
import { Image, Platform } from 'react-native';
import { v4 as uuidv4 } from 'uuid';

export async function generateOverlayThumbnail(thumbnailUri) {
  console.log('[OverlayUtil] 🧩 Starting overlay generation for:', thumbnailUri);

  return new Promise(async (resolve, reject) => {
    try {
      const canvas = new Canvas();
      const ctx = canvas.getContext('2d');

      const img = new Image();
      img.crossOrigin = 'anonymous';

      img.onload = async () => {
        canvas.width = img.width;
        canvas.height = img.height;

        // Draw the thumbnail
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        // Play icon settings
        const size = canvas.width / 4;
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;

        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.beginPath();
        ctx.arc(centerX, centerY, size * 0.6, 0, Math.PI * 2, true);
        ctx.fill();

        // Draw play triangle
        ctx.beginPath();
        ctx.moveTo(centerX - size / 3, centerY - size / 2.5);
        ctx.lineTo(centerX + size / 2, centerY);
        ctx.lineTo(centerX - size / 3, centerY + size / 2.5);
        ctx.closePath();
        ctx.fillStyle = '#ffffff';
        ctx.fill();

        const dataUrl = await canvas.toDataURL('image/jpeg');

        // Remove prefix
        const base64Data = dataUrl.replace(/^data:image\/jpeg;base64,/, '');
        const filename = `thumb-${uuidv4()}.jpg`;
        const filePath = `${RNFS.CachesDirectoryPath}/${filename}`;

        await RNFS.writeFile(filePath, base64Data, 'base64');
        const finalUri = Platform.OS === 'android' ? `file://${filePath}` : filePath;

        console.log('[OverlayUtil] ✅ Overlay generated:', finalUri);
        resolve(finalUri);
      };

      img.onerror = (e) => {
        console.error('[OverlayUtil] ❌ Error loading thumbnail:', e);
        reject(e);
      };

      img.src = thumbnailUri;
    } catch (e) {
      console.error('[OverlayUtil] ❌ Error generating overlay:', e);
      reject(e);
    }
  });
}
