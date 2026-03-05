import { useEffect } from 'react';
import { Line, Circle, Group, Label, Tag, Text } from 'react-konva';
import { useDesignStore } from '../../store/useDesignStore';
import { useCanvasStore } from '../../store/useCanvasStore';
import { DEFAULT_PIXELS_PER_FOOT } from '../../constants/canvas';
import type { UnitSystem } from '../../types/canvas';
import type { BoundarySegmentType } from '../../types/garden';

interface Props {
  previewPoint?: { x: number; y: number } | null;
}

function segDist(ax: number, ay: number, bx: number, by: number): number {
  return Math.sqrt((bx - ax) ** 2 + (by - ay) ** 2);
}

function segAngleDeg(ax: number, ay: number, bx: number, by: number): number {
  const deg = Math.atan2(by - ay, bx - ax) * (180 / Math.PI);
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
        fill={active ? 'rgba(37,99,235,0.92)' : 'rgba(80,60,30,0.85)'}
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

function getSegmentStyle(type?: BoundarySegmentType) {
  switch (type) {
    case 'house_wall':
      return { stroke: '#6b7280', strokeWidth: 6, dash: undefined as number[] | undefined };
    case 'fence':
      return { stroke: '#92400e', strokeWidth: 3, dash: [6, 4] as number[] | undefined };
    default:
      return { stroke: '#44362A', strokeWidth: 2, dash: [10, 5] as number[] | undefined };
  }
}

function perpOffset(ax: number, ay: number, bx: number, by: number, d: number): [number, number, number, number] {
  const dx = bx - ax, dy = by - ay;
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len === 0) return [ax, ay, bx, by];
  const nx = (-dy / len) * d, ny = (dx / len) * d;
  return [ax + nx, ay + ny, bx + nx, by + ny];
}

export default function BoundaryLayer({ previewPoint }: Props) {
  const boundary = useDesignStore((s) => s.boundary);
  const unitSystem = useCanvasStore((s) => s.unitSystem);
  const activeTool = useCanvasStore((s) => s.activeTool);
  const selectedBoundarySegment = useCanvasStore((s) => s.selectedBoundarySegment);
  const setSelectedBoundarySegment = useCanvasStore((s) => s.setSelectedBoundarySegment);

  // Deselect segment when switching away from select tool
  useEffect(() => {
    if (activeTool !== 'select') {
      setSelectedBoundarySegment(null);
    }
  }, [activeTool, setSelectedBoundarySegment]);

  if (boundary.length === 0) return null;

  const isDrawing = !!previewPoint;
  const isClosed = !isDrawing && boundary.length >= 3;

  // During drawing: simple non-interactive preview
  if (isDrawing) {
    const displayPoints = [...boundary, previewPoint!];
    const flatPoints = displayPoints.flatMap((p) => [p.x, p.y]);
    return (
      <Group listening={false}>
        <Line
          points={flatPoints}
          stroke="#44362A"
          strokeWidth={2}
          dash={[8, 4]}
        />
        {boundary.map((p, i) => (
          <Circle key={i} x={p.x} y={p.y} radius={4} fill="#44362A" />
        ))}
        {boundary.length > 0 && (
          <SegmentLabel
            ax={boundary[boundary.length - 1].x}
            ay={boundary[boundary.length - 1].y}
            bx={previewPoint!.x}
            by={previewPoint!.y}
            active={true}
            unit={unitSystem}
          />
        )}
      </Group>
    );
  }

  if (!isClosed) return null;

  // Completed boundary: per-segment interactive rendering
  const flatAll = boundary.flatMap((p) => [p.x, p.y]);

  return (
    <Group>
      {/* Fill polygon — non-interactive */}
      <Line
        points={flatAll}
        closed
        fill="rgba(34,197,94,0.07)"
        stroke="transparent"
        strokeWidth={0}
        listening={false}
      />

      {/* Segments */}
      {boundary.map((p, i) => {
        const nextI = (i + 1) % boundary.length;
        const next = boundary[nextI];
        const style = getSegmentStyle(p.segmentType);
        const isSegSelected = selectedBoundarySegment === i;

        return (
          <Group key={i}>
            {/* Selection highlight (behind) */}
            {isSegSelected && (
              <Line
                points={[p.x, p.y, next.x, next.y]}
                stroke="#f59e0b"
                strokeWidth={5}
                opacity={0.7}
                lineCap="round"
                listening={false}
              />
            )}
            {/* Visual line */}
            <Line
              points={[p.x, p.y, next.x, next.y]}
              stroke={style.stroke}
              strokeWidth={style.strokeWidth}
              dash={style.dash}
              lineCap="round"
              listening={false}
              shadowBlur={p.segmentType === 'house_wall' ? 3 : undefined}
              shadowColor={p.segmentType === 'house_wall' ? 'rgba(0,0,0,0.4)' : undefined}
            />
            {/* Fence double-rail */}
            {p.segmentType === 'fence' && (() => {
              const [ox1, oy1, ox2, oy2] = perpOffset(p.x, p.y, next.x, next.y, 4);
              return (
                <Line
                  points={[ox1, oy1, ox2, oy2]}
                  stroke="#92400e"
                  strokeWidth={1}
                  dash={[6, 4]}
                  opacity={0.45}
                  lineCap="round"
                  listening={false}
                />
              );
            })()}
            {/* Fat transparent hit target */}
            <Line
              points={[p.x, p.y, next.x, next.y]}
              stroke="rgba(0,0,0,0)"
              strokeWidth={14}
              lineCap="round"
              listening={true}
              onClick={() => setSelectedBoundarySegment(i === selectedBoundarySegment ? null : i)}
            />
          </Group>
        );
      })}

      {/* Segment labels — non-interactive */}
      <Group listening={false}>
        {boundary.slice(0, -1).map((p, i) => (
          <SegmentLabel
            key={`seg-${i}`}
            ax={p.x} ay={p.y}
            bx={boundary[i + 1].x} by={boundary[i + 1].y}
            active={false}
            unit={unitSystem}
          />
        ))}
        <SegmentLabel
          ax={boundary[boundary.length - 1].x}
          ay={boundary[boundary.length - 1].y}
          bx={boundary[0].x}
          by={boundary[0].y}
          active={false}
          unit={unitSystem}
        />
      </Group>
    </Group>
  );
}
