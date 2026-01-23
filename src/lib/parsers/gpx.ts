import { gpx as gpxToGeoJSON } from '@mapbox/togeojson';
import type { Feature } from 'geojson';
import type { ParseResult, ParsedFeature, FormatType } from '@/types';

/**
 * Parses GPX string into GeoJSON features
 */
export function parseGpx(input: string): ParseResult {
    const trimmed = input.trim();

    if (!trimmed) {
        return {
            features: [],
            errors: [],
            detectedFormat: 'gpx',
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

        // Convert GPX to GeoJSON
        const geojson = gpxToGeoJSON(doc);

        if (geojson.features.length === 0) {
            return {
                features: [],
                errors: [{ message: 'No features found in GPX' }],
            };
        }

        // Add IDs to features
        const features: ParsedFeature[] = geojson.features.map((feature, index) => {
            const props = feature.properties ?? {};
            const name = typeof props['name'] === 'string' ? props['name'] : undefined;
            const description = typeof props['desc'] === 'string' ? props['desc'] : undefined;
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
            detectedFormat: 'gpx',
            detectedProjection: 'EPSG:4326', // GPX is always WGS84
        };
    } catch (e) {
        return {
            features: [],
            errors: [{ message: e instanceof Error ? e.message : 'Failed to parse GPX' }],
        };
    }
}

/**
 * Formats features as GPX string
 */
export function formatGpx(features: Feature[]): string {
    const elements: string[] = [];

    for (const feature of features) {
        const props = feature.properties;
        const rawName: unknown = props ? props['name'] : undefined;
        const name = typeof rawName === 'string' ? rawName : '';
        const geometry = feature.geometry;

        if (geometry.type === 'Point') {
            const [lon, lat, ele] = geometry.coordinates;
            elements.push(
                `<wpt lat="${String(lat)}" lon="${String(lon)}">${
                    name ? `<name>${escapeXml(name)}</name>` : ''
                }${ele !== undefined ? `<ele>${String(ele)}</ele>` : ''}</wpt>`
            );
        } else if (geometry.type === 'LineString') {
            const trkpts = geometry.coordinates
                .map((c) => {
                    const [lon, lat, ele] = c;
                    return `<trkpt lat="${String(lat)}" lon="${String(lon)}">${
                        ele !== undefined ? `<ele>${String(ele)}</ele>` : ''
                    }</trkpt>`;
                })
                .join('\n        ');
            elements.push(
                `<trk>${name ? `<name>${escapeXml(name)}</name>` : ''}<trkseg>\n        ${trkpts}\n      </trkseg></trk>`
            );
        } else if (geometry.type === 'MultiLineString') {
            const trksegs = geometry.coordinates
                .map((segment) => {
                    const trkpts = segment
                        .map((c) => {
                            const [lon, lat, ele] = c;
                            return `<trkpt lat="${String(lat)}" lon="${String(lon)}">${
                                ele !== undefined ? `<ele>${String(ele)}</ele>` : ''
                            }</trkpt>`;
                        })
                        .join('\n        ');
                    return `<trkseg>\n        ${trkpts}\n      </trkseg>`;
                })
                .join('\n      ');
            elements.push(`<trk>${name ? `<name>${escapeXml(name)}</name>` : ''}${trksegs}</trk>`);
        }
    }

    return `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="GeoFiddle" xmlns="http://www.topografix.com/GPX/1/1">
  ${elements.join('\n  ')}
</gpx>`;
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
 * Detects if input is GPX format
 */
export function detectGpx(input: string): boolean {
    const trimmed = input.trim();

    // Must start with XML declaration or gpx tag
    if (!trimmed.startsWith('<?xml') && !trimmed.toLowerCase().startsWith('<gpx')) {
        return false;
    }

    // Must contain gpx tag
    return /<gpx/i.test(trimmed);
}

export const gpxParser = {
    name: 'gpx' as FormatType,
    parse: parseGpx,
    format: formatGpx,
    detect: detectGpx,
};
