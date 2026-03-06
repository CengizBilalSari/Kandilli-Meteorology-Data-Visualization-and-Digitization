import { create } from 'zustand';
import { SeasonDetectionMethod, TemperatureMetric } from '../types';
import {
  DEFAULT_WARM_SEASON_THRESHOLD,
  DEFAULT_COOL_SEASON_THRESHOLD,
  DEFAULT_CONSECUTIVE_DAYS,
  DEFAULT_MOVING_AVERAGE_WINDOW,
  DEFAULT_SUMMER_LIKE_THRESHOLD,
  DEFAULT_WINTER_LIKE_THRESHOLD,
} from '../constants/thresholds';

interface SeasonalStore {
  // Detection settings
  method: SeasonDetectionMethod;
  warmThreshold: number;
  coolThreshold: number;
  consecutiveDays: number;
  movingAverageWindow: number;
  summerLikeThreshold: number;
  winterLikeThreshold: number;
  metric: TemperatureMetric;

  // Year range
  startYear: number | null;
  endYear: number | null;

  // Actions
  setMethod: (method: SeasonDetectionMethod) => void;
  setWarmThreshold: (value: number) => void;
  setCoolThreshold: (value: number) => void;
  setConsecutiveDays: (value: number) => void;
  setMovingAverageWindow: (value: number) => void;
  setSummerLikeThreshold: (value: number) => void;
  setWinterLikeThreshold: (value: number) => void;
  setMetric: (metric: TemperatureMetric) => void;
  setYearRange: (start: number | null, end: number | null) => void;
  resetToDefaults: () => void;
}

const DEFAULT_STATE = {
  method: 'consecutive' as SeasonDetectionMethod,
  warmThreshold: DEFAULT_WARM_SEASON_THRESHOLD,
  coolThreshold: DEFAULT_COOL_SEASON_THRESHOLD,
  consecutiveDays: DEFAULT_CONSECUTIVE_DAYS,
  movingAverageWindow: DEFAULT_MOVING_AVERAGE_WINDOW,
  summerLikeThreshold: DEFAULT_SUMMER_LIKE_THRESHOLD,
  winterLikeThreshold: DEFAULT_WINTER_LIKE_THRESHOLD,
  metric: 'avg' as TemperatureMetric,
  startYear: null,
  endYear: null,
};

export const useSeasonalStore = create<SeasonalStore>((set) => ({
  ...DEFAULT_STATE,

  setMethod: (method) => set({ method }),
  setWarmThreshold: (value) => set({ warmThreshold: value }),
  setCoolThreshold: (value) => set({ coolThreshold: value }),
  setConsecutiveDays: (value) => set({ consecutiveDays: value }),
  setMovingAverageWindow: (value) => set({ movingAverageWindow: value }),
  setSummerLikeThreshold: (value) => set({ summerLikeThreshold: value }),
  setWinterLikeThreshold: (value) => set({ winterLikeThreshold: value }),
  setMetric: (metric) => set({ metric }),
  setYearRange: (start, end) => set({ startYear: start, endYear: end }),
  resetToDefaults: () => set(DEFAULT_STATE),
}));
