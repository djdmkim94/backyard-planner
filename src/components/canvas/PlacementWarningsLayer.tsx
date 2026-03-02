import { Circle, Text, Group } from 'react-konva';
import { useDesignStore } from '../../store/useDesignStore';
import { useCanvasStore } from '../../store/useCanvasStore';
import { deriveExposure } from '../../utils/sun';
import { pointInPolygon } from '../../utils/geometry';

export default function PlacementWarningsLayer() {
  const beds = useDesignStore((s) => s.beds);
  const sunZones = useDesignStore((s) => s.sunZones);
  const activeSeason = useCanvasStore((s) => s.activeSeason);

  const warnings = beds
    .filter((bed) => bed.sunRequirement != null)
    .flatMap((bed) => {
      const cx = bed.x + bed.width / 2;
      const cy = bed.y + bed.height / 2;

      const overlappingZones = sunZones.filter((zone) =>
        pointInPolygon(cx, cy, zone.points)
      );

      // No zones covering this bed — can't evaluate, skip
      if (overlappingZones.length === 0) return [];

      const requirementMet = overlappingZones.some(
        (zone) => deriveExposure(zone[activeSeason]) === bed.sunRequirement
      );

      if (requirementMet) return [];

      return [{ id: bed.id, x: cx, y: bed.y - 14 }];
    });

  if (warnings.length === 0) return null;

  return (
    <>
      {warnings.map((w) => (
        <Group key={w.id} x={w.x} y={w.y} listening={false}>
          <Circle radius={9} fill="rgba(220,38,38,0.85)" />
          <Text
            text="!"
            fontSize={11}
            fontStyle="bold"
            fill="white"
            align="center"
            verticalAlign="middle"
            width={18}
            height={18}
            x={-9}
            y={-9}
            listening={false}
          />
        </Group>
      ))}
    </>
  );
}
