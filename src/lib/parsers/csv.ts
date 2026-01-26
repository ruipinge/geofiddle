import type { Feature, Position } from 'geojson';
import type { ParseResult, ParsedFeature, FormatType } from '@/types';
import { parseDsvLine, parseDsv } from '@/lib/utils/string';

/**
 * Parses CSV/DSV input into geometry features.
 * Coordinate order is always: lon (x) first, lat (y) second.
 *
 * Rules:
 * - Coordinates on the same line belong to the same geometry
 * - Single coordinate pair per line → Point
 * - Multiple coordinate pairs per line → LineString
 * - If first coord == last coord and >3 coords → Polygon
 *
 * Supports delimiters: comma, semicolon, space, tab, pipe
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
        const lines = trimmed.split(/\r?\n/).filter((line) => line.trim());
        const features: ParsedFeature[] = [];

        for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
            const line = lines[lineIndex];
            if (!line) {continue;}

            const numbers = parseDsvLine(line);

            if (numbers.length === 0) {
                continue;
            }

            // Must have even number of values (pairs of coordinates)
            if (numbers.length % 2 !== 0) {
                return {
                    features: [],
                    errors: [{ message: `Line ${String(lineIndex + 1)}: Odd number of coordinates - expected pairs of x,y (lon,lat)` }],
                };
            }

            // Convert numbers to coordinate pairs [lon, lat]
            const coords: Position[] = [];
            for (let i = 0; i < numbers.length; i += 2) {
                const lon = numbers[i] ?? 0;
                const lat = numbers[i + 1] ?? 0;
                coords.push([lon, lat]);
            }

            // Determine geometry type based on coordinates
            const feature = createFeatureFromCoords(coords, lineIndex);
            features.push(feature);
        }

        if (features.length === 0) {
            return {
                features: [],
                errors: [{ message: 'No coordinates found in input' }],
            };
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
 * Creates a feature from coordinate pairs.
 * - 1 coord → Point
 * - >1 coords, closed ring with >3 coords → Polygon
 * - >1 coords otherwise → LineString
 */
function createFeatureFromCoords(coords: Position[], index: number): ParsedFeature {
    const id = `feature-${String(index)}`;

    if (coords.length === 1) {
        // Single point
        const coord = coords[0];
        if (!coord) {
            throw new Error('Expected coordinate at index 0');
        }
        return {
            type: 'Feature',
            id,
            geometry: {
                type: 'Point',
                coordinates: coord,
            },
            properties: { index },
        };
    }

    // Check if it's a closed ring (first == last) with more than 3 coords
    const first = coords[0];
    const last = coords[coords.length - 1];
    const isClosed = first && last && first[0] === last[0] && first[1] === last[1];
    const isPolygon = isClosed && coords.length > 3;

    if (isPolygon) {
        return {
            type: 'Feature',
            id,
            geometry: {
                type: 'Polygon',
                coordinates: [coords],
            },
            properties: { index },
        };
    }

    // LineString
    return {
        type: 'Feature',
        id,
        geometry: {
            type: 'LineString',
            coordinates: coords,
        },
        properties: { index },
    };
}

/**
 * Formats features as CSV.
 * Each feature is output on a single line.
 * - Point: lon,lat
 * - LineString/Polygon: lon1,lat1,lon2,lat2,...
 */
export function formatCsv(features: Feature[]): string {
    const lines: string[] = [];

    for (const feature of features) {
        const coords = extractCoordinates(feature.geometry);
        if (coords.length > 0) {
            const line = coords.map(([lon, lat]) => `${String(lon)},${String(lat)}`).join(',');
            lines.push(line);
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
