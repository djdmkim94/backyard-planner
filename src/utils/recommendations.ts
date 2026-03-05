import type { GardenBed, SunZone, BoundaryPoint, FixedFeature, Pathway, ClimateData, WindDirection } from '../types/garden';
import { classifyFromWindows, effectiveSunWindows, hasPeakSun, getPlantSuggestions } from './sun';
import { pointInPolygon } from './geometry';

export interface Recommendation {
  id: string;
  category: 'sun' | 'wind' | 'planting' | 'climate' | 'spacing';
  severity: 'warning' | 'tip' | 'info';
  title: string;
  detail: string;
}

interface DesignInput {
  beds: GardenBed[];
  sunZones: SunZone[];
  boundary: BoundaryPoint[];
  fixedFeatures: FixedFeature[];
  pathways: Pathway[];
}

const WIND_ANGLES: Record<WindDirection, number> = {
  N: 270, NE: 315, E: 0, SE: 45,
  S: 90, SW: 135, W: 180, NW: 225,
};

function angleDiff(a: number, b: number): number {
  const d = Math.abs(a - b) % 360;
  return d > 180 ? 360 - d : d;
}

function boundaryCentroid(boundary: BoundaryPoint[]): { x: number; y: number } {
  const x = boundary.reduce((s, p) => s + p.x, 0) / boundary.length;
  const y = boundary.reduce((s, p) => s + p.y, 0) / boundary.length;
  return { x, y };
}

function hasWindbreak(
  direction: WindDirection,
  boundary: BoundaryPoint[],
  fixedFeatures: FixedFeature[],
): boolean {
  if (boundary.length < 2) return false;
  const targetAngle = WIND_ANGLES[direction];
  const { x: cx, y: cy } = boundaryCentroid(boundary);

  // Check boundary segments tagged as fence or house_wall
  for (let i = 0; i < boundary.length; i++) {
    const p = boundary[i];
    if (p.segmentType !== 'fence' && p.segmentType !== 'house_wall') continue;
    const next = boundary[(i + 1) % boundary.length];
    const mx = (p.x + next.x) / 2;
    const my = (p.y + next.y) / 2;
    const angle = (Math.atan2(my - cy, mx - cx) * 180 / Math.PI + 360) % 360;
    if (angleDiff(angle, targetAngle) <= 60) return true;
  }

  // Check fixed features (fence/house_wall) on that side
  for (const ff of fixedFeatures) {
    if (ff.type !== 'fence' && ff.type !== 'house_wall') continue;
    const pts = ff.points;
    let fx = 0, fy = 0;
    for (let i = 0; i < pts.length - 1; i += 2) { fx += pts[i]; fy += pts[i + 1]; }
    fx /= (pts.length / 2); fy /= (pts.length / 2);
    const angle = (Math.atan2(fy - cy, fx - cx) * 180 / Math.PI + 360) % 360;
    if (angleDiff(angle, targetAngle) <= 60) return true;
  }

  return false;
}

function getSeason(dateStr: string): 'spring' | 'summer' | 'fall' | 'winter' | null {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  const month = d.getMonth() + 1;
  if (month >= 3 && month <= 5) return 'spring';
  if (month >= 6 && month <= 8) return 'summer';
  if (month >= 9 && month <= 11) return 'fall';
  return 'winter';
}

export function generateRecommendations(design: DesignInput, climate: ClimateData): Recommendation[] {
  const recs: Recommendation[] = [];

  // --- Sun rules ---
  if (design.beds.length > 0 && design.sunZones.length === 0) {
    recs.push({
      id: 'sun-no-zones',
      category: 'sun',
      severity: 'info',
      title: 'No sun zones defined',
      detail: 'Add sun exposure data to get planting recommendations based on light conditions.',
    });
  }

  design.beds
    .filter((b) => b.sunRequirement === 'full_sun')
    .forEach((bed) => {
      const cx = bed.x + bed.width / 2;
      const cy = bed.y + bed.height / 2;
      const overlapping = design.sunZones.filter((z) => pointInPolygon(cx, cy, z.points));
      if (overlapping.length === 0) return;
      const hasFull = overlapping.some((z) => classifyFromWindows(effectiveSunWindows(z)) === 'full_sun');
      const hasShade = overlapping.some((z) => {
        const cls = classifyFromWindows(effectiveSunWindows(z));
        return cls === 'full_shade' || cls === 'part_shade';
      });
      if (hasShade && !hasFull) {
        recs.push({
          id: `sun-mismatch-${bed.id}`,
          category: 'sun',
          severity: 'warning',
          title: `Bed "${bed.label}" needs full sun`,
          detail: 'This bed is in a shaded area. Consider moving it or adjusting your shade zone.',
        });
      }
    });

  // --- Wind rules ---
  if (!climate.windDirection) {
    recs.push({
      id: 'wind-unknown',
      category: 'wind',
      severity: 'info',
      title: 'Wind direction not set',
      detail: 'Set your prevailing wind direction to get wind protection recommendations.',
    });
  } else {
    const windProtected = hasWindbreak(climate.windDirection, design.boundary, design.fixedFeatures);
    if (!windProtected) {
      const dir = climate.windDirection;
      recs.push({
        id: 'wind-no-break',
        category: 'wind',
        severity: 'tip',
        title: `Add a windbreak on the ${dir} side`,
        detail: `Prevailing wind comes from ${dir}. Consider adding a fence or hedge on the ${dir} side of your garden.`,
      });
    }
  }

  // --- Planting rules ---
  if (climate.currentDate) {
    const season = getSeason(climate.currentDate);
    if (season === 'winter') {
      recs.push({
        id: 'planting-winter',
        category: 'planting',
        severity: 'info',
        title: 'Winter — plan for next season',
        detail: 'Use this time to plan bed layouts, order seeds, and amend soil for spring.',
      });
    } else if (season && design.sunZones.length > 0) {
      const suggestions = new Set<string>();
      design.sunZones.slice(0, 3).forEach((z) => {
        const windows = effectiveSunWindows(z);
        const cls = classifyFromWindows(windows);
        const withPeak = hasPeakSun(windows);
        getPlantSuggestions(cls, withPeak).slice(0, 4).forEach((p) => suggestions.add(p));
      });
      const plants = Array.from(suggestions).slice(0, 6).join(', ');
      const label = season === 'spring' ? 'spring planting' : season === 'fall' ? 'fall planting' : 'summer growing';
      recs.push({
        id: 'planting-now',
        category: 'planting',
        severity: 'tip',
        title: `Plant now (${label})`,
        detail: `Based on your sun zones: ${plants}.`,
      });
    }
  }

  // --- Climate rules ---
  const koppen = climate.koppenClimate.trim();
  if (koppen.length > 0) {
    const prefix = koppen[0].toUpperCase();
    if (prefix === 'A') {
      recs.push({ id: 'climate-tropical', category: 'climate', severity: 'info', title: 'Tropical climate', detail: 'Year-round growing is possible. Watch for pest pressure in humid beds.' });
    } else if (prefix === 'B') {
      recs.push({ id: 'climate-arid', category: 'climate', severity: 'tip', title: 'Arid climate detected', detail: 'Prioritize drought-tolerant plants and consider drip irrigation placement.' });
    } else if (prefix === 'C') {
      const sub = koppen.slice(0, 3).toLowerCase();
      if (sub === 'cfa' || sub === 'cwa') {
        recs.push({ id: 'climate-humid-subtropical', category: 'climate', severity: 'info', title: 'Humid subtropical climate', detail: 'Hot humid summers — watch for fungal issues and ensure good airflow between plants.' });
      }
    } else if (prefix === 'D') {
      recs.push({ id: 'climate-continental', category: 'climate', severity: 'info', title: 'Continental climate', detail: 'Wide temperature swings ahead — use cold frames or row covers in shoulder seasons.' });
    }
  }

  // --- Spacing rules ---
  design.pathways.filter((p) => p.widthFt < 2).forEach((p) => {
    recs.push({
      id: `spacing-narrow-${p.id}`,
      category: 'spacing',
      severity: 'warning',
      title: `Narrow pathway: "${p.label}"`,
      detail: 'This pathway is less than 2ft wide, which is too narrow for comfortable garden access.',
    });
  });

  if (design.pathways.length === 0 && design.beds.length >= 3) {
    recs.push({
      id: 'spacing-no-pathways',
      category: 'spacing',
      severity: 'tip',
      title: 'Consider adding pathways',
      detail: 'With 3 or more beds, defined pathways help with access and maintenance.',
    });
  }

  return recs;
}
