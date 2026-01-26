import { describe, it, expect } from 'vitest';
import { parseCsv, formatCsv, detectCsv } from './csv';

describe('parseCsv', () => {
    it('should return empty features for empty input', () => {
        const result = parseCsv('');
        expect(result.features).toEqual([]);
        expect(result.errors).toEqual([]);
    });

    it('should parse comma-separated lon,lat pair', () => {
        const result = parseCsv('-0.1276,51.5074');
        expect(result.errors).toEqual([]);
        expect(result.features).toHaveLength(1);
        const geom = result.features[0]?.geometry;
        expect(geom?.type).toBe('Point');
        if (geom?.type === 'Point') {
            expect(geom.coordinates[0]).toBeCloseTo(-0.1276);
            expect(geom.coordinates[1]).toBeCloseTo(51.5074);
        }
    });

    it('should parse values where second is out of lat range as lat,lon', () => {
        // When second value (120) is outside latitude range but valid as longitude,
        // and first value (45) is valid as latitude, treat as lat,lon
        const result = parseCsv('45,120');
        expect(result.errors).toEqual([]);
        expect(result.features).toHaveLength(1);
        const geom = result.features[0]?.geometry;
        if (geom?.type === 'Point') {
            expect(geom.coordinates[0]).toBeCloseTo(120); // lon
            expect(geom.coordinates[1]).toBeCloseTo(45);  // lat
        }
    });

    it('should parse multiple points', () => {
        const result = parseCsv('-0.1,51.5,-0.2,51.6');
        expect(result.errors).toEqual([]);
        expect(result.features).toHaveLength(2);
    });

    it('should parse space-separated values', () => {
        const result = parseCsv('-0.1 51.5');
        expect(result.errors).toEqual([]);
        expect(result.features).toHaveLength(1);
    });

    it('should parse semicolon-separated values', () => {
        const result = parseCsv('-0.1;51.5');
        expect(result.errors).toEqual([]);
        expect(result.features).toHaveLength(1);
    });

    it('should parse multiline input', () => {
        const result = parseCsv('-0.1,51.5\n-0.2,51.6');
        expect(result.errors).toEqual([]);
        expect(result.features).toHaveLength(2);
    });

    it('should error on odd number of values', () => {
        const result = parseCsv('-0.1,51.5,0');
        expect(result.errors).toHaveLength(1);
        expect(result.features).toEqual([]);
    });

    it('should allow coordinates outside WGS84 range (for projected CRS like BNG)', () => {
        // 0,200 could be valid projected coordinates
        // Validation happens later after projection detection
        const result = parseCsv('0,200');
        expect(result.errors).toHaveLength(0);
        expect(result.features).toHaveLength(1);
    });

    it('should error on non-numeric values', () => {
        const result = parseCsv('abc,def');
        expect(result.errors).toHaveLength(1);
    });
});

describe('formatCsv', () => {
    it('should format points as lon,lat', () => {
        const features = [
            {
                type: 'Feature' as const,
                geometry: { type: 'Point' as const, coordinates: [-0.1276, 51.5074] },
                properties: {},
            },
        ];
        const result = formatCsv(features);
        expect(result).toBe('-0.1276,51.5074');
    });

    it('should format multiple points on separate lines', () => {
        const features = [
            {
                type: 'Feature' as const,
                geometry: { type: 'Point' as const, coordinates: [0, 0] },
                properties: {},
            },
            {
                type: 'Feature' as const,
                geometry: { type: 'Point' as const, coordinates: [1, 1] },
                properties: {},
            },
        ];
        const result = formatCsv(features);
        expect(result).toBe('0,0\n1,1');
    });

    it('should extract coordinates from LineString', () => {
        const features = [
            {
                type: 'Feature' as const,
                geometry: {
                    type: 'LineString' as const,
                    coordinates: [[0, 0], [1, 1], [2, 2]],
                },
                properties: {},
            },
        ];
        const result = formatCsv(features);
        expect(result).toBe('0,0\n1,1\n2,2');
    });
});

describe('detectCsv', () => {
    it('should detect simple coordinate pairs', () => {
        expect(detectCsv('-0.1276,51.5074')).toBe(true);
        expect(detectCsv('0 0')).toBe(true);
        expect(detectCsv('1;2;3;4')).toBe(true);
    });

    it('should not detect JSON', () => {
        expect(detectCsv('{"type": "Point"}')).toBe(false);
        expect(detectCsv('[0, 0]')).toBe(false);
    });

    it('should not detect WKT', () => {
        expect(detectCsv('POINT(0 0)')).toBe(false);
    });

    it('should not detect EWKT', () => {
        expect(detectCsv('SRID=4326;POINT(0 0)')).toBe(false);
    });

    it('should not detect XML', () => {
        expect(detectCsv('<kml>')).toBe(false);
    });

    it('should not detect odd number of values', () => {
        expect(detectCsv('1,2,3')).toBe(false);
    });

    it('should not detect non-numeric', () => {
        expect(detectCsv('hello,world')).toBe(false);
    });
});
