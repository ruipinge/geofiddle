import shp from 'shpjs';
import type { Feature, FeatureCollection } from 'geojson';
import type { ParseResult, ParsedFeature, FormatType } from '@/types';

/**
 * Parses Shapefile (as ArrayBuffer or base64) into GeoJSON features
 * Shapefiles are typically uploaded as .zip files containing .shp, .shx, .dbf files
 */
export async function parseShapefile(input: ArrayBuffer | string): Promise<ParseResult> {
    try {
        let buffer: ArrayBuffer;

        if (typeof input === 'string') {
            // Assume base64 encoded
            if (input.trim() === '') {
                return {
                    features: [],
                    errors: [],
                    detectedFormat: 'shapefile',
                };
            }

            // Remove data URL prefix if present
            const base64 = input.replace(/^data:.*?;base64,/, '');
            const binaryString = atob(base64);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }
            buffer = bytes.buffer;
        } else {
            buffer = input;
        }

        // Parse shapefile
        const geojson = await shp(buffer);

        // shpjs can return a single FeatureCollection or an array of them
        const collections = Array.isArray(geojson) ? geojson : [geojson];

        const allFeatures: ParsedFeature[] = [];
        let featureIndex = 0;

        for (const collection of collections) {
            for (const feature of collection.features) {
                allFeatures.push({
                    type: 'Feature',
                    id: feature.id?.toString() ?? `feature-${String(featureIndex)}`,
                    geometry: feature.geometry,
                    properties: feature.properties ?? {},
                });
                featureIndex++;
            }
        }

        if (allFeatures.length === 0) {
            return {
                features: [],
                errors: [{ message: 'No features found in shapefile' }],
            };
        }

        return {
            features: allFeatures,
            errors: [],
            detectedFormat: 'shapefile',
            // Shapefiles should include projection info in .prj file
            // but we default to WGS84 as it's most common
            detectedProjection: 'EPSG:4326',
        };
    } catch (e) {
        return {
            features: [],
            errors: [{ message: e instanceof Error ? e.message : 'Failed to parse shapefile' }],
        };
    }
}

/**
 * Synchronous parse wrapper - for string input only
 * Returns empty result since shapefile parsing is async
 */
export function parseShapefileSync(input: string): ParseResult {
    if (!input.trim()) {
        return {
            features: [],
            errors: [],
            detectedFormat: 'shapefile',
        };
    }

    // Can't parse synchronously, return error
    return {
        features: [],
        errors: [{ message: 'Shapefile parsing requires async operation. Use parseShapefile() instead.' }],
    };
}

/**
 * Formats features as GeoJSON (shapefiles can't be directly created in browser)
 * Returns GeoJSON as a reasonable fallback
 */
export function formatShapefile(features: Feature[]): string {
    // We can't create shapefiles in the browser easily
    // Return GeoJSON as a reasonable alternative
    const collection: FeatureCollection = {
        type: 'FeatureCollection',
        features,
    };
    return JSON.stringify(collection, null, 2);
}

/**
 * Detects if input might be a shapefile (base64 or binary header)
 */
export function detectShapefile(input: string): boolean {
    const trimmed = input.trim();

    // Check for data URL with zip or octet-stream MIME type
    if (trimmed.startsWith('data:application/zip') ||
        trimmed.startsWith('data:application/octet-stream') ||
        trimmed.startsWith('data:application/x-zip')) {
        return true;
    }

    // Check for base64 that starts with ZIP magic bytes (PK)
    // Base64 of "PK" is "UE" (actually "UEs" for PK\x03\x04)
    if (trimmed.startsWith('UEs') || trimmed.startsWith('UEsD')) {
        return true;
    }

    return false;
}

export const shapefileParser = {
    name: 'shapefile' as FormatType,
    parse: parseShapefileSync, // Sync version for parser registry
    parseAsync: parseShapefile, // Async version for actual use
    format: formatShapefile,
    detect: detectShapefile,
};
