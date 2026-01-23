import { area, length } from '@turf/turf';
import type { Feature, Geometry } from 'geojson';

/**
 * Calculate the area of a geometry in square meters
 */
export function calculateArea(geometry: Geometry | null): number | null {
    if (!geometry) {
        return null;
    }

    // Only polygons and multi-polygons have area
    if (
        geometry.type !== 'Polygon' &&
        geometry.type !== 'MultiPolygon'
    ) {
        return null;
    }

    try {
        const feature: Feature = {
            type: 'Feature',
            geometry,
            properties: {},
        };
        return area(feature);
    } catch {
        return null;
    }
}

/**
 * Calculate the length of a geometry in meters
 */
export function calculateLength(geometry: Geometry | null): number | null {
    if (!geometry) {
        return null;
    }

    // Only line strings have length
    if (
        geometry.type !== 'LineString' &&
        geometry.type !== 'MultiLineString'
    ) {
        return null;
    }

    try {
        const feature: Feature = {
            type: 'Feature',
            geometry,
            properties: {},
        };
        return length(feature, { units: 'meters' });
    } catch {
        return null;
    }
}

/**
 * Count the number of coordinates/points in a geometry
 */
export function countCoordinates(geometry: Geometry | null): number {
    if (!geometry) {
        return 0;
    }

    switch (geometry.type) {
        case 'Point':
            return 1;

        case 'MultiPoint':
        case 'LineString':
            return geometry.coordinates.length;

        case 'MultiLineString':
        case 'Polygon':
            return geometry.coordinates.reduce(
                (sum, ring) => sum + ring.length,
                0
            );

        case 'MultiPolygon':
            return geometry.coordinates.reduce(
                (sum, polygon) =>
                    sum + polygon.reduce((s, ring) => s + ring.length, 0),
                0
            );

        case 'GeometryCollection':
            return geometry.geometries.reduce(
                (sum, g) => sum + countCoordinates(g),
                0
            );

        default:
            return 0;
    }
}

/**
 * Get a human-readable geometry type
 */
export function getGeometryTypeLabel(type: string | undefined): string {
    if (!type) {
        return 'Unknown';
    }

    // Add spaces before capital letters for readability
    return type.replace(/([A-Z])/g, ' $1').trim();
}

/**
 * Format area for display
 */
export function formatArea(areaInSqMeters: number | null): string {
    if (areaInSqMeters === null) {
        return '-';
    }

    if (areaInSqMeters >= 1_000_000) {
        return `${(areaInSqMeters / 1_000_000).toFixed(2)} km²`;
    }

    if (areaInSqMeters >= 10_000) {
        return `${(areaInSqMeters / 10_000).toFixed(2)} ha`;
    }

    return `${areaInSqMeters.toFixed(2)} m²`;
}

/**
 * Format length for display
 */
export function formatLength(lengthInMeters: number | null): string {
    if (lengthInMeters === null) {
        return '-';
    }

    if (lengthInMeters >= 1000) {
        return `${(lengthInMeters / 1000).toFixed(2)} km`;
    }

    return `${lengthInMeters.toFixed(2)} m`;
}
