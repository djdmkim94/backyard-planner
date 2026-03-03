import { useEffect, useRef } from 'react';
import { useCanvasStore } from '../../store/useCanvasStore';
import { useDesignStore } from '../../store/useDesignStore';
import { SUN_CLASSIFICATION_OPTIONS } from '../../constants/sun';
import {
  effectiveSunWindows,
  pointInPolygon,
  unionSunWindows,
  getIntensityNote,
  hasPeakSun,
  getPlantSuggestions,
  calculateSunHours,
  classifyFromWindows,
} from '../../utils/sun';

export default function SunQueryTooltip() {
  const sunQueryPoint = useCanvasStore((s) => s.sunQueryPoint);
  const setSunQueryPoint = useCanvasStore((s) => s.setSunQueryPoint);
  const sunZones = useDesignStore((s) => s.sunZones);
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!sunQueryPoint) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSunQueryPoint(null);
    };
    const handleClick = (e: MouseEvent) => {
      if (tooltipRef.current && !tooltipRef.current.contains(e.target as Node)) {
        setSunQueryPoint(null);
      }
    };
    window.addEventListener('keydown', handleKey);
    window.addEventListener('mousedown', handleClick);
    return () => {
      window.removeEventListener('keydown', handleKey);
      window.removeEventListener('mousedown', handleClick);
    };
  }, [sunQueryPoint, setSunQueryPoint]);

  if (!sunQueryPoint) return null;

  const { canvasX, canvasY, screenX, screenY } = sunQueryPoint;

  const overlapping = sunZones.filter((z) => pointInPolygon(canvasX, canvasY, z.points));
  const windowSets = overlapping.map((z) => effectiveSunWindows(z));
  const combined = unionSunWindows(windowSets);

  const hours = calculateSunHours(combined);
  const cls = classifyFromWindows(combined);
  const intensityNote = getIntensityNote(combined);
  const plants = getPlantSuggestions(cls, hasPeakSun(combined));
  const clsConfig = SUN_CLASSIFICATION_OPTIONS.find((o) => o.cls === cls) ?? SUN_CLASSIFICATION_OPTIONS[3];

  const TOOLTIP_W = 224;
  const left = Math.min(screenX + 16, window.innerWidth - TOOLTIP_W - 8);
  const top = Math.max(8, Math.min(screenY - 8, window.innerHeight - 240));

  return (
    <div
      ref={tooltipRef}
      className="fixed z-50 bg-[#1c1c1e] border border-white/15 rounded-lg shadow-2xl p-3 text-xs"
      style={{ left, top, width: TOOLTIP_W }}
    >
      {overlapping.length === 0 ? (
        <div className="text-white/50">No sun zones at this point.</div>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span
              className="w-3 h-3 rounded-sm shrink-0"
              style={{ backgroundColor: clsConfig.color }}
            />
            <span className="font-semibold text-white">
              {hours === 0 ? 'Full Shade' : `${hours}h direct sun`}
            </span>
            <span className="text-white/40 ml-auto">{clsConfig.label}</span>
          </div>

          <div className="text-white/50 leading-relaxed">{intensityNote}</div>

          <div className="space-y-0.5">
            {combined.map((w) => (
              <div key={w.id} className="flex items-center gap-1.5">
                <span
                  className={`w-1.5 h-1.5 rounded-full shrink-0 ${w.active ? 'bg-amber-400' : 'bg-white/15'}`}
                />
                <span className={w.active ? 'text-white/80' : 'text-white/25'}>{w.label}</span>
                <span className="text-white/30 ml-auto">
                  {w.active ? `${w.endHour - w.startHour}h` : '—'}
                </span>
              </div>
            ))}
          </div>

          {overlapping.length > 1 && (
            <div className="text-white/30 border-t border-white/10 pt-1">
              {overlapping.length} zones overlap here
            </div>
          )}

          <div className="border-t border-white/10 pt-1.5">
            <div className="text-white/35 mb-1">Grows well here:</div>
            <div className="text-white/60 leading-relaxed">{plants.slice(0, 5).join(', ')}</div>
          </div>
        </div>
      )}
    </div>
  );
}
