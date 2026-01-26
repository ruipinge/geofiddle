import { hint } from '@mapbox/geojsonhint';
import type { Feature, FeatureCollection, Geometry, GeoJsonObject } from 'geojson';
import type { ParseResult, ParsedFeature, FormatType } from '@/types';

/**
 * Splits input into multiple JSON objects.
 * Handles concatenated JSON like: {...}{...} or {...} {...}
 */
function splitJsonObjects(input: string): string[] {
    const results: string[] = [];
    let depth = 0;
    let start = -1;

    for (let i = 0; i < input.length; i++) {
        const char = input[i];

        if (char === '{') {
            if (depth === 0) {
                start = i;
            }
            depth++;
        } else if (char === '}') {
            depth--;
            if (depth === 0 && start !== -1) {
                results.push(input.slice(start, i + 1));
                start = -1;
            }
        }
    }

    return results;
}

/**
 * Parses a single GeoJSON object and returns features or errors
 */
function parseSingleGeoJSON(jsonStr: string): { features: Feature[]; errors: Array<{ message: string; line?: number }> } {
    let parsed: unknown;
    try {
        parsed = JSON.parse(jsonStr);
    } catch (e) {
        return {
            features: [],
            errors: [{ message: e instanceof Error ? e.message : 'Invalid JSON' }],
        };
    }

    const hintErrors = hint(parsed);
    if (hintErrors.length > 0) {
        return {
            features: [],
            errors: hintErrors.map((err) => ({
                message: err.message,
                line: err.line,
            })),
        };
    }

    return {
        features: geoJsonToFeatures(parsed as GeoJsonObject),
        errors: [],
    };
}

/**
 * Parses GeoJSON string into features with validation.
 * Supports multiple concatenated JSON objects.
 */
export function parseGeoJSON(input: string): ParseResult {
    const trimmed = input.trim();

    if (!trimmed) {
        return {
            features: [],
            errors: [],
            detectedFormat: 'geojson',
        };
    }

    // Split into multiple JSON objects
    const jsonObjects = splitJsonObjects(trimmed);

    if (jsonObjects.length === 0) {
        return {
            features: [],
            errors: [{ message: 'No valid JSON objects found' }],
        };
    }

    // Parse each JSON object
    const allFeatures: Feature[] = [];
    const allErrors: Array<{ message: string; line?: number }> = [];

    for (let i = 0; i < jsonObjects.length; i++) {
        const jsonStr = jsonObjects[i];
        if (!jsonStr) {
            continue;
        }

        const result = parseSingleGeoJSON(jsonStr);

        if (result.errors.length > 0) {
            // Prefix errors with object index if multiple objects
            const prefix = jsonObjects.length > 1 ? `Object ${String(i + 1)}: ` : '';
            allErrors.push(...result.errors.map(e => ({ ...e, message: prefix + e.message })));
        } else {
            allFeatures.push(...result.features);
        }
    }

    // If we have any features, return them (even if some objects had errors)
    if (allFeatures.length > 0) {
        return {
            features: addFeatureIds(allFeatures),
            errors: allErrors,
            detectedFormat: 'geojson',
        };
    }

    // No features found, return errors
    return {
        features: [],
        errors: allErrors.length > 0 ? allErrors : [{ message: 'No features found in GeoJSON' }],
    };
}

/**
 * Converts any valid GeoJSON object to an array of Features
 */
function geoJsonToFeatures(geojson: GeoJsonObject): Feature[] {
    switch (geojson.type) {
        case 'FeatureCollection':
            return (geojson as FeatureCollection).features;

        case 'Feature':
            return [geojson as Feature];

        case 'Point':
        case 'MultiPoint':
        case 'LineString':
        case 'MultiLineString':
        case 'Polygon':
        case 'MultiPolygon':
        case 'GeometryCollection':
            // Wrap geometry in a Feature
            return [
                {
                    type: 'Feature',
                    geometry: geojson as Geometry,
                    properties: {},
                },
            ];

        default:
            return [];
    }
}

/**
 * Adds unique IDs to features
 */
function addFeatureIds(features: Feature[]): ParsedFeature[] {
    return features.map((feature, index) => ({
        ...feature,
        id: feature.id?.toString() ?? `feature-${String(index)}`,
        properties: feature.properties ?? {},
    })) as ParsedFeature[];
}

/**
 * Formats features as GeoJSON string
 */
export function formatGeoJSON(features: Feature[]): string {
    const featureCollection: FeatureCollection = {
        type: 'FeatureCollection',
        features,
    };
    return JSON.stringify(featureCollection, null, 2);
}

/**
 * Detects if input is likely GeoJSON.
 * Supports multiple concatenated JSON objects.
 */
export function detectGeoJSON(input: string): boolean {
    const trimmed = input.trim();

    // Must start with {
    if (!trimmed.startsWith('{')) {
        return false;
    }

    const geoJsonTypes = [
        'Point',
        'MultiPoint',
        'LineString',
        'MultiLineString',
        'Polygon',
        'MultiPolygon',
        'GeometryCollection',
        'Feature',
        'FeatureCollection',
    ];

    // Try to parse multiple JSON objects
    const jsonObjects = splitJsonObjects(trimmed);

    if (jsonObjects.length === 0) {
        return false;
    }

    // Check if at least the first object is valid GeoJSON
    try {
        const firstJson = jsonObjects[0];
        if (!firstJson) {
            return false;
        }

        const parsed = JSON.parse(firstJson) as { type?: string };
        return typeof parsed.type === 'string' && geoJsonTypes.includes(parsed.type);
    } catch {
        return false;
    }
}

export const geojsonParser = {
    name: 'geojson' as FormatType,
    parse: parseGeoJSON,
    format: formatGeoJSON,
    detect: detectGeoJSON,
};
