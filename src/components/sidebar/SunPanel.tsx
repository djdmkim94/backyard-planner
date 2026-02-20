import { useDesignStore } from '../../store/useDesignStore';
import { useCanvasStore } from '../../store/useCanvasStore';
import { SUN_EXPOSURE_OPTIONS } from '../../constants/sun';

export default function SunPanel() {
  const sunZones = useDesignStore((s) => s.sunZones);
  const removeSunZone = useDesignStore((s) => s.removeSunZone);
  const showSunOverlay = useCanvasStore((s) => s.showSunOverlay);
  const toggleSunOverlay = useCanvasStore((s) => s.toggleSunOverlay);
  const activeTool = useCanvasStore((s) => s.activeTool);
  const setActiveTool = useCanvasStore((s) => s.setActiveTool);

  return (
    <div>
      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
        Sun Exposure
      </h3>
      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={showSunOverlay}
            onChange={toggleSunOverlay}
            className="rounded"
          />
          Show overlay
        </label>
        <button
          className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${activeTool === 'sun_zone' ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'}`}
          onClick={() => setActiveTool(activeTool === 'sun_zone' ? 'select' : 'sun_zone')}
        >
          Draw Sun Zone
        </button>
        <div className="text-xs text-gray-500 space-y-1">
          {SUN_EXPOSURE_OPTIONS.map((opt) => (
            <div key={opt.exposure} className="flex items-center gap-1">
              <span
                className="w-3 h-3 rounded-sm"
                style={{ backgroundColor: opt.color, opacity: opt.opacity * 3 }}
              />
              <span>{opt.label}</span>
            </div>
          ))}
        </div>
        {sunZones.length > 0 && (
          <div className="text-xs space-y-1 mt-2">
            <div className="font-medium text-gray-600">Zones ({sunZones.length})</div>
            {sunZones.map((z) => (
              <div key={z.id} className="flex items-center justify-between">
                <span>{z.exposure.replace('_', ' ')}</span>
                <button
                  className="text-red-400 hover:text-red-600"
                  onClick={() => removeSunZone(z.id)}
                >
                  x
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
