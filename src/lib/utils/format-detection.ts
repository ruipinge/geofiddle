import type { FormatType, ProjectionType } from '@/types';
import { detectFormat as detectParserFormat } from '@/lib/parsers';

/**
 * Auto-detects the format of geometry input
 */
export function detectFormat(input: string): FormatType | null {
    const trimmed = input.trim();

    if (!trimmed) {
        return null;
    }

    // Use parser-based detection
    const parserFormat = detectParserFormat(trimmed);
    if (parserFormat) {
        return parserFormat;
    }

    // Additional heuristic-based detection for formats not yet implemented
    // WKT detection
    if (isWKTLike(trimmed)) {
        return 'wkt';
    }

    // EWKT detection (has SRID prefix)
    if (trimmed.toUpperCase().startsWith('SRID=')) {
        return 'ewkt';
    }

    // CSV/DSV detection (contains comma or semicolon separated numbers)
    if (isDSVLike(trimmed)) {
        return 'csv';
    }

    // KML detection
    if (trimmed.includes('<kml') || trimmed.includes('<Placemark')) {
        return 'kml';
    }

    // GPX detection
    if (trimmed.includes('<gpx') || trimmed.includes('<trkpt')) {
        return 'gpx';
    }

    // Polyline detection (encoded string)
    if (isPolylineLike(trimmed)) {
        return 'polyline5'; // Default to precision 5
    }

    return null;
}

/**
 * Auto-detects projection from EWKT SRID or coordinate ranges
 */
export function detectProjection(
    input: string,
    format?: FormatType | null
): ProjectionType | null {
    const trimmed = input.trim().toUpperCase();

    // EWKT SRID detection
    if (format === 'ewkt' || trimmed.startsWith('SRID=')) {
        const sridMatch = /SRID=(\d+)/i.exec(trimmed);
        if (sridMatch?.[1]) {
            const srid = parseInt(sridMatch[1], 10);
            switch (srid) {
                case 4326:
                    return 'EPSG:4326';
                case 3857:
                    return 'EPSG:3857';
                case 27700:
                    return 'EPSG:27700';
            }
        }
    }

    // Heuristic: Try to detect from coordinate values
    // BNG (UK) typically has coordinates in range: E 0-700000, N 0-1300000
    // WGS84 lat/lon: lat -90 to 90, lon -180 to 180

    return null; // Default to null (auto)
}

/**
 * Checks if input looks like WKT
 */
function isWKTLike(input: string): boolean {
    const wktTypes = [
        'POINT',
        'LINESTRING',
        'POLYGON',
        'MULTIPOINT',
        'MULTILINESTRING',
        'MULTIPOLYGON',
        'GEOMETRYCOLLECTION',
    ];

    const upper = input.toUpperCase();
    return wktTypes.some((type) => upper.startsWith(type));
}

/**
 * Checks if input looks like DSV (comma/semicolon/space separated numbers)
 */
function isDSVLike(input: string): boolean {
    // Should be mostly numbers and delimiters
    const cleaned = input.replace(/[\s,;|]/g, '');
    const numericPattern = /^-?\d+\.?\d*(-?\d+\.?\d*)*$/;
    return numericPattern.test(cleaned);
}

/**
 * Checks if input looks like an encoded polyline
 */
function isPolylineLike(input: string): boolean {
    // Encoded polylines use characters in ASCII range 63-126
    // They typically don't contain spaces or common punctuation
    if (input.includes(' ') || input.includes(',')) {
        return false;
    }

    // Check if all characters are in the valid polyline encoding range
    return /^[A-Za-z0-9_~\\`@?>=<;:]+$/.test(input);
}
