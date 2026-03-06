import { DailyRecord, AggregatedRecord, AggregationScale, TemperatureMetric } from '../types';
import { getWeekNumber, getSeason, formatDateByScale, getPeriodBoundaries } from './dateUtils';

// Group daily records by period
export function groupByPeriod(
  records: DailyRecord[],
  scale: AggregationScale
): Map<string, DailyRecord[]> {
  const groups = new Map<string, DailyRecord[]>();

  for (const record of records) {
    const key = getPeriodKey(record.date, scale);

    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(record);
  }

  return groups;
}

// Get period key for grouping
function getPeriodKey(date: Date, scale: AggregationScale): string {
  const year = date.getFullYear();
  const month = date.getMonth();
  const day = date.getDate();

  switch (scale) {
    case 'daily':
      return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    case 'weekly':
      return `${year}-W${String(getWeekNumber(date)).padStart(2, '0')}`;
    case 'monthly':
      return `${year}-${String(month + 1).padStart(2, '0')}`;
    case 'seasonal':
      return `${year}-S${getSeason(date)}`;
    case 'yearly':
      return `${year}`;
    default:
      return `${year}-${month + 1}-${day}`;
  }
}

// Aggregate daily records to specified scale
export function aggregateRecords(
  records: DailyRecord[],
  scale: AggregationScale
): AggregatedRecord[] {
  if (scale === 'daily') {
    return records.map(r => ({
      periodStart: r.date,
      periodEnd: r.date,
      periodLabel: formatDateByScale(r.date, scale),
      scale,
      avgTemp: r.avgTemp,
      minTemp: r.minTemp,
      maxTemp: r.maxTemp,
      recordCount: 1,
    }));
  }

  const groups = groupByPeriod(records, scale);
  const aggregated: AggregatedRecord[] = [];

  for (const [, groupRecords] of groups) {
    if (groupRecords.length === 0) continue;

    // Sort records by date
    groupRecords.sort((a, b) => a.date.getTime() - b.date.getTime());

    const firstDate = groupRecords[0].date;
    const boundaries = getPeriodBoundaries(firstDate, scale);

    // Calculate aggregated values
    const validAvgTemps = groupRecords.map(r => r.avgTemp).filter((t): t is number => t !== null);
    const validMinTemps = groupRecords.map(r => r.minTemp).filter((t): t is number => t !== null);
    const validMaxTemps = groupRecords.map(r => r.maxTemp).filter((t): t is number => t !== null);

    aggregated.push({
      periodStart: boundaries.start,
      periodEnd: boundaries.end,
      periodLabel: formatDateByScale(firstDate, scale),
      scale,
      avgTemp: validAvgTemps.length > 0
        ? validAvgTemps.reduce((sum, t) => sum + t, 0) / validAvgTemps.length
        : null,
      minTemp: validMinTemps.length > 0 ? Math.min(...validMinTemps) : null,
      maxTemp: validMaxTemps.length > 0 ? Math.max(...validMaxTemps) : null,
      recordCount: groupRecords.length,
    });
  }

  // Sort by period start date
  aggregated.sort((a, b) => a.periodStart.getTime() - b.periodStart.getTime());

  return aggregated;
}

// Filter records by date range
export function filterByDateRange(
  records: DailyRecord[],
  startDate: Date | null,
  endDate: Date | null
): DailyRecord[] {
  return records.filter(r => {
    if (startDate && r.date < startDate) return false;
    if (endDate && r.date > endDate) return false;
    return true;
  });
}

// Filter records by selected months
export function filterByMonths(
  records: DailyRecord[],
  months: number[]
): DailyRecord[] {
  if (months.length === 0 || months.length === 12) return records;
  return records.filter(r => months.includes(r.month));
}

// Get temperature value based on metric
export function getTemperatureValue(
  record: AggregatedRecord,
  metric: TemperatureMetric
): number | null {
  switch (metric) {
    case 'avg':
      return record.avgTemp;
    case 'min':
      return record.minTemp;
    case 'max':
      return record.maxTemp;
    default:
      return record.avgTemp;
  }
}

// Calculate moving average
export function calculateMovingAverage(
  values: (number | null)[],
  window: number
): (number | null)[] {
  const result: (number | null)[] = [];

  for (let i = 0; i < values.length; i++) {
    const start = Math.max(0, i - Math.floor(window / 2));
    const end = Math.min(values.length, i + Math.ceil(window / 2));

    const windowValues = values.slice(start, end).filter((v): v is number => v !== null);

    if (windowValues.length > 0) {
      result.push(windowValues.reduce((sum, v) => sum + v, 0) / windowValues.length);
    } else {
      result.push(null);
    }
  }

  return result;
}

// Calculate linear regression trend line
export function calculateTrendLine(
  data: { x: number; y: number | null }[]
): { slope: number; intercept: number; values: (number | null)[] } {
  const validData = data.filter((d): d is { x: number; y: number } => d.y !== null);

  if (validData.length < 2) {
    return { slope: 0, intercept: 0, values: data.map(() => null) };
  }

  const n = validData.length;
  const sumX = validData.reduce((sum, d) => sum + d.x, 0);
  const sumY = validData.reduce((sum, d) => sum + d.y, 0);
  const sumXY = validData.reduce((sum, d) => sum + d.x * d.y, 0);
  const sumXX = validData.reduce((sum, d) => sum + d.x * d.x, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  const values = data.map(d => {
    if (d.y === null) return null;
    return slope * d.x + intercept;
  });

  return { slope, intercept, values };
}
