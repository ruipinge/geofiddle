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
    const tx = transformed[0] ?? 0;
    const ty = transformed[1] ?? 0;

    if (z !== undefined) {
        return [tx, ty, z];
    }
    return [tx, ty];
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
 * Projection detection thresholds based on maximum absolute coordinate value.
 * Precedence: WGS84 > BNG > Web Mercator
 */
const PROJECTION_THRESHOLDS = {
    WGS84_MAX: 180,           // Max valid longitude
    BNG_MAX: 1_300_000,       // Max BNG northing
    WEB_MERCATOR_MAX: 20_037_508.34, // Max Web Mercator extent
} as const;

/**
 * Detect projection from coordinates based on maximum absolute value.
 *
 * Precedence order (for ambiguous cases):
 * 1. WGS84 (EPSG:4326) - if maxAbs <= 180
 * 2. BNG (EPSG:27700) - if maxAbs <= 1,300,000
 * 3. Web Mercator (EPSG:3857) - if maxAbs <= 20,037,508
 * 4. Default to WGS84 if nothing matches
 */
export function detectProjectionFromCoordinates(coords: Position[]): SupportedProjection {
    if (coords.length === 0) {
        return 'EPSG:4326';
    }

    // Find maximum absolute value across all coordinates
    let maxAbs = 0;
    for (const coord of coords) {
        const x = coord[0];
        const y = coord[1];
        if (x !== undefined) {
            maxAbs = Math.max(maxAbs, Math.abs(x));
        }
        if (y !== undefined) {
            maxAbs = Math.max(maxAbs, Math.abs(y));
        }
    }

    // Apply precedence: WGS84 > BNG > Web Mercator
    if (maxAbs <= PROJECTION_THRESHOLDS.WGS84_MAX) {
        return 'EPSG:4326';
    }

    if (maxAbs <= PROJECTION_THRESHOLDS.BNG_MAX) {
        return 'EPSG:27700';
    }

    if (maxAbs <= PROJECTION_THRESHOLDS.WEB_MERCATOR_MAX) {
        return 'EPSG:3857';
    }

    // Default to WGS84 if coordinates are out of all known ranges
    return 'EPSG:4326';
}
