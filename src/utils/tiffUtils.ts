import { getTiffFilename } from '../constants/turkishMonths';

// Get the TIFF file path for a given date
export function getTiffPath(date: Date): string {
  const filename = getTiffFilename(date);
  return `/gunluk/${filename}`;
}

// Check if a TIFF file exists (returns a promise)
export async function checkTiffExists(date: Date): Promise<boolean> {
  const path = getTiffPath(date);
  try {
    const response = await fetch(path, { method: 'HEAD' });
    return response.ok;
  } catch {
    return false;
  }
}

// Load TIFF file and decode it
export async function loadTiffAsImageData(date: Date): Promise<{
  imageData: ImageData;
  width: number;
  height: number;
} | null> {
  const path = getTiffPath(date);

  try {
    const response = await fetch(path);
    if (!response.ok) {
      return null;
    }

    const buffer = await response.arrayBuffer();

    // Dynamic import of UTIF to avoid SSR issues
    const UTIF = await import('utif');

    // Decode TIFF
    const ifds = UTIF.decode(buffer);
    if (!ifds || ifds.length === 0) {
      return null;
    }

    const firstPage = ifds[0];
    UTIF.decodeImage(buffer, firstPage);

    const rgba = UTIF.toRGBA8(firstPage);
    const width = firstPage.width;
    const height = firstPage.height;

    const imageData = new ImageData(
      new Uint8ClampedArray(rgba),
      width,
      height
    );

    return { imageData, width, height };
  } catch (error) {
    console.error('Failed to load TIFF:', error);
    return null;
  }
}

// Render ImageData to a canvas
export function renderToCanvas(
  canvas: HTMLCanvasElement,
  imageData: ImageData,
  zoom: number = 1
): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Set canvas size based on zoom
  const width = imageData.width * zoom;
  const height = imageData.height * zoom;

  canvas.width = width;
  canvas.height = height;

  // Create temporary canvas for original image
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = imageData.width;
  tempCanvas.height = imageData.height;
  const tempCtx = tempCanvas.getContext('2d');
  if (!tempCtx) return;

  tempCtx.putImageData(imageData, 0, 0);

  // Draw scaled image
  ctx.imageSmoothingEnabled = zoom < 1;
  ctx.drawImage(tempCanvas, 0, 0, width, height);
}
