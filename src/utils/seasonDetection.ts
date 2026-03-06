import { DailyRecord, YearlySeasonStats, TemperatureMetric, SeasonDetectionMethod } from '../types';
import { getDayOfYear } from './dateUtils';

// Get temperature value based on metric
function getTempValue(record: DailyRecord, metric: TemperatureMetric): number | null {
  switch (metric) {
    case 'avg': return record.avgTemp;
    case 'min': return record.minTemp;
    case 'max': return record.maxTemp;
    default: return record.avgTemp;
  }
}

// Detect season start using consecutive days rule
export function detectSeasonConsecutive(
  records: DailyRecord[],
  threshold: number,
  consecutiveDays: number,
  above: boolean, // true = looking for temps above threshold (warm), false = below (cool)
  metric: TemperatureMetric = 'avg'
): number | null {
  let streak = 0;
  let streakStart = -1;

  for (let i = 0; i < records.length; i++) {
    const temp = getTempValue(records[i], metric);
    if (temp === null) {
      streak = 0;
      streakStart = -1;
      continue;
    }

    const meetsCondition = above ? temp > threshold : temp < threshold;

    if (meetsCondition) {
      if (streak === 0) {
        streakStart = i;
      }
      streak++;

      if (streak >= consecutiveDays) {
        return getDayOfYear(records[streakStart].date);
      }
    } else {
      streak = 0;
      streakStart = -1;
    }
  }

  return null;
}

// Detect season start using moving average rule
export function detectSeasonMovingAverage(
  records: DailyRecord[],
  threshold: number,
  windowSize: number,
  above: boolean,
  metric: TemperatureMetric = 'avg'
): number | null {
  if (records.length < windowSize) return null;

  // Calculate initial moving average
  let sum = 0;
  let validCount = 0;

  for (let i = 0; i < windowSize; i++) {
    const temp = getTempValue(records[i], metric);
    if (temp !== null) {
      sum += temp;
      validCount++;
    }
  }

  let prevMA = validCount > 0 ? sum / validCount : null;

  // Slide window and detect crossing
  for (let i = windowSize; i < records.length; i++) {
    // Remove oldest value
    const oldTemp = getTempValue(records[i - windowSize], metric);
    if (oldTemp !== null) {
      sum -= oldTemp;
      validCount--;
    }

    // Add newest value
    const newTemp = getTempValue(records[i], metric);
    if (newTemp !== null) {
      sum += newTemp;
      validCount++;
    }

    const currentMA = validCount > 0 ? sum / validCount : null;

    // Check for threshold crossing
    if (prevMA !== null && currentMA !== null) {
      if (above) {
        // Looking for upward crossing
        if (prevMA <= threshold && currentMA > threshold) {
          return getDayOfYear(records[i].date);
        }
      } else {
        // Looking for downward crossing
        if (prevMA >= threshold && currentMA < threshold) {
          return getDayOfYear(records[i].date);
        }
      }
    }

    prevMA = currentMA;
  }

  return null;
}

// Count days meeting a condition
export function countDaysAboveThreshold(
  records: DailyRecord[],
  threshold: number,
  metric: TemperatureMetric = 'avg'
): number {
  return records.filter(r => {
    const temp = getTempValue(r, metric);
    return temp !== null && temp > threshold;
  }).length;
}

export function countDaysBelowThreshold(
  records: DailyRecord[],
  threshold: number,
  metric: TemperatureMetric = 'avg'
): number {
  return records.filter(r => {
    const temp = getTempValue(r, metric);
    return temp !== null && temp < threshold;
  }).length;
}

// Group records by year
export function groupByYear(records: DailyRecord[]): Map<number, DailyRecord[]> {
  const groups = new Map<number, DailyRecord[]>();

  for (const record of records) {
    const year = record.year;
    if (!groups.has(year)) {
      groups.set(year, []);
    }
    groups.get(year)!.push(record);
  }

  // Sort records within each year by date
  for (const [, yearRecords] of groups) {
    yearRecords.sort((a, b) => a.date.getTime() - b.date.getTime());
  }

  return groups;
}

// Calculate yearly seasonal statistics
export function calculateYearlySeasonStats(
  records: DailyRecord[],
  options: {
    method: SeasonDetectionMethod;
    warmThreshold: number;
    coolThreshold: number;
    consecutiveDays: number;
    movingAverageWindow: number;
    summerLikeThreshold: number;
    winterLikeThreshold: number;
    metric: TemperatureMetric;
  }
): YearlySeasonStats[] {
  const {
    method,
    warmThreshold,
    coolThreshold,
    consecutiveDays,
    movingAverageWindow,
    summerLikeThreshold,
    winterLikeThreshold,
    metric,
  } = options;

  const yearGroups = groupByYear(records);
  const stats: YearlySeasonStats[] = [];

  for (const [year, yearRecords] of yearGroups) {
    // Split year into first half (for warm season start) and second half (for cool season start)
    const midYear = new Date(year, 6, 1); // July 1
    const firstHalf = yearRecords.filter(r => r.date < midYear);
    const secondHalf = yearRecords.filter(r => r.date >= midYear);

    let warmSeasonStart: number | null = null;
    let warmSeasonEnd: number | null = null;
    let coolSeasonStart: number | null = null;
    let coolSeasonEnd: number | null = null;

    if (method === 'consecutive') {
      // Detect warm season start (spring -> summer)
      warmSeasonStart = detectSeasonConsecutive(firstHalf, warmThreshold, consecutiveDays, true, metric);
      // Detect warm season end (summer -> fall)
      warmSeasonEnd = detectSeasonConsecutive(secondHalf, warmThreshold, consecutiveDays, false, metric);
      // Detect cool season start (fall -> winter)
      coolSeasonStart = detectSeasonConsecutive(secondHalf, coolThreshold, consecutiveDays, false, metric);
    } else {
      // Moving average method
      warmSeasonStart = detectSeasonMovingAverage(firstHalf, warmThreshold, movingAverageWindow, true, metric);
      warmSeasonEnd = detectSeasonMovingAverage(secondHalf, warmThreshold, movingAverageWindow, false, metric);
      coolSeasonStart = detectSeasonMovingAverage(secondHalf, coolThreshold, movingAverageWindow, false, metric);
    }

    // Calculate durations
    let warmSeasonDuration: number | null = null;
    if (warmSeasonStart !== null && warmSeasonEnd !== null) {
      warmSeasonDuration = warmSeasonEnd - warmSeasonStart;
    }

    let coolSeasonDuration: number | null = null;
    if (coolSeasonStart !== null) {
      // Cool season often extends into next year, so we estimate duration
      coolSeasonDuration = 365 - coolSeasonStart + 60; // Estimate until end of Feb
    }

    // Count summer-like and winter-like days
    const summerLikeDays = countDaysAboveThreshold(yearRecords, summerLikeThreshold, metric);
    const winterLikeDays = countDaysBelowThreshold(yearRecords, winterLikeThreshold, metric);

    stats.push({
      year,
      warmSeasonStart,
      warmSeasonEnd,
      coolSeasonStart,
      coolSeasonEnd,
      warmSeasonDuration,
      coolSeasonDuration,
      summerLikeDays,
      winterLikeDays,
    });
  }

  // Sort by year
  stats.sort((a, b) => a.year - b.year);

  return stats;
}

// Calculate trend (days per decade) using linear regression
export function calculateTrend(data: { year: number; value: number | null }[]): number {
  const validData = data.filter(d => d.value !== null) as { year: number; value: number }[];

  if (validData.length < 2) return 0;

  const n = validData.length;
  const sumX = validData.reduce((sum, d) => sum + d.year, 0);
  const sumY = validData.reduce((sum, d) => sum + d.value, 0);
  const sumXY = validData.reduce((sum, d) => sum + d.year * d.value, 0);
  const sumXX = validData.reduce((sum, d) => sum + d.year * d.year, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);

  // Convert slope to days per decade
  return slope * 10;
}
