import { create } from 'zustand';
import type { Position } from 'geojson';

export type DrawingMode = 'none' | 'point' | 'line' | 'polygon';

interface DrawingState {
    mode: DrawingMode;
    currentPoints: Position[];

    // Actions
    setMode: (mode: DrawingMode) => void;
    addPoint: (point: Position) => void;
    clearPoints: () => void;
    reset: () => void;
}

export const useDrawingStore = create<DrawingState>((set) => ({
    mode: 'none',
    currentPoints: [],

    setMode: (mode) => {
        set({ mode, currentPoints: [] });
    },

    addPoint: (point) => {
        set((state) => ({
            currentPoints: [...state.currentPoints, point],
        }));
    },

    clearPoints: () => {
        set({ currentPoints: [] });
    },

    reset: () => {
        set({ mode: 'none', currentPoints: [] });
    },
}));
