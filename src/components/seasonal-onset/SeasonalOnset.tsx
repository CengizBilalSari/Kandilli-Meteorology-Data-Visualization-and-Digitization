import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { clsx } from 'clsx';
import { useSeasonalData } from '../../hooks/useSeasonalData';
import { useSeasonalStore } from '../../store/useSeasonalStore';
import { useDataStore } from '../../store/useDataStore';
import { SeasonDetectionMethod, TemperatureMetric } from '../../types';

const METHODS: { value: SeasonDetectionMethod; label: string }[] = [
  { value: 'consecutive', label: 'Consecutive Days' },
  { value: 'movingAverage', label: 'Moving Average' },
];

const METRICS: { value: TemperatureMetric; label: string }[] = [
  { value: 'avg', label: 'Average' },
  { value: 'min', label: 'Minimum' },
  { value: 'max', label: 'Maximum' },
];

// Convert day of year to month name
function dayOfYearToDate(day: number): string {
  const date = new Date(2000, 0, day);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function SeasonalOnset() {
  const { yearlyStats, summary, availableYears } = useSeasonalData();
  const {
    method,
    setMethod,
    warmThreshold,
    setWarmThreshold,
    coolThreshold,
    setCoolThreshold,
    consecutiveDays,
    setConsecutiveDays,
    movingAverageWindow,
    setMovingAverageWindow,
    summerLikeThreshold,
    setSummerLikeThreshold,
    winterLikeThreshold,
    setWinterLikeThreshold,
    metric,
    setMetric,
    startYear,
    endYear,
    setYearRange,
  } = useSeasonalStore();
  const { dailyRecords } = useDataStore();

  if (dailyRecords.length === 0) {
    return (
      <div className="p-6">
        <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
          Please upload temperature data to view seasonal analysis.
        </div>
      </div>
    );
  }

  const formatTrend = (trend: number) => {
    const sign = trend >= 0 ? '+' : '';
    return `${sign}${trend.toFixed(1)} days/decade`;
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;
    return (
      <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
        <p className="font-medium text-gray-900 mb-1">Year {label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} style={{ color: entry.color }} className="text-sm">
            {entry.name}: {entry.value !== null ? (
              entry.dataKey.includes('Days') ? entry.value : dayOfYearToDate(entry.value)
            ) : 'N/A'}
          </p>
        ))}
      </div>
    );
  };

  return (
    <div className="p-6 space-y-6">
      {/* Controls */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Shift in Seasonal Onset
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Year Range */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Year Range</label>
            <div className="flex gap-2 items-center">
              <select
                value={startYear ?? ''}
                onChange={(e) => setYearRange(e.target.value ? Number(e.target.value) : null, endYear)}
                className="flex-1 px-2 py-2 border border-gray-300 rounded text-sm"
              >
                <option value="">Start</option>
                {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
              <span className="text-gray-500">-</span>
              <select
                value={endYear ?? ''}
                onChange={(e) => setYearRange(startYear, e.target.value ? Number(e.target.value) : null)}
                className="flex-1 px-2 py-2 border border-gray-300 rounded text-sm"
              >
                <option value="">End</option>
                {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          </div>

          {/* Metric */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Temperature Metric</label>
            <div className="flex gap-2">
              {METRICS.map(m => (
                <button
                  key={m.value}
                  onClick={() => setMetric(m.value)}
                  className={clsx(
                    'flex-1 px-2 py-2 text-sm rounded border transition-colors',
                    metric === m.value
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'border-gray-300 hover:bg-gray-50'
                  )}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Detection Method */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Detection Method</label>
            <div className="flex gap-2">
              {METHODS.map(m => (
                <button
                  key={m.value}
                  onClick={() => setMethod(m.value)}
                  className={clsx(
                    'flex-1 px-2 py-2 text-sm rounded border transition-colors',
                    method === m.value
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'border-gray-300 hover:bg-gray-50'
                  )}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Window/Consecutive Days */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              {method === 'consecutive' ? 'Consecutive Days' : 'MA Window'}
            </label>
            <input
              type="number"
              value={method === 'consecutive' ? consecutiveDays : movingAverageWindow}
              onChange={(e) => {
                const val = Number(e.target.value);
                if (method === 'consecutive') {
                  setConsecutiveDays(val);
                } else {
                  setMovingAverageWindow(val);
                }
              }}
              min={1}
              max={30}
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
            />
          </div>
        </div>

        {/* Threshold Settings */}
        <div className="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-4 bg-orange-50 rounded-lg">
            <label className="block text-sm font-medium text-orange-800 mb-2">Warm Season Threshold</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={warmThreshold}
                onChange={(e) => setWarmThreshold(Number(e.target.value))}
                className="w-20 px-2 py-1 border border-orange-300 rounded text-sm"
              />
              <span className="text-orange-700">°C</span>
            </div>
          </div>

          <div className="p-4 bg-blue-50 rounded-lg">
            <label className="block text-sm font-medium text-blue-800 mb-2">Cool Season Threshold</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={coolThreshold}
                onChange={(e) => setCoolThreshold(Number(e.target.value))}
                className="w-20 px-2 py-1 border border-blue-300 rounded text-sm"
              />
              <span className="text-blue-700">°C</span>
            </div>
          </div>

          <div className="p-4 bg-red-50 rounded-lg">
            <label className="block text-sm font-medium text-red-800 mb-2">Summer-like Day</label>
            <div className="flex items-center gap-2">
              <span className="text-red-700">{'>'}</span>
              <input
                type="number"
                value={summerLikeThreshold}
                onChange={(e) => setSummerLikeThreshold(Number(e.target.value))}
                className="w-20 px-2 py-1 border border-red-300 rounded text-sm"
              />
              <span className="text-red-700">°C</span>
            </div>
          </div>

          <div className="p-4 bg-indigo-50 rounded-lg">
            <label className="block text-sm font-medium text-indigo-800 mb-2">Winter-like Day</label>
            <div className="flex items-center gap-2">
              <span className="text-indigo-700">{'<'}</span>
              <input
                type="number"
                value={winterLikeThreshold}
                onChange={(e) => setWinterLikeThreshold(Number(e.target.value))}
                className="w-20 px-2 py-1 border border-indigo-300 rounded text-sm"
              />
              <span className="text-indigo-700">°C</span>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <h4 className="text-sm text-gray-500 mb-1">Warm Season Start</h4>
          <p className="text-lg font-semibold text-orange-600">
            {summary.avgWarmSeasonStart ? dayOfYearToDate(Math.round(summary.avgWarmSeasonStart)) : 'N/A'}
          </p>
          <p className={clsx('text-sm', summary.warmSeasonStartTrend < 0 ? 'text-orange-600' : 'text-gray-600')}>
            {formatTrend(summary.warmSeasonStartTrend)}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <h4 className="text-sm text-gray-500 mb-1">Cool Season Start</h4>
          <p className="text-lg font-semibold text-blue-600">
            {summary.avgCoolSeasonStart ? dayOfYearToDate(Math.round(summary.avgCoolSeasonStart)) : 'N/A'}
          </p>
          <p className={clsx('text-sm', summary.coolSeasonStartTrend > 0 ? 'text-blue-600' : 'text-gray-600')}>
            {formatTrend(summary.coolSeasonStartTrend)}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <h4 className="text-sm text-gray-500 mb-1">Summer-like Days</h4>
          <p className="text-lg font-semibold text-red-600">
            {summary.firstYearSummerDays} → {summary.lastYearSummerDays}
          </p>
          <p className={clsx('text-sm', summary.summerLikeDaysTrend > 0 ? 'text-red-600' : 'text-gray-600')}>
            {formatTrend(summary.summerLikeDaysTrend)}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <h4 className="text-sm text-gray-500 mb-1">Winter-like Days</h4>
          <p className="text-lg font-semibold text-indigo-600">
            {summary.firstYearWinterDays} → {summary.lastYearWinterDays}
          </p>
          <p className={clsx('text-sm', summary.winterLikeDaysTrend < 0 ? 'text-indigo-600' : 'text-gray-600')}>
            {formatTrend(summary.winterLikeDaysTrend)}
          </p>
        </div>
      </div>

      {/* Season Start Date Chart */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="font-medium text-gray-900 mb-4">Season Start Date Trend</h3>
        {yearlyStats.length > 0 ? (
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={yearlyStats} margin={{ top: 10, right: 30, left: 10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="year" tick={{ fontSize: 12 }} />
                <YAxis
                  domain={['auto', 'auto']}
                  tickFormatter={(v) => dayOfYearToDate(v)}
                  tick={{ fontSize: 11 }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="warmSeasonStart"
                  name="Warm Season Start"
                  stroke="#f97316"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  connectNulls
                />
                <Line
                  type="monotone"
                  dataKey="coolSeasonStart"
                  name="Cool Season Start"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  connectNulls
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-72 flex items-center justify-center bg-gray-50 rounded-lg">
            <p className="text-gray-500">No data available</p>
          </div>
        )}
      </div>

      {/* Summer-like / Winter-like Days Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="font-medium text-gray-900 mb-4">Summer-like Days per Year</h3>
          {yearlyStats.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={yearlyStats} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="summerLikeDays" name="Summer-like Days" fill="#ef4444" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
              <p className="text-gray-500">No data available</p>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="font-medium text-gray-900 mb-4">Winter-like Days per Year</h3>
          {yearlyStats.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={yearlyStats} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="winterLikeDays" name="Winter-like Days" fill="#6366f1" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
              <p className="text-gray-500">No data available</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
