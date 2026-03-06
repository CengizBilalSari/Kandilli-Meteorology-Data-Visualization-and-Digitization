import { useMemo } from 'react';
import { useDataStore } from '../store/useDataStore';
import { useDailyViewerStore } from '../store/useDailyViewerStore';
import { DailyRecord } from '../types';
import { format } from 'date-fns';

export interface HourlyDataPoint {
  hour: number;
  label: string;
  temp: number | null;
  isMin: boolean;
  isMax: boolean;
}

export function useDailyData() {
  const { dailyRecords, dataInfo } = useDataStore();
  const { selectedDate } = useDailyViewerStore();

  const dailyRecord = useMemo((): DailyRecord | null => {
    if (!selectedDate || dailyRecords.length === 0) return null;

    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    return dailyRecords.find(r => format(r.date, 'yyyy-MM-dd') === dateStr) || null;
  }, [selectedDate, dailyRecords]);

  const hourlyData = useMemo((): HourlyDataPoint[] => {
    if (!dailyRecord) {
      // Return empty data for all 24 hours
      return Array.from({ length: 24 }, (_, i) => ({
        hour: i,
        label: `${String(i).padStart(2, '0')}:00`,
        temp: null,
        isMin: false,
        isMax: false,
      }));
    }

    const temps = dailyRecord.hourlyTemps;
    const validTemps = temps.filter((t): t is number => t !== null);
    const minTemp = validTemps.length > 0 ? Math.min(...validTemps) : null;
    const maxTemp = validTemps.length > 0 ? Math.max(...validTemps) : null;

    return temps.map((temp, i) => ({
      hour: i,
      label: `${String(i).padStart(2, '0')}:00`,
      temp,
      isMin: temp !== null && temp === minTemp,
      isMax: temp !== null && temp === maxTemp,
    }));
  }, [dailyRecord]);

  const summary = useMemo(() => {
    if (!dailyRecord) {
      return {
        avg: null,
        min: null,
        max: null,
        minHour: null,
        maxHour: null,
        range: null,
        validHours: 0,
      };
    }

    const temps = dailyRecord.hourlyTemps;
    const validTemps = temps.map((t, i) => ({ temp: t, hour: i }))
      .filter((d): d is { temp: number; hour: number } => d.temp !== null);

    if (validTemps.length === 0) {
      return {
        avg: null,
        min: null,
        max: null,
        minHour: null,
        maxHour: null,
        range: null,
        validHours: 0,
      };
    }

    const minEntry = validTemps.reduce((a, b) => a.temp < b.temp ? a : b);
    const maxEntry = validTemps.reduce((a, b) => a.temp > b.temp ? a : b);

    return {
      avg: dailyRecord.avgTemp,
      min: dailyRecord.minTemp,
      max: dailyRecord.maxTemp,
      minHour: minEntry.hour,
      maxHour: maxEntry.hour,
      range: dailyRecord.maxTemp !== null && dailyRecord.minTemp !== null
        ? dailyRecord.maxTemp - dailyRecord.minTemp
        : null,
      validHours: validTemps.length,
    };
  }, [dailyRecord]);

  const dateRange = useMemo(() => ({
    start: dataInfo?.startDate || null,
    end: dataInfo?.endDate || null,
  }), [dataInfo]);

  const hasData = dailyRecord !== null;
  const dataQuality = dailyRecord?.dataQuality || 'missing';

  return {
    dailyRecord,
    hourlyData,
    summary,
    dateRange,
    hasData,
    dataQuality,
  };
}
