import { useEffect, useRef } from 'react';
import { useGeometryStore } from '@/stores/geometryStore';
import { useConversionStore } from '@/stores/conversionStore';
import type { FormatType, ProjectionType } from '@/types';

/**
 * Hook that syncs geometry state to/from URL hash for deep linking.
 * URL format: #format/projection/encodedGeometry
 * Example: #geojson/wgs84/eyJ0eXBlIjoiUG9pbnQiLC...
 *
 * Projection URL identifiers: wgs84, bng, web-mercator, auto
 */
export function useDeepLink(): void {
    const {
        rawText,
        inputFormat,
        inputProjection,
        setRawText,
        setInputFormat,
        setInputProjection,
    } = useGeometryStore();

    const { setOutputFormat, setOutputProjection } = useConversionStore();

    const isInitialLoad = useRef(true);
    const skipNextHashUpdate = useRef(false);

    // Load state from URL on mount
    useEffect(() => {
        const hash = window.location.hash.slice(1); // Remove leading #

        if (!hash) {
            isInitialLoad.current = false;
            return;
        }

        try {
            const state = parseHash(hash);

            if (state.format) {
                setInputFormat(state.format);
                setOutputFormat(state.format === 'auto' ? 'geojson' : state.format);
            }

            if (state.projection) {
                setInputProjection(state.projection);
                setOutputProjection(
                    state.projection === 'auto' ? 'EPSG:4326' : state.projection
                );
            }

            if (state.geometry) {
                skipNextHashUpdate.current = true;
                setRawText(state.geometry);
            }
        } catch (e) {
            console.warn('Failed to parse URL hash:', e);
        }

        isInitialLoad.current = false;
    }, [
        setRawText,
        setInputFormat,
        setInputProjection,
        setOutputFormat,
        setOutputProjection,
    ]);

    // Update URL when state changes
    useEffect(() => {
        if (isInitialLoad.current) {
            return;
        }

        if (skipNextHashUpdate.current) {
            skipNextHashUpdate.current = false;
            return;
        }

        const hash = buildHash({
            format: inputFormat,
            projection: inputProjection,
            geometry: rawText,
        });

        // Update URL without triggering navigation
        const newUrl = hash ? `#${hash}` : window.location.pathname;
        window.history.replaceState(null, '', newUrl);
    }, [rawText, inputFormat, inputProjection]);

    // Listen for browser back/forward navigation
    useEffect(() => {
        const handleHashChange = () => {
            const hash = window.location.hash.slice(1);

            if (!hash) {
                return;
            }

            try {
                const state = parseHash(hash);
                skipNextHashUpdate.current = true;

                if (state.format) {
                    setInputFormat(state.format);
                }
                if (state.projection) {
                    setInputProjection(state.projection);
                }
                if (state.geometry) {
                    setRawText(state.geometry);
                }
            } catch (e) {
                console.warn('Failed to parse URL hash:', e);
            }
        };

        window.addEventListener('hashchange', handleHashChange);
        return () => {
            window.removeEventListener('hashchange', handleHashChange);
        };
    }, [setRawText, setInputFormat, setInputProjection]);
}

interface HashState {
    format?: FormatType | 'auto';
    projection?: ProjectionType | 'auto';
    geometry?: string;
}

// URL-friendly projection identifiers
const PROJECTION_TO_URL: Record<ProjectionType | 'auto', string> = {
    'auto': 'auto',
    'EPSG:4326': 'wgs84',
    'EPSG:27700': 'bng',
    'EPSG:3857': 'web-mercator',
};

const URL_TO_PROJECTION: Record<string, ProjectionType | 'auto'> = {
    'auto': 'auto',
    'wgs84': 'EPSG:4326',
    'bng': 'EPSG:27700',
    'web-mercator': 'EPSG:3857',
    // Also support legacy EPSG codes in URL for backwards compatibility
    'EPSG:4326': 'EPSG:4326',
    'EPSG:27700': 'EPSG:27700',
    'EPSG:3857': 'EPSG:3857',
};

/**
 * Parses URL hash into state object
 * Format: format/projection/base64EncodedGeometry
 */
function parseHash(hash: string): HashState {
    const parts = hash.split('/');
    const result: HashState = {};

    if (parts[0]) {
        result.format = decodeURIComponent(parts[0]) as FormatType | 'auto';
    }

    if (parts[1]) {
        const urlProjection = decodeURIComponent(parts[1]);
        result.projection = URL_TO_PROJECTION[urlProjection] ?? 'auto';
    }

    if (parts[2]) {
        // Decode base64 geometry
        try {
            result.geometry = atob(decodeURIComponent(parts[2]));
        } catch {
            // Try as plain text if base64 fails
            result.geometry = decodeURIComponent(parts[2]);
        }
    }

    return result;
}

/**
 * Builds URL hash from state
 */
function buildHash(state: HashState): string {
    if (!state.geometry?.trim()) {
        return '';
    }

    const format = encodeURIComponent(state.format ?? 'auto');
    const projectionKey = state.projection ?? 'auto';
    const projection = encodeURIComponent(PROJECTION_TO_URL[projectionKey]);
    const geometry = encodeURIComponent(btoa(state.geometry));

    return `${format}/${projection}/${geometry}`;
}

/**
 * Gets a shareable URL for the current state
 */
export function getShareableUrl(): string {
    return window.location.href;
}
