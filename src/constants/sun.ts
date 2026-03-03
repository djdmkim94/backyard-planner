import type { SunExposure, SunWindowConfig, SunTimeWindow, SunClassification } from '../types/garden';
import type { SunPreset } from '../types/canvas';

export interface SunExposureOption {
  exposure: SunExposure;
  label: string;
  color: string;
  opacity: number;
}

export const SUN_EXPOSURE_OPTIONS: SunExposureOption[] = [
  { exposure: 'full_sun',      label: 'Full Sun (6+ hrs)',        color: '#fbbf24', opacity: 0.25 },
  { exposure: 'partial_shade', label: 'Partial Shade (3-6 hrs)',   color: '#fb923c', opacity: 0.25 },
  { exposure: 'full_shade',    label: 'Full Shade (<3 hrs)',       color: '#6b7280', opacity: 0.30 },
];

export const SUN_WINDOW_LABELS = {
  morning:   'Morning',
  peak:      'Peak',
  afternoon: 'Afternoon',
} as const;

export const SUN_WINDOW_TIMES = {
  morning:   '6–10am',
  peak:      '10am–3pm',
  afternoon: '3pm–sunset',
} as const;

export const PATHWAY_MIN_SPACING_FT = 2;

// ── Default time windows (spec: Early Morning / Peak / Late Afternoon) ─────────

export const DEFAULT_SUN_WINDOWS: SunTimeWindow[] = [
  { id: 'early_morning',  label: 'Early Morning', startHour: 6,  endHour: 10, active: false },
  { id: 'peak',           label: 'Peak Sun',      startHour: 10, endHour: 16, active: false },
  { id: 'late_afternoon', label: 'Late Afternoon', startHour: 16, endHour: 18, active: false },
];

// ── Classification config ─────────────────────────────────────────────────────

export interface SunClassificationConfig {
  cls: SunClassification;
  label: string;
  hours: string;
  color: string;
  opacity: number;
}

export const SUN_CLASSIFICATION_OPTIONS: SunClassificationConfig[] = [
  { cls: 'full_sun',    label: 'Full Sun',   hours: '6+ hours',  color: '#fbbf24', opacity: 0.28 },
  { cls: 'part_sun',    label: 'Part Sun',   hours: '4–6 hours', color: '#fde68a', opacity: 0.32 },
  { cls: 'part_shade',  label: 'Part Shade', hours: '2–4 hours', color: '#fb923c', opacity: 0.28 },
  { cls: 'full_shade',  label: 'Full Shade', hours: '<2 hours',  color: '#94a3b8', opacity: 0.32 },
];

export function classificationConfig(cls: SunClassification): SunClassificationConfig {
  return SUN_CLASSIFICATION_OPTIONS.find((o) => o.cls === cls) ?? SUN_CLASSIFICATION_OPTIONS[3];
}

// ── sunZoneStyle: per-zone overlay color derived from active windows ───────────

export function sunZoneStyle(windows: SunTimeWindow[]): { fill: string; opacity: number; badge: string } {
  const active = windows.filter((w) => w.active);
  const hasMorning  = active.some((w) => w.id === 'early_morning');
  const hasPeak     = active.some((w) => w.id === 'peak');
  const hasAfternoon = active.some((w) => w.id === 'late_afternoon');
  const hours = active.reduce((s, w) => s + (w.endHour - w.startHour), 0);

  // color priority: peak presence dominates, then time-of-day
  if (hours === 0)                              return { fill: '#94a3b8', opacity: 0.32, badge: 'Shade' };
  if (hasMorning && hasPeak && hasAfternoon)    return { fill: '#fbbf24', opacity: 0.28, badge: `Full Sun · ${hours}h` };
  if (hasPeak && hasAfternoon)                  return { fill: '#fbbf24', opacity: 0.26, badge: `Full Sun · ${hours}h` };
  if (hasMorning && hasPeak)                    return { fill: '#fbbf24', opacity: 0.26, badge: `Full Sun · ${hours}h` };
  if (hasPeak)                                  return { fill: '#fde68a', opacity: 0.32, badge: `Part Sun · ${hours}h` };
  if (hasMorning && hasAfternoon)               return { fill: '#fde68a', opacity: 0.30, badge: `Part Sun · ${hours}h` };
  if (hasMorning)                               return { fill: '#fde68a', opacity: 0.35, badge: `AM · ${hours}h` };
  if (hasAfternoon)                             return { fill: '#f97316', opacity: 0.28, badge: `PM · ${hours}h` };
  return { fill: '#fb923c', opacity: 0.28, badge: `${hours}h` };
}

// ── Manual presets ─────────────────────────────────────────────────────────────

function makeWindows(morning: boolean, peak: boolean, afternoon: boolean): SunTimeWindow[] {
  return [
    { ...DEFAULT_SUN_WINDOWS[0], active: morning },
    { ...DEFAULT_SUN_WINDOWS[1], active: peak },
    { ...DEFAULT_SUN_WINDOWS[2], active: afternoon },
  ];
}

// Legacy SunWindowConfig (kept for auto-compute zones)
const legacySummer: Record<SunPreset, SunWindowConfig> = {
  full_sun:   { morning: true,  peak: true,  afternoon: true  },
  morning:    { morning: true,  peak: false, afternoon: false },
  afternoon:  { morning: false, peak: true,  afternoon: true  },
  part_shade: { morning: true,  peak: false, afternoon: false },
  shade:      { morning: false, peak: false, afternoon: false },
};
const legacyWinter: Record<SunPreset, SunWindowConfig> = {
  full_sun:   { morning: true,  peak: true,  afternoon: false },
  morning:    { morning: true,  peak: false, afternoon: false },
  afternoon:  { morning: false, peak: true,  afternoon: false },
  part_shade: { morning: true,  peak: false, afternoon: false },
  shade:      { morning: false, peak: false, afternoon: false },
};

export interface ManualPreset {
  id: SunPreset;
  label: string;
  emoji: string;
  time: string;
  sunWindows: SunTimeWindow[];
  summer: SunWindowConfig;
  winter: SunWindowConfig;
  color: string;
}

export const MANUAL_PRESETS: ManualPreset[] = [
  {
    id: 'full_sun',
    label: 'Full Sun',
    emoji: '☀️',
    time: 'All day · 12h',
    sunWindows: makeWindows(true, true, true),
    summer: legacySummer.full_sun,
    winter: legacyWinter.full_sun,
    color: '#fbbf24',
  },
  {
    id: 'morning',
    label: 'Morning Sun',
    emoji: '🌅',
    time: '6–10am · 4h',
    sunWindows: makeWindows(true, false, false),
    summer: legacySummer.morning,
    winter: legacyWinter.morning,
    color: '#fde68a',
  },
  {
    id: 'afternoon',
    label: 'Afternoon Sun',
    emoji: '🌇',
    time: '10am–6pm · 8h',
    sunWindows: makeWindows(false, true, true),
    summer: legacySummer.afternoon,
    winter: legacyWinter.afternoon,
    color: '#f97316',
  },
  {
    id: 'part_shade',
    label: 'Part Shade',
    emoji: '⛅',
    time: 'Morning only · 4h',
    sunWindows: makeWindows(true, false, false),
    summer: legacySummer.part_shade,
    winter: legacyWinter.part_shade,
    color: '#fb923c',
  },
  {
    id: 'shade',
    label: 'Full Shade',
    emoji: '🌥️',
    time: 'No direct sun',
    sunWindows: makeWindows(false, false, false),
    summer: legacySummer.shade,
    winter: legacyWinter.shade,
    color: '#94a3b8',
  },
];
