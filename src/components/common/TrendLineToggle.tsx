import { useFilterStore } from '../../store/useFilterStore';

const WINDOW_OPTIONS = [
  { value: 7, label: '7 days' },
  { value: 14, label: '14 days' },
  { value: 30, label: '30 days' },
  { value: 90, label: '90 days' },
  { value: 365, label: '1 year' },
];

export function TrendLineToggle() {
  const { showTrendLine, setShowTrendLine, movingAverageWindow, setMovingAverageWindow } = useFilterStore();

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={showTrendLine}
            onChange={(e) => setShowTrendLine(e.target.checked)}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm font-medium text-gray-700">Show Trend Line</span>
        </label>
      </div>

      {showTrendLine && (
        <div className="flex items-center gap-2 pl-6">
          <label className="text-sm text-gray-600">Moving Average:</label>
          <select
            value={movingAverageWindow}
            onChange={(e) => setMovingAverageWindow(Number(e.target.value))}
            className="px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {WINDOW_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}
