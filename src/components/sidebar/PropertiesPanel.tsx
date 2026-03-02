import { useState } from 'react';
import { useDesignStore } from '../../store/useDesignStore';
import { useCanvasStore } from '../../store/useCanvasStore';
import { useHistoryStore } from '../../store/useHistoryStore';
import { formatArea } from '../../utils/conversion';
import { getFixedFeatureConfig } from '../../constants/fixedFeatures';
import { MARKER_TEMPLATES } from '../../constants/markers';
import { DEFAULT_PIXELS_PER_FOOT } from '../../constants/canvas';
import type { SunExposure, BoundarySegmentType } from '../../types/garden';
import type { UnitSystem } from '../../types/canvas';

function formatSegLen(px: number, unit: UnitSystem): string {
  if (unit === 'meters') {
    const m = (px / DEFAULT_PIXELS_PER_FOOT) * 0.3048;
    return `${m.toFixed(2)}m`;
  }
  const totalFeet = px / DEFAULT_PIXELS_PER_FOOT;
  const feet = Math.floor(totalFeet);
  const rawInches = Math.round((totalFeet - feet) * 12);
  const inches = rawInches === 12 ? 0 : rawInches;
  const adjFeet = rawInches === 12 ? feet + 1 : feet;
  if (adjFeet === 0) return `${inches}"`;
  if (inches === 0) return `${adjFeet}'`;
  return `${adjFeet}' ${inches}"`;
}

const SUN_REQUIREMENT_OPTIONS: { value: SunExposure | ''; label: string }[] = [
  { value: '', label: '— None —' },
  { value: 'full_sun', label: 'Full Sun (6+ hrs)' },
  { value: 'partial_shade', label: 'Part Shade (3–6 hrs)' },
  { value: 'full_shade', label: 'Full Shade (<3 hrs)' },
];

const inputCls = 'w-full mt-0.5 px-2 py-1 bg-[#1c1c1e] border border-white/10 rounded text-xs text-white';
const labelCls = 'text-xs text-white/40 block mb-0.5';

export default function PropertiesPanel() {
  const beds = useDesignStore((s) => s.beds);
  const structures = useDesignStore((s) => s.structures);
  const fixedFeatures = useDesignStore((s) => s.fixedFeatures);
  const selectedId = useDesignStore((s) => s.selectedId);
  const boundary = useDesignStore((s) => s.boundary);
  const updateBed = useDesignStore((s) => s.updateBed);
  const updateStructure = useDesignStore((s) => s.updateStructure);
  const updateFixedFeature = useDesignStore((s) => s.updateFixedFeature);
  const updateBoundarySegment = useDesignStore((s) => s.updateBoundarySegment);
  const removeBed = useDesignStore((s) => s.removeBed);
  const removeStructure = useDesignStore((s) => s.removeStructure);
  const removeFixedFeature = useDesignStore((s) => s.removeFixedFeature);
  const pushSnapshot = useHistoryStore((s) => s.pushSnapshot);
  const unitSystem = useCanvasStore((s) => s.unitSystem);
  const selectedBoundarySegment = useCanvasStore((s) => s.selectedBoundarySegment);
  const setSelectedBoundarySegment = useCanvasStore((s) => s.setSelectedBoundarySegment);

  const markers = useDesignStore((s) => s.markers);
  const updateMarker = useDesignStore((s) => s.updateMarker);
  const removeMarker = useDesignStore((s) => s.removeMarker);
  const pathways = useDesignStore((s) => s.pathways);
  const updatePathway = useDesignStore((s) => s.updatePathway);
  const removePathway = useDesignStore((s) => s.removePathway);

  const selectedBed = beds.find((b) => b.id === selectedId);
  const selectedStructure = structures.find((st) => st.id === selectedId);
  const selectedMarker = markers.find((m) => m.id === selectedId);

  const [expandedFfId, setExpandedFfId] = useState<string | null>(null);
  const [expandedStId, setExpandedStId] = useState<string | null>(null);
  const [expandedPwId, setExpandedPwId] = useState<string | null>(null);

  return (
    <div className="space-y-4">

      {/* ── Boundary Segment editor ── */}
      {selectedBoundarySegment !== null && boundary.length > 0 && (() => {
        const idx = selectedBoundarySegment;
        const nextIdx = (idx + 1) % boundary.length;
        const p = boundary[idx];
        const next = boundary[nextIdx];
        const dx = next.x - p.x;
        const dy = next.y - p.y;
        const distPx = Math.sqrt(dx * dx + dy * dy);
        const segType = p.segmentType;

        return (
          <div>
            <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wide mb-2">Boundary Segment</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-white/50">
                <span>Segment {idx + 1} of {boundary.length}</span>
                <span className="text-white/30">{formatSegLen(distPx, unitSystem)}</span>
              </div>
              <label className="block">
                <span className={labelCls}>Type</span>
                <select
                  className="w-full mt-0.5 px-2 py-1 bg-[#1c1c1e] border border-white/10 rounded text-xs text-white"
                  value={segType ?? 'generic'}
                  onChange={(e) => {
                    pushSnapshot();
                    const val = e.target.value as BoundarySegmentType | 'generic';
                    updateBoundarySegment(idx, val === 'generic' ? undefined : val);
                  }}
                >
                  <option value="generic">Generic</option>
                  <option value="house_wall">House Wall</option>
                  <option value="fence">Fence</option>
                </select>
              </label>
              {segType && (
                <button
                  className="w-full px-2 py-1 bg-white/5 text-white/40 rounded text-xs hover:bg-white/10 transition-colors"
                  onClick={() => { pushSnapshot(); updateBoundarySegment(idx, undefined); }}
                >
                  Clear type
                </button>
              )}
              <button
                className="w-full px-2 py-1 bg-white/5 text-white/30 rounded text-xs hover:bg-white/10 transition-colors"
                onClick={() => setSelectedBoundarySegment(null)}
              >
                Deselect segment
              </button>
            </div>
          </div>
        );
      })()}

      {/* ── Selected item properties ── */}
      {selectedBed && (() => {
        const b = selectedBed;
        return (
          <div>
            <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wide mb-2">Bed</h3>
            <div className="space-y-2">
              <label className="block">
                <span className={labelCls}>Label</span>
                <input className={inputCls} value={b.label} onChange={(e) => updateBed(b.id, { label: e.target.value })} />
              </label>
              <div>
                <span className={labelCls}>Rotation</span>
                <div className="flex gap-1 mb-1">
                  <button className="flex-1 px-2 py-1 bg-[#2c2c2e] border border-white/10 rounded text-xs text-white/70 hover:bg-[#3a3a3c] transition-colors"
                    onClick={() => { pushSnapshot(); updateBed(b.id, { rotation: (b.rotation - 90 + 360) % 360 }); }}>↺ 90°</button>
                  <button className="flex-1 px-2 py-1 bg-[#2c2c2e] border border-white/10 rounded text-xs text-white/70 hover:bg-[#3a3a3c] transition-colors"
                    onClick={() => { pushSnapshot(); updateBed(b.id, { rotation: (b.rotation + 90) % 360 }); }}>↻ 90°</button>
                </div>
                <div className="flex items-center gap-2">
                  <input type="range" className="flex-1" min={0} max={359}
                    value={((Math.round(b.rotation) % 360) + 360) % 360}
                    onChange={(e) => updateBed(b.id, { rotation: +e.target.value })}
                    onMouseDown={() => pushSnapshot()} />
                  <input type="number" className="w-14 px-2 py-1 bg-[#1c1c1e] border border-white/10 rounded text-xs text-white"
                    value={Math.round(b.rotation)} step={15}
                    onChange={(e) => { pushSnapshot(); updateBed(b.id, { rotation: +e.target.value }); }} />
                </div>
              </div>
              <label className="block">
                <span className={labelCls}>Color</span>
                <input type="color" className="w-full mt-0.5 h-8 cursor-pointer rounded" value={b.color}
                  onChange={(e) => updateBed(b.id, { color: e.target.value })} />
              </label>
              <div className="text-xs text-white/35">Area: {formatArea(b.width, b.height, unitSystem)}</div>
              <label className="block">
                <span className={labelCls}>Required sun</span>
                <select
                  className="w-full mt-0.5 px-2 py-1 bg-[#1c1c1e] border border-white/10 rounded text-xs text-white"
                  value={b.sunRequirement ?? ''}
                  onChange={(e) => updateBed(b.id, { sunRequirement: (e.target.value as SunExposure) || undefined })}
                >
                  {SUN_REQUIREMENT_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </label>
              <button className="w-full px-2 py-1 bg-red-500/15 text-red-400 rounded text-xs hover:bg-red-500/25 transition-colors"
                onClick={() => { pushSnapshot(); removeBed(b.id); }}>Delete Bed</button>
            </div>
          </div>
        );
      })()}

      {selectedStructure && (() => {
        const st = selectedStructure;
        return (
          <div>
            <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wide mb-2">Structure</h3>
            <div className="space-y-2">
              <label className="block">
                <span className={labelCls}>Label</span>
                <input className={inputCls} value={st.label} onChange={(e) => updateStructure(st.id, { label: e.target.value })} />
              </label>
              <label className="block">
                <span className={labelCls}>Rotation (°)</span>
                <input type="number" className={inputCls} value={Math.round(st.rotation ?? 0)} step={15}
                  onChange={(e) => updateStructure(st.id, { rotation: +e.target.value })} />
              </label>
              <label className="block">
                <span className={labelCls}>Color</span>
                <input type="color" className="w-full mt-0.5 h-8 cursor-pointer rounded" value={st.color ?? '#a8a29e'}
                  onChange={(e) => updateStructure(st.id, { color: e.target.value })} />
              </label>
              <p className="text-xs text-white/25">Drag to reposition · Delete key to remove</p>
              <button className="w-full px-2 py-1 bg-red-500/15 text-red-400 rounded text-xs hover:bg-red-500/25 transition-colors"
                onClick={() => { pushSnapshot(); removeStructure(st.id); }}>Delete Structure</button>
            </div>
          </div>
        );
      })()}

      {selectedMarker && (() => {
        const m = selectedMarker;
        const template = MARKER_TEMPLATES.find((t) => t.type === m.type);
        const radiusFt = Math.round((m.radius / DEFAULT_PIXELS_PER_FOOT) * 10) / 10;
        return (
          <div>
            <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wide mb-2">Marker</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs text-white/50 mb-1">
                <span>{template?.emoji}</span>
                <span>{template?.label}</span>
              </div>
              <label className="block">
                <span className={labelCls}>Label</span>
                <input className={inputCls} value={m.label} onChange={(e) => updateMarker(m.id, { label: e.target.value })} />
              </label>
              <label className="block">
                <span className={labelCls}>Radius (ft)</span>
                <input
                  type="number"
                  className={inputCls}
                  value={radiusFt}
                  min={0.5}
                  step={0.5}
                  onChange={(e) => { pushSnapshot(); updateMarker(m.id, { radius: +e.target.value * DEFAULT_PIXELS_PER_FOOT }); }}
                />
              </label>
              <button className="w-full px-2 py-1 bg-red-500/15 text-red-400 rounded text-xs hover:bg-red-500/25 transition-colors"
                onClick={() => { pushSnapshot(); removeMarker(m.id); }}>Delete Marker</button>
            </div>
          </div>
        );
      })()}

      {!selectedBed && !selectedStructure && !selectedMarker && selectedBoundarySegment === null && (
        <p className="text-xs text-white/25">Select a bed, marker, or structure to edit</p>
      )}

      {/* ── Fixed Features list ── */}
      {fixedFeatures.length > 0 && (
        <>
          <hr className="border-white/10" />
          <div>
            <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wide mb-2">
              Fixed Features <span className="text-white/25 font-normal normal-case tracking-normal">({fixedFeatures.length})</span>
            </h3>
            <div className="space-y-1">
              {fixedFeatures.map((f) => {
                const cfg = getFixedFeatureConfig(f.type);
                const isExpanded = expandedFfId === f.id;
                return (
                  <div key={f.id} className="border border-white/10 rounded overflow-hidden">
                    <div
                      className="flex items-center justify-between px-2 py-1.5 cursor-pointer hover:bg-[#2c2c2e] text-xs transition-colors"
                      onClick={() => setExpandedFfId(isExpanded ? null : f.id)}
                    >
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: cfg.color }} />
                        <span className="truncate text-white/70">{f.label || cfg.label}</span>
                      </div>
                      <button className="text-red-400/50 hover:text-red-400 px-1 transition-colors"
                        onClick={(e) => { e.stopPropagation(); pushSnapshot(); removeFixedFeature(f.id); if (expandedFfId === f.id) setExpandedFfId(null); }}>×</button>
                    </div>
                    {isExpanded && (
                      <div className="px-2 pb-2 space-y-1.5 border-t border-white/10 pt-2 bg-[#2c2c2e]">
                        <div>
                          <label className={labelCls}>Label</label>
                          <input type="text" value={f.label ?? ''} placeholder={cfg.label}
                            onChange={(e) => updateFixedFeature(f.id, { label: e.target.value || undefined })}
                            className="w-full text-xs bg-[#1c1c1e] border border-white/10 rounded px-2 py-1 text-white placeholder:text-white/20" />
                        </div>
                        {(f.type === 'house_wall' || f.type === 'fence') && (
                          <div>
                            <label className={labelCls}>Height (ft)</label>
                            <input type="number" min={1} max={30} value={f.height ?? cfg.defaultHeight ?? ''}
                              onChange={(e) => updateFixedFeature(f.id, { height: parseFloat(e.target.value) || undefined })}
                              className="w-full text-xs bg-[#1c1c1e] border border-white/10 rounded px-2 py-1 text-white" />
                          </div>
                        )}
                        {f.type === 'tree' && (
                          <div>
                            <label className={labelCls}>Canopy radius (ft)</label>
                            <input type="number" min={1} max={50} value={f.canopyRadius ?? cfg.defaultCanopyRadius ?? ''}
                              onChange={(e) => updateFixedFeature(f.id, { canopyRadius: parseFloat(e.target.value) || undefined })}
                              className="w-full text-xs bg-[#1c1c1e] border border-white/10 rounded px-2 py-1 text-white" />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* ── Structures list ── */}
      {structures.length > 0 && (
        <>
          <hr className="border-white/10" />
          <div>
            <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wide mb-2">
              Structures <span className="text-white/25 font-normal normal-case tracking-normal">({structures.length})</span>
            </h3>
            <div className="space-y-1">
              {structures.map((st) => {
                const isExpanded = expandedStId === st.id;
                return (
                  <div key={st.id} className="border border-white/10 rounded overflow-hidden">
                    <div
                      className="flex items-center justify-between px-2 py-1.5 cursor-pointer hover:bg-[#2c2c2e] text-xs transition-colors"
                      onClick={() => setExpandedStId(isExpanded ? null : st.id)}
                    >
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="w-2 h-2 rounded shrink-0" style={{ backgroundColor: st.color ?? '#a8a29e' }} />
                        <span className="truncate text-white/70">{st.label}</span>
                      </div>
                      <button className="text-red-400/50 hover:text-red-400 px-1 transition-colors"
                        onClick={(e) => { e.stopPropagation(); pushSnapshot(); removeStructure(st.id); if (expandedStId === st.id) setExpandedStId(null); }}>×</button>
                    </div>
                    {isExpanded && (
                      <div className="px-2 pb-2 space-y-1.5 border-t border-white/10 pt-2 bg-[#2c2c2e]">
                        <div>
                          <label className={labelCls}>Label</label>
                          <input className="w-full text-xs bg-[#1c1c1e] border border-white/10 rounded px-2 py-1 text-white"
                            value={st.label} onChange={(e) => updateStructure(st.id, { label: e.target.value })} />
                        </div>
                        <div>
                          <label className={labelCls}>Color</label>
                          <input type="color" className="w-full h-7 cursor-pointer rounded"
                            value={st.color ?? '#a8a29e'} onChange={(e) => updateStructure(st.id, { color: e.target.value })} />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* ── Pathways list ── */}
      {pathways.length > 0 && (
        <>
          <hr className="border-white/10" />
          <div>
            <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wide mb-2">
              Pathways <span className="text-white/25 font-normal normal-case tracking-normal">({pathways.length})</span>
            </h3>
            <div className="space-y-1">
              {pathways.map((pw) => {
                const isExpanded = expandedPwId === pw.id;
                return (
                  <div key={pw.id} className="border border-white/10 rounded overflow-hidden">
                    <div
                      className="flex items-center justify-between px-2 py-1.5 cursor-pointer hover:bg-[#2c2c2e] text-xs transition-colors"
                      onClick={() => setExpandedPwId(isExpanded ? null : pw.id)}
                    >
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: pw.color }} />
                        <span className="truncate text-white/70">{pw.label}</span>
                        <span className="text-white/30 shrink-0">{pw.widthFt}ft</span>
                      </div>
                      <button className="text-red-400/50 hover:text-red-400 px-1 transition-colors"
                        onClick={(e) => { e.stopPropagation(); pushSnapshot(); removePathway(pw.id); if (expandedPwId === pw.id) setExpandedPwId(null); }}>×</button>
                    </div>
                    {isExpanded && (
                      <div className="px-2 pb-2 space-y-1.5 border-t border-white/10 pt-2 bg-[#2c2c2e]">
                        <div>
                          <label className={labelCls}>Label</label>
                          <input className="w-full text-xs bg-[#1c1c1e] border border-white/10 rounded px-2 py-1 text-white"
                            value={pw.label} onChange={(e) => updatePathway(pw.id, { label: e.target.value })} />
                        </div>
                        <div>
                          <label className={labelCls}>Width (ft)</label>
                          <input type="number" min={0.5} max={20} step={0.5}
                            className="w-full text-xs bg-[#1c1c1e] border border-white/10 rounded px-2 py-1 text-white"
                            value={pw.widthFt}
                            onChange={(e) => { pushSnapshot(); updatePathway(pw.id, { widthFt: +e.target.value }); }} />
                        </div>
                        <div>
                          <label className={labelCls}>Color</label>
                          <input type="color" className="w-full h-7 cursor-pointer rounded"
                            value={pw.color} onChange={(e) => updatePathway(pw.id, { color: e.target.value })} />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

    </div>
  );
}
