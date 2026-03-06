import { useMemo } from 'react';
import { useDataStore } from '../store/useDataStore';

export interface DataRange {
  minYear: number | null;
  maxYear: number | null;
  minDate: Date | null;
  maxDate: Date | null;
  isLoaded: boolean;
  availableYears: number[];
  availableDecades: number[];
}

/**
 * Global hook for data range - single source of truth
 * All components should use this instead of hardcoded values
 */
export function useDataRange(): DataRange {
  const { dataInfo, dailyRecords } = useDataStore();

  return useMemo(() => {
    if (!dataInfo?.startDate || !dataInfo?.endDate || dailyRecords.length === 0) {
      return {
        minYear: null,
        maxYear: null,
        minDate: null,
        maxDate: null,
        isLoaded: false,
        availableYears: [],
        availableDecades: []
      };
    }

    const minYear = dataInfo.startDate.getFullYear();
    const maxYear = dataInfo.endDate.getFullYear();

    // Generate available years from actual data
    const yearsSet = new Set<number>();
    for (const record of dailyRecords) {
      yearsSet.add(record.year);
    }
    const availableYears = Array.from(yearsSet).sort((a, b) => a - b);

    // Generate available decades from actual data
    const decadesSet = new Set<number>();
    for (const year of availableYears) {
      decadesSet.add(Math.floor(year / 10) * 10);
    }
    const availableDecades = Array.from(decadesSet).sort((a, b) => a - b);

    return {
      minYear,
      maxYear,
      minDate: dataInfo.startDate,
      maxDate: dataInfo.endDate,
      isLoaded: true,
      availableYears,
      availableDecades
    };
  }, [dataInfo, dailyRecords]);
}

/**
 * Helper to clamp a year value to the valid range
 */
export function clampYear(year: number, minYear: number, maxYear: number): number {
  return Math.max(minYear, Math.min(maxYear, year));
}
