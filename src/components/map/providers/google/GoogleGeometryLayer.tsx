import { useEffect, useRef } from 'react';
import type { ParsedFeature } from '@/types';
import type { FeatureCollection } from 'geojson';

// Style colors matching MapLibre
const COLORS = {
    base: {
        fill: '#3b82f6',
        stroke: '#2563eb',
        fillOpacity: 0.2,
    },
    hover: {
        fill: '#8b5cf6', // violet-500
        stroke: '#7c3aed', // violet-600
        fillOpacity: 0.3,
    },
    selected: {
        fill: '#f97316', // orange-500
        stroke: '#ea580c', // orange-600
        fillOpacity: 0.4,
    },
    drawing: {
        fill: '#f97316', // orange-500
        stroke: '#f97316',
        fillOpacity: 0.2,
    },
};

interface GoogleGeometryLayerProps {
    map: google.maps.Map | null;
    features: ParsedFeature[];
    selectedFeatureId: string | null;
    hoveredFeatureId: string | null;
    drawingPreview: GeoJSON.FeatureCollection | null;
}

export function GoogleGeometryLayer({
    map,
    features,
    selectedFeatureId,
    hoveredFeatureId,
    drawingPreview,
}: GoogleGeometryLayerProps) {
    const dataLayerRef = useRef<google.maps.Data | null>(null);
    const drawingLayerRef = useRef<google.maps.Data | null>(null);

    // Initialize data layers
    useEffect(() => {
        if (!map) {
            return;
        }

        // Create main data layer for features
        const dataLayer = new google.maps.Data();
        dataLayer.setMap(map);
        dataLayerRef.current = dataLayer;

        // Create drawing preview layer
        const drawingLayer = new google.maps.Data();
        drawingLayer.setMap(map);
        drawingLayerRef.current = drawingLayer;

        return () => {
            dataLayer.setMap(null);
            drawingLayer.setMap(null);
            dataLayerRef.current = null;
            drawingLayerRef.current = null;
        };
    }, [map]);

    // Update features
    useEffect(() => {
        const dataLayer = dataLayerRef.current;
        if (!dataLayer) {
            return;
        }

        // Clear existing features
        dataLayer.forEach((feature: google.maps.Data.Feature) => {
            dataLayer.remove(feature);
        });

        if (features.length === 0) {
            return;
        }

        // Add features as GeoJSON
        const geojson: FeatureCollection = {
            type: 'FeatureCollection',
            features: features.map((f) => ({
                ...f,
                properties: {
                    ...f.properties,
                    _featureId: f.id,
                },
            })),
        };

        try {
            dataLayer.addGeoJson(geojson);
        } catch {
            // GeoJSON parsing failed silently
        }
    }, [features]);

    // Update styling based on selection/hover
    useEffect(() => {
        const dataLayer = dataLayerRef.current;
        if (!dataLayer) {
            return;
        }

        dataLayer.setStyle((feature: google.maps.Data.Feature) => {
            const featureId = feature.getProperty('_featureId') as string | undefined;

            let colors = COLORS.base;
            let strokeWeight = 2;
            let zIndex = 1;

            if (featureId === selectedFeatureId) {
                colors = COLORS.selected;
                strokeWeight = 4;
                zIndex = 3;
            } else if (featureId === hoveredFeatureId) {
                colors = COLORS.hover;
                strokeWeight = 3;
                zIndex = 2;
            }

            return {
                fillColor: colors.fill,
                fillOpacity: colors.fillOpacity,
                strokeColor: colors.stroke,
                strokeWeight,
                zIndex,
                // Point styling
                icon: {
                    path: google.maps.SymbolPath.CIRCLE,
                    fillColor: colors.stroke,
                    fillOpacity: 1,
                    strokeColor: '#ffffff',
                    strokeWeight: 2,
                    scale: featureId === selectedFeatureId ? 10 : (featureId === hoveredFeatureId ? 8 : 6),
                },
            };
        });
    }, [selectedFeatureId, hoveredFeatureId]);

    // Update drawing preview
    useEffect(() => {
        const drawingLayer = drawingLayerRef.current;
        if (!drawingLayer) {
            return;
        }

        // Clear existing drawing preview
        drawingLayer.forEach((feature: google.maps.Data.Feature) => {
            drawingLayer.remove(feature);
        });

        if (!drawingPreview || drawingPreview.features.length === 0) {
            return;
        }

        try {
            drawingLayer.addGeoJson(drawingPreview);
        } catch {
            // GeoJSON parsing failed silently
        }

        // Style drawing preview
        drawingLayer.setStyle({
            fillColor: COLORS.drawing.fill,
            fillOpacity: COLORS.drawing.fillOpacity,
            strokeColor: COLORS.drawing.stroke,
            strokeWeight: 2,
            // Dashed line effect using icons
            strokeOpacity: 0.8,
            // Point styling for drawing
            icon: {
                path: google.maps.SymbolPath.CIRCLE,
                fillColor: COLORS.drawing.fill,
                fillOpacity: 1,
                strokeColor: '#ffffff',
                strokeWeight: 2,
                scale: 6,
            },
            zIndex: 10,
        });
    }, [drawingPreview]);

    return null;
}
