import { Line, Group } from 'react-konva';
import { useDesignStore } from '../../store/useDesignStore';
import { useCanvasStore } from '../../store/useCanvasStore';
import { SUN_EXPOSURE_OPTIONS } from '../../constants/sun';

export default function SunOverlayLayer() {
  const sunZones = useDesignStore((s) => s.sunZones);
  const showSunOverlay = useCanvasStore((s) => s.showSunOverlay);

  if (!showSunOverlay || sunZones.length === 0) return null;

  return (
    <Group listening={false}>
      {sunZones.map((zone) => {
        const opt = SUN_EXPOSURE_OPTIONS.find((o) => o.exposure === zone.exposure);
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
    </Group>
  );
}
