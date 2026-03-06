import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SettingsStore {
  // File paths
  excelFilePath: string;
  tiffFolderPath: string;

  // Actions
  setExcelFilePath: (path: string) => void;
  setTiffFolderPath: (path: string) => void;
  resetToDefaults: () => void;
}

const DEFAULT_SETTINGS = {
  excelFilePath: '/Sicaklik renk.xlsx',
  tiffFolderPath: '/gunluk',
};

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      ...DEFAULT_SETTINGS,

      setExcelFilePath: (path) => set({ excelFilePath: path }),
      setTiffFolderPath: (path) => set({ tiffFolderPath: path }),
      resetToDefaults: () => set(DEFAULT_SETTINGS),
    }),
    {
      name: 'kandilli-settings',
    }
  )
);
