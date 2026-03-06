import { create } from 'zustand';

type MetricType = 'avgTemp' | 'minTemp' | 'maxTemp';

interface CyclicalityStore {
  // Filters - null means use full data range
  startYear: number | null;
  endYear: number | null;
  metric: MetricType;

  // Display options
  smoothingWindow: number;
  selectedDecades: number[];  // decade start years - will be set from data
  overlayMode: boolean;
  normalizeToBaseline: boolean;
  showTrendLine: boolean;
  selectedSeason: number | null;

  // Actions
  setStartYear: (year: number | null) => void;
  setEndYear: (year: number | null) => void;
  setMetric: (metric: MetricType) => void;
  setSmoothingWindow: (window: number) => void;
  setSelectedDecades: (decades: number[]) => void;
  toggleDecade: (decade: number) => void;
  setOverlayMode: (overlay: boolean) => void;
  setNormalizeToBaseline: (normalize: boolean) => void;
  setShowTrendLine: (show: boolean) => void;
  setSelectedSeason: (season: number | null) => void;
  initializeFromData: (minYear: number, maxYear: number, availableDecades: number[]) => void;
  resetToDefaults: () => void;
}

const DEFAULT_STATE = {
  startYear: null as number | null,  // Will be set from actual data
  endYear: null as number | null,    // Will be set from actual data
  metric: 'avgTemp' as MetricType,
  smoothingWindow: 5,
  selectedDecades: [] as number[],   // Will be set from actual data
  overlayMode: true,
  normalizeToBaseline: false,
  showTrendLine: true,
  selectedSeason: null,
};

export const useCyclicalityStore = create<CyclicalityStore>((set, get) => ({
  ...DEFAULT_STATE,

  setStartYear: (year) => set({ startYear: year }),
  setEndYear: (year) => set({ endYear: year }),
  setMetric: (metric) => set({ metric: metric }),
  setSmoothingWindow: (window) => set({ smoothingWindow: window }),
  setSelectedDecades: (decades) => set({ selectedDecades: decades }),
  toggleDecade: (decade) => set((state) => {
    if (state.selectedDecades.includes(decade)) {
      return { selectedDecades: state.selectedDecades.filter(d => d !== decade) };
    } else {
      return { selectedDecades: [...state.selectedDecades, decade].sort() };
    }
  }),
  setOverlayMode: (overlay) => set({ overlayMode: overlay }),
  setNormalizeToBaseline: (normalize) => set({ normalizeToBaseline: normalize }),
  setShowTrendLine: (show) => set({ showTrendLine: show }),
  setSelectedSeason: (season) => set({ selectedSeason: season }),

  // Initialize from actual data (called once when data loads)
  initializeFromData: (minYear, maxYear, availableDecades) => {
    const state = get();
    if (state.startYear === null) {
      set({ startYear: minYear });
    }
    if (state.endYear === null) {
      set({ endYear: maxYear });
    }
    // Select a few representative decades if none selected
    if (state.selectedDecades.length === 0 && availableDecades.length > 0) {
      // Select every other decade, or all if few
      const selected = availableDecades.length <= 4
        ? availableDecades
        : availableDecades.filter((_, i) => i % 2 === 0);
      set({ selectedDecades: selected });
    }
  },

  resetToDefaults: () => set(DEFAULT_STATE),
}));
