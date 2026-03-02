import SunCalc from 'suncalc';
import type { SunExposure, SunWindowConfig } from '../types/garden';

export function deriveExposure(config: SunWindowConfig): SunExposure {
  const count = [config.morning, config.peak, config.afternoon].filter(Boolean).length;
  if (count === 3) return 'full_sun';
  if (count === 2) return 'full_sun';
  if (count === 1) return 'partial_shade';
  return 'full_shade';
}

export function defaultSummerConfig(): SunWindowConfig {
  return { morning: true, peak: true, afternoon: true };
}

export function smartWinterDefault(summer: SunWindowConfig): SunWindowConfig {
  // Drop afternoon window for winter (sun is lower, shorter days)
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
    case 'full_sun':
      return { morning: true, peak: true, afternoon: true };
    case 'partial_shade':
      return { morning: true, peak: false, afternoon: false };
    case 'full_shade':
      return { morning: false, peak: false, afternoon: false };
  }
}

const SUMMER_DATE = new Date(2024, 5, 21);   // Jun 21
const WINTER_DATE = new Date(2024, 11, 21);  // Dec 21
const MIN_ALTITUDE_RAD = 10 * Math.PI / 180; // 10° above horizon
const MIN_SUN_HOURS = 0.75;                  // 45 min threshold per window

function sunHoursInWindow(lat: number, lon: number, date: Date, startHour: number, endHour: number): number {
  let count = 0;
  for (let h = startHour; h < endHour; h += 0.5) {
    const sampleDate = new Date(date);
    sampleDate.setHours(Math.floor(h), h % 1 === 0.5 ? 30 : 0, 0, 0);
    const pos = SunCalc.getPosition(sampleDate, lat, lon);
    if (pos.altitude > MIN_ALTITUDE_RAD) count++;
  }
  return count * 0.5; // each sample = 30 min = 0.5 hours
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
    // Use city/town name if available; fall back to first part of display_name
    const parts = (geoData[0].display_name as string).split(',');
    const displayName = parts.slice(0, 2).join(',').trim();

    return { lat, lon, displayName };
  } catch {
    return null;
  }
}
