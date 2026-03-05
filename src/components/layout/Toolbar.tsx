import { useCanvasStore } from '../../store/useCanvasStore';
import { useHistoryStore } from '../../store/useHistoryStore';
import { useDesignStore } from '../../store/useDesignStore';
import { exportToPng } from '../../utils/export';
import Konva from 'konva';

interface Props {
  stageRef: React.RefObject<Konva.Stage | null>;
  onStartTour: () => void;
}

export default function Toolbar({ stageRef, onStartTour }: Props) {
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

  const toolBtn = (tool: typeof activeTool, label: string, title?: string) => (
    <button
      className={`px-2 py-1 rounded text-xs transition-colors ${
        activeTool === tool
          ? 'bg-amber-500/20 border border-amber-500/40 text-amber-300'
          : 'text-white/60 hover:bg-white/8 hover:text-white/90'
      }`}
      onClick={() => setActiveTool(tool)}
      title={title}
    >
      {label}
    </button>
  );

  return (
    <div data-tour="toolbar" className="h-12 bg-[#1c1c1e] border-b border-white/10 text-white flex items-center px-4 gap-2 shrink-0">
      <input
        className="bg-transparent text-white font-semibold text-sm border-b border-transparent hover:border-white/20 focus:border-amber-400/60 focus:outline-none px-1 w-40 transition-colors"
        value={designName}
        onChange={(e) => setDesignName(e.target.value)}
      />

      <div className="w-px h-5 bg-white/10 mx-1" />

      <span className="text-xs text-white/25 font-medium">Tools</span>
      {toolBtn('select', 'Select', 'Select (V)')}
      {toolBtn('pan', 'Pan', 'Pan (H)')}

      <div className="w-px h-5 bg-white/10 mx-1" />

      <span className="text-xs text-white/25 font-medium">Insert</span>
      {toolBtn('boundary', 'Boundary', 'Draw Boundary')}
      {boundary.length > 0 && (
        <button
          className="px-2 py-1 rounded text-xs text-red-400/80 hover:bg-red-500/15 transition-colors"
          onClick={() => { pushSnapshot(); clearBoundary(); }}
          title="Clear Boundary"
        >
          ✕ Boundary
        </button>
      )}
      {toolBtn('structure', 'Shapes', 'Draw Fixed Structure')}
      {toolBtn('sun_zone', 'Sun Zone', 'Draw Sun Zone')}

      <div className="w-px h-5 bg-white/10 mx-1" />

      <button className="px-2 py-1 rounded text-xs text-white/60 hover:bg-white/8 hover:text-white/90 transition-colors" onClick={undo} title="Undo (Ctrl+Z)">Undo</button>

      <button className="px-2 py-1 rounded text-xs text-white/60 hover:bg-white/8 hover:text-white/90 transition-colors" onClick={redo} title="Redo (Ctrl+Y)">Redo</button>

      <div className="w-px h-5 bg-white/10 mx-1" />

      <button
        className={`px-2 py-1 rounded text-xs transition-colors ${showGrid ? 'bg-white/10 text-white/90' : 'text-white/40 hover:bg-white/8 hover:text-white/70'}`}
        onClick={toggleGrid}
      >Grid</button>
      <button
        className={`px-2 py-1 rounded text-xs transition-colors ${snapToGrid ? 'bg-white/10 text-white/90' : 'text-white/40 hover:bg-white/8 hover:text-white/70'}`}
        onClick={toggleSnap}
      >Snap</button>
      <button
        className={`px-2 py-1 rounded text-xs transition-colors ${showMeasurements ? 'bg-white/10 text-white/90' : 'text-white/40 hover:bg-white/8 hover:text-white/70'}`}
        onClick={toggleMeasurements}
      >Measures</button>

      <div className="flex-1" />

      <div className="flex items-center gap-1 text-xs text-white/60">
        <button className="px-1.5 py-0.5 hover:bg-white/8 rounded transition-colors" onClick={() => setZoom(zoom / 1.2)}>−</button>
        <span className="w-12 text-center text-white/50">{Math.round(zoom * 100)}%</span>
        <button className="px-1.5 py-0.5 hover:bg-white/8 rounded transition-colors" onClick={() => setZoom(zoom * 1.2)}>+</button>
      </div>

      <button
        className="px-2 py-1 rounded text-xs text-white/40 hover:bg-white/8 hover:text-white/70 border border-white/10 transition-colors"
        onClick={onStartTour}
        title="Open guided tour"
      >
        ?
      </button>

      <button
        className="px-2 py-1 rounded text-xs bg-green-700 hover:bg-green-600 text-white transition-colors"
        onClick={() => stageRef.current && exportToPng(stageRef.current)}
      >
        Export PNG
      </button>
    </div>
  );
}
