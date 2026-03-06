import { useEffect } from 'react';
import { format } from 'date-fns';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { HourlyDataTable } from './HourlyDataTable';
import { TiffViewer } from './TiffViewer';
import { useDailyViewerStore } from '../../store/useDailyViewerStore';
import { useDataStore } from '../../store/useDataStore';
import { useDailyData } from '../../hooks/useDailyData';
import { getTemperatureColor } from '../../constants/thresholds';

export function DailyViewer() {
  const { selectedDate, setSelectedDate, goToPreviousDay, goToNextDay } = useDailyViewerStore();
  const { dailyRecords, dataInfo } = useDataStore();
  const { hourlyData, hasData } = useDailyData();

  // Set initial date when data is loaded
  useEffect(() => {
    if (!selectedDate && dataInfo?.endDate) {
      setSelectedDate(dataInfo.endDate);
    }
  }, [selectedDate, dataInfo, setSelectedDate]);

  if (dailyRecords.length === 0) {
    return (
      <div className="p-6">
        <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
          Please upload temperature data to view daily details.
        </div>
      </div>
    );
  }

  const minDate = dataInfo?.startDate ? format(dataInfo.startDate, 'yyyy-MM-dd') : '';
  const maxDate = dataInfo?.endDate ? format(dataInfo.endDate, 'yyyy-MM-dd') : '';

  const canGoPrev = selectedDate && dataInfo?.startDate && selectedDate > dataInfo.startDate;
  const canGoNext = selectedDate && dataInfo?.endDate && selectedDate < dataInfo.endDate;

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value) {
      setSelectedDate(new Date(e.target.value));
    }
  };

  // Prepare mini chart data
  const chartData = hourlyData.map(d => ({
    hour: d.hour,
    label: d.label,
    temp: d.temp,
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload.length) return null;
    const data = payload[0].payload;
    return (
      <div className="bg-white p-2 rounded shadow-lg border border-gray-200 text-sm">
        <p className="font-medium">{data.label}</p>
        <p style={{ color: getTemperatureColor(data.temp || 15) }}>
          {data.temp !== null ? `${data.temp.toFixed(1)}°C` : 'N/A'}
        </p>
      </div>
    );
  };

  return (
    <div className="p-6 space-y-6">
      {/* Date Navigation */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Daily Data Viewer</h2>

          <div className="flex items-center gap-3">
            <button
              onClick={goToPreviousDay}
              disabled={!canGoPrev}
              className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="Previous day"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <div className="flex items-center gap-2">
              <input
                type="date"
                value={selectedDate ? format(selectedDate, 'yyyy-MM-dd') : ''}
                onChange={handleDateChange}
                min={minDate}
                max={maxDate}
                className="px-4 py-2 border border-gray-300 rounded-lg text-lg font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              onClick={goToNextDay}
              disabled={!canGoNext}
              className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="Next day"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {selectedDate && (
            <div className="text-right">
              <p className="text-lg font-medium text-gray-900">
                {format(selectedDate, 'EEEE')}
              </p>
              <p className="text-sm text-gray-500">
                {format(selectedDate, 'MMMM d, yyyy')}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Mini Hourly Chart */}
      {hasData && (
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Temperature Throughout the Day</h3>
          <div className="h-32">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="hour"
                  tickFormatter={(h) => `${h}:00`}
                  tick={{ fontSize: 10 }}
                  interval={3}
                />
                <YAxis
                  domain={['auto', 'auto']}
                  tickFormatter={(v) => `${v}°`}
                  tick={{ fontSize: 10 }}
                  width={35}
                />
                <Tooltip content={<CustomTooltip />} />
                <ReferenceLine y={0} stroke="#93c5fd" strokeDasharray="3 3" />
                <Line
                  type="monotone"
                  dataKey="temp"
                  stroke="#2563eb"
                  strokeWidth={2}
                  dot={{ r: 3, fill: '#2563eb' }}
                  connectNulls
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Main Content - Hourly Table and TIFF Viewer */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" style={{ minHeight: '500px' }}>
        <HourlyDataTable />
        <TiffViewer />
      </div>
    </div>
  );
}
