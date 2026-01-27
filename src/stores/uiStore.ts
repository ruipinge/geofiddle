import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Theme, MapProvider } from '@/types';

interface UIState {
    theme: Theme;
    leftPanelWidthPercent: number; // Percentage of container width (0-100)
    autoPanToGeometry: boolean;
    mapProvider: MapProvider;

    // Actions
    setTheme: (theme: Theme) => void;
    setLeftPanelWidthPercent: (percent: number) => void;
    setAutoPanToGeometry: (enabled: boolean) => void;
    toggleAutoPanToGeometry: () => void;
    setMapProvider: (provider: MapProvider) => void;
}

// Default: 1/3 of width, Max: 2/3 of width
const DEFAULT_LEFT_PANEL_WIDTH_PERCENT = 33.33;

export const useUIStore = create<UIState>()(
    persist(
        (set) => ({
            theme: 'system',
            leftPanelWidthPercent: DEFAULT_LEFT_PANEL_WIDTH_PERCENT,
            autoPanToGeometry: true,
            mapProvider: 'maplibre',

            setTheme: (theme) => {
                set({ theme });
            },

            setLeftPanelWidthPercent: (leftPanelWidthPercent) => {
                set({ leftPanelWidthPercent });
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
