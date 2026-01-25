/**
 * IndexedDB cache for reverse geocoding results
 */

const DB_NAME = 'geofiddle-geocode';
const DB_VERSION = 1;
const STORE_NAME = 'geocode-results';
const CACHE_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

interface CachedGeocode {
    key: string;
    location: string;
    timestamp: number;
}

let dbPromise: Promise<IDBDatabase> | null = null;

function openDB(): Promise<IDBDatabase> {
    if (dbPromise) {
        return dbPromise;
    }

    dbPromise = new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => {
            reject(new Error(request.error?.message ?? 'Failed to open IndexedDB'));
        };

        request.onsuccess = () => {
            resolve(request.result);
        };

        request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: 'key' });
            }
        };
    });

    return dbPromise;
}

/**
 * Generate a cache key from coordinates (rounded to ~100m precision)
 */
export function getCacheKey(lat: number, lon: number): string {
    // Round to 3 decimal places (~100m precision)
    const roundedLat = Math.round(lat * 1000) / 1000;
    const roundedLon = Math.round(lon * 1000) / 1000;
    return `${String(roundedLat)},${String(roundedLon)}`;
}

/**
 * Get cached geocode result
 */
export async function getCachedGeocode(key: string): Promise<string | null> {
    try {
        const db = await openDB();
        return await new Promise((resolve) => {
            const transaction = db.transaction(STORE_NAME, 'readonly');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.get(key);

            request.onsuccess = () => {
                const result = request.result as CachedGeocode | undefined;
                if (result && Date.now() - result.timestamp < CACHE_EXPIRY_MS) {
                    resolve(result.location);
                } else {
                    resolve(null);
                }
            };

            request.onerror = () => {
                resolve(null);
            };
        });
    } catch {
        return null;
    }
}

/**
 * Store geocode result in cache
 */
export async function setCachedGeocode(key: string, location: string): Promise<void> {
    try {
        const db = await openDB();
        await new Promise<void>((resolve) => {
            const transaction = db.transaction(STORE_NAME, 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            const data: CachedGeocode = {
                key,
                location,
                timestamp: Date.now(),
            };
            store.put(data);

            transaction.oncomplete = () => {
                resolve();
            };

            transaction.onerror = () => {
                resolve();
            };
        });
    } catch {
        // Ignore cache errors
    }
}

/**
 * Clear expired cache entries
 */
export async function clearExpiredCache(): Promise<void> {
    try {
        const db = await openDB();
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.openCursor();

        request.onsuccess = () => {
            const cursor = request.result;
            if (cursor) {
                const entry = cursor.value as CachedGeocode;
                if (Date.now() - entry.timestamp >= CACHE_EXPIRY_MS) {
                    cursor.delete();
                }
                cursor.continue();
            }
        };
    } catch {
        // Ignore cache errors
    }
}
