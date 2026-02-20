import { Circle, Text, Group } from 'react-konva';
import { useDesignStore } from '../../store/useDesignStore';
import { useHistoryStore } from '../../store/useHistoryStore';
import { useCanvasStore } from '../../store/useCanvasStore';
import { MARKER_TEMPLATES } from '../../constants/markers';
import { snapToGrid } from '../../utils/snap';

export default function MarkerLayer() {
  const markers = useDesignStore((s) => s.markers);
  const selectedId = useDesignStore((s) => s.selectedId);
  const updateMarker = useDesignStore((s) => s.updateMarker);
  const selectItem = useDesignStore((s) => s.selectItem);
  const pushSnapshot = useHistoryStore((s) => s.pushSnapshot);
  const snapEnabled = useCanvasStore((s) => s.snapToGrid);

  return (
    <>
      {markers.map((marker) => {
        const template = MARKER_TEMPLATES.find((t) => t.type === marker.type);
        const isSelected = selectedId === marker.id;
        return (
          <Group
            key={marker.id}
            id={marker.id}
            x={marker.x}
            y={marker.y}
            draggable
            onClick={() => selectItem(marker.id)}
            onTap={() => selectItem(marker.id)}
            onDragStart={() => pushSnapshot()}
            onDragEnd={(e) => {
              let x = e.target.x();
              let y = e.target.y();
              if (snapEnabled) {
                x = snapToGrid(x);
                y = snapToGrid(y);
              }
              updateMarker(marker.id, { x, y });
              e.target.position({ x, y });
            }}
          >
            {/* Tree canopy radius */}
            {marker.type === 'tree' && (
              <Circle
                radius={marker.radius}
                fill="rgba(22,163,74,0.12)"
                stroke="rgba(22,163,74,0.3)"
                strokeWidth={1}
                dash={[4, 4]}
                listening={false}
              />
            )}
            <Circle
              radius={12}
              fill={template?.color ?? '#666'}
              stroke={isSelected ? '#2563eb' : '#333'}
              strokeWidth={isSelected ? 2 : 1}
            />
            <Text
              text={template?.emoji ?? '?'}
              fontSize={14}
              x={-7}
              y={-8}
              listening={false}
            />
            <Text
              text={marker.label}
              fontSize={10}
              fill="#333"
              x={-20}
              y={16}
              width={40}
              align="center"
              listening={false}
            />
          </Group>
        );
      })}
    </>
  );
}
