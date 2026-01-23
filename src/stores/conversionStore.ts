import { create } from 'zustand';
import type { FormatType, ProjectionType } from '@/types';

interface ConversionState {
    outputFormat: FormatType;
    outputProjection: ProjectionType;

    // Actions
    setOutputFormat: (format: FormatType) => void;
    setOutputProjection: (projection: ProjectionType) => void;
}

export const useConversionStore = create<ConversionState>((set) => ({
    outputFormat: 'geojson',
    outputProjection: 'EPSG:4326',

    setOutputFormat: (outputFormat) => {
        set({ outputFormat });
    },

    setOutputProjection: (outputProjection) => {
        set({ outputProjection });
    },
}));
