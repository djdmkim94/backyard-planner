import type { FixedFeatureType } from '../types/garden';

export type DrawMode = 'point' | 'polygon';

export interface FixedFeatureConfig {
  type: FixedFeatureType;
  label: string;
  icon: string;
  color: string;
  drawMode: DrawMode;
  defaultHeight?: number;      // feet
  defaultCanopyRadius?: number; // feet
  minPoints?: number;           // minimum polygon points before finishing (default 2)
}

export const FIXED_FEATURE_CONFIGS: FixedFeatureConfig[] = [
  {
    type: 'house_wall',
    label: 'House Wall',
    icon: '🏠',
    color: '#1e293b',
    drawMode: 'polygon',
    defaultHeight: 10,
    minPoints: 2,
  },
  {
    type: 'fence',
    label: 'Fence',
    icon: '🚧',
    color: '#92400e',
    drawMode: 'polygon',
    defaultHeight: 6,
    minPoints: 2,
  },
  {
    type: 'tree',
    label: 'Tree',
    icon: '🌳',
    color: '#16a34a',
    drawMode: 'point',
    defaultCanopyRadius: 10,
  },
  {
    type: 'water_spigot',
    label: 'Water Spigot',
    icon: '💧',
    color: '#2563eb',
    drawMode: 'point',
  },
  {
    type: 'concrete_pad',
    label: 'Concrete Pad',
    icon: '⬜',
    color: '#94a3b8',
    drawMode: 'polygon',
    minPoints: 3,
  },
  {
    type: 'downspout',
    label: 'Downspout',
    icon: '🔽',
    color: '#475569',
    drawMode: 'point',
  },
];

export function getFixedFeatureConfig(type: FixedFeatureType): FixedFeatureConfig {
  return FIXED_FEATURE_CONFIGS.find((c) => c.type === type)!;
}
