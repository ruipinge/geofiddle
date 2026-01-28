import { useConversionStore } from '@/stores/conversionStore';
import { useGeometryStore } from '@/stores/geometryStore';
import { ConversionResult } from './ConversionResult';
import { EnvelopeDisplay } from './EnvelopeDisplay';
import { ExportActions } from './ExportActions';
import type { FormatType, ProjectionType } from '@/types';

const FORMAT_OPTIONS: { value: FormatType; label: string }[] = [
    { value: 'geojson', label: 'GeoJSON' },
    { value: 'wkt', label: 'WKT' },
    { value: 'ewkt', label: 'EWKT' },
    { value: 'csv', label: 'CSV' },
    { value: 'polyline5', label: 'Polyline (5)' },
    { value: 'polyline6', label: 'Polyline (6)' },
];

const PROJECTION_OPTIONS: { value: ProjectionType; label: string }[] = [
    { value: 'EPSG:4326', label: 'WGS84 (EPSG:4326)' },
    { value: 'EPSG:3857', label: 'Web Mercator (EPSG:3857)' },
    { value: 'EPSG:27700', label: 'British National Grid (EPSG:27700)' },
];

export function ConversionArea() {
    const { outputFormat, outputProjection, setOutputFormat, setOutputProjection } =
        useConversionStore();
    const { features } = useGeometryStore();
    const hasFeatures = features.length > 0;

    return (
        <div className="flex-1 p-3 md:p-4">
            <div className="mb-2 flex items-center justify-between md:mb-3">
                <h2 className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                    Conversion
                </h2>
                {hasFeatures && <ExportActions />}
            </div>
            <div className="mb-2 flex gap-2 md:mb-3">
                <div className="flex-1">
                    <label className="label">Format</label>
                    <select
                        value={outputFormat}
                        onChange={(e) =>
                            { setOutputFormat(e.target.value as FormatType); }
                        }
                        className="input"
                    >
                        {FORMAT_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="flex-1">
                    <label className="label">Projection</label>
                    <select
                        value={outputProjection}
                        onChange={(e) =>
                            { setOutputProjection(e.target.value as ProjectionType); }
                        }
                        className="input"
                    >
                        {PROJECTION_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                </div>
            </div>
            <ConversionResult />
            {hasFeatures && <EnvelopeDisplay />}
        </div>
    );
}
