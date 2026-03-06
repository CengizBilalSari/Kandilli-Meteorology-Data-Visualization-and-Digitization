import { useMemo } from 'react';
import { useDataStore } from '../store/useDataStore';
import { useFilterStore } from '../store/useFilterStore';
import { filterByDateRange, filterByMonths, aggregateRecords, calculateMovingAverage, calculateTrendLine, getTemperatureValue } from '../utils/aggregation';

export interface ChartDataPoint {
  date: string;
  timestamp: number;
  value: number | null;
  trendValue: number | null;
  label: string;
}

export function useWarmingChartData() {
  const { dailyRecords } = useDataStore();
  const { startDate, endDate, scale, metric, selectedMonths, showTrendLine, movingAverageWindow } = useFilterStore();

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

    // Extract values for the selected metric
    const values = aggregated.map(r => getTemperatureValue(r, metric));

    // Calculate trend line if enabled
    let trendValues: (number | null)[] = [];
    if (showTrendLine) {
      if (scale === 'daily') {
        // Use moving average for daily data
        trendValues = calculateMovingAverage(values, movingAverageWindow);
      } else {
        // Use linear regression for aggregated data
        const dataPoints = values.map((y, x) => ({ x, y }));
        const { values: lineValues } = calculateTrendLine(dataPoints);
        trendValues = lineValues;
      }
    }

    // Convert to chart data points
    const chartPoints: ChartDataPoint[] = aggregated.map((record, index) => ({
      date: record.periodStart.toISOString(),
      timestamp: record.periodStart.getTime(),
      value: values[index],
      trendValue: trendValues[index] ?? null,
      label: record.periodLabel,
    }));

    return chartPoints;
  }, [dailyRecords, startDate, endDate, scale, metric, selectedMonths, showTrendLine, movingAverageWindow]);

  // Calculate statistics
  const stats = useMemo(() => {
    const validValues = chartData.filter(d => d.value !== null).map(d => d.value as number);

    if (validValues.length === 0) {
      return { min: null, max: null, avg: null, count: 0 };
    }

    return {
      min: Math.min(...validValues),
      max: Math.max(...validValues),
      avg: validValues.reduce((sum, v) => sum + v, 0) / validValues.length,
      count: validValues.length,
    };
  }, [chartData]);

  return { chartData, stats };
}
