import { create } from 'zustand';
import type { Feature } from 'geojson';
import type { FormatType, ProjectionType, ParsedFeature } from '@/types';

interface GeometryState {
    // Input state
    rawText: string;
    inputFormat: FormatType | 'auto';
    inputProjection: ProjectionType | 'auto';

    // Detection results
    detectedFormat: FormatType | null;
    detectedProjection: ProjectionType | null;

    // Parsed features
    features: ParsedFeature[];
    parseError: string | null;
    coordinateError: string | null;
    isParsing: boolean;

    // Selection and hover
    selectedFeatureId: string | null;
    hoveredFeatureId: string | null;

    // Actions
    setRawText: (text: string) => void;
    setInputFormat: (format: FormatType | 'auto') => void;
    setInputProjection: (projection: ProjectionType | 'auto') => void;
    setFeatures: (features: ParsedFeature[]) => void;
    setParseError: (error: string | null) => void;
    setCoordinateError: (error: string | null) => void;
    setIsParsing: (isParsing: boolean) => void;
    setSelectedFeatureId: (id: string | null) => void;
    setHoveredFeatureId: (id: string | null) => void;
    setDetectedFormat: (format: FormatType | null) => void;
    setDetectedProjection: (projection: ProjectionType | null) => void;
    reset: () => void;
}

const initialState = {
    rawText: '',
    inputFormat: 'auto' as const,
    inputProjection: 'auto' as const,
    detectedFormat: null,
    detectedProjection: null,
    features: [],
    parseError: null,
    coordinateError: null,
    isParsing: false,
    selectedFeatureId: null,
    hoveredFeatureId: null,
};

export const useGeometryStore = create<GeometryState>((set) => ({
    ...initialState,

    setRawText: (rawText) => {
        set({ rawText });
        // Parse will be triggered by a separate effect/hook
    },

    setInputFormat: (inputFormat) => {
        set({ inputFormat });
    },

    setInputProjection: (inputProjection) => {
        set({ inputProjection });
    },

    setFeatures: (features) => {
        set({ features, parseError: null });
    },

    setParseError: (parseError) => {
        set({ parseError, features: [] });
    },

    setCoordinateError: (coordinateError) => {
        set({ coordinateError });
    },

    setIsParsing: (isParsing) => {
        set({ isParsing });
    },

    setSelectedFeatureId: (selectedFeatureId) => {
        set({ selectedFeatureId });
    },

    setHoveredFeatureId: (hoveredFeatureId) => {
        set({ hoveredFeatureId });
    },

    setDetectedFormat: (detectedFormat) => {
        set({ detectedFormat });
    },

    setDetectedProjection: (detectedProjection) => {
        set({ detectedProjection });
    },

    reset: () => {
        set(initialState);
    },
}));

// Helper to add feature IDs
export function addFeatureIds(features: Feature[]): ParsedFeature[] {
    return features.map((feature, index) => ({
        ...feature,
        id: feature.id?.toString() ?? `feature-${String(index)}`,
        properties: feature.properties ?? {},
    })) as ParsedFeature[];
}
