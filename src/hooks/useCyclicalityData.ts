import { useMemo } from 'react';
import { useDataStore } from '../store/useDataStore';
import { useCyclicalityStore } from '../store/useCyclicalityStore';
import { useDataRange } from './useDataRange';
import {
  extractDecadeData,
  buildSimilarityMatrix,
  applySmoothing,
  normalizeDecadeData,
  calculateLinearTrend,
  detectOscillationPeriods,
  generateInsights
} from '../utils/cyclicalityAnalysis';

export function useCyclicalityData() {
  const { dailyRecords } = useDataStore();
  const {
    startYear,
    endYear,
    metric,
    smoothingWindow,
    selectedDecades,
    normalizeToBaseline,
    selectedSeason
  } = useCyclicalityStore();

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

  // Get all available decades
  const availableDecades = useMemo(() => {
    const decades = new Set<number>();
    for (const record of filteredRecords) {
      decades.add(Math.floor(record.year / 10) * 10);
    }
    return Array.from(decades).sort();
  }, [filteredRecords]);

  // Extract decade data
  const decadeData = useMemo(() => {
    const data = extractDecadeData(filteredRecords, metric, selectedDecades);
    return normalizeToBaseline ? normalizeDecadeData(data) : data;
  }, [filteredRecords, metric, selectedDecades, normalizeToBaseline]);

  // All decades data (for similarity matrix)
  const allDecadesData = useMemo(() => {
    return extractDecadeData(filteredRecords, metric);
  }, [filteredRecords, metric]);

  // Similarity matrix
  const similarityMatrix = useMemo(() => {
    return buildSimilarityMatrix(allDecadesData);
  }, [allDecadesData]);

  // Smoothed data
  const smoothedData = useMemo(() => {
    return applySmoothing(filteredRecords, metric, smoothingWindow);
  }, [filteredRecords, metric, smoothingWindow]);

  // Linear trend
  const linearTrend = useMemo(() => {
    return calculateLinearTrend(smoothedData);
  }, [smoothedData]);

  // Oscillation detection
  const oscillations = useMemo(() => {
    return detectOscillationPeriods(smoothedData);
  }, [smoothedData]);

  // Generate insights
  const insights = useMemo(() => {
    return generateInsights(allDecadesData, similarityMatrix, linearTrend, oscillations);
  }, [allDecadesData, similarityMatrix, linearTrend, oscillations]);

  // Prepare overlay chart data (decades aligned)
  const overlayChartData = useMemo(() => {
    const data: { yearInDecade: number; [key: string]: number }[] = [];

    for (let i = 0; i < 10; i++) {
      const point: { yearInDecade: number; [key: string]: number } = { yearInDecade: i };

      for (const decade of decadeData) {
        const yearData = decade.yearlyAverages.find(y => y.yearInDecade === i);
        if (yearData) {
          point[decade.decade] = yearData.value;
        }
      }

      data.push(point);
    }

    return data;
  }, [decadeData]);

  // Summary statistics
  const summary = useMemo(() => {
    if (decadeData.length < 2) return null;

    const firstDecade = decadeData[0];
    const lastDecade = decadeData[decadeData.length - 1];

    // Adjacent decade similarities
    const adjacentSimilarities: number[] = [];
    for (let i = 0; i < similarityMatrix.values.length - 1; i++) {
      adjacentSimilarities.push(similarityMatrix.values[i][i + 1]);
    }

    return {
      temperatureShift: lastDecade.overallMean - firstDecade.overallMean,
      firstDecade: firstDecade.decade,
      lastDecade: lastDecade.decade,
      avgAdjacentSimilarity: adjacentSimilarities.length > 0
        ? adjacentSimilarities.reduce((a, b) => a + b, 0) / adjacentSimilarities.length
        : 0,
      trendPerDecade: linearTrend.slope * 10,
      rSquared: linearTrend.rSquared
    };
  }, [decadeData, similarityMatrix, linearTrend]);

  return {
    availableDecades,
    decadeData,
    similarityMatrix,
    smoothedData,
    linearTrend,
    oscillations,
    insights,
    overlayChartData,
    summary
  };
}
