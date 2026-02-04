import type { Feature, Geometry } from 'geojson';
import type { FormatType, ProjectionType } from '@/types';
import { format as formatGeometry, parse, detectFormat } from '@/lib/parsers';
import { transformGeometry } from '@/lib/projections';

interface AppendGeometryOptions {
    geometry: Geometry;
    rawText: string;
    inputFormat: FormatType | 'auto';
    inputProjection: ProjectionType | 'auto';
    detectedFormat: FormatType | null;
    detectedProjection: ProjectionType | null;
}

interface AppendGeometryResult {
    newText: string;
    effectiveFormat: FormatType;
    effectiveProjection: ProjectionType;
}

/**
 * Appends a drawn geometry to the input text.
 * - Determines effective format/projection from input settings or detection
 * - Transforms geometry from WGS84 to target projection if needed
 * - Formats and appends in a format-appropriate way
 */
export async function appendGeometry(options: AppendGeometryOptions): Promise<AppendGeometryResult> {
    const {
        geometry,
        rawText,
        inputFormat,
        inputProjection,
        detectedFormat,
        detectedProjection,
    } = options;

    // Determine effective format (prefer explicit selection, then detected, then default)
    const effectiveFormat: FormatType =
        inputFormat !== 'auto' ? inputFormat :
        detectedFormat ?? 'geojson';

    // Determine effective projection (prefer explicit selection, then detected, then default)
    const effectiveProjection: ProjectionType =
        inputProjection !== 'auto' ? inputProjection :
        detectedProjection ?? 'EPSG:4326';

    // Transform geometry from WGS84 (map coordinates) to target projection
    const transformedGeometry = effectiveProjection !== 'EPSG:4326'
        ? transformGeometry(geometry, 'EPSG:4326', effectiveProjection)
        : geometry;

    // Create feature from geometry
    const newFeature: Feature = {
        type: 'Feature',
        geometry: transformedGeometry,
        properties: {},
    };

    // If no existing text, just format the new geometry
    const trimmedText = rawText.trim();
    if (!trimmedText) {
        return {
            newText: formatGeometry([newFeature], effectiveFormat, { projection: effectiveProjection }),
            effectiveFormat,
            effectiveProjection,
        };
    }

    // Try to parse existing text to combine with new geometry
    const parseResult = await parse(trimmedText, effectiveFormat);

    // If parsing succeeds and we have features, combine them
    if (parseResult.features.length > 0) {
        const allFeatures = [...parseResult.features, newFeature];
        return {
            newText: formatGeometry(allFeatures, effectiveFormat, { projection: effectiveProjection }),
            effectiveFormat,
            effectiveProjection,
        };
    }

    // Parsing failed - check if it's a different format
    const actualFormat = detectFormat(trimmedText);
    if (actualFormat && actualFormat !== effectiveFormat) {
        // Try parsing with detected format and combining
        const actualParseResult = await parse(trimmedText, actualFormat);
        if (actualParseResult.features.length > 0) {
            const allFeatures = [...actualParseResult.features, newFeature];
            return {
                newText: formatGeometry(allFeatures, actualFormat, { projection: effectiveProjection }),
                effectiveFormat: actualFormat,
                effectiveProjection,
            };
        }
    }

    // If we still can't parse, replace with new geometry
    return {
        newText: formatGeometry([newFeature], effectiveFormat, { projection: effectiveProjection }),
        effectiveFormat,
        effectiveProjection,
    };
}
