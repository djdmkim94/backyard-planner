import { useState } from 'react';
import { useDesignStore } from '../../store/useDesignStore';
import { useHistoryStore } from '../../store/useHistoryStore';
import { BED_TEMPLATES } from '../../constants/beds';
import type { BedShapeType } from '../../types/garden';

const SHAPE_OPTIONS: { value: BedShapeType; label: string; icon: string }[] = [
  { value: 'rectangle', label: 'Rect', icon: '▬' },
  { value: 'circle',    label: 'Circle', icon: '●' },
  { value: 'stadium',   label: 'Stadium', icon: '⬭' },
];

export default function BedPanel() {
  const addBed = useDesignStore((s) => s.addBed);
  const addCustomBed = useDesignStore((s) => s.addCustomBed);
  const pushSnapshot = useHistoryStore((s) => s.pushSnapshot);

  const [shape, setShape] = useState<BedShapeType>('rectangle');
  const [widthFt, setWidthFt] = useState(4);
  const [heightFt, setHeightFt] = useState(4);
  const [label, setLabel] = useState('Custom Bed');
  const [color, setColor] = useState('#8B6914');

  const handleAdd = (templateId: string) => {
    pushSnapshot();
    addBed(templateId);
  };

  const handleAddCustom = () => {
    pushSnapshot();
    const h = shape === 'circle' ? widthFt : heightFt;
    addCustomBed({ widthFt, heightFt: h, label, color, bedShape: shape });
  };

  return (
    <div>
      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
        Bed Templates
      </h3>
      <div className="space-y-1 mb-4">
        {BED_TEMPLATES.map((t) => (
          <button
            key={t.id}
            onClick={() => handleAdd(t.id)}
            className="w-full text-left px-3 py-2 rounded text-sm hover:bg-gray-100 flex items-center gap-2 transition-colors"
          >
            <span className="w-4 h-4 rounded-sm shrink-0" style={{ backgroundColor: t.color }} />
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      <div className="border-t pt-3">
        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
          Custom Bed
        </h4>

        {/* Shape picker */}
        <div className="flex gap-1 mb-2">
          {SHAPE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setShape(opt.value)}
              className={`flex-1 py-1.5 rounded text-xs flex flex-col items-center gap-0.5 border transition-colors ${
                shape === opt.value
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 hover:border-gray-300 text-gray-600'
              }`}
            >
              <span className="text-base leading-none">{opt.icon}</span>
              <span>{opt.label}</span>
            </button>
          ))}
        </div>

        {/* Dimensions */}
        <div className={`grid gap-2 mb-2 ${shape === 'circle' ? 'grid-cols-1' : 'grid-cols-2'}`}>
          <label className="block">
            <span className="text-xs text-gray-500">{shape === 'circle' ? 'Diameter (ft)' : 'Width (ft)'}</span>
            <input
              type="number"
              className="w-full mt-0.5 px-2 py-1 border rounded text-sm"
              value={widthFt}
              min={0.5}
              step={0.5}
              onChange={(e) => setWidthFt(+e.target.value)}
            />
          </label>
          {shape !== 'circle' && (
            <label className="block">
              <span className="text-xs text-gray-500">Height (ft)</span>
              <input
                type="number"
                className="w-full mt-0.5 px-2 py-1 border rounded text-sm"
                value={heightFt}
                min={0.5}
                step={0.5}
                onChange={(e) => setHeightFt(+e.target.value)}
              />
            </label>
          )}
        </div>

        {/* Label */}
        <label className="block mb-2">
          <span className="text-xs text-gray-500">Label</span>
          <input
            className="w-full mt-0.5 px-2 py-1 border rounded text-sm"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
          />
        </label>

        {/* Color */}
        <label className="block mb-2">
          <span className="text-xs text-gray-500">Color</span>
          <input
            type="color"
            className="w-full mt-0.5 h-8 cursor-pointer"
            value={color}
            onChange={(e) => setColor(e.target.value)}
          />
        </label>

        <button
          onClick={handleAddCustom}
          className="w-full px-3 py-1.5 bg-green-600 text-white rounded text-sm hover:bg-green-700"
        >
          + Add to Canvas
        </button>
      </div>
    </div>
  );
}
