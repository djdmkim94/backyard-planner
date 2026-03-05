import { useState, useEffect, useCallback } from 'react';

interface Step {
  target: string;
  side: 'top' | 'bottom' | 'left' | 'right' | 'inside';
  title: string;
  content: string;
}

const STEPS: Step[] = [
  {
    target: 'toolbar',
    side: 'bottom',
    title: '1 of 5 — Draw your garden boundary',
    content: "Start with the Boundary tool in the toolbar. Click to place corner points — double-click (or click the first point) to close and finish the shape. This defines your garden's outer edge.",
  },
  {
    target: 'sidebar-beds',
    side: 'right',
    title: '2 of 5 — Add garden beds',
    content: 'Browse bed templates in the Beds section of the left panel. Click "Add" to drop one onto the canvas, then drag it into position. You can also create custom beds with any shape.',
  },
  {
    target: 'canvas',
    side: 'inside',  // canvas fills the center — float tooltip inside it
    title: '3 of 5 — Arrange your layout',
    content: 'Drag beds around the canvas to design your garden. Click a bed to select it — the Properties panel on the right lets you rotate, resize, rename, and set its sun requirement.',
  },
  {
    target: 'sidebar-sun',
    side: 'right',
    title: '4 of 5 — Mark sun zones',
    content: 'Use the Sun Zone tool (or the Sun panel) to draw areas of sunlight and shade. Sun zones power planting compatibility warnings and the plant suggestion engine.',
  },
  {
    target: 'climate-panel',
    side: 'top',
    title: '5 of 5 — Enter your climate data',
    content: 'Click the Climate & Recommendations bar at the bottom to expand it. Enter your USDA hardiness zone, Köppen climate code, and prevailing wind direction for personalized growing tips.',
  },
];

interface TargetRect { top: number; left: number; width: number; height: number; }

function queryRect(target: string): TargetRect | null {
  const el = document.querySelector(`[data-tour="${target}"]`);
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return { top: r.top, left: r.left, width: r.width, height: r.height };
}

interface Props { onClose: () => void; }

const TOOLTIP_W = 300;
const PAD = 8;
const GAP = 14;

export default function TourOverlay({ onClose }: Props) {
  const [step, setStep] = useState(0);
  const [rect, setRect] = useState<TargetRect | null>(null);

  const current = STEPS[step];

  const refreshRect = useCallback(() => {
    setRect(queryRect(current.target));
  }, [current.target]);

  useEffect(() => {
    refreshRect();
    window.addEventListener('resize', refreshRect);
    return () => window.removeEventListener('resize', refreshRect);
  }, [refreshRect]);

  const next = () => {
    if (step < STEPS.length - 1) setStep((s) => s + 1);
    else onClose();
  };
  const back = () => setStep((s) => Math.max(0, s - 1));

  // Spotlight: transparent box, box-shadow creates the dark surround
  const spotStyle: React.CSSProperties = rect
    ? {
        position: 'fixed',
        top: rect.top - PAD,
        left: rect.left - PAD,
        width: rect.width + PAD * 2,
        height: rect.height + PAD * 2,
        borderRadius: 8,
        boxShadow: '0 0 0 9999px rgba(0,0,0,0.70)',
        border: '2px solid rgba(251,191,36,0.55)',
        zIndex: 9998,
        pointerEvents: 'none',
      }
    : { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.70)', zIndex: 9998, pointerEvents: 'none' };

  // Tooltip position
  let tipStyle: React.CSSProperties = { position: 'fixed', width: TOOLTIP_W, zIndex: 9999 };
  if (rect) {
    const vw = window.innerWidth;
    const clampX = (x: number) => Math.max(8, Math.min(x, vw - TOOLTIP_W - 8));
    switch (current.side) {
      case 'bottom':
        tipStyle = { ...tipStyle, top: rect.top + rect.height + PAD + GAP, left: clampX(rect.left + rect.width / 2 - TOOLTIP_W / 2) };
        break;
      case 'right':
        tipStyle = { ...tipStyle, top: Math.max(8, rect.top + rect.height / 2 - 90), left: rect.left + rect.width + PAD + GAP };
        break;
      case 'left':
        tipStyle = { ...tipStyle, top: Math.max(8, rect.top + rect.height / 2 - 90), left: Math.max(8, rect.left - PAD - GAP - TOOLTIP_W) };
        break;
      case 'top':
        tipStyle = { ...tipStyle, bottom: window.innerHeight - rect.top + PAD + GAP, left: clampX(rect.left + rect.width / 2 - TOOLTIP_W / 2) };
        break;
      case 'inside':
        // Float the tooltip near the top-center inside the element
        tipStyle = { ...tipStyle, top: rect.top + 40, left: clampX(rect.left + rect.width / 2 - TOOLTIP_W / 2) };
        break;
    }
  } else {
    tipStyle = { ...tipStyle, top: '50%', left: '50%', transform: 'translate(-50%,-50%)' };
  }

  return (
    <>
      {/* Dark backdrop — also covers edges box-shadow might miss */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 9996, background: 'rgba(0,0,0,0.70)' }} />
      {/* Spotlight ring (transparent center + border) */}
      <div style={spotStyle} />
      {/* Tooltip card */}
      <div
        style={{ ...tipStyle, boxShadow: '0 20px 40px rgba(0,0,0,0.6)' }}
        className="bg-[#1c1c1e] border border-white/20 rounded-xl p-4 select-none"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-2 mb-2">
          <span className="text-amber-300 text-[11px] font-semibold leading-tight">{current.title}</span>
          <button
            onClick={onClose}
            className="text-white/25 hover:text-white/60 text-xs shrink-0 transition-colors leading-none"
            title="Skip tour"
          >
            ✕
          </button>
        </div>

        <p className="text-white/65 text-xs leading-relaxed mb-4">{current.content}</p>

        <div className="flex items-center justify-between">
          {/* Progress dots */}
          <div className="flex gap-1.5">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className={`rounded-full transition-all duration-200 ${
                  i === step ? 'w-3 h-1.5 bg-amber-400' : i < step ? 'w-1.5 h-1.5 bg-white/35' : 'w-1.5 h-1.5 bg-white/15'
                }`}
              />
            ))}
          </div>

          {/* Navigation */}
          <div className="flex items-center gap-2">
            <button onClick={onClose} className="text-[11px] text-white/30 hover:text-white/55 transition-colors">
              Skip
            </button>
            {step > 0 && (
              <button
                onClick={back}
                className="px-2.5 py-1 text-[11px] text-white/50 hover:text-white/80 border border-white/10 hover:border-white/20 rounded-md transition-colors"
              >
                ← Back
              </button>
            )}
            <button
              onClick={next}
              className="px-3 py-1 text-[11px] bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 rounded-md transition-colors font-medium"
            >
              {step < STEPS.length - 1 ? 'Next →' : 'Done ✓'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
