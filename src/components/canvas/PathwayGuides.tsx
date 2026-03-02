import { Line, Text, Group } from 'react-konva';
import { useDesignStore } from '../../store/useDesignStore';
import { useCanvasStore } from '../../store/useCanvasStore';
import { distanceBetweenBeds } from '../../utils/geometry';
import { PATHWAY_MIN_SPACING_FT } from '../../constants/sun';
import { DEFAULT_PIXELS_PER_FOOT } from '../../constants/canvas';
import { formatUnit } from '../../utils/conversion';

export default function PathwayGuides() {
  const beds = useDesignStore((s) => s.beds);
  const pathways = useDesignStore((s) => s.pathways);
  const showPathwayGuides = useCanvasStore((s) => s.showPathwayGuides);
  const unitSystem = useCanvasStore((s) => s.unitSystem);

  if (!showPathwayGuides) return null;

  const warnings: React.ReactNode[] = [];

  // Drawn pathway width warnings — primary mode
  for (const pathway of pathways) {
    if (pathway.widthFt < PATHWAY_MIN_SPACING_FT) {
      const pts = pathway.points;
      if (pts.length < 4) continue;
      // Find midpoint along the centerline
      const mid = Math.floor(pts.length / 4) * 2; // midpoint pair index
      const mx = pts[mid];
      const my = pts[mid + 1];
      warnings.push(
        <Group key={`pw-narrow-${pathway.id}`} listening={false}>
          <Line
            points={pathway.points}
            stroke="rgba(239,68,68,0.6)"
            strokeWidth={2}
            dash={[6, 3]}
          />
          <Text
            x={mx - 40}
            y={my - 16}
            text={`⚠ ${pathway.label}: ${pathway.widthFt}ft wide (<${PATHWAY_MIN_SPACING_FT}ft)`}
            fontSize={10}
            fill="#ef4444"
            padding={2}
          />
        </Group>
      );
    }
  }

  // Bed-proximity fallback — only shown when no pathways have been drawn yet
  if (pathways.length === 0 && beds.length >= 2) {
    const minPx = PATHWAY_MIN_SPACING_FT * DEFAULT_PIXELS_PER_FOOT;
    for (let i = 0; i < beds.length; i++) {
      for (let j = i + 1; j < beds.length; j++) {
        const a = beds[i];
        const b = beds[j];
        const dist = distanceBetweenBeds(a, b);
        if (dist > 0 && dist < minPx) {
          const ax = a.x + a.width / 2;
          const ay = a.y + a.height / 2;
          const bx = b.x + b.width / 2;
          const by = b.y + b.height / 2;
          const mx = (ax + bx) / 2;
          const my = (ay + by) / 2;
          warnings.push(
            <Group key={`pw-${a.id}-${b.id}`} listening={false}>
              <Line
                points={[ax, ay, bx, by]}
                stroke="rgba(239,68,68,0.5)"
                strokeWidth={2}
                dash={[6, 3]}
              />
              <Text
                x={mx - 30}
                y={my - 8}
                text={`⚠ ${formatUnit(dist, unitSystem)} (<${PATHWAY_MIN_SPACING_FT}ft)`}
                fontSize={10}
                fill="#ef4444"
                padding={2}
              />
            </Group>
          );
        }
      }
    }
  }

  if (warnings.length === 0) return null;
  return <Group listening={false}>{warnings}</Group>;
}
