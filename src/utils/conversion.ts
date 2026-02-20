import { DEFAULT_PIXELS_PER_FOOT, METERS_PER_FOOT } from '../constants/canvas';
import type { UnitSystem } from '../types/canvas';

export function pxToFeet(px: number): number {
  return px / DEFAULT_PIXELS_PER_FOOT;
}

export function feetToPx(feet: number): number {
  return feet * DEFAULT_PIXELS_PER_FOOT;
}

export function pxToUnit(px: number, unit: UnitSystem): number {
  const feet = pxToFeet(px);
  return unit === 'meters' ? feet * METERS_PER_FOOT : feet;
}

export function unitToPx(value: number, unit: UnitSystem): number {
  const feet = unit === 'meters' ? value / METERS_PER_FOOT : value;
  return feetToPx(feet);
}

export function formatUnit(px: number, unit: UnitSystem, decimals = 1): string {
  const val = pxToUnit(px, unit);
  const suffix = unit === 'feet' ? 'ft' : 'm';
  return `${val.toFixed(decimals)}${suffix}`;
}

export function formatArea(widthPx: number, heightPx: number, unit: UnitSystem): string {
  const w = pxToUnit(widthPx, unit);
  const h = pxToUnit(heightPx, unit);
  const suffix = unit === 'feet' ? 'sq ft' : 'sq m';
  return `${(w * h).toFixed(1)} ${suffix}`;
}
