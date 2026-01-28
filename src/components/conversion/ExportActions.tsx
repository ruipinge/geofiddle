import { useCallback, useMemo } from 'react';
import { Download } from 'lucide-react';
import { useGeometryStore } from '@/stores/geometryStore';
import { useConversionStore } from '@/stores/conversionStore';
import { format } from '@/lib/parsers';
import {
    transformGeometry,
    detectProjectionFromCoordinates,
    type SupportedProjection,
} from '@/lib/projections';
import type { FormatType } from '@/types';
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

// Get MIME type for different formats
function getMimeType(formatType: FormatType): string {
    switch (formatType) {
        case 'geojson':
            return 'application/geo+json';
        case 'wkt':
        case 'ewkt':
        case 'csv':
            return 'text/plain';
        case 'polyline5':
        case 'polyline6':
            return 'text/plain';
        default:
            return 'text/plain';
    }
}

// Get file extension for different formats
function getFileExtension(formatType: FormatType): string {
    switch (formatType) {
        case 'geojson':
            return 'geojson';
        case 'wkt':
            return 'wkt';
        case 'ewkt':
            return 'ewkt';
        case 'csv':
            return 'csv';
        case 'polyline5':
        case 'polyline6':
            return 'txt';
        default:
            return 'txt';
    }
}

export function ExportActions() {
    const { features, inputProjection, detectedProjection } = useGeometryStore();
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

    const handleDownload = useCallback(() => {
        if (!convertedOutput) {
            return;
        }
        const mimeType = getMimeType(outputFormat);
        const extension = getFileExtension(outputFormat);
        const blob = new Blob([convertedOutput], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `geometry.${extension}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }, [convertedOutput, outputFormat]);

    const isDisabled = !convertedOutput;

    return (
        <button
            onClick={handleDownload}
            disabled={isDisabled}
            className="flex h-7 w-7 items-center justify-center rounded text-neutral-500 transition-colors hover:bg-neutral-200 hover:text-neutral-700 disabled:cursor-not-allowed disabled:opacity-50 dark:text-neutral-400 dark:hover:bg-neutral-700 dark:hover:text-neutral-200"
            title="Download"
            aria-label="Download converted geometry"
        >
            <Download className="h-4 w-4" />
        </button>
    );
}
