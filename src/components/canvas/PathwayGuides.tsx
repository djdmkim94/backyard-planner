import { Line, Text, Group } from 'react-konva';
import { useDesignStore } from '../../store/useDesignStore';
import { useCanvasStore } from '../../store/useCanvasStore';
import { distanceBetweenBeds } from '../../utils/geometry';
import { PATHWAY_MIN_SPACING_FT } from '../../constants/sun';
import { DEFAULT_PIXELS_PER_FOOT } from '../../constants/canvas';
import { formatUnit } from '../../utils/conversion';

export default function PathwayGuides() {
  const beds = useDesignStore((s) => s.beds);
  const showPathwayGuides = useCanvasStore((s) => s.showPathwayGuides);
  const unitSystem = useCanvasStore((s) => s.unitSystem);

  if (!showPathwayGuides || beds.length < 2) return null;

  const minPx = PATHWAY_MIN_SPACING_FT * DEFAULT_PIXELS_PER_FOOT;
  const warnings: React.ReactNode[] = [];

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

  return <Group listening={false}>{warnings}</Group>;
}
