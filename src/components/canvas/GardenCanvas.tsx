import { useRef, useCallback, useEffect, useState } from 'react';
import { Stage, Layer } from 'react-konva';
import Konva from 'konva';
import { useCanvasStore } from '../../store/useCanvasStore';
import { useDesignStore } from '../../store/useDesignStore';
import { useHistoryStore } from '../../store/useHistoryStore';
import { ZOOM_STEP } from '../../constants/canvas';
import GridLayer from './GridLayer';
import BoundaryLayer from './BoundaryLayer';
import SunOverlayLayer from './SunOverlayLayer';
import BedLayer from './BedLayer';
import MarkerLayer from './MarkerLayer';
import StructureLayer from './StructureLayer';
import StructurePreviewLayer from './StructurePreviewLayer';
import MeasurementLayer from './MeasurementLayer';
import PathwayGuides from './PathwayGuides';
import SelectionTransformer from './SelectionTransformer';

interface Props {
  stageRef: React.RefObject<Konva.Stage | null>;
}

function snapToAngle(
  from: { x: number; y: number },
  to: { x: number; y: number }
): { x: number; y: number } {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const angle = Math.atan2(dy, dx);
  const snapped = Math.round(angle / (Math.PI / 4)) * (Math.PI / 4);
  const dist = Math.sqrt(dx * dx + dy * dy);
  return {
    x: from.x + Math.cos(snapped) * dist,
    y: from.y + Math.sin(snapped) * dist,
  };
}

export default function GardenCanvas({ stageRef }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 800, height: 600 });
  const [boundaryPreview, setBoundaryPreview] = useState<{ x: number; y: number } | null>(null);
  const [structureInProgress, setStructureInProgress] = useState<Array<{ x: number; y: number }>>([]);
  const [structurePreview, setStructurePreview] = useState<{ x: number; y: number } | null>(null);
  // Ref mirrors structureInProgress for safe access in event handlers (avoids stale closures + React strict-mode double-invoke)
  const structurePointsRef = useRef<Array<{ x: number; y: number }>>([]);
  const [spaceDown, setSpaceDown] = useState(false);
  const spaceRef = useRef(false);

  const zoom = useCanvasStore((s) => s.zoom);
  const panX = useCanvasStore((s) => s.panX);
  const panY = useCanvasStore((s) => s.panY);
  const setZoom = useCanvasStore((s) => s.setZoom);
  const setPan = useCanvasStore((s) => s.setPan);
  const activeTool = useCanvasStore((s) => s.activeTool);
  const setActiveTool = useCanvasStore((s) => s.setActiveTool);
  const isPanning = useCanvasStore((s) => s.isPanning);
  const setIsPanning = useCanvasStore((s) => s.setIsPanning);
  const selectItem = useDesignStore((s) => s.selectItem);
  const boundary = useDesignStore((s) => s.boundary);
  const setBoundary = useDesignStore((s) => s.setBoundary);
  const addStructure = useDesignStore((s) => s.addStructure);
  const pushSnapshot = useHistoryStore((s) => s.pushSnapshot);

  // Resize observer
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const ro = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      setSize({ width, height });
    });
    ro.observe(container);
    return () => ro.disconnect();
  }, []);

  // Space key — universal pan modifier
  useEffect(() => {
    const onDown = (e: KeyboardEvent) => {
      if (e.code !== 'Space') return;
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;
      e.preventDefault();
      spaceRef.current = true;
      setSpaceDown(true);
    };
    const onUp = (e: KeyboardEvent) => {
      if (e.code !== 'Space') return;
      spaceRef.current = false;
      setSpaceDown(false);
    };
    window.addEventListener('keydown', onDown);
    window.addEventListener('keyup', onUp);
    return () => {
      window.removeEventListener('keydown', onDown);
      window.removeEventListener('keyup', onUp);
    };
  }, []);

  // Clear in-progress drawing when tool changes away
  useEffect(() => {
    if (activeTool !== 'boundary') setBoundaryPreview(null);
    if (activeTool !== 'structure') {
      structurePointsRef.current = [];
      setStructureInProgress([]);
      setStructurePreview(null);
    }
  }, [activeTool]);

  // Scroll: pan by default, Ctrl+scroll = zoom (trackpad-friendly)
  const handleWheel = useCallback(
    (e: Konva.KonvaEventObject<WheelEvent>) => {
      e.evt.preventDefault();

      if (e.evt.ctrlKey || e.evt.metaKey) {
        // Pinch-to-zoom or Ctrl+scroll → zoom
        const stage = stageRef.current;
        if (!stage) return;
        const pointer = stage.getPointerPosition();
        if (!pointer) return;
        const oldZoom = zoom;
        const direction = e.evt.deltaY < 0 ? 1 : -1;
        const newZoom = direction > 0 ? oldZoom * ZOOM_STEP : oldZoom / ZOOM_STEP;
        const mousePointTo = {
          x: (pointer.x - panX) / oldZoom,
          y: (pointer.y - panY) / oldZoom,
        };
        setZoom(newZoom);
        const clampedZoom = useCanvasStore.getState().zoom;
        setPan(
          pointer.x - mousePointTo.x * clampedZoom,
          pointer.y - mousePointTo.y * clampedZoom
        );
      } else {
        // Regular scroll (two-finger swipe or mouse wheel) → pan
        setPan(panX - e.evt.deltaX, panY - e.evt.deltaY);
      }
    },
    [zoom, panX, panY, setZoom, setPan, stageRef]
  );

  const handleMouseDown = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      // Middle mouse, Pan tool, or Space+click → pan
      if (e.evt.button === 1 || activeTool === 'pan' || spaceRef.current) {
        setIsPanning(true);
        return;
      }

      // Boundary drawing
      if (activeTool === 'boundary') {
        const stage = stageRef.current;
        if (!stage) return;
        const pos = stage.getRelativePointerPosition();
        if (!pos) return;
        const currentBoundary = useDesignStore.getState().boundary;
        const point =
          e.evt.shiftKey && currentBoundary.length > 0
            ? snapToAngle(currentBoundary[currentBoundary.length - 1], pos)
            : pos;
        setBoundary([...currentBoundary, point]);
        return;
      }

      // Structure drawing
      if (activeTool === 'structure') {
        const stage = stageRef.current;
        if (!stage) return;
        const pos = stage.getRelativePointerPosition();
        if (!pos) return;
        const prev = structurePointsRef.current;
        const point =
          e.evt.shiftKey && prev.length > 0
            ? snapToAngle(prev[prev.length - 1], pos)
            : pos;
        const next = [...prev, point];
        structurePointsRef.current = next;
        setStructureInProgress(next);
        return;
      }

      // Click on empty area to deselect
      const clickedOnEmpty = e.target === e.target.getStage();
      if (clickedOnEmpty) {
        selectItem(null);
      }
    },
    [activeTool, setIsPanning, selectItem, stageRef, boundary, setBoundary]
  );

  const handleMouseMove = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      if (isPanning) {
        setPan(panX + e.evt.movementX, panY + e.evt.movementY);
        return;
      }

      const stage = stageRef.current;
      if (!stage) return;
      const pos = stage.getRelativePointerPosition();
      if (!pos) return;

      if (activeTool === 'boundary' && boundary.length > 0) {
        const snapped =
          e.evt.shiftKey
            ? snapToAngle(boundary[boundary.length - 1], pos)
            : pos;
        setBoundaryPreview(snapped);
      }

      if (activeTool === 'structure') {
        const prev = structurePointsRef.current;
        const snapped =
          e.evt.shiftKey && prev.length > 0
            ? snapToAngle(prev[prev.length - 1], pos)
            : pos;
        setStructurePreview(snapped);
      }
    },
    [isPanning, panX, panY, setPan, activeTool, boundary, stageRef]
  );

  const handleDblClick = useCallback(
    (_e: Konva.KonvaEventObject<MouseEvent>) => {
      if (activeTool === 'boundary') {
        const currentBoundary = useDesignStore.getState().boundary;
        if (currentBoundary.length >= 3) {
          setBoundary(currentBoundary.slice(0, -1));
        }
        setBoundaryPreview(null);
        setActiveTool('select');
        return;
      }

      if (activeTool === 'structure') {
        // slice off the extra point from the 2nd mousedown of the double-click
        const pts = structurePointsRef.current.slice(0, -1);
        structurePointsRef.current = [];
        setStructureInProgress([]);
        setStructurePreview(null);
        if (pts.length >= 3) {
          pushSnapshot();
          addStructure(pts);
        }
        setActiveTool('select');
      }
    },
    [activeTool, setBoundary, setActiveTool, addStructure, pushSnapshot]
  );

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
  }, [setIsPanning]);

  const canvasW = 2400;
  const canvasH = 1800;

  const cursor = isPanning
    ? 'grabbing'
    : spaceDown || activeTool === 'pan'
    ? 'grab'
    : 'default';

  return (
    <div ref={containerRef} className="flex-1 bg-white overflow-hidden relative">
      {activeTool === 'boundary' && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-gray-800/80 text-white text-xs px-3 py-1.5 rounded-full pointer-events-none z-10 whitespace-nowrap">
          Click to place points · Hold <span className="bg-gray-600 px-1.5 py-0.5 rounded mx-0.5 font-mono">⇧ Shift</span> to snap to 45° · Double-click to finish
        </div>
      )}
      {activeTool === 'structure' && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-gray-800/80 text-white text-xs px-3 py-1.5 rounded-full pointer-events-none z-10 whitespace-nowrap">
          Click to place corners · Hold <span className="bg-gray-600 px-1.5 py-0.5 rounded mx-0.5 font-mono">⇧ Shift</span> to snap to 45° · Double-click to close shape
        </div>
      )}
      <Stage
        ref={stageRef}
        width={size.width}
        height={size.height}
        scaleX={zoom}
        scaleY={zoom}
        x={panX}
        y={panY}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onDblClick={handleDblClick}
        style={{ cursor }}
      >
        {/* Background layer — non-interactive */}
        <Layer listening={false}>
          <GridLayer width={canvasW} height={canvasH} />
          <BoundaryLayer previewPoint={boundaryPreview} />
          <SunOverlayLayer />
          <StructurePreviewLayer points={structureInProgress} previewPoint={structurePreview} />
        </Layer>

        {/* Interactive layer */}
        <Layer>
          <StructureLayer />
          <BedLayer />
          <MarkerLayer />
          <SelectionTransformer stageRef={stageRef} />
        </Layer>

        {/* Overlay layer — non-interactive */}
        <Layer listening={false}>
          <MeasurementLayer />
          <PathwayGuides />
        </Layer>
      </Stage>
    </div>
  );
}
