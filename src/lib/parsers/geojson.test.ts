import { describe, it, expect } from 'vitest';
import { parseGeoJSON, formatGeoJSON, detectGeoJSON } from './geojson';

describe('parseGeoJSON', () => {
    it('should return empty features for empty input', () => {
        const result = parseGeoJSON('');
        expect(result.features).toEqual([]);
        expect(result.errors).toEqual([]);
    });

    it('should parse a Point geometry', () => {
        const input = JSON.stringify({
            type: 'Point',
            coordinates: [0, 0],
        });
        const result = parseGeoJSON(input);

        expect(result.errors).toEqual([]);
        expect(result.features).toHaveLength(1);
        const feature = result.features[0];
        expect(feature).toBeDefined();
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        expect(feature?.geometry?.type).toBe('Point');
    });

    it('should parse a Feature', () => {
        const input = JSON.stringify({
            type: 'Feature',
            geometry: {
                type: 'Point',
                coordinates: [0, 0],
            },
            properties: {
                name: 'Test Point',
            },
        });
        const result = parseGeoJSON(input);

        expect(result.errors).toEqual([]);
        expect(result.features).toHaveLength(1);
        const feature = result.features[0];
        expect(feature).toBeDefined();
        expect(feature?.properties.name).toBe('Test Point');
    });

    it('should parse a FeatureCollection', () => {
        const input = JSON.stringify({
            type: 'FeatureCollection',
            features: [
                {
                    type: 'Feature',
                    geometry: { type: 'Point', coordinates: [0, 0] },
                    properties: {},
                },
                {
                    type: 'Feature',
                    geometry: { type: 'Point', coordinates: [1, 1] },
                    properties: {},
                },
            ],
        });
        const result = parseGeoJSON(input);

        expect(result.errors).toEqual([]);
        expect(result.features).toHaveLength(2);
    });

    it('should add IDs to features', () => {
        const input = JSON.stringify({
            type: 'FeatureCollection',
            features: [
                {
                    type: 'Feature',
                    geometry: { type: 'Point', coordinates: [0, 0] },
                    properties: {},
                },
            ],
        });
        const result = parseGeoJSON(input);

        expect(result.features).toHaveLength(1);
        const feature = result.features[0];
        expect(feature).toBeDefined();
        expect(feature?.id).toBe('feature-0');
    });

    it('should preserve existing feature IDs', () => {
        const input = JSON.stringify({
            type: 'FeatureCollection',
            features: [
                {
                    type: 'Feature',
                    id: 'my-id',
                    geometry: { type: 'Point', coordinates: [0, 0] },
                    properties: {},
                },
            ],
        });
        const result = parseGeoJSON(input);

        expect(result.features).toHaveLength(1);
        const feature = result.features[0];
        expect(feature).toBeDefined();
        expect(feature?.id).toBe('my-id');
    });

    it('should return error for invalid JSON', () => {
        const result = parseGeoJSON('not json');

        expect(result.errors).toHaveLength(1);
        expect(result.features).toEqual([]);
    });

    it('should return error for invalid GeoJSON', () => {
        const result = parseGeoJSON('{"type": "Invalid"}');

        expect(result.errors.length).toBeGreaterThan(0);
        expect(result.features).toEqual([]);
    });

    it('should detect format as geojson', () => {
        const input = JSON.stringify({
            type: 'Point',
            coordinates: [0, 0],
        });
        const result = parseGeoJSON(input);

        expect(result.detectedFormat).toBe('geojson');
    });
});

describe('formatGeoJSON', () => {
    it('should format features as FeatureCollection', () => {
        const features = [
            {
                type: 'Feature' as const,
                geometry: { type: 'Point' as const, coordinates: [0, 0] },
                properties: {},
            },
        ];
        const result = formatGeoJSON(features);
        const parsed = JSON.parse(result) as { type: string; features: unknown[] };

        expect(parsed.type).toBe('FeatureCollection');
        expect(parsed.features).toHaveLength(1);
    });

    it('should pretty-print JSON', () => {
        const features = [
            {
                type: 'Feature' as const,
                geometry: { type: 'Point' as const, coordinates: [0, 0] },
                properties: {},
            },
        ];
        const result = formatGeoJSON(features);

        expect(result).toContain('\n');
    });
});

describe('detectGeoJSON', () => {
    it('should detect valid GeoJSON', () => {
        expect(detectGeoJSON('{"type": "Point", "coordinates": [0, 0]}')).toBe(true);
        expect(detectGeoJSON('{"type": "Feature", "geometry": null, "properties": {}}')).toBe(true);
        expect(detectGeoJSON('{"type": "FeatureCollection", "features": []}')).toBe(true);
    });

    it('should not detect non-GeoJSON JSON', () => {
        expect(detectGeoJSON('{"name": "test"}')).toBe(false);
        expect(detectGeoJSON('{"type": "Invalid"}')).toBe(false);
    });

    it('should not detect non-JSON', () => {
        expect(detectGeoJSON('POINT(0 0)')).toBe(false);
        expect(detectGeoJSON('not json')).toBe(false);
    });

    it('should handle whitespace', () => {
        expect(detectGeoJSON('  {"type": "Point", "coordinates": [0, 0]}  ')).toBe(true);
    });
});
