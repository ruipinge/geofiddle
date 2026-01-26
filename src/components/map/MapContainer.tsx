import { useCallback, useEffect, useRef, useMemo } from 'react';
import Map, { NavigationControl, type MapRef } from 'react-map-gl/maplibre';
import { Maximize2 } from 'lucide-react';
import { GeometryLayer } from './GeometryLayer';
import { useMapStore } from '@/stores/mapStore';
import { useGeometryStore } from '@/stores/geometryStore';
import {
    transformGeometry,
    detectProjectionFromCoordinates,
    validateWGS84Coordinates,
    type SupportedProjection,
} from '@/lib/projections';
import * as turf from '@turf/turf';
import type { Geometry, Position } from 'geojson';
import 'maplibre-gl/dist/maplibre-gl.css';

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

export function MapContainer() {
    const mapRef = useRef<MapRef>(null);
    const { viewState, setViewState, basemap } = useMapStore();
    const { features, inputProjection, detectedProjection, setCoordinateError } = useGeometryStore();

    // Determine the effective source projection
    const sourceProjection = useMemo((): SupportedProjection => {
        if (inputProjection !== 'auto') {
            return inputProjection as SupportedProjection;
        }
        if (detectedProjection) {
            return detectedProjection as SupportedProjection;
        }
        if (features.length > 0) {
            const coords = extractAllCoordinates(features);
            return detectProjectionFromCoordinates(coords);
        }
        return 'EPSG:4326';
    }, [inputProjection, detectedProjection, features]);

    // Transform features to WGS84 for map display and validate
    const { transformedFeatures, coordinateError } = useMemo(() => {
        if (features.length === 0) {
            return { transformedFeatures: [], coordinateError: null };
        }

        const transformed = sourceProjection === 'EPSG:4326'
            ? features
            : features.map((f) => ({
                ...f,
                geometry: transformGeometry(f.geometry, sourceProjection, 'EPSG:4326'),
            }));

        // Validate that transformed coordinates are within valid WGS84 range
        const allCoords = extractAllCoordinates(transformed);
        const validation = validateWGS84Coordinates(allCoords);

        if (!validation.valid && validation.invalidCoord) {
            const [lon, lat] = validation.invalidCoord;
            return {
                transformedFeatures: [],
                coordinateError: `Coordinates out of range for WGS84: (${String(lon)}, ${String(lat)}). ` +
                    `Longitude must be -180 to 180, latitude must be -90 to 90. ` +
                    `Try selecting a different input projection.`,
            };
        }

        return { transformedFeatures: transformed, coordinateError: null };
    }, [features, sourceProjection]);

    // Update coordinate error in store
    useEffect(() => {
        setCoordinateError(coordinateError);
    }, [coordinateError, setCoordinateError]);

    // Fit bounds function - can be called manually or automatically
    const fitBounds = useCallback(() => {
        if (transformedFeatures.length === 0 || !mapRef.current) {
            return;
        }

        const featureCollection = turf.featureCollection(transformedFeatures);
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
    }, [transformedFeatures]);

    // Fit bounds when features change
    useEffect(() => {
        fitBounds();
    }, [fitBounds]);

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

    const hasFeatures = transformedFeatures.length > 0;

    return (
        <Map
            ref={mapRef}
            {...viewState}
            onMove={handleMove}
            mapStyle={mapStyle}
            style={{ width: '100%', height: '100%' }}
        >
            <NavigationControl position="top-right" />
            {hasFeatures && (
                <div className="absolute right-2 top-24">
                    <button
                        onClick={fitBounds}
                        className="flex h-[29px] w-[29px] items-center justify-center rounded bg-white shadow-md hover:bg-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                        title="Fit map to geometry"
                        aria-label="Fit map to geometry"
                    >
                        <Maximize2 className="h-4 w-4 text-neutral-700" />
                    </button>
                </div>
            )}
            <GeometryLayer />
        </Map>
    );
}
