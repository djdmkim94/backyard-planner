import { useCanvasStore } from '../../store/useCanvasStore';
import { useHistoryStore } from '../../store/useHistoryStore';
import { useDesignStore } from '../../store/useDesignStore';
import { exportToPng } from '../../utils/export';
import Konva from 'konva';

interface Props {
  stageRef: React.RefObject<Konva.Stage | null>;
}

export default function Toolbar({ stageRef }: Props) {
  const activeTool = useCanvasStore((s) => s.activeTool);
  const setActiveTool = useCanvasStore((s) => s.setActiveTool);
  const zoom = useCanvasStore((s) => s.zoom);
  const setZoom = useCanvasStore((s) => s.setZoom);
  const toggleGrid = useCanvasStore((s) => s.toggleGrid);
  const showGrid = useCanvasStore((s) => s.showGrid);
  const toggleSnap = useCanvasStore((s) => s.toggleSnap);
  const snapToGrid = useCanvasStore((s) => s.snapToGrid);
  const toggleMeasurements = useCanvasStore((s) => s.toggleMeasurements);
  const showMeasurements = useCanvasStore((s) => s.showMeasurements);
  const undo = useHistoryStore((s) => s.undo);
  const redo = useHistoryStore((s) => s.redo);
  const designName = useDesignStore((s) => s.designName);
  const setDesignName = useDesignStore((s) => s.setDesignName);
  const boundary = useDesignStore((s) => s.boundary);
  const clearBoundary = useDesignStore((s) => s.clearBoundary);
  const pushSnapshot = useHistoryStore((s) => s.pushSnapshot);

  return (
    <div className="h-12 bg-gray-800 text-white flex items-center px-4 gap-2 shrink-0">
      <input
        className="bg-transparent text-white font-semibold text-sm border-b border-transparent hover:border-gray-500 focus:border-blue-400 focus:outline-none px-1 w-40"
        value={designName}
        onChange={(e) => setDesignName(e.target.value)}
      />

      <div className="w-px h-6 bg-gray-600 mx-2" />

      <button
        className={`px-2 py-1 rounded text-xs ${activeTool === 'select' ? 'bg-blue-600' : 'hover:bg-gray-700'}`}
        onClick={() => setActiveTool('select')}
        title="Select (V)"
      >
        Select
      </button>
      <button
        className={`px-2 py-1 rounded text-xs ${activeTool === 'boundary' ? 'bg-blue-600' : 'hover:bg-gray-700'}`}
        onClick={() => setActiveTool('boundary')}
        title="Draw Boundary"
      >
        Boundary
      </button>
      {boundary.length > 0 && (
        <button
          className="px-2 py-1 rounded text-xs text-red-300 hover:bg-red-900"
          onClick={() => { pushSnapshot(); clearBoundary(); }}
          title="Clear Boundary"
        >
          ✕ Clear Boundary
        </button>
      )}
      <button
        className={`px-2 py-1 rounded text-xs ${activeTool === 'structure' ? 'bg-blue-600' : 'hover:bg-gray-700'}`}
        onClick={() => setActiveTool('structure')}
        title="Draw Fixed Structure"
      >
        Shapes
</button>
      <button
        className={`px-2 py-1 rounded text-xs ${activeTool === 'pan' ? 'bg-blue-600' : 'hover:bg-gray-700'}`}
        onClick={() => setActiveTool('pan')}
        title="Pan (H)"
      >
        Pan
      </button>
      <button
        className={`px-2 py-1 rounded text-xs ${activeTool === 'sun_zone' ? 'bg-blue-600' : 'hover:bg-gray-700'}`}
        onClick={() => setActiveTool('sun_zone')}
        title="Draw Sun Zone"
      >
        Sun Zone
      </button>

      <div className="w-px h-6 bg-gray-600 mx-2" />

      <button className="px-2 py-1 rounded text-xs hover:bg-gray-700" onClick={undo} title="Undo (Ctrl+Z)">
        Undo
      </button>
      <button className="px-2 py-1 rounded text-xs hover:bg-gray-700" onClick={redo} title="Redo (Ctrl+Y)">
        Redo
      </button>

      <div className="w-px h-6 bg-gray-600 mx-2" />

      <button
        className={`px-2 py-1 rounded text-xs ${showGrid ? 'bg-gray-600' : 'hover:bg-gray-700'}`}
        onClick={toggleGrid}
      >
        Grid
      </button>
      <button
        className={`px-2 py-1 rounded text-xs ${snapToGrid ? 'bg-gray-600' : 'hover:bg-gray-700'}`}
        onClick={toggleSnap}
      >
        Snap
      </button>
      <button
        className={`px-2 py-1 rounded text-xs ${showMeasurements ? 'bg-gray-600' : 'hover:bg-gray-700'}`}
        onClick={toggleMeasurements}
      >
        Measures
      </button>

      <div className="flex-1" />

      <div className="flex items-center gap-1 text-xs">
        <button className="px-1 hover:bg-gray-700 rounded" onClick={() => setZoom(zoom / 1.2)}>
          -
        </button>
        <span className="w-12 text-center">{Math.round(zoom * 100)}%</span>
        <button className="px-1 hover:bg-gray-700 rounded" onClick={() => setZoom(zoom * 1.2)}>
          +
        </button>
      </div>

      <button
        className="px-2 py-1 rounded text-xs bg-green-600 hover:bg-green-700"
        onClick={() => stageRef.current && exportToPng(stageRef.current)}
      >
        Export PNG
      </button>
    </div>
  );
}
