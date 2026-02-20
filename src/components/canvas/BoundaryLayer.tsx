import { Line, Circle, Group, Label, Tag, Text } from 'react-konva';
import { useDesignStore } from '../../store/useDesignStore';
import { useCanvasStore } from '../../store/useCanvasStore';
import { DEFAULT_PIXELS_PER_FOOT } from '../../constants/canvas';
import type { UnitSystem } from '../../types/canvas';

interface Props {
  previewPoint?: { x: number; y: number } | null;
}

function segDist(ax: number, ay: number, bx: number, by: number): number {
  return Math.sqrt((bx - ax) ** 2 + (by - ay) ** 2);
}

function segAngleDeg(ax: number, ay: number, bx: number, by: number): number {
  const deg = Math.atan2(by - ay, bx - ax) * (180 / Math.PI);
  // Normalize to 0–180 (line has no direction, 0°=horizontal, 90°=vertical)
  return Math.round(((deg % 180) + 180) % 180);
}

function formatSegment(px: number, unit: UnitSystem): string {
  if (unit === 'meters') {
    const m = (px / DEFAULT_PIXELS_PER_FOOT) * 0.3048;
    return `${m.toFixed(2)}m`;
  }
  const totalFeet = px / DEFAULT_PIXELS_PER_FOOT;
  const feet = Math.floor(totalFeet);
  const rawInches = Math.round((totalFeet - feet) * 12);
  const inches = rawInches === 12 ? 0 : rawInches;
  const adjFeet = rawInches === 12 ? feet + 1 : feet;
  if (adjFeet === 0) return `${inches}"`;
  if (inches === 0) return `${adjFeet}'`;
  return `${adjFeet}' ${inches}"`;
}

interface SegLabelProps {
  ax: number; ay: number; bx: number; by: number;
  active: boolean;
  unit: UnitSystem;
}

function SegmentLabel({ ax, ay, bx, by, active, unit }: SegLabelProps) {
  const mx = (ax + bx) / 2;
  const my = (ay + by) / 2;
  const d = segDist(ax, ay, bx, by);
  if (d < 10) return null;

  const measurement = formatSegment(d, unit);
  const angle = active ? segAngleDeg(ax, ay, bx, by) : null;
  const text = active ? `\uD83D\uDCCF ${measurement}  ${angle}°` : measurement;
  const estimatedWidth = text.length * 7 + 8;

  return (
    <Label
      x={mx}
      y={my}
      offsetX={estimatedWidth / 2}
      offsetY={10}
      listening={false}
    >
      <Tag
        fill={active ? 'rgba(37,99,235,0.92)' : 'rgba(55,65,81,0.82)'}
        cornerRadius={3}
      />
      <Text
        text={text}
        fontSize={11}
        fill="white"
        padding={4}
        fontStyle="bold"
      />
    </Label>
  );
}

export default function BoundaryLayer({ previewPoint }: Props) {
  const boundary = useDesignStore((s) => s.boundary);
  const unitSystem = useCanvasStore((s) => s.unitSystem);

  if (boundary.length === 0) return null;

  const isDrawing = !!previewPoint;
  const displayPoints = previewPoint ? [...boundary, previewPoint] : boundary;
  const flatPoints = displayPoints.flatMap((p) => [p.x, p.y]);
  const isClosed = !isDrawing && boundary.length >= 3;

  return (
    <Group listening={false}>
      <Line
        points={flatPoints}
        closed={isClosed}
        stroke="#374151"
        strokeWidth={2}
        dash={[8, 4]}
        fill={isClosed ? 'rgba(34,197,94,0.05)' : 'transparent'}
        listening={false}
      />
      {isDrawing &&
        boundary.map((p, i) => (
          <Circle key={i} x={p.x} y={p.y} radius={4} fill="#374151" listening={false} />
        ))}

      {/* Completed segment labels */}
      {boundary.slice(0, -1).map((p, i) => (
        <SegmentLabel
          key={`seg-${i}`}
          ax={p.x} ay={p.y}
          bx={boundary[i + 1].x} by={boundary[i + 1].y}
          active={false}
          unit={unitSystem}
        />
      ))}

      {/* Closing segment label once boundary is fully drawn */}
      {isClosed && (
        <SegmentLabel
          ax={boundary[boundary.length - 1].x}
          ay={boundary[boundary.length - 1].y}
          bx={boundary[0].x}
          by={boundary[0].y}
          active={false}
          unit={unitSystem}
        />
      )}

      {/* Live active segment label while drawing */}
      {isDrawing && boundary.length > 0 && (
        <SegmentLabel
          ax={boundary[boundary.length - 1].x}
          ay={boundary[boundary.length - 1].y}
          bx={previewPoint.x}
          by={previewPoint.y}
          active={true}
          unit={unitSystem}
        />
      )}
    </Group>
  );
}
