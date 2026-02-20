import { Line, Text, Group } from 'react-konva';
import { useCanvasStore } from '../../store/useCanvasStore';
import {
  DEFAULT_PIXELS_PER_FOOT,
  GRID_LINE_COLOR,
  GRID_LABEL_COLOR,
  GRID_MAJOR_INTERVAL,
} from '../../constants/canvas';
import { METERS_PER_FOOT } from '../../constants/canvas';

interface Props {
  width: number;
  height: number;
}

export default function GridLayer({ width, height }: Props) {
  const showGrid = useCanvasStore((s) => s.showGrid);
  const unitSystem = useCanvasStore((s) => s.unitSystem);

  if (!showGrid) return null;

  const ppf = DEFAULT_PIXELS_PER_FOOT;
  const lines: React.ReactNode[] = [];
  const labels: React.ReactNode[] = [];
  const cols = Math.ceil(width / ppf) + 1;
  const rows = Math.ceil(height / ppf) + 1;

  for (let i = 0; i <= cols; i++) {
    const x = i * ppf;
    const isMajor = i % GRID_MAJOR_INTERVAL === 0;
    lines.push(
      <Line
        key={`v${i}`}
        points={[x, 0, x, rows * ppf]}
        stroke={GRID_LINE_COLOR}
        strokeWidth={isMajor ? 1 : 0.5}
        listening={false}
      />
    );
    if (isMajor && i > 0) {
      const val = unitSystem === 'feet' ? i : (i * METERS_PER_FOOT).toFixed(1);
      const unit = unitSystem === 'feet' ? 'ft' : 'm';
      labels.push(
        <Text
          key={`lv${i}`}
          x={x + 2}
          y={2}
          text={`${val} ${unit}`}
          fontSize={10}
          fill={GRID_LABEL_COLOR}
          listening={false}
        />
      );
    }
  }

  for (let j = 0; j <= rows; j++) {
    const y = j * ppf;
    const isMajor = j % GRID_MAJOR_INTERVAL === 0;
    lines.push(
      <Line
        key={`h${j}`}
        points={[0, y, cols * ppf, y]}
        stroke={GRID_LINE_COLOR}
        strokeWidth={isMajor ? 1 : 0.5}
        listening={false}
      />
    );
    if (isMajor && j > 0) {
      const val = unitSystem === 'feet' ? j : (j * METERS_PER_FOOT).toFixed(1);
      const unit = unitSystem === 'feet' ? 'ft' : 'm';
      labels.push(
        <Text
          key={`lh${j}`}
          x={2}
          y={y + 2}
          text={`${val} ${unit}`}
          fontSize={10}
          fill={GRID_LABEL_COLOR}
          listening={false}
        />
      );
    }
  }

  return (
    <Group listening={false}>
      {lines}
      {labels}
    </Group>
  );
}
