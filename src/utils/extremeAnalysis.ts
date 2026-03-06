import { DailyRecord } from '../types';

export interface ExtremeThresholds {
  heatThreshold: number;      // e.g., 30°C for max temp
  coldThreshold: number;      // e.g., 0°C for min temp
  tropicalNightThreshold: number; // e.g., 20°C for min temp
  metric: 'avgTemp' | 'minTemp' | 'maxTemp';
}

export interface YearlyExtremeStats {
  year: number;
  heatDays: number;
  coldDays: number;
  tropicalNights: number;
  longestHeatWave: number;
  longestColdSpell: number;
  totalDays: number;
}

export interface ExtremeRunInfo {
  year: number;
  startDate: Date;
  endDate: Date;
  length: number;
  type: 'heat' | 'cold';
}

// Count days exceeding a threshold
export function countExceedanceDays(
  records: DailyRecord[],
  threshold: number,
  metric: 'avgTemp' | 'minTemp' | 'maxTemp',
  comparison: 'above' | 'below'
): number {
  return records.filter(record => {
    const value = record[metric];
    if (value === null) return false;
    return comparison === 'above' ? value > threshold : value < threshold;
  }).length;
}

// Find longest consecutive run above/below threshold
export function findLongestRun(
  records: DailyRecord[],
  threshold: number,
  metric: 'avgTemp' | 'minTemp' | 'maxTemp',
  comparison: 'above' | 'below'
): number {
  let maxRun = 0;
  let currentRun = 0;

  // Sort by date
  const sorted = [...records].sort((a, b) => a.date.getTime() - b.date.getTime());

  for (const record of sorted) {
    const value = record[metric];
    if (value === null) {
      currentRun = 0;
      continue;
    }

    const meetsCondition = comparison === 'above'
      ? value > threshold
      : value < threshold;

    if (meetsCondition) {
      currentRun++;
      maxRun = Math.max(maxRun, currentRun);
    } else {
      currentRun = 0;
    }
  }

  return maxRun;
}

// Get all runs with their details
export function findAllRuns(
  records: DailyRecord[],
  threshold: number,
  metric: 'avgTemp' | 'minTemp' | 'maxTemp',
  comparison: 'above' | 'below',
  minLength: number = 3
): ExtremeRunInfo[] {
  const runs: ExtremeRunInfo[] = [];
  const sorted = [...records].sort((a, b) => a.date.getTime() - b.date.getTime());

  let runStart: Date | null = null;
  let runLength = 0;

  for (let i = 0; i < sorted.length; i++) {
    const record = sorted[i];
    const value = record[metric];

    if (value === null) {
      if (runStart && runLength >= minLength) {
        runs.push({
          year: runStart.getFullYear(),
          startDate: runStart,
          endDate: sorted[i - 1].date,
          length: runLength,
          type: comparison === 'above' ? 'heat' : 'cold'
        });
      }
      runStart = null;
      runLength = 0;
      continue;
    }

    const meetsCondition = comparison === 'above'
      ? value > threshold
      : value < threshold;

    if (meetsCondition) {
      if (!runStart) {
        runStart = record.date;
      }
      runLength++;
    } else {
      if (runStart && runLength >= minLength) {
        runs.push({
          year: runStart.getFullYear(),
          startDate: runStart,
          endDate: sorted[i - 1].date,
          length: runLength,
          type: comparison === 'above' ? 'heat' : 'cold'
        });
      }
      runStart = null;
      runLength = 0;
    }
  }

  // Handle run at end of data
  if (runStart && runLength >= minLength) {
    runs.push({
      year: runStart.getFullYear(),
      startDate: runStart,
      endDate: sorted[sorted.length - 1].date,
      length: runLength,
      type: comparison === 'above' ? 'heat' : 'cold'
    });
  }

  return runs;
}

// Calculate yearly extreme statistics
export function calculateYearlyExtremeStats(
  records: DailyRecord[],
  thresholds: ExtremeThresholds
): YearlyExtremeStats[] {
  // Group by year
  const byYear = new Map<number, DailyRecord[]>();

  for (const record of records) {
    const year = record.year;
    if (!byYear.has(year)) {
      byYear.set(year, []);
    }
    byYear.get(year)!.push(record);
  }

  const stats: YearlyExtremeStats[] = [];

  for (const [year, yearRecords] of byYear) {
    const heatDays = countExceedanceDays(
      yearRecords,
      thresholds.heatThreshold,
      thresholds.metric,
      'above'
    );

    const coldDays = countExceedanceDays(
      yearRecords,
      thresholds.coldThreshold,
      thresholds.metric,
      'below'
    );

    // Tropical nights use minTemp specifically
    const tropicalNights = countExceedanceDays(
      yearRecords,
      thresholds.tropicalNightThreshold,
      'minTemp',
      'above'
    );

    const longestHeatWave = findLongestRun(
      yearRecords,
      thresholds.heatThreshold,
      thresholds.metric,
      'above'
    );

    const longestColdSpell = findLongestRun(
      yearRecords,
      thresholds.coldThreshold,
      thresholds.metric,
      'below'
    );

    stats.push({
      year,
      heatDays,
      coldDays,
      tropicalNights,
      longestHeatWave,
      longestColdSpell,
      totalDays: yearRecords.length
    });
  }

  return stats.sort((a, b) => a.year - b.year);
}

// Calculate trend (days per decade)
export function calculateExtremeTrend(stats: YearlyExtremeStats[], field: keyof YearlyExtremeStats): number {
  if (stats.length < 2) return 0;

  const n = stats.length;
  const years = stats.map(s => s.year);
  const values = stats.map(s => s[field] as number);

  const meanX = years.reduce((a, b) => a + b, 0) / n;
  const meanY = values.reduce((a, b) => a + b, 0) / n;

  let numerator = 0;
  let denominator = 0;

  for (let i = 0; i < n; i++) {
    numerator += (years[i] - meanX) * (values[i] - meanY);
    denominator += (years[i] - meanX) ** 2;
  }

  const slope = denominator !== 0 ? numerator / denominator : 0;

  // Convert to per decade
  return slope * 10;
}

// Get monthly distribution of extreme days
export function getMonthlyExtremeDistribution(
  records: DailyRecord[],
  threshold: number,
  metric: 'avgTemp' | 'minTemp' | 'maxTemp',
  comparison: 'above' | 'below'
): number[] {
  const monthlyCounts = new Array(12).fill(0);

  for (const record of records) {
    const value = record[metric];
    if (value === null) continue;

    const meetsCondition = comparison === 'above'
      ? value > threshold
      : value < threshold;

    if (meetsCondition) {
      monthlyCounts[record.month]++;
    }
  }

  return monthlyCounts;
}

// Rank years by extreme event count
export function rankYearsByExtremes(
  stats: YearlyExtremeStats[],
  field: 'heatDays' | 'coldDays' | 'tropicalNights' | 'longestHeatWave' | 'longestColdSpell',
  topN: number = 10
): YearlyExtremeStats[] {
  return [...stats]
    .sort((a, b) => b[field] - a[field])
    .slice(0, topN);
}

// Compare recent period vs historical
export function compareRecentVsHistorical(
  stats: YearlyExtremeStats[],
  recentYears: number = 10
): {
  recentAvg: { heatDays: number; coldDays: number };
  historicalAvg: { heatDays: number; coldDays: number };
  change: { heatDays: number; coldDays: number };
} {
  const sorted = [...stats].sort((a, b) => a.year - b.year);

  if (sorted.length < recentYears + 1) {
    return {
      recentAvg: { heatDays: 0, coldDays: 0 },
      historicalAvg: { heatDays: 0, coldDays: 0 },
      change: { heatDays: 0, coldDays: 0 }
    };
  }

  const recent = sorted.slice(-recentYears);
  const historical = sorted.slice(0, -recentYears);

  const recentAvgHeat = recent.reduce((sum, s) => sum + s.heatDays, 0) / recent.length;
  const recentAvgCold = recent.reduce((sum, s) => sum + s.coldDays, 0) / recent.length;

  const histAvgHeat = historical.reduce((sum, s) => sum + s.heatDays, 0) / historical.length;
  const histAvgCold = historical.reduce((sum, s) => sum + s.coldDays, 0) / historical.length;

  return {
    recentAvg: { heatDays: recentAvgHeat, coldDays: recentAvgCold },
    historicalAvg: { heatDays: histAvgHeat, coldDays: histAvgCold },
    change: {
      heatDays: recentAvgHeat - histAvgHeat,
      coldDays: recentAvgCold - histAvgCold
    }
  };
}
