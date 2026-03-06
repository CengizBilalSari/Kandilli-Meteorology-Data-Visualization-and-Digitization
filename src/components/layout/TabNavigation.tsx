import { clsx } from 'clsx';
import { useFilterStore } from '../../store/useFilterStore';
import { TabType } from '../../types';

const TABS: { id: TabType; label: string }[] = [
  { id: 'warming', label: 'Warming Chart' },
  { id: 'seasonal', label: 'Seasonal Onset' },
  { id: 'daily', label: 'Daily Viewer' },
];

export function TabNavigation() {
  const { activeTab, setActiveTab } = useFilterStore();

  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="px-6">
        <div className="flex space-x-8">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={clsx(
                'py-4 px-1 border-b-2 font-medium text-sm transition-colors',
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
}
