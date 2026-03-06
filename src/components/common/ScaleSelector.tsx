import { clsx } from 'clsx';
import { useFilterStore } from '../../store/useFilterStore';
import { AggregationScale } from '../../types';

const SCALES: { value: AggregationScale; label: string }[] = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'seasonal', label: 'Seasonal' },
  { value: 'yearly', label: 'Yearly' },
];

export function ScaleSelector() {
  const { scale, setScale } = useFilterStore();

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">Aggregation Scale</label>
      <div className="flex rounded-lg border border-gray-300 overflow-hidden">
        {SCALES.map((s) => (
          <button
            key={s.value}
            onClick={() => setScale(s.value)}
            className={clsx(
              'flex-1 px-3 py-2 text-sm font-medium transition-colors',
              scale === s.value
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            )}
          >
            {s.label}
          </button>
        ))}
      </div>
    </div>
  );
}
