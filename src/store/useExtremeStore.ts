import { create } from 'zustand';

type AnalysisType = 'heat' | 'cold' | 'both';
type MetricType = 'avgTemp' | 'minTemp' | 'maxTemp';

interface ExtremeStore {
  // Filters - null means use full data range
  startYear: number | null;
  endYear: number | null;
  analysisType: AnalysisType;
  metric: MetricType;

  // Thresholds
  heatThreshold: number;
  veryHotThreshold: number;
  coldThreshold: number;
  veryColdThreshold: number;
  tropicalNightThreshold: number;

  // Display options
  showTrendLine: boolean;
  selectedSeason: number | null; // null = all, 0-3 = specific season

  // Actions
  setStartYear: (year: number | null) => void;
  setEndYear: (year: number | null) => void;
  setAnalysisType: (type: AnalysisType) => void;
  setMetric: (metric: MetricType) => void;
  setHeatThreshold: (value: number) => void;
  setVeryHotThreshold: (value: number) => void;
  setColdThreshold: (value: number) => void;
  setVeryColdThreshold: (value: number) => void;
  setTropicalNightThreshold: (value: number) => void;
  setShowTrendLine: (show: boolean) => void;
  setSelectedSeason: (season: number | null) => void;
  initializeYearRange: (minYear: number, maxYear: number) => void;
  resetToDefaults: () => void;
}

const DEFAULT_STATE = {
  startYear: null as number | null,  // Will be set from actual data
  endYear: null as number | null,    // Will be set from actual data
  analysisType: 'both' as AnalysisType,
  metric: 'maxTemp' as MetricType,
  heatThreshold: 30,
  veryHotThreshold: 35,
  coldThreshold: 0,
  veryColdThreshold: -5,
  tropicalNightThreshold: 20,
  showTrendLine: true,
  selectedSeason: null,
};

export const useExtremeStore = create<ExtremeStore>((set, get) => ({
  ...DEFAULT_STATE,

  setStartYear: (year) => set({ startYear: year }),
  setEndYear: (year) => set({ endYear: year }),
  setAnalysisType: (type) => set({ analysisType: type }),
  setMetric: (metric) => set({ metric: metric }),
  setHeatThreshold: (value) => set({ heatThreshold: value }),
  setVeryHotThreshold: (value) => set({ veryHotThreshold: value }),
  setColdThreshold: (value) => set({ coldThreshold: value }),
  setVeryColdThreshold: (value) => set({ veryColdThreshold: value }),
  setTropicalNightThreshold: (value) => set({ tropicalNightThreshold: value }),
  setShowTrendLine: (show) => set({ showTrendLine: show }),
  setSelectedSeason: (season) => set({ selectedSeason: season }),

  // Initialize year range from actual data (called once when data loads)
  initializeYearRange: (minYear, maxYear) => {
    const state = get();
    // Only set if not already set by user
    if (state.startYear === null) {
      set({ startYear: minYear });
    }
    if (state.endYear === null) {
      set({ endYear: maxYear });
    }
  },

  resetToDefaults: () => set(DEFAULT_STATE),
}));
