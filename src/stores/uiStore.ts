import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Theme, MapProvider } from '@/types';

interface UIState {
    theme: Theme;
    leftPanelWidth: number;
    autoPanToGeometry: boolean;
    mapProvider: MapProvider;

    // Actions
    setTheme: (theme: Theme) => void;
    setLeftPanelWidth: (width: number) => void;
    setAutoPanToGeometry: (enabled: boolean) => void;
    toggleAutoPanToGeometry: () => void;
    setMapProvider: (provider: MapProvider) => void;
}

export const useUIStore = create<UIState>()(
    persist(
        (set) => ({
            theme: 'system',
            leftPanelWidth: 400,
            autoPanToGeometry: true,
            mapProvider: 'maplibre',

            setTheme: (theme) => {
                set({ theme });
            },

            setLeftPanelWidth: (leftPanelWidth) => {
                set({ leftPanelWidth });
            },

            setAutoPanToGeometry: (autoPanToGeometry) => {
                set({ autoPanToGeometry });
            },

            toggleAutoPanToGeometry: () => {
                set((state) => ({ autoPanToGeometry: !state.autoPanToGeometry }));
            },

            setMapProvider: (mapProvider) => {
                set({ mapProvider });
            },
        }),
        {
            name: 'geofiddle-preferences',
        }
    )
);
