import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Theme } from '@/types';

interface UIState {
    theme: Theme;
    leftPanelWidth: number;

    // Actions
    setTheme: (theme: Theme) => void;
    setLeftPanelWidth: (width: number) => void;
}

export const useUIStore = create<UIState>()(
    persist(
        (set) => ({
            theme: 'system',
            leftPanelWidth: 400,

            setTheme: (theme) => {
                set({ theme });
            },

            setLeftPanelWidth: (leftPanelWidth) => {
                set({ leftPanelWidth });
            },
        }),
        {
            name: 'geofiddle-ui',
        }
    )
);
