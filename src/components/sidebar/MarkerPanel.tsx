import { useDesignStore } from '../../store/useDesignStore';
import { useHistoryStore } from '../../store/useHistoryStore';
import { MARKER_TEMPLATES } from '../../constants/markers';

export default function MarkerPanel() {
  const addMarker = useDesignStore((s) => s.addMarker);
  const pushSnapshot = useHistoryStore((s) => s.pushSnapshot);

  const handleAdd = (type: (typeof MARKER_TEMPLATES)[number]['type']) => {
    pushSnapshot();
    addMarker(type);
  };

  return (
    <div>
      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
        Markers
      </h3>
      <div className="space-y-1">
        {MARKER_TEMPLATES.map((t) => (
          <button
            key={t.type}
            onClick={() => handleAdd(t.type)}
            className="w-full text-left px-3 py-2 rounded text-sm hover:bg-gray-100 flex items-center gap-2 transition-colors"
          >
            <span>{t.emoji}</span>
            <span>{t.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
