import { parse } from '@/lib/parsers';
import { detectFormat, detectProjection } from '@/lib/utils/format-detection';
import type { FormatType, ParsedFeature, ProjectionType } from '@/types';

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

self.onmessage = (e: MessageEvent<ParserRequest>) => {
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
        const result = parse(rawText, formatToUse);

        const response: ParserResponse = {
            id,
            features: result.features,
            parseError: result.errors.length > 0
                ? result.errors.map((err) => err.message).join('\n')
                : null,
            detectedFormat,
            detectedProjection: detectedProjection ?? result.detectedProjection ?? null,
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
