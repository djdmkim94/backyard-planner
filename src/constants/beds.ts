import type { BedTemplate } from '../types/garden';

export const BED_TEMPLATES: BedTemplate[] = [
  { id: '4x8', label: '4\' × 8\' Raised Bed', widthFt: 4, heightFt: 8, color: '#8B6914' },
  { id: '4x4', label: '4\' × 4\' Square Bed', widthFt: 4, heightFt: 4, color: '#A0522D' },
  { id: '3x6', label: '3\' × 6\' Narrow Bed', widthFt: 3, heightFt: 6, color: '#6B8E23' },
  { id: '2x4', label: '2\' × 4\' Small Bed', widthFt: 2, heightFt: 4, color: '#556B2F' },
];

export const BED_STROKE_COLOR = '#333';
export const BED_STROKE_WIDTH = 1;
export const BED_SELECTED_STROKE_COLOR = '#2563eb';
export const BED_SELECTED_STROKE_WIDTH = 2;
export const MIN_BED_SIZE_PX = 12;
