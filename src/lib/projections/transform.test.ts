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
    it('should return WGS84 for empty array', () => {
        expect(detectProjectionFromCoordinates([])).toBe('EPSG:4326');
    });

    // WGS84 detection (maxAbs <= 180)
    describe('WGS84 detection', () => {
        it('should detect typical WGS84 coordinates', () => {
            const coords = [
                [-0.1276, 51.5074],
                [-0.1, 51.5],
            ];
            expect(detectProjectionFromCoordinates(coords)).toBe('EPSG:4326');
        });

        it('should detect WGS84 when max is exactly 180', () => {
            const coords = [[180, 90]];
            expect(detectProjectionFromCoordinates(coords)).toBe('EPSG:4326');
        });

        it('should detect WGS84 for small coordinates like 50,50', () => {
            const coords = [[50, 50]];
            expect(detectProjectionFromCoordinates(coords)).toBe('EPSG:4326');
        });

        it('should detect WGS84 for coordinates like 100,80', () => {
            const coords = [[100, 80]];
            expect(detectProjectionFromCoordinates(coords)).toBe('EPSG:4326');
        });
    });

    // BNG detection (180 < maxAbs <= 1,300,000)
    describe('BNG detection', () => {
        it('should detect BNG for typical BNG coordinates', () => {
            const coords = [
                [530000, 180000],
                [531000, 181000],
            ];
            expect(detectProjectionFromCoordinates(coords)).toBe('EPSG:27700');
        });

        it('should detect BNG for large positive coordinates', () => {
            const coords = [
                [400000, 300000],
                [450000, 350000],
            ];
            expect(detectProjectionFromCoordinates(coords)).toBe('EPSG:27700');
        });

        it('should detect BNG when maxAbs is 200 (just over WGS84 threshold)', () => {
            const coords = [[100, 200]];
            expect(detectProjectionFromCoordinates(coords)).toBe('EPSG:27700');
        });

        it('should detect BNG for coordinates like 400000,50', () => {
            // Max is 400000, so BNG even though one value is small
            const coords = [[400000, 50]];
            expect(detectProjectionFromCoordinates(coords)).toBe('EPSG:27700');
        });

        it('should detect BNG for 40000,40000', () => {
            const coords = [[40000, 40000]];
            expect(detectProjectionFromCoordinates(coords)).toBe('EPSG:27700');
        });
    });

    // Web Mercator detection (1,300,000 < maxAbs <= 20,037,508)
    describe('Web Mercator detection', () => {
        it('should detect Web Mercator for typical web mercator coordinates', () => {
            const coords = [[-14000000, 6700000]];
            expect(detectProjectionFromCoordinates(coords)).toBe('EPSG:3857');
        });

        it('should detect Web Mercator when maxAbs exceeds BNG range', () => {
            const coords = [[2000000, 500000]];
            expect(detectProjectionFromCoordinates(coords)).toBe('EPSG:3857');
        });

        it('should detect Web Mercator for coordinates near max extent', () => {
            const coords = [[20000000, 10000000]];
            expect(detectProjectionFromCoordinates(coords)).toBe('EPSG:3857');
        });
    });

    // Edge cases
    describe('edge cases', () => {
        it('should default to WGS84 for coordinates beyond Web Mercator range', () => {
            const coords = [[50000000, 50000000]];
            expect(detectProjectionFromCoordinates(coords)).toBe('EPSG:4326');
        });

        it('should use maximum absolute value from all coordinates', () => {
            // First coord looks like WGS84, but second has large value
            const coords = [
                [0, 0],
                [500000, 100],
            ];
            expect(detectProjectionFromCoordinates(coords)).toBe('EPSG:27700');
        });

        it('should handle negative coordinates correctly', () => {
            // Negative values - use absolute value
            const coords = [[-500000, -200000]];
            expect(detectProjectionFromCoordinates(coords)).toBe('EPSG:27700');
        });
    });
});
