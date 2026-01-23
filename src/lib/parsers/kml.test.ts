import { describe, it, expect } from 'vitest';
import { parseKml, formatKml, detectKml } from './kml';

const sampleKmlPoint = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <Placemark>
      <name>Test Point</name>
      <Point>
        <coordinates>-122.084,37.422,0</coordinates>
      </Point>
    </Placemark>
  </Document>
</kml>`;

const sampleKmlLine = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <Placemark>
      <name>Test Line</name>
      <LineString>
        <coordinates>-122.084,37.422 -122.085,37.423</coordinates>
      </LineString>
    </Placemark>
  </Document>
</kml>`;

const sampleKmlPolygon = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <Placemark>
      <name>Test Polygon</name>
      <Polygon>
        <outerBoundaryIs>
          <LinearRing>
            <coordinates>
              0,0 1,0 1,1 0,1 0,0
            </coordinates>
          </LinearRing>
        </outerBoundaryIs>
      </Polygon>
    </Placemark>
  </Document>
</kml>`;

describe('parseKml', () => {
    it('should return empty features for empty input', () => {
        const result = parseKml('');
        expect(result.features).toEqual([]);
        expect(result.errors).toEqual([]);
    });

    it('should parse a point', () => {
        const result = parseKml(sampleKmlPoint);
        expect(result.errors).toEqual([]);
        expect(result.features).toHaveLength(1);
        const geom = result.features[0]?.geometry;
        expect(geom?.type).toBe('Point');
        if (geom?.type === 'Point') {
            expect(geom.coordinates[0]).toBeCloseTo(-122.084);
            expect(geom.coordinates[1]).toBeCloseTo(37.422);
        }
    });

    it('should parse a linestring', () => {
        const result = parseKml(sampleKmlLine);
        expect(result.errors).toEqual([]);
        expect(result.features).toHaveLength(1);
        const geom = result.features[0]?.geometry;
        expect(geom?.type).toBe('LineString');
    });

    it('should parse a polygon', () => {
        const result = parseKml(sampleKmlPolygon);
        expect(result.errors).toEqual([]);
        expect(result.features).toHaveLength(1);
        const geom = result.features[0]?.geometry;
        expect(geom?.type).toBe('Polygon');
    });

    it('should extract name from placemark', () => {
        const result = parseKml(sampleKmlPoint);
        const feature = result.features[0];
        expect(feature?.properties.name).toBe('Test Point');
    });

    it('should detect projection as WGS84', () => {
        const result = parseKml(sampleKmlPoint);
        expect(result.detectedProjection).toBe('EPSG:4326');
    });

    it('should return error for invalid XML', () => {
        const result = parseKml('<kml><invalid>');
        expect(result.errors).toHaveLength(1);
        expect(result.features).toEqual([]);
    });
});

describe('formatKml', () => {
    it('should format point features', () => {
        const features = [
            {
                type: 'Feature' as const,
                geometry: { type: 'Point' as const, coordinates: [-122.084, 37.422] },
                properties: { name: 'Test' },
            },
        ];
        const kml = formatKml(features);
        expect(kml).toContain('<?xml version="1.0"');
        expect(kml).toContain('<kml');
        expect(kml).toContain('<Point>');
        expect(kml).toContain('-122.084,37.422');
    });

    it('should format linestring features', () => {
        const features = [
            {
                type: 'Feature' as const,
                geometry: {
                    type: 'LineString' as const,
                    coordinates: [
                        [0, 0],
                        [1, 1],
                    ],
                },
                properties: {},
            },
        ];
        const kml = formatKml(features);
        expect(kml).toContain('<LineString>');
    });

    it('should format polygon features', () => {
        const features = [
            {
                type: 'Feature' as const,
                geometry: {
                    type: 'Polygon' as const,
                    coordinates: [
                        [
                            [0, 0],
                            [1, 0],
                            [1, 1],
                            [0, 0],
                        ],
                    ],
                },
                properties: {},
            },
        ];
        const kml = formatKml(features);
        expect(kml).toContain('<Polygon>');
        expect(kml).toContain('<outerBoundaryIs>');
    });

    it('should escape XML special characters in name', () => {
        const features = [
            {
                type: 'Feature' as const,
                geometry: { type: 'Point' as const, coordinates: [0, 0] },
                properties: { name: 'Test <&> "name"' },
            },
        ];
        const kml = formatKml(features);
        expect(kml).toContain('&lt;');
        expect(kml).toContain('&amp;');
        expect(kml).toContain('&gt;');
    });
});

describe('detectKml', () => {
    it('should detect KML with XML declaration', () => {
        expect(detectKml(sampleKmlPoint)).toBe(true);
    });

    it('should detect KML starting with kml tag', () => {
        expect(detectKml('<kml><Document></Document></kml>')).toBe(true);
    });

    it('should not detect GeoJSON', () => {
        expect(detectKml('{"type": "Point"}')).toBe(false);
    });

    it('should not detect WKT', () => {
        expect(detectKml('POINT(0 0)')).toBe(false);
    });

    it('should not detect random XML', () => {
        expect(detectKml('<?xml version="1.0"?><html></html>')).toBe(false);
    });
});
