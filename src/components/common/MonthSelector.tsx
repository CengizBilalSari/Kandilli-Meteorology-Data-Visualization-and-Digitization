import { clsx } from 'clsx';
import { useFilterStore } from '../../store/useFilterStore';
import { ENGLISH_MONTHS_SHORT } from '../../constants/turkishMonths';

const SEASON_PRESETS = [
  { label: 'Winter', months: [11, 0, 1] },
  { label: 'Spring', months: [2, 3, 4] },
  { label: 'Summer', months: [5, 6, 7] },
  { label: 'Fall', months: [8, 9, 10] },
];

export function MonthSelector() {
  const { selectedMonths, toggleMonth, clearMonths, selectAllMonths, setSelectedMonths } = useFilterStore();

  const handleSeasonPreset = (months: number[]) => {
    setSelectedMonths(months);
  };

  const isAllSelected = selectedMonths.length === 12;
  const isNoneSelected = selectedMonths.length === 0;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700">Filter by Months</label>
        <div className="flex gap-2">
          <button
            onClick={selectAllMonths}
            disabled={isAllSelected}
            className="text-xs text-blue-600 hover:text-blue-800 disabled:text-gray-400"
          >
            Select All
          </button>
          <button
            onClick={clearMonths}
            disabled={isNoneSelected}
            className="text-xs text-blue-600 hover:text-blue-800 disabled:text-gray-400"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Month grid */}
      <div className="grid grid-cols-6 gap-1">
        {ENGLISH_MONTHS_SHORT.map((month, index) => (
          <button
            key={month}
            onClick={() => toggleMonth(index)}
            className={clsx(
              'px-2 py-1.5 text-xs font-medium rounded transition-colors',
              selectedMonths.includes(index)
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            )}
          >
            {month}
          </button>
        ))}
      </div>

      {/* Season presets */}
      <div className="flex gap-2">
        {SEASON_PRESETS.map((preset) => {
          const isActive = preset.months.every(m => selectedMonths.includes(m)) &&
                          selectedMonths.every(m => preset.months.includes(m));
          return (
            <button
              key={preset.label}
              onClick={() => handleSeasonPreset(preset.months)}
              className={clsx(
                'flex-1 px-2 py-1.5 text-xs font-medium rounded border transition-colors',
                isActive
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 text-gray-600 hover:bg-gray-50'
              )}
            >
              {preset.label}
            </button>
          );
        })}
      </div>

      {selectedMonths.length > 0 && selectedMonths.length < 12 && (
        <p className="text-xs text-gray-500">
          Showing data for: {selectedMonths.map(m => ENGLISH_MONTHS_SHORT[m]).join(', ')}
        </p>
      )}
    </div>
  );
}
