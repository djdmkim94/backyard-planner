import { create } from 'zustand';
import type { ActiveTool, UnitSystem } from '../types/canvas';
import { MIN_ZOOM, MAX_ZOOM } from '../constants/canvas';

interface CanvasState {
  zoom: number;
  panX: number;
  panY: number;
  activeTool: ActiveTool;
  showGrid: boolean;
  snapToGrid: boolean;
  showMeasurements: boolean;
  showSunOverlay: boolean;
  showPathwayGuides: boolean;
  unitSystem: UnitSystem;
  isPanning: boolean;

  setZoom: (zoom: number) => void;
  setPan: (x: number, y: number) => void;
  setActiveTool: (tool: ActiveTool) => void;
  toggleGrid: () => void;
  toggleSnap: () => void;
  toggleMeasurements: () => void;
  toggleSunOverlay: () => void;
  togglePathwayGuides: () => void;
  toggleUnitSystem: () => void;
  setIsPanning: (v: boolean) => void;
}

export const useCanvasStore = create<CanvasState>((set) => ({
  zoom: 1,
  panX: 0,
  panY: 0,
  activeTool: 'select',
  showGrid: true,
  snapToGrid: true,
  showMeasurements: true,
  showSunOverlay: true,
  showPathwayGuides: true,
  unitSystem: 'feet',
  isPanning: false,

  setZoom: (zoom) => set({ zoom: Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom)) }),
  setPan: (x, y) => set({ panX: x, panY: y }),
  setActiveTool: (tool) => set({ activeTool: tool }),
  toggleGrid: () => set((s) => ({ showGrid: !s.showGrid })),
  toggleSnap: () => set((s) => ({ snapToGrid: !s.snapToGrid })),
  toggleMeasurements: () => set((s) => ({ showMeasurements: !s.showMeasurements })),
  toggleSunOverlay: () => set((s) => ({ showSunOverlay: !s.showSunOverlay })),
  togglePathwayGuides: () => set((s) => ({ showPathwayGuides: !s.showPathwayGuides })),
  toggleUnitSystem: () =>
    set((s) => ({ unitSystem: s.unitSystem === 'feet' ? 'meters' : 'feet' })),
  setIsPanning: (v) => set({ isPanning: v }),
}));
