import type { SunExposure } from '../types/garden';

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
