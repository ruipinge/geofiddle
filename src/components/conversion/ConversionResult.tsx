import { useMemo } from 'react';
import { useGeometryStore } from '@/stores/geometryStore';
import { useConversionStore } from '@/stores/conversionStore';
import { format } from '@/lib/parsers';
import {
    transformGeometry,
    detectProjectionFromCoordinates,
    type SupportedProjection,
} from '@/lib/projections';
import type { Geometry, Position } from 'geojson';

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

export function ConversionResult() {
    const { features, isParsing, inputProjection, detectedProjection } = useGeometryStore();
    const { outputFormat, outputProjection } = useConversionStore();

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

    const convertedOutput = useMemo(() => {
        if (features.length === 0) {
            return '';
        }

        try {
            // Transform features from source projection to output projection
            const transformedFeatures = sourceProjection === outputProjection
                ? features
                : features.map((f) => ({
                    ...f,
                    geometry: transformGeometry(f.geometry, sourceProjection, outputProjection as SupportedProjection),
                }));

            return format(transformedFeatures, outputFormat, { projection: outputProjection });
        } catch {
            return '';
        }
    }, [features, outputFormat, sourceProjection, outputProjection]);

    if (isParsing) {
        return (
            <div className="mb-3 flex items-center gap-2 rounded-md border border-neutral-200 bg-neutral-100 p-3 text-sm text-neutral-600 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-400">
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Parsing...
            </div>
        );
    }

    // Always show output area, even if empty due to errors
    return (
        <pre className="mb-3 max-h-48 min-h-[3rem] overflow-auto rounded-md border border-neutral-200 bg-neutral-100 p-3 font-mono text-sm text-neutral-900 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100">
            {convertedOutput || ' '}
        </pre>
    );
}
