import { Rect, Ellipse, Text, Group, Shape } from 'react-konva';
import type { GardenBed } from '../../types/garden';
import { useDesignStore } from '../../store/useDesignStore';
import { useCanvasStore } from '../../store/useCanvasStore';
import { useHistoryStore } from '../../store/useHistoryStore';
import { snapToGrid } from '../../utils/snap';
import {
  BED_STROKE_COLOR,
  BED_STROKE_WIDTH,
  BED_SELECTED_STROKE_COLOR,
  BED_SELECTED_STROKE_WIDTH,
} from '../../constants/beds';

interface Props {
  bed: GardenBed;
}

export default function BedShape({ bed }: Props) {
  const selectedId = useDesignStore((s) => s.selectedId);
  const updateBed = useDesignStore((s) => s.updateBed);
  const selectItem = useDesignStore((s) => s.selectItem);
  const snapEnabled = useCanvasStore((s) => s.snapToGrid);
  const pushSnapshot = useHistoryStore((s) => s.pushSnapshot);
  const isSelected = selectedId === bed.id;

  const stroke = isSelected ? BED_SELECTED_STROKE_COLOR : BED_STROKE_COLOR;
  const strokeWidth = isSelected ? BED_SELECTED_STROKE_WIDTH : BED_STROKE_WIDTH;
  const shape = bed.bedShape ?? 'rectangle';

  const handleDragStart = () => pushSnapshot();

  const handleDragEnd = (e: any) => {
    // node.x/y is the center (due to offsetX/offsetY), convert back to top-left
    let x = e.target.x() - bed.width / 2;
    let y = e.target.y() - bed.height / 2;
    if (snapEnabled) {
      x = snapToGrid(x);
      y = snapToGrid(y);
    }
    updateBed(bed.id, { x, y });
    e.target.position({ x: x + bed.width / 2, y: y + bed.height / 2 });
  };

  const handleClick = () => selectItem(bed.id);

  const shapeNode = shape === 'circle' ? (
    <Ellipse
      x={bed.width / 2}
      y={bed.height / 2}
      radiusX={bed.width / 2}
      radiusY={bed.height / 2}
      fill={bed.color}
      opacity={0.8}
      stroke={stroke}
      strokeWidth={strokeWidth}
    />
  ) : shape === 'stadium' ? (
    <Shape
      sceneFunc={(ctx, s) => {
        const w = bed.width, h = bed.height;
        const nctx = ctx as unknown as CanvasRenderingContext2D;
        nctx.beginPath();
        if (w >= h) {
          // horizontal: semicircles on left/right
          const r = h / 2;
          nctx.moveTo(r, 0);
          nctx.lineTo(w - r, 0);
          nctx.arc(w - r, r, r, -Math.PI / 2, Math.PI / 2);
          nctx.lineTo(r, h);
          nctx.arc(r, r, r, Math.PI / 2, -Math.PI / 2);
        } else {
          // vertical: semicircles on top/bottom
          const r = w / 2;
          nctx.arc(r, r, r, 0, Math.PI, true);
          nctx.lineTo(0, h - r);
          nctx.arc(r, h - r, r, Math.PI, 0);
        }
        nctx.closePath();
        ctx.fillStrokeShape(s);
      }}
      fill={bed.color}
      opacity={0.8}
      stroke={stroke}
      strokeWidth={strokeWidth}
    />
  ) : (
    <Rect
      width={bed.width}
      height={bed.height}
      fill={bed.color}
      opacity={0.8}
      stroke={stroke}
      strokeWidth={strokeWidth}
      cornerRadius={2}
    />
  );

  return (
    <Group
      id={bed.id}
      x={bed.x + bed.width / 2}
      y={bed.y + bed.height / 2}
      offsetX={bed.width / 2}
      offsetY={bed.height / 2}
      rotation={bed.rotation}
      draggable
      onClick={handleClick}
      onTap={handleClick}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      {shapeNode}
      <Text
        text={bed.label}
        x={4}
        y={bed.height / 2 - 6}
        fontSize={11}
        fill="#fff"
        width={bed.width - 8}
        align="center"
        listening={false}
      />
    </Group>
  );
}
