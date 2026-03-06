import { useDataStore } from '../../store/useDataStore';
import { useFilterStore } from '../../store/useFilterStore';
import { format } from 'date-fns';

export function DateRangePicker() {
  const { dataInfo } = useDataStore();
  const { startDate, endDate, setDateRange } = useFilterStore();

  const minDate = dataInfo?.startDate ? format(dataInfo.startDate, 'yyyy-MM-dd') : '';
  const maxDate = dataInfo?.endDate ? format(dataInfo.endDate, 'yyyy-MM-dd') : '';

  const handleStartChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const date = e.target.value ? new Date(e.target.value) : null;
    setDateRange(date, endDate);
  };

  const handleEndChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const date = e.target.value ? new Date(e.target.value) : null;
    setDateRange(startDate, date);
  };

  const handlePreset = (years: number) => {
    if (dataInfo?.endDate) {
      const end = dataInfo.endDate;
      const start = new Date(end);
      start.setFullYear(start.getFullYear() - years);
      setDateRange(start, end);
    }
  };

  const handleAllTime = () => {
    if (dataInfo?.startDate && dataInfo?.endDate) {
      setDateRange(dataInfo.startDate, dataInfo.endDate);
    }
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">Date Range</label>
      <div className="flex items-center gap-2">
        <input
          type="date"
          value={startDate ? format(startDate, 'yyyy-MM-dd') : ''}
          onChange={handleStartChange}
          min={minDate}
          max={maxDate}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <span className="text-gray-500">to</span>
        <input
          type="date"
          value={endDate ? format(endDate, 'yyyy-MM-dd') : ''}
          onChange={handleEndChange}
          min={minDate}
          max={maxDate}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => handlePreset(10)}
          className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded transition-colors"
        >
          Last 10y
        </button>
        <button
          onClick={() => handlePreset(30)}
          className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded transition-colors"
        >
          Last 30y
        </button>
        <button
          onClick={() => handlePreset(50)}
          className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded transition-colors"
        >
          Last 50y
        </button>
        <button
          onClick={handleAllTime}
          className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded transition-colors"
        >
          All Time
        </button>
      </div>
    </div>
  );
}
