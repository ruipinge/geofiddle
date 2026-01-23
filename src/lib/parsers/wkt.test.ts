import { describe, it, expect } from 'vitest';
import {
    parseWkt,
    parseEwkt,
    formatWkt,
    formatEwkt,
    detectWkt,
    detectEwkt,
    ewktParser,
} from './wkt';

describe('parseWkt', () => {
    it('should return empty features for empty input', () => {
        const result = parseWkt('');
        expect(result.features).toEqual([]);
        expect(result.errors).toEqual([]);
    });

    it('should parse a POINT', () => {
        const result = parseWkt('POINT(0 1)');
        expect(result.errors).toEqual([]);
        expect(result.features).toHaveLength(1);
        const geom = result.features[0]?.geometry;
        expect(geom?.type).toBe('Point');
    });

    it('should parse a LINESTRING', () => {
        const result = parseWkt('LINESTRING(0 0, 1 1, 2 2)');
        expect(result.errors).toEqual([]);
        expect(result.features).toHaveLength(1);
        const geom = result.features[0]?.geometry;
        expect(geom?.type).toBe('LineString');
    });

    it('should parse a POLYGON', () => {
        const result = parseWkt('POLYGON((0 0, 1 0, 1 1, 0 1, 0 0))');
        expect(result.errors).toEqual([]);
        expect(result.features).toHaveLength(1);
        const geom = result.features[0]?.geometry;
        expect(geom?.type).toBe('Polygon');
    });

    it('should parse multiple WKT separated by double newline', () => {
        const result = parseWkt('POINT(0 0)\n\nPOINT(1 1)');
        expect(result.errors).toEqual([]);
        expect(result.features).toHaveLength(2);
    });

    it('should handle case insensitivity', () => {
        const result = parseWkt('point(0 0)');
        expect(result.errors).toEqual([]);
        expect(result.features).toHaveLength(1);
    });

    it('should add IDs to features', () => {
        const result = parseWkt('POINT(0 0)');
        expect(result.features[0]?.id).toBe('feature-0');
    });
});

describe('parseEwkt', () => {
    it('should parse EWKT with SRID', () => {
        const result = parseEwkt('SRID=4326;POINT(0 0)');
        expect(result.errors).toEqual([]);
        expect(result.features).toHaveLength(1);
        expect(result.detectedProjection).toBe('EPSG:4326');
    });

    it('should detect BNG projection', () => {
        const result = parseEwkt('SRID=27700;POINT(500000 200000)');
        expect(result.detectedProjection).toBe('EPSG:27700');
    });

    it('should detect Web Mercator projection', () => {
        const result = parseEwkt('SRID=3857;POINT(0 0)');
        expect(result.detectedProjection).toBe('EPSG:3857');
    });

    it('should handle case insensitive SRID', () => {
        const result = parseEwkt('srid=4326;POINT(0 0)');
        expect(result.features).toHaveLength(1);
    });
});

describe('formatWkt', () => {
    it('should format features as WKT', () => {
        const features = [
            {
                type: 'Feature' as const,
                geometry: { type: 'Point' as const, coordinates: [0, 1] },
                properties: {},
            },
        ];
        const result = formatWkt(features);
        expect(result).toBe('POINT (0 1)');
    });

    it('should format multiple features separated by double newline', () => {
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
        const result = formatWkt(features);
        expect(result).toContain('POINT (0 0)');
        expect(result).toContain('POINT (1 1)');
        expect(result).toContain('\n\n');
    });
});

describe('formatEwkt', () => {
    it('should format features as EWKT with SRID prefix', () => {
        const features = [
            {
                type: 'Feature' as const,
                geometry: { type: 'Point' as const, coordinates: [0, 1] },
                properties: {},
            },
        ];
        const result = formatEwkt(features, 4326);
        expect(result).toBe('SRID=4326;POINT (0 1)');
    });

    it('should format features as EWKT with BNG SRID', () => {
        const features = [
            {
                type: 'Feature' as const,
                geometry: { type: 'Point' as const, coordinates: [500000, 200000] },
                properties: {},
            },
        ];
        const result = formatEwkt(features, 27700);
        expect(result).toBe('SRID=27700;POINT (500000 200000)');
    });

    it('should format features as EWKT with Web Mercator SRID', () => {
        const features = [
            {
                type: 'Feature' as const,
                geometry: { type: 'Point' as const, coordinates: [0, 0] },
                properties: {},
            },
        ];
        const result = formatEwkt(features, 3857);
        expect(result).toBe('SRID=3857;POINT (0 0)');
    });
});

describe('ewktParser.format', () => {
    const features = [
        {
            type: 'Feature' as const,
            geometry: { type: 'Point' as const, coordinates: [0, 0] },
            properties: {},
        },
    ];

    it('should use SRID=4326 by default', () => {
        const result = ewktParser.format(features);
        expect(result).toBe('SRID=4326;POINT (0 0)');
    });

    it('should use SRID based on projection option', () => {
        expect(ewktParser.format(features, { projection: 'EPSG:4326' })).toBe('SRID=4326;POINT (0 0)');
        expect(ewktParser.format(features, { projection: 'EPSG:3857' })).toBe('SRID=3857;POINT (0 0)');
        expect(ewktParser.format(features, { projection: 'EPSG:27700' })).toBe('SRID=27700;POINT (0 0)');
    });

    it('should fallback to 4326 for unknown projection', () => {
        const result = ewktParser.format(features, { projection: 'EPSG:9999' });
        expect(result).toBe('SRID=4326;POINT (0 0)');
    });
});

describe('detectWkt', () => {
    it('should detect WKT geometry types', () => {
        expect(detectWkt('POINT(0 0)')).toBe(true);
        expect(detectWkt('LINESTRING(0 0, 1 1)')).toBe(true);
        expect(detectWkt('POLYGON((0 0, 1 0, 1 1, 0 0))')).toBe(true);
        expect(detectWkt('MULTIPOINT((0 0), (1 1))')).toBe(true);
    });

    it('should be case insensitive', () => {
        expect(detectWkt('point(0 0)')).toBe(true);
        expect(detectWkt('Point(0 0)')).toBe(true);
    });

    it('should not detect non-WKT', () => {
        expect(detectWkt('{"type": "Point"}')).toBe(false);
        expect(detectWkt('not wkt')).toBe(false);
    });
});

describe('detectEwkt', () => {
    it('should detect EWKT with SRID prefix', () => {
        expect(detectEwkt('SRID=4326;POINT(0 0)')).toBe(true);
        expect(detectEwkt('srid=27700;POLYGON((0 0, 1 0, 1 1, 0 0))')).toBe(true);
    });

    it('should not detect plain WKT', () => {
        expect(detectEwkt('POINT(0 0)')).toBe(false);
    });
});
