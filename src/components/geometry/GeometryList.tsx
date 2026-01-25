import { useState, useMemo, useCallback } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { useGeometryStore } from '@/stores/geometryStore';
import { GeometryRow } from './GeometryRow';
import {
    calculateArea,
    calculateLength,
    countCoordinates,
} from '@/lib/geometry/calculations';

type SortField = 'index' | 'name' | 'type' | 'location' | 'points' | 'area' | 'length';
type SortDirection = 'asc' | 'desc';

interface SortConfig {
    field: SortField;
    direction: SortDirection;
}

const COLUMN_HEADERS: { field: SortField; label: string; align?: 'right'; sortable?: boolean }[] = [
    { field: 'index', label: '#' },
    { field: 'name', label: 'Name' },
    { field: 'type', label: 'Type' },
    { field: 'location', label: 'Location', sortable: false },
    { field: 'points', label: 'Points', align: 'right' },
    { field: 'area', label: 'Area', align: 'right' },
    { field: 'length', label: 'Length', align: 'right' },
];

export function GeometryList() {
    const { features, selectedFeatureId, setSelectedFeatureId } = useGeometryStore();
    const [sortConfig, setSortConfig] = useState<SortConfig>({
        field: 'index',
        direction: 'asc',
    });

    const handleSort = useCallback((field: SortField) => {
        setSortConfig((prev) => ({
            field,
            direction:
                prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc',
        }));
    }, []);

    const sortedFeatures = useMemo(() => {
        if (features.length === 0) {
            return [];
        }

        // Create array with indices and calculated values
        const withCalculations = features.map((feature, index) => {
            const featureName = feature.properties.name;
            const displayName = typeof featureName === 'string' ? featureName : `Feature ${String(index + 1)}`;
            return {
                feature,
                index,
                area: calculateArea(feature.geometry) ?? -Infinity,
                length: calculateLength(feature.geometry) ?? -Infinity,
                points: countCoordinates(feature.geometry),
                name: displayName,
                type: feature.geometry.type,
            };
        });

        // Sort based on current config
        const { field, direction } = sortConfig;
        const multiplier = direction === 'asc' ? 1 : -1;

        withCalculations.sort((a, b) => {
            let comparison = 0;

            switch (field) {
                case 'index':
                    comparison = a.index - b.index;
                    break;
                case 'name':
                    comparison = a.name.localeCompare(b.name);
                    break;
                case 'type':
                    comparison = a.type.localeCompare(b.type);
                    break;
                case 'points':
                    comparison = a.points - b.points;
                    break;
                case 'area':
                    comparison = a.area - b.area;
                    break;
                case 'length':
                    comparison = a.length - b.length;
                    break;
            }

            return comparison * multiplier;
        });

        return withCalculations;
    }, [features, sortConfig]);

    const handleSelectFeature = useCallback(
        (featureId: string) => {
            // Toggle selection if clicking the same feature
            if (selectedFeatureId === featureId) {
                setSelectedFeatureId(null);
            } else {
                setSelectedFeatureId(featureId);
            }
        },
        [selectedFeatureId, setSelectedFeatureId]
    );

    if (features.length === 0) {
        return (
            <div className="rounded-md border border-neutral-200 bg-neutral-50 p-4 text-center text-sm text-neutral-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-400">
                No geometries to display
            </div>
        );
    }

    return (
        <div className="overflow-hidden rounded-md border border-neutral-200 dark:border-neutral-700">
            <div className="max-h-64 overflow-auto">
                <table className="w-full min-w-full table-fixed">
                    <thead className="sticky top-0 bg-neutral-100 dark:bg-neutral-800">
                        <tr>
                            {COLUMN_HEADERS.map(({ field, label, align, sortable }) => {
                                const isSortable = sortable !== false;
                                return (
                                    <th
                                        key={field}
                                        onClick={isSortable ? () => { handleSort(field); } : undefined}
                                        className={`select-none px-3 py-2 text-xs font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 ${
                                            isSortable ? 'cursor-pointer hover:bg-neutral-200 dark:hover:bg-neutral-700' : ''
                                        } ${align === 'right' ? 'text-right' : 'text-left'} ${
                                            field === 'index' ? 'w-12' : ''
                                        } ${field === 'name' ? 'w-auto' : ''} ${
                                            field === 'type' ? 'w-24' : ''
                                        } ${field === 'location' ? 'w-32' : ''} ${
                                            ['points', 'area', 'length'].includes(field) ? 'w-20' : ''
                                        }`}
                                    >
                                        <span className="inline-flex items-center gap-1">
                                            {label}
                                            {isSortable && sortConfig.field === field && (
                                                sortConfig.direction === 'asc' ? (
                                                    <ChevronUp className="h-3 w-3" />
                                                ) : (
                                                    <ChevronDown className="h-3 w-3" />
                                                )
                                            )}
                                        </span>
                                    </th>
                                );
                            })}
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-neutral-900">
                        {sortedFeatures.map(({ feature, index }) => (
                            <GeometryRow
                                key={feature.id}
                                feature={feature}
                                index={index}
                                isSelected={selectedFeatureId === feature.id}
                                onSelect={() => { handleSelectFeature(feature.id); }}
                            />
                        ))}
                    </tbody>
                </table>
            </div>
            <div className="border-t border-neutral-200 bg-neutral-50 px-3 py-2 text-xs text-neutral-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-400">
                {features.length} {features.length === 1 ? 'geometry' : 'geometries'}
            </div>
        </div>
    );
}
