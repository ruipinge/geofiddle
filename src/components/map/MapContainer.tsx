import { useCallback, useEffect, useRef } from 'react';
import Map, { NavigationControl, type MapRef } from 'react-map-gl/maplibre';
import { GeometryLayer } from './GeometryLayer';
import { useMapStore } from '@/stores/mapStore';
import { useGeometryStore } from '@/stores/geometryStore';
import * as turf from '@turf/turf';
import 'maplibre-gl/dist/maplibre-gl.css';

export function MapContainer() {
    const mapRef = useRef<MapRef>(null);
    const { viewState, setViewState, basemap } = useMapStore();
    const { features } = useGeometryStore();

    // Fit bounds when features change
    useEffect(() => {
        if (features.length === 0 || !mapRef.current) {
            return;
        }

        const featureCollection = turf.featureCollection(features);
        const bbox = turf.bbox(featureCollection);

        if (bbox.every((v) => isFinite(v))) {
            mapRef.current.fitBounds(
                [
                    [bbox[0], bbox[1]],
                    [bbox[2], bbox[3]],
                ],
                { padding: 50, duration: 500 }
            );
        }
    }, [features]);

    const handleMove = useCallback(
        (evt: { viewState: { longitude: number; latitude: number; zoom: number } }) => {
            setViewState({
                longitude: evt.viewState.longitude,
                latitude: evt.viewState.latitude,
                zoom: evt.viewState.zoom,
            });
        },
        [setViewState]
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
            mapStyle={mapStyle}
            style={{ width: '100%', height: '100%' }}
        >
            <NavigationControl position="top-right" />
            <GeometryLayer />
        </Map>
    );
}
