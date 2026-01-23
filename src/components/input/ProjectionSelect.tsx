import type { ProjectionType } from '@/types';

interface ProjectionSelectProps {
    value: ProjectionType | 'auto';
    onChange: (value: ProjectionType | 'auto') => void;
    detectedValue: ProjectionType | null;
    label: string;
}

const PROJECTION_OPTIONS: { value: ProjectionType | 'auto'; label: string }[] = [
    { value: 'auto', label: 'Auto-detect' },
    { value: 'EPSG:4326', label: 'WGS84 (EPSG:4326)' },
    { value: 'EPSG:3857', label: 'Web Mercator (EPSG:3857)' },
    { value: 'EPSG:27700', label: 'British National Grid (EPSG:27700)' },
];

export function ProjectionSelect({
    value,
    onChange,
    detectedValue,
    label,
}: ProjectionSelectProps) {
    const displayLabel =
        value === 'auto' && detectedValue
            ? `Auto (${detectedValue})`
            : PROJECTION_OPTIONS.find((opt) => opt.value === value)?.label ?? value;

    return (
        <div className="flex-1">
            <label className="label">{label}</label>
            <select
                value={value}
                onChange={(e) =>
                    { onChange(e.target.value as ProjectionType | 'auto'); }
                }
                className="input"
                aria-label={`${label}: ${displayLabel}`}
            >
                {PROJECTION_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>
        </div>
    );
}
