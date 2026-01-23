import { useMemo } from 'react';
import { Source, Layer, type FillLayer, type LineLayer, type CircleLayer } from 'react-map-gl/maplibre';
import type { FilterSpecification } from 'maplibre-gl';
import { useGeometryStore } from '@/stores/geometryStore';
import type { FeatureCollection } from 'geojson';

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

// Highlight layers for selected feature
const highlightFillLayer: FillLayer = {
    id: 'geometry-fill-highlight',
    type: 'fill',
    source: 'geometry-source',
    paint: {
        'fill-color': '#f97316', // orange-500
        'fill-opacity': 0.4,
    },
};

const highlightLineLayer: LineLayer = {
    id: 'geometry-line-highlight',
    type: 'line',
    source: 'geometry-source',
    paint: {
        'line-color': '#ea580c', // orange-600
        'line-width': 4,
    },
};

const highlightPointLayer: CircleLayer = {
    id: 'geometry-point-highlight',
    type: 'circle',
    source: 'geometry-source',
    paint: {
        'circle-radius': 10,
        'circle-color': '#f97316', // orange-500
        'circle-stroke-color': '#ffffff',
        'circle-stroke-width': 3,
    },
};

export function GeometryLayer() {
    const { features, selectedFeatureId } = useGeometryStore();

    // Create filters for highlighted and non-highlighted features
    const { highlightFilter, nonHighlightFilter } = useMemo(() => {
        if (!selectedFeatureId) {
            return {
                highlightFilter: ['==', 'id', ''] as unknown as FilterSpecification,
                nonHighlightFilter: undefined,
            };
        }

        return {
            highlightFilter: ['==', ['get', 'id'], selectedFeatureId] as unknown as FilterSpecification,
            nonHighlightFilter: ['!=', ['get', 'id'], selectedFeatureId] as unknown as FilterSpecification,
        };
    }, [selectedFeatureId]);

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

    // Build filters with proper casting to avoid complex type issues
    const fillFilter = nonHighlightFilter
        ? (['all', ['==', '$type', 'Polygon'], nonHighlightFilter] as FilterSpecification)
        : (['==', '$type', 'Polygon'] as FilterSpecification);
    const lineFilter = nonHighlightFilter
        ? (['all', ['in', '$type', 'LineString', 'Polygon'], nonHighlightFilter] as FilterSpecification)
        : (['in', '$type', 'LineString', 'Polygon'] as FilterSpecification);
    const pointFilter = nonHighlightFilter
        ? (['all', ['==', '$type', 'Point'], nonHighlightFilter] as FilterSpecification)
        : (['==', '$type', 'Point'] as FilterSpecification);

    return (
        <Source id="geometry-source" type="geojson" data={geojson}>
            {/* Base layers - show non-selected features (or all if none selected) */}
            <Layer {...fillLayer} filter={fillFilter} />
            <Layer {...lineLayer} filter={lineFilter} />
            <Layer {...pointLayer} filter={pointFilter} />

            {/* Highlight layers - only show selected feature */}
            {selectedFeatureId && (
                <>
                    <Layer
                        {...highlightFillLayer}
                        filter={['all', ['==', '$type', 'Polygon'], highlightFilter] as FilterSpecification}
                    />
                    <Layer
                        {...highlightLineLayer}
                        filter={['all', ['in', '$type', 'LineString', 'Polygon'], highlightFilter] as FilterSpecification}
                    />
                    <Layer
                        {...highlightPointLayer}
                        filter={['all', ['==', '$type', 'Point'], highlightFilter] as FilterSpecification}
                    />
                </>
            )}
        </Source>
    );
}
