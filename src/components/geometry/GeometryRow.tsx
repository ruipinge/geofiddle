import { useState, useMemo } from 'react';
import {
    ChevronDown,
    ChevronRight,
    MapPin,
    Circle,
    Spline,
    Pentagon,
    CircleDot,
    Layers,
    Boxes,
} from 'lucide-react';
import type { ParsedFeature } from '@/types';
import type { Geometry } from 'geojson';
import {
    calculateArea,
    calculateLength,
    countCoordinates,
    getGeometryTypeLabel,
    formatArea,
    formatLength,
} from '@/lib/geometry/calculations';
import { useReverseGeocode, getGeometryCentroid } from '@/hooks/useReverseGeocode';

interface GeometryRowProps {
    feature: ParsedFeature;
    index: number;
    isSelected: boolean;
    onSelect: () => void;
    onHover: (isHovering: boolean) => void;
}

/**
 * Returns the appropriate icon component for a geometry type
 */
function getGeometryIcon(type: Geometry['type']) {
    switch (type) {
        case 'Point':
            return Circle;
        case 'MultiPoint':
            return CircleDot;
        case 'LineString':
            return Spline;
        case 'MultiLineString':
            return Spline;
        case 'Polygon':
            return Pentagon;
        case 'MultiPolygon':
            return Layers;
        case 'GeometryCollection':
            return Boxes;
        default:
            return Circle;
    }
}

/**
 * Detail section that only renders when expanded (triggers reverse geocode)
 */
function GeometryDetails({ feature, calculations }: {
    feature: ParsedFeature;
    calculations: {
        area: number | null;
        length: number | null;
        pointCount: number;
        formattedArea: string;
        formattedLength: string;
    };
}) {
    const { geometry } = feature;

    // Get centroid for reverse geocoding - only calculated when this component mounts
    const centroid = useMemo(() => getGeometryCentroid(geometry), [geometry]);
    const { location, isLoading: isLoadingLocation } = useReverseGeocode(
        centroid?.lat ?? null,
        centroid?.lon ?? null
    );

    const showArea = calculations.area !== null && calculations.area > 0;
    const showLength = calculations.length !== null && calculations.length > 0;

    return (
        <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 border-t border-neutral-200 pt-2 text-xs dark:border-neutral-700">
            {/* Location */}
            <div className="col-span-2 flex items-center gap-1.5 text-neutral-600 dark:text-neutral-400">
                <MapPin className="h-3.5 w-3.5 shrink-0" />
                {isLoadingLocation ? (
                    <span className="animate-pulse text-neutral-400">Loading location...</span>
                ) : location ? (
                    <span className="truncate" title={location}>{location}</span>
                ) : (
                    <span className="text-neutral-400 dark:text-neutral-500">Location unavailable</span>
                )}
            </div>

            {/* Points */}
            <div className="text-neutral-500 dark:text-neutral-400">
                <span className="font-medium text-neutral-700 dark:text-neutral-300">Points:</span>{' '}
                {calculations.pointCount}
            </div>

            {/* Area (only for polygons) */}
            {showArea && (
                <div className="text-neutral-500 dark:text-neutral-400">
                    <span className="font-medium text-neutral-700 dark:text-neutral-300">Area:</span>{' '}
                    {calculations.formattedArea}
                </div>
            )}

            {/* Length (only for lines) */}
            {showLength && (
                <div className="text-neutral-500 dark:text-neutral-400">
                    <span className="font-medium text-neutral-700 dark:text-neutral-300">
                        {geometry.type.includes('Polygon') ? 'Perimeter:' : 'Length:'}
                    </span>{' '}
                    {calculations.formattedLength}
                </div>
            )}

            {/* Centroid coordinates */}
            {centroid && (
                <div className="col-span-2 text-neutral-500 dark:text-neutral-400">
                    <span className="font-medium text-neutral-700 dark:text-neutral-300">Centroid:</span>{' '}
                    {centroid.lat.toFixed(6)}, {centroid.lon.toFixed(6)}
                </div>
            )}
        </div>
    );
}

export function GeometryRow({ feature, index, isSelected, onSelect, onHover }: GeometryRowProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const { geometry, properties } = feature;

    const handleMouseEnter = () => {
        onHover(true);
    };

    const handleMouseLeave = () => {
        onHover(false);
    };

    const calculations = useMemo(() => {
        const area = calculateArea(geometry);
        const length = calculateLength(geometry);
        const pointCount = countCoordinates(geometry);
        const typeLabel = getGeometryTypeLabel(geometry.type);

        return {
            area,
            length,
            pointCount,
            typeLabel,
            formattedArea: formatArea(area),
            formattedLength: formatLength(length),
        };
    }, [geometry]);

    const featureName = properties.name;
    const name = typeof featureName === 'string' && featureName.trim()
        ? featureName
        : `Feature ${String(index + 1)}`;

    const IconComponent = getGeometryIcon(geometry.type);

    const handleToggleExpand = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsExpanded((prev) => !prev);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            onSelect();
        } else if (e.key === ' ') {
            e.preventDefault();
            setIsExpanded((prev) => !prev);
        }
    };

    // Subtitle based on geometry type
    const subtitle = useMemo(() => {
        const parts: string[] = [calculations.typeLabel];

        if (calculations.pointCount > 1) {
            parts.push(`${String(calculations.pointCount)} pts`);
        }

        if (calculations.area !== null && calculations.area > 0) {
            parts.push(calculations.formattedArea);
        } else if (calculations.length !== null && calculations.length > 0) {
            parts.push(calculations.formattedLength);
        }

        return parts.join(' · ');
    }, [calculations]);

    return (
        <div
            onClick={onSelect}
            onKeyDown={handleKeyDown}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            tabIndex={0}
            role="button"
            aria-expanded={isExpanded}
            aria-selected={isSelected}
            className={`cursor-pointer border-b border-neutral-200 px-3 py-2 transition-colors hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary-500 dark:border-neutral-700 dark:hover:bg-neutral-800 ${
                isSelected
                    ? 'bg-blue-50 hover:bg-blue-100 dark:bg-blue-950 dark:hover:bg-blue-900'
                    : 'bg-white dark:bg-neutral-900'
            }`}
        >
            <div className="flex items-center gap-3">
                {/* Expand/Collapse button */}
                <button
                    onClick={handleToggleExpand}
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded text-neutral-400 hover:bg-neutral-200 hover:text-neutral-600 dark:hover:bg-neutral-700 dark:hover:text-neutral-300"
                    aria-label={isExpanded ? 'Collapse details' : 'Expand details'}
                >
                    {isExpanded ? (
                        <ChevronDown className="h-4 w-4" />
                    ) : (
                        <ChevronRight className="h-4 w-4" />
                    )}
                </button>

                {/* Geometry type icon */}
                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                    isSelected
                        ? 'bg-primary-100 text-primary-600 dark:bg-primary-900 dark:text-primary-400'
                        : 'bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400'
                }`}>
                    <IconComponent className="h-4 w-4" />
                </div>

                {/* Name and subtitle */}
                <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-neutral-900 dark:text-neutral-100">
                        {name}
                    </div>
                    <div className="truncate text-xs text-neutral-500 dark:text-neutral-400">
                        {subtitle}
                    </div>
                </div>

                {/* Index badge */}
                <div className="shrink-0 text-xs font-medium text-neutral-400 dark:text-neutral-500">
                    #{index + 1}
                </div>
            </div>

            {/* Expandable details - only render when expanded to defer reverse geocode */}
            {isExpanded && (
                <GeometryDetails feature={feature} calculations={calculations} />
            )}
        </div>
    );
}
