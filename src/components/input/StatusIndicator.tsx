import { useState, useCallback } from 'react';
import { XCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { useGeometryStore } from '@/stores/geometryStore';
import { projectionLabels } from '@/lib/projections';
import type { FormatType } from '@/types';

const formatLabels: Record<FormatType, string> = {
    geojson: 'GeoJSON',
    wkt: 'WKT',
    ewkt: 'EWKT',
    csv: 'CSV',
    kml: 'KML',
    gpx: 'GPX',
    polyline5: 'Polyline5',
    polyline6: 'Polyline6',
    shapefile: 'Shapefile',
};

interface ErrorIconProps {
    error: string;
}

function ErrorIcon({ error }: ErrorIconProps) {
    const [showTooltip, setShowTooltip] = useState(false);

    const handleClick = useCallback(() => {
        setShowTooltip((prev) => !prev);
    }, []);

    const handleMouseEnter = useCallback(() => {
        setShowTooltip(true);
    }, []);

    const handleMouseLeave = useCallback(() => {
        setShowTooltip(false);
    }, []);

    return (
        <span className="relative inline-flex items-center">
            <button
                type="button"
                onClick={handleClick}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                className="inline-flex items-center"
                aria-label="Show error details"
            >
                <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
            </button>
            {showTooltip && (
                <div className="absolute left-0 top-full z-50 mt-1 max-w-xs whitespace-normal rounded-md border border-red-200 bg-red-50 p-2 text-xs text-red-700 shadow-lg dark:border-red-800 dark:bg-red-950 dark:text-red-300">
                    {error}
                </div>
            )}
        </span>
    );
}

export function StatusIndicator() {
    const {
        inputFormat,
        inputProjection,
        detectedFormat,
        detectedProjection,
        parseError,
        coordinateError,
        isParsing,
        features,
        rawText,
    } = useGeometryStore();

    const isFormatAuto = inputFormat === 'auto';
    const isProjectionAuto = inputProjection === 'auto';
    const hasError = parseError || coordinateError;
    const hasContent = rawText.trim().length > 0;
    const hasParsedFeatures = features.length > 0;

    // Show loading state
    if (isParsing) {
        return (
            <span className="inline-flex items-center gap-1 text-xs text-neutral-500 dark:text-neutral-400">
                <Loader2 className="h-3 w-3 animate-spin" />
            </span>
        );
    }

    // Don't show anything if no content
    if (!hasContent) {
        return null;
    }

    const formatValue = detectedFormat ? formatLabels[detectedFormat] : null;
    const projectionValue = detectedProjection ? projectionLabels[detectedProjection] : null;

    // Show success when we have parsed features and no errors
    const showSuccess = !hasError && hasParsedFeatures;

    // Combine errors for display
    const errorMessage = parseError || coordinateError;

    return (
        <div className="inline-flex items-center gap-1.5">
            {/* Success/Error indicator comes first */}
            {showSuccess && (
                <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
            )}
            {errorMessage && <ErrorIcon error={errorMessage} />}

            {/* Auto-detected format tag (only value, no icon/label) */}
            {isFormatAuto && formatValue && (
                <span className="rounded bg-neutral-100 px-1.5 py-0.5 text-xs font-medium text-neutral-600 dark:bg-neutral-700 dark:text-neutral-300">
                    {formatValue}
                </span>
            )}

            {/* Auto-detected projection tag (only value, no icon/label) */}
            {isProjectionAuto && projectionValue && (
                <span className="rounded bg-neutral-100 px-1.5 py-0.5 text-xs font-medium text-neutral-600 dark:bg-neutral-700 dark:text-neutral-300">
                    {projectionValue}
                </span>
            )}
        </div>
    );
}
