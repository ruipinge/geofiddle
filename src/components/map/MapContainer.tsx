import { useCallback, useEffect, useMemo, lazy, Suspense } from 'react';
import { MapLibreMap } from './providers/maplibre';
import { DrawingTools } from './DrawingTools';
import { useMapStore } from '@/stores/mapStore';
import { useGeometryStore } from '@/stores/geometryStore';
import { useDrawingStore } from '@/stores/drawingStore';
import { useUIStore } from '@/stores/uiStore';
import {
    transformGeometry,
    detectProjectionFromCoordinates,
    validateWGS84Coordinates,
    type SupportedProjection,
} from '@/lib/projections';
import { appendGeometry } from '@/lib/geometry/appendGeometry';
import * as turf from '@turf/turf';
import type { Geometry, Position } from 'geojson';

// Lazy load Google Maps provider
const GoogleMap = lazy(() =>
    import('./providers/google').then((mod) => ({ default: mod.GoogleMap }))
);

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

function MapLoadingFallback() {
    return (
        <div className="flex h-full w-full items-center justify-center bg-neutral-100">
            <div className="text-neutral-600">Loading map...</div>
        </div>
    );
}

export function MapContainer() {
    const { viewState, setViewState, basemap, panToFeatureId, clearPanToFeature, isEnvelopeHovered } = useMapStore();
    const {
        features,
        selectedFeatureId,
        hoveredFeatureId,
        rawText,
        inputFormat,
        inputProjection,
        detectedFormat,
        detectedProjection,
        setCoordinateError,
        setRawText,
    } = useGeometryStore();
    const { mode: drawingMode, currentPoints, addPoint, reset: resetDrawing } = useDrawingStore();
    const { autoPanToGeometry, mapProvider } = useUIStore();

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

    // Calculate view state to fit bounds
    const calculateFitBounds = useCallback(() => {
        if (transformedFeatures.length === 0) {
            return null;
        }

        const featureCollection = turf.featureCollection(transformedFeatures);
        const bbox = turf.bbox(featureCollection);

        if (!bbox.every((v) => isFinite(v))) {
            return null;
        }

        const [minLon, minLat, maxLon, maxLat] = bbox;

        // Calculate center
        const centerLon = (minLon + maxLon) / 2;
        const centerLat = (minLat + maxLat) / 2;

        // Calculate zoom level to fit bounds
        // This is a simplified calculation - adjust padding as needed
        const latDiff = maxLat - minLat;
        const lonDiff = maxLon - minLon;
        const maxDiff = Math.max(latDiff, lonDiff);

        // Rough zoom calculation (adjust multiplier as needed)
        let zoom = 10;
        if (maxDiff > 0) {
            zoom = Math.floor(Math.log2(360 / maxDiff)) - 1;
            zoom = Math.max(1, Math.min(zoom, 18)); // Clamp between 1 and 18
        }

        return {
            longitude: centerLon,
            latitude: centerLat,
            zoom,
        };
    }, [transformedFeatures]);

    // Fit bounds function - can be called manually or automatically
    const fitBounds = useCallback(() => {
        const newViewState = calculateFitBounds();
        if (newViewState) {
            setViewState(newViewState);
        }
    }, [calculateFitBounds, setViewState]);

    // Fit bounds when features change (if auto-pan is enabled)
    useEffect(() => {
        if (autoPanToGeometry) {
            fitBounds();
        }
    }, [autoPanToGeometry, fitBounds]);

    // Pan to specific feature when requested
    useEffect(() => {
        if (!panToFeatureId) {
            return;
        }

        const feature = transformedFeatures.find((f) => f.id === panToFeatureId);
        if (!feature) {
            clearPanToFeature();
            return;
        }

        try {
            const bbox = turf.bbox(feature);
            if (!bbox.every((v) => isFinite(v))) {
                clearPanToFeature();
                return;
            }

            const [minLon, minLat, maxLon, maxLat] = bbox;
            const centerLon = (minLon + maxLon) / 2;
            const centerLat = (minLat + maxLat) / 2;

            // Calculate zoom to fit the feature with some padding
            const latDiff = maxLat - minLat;
            const lonDiff = maxLon - minLon;
            const maxDiff = Math.max(latDiff, lonDiff);

            let zoom = 14; // Default for points
            if (maxDiff > 0) {
                zoom = Math.floor(Math.log2(360 / maxDiff)) - 1;
                zoom = Math.max(1, Math.min(zoom, 18));
            }

            setViewState({
                longitude: centerLon,
                latitude: centerLat,
                zoom,
            });
        } finally {
            clearPanToFeature();
        }
    }, [panToFeatureId, transformedFeatures, setViewState, clearPanToFeature]);

    // Handle map click for drawing
    const handleMapClick = useCallback(
        async (lngLat: { lng: number; lat: number }) => {
            if (drawingMode === 'none') {
                return;
            }

            const { lng, lat } = lngLat;
            const point: Position = [lng, lat];

            if (drawingMode === 'point') {
                // For points, create feature immediately and add to input text
                const result = await appendGeometry({
                    geometry: {
                        type: 'Point',
                        coordinates: point,
                    },
                    rawText,
                    inputFormat,
                    inputProjection,
                    detectedFormat,
                    detectedProjection,
                });
                setRawText(result.newText);
                resetDrawing();
            } else {
                // For lines and polygons, add point to current drawing
                addPoint(point);
            }
        },
        [drawingMode, rawText, inputFormat, inputProjection, detectedFormat, detectedProjection, setRawText, addPoint, resetDrawing]
    );

    // Create drawing preview GeoJSON
    const drawingPreview = useMemo(() => {
        if (drawingMode === 'none' || currentPoints.length === 0) {
            return null;
        }

        const previewFeatures: GeoJSON.Feature[] = [];

        // Add points
        currentPoints.forEach((point, index) => {
            previewFeatures.push({
                type: 'Feature',
                geometry: { type: 'Point', coordinates: point },
                properties: { index },
            });
        });

        // Add line connecting points
        if (currentPoints.length >= 2) {
            const firstPoint = currentPoints[0];
            const lineCoords = drawingMode === 'polygon' && currentPoints.length >= 3 && firstPoint
                ? [...currentPoints, firstPoint] // Close polygon preview
                : currentPoints;

            previewFeatures.push({
                type: 'Feature',
                geometry: { type: 'LineString', coordinates: lineCoords },
                properties: {},
            });
        }

        return {
            type: 'FeatureCollection' as const,
            features: previewFeatures,
        };
    }, [drawingMode, currentPoints]);

    const hasFeatures = transformedFeatures.length > 0;
    const isDrawing = drawingMode !== 'none';

    // Calculate envelope (bounding box) for all features
    const envelope = useMemo(() => {
        if (transformedFeatures.length === 0) {
            return null;
        }
        try {
            const featureCollection = turf.featureCollection(transformedFeatures);
            const bbox = turf.bbox(featureCollection);
            if (!bbox.every((v) => isFinite(v))) {
                return null;
            }
            return bbox as [number, number, number, number];
        } catch {
            return null;
        }
    }, [transformedFeatures]);

    // Common props for all map providers
    const mapProviderProps = {
        viewState,
        onViewStateChange: setViewState,
        basemap,
        features: transformedFeatures,
        selectedFeatureId,
        hoveredFeatureId,
        isEnvelopeHovered,
        envelope,
        isDrawing,
        drawingPreview,
        onMapClick: handleMapClick,
    };

    const drawingTools = (
        <DrawingTools onFitBounds={fitBounds} hasFeatures={hasFeatures} />
    );

    if (mapProvider === 'google') {
        return (
            <Suspense fallback={<MapLoadingFallback />}>
                <GoogleMap {...mapProviderProps}>
                    {drawingTools}
                </GoogleMap>
            </Suspense>
        );
    }

    // Default: MapLibre
    return (
        <MapLibreMap {...mapProviderProps}>
            {drawingTools}
        </MapLibreMap>
    );
}
