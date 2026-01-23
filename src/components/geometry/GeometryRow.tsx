import { useMemo } from 'react';
import type { ParsedFeature } from '@/types';
import {
    calculateArea,
    calculateLength,
    countCoordinates,
    getGeometryTypeLabel,
    formatArea,
    formatLength,
} from '@/lib/geometry/calculations';

interface GeometryRowProps {
    feature: ParsedFeature;
    index: number;
    isSelected: boolean;
    onSelect: () => void;
}

export function GeometryRow({ feature, index, isSelected, onSelect }: GeometryRowProps) {
    const { geometry, properties } = feature;

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
    const name = typeof featureName === 'string' ? featureName : `Feature ${String(index + 1)}`;

    return (
        <tr
            onClick={onSelect}
            className={`cursor-pointer border-b border-neutral-200 transition-colors hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800 ${
                isSelected
                    ? 'bg-blue-50 hover:bg-blue-100 dark:bg-blue-950 dark:hover:bg-blue-900'
                    : ''
            }`}
        >
            <td className="px-3 py-2 text-sm">{index + 1}</td>
            <td className="px-3 py-2 text-sm font-medium">{name}</td>
            <td className="px-3 py-2 text-sm text-neutral-600 dark:text-neutral-400">
                {calculations.typeLabel}
            </td>
            <td className="px-3 py-2 text-sm text-right tabular-nums">
                {calculations.pointCount}
            </td>
            <td className="px-3 py-2 text-sm text-right tabular-nums">
                {calculations.formattedArea}
            </td>
            <td className="px-3 py-2 text-sm text-right tabular-nums">
                {calculations.formattedLength}
            </td>
        </tr>
    );
}
