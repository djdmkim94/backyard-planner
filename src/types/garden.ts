export type BedShapeType = 'rectangle' | 'circle' | 'stadium';

export interface GardenBed {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  label: string;
  color: string;
  templateId: string;
  bedShape?: BedShapeType;
  sunRequirement?: SunExposure;
}

export interface BedTemplate {
  id: string;
  label: string;
  widthFt: number;
  heightFt: number;
  color: string;
}

export type MarkerType = 'water' | 'tree' | 'structure' | 'compost';

export interface Marker {
  id: string;
  x: number;
  y: number;
  type: MarkerType;
  label: string;
  radius: number;
}

export type SunExposure = 'full_sun' | 'partial_shade' | 'full_shade';
export type SunWindow = 'morning' | 'peak' | 'afternoon';
export type Season = 'summer' | 'winter';

export interface SunWindowConfig {
  morning: boolean;
  peak: boolean;
  afternoon: boolean;
}

export interface SunZone {
  id: string;
  points: number[];
  label: string;
  summer: SunWindowConfig;
  winter: SunWindowConfig;
}

export type BoundarySegmentType = 'generic' | 'house_wall' | 'fence';

export interface BoundaryPoint {
  x: number;
  y: number;
  segmentType?: BoundarySegmentType;  // type of edge FROM this point TO the next point
}

export interface Structure {
  id: string;
  points: number[];  // flat [x1, y1, ...] relative to (x, y)
  x: number;
  y: number;
  rotation: number;
  label: string;
  color: string;
}

export type FixedFeatureType = 'house_wall' | 'fence' | 'tree' | 'water_spigot' | 'concrete_pad' | 'downspout';

export interface FixedFeature {
  id: string;
  type: FixedFeatureType;
  points: number[];        // flat array [x1,y1,x2,y2,...] — point features: [x,y], polygon features: [x1,y1,...]
  height?: number;         // feet — for fences/walls
  canopyRadius?: number;   // feet — for trees
  label?: string;
}

export interface Pathway {
  id: string;
  points: number[];   // flat centerline [x1,y1,x2,y2,...]
  widthFt: number;
  label: string;
  color: string;
}

export interface Design {
  id: string;
  name: string;
  beds: GardenBed[];
  markers: Marker[];
  sunZones: SunZone[];
  boundary: BoundaryPoint[];
  structures: Structure[];
  fixedFeatures: FixedFeature[];
  pathways: Pathway[];
  createdAt: number;
  updatedAt: number;
}
