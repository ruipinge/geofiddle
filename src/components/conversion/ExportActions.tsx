import { useCallback, useMemo } from 'react';
import { Download, Copy, Link } from 'lucide-react';
import { useGeometryStore } from '@/stores/geometryStore';
import { useConversionStore } from '@/stores/conversionStore';
import { format } from '@/lib/parsers';
import type { FormatType } from '@/types';

// Get MIME type for different formats
function getMimeType(formatType: FormatType): string {
    switch (formatType) {
        case 'geojson':
            return 'application/geo+json';
        case 'wkt':
        case 'ewkt':
        case 'csv':
            return 'text/plain';
        case 'polyline5':
        case 'polyline6':
            return 'text/plain';
        default:
            return 'text/plain';
    }
}

// Get file extension for different formats
function getFileExtension(formatType: FormatType): string {
    switch (formatType) {
        case 'geojson':
            return 'geojson';
        case 'wkt':
            return 'wkt';
        case 'ewkt':
            return 'ewkt';
        case 'csv':
            return 'csv';
        case 'polyline5':
        case 'polyline6':
            return 'txt';
        default:
            return 'txt';
    }
}

export function ExportActions() {
    const { features } = useGeometryStore();
    const { outputFormat } = useConversionStore();

    const convertedOutput = useMemo(() => {
        if (features.length === 0) {
            return '';
        }
        try {
            return format(features, outputFormat);
        } catch {
            return '';
        }
    }, [features, outputFormat]);

    const handleCopy = useCallback(async () => {
        if (convertedOutput) {
            await navigator.clipboard.writeText(convertedOutput);
        }
    }, [convertedOutput]);

    const handleDownload = useCallback(() => {
        if (!convertedOutput) {
            return;
        }
        const mimeType = getMimeType(outputFormat);
        const extension = getFileExtension(outputFormat);
        const blob = new Blob([convertedOutput], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `geometry.${extension}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }, [convertedOutput, outputFormat]);

    const handleShare = useCallback(async () => {
        await navigator.clipboard.writeText(window.location.href);
    }, []);

    const isDisabled = !convertedOutput;

    return (
        <div className="flex gap-2">
            <button
                onClick={handleCopy}
                disabled={isDisabled}
                className="btn-secondary flex-1 disabled:cursor-not-allowed disabled:opacity-50"
            >
                <Copy className="h-4 w-4" />
                Copy
            </button>
            <button
                onClick={handleDownload}
                disabled={isDisabled}
                className="btn-secondary flex-1 disabled:cursor-not-allowed disabled:opacity-50"
            >
                <Download className="h-4 w-4" />
                Download
            </button>
            <button onClick={handleShare} className="btn-secondary flex-1">
                <Link className="h-4 w-4" />
                Share
            </button>
        </div>
    );
}
