import { useState, useMemo } from 'react';
import { useDesignStore } from '../../store/useDesignStore';
import { generateRecommendations } from '../../utils/recommendations';
import type { WindDirection } from '../../types/garden';
import type { Recommendation } from '../../utils/recommendations';

const COMPASS_GRID: (WindDirection | null)[][] = [
  ['NW', 'N', 'NE'],
  ['W', null, 'E'],
  ['SW', 'S', 'SE'],
];

const SEV_STYLES: Record<Recommendation['severity'], { border: string; icon: string }> = {
  warning: { border: 'border-l-amber-400', icon: '⚠' },
  tip:     { border: 'border-l-blue-400',  icon: '💡' },
  info:    { border: 'border-l-white/30',  icon: 'ℹ' },
};

export default function ClimatePanel() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const climateData    = useDesignStore((s) => s.climateData);
  const updateClimate  = useDesignStore((s) => s.updateClimateData);
  const beds           = useDesignStore((s) => s.beds);
  const sunZones       = useDesignStore((s) => s.sunZones);
  const boundary       = useDesignStore((s) => s.boundary);
  const fixedFeatures  = useDesignStore((s) => s.fixedFeatures);
  const pathways       = useDesignStore((s) => s.pathways);

  const recs = useMemo(
    () => generateRecommendations({ beds, sunZones, boundary, fixedFeatures, pathways }, climateData),
    [beds, sunZones, boundary, fixedFeatures, pathways, climateData],
  );

  const warningCount = recs.filter((r) => r.severity === 'warning').length;

  return (
    <div data-tour="climate-panel" className={`border-t border-white/10 bg-[#1c1c1e] flex flex-col transition-all duration-200 ${isExpanded ? 'h-52' : 'h-10'}`}>
      {/* Header */}
      <button
        className="flex items-center justify-between px-3 h-10 shrink-0 hover:bg-white/5 transition-colors text-left w-full"
        onClick={() => setIsExpanded((v) => !v)}
      >
        <span className="text-xs font-semibold text-white/70 flex items-center gap-2">
          🌱 Climate &amp; Recommendations
          {warningCount > 0 && (
            <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] px-1.5 py-0.5 rounded-full">
              {warningCount} warning{warningCount > 1 ? 's' : ''}
            </span>
          )}
          {recs.length > 0 && warningCount === 0 && (
            <span className="text-white/30 text-[10px]">{recs.length} tip{recs.length > 1 ? 's' : ''}</span>
          )}
        </span>
        <span className={`text-white/40 text-xs transition-transform ${isExpanded ? 'rotate-180' : ''}`}>▾</span>
      </button>

      {/* Expanded content */}
      {isExpanded && (
        <div className="flex flex-1 min-h-0 overflow-hidden">
          {/* Left: climate inputs */}
          <div className="flex gap-2 p-2 shrink-0 items-start">
            {/* Date */}
            <div className="bg-[#2c2c2e] border border-white/10 rounded-lg p-2 flex flex-col items-center gap-1 w-28">
              <span className="text-sm">📅</span>
              <input
                type="date"
                value={climateData.currentDate}
                onChange={(e) => updateClimate({ currentDate: e.target.value })}
                className="w-full bg-transparent text-white/70 text-[10px] border border-white/10 rounded px-1 py-0.5 focus:outline-none focus:border-white/30"
              />
            </div>

            {/* Hardiness Zone */}
            <div className="bg-[#2c2c2e] border border-white/10 rounded-lg p-2 flex flex-col items-center gap-1 w-20">
              <span className="text-sm">🌿</span>
              <input
                type="text"
                value={climateData.hardinessZone}
                onChange={(e) => updateClimate({ hardinessZone: e.target.value })}
                placeholder="7b"
                maxLength={4}
                className="w-full bg-transparent text-white/70 text-[10px] border border-white/10 rounded px-1 py-0.5 text-center placeholder:text-white/20 focus:outline-none focus:border-white/30"
              />
              <span className="text-white/25 text-[9px] leading-none">zone</span>
            </div>

            {/* Köppen */}
            <div className="bg-[#2c2c2e] border border-white/10 rounded-lg p-2 flex flex-col items-center gap-1 w-20">
              <span className="text-sm">🌍</span>
              <input
                type="text"
                value={climateData.koppenClimate}
                onChange={(e) => updateClimate({ koppenClimate: e.target.value })}
                placeholder="Cfa"
                maxLength={5}
                className="w-full bg-transparent text-white/70 text-[10px] border border-white/10 rounded px-1 py-0.5 text-center placeholder:text-white/20 focus:outline-none focus:border-white/30"
              />
              <span className="text-white/25 text-[9px] leading-none">köppen</span>
            </div>

            {/* Wind compass */}
            <div className="bg-[#2c2c2e] border border-white/10 rounded-lg p-2 flex flex-col items-center gap-1">
              <span className="text-sm">💨</span>
              <div className="grid grid-cols-3 gap-0.5">
                {COMPASS_GRID.flat().map((dir, i) =>
                  dir === null ? (
                    <div key={i} className="w-6 h-6" />
                  ) : (
                    <button
                      key={dir}
                      onClick={() => updateClimate({ windDirection: climateData.windDirection === dir ? null : dir })}
                      className={`w-6 h-6 text-[9px] font-bold rounded border transition-colors ${
                        climateData.windDirection === dir
                          ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                          : 'border-white/10 text-white/40 hover:bg-white/5'
                      }`}
                    >
                      {dir}
                    </button>
                  ),
                )}
              </div>
              <span className="text-white/25 text-[9px] leading-none">wind from</span>
            </div>
          </div>

          {/* Divider */}
          <div className="w-px bg-white/10 my-2 shrink-0" />

          {/* Right: recommendations */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
            {recs.length === 0 ? (
              <p className="text-white/30 text-xs italic px-1 pt-1">
                Fill in climate data above to see recommendations.
              </p>
            ) : (
              recs.map((rec) => {
                const { border, icon } = SEV_STYLES[rec.severity];
                const isOpen = expandedId === rec.id;
                return (
                  <button
                    key={rec.id}
                    onClick={() => setExpandedId(isOpen ? null : rec.id)}
                    className={`w-full text-left border-l-2 ${border} bg-white/5 hover:bg-white/8 rounded-r-md px-2 py-1 transition-colors`}
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] shrink-0">{icon}</span>
                      <span className="text-white/80 text-[11px] font-medium leading-tight">{rec.title}</span>
                    </div>
                    {isOpen && (
                      <p className="text-white/50 text-[10px] mt-1 leading-snug">{rec.detail}</p>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
