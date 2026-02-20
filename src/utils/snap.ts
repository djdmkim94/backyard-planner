import { DEFAULT_PIXELS_PER_FOOT } from '../constants/canvas';

const SNAP_SIZE = DEFAULT_PIXELS_PER_FOOT; // snap to 1ft grid

export function snapToGrid(value: number): number {
  return Math.round(value / SNAP_SIZE) * SNAP_SIZE;
}

export function snapPosition(x: number, y: number): { x: number; y: number } {
  return { x: snapToGrid(x), y: snapToGrid(y) };
}
