import { TemperatureCategory } from '../types';

// Daily Average Temperature Categories
export const DAILY_AVG_CATEGORIES: TemperatureCategory[] = [
  { name: 'Cold Day', minTemp: -Infinity, maxTemp: 0, color: '#4575B4' },
  { name: 'Cool Day', minTemp: 0, maxTemp: 10, color: '#91BFDB' },
  { name: 'Warm Day', minTemp: 10, maxTemp: 25, color: '#FEE090' },
  { name: 'Summer-like Day', minTemp: 25, maxTemp: Infinity, color: '#D73027' },
];

// Daily Maximum Temperature Categories
export const DAILY_MAX_CATEGORIES: TemperatureCategory[] = [
  { name: 'Cold Maximum', minTemp: -Infinity, maxTemp: 5, color: '#4575B4' },
  { name: 'Mild Maximum', minTemp: 5, maxTemp: 20, color: '#91BFDB' },
  { name: 'Hot Day', minTemp: 20, maxTemp: 30, color: '#FDAE61' },
  { name: 'Extreme Heat', minTemp: 30, maxTemp: Infinity, color: '#D73027' },
];

// Daily Minimum Temperature Categories
export const DAILY_MIN_CATEGORIES: TemperatureCategory[] = [
  { name: 'Freezing Night', minTemp: -Infinity, maxTemp: 0, color: '#4575B4' },
  { name: 'Cold Night', minTemp: 0, maxTemp: 10, color: '#91BFDB' },
  { name: 'Mild Night', minTemp: 10, maxTemp: 20, color: '#FEE090' },
  { name: 'Tropical Night', minTemp: 20, maxTemp: Infinity, color: '#D73027' },
];

// Season detection thresholds
export const DEFAULT_WARM_SEASON_THRESHOLD = 15; // °C
export const DEFAULT_COOL_SEASON_THRESHOLD = 10; // °C
export const DEFAULT_CONSECUTIVE_DAYS = 7;
export const DEFAULT_MOVING_AVERAGE_WINDOW = 7;

// Summer-like and Winter-like day thresholds
export const DEFAULT_SUMMER_LIKE_THRESHOLD = 25; // °C (daily avg > 25)
export const DEFAULT_WINTER_LIKE_THRESHOLD = 0; // °C (daily avg < 0)

// Temperature color scale for heatmaps
export const TEMPERATURE_COLOR_SCALE = [
  { temp: -10, color: '#313695' },
  { temp: 0, color: '#4575B4' },
  { temp: 5, color: '#74ADD1' },
  { temp: 10, color: '#ABD9E9' },
  { temp: 15, color: '#E0F3F8' },
  { temp: 20, color: '#FFFFBF' },
  { temp: 25, color: '#FEE090' },
  { temp: 30, color: '#FDAE61' },
  { temp: 35, color: '#F46D43' },
  { temp: 40, color: '#D73027' },
];

// Get color for a temperature value
export function getTemperatureColor(temp: number): string {
  if (temp <= TEMPERATURE_COLOR_SCALE[0].temp) {
    return TEMPERATURE_COLOR_SCALE[0].color;
  }

  for (let i = 1; i < TEMPERATURE_COLOR_SCALE.length; i++) {
    if (temp <= TEMPERATURE_COLOR_SCALE[i].temp) {
      const prev = TEMPERATURE_COLOR_SCALE[i - 1];
      const curr = TEMPERATURE_COLOR_SCALE[i];
      const ratio = (temp - prev.temp) / (curr.temp - prev.temp);
      return interpolateColor(prev.color, curr.color, ratio);
    }
  }

  return TEMPERATURE_COLOR_SCALE[TEMPERATURE_COLOR_SCALE.length - 1].color;
}

// Interpolate between two hex colors
function interpolateColor(color1: string, color2: string, ratio: number): string {
  const r1 = parseInt(color1.slice(1, 3), 16);
  const g1 = parseInt(color1.slice(3, 5), 16);
  const b1 = parseInt(color1.slice(5, 7), 16);

  const r2 = parseInt(color2.slice(1, 3), 16);
  const g2 = parseInt(color2.slice(3, 5), 16);
  const b2 = parseInt(color2.slice(5, 7), 16);

  const r = Math.round(r1 + (r2 - r1) * ratio);
  const g = Math.round(g1 + (g2 - g1) * ratio);
  const b = Math.round(b1 + (b2 - b1) * ratio);

  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}
