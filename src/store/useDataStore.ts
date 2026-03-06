import { create } from 'zustand';
import { DailyRecord, DataInfo } from '../types';
import { parseExcelFile, hourlyToDailyRecords } from '../utils/dataParser';

interface DataStore {
  // Data
  dailyRecords: DailyRecord[];
  isLoading: boolean;
  error: string | null;
  dataInfo: DataInfo | null;

  // Actions
  loadData: (file: File) => Promise<void>;
  setDailyRecords: (records: DailyRecord[]) => void;
  clearData: () => void;
  getDailyRecord: (date: Date) => DailyRecord | undefined;
  getRecordsInRange: (start: Date, end: Date) => DailyRecord[];
}

export const useDataStore = create<DataStore>((set, get) => ({
  dailyRecords: [],
  isLoading: false,
  error: null,
  dataInfo: null,

  loadData: async (file: File) => {
    set({ isLoading: true, error: null });

    try {
      const hourlyRecords = await parseExcelFile(file);
      const dailyRecords = hourlyToDailyRecords(hourlyRecords);

      // Sort by date
      dailyRecords.sort((a, b) => a.date.getTime() - b.date.getTime());

      // Calculate data info
      const dataInfo = calculateDataInfo(dailyRecords);

      set({
        dailyRecords,
        dataInfo,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to load data',
      });
    }
  },

  setDailyRecords: (records: DailyRecord[]) => {
    const sortedRecords = [...records].sort((a, b) => a.date.getTime() - b.date.getTime());
    const dataInfo = calculateDataInfo(sortedRecords);
    set({ dailyRecords: sortedRecords, dataInfo });
  },

  clearData: () => {
    set({
      dailyRecords: [],
      dataInfo: null,
      error: null,
    });
  },

  getDailyRecord: (date: Date) => {
    const { dailyRecords } = get();
    const dateStr = date.toISOString().split('T')[0];
    return dailyRecords.find(r => r.date.toISOString().split('T')[0] === dateStr);
  },

  getRecordsInRange: (start: Date, end: Date) => {
    const { dailyRecords } = get();
    return dailyRecords.filter(r => r.date >= start && r.date <= end);
  },
}));

function calculateDataInfo(records: DailyRecord[]): DataInfo {
  if (records.length === 0) {
    return {
      startDate: null,
      endDate: null,
      totalDays: 0,
      completeDataDays: 0,
      partialDataDays: 0,
      missingDataDays: 0,
      tiffFilesAvailable: 0,
    };
  }

  const completeDays = records.filter(r => r.dataQuality === 'complete').length;
  const partialDays = records.filter(r => r.dataQuality === 'partial').length;
  const missingDays = records.filter(r => r.dataQuality === 'missing').length;

  return {
    startDate: records[0].date,
    endDate: records[records.length - 1].date,
    totalDays: records.length,
    completeDataDays: completeDays,
    partialDataDays: partialDays,
    missingDataDays: missingDays,
    tiffFilesAvailable: 0, // Will be updated when TIFF availability is checked
  };
}
