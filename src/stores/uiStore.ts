import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Theme } from '@/types';

interface UIState {
    theme: Theme;
    leftPanelWidth: number;
    autoPanToGeometry: boolean;

    // Actions
    setTheme: (theme: Theme) => void;
    setLeftPanelWidth: (width: number) => void;
    setAutoPanToGeometry: (enabled: boolean) => void;
    toggleAutoPanToGeometry: () => void;
}

export const useUIStore = create<UIState>()(
    persist(
        (set) => ({
            theme: 'system',
            leftPanelWidth: 400,
            autoPanToGeometry: true,

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
        }),
        {
            name: 'geofiddle-ui',
        }
    )
);
