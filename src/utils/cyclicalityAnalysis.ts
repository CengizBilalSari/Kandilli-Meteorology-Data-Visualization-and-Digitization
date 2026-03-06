import { DailyRecord } from '../types';
import { calculateMean } from './variabilityCalculations';

export interface DecadeData {
  decade: string;
  decadeStart: number;
  yearlyAverages: { yearInDecade: number; value: number; actualYear: number }[];
  overallMean: number;
}

export interface SimilarityMatrix {
  decades: string[];
  values: number[][];
}

export interface SmoothedDataPoint {
  year: number;
  value: number;
  smoothedValue: number;
  detrended: number;
}

// Extract decade data aligned by position in decade (year 0-9)
export function extractDecadeData(
  records: DailyRecord[],
  metric: 'avgTemp' | 'minTemp' | 'maxTemp',
  selectedDecades?: number[]
): DecadeData[] {
  // Group by year first
  const byYear = new Map<number, number[]>();

  for (const record of records) {
    const value = record[metric];
    if (value === null) continue;

    if (!byYear.has(record.year)) {
      byYear.set(record.year, []);
    }
    byYear.get(record.year)!.push(value);
  }

  // Calculate yearly averages
  const yearlyAvgs = new Map<number, number>();
  for (const [year, values] of byYear) {
    yearlyAvgs.set(year, calculateMean(values));
  }

  // Group by decade
  const decades = new Map<number, { yearInDecade: number; value: number; actualYear: number }[]>();

  for (const [year, avg] of yearlyAvgs) {
    const decadeStart = Math.floor(year / 10) * 10;

    // Skip if not in selected decades
    if (selectedDecades && selectedDecades.length > 0 && !selectedDecades.includes(decadeStart)) {
      continue;
    }

    if (!decades.has(decadeStart)) {
      decades.set(decadeStart, []);
    }

    decades.get(decadeStart)!.push({
      yearInDecade: year % 10,
      value: avg,
      actualYear: year
    });
  }

  const result: DecadeData[] = [];

  for (const [decadeStart, data] of decades) {
    // Sort by year in decade
    data.sort((a, b) => a.yearInDecade - b.yearInDecade);

    result.push({
      decade: `${decadeStart}s`,
      decadeStart,
      yearlyAverages: data,
      overallMean: calculateMean(data.map(d => d.value))
    });
  }

  return result.sort((a, b) => a.decadeStart - b.decadeStart);
}

// Calculate similarity between two periods using Pearson correlation
export function calculatePeriodSimilarity(period1: number[], period2: number[]): number {
  const n = Math.min(period1.length, period2.length);
  if (n < 3) return 0;

  const p1 = period1.slice(0, n);
  const p2 = period2.slice(0, n);

  const mean1 = calculateMean(p1);
  const mean2 = calculateMean(p2);

  let numerator = 0;
  let denom1 = 0;
  let denom2 = 0;

  for (let i = 0; i < n; i++) {
    const diff1 = p1[i] - mean1;
    const diff2 = p2[i] - mean2;
    numerator += diff1 * diff2;
    denom1 += diff1 * diff1;
    denom2 += diff2 * diff2;
  }

  const denomProduct = Math.sqrt(denom1 * denom2);
  return denomProduct !== 0 ? numerator / denomProduct : 0;
}

// Build similarity matrix between all decades
export function buildSimilarityMatrix(decadeData: DecadeData[]): SimilarityMatrix {
  const n = decadeData.length;
  const decades = decadeData.map(d => d.decade);
  const values: number[][] = [];

  for (let i = 0; i < n; i++) {
    const row: number[] = [];
    for (let j = 0; j < n; j++) {
      if (i === j) {
        row.push(1);
      } else {
        const p1 = decadeData[i].yearlyAverages.map(y => y.value);
        const p2 = decadeData[j].yearlyAverages.map(y => y.value);
        row.push(calculatePeriodSimilarity(p1, p2));
      }
    }
    values.push(row);
  }

  return { decades, values };
}

// Apply smoothing with moving average
export function applySmoothing(
  records: DailyRecord[],
  metric: 'avgTemp' | 'minTemp' | 'maxTemp',
  windowSize: number
): SmoothedDataPoint[] {
  // Get yearly averages first
  const byYear = new Map<number, number[]>();

  for (const record of records) {
    const value = record[metric];
    if (value === null) continue;

    if (!byYear.has(record.year)) {
      byYear.set(record.year, []);
    }
    byYear.get(record.year)!.push(value);
  }

  // Calculate yearly averages and sort
  const yearlyData: { year: number; value: number }[] = [];
  for (const [year, values] of byYear) {
    yearlyData.push({ year, value: calculateMean(values) });
  }
  yearlyData.sort((a, b) => a.year - b.year);

  // Apply moving average
  const result: SmoothedDataPoint[] = [];
  const halfWindow = Math.floor(windowSize / 2);

  for (let i = 0; i < yearlyData.length; i++) {
    const start = Math.max(0, i - halfWindow);
    const end = Math.min(yearlyData.length, i + halfWindow + 1);
    const window = yearlyData.slice(start, end);
    const smoothedValue = calculateMean(window.map(w => w.value));

    result.push({
      year: yearlyData[i].year,
      value: yearlyData[i].value,
      smoothedValue,
      detrended: 0 // Will be calculated later
    });
  }

  // Calculate detrended values (remove linear trend)
  if (result.length >= 2) {
    const n = result.length;
    const years = result.map(r => r.year);
    const values = result.map(r => r.value);

    const meanX = calculateMean(years);
    const meanY = calculateMean(values);

    let num = 0;
    let den = 0;
    for (let i = 0; i < n; i++) {
      num += (years[i] - meanX) * (values[i] - meanY);
      den += (years[i] - meanX) ** 2;
    }

    const slope = den !== 0 ? num / den : 0;
    const intercept = meanY - slope * meanX;

    for (let i = 0; i < n; i++) {
      const trend = slope * years[i] + intercept;
      result[i].detrended = values[i] - trend;
    }
  }

  return result;
}

// Normalize decade data to baseline (first year = 0)
export function normalizeDecadeData(decadeData: DecadeData[]): DecadeData[] {
  return decadeData.map(decade => {
    const baseline = decade.yearlyAverages[0]?.value || 0;
    return {
      ...decade,
      yearlyAverages: decade.yearlyAverages.map(y => ({
        ...y,
        value: y.value - baseline
      })),
      overallMean: decade.overallMean - baseline
    };
  });
}

// Calculate linear trend
export function calculateLinearTrend(data: SmoothedDataPoint[]): {
  slope: number;
  intercept: number;
  rSquared: number;
} {
  if (data.length < 2) {
    return { slope: 0, intercept: 0, rSquared: 0 };
  }

  const n = data.length;
  const years = data.map(d => d.year);
  const values = data.map(d => d.value);

  const meanX = calculateMean(years);
  const meanY = calculateMean(values);

  let ssXY = 0;
  let ssXX = 0;
  let ssYY = 0;

  for (let i = 0; i < n; i++) {
    const dx = years[i] - meanX;
    const dy = values[i] - meanY;
    ssXY += dx * dy;
    ssXX += dx * dx;
    ssYY += dy * dy;
  }

  const slope = ssXX !== 0 ? ssXY / ssXX : 0;
  const intercept = meanY - slope * meanX;
  const rSquared = ssXX * ssYY !== 0 ? (ssXY * ssXY) / (ssXX * ssYY) : 0;

  return { slope, intercept, rSquared };
}

// Detect potential oscillation periods
export function detectOscillationPeriods(
  data: SmoothedDataPoint[],
  minPeriod: number = 5,
  maxPeriod: number = 15
): { period: number; strength: number }[] {
  if (data.length < maxPeriod * 2) return [];

  const detrended = data.map(d => d.detrended);
  const results: { period: number; strength: number }[] = [];

  for (let period = minPeriod; period <= maxPeriod; period++) {
    // Simple autocorrelation at lag = period
    const n = detrended.length - period;
    if (n < period) continue;

    let sumProduct = 0;
    let sumSquare1 = 0;
    let sumSquare2 = 0;

    const mean1 = calculateMean(detrended.slice(0, n));
    const mean2 = calculateMean(detrended.slice(period, period + n));

    for (let i = 0; i < n; i++) {
      const d1 = detrended[i] - mean1;
      const d2 = detrended[i + period] - mean2;
      sumProduct += d1 * d2;
      sumSquare1 += d1 * d1;
      sumSquare2 += d2 * d2;
    }

    const correlation = Math.sqrt(sumSquare1 * sumSquare2) !== 0
      ? sumProduct / Math.sqrt(sumSquare1 * sumSquare2)
      : 0;

    if (correlation > 0.3) {
      results.push({ period, strength: correlation });
    }
  }

  return results.sort((a, b) => b.strength - a.strength);
}

// Generate insights about patterns
export function generateInsights(
  decadeData: DecadeData[],
  similarityMatrix: SimilarityMatrix,
  trend: { slope: number },
  oscillations: { period: number; strength: number }[]
): string[] {
  const insights: string[] = [];

  // Warming trend insight
  if (trend.slope > 0.02) {
    insights.push(`Consistent warming pattern: approximately +${(trend.slope * 10).toFixed(2)}°C per decade`);
  } else if (trend.slope < -0.02) {
    insights.push(`Cooling pattern detected: approximately ${(trend.slope * 10).toFixed(2)}°C per decade`);
  } else {
    insights.push('Temperature has remained relatively stable over the period');
  }

  // Adjacent decade similarity
  const adjacentSims: number[] = [];
  for (let i = 0; i < similarityMatrix.values.length - 1; i++) {
    adjacentSims.push(similarityMatrix.values[i][i + 1]);
  }
  const avgAdjacentSim = adjacentSims.length > 0 ? calculateMean(adjacentSims) : 0;

  if (avgAdjacentSim > 0.7) {
    insights.push(`Adjacent decades show high similarity (avg: ${(avgAdjacentSim * 100).toFixed(0)}%), suggesting gradual change`);
  } else if (avgAdjacentSim < 0.4) {
    insights.push(`Adjacent decades show low similarity (avg: ${(avgAdjacentSim * 100).toFixed(0)}%), indicating rapid changes`);
  }

  // Decade temperature shifts
  if (decadeData.length >= 2) {
    const firstDecade = decadeData[0];
    const lastDecade = decadeData[decadeData.length - 1];
    const shift = lastDecade.overallMean - firstDecade.overallMean;

    if (Math.abs(shift) > 0.5) {
      insights.push(`Temperature shift from ${firstDecade.decade} to ${lastDecade.decade}: ${shift > 0 ? '+' : ''}${shift.toFixed(1)}°C`);
    }
  }

  // Oscillation patterns
  if (oscillations.length > 0) {
    const strongest = oscillations[0];
    insights.push(`Potential ${strongest.period}-year cycle detected (correlation: ${(strongest.strength * 100).toFixed(0)}%)`);
  } else {
    insights.push('No clear multi-year oscillation patterns detected');
  }

  // Seasonal shape preservation
  if (avgAdjacentSim > 0.6 && decadeData.length > 2) {
    insights.push('Seasonal temperature shapes appear to be preserved across decades');
  }

  return insights;
}
