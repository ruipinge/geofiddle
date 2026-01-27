import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { MapViewState, Basemap, MapProvider } from '@/types';

interface MapState {
    viewState: MapViewState;
    basemap: Basemap;
    provider: MapProvider;
    panToFeatureId: string | null;

    // Actions
    setViewState: (viewState: MapViewState) => void;
    setBasemap: (basemap: Basemap) => void;
    setProvider: (provider: MapProvider) => void;
    panToFeature: (featureId: string) => void;
    clearPanToFeature: () => void;
}

const DEFAULT_VIEW_STATE: MapViewState = {
    longitude: -0.1276,
    latitude: 51.5074,
    zoom: 10,
};

export const useMapStore = create<MapState>()(
    persist(
        (set) => ({
            viewState: DEFAULT_VIEW_STATE,
            basemap: 'osm',
            provider: 'maplibre',
            panToFeatureId: null,

            setViewState: (viewState) => {
                set({ viewState });
            },

            setBasemap: (basemap) => {
                set({ basemap });
            },

            setProvider: (provider) => {
                set({ provider });
            },

            panToFeature: (featureId) => {
                set({ panToFeatureId: featureId });
            },

            clearPanToFeature: () => {
                set({ panToFeatureId: null });
            },
        }),
        {
            name: 'geofiddle-map',
            partialize: (state) => ({ provider: state.provider }),
        }
    )
);
