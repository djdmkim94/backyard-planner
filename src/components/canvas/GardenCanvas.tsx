import { useRef, useCallback, useEffect, useState } from 'react';
import { Stage, Layer, Rect } from 'react-konva';
import Konva from 'konva';
import { useCanvasStore } from '../../store/useCanvasStore';
import { useDesignStore } from '../../store/useDesignStore';
import { useHistoryStore } from '../../store/useHistoryStore';
import { ZOOM_STEP } from '../../constants/canvas';

function rectToPoints(a: { x: number; y: number }, b: { x: number; y: number }): number[] {
  return [a.x, a.y, b.x, a.y, b.x, b.y, a.x, b.y];
}
import GridLayer from './GridLayer';
import BoundaryLayer from './BoundaryLayer';
import SunOverlayLayer from './SunOverlayLayer';
import BedLayer from './BedLayer';
import MarkerLayer from './MarkerLayer';
import StructureLayer from './StructureLayer';
import StructurePreviewLayer from './StructurePreviewLayer';
import FixedFeatureLayer from './FixedFeatureLayer';
import MeasurementLayer from './MeasurementLayer';
import PathwayGuides from './PathwayGuides';
import PathwayLayer from './PathwayLayer';
import PlacementWarningsLayer from './PlacementWarningsLayer';
import SelectionTransformer from './SelectionTransformer';
import { getFixedFeatureConfig } from '../../constants/fixedFeatures';

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
  // Sun zone rectangle drag state
  const [sunZoneDragStart, setSunZoneDragStart] = useState<{ x: number; y: number } | null>(null);
  const [sunZoneDragCurrent, setSunZoneDragCurrent] = useState<{ x: number; y: number } | null>(null);
  const sunZoneDragStartRef = useRef<{ x: number; y: number } | null>(null);

  // Fixed feature polygon drawing state
  const [fixedFeatureInProgress, setFixedFeatureInProgress] = useState<Array<{ x: number; y: number }>>([]);
  const [fixedFeaturePreview, setFixedFeaturePreview] = useState<{ x: number; y: number } | null>(null);
  const fixedFeaturePointsRef = useRef<Array<{ x: number; y: number }>>([]);

  // Pathway drawing state
  const [pathwayInProgress, setPathwayInProgress] = useState<Array<{ x: number; y: number }>>([]);
  const [pathwayPreview, setPathwayPreview] = useState<{ x: number; y: number } | null>(null);
  const pathwayPointsRef = useRef<Array<{ x: number; y: number }>>([]);

  const zoom = useCanvasStore((s) => s.zoom);
  const panX = useCanvasStore((s) => s.panX);
  const panY = useCanvasStore((s) => s.panY);
  const setZoom = useCanvasStore((s) => s.setZoom);
  const setPan = useCanvasStore((s) => s.setPan);
  const activeTool = useCanvasStore((s) => s.activeTool);
  const setActiveTool = useCanvasStore((s) => s.setActiveTool);
  const isPanning = useCanvasStore((s) => s.isPanning);
  const setIsPanning = useCanvasStore((s) => s.setIsPanning);
  const setPendingZoneGeometry = useCanvasStore((s) => s.setPendingZoneGeometry);
  const selectItem = useDesignStore((s) => s.selectItem);
  const setSelectedBoundarySegment = useCanvasStore((s) => s.setSelectedBoundarySegment);
  const boundary = useDesignStore((s) => s.boundary);
  const setBoundary = useDesignStore((s) => s.setBoundary);
  const addStructure = useDesignStore((s) => s.addStructure);
  const addFixedFeature = useDesignStore((s) => s.addFixedFeature);
  const addPathway = useDesignStore((s) => s.addPathway);
  const pathwayWidthFt = useCanvasStore((s) => s.pathwayWidthFt);
  const pushSnapshot = useHistoryStore((s) => s.pushSnapshot);
  const activeFixedFeatureType = useCanvasStore((s) => s.activeFixedFeatureType);
  const concreteDrawMode = useCanvasStore((s) => s.concreteDrawMode);
  // Concrete pad rect drag state
  const [concreteDragStart, setConcreteDragStart] = useState<{ x: number; y: number } | null>(null);
  const [concreteDragCurrent, setConcreteDragCurrent] = useState<{ x: number; y: number } | null>(null);
  const concreteDragStartRef = useRef<{ x: number; y: number } | null>(null);

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
    if (activeTool !== 'sun_zone') {
      sunZoneDragStartRef.current = null;
      setSunZoneDragStart(null);
      setSunZoneDragCurrent(null);
    }
    if (activeTool !== 'fixed_feature') {
      fixedFeaturePointsRef.current = [];
      setFixedFeatureInProgress([]);
      setFixedFeaturePreview(null);
      concreteDragStartRef.current = null;
      setConcreteDragStart(null);
      setConcreteDragCurrent(null);
    }
    if (activeTool !== 'pathway') {
      pathwayPointsRef.current = [];
      setPathwayInProgress([]);
      setPathwayPreview(null);
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
        pushSnapshot();
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

      // Sun zone rectangle drag
      if (activeTool === 'sun_zone') {
        const stage = stageRef.current;
        if (!stage) return;
        const pos = stage.getRelativePointerPosition();
        if (!pos) return;
        sunZoneDragStartRef.current = pos;
        setSunZoneDragStart(pos);
        setSunZoneDragCurrent(pos);
        return;
      }

      // Fixed feature placement
      if (activeTool === 'fixed_feature' && activeFixedFeatureType) {
        const stage = stageRef.current;
        if (!stage) return;
        const pos = stage.getRelativePointerPosition();
        if (!pos) return;
        const cfg = getFixedFeatureConfig(activeFixedFeatureType);
        if (cfg.drawMode === 'point') {
          // Place immediately on click
          pushSnapshot();
          addFixedFeature({
            type: activeFixedFeatureType,
            points: [pos.x, pos.y],
            ...(cfg.defaultHeight != null ? { height: cfg.defaultHeight } : {}),
            ...(cfg.defaultCanopyRadius != null ? { canopyRadius: cfg.defaultCanopyRadius } : {}),
          });
          return;
        }
        // Concrete pad rect drag
        if (activeFixedFeatureType === 'concrete_pad' && concreteDrawMode === 'rect') {
          concreteDragStartRef.current = pos;
          setConcreteDragStart(pos);
          setConcreteDragCurrent(pos);
          return;
        }
        // Polygon mode: add point
        const prev = fixedFeaturePointsRef.current;
        const point = e.evt.shiftKey && prev.length > 0 ? snapToAngle(prev[prev.length - 1], pos) : pos;
        const next = [...prev, point];
        fixedFeaturePointsRef.current = next;
        setFixedFeatureInProgress(next);
        return;
      }

      // Pathway drawing
      if (activeTool === 'pathway') {
        const stage = stageRef.current;
        if (!stage) return;
        const pos = stage.getRelativePointerPosition();
        if (!pos) return;
        const prev = pathwayPointsRef.current;
        const point = e.evt.shiftKey && prev.length > 0 ? snapToAngle(prev[prev.length - 1], pos) : pos;
        const next = [...prev, point];
        pathwayPointsRef.current = next;
        setPathwayInProgress(next);
        return;
      }

      // Click on empty area to deselect
      const clickedOnEmpty = e.target === e.target.getStage();
      if (clickedOnEmpty) {
        selectItem(null);
        setSelectedBoundarySegment(null);
      }
    },
    [activeTool, activeFixedFeatureType, setIsPanning, selectItem, setSelectedBoundarySegment, stageRef, boundary, setBoundary, addFixedFeature, addPathway, pushSnapshot]
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

      if (activeTool === 'sun_zone' && sunZoneDragStartRef.current) {
        setSunZoneDragCurrent(pos);
      }

      if (activeTool === 'fixed_feature') {
        if (activeFixedFeatureType === 'concrete_pad' && concreteDrawMode === 'rect' && concreteDragStartRef.current) {
          setConcreteDragCurrent(pos);
        } else {
          const prev = fixedFeaturePointsRef.current;
          if (prev.length > 0) {
            const snapped = e.evt.shiftKey ? snapToAngle(prev[prev.length - 1], pos) : pos;
            setFixedFeaturePreview(snapped);
          }
        }
      }

      if (activeTool === 'pathway') {
        const prev = pathwayPointsRef.current;
        const snapped = e.evt.shiftKey && prev.length > 0 ? snapToAngle(prev[prev.length - 1], pos) : pos;
        setPathwayPreview(snapped);
      }
    },
    [isPanning, panX, panY, setPan, activeTool, activeFixedFeatureType, concreteDrawMode, boundary, stageRef]
  );

  const handleDblClick = useCallback(
    (_e: Konva.KonvaEventObject<MouseEvent>) => {
      if (activeTool === 'boundary') {
        const currentBoundary = useDesignStore.getState().boundary;
        if (currentBoundary.length >= 3) {
          pushSnapshot();
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

      if (activeTool === 'fixed_feature' && activeFixedFeatureType) {
        const cfg = getFixedFeatureConfig(activeFixedFeatureType);
        if (cfg.drawMode === 'polygon') {
          const pts = fixedFeaturePointsRef.current.slice(0, -1);
          fixedFeaturePointsRef.current = [];
          setFixedFeatureInProgress([]);
          setFixedFeaturePreview(null);
          const minPts = cfg.minPoints ?? 2;
          if (pts.length >= minPts) {
            pushSnapshot();
            addFixedFeature({
              type: activeFixedFeatureType,
              points: pts.flatMap((p) => [p.x, p.y]),
              ...(cfg.defaultHeight != null ? { height: cfg.defaultHeight } : {}),
            });
          }
        }
      }

      if (activeTool === 'pathway') {
        const pts = pathwayPointsRef.current.slice(0, -1);
        pathwayPointsRef.current = [];
        setPathwayInProgress([]);
        setPathwayPreview(null);
        if (pts.length >= 2) {
          pushSnapshot();
          const count = useDesignStore.getState().pathways.length + 1;
          addPathway({
            points: pts.flatMap((p) => [p.x, p.y]),
            widthFt: useCanvasStore.getState().pathwayWidthFt,
            label: `Pathway ${count}`,
            color: '#d4a574',
          });
        }
        setActiveTool('select');
      }
    },
    [activeTool, activeFixedFeatureType, setBoundary, setActiveTool, addStructure, addFixedFeature, addPathway, pushSnapshot]
  );

  const handleMouseUp = useCallback(
    (_e: Konva.KonvaEventObject<MouseEvent>) => {
      setIsPanning(false);

      if (activeTool === 'sun_zone' && sunZoneDragStartRef.current) {
        const stage = stageRef.current;
        if (stage) {
          const pos = stage.getRelativePointerPosition();
          if (pos) {
            const start = sunZoneDragStartRef.current;
            const dx = Math.abs(pos.x - start.x);
            const dy = Math.abs(pos.y - start.y);
            if (dx > 10 || dy > 10) {
              const points = rectToPoints(start, pos);
              setPendingZoneGeometry(points);
            }
          }
        }
        sunZoneDragStartRef.current = null;
        setSunZoneDragStart(null);
        setSunZoneDragCurrent(null);
      }

      if (activeTool === 'fixed_feature' && activeFixedFeatureType === 'concrete_pad' && concreteDrawMode === 'rect' && concreteDragStartRef.current) {
        const stage = stageRef.current;
        if (stage) {
          const pos = stage.getRelativePointerPosition();
          if (pos) {
            const start = concreteDragStartRef.current;
            const dx = Math.abs(pos.x - start.x);
            const dy = Math.abs(pos.y - start.y);
            if (dx > 10 || dy > 10) {
              pushSnapshot();
              addFixedFeature({
                type: 'concrete_pad',
                points: rectToPoints(start, pos),
              });
            }
          }
        }
        concreteDragStartRef.current = null;
        setConcreteDragStart(null);
        setConcreteDragCurrent(null);
      }
    },
    [setIsPanning, activeTool, activeFixedFeatureType, concreteDrawMode, stageRef, setPendingZoneGeometry, addFixedFeature, pushSnapshot]
  );

  const canvasW = 2400;
  const canvasH = 1800;

  const cursor = isPanning
    ? 'grabbing'
    : spaceDown || activeTool === 'pan'
    ? 'grab'
    : 'default';

  return (
    <div ref={containerRef} className="flex-1 overflow-hidden relative" style={{ backgroundColor: '#FEF9C3' }}>
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
      {activeTool === 'sun_zone' && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-gray-800/80 text-white text-xs px-3 py-1.5 rounded-full pointer-events-none z-10 whitespace-nowrap">
          Click and drag to draw a sun zone
        </div>
      )}
      {activeTool === 'fixed_feature' && activeFixedFeatureType && (() => {
        const cfg = getFixedFeatureConfig(activeFixedFeatureType);
        const hint = cfg.drawMode === 'point'
          ? `Click to place ${cfg.label}`
          : activeFixedFeatureType === 'concrete_pad' && concreteDrawMode === 'rect'
          ? 'Click and drag to draw a concrete pad'
          : `Click to place points · Hold ⇧ Shift to snap to 45° · Double-click to finish`;
        return (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-gray-800/80 text-white text-xs px-3 py-1.5 rounded-full pointer-events-none z-10 whitespace-nowrap">
            {hint}
          </div>
        );
      })()}
      {activeTool === 'pathway' && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-gray-800/80 text-white text-xs px-3 py-1.5 rounded-full pointer-events-none z-10 whitespace-nowrap">
          Click to place points · Hold <span className="bg-gray-600 px-1.5 py-0.5 rounded mx-0.5 font-mono">⇧ Shift</span> to snap to 45° · Double-click to finish
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
          <PathwayLayer
            inProgressPoints={pathwayInProgress}
            previewPoint={pathwayPreview}
            previewWidthFt={pathwayWidthFt}
          />
          <SunOverlayLayer dragStart={sunZoneDragStart} dragCurrent={sunZoneDragCurrent} />
          <StructurePreviewLayer points={structureInProgress} previewPoint={structurePreview} />
          <StructurePreviewLayer points={fixedFeatureInProgress} previewPoint={fixedFeaturePreview} />
          {concreteDragStart && concreteDragCurrent && (() => {
            const px = Math.min(concreteDragStart.x, concreteDragCurrent.x);
            const py = Math.min(concreteDragStart.y, concreteDragCurrent.y);
            const pw = Math.abs(concreteDragCurrent.x - concreteDragStart.x);
            const ph = Math.abs(concreteDragCurrent.y - concreteDragStart.y);
            return (
              <Rect x={px} y={py} width={pw} height={ph} fill="#94a3b8" opacity={0.3} stroke="#94a3b8" strokeWidth={1.5} dash={[5, 3]} />
            );
          })()}
        </Layer>

        {/* Interactive layer */}
        <Layer>
          <BoundaryLayer previewPoint={boundaryPreview} />
          <FixedFeatureLayer />
          <StructureLayer />
          <BedLayer />
          <MarkerLayer />
          <SelectionTransformer stageRef={stageRef} />
        </Layer>

        {/* Overlay layer — non-interactive */}
        <Layer listening={false}>
          <MeasurementLayer />
          <PathwayGuides />
          <PlacementWarningsLayer />
        </Layer>
      </Stage>
    </div>
  );
}
