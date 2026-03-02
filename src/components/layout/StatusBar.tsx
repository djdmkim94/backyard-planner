import { useDesignStore } from '../../store/useDesignStore';
import { useCanvasStore } from '../../store/useCanvasStore';
import { pxToUnit } from '../../utils/conversion';

export default function StatusBar() {
  const beds = useDesignStore((s) => s.beds);
  const markers = useDesignStore((s) => s.markers);
  const unitSystem = useCanvasStore((s) => s.unitSystem);
  const zoom = useCanvasStore((s) => s.zoom);

  const totalArea = beds.reduce((sum, b) => {
    const w = pxToUnit(b.width, unitSystem);
    const h = pxToUnit(b.height, unitSystem);
    return sum + w * h;
  }, 0);

  const suffix = unitSystem === 'feet' ? 'sq ft' : 'sq m';

  return (
    <div className="h-7 bg-[#1c1c1e] border-t border-white/10 flex items-center px-4 text-xs text-white/50 gap-6 shrink-0">
      <span>Beds: {beds.length}</span>
      <span>Markers: {markers.length}</span>
      <span>
        Total Area: {totalArea.toFixed(1)} {suffix}
      </span>
      <span>Zoom: {Math.round(zoom * 100)}%</span>
    </div>
  );
}
