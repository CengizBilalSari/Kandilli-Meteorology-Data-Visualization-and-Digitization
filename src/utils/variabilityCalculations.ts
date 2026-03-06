import { DailyRecord } from '../types';

export interface YearlyVariabilityStats {
  year: number;
  standardDeviation: number;
  coefficientOfVariation: number;
  meanDailyRange: number;
  medianDailyRange: number;
  monthlySpread: number;  // warmest month - coldest month
  interQuartileRange: number;
  mean: number;
}

export interface SeasonalVariability {
  season: string;
  seasonIndex: number;
  standardDeviation: number;
  mean: number;
  trend: number;  // change per decade
}

export interface DecadeDistribution {
  decade: string;
  decadeStart: number;
  values: number[];
  mean: number;
  median: number;
  q1: number;
  q3: number;
  min: number;
  max: number;
  standardDeviation: number;
}

// Calculate standard deviation
export function calculateSD(values: number[]): number {
  if (values.length === 0) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
  return Math.sqrt(squaredDiffs.reduce((a, b) => a + b, 0) / values.length);
}

// Calculate mean
export function calculateMean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

// Calculate median
export function calculateMedian(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2;
}

// Calculate percentile
export function calculatePercentile(values: number[], percentile: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = (percentile / 100) * (sorted.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);

  if (lower === upper) return sorted[lower];

  const fraction = index - lower;
  return sorted[lower] + fraction * (sorted[upper] - sorted[lower]);
}

// Calculate coefficient of variation (CV)
export function calculateCV(values: number[]): number {
  if (values.length === 0) return 0;
  const mean = calculateMean(values);
  if (mean === 0) return 0;
  const sd = calculateSD(values);
  return (sd / Math.abs(mean)) * 100;
}

// Calculate yearly variability statistics
export function calculateYearlyVariability(
  records: DailyRecord[],
  metric: 'avgTemp' | 'minTemp' | 'maxTemp'
): YearlyVariabilityStats[] {
  // Group by year
  const byYear = new Map<number, DailyRecord[]>();

  for (const record of records) {
    if (!byYear.has(record.year)) {
      byYear.set(record.year, []);
    }
    byYear.get(record.year)!.push(record);
  }

  const stats: YearlyVariabilityStats[] = [];

  for (const [year, yearRecords] of byYear) {
    const values = yearRecords
      .map(r => r[metric])
      .filter((v): v is number => v !== null);

    if (values.length === 0) continue;

    // Daily ranges (max - min)
    const dailyRanges = yearRecords
      .filter(r => r.maxTemp !== null && r.minTemp !== null)
      .map(r => r.maxTemp! - r.minTemp!);

    // Monthly averages for spread calculation
    const monthlyAvgs = new Map<number, number[]>();
    for (const record of yearRecords) {
      const value = record[metric];
      if (value === null) continue;

      if (!monthlyAvgs.has(record.month)) {
        monthlyAvgs.set(record.month, []);
      }
      monthlyAvgs.get(record.month)!.push(value);
    }

    const monthMeans = Array.from(monthlyAvgs.values()).map(vals =>
      vals.reduce((a, b) => a + b, 0) / vals.length
    );

    const monthlySpread = monthMeans.length > 0
      ? Math.max(...monthMeans) - Math.min(...monthMeans)
      : 0;

    stats.push({
      year,
      standardDeviation: calculateSD(values),
      coefficientOfVariation: calculateCV(values),
      meanDailyRange: dailyRanges.length > 0 ? calculateMean(dailyRanges) : 0,
      medianDailyRange: dailyRanges.length > 0 ? calculateMedian(dailyRanges) : 0,
      monthlySpread,
      interQuartileRange: calculatePercentile(values, 75) - calculatePercentile(values, 25),
      mean: calculateMean(values)
    });
  }

  return stats.sort((a, b) => a.year - b.year);
}

// Calculate seasonal variability
export function calculateSeasonalVariability(
  records: DailyRecord[],
  metric: 'avgTemp' | 'minTemp' | 'maxTemp'
): SeasonalVariability[] {
  const seasons = [
    { name: 'Winter', months: [11, 0, 1], index: 0 },
    { name: 'Spring', months: [2, 3, 4], index: 1 },
    { name: 'Summer', months: [5, 6, 7], index: 2 },
    { name: 'Autumn', months: [8, 9, 10], index: 3 }
  ];

  const result: SeasonalVariability[] = [];

  for (const season of seasons) {
    // Group by year-season
    const byYearSeason = new Map<number, number[]>();

    for (const record of records) {
      if (!season.months.includes(record.month)) continue;

      const value = record[metric];
      if (value === null) continue;

      // For winter, adjust year for Dec
      let year = record.year;
      if (season.name === 'Winter' && record.month === 11) {
        year = record.year + 1;
      }

      if (!byYearSeason.has(year)) {
        byYearSeason.set(year, []);
      }
      byYearSeason.get(year)!.push(value);
    }

    // Calculate SD for each year
    const yearlySD: { year: number; sd: number }[] = [];
    for (const [year, values] of byYearSeason) {
      if (values.length > 0) {
        yearlySD.push({ year, sd: calculateSD(values) });
      }
    }

    // Calculate overall stats
    const allValues = records
      .filter(r => season.months.includes(r.month))
      .map(r => r[metric])
      .filter((v): v is number => v !== null);

    // Calculate trend in SD
    let trend = 0;
    if (yearlySD.length >= 2) {
      const sorted = yearlySD.sort((a, b) => a.year - b.year);
      const n = sorted.length;
      const meanX = sorted.reduce((sum, s) => sum + s.year, 0) / n;
      const meanY = sorted.reduce((sum, s) => sum + s.sd, 0) / n;

      let num = 0;
      let den = 0;
      for (const s of sorted) {
        num += (s.year - meanX) * (s.sd - meanY);
        den += (s.year - meanX) ** 2;
      }
      trend = den !== 0 ? (num / den) * 10 : 0; // per decade
    }

    result.push({
      season: season.name,
      seasonIndex: season.index,
      standardDeviation: calculateSD(allValues),
      mean: calculateMean(allValues),
      trend
    });
  }

  return result;
}

// Calculate decade distributions for box plots
export function calculateDecadeDistributions(
  records: DailyRecord[],
  metric: 'avgTemp' | 'minTemp' | 'maxTemp',
  useRange: boolean = false  // true = daily range, false = temperature values
): DecadeDistribution[] {
  const decades = new Map<number, number[]>();

  for (const record of records) {
    const decadeStart = Math.floor(record.year / 10) * 10;

    if (!decades.has(decadeStart)) {
      decades.set(decadeStart, []);
    }

    let value: number | null;
    if (useRange) {
      if (record.maxTemp !== null && record.minTemp !== null) {
        value = record.maxTemp - record.minTemp;
      } else {
        value = null;
      }
    } else {
      value = record[metric];
    }

    if (value !== null) {
      decades.get(decadeStart)!.push(value);
    }
  }

  const distributions: DecadeDistribution[] = [];

  for (const [decadeStart, values] of decades) {
    if (values.length === 0) continue;

    distributions.push({
      decade: `${decadeStart}s`,
      decadeStart,
      values,
      mean: calculateMean(values),
      median: calculateMedian(values),
      q1: calculatePercentile(values, 25),
      q3: calculatePercentile(values, 75),
      min: Math.min(...values),
      max: Math.max(...values),
      standardDeviation: calculateSD(values)
    });
  }

  return distributions.sort((a, b) => a.decadeStart - b.decadeStart);
}

// Calculate variability trend
export function calculateVariabilityTrend(stats: YearlyVariabilityStats[]): number {
  if (stats.length < 2) return 0;

  const n = stats.length;
  const years = stats.map(s => s.year);
  const sds = stats.map(s => s.standardDeviation);

  const meanX = years.reduce((a, b) => a + b, 0) / n;
  const meanY = sds.reduce((a, b) => a + b, 0) / n;

  let numerator = 0;
  let denominator = 0;

  for (let i = 0; i < n; i++) {
    numerator += (years[i] - meanX) * (sds[i] - meanY);
    denominator += (years[i] - meanX) ** 2;
  }

  const slope = denominator !== 0 ? numerator / denominator : 0;
  return slope * 10; // per decade
}

// Calculate daily range trend
export function calculateRangeTrend(stats: YearlyVariabilityStats[]): number {
  if (stats.length < 2) return 0;

  const n = stats.length;
  const years = stats.map(s => s.year);
  const ranges = stats.map(s => s.meanDailyRange);

  const meanX = years.reduce((a, b) => a + b, 0) / n;
  const meanY = ranges.reduce((a, b) => a + b, 0) / n;

  let numerator = 0;
  let denominator = 0;

  for (let i = 0; i < n; i++) {
    numerator += (years[i] - meanX) * (ranges[i] - meanY);
    denominator += (years[i] - meanX) ** 2;
  }

  const slope = denominator !== 0 ? numerator / denominator : 0;
  return slope * 10; // per decade
}

// Get most and least stable periods
export function getStabilityExtremes(stats: YearlyVariabilityStats[]): {
  mostStable: YearlyVariabilityStats[];
  leastStable: YearlyVariabilityStats[];
} {
  const sorted = [...stats].sort((a, b) => a.standardDeviation - b.standardDeviation);

  return {
    mostStable: sorted.slice(0, 5),
    leastStable: sorted.slice(-5).reverse()
  };
}
