import { create } from 'zustand';
import { AggregationScale, TemperatureMetric, TabType, FilterState } from '../types';

interface FilterStore extends FilterState {
  // Tab state
  activeTab: TabType;

  // Actions
  setActiveTab: (tab: TabType) => void;
  setDateRange: (start: Date | null, end: Date | null) => void;
  setScale: (scale: AggregationScale) => void;
  setMetric: (metric: TemperatureMetric) => void;
  setSelectedMonths: (months: number[]) => void;
  toggleMonth: (month: number) => void;
  clearMonths: () => void;
  selectAllMonths: () => void;
  setSeasonPreset: (season: 'winter' | 'spring' | 'summer' | 'fall') => void;
  setShowTrendLine: (show: boolean) => void;
  setMovingAverageWindow: (window: number) => void;
  resetFilters: () => void;
}

const DEFAULT_FILTERS: FilterState = {
  startDate: null,
  endDate: null,
  scale: 'monthly',
  metric: 'avg',
  selectedMonths: [],
  showTrendLine: false,
  movingAverageWindow: 30,
};

const SEASON_MONTHS = {
  winter: [11, 0, 1], // Dec, Jan, Feb
  spring: [2, 3, 4],  // Mar, Apr, May
  summer: [5, 6, 7],  // Jun, Jul, Aug
  fall: [8, 9, 10],   // Sep, Oct, Nov
};

export const useFilterStore = create<FilterStore>((set) => ({
  ...DEFAULT_FILTERS,
  activeTab: 'warming',

  setActiveTab: (tab) => set({ activeTab: tab }),

  setDateRange: (start, end) => set({ startDate: start, endDate: end }),

  setScale: (scale) => set({ scale }),

  setMetric: (metric) => set({ metric }),

  setSelectedMonths: (months) => set({ selectedMonths: months }),

  toggleMonth: (month) =>
    set((state) => {
      const months = state.selectedMonths.includes(month)
        ? state.selectedMonths.filter((m) => m !== month)
        : [...state.selectedMonths, month].sort((a, b) => a - b);
      return { selectedMonths: months };
    }),

  clearMonths: () => set({ selectedMonths: [] }),

  selectAllMonths: () => set({ selectedMonths: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] }),

  setSeasonPreset: (season) => set({ selectedMonths: SEASON_MONTHS[season] }),

  setShowTrendLine: (show) => set({ showTrendLine: show }),

  setMovingAverageWindow: (window) => set({ movingAverageWindow: window }),

  resetFilters: () => set(DEFAULT_FILTERS),
}));
