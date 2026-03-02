import { Line } from 'react-konva';
import { useDesignStore } from '../../store/useDesignStore';
import { DEFAULT_PIXELS_PER_FOOT } from '../../constants/canvas';

interface Props {
  inProgressPoints: Array<{ x: number; y: number }>;
  previewPoint: { x: number; y: number } | null;
  previewWidthFt: number;
}

export default function PathwayLayer({ inProgressPoints, previewPoint, previewWidthFt }: Props) {
  const pathways = useDesignStore((s) => s.pathways);

  const previewFlat =
    inProgressPoints.length > 0
      ? [
          ...inProgressPoints.flatMap((p) => [p.x, p.y]),
          ...(previewPoint ? [previewPoint.x, previewPoint.y] : []),
        ]
      : null;

  return (
    <>
      {/* Stored pathways */}
      {pathways.map((pathway) => (
        <Line
          key={pathway.id}
          points={pathway.points}
          stroke={pathway.color}
          strokeWidth={pathway.widthFt * DEFAULT_PIXELS_PER_FOOT}
          lineCap="round"
          lineJoin="round"
          opacity={0.45}
          listening={false}
        />
      ))}
      {/* Centerline dashes over stored pathways */}
      {pathways.map((pathway) => (
        <Line
          key={pathway.id + '_cl'}
          points={pathway.points}
          stroke="rgba(0,0,0,0.25)"
          strokeWidth={1}
          dash={[6, 5]}
          lineCap="round"
          listening={false}
        />
      ))}

      {/* In-progress drawing preview */}
      {previewFlat && previewFlat.length >= 4 && (
        <>
          <Line
            points={previewFlat}
            stroke="#d4a574"
            strokeWidth={previewWidthFt * DEFAULT_PIXELS_PER_FOOT}
            lineCap="round"
            lineJoin="round"
            opacity={0.35}
            dash={[12, 6]}
            listening={false}
          />
          <Line
            points={previewFlat}
            stroke="rgba(212,165,116,0.7)"
            strokeWidth={1.5}
            dash={[6, 4]}
            lineCap="round"
            listening={false}
          />
        </>
      )}
    </>
  );
}
