import { useEffect } from 'react';
import { useHistoryStore } from '../store/useHistoryStore';
import { useDesignStore } from '../store/useDesignStore';
import { useCanvasStore } from '../store/useCanvasStore';

export function useKeyboard() {
  const undo = useHistoryStore((s) => s.undo);
  const redo = useHistoryStore((s) => s.redo);
  const selectedId = useDesignStore((s) => s.selectedId);
  const beds = useDesignStore((s) => s.beds);
  const markers = useDesignStore((s) => s.markers);
  const structures = useDesignStore((s) => s.structures);
  const removeBed = useDesignStore((s) => s.removeBed);
  const removeMarker = useDesignStore((s) => s.removeMarker);
  const removeStructure = useDesignStore((s) => s.removeStructure);
  const selectItem = useDesignStore((s) => s.selectItem);
  const pushSnapshot = useHistoryStore((s) => s.pushSnapshot);
  const setActiveTool = useCanvasStore((s) => s.setActiveTool);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

      // Undo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
        return;
      }

      // Redo
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        redo();
        return;
      }

      // Delete
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId) {
        e.preventDefault();
        pushSnapshot();
        if (beds.find((b) => b.id === selectedId)) {
          removeBed(selectedId);
        } else if (markers.find((m) => m.id === selectedId)) {
          removeMarker(selectedId);
        } else if (structures.find((st) => st.id === selectedId)) {
          removeStructure(selectedId);
        }
        return;
      }

      // Escape
      if (e.key === 'Escape') {
        selectItem(null);
        setActiveTool('select');
        return;
      }

      // Tool shortcuts
      if (e.key === 'v' || e.key === 'V') setActiveTool('select');
      if (e.key === 'h' || e.key === 'H') setActiveTool('pan');
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [undo, redo, selectedId, beds, markers, structures, removeBed, removeMarker, removeStructure, selectItem, pushSnapshot, setActiveTool]);
}
