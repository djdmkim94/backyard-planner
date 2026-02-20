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

export interface SunZone {
  id: string;
  points: number[];
  exposure: SunExposure;
}

export interface BoundaryPoint {
  x: number;
  y: number;
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

export interface Design {
  id: string;
  name: string;
  beds: GardenBed[];
  markers: Marker[];
  sunZones: SunZone[];
  boundary: BoundaryPoint[];
  structures: Structure[];
  createdAt: number;
  updatedAt: number;
}
