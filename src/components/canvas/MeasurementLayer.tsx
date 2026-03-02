import { Line, Text, Group } from 'react-konva';
import { useDesignStore } from '../../store/useDesignStore';
import { useCanvasStore } from '../../store/useCanvasStore';
import { distanceBetweenBeds } from '../../utils/geometry';
import { formatUnit } from '../../utils/conversion';

export default function MeasurementLayer() {
  const beds = useDesignStore((s) => s.beds);
  const showMeasurements = useCanvasStore((s) => s.showMeasurements);
  const unitSystem = useCanvasStore((s) => s.unitSystem);

  if (!showMeasurements || beds.length < 2) return null;

  const measurements: React.ReactNode[] = [];

  for (let i = 0; i < beds.length; i++) {
    for (let j = i + 1; j < beds.length; j++) {
      const a = beds[i];
      const b = beds[j];
      const dist = distanceBetweenBeds(a, b);
      if (dist <= 0 || dist > 500) continue;

      const ax = a.x + a.width / 2;
      const ay = a.y + a.height / 2;
      const bx = b.x + b.width / 2;
      const by = b.y + b.height / 2;
      const mx = (ax + bx) / 2;
      const my = (ay + by) / 2;

      measurements.push(
        <Group key={`m-${a.id}-${b.id}`} listening={false}>
          <Line
            points={[ax, ay, bx, by]}
            stroke="rgba(146,100,14,0.35)"
            strokeWidth={1}
            dash={[4, 4]}
          />
          <Text
            x={mx - 20}
            y={my - 8}
            text={formatUnit(dist, unitSystem)}
            fontSize={10}
            fill="#92660A"
            padding={2}
          />
        </Group>
      );
    }
  }

  return <Group listening={false}>{measurements}</Group>;
}
