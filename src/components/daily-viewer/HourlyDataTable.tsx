import { clsx } from 'clsx';
import { useDailyData, HourlyDataPoint } from '../../hooks/useDailyData';
import { getTemperatureColor } from '../../constants/thresholds';

function TempBar({ temp, min, max }: { temp: number | null; min: number; max: number }) {
  if (temp === null) return null;

  const range = max - min;
  const percentage = range > 0 ? ((temp - min) / range) * 100 : 50;

  return (
    <div className="w-16 h-3 bg-gray-100 rounded-full overflow-hidden">
      <div
        className="h-full rounded-full transition-all"
        style={{
          width: `${percentage}%`,
          backgroundColor: getTemperatureColor(temp),
        }}
      />
    </div>
  );
}

export function HourlyDataTable() {
  const { hourlyData, summary, hasData, dataQuality } = useDailyData();

  // Find min and max for bar scaling
  const validTemps = hourlyData.filter(d => d.temp !== null).map(d => d.temp as number);
  const minTemp = validTemps.length > 0 ? Math.min(...validTemps) : 0;
  const maxTemp = validTemps.length > 0 ? Math.max(...validTemps) : 30;

  return (
    <div className="bg-white rounded-lg shadow h-full flex flex-col">
      <div className="p-4 border-b border-gray-100">
        <h3 className="font-medium text-gray-900">Hourly Temperatures</h3>
        {hasData && (
          <p className="text-xs text-gray-500 mt-1">
            {summary.validHours}/24 hours recorded
            {dataQuality === 'partial' && ' (partial data)'}
          </p>
        )}
      </div>

      <div className="flex-1 overflow-auto p-4">
        {!hasData ? (
          <div className="h-full flex items-center justify-center text-gray-400">
            No data available
          </div>
        ) : (
          <div className="space-y-1">
            {hourlyData.map((point) => (
              <HourlyRow
                key={point.hour}
                point={point}
                minTemp={minTemp}
                maxTemp={maxTemp}
              />
            ))}
          </div>
        )}
      </div>

      {/* Summary */}
      {hasData && (
        <div className="p-4 border-t border-gray-100 bg-gray-50">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Daily Summary</h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-gray-500">Average:</span>
              <span className="ml-2 font-medium">
                {summary.avg !== null ? `${summary.avg.toFixed(1)}°C` : '--'}
              </span>
            </div>
            <div>
              <span className="text-gray-500">Range:</span>
              <span className="ml-2 font-medium">
                {summary.range !== null ? `${summary.range.toFixed(1)}°C` : '--'}
              </span>
            </div>
            <div>
              <span className="text-gray-500">Min:</span>
              <span className="ml-2 font-medium text-blue-600">
                {summary.min !== null ? `${summary.min.toFixed(1)}°C` : '--'}
                {summary.minHour !== null && (
                  <span className="text-gray-400 text-xs ml-1">
                    ({String(summary.minHour).padStart(2, '0')}:00)
                  </span>
                )}
              </span>
            </div>
            <div>
              <span className="text-gray-500">Max:</span>
              <span className="ml-2 font-medium text-red-600">
                {summary.max !== null ? `${summary.max.toFixed(1)}°C` : '--'}
                {summary.maxHour !== null && (
                  <span className="text-gray-400 text-xs ml-1">
                    ({String(summary.maxHour).padStart(2, '0')}:00)
                  </span>
                )}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function HourlyRow({
  point,
  minTemp,
  maxTemp,
}: {
  point: HourlyDataPoint;
  minTemp: number;
  maxTemp: number;
}) {
  return (
    <div
      className={clsx(
        'flex items-center gap-3 py-1.5 px-2 rounded transition-colors',
        point.isMin && 'bg-blue-50',
        point.isMax && 'bg-red-50',
        !point.isMin && !point.isMax && 'hover:bg-gray-50'
      )}
    >
      <span className="w-12 text-sm text-gray-600 font-mono">{point.label}</span>

      <span
        className={clsx(
          'w-16 text-sm font-medium text-right',
          point.temp === null && 'text-gray-300',
          point.isMin && 'text-blue-600',
          point.isMax && 'text-red-600',
          !point.isMin && !point.isMax && point.temp !== null && 'text-gray-900'
        )}
      >
        {point.temp !== null ? `${point.temp.toFixed(1)}°C` : '--'}
      </span>

      <TempBar temp={point.temp} min={minTemp} max={maxTemp} />

      {point.isMin && (
        <span className="text-xs text-blue-600 font-medium">MIN</span>
      )}
      {point.isMax && (
        <span className="text-xs text-red-600 font-medium">MAX</span>
      )}
    </div>
  );
}
