import { useMemo } from 'react';
import { useDataStore } from '../store/useDataStore';
import { useSeasonalStore } from '../store/useSeasonalStore';
import { calculateYearlySeasonStats, calculateTrend } from '../utils/seasonDetection';

export interface SeasonalSummary {
  warmSeasonStartTrend: number; // days per decade
  warmSeasonEndTrend: number;
  coolSeasonStartTrend: number;
  summerLikeDaysTrend: number;
  winterLikeDaysTrend: number;
  avgWarmSeasonStart: number | null;
  avgCoolSeasonStart: number | null;
  avgSummerLikeDays: number | null;
  avgWinterLikeDays: number | null;
  firstYearSummerDays: number | null;
  lastYearSummerDays: number | null;
  firstYearWinterDays: number | null;
  lastYearWinterDays: number | null;
}

export function useSeasonalData() {
  const { dailyRecords } = useDataStore();
  const {
    method,
    warmThreshold,
    coolThreshold,
    consecutiveDays,
    movingAverageWindow,
    summerLikeThreshold,
    winterLikeThreshold,
    metric,
    startYear,
    endYear,
  } = useSeasonalStore();

  const yearlyStats = useMemo(() => {
    if (dailyRecords.length === 0) return [];

    const stats = calculateYearlySeasonStats(dailyRecords, {
      method,
      warmThreshold,
      coolThreshold,
      consecutiveDays,
      movingAverageWindow,
      summerLikeThreshold,
      winterLikeThreshold,
      metric,
    });

    // Filter by year range if specified
    let filtered = stats;
    if (startYear !== null) {
      filtered = filtered.filter(s => s.year >= startYear);
    }
    if (endYear !== null) {
      filtered = filtered.filter(s => s.year <= endYear);
    }

    return filtered;
  }, [
    dailyRecords,
    method,
    warmThreshold,
    coolThreshold,
    consecutiveDays,
    movingAverageWindow,
    summerLikeThreshold,
    winterLikeThreshold,
    metric,
    startYear,
    endYear,
  ]);

  const summary = useMemo((): SeasonalSummary => {
    if (yearlyStats.length === 0) {
      return {
        warmSeasonStartTrend: 0,
        warmSeasonEndTrend: 0,
        coolSeasonStartTrend: 0,
        summerLikeDaysTrend: 0,
        winterLikeDaysTrend: 0,
        avgWarmSeasonStart: null,
        avgCoolSeasonStart: null,
        avgSummerLikeDays: null,
        avgWinterLikeDays: null,
        firstYearSummerDays: null,
        lastYearSummerDays: null,
        firstYearWinterDays: null,
        lastYearWinterDays: null,
      };
    }

    // Calculate trends
    const warmStartTrend = calculateTrend(
      yearlyStats.map(s => ({ year: s.year, value: s.warmSeasonStart }))
    );
    const warmEndTrend = calculateTrend(
      yearlyStats.map(s => ({ year: s.year, value: s.warmSeasonEnd }))
    );
    const coolStartTrend = calculateTrend(
      yearlyStats.map(s => ({ year: s.year, value: s.coolSeasonStart }))
    );
    const summerDaysTrend = calculateTrend(
      yearlyStats.map(s => ({ year: s.year, value: s.summerLikeDays }))
    );
    const winterDaysTrend = calculateTrend(
      yearlyStats.map(s => ({ year: s.year, value: s.winterLikeDays }))
    );

    // Calculate averages
    const validWarmStarts = yearlyStats.filter(s => s.warmSeasonStart !== null);
    const validCoolStarts = yearlyStats.filter(s => s.coolSeasonStart !== null);

    const avgWarmStart = validWarmStarts.length > 0
      ? validWarmStarts.reduce((sum, s) => sum + s.warmSeasonStart!, 0) / validWarmStarts.length
      : null;

    const avgCoolStart = validCoolStarts.length > 0
      ? validCoolStarts.reduce((sum, s) => sum + s.coolSeasonStart!, 0) / validCoolStarts.length
      : null;

    const avgSummerDays = yearlyStats.reduce((sum, s) => sum + s.summerLikeDays, 0) / yearlyStats.length;
    const avgWinterDays = yearlyStats.reduce((sum, s) => sum + s.winterLikeDays, 0) / yearlyStats.length;

    // First and last year values
    const firstYear = yearlyStats[0];
    const lastYear = yearlyStats[yearlyStats.length - 1];

    return {
      warmSeasonStartTrend: warmStartTrend,
      warmSeasonEndTrend: warmEndTrend,
      coolSeasonStartTrend: coolStartTrend,
      summerLikeDaysTrend: summerDaysTrend,
      winterLikeDaysTrend: winterDaysTrend,
      avgWarmSeasonStart: avgWarmStart,
      avgCoolSeasonStart: avgCoolStart,
      avgSummerLikeDays: avgSummerDays,
      avgWinterLikeDays: avgWinterDays,
      firstYearSummerDays: firstYear?.summerLikeDays ?? null,
      lastYearSummerDays: lastYear?.summerLikeDays ?? null,
      firstYearWinterDays: firstYear?.winterLikeDays ?? null,
      lastYearWinterDays: lastYear?.winterLikeDays ?? null,
    };
  }, [yearlyStats]);

  const availableYears = useMemo(() => {
    if (dailyRecords.length === 0) return [];
    const years = new Set(dailyRecords.map(r => r.year));
    return Array.from(years).sort((a, b) => a - b);
  }, [dailyRecords]);

  return { yearlyStats, summary, availableYears };
}
