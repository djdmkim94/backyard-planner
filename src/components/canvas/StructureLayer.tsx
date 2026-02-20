import { Line, Text, Group } from 'react-konva';
import { useDesignStore } from '../../store/useDesignStore';
import { useHistoryStore } from '../../store/useHistoryStore';

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

export default function StructureLayer() {
  const structures = useDesignStore((s) => s.structures);
  const selectedId = useDesignStore((s) => s.selectedId);
  const selectItem = useDesignStore((s) => s.selectItem);
  const updateStructure = useDesignStore((s) => s.updateStructure);
  const pushSnapshot = useHistoryStore((s) => s.pushSnapshot);

  return (
    <>
      {structures.map((st) => {
        const isSelected = selectedId === st.id;
        const color = st.color ?? '#a8a29e';
        return (
          <Group
            key={st.id}
            id={st.id}
            x={st.x}
            y={st.y}
            rotation={st.rotation ?? 0}
            draggable
            onClick={(e) => {
              e.cancelBubble = true;
              selectItem(st.id);
            }}
            onDragStart={() => pushSnapshot()}
            onDragEnd={(e) =>
              updateStructure(st.id, { x: e.target.x(), y: e.target.y() })
            }
          >
            <Line
              points={st.points}
              closed
              fill={hexToRgba(color, 0.18)}
              stroke={isSelected ? '#2563eb' : color}
              strokeWidth={isSelected ? 2.5 : 1.5}
              dash={isSelected ? undefined : [6, 3]}
              hitStrokeWidth={12}
            />
            <Text
              x={0}
              y={0}
              offsetX={50}
              offsetY={7}
              width={100}
              align="center"
              text={st.label}
              fontSize={11}
              fill={isSelected ? '#2563eb' : color}
              fontStyle="bold"
            />
          </Group>
        );
      })}
    </>
  );
}
