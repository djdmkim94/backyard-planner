import { useState, useEffect } from 'react';
import { useDesignStore } from '../../store/useDesignStore';
import { useCanvasStore } from '../../store/useCanvasStore';
import { useHistoryStore } from '../../store/useHistoryStore';
import { SUN_EXPOSURE_OPTIONS, SUN_WINDOW_LABELS, SUN_WINDOW_TIMES } from '../../constants/sun';
import { deriveExposure, defaultSummerConfig, smartWinterDefault, exposureLabel, computeSunConfig, geocodeAddress } from '../../utils/sun';
import type { SunWindowConfig } from '../../types/garden';

type WindowKey = keyof SunWindowConfig;
const WINDOW_KEYS: WindowKey[] = ['morning', 'peak', 'afternoon'];

function WindowCheckboxes({
  label,
  config,
  onChange,
}: {
  label: string;
  config: SunWindowConfig;
  onChange: (key: WindowKey, val: boolean) => void;
}) {
  return (
    <div className="space-y-1">
      <div className="text-xs font-medium text-white/40">{label}</div>
      {WINDOW_KEYS.map((key) => (
        <label key={key} className="flex items-center gap-2 text-xs cursor-pointer">
          <input
            type="checkbox"
            checked={config[key]}
            onChange={(e) => onChange(key, e.target.checked)}
            className="rounded"
          />
          <span className="font-medium text-white/80">{SUN_WINDOW_LABELS[key]}</span>
          <span className="text-white/35">{SUN_WINDOW_TIMES[key]}</span>
        </label>
      ))}
    </div>
  );
}

function WindowBadges({ config }: { config: SunWindowConfig }) {
  return (
    <span className="flex gap-1">
      {WINDOW_KEYS.map((key) => (
        <span
          key={key}
          className={`text-xs px-1 rounded ${config[key] ? 'bg-amber-500/20 text-amber-300' : 'bg-white/5 text-white/25 line-through'}`}
        >
          {SUN_WINDOW_LABELS[key]}
        </span>
      ))}
    </span>
  );
}

export default function SunPanel() {
  const sunZones = useDesignStore((s) => s.sunZones);
  const removeSunZone = useDesignStore((s) => s.removeSunZone);
  const updateSunZone = useDesignStore((s) => s.updateSunZone);
  const addSunZone = useDesignStore((s) => s.addSunZone);
  const boundary = useDesignStore((s) => s.boundary);
  const showSunOverlay = useCanvasStore((s) => s.showSunOverlay);
  const toggleSunOverlay = useCanvasStore((s) => s.toggleSunOverlay);
  const activeTool = useCanvasStore((s) => s.activeTool);
  const setActiveTool = useCanvasStore((s) => s.setActiveTool);
  const activeSeason = useCanvasStore((s) => s.activeSeason);
  const setActiveSeason = useCanvasStore((s) => s.setActiveSeason);
  const pendingZoneGeometry = useCanvasStore((s) => s.pendingZoneGeometry);
  const setPendingZoneGeometry = useCanvasStore((s) => s.setPendingZoneGeometry);
  const pushSnapshot = useHistoryStore((s) => s.pushSnapshot);

  const zoneCount = sunZones.length;

  const [pendingSummer, setPendingSummer] = useState<SunWindowConfig>(defaultSummerConfig());
  const [pendingWinter, setPendingWinter] = useState<SunWindowConfig>(smartWinterDefault(defaultSummerConfig()));
  const [pendingLabel, setPendingLabel] = useState('');
  const effectivePendingLabel = pendingLabel || `Zone ${zoneCount + 1}`;

  const [isOpen, setIsOpen] = useState(false);
  const [expandedZoneId, setExpandedZoneId] = useState<string | null>(null);

  useEffect(() => {
    setIsOpen(activeTool === 'sun_zone');
  }, [activeTool]);

  const [address, setAddress] = useState('');
  const [computing, setComputing] = useState(false);
  const [geocodeResult, setGeocodeResult] = useState<{ lat: number; lon: number; displayName: string } | null>(null);
  const [computedConfig, setComputedConfig] = useState<{ summer: SunWindowConfig; winter: SunWindowConfig } | null>(null);
  const [geocodeError, setGeocodeError] = useState(false);

  const hasBoundary = boundary.length >= 3;

  const handleCompute = async () => {
    if (!address.trim() || !hasBoundary) return;
    setComputing(true);
    setGeocodeError(false);
    setGeocodeResult(null);
    setComputedConfig(null);
    const result = await geocodeAddress(address.trim());
    if (result) {
      const config = computeSunConfig(result.lat, result.lon);
      setGeocodeResult(result);
      setComputedConfig(config);
    } else {
      setGeocodeError(true);
    }
    setComputing(false);
  };

  const handleApplyToGarden = () => {
    if (!computedConfig || !hasBoundary) return;
    const flatPoints = boundary.flatMap((p) => [p.x, p.y]);
    pushSnapshot();
    const existing = sunZones.find((z) => z.label === 'Garden');
    if (existing) removeSunZone(existing.id);
    const label = geocodeResult?.displayName ?? 'Garden';
    addSunZone(flatPoints, computedConfig.summer, computedConfig.winter, label);
  };

  const handleConfirmZone = () => {
    if (!pendingZoneGeometry) return;
    pushSnapshot();
    addSunZone(pendingZoneGeometry, pendingSummer, pendingWinter, effectivePendingLabel);
    setPendingZoneGeometry(null);
    setPendingLabel('');
    setPendingSummer(defaultSummerConfig());
    setPendingWinter(smartWinterDefault(defaultSummerConfig()));
    setActiveTool('select');
  };

  const handleCancelZone = () => {
    setPendingZoneGeometry(null);
    setPendingLabel('');
    setActiveTool('select');
  };

  const exposureColor = (config: SunWindowConfig) => {
    const exp = deriveExposure(config);
    return SUN_EXPOSURE_OPTIONS.find((o) => o.exposure === exp)?.color ?? '#ccc';
  };

  return (
    <div>
      <button
        className="flex items-center justify-between w-full text-left mb-2"
        onClick={() => setIsOpen((o) => !o)}
      >
        <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wide">Sun Exposure</h3>
        <span className="text-white/25 text-xs">{isOpen ? '▾' : '▸'}</span>
      </button>
      {isOpen && <div className="space-y-3">
        {/* Global controls */}
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-sm text-white/70 cursor-pointer">
            <input type="checkbox" checked={showSunOverlay} onChange={toggleSunOverlay} className="rounded" />
            Show overlay
          </label>
          <div className="flex rounded overflow-hidden border border-white/10 text-xs">
            <button
              className={`px-2 py-1 transition-colors ${activeSeason === 'summer' ? 'bg-amber-500 text-white' : 'text-white/50 hover:bg-white/5'}`}
              onClick={() => setActiveSeason('summer')}
            >Summer</button>
            <button
              className={`px-2 py-1 transition-colors ${activeSeason === 'winter' ? 'bg-blue-500 text-white' : 'text-white/50 hover:bg-white/5'}`}
              onClick={() => setActiveSeason('winter')}
            >Winter</button>
          </div>
        </div>

        {/* From Your Address */}
        <div className="border border-white/10 rounded p-2 space-y-2 bg-[#2c2c2e]">
          <div className="text-xs font-semibold text-white/40 uppercase tracking-wide">From Your Address</div>
          {!hasBoundary ? (
            <div className="text-xs text-amber-400/80 bg-amber-500/10 border border-amber-500/20 rounded px-2 py-1.5">
              ⚠ Draw your garden boundary first.
            </div>
          ) : (
            <>
              <div className="flex gap-1">
                <input
                  type="text"
                  value={address}
                  onChange={(e) => { setAddress(e.target.value); setGeocodeError(false); }}
                  placeholder="Austin, TX"
                  className="flex-1 text-xs bg-[#1c1c1e] border border-white/10 rounded px-2 py-1 text-white placeholder:text-white/25"
                  onKeyDown={(e) => e.key === 'Enter' && handleCompute()}
                />
                <button
                  className="px-2 py-1 bg-amber-500 text-white text-xs rounded hover:bg-amber-400 disabled:opacity-40 whitespace-nowrap transition-colors"
                  onClick={handleCompute}
                  disabled={computing || !address.trim()}
                >
                  {computing ? '…' : 'Compute ☀️'}
                </button>
              </div>
              {geocodeError && (
                <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded px-2 py-1">
                  Address not found. Try a city like "Austin, TX".
                </div>
              )}
              {computedConfig && geocodeResult && (
                <div className="space-y-2">
                  <div className="text-xs text-white/60 font-medium">
                    📍 {geocodeResult.displayName} · {geocodeResult.lat.toFixed(2)}°{geocodeResult.lat >= 0 ? 'N' : 'S'}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="w-4">☀️</span>
                      <span className="font-medium text-white/50 w-12">Summer</span>
                      <WindowBadges config={computedConfig.summer} />
                      <span className="text-white/35 ml-auto">{exposureLabel(deriveExposure(computedConfig.summer))}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="w-4">❄️</span>
                      <span className="font-medium text-white/50 w-12">Winter</span>
                      <WindowBadges config={computedConfig.winter} />
                      <span className="text-white/35 ml-auto">{exposureLabel(deriveExposure(computedConfig.winter))}</span>
                    </div>
                  </div>
                  <button
                    className="w-full px-2 py-1.5 bg-green-700 text-white text-xs rounded hover:bg-green-600 font-medium transition-colors"
                    onClick={handleApplyToGarden}
                  >
                    Apply to Entire Garden
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Custom Zones */}
        <div className="space-y-2">
          <div className="text-xs font-semibold text-white/40 uppercase tracking-wide">Custom Zones</div>
          {!pendingZoneGeometry && (
            <button
              className={`w-full text-left px-3 py-1.5 rounded text-xs border transition-colors ${
                activeTool === 'sun_zone'
                  ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                  : 'border-white/10 hover:bg-[#3a3a3c] text-white/60'
              }`}
              onClick={() => setActiveTool(activeTool === 'sun_zone' ? 'select' : 'sun_zone')}
            >
              {activeTool === 'sun_zone' ? 'Drawing… (drag on canvas)' : '+ Draw a shade zone'}
            </button>
          )}
          {pendingZoneGeometry && (
            <div className="border border-amber-500/30 rounded p-2 bg-amber-500/10 space-y-2">
              <div className="text-xs font-semibold text-amber-300">New Zone</div>
              <input
                type="text"
                value={pendingLabel}
                onChange={(e) => setPendingLabel(e.target.value)}
                placeholder={effectivePendingLabel}
                className="w-full text-xs bg-[#1c1c1e] border border-white/10 rounded px-2 py-1 text-white placeholder:text-white/25"
              />
              <WindowCheckboxes label="Summer" config={pendingSummer} onChange={(key, val) => setPendingSummer((p) => ({ ...p, [key]: val }))} />
              <WindowCheckboxes label="Winter" config={pendingWinter} onChange={(key, val) => setPendingWinter((p) => ({ ...p, [key]: val }))} />
              <div className="flex gap-1 pt-1">
                <button className="flex-1 px-2 py-1 bg-amber-500 text-white text-xs rounded hover:bg-amber-400 transition-colors" onClick={handleConfirmZone}>Confirm</button>
                <button className="flex-1 px-2 py-1 bg-[#3a3a3c] text-white/70 text-xs rounded hover:bg-[#48484a] transition-colors" onClick={handleCancelZone}>Cancel</button>
              </div>
            </div>
          )}
        </div>

        {/* Zone list */}
        {sunZones.length > 0 && (
          <div className="space-y-1">
            <div className="text-xs font-medium text-white/40">Zones ({sunZones.length})</div>
            {sunZones.map((zone) => {
              const exposure = deriveExposure(zone[activeSeason]);
              const color = exposureColor(zone[activeSeason]);
              const isExpanded = expandedZoneId === zone.id;
              return (
                <div key={zone.id} className="border border-white/10 rounded overflow-hidden">
                  <div
                    className="flex items-center justify-between px-2 py-1.5 cursor-pointer hover:bg-[#3a3a3c] text-xs transition-colors"
                    onClick={() => setExpandedZoneId(isExpanded ? null : zone.id)}
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="w-3 h-3 rounded-sm shrink-0" style={{ backgroundColor: color }} />
                      <span className="truncate font-medium text-white/80">{zone.label}</span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <span className="text-white/35 text-xs">{exposureLabel(exposure)}</span>
                      <button
                        className="text-red-400/60 hover:text-red-400 ml-1 px-1 transition-colors"
                        onClick={(e) => { e.stopPropagation(); pushSnapshot(); removeSunZone(zone.id); }}
                      >×</button>
                    </div>
                  </div>
                  {isExpanded && (
                    <div className="px-2 pb-2 space-y-2 border-t border-white/10 pt-2 bg-[#2c2c2e]">
                      <input
                        type="text"
                        value={zone.label}
                        onChange={(e) => updateSunZone(zone.id, { label: e.target.value })}
                        className="w-full text-xs bg-[#1c1c1e] border border-white/10 rounded px-2 py-1 text-white"
                        placeholder="Zone label"
                      />
                      <WindowCheckboxes label="Summer" config={zone.summer} onChange={(key, val) => updateSunZone(zone.id, { summer: { ...zone.summer, [key]: val } })} />
                      <WindowCheckboxes label="Winter" config={zone.winter} onChange={(key, val) => updateSunZone(zone.id, { winter: { ...zone.winter, [key]: val } })} />
                      <button
                        className="text-xs text-amber-400/70 hover:text-amber-400 transition-colors"
                        onClick={() => updateSunZone(zone.id, { winter: smartWinterDefault(zone.summer) })}
                      >Apply smart winter defaults</button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Legend */}
        <div className="text-xs text-white/35 space-y-1">
          {SUN_EXPOSURE_OPTIONS.map((opt) => (
            <div key={opt.exposure} className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: opt.color, opacity: opt.opacity * 3 }} />
              <span>{opt.label}</span>
            </div>
          ))}
        </div>
      </div>}
    </div>
  );
}
