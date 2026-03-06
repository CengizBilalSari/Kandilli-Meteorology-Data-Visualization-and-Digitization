import { useEffect, useRef, useState } from 'react';
import { useDailyViewerStore } from '../store/useDailyViewerStore';
import { loadTiffAsImageData, renderToCanvas, getTiffPath } from '../utils/tiffUtils';
import { getTiffFilename } from '../constants/turkishMonths';

export function useTiffLoader() {
  const { selectedDate, tiffZoom, setTiffLoading, setTiffError } = useDailyViewerStore();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [imageData, setImageData] = useState<ImageData | null>(null);
  const [dimensions, setDimensions] = useState<{ width: number; height: number } | null>(null);

  // Load TIFF when date changes
  useEffect(() => {
    if (!selectedDate) {
      setImageData(null);
      setDimensions(null);
      return;
    }

    let cancelled = false;

    const loadImage = async () => {
      setTiffLoading(true);
      setTiffError(null);

      try {
        const result = await loadTiffAsImageData(selectedDate);

        if (cancelled) return;

        if (result) {
          setImageData(result.imageData);
          setDimensions({ width: result.width, height: result.height });
          setTiffError(null);
        } else {
          setImageData(null);
          setDimensions(null);
          setTiffError('Document not available for this date');
        }
      } catch (error) {
        if (!cancelled) {
          setImageData(null);
          setDimensions(null);
          setTiffError('Failed to load document');
        }
      } finally {
        if (!cancelled) {
          setTiffLoading(false);
        }
      }
    };

    loadImage();

    return () => {
      cancelled = true;
    };
  }, [selectedDate, setTiffLoading, setTiffError]);

  // Render to canvas when imageData or zoom changes
  useEffect(() => {
    if (!canvasRef.current || !imageData) return;

    renderToCanvas(canvasRef.current, imageData, tiffZoom);
  }, [imageData, tiffZoom]);

  const tiffFilename = selectedDate ? getTiffFilename(selectedDate) : null;
  const tiffPath = selectedDate ? getTiffPath(selectedDate) : null;

  return {
    canvasRef,
    dimensions,
    hasImage: imageData !== null,
    tiffFilename,
    tiffPath,
  };
}
