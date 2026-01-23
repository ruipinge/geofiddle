import type { FormatType } from '@/types';

interface FormatSelectProps {
    value: FormatType | 'auto';
    onChange: (value: FormatType | 'auto') => void;
    detectedValue: FormatType | null;
    label: string;
}

const FORMAT_OPTIONS: { value: FormatType | 'auto'; label: string }[] = [
    { value: 'auto', label: 'Auto-detect' },
    { value: 'geojson', label: 'GeoJSON' },
    { value: 'wkt', label: 'WKT' },
    { value: 'ewkt', label: 'EWKT' },
    { value: 'csv', label: 'CSV' },
    { value: 'kml', label: 'KML' },
    { value: 'gpx', label: 'GPX' },
    { value: 'polyline5', label: 'Polyline (5)' },
    { value: 'polyline6', label: 'Polyline (6)' },
];

export function FormatSelect({
    value,
    onChange,
    detectedValue,
    label,
}: FormatSelectProps) {
    const displayLabel =
        value === 'auto' && detectedValue
            ? `Auto (${detectedValue.toUpperCase()})`
            : FORMAT_OPTIONS.find((opt) => opt.value === value)?.label ?? value;

    return (
        <div className="flex-1">
            <label className="label">{label}</label>
            <select
                value={value}
                onChange={(e) => { onChange(e.target.value as FormatType | 'auto'); }}
                className="input"
                aria-label={`${label}: ${displayLabel}`}
            >
                {FORMAT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>
        </div>
    );
}
