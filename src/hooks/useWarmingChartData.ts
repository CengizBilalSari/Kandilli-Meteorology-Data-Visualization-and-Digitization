import { useMemo } from 'react';
import { useDataStore } from '../store/useDataStore';
import { useFilterStore } from '../store/useFilterStore';
import { filterByDateRange, filterByMonths, aggregateRecords, calculateMovingAverage, calculateTrendLine } from '../utils/aggregation';

export interface ChartDataPoint {
  date: string;
  timestamp: number;
  avg: number | null;
  min: number | null;
  max: number | null;
  // For stacked area chart (Bollinger band effect)
  lowerBand: number | null; // avg - min (red zone height)
  upperBand: number | null; // max - avg (blue zone height)
  trendValue: number | null;
  label: string;
}

export function useWarmingChartData() {
  const { dailyRecords } = useDataStore();
  const { startDate, endDate, scale, selectedMonths, showTrendLine, movingAverageWindow } = useFilterStore();

  const chartData = useMemo(() => {
    if (dailyRecords.length === 0) return [];

    // Apply filters
    let filtered = dailyRecords;

    if (startDate || endDate) {
      filtered = filterByDateRange(filtered, startDate, endDate);
    }

    if (selectedMonths.length > 0 && selectedMonths.length < 12) {
      filtered = filterByMonths(filtered, selectedMonths);
    }

    if (filtered.length === 0) return [];

    // Aggregate
    const aggregated = aggregateRecords(filtered, scale);

    // Extract all three temperature values
    const avgValues = aggregated.map(r => r.avgTemp);

    // Calculate trend line based on average if enabled
    let trendValues: (number | null)[] = [];
    if (showTrendLine) {
      if (scale === 'daily') {
        // Use moving average for daily data
        trendValues = calculateMovingAverage(avgValues, movingAverageWindow);
      } else {
        // Use linear regression for aggregated data
        const dataPoints = avgValues.map((y, x) => ({ x, y }));
        const { values: lineValues } = calculateTrendLine(dataPoints);
        trendValues = lineValues;
      }
    }

    // Convert to chart data points with Bollinger band values
    const chartPoints: ChartDataPoint[] = aggregated.map((record, index) => {
      const avg = record.avgTemp;
      const min = record.minTemp;
      const max = record.maxTemp;

      return {
        date: record.periodStart.toISOString(),
        timestamp: record.periodStart.getTime(),
        avg,
        min,
        max,
        // Calculate band heights for stacking (min as base, then lowerBand, then upperBand)
        lowerBand: (avg !== null && min !== null) ? avg - min : null,
        upperBand: (max !== null && avg !== null) ? max - avg : null,
        trendValue: trendValues[index] ?? null,
        label: record.periodLabel,
      };
    });

    return chartPoints;
  }, [dailyRecords, startDate, endDate, scale, selectedMonths, showTrendLine, movingAverageWindow]);

  // Calculate statistics based on average temperature
  const stats = useMemo(() => {
    const validAvgValues = chartData.filter(d => d.avg !== null).map(d => d.avg as number);
    const validMinValues = chartData.filter(d => d.min !== null).map(d => d.min as number);
    const validMaxValues = chartData.filter(d => d.max !== null).map(d => d.max as number);

    if (validAvgValues.length === 0) {
      return { min: null, max: null, avg: null, count: 0 };
    }

    return {
      min: validMinValues.length > 0 ? Math.min(...validMinValues) : null,
      max: validMaxValues.length > 0 ? Math.max(...validMaxValues) : null,
      avg: validAvgValues.reduce((sum, v) => sum + v, 0) / validAvgValues.length,
      count: validAvgValues.length,
    };
  }, [chartData]);

  return { chartData, stats };
}
