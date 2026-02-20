import { Line, Circle, Group } from 'react-konva';

interface Props {
  points: Array<{ x: number; y: number }>;
  previewPoint: { x: number; y: number } | null;
}

export default function StructurePreviewLayer({ points, previewPoint }: Props) {
  if (points.length === 0) return null;

  const all = previewPoint ? [...points, previewPoint] : points;
  const flat = all.flatMap((p) => [p.x, p.y]);

  return (
    <Group listening={false}>
      <Line
        points={flat}
        stroke="#78716c"
        strokeWidth={2}
        dash={[8, 4]}
        listening={false}
      />
      {points.map((p, i) => (
        <Circle key={i} x={p.x} y={p.y} radius={4} fill="#78716c" listening={false} />
      ))}
    </Group>
  );
}
