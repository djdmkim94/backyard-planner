import { Line, Group, Rect } from 'react-konva';
import { useDesignStore } from '../../store/useDesignStore';
import { useCanvasStore } from '../../store/useCanvasStore';
import { SUN_EXPOSURE_OPTIONS } from '../../constants/sun';
import { deriveExposure } from '../../utils/sun';

interface Props {
  dragStart: { x: number; y: number } | null;
  dragCurrent: { x: number; y: number } | null;
}

export default function SunOverlayLayer({ dragStart, dragCurrent }: Props) {
  const sunZones = useDesignStore((s) => s.sunZones);
  const showSunOverlay = useCanvasStore((s) => s.showSunOverlay);
  const activeSeason = useCanvasStore((s) => s.activeSeason);

  const showDragPreview = dragStart && dragCurrent;

  if (!showSunOverlay && !showDragPreview) return null;

  const previewX = showDragPreview ? Math.min(dragStart.x, dragCurrent.x) : 0;
  const previewY = showDragPreview ? Math.min(dragStart.y, dragCurrent.y) : 0;
  const previewW = showDragPreview ? Math.abs(dragCurrent.x - dragStart.x) : 0;
  const previewH = showDragPreview ? Math.abs(dragCurrent.y - dragStart.y) : 0;

  return (
    <Group listening={false}>
      {showSunOverlay && sunZones.map((zone) => {
        const exposure = deriveExposure(zone[activeSeason]);
        const opt = SUN_EXPOSURE_OPTIONS.find((o) => o.exposure === exposure);
        return (
          <Line
            key={zone.id}
            points={zone.points}
            closed
            fill={opt?.color ?? '#ccc'}
            opacity={opt?.opacity ?? 0.2}
            stroke={opt?.color ?? '#ccc'}
            strokeWidth={1}
          />
        );
      })}
      {showDragPreview && previewW > 0 && previewH > 0 && (
        <Rect
          x={previewX}
          y={previewY}
          width={previewW}
          height={previewH}
          fill="#fbbf24"
          opacity={0.15}
          stroke="#fbbf24"
          strokeWidth={2}
          dash={[6, 4]}
        />
      )}
    </Group>
  );
}
