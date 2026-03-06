import { create } from 'zustand';

interface DailyViewerStore {
  selectedDate: Date | null;
  tiffZoom: number;
  tiffLoading: boolean;
  tiffError: string | null;

  setSelectedDate: (date: Date | null) => void;
  goToPreviousDay: () => void;
  goToNextDay: () => void;
  setTiffZoom: (zoom: number) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  resetZoom: () => void;
  setTiffLoading: (loading: boolean) => void;
  setTiffError: (error: string | null) => void;
}

export const useDailyViewerStore = create<DailyViewerStore>((set, get) => ({
  selectedDate: null,
  tiffZoom: 1,
  tiffLoading: false,
  tiffError: null,

  setSelectedDate: (date) => set({ selectedDate: date, tiffError: null }),

  goToPreviousDay: () => {
    const { selectedDate } = get();
    if (selectedDate) {
      const prev = new Date(selectedDate);
      prev.setDate(prev.getDate() - 1);
      set({ selectedDate: prev, tiffError: null });
    }
  },

  goToNextDay: () => {
    const { selectedDate } = get();
    if (selectedDate) {
      const next = new Date(selectedDate);
      next.setDate(next.getDate() + 1);
      set({ selectedDate: next, tiffError: null });
    }
  },

  setTiffZoom: (zoom) => set({ tiffZoom: Math.max(0.5, Math.min(4, zoom)) }),

  zoomIn: () => {
    const { tiffZoom } = get();
    set({ tiffZoom: Math.min(4, tiffZoom + 0.25) });
  },

  zoomOut: () => {
    const { tiffZoom } = get();
    set({ tiffZoom: Math.max(0.5, tiffZoom - 0.25) });
  },

  resetZoom: () => set({ tiffZoom: 1 }),

  setTiffLoading: (loading) => set({ tiffLoading: loading }),

  setTiffError: (error) => set({ tiffError: error }),
}));
