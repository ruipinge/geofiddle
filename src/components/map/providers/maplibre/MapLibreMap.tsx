import { useCallback, useRef } from 'react';
import Map, { NavigationControl, Source, Layer, type MapRef, type MapLayerMouseEvent } from 'react-map-gl/maplibre';
import { MapLibreGeometryLayer } from './MapLibreGeometryLayer';
import type { MapProviderProps } from '../types';
import 'maplibre-gl/dist/maplibre-gl.css';

export function MapLibreMap({
    viewState,
    onViewStateChange,
    basemap,
    features,
    selectedFeatureId,
    hoveredFeatureId,
    isDrawing,
    drawingPreview,
    onMapClick,
    children,
}: MapProviderProps) {
    const mapRef = useRef<MapRef>(null);

    const handleMove = useCallback(
        (evt: { viewState: { longitude: number; latitude: number; zoom: number } }) => {
            onViewStateChange({
                longitude: evt.viewState.longitude,
                latitude: evt.viewState.latitude,
                zoom: evt.viewState.zoom,
            });
        },
        [onViewStateChange]
    );

    const handleClick = useCallback(
        (evt: MapLayerMouseEvent) => {
            onMapClick({ lng: evt.lngLat.lng, lat: evt.lngLat.lat });
        },
        [onMapClick]
    );

    const mapStyle =
        basemap === 'satellite'
            ? 'https://api.maptiler.com/maps/hybrid/style.json?key=get_your_own_key'
            : 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json';

    return (
        <Map
            ref={mapRef}
            {...viewState}
            onMove={handleMove}
            onClick={handleClick}
            mapStyle={mapStyle}
            style={{ width: '100%', height: '100%' }}
            cursor={isDrawing ? 'crosshair' : undefined}
        >
            <NavigationControl position="top-right" />
            {children}

            {/* Drawing preview layer */}
            {drawingPreview && (
                <Source id="drawing-preview" type="geojson" data={drawingPreview}>
                    <Layer
                        id="drawing-preview-line"
                        type="line"
                        paint={{
                            'line-color': '#f97316',
                            'line-width': 2,
                            'line-dasharray': [2, 2],
                        }}
                        filter={['==', '$type', 'LineString']}
                    />
                    <Layer
                        id="drawing-preview-points"
                        type="circle"
                        paint={{
                            'circle-radius': 6,
                            'circle-color': '#f97316',
                            'circle-stroke-color': '#ffffff',
                            'circle-stroke-width': 2,
                        }}
                        filter={['==', '$type', 'Point']}
                    />
                </Source>
            )}

            <MapLibreGeometryLayer
                features={features}
                selectedFeatureId={selectedFeatureId}
                hoveredFeatureId={hoveredFeatureId}
            />
        </Map>
    );
}
