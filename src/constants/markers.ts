import type { MarkerType } from '../types/garden';

export interface MarkerTemplate {
  type: MarkerType;
  label: string;
  color: string;
  emoji: string;
  defaultRadiusFt: number;
}

export const MARKER_TEMPLATES: MarkerTemplate[] = [
  { type: 'water', label: 'Water Source', color: '#3b82f6', emoji: '💧', defaultRadiusFt: 0.5 },
  { type: 'tree', label: 'Tree', color: '#16a34a', emoji: '🌳', defaultRadiusFt: 5 },
  { type: 'structure', label: 'House', color: '#78716c', emoji: '🏠', defaultRadiusFt: 1 },
  { type: 'compost', label: 'Compost Bin', color: '#92400e', emoji: '♻️', defaultRadiusFt: 1.5 },
];
