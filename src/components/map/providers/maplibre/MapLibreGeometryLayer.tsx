import { useMemo } from 'react';
import { Source, Layer, type FillLayer, type LineLayer, type CircleLayer } from 'react-map-gl/maplibre';
import type { FilterSpecification } from 'maplibre-gl';
import type { FeatureCollection, Polygon } from 'geojson';
import type { ParsedFeature } from '@/types';
import type { BBox } from '../types';

// Base layers for non-selected features
const fillLayer: FillLayer = {
    id: 'geometry-fill',
    type: 'fill',
    source: 'geometry-source',
    paint: {
        'fill-color': '#3b82f6',
        'fill-opacity': 0.2,
    },
    filter: ['==', '$type', 'Polygon'],
};

const lineLayer: LineLayer = {
    id: 'geometry-line',
    type: 'line',
    source: 'geometry-source',
    paint: {
        'line-color': '#2563eb',
        'line-width': 2,
    },
    filter: ['in', '$type', 'LineString', 'Polygon'],
};

const pointLayer: CircleLayer = {
    id: 'geometry-point',
    type: 'circle',
    source: 'geometry-source',
    paint: {
        'circle-radius': 6,
        'circle-color': '#2563eb',
        'circle-stroke-color': '#ffffff',
        'circle-stroke-width': 2,
    },
    filter: ['==', '$type', 'Point'],
};

// Hover layers (lighter highlight)
const hoverFillLayer: FillLayer = {
    id: 'geometry-fill-hover',
    type: 'fill',
    source: 'geometry-source',
    paint: {
        'fill-color': '#8b5cf6', // violet-500
        'fill-opacity': 0.3,
    },
};

const hoverLineLayer: LineLayer = {
    id: 'geometry-line-hover',
    type: 'line',
    source: 'geometry-source',
    paint: {
        'line-color': '#7c3aed', // violet-600
        'line-width': 3,
    },
};

const hoverPointLayer: CircleLayer = {
    id: 'geometry-point-hover',
    type: 'circle',
    source: 'geometry-source',
    paint: {
        'circle-radius': 8,
        'circle-color': '#8b5cf6', // violet-500
        'circle-stroke-color': '#ffffff',
        'circle-stroke-width': 2,
    },
};

// Selected layers (stronger highlight)
const selectedFillLayer: FillLayer = {
    id: 'geometry-fill-selected',
    type: 'fill',
    source: 'geometry-source',
    paint: {
        'fill-color': '#f97316', // orange-500
        'fill-opacity': 0.4,
    },
};

const selectedLineLayer: LineLayer = {
    id: 'geometry-line-selected',
    type: 'line',
    source: 'geometry-source',
    paint: {
        'line-color': '#ea580c', // orange-600
        'line-width': 4,
    },
};

const selectedPointLayer: CircleLayer = {
    id: 'geometry-point-selected',
    type: 'circle',
    source: 'geometry-source',
    paint: {
        'circle-radius': 10,
        'circle-color': '#f97316', // orange-500
        'circle-stroke-color': '#ffffff',
        'circle-stroke-width': 3,
    },
};

// Envelope layer (shown when envelope is hovered)
const envelopeFillLayer: FillLayer = {
    id: 'envelope-fill',
    type: 'fill',
    source: 'envelope-source',
    paint: {
        'fill-color': '#10b981', // emerald-500
        'fill-opacity': 0.1,
    },
};

const envelopeLineLayer: LineLayer = {
    id: 'envelope-line',
    type: 'line',
    source: 'envelope-source',
    paint: {
        'line-color': '#059669', // emerald-600
        'line-width': 2,
        'line-dasharray': [4, 2],
    },
};

interface MapLibreGeometryLayerProps {
    features: ParsedFeature[];
    selectedFeatureId: string | null;
    hoveredFeatureId: string | null;
    isEnvelopeHovered: boolean;
    envelope: BBox | null;
}

export function MapLibreGeometryLayer({
    features,
    selectedFeatureId,
    hoveredFeatureId,
    isEnvelopeHovered,
    envelope,
}: MapLibreGeometryLayerProps) {
    // Create filters for hover, selected, and base features
    const filters = useMemo(() => {
        const selectedFilter = selectedFeatureId
            ? (['==', 'id', selectedFeatureId] as unknown as FilterSpecification)
            : null;

        // Hover filter: only if hovered and not the same as selected
        const hoverFilter = hoveredFeatureId && hoveredFeatureId !== selectedFeatureId
            ? (['==', 'id', hoveredFeatureId] as unknown as FilterSpecification)
            : null;

        // Base filter: exclude both selected and hovered
        let baseExcludeFilter: FilterSpecification | undefined;
        if (selectedFeatureId && hoveredFeatureId && hoveredFeatureId !== selectedFeatureId) {
            baseExcludeFilter = ['all',
                ['!=', 'id', selectedFeatureId],
                ['!=', 'id', hoveredFeatureId],
            ] as unknown as FilterSpecification;
        } else if (selectedFeatureId) {
            baseExcludeFilter = ['!=', 'id', selectedFeatureId] as unknown as FilterSpecification;
        } else if (hoveredFeatureId) {
            baseExcludeFilter = ['!=', 'id', hoveredFeatureId] as unknown as FilterSpecification;
        }

        return { selectedFilter, hoverFilter, baseExcludeFilter };
    }, [selectedFeatureId, hoveredFeatureId]);

    // Create envelope GeoJSON when hovered
    const envelopeGeojson = useMemo(() => {
        if (!isEnvelopeHovered || !envelope) {
            return null;
        }
        const [minLon, minLat, maxLon, maxLat] = envelope;
        const envelopePolygon: Polygon = {
            type: 'Polygon',
            coordinates: [[
                [minLon, minLat],
                [maxLon, minLat],
                [maxLon, maxLat],
                [minLon, maxLat],
                [minLon, minLat],
            ]],
        };
        return {
            type: 'FeatureCollection' as const,
            features: [{
                type: 'Feature' as const,
                geometry: envelopePolygon,
                properties: {},
            }],
        };
    }, [isEnvelopeHovered, envelope]);

    if (features.length === 0) {
        return null;
    }

    // Add id property to features for filtering
    const geojson: FeatureCollection = {
        type: 'FeatureCollection',
        features: features.map((f) => ({
            ...f,
            properties: {
                ...f.properties,
                id: f.id,
            },
        })),
    };

    // Build filters for base layers (exclude selected and hovered)
    const { selectedFilter, hoverFilter, baseExcludeFilter } = filters;

    const baseFillFilter = baseExcludeFilter
        ? (['all', ['==', '$type', 'Polygon'], baseExcludeFilter] as FilterSpecification)
        : (['==', '$type', 'Polygon'] as FilterSpecification);
    const baseLineFilter = baseExcludeFilter
        ? (['all', ['in', '$type', 'LineString', 'Polygon'], baseExcludeFilter] as FilterSpecification)
        : (['in', '$type', 'LineString', 'Polygon'] as FilterSpecification);
    const basePointFilter = baseExcludeFilter
        ? (['all', ['==', '$type', 'Point'], baseExcludeFilter] as FilterSpecification)
        : (['==', '$type', 'Point'] as FilterSpecification);

    return (
    <>
        <Source id="geometry-source" type="geojson" data={geojson}>
            {/* Base layers - show non-selected/non-hovered features */}
            <Layer {...fillLayer} filter={baseFillFilter} />
            <Layer {...lineLayer} filter={baseLineFilter} />
            <Layer {...pointLayer} filter={basePointFilter} />

            {/* Hover layers - show hovered feature (if not selected) */}
            {hoverFilter && (
                <>
                    <Layer
                        {...hoverFillLayer}
                        filter={['all', ['==', '$type', 'Polygon'], hoverFilter] as FilterSpecification}
                    />
                    <Layer
                        {...hoverLineLayer}
                        filter={['all', ['in', '$type', 'LineString', 'Polygon'], hoverFilter] as FilterSpecification}
                    />
                    <Layer
                        {...hoverPointLayer}
                        filter={['all', ['==', '$type', 'Point'], hoverFilter] as FilterSpecification}
                    />
                </>
            )}

            {/* Selected layers - show selected feature */}
            {selectedFilter && (
                <>
                    <Layer
                        {...selectedFillLayer}
                        filter={['all', ['==', '$type', 'Polygon'], selectedFilter] as FilterSpecification}
                    />
                    <Layer
                        {...selectedLineLayer}
                        filter={['all', ['in', '$type', 'LineString', 'Polygon'], selectedFilter] as FilterSpecification}
                    />
                    <Layer
                        {...selectedPointLayer}
                        filter={['all', ['==', '$type', 'Point'], selectedFilter] as FilterSpecification}
                    />
                </>
            )}
        </Source>

        {/* Envelope layer - show when envelope is hovered */}
        {envelopeGeojson && (
            <Source id="envelope-source" type="geojson" data={envelopeGeojson}>
                <Layer {...envelopeFillLayer} />
                <Layer {...envelopeLineLayer} />
            </Source>
        )}
    </>
    );
}
