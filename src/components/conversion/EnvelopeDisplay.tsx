import { useMemo, useCallback } from 'react';
import { Copy } from 'lucide-react';
import * as turf from '@turf/turf';
import { useGeometryStore } from '@/stores/geometryStore';
import { useConversionStore } from '@/stores/conversionStore';
import { useMapStore } from '@/stores/mapStore';
import {
    transformGeometry,
    detectProjectionFromCoordinates,
    type SupportedProjection,
} from '@/lib/projections';
import type { Geometry, Position, Polygon } from 'geojson';

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

/**
 * Format coordinate value based on projection
 * WGS84 uses 6 decimal places, projected systems use 2
 */
function formatCoordinate(value: number, projection: string): string {
    const decimals = projection === 'EPSG:4326' ? 6 : 2;
    return value.toFixed(decimals);
}

export function EnvelopeDisplay() {
    const { features, inputProjection, detectedProjection } = useGeometryStore();
    const { outputProjection } = useConversionStore();
    const { setEnvelopeHovered } = useMapStore();

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

    // Calculate bounding box and transform to output projection
    const envelope = useMemo(() => {
        if (features.length === 0) {
            return null;
        }

        try {
            // First transform features to WGS84 to calculate bbox
            const wgs84Features = sourceProjection === 'EPSG:4326'
                ? features
                : features.map((f) => ({
                    ...f,
                    geometry: transformGeometry(f.geometry, sourceProjection, 'EPSG:4326'),
                }));

            const featureCollection = turf.featureCollection(wgs84Features);
            const bbox = turf.bbox(featureCollection);

            if (!bbox.every((v) => isFinite(v))) {
                return null;
            }

            const [minLon, minLat, maxLon, maxLat] = bbox;

            // Create envelope polygon in WGS84
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

            // Transform envelope to output projection for display
            const transformedEnvelope = outputProjection !== 'EPSG:4326'
                ? transformGeometry(envelopePolygon, 'EPSG:4326', outputProjection as SupportedProjection) as Polygon
                : envelopePolygon;

            // Extract SW and NE from transformed envelope
            const transformedCoords = transformedEnvelope.coordinates[0];
            if (!transformedCoords || transformedCoords.length < 4) {
                return null;
            }

            // SW is at index 0, NE is at index 2 in our ring
            const sw = transformedCoords[0];
            const ne = transformedCoords[2];

            if (!sw || !ne || sw.length < 2 || ne.length < 2) {
                return null;
            }

            const swX = sw[0];
            const swY = sw[1];
            const neX = ne[0];
            const neY = ne[1];

            if (swX === undefined || swY === undefined || neX === undefined || neY === undefined) {
                return null;
            }

            return {
                sw: { x: swX, y: swY },
                ne: { x: neX, y: neY },
                // Keep WGS84 bbox for map display
                wgs84Bbox: bbox as [number, number, number, number],
            };
        } catch {
            return null;
        }
    }, [features, sourceProjection, outputProjection]);

    const handleCopy = useCallback(async () => {
        if (!envelope) {
            return;
        }
        const text = `SW: ${formatCoordinate(envelope.sw.x, outputProjection)}, ${formatCoordinate(envelope.sw.y, outputProjection)}\nNE: ${formatCoordinate(envelope.ne.x, outputProjection)}, ${formatCoordinate(envelope.ne.y, outputProjection)}`;
        await navigator.clipboard.writeText(text);
    }, [envelope, outputProjection]);

    const handleMouseEnter = useCallback(() => {
        setEnvelopeHovered(true);
    }, [setEnvelopeHovered]);

    const handleMouseLeave = useCallback(() => {
        setEnvelopeHovered(false);
    }, [setEnvelopeHovered]);

    if (!envelope) {
        return null;
    }

    // Determine axis labels based on projection
    const isWgs84 = outputProjection === 'EPSG:4326';
    const xLabel = isWgs84 ? 'Lon' : 'E';
    const yLabel = isWgs84 ? 'Lat' : 'N';

    return (
        <div
            className="mb-3 flex items-center justify-between rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2 text-xs dark:border-neutral-700 dark:bg-neutral-800"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            <div className="flex flex-col gap-0.5 font-mono text-neutral-700 dark:text-neutral-300">
                <div>
                    <span className="text-neutral-500 dark:text-neutral-400">SW: </span>
                    {xLabel} {formatCoordinate(envelope.sw.x, outputProjection)}, {yLabel} {formatCoordinate(envelope.sw.y, outputProjection)}
                </div>
                <div>
                    <span className="text-neutral-500 dark:text-neutral-400">NE: </span>
                    {xLabel} {formatCoordinate(envelope.ne.x, outputProjection)}, {yLabel} {formatCoordinate(envelope.ne.y, outputProjection)}
                </div>
            </div>
            <button
                onClick={handleCopy}
                className="flex h-7 w-7 items-center justify-center rounded text-neutral-500 transition-colors hover:bg-neutral-200 hover:text-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-700 dark:hover:text-neutral-200"
                title="Copy to clipboard"
                aria-label="Copy envelope coordinates to clipboard"
            >
                <Copy className="h-4 w-4" />
            </button>
        </div>
    );
}
