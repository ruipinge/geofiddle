import { useMemo } from 'react';
import { useGeometryStore } from '@/stores/geometryStore';
import { useConversionStore } from '@/stores/conversionStore';
import { format } from '@/lib/parsers';

export function ConversionResult() {
    const { features, parseError } = useGeometryStore();
    const { outputFormat } = useConversionStore();

    const { convertedOutput, conversionError } = useMemo(() => {
        if (features.length === 0) {
            return { convertedOutput: '', conversionError: null };
        }

        try {
            const output = format(features, outputFormat);
            return { convertedOutput: output, conversionError: null };
        } catch (e) {
            return {
                convertedOutput: '',
                conversionError: e instanceof Error ? e.message : 'Conversion failed',
            };
        }
    }, [features, outputFormat]);

    if (parseError) {
        return (
            <div className="mb-3 rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
                {parseError}
            </div>
        );
    }

    if (conversionError) {
        return (
            <div className="mb-3 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300">
                {conversionError}
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
