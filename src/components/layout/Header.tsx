import { useDataStore } from '../../store/useDataStore';

export function Header() {
  const { dataInfo, isLoading } = useDataStore();

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">
          Kandilli Temperature Explorer
        </h1>

        {dataInfo && (
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <span>
              {dataInfo.totalDays.toLocaleString()} days
            </span>
            <span className="text-gray-300">|</span>
            <span>
              {dataInfo.startDate?.getFullYear()} - {dataInfo.endDate?.getFullYear()}
            </span>
            {isLoading && (
              <>
                <span className="text-gray-300">|</span>
                <span className="text-blue-600">Loading...</span>
              </>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
