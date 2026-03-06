import * as XLSX from 'xlsx';
import { HourlyRecord, DailyRecord } from '../types';
import { getDayOfYear } from './dateUtils';

// Parse Excel file and extract hourly records
export async function parseExcelFile(file: File): Promise<HourlyRecord[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'array', cellDates: true });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        // Convert to JSON with header row
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: false, dateNF: 'yyyy-mm-dd' });

        const records = parseRawData(jsonData as unknown[][]);
        resolve(records);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsArrayBuffer(file);
  });
}

// Parse raw data from Excel
export function parseRawData(data: unknown[][]): HourlyRecord[] {
  const records: HourlyRecord[] = [];

  // Skip header row if present (check if first cell is a date)
  const startIndex = isDateValue(data[0]?.[0]) ? 0 : 1;

  for (let i = startIndex; i < data.length; i++) {
    const row = data[i];
    if (!row || row.length < 2) continue;

    const dateValue = row[0];
    const date = parseDate(dateValue);

    if (!date) continue;

    // Extract 24 hourly values (columns 1-24)
    const hours: (number | null)[] = [];
    for (let h = 1; h <= 24; h++) {
      const value = row[h];
      const temp = parseTemperature(value);
      hours.push(temp);
    }

    records.push({ date, hours });
  }

  return records;
}

// Parse a date value from Excel
function parseDate(value: unknown): Date | null {
  if (!value) return null;

  // If it's already a Date object
  if (value instanceof Date) {
    return isValidDate(value) ? value : null;
  }

  // If it's a string
  if (typeof value === 'string') {
    // Try ISO format: YYYY-MM-DD
    const isoMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (isoMatch) {
      const date = new Date(parseInt(isoMatch[1]), parseInt(isoMatch[2]) - 1, parseInt(isoMatch[3]));
      return isValidDate(date) ? date : null;
    }

    // Try M/D/YY or MM/DD/YY format (common in Excel)
    const mdyyMatch = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2})$/);
    if (mdyyMatch) {
      const yy = parseInt(mdyyMatch[3]);
      const year = yy < 30 ? yy + 2000 : yy + 1900;
      const month = parseInt(mdyyMatch[1]) - 1;
      const day = parseInt(mdyyMatch[2]);
      const date = new Date(year, month, day);
      return isValidDate(date) ? date : null;
    }

    // Try M/D/YYYY or MM/DD/YYYY format
    const mdyyyyMatch = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (mdyyyyMatch) {
      const year = parseInt(mdyyyyMatch[3]);
      const month = parseInt(mdyyyyMatch[1]) - 1;
      const day = parseInt(mdyyyyMatch[2]);
      const date = new Date(year, month, day);
      return isValidDate(date) ? date : null;
    }

    // Fallback: try native Date parsing
    const parsed = new Date(value);
    return isValidDate(parsed) ? parsed : null;
  }

  // If it's a number (Excel serial date)
  if (typeof value === 'number') {
    const date = excelSerialToDate(value);
    return isValidDate(date) ? date : null;
  }

  return null;
}

// Convert Excel serial date to JavaScript Date
function excelSerialToDate(serial: number): Date {
  // Excel's epoch is December 30, 1899
  const utcDays = Math.floor(serial - 25569);
  const utcValue = utcDays * 86400 * 1000;
  return new Date(utcValue);
}

// Check if a value looks like a date
function isDateValue(value: unknown): boolean {
  if (!value) return false;
  if (value instanceof Date) return true;
  if (typeof value === 'number' && value > 1000 && value < 100000) return true;
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) return true;
  return false;
}

// Validate a date
function isValidDate(date: Date): boolean {
  return date instanceof Date && !isNaN(date.getTime());
}

// Parse a temperature value
function parseTemperature(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;

  if (typeof value === 'number') {
    return isFinite(value) ? value : null;
  }

  if (typeof value === 'string') {
    const cleaned = value.replace(',', '.').trim();
    const num = parseFloat(cleaned);
    return isFinite(num) ? num : null;
  }

  return null;
}

// Convert hourly records to daily records
export function hourlyToDailyRecords(hourlyRecords: HourlyRecord[]): DailyRecord[] {
  return hourlyRecords.map(record => {
    const validTemps = record.hours.filter((t): t is number => t !== null);
    const validHourCount = validTemps.length;

    let avgTemp: number | null = null;
    let minTemp: number | null = null;
    let maxTemp: number | null = null;

    if (validHourCount > 0) {
      avgTemp = validTemps.reduce((sum, t) => sum + t, 0) / validHourCount;
      minTemp = Math.min(...validTemps);
      maxTemp = Math.max(...validTemps);
    }

    let dataQuality: 'complete' | 'partial' | 'missing';
    if (validHourCount === 24) {
      dataQuality = 'complete';
    } else if (validHourCount >= 18) {
      dataQuality = 'partial';
    } else if (validHourCount > 0) {
      dataQuality = 'partial';
    } else {
      dataQuality = 'missing';
    }

    return {
      date: record.date,
      year: record.date.getFullYear(),
      month: record.date.getMonth(),
      day: record.date.getDate(),
      dayOfYear: getDayOfYear(record.date),
      avgTemp,
      minTemp,
      maxTemp,
      hourlyTemps: record.hours,
      dataQuality,
      validHourCount,
    };
  });
}

// Load and parse data from a path
export async function loadDataFromPath(path: string): Promise<DailyRecord[]> {
  try {
    const response = await fetch(path);
    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.status} ${response.statusText}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array', cellDates: true });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: false });

    const hourlyRecords = parseRawData(jsonData as unknown[][]);
    return hourlyToDailyRecords(hourlyRecords);
  } catch (error) {
    console.error('Failed to load data from path:', path, error);
    throw error;
  }
}

// Load and parse the default data file
export async function loadDefaultData(): Promise<DailyRecord[]> {
  return loadDataFromPath('/Sicaklik renk.xlsx');
}
