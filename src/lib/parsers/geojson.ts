import { hint } from '@mapbox/geojsonhint';
import type { Feature, FeatureCollection, Geometry, GeoJsonObject } from 'geojson';
import type { ParseResult, ParsedFeature, FormatType } from '@/types';

/**
 * Parses GeoJSON string into features with validation
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

    // Try to parse JSON
    let parsed: unknown;
    try {
        parsed = JSON.parse(trimmed);
    } catch (e) {
        return {
            features: [],
            errors: [
                {
                    message: e instanceof Error ? e.message : 'Invalid JSON',
                },
            ],
        };
    }

    // Validate with geojsonhint
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

    // Convert to features
    const features = geoJsonToFeatures(parsed as GeoJsonObject);

    return {
        features: addFeatureIds(features),
        errors: [],
        detectedFormat: 'geojson',
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
 * Detects if input is likely GeoJSON
 */
export function detectGeoJSON(input: string): boolean {
    const trimmed = input.trim();

    // Must start with { or [
    if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) {
        return false;
    }

    try {
        const parsed = JSON.parse(trimmed) as { type?: string };

        // Check for GeoJSON type property
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
