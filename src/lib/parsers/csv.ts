import type { Feature } from 'geojson';
import type { ParseResult, ParsedFeature, FormatType } from '@/types';
import { parseDsv } from '@/lib/utils/string';

/**
 * Parses CSV/DSV input into point features.
 * Coordinate order is always: lon (x) first, lat (y) second.
 * Supports:
 * - Simple pairs: "lon,lat"
 * - Multiple points per line: "lon1,lat1,lon2,lat2,..."
 * - DSV with various delimiters: comma, semicolon, space, tab, pipe
 */
export function parseCsv(input: string): ParseResult {
    const trimmed = input.trim();

    if (!trimmed) {
        return {
            features: [],
            errors: [],
            detectedFormat: 'csv',
        };
    }

    try {
        // Try to parse as DSV (delimiter-separated values)
        const numbers = parseDsv(trimmed);

        if (numbers.length === 0) {
            return {
                features: [],
                errors: [{ message: 'No coordinates found in input' }],
            };
        }

        // Must have even number of values (pairs of coordinates)
        if (numbers.length % 2 !== 0) {
            return {
                features: [],
                errors: [{ message: 'Odd number of coordinates - expected pairs of x,y (lon,lat)' }],
            };
        }

        const features: ParsedFeature[] = [];

        // Coordinate order is always: lon (x) first, lat (y) second
        for (let i = 0; i < numbers.length; i += 2) {
            const lon = numbers[i] ?? 0;
            const lat = numbers[i + 1] ?? 0;

            features.push({
                type: 'Feature',
                id: `feature-${String(i / 2)}`,
                geometry: {
                    type: 'Point',
                    coordinates: [lon, lat],
                },
                properties: {
                    index: i / 2,
                },
            });
        }

        return {
            features,
            errors: [],
            detectedFormat: 'csv',
        };
    } catch (e) {
        return {
            features: [],
            errors: [{ message: e instanceof Error ? e.message : 'Failed to parse CSV' }],
        };
    }
}

/**
 * Formats features as CSV (lon,lat pairs)
 */
export function formatCsv(features: Feature[]): string {
    const lines: string[] = [];

    for (const feature of features) {
        const coords = extractCoordinates(feature.geometry);
        for (const [lon, lat] of coords) {
            lines.push(`${String(lon)},${String(lat)}`);
        }
    }

    return lines.join('\n');
}

/**
 * Extracts all coordinate pairs from a geometry
 */
function extractCoordinates(geometry: Feature['geometry']): [number, number][] {
    switch (geometry.type) {
        case 'Point':
            return [[geometry.coordinates[0] ?? 0, geometry.coordinates[1] ?? 0]];

        case 'MultiPoint':
        case 'LineString':
            return geometry.coordinates.map((c) => [c[0] ?? 0, c[1] ?? 0]);

        case 'MultiLineString':
        case 'Polygon':
            return geometry.coordinates.flat().map((c) => [c[0] ?? 0, c[1] ?? 0]);

        case 'MultiPolygon':
            return geometry.coordinates.flat(2).map((c) => [c[0] ?? 0, c[1] ?? 0]);

        case 'GeometryCollection':
            return geometry.geometries.flatMap((g) => extractCoordinates(g));

        default:
            return [];
    }
}

/**
 * Detects if input is likely CSV/DSV coordinate data
 */
export function detectCsv(input: string): boolean {
    const trimmed = input.trim();

    // Skip if it looks like other formats
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
        return false; // JSON
    }
    if (trimmed.toUpperCase().startsWith('POINT') ||
        trimmed.toUpperCase().startsWith('LINESTRING') ||
        trimmed.toUpperCase().startsWith('POLYGON') ||
        trimmed.toUpperCase().startsWith('SRID=')) {
        return false; // WKT/EWKT
    }
    if (trimmed.startsWith('<')) {
        return false; // XML (KML/GPX)
    }

    // Try to parse as numbers
    try {
        const numbers = parseDsv(trimmed);
        // Valid if we have at least 2 numbers (one coordinate pair)
        return numbers.length >= 2 && numbers.length % 2 === 0;
    } catch {
        return false;
    }
}

export const csvParser = {
    name: 'csv' as FormatType,
    parse: parseCsv,
    format: formatCsv,
    detect: detectCsv,
};
