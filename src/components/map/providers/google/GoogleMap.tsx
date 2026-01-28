import { useEffect, useRef, useState } from 'react';
import { useGoogleMapsLoader } from './useGoogleMapsLoader';
import { GoogleGeometryLayer } from './GoogleGeometryLayer';
import type { MapProviderProps } from '../types';

export function GoogleMap({
    viewState,
    onViewStateChange,
    basemap,
    features,
    selectedFeatureId,
    hoveredFeatureId,
    isEnvelopeHovered,
    envelope,
    isDrawing,
    drawingPreview,
    onMapClick,
    children,
}: MapProviderProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<google.maps.Map | null>(null);
    const isUpdatingRef = useRef(false);
    const { isLoaded, error, config } = useGoogleMapsLoader();
    const [mapReady, setMapReady] = useState(false);

    // Use refs to store callbacks so they don't cause re-initialization
    const onViewStateChangeRef = useRef(onViewStateChange);
    const onMapClickRef = useRef(onMapClick);
    const initialViewStateRef = useRef(viewState);

    // Keep refs up to date
    useEffect(() => {
        onViewStateChangeRef.current = onViewStateChange;
    }, [onViewStateChange]);

    useEffect(() => {
        onMapClickRef.current = onMapClick;
    }, [onMapClick]);

    // Initialize map
    useEffect(() => {
        if (!isLoaded || !containerRef.current || mapRef.current) {
            return;
        }

        const initialView = initialViewStateRef.current;
        const mapOptions: google.maps.MapOptions = {
            center: { lat: initialView.latitude, lng: initialView.longitude },
            zoom: initialView.zoom,
            mapId: config?.mapId,
            disableDefaultUI: false,
            zoomControl: true,
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: false,
            gestureHandling: 'greedy',
        };

        const map = new google.maps.Map(containerRef.current, mapOptions);
        mapRef.current = map;

        // Handle map movement
        map.addListener('idle', () => {
            if (isUpdatingRef.current) {
                return;
            }

            const center = map.getCenter();
            const zoom = map.getZoom();

            if (center && zoom !== undefined) {
                onViewStateChangeRef.current({
                    latitude: center.lat(),
                    longitude: center.lng(),
                    zoom,
                });
            }
        });

        // Handle map click
        map.addListener('click', (e: google.maps.MapMouseEvent) => {
            if (e.latLng) {
                onMapClickRef.current({
                    lng: e.latLng.lng(),
                    lat: e.latLng.lat(),
                });
            }
        });

        setMapReady(true);

        return () => {
            // Cleanup is handled by React - Google Maps doesn't have a destroy method
            mapRef.current = null;
            setMapReady(false);
        };
    }, [isLoaded, config?.mapId]);

    // Sync view state from props to map
    useEffect(() => {
        const map = mapRef.current;
        if (!map || !mapReady) {
            return;
        }

        const currentCenter = map.getCenter();
        const currentZoom = map.getZoom();

        if (!currentCenter || currentZoom === undefined) {
            return;
        }

        const needsUpdate =
            Math.abs(currentCenter.lat() - viewState.latitude) > 0.0001 ||
            Math.abs(currentCenter.lng() - viewState.longitude) > 0.0001 ||
            Math.abs(currentZoom - viewState.zoom) > 0.1;

        if (needsUpdate) {
            isUpdatingRef.current = true;
            map.setCenter({ lat: viewState.latitude, lng: viewState.longitude });
            map.setZoom(viewState.zoom);

            // Reset flag after animation
            setTimeout(() => {
                isUpdatingRef.current = false;
            }, 100);
        }
    }, [viewState.latitude, viewState.longitude, viewState.zoom, mapReady]);

    // Update cursor for drawing mode
    useEffect(() => {
        const map = mapRef.current;
        if (!map || !mapReady) {
            return;
        }

        map.setOptions({
            draggableCursor: isDrawing ? 'crosshair' : undefined,
        });
    }, [isDrawing, mapReady]);

    // Update basemap
    useEffect(() => {
        const map = mapRef.current;
        if (!map || !mapReady) {
            return;
        }

        map.setMapTypeId(basemap === 'satellite' ? 'hybrid' : 'roadmap');
    }, [basemap, mapReady]);

    if (error) {
        return (
            <div className="flex h-full w-full items-center justify-center bg-neutral-100">
                <div className="max-w-md rounded-lg bg-white p-6 shadow-lg">
                    <h3 className="mb-2 text-lg font-semibold text-red-600">
                        Failed to load Google Maps
                    </h3>
                    <p className="text-sm text-neutral-600">{error}</p>
                </div>
            </div>
        );
    }

    if (!isLoaded) {
        return (
            <div className="flex h-full w-full items-center justify-center bg-neutral-100">
                <div className="text-neutral-600">Loading Google Maps...</div>
            </div>
        );
    }

    return (
        <div className="relative h-full w-full">
            <div ref={containerRef} className="h-full w-full" />
            {children}
            {mapReady && mapRef.current && (
                <GoogleGeometryLayer
                    map={mapRef.current}
                    features={features}
                    selectedFeatureId={selectedFeatureId}
                    hoveredFeatureId={hoveredFeatureId}
                    isEnvelopeHovered={isEnvelopeHovered}
                    envelope={envelope}
                    drawingPreview={drawingPreview}
                />
            )}
        </div>
    );
}
