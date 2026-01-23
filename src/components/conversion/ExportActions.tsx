import { useCallback } from 'react';
import { Download, Copy, Link } from 'lucide-react';
import { useGeometryStore } from '@/stores/geometryStore';
import { useConversionStore } from '@/stores/conversionStore';

export function ExportActions() {
    const { features } = useGeometryStore();
    const { outputFormat } = useConversionStore();

    const handleCopy = useCallback(async () => {
        const output = JSON.stringify(
            { type: 'FeatureCollection', features },
            null,
            2
        );
        await navigator.clipboard.writeText(output);
    }, [features]);

    const handleDownload = useCallback(() => {
        const output = JSON.stringify(
            { type: 'FeatureCollection', features },
            null,
            2
        );
        const blob = new Blob([output], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `geometry.${outputFormat === 'geojson' ? 'json' : outputFormat}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }, [features, outputFormat]);

    const handleShare = useCallback(async () => {
        await navigator.clipboard.writeText(window.location.href);
    }, []);

    return (
        <div className="flex gap-2">
            <button onClick={handleCopy} className="btn-secondary flex-1">
                <Copy className="h-4 w-4" />
                Copy
            </button>
            <button onClick={handleDownload} className="btn-secondary flex-1">
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
