import { useState, useEffect } from 'react';
import { nanoid } from 'nanoid';
import { useDesignStore } from '../../store/useDesignStore';
import { useCanvasStore } from '../../store/useCanvasStore';
import type { Design, SunZone } from '../../types/garden';
import { legacyExposureToWindows, smartWinterDefault } from '../../utils/sun';

const STORAGE_KEY = 'garden-planner-designs';

function migrateZone(z: any): SunZone {
  if ('summer' in z && 'winter' in z) return z as SunZone;
  const windows = legacyExposureToWindows(z.exposure);
  return {
    id: z.id,
    points: z.points,
    label: z.label ?? 'Zone',
    summer: windows,
    winter: smartWinterDefault(windows),
  };
}

function loadDesigns(): Design[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const designs = JSON.parse(raw) as any[];
    return designs.map((d) => ({
      ...d,
      sunZones: (d.sunZones ?? []).map(migrateZone),
    }));
  } catch {
    return [];
  }
}

function saveDesigns(designs: Design[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(designs));
}

export default function DesignPanel() {
  const [designs, setDesigns] = useState<Design[]>([]);
  const [activeDesignId, setActiveDesignId] = useState<string | null>(null);
  const [confirmNew, setConfirmNew] = useState(false);
  const beds = useDesignStore((s) => s.beds);
  const markers = useDesignStore((s) => s.markers);
  const sunZones = useDesignStore((s) => s.sunZones);
  const boundary = useDesignStore((s) => s.boundary);
  const structures = useDesignStore((s) => s.structures);
  const fixedFeatures = useDesignStore((s) => s.fixedFeatures);
  const pathways = useDesignStore((s) => s.pathways);
  const designName = useDesignStore((s) => s.designName);
  const loadDesign = useDesignStore((s) => s.loadDesign);
  const clearAll = useDesignStore((s) => s.clearAll);
  const toggleUnitSystem = useCanvasStore((s) => s.toggleUnitSystem);
  const unitSystem = useCanvasStore((s) => s.unitSystem);
  const togglePathwayGuides = useCanvasStore((s) => s.togglePathwayGuides);
  const showPathwayGuides = useCanvasStore((s) => s.showPathwayGuides);

  useEffect(() => {
    setDesigns(loadDesigns());
  }, []);

  const buildDesignPayload = (id: string, createdAt: number): Design => ({
    id,
    name: designName,
    beds,
    markers,
    sunZones,
    boundary,
    structures,
    fixedFeatures,
    pathways,
    createdAt,
    updatedAt: Date.now(),
  });

  const handleSave = () => {
    if (activeDesignId) {
      // Overwrite existing
      const existing = designs.find((d) => d.id === activeDesignId);
      const updated = designs.map((d) =>
        d.id === activeDesignId ? buildDesignPayload(d.id, existing?.createdAt ?? Date.now()) : d
      );
      saveDesigns(updated);
      setDesigns(updated);
    } else {
      // Save as new
      const design = buildDesignPayload(nanoid(), Date.now());
      const updated = [...designs, design];
      saveDesigns(updated);
      setDesigns(updated);
      setActiveDesignId(design.id);
    }
  };

  const handleLoad = (design: Design) => {
    loadDesign(design);
    setActiveDesignId(design.id);
  };

  const handleDelete = (id: string) => {
    const updated = designs.filter((d) => d.id !== id);
    saveDesigns(updated);
    setDesigns(updated);
    if (activeDesignId === id) setActiveDesignId(null);
  };

  const handleNew = () => {
    clearAll();
    setActiveDesignId(null);
    setConfirmNew(false);
  };

  return (
    <div>
      <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wide mb-2">
        Design
      </h3>
      <div className="space-y-2">
        <button
          className="w-full px-3 py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-500 transition-colors"
          onClick={handleSave}
        >
          {activeDesignId ? 'Save Changes' : 'Save Design'}
        </button>
        {activeDesignId && (
          <button
            className="w-full px-3 py-1.5 bg-[#2c2c2e] text-white/50 rounded text-xs hover:bg-[#3a3a3c] transition-colors"
            onClick={() => { const d = buildDesignPayload(nanoid(), Date.now()); const updated = [...designs, d]; saveDesigns(updated); setDesigns(updated); setActiveDesignId(d.id); }}
          >
            Save as New Copy
          </button>
        )}
        {confirmNew ? (
          <div className="border border-red-500/30 rounded p-2 bg-red-500/10 space-y-1.5">
            <div className="text-xs text-red-300">Clear canvas? Unsaved changes will be lost.</div>
            <div className="flex gap-1">
              <button className="flex-1 px-2 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-500 transition-colors" onClick={handleNew}>Clear</button>
              <button className="flex-1 px-2 py-1 bg-[#3a3a3c] text-white/70 text-xs rounded hover:bg-[#48484a] transition-colors" onClick={() => setConfirmNew(false)}>Cancel</button>
            </div>
          </div>
        ) : (
          <button
            className="w-full px-3 py-1.5 bg-[#3a3a3c] text-white/80 rounded text-sm hover:bg-[#48484a] transition-colors"
            onClick={() => setConfirmNew(true)}
          >
            New Design
          </button>
        )}

        <div className="flex gap-2">
          <button
            className={`flex-1 px-2 py-1 rounded text-xs transition-colors ${unitSystem === 'feet' ? 'bg-[#3a3a3c] text-white' : 'text-white/50 hover:bg-[#2c2c2e]'}`}
            onClick={() => unitSystem !== 'feet' && toggleUnitSystem()}
          >
            Feet
          </button>
          <button
            className={`flex-1 px-2 py-1 rounded text-xs transition-colors ${unitSystem === 'meters' ? 'bg-[#3a3a3c] text-white' : 'text-white/50 hover:bg-[#2c2c2e]'}`}
            onClick={() => unitSystem !== 'meters' && toggleUnitSystem()}
          >
            Meters
          </button>
        </div>

        <label className="flex items-center gap-2 text-sm text-white/70 cursor-pointer">
          <input
            type="checkbox"
            checked={showPathwayGuides}
            onChange={togglePathwayGuides}
            className="rounded"
          />
          Pathway warnings
        </label>

        {designs.length > 0 && (
          <div className="mt-3">
            <div className="text-xs font-medium text-white/40 mb-1">Saved Designs</div>
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {designs.map((d) => (
                <div
                  key={d.id}
                  className="flex items-center justify-between text-xs bg-[#2c2c2e] rounded px-2 py-1"
                >
                  <button
                    className="text-left text-white/70 hover:text-white truncate flex-1 transition-colors"
                    onClick={() => handleLoad(d)}
                  >
                    {d.name}
                  </button>
                  <button
                    className="text-red-400/70 hover:text-red-400 ml-1 transition-colors"
                    onClick={() => handleDelete(d.id)}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
