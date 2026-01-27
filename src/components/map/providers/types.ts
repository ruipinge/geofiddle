import type { MapViewState, Basemap, ParsedFeature } from '@/types';
import type { ReactNode } from 'react';

export interface MapProviderProps {
    viewState: MapViewState;
    onViewStateChange: (viewState: MapViewState) => void;
    basemap: Basemap;
    features: ParsedFeature[];
    selectedFeatureId: string | null;
    hoveredFeatureId: string | null;
    isDrawing: boolean;
    drawingPreview: GeoJSON.FeatureCollection | null;
    onMapClick: (lngLat: { lng: number; lat: number }) => void;
    children?: ReactNode;
}
