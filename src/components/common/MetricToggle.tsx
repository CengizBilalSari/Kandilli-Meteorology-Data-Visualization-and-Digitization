import { clsx } from 'clsx';
import { useFilterStore } from '../../store/useFilterStore';
import { TemperatureMetric } from '../../types';

const METRICS: { value: TemperatureMetric; label: string; description: string }[] = [
  { value: 'avg', label: 'Average', description: 'Daily mean temperature' },
  { value: 'min', label: 'Minimum', description: 'Coldest point of the day' },
  { value: 'max', label: 'Maximum', description: 'Warmest point of the day' },
];

export function MetricToggle() {
  const { metric, setMetric } = useFilterStore();

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">Temperature Metric</label>
      <div className="flex gap-4">
        {METRICS.map((m) => (
          <label
            key={m.value}
            className={clsx(
              'flex items-center gap-2 cursor-pointer px-3 py-2 rounded-lg border transition-colors',
              metric === m.value
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            )}
          >
            <input
              type="radio"
              name="metric"
              value={m.value}
              checked={metric === m.value}
              onChange={() => setMetric(m.value)}
              className="text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-900">{m.label}</span>
          </label>
        ))}
      </div>
    </div>
  );
}
