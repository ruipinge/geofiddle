import { describe, it, expect } from 'vitest';
import { detectFormat, detectProjection } from './format-detection';

describe('detectFormat', () => {
    it('should return null for empty input', () => {
        expect(detectFormat('')).toBeNull();
        expect(detectFormat('   ')).toBeNull();
    });

    it('should detect GeoJSON', () => {
        expect(detectFormat('{"type": "Point", "coordinates": [0, 0]}')).toBe('geojson');
        expect(detectFormat('{"type": "FeatureCollection", "features": []}')).toBe('geojson');
    });

    it('should detect WKT', () => {
        expect(detectFormat('POINT(0 0)')).toBe('wkt');
        expect(detectFormat('LINESTRING(0 0, 1 1)')).toBe('wkt');
        expect(detectFormat('POLYGON((0 0, 1 0, 1 1, 0 0))')).toBe('wkt');
    });

    it('should detect EWKT', () => {
        expect(detectFormat('SRID=4326;POINT(0 0)')).toBe('ewkt');
        expect(detectFormat('srid=27700;POINT(0 0)')).toBe('ewkt');
    });

    it('should detect KML', () => {
        expect(detectFormat('<kml><Document></Document></kml>')).toBe('kml');
        expect(detectFormat('<Placemark><Point></Point></Placemark>')).toBe('kml');
    });

    it('should detect GPX', () => {
        expect(detectFormat('<gpx><trk></trk></gpx>')).toBe('gpx');
        expect(detectFormat('<trkpt lat="0" lon="0"></trkpt>')).toBe('gpx');
    });
});

describe('detectProjection', () => {
    it('should return null for empty input', () => {
        expect(detectProjection('')).toBeNull();
    });

    it('should detect projection from EWKT SRID', () => {
        expect(detectProjection('SRID=4326;POINT(0 0)', 'ewkt')).toBe('EPSG:4326');
        expect(detectProjection('SRID=3857;POINT(0 0)', 'ewkt')).toBe('EPSG:3857');
        expect(detectProjection('SRID=27700;POINT(0 0)', 'ewkt')).toBe('EPSG:27700');
    });

    it('should return null for unknown SRID', () => {
        expect(detectProjection('SRID=9999;POINT(0 0)', 'ewkt')).toBeNull();
    });
});
