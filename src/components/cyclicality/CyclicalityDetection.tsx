import { useCyclicalityStore } from '../../store/useCyclicalityStore';
import { useCyclicalityData } from '../../hooks/useCyclicalityData';
import { useDataRange } from '../../hooks/useDataRange';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
  Area
} from 'recharts';

const SEASONS = ['Winter', 'Spring', 'Summer', 'Autumn'];

const DECADE_COLORS: Record<string, string> = {
  '1930s': '#6B7280',
  '1940s': '#9CA3AF',
  '1950s': '#3B82F6',
  '1960s': '#10B981',
  '1970s': '#F59E0B',
  '1980s': '#EF4444',
  '1990s': '#8B5CF6',
  '2000s': '#EC4899',
  '2010s': '#06B6D4',
  '2020s': '#14B8A6'
};

// Get color with fallback
function getDecadeColor(decade: string): string {
  return DECADE_COLORS[decade] || '#6B7280';
}

// Similarity color scale
function getSimilarityColor(value: number): string {
  if (value >= 0.8) return '#22C55E';
  if (value >= 0.6) return '#84CC16';
  if (value >= 0.4) return '#EAB308';
  if (value >= 0.2) return '#F97316';
  return '#EF4444';
}

export function CyclicalityDetection() {
  const {
    startYear,
    endYear,
    metric,
    smoothingWindow,
    selectedDecades,
    normalizeToBaseline,
    showTrendLine,
    selectedSeason,
    setStartYear,
    setEndYear,
    setMetric,
    setSmoothingWindow,
    toggleDecade,
    setNormalizeToBaseline,
    setShowTrendLine,
    setSelectedSeason
  } = useCyclicalityStore();

  const {
    availableDecades,
    decadeData,
    similarityMatrix,
    smoothedData,
    linearTrend,
    insights,
    overlayChartData,
    summary
  } = useCyclicalityData();

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

  // Prepare smoothed chart data
  const smoothedChartData = smoothedData.map((d) => ({
    year: d.year,
    value: d.value,
    smoothed: d.smoothedValue,
    detrended: d.detrended,
    trend: linearTrend.slope * d.year + linearTrend.intercept
  }));

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

          {/* Metric */}
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

          {/* Smoothing */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Smoothing Window</label>
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

          {/* Options */}
          <div className="flex flex-col gap-2">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={showTrendLine}
                onChange={(e) => setShowTrendLine(e.target.checked)}
                className="rounded text-blue-600"
              />
              Show Trend Line
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={normalizeToBaseline}
                onChange={(e) => setNormalizeToBaseline(e.target.checked)}
                className="rounded text-blue-600"
              />
              Normalize to Baseline
            </label>
          </div>
        </div>

        {/* Decade Selection */}
        <div className="mt-4 pt-4 border-t">
          <label className="block text-sm font-medium text-gray-700 mb-2">Compare Decades</label>
          <div className="flex flex-wrap gap-2">
            {availableDecades.map((decade) => (
              <button
                key={decade}
                onClick={() => toggleDecade(decade)}
                className={`px-3 py-1 text-sm rounded-full border transition-colors ${
                  selectedDecades.includes(decade)
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'
                }`}
              >
                {decade}s
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Decade Comparison Overlay */}
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Decade Comparison (Aligned by Position in Decade)
        </h3>
        <p className="text-sm text-gray-500 mb-4">
          Each decade aligned from year 0 to year 9 for pattern comparison
        </p>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={overlayChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="yearInDecade"
                tick={{ fontSize: 11 }}
                label={{ value: 'Year in Decade', position: 'bottom', fontSize: 11 }}
              />
              <YAxis
                tick={{ fontSize: 11 }}
                label={{ value: normalizeToBaseline ? 'Temp Change (°C)' : 'Temperature (°C)', angle: -90, position: 'insideLeft', fontSize: 10 }}
              />
              <Tooltip
                formatter={(value, name) => [
                  typeof value === 'number' ? `${value.toFixed(1)}°C` : 'N/A',
                  name || ''
                ]}
              />
              <Legend />
              {decadeData.map((decade) => (
                <Line
                  key={decade.decade}
                  type="monotone"
                  dataKey={decade.decade}
                  stroke={getDecadeColor(decade.decade)}
                  strokeWidth={2}
                  dot
                  name={decade.decade}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
        {decadeData.length > 1 && (
          <p className="text-sm text-gray-500 mt-2">
            Temperature shift: {summary?.firstDecade} → {summary?.lastDecade}:
            <span className={summary?.temperatureShift && summary.temperatureShift > 0 ? 'text-red-600' : 'text-blue-600'}>
              {' '}{summary?.temperatureShift && summary.temperatureShift > 0 ? '+' : ''}{summary?.temperatureShift?.toFixed(1)}°C
            </span>
          </p>
        )}
      </div>

      {/* Smoothed Trend Chart */}
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Smoothed Temperature Trend ({smoothingWindow}-Year Moving Average)
        </h3>
        <p className="text-sm text-gray-500 mb-4">
          Linear Trend: <span className={linearTrend.slope > 0 ? 'text-red-600' : 'text-blue-600'}>
            {linearTrend.slope > 0 ? '+' : ''}{(linearTrend.slope * 10).toFixed(2)}°C/decade
          </span>
          {' | '}R²: {(linearTrend.rSquared * 100).toFixed(0)}%
        </p>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={smoothedChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="year"
                tick={{ fontSize: 11 }}
                tickFormatter={(v) => v % 10 === 0 ? v : ''}
              />
              <YAxis tick={{ fontSize: 11 }} domain={['auto', 'auto']} />
              <Tooltip
                formatter={(value, name) => [
                  typeof value === 'number' ? `${value.toFixed(1)}°C` : 'N/A',
                  name === 'value' ? 'Yearly' : name === 'smoothed' ? 'Smoothed' : 'Trend'
                ]}
              />
              <Legend />
              <Area
                type="monotone"
                dataKey="value"
                fill="#E5E7EB"
                stroke="#9CA3AF"
                fillOpacity={0.3}
                name="Yearly Average"
              />
              <Line
                type="monotone"
                dataKey="smoothed"
                stroke="#3B82F6"
                strokeWidth={2}
                dot={false}
                name="Smoothed"
              />
              {showTrendLine && (
                <Line
                  type="monotone"
                  dataKey="trend"
                  stroke="#DC2626"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={false}
                  name="Linear Trend"
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Similarity Matrix and Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Similarity Matrix */}
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Period Similarity Matrix</h3>
          <div className="overflow-x-auto">
            <table className="text-xs w-full">
              <thead>
                <tr>
                  <th className="p-1"></th>
                  {similarityMatrix.decades.map((decade) => (
                    <th key={decade} className="p-1 text-center">{decade}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {similarityMatrix.decades.map((rowDecade, i) => (
                  <tr key={rowDecade}>
                    <td className="p-1 font-medium">{rowDecade}</td>
                    {similarityMatrix.values[i].map((value, j) => (
                      <td
                        key={j}
                        className="p-1 text-center text-white font-medium"
                        style={{ backgroundColor: getSimilarityColor(value) }}
                      >
                        {(value * 100).toFixed(0)}%
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-center gap-2 mt-3 text-xs">
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded" style={{ backgroundColor: '#EF4444' }}></span>
              &lt;20%
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded" style={{ backgroundColor: '#F97316' }}></span>
              20-40%
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded" style={{ backgroundColor: '#EAB308' }}></span>
              40-60%
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded" style={{ backgroundColor: '#84CC16' }}></span>
              60-80%
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded" style={{ backgroundColor: '#22C55E' }}></span>
              &gt;80%
            </span>
          </div>
          {summary && (
            <p className="text-sm text-gray-500 mt-3">
              Average adjacent decade similarity: {(summary.avgAdjacentSimilarity * 100).toFixed(0)}%
            </p>
          )}
        </div>

        {/* Insights */}
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Insights</h3>
          <ul className="space-y-3">
            {insights.map((insight, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="text-blue-600 mt-0.5">•</span>
                <span className="text-sm text-gray-700">{insight}</span>
              </li>
            ))}
          </ul>

          {/* Summary Stats */}
          {summary && (
            <div className="grid grid-cols-2 gap-3 mt-6 pt-4 border-t">
              <div className="bg-gray-50 p-2 rounded">
                <p className="text-xs text-gray-500">Temperature Shift</p>
                <p className={`text-lg font-bold ${summary.temperatureShift > 0 ? 'text-red-600' : 'text-blue-600'}`}>
                  {summary.temperatureShift > 0 ? '+' : ''}{summary.temperatureShift.toFixed(1)}°C
                </p>
                <p className="text-xs text-gray-500">{summary.firstDecade} → {summary.lastDecade}</p>
              </div>
              <div className="bg-gray-50 p-2 rounded">
                <p className="text-xs text-gray-500">Trend per Decade</p>
                <p className={`text-lg font-bold ${summary.trendPerDecade > 0 ? 'text-red-600' : 'text-blue-600'}`}>
                  {summary.trendPerDecade > 0 ? '+' : ''}{summary.trendPerDecade.toFixed(2)}°C
                </p>
                <p className="text-xs text-gray-500">R² = {(summary.rSquared * 100).toFixed(0)}%</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Detrended Analysis */}
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Detrended Temperature (Residuals)</h3>
        <p className="text-sm text-gray-500 mb-4">
          Temperature with linear trend removed - reveals oscillations and cycles
        </p>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={smoothedChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="year"
                tick={{ fontSize: 11 }}
                tickFormatter={(v) => v % 10 === 0 ? v : ''}
              />
              <YAxis tick={{ fontSize: 11 }} domain={['auto', 'auto']} />
              <Tooltip formatter={(value) => [typeof value === 'number' ? `${value.toFixed(2)}°C` : 'N/A', 'Residual']} />
              <Area
                type="monotone"
                dataKey="detrended"
                fill="#DBEAFE"
                stroke="#3B82F6"
                fillOpacity={0.5}
              />
              <Line
                type="monotone"
                dataKey={() => 0}
                stroke="#9CA3AF"
                strokeDasharray="3 3"
                dot={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
