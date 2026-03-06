import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, differenceInDays, addDays, isWithinInterval } from 'date-fns';

// Get day of year (1-366)
export function getDayOfYear(date: Date): number {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  const oneDay = 1000 * 60 * 60 * 24;
  return Math.floor(diff / oneDay);
}

// Get week number (ISO week)
export function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

// Get season (0: Winter, 1: Spring, 2: Summer, 3: Fall)
export function getSeason(date: Date): number {
  const month = date.getMonth();
  if (month === 11 || month === 0 || month === 1) return 0; // Winter (Dec, Jan, Feb)
  if (month >= 2 && month <= 4) return 1; // Spring (Mar, Apr, May)
  if (month >= 5 && month <= 7) return 2; // Summer (Jun, Jul, Aug)
  return 3; // Fall (Sep, Oct, Nov)
}

// Get season name
export function getSeasonName(seasonIndex: number): string {
  const seasons = ['Winter', 'Spring', 'Summer', 'Fall'];
  return seasons[seasonIndex] || 'Unknown';
}

// Get start of season
export function getSeasonStart(date: Date): Date {
  const year = date.getFullYear();
  const season = getSeason(date);

  switch (season) {
    case 0: // Winter - starts in December of previous year
      return date.getMonth() === 11
        ? new Date(year, 11, 1)
        : new Date(year - 1, 11, 1);
    case 1: // Spring
      return new Date(year, 2, 1);
    case 2: // Summer
      return new Date(year, 5, 1);
    case 3: // Fall
      return new Date(year, 8, 1);
    default:
      return date;
  }
}

// Get end of season
export function getSeasonEnd(date: Date): Date {
  const year = date.getFullYear();
  const season = getSeason(date);

  switch (season) {
    case 0: // Winter ends in February
      return date.getMonth() === 11
        ? new Date(year + 1, 1, 28)
        : new Date(year, 1, 28);
    case 1: // Spring
      return new Date(year, 4, 31);
    case 2: // Summer
      return new Date(year, 7, 31);
    case 3: // Fall
      return new Date(year, 10, 30);
    default:
      return date;
  }
}

// Format date based on scale
export function formatDateByScale(date: Date, scale: string): string {
  switch (scale) {
    case 'daily':
      return format(date, 'MMM d, yyyy');
    case 'weekly':
      return `Week ${getWeekNumber(date)}, ${date.getFullYear()}`;
    case 'monthly':
      return format(date, 'MMM yyyy');
    case 'seasonal':
      return `${getSeasonName(getSeason(date))} ${date.getFullYear()}`;
    case 'yearly':
      return format(date, 'yyyy');
    default:
      return format(date, 'yyyy-MM-dd');
  }
}

// Get period boundaries based on scale
export function getPeriodBoundaries(date: Date, scale: string): { start: Date; end: Date } {
  switch (scale) {
    case 'daily':
      return { start: date, end: date };
    case 'weekly':
      return { start: startOfWeek(date, { weekStartsOn: 1 }), end: endOfWeek(date, { weekStartsOn: 1 }) };
    case 'monthly':
      return { start: startOfMonth(date), end: endOfMonth(date) };
    case 'seasonal':
      return { start: getSeasonStart(date), end: getSeasonEnd(date) };
    case 'yearly':
      return { start: startOfYear(date), end: endOfYear(date) };
    default:
      return { start: date, end: date };
  }
}

// Generate date range array
export function generateDateRange(start: Date, end: Date): Date[] {
  const dates: Date[] = [];
  let current = new Date(start);

  while (current <= end) {
    dates.push(new Date(current));
    current = addDays(current, 1);
  }

  return dates;
}

// Check if date is within range
export function isDateInRange(date: Date, start: Date, end: Date): boolean {
  return isWithinInterval(date, { start, end });
}

// Get number of days between two dates
export function daysBetween(start: Date, end: Date): number {
  return differenceInDays(end, start);
}

// Format date for display
export function formatDisplayDate(date: Date): string {
  return format(date, 'MMMM d, yyyy');
}

// Format date for TIFF filename lookup
export function formatTiffDate(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}
