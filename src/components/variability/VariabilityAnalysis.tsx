import { useVariabilityStore } from '../../store/useVariabilityStore';
import { useVariabilityData } from '../../hooks/useVariabilityData';
import { useDataRange } from '../../hooks/useDataRange';
import {
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  ComposedChart,
  Area
} from 'recharts';

const SEASONS = ['Winter', 'Spring', 'Summer', 'Autumn'];
const SEASON_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444'];

const VARIABILITY_METRICS = [
  { value: 'standardDeviation', label: 'Standard Deviation' },
  { value: 'dailyRange', label: 'Daily Range (Max-Min)' },
  { value: 'monthlySpread', label: 'Monthly Spread' },
  { value: 'coefficientOfVariation', label: 'Coefficient of Variation' }
];

export function VariabilityAnalysis() {
  const {
    startYear,
    endYear,
    metric,
    variabilityMetric,
    selectedSeason,
    showDecadeComparison,
    smoothingWindow,
    setStartYear,
    setEndYear,
    setMetric,
    setVariabilityMetric,
    setSelectedSeason,
    setShowDecadeComparison,
    setSmoothingWindow
  } = useVariabilityStore();

  const {
    smoothedYearlyStats,
    seasonalStats,
    decadeDistributions,
    rangeDecadeDistributions,
    sdTrend,
    rangeTrend,
    stabilityExtremes,
    summary
  } = useVariabilityData();

  // Get data range from the single source of truth
  const dataRange = useDataRange();

  // Show loading if data not ready
  if (!dataRange.isLoaded || dataRange.minYear === null || dataRange.maxYear === null) {
    return (
      <div className="p-6">
        <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
          Loading data...
        </div>
      </div>
    );
  }

  const { minYear, maxYear } = dataRange;

  // Use store values or fall back to data range
  const effectiveStartYear = startYear ?? minYear;
  const effectiveEndYear = endYear ?? maxYear;

  const handleStartYearChange = (value: string) => {
    const val = parseInt(value);
    if (!isNaN(val) && val >= minYear && val <= maxYear) {
      setStartYear(val);
    }
  };

  const handleEndYearChange = (value: string) => {
    const val = parseInt(value);
    if (!isNaN(val) && val >= minYear && val <= maxYear) {
      setEndYear(val);
    }
  };

  const handleStartYearBlur = (value: string) => {
    const val = parseInt(value);
    if (isNaN(val) || val < minYear) {
      setStartYear(minYear);
    } else if (val > maxYear) {
      setStartYear(maxYear);
    }
  };

  const handleEndYearBlur = (value: string) => {
    const val = parseInt(value);
    if (isNaN(val) || val < minYear) {
      setEndYear(minYear);
    } else if (val > maxYear) {
      setEndYear(maxYear);
    }
  };

  // Prepare chart data
  const chartData = smoothedYearlyStats.map((stat) => ({
    year: stat.year,
    standardDeviation: stat.standardDeviation,
    smoothedSD: stat.smoothedSD,
    dailyRange: stat.meanDailyRange,
    smoothedRange: stat.smoothedRange,
    monthlySpread: stat.monthlySpread,
    coefficientOfVariation: stat.coefficientOfVariation
  }));

  // Box plot data for decades
  const boxPlotData = (variabilityMetric === 'dailyRange' ? rangeDecadeDistributions : decadeDistributions).map(d => ({
    decade: d.decade,
    min: d.min,
    q1: d.q1,
    median: d.median,
    q3: d.q3,
    max: d.max,
    mean: d.mean,
    sd: d.standardDeviation
  }));

  // Get the value key based on selected metric
  const getMetricKey = () => {
    switch (variabilityMetric) {
      case 'standardDeviation': return 'standardDeviation';
      case 'dailyRange': return 'dailyRange';
      case 'monthlySpread': return 'monthlySpread';
      case 'coefficientOfVariation': return 'coefficientOfVariation';
      default: return 'standardDeviation';
    }
  };

  const metricKey = getMetricKey();

  const getTrend = () => {
    return variabilityMetric === 'dailyRange' ? rangeTrend : sdTrend;
  };

  return (
    <div className="p-6 space-y-6">
      {/* Controls */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Year Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Year Range ({minYear}-{maxYear})</label>
            <div className="flex gap-2 items-center">
              <input
                type="number"
                value={effectiveStartYear}
                onChange={(e) => handleStartYearChange(e.target.value)}
                onBlur={(e) => handleStartYearBlur(e.target.value)}
                className="w-20 px-2 py-1 border rounded text-sm"
                min={minYear}
                max={maxYear}
              />
              <span className="text-gray-500">to</span>
              <input
                type="number"
                value={effectiveEndYear}
                onChange={(e) => handleEndYearChange(e.target.value)}
                onBlur={(e) => handleEndYearBlur(e.target.value)}
                className="w-20 px-2 py-1 border rounded text-sm"
                min={minYear}
                max={maxYear}
              />
            </div>
          </div>

          {/* Temperature Metric */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Temperature</label>
            <div className="flex gap-3">
              {(['avgTemp', 'minTemp', 'maxTemp'] as const).map((m) => (
                <label key={m} className="flex items-center gap-1 text-sm">
                  <input
                    type="radio"
                    checked={metric === m}
                    onChange={() => setMetric(m)}
                    className="text-blue-600"
                  />
                  {m === 'avgTemp' ? 'Avg' : m === 'minTemp' ? 'Min' : 'Max'}
                </label>
              ))}
            </div>
          </div>

          {/* Variability Metric */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Variability Metric</label>
            <select
              value={variabilityMetric}
              onChange={(e) => setVariabilityMetric(e.target.value as any)}
              className="w-full px-2 py-1 border rounded text-sm"
            >
              {VARIABILITY_METRICS.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>

          {/* Season Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Season</label>
            <select
              value={selectedSeason ?? ''}
              onChange={(e) => setSelectedSeason(e.target.value === '' ? null : parseInt(e.target.value))}
              className="w-full px-2 py-1 border rounded text-sm"
            >
              <option value="">All Seasons</option>
              {SEASONS.map((s, i) => (
                <option key={s} value={i}>{s}</option>
              ))}
            </select>
          </div>

          {/* Smoothing Window */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Smoothing</label>
            <select
              value={smoothingWindow}
              onChange={(e) => setSmoothingWindow(parseInt(e.target.value))}
              className="w-full px-2 py-1 border rounded text-sm"
            >
              <option value={1}>None</option>
              <option value={3}>3-year</option>
              <option value={5}>5-year</option>
              <option value={7}>7-year</option>
              <option value={10}>10-year</option>
            </select>
          </div>
        </div>

        {/* Options */}
        <div className="flex items-center gap-4 mt-4 pt-4 border-t">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={showDecadeComparison}
              onChange={(e) => setShowDecadeComparison(e.target.checked)}
              className="rounded text-blue-600"
            />
            Show Decade Comparison
          </label>
        </div>
      </div>

      {/* Main Variability Chart */}
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Yearly Temperature Variability ({VARIABILITY_METRICS.find(m => m.value === variabilityMetric)?.label})
        </h3>
        <p className="text-sm text-gray-500 mb-4">
          Trend: <span className={getTrend() > 0.01 ? 'text-red-600' : getTrend() < -0.01 ? 'text-blue-600' : 'text-gray-600'}>
            {getTrend() > 0 ? '+' : ''}{getTrend().toFixed(3)} per decade
          </span>
        </p>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="year"
                tick={{ fontSize: 11 }}
                tickFormatter={(v) => v % 10 === 0 ? v : ''}
              />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip
                formatter={(value, name) => [
                  typeof value === 'number' ? value.toFixed(2) : 'N/A',
                  typeof name === 'string' && name.includes('smooth') ? 'Moving Average' : 'Yearly Value'
                ]}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey={metricKey}
                stroke="#9CA3AF"
                strokeWidth={1}
                dot={false}
                name="Yearly Value"
              />
              {smoothingWindow > 1 && (
                <Line
                  type="monotone"
                  dataKey={variabilityMetric === 'dailyRange' ? 'smoothedRange' : 'smoothedSD'}
                  stroke="#3B82F6"
                  strokeWidth={2}
                  dot={false}
                  name={`${smoothingWindow}-Year Average`}
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Decade Comparison and Seasonal Variability */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Decade Box Plots (simplified as bars with range) */}
        {showDecadeComparison && (
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {variabilityMetric === 'dailyRange' ? 'Daily Range' : 'Temperature'} Distribution by Decade
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={boxPlotData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="decade" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} label={{ value: '°C', angle: -90, position: 'insideLeft', fontSize: 10 }} />
                  <Tooltip
                    content={({ payload, label }) => {
                      if (payload && payload.length > 0) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-white border p-2 text-xs">
                            <p className="font-bold">{label}</p>
                            <p>Median: {data.median.toFixed(1)}°C</p>
                            <p>Mean: {data.mean.toFixed(1)}°C</p>
                            <p>Q1-Q3: {data.q1.toFixed(1)} - {data.q3.toFixed(1)}°C</p>
                            <p>SD: {data.sd.toFixed(2)}</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="q1" stackId="box" fill="transparent" />
                  <Bar dataKey="median" stackId="box" fill="#93C5FD" />
                  <Bar dataKey="q3" fill="#3B82F6" />
                  <Line type="monotone" dataKey="mean" stroke="#DC2626" strokeWidth={2} dot />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Bars show Q1-Q3 range, red line shows mean
            </p>
          </div>
        )}

        {/* Seasonal Variability */}
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Seasonal Variability</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={seasonalStats}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="season" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(value, name) => [
                    typeof value === 'number' ? value.toFixed(2) : 'N/A',
                    name === 'standardDeviation' ? 'Standard Deviation' : 'Mean'
                  ]}
                />
                <Legend />
                <Bar dataKey="standardDeviation" name="Standard Deviation">
                  {seasonalStats.map((entry, index) => (
                    <Bar key={index} fill={SEASON_COLORS[entry.seasonIndex]} dataKey="standardDeviation" />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-4 gap-2 mt-4">
            {seasonalStats.map((season, index) => (
              <div key={season.season} className="text-center p-2 rounded" style={{ backgroundColor: `${SEASON_COLORS[index]}20` }}>
                <p className="text-xs font-medium" style={{ color: SEASON_COLORS[index] }}>{season.season}</p>
                <p className="text-sm font-bold">{season.standardDeviation.toFixed(2)}</p>
                <p className="text-xs text-gray-500">
                  {season.trend > 0 ? '+' : ''}{season.trend.toFixed(3)}/dec
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Daily Range Trend */}
      {variabilityMetric !== 'dailyRange' && (
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Daily Temperature Range (Max - Min)</h3>
          <p className="text-sm text-gray-500 mb-4">
            Trend: <span className={rangeTrend > 0.01 ? 'text-red-600' : rangeTrend < -0.01 ? 'text-blue-600' : 'text-gray-600'}>
              {rangeTrend > 0 ? '+' : ''}{rangeTrend.toFixed(3)}°C per decade
            </span>
          </p>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="year"
                  tick={{ fontSize: 11 }}
                  tickFormatter={(v) => v % 10 === 0 ? v : ''}
                />
                <YAxis tick={{ fontSize: 11 }} domain={['auto', 'auto']} />
                <Tooltip formatter={(value) => [typeof value === 'number' ? `${value.toFixed(1)}°C` : 'N/A', 'Daily Range']} />
                <Area
                  type="monotone"
                  dataKey="dailyRange"
                  fill="#FDE68A"
                  stroke="#F59E0B"
                  fillOpacity={0.3}
                />
                {smoothingWindow > 1 && (
                  <Line
                    type="monotone"
                    dataKey="smoothedRange"
                    stroke="#D97706"
                    strokeWidth={2}
                    dot={false}
                  />
                )}
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Stability Extremes and Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Most Stable Years */}
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Most Stable Years</h3>
          <div className="space-y-2">
            {stabilityExtremes.mostStable.map((stat, index) => (
              <div key={stat.year} className="flex justify-between items-center">
                <span className="text-sm">
                  <span className="font-medium text-gray-500 w-6 inline-block">{index + 1}.</span>
                  <span className="font-semibold">{stat.year}</span>
                </span>
                <span className="text-sm font-semibold text-green-600">
                  SD: {stat.standardDeviation.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Least Stable Years */}
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Most Variable Years</h3>
          <div className="space-y-2">
            {stabilityExtremes.leastStable.map((stat, index) => (
              <div key={stat.year} className="flex justify-between items-center">
                <span className="text-sm">
                  <span className="font-medium text-gray-500 w-6 inline-block">{index + 1}.</span>
                  <span className="font-semibold">{stat.year}</span>
                </span>
                <span className="text-sm font-semibold text-red-600">
                  SD: {stat.standardDeviation.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Summary */}
        {summary && (
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Summary</h3>
            <div className="space-y-3">
              <div className="bg-gray-50 p-2 rounded">
                <p className="text-sm text-gray-600">Overall Trend</p>
                <p className={`text-lg font-bold ${
                  summary.overallTrend === 'increasing' ? 'text-red-600' :
                  summary.overallTrend === 'decreasing' ? 'text-blue-600' : 'text-gray-600'
                }`}>
                  {summary.overallTrend === 'increasing' ? 'Increasing Variability' :
                   summary.overallTrend === 'decreasing' ? 'Decreasing Variability' : 'Stable'}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-green-50 p-2 rounded">
                  <p className="text-xs text-green-600">Most Stable Season</p>
                  <p className="font-bold text-green-800">{summary.mostStableSeason}</p>
                </div>
                <div className="bg-red-50 p-2 rounded">
                  <p className="text-xs text-red-600">Most Variable Season</p>
                  <p className="font-bold text-red-800">{summary.mostVariableSeason}</p>
                </div>
              </div>
              <div className="bg-blue-50 p-2 rounded">
                <p className="text-xs text-blue-600">Daily Range Change</p>
                <p className="font-bold text-blue-800">
                  {summary.rangeChange.from.toFixed(1)}°C → {summary.rangeChange.to.toFixed(1)}°C
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
