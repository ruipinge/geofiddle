import { useCallback } from 'react';
import { MapPin, Minus, Pentagon, X, Check, LocateFixed, LocateOff, Maximize2, Map, Globe } from 'lucide-react';
import { useDrawingStore, type DrawingMode } from '@/stores/drawingStore';
import { useGeometryStore, addFeatureIds } from '@/stores/geometryStore';
import { useUIStore } from '@/stores/uiStore';
import { useMapStore } from '@/stores/mapStore';
import type { Feature, Point, LineString, Polygon } from 'geojson';

interface DrawingToolsProps {
    onFitBounds?: () => void;
    hasFeatures?: boolean;
}

export function DrawingTools({ onFitBounds, hasFeatures = false }: DrawingToolsProps) {
    const { mode, setMode, currentPoints, reset } = useDrawingStore();
    const { features, setFeatures } = useGeometryStore();
    const { autoPanToGeometry, toggleAutoPanToGeometry } = useUIStore();
    const { provider, setProvider } = useMapStore();

    const toggleProvider = useCallback(() => {
        setProvider(provider === 'maplibre' ? 'google' : 'maplibre');
    }, [provider, setProvider]);

    const handleSelectTool = useCallback((newMode: DrawingMode) => {
        if (mode === newMode) {
            // Toggle off
            reset();
        } else {
            setMode(newMode);
        }
    }, [mode, setMode, reset]);

    const handleFinish = useCallback(() => {
        if (currentPoints.length === 0) {
            reset();
            return;
        }

        let geometry: Point | LineString | Polygon | null = null;

        const firstPoint = currentPoints[0];
        if (mode === 'point' && currentPoints.length >= 1 && firstPoint) {
            // Use first point only
            geometry = {
                type: 'Point',
                coordinates: firstPoint,
            };
        } else if (mode === 'line' && currentPoints.length >= 2) {
            geometry = {
                type: 'LineString',
                coordinates: currentPoints,
            };
        } else if (mode === 'polygon' && currentPoints.length >= 3 && firstPoint) {
            // Close the polygon by adding first point at the end
            const closedRing = [...currentPoints, firstPoint];
            geometry = {
                type: 'Polygon',
                coordinates: [closedRing],
            };
        }

        if (geometry) {
            const newFeature: Feature = {
                type: 'Feature',
                geometry,
                properties: {
                    name: `Drawn ${mode}`,
                },
            };

            const updatedFeatures = addFeatureIds([...features, newFeature]);
            setFeatures(updatedFeatures);
        }

        reset();
    }, [mode, currentPoints, features, setFeatures, reset]);

    const handleCancel = useCallback(() => {
        reset();
    }, [reset]);

    const isDrawing = mode !== 'none';
    const canFinish =
        (mode === 'point' && currentPoints.length >= 1) ||
        (mode === 'line' && currentPoints.length >= 2) ||
        (mode === 'polygon' && currentPoints.length >= 3);

    return (
        <div className="absolute left-2 top-2 flex flex-col gap-1">
            {/* Tool selection buttons */}
            <div className="flex gap-1 rounded bg-white p-1 shadow-md">
                <button
                    onClick={() => { handleSelectTool('point'); }}
                    className={`flex h-8 w-8 items-center justify-center rounded transition-colors ${
                        mode === 'point'
                            ? 'bg-primary-500 text-white'
                            : 'text-neutral-700 hover:bg-neutral-100'
                    }`}
                    title="Draw point"
                    aria-label="Draw point"
                    aria-pressed={mode === 'point'}
                >
                    <MapPin className="h-4 w-4" />
                </button>
                <button
                    onClick={() => { handleSelectTool('line'); }}
                    className={`flex h-8 w-8 items-center justify-center rounded transition-colors ${
                        mode === 'line'
                            ? 'bg-primary-500 text-white'
                            : 'text-neutral-700 hover:bg-neutral-100'
                    }`}
                    title="Draw line"
                    aria-label="Draw line"
                    aria-pressed={mode === 'line'}
                >
                    <Minus className="h-4 w-4" />
                </button>
                <button
                    onClick={() => { handleSelectTool('polygon'); }}
                    className={`flex h-8 w-8 items-center justify-center rounded transition-colors ${
                        mode === 'polygon'
                            ? 'bg-primary-500 text-white'
                            : 'text-neutral-700 hover:bg-neutral-100'
                    }`}
                    title="Draw polygon"
                    aria-label="Draw polygon"
                    aria-pressed={mode === 'polygon'}
                >
                    <Pentagon className="h-4 w-4" />
                </button>

                {/* Separator */}
                <div className="mx-0.5 w-px self-stretch bg-neutral-200" />

                {/* View controls */}
                <button
                    onClick={toggleAutoPanToGeometry}
                    className={`flex h-8 w-8 items-center justify-center rounded transition-colors ${
                        autoPanToGeometry
                            ? 'bg-primary-500 text-white'
                            : 'text-neutral-700 hover:bg-neutral-100'
                    }`}
                    title={autoPanToGeometry ? 'Auto-pan enabled (click to disable)' : 'Auto-pan disabled (click to enable)'}
                    aria-label={autoPanToGeometry ? 'Disable auto-pan to geometry' : 'Enable auto-pan to geometry'}
                    aria-pressed={autoPanToGeometry}
                >
                    {autoPanToGeometry ? (
                        <LocateFixed className="h-4 w-4" />
                    ) : (
                        <LocateOff className="h-4 w-4" />
                    )}
                </button>
                {hasFeatures && onFitBounds && (
                    <button
                        onClick={onFitBounds}
                        className="flex h-8 w-8 items-center justify-center rounded text-neutral-700 transition-colors hover:bg-neutral-100"
                        title="Fit map to geometry"
                        aria-label="Fit map to geometry"
                    >
                        <Maximize2 className="h-4 w-4" />
                    </button>
                )}

                {/* Separator */}
                <div className="mx-0.5 w-px self-stretch bg-neutral-200" />

                {/* Map provider toggle */}
                <button
                    onClick={toggleProvider}
                    className="flex h-8 w-8 items-center justify-center rounded text-neutral-700 transition-colors hover:bg-neutral-100"
                    title={provider === 'maplibre' ? 'Switch to Google Maps' : 'Switch to MapLibre'}
                    aria-label={provider === 'maplibre' ? 'Switch to Google Maps' : 'Switch to MapLibre'}
                >
                    {provider === 'maplibre' ? (
                        <Map className="h-4 w-4" />
                    ) : (
                        <Globe className="h-4 w-4" />
                    )}
                </button>
            </div>

            {/* Drawing status and actions */}
            {isDrawing && (
                <div className="rounded bg-white p-2 shadow-md">
                    <div className="mb-2 text-xs text-neutral-600">
                        {mode === 'point' && 'Click to place point'}
                        {mode === 'line' && `Click to add points (${String(currentPoints.length)} added)`}
                        {mode === 'polygon' && `Click to add vertices (${String(currentPoints.length)} added)`}
                    </div>
                    <div className="flex gap-1">
                        <button
                            onClick={handleFinish}
                            disabled={!canFinish}
                            className="flex flex-1 items-center justify-center gap-1 rounded bg-primary-500 px-2 py-1 text-xs text-white hover:bg-primary-600 disabled:opacity-50"
                        >
                            <Check className="h-3 w-3" />
                            Finish
                        </button>
                        <button
                            onClick={handleCancel}
                            className="flex items-center justify-center rounded border border-neutral-300 px-2 py-1 text-xs text-neutral-700 hover:bg-neutral-100"
                        >
                            <X className="h-3 w-3" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
