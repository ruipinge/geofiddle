import type { Feature, LineString, Position } from 'geojson';
import type { ParseResult, ParsedFeature, FormatType } from '@/types';

/**
 * Decodes a polyline string into an array of [lon, lat] coordinates.
 * Based on Google's Polyline Algorithm.
 *
 * @param encoded - The encoded polyline string
 * @param precision - Number of decimal places (5 for standard, 6 for high precision)
 */
export function decodePolyline(encoded: string, precision = 5): Position[] {
    const factor = Math.pow(10, precision);
    const coordinates: Position[] = [];

    let index = 0;
    let lat = 0;
    let lon = 0;

    while (index < encoded.length) {
        // Decode latitude
        let shift = 0;
        let result = 0;
        let byte: number;

        do {
            byte = encoded.charCodeAt(index++) - 63;
            result |= (byte & 0x1f) << shift;
            shift += 5;
        } while (byte >= 0x20);

        lat += (result & 1) !== 0 ? ~(result >> 1) : result >> 1;

        // Decode longitude
        shift = 0;
        result = 0;

        do {
            byte = encoded.charCodeAt(index++) - 63;
            result |= (byte & 0x1f) << shift;
            shift += 5;
        } while (byte >= 0x20);

        lon += (result & 1) !== 0 ? ~(result >> 1) : result >> 1;

        coordinates.push([lon / factor, lat / factor]);
    }

    return coordinates;
}

/**
 * Encodes an array of [lon, lat] coordinates into a polyline string.
 *
 * @param coordinates - Array of [lon, lat] positions
 * @param precision - Number of decimal places (5 for standard, 6 for high precision)
 */
export function encodePolyline(coordinates: Position[], precision = 5): string {
    const factor = Math.pow(10, precision);
    let encoded = '';
    let prevLat = 0;
    let prevLon = 0;

    for (const coord of coordinates) {
        const lon = coord[0] ?? 0;
        const lat = coord[1] ?? 0;

        const latRounded = Math.round(lat * factor);
        const lonRounded = Math.round(lon * factor);

        encoded += encodeSignedNumber(latRounded - prevLat);
        encoded += encodeSignedNumber(lonRounded - prevLon);

        prevLat = latRounded;
        prevLon = lonRounded;
    }

    return encoded;
}

/**
 * Encodes a signed number using the polyline algorithm.
 */
function encodeSignedNumber(num: number): string {
    let encoded = '';
    let value = num < 0 ? ~(num << 1) : num << 1;

    while (value >= 0x20) {
        encoded += String.fromCharCode((0x20 | (value & 0x1f)) + 63);
        value >>= 5;
    }

    encoded += String.fromCharCode(value + 63);
    return encoded;
}

/**
 * Creates a parser for polyline format with specific precision.
 */
function createPolylineParser(precision: number) {
    const formatName = `polyline${String(precision)}` as FormatType;

    function parse(input: string): ParseResult {
        const trimmed = input.trim();

        if (!trimmed) {
            return {
                features: [],
                errors: [],
                detectedFormat: formatName,
            };
        }

        try {
            const coordinates = decodePolyline(trimmed, precision);

            if (coordinates.length === 0) {
                return {
                    features: [],
                    errors: [{ message: 'No coordinates decoded from polyline' }],
                };
            }

            const geometry: LineString = {
                type: 'LineString',
                coordinates,
            };

            const features: ParsedFeature[] = [
                {
                    type: 'Feature',
                    id: 'feature-0',
                    geometry,
                    properties: {
                        pointCount: coordinates.length,
                    },
                },
            ];

            return {
                features,
                errors: [],
                detectedFormat: formatName,
                detectedProjection: 'EPSG:4326', // Polylines are always WGS84
            };
        } catch (e) {
            return {
                features: [],
                errors: [{ message: e instanceof Error ? e.message : 'Failed to decode polyline' }],
            };
        }
    }

    function format(features: Feature[]): string {
        const allCoordinates: Position[] = [];

        for (const feature of features) {
            const coords = extractCoordinates(feature.geometry);
            allCoordinates.push(...coords);
        }

        if (allCoordinates.length === 0) {
            return '';
        }

        return encodePolyline(allCoordinates, precision);
    }

    function detect(input: string): boolean {
        const trimmed = input.trim();

        // Exclude JSON (starts with { or [)
        if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
            return false;
        }

        // Exclude XML (starts with <)
        if (trimmed.startsWith('<')) {
            return false;
        }

        // Polylines don't contain spaces, commas, semicolons, or colons
        if (/[\s,;:]/.test(trimmed)) {
            return false;
        }

        // Must contain only valid polyline characters (ASCII 63-126)
        if (!/^[?-~]+$/.test(trimmed)) {
            return false;
        }

        // Try to decode - if it produces valid coordinates, it's likely a polyline
        try {
            const coords = decodePolyline(trimmed, precision);
            if (coords.length < 2) {
                return false;
            }

            // Check if coordinates are in valid range
            for (const [lon, lat] of coords) {
                if (lat === undefined || lon === undefined) {
                    return false;
                }
                if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
                    return false;
                }
            }

            return true;
        } catch {
            return false;
        }
    }

    return {
        name: formatName,
        parse,
        format,
        detect,
    };
}

/**
 * Extracts coordinates from any geometry type.
 */
function extractCoordinates(geometry: Feature['geometry']): Position[] {
    switch (geometry.type) {
        case 'Point':
            return [geometry.coordinates];

        case 'MultiPoint':
        case 'LineString':
            return geometry.coordinates;

        case 'MultiLineString':
        case 'Polygon':
            return geometry.coordinates.flat();

        case 'MultiPolygon':
            return geometry.coordinates.flat(2);

        case 'GeometryCollection':
            return geometry.geometries.flatMap((g) => extractCoordinates(g));

        default:
            return [];
    }
}

// Create parsers for precision 5 and 6
export const polyline5Parser = createPolylineParser(5);
export const polyline6Parser = createPolylineParser(6);
