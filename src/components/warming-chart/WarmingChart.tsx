import {
  LineChart,
  Line,
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
import { MetricToggle } from '../common/MetricToggle';
import { MonthSelector } from '../common/MonthSelector';
import { TrendLineToggle } from '../common/TrendLineToggle';
import { useWarmingChartData } from '../../hooks/useWarmingChartData';
import { useFilterStore } from '../../store/useFilterStore';
import { useDataStore } from '../../store/useDataStore';

const METRIC_LABELS = {
  avg: 'Average Temperature',
  min: 'Minimum Temperature',
  max: 'Maximum Temperature',
};

export function WarmingChart() {
  const { chartData, stats } = useWarmingChartData();
  const { metric, showTrendLine, scale } = useFilterStore();
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
        <p className="font-medium text-gray-900">{data.label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} style={{ color: entry.color }} className="text-sm">
            {entry.name}: {formatTooltip(entry.value)}
          </p>
        ))}
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
          Warming Chart With Different Scales
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <DateRangePicker />
          <ScaleSelector />
          <MetricToggle />
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <MonthSelector />
          <TrendLineToggle />
        </div>
      </div>

      {/* Chart */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium text-gray-900">{METRIC_LABELS[metric]}</h3>
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
              <LineChart
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

                {/* Main data line */}
                <Line
                  type="monotone"
                  dataKey="value"
                  name={METRIC_LABELS[metric]}
                  stroke="#2563eb"
                  strokeWidth={2}
                  dot={chartData.length < 100}
                  activeDot={{ r: 6, fill: '#2563eb' }}
                  connectNulls
                />

                {/* Trend line */}
                {showTrendLine && (
                  <Line
                    type="monotone"
                    dataKey="trendValue"
                    name="Trend"
                    stroke="#dc2626"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={false}
                    connectNulls
                  />
                )}
              </LineChart>
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
