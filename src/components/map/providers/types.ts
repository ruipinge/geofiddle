import type { MapViewState, Basemap, ParsedFeature } from '@/types';
import type { ReactNode } from 'react';

// Bounding box in WGS84 [minLon, minLat, maxLon, maxLat]
export type BBox = [number, number, number, number];

export interface MapProviderProps {
    viewState: MapViewState;
    onViewStateChange: (viewState: MapViewState) => void;
    basemap: Basemap;
    features: ParsedFeature[];
    selectedFeatureId: string | null;
    hoveredFeatureId: string | null;
    isEnvelopeHovered: boolean;
    envelope: BBox | null;
    isDrawing: boolean;
    drawingPreview: GeoJSON.FeatureCollection | null;
    onMapClick: (lngLat: { lng: number; lat: number }) => void;
    children?: ReactNode;
}
