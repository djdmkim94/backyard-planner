import SunCalc from 'suncalc';
import type { SunExposure, SunWindowConfig, SunTimeWindow, SunClassification, SunZone } from '../types/garden';
import { DEFAULT_SUN_WINDOWS } from '../constants/sun';

// ── Legacy helpers (kept for auto-compute path) ───────────────────────────────

export function deriveExposure(config: SunWindowConfig): SunExposure {
  const count = [config.morning, config.peak, config.afternoon].filter(Boolean).length;
  if (count >= 2) return 'full_sun';
  if (count === 1) return 'partial_shade';
  return 'full_shade';
}

export function defaultSummerConfig(): SunWindowConfig {
  return { morning: true, peak: true, afternoon: true };
}

export function smartWinterDefault(summer: SunWindowConfig): SunWindowConfig {
  return { morning: summer.morning, peak: summer.peak, afternoon: false };
}

export function exposureLabel(exposure: SunExposure): string {
  switch (exposure) {
    case 'full_sun': return 'Full Sun';
    case 'partial_shade': return 'Part Sun';
    case 'full_shade': return 'Shade';
  }
}

export function windowLabel(key: keyof SunWindowConfig): string {
  switch (key) {
    case 'morning': return 'Morning';
    case 'peak': return 'Peak';
    case 'afternoon': return 'Afternoon';
  }
}

export function legacyExposureToWindows(exposure: SunExposure): SunWindowConfig {
  switch (exposure) {
    case 'full_sun':      return { morning: true, peak: true, afternoon: true };
    case 'partial_shade': return { morning: true, peak: false, afternoon: false };
    case 'full_shade':    return { morning: false, peak: false, afternoon: false };
  }
}

// ── Time-window helpers ───────────────────────────────────────────────────────

/** Returns the effective SunTimeWindow[] for any zone (new or legacy). */
export function effectiveSunWindows(zone: SunZone): SunTimeWindow[] {
  if (zone.sunWindows) return zone.sunWindows;
  // Derive from summer config for auto-computed / legacy zones
  const s = zone.summer;
  return [
    { ...DEFAULT_SUN_WINDOWS[0], active: s.morning },
    { ...DEFAULT_SUN_WINDOWS[1], active: s.peak },
    { ...DEFAULT_SUN_WINDOWS[2], active: s.afternoon },
  ];
}

/** Total direct-sun hours from a set of time windows. */
export function calculateSunHours(windows: SunTimeWindow[]): number {
  return windows
    .filter((w) => w.active)
    .reduce((sum, w) => sum + (w.endHour - w.startHour), 0);
}

/** Gardening classification from total hours. */
export function classifyFromWindows(windows: SunTimeWindow[]): SunClassification {
  const hours = calculateSunHours(windows);
  if (hours >= 6) return 'full_sun';
  if (hours >= 4) return 'part_sun';
  if (hours >= 2) return 'part_shade';
  return 'full_shade';
}

/** Short overlay badge: "Full Sun · 8h" */
export function getSunBadge(windows: SunTimeWindow[]): string {
  const hours = calculateSunHours(windows);
  if (hours === 0) return 'Shade';
  const cls = classifyFromWindows(windows);
  const labels: Record<SunClassification, string> = {
    full_sun: 'Full Sun',
    part_sun: 'Part Sun',
    part_shade: 'Part Shade',
    full_shade: 'Shade',
  };
  return `${labels[cls]} · ${hours}h`;
}

/** Human-readable breakdown of which windows are active. */
export function getIntensityNote(windows: SunTimeWindow[]): string {
  const active = windows.filter((w) => w.active);
  const hasMorning = active.some((w) => w.id === 'early_morning');
  const hasPeak = active.some((w) => w.id === 'peak');
  const hasAfternoon = active.some((w) => w.id === 'late_afternoon');

  if (hasMorning && hasPeak && hasAfternoon) return 'Full day sun · includes peak intensity';
  if (hasMorning && hasPeak)   return 'Morning + peak sun · great for most vegetables';
  if (hasPeak && hasAfternoon) return 'Peak + afternoon sun · hot afternoon included';
  if (hasPeak)                 return 'Peak hours only (10am–4pm)';
  if (hasMorning && hasAfternoon) return 'Morning & late afternoon · no peak hours';
  if (hasMorning)              return 'Morning sun only · protected from afternoon heat';
  if (hasAfternoon)            return 'Late afternoon sun only';
  return 'No direct sun';
}

/** Whether the windows include peak-intensity hours (10am–4pm). */
export function hasPeakSun(windows: SunTimeWindow[]): boolean {
  return windows.some((w) => w.id === 'peak' && w.active);
}

/** Plant suggestions based on sun classification and whether peak hours are present. */
export function getPlantSuggestions(cls: SunClassification, withPeak: boolean): string[] {
  switch (cls) {
    case 'full_sun':
      return withPeak
        ? ['Tomatoes', 'Peppers', 'Cucumbers', 'Basil', 'Beans', 'Corn', 'Squash', 'Melons']
        : ['Spinach', 'Lettuce', 'Chard', 'Kale', 'Peas', 'Herbs'];
    case 'part_sun':
      return ['Broccoli', 'Cabbage', 'Kale', 'Peas', 'Beets', 'Carrots', 'Cilantro'];
    case 'part_shade':
      return ['Spinach', 'Lettuce', 'Arugula', 'Mint', 'Parsley', 'Chervil'];
    case 'full_shade':
      return ['Sorrel', 'Chives', 'Watercress', 'Shade-tolerant herbs'];
  }
}

/** Union time windows from multiple overlapping zones (for click-to-query). */
export function unionSunWindows(windowSets: SunTimeWindow[][]): SunTimeWindow[] {
  if (windowSets.length === 0) return DEFAULT_SUN_WINDOWS.map((w) => ({ ...w }));
  const ids = ['early_morning', 'peak', 'late_afternoon'] as const;
  return ids.map((id, idx) => {
    const matching = windowSets
      .map((ws) => ws.find((w) => w.id === id))
      .filter(Boolean) as SunTimeWindow[];
    if (matching.length === 0) return { ...DEFAULT_SUN_WINDOWS[idx] };
    const anyActive = matching.some((w) => w.active);
    const active = matching.filter((w) => w.active);
    const startHour = active.length > 0 ? Math.min(...active.map((w) => w.startHour)) : DEFAULT_SUN_WINDOWS[idx].startHour;
    const endHour   = active.length > 0 ? Math.max(...active.map((w) => w.endHour))   : DEFAULT_SUN_WINDOWS[idx].endHour;
    return { id, label: DEFAULT_SUN_WINDOWS[idx].label, startHour, endHour, active: anyActive };
  });
}

/** Ray-casting point-in-polygon test for flat [x,y,...] point arrays. */
export function pointInPolygon(px: number, py: number, points: number[]): boolean {
  let inside = false;
  const n = points.length;
  for (let i = 0, j = n - 2; i < n - 1; j = i, i += 2) {
    const xi = points[i], yi = points[i + 1];
    const xj = points[j], yj = points[j + 1];
    if (((yi > py) !== (yj > py)) && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) {
      inside = !inside;
    }
  }
  return inside;
}

/** Format hour as "6am", "10am", "4pm". */
export function formatHour(h: number): string {
  if (h === 0) return '12am';
  if (h < 12) return `${h}am`;
  if (h === 12) return '12pm';
  return `${h - 12}pm`;
}

// ── Auto-compute (suncalc) ────────────────────────────────────────────────────

const SUMMER_DATE = new Date(2024, 5, 21);
const WINTER_DATE = new Date(2024, 11, 21);
const MIN_ALTITUDE_RAD = 10 * Math.PI / 180;
const MIN_SUN_HOURS = 0.75;

function sunHoursInWindow(lat: number, lon: number, date: Date, startHour: number, endHour: number): number {
  let count = 0;
  for (let h = startHour; h < endHour; h += 0.5) {
    const sampleDate = new Date(date);
    sampleDate.setHours(Math.floor(h), h % 1 === 0.5 ? 30 : 0, 0, 0);
    const pos = SunCalc.getPosition(sampleDate, lat, lon);
    if (pos.altitude > MIN_ALTITUDE_RAD) count++;
  }
  return count * 0.5;
}

function computeWindowConfig(lat: number, lon: number, date: Date): SunWindowConfig {
  return {
    morning:   sunHoursInWindow(lat, lon, date, 6, 10)  >= MIN_SUN_HOURS,
    peak:      sunHoursInWindow(lat, lon, date, 10, 15) >= MIN_SUN_HOURS,
    afternoon: sunHoursInWindow(lat, lon, date, 15, 20) >= MIN_SUN_HOURS,
  };
}

export function computeSunConfig(lat: number, lon: number): { summer: SunWindowConfig; winter: SunWindowConfig } {
  return {
    summer: computeWindowConfig(lat, lon, SUMMER_DATE),
    winter: computeWindowConfig(lat, lon, WINTER_DATE),
  };
}

export async function geocodeAddress(
  address: string
): Promise<{ lat: number; lon: number; displayName: string } | null> {
  try {
    const geoUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1`;
    const geoRes = await fetch(geoUrl, {
      headers: { 'Accept-Language': 'en', 'User-Agent': 'garden-planner/1.0' },
    });
    if (!geoRes.ok) return null;
    const geoData = await geoRes.json();
    if (!geoData.length) return null;
    const lat = parseFloat(geoData[0].lat);
    const lon = parseFloat(geoData[0].lon);
    const parts = (geoData[0].display_name as string).split(',');
    const displayName = parts.slice(0, 2).join(',').trim();
    return { lat, lon, displayName };
  } catch {
    return null;
  }
}
