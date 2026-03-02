import type { SunExposure, SunWindowConfig } from '../types/garden';
import type { SunPreset } from '../types/canvas';

export interface SunExposureOption {
  exposure: SunExposure;
  label: string;
  color: string;
  opacity: number;
}

export const SUN_EXPOSURE_OPTIONS: SunExposureOption[] = [
  { exposure: 'full_sun', label: 'Full Sun (6+ hrs)', color: '#fbbf24', opacity: 0.25 },
  { exposure: 'partial_shade', label: 'Partial Shade (3-6 hrs)', color: '#fb923c', opacity: 0.25 },
  { exposure: 'full_shade', label: 'Full Shade (<3 hrs)', color: '#6b7280', opacity: 0.3 },
];

export const SUN_WINDOW_LABELS = {
  morning: 'Morning',
  peak: 'Peak',
  afternoon: 'Afternoon',
} as const;

export const SUN_WINDOW_TIMES = {
  morning: '6–10am',
  peak: '10am–3pm',
  afternoon: '3pm–sunset',
} as const;

export const PATHWAY_MIN_SPACING_FT = 2;

// ── Manual preset definitions ─────────────────────────────────────────────────

export interface ManualPreset {
  id: SunPreset;
  label: string;
  emoji: string;
  time: string;
  summer: SunWindowConfig;
  winter: SunWindowConfig;
  color: string;
}

export const MANUAL_PRESETS: ManualPreset[] = [
  {
    id: 'full_sun',
    label: 'Full Sun',
    emoji: '☀️',
    time: 'All day',
    summer: { morning: true, peak: true, afternoon: true },
    winter: { morning: true, peak: true, afternoon: false },
    color: '#fbbf24',
  },
  {
    id: 'morning',
    label: 'Morning Sun',
    emoji: '🌅',
    time: '6–10am',
    summer: { morning: true, peak: false, afternoon: false },
    winter: { morning: true, peak: false, afternoon: false },
    color: '#fde68a',
  },
  {
    id: 'afternoon',
    label: 'Afternoon Sun',
    emoji: '🌇',
    time: '3pm–sunset',
    summer: { morning: false, peak: false, afternoon: true },
    winter: { morning: false, peak: false, afternoon: false },
    color: '#f97316',
  },
  {
    id: 'part_shade',
    label: 'Part Shade',
    emoji: '⛅',
    time: 'Midday only',
    summer: { morning: false, peak: true, afternoon: false },
    winter: { morning: false, peak: false, afternoon: false },
    color: '#fb923c',
  },
  {
    id: 'shade',
    label: 'Full Shade',
    emoji: '🌥️',
    time: 'No direct sun',
    summer: { morning: false, peak: false, afternoon: false },
    winter: { morning: false, peak: false, afternoon: false },
    color: '#94a3b8',
  },
];

// ── Per-zone overlay style derived from actual window config ──────────────────
// More specific than deriveExposure: distinguishes morning-only vs afternoon-only.

export function sunZoneStyle(config: SunWindowConfig): { fill: string; opacity: number; badge: string } {
  const { morning, peak, afternoon } = config;
  if (!morning && !peak && !afternoon) return { fill: '#94a3b8', opacity: 0.32, badge: 'Shade' };
  if (morning && peak && afternoon)    return { fill: '#fbbf24', opacity: 0.28, badge: '☀ Full' };
  if (morning && !peak && !afternoon)  return { fill: '#fde68a', opacity: 0.38, badge: 'AM' };
  if (!morning && !peak && afternoon)  return { fill: '#f97316', opacity: 0.28, badge: 'PM' };
  if (!morning && peak && !afternoon)  return { fill: '#fb923c', opacity: 0.28, badge: 'Mid' };
  // morning + afternoon without peak, or other combos
  if (morning && !peak && afternoon)   return { fill: '#fbbf24', opacity: 0.22, badge: 'AM+PM' };
  if (morning && peak && !afternoon)   return { fill: '#fbbf24', opacity: 0.25, badge: 'AM+Mid' };
  return { fill: '#fbbf24', opacity: 0.2, badge: '~Sun' };
}
