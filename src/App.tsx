import { useEffect } from 'react';
import { Header } from './components/layout/Header';
import { TabNavigation } from './components/layout/TabNavigation';
import { WarmingChart } from './components/warming-chart/WarmingChart';
import { SeasonalOnset } from './components/seasonal-onset/SeasonalOnset';
import { DailyViewer } from './components/daily-viewer/DailyViewer';
import { ExtremeHeatCool } from './components/extreme-analysis/ExtremeHeatCool';
import { VariabilityAnalysis } from './components/variability/VariabilityAnalysis';
import { CyclicalityDetection } from './components/cyclicality/CyclicalityDetection';
import { useFilterStore } from './store/useFilterStore';
import { useDataStore } from './store/useDataStore';
import { useSettingsStore } from './store/useSettingsStore';
import { useExtremeStore } from './store/useExtremeStore';
import { useVariabilityStore } from './store/useVariabilityStore';
import { useCyclicalityStore } from './store/useCyclicalityStore';
import { useDataRange } from './hooks/useDataRange';
import { loadDataFromPath } from './utils/dataParser';

function App() {
  const { activeTab } = useFilterStore();
  const { dailyRecords, isLoading, error, setDailyRecords } = useDataStore();
  const { excelFilePath } = useSettingsStore();

  // Global data range - single source of truth
  const dataRange = useDataRange();

  // Get store initialization methods
  const initializeExtremeStore = useExtremeStore(state => state.initializeYearRange);
  const initializeVariabilityStore = useVariabilityStore(state => state.initializeYearRange);
  const initializeCyclicalityStore = useCyclicalityStore(state => state.initializeFromData);

  // Auto-load data on startup
  useEffect(() => {
    if (dailyRecords.length === 0 && !isLoading) {
      loadDataFromPath(excelFilePath)
        .then((records) => {
          setDailyRecords(records);
        })
        .catch((err) => {
          console.error('Failed to load data:', err);
        });
    }
  }, [excelFilePath, dailyRecords.length, isLoading, setDailyRecords]);

  // Initialize all stores with actual data range when data loads
  useEffect(() => {
    if (dataRange.isLoaded && dataRange.minYear && dataRange.maxYear) {
      initializeExtremeStore(dataRange.minYear, dataRange.maxYear);
      initializeVariabilityStore(dataRange.minYear, dataRange.maxYear);
      initializeCyclicalityStore(dataRange.minYear, dataRange.maxYear, dataRange.availableDecades);
    }
  }, [dataRange.isLoaded, dataRange.minYear, dataRange.maxYear, dataRange.availableDecades,
      initializeExtremeStore, initializeVariabilityStore, initializeCyclicalityStore]);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'warming':
        return <WarmingChart />;
      case 'seasonal':
        return <SeasonalOnset />;
      case 'daily':
        return <DailyViewer />;
      case 'extreme':
        return <ExtremeHeatCool />;
      case 'variability':
        return <VariabilityAnalysis />;
      case 'cyclicality':
        return <CyclicalityDetection />;
      default:
        return null;
    }
  };

  // Show loading state
  if (isLoading || (dailyRecords.length === 0 && !error)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading temperature data...</p>
          <p className="mt-2 text-sm text-gray-400">{excelFilePath}</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error || dailyRecords.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full mx-4 text-center">
          <svg className="w-16 h-16 text-red-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Failed to Load Data</h2>
          <p className="text-gray-600 mb-4">
            Could not load temperature data from:
          </p>
          <code className="block bg-gray-100 p-2 rounded text-sm text-gray-700 mb-4">
            {excelFilePath}
          </code>
          {error && (
            <p className="text-red-600 text-sm">{error}</p>
          )}
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      <TabNavigation />
      <main className="flex-1">
        {renderTabContent()}
      </main>
    </div>
  );
}

export default App;
