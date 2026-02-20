import { create } from 'zustand';
import { nanoid } from 'nanoid';
import type { GardenBed, Marker, SunZone, BoundaryPoint, Structure, BedShapeType, Design } from '../types/garden';
import { DEFAULT_PIXELS_PER_FOOT } from '../constants/canvas';
import { BED_TEMPLATES } from '../constants/beds';
import { MARKER_TEMPLATES } from '../constants/markers';
import type { MarkerType } from '../types/garden';

interface DesignState {
  beds: GardenBed[];
  markers: Marker[];
  sunZones: SunZone[];
  boundary: BoundaryPoint[];
  structures: Structure[];
  selectedId: string | null;
  designName: string;

  addBed: (templateId: string, x?: number, y?: number) => void;
  addCustomBed: (opts: { widthFt: number; heightFt: number; label: string; color: string; bedShape: BedShapeType }) => void;
  updateBed: (id: string, updates: Partial<GardenBed>) => void;
  removeBed: (id: string) => void;
  selectItem: (id: string | null) => void;
  addMarker: (type: MarkerType, x?: number, y?: number) => void;
  updateMarker: (id: string, updates: Partial<Marker>) => void;
  removeMarker: (id: string) => void;
  addSunZone: (points: number[], exposure: SunZone['exposure']) => void;
  removeSunZone: (id: string) => void;
  setBoundary: (points: BoundaryPoint[]) => void;
  clearBoundary: () => void;
  addStructure: (drawnPoints: Array<{ x: number; y: number }>) => void;
  updateStructure: (id: string, updates: Partial<Structure>) => void;
  removeStructure: (id: string) => void;
  setDesignName: (name: string) => void;
  getSnapshot: () => DesignSnapshot;
  restoreSnapshot: (snapshot: DesignSnapshot) => void;
  loadDesign: (design: Design) => void;
  clearAll: () => void;
}

export interface DesignSnapshot {
  beds: GardenBed[];
  markers: Marker[];
  sunZones: SunZone[];
  boundary: BoundaryPoint[];
  structures: Structure[];
}

export const useDesignStore = create<DesignState>((set, get) => ({
  beds: [],
  markers: [],
  sunZones: [],
  boundary: [],
  structures: [],
  selectedId: null,
  designName: 'My Garden',

  addBed: (templateId, x, y) => {
    const template = BED_TEMPLATES.find((t) => t.id === templateId);
    if (!template) return;
    const ppf = DEFAULT_PIXELS_PER_FOOT;
    const bed: GardenBed = {
      id: nanoid(),
      x: x ?? 300,
      y: y ?? 300,
      width: template.widthFt * ppf,
      height: template.heightFt * ppf,
      rotation: 0,
      label: template.label,
      color: template.color,
      templateId,
    };
    set((s) => ({ beds: [...s.beds, bed], selectedId: bed.id }));
  },

  addCustomBed: ({ widthFt, heightFt, label, color, bedShape }) => {
    const ppf = DEFAULT_PIXELS_PER_FOOT;
    const bed: GardenBed = {
      id: nanoid(),
      x: 300,
      y: 300,
      width: widthFt * ppf,
      height: heightFt * ppf,
      rotation: 0,
      label,
      color,
      templateId: 'custom',
      bedShape,
    };
    set((s) => ({ beds: [...s.beds, bed], selectedId: bed.id }));
  },

  updateBed: (id, updates) =>
    set((s) => ({
      beds: s.beds.map((b) => (b.id === id ? { ...b, ...updates } : b)),
    })),

  removeBed: (id) =>
    set((s) => ({
      beds: s.beds.filter((b) => b.id !== id),
      selectedId: s.selectedId === id ? null : s.selectedId,
    })),

  selectItem: (id) => set({ selectedId: id }),

  addMarker: (type, x, y) => {
    const template = MARKER_TEMPLATES.find((t) => t.type === type);
    if (!template) return;
    const ppf = DEFAULT_PIXELS_PER_FOOT;
    const marker: Marker = {
      id: nanoid(),
      x: x ?? 400,
      y: y ?? 400,
      type,
      label: template.label,
      radius: template.defaultRadiusFt * ppf,
    };
    set((s) => ({ markers: [...s.markers, marker], selectedId: marker.id }));
  },

  updateMarker: (id, updates) =>
    set((s) => ({
      markers: s.markers.map((m) => (m.id === id ? { ...m, ...updates } : m)),
    })),

  removeMarker: (id) =>
    set((s) => ({
      markers: s.markers.filter((m) => m.id !== id),
      selectedId: s.selectedId === id ? null : s.selectedId,
    })),

  addSunZone: (points, exposure) => {
    const zone: SunZone = { id: nanoid(), points, exposure };
    set((s) => ({ sunZones: [...s.sunZones, zone] }));
  },

  removeSunZone: (id) =>
    set((s) => ({ sunZones: s.sunZones.filter((z) => z.id !== id) })),

  setBoundary: (points) => set({ boundary: points }),
  clearBoundary: () => set({ boundary: [] }),

  addStructure: (drawnPoints) => {
    const cx = drawnPoints.reduce((s, p) => s + p.x, 0) / drawnPoints.length;
    const cy = drawnPoints.reduce((s, p) => s + p.y, 0) / drawnPoints.length;
    const count = get().structures.length + 1;
    const structure: Structure = {
      id: nanoid(),
      x: cx,
      y: cy,
      rotation: 0,
      points: drawnPoints.flatMap((p) => [p.x - cx, p.y - cy]),
      label: `Structure ${count}`,
      color: '#a8a29e',
    };
    set((s) => ({ structures: [...s.structures, structure], selectedId: structure.id }));
  },

  updateStructure: (id, updates) =>
    set((s) => ({
      structures: s.structures.map((st) => (st.id === id ? { ...st, ...updates } : st)),
    })),

  removeStructure: (id) =>
    set((s) => ({
      structures: s.structures.filter((st) => st.id !== id),
      selectedId: s.selectedId === id ? null : s.selectedId,
    })),

  setDesignName: (name) => set({ designName: name }),

  getSnapshot: () => {
    const { beds, markers, sunZones, boundary, structures } = get();
    return {
      beds: beds.map((b) => ({ ...b })),
      markers: markers.map((m) => ({ ...m })),
      sunZones: sunZones.map((z) => ({ ...z, points: [...z.points] })),
      boundary: boundary.map((p) => ({ ...p })),
      structures: structures.map((st) => ({ ...st, points: [...st.points] })),
    };
  },

  restoreSnapshot: (snapshot) =>
    set({
      beds: snapshot.beds,
      markers: snapshot.markers,
      sunZones: snapshot.sunZones,
      boundary: snapshot.boundary,
      structures: snapshot.structures,
    }),

  loadDesign: (design) =>
    set({
      beds: design.beds,
      markers: design.markers,
      sunZones: design.sunZones,
      boundary: design.boundary,
      structures: design.structures ?? [],
      designName: design.name,
      selectedId: null,
    }),

  clearAll: () =>
    set({
      beds: [],
      markers: [],
      sunZones: [],
      boundary: [],
      structures: [],
      selectedId: null,
    }),
}));
