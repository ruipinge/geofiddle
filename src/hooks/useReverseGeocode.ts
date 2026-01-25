import { useState, useEffect, useRef } from 'react';
import { getCacheKey, getCachedGeocode, setCachedGeocode } from '@/lib/utils/geocode-cache';

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/reverse';

// Rate limiting: max 1 request per second as per Nominatim usage policy
const REQUEST_DELAY_MS = 1000;
let lastRequestTime = 0;
const pendingRequests: Map<string, Promise<string | null>> = new Map();

interface NominatimResponse {
    address?: {
        city?: string;
        town?: string;
        village?: string;
        municipality?: string;
        county?: string;
        state?: string;
        country?: string;
    };
    display_name?: string;
}

/**
 * Extract a concise location string from Nominatim response
 */
function extractLocation(data: NominatimResponse): string | null {
    if (!data.address) {
        return null;
    }

    const { city, town, village, municipality, county, state, country } = data.address;
    const locality = city ?? town ?? village ?? municipality ?? county;

    if (locality && country) {
        return `${locality}, ${country}`;
    }
    if (state && country) {
        return `${state}, ${country}`;
    }
    if (country) {
        return country;
    }

    return null;
}

/**
 * Fetch reverse geocode from Nominatim with rate limiting
 */
async function fetchReverseGeocode(lat: number, lon: number): Promise<string | null> {
    const cacheKey = getCacheKey(lat, lon);

    // Check if there's already a pending request for this location
    const pending = pendingRequests.get(cacheKey);
    if (pending) {
        return pending;
    }

    // Check cache first
    const cached = await getCachedGeocode(cacheKey);
    if (cached) {
        return cached;
    }

    // Rate limiting
    const now = Date.now();
    const timeSinceLastRequest = now - lastRequestTime;
    const delay = Math.max(0, REQUEST_DELAY_MS - timeSinceLastRequest);

    const requestPromise = new Promise<string | null>((resolve) => {
        setTimeout(() => {
            lastRequestTime = Date.now();

            const doFetch = async () => {
                try {
                    const url = new URL(NOMINATIM_URL);
                    url.searchParams.set('lat', String(lat));
                    url.searchParams.set('lon', String(lon));
                    url.searchParams.set('format', 'json');
                    url.searchParams.set('zoom', '10'); // City level

                    const response = await fetch(url.toString(), {
                        headers: {
                            'User-Agent': 'GeoFiddle/2.0 (https://geofiddle.com)',
                        },
                    });

                    if (!response.ok) {
                        return null;
                    }

                    const data = await response.json() as NominatimResponse;
                    const location = extractLocation(data);

                    if (location) {
                        await setCachedGeocode(cacheKey, location);
                    }

                    return location;
                } catch {
                    return null;
                } finally {
                    pendingRequests.delete(cacheKey);
                }
            };

            doFetch().then(resolve).catch(() => { resolve(null); });
        }, delay);
    });

    pendingRequests.set(cacheKey, requestPromise);
    return requestPromise;
}

/**
 * Hook for reverse geocoding a coordinate
 * Returns the location string or null if not available
 */
export function useReverseGeocode(lat: number | null, lon: number | null): {
    location: string | null;
    isLoading: boolean;
} {
    const [location, setLocation] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const abortRef = useRef(false);

    useEffect(() => {
        if (lat === null || lon === null) {
            setLocation(null);
            setIsLoading(false);
            return;
        }

        // Validate coordinates are within WGS84 range
        if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
            setLocation(null);
            setIsLoading(false);
            return;
        }

        abortRef.current = false;
        setIsLoading(true);

        fetchReverseGeocode(lat, lon)
            .then((result) => {
                if (!abortRef.current) {
                    setLocation(result);
                    setIsLoading(false);
                }
            })
            .catch(() => {
                if (!abortRef.current) {
                    setLocation(null);
                    setIsLoading(false);
                }
            });

        return () => {
            abortRef.current = true;
        };
    }, [lat, lon]);

    return { location, isLoading };
}

/**
 * Get the centroid of a geometry for reverse geocoding
 */
export function getGeometryCentroid(geometry: { type: string; coordinates: unknown } | null): {
    lat: number;
    lon: number;
} | null {
    if (!geometry?.coordinates) {
        return null;
    }

    const coords: [number, number][] = [];

    const extractCoords = (c: unknown): void => {
        if (Array.isArray(c)) {
            if (typeof c[0] === 'number' && typeof c[1] === 'number') {
                coords.push([c[0], c[1]]);
            } else {
                for (const item of c) {
                    extractCoords(item);
                }
            }
        }
    };

    extractCoords(geometry.coordinates);

    if (coords.length === 0) {
        return null;
    }

    // Calculate centroid
    let sumLon = 0;
    let sumLat = 0;
    for (const [lon, lat] of coords) {
        sumLon += lon;
        sumLat += lat;
    }

    return {
        lon: sumLon / coords.length,
        lat: sumLat / coords.length,
    };
}
