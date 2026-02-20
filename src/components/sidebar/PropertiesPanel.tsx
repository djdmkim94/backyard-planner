import { useDesignStore } from '../../store/useDesignStore';
import { useCanvasStore } from '../../store/useCanvasStore';
import { useHistoryStore } from '../../store/useHistoryStore';
import { formatArea } from '../../utils/conversion';
import { MARKER_TEMPLATES } from '../../constants/markers';

export default function PropertiesPanel() {
  const beds = useDesignStore((s) => s.beds);
  const markers = useDesignStore((s) => s.markers);
  const structures = useDesignStore((s) => s.structures);
  const selectedId = useDesignStore((s) => s.selectedId);
  const updateBed = useDesignStore((s) => s.updateBed);
  const updateMarker = useDesignStore((s) => s.updateMarker);
  const updateStructure = useDesignStore((s) => s.updateStructure);
  const removeBed = useDesignStore((s) => s.removeBed);
  const removeMarker = useDesignStore((s) => s.removeMarker);
  const removeStructure = useDesignStore((s) => s.removeStructure);
  const pushSnapshot = useHistoryStore((s) => s.pushSnapshot);
  const unitSystem = useCanvasStore((s) => s.unitSystem);

  const selectedBed = beds.find((b) => b.id === selectedId);
  const selectedMarker = markers.find((m) => m.id === selectedId);
  const selectedStructure = structures.find((st) => st.id === selectedId);

  if (!selectedBed && !selectedMarker && !selectedStructure) {
    return (
      <div>
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
          Properties
        </h3>
        <p className="text-xs text-gray-400">Select an item to edit</p>
      </div>
    );
  }

  if (selectedBed) {
    const b = selectedBed;

    return (
      <div>
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
          Bed Properties
        </h3>
        <div className="space-y-2 text-sm">
          <label className="block">
            <span className="text-xs text-gray-500">Label</span>
            <input
              className="w-full mt-0.5 px-2 py-1 border rounded text-sm"
              value={b.label}
              onChange={(e) => updateBed(b.id, { label: e.target.value })}
            />
          </label>
          <div className="block">
            <span className="text-xs text-gray-500">Rotation</span>
            <div className="flex gap-1 mt-0.5 mb-1">
              <button
                className="flex-1 px-2 py-1 border rounded text-sm hover:bg-gray-100"
                title="Rotate 90° counter-clockwise"
                onClick={() => {
                  pushSnapshot();
                  updateBed(b.id, { rotation: (b.rotation - 90 + 360) % 360 });
                }}
              >↺ 90°</button>
              <button
                className="flex-1 px-2 py-1 border rounded text-sm hover:bg-gray-100"
                title="Rotate 90° clockwise"
                onClick={() => {
                  pushSnapshot();
                  updateBed(b.id, { rotation: (b.rotation + 90) % 360 });
                }}
              >↻ 90°</button>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="range"
                className="flex-1"
                min={0}
                max={359}
                value={((Math.round(b.rotation) % 360) + 360) % 360}
                onChange={(e) => {
                  updateBed(b.id, { rotation: +e.target.value });
                }}
                onMouseDown={() => pushSnapshot()}
              />
              <input
                type="number"
                className="w-14 px-2 py-1 border rounded text-sm"
                value={Math.round(b.rotation)}
                onChange={(e) => {
                  pushSnapshot();
                  updateBed(b.id, { rotation: +e.target.value });
                }}
                step={15}
              />
            </div>
          </div>
          <label className="block">
            <span className="text-xs text-gray-500">Color</span>
            <input
              type="color"
              className="w-full mt-0.5 h-8 cursor-pointer"
              value={b.color}
              onChange={(e) => updateBed(b.id, { color: e.target.value })}
            />
          </label>
          <div className="text-xs text-gray-500">
            Area: {formatArea(b.width, b.height, unitSystem)}
          </div>
          <button
            className="w-full px-2 py-1 bg-red-50 text-red-600 rounded text-xs hover:bg-red-100"
            onClick={() => {
              pushSnapshot();
              removeBed(b.id);
            }}
          >
            Delete Bed
          </button>
        </div>
      </div>
    );
  }

  if (selectedMarker) {
    const m = selectedMarker;
    const template = MARKER_TEMPLATES.find((t) => t.type === m.type);
    return (
      <div>
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
          Marker Properties
        </h3>
        <div className="space-y-2 text-sm">
          <div className="text-xs text-gray-500">
            Type: {template?.emoji} {template?.label}
          </div>
          <label className="block">
            <span className="text-xs text-gray-500">Label</span>
            <input
              className="w-full mt-0.5 px-2 py-1 border rounded text-sm"
              value={m.label}
              onChange={(e) => updateMarker(m.id, { label: e.target.value })}
            />
          </label>
          {m.type === 'tree' && (
            <label className="block">
              <span className="text-xs text-gray-500">Canopy Radius (ft)</span>
              <input
                type="number"
                className="w-full mt-0.5 px-2 py-1 border rounded text-sm"
                value={+(m.radius / 24).toFixed(1)}
                onChange={(e) => {
                  pushSnapshot();
                  updateMarker(m.id, { radius: +e.target.value * 24 });
                }}
                min={1}
                step={1}
              />
            </label>
          )}
          <button
            className="w-full px-2 py-1 bg-red-50 text-red-600 rounded text-xs hover:bg-red-100"
            onClick={() => {
              pushSnapshot();
              removeMarker(m.id);
            }}
          >
            Delete Marker
          </button>
        </div>
      </div>
    );
  }

  if (selectedStructure) {
    const st = selectedStructure;
    return (
      <div>
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
          Structure Properties
        </h3>
        <div className="space-y-2 text-sm">
          <label className="block">
            <span className="text-xs text-gray-500">Label</span>
            <input
              className="w-full mt-0.5 px-2 py-1 border rounded text-sm"
              value={st.label}
              onChange={(e) => updateStructure(st.id, { label: e.target.value })}
            />
          </label>
          <label className="block">
            <span className="text-xs text-gray-500">Rotation (°)</span>
            <input
              type="number"
              className="w-full mt-0.5 px-2 py-1 border rounded text-sm"
              value={Math.round(st.rotation ?? 0)}
              step={15}
              onChange={(e) => updateStructure(st.id, { rotation: +e.target.value })}
            />
          </label>
          <label className="block">
            <span className="text-xs text-gray-500">Color</span>
            <input
              type="color"
              className="w-full mt-0.5 h-8 cursor-pointer"
              value={st.color ?? '#a8a29e'}
              onChange={(e) => updateStructure(st.id, { color: e.target.value })}
            />
          </label>
          <p className="text-xs text-gray-400">
            Drag to reposition · Delete key to remove
          </p>
          <button
            className="w-full px-2 py-1 bg-red-50 text-red-600 rounded text-xs hover:bg-red-100"
            onClick={() => {
              pushSnapshot();
              removeStructure(st.id);
            }}
          >
            Delete Structure
          </button>
        </div>
      </div>
    );
  }

  return null;
}
