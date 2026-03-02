import type { GardenBed } from '../types/garden';

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
}

export function getCorners(rect: Rect): { x: number; y: number }[] {
  const { x, y, width, height, rotation } = rect;
  const rad = (rotation * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const hw = width / 2;
  const hh = height / 2;
  const cx = x + hw;
  const cy = y + hh;

  const offsets = [
    [-hw, -hh],
    [hw, -hh],
    [hw, hh],
    [-hw, hh],
  ];

  return offsets.map(([ox, oy]) => ({
    x: cx + ox * cos - oy * sin,
    y: cy + ox * sin + oy * cos,
  }));
}

// Ray-casting algorithm: returns true if point (px, py) is inside the polygon
// described by flat coordinate array [x1,y1,x2,y2,...]
export function pointInPolygon(px: number, py: number, flatPoints: number[]): boolean {
  let inside = false;
  const n = flatPoints.length / 2;
  for (let i = 0, j = n - 1; i < n; j = i++) {
    const xi = flatPoints[i * 2], yi = flatPoints[i * 2 + 1];
    const xj = flatPoints[j * 2], yj = flatPoints[j * 2 + 1];
    const intersect = (yi > py) !== (yj > py) && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

export function distanceBetweenBeds(a: GardenBed, b: GardenBed): number {
  const acx = a.x + a.width / 2;
  const acy = a.y + a.height / 2;
  const bcx = b.x + b.width / 2;
  const bcy = b.y + b.height / 2;
  const dx = Math.abs(acx - bcx) - (a.width + b.width) / 2;
  const dy = Math.abs(acy - bcy) - (a.height + b.height) / 2;
  if (dx <= 0 && dy <= 0) return 0;
  if (dx <= 0) return dy;
  if (dy <= 0) return dx;
  return Math.sqrt(dx * dx + dy * dy);
}
