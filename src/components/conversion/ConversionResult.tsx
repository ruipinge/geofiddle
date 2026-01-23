import { useMemo } from 'react';
import { useGeometryStore } from '@/stores/geometryStore';
import { useConversionStore } from '@/stores/conversionStore';

export function ConversionResult() {
    const { features, parseError } = useGeometryStore();
    const { outputFormat } = useConversionStore();

    const convertedOutput = useMemo(() => {
        if (features.length === 0) {
            return '';
        }

        // For now, just output GeoJSON
        // TODO: Implement format conversion
        if (outputFormat === 'geojson') {
            return JSON.stringify(
                {
                    type: 'FeatureCollection',
                    features,
                },
                null,
                2
            );
        }

        return `// ${outputFormat.toUpperCase()} conversion not yet implemented`;
    }, [features, outputFormat]);

    if (parseError) {
        return (
            <div className="mb-3 rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
                {parseError}
            </div>
        );
    }

    if (!convertedOutput) {
        return (
            <div className="mb-3 rounded-md border border-neutral-200 bg-neutral-100 p-3 text-sm text-neutral-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-400">
                Converted output will appear here
            </div>
        );
    }

    return (
        <pre className="mb-3 max-h-48 overflow-auto rounded-md border border-neutral-200 bg-neutral-100 p-3 font-mono text-sm text-neutral-900 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100">
            {convertedOutput}
        </pre>
    );
}
