import type { Feature } from 'geojson';
import type { ParseResult, ParsedFeature, FormatType } from '@/types';
import { parseDsv } from '@/lib/utils/string';

/**
 * Parses CSV/DSV input into point features.
 * Supports multiple formats:
 * - Simple pairs: "lon,lat" or "lat,lon"
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
                errors: [{ message: 'Odd number of coordinates - expected pairs of lon,lat or lat,lon' }],
            };
        }

        // Determine coordinate order:
        // - For WGS84-like values, try to detect lat,lon vs lon,lat
        // - For projected coordinates (like BNG), use x,y order (first=x/easting, second=y/northing)
        const first = numbers[0] ?? 0;
        const second = numbers[1] ?? 0;

        // Check if values look like WGS84
        const firstLooksLikeWGS84 = Math.abs(first) <= 180;
        const secondLooksLikeWGS84 = Math.abs(second) <= 180;
        const looksLikeWGS84 = firstLooksLikeWGS84 && secondLooksLikeWGS84;

        // For WGS84-like values, try to determine lat,lon vs lon,lat
        // Only swap if second value is clearly out of latitude range but first is valid latitude
        const isLatLon = looksLikeWGS84 && !isValidLatitude(second) && isValidLatitude(first) && isValidLongitude(second);

        const features: ParsedFeature[] = [];

        for (let i = 0; i < numbers.length; i += 2) {
            const a = numbers[i] ?? 0;
            const b = numbers[i + 1] ?? 0;

            // For WGS84-like coords, potentially swap lat/lon
            // For projected coords (like BNG), keep as x,y (which maps to lon,lat in GeoJSON)
            const lon = isLatLon ? b : a;
            const lat = isLatLon ? a : b;

            // Don't validate here - projection detection and validation happens later
            // This allows BNG and other projected coordinates to pass through

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
 * Checks if a value is a valid latitude (-90 to 90)
 */
function isValidLatitude(value: number): boolean {
    return value >= -90 && value <= 90;
}

/**
 * Checks if a value is a valid longitude (-180 to 180)
 */
function isValidLongitude(value: number): boolean {
    return value >= -180 && value <= 180;
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
