import { useMemo } from 'react';
import { Source, Layer, type FillLayer, type LineLayer, type CircleLayer } from 'react-map-gl/maplibre';
import type { FilterSpecification } from 'maplibre-gl';
import { useGeometryStore } from '@/stores/geometryStore';
import { transformGeometry, detectProjectionFromCoordinates, type SupportedProjection } from '@/lib/projections';
import type { FeatureCollection, Geometry, Position } from 'geojson';

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

// Extract all coordinates from features for projection detection
function extractAllCoordinates(features: { geometry: Geometry | null }[]): Position[] {
    const coords: Position[] = [];

    const extractFromGeometry = (geometry: Geometry | null): void => {
        if (!geometry) {
            return;
        }
        if (geometry.type === 'GeometryCollection') {
            for (const g of geometry.geometries) {
                extractFromGeometry(g);
            }
            return;
        }
        const extractFromCoords = (c: unknown): void => {
            if (Array.isArray(c)) {
                if (typeof c[0] === 'number' && typeof c[1] === 'number') {
                    coords.push(c as Position);
                } else {
                    for (const item of c) {
                        extractFromCoords(item);
                    }
                }
            }
        };
        extractFromCoords((geometry as { coordinates: unknown }).coordinates);
    };

    for (const feature of features) {
        extractFromGeometry(feature.geometry);
    }
    return coords;
}

export function GeometryLayer() {
    const { features, selectedFeatureId, hoveredFeatureId, inputProjection, detectedProjection, coordinateError } = useGeometryStore();

    // Determine the effective source projection
    const sourceProjection = useMemo((): SupportedProjection => {
        // If user explicitly selected a projection, use it
        if (inputProjection !== 'auto') {
            return inputProjection as SupportedProjection;
        }
        // If parser detected a projection (e.g., from EWKT SRID), use it
        if (detectedProjection) {
            return detectedProjection as SupportedProjection;
        }
        // Auto-detect from coordinates
        if (features.length > 0) {
            const coords = extractAllCoordinates(features);
            return detectProjectionFromCoordinates(coords);
        }
        return 'EPSG:4326';
    }, [inputProjection, detectedProjection, features]);

    // Create filters for hover, selected, and base features
    // Using legacy filter format: ['==', 'property', value]
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

    // Transform features to WGS84 for map display
    const transformedFeatures = useMemo(() => {
        if (sourceProjection === 'EPSG:4326') {
            return features;
        }
        return features.map((f) => ({
            ...f,
            geometry: transformGeometry(f.geometry, sourceProjection, 'EPSG:4326'),
        }));
    }, [features, sourceProjection]);

    // Don't render if there's a coordinate error or no features
    if (coordinateError || transformedFeatures.length === 0) {
        return null;
    }

    // Add id property to features for filtering
    const geojson: FeatureCollection = {
        type: 'FeatureCollection',
        features: transformedFeatures.map((f) => ({
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
    );
}
