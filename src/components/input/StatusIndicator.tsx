import { useState, useCallback } from 'react';
import { AlertCircle, CheckCircle2, FileType, MapPin, Loader2 } from 'lucide-react';
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

interface StatusBadgeProps {
    label: string;
    value: string | null;
    icon: React.ReactNode;
    isAuto: boolean;
}

function StatusBadge({ label, value, icon, isAuto }: StatusBadgeProps) {
    if (!isAuto || !value) {
        return null;
    }

    return (
        <span className="inline-flex items-center gap-1 rounded bg-neutral-100 px-1.5 py-0.5 text-xs text-neutral-600 dark:bg-neutral-700 dark:text-neutral-300">
            {icon}
            <span className="text-neutral-400 dark:text-neutral-500">{label}:</span>
            <span className="font-medium">{value}</span>
        </span>
    );
}

interface ErrorBadgeProps {
    error: string;
}

function ErrorBadge({ error }: ErrorBadgeProps) {
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

    // Truncate error for display
    const shortError = error.length > 30 ? error.slice(0, 30) + '...' : error;

    return (
        <span className="relative inline-flex items-center">
            <button
                type="button"
                onClick={handleClick}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                className="inline-flex items-center gap-1 rounded bg-red-100 px-1.5 py-0.5 text-xs text-red-700 hover:bg-red-200 dark:bg-red-900/50 dark:text-red-300 dark:hover:bg-red-900/70"
                aria-label="Show error details"
            >
                <AlertCircle className="h-3 w-3" />
                <span>{shortError}</span>
            </button>
            {showTooltip && error.length > 30 && (
                <div className="absolute left-0 top-full z-50 mt-1 max-w-xs rounded-md border border-red-200 bg-red-50 p-2 text-xs text-red-700 shadow-lg dark:border-red-800 dark:bg-red-950 dark:text-red-300">
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
        rawText,
    } = useGeometryStore();

    const isFormatAuto = inputFormat === 'auto';
    const isProjectionAuto = inputProjection === 'auto';
    const hasError = parseError || coordinateError;
    const hasContent = rawText.trim().length > 0;

    // Don't show anything if no content
    if (!hasContent) {
        return null;
    }

    // Show loading state
    if (isParsing) {
        return (
            <div className="flex items-center gap-2 py-1">
                <span className="inline-flex items-center gap-1 text-xs text-neutral-500 dark:text-neutral-400">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Parsing...
                </span>
            </div>
        );
    }

    const formatValue = detectedFormat ? formatLabels[detectedFormat] : null;
    const projectionValue = detectedProjection ? projectionLabels[detectedProjection] : null;

    const showSuccess = !hasError && (detectedFormat || detectedProjection);

    return (
        <div className="flex flex-wrap items-center gap-2 py-1">
            {/* Success indicator when no errors */}
            {showSuccess && (
                <CheckCircle2 className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
            )}

            {/* Detected format */}
            <StatusBadge
                label="Format"
                value={formatValue}
                icon={<FileType className="h-3 w-3" />}
                isAuto={isFormatAuto}
            />

            {/* Detected projection */}
            <StatusBadge
                label="Projection"
                value={projectionValue}
                icon={<MapPin className="h-3 w-3" />}
                isAuto={isProjectionAuto}
            />

            {/* Parse error */}
            {parseError && <ErrorBadge error={parseError} />}

            {/* Coordinate error */}
            {coordinateError && <ErrorBadge error={coordinateError} />}
        </div>
    );
}
