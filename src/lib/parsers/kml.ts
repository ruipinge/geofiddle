import { kml as kmlToGeoJSON } from '@mapbox/togeojson';
import type { Feature } from 'geojson';
import type { ParseResult, ParsedFeature, FormatType } from '@/types';

/**
 * Parses KML string into GeoJSON features
 */
export function parseKml(input: string): ParseResult {
    const trimmed = input.trim();

    if (!trimmed) {
        return {
            features: [],
            errors: [],
            detectedFormat: 'kml',
        };
    }

    try {
        // Parse XML string into DOM
        const parser = new DOMParser();
        const doc = parser.parseFromString(trimmed, 'text/xml');

        // Check for parse errors
        const parseError = doc.querySelector('parsererror');
        if (parseError) {
            return {
                features: [],
                errors: [{ message: 'Invalid XML: ' + parseError.textContent }],
            };
        }

        // Convert KML to GeoJSON
        const geojson = kmlToGeoJSON(doc);

        if (geojson.features.length === 0) {
            return {
                features: [],
                errors: [{ message: 'No features found in KML' }],
            };
        }

        // Add IDs to features
        const features: ParsedFeature[] = geojson.features.map((feature, index) => {
            const props = feature.properties ?? {};
            const name = typeof props['name'] === 'string' ? props['name'] : undefined;
            const description = typeof props['description'] === 'string' ? props['description'] : undefined;
            return {
                type: 'Feature' as const,
                id: feature.id?.toString() ?? `feature-${String(index)}`,
                geometry: feature.geometry,
                properties: {
                    ...props,
                    name,
                    description,
                },
            };
        });

        return {
            features,
            errors: [],
            detectedFormat: 'kml',
            detectedProjection: 'EPSG:4326', // KML is always WGS84
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
