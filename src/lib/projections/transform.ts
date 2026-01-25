import { proj4, type SupportedProjection } from './definitions';
import type { Geometry, Position } from 'geojson';

/**
 * Transform a single coordinate from one projection to another
 */
export function transformCoordinate(
    coord: Position,
    from: SupportedProjection,
    to: SupportedProjection
): Position {
    if (from === to) {
        return coord;
    }

    const x = coord[0] ?? 0;
    const y = coord[1] ?? 0;
    const z = coord[2];
    const transformed = proj4(from, to, [x, y]);

    if (z !== undefined) {
        return [transformed[0], transformed[1], z];
    }
    return [transformed[0], transformed[1]];
}

/**
 * Transform all coordinates in a geometry from one projection to another
 */
export function transformGeometry(
    geometry: Geometry,
    from: SupportedProjection,
    to: SupportedProjection
): Geometry {
    if (from === to) {
        return geometry;
    }

    switch (geometry.type) {
        case 'Point':
            return {
                type: 'Point',
                coordinates: transformCoordinate(geometry.coordinates, from, to),
            };

        case 'MultiPoint':
            return {
                type: 'MultiPoint',
                coordinates: geometry.coordinates.map((c) => transformCoordinate(c, from, to)),
            };

        case 'LineString':
            return {
                type: 'LineString',
                coordinates: geometry.coordinates.map((c) => transformCoordinate(c, from, to)),
            };

        case 'MultiLineString':
            return {
                type: 'MultiLineString',
                coordinates: geometry.coordinates.map((ring) =>
                    ring.map((c) => transformCoordinate(c, from, to))
                ),
            };

        case 'Polygon':
            return {
                type: 'Polygon',
                coordinates: geometry.coordinates.map((ring) =>
                    ring.map((c) => transformCoordinate(c, from, to))
                ),
            };

        case 'MultiPolygon':
            return {
                type: 'MultiPolygon',
                coordinates: geometry.coordinates.map((polygon) =>
                    polygon.map((ring) => ring.map((c) => transformCoordinate(c, from, to)))
                ),
            };

        case 'GeometryCollection':
            return {
                type: 'GeometryCollection',
                geometries: geometry.geometries.map((g) => transformGeometry(g, from, to)),
            };

        default:
            return geometry;
    }
}

/**
 * Check if a coordinate is valid for WGS84 (lon: -180 to 180, lat: -90 to 90)
 */
export function isValidWGS84Coordinate(coord: Position): boolean {
    const lon = coord[0];
    const lat = coord[1];
    if (lon === undefined || lat === undefined) {
        return false;
    }
    return lon >= -180 && lon <= 180 && lat >= -90 && lat <= 90;
}

/**
 * Check if all coordinates in an array are valid WGS84
 */
export function validateWGS84Coordinates(coords: Position[]): { valid: boolean; invalidCoord?: Position } {
    for (const coord of coords) {
        if (!isValidWGS84Coordinate(coord)) {
            return { valid: false, invalidCoord: coord };
        }
    }
    return { valid: true };
}

/**
 * Check if coordinates look like they're in a projected coordinate system (not WGS84)
 * BNG coordinates are typically 6-digit eastings and northings
 */
export function detectProjectionFromCoordinates(coords: Position[]): SupportedProjection {
    if (coords.length === 0) {
        return 'EPSG:4326';
    }

    // Check first few coordinates
    const samplesToCheck = Math.min(coords.length, 5);
    let looksLikeBNG = true;
    let looksLikeWGS84 = true;

    for (let i = 0; i < samplesToCheck; i++) {
        const coord = coords[i];
        const x = coord?.[0] ?? 0;
        const y = coord?.[1] ?? 0;

        // BNG coordinates are typically:
        // Easting: 0 to 700000
        // Northing: 0 to 1300000
        if (x < 0 || x > 700000 || y < 0 || y > 1300000) {
            looksLikeBNG = false;
        }

        // WGS84 coordinates:
        // Longitude: -180 to 180
        // Latitude: -90 to 90
        if (x < -180 || x > 180 || y < -90 || y > 90) {
            looksLikeWGS84 = false;
        }
    }

    // If it looks like BNG but not WGS84, assume BNG
    if (looksLikeBNG && !looksLikeWGS84) {
        return 'EPSG:27700';
    }

    // Default to WGS84
    return 'EPSG:4326';
}
