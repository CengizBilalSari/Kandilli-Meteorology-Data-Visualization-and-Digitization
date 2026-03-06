import { useMemo } from 'react';
import { useDataStore } from '../store/useDataStore';
import { useVariabilityStore } from '../store/useVariabilityStore';
import { useDataRange } from './useDataRange';
import {
  calculateYearlyVariability,
  calculateSeasonalVariability,
  calculateDecadeDistributions,
  calculateVariabilityTrend,
  calculateRangeTrend,
  getStabilityExtremes,
  calculateMean,
  YearlyVariabilityStats
} from '../utils/variabilityCalculations';

export interface SmoothedYearlyStats extends YearlyVariabilityStats {
  smoothedSD?: number;
  smoothedRange?: number;
}

export function useVariabilityData() {
  const { dailyRecords } = useDataStore();
  const {
    startYear,
    endYear,
    metric,
    selectedSeason,
    smoothingWindow
  } = useVariabilityStore();

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

  // Effective years for seasonal stats
  const effectiveStartYear = startYear ?? dataRange.minYear ?? -Infinity;
  const effectiveEndYear = endYear ?? dataRange.maxYear ?? Infinity;

  // Calculate yearly variability statistics
  const yearlyStats = useMemo(() => {
    return calculateYearlyVariability(filteredRecords, metric);
  }, [filteredRecords, metric]);

  // Apply smoothing to yearly SD
  const smoothedYearlyStats = useMemo((): SmoothedYearlyStats[] => {
    if (smoothingWindow <= 1) {
      return yearlyStats.map(stat => ({
        ...stat,
        smoothedSD: stat.standardDeviation,
        smoothedRange: stat.meanDailyRange
      }));
    }

    return yearlyStats.map((stat, index) => {
      const windowStart = Math.max(0, index - Math.floor(smoothingWindow / 2));
      const windowEnd = Math.min(yearlyStats.length, index + Math.ceil(smoothingWindow / 2));
      const windowStats = yearlyStats.slice(windowStart, windowEnd);

      return {
        ...stat,
        smoothedSD: calculateMean(windowStats.map(s => s.standardDeviation)),
        smoothedRange: calculateMean(windowStats.map(s => s.meanDailyRange))
      };
    });
  }, [yearlyStats, smoothingWindow]);

  // Calculate seasonal variability
  const seasonalStats = useMemo(() => {
    return calculateSeasonalVariability(
      dailyRecords.filter(r => r.year >= effectiveStartYear && r.year <= effectiveEndYear),
      metric
    );
  }, [dailyRecords, effectiveStartYear, effectiveEndYear, metric]);

  // Calculate decade distributions
  const decadeDistributions = useMemo(() => {
    return calculateDecadeDistributions(filteredRecords, metric, false);
  }, [filteredRecords, metric]);

  // Calculate daily range decade distributions
  const rangeDecadeDistributions = useMemo(() => {
    return calculateDecadeDistributions(filteredRecords, metric, true);
  }, [filteredRecords, metric]);

  // Calculate trends
  const sdTrend = useMemo(() =>
    calculateVariabilityTrend(yearlyStats),
    [yearlyStats]
  );

  const rangeTrend = useMemo(() =>
    calculateRangeTrend(yearlyStats),
    [yearlyStats]
  );

  // Get stability extremes
  const stabilityExtremes = useMemo(() =>
    getStabilityExtremes(yearlyStats),
    [yearlyStats]
  );

  // Summary statistics
  const summary = useMemo(() => {
    if (yearlyStats.length === 0) return null;

    const firstDecade = yearlyStats.slice(0, 10);
    const lastDecade = yearlyStats.slice(-10);

    const avgSDFirst = calculateMean(firstDecade.map(s => s.standardDeviation));
    const avgSDLast = calculateMean(lastDecade.map(s => s.standardDeviation));
    const avgRangeFirst = calculateMean(firstDecade.map(s => s.meanDailyRange));
    const avgRangeLast = calculateMean(lastDecade.map(s => s.meanDailyRange));

    // Most and least stable seasons
    const sortedSeasons = [...seasonalStats].sort((a, b) => a.standardDeviation - b.standardDeviation);

    return {
      sdChange: {
        from: avgSDFirst,
        to: avgSDLast,
        percentChange: avgSDFirst > 0 ? ((avgSDLast - avgSDFirst) / avgSDFirst) * 100 : 0
      },
      rangeChange: {
        from: avgRangeFirst,
        to: avgRangeLast,
        percentChange: avgRangeFirst > 0 ? ((avgRangeLast - avgRangeFirst) / avgRangeFirst) * 100 : 0
      },
      mostStableSeason: sortedSeasons[0]?.season || 'N/A',
      mostVariableSeason: sortedSeasons[sortedSeasons.length - 1]?.season || 'N/A',
      overallTrend: sdTrend > 0.05 ? 'increasing' : sdTrend < -0.05 ? 'decreasing' : 'stable'
    };
  }, [yearlyStats, seasonalStats, sdTrend]);

  return {
    yearlyStats,
    smoothedYearlyStats,
    seasonalStats,
    decadeDistributions,
    rangeDecadeDistributions,
    sdTrend,
    rangeTrend,
    stabilityExtremes,
    summary
  };
}
