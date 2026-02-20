import { create } from 'zustand';
import type { DesignSnapshot } from './useDesignStore';
import { useDesignStore } from './useDesignStore';

interface HistoryState {
  past: DesignSnapshot[];
  future: DesignSnapshot[];
  pushSnapshot: () => void;
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
}

const MAX_HISTORY = 50;

export const useHistoryStore = create<HistoryState>((set, get) => ({
  past: [],
  future: [],

  pushSnapshot: () => {
    const snapshot = useDesignStore.getState().getSnapshot();
    set((s) => ({
      past: [...s.past.slice(-MAX_HISTORY + 1), snapshot],
      future: [],
    }));
  },

  undo: () => {
    const { past } = get();
    if (past.length === 0) return;
    const current = useDesignStore.getState().getSnapshot();
    const prev = past[past.length - 1];
    useDesignStore.getState().restoreSnapshot(prev);
    set((s) => ({
      past: s.past.slice(0, -1),
      future: [current, ...s.future],
    }));
  },

  redo: () => {
    const { future } = get();
    if (future.length === 0) return;
    const current = useDesignStore.getState().getSnapshot();
    const next = future[0];
    useDesignStore.getState().restoreSnapshot(next);
    set((s) => ({
      past: [...s.past, current],
      future: s.future.slice(1),
    }));
  },

  canUndo: () => get().past.length > 0,
  canRedo: () => get().future.length > 0,
}));
