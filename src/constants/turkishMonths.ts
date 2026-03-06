// Turkish month names for TIFF filename mapping
export const TURKISH_MONTHS = [
  'OCAK',     // January
  'ŞUBAT',    // February
  'MART',     // March
  'NİSAN',    // April
  'MAYIS',    // May
  'HAZİRAN',  // June
  'TEMMUZ',   // July
  'AĞUSTOS',  // August
  'EYLÜL',    // September
  'EKİM',     // October
  'KASIM',    // November
  'ARALIK',   // December
] as const;

// English month names
export const ENGLISH_MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
] as const;

// Short English month names
export const ENGLISH_MONTHS_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
] as const;

// Season names and their month ranges
export const SEASONS = {
  winter: { name: 'Winter', months: [11, 0, 1] }, // Dec, Jan, Feb
  spring: { name: 'Spring', months: [2, 3, 4] },  // Mar, Apr, May
  summer: { name: 'Summer', months: [5, 6, 7] },  // Jun, Jul, Aug
  fall: { name: 'Fall', months: [8, 9, 10] },     // Sep, Oct, Nov
} as const;

// Get Turkish month name from month index (0-11)
export function getTurkishMonth(monthIndex: number): string {
  return TURKISH_MONTHS[monthIndex];
}

// Get English month name from month index (0-11)
export function getEnglishMonth(monthIndex: number): string {
  return ENGLISH_MONTHS[monthIndex];
}

// Generate TIFF filename from date
export function getTiffFilename(date: Date): string {
  const year = date.getFullYear();
  const month = date.getMonth();
  const day = date.getDate();

  const monthName = TURKISH_MONTHS[month];
  const dayStr = day.toString().padStart(2, '0');

  return `${year}_${monthName}-${dayStr}.tif`;
}

// Parse date from TIFF filename
export function parseTiffFilename(filename: string): Date | null {
  // Expected format: YYYY_MONTH-DD.tif
  const match = filename.match(/^(\d{4})_([A-ZÇĞİÖŞÜ]+)-(\d{2})\.tif$/i);

  if (!match) return null;

  const year = parseInt(match[1], 10);
  const monthName = match[2].toUpperCase();
  const day = parseInt(match[3], 10);

  const monthIndex = TURKISH_MONTHS.findIndex(m => m === monthName);
  if (monthIndex === -1) return null;

  return new Date(year, monthIndex, day);
}
