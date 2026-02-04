import { parse } from '@/lib/parsers';
import { detectFormat, detectProjection } from '@/lib/utils/format-detection';
import { detectProjectionFromCoordinates } from '@/lib/projections';
import type { FormatType, ParsedFeature, ProjectionType } from '@/types';
import type { Geometry, Position } from 'geojson';

// Helper to extract coordinates from features for projection detection
function extractCoordsFromFeatures(features: ParsedFeature[]): Position[] {
    const coords: Position[] = [];

    const extractFromGeometry = (geometry: Geometry | null): void => {
        if (!geometry) {return;}

        if (geometry.type === 'GeometryCollection') {
            for (const g of geometry.geometries) {
                extractFromGeometry(g);
            }
            return;
        }

        const extractFromCoords = (c: unknown): void => {
            if (Array.isArray(c)) {
                if (typeof c[0] === 'number' && typeof c[1] === 'number') {
                    coords.push(c as Position);
                } else {
                    for (const item of c) {
                        extractFromCoords(item);
                    }
                }
            }
        };

        if ('coordinates' in geometry) {
            extractFromCoords(geometry.coordinates);
        }
    };

    for (const feature of features) {
        extractFromGeometry(feature.geometry);
    }

    return coords;
}

export interface ParserRequest {
    id: number;
    rawText: string;
    inputFormat: FormatType | 'auto';
    inputProjection: ProjectionType | 'auto';
}

export interface ParserResponse {
    id: number;
    features: ParsedFeature[];
    parseError: string | null;
    detectedFormat: FormatType | null;
    detectedProjection: ProjectionType | null;
}

self.onmessage = async (e: MessageEvent<ParserRequest>) => {
    const { id, rawText, inputFormat, inputProjection } = e.data;

    if (!rawText.trim()) {
        const response: ParserResponse = {
            id,
            features: [],
            parseError: null,
            detectedFormat: null,
            detectedProjection: null,
        };
        self.postMessage(response);
        return;
    }

    // Determine format to use
    let formatToUse: FormatType | null = null;
    let detectedFormat: FormatType | null = null;

    if (inputFormat === 'auto') {
        formatToUse = detectFormat(rawText);
        detectedFormat = formatToUse;
    } else {
        formatToUse = inputFormat;
    }

    if (!formatToUse) {
        const response: ParserResponse = {
            id,
            features: [],
            parseError: 'Could not auto-detect format. Please select a format manually.',
            detectedFormat: null,
            detectedProjection: null,
        };
        self.postMessage(response);
        return;
    }

    // Detect projection if auto
    let detectedProjection: ProjectionType | null = null;
    if (inputProjection === 'auto') {
        detectedProjection = detectProjection(rawText, formatToUse);
    }

    // Parse the input
    try {
        const result = await parse(rawText, formatToUse);

        // If no projection detected from format, detect from coordinates
        let finalProjection = detectedProjection ?? result.detectedProjection ?? null;
        if (inputProjection === 'auto' && !finalProjection && result.features.length > 0) {
            const coords = extractCoordsFromFeatures(result.features);
            if (coords.length > 0) {
                finalProjection = detectProjectionFromCoordinates(coords);
            }
        }

        const response: ParserResponse = {
            id,
            features: result.features,
            parseError: result.errors.length > 0
                ? result.errors.map((err) => err.message).join('\n')
                : null,
            detectedFormat,
            detectedProjection: finalProjection,
        };
        self.postMessage(response);
    } catch (err) {
        const response: ParserResponse = {
            id,
            features: [],
            parseError: err instanceof Error ? err.message : 'Parsing failed',
            detectedFormat,
            detectedProjection,
        };
        self.postMessage(response);
    }
};
