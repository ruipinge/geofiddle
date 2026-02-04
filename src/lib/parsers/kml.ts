import type { Feature, FeatureCollection } from 'geojson';
import type { ParseResult, ParsedFeature, FormatType } from '@/types';

// Lazy-loaded togeojson module (XMLSerializer not available in all Web Worker contexts)
let kmlToGeoJSON: ((doc: Document) => FeatureCollection) | null = null;

async function getKmlConverter(): Promise<(doc: Document) => FeatureCollection> {
    if (!kmlToGeoJSON) {
        const togeojson = await import('@mapbox/togeojson');
        kmlToGeoJSON = togeojson.kml;
    }
    return kmlToGeoJSON;
}

/**
 * Splits input into multiple KML documents.
 * Handles concatenated KML like: <kml>...</kml><kml>...</kml>
 */
function splitKmlDocuments(input: string): string[] {
    const results: string[] = [];

    // Match complete KML documents (with or without XML declaration)
    // Use a simple approach: split on </kml> and reconstruct
    const parts = input.split(/<\/kml>/i);

    for (const part of parts) {
        const trimmedPart = part.trim();
        if (!trimmedPart) {
            continue;
        }

        // Find the start of a KML document
        const xmlDeclMatch = trimmedPart.match(/<\?xml[^?]*\?>/i);
        const kmlStartMatch = trimmedPart.match(/<kml[^>]*>/i);

        if (kmlStartMatch) {
            // Reconstruct the complete KML document
            const kmlStart = kmlStartMatch.index ?? 0;
            let doc = trimmedPart.slice(kmlStart) + '</kml>';

            // Prepend XML declaration if present
            if (xmlDeclMatch && (xmlDeclMatch.index ?? 0) < kmlStart) {
                doc = xmlDeclMatch[0] + '\n' + doc;
            }

            results.push(doc);
        }
    }

    return results;
}

/**
 * Parses a single KML document and returns features or errors
 */
async function parseSingleKml(kmlStr: string, featureOffset: number): Promise<{ features: ParsedFeature[]; errors: Array<{ message: string }> }> {
    const parser = new DOMParser();
    const doc = parser.parseFromString(kmlStr, 'text/xml');

    const parseError = doc.querySelector('parsererror');
    if (parseError) {
        return {
            features: [],
            errors: [{ message: 'Invalid XML: ' + parseError.textContent }],
        };
    }

    const converter = await getKmlConverter();
    const geojson = converter(doc);

    if (geojson.features.length === 0) {
        return {
            features: [],
            errors: [],
        };
    }

    const features: ParsedFeature[] = geojson.features.map((feature, index) => {
        const props = feature.properties ?? {};
        const name = typeof props['name'] === 'string' ? props['name'] : undefined;
        const description = typeof props['description'] === 'string' ? props['description'] : undefined;
        return {
            type: 'Feature' as const,
            id: feature.id?.toString() ?? `feature-${String(featureOffset + index)}`,
            geometry: feature.geometry,
            properties: {
                ...props,
                name,
                description,
            },
        };
    });

    return { features, errors: [] };
}

/**
 * Parses KML string into GeoJSON features.
 * Supports multiple concatenated KML documents.
 */
export async function parseKml(input: string): Promise<ParseResult> {
    const trimmed = input.trim();

    if (!trimmed) {
        return {
            features: [],
            errors: [],
            detectedFormat: 'kml',
        };
    }

    try {
        // Split into multiple KML documents
        const kmlDocs = splitKmlDocuments(trimmed);

        // If no KML documents found, try parsing as single document
        if (kmlDocs.length === 0) {
            kmlDocs.push(trimmed);
        }

        const allFeatures: ParsedFeature[] = [];
        const allErrors: Array<{ message: string }> = [];

        for (let i = 0; i < kmlDocs.length; i++) {
            const kmlStr = kmlDocs[i];
            if (!kmlStr) {
                continue;
            }

            const result = await parseSingleKml(kmlStr, allFeatures.length);

            if (result.errors.length > 0) {
                const prefix = kmlDocs.length > 1 ? `Document ${String(i + 1)}: ` : '';
                allErrors.push(...result.errors.map(e => ({ message: prefix + e.message })));
            } else {
                allFeatures.push(...result.features);
            }
        }

        if (allFeatures.length > 0) {
            return {
                features: allFeatures,
                errors: allErrors,
                detectedFormat: 'kml',
                detectedProjection: 'EPSG:4326',
            };
        }

        return {
            features: [],
            errors: allErrors.length > 0 ? allErrors : [{ message: 'No features found in KML' }],
        };
    } catch (e) {
        return {
            features: [],
            errors: [{ message: e instanceof Error ? e.message : 'Failed to parse KML' }],
        };
    }
}

/**
 * Formats features as KML string
 */
export function formatKml(features: Feature[]): string {
    const placemarks = features.map((feature, index) => {
        const props = feature.properties;
        const rawName: unknown = props ? props['name'] : undefined;
        const name = typeof rawName === 'string' ? rawName : `Feature ${String(index + 1)}`;
        const geometry = feature.geometry;

        let geometryKml = '';
        if (geometry.type === 'Point') {
            const [lon, lat, alt] = geometry.coordinates;
            geometryKml = `<Point><coordinates>${String(lon)},${String(lat)}${alt !== undefined ? ',' + String(alt) : ''}</coordinates></Point>`;
        } else if (geometry.type === 'LineString') {
            const coords = geometry.coordinates
                .map((c) => `${String(c[0])},${String(c[1])}${c[2] !== undefined ? ',' + String(c[2]) : ''}`)
                .join(' ');
            geometryKml = `<LineString><coordinates>${coords}</coordinates></LineString>`;
        } else if (geometry.type === 'Polygon') {
            const rings = geometry.coordinates.map((ring, ringIndex) => {
                const coords = ring
                    .map((c) => `${String(c[0])},${String(c[1])}${c[2] !== undefined ? ',' + String(c[2]) : ''}`)
                    .join(' ');
                const tag = ringIndex === 0 ? 'outerBoundaryIs' : 'innerBoundaryIs';
                return `<${tag}><LinearRing><coordinates>${coords}</coordinates></LinearRing></${tag}>`;
            }).join('');
            geometryKml = `<Polygon>${rings}</Polygon>`;
        }

        return `<Placemark><name>${escapeXml(name)}</name>${geometryKml}</Placemark>`;
    });

    return `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
<Document>
${placemarks.join('\n')}
</Document>
</kml>`;
}

/**
 * Escapes special XML characters
 */
function escapeXml(str: string): string {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

/**
 * Detects if input is KML format
 */
export function detectKml(input: string): boolean {
    const trimmed = input.trim();

    // Must start with XML declaration or kml tag
    if (!trimmed.startsWith('<?xml') && !trimmed.toLowerCase().startsWith('<kml')) {
        return false;
    }

    // Must contain kml namespace or kml tag
    return /<kml/i.test(trimmed);
}

export const kmlParser = {
    name: 'kml' as FormatType,
    parse: parseKml,
    format: formatKml,
    detect: detectKml,
};
