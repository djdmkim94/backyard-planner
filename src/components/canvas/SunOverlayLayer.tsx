import { Line, Group, Rect, Text } from 'react-konva';
import { useDesignStore } from '../../store/useDesignStore';
import { useCanvasStore } from '../../store/useCanvasStore';
import { MANUAL_PRESETS, sunZoneStyle } from '../../constants/sun';

interface Props {
  dragStart: { x: number; y: number } | null;
  dragCurrent: { x: number; y: number } | null;
}

function polygonCentroid(points: number[]): { x: number; y: number } {
  let sx = 0, sy = 0;
  const n = points.length / 2;
  for (let i = 0; i < points.length; i += 2) {
    sx += points[i];
    sy += points[i + 1];
  }
  return { x: sx / n, y: sy / n };
}

export default function SunOverlayLayer({ dragStart, dragCurrent }: Props) {
  const sunZones = useDesignStore((s) => s.sunZones);
  const showSunOverlay = useCanvasStore((s) => s.showSunOverlay);
  const activeSeason = useCanvasStore((s) => s.activeSeason);
  const activeSunPreset = useCanvasStore((s) => s.activeSunPreset);

  const showDragPreview = dragStart && dragCurrent;

  if (!showSunOverlay && !showDragPreview) return null;

  const previewX = showDragPreview ? Math.min(dragStart.x, dragCurrent.x) : 0;
  const previewY = showDragPreview ? Math.min(dragStart.y, dragCurrent.y) : 0;
  const previewW = showDragPreview ? Math.abs(dragCurrent.x - dragStart.x) : 0;
  const previewH = showDragPreview ? Math.abs(dragCurrent.y - dragStart.y) : 0;

  // Use the active preset's color for the drag preview, or default amber
  const previewColor = activeSunPreset
    ? (MANUAL_PRESETS.find((p) => p.id === activeSunPreset)?.color ?? '#fbbf24')
    : '#fbbf24';

  return (
    <Group listening={false}>
      {showSunOverlay && sunZones.map((zone) => {
        const style = sunZoneStyle(zone[activeSeason]);
        const center = polygonCentroid(zone.points);
        const badgeW = style.badge.length * 6.5 + 10;

        return (
          <Group key={zone.id}>
            <Line
              points={zone.points}
              closed
              fill={style.fill}
              opacity={style.opacity}
              stroke={style.fill}
              strokeWidth={1.5}
            />
            {/* Badge label at centroid */}
            <Group x={center.x} y={center.y}>
              <Rect
                x={-badgeW / 2}
                y={-9}
                width={badgeW}
                height={17}
                fill={style.fill}
                opacity={0.85}
                cornerRadius={3}
              />
              <Text
                text={style.badge}
                x={-badgeW / 2}
                y={-7}
                width={badgeW}
                align="center"
                fontSize={10}
                fontStyle="bold"
                fill="#1c1c1e"
              />
            </Group>
          </Group>
        );
      })}

      {showDragPreview && previewW > 0 && previewH > 0 && (
        <Rect
          x={previewX}
          y={previewY}
          width={previewW}
          height={previewH}
          fill={previewColor}
          opacity={0.18}
          stroke={previewColor}
          strokeWidth={2}
          dash={[6, 4]}
        />
      )}
    </Group>
  );
}
