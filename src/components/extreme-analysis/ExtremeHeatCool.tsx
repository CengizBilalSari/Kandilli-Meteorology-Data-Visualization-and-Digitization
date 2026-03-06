import { useExtremeStore } from '../../store/useExtremeStore';
import { useExtremeAnalysis } from '../../hooks/useExtremeAnalysis';
import { useDataRange } from '../../hooks/useDataRange';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Line,
  ComposedChart,
  Cell
} from 'recharts';

const SEASONS = ['Winter', 'Spring', 'Summer', 'Autumn'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function ExtremeHeatCool() {
  const {
    startYear,
    endYear,
    analysisType,
    metric,
    heatThreshold,
    coldThreshold,
    tropicalNightThreshold,
    showTrendLine,
    selectedSeason,
    setStartYear,
    setEndYear,
    setAnalysisType,
    setMetric,
    setHeatThreshold,
    setColdThreshold,
    setTropicalNightThreshold,
    setShowTrendLine,
    setSelectedSeason
  } = useExtremeStore();

  const {
    yearlyStats,
    heatTrend,
    coldTrend,
    tropicalNightsTrend,
    topHeatYears,
    topColdYears,
    heatMonthlyDist,
    coldMonthlyDist,
    summary
  } = useExtremeAnalysis();

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

  // Prepare chart data with trend line
  const chartData = yearlyStats.map((stat, index) => {
    const heatTrendValue = yearlyStats[0]?.heatDays + (heatTrend / 10) * index;
    const coldTrendValue = yearlyStats[0]?.coldDays + (coldTrend / 10) * index;

    return {
      year: stat.year,
      heatDays: stat.heatDays,
      coldDays: stat.coldDays,
      tropicalNights: stat.tropicalNights,
      longestHeatWave: stat.longestHeatWave,
      longestColdSpell: stat.longestColdSpell,
      heatTrend: showTrendLine ? Math.max(0, heatTrendValue) : undefined,
      coldTrend: showTrendLine ? Math.max(0, coldTrendValue) : undefined
    };
  });

  // Monthly distribution data
  const monthlyData = MONTHS.map((month, i) => ({
    month,
    heatDays: heatMonthlyDist[i],
    coldDays: coldMonthlyDist[i]
  }));

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

  return (
    <div className="p-6 space-y-6">
      {/* Controls */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Year Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Year Range ({minYear}-{maxYear})
            </label>
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Temperature Metric</label>
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

          {/* Analysis Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Analysis Type</label>
            <div className="flex gap-3">
              {(['heat', 'cold', 'both'] as const).map((type) => (
                <label key={type} className="flex items-center gap-1 text-sm">
                  <input
                    type="radio"
                    checked={analysisType === type}
                    onChange={() => setAnalysisType(type)}
                    className="text-blue-600"
                  />
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </label>
              ))}
            </div>
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
        </div>

        {/* Thresholds */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t">
          <div className="bg-red-50 p-3 rounded">
            <h4 className="font-medium text-red-800 mb-2">Heat Thresholds</h4>
            <div className="flex gap-4">
              <div>
                <label className="text-xs text-red-600">Hot Day</label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    value={heatThreshold}
                    onChange={(e) => setHeatThreshold(parseFloat(e.target.value) || 30)}
                    className="w-16 px-2 py-1 border rounded text-sm"
                  />
                  <span className="text-sm">°C</span>
                </div>
              </div>
              <div>
                <label className="text-xs text-red-600">Tropical Night</label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    value={tropicalNightThreshold}
                    onChange={(e) => setTropicalNightThreshold(parseFloat(e.target.value) || 20)}
                    className="w-16 px-2 py-1 border rounded text-sm"
                  />
                  <span className="text-sm">°C</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 p-3 rounded">
            <h4 className="font-medium text-blue-800 mb-2">Cold Thresholds</h4>
            <div className="flex gap-4">
              <div>
                <label className="text-xs text-blue-600">Cold Day</label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    value={coldThreshold}
                    onChange={(e) => setColdThreshold(parseFloat(e.target.value) || 0)}
                    className="w-16 px-2 py-1 border rounded text-sm"
                  />
                  <span className="text-sm">°C</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Options */}
        <div className="flex items-center gap-4 mt-4 pt-4 border-t">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={showTrendLine}
              onChange={(e) => setShowTrendLine(e.target.checked)}
              className="rounded text-blue-600"
            />
            Show Trend Lines
          </label>
        </div>
      </div>

      {/* Main Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Heat Days Chart */}
        {(analysisType === 'heat' || analysisType === 'both') && (
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Extreme Heat Days Per Year
              <span className="text-sm font-normal text-gray-500 ml-2">
                ({'>'}{heatThreshold}°C)
              </span>
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              Trend: <span className={heatTrend > 0 ? 'text-red-600' : 'text-blue-600'}>
                {heatTrend > 0 ? '+' : ''}{heatTrend.toFixed(1)} days/decade
              </span>
            </p>
            <div className="h-64">
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
                      typeof value === 'number' ? `${value.toFixed(0)} days` : 'N/A',
                      name === 'heatDays' ? 'Heat Days' : 'Trend'
                    ]}
                  />
                  <Bar dataKey="heatDays" name="Heat Days">
                    {chartData.map((entry, index) => (
                      <Cell
                        key={index}
                        fill={entry.heatDays > (summary?.heatDaysChange.to || 30) ? '#DC2626' : '#F97316'}
                      />
                    ))}
                  </Bar>
                  {showTrendLine && (
                    <Line
                      type="monotone"
                      dataKey="heatTrend"
                      stroke="#991B1B"
                      strokeWidth={2}
                      dot={false}
                      name="Trend"
                    />
                  )}
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Cold Days Chart */}
        {(analysisType === 'cold' || analysisType === 'both') && (
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Extreme Cold Days Per Year
              <span className="text-sm font-normal text-gray-500 ml-2">
                (&lt;{coldThreshold}°C)
              </span>
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              Trend: <span className={coldTrend < 0 ? 'text-blue-600' : 'text-red-600'}>
                {coldTrend > 0 ? '+' : ''}{coldTrend.toFixed(1)} days/decade
              </span>
            </p>
            <div className="h-64">
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
                      typeof value === 'number' ? `${value.toFixed(0)} days` : 'N/A',
                      name === 'coldDays' ? 'Cold Days' : 'Trend'
                    ]}
                  />
                  <Bar dataKey="coldDays" name="Cold Days">
                    {chartData.map((entry, index) => (
                      <Cell
                        key={index}
                        fill={entry.coldDays > (summary?.coldDaysChange.to || 20) ? '#1E40AF' : '#3B82F6'}
                      />
                    ))}
                  </Bar>
                  {showTrendLine && (
                    <Line
                      type="monotone"
                      dataKey="coldTrend"
                      stroke="#1E3A8A"
                      strokeWidth={2}
                      dot={false}
                      name="Trend"
                    />
                  )}
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      {/* Longest Runs and Rankings */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Longest Heat Waves */}
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Longest Heat Wave Per Year</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="year"
                  tick={{ fontSize: 10 }}
                  tickFormatter={(v) => v % 20 === 0 ? v : ''}
                />
                <YAxis tick={{ fontSize: 10 }} label={{ value: 'Days', angle: -90, position: 'insideLeft', fontSize: 10 }} />
                <Tooltip formatter={(value) => [typeof value === 'number' ? `${value} days` : 'N/A', 'Consecutive Days']} />
                <Bar dataKey="longestHeatWave" fill="#F97316" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Heat Years */}
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Heat Years</h3>
          <div className="space-y-2">
            {topHeatYears.map((stat, index) => (
              <div key={stat.year} className="flex justify-between items-center">
                <span className="text-sm">
                  <span className="font-medium text-gray-500 w-6 inline-block">{index + 1}.</span>
                  <span className="font-semibold">{stat.year}</span>
                </span>
                <span className="text-sm font-semibold text-red-600">{stat.heatDays} days</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Cold Years */}
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Cold Years</h3>
          <div className="space-y-2">
            {topColdYears.map((stat, index) => (
              <div key={stat.year} className="flex justify-between items-center">
                <span className="text-sm">
                  <span className="font-medium text-gray-500 w-6 inline-block">{index + 1}.</span>
                  <span className="font-semibold">{stat.year}</span>
                </span>
                <span className="text-sm font-semibold text-blue-600">{stat.coldDays} days</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Monthly Distribution */}
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Distribution of Extreme Days</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              {(analysisType === 'heat' || analysisType === 'both') && (
                <Bar dataKey="heatDays" name="Heat Days" fill="#F97316" />
              )}
              {(analysisType === 'cold' || analysisType === 'both') && (
                <Bar dataKey="coldDays" name="Cold Days" fill="#3B82F6" />
              )}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Summary */}
      {summary && (
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-red-50 p-3 rounded">
              <p className="text-sm text-red-600">Heat Days</p>
              <p className="text-lg font-bold text-red-800">
                {summary.heatDaysChange.from.toFixed(0)} → {summary.heatDaysChange.to.toFixed(0)}
              </p>
              <p className={`text-xs ${summary.heatDaysChange.percentChange > 0 ? 'text-red-600' : 'text-green-600'}`}>
                {summary.heatDaysChange.percentChange > 0 ? '+' : ''}{summary.heatDaysChange.percentChange.toFixed(0)}%
              </p>
            </div>
            <div className="bg-blue-50 p-3 rounded">
              <p className="text-sm text-blue-600">Cold Days</p>
              <p className="text-lg font-bold text-blue-800">
                {summary.coldDaysChange.from.toFixed(0)} → {summary.coldDaysChange.to.toFixed(0)}
              </p>
              <p className={`text-xs ${summary.coldDaysChange.percentChange < 0 ? 'text-green-600' : 'text-red-600'}`}>
                {summary.coldDaysChange.percentChange > 0 ? '+' : ''}{summary.coldDaysChange.percentChange.toFixed(0)}%
              </p>
            </div>
            <div className="bg-orange-50 p-3 rounded">
              <p className="text-sm text-orange-600">Longest Heat Wave</p>
              <p className="text-lg font-bold text-orange-800">
                {summary.heatWaveChange.from.toFixed(0)}d → {summary.heatWaveChange.to.toFixed(0)}d
              </p>
            </div>
            <div className="bg-cyan-50 p-3 rounded">
              <p className="text-sm text-cyan-600">Longest Cold Spell</p>
              <p className="text-lg font-bold text-cyan-800">
                {summary.coldSpellChange.from.toFixed(0)}d → {summary.coldSpellChange.to.toFixed(0)}d
              </p>
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-3">
            Comparison: First decade vs. Last decade of selected range
          </p>
        </div>
      )}

      {/* Tropical Nights (if heat analysis) */}
      {(analysisType === 'heat' || analysisType === 'both') && (
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Tropical Nights Per Year
            <span className="text-sm font-normal text-gray-500 ml-2">
              (min temp {'>'}{tropicalNightThreshold}°C)
            </span>
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            Trend: <span className={tropicalNightsTrend > 0 ? 'text-red-600' : 'text-blue-600'}>
              {tropicalNightsTrend > 0 ? '+' : ''}{tropicalNightsTrend.toFixed(1)} nights/decade
            </span>
          </p>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="year"
                  tick={{ fontSize: 11 }}
                  tickFormatter={(v) => v % 10 === 0 ? v : ''}
                />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(value) => [typeof value === 'number' ? `${value} nights` : 'N/A', 'Tropical Nights']} />
                <Bar dataKey="tropicalNights" fill="#DC2626" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
