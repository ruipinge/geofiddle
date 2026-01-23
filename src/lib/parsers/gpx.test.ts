import { describe, it, expect } from 'vitest';
import { parseGpx, formatGpx, detectGpx } from './gpx';

const sampleGpxWaypoint = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" xmlns="http://www.topografix.com/GPX/1/1">
  <wpt lat="37.422" lon="-122.084">
    <name>Test Waypoint</name>
    <ele>100</ele>
  </wpt>
</gpx>`;

const sampleGpxTrack = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" xmlns="http://www.topografix.com/GPX/1/1">
  <trk>
    <name>Test Track</name>
    <trkseg>
      <trkpt lat="37.422" lon="-122.084">
        <ele>100</ele>
      </trkpt>
      <trkpt lat="37.423" lon="-122.085">
        <ele>110</ele>
      </trkpt>
    </trkseg>
  </trk>
</gpx>`;

const sampleGpxRoute = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" xmlns="http://www.topografix.com/GPX/1/1">
  <rte>
    <name>Test Route</name>
    <rtept lat="37.422" lon="-122.084">
      <name>Start</name>
    </rtept>
    <rtept lat="37.423" lon="-122.085">
      <name>End</name>
    </rtept>
  </rte>
</gpx>`;

describe('parseGpx', () => {
    it('should return empty features for empty input', () => {
        const result = parseGpx('');
        expect(result.features).toEqual([]);
        expect(result.errors).toEqual([]);
    });

    it('should parse a waypoint', () => {
        const result = parseGpx(sampleGpxWaypoint);
        expect(result.errors).toEqual([]);
        expect(result.features).toHaveLength(1);
        const geom = result.features[0]?.geometry;
        expect(geom?.type).toBe('Point');
        if (geom?.type === 'Point') {
            expect(geom.coordinates[0]).toBeCloseTo(-122.084);
            expect(geom.coordinates[1]).toBeCloseTo(37.422);
        }
    });

    it('should parse a track', () => {
        const result = parseGpx(sampleGpxTrack);
        expect(result.errors).toEqual([]);
        expect(result.features).toHaveLength(1);
        const geom = result.features[0]?.geometry;
        expect(geom?.type).toBe('LineString');
    });

    it('should parse a route', () => {
        const result = parseGpx(sampleGpxRoute);
        expect(result.errors).toEqual([]);
        expect(result.features).toHaveLength(1);
        const geom = result.features[0]?.geometry;
        expect(geom?.type).toBe('LineString');
    });

    it('should extract name from track', () => {
        const result = parseGpx(sampleGpxTrack);
        const feature = result.features[0];
        expect(feature?.properties.name).toBe('Test Track');
    });

    it('should detect projection as WGS84', () => {
        const result = parseGpx(sampleGpxWaypoint);
        expect(result.detectedProjection).toBe('EPSG:4326');
    });

    it('should return error for invalid XML', () => {
        const result = parseGpx('<gpx><invalid>');
        expect(result.errors).toHaveLength(1);
        expect(result.features).toEqual([]);
    });
});

describe('formatGpx', () => {
    it('should format point features as waypoints', () => {
        const features = [
            {
                type: 'Feature' as const,
                geometry: { type: 'Point' as const, coordinates: [-122.084, 37.422] },
                properties: { name: 'Test' },
            },
        ];
        const gpx = formatGpx(features);
        expect(gpx).toContain('<?xml version="1.0"');
        expect(gpx).toContain('<gpx');
        expect(gpx).toContain('<wpt');
        expect(gpx).toContain('lat="37.422"');
        expect(gpx).toContain('lon="-122.084"');
    });

    it('should format linestring features as tracks', () => {
        const features = [
            {
                type: 'Feature' as const,
                geometry: {
                    type: 'LineString' as const,
                    coordinates: [
                        [-122.084, 37.422],
                        [-122.085, 37.423],
                    ],
                },
                properties: { name: 'Test Track' },
            },
        ];
        const gpx = formatGpx(features);
        expect(gpx).toContain('<trk>');
        expect(gpx).toContain('<trkseg>');
        expect(gpx).toContain('<trkpt');
    });

    it('should include elevation when present', () => {
        const features = [
            {
                type: 'Feature' as const,
                geometry: { type: 'Point' as const, coordinates: [0, 0, 100] },
                properties: {},
            },
        ];
        const gpx = formatGpx(features);
        expect(gpx).toContain('<ele>100</ele>');
    });
});

describe('detectGpx', () => {
    it('should detect GPX with XML declaration', () => {
        expect(detectGpx(sampleGpxWaypoint)).toBe(true);
    });

    it('should detect GPX starting with gpx tag', () => {
        expect(detectGpx('<gpx version="1.1"></gpx>')).toBe(true);
    });

    it('should not detect KML', () => {
        expect(detectGpx('<?xml version="1.0"?><kml></kml>')).toBe(false);
    });

    it('should not detect GeoJSON', () => {
        expect(detectGpx('{"type": "Point"}')).toBe(false);
    });

    it('should not detect WKT', () => {
        expect(detectGpx('POINT(0 0)')).toBe(false);
    });
});
