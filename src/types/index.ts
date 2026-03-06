// Raw hourly record from Excel
export interface HourlyRecord {
  date: Date;
  hours: (number | null)[]; // 24 values, null for missing data
}

// Processed daily record
export interface DailyRecord {
  date: Date;
  year: number;
  month: number; // 0-11
  day: number;
  dayOfYear: number;
  avgTemp: number | null;
  minTemp: number | null;
  maxTemp: number | null;
  hourlyTemps: (number | null)[]; // Original 24 hourly values
  dataQuality: 'complete' | 'partial' | 'missing';
  validHourCount: number;
}

// Aggregated record for different time scales
export interface AggregatedRecord {
  periodStart: Date;
  periodEnd: Date;
  periodLabel: string;
  scale: AggregationScale;
  avgTemp: number | null;
  minTemp: number | null;
  maxTemp: number | null;
  recordCount: number;
}

// Aggregation scales
export type AggregationScale = 'daily' | 'weekly' | 'monthly' | 'seasonal' | 'yearly';

// Temperature metric type
export type TemperatureMetric = 'avg' | 'min' | 'max';

// Season detection method
export type SeasonDetectionMethod = 'consecutive' | 'movingAverage';

// Season type
export type SeasonType = 'warm' | 'cool';

// Season boundary info
export interface SeasonBoundary {
  year: number;
  seasonType: SeasonType;
  startDate: Date | null;
  endDate: Date | null;
  startDayOfYear: number | null;
  endDayOfYear: number | null;
  duration: number | null;
}

// Season statistics per year
export interface YearlySeasonStats {
  year: number;
  warmSeasonStart: number | null; // Day of year
  warmSeasonEnd: number | null;
  coolSeasonStart: number | null;
  coolSeasonEnd: number | null;
  warmSeasonDuration: number | null;
  coolSeasonDuration: number | null;
  summerLikeDays: number;
  winterLikeDays: number;
}

// Temperature category
export interface TemperatureCategory {
  name: string;
  minTemp: number;
  maxTemp: number;
  color: string;
}

// Filter state
export interface FilterState {
  startDate: Date | null;
  endDate: Date | null;
  scale: AggregationScale;
  metric: TemperatureMetric;
  selectedMonths: number[]; // 0-11
  showTrendLine: boolean;
  movingAverageWindow: number;
}

// Tab type
export type TabType = 'warming' | 'seasonal' | 'daily';

// App state
export interface AppState {
  activeTab: TabType;
  dataLoaded: boolean;
  isLoading: boolean;
  error: string | null;
}

// Data info
export interface DataInfo {
  startDate: Date | null;
  endDate: Date | null;
  totalDays: number;
  completeDataDays: number;
  partialDataDays: number;
  missingDataDays: number;
  tiffFilesAvailable: number;
}
