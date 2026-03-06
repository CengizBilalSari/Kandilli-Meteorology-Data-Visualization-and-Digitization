import { useMemo } from 'react';
import { useDataStore } from '../store/useDataStore';
import { useExtremeStore } from '../store/useExtremeStore';
import { useDataRange } from './useDataRange';
import {
  calculateYearlyExtremeStats,
  calculateExtremeTrend,
  rankYearsByExtremes,
  compareRecentVsHistorical,
  getMonthlyExtremeDistribution,
  ExtremeThresholds
} from '../utils/extremeAnalysis';

export function useExtremeAnalysis() {
  const { dailyRecords } = useDataStore();
  const {
    startYear,
    endYear,
    metric,
    heatThreshold,
    coldThreshold,
    tropicalNightThreshold,
    selectedSeason
  } = useExtremeStore();

  // Get actual data range
  const dataRange = useDataRange();

  // Filter records by year range and optionally by season
  const filteredRecords = useMemo(() => {
    // Use store values or fall back to data range
    const effectiveStartYear = startYear ?? dataRange.minYear ?? -Infinity;
    const effectiveEndYear = endYear ?? dataRange.maxYear ?? Infinity;

    let records = dailyRecords.filter(
      r => r.year >= effectiveStartYear && r.year <= effectiveEndYear
    );

    // Filter by season if selected
    if (selectedSeason !== null) {
      const seasonMonths: Record<number, number[]> = {
        0: [11, 0, 1],   // Winter: Dec, Jan, Feb
        1: [2, 3, 4],    // Spring: Mar, Apr, May
        2: [5, 6, 7],    // Summer: Jun, Jul, Aug
        3: [8, 9, 10]    // Autumn: Sep, Oct, Nov
      };
      const months = seasonMonths[selectedSeason];
      records = records.filter(r => months.includes(r.month));
    }

    return records;
  }, [dailyRecords, startYear, endYear, selectedSeason, dataRange.minYear, dataRange.maxYear]);

  // Calculate yearly statistics
  const yearlyStats = useMemo(() => {
    const thresholds: ExtremeThresholds = {
      heatThreshold,
      coldThreshold,
      tropicalNightThreshold,
      metric
    };

    return calculateYearlyExtremeStats(filteredRecords, thresholds);
  }, [filteredRecords, heatThreshold, coldThreshold, tropicalNightThreshold, metric]);

  // Calculate trends
  const heatTrend = useMemo(() =>
    calculateExtremeTrend(yearlyStats, 'heatDays'),
    [yearlyStats]
  );

  const coldTrend = useMemo(() =>
    calculateExtremeTrend(yearlyStats, 'coldDays'),
    [yearlyStats]
  );

  const tropicalNightsTrend = useMemo(() =>
    calculateExtremeTrend(yearlyStats, 'tropicalNights'),
    [yearlyStats]
  );

  const heatWaveTrend = useMemo(() =>
    calculateExtremeTrend(yearlyStats, 'longestHeatWave'),
    [yearlyStats]
  );

  // Top years rankings
  const topHeatYears = useMemo(() =>
    rankYearsByExtremes(yearlyStats, 'heatDays', 5),
    [yearlyStats]
  );

  const topColdYears = useMemo(() =>
    rankYearsByExtremes(yearlyStats, 'coldDays', 5),
    [yearlyStats]
  );

  const topHeatWaveYears = useMemo(() =>
    rankYearsByExtremes(yearlyStats, 'longestHeatWave', 5),
    [yearlyStats]
  );

  // Recent vs Historical comparison
  const comparison = useMemo(() =>
    compareRecentVsHistorical(yearlyStats, 10),
    [yearlyStats]
  );

  // Monthly distribution
  const heatMonthlyDist = useMemo(() =>
    getMonthlyExtremeDistribution(filteredRecords, heatThreshold, metric, 'above'),
    [filteredRecords, heatThreshold, metric]
  );

  const coldMonthlyDist = useMemo(() =>
    getMonthlyExtremeDistribution(filteredRecords, coldThreshold, metric, 'below'),
    [filteredRecords, coldThreshold, metric]
  );

  // Summary statistics
  const summary = useMemo(() => {
    if (yearlyStats.length === 0) {
      return null;
    }

    const firstDecade = yearlyStats.slice(0, 10);
    const lastDecade = yearlyStats.slice(-10);

    const avgHeatFirst = firstDecade.reduce((sum, s) => sum + s.heatDays, 0) / firstDecade.length;
    const avgHeatLast = lastDecade.reduce((sum, s) => sum + s.heatDays, 0) / lastDecade.length;
    const avgColdFirst = firstDecade.reduce((sum, s) => sum + s.coldDays, 0) / firstDecade.length;
    const avgColdLast = lastDecade.reduce((sum, s) => sum + s.coldDays, 0) / lastDecade.length;
    const avgWaveFirst = firstDecade.reduce((sum, s) => sum + s.longestHeatWave, 0) / firstDecade.length;
    const avgWaveLast = lastDecade.reduce((sum, s) => sum + s.longestHeatWave, 0) / lastDecade.length;
    const avgSpellFirst = firstDecade.reduce((sum, s) => sum + s.longestColdSpell, 0) / firstDecade.length;
    const avgSpellLast = lastDecade.reduce((sum, s) => sum + s.longestColdSpell, 0) / lastDecade.length;

    return {
      heatDaysChange: {
        from: avgHeatFirst,
        to: avgHeatLast,
        percentChange: avgHeatFirst > 0 ? ((avgHeatLast - avgHeatFirst) / avgHeatFirst) * 100 : 0
      },
      coldDaysChange: {
        from: avgColdFirst,
        to: avgColdLast,
        percentChange: avgColdFirst > 0 ? ((avgColdLast - avgColdFirst) / avgColdFirst) * 100 : 0
      },
      heatWaveChange: {
        from: avgWaveFirst,
        to: avgWaveLast
      },
      coldSpellChange: {
        from: avgSpellFirst,
        to: avgSpellLast
      }
    };
  }, [yearlyStats]);

  return {
    yearlyStats,
    heatTrend,
    coldTrend,
    tropicalNightsTrend,
    heatWaveTrend,
    topHeatYears,
    topColdYears,
    topHeatWaveYears,
    comparison,
    heatMonthlyDist,
    coldMonthlyDist,
    summary
  };
}
