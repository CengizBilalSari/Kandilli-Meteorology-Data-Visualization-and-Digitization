import { create } from 'zustand';

type MetricType = 'avgTemp' | 'minTemp' | 'maxTemp';
type VariabilityMetric = 'standardDeviation' | 'dailyRange' | 'monthlySpread' | 'coefficientOfVariation';

interface VariabilityStore {
  // Filters - null means use full data range
  startYear: number | null;
  endYear: number | null;
  metric: MetricType;
  variabilityMetric: VariabilityMetric;

  // Display options
  selectedSeason: number | null; // null = all, 0-3 = specific season
  showDecadeComparison: boolean;
  smoothingWindow: number;

  // Actions
  setStartYear: (year: number | null) => void;
  setEndYear: (year: number | null) => void;
  setMetric: (metric: MetricType) => void;
  setVariabilityMetric: (metric: VariabilityMetric) => void;
  setSelectedSeason: (season: number | null) => void;
  setShowDecadeComparison: (show: boolean) => void;
  setSmoothingWindow: (window: number) => void;
  initializeYearRange: (minYear: number, maxYear: number) => void;
  resetToDefaults: () => void;
}

const DEFAULT_STATE = {
  startYear: null as number | null,  // Will be set from actual data
  endYear: null as number | null,    // Will be set from actual data
  metric: 'avgTemp' as MetricType,
  variabilityMetric: 'standardDeviation' as VariabilityMetric,
  selectedSeason: null,
  showDecadeComparison: true,
  smoothingWindow: 5,
};

export const useVariabilityStore = create<VariabilityStore>((set, get) => ({
  ...DEFAULT_STATE,

  setStartYear: (year) => set({ startYear: year }),
  setEndYear: (year) => set({ endYear: year }),
  setMetric: (metric) => set({ metric: metric }),
  setVariabilityMetric: (metric) => set({ variabilityMetric: metric }),
  setSelectedSeason: (season) => set({ selectedSeason: season }),
  setShowDecadeComparison: (show) => set({ showDecadeComparison: show }),
  setSmoothingWindow: (window) => set({ smoothingWindow: window }),

  // Initialize year range from actual data (called once when data loads)
  initializeYearRange: (minYear, maxYear) => {
    const state = get();
    if (state.startYear === null) {
      set({ startYear: minYear });
    }
    if (state.endYear === null) {
      set({ endYear: maxYear });
    }
  },

  resetToDefaults: () => set(DEFAULT_STATE),
}));
