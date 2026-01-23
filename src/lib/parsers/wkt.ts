import { parse as parseWKT, stringify as stringifyWKT } from 'wellknown';
import type { Feature } from 'geojson';
import type { ParseResult, ParsedFeature, FormatType, ProjectionType } from '@/types';

/**
 * Parses WKT string into features
 */
export function parseWkt(input: string): ParseResult {
    const trimmed = input.trim();

    if (!trimmed) {
        return {
            features: [],
            errors: [],
            detectedFormat: 'wkt',
        };
    }

    // Split by double newline for multiple geometries
    const wktStrings = trimmed.split(/\n\s*\n/).filter((s) => s.trim());
    const features: ParsedFeature[] = [];
    const errors: { message: string; line?: number }[] = [];

    for (let i = 0; i < wktStrings.length; i++) {
        const wkt = wktStrings[i]?.trim();
        if (!wkt) {
            continue;
        }

        try {
            const geometry = parseWKT(wkt);
            if (geometry) {
                features.push({
                    type: 'Feature',
                    id: `feature-${String(i)}`,
                    geometry,
                    properties: {},
                });
            } else {
                errors.push({
                    message: `Failed to parse WKT at block ${String(i + 1)}`,
                });
            }
        } catch (e) {
            errors.push({
                message: e instanceof Error ? e.message : `Invalid WKT at block ${String(i + 1)}`,
            });
        }
    }

    return {
        features,
        errors,
        detectedFormat: 'wkt',
    };
}

/**
 * Parses EWKT string (WKT with SRID prefix) into features
 */
export function parseEwkt(input: string): ParseResult {
    const trimmed = input.trim();

    if (!trimmed) {
        return {
            features: [],
            errors: [],
            detectedFormat: 'ewkt',
        };
    }

    // Extract SRID if present
    let detectedProjection: ProjectionType | undefined;
    let wktPart = trimmed;

    const sridMatch = /^SRID=(\d+);/i.exec(trimmed);
    if (sridMatch) {
        const srid = parseInt(sridMatch[1] ?? '0', 10);
        wktPart = trimmed.slice(sridMatch[0].length);

        // Map common SRIDs to projections
        switch (srid) {
            case 4326:
                detectedProjection = 'EPSG:4326';
                break;
            case 3857:
                detectedProjection = 'EPSG:3857';
                break;
            case 27700:
                detectedProjection = 'EPSG:27700';
                break;
        }
    }

    // Parse the WKT part
    const result = parseWkt(wktPart);

    return {
        ...result,
        detectedFormat: 'ewkt',
        detectedProjection,
    };
}

/**
 * Formats features as WKT string
 */
export function formatWkt(features: Feature[]): string {
    return features
        .map((feature) => stringifyWKT(feature.geometry))
        .filter(Boolean)
        .join('\n\n');
}

/**
 * Formats features as EWKT string with SRID prefix
 */
export function formatEwkt(features: Feature[], srid = 4326): string {
    const wkt = formatWkt(features);
    if (!wkt) {
        return '';
    }

    // Add SRID prefix to each WKT
    return wkt
        .split('\n\n')
        .map((w) => `SRID=${String(srid)};${w}`)
        .join('\n\n');
}

/**
 * Detects if input is WKT
 */
export function detectWkt(input: string): boolean {
    const trimmed = input.trim().toUpperCase();
    const wktTypes = [
        'POINT',
        'LINESTRING',
        'POLYGON',
        'MULTIPOINT',
        'MULTILINESTRING',
        'MULTIPOLYGON',
        'GEOMETRYCOLLECTION',
    ];

    return wktTypes.some((type) => trimmed.startsWith(type));
}

/**
 * Detects if input is EWKT (has SRID prefix)
 */
export function detectEwkt(input: string): boolean {
    return /^SRID=\d+;/i.test(input.trim());
}

export const wktParser = {
    name: 'wkt' as FormatType,
    parse: parseWkt,
    format: formatWkt,
    detect: detectWkt,
};

export const ewktParser = {
    name: 'ewkt' as FormatType,
    parse: parseEwkt,
    format: (features: Feature[]) => formatEwkt(features, 4326),
    detect: detectEwkt,
};
