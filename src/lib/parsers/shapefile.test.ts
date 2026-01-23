import { describe, it, expect } from 'vitest';
import { parseShapefileSync, formatShapefile, detectShapefile } from './shapefile';

describe('parseShapefileSync', () => {
    it('should return empty features for empty input', () => {
        const result = parseShapefileSync('');
        expect(result.features).toEqual([]);
        expect(result.errors).toEqual([]);
    });

    it('should return error for non-empty sync input', () => {
        const result = parseShapefileSync('some data');
        expect(result.errors).toHaveLength(1);
        expect(result.errors[0]?.message).toContain('async');
    });
});

describe('formatShapefile', () => {
    it('should format features as GeoJSON', () => {
        const features = [
            {
                type: 'Feature' as const,
                geometry: { type: 'Point' as const, coordinates: [0, 0] },
                properties: { name: 'Test' },
            },
        ];
        const output = formatShapefile(features);
        const parsed = JSON.parse(output) as { type: string; features: unknown[] };
        expect(parsed.type).toBe('FeatureCollection');
        expect(parsed.features).toHaveLength(1);
    });

    it('should return valid GeoJSON for empty features', () => {
        const output = formatShapefile([]);
        const parsed = JSON.parse(output) as { type: string; features: unknown[] };
        expect(parsed.type).toBe('FeatureCollection');
        expect(parsed.features).toEqual([]);
    });
});

describe('detectShapefile', () => {
    it('should detect zip data URL', () => {
        expect(detectShapefile('data:application/zip;base64,UEsDB...')).toBe(true);
    });

    it('should detect octet-stream data URL', () => {
        expect(detectShapefile('data:application/octet-stream;base64,UEsDB...')).toBe(true);
    });

    it('should detect base64 ZIP magic bytes', () => {
        expect(detectShapefile('UEsDBBQAAAA...')).toBe(true);
    });

    it('should not detect GeoJSON', () => {
        expect(detectShapefile('{"type": "FeatureCollection"}')).toBe(false);
    });

    it('should not detect WKT', () => {
        expect(detectShapefile('POINT(0 0)')).toBe(false);
    });

    it('should not detect KML', () => {
        expect(detectShapefile('<?xml version="1.0"?><kml></kml>')).toBe(false);
    });
});
