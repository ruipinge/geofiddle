import { geojsonParser } from './geojson';
import type { FormatType, ParseResult, FormatParser } from '@/types';

// Parser registry - maps format names to parser implementations
const parsers: Partial<Record<FormatType, FormatParser>> = {
    geojson: geojsonParser,
    // Additional parsers will be added here:
    // wkt: wktParser,
    // ewkt: ewktParser,
    // csv: csvParser,
    // kml: kmlParser,
    // gpx: gpxParser,
    // polyline5: polyline5Parser,
    // polyline6: polyline6Parser,
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
    formatType: FormatType
): string {
    const parser = parsers[formatType];

    if (!parser) {
        throw new Error(`Unsupported format: ${formatType}`);
    }

    return parser.format(features);
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

export { geojsonParser };
