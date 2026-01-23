import { useEffect } from 'react';
import { useGeometryStore } from '@/stores/geometryStore';
import { parse } from '@/lib/parsers';
import { detectFormat, detectProjection } from '@/lib/utils/format-detection';
import type { FormatType } from '@/types';

/**
 * Hook that automatically parses geometry input when it changes
 * and updates the geometry store with features or errors
 */
export function useGeometryParsing(): void {
    const {
        rawText,
        inputFormat,
        inputProjection,
        setFeatures,
        setParseError,
        setDetectedFormat,
        setDetectedProjection,
    } = useGeometryStore();

    useEffect(() => {
        if (!rawText.trim()) {
            setFeatures([]);
            setDetectedFormat(null);
            setDetectedProjection(null);
            return;
        }

        // Determine format to use
        let formatToUse: FormatType | null = null;

        if (inputFormat === 'auto') {
            formatToUse = detectFormat(rawText);
            setDetectedFormat(formatToUse);
        } else {
            formatToUse = inputFormat;
            setDetectedFormat(null);
        }

        if (!formatToUse) {
            setParseError('Could not auto-detect format. Please select a format manually.');
            return;
        }

        // Detect projection if auto
        if (inputProjection === 'auto') {
            const detected = detectProjection(rawText, formatToUse);
            setDetectedProjection(detected);
        } else {
            setDetectedProjection(null);
        }

        // Parse the input
        const result = parse(rawText, formatToUse);

        if (result.errors.length > 0) {
            setParseError(result.errors.map((e) => e.message).join('\n'));
        } else {
            setFeatures(result.features);
        }
    }, [
        rawText,
        inputFormat,
        inputProjection,
        setFeatures,
        setParseError,
        setDetectedFormat,
        setDetectedProjection,
    ]);
}
