import { useState, useEffect } from 'react';
import { nanoid } from 'nanoid';
import { useDesignStore } from '../../store/useDesignStore';
import { useCanvasStore } from '../../store/useCanvasStore';
import type { Design } from '../../types/garden';

const STORAGE_KEY = 'garden-planner-designs';

function loadDesigns(): Design[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveDesigns(designs: Design[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(designs));
}

export default function DesignPanel() {
  const [designs, setDesigns] = useState<Design[]>([]);
  const beds = useDesignStore((s) => s.beds);
  const markers = useDesignStore((s) => s.markers);
  const sunZones = useDesignStore((s) => s.sunZones);
  const boundary = useDesignStore((s) => s.boundary);
  const structures = useDesignStore((s) => s.structures);
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

  const handleSave = () => {
    const design: Design = {
      id: nanoid(),
      name: designName,
      beds,
      markers,
      sunZones,
      boundary,
      structures,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    const updated = [...designs, design];
    saveDesigns(updated);
    setDesigns(updated);
  };

  const handleLoad = (design: Design) => {
    loadDesign(design);
  };

  const handleDelete = (id: string) => {
    const updated = designs.filter((d) => d.id !== id);
    saveDesigns(updated);
    setDesigns(updated);
  };

  return (
    <div>
      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
        Design
      </h3>
      <div className="space-y-2">
        <button
          className="w-full px-3 py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
          onClick={handleSave}
        >
          Save Design
        </button>
        <button
          className="w-full px-3 py-1.5 bg-gray-200 rounded text-sm hover:bg-gray-300"
          onClick={clearAll}
        >
          New Design
        </button>

        <div className="flex gap-2">
          <button
            className={`flex-1 px-2 py-1 rounded text-xs ${unitSystem === 'feet' ? 'bg-gray-700 text-white' : 'bg-gray-200'}`}
            onClick={() => unitSystem !== 'feet' && toggleUnitSystem()}
          >
            Feet
          </button>
          <button
            className={`flex-1 px-2 py-1 rounded text-xs ${unitSystem === 'meters' ? 'bg-gray-700 text-white' : 'bg-gray-200'}`}
            onClick={() => unitSystem !== 'meters' && toggleUnitSystem()}
          >
            Meters
          </button>
        </div>

        <label className="flex items-center gap-2 text-sm">
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
            <div className="text-xs font-medium text-gray-600 mb-1">Saved Designs</div>
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {designs.map((d) => (
                <div
                  key={d.id}
                  className="flex items-center justify-between text-xs bg-gray-50 rounded px-2 py-1"
                >
                  <button
                    className="text-left hover:text-blue-600 truncate flex-1"
                    onClick={() => handleLoad(d)}
                  >
                    {d.name}
                  </button>
                  <button
                    className="text-red-400 hover:text-red-600 ml-1"
                    onClick={() => handleDelete(d.id)}
                  >
                    x
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
