import {
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
} from 'recharts';
import { format } from 'date-fns';
import { DateRangePicker } from '../common/DateRangePicker';
import { ScaleSelector } from '../common/ScaleSelector';
import { MonthSelector } from '../common/MonthSelector';
import { TrendLineToggle } from '../common/TrendLineToggle';
import { useWarmingChartData } from '../../hooks/useWarmingChartData';
import { useFilterStore } from '../../store/useFilterStore';
import { useDataStore } from '../../store/useDataStore';

export function WarmingChart() {
  const { chartData, stats } = useWarmingChartData();
  const { showTrendLine, scale, visibleMetrics, toggleVisibleMetric } = useFilterStore();
  const { dailyRecords } = useDataStore();

  const formatXAxis = (timestamp: number) => {
    const date = new Date(timestamp);
    switch (scale) {
      case 'daily':
        return format(date, 'MMM d');
      case 'weekly':
        return format(date, 'MMM d');
      case 'monthly':
        return format(date, 'MMM yyyy');
      case 'seasonal':
        return format(date, 'QQQ yyyy');
      case 'yearly':
        return format(date, 'yyyy');
      default:
        return format(date, 'yyyy-MM-dd');
    }
  };

  const formatTooltip = (value: number | null) => {
    if (value === null) return 'N/A';
    return `${value.toFixed(1)}°C`;
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload.length) return null;

    const data = payload[0].payload;
    return (
      <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
        <p className="font-medium text-gray-900 mb-2">{data.label}</p>
        <div className="space-y-1 text-sm">
          <p className="text-red-600">
            Max: {formatTooltip(data.max)}
          </p>
          <p className="text-gray-900 font-medium">
            Avg: {formatTooltip(data.avg)}
          </p>
          <p className="text-blue-600">
            Min: {formatTooltip(data.min)}
          </p>
          {showTrendLine && data.trendValue !== null && (
            <p className="text-orange-600 mt-1 pt-1 border-t">
              Trend: {formatTooltip(data.trendValue)}
            </p>
          )}
        </div>
      </div>
    );
  };

  if (dailyRecords.length === 0) {
    return (
      <div className="p-6">
        <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
          Please upload temperature data to view the warming chart.
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Controls */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Temperature Trend Analysis
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <DateRangePicker />
          <ScaleSelector />
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <MonthSelector />
          <TrendLineToggle />
        </div>
      </div>

      {/* Chart */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-medium text-gray-900">Temperature Range</h3>
            {/* Metric checkboxes */}
            <div className="flex items-center gap-4 mt-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={visibleMetrics.max}
                  onChange={() => toggleVisibleMetric('max')}
                  className="w-4 h-4 rounded border-gray-300 text-red-500 focus:ring-red-500"
                />
                <span className="text-sm text-red-600 font-medium">Max</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={visibleMetrics.avg}
                  onChange={() => toggleVisibleMetric('avg')}
                  className="w-4 h-4 rounded border-gray-300 text-gray-700 focus:ring-gray-500"
                />
                <span className="text-sm text-gray-900 font-medium">Avg</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={visibleMetrics.min}
                  onChange={() => toggleVisibleMetric('min')}
                  className="w-4 h-4 rounded border-gray-300 text-blue-500 focus:ring-blue-500"
                />
                <span className="text-sm text-blue-600 font-medium">Min</span>
              </label>
            </div>
          </div>
          {stats.count > 0 && (
            <div className="flex gap-4 text-sm text-gray-600">
              <span>Min: <span className="font-medium text-blue-600">{stats.min?.toFixed(1)}°C</span></span>
              <span>Avg: <span className="font-medium text-gray-900">{stats.avg?.toFixed(1)}°C</span></span>
              <span>Max: <span className="font-medium text-red-600">{stats.max?.toFixed(1)}°C</span></span>
              <span className="text-gray-400">|</span>
              <span>{stats.count} data points</span>
            </div>
          )}
        </div>

        {chartData.length > 0 ? (
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={chartData}
                margin={{ top: 10, right: 30, left: 10, bottom: 10 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="timestamp"
                  tickFormatter={formatXAxis}
                  tick={{ fontSize: 12 }}
                  stroke="#6b7280"
                />
                <YAxis
                  domain={['auto', 'auto']}
                  tickFormatter={(v) => `${v}°C`}
                  tick={{ fontSize: 12 }}
                  stroke="#6b7280"
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />

                {/* Reference lines for key temperatures */}
                <ReferenceLine y={0} stroke="#93c5fd" strokeDasharray="5 5" />
                <ReferenceLine y={25} stroke="#fca5a5" strokeDasharray="5 5" />

                {/* Stacked areas for Bollinger band effect */}
                {(visibleMetrics.min || visibleMetrics.max) && (
                  <>
                    {/* Base: min value (invisible, just for positioning) */}
                    <Area
                      type="monotone"
                      dataKey="min"
                      stackId="band"
                      fill="transparent"
                      stroke="none"
                      name="Min (base)"
                      legendType="none"
                    />
                    {/* Lower band: from min to avg (blue - cold zone) */}
                    <Area
                      type="monotone"
                      dataKey="lowerBand"
                      stackId="band"
                      fill={visibleMetrics.min ? "#3b82f6" : "transparent"}
                      fillOpacity={visibleMetrics.min ? 0.3 : 0}
                      stroke="none"
                      name="Min Zone"
                      legendType={visibleMetrics.min ? "square" : "none"}
                    />
                    {/* Upper band: from avg to max (red - hot zone) */}
                    <Area
                      type="monotone"
                      dataKey="upperBand"
                      stackId="band"
                      fill={visibleMetrics.max ? "#ef4444" : "transparent"}
                      fillOpacity={visibleMetrics.max ? 0.3 : 0}
                      stroke="none"
                      name="Max Zone"
                      legendType={visibleMetrics.max ? "square" : "none"}
                    />
                  </>
                )}

                {/* Average line */}
                {visibleMetrics.avg && (
                  <Line
                    type="monotone"
                    dataKey="avg"
                    name="Average"
                    stroke="#1f2937"
                    strokeWidth={2}
                    dot={chartData.length < 100}
                    activeDot={{ r: 6, fill: '#1f2937' }}
                    connectNulls
                  />
                )}

                {/* Trend line */}
                {showTrendLine && (
                  <Line
                    type="monotone"
                    dataKey="trendValue"
                    name="Trend"
                    stroke="#f97316"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={false}
                    connectNulls
                  />
                )}
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-96 flex items-center justify-center bg-gray-50 rounded-lg">
            <p className="text-gray-500">No data available for the selected filters</p>
          </div>
        )}
      </div>
    </div>
  );
}
