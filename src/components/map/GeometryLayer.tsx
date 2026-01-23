import { Source, Layer, type FillLayer, type LineLayer, type CircleLayer } from 'react-map-gl/maplibre';
import { useGeometryStore } from '@/stores/geometryStore';
import type { FeatureCollection } from 'geojson';

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

export function GeometryLayer() {
    const { features } = useGeometryStore();

    if (features.length === 0) {
        return null;
    }

    const geojson: FeatureCollection = {
        type: 'FeatureCollection',
        features,
    };

    return (
        <Source id="geometry-source" type="geojson" data={geojson}>
            <Layer {...fillLayer} />
            <Layer {...lineLayer} />
            <Layer {...pointLayer} />
        </Source>
    );
}
