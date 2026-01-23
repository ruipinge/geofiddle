import { create } from 'zustand';
import type { MapViewState, Basemap } from '@/types';

interface MapState {
    viewState: MapViewState;
    basemap: Basemap;

    // Actions
    setViewState: (viewState: MapViewState) => void;
    setBasemap: (basemap: Basemap) => void;
}

const DEFAULT_VIEW_STATE: MapViewState = {
    longitude: -0.1276,
    latitude: 51.5074,
    zoom: 10,
};

export const useMapStore = create<MapState>((set) => ({
    viewState: DEFAULT_VIEW_STATE,
    basemap: 'osm',

    setViewState: (viewState) => {
        set({ viewState });
    },

    setBasemap: (basemap) => {
        set({ basemap });
    },
}));
