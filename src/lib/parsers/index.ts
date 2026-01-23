import { geojsonParser } from './geojson';
import { wktParser, ewktParser } from './wkt';
import { csvParser } from './csv';
import { polyline5Parser, polyline6Parser } from './polyline';
import { kmlParser } from './kml';
import { gpxParser } from './gpx';
import { shapefileParser } from './shapefile';
import type { FormatType, ParseResult, FormatParser } from '@/types';

// Parser registry - maps format names to parser implementations
// Order matters for detection - more specific formats first
const parsers: Partial<Record<FormatType, FormatParser>> = {
    geojson: geojsonParser,
    ewkt: ewktParser, // Check EWKT before WKT (more specific)
    wkt: wktParser,
    kml: kmlParser,
    gpx: gpxParser,
    shapefile: shapefileParser,
    polyline5: polyline5Parser,
    polyline6: polyline6Parser,
    csv: csvParser, // CSV last as it's the most generic
};

/**
 * Parses input with the specified format
 */
export function parse(input: string, format: FormatType): ParseResult {
    const parser = parsers[format];

    if (!parser) {
        return {
            features: [],
            errors: [{ message: `Unsupported format: ${format}` }],
        };
    }

    return parser.parse(input);
}

/**
 * Formats features to the specified format
 */
export function format(
    features: Parameters<typeof geojsonParser.format>[0],
    formatType: FormatType,
    options?: { projection?: string }
): string {
    const parser = parsers[formatType];

    if (!parser) {
        throw new Error(`Unsupported format: ${formatType}`);
    }

    return parser.format(features, options);
}

/**
 * Auto-detects the format of the input
 */
export function detectFormat(input: string): FormatType | null {
    const trimmed = input.trim();

    if (!trimmed) {
        return null;
    }

    // Check each parser's detection function
    for (const [name, parser] of Object.entries(parsers)) {
        if (parser.detect(trimmed)) {
            return name as FormatType;
        }
    }

    return null;
}

export {
    geojsonParser,
    wktParser,
    ewktParser,
    csvParser,
    polyline5Parser,
    polyline6Parser,
    kmlParser,
    gpxParser,
    shapefileParser,
};
