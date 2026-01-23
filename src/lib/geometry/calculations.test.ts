import { describe, it, expect } from 'vitest';
import {
    calculateArea,
    calculateLength,
    countCoordinates,
    getGeometryTypeLabel,
    formatArea,
    formatLength,
} from './calculations';
import type { Geometry } from 'geojson';

describe('calculateArea', () => {
    it('should return null for points', () => {
        const point: Geometry = { type: 'Point', coordinates: [0, 0] };
        expect(calculateArea(point)).toBeNull();
    });

    it('should return null for linestrings', () => {
        const line: Geometry = {
            type: 'LineString',
            coordinates: [
                [0, 0],
                [1, 1],
            ],
        };
        expect(calculateArea(line)).toBeNull();
    });

    it('should calculate area for polygons', () => {
        // Small square polygon roughly 1km x 1km near equator
        const polygon: Geometry = {
            type: 'Polygon',
            coordinates: [
                [
                    [0, 0],
                    [0.01, 0],
                    [0.01, 0.01],
                    [0, 0.01],
                    [0, 0],
                ],
            ],
        };
        const area = calculateArea(polygon);
        expect(area).not.toBeNull();
        expect(area).toBeGreaterThan(0);
    });

    it('should return null for null geometry', () => {
        expect(calculateArea(null)).toBeNull();
    });
});

describe('calculateLength', () => {
    it('should return null for points', () => {
        const point: Geometry = { type: 'Point', coordinates: [0, 0] };
        expect(calculateLength(point)).toBeNull();
    });

    it('should calculate length for linestrings', () => {
        const line: Geometry = {
            type: 'LineString',
            coordinates: [
                [0, 0],
                [0, 1],
            ],
        };
        const length = calculateLength(line);
        expect(length).not.toBeNull();
        // 1 degree of latitude is roughly 111km
        expect(length).toBeGreaterThan(110000);
        expect(length).toBeLessThan(112000);
    });

    it('should return null for polygons', () => {
        const polygon: Geometry = {
            type: 'Polygon',
            coordinates: [
                [
                    [0, 0],
                    [1, 0],
                    [1, 1],
                    [0, 1],
                    [0, 0],
                ],
            ],
        };
        expect(calculateLength(polygon)).toBeNull();
    });

    it('should return null for null geometry', () => {
        expect(calculateLength(null)).toBeNull();
    });
});

describe('countCoordinates', () => {
    it('should return 1 for point', () => {
        const point: Geometry = { type: 'Point', coordinates: [0, 0] };
        expect(countCoordinates(point)).toBe(1);
    });

    it('should count coordinates in linestring', () => {
        const line: Geometry = {
            type: 'LineString',
            coordinates: [
                [0, 0],
                [1, 1],
                [2, 2],
            ],
        };
        expect(countCoordinates(line)).toBe(3);
    });

    it('should count coordinates in polygon', () => {
        const polygon: Geometry = {
            type: 'Polygon',
            coordinates: [
                [
                    [0, 0],
                    [1, 0],
                    [1, 1],
                    [0, 1],
                    [0, 0],
                ],
            ],
        };
        expect(countCoordinates(polygon)).toBe(5);
    });

    it('should return 0 for null geometry', () => {
        expect(countCoordinates(null)).toBe(0);
    });
});

describe('getGeometryTypeLabel', () => {
    it('should add spaces to camelCase', () => {
        expect(getGeometryTypeLabel('LineString')).toBe('Line String');
        expect(getGeometryTypeLabel('MultiPolygon')).toBe('Multi Polygon');
    });

    it('should return Unknown for undefined', () => {
        expect(getGeometryTypeLabel(undefined)).toBe('Unknown');
    });

    it('should handle simple types', () => {
        expect(getGeometryTypeLabel('Point')).toBe('Point');
        expect(getGeometryTypeLabel('Polygon')).toBe('Polygon');
    });
});

describe('formatArea', () => {
    it('should format small areas in m²', () => {
        expect(formatArea(100)).toBe('100.00 m²');
        expect(formatArea(5000)).toBe('5000.00 m²');
    });

    it('should format medium areas in hectares', () => {
        expect(formatArea(50000)).toBe('5.00 ha');
        expect(formatArea(100000)).toBe('10.00 ha');
    });

    it('should format large areas in km²', () => {
        expect(formatArea(5000000)).toBe('5.00 km²');
    });

    it('should return - for null', () => {
        expect(formatArea(null)).toBe('-');
    });
});

describe('formatLength', () => {
    it('should format short distances in meters', () => {
        expect(formatLength(100)).toBe('100.00 m');
        expect(formatLength(500)).toBe('500.00 m');
    });

    it('should format long distances in km', () => {
        expect(formatLength(5000)).toBe('5.00 km');
        expect(formatLength(10000)).toBe('10.00 km');
    });

    it('should return - for null', () => {
        expect(formatLength(null)).toBe('-');
    });
});
