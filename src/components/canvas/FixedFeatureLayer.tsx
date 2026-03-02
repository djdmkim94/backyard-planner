import { Group, Line, Circle, Text, Rect } from 'react-konva';
import { useDesignStore } from '../../store/useDesignStore';
import { useCanvasStore } from '../../store/useCanvasStore';
import { useHistoryStore } from '../../store/useHistoryStore';
import { getFixedFeatureConfig } from '../../constants/fixedFeatures';
import { DEFAULT_PIXELS_PER_FOOT } from '../../constants/canvas';
import type { FixedFeature } from '../../types/garden';

function PointFeature({ feature }: { feature: FixedFeature }) {
  const cfg = getFixedFeatureConfig(feature.type);
  const x = feature.points[0];
  const y = feature.points[1];

  const selectedId = useDesignStore((s) => s.selectedId);
  const selectItem = useDesignStore((s) => s.selectItem);
  const updateFixedFeature = useDesignStore((s) => s.updateFixedFeature);
  const pushSnapshot = useHistoryStore((s) => s.pushSnapshot);
  const setSelectedBoundarySegment = useCanvasStore((s) => s.setSelectedBoundarySegment);

  const isSelected = selectedId === feature.id;

  const sharedProps = {
    draggable: true,
    onMouseDown: () => pushSnapshot(),
    onClick: () => { selectItem(feature.id); setSelectedBoundarySegment(null); },
    onDragEnd: (e: { target: { x: () => number; y: () => number } }) => {
      updateFixedFeature(feature.id, { points: [e.target.x(), e.target.y()] });
    },
  };

  if (feature.type === 'tree') {
    const canopyPx = (feature.canopyRadius ?? cfg.defaultCanopyRadius ?? 10) * DEFAULT_PIXELS_PER_FOOT;
    return (
      <Group x={x} y={y} {...sharedProps}>
        {isSelected && (
          <Circle radius={canopyPx + 4} stroke="#f59e0b" strokeWidth={2} fill="transparent" listening={false} />
        )}
        <Circle
          radius={canopyPx}
          fill="#16a34a"
          opacity={0.18}
          stroke="#16a34a"
          strokeWidth={1.5}
          dash={[6, 3]}
        />
        <Circle radius={5} fill="#713f12" stroke="#78350f" strokeWidth={1} />
        <Text
          text={feature.label ?? 'Tree'}
          x={-20}
          y={7}
          width={40}
          align="center"
          fontSize={9}
          fill="#14532d"
          fontStyle="bold"
          listening={false}
        />
      </Group>
    );
  }

  if (feature.type === 'water_spigot') {
    return (
      <Group x={x} y={y} {...sharedProps}>
        {isSelected && (
          <Circle radius={12} stroke="#f59e0b" strokeWidth={2} fill="transparent" listening={false} />
        )}
        <Circle radius={8} fill="#2563eb" stroke="#1d4ed8" strokeWidth={1.5} />
        <Text text="W" x={-4} y={-5} fontSize={8} fill="white" fontStyle="bold" listening={false} />
        {feature.label && (
          <Text text={feature.label} x={-20} y={11} width={40} align="center" fontSize={9} fill="#1e40af" listening={false} />
        )}
      </Group>
    );
  }

  if (feature.type === 'downspout') {
    return (
      <Group x={x} y={y} {...sharedProps}>
        {isSelected && (
          <Circle radius={10} stroke="#f59e0b" strokeWidth={2} fill="transparent" listening={false} />
        )}
        <Circle radius={6} fill="#475569" stroke="#334155" strokeWidth={1} />
        <Text text="D" x={-3.5} y={-5} fontSize={8} fill="white" fontStyle="bold" listening={false} />
        {feature.label && (
          <Text text={feature.label} x={-20} y={9} width={40} align="center" fontSize={9} fill="#334155" listening={false} />
        )}
      </Group>
    );
  }

  return null;
}

function PolygonFeature({ feature }: { feature: FixedFeature }) {
  const cfg = getFixedFeatureConfig(feature.type);

  const selectedId = useDesignStore((s) => s.selectedId);
  const selectItem = useDesignStore((s) => s.selectItem);
  const updateFixedFeature = useDesignStore((s) => s.updateFixedFeature);
  const pushSnapshot = useHistoryStore((s) => s.pushSnapshot);
  const setSelectedBoundarySegment = useCanvasStore((s) => s.setSelectedBoundarySegment);

  const isSelected = selectedId === feature.id;

  if (feature.points.length < 4) return null;

  const isConcrete = feature.type === 'concrete_pad';
  const isHouseWall = feature.type === 'house_wall';
  const isFence = feature.type === 'fence';

  const pts = [];
  for (let i = 0; i < feature.points.length; i += 2) {
    pts.push({ x: feature.points[i], y: feature.points[i + 1] });
  }
  const cx = pts.reduce((s, p) => s + p.x, 0) / pts.length;
  const cy = pts.reduce((s, p) => s + p.y, 0) / pts.length;

  const heightLabel =
    feature.height != null
      ? `${feature.height}ft`
      : cfg.defaultHeight != null
      ? `${cfg.defaultHeight}ft`
      : null;

  const firstSegMidX = pts.length >= 2 ? (pts[0].x + pts[1].x) / 2 : cx;
  const firstSegMidY = pts.length >= 2 ? (pts[0].y + pts[1].y) / 2 : cy;

  const handleDragEnd = (e: { target: { x: () => number; y: () => number; position: (p: { x: number; y: number }) => void } }) => {
    const dx = e.target.x();
    const dy = e.target.y();
    const newPoints = feature.points.map((v, i) => (i % 2 === 0 ? v + dx : v + dy));
    updateFixedFeature(feature.id, { points: newPoints });
    e.target.position({ x: 0, y: 0 });
  };

  return (
    <Group
      draggable
      onMouseDown={() => pushSnapshot()}
      onClick={() => { selectItem(feature.id); setSelectedBoundarySegment(null); }}
      onDragEnd={handleDragEnd}
    >
      {/* Fat transparent hit area for easy dragging */}
      <Line
        points={feature.points}
        closed={isConcrete}
        fill={isConcrete ? 'rgba(148,163,184,0.01)' : undefined}
        stroke="transparent"
        strokeWidth={14}
      />
      {/* Visual */}
      <Line
        points={feature.points}
        closed={isConcrete}
        fill={isConcrete ? '#94a3b8' : undefined}
        opacity={isConcrete ? 0.3 : 1}
        stroke={cfg.color}
        strokeWidth={isHouseWall ? 2.5 : isFence ? 1.5 : 2}
        dash={isFence ? [5, 3] : undefined}
        lineCap="round"
        lineJoin="round"
        listening={false}
      />
      {/* Labels */}
      <Group listening={false}>
        {isConcrete && (
          <Text
            x={cx - 30}
            y={cy - 6}
            width={60}
            align="center"
            text={feature.label ?? 'Concrete'}
            fontSize={10}
            fill="#475569"
            fontStyle="bold"
          />
        )}
        {isHouseWall && (
          <Group x={cx} y={cy}>
            <Rect x={-24} y={-9} width={48} height={16} fill="white" opacity={0.7} cornerRadius={2} />
            <Text
              x={-24}
              y={-8}
              width={48}
              align="center"
              text={feature.label ?? 'House'}
              fontSize={9}
              fill="#1e293b"
              fontStyle="bold"
            />
          </Group>
        )}
        {isFence && heightLabel && (
          <Group x={firstSegMidX} y={firstSegMidY - 12}>
            <Rect x={-14} y={-7} width={28} height={13} fill="#a16207" opacity={0.85} cornerRadius={2} />
            <Text
              x={-14}
              y={-6}
              width={28}
              align="center"
              text={heightLabel}
              fontSize={9}
              fill="white"
              fontStyle="bold"
            />
          </Group>
        )}
      </Group>
      {/* Selection highlight */}
      {isSelected && (
        <Line
          points={feature.points}
          closed={isConcrete}
          stroke="#f59e0b"
          strokeWidth={3}
          opacity={0.6}
          fill="transparent"
          listening={false}
        />
      )}
    </Group>
  );
}

export default function FixedFeatureLayer() {
  const fixedFeatures = useDesignStore((s) => s.fixedFeatures);

  return (
    <Group>
      {fixedFeatures.map((f) => {
        const cfg = getFixedFeatureConfig(f.type);
        return cfg.drawMode === 'point' ? (
          <PointFeature key={f.id} feature={f} />
        ) : (
          <PolygonFeature key={f.id} feature={f} />
        );
      })}
    </Group>
  );
}
