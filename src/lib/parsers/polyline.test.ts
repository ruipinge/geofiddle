import { describe, it, expect } from 'vitest';
import {
    decodePolyline,
    encodePolyline,
    polyline5Parser,
    polyline6Parser,
} from './polyline';

describe('decodePolyline', () => {
    it('should decode a simple polyline', () => {
        // Encoded line from (38.5, -120.2) to (40.7, -120.95) to (43.252, -126.453)
        const encoded = '_p~iF~ps|U_ulLnnqC_mqNvxq`@';
        const coords = decodePolyline(encoded, 5);

        expect(coords).toHaveLength(3);
        expect(coords[0]?.[1]).toBeCloseTo(38.5, 4);
        expect(coords[0]?.[0]).toBeCloseTo(-120.2, 4);
    });

    it('should decode with precision 6', () => {
        const encoded = '_izlhA~rlgdF_{geC~ywl@_kwzCn`{nI';
        const coords = decodePolyline(encoded, 6);

        expect(coords).toHaveLength(3);
        expect(coords[0]?.[1]).toBeCloseTo(38.5, 5);
        expect(coords[0]?.[0]).toBeCloseTo(-120.2, 5);
    });

    it('should return empty array for empty input', () => {
        const coords = decodePolyline('', 5);
        expect(coords).toEqual([]);
    });
});

describe('encodePolyline', () => {
    it('should encode coordinates to polyline', () => {
        const coords: [number, number][] = [
            [-120.2, 38.5],
            [-120.95, 40.7],
            [-126.453, 43.252],
        ];
        const encoded = encodePolyline(coords, 5);

        // Decode and verify round-trip
        const decoded = decodePolyline(encoded, 5);
        expect(decoded).toHaveLength(3);
        expect(decoded[0]?.[0]).toBeCloseTo(-120.2, 4);
        expect(decoded[0]?.[1]).toBeCloseTo(38.5, 4);
    });

    it('should round-trip with precision 6', () => {
        const coords: [number, number][] = [
            [-120.2, 38.5],
            [-120.95, 40.7],
        ];
        const encoded = encodePolyline(coords, 6);
        const decoded = decodePolyline(encoded, 6);

        expect(decoded).toHaveLength(2);
        expect(decoded[0]?.[0]).toBeCloseTo(-120.2, 5);
        expect(decoded[0]?.[1]).toBeCloseTo(38.5, 5);
    });

    it('should return empty string for empty input', () => {
        const encoded = encodePolyline([], 5);
        expect(encoded).toBe('');
    });
});

describe('polyline5Parser', () => {
    it('should parse polyline into LineString feature', () => {
        const encoded = '_p~iF~ps|U_ulLnnqC_mqNvxq`@';
        const result = polyline5Parser.parse(encoded);

        expect(result.errors).toEqual([]);
        expect(result.features).toHaveLength(1);
        const geom = result.features[0]?.geometry;
        expect(geom?.type).toBe('LineString');
    });

    it('should detect projection as WGS84', () => {
        const encoded = '_p~iF~ps|U_ulLnnqC';
        const result = polyline5Parser.parse(encoded);

        expect(result.detectedProjection).toBe('EPSG:4326');
    });

    it('should format features as polyline', () => {
        const features = [
            {
                type: 'Feature' as const,
                geometry: {
                    type: 'LineString' as const,
                    coordinates: [
                        [-120.2, 38.5],
                        [-120.95, 40.7],
                    ],
                },
                properties: {},
            },
        ];
        const encoded = polyline5Parser.format(features);

        // Should be non-empty polyline string
        expect(encoded.length).toBeGreaterThan(0);
        expect(encoded).not.toContain(' ');
    });

    it('should detect valid polyline', () => {
        expect(polyline5Parser.detect('_p~iF~ps|U_ulLnnqC')).toBe(true);
    });

    it('should not detect JSON', () => {
        expect(polyline5Parser.detect('{"type": "Point"}')).toBe(false);
    });

    it('should not detect WKT', () => {
        expect(polyline5Parser.detect('POINT(0 0)')).toBe(false);
    });

    it('should not detect CSV', () => {
        expect(polyline5Parser.detect('0,0,1,1')).toBe(false);
    });
});

describe('polyline6Parser', () => {
    it('should parse with higher precision', () => {
        const coords: [number, number][] = [
            [-120.2, 38.5],
            [-120.95, 40.7],
        ];
        const encoded = encodePolyline(coords, 6);
        const result = polyline6Parser.parse(encoded);

        expect(result.errors).toEqual([]);
        expect(result.features).toHaveLength(1);

        const geom = result.features[0]?.geometry;
        if (geom?.type === 'LineString') {
            expect(geom.coordinates[0]?.[0]).toBeCloseTo(-120.2, 5);
        }
    });

    it('should detect polyline6 encoded string', () => {
        // Encode with precision 6
        const coords: [number, number][] = [
            [-120.2, 38.5],
            [-120.95, 40.7],
        ];
        const encoded = encodePolyline(coords, 6);

        // Should be detected as polyline6
        expect(polyline6Parser.detect(encoded)).toBe(true);

        // When decoded as polyline5, coords would be 10x larger and out of range
        // So polyline5 should NOT detect this
        expect(polyline5Parser.detect(encoded)).toBe(false);
    });
});

describe('polyline detection precedence', () => {
    it('should detect polyline6 string as polyline6 (coords out of range when decoded as polyline5)', () => {
        // A polyline6 string, when decoded as polyline5, gives 10x larger values
        // E.g., lat 38.5 encoded as polyline6 → decoded as polyline5 → 385 (invalid!)
        const coords: [number, number][] = [
            [-120.2, 38.5],
            [-120.95, 40.7],
        ];
        const encoded = encodePolyline(coords, 6);

        expect(polyline6Parser.detect(encoded)).toBe(true);
        expect(polyline5Parser.detect(encoded)).toBe(false);
    });

    it('should not detect invalid strings as polyline', () => {
        // String with characters outside polyline range
        expect(polyline5Parser.detect('hello world')).toBe(false);
        expect(polyline6Parser.detect('hello world')).toBe(false);

        // JSON
        expect(polyline5Parser.detect('{"type":"Point"}')).toBe(false);
        expect(polyline6Parser.detect('{"type":"Point"}')).toBe(false);

        // CSV
        expect(polyline5Parser.detect('1,2,3,4')).toBe(false);
        expect(polyline6Parser.detect('1,2,3,4')).toBe(false);
    });
});
