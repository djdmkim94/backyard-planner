import { useCanvasStore } from '../../store/useCanvasStore';
import { FIXED_FEATURE_CONFIGS, getFixedFeatureConfig } from '../../constants/fixedFeatures';
import type { FixedFeatureType } from '../../types/garden';

export default function FixedFeaturePanel() {
  const activeTool = useCanvasStore((s) => s.activeTool);
  const setActiveTool = useCanvasStore((s) => s.setActiveTool);
  const activeFixedFeatureType = useCanvasStore((s) => s.activeFixedFeatureType);
  const setActiveFixedFeatureType = useCanvasStore((s) => s.setActiveFixedFeatureType);
  const concreteDrawMode = useCanvasStore((s) => s.concreteDrawMode);
  const setConcreteDrawMode = useCanvasStore((s) => s.setConcreteDrawMode);

  const handleSelectType = (type: FixedFeatureType) => {
    if (activeTool === 'fixed_feature' && activeFixedFeatureType === type) {
      setActiveFixedFeatureType(null);
      setActiveTool('select');
    } else {
      setActiveFixedFeatureType(type);
      setActiveTool('fixed_feature');
    }
  };

  const isConcreteActive = activeTool === 'fixed_feature' && activeFixedFeatureType === 'concrete_pad';
  const selectedCfg = activeFixedFeatureType ? getFixedFeatureConfig(activeFixedFeatureType) : null;

  const drawingHint = selectedCfg
    ? selectedCfg.drawMode === 'point'
      ? `Click to place a ${selectedCfg.label.toLowerCase()}`
      : activeFixedFeatureType === 'concrete_pad' && concreteDrawMode === 'rect'
        ? 'Click and drag to draw a concrete pad'
        : 'Click to place points · Double-click to finish'
    : null;

  return (
    <div>
      <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wide mb-2">
        Fixed Features
      </h3>
      <div className="space-y-2">
        <div className="grid grid-cols-2 gap-1">
          {FIXED_FEATURE_CONFIGS.map((cfg) => {
            const isActive = activeTool === 'fixed_feature' && activeFixedFeatureType === cfg.type;
            return (
              <button
                key={cfg.type}
                className={`flex items-center gap-1.5 px-2 py-1.5 rounded text-xs border transition-colors text-left ${
                  isActive
                    ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                    : 'border-white/10 hover:bg-[#3a3a3c] text-white/70'
                }`}
                onClick={() => handleSelectType(cfg.type)}
              >
                <span>{cfg.icon}</span>
                <span className="font-medium leading-tight">{cfg.label}</span>
              </button>
            );
          })}
        </div>

        {/* Concrete pad draw mode toggle */}
        {isConcreteActive && (
          <div className="flex rounded overflow-hidden border border-white/10 text-xs">
            <button
              className={`flex-1 px-2 py-1.5 transition-colors ${
                concreteDrawMode === 'rect'
                  ? 'bg-amber-500/20 text-amber-300'
                  : 'text-white/40 hover:bg-white/5'
              }`}
              onClick={() => setConcreteDrawMode('rect')}
            >
              ▬ Rect
            </button>
            <button
              className={`flex-1 px-2 py-1.5 border-l border-white/10 transition-colors ${
                concreteDrawMode === 'polygon'
                  ? 'bg-amber-500/20 text-amber-300'
                  : 'text-white/40 hover:bg-white/5'
              }`}
              onClick={() => setConcreteDrawMode('polygon')}
            >
              ✏️ Custom
            </button>
          </div>
        )}

        {drawingHint && (
          <div className="text-xs text-amber-400/80 bg-amber-500/10 border border-amber-500/20 rounded px-2 py-1.5">
            {drawingHint}
          </div>
        )}
      </div>
    </div>
  );
}
