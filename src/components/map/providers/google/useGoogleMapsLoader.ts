import { useState, useEffect } from 'react';

interface GoogleMapsConfig {
    apiKey: string;
    mapId: string;
}

interface GoogleMapsLoaderState {
    isLoaded: boolean;
    error: string | null;
    config: GoogleMapsConfig | null;
}

let loadPromise: Promise<GoogleMapsConfig> | null = null;
let loadedConfig: GoogleMapsConfig | null = null;

function isGoogleMapsLoaded(): boolean {
    return typeof google !== 'undefined' && typeof google.maps !== 'undefined';
}

async function loadGoogleMapsApi(): Promise<GoogleMapsConfig> {
    // Return cached config if already loaded
    if (loadedConfig && isGoogleMapsLoaded()) {
        return loadedConfig;
    }

    // Return existing promise if already loading
    if (loadPromise) {
        return loadPromise;
    }

    loadPromise = (async () => {
        // Fetch config from PRIVATE.json
        const response = await fetch('/PRIVATE.json');
        if (!response.ok) {
            throw new Error('Failed to load Google Maps configuration. Make sure PRIVATE.json exists.');
        }

        const config = await response.json() as GoogleMapsConfig;
        if (!config.apiKey) {
            throw new Error('Google Maps API key not found in PRIVATE.json');
        }

        // Check if already loaded by another call
        if (isGoogleMapsLoaded()) {
            loadedConfig = config;
            return config;
        }

        // Load Google Maps script
        await new Promise<void>((resolve, reject) => {
            const script = document.createElement('script');
            script.src = `https://maps.googleapis.com/maps/api/js?key=${config.apiKey}&libraries=geometry&v=weekly`;
            script.async = true;
            script.defer = true;
            script.onload = () => { resolve(); };
            script.onerror = () => { reject(new Error('Failed to load Google Maps script')); };
            document.head.appendChild(script);
        });

        loadedConfig = config;
        return config;
    })();

    return loadPromise;
}

export function useGoogleMapsLoader(): GoogleMapsLoaderState {
    const [state, setState] = useState<GoogleMapsLoaderState>({
        isLoaded: Boolean(loadedConfig) && isGoogleMapsLoaded(),
        error: null,
        config: loadedConfig,
    });

    useEffect(() => {
        if (state.isLoaded) {
            return;
        }

        loadGoogleMapsApi()
            .then((config) => {
                setState({
                    isLoaded: true,
                    error: null,
                    config,
                });
            })
            .catch((err: unknown) => {
                setState({
                    isLoaded: false,
                    error: err instanceof Error ? err.message : 'Failed to load Google Maps',
                    config: null,
                });
            });
    }, [state.isLoaded]);

    return state;
}
