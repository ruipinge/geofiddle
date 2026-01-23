import { useMemo } from 'react';
import { useGeometryStore } from '@/stores/geometryStore';
import { useConversionStore } from '@/stores/conversionStore';
import { format } from '@/lib/parsers';
import {
    transformGeometry,
    detectProjectionFromCoordinates,
    type SupportedProjection,
} from '@/lib/projections';
import type { Position } from 'geojson';

// Extract all coordinates from features for projection detection
function extractAllCoordinates(features: { geometry: { coordinates: unknown } | null }[]): Position[] {
    const coords: Position[] = [];
    for (const feature of features) {
        if (!feature.geometry) {
            continue;
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
        extractFromCoords(feature.geometry.coordinates);
    }
    return coords;
}

export function ConversionResult() {
    const { features, parseError, coordinateError, inputProjection, detectedProjection } = useGeometryStore();
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

    const { convertedOutput, conversionError } = useMemo(() => {
        if (features.length === 0) {
            return { convertedOutput: '', conversionError: null };
        }

        try {
            // Transform features from source projection to output projection
            const transformedFeatures = sourceProjection === outputProjection
                ? features
                : features.map((f) => ({
                    ...f,
                    geometry: transformGeometry(f.geometry, sourceProjection, outputProjection as SupportedProjection),
                }));

            const output = format(transformedFeatures, outputFormat, { projection: outputProjection });
            return { convertedOutput: output, conversionError: null };
        } catch (e) {
            return {
                convertedOutput: '',
                conversionError: e instanceof Error ? e.message : 'Conversion failed',
            };
        }
    }, [features, outputFormat, sourceProjection, outputProjection]);

    if (parseError) {
        return (
            <div className="mb-3 rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
                {parseError}
            </div>
        );
    }

    if (coordinateError) {
        return (
            <div className="mb-3 rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
                {coordinateError}
            </div>
        );
    }

    if (conversionError) {
        return (
            <div className="mb-3 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300">
                {conversionError}
            </div>
        );
    }

    if (!convertedOutput) {
        return (
            <div className="mb-3 rounded-md border border-neutral-200 bg-neutral-100 p-3 text-sm text-neutral-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-400">
                Converted output will appear here
            </div>
        );
    }

    return (
        <pre className="mb-3 max-h-48 overflow-auto rounded-md border border-neutral-200 bg-neutral-100 p-3 font-mono text-sm text-neutral-900 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100">
            {convertedOutput}
        </pre>
    );
}
