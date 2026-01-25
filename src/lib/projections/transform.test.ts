import { describe, it, expect } from 'vitest';
import { transformCoordinate, transformGeometry, detectProjectionFromCoordinates } from './transform';
import type { Geometry } from 'geojson';

describe('transformCoordinate', () => {
    it('should return same coordinate when source equals target', () => {
        const coord = [-0.1276, 51.5074];
        const result = transformCoordinate(coord, 'EPSG:4326', 'EPSG:4326');
        expect(result).toEqual(coord);
    });

    it('should transform BNG to WGS84', () => {
        // Trafalgar Square: ~530000, 180000 in BNG
        const bng = [530000, 180000];
        const result = transformCoordinate(bng, 'EPSG:27700', 'EPSG:4326');
        // Should be roughly -0.128, 51.508
        expect(result[0]).toBeCloseTo(-0.128, 1);
        expect(result[1]).toBeCloseTo(51.508, 1);
    });

    it('should transform WGS84 to BNG', () => {
        // Use exact coordinates from BNG->WGS84 round trip
        const wgs84 = [-0.1276, 51.5074]; // London
        const result = transformCoordinate(wgs84, 'EPSG:4326', 'EPSG:27700');
        // Should be positive easting/northing in BNG range
        expect(result[0]).toBeGreaterThan(0);
        expect(result[0]).toBeLessThan(700000);
        expect(result[1]).toBeGreaterThan(0);
        expect(result[1]).toBeLessThan(1300000);
    });

    it('should preserve z coordinate', () => {
        const coord = [530000, 180000, 100];
        const result = transformCoordinate(coord, 'EPSG:27700', 'EPSG:4326');
        expect(result[2]).toBe(100);
    });
});

describe('transformGeometry', () => {
    it('should transform a Point', () => {
        const point: Geometry = {
            type: 'Point',
            coordinates: [530000, 180000],
        };
        const result = transformGeometry(point, 'EPSG:27700', 'EPSG:4326');
        expect(result.type).toBe('Point');
        if (result.type === 'Point') {
            expect(result.coordinates[0]).toBeCloseTo(-0.128, 1);
            expect(result.coordinates[1]).toBeCloseTo(51.508, 1);
        }
    });

    it('should transform a LineString', () => {
        const line: Geometry = {
            type: 'LineString',
            coordinates: [
                [530000, 180000],
                [531000, 181000],
            ],
        };
        const result = transformGeometry(line, 'EPSG:27700', 'EPSG:4326');
        expect(result.type).toBe('LineString');
        if (result.type === 'LineString') {
            expect(result.coordinates).toHaveLength(2);
            expect(result.coordinates[0]?.[0]).toBeCloseTo(-0.128, 1);
        }
    });

    it('should transform a Polygon', () => {
        const polygon: Geometry = {
            type: 'Polygon',
            coordinates: [
                [
                    [530000, 180000],
                    [531000, 180000],
                    [531000, 181000],
                    [530000, 181000],
                    [530000, 180000],
                ],
            ],
        };
        const result = transformGeometry(polygon, 'EPSG:27700', 'EPSG:4326');
        expect(result.type).toBe('Polygon');
        if (result.type === 'Polygon') {
            expect(result.coordinates[0]).toHaveLength(5);
        }
    });
});

describe('detectProjectionFromCoordinates', () => {
    it('should detect WGS84 coordinates', () => {
        const coords = [
            [-0.1276, 51.5074],
            [-0.1, 51.5],
        ];
        expect(detectProjectionFromCoordinates(coords)).toBe('EPSG:4326');
    });

    it('should detect BNG coordinates', () => {
        const coords = [
            [530000, 180000],
            [531000, 181000],
        ];
        expect(detectProjectionFromCoordinates(coords)).toBe('EPSG:27700');
    });

    it('should return WGS84 for empty array', () => {
        expect(detectProjectionFromCoordinates([])).toBe('EPSG:4326');
    });

    it('should detect BNG for large positive coordinates', () => {
        const coords = [
            [400000, 300000],
            [450000, 350000],
        ];
        expect(detectProjectionFromCoordinates(coords)).toBe('EPSG:27700');
    });
});
