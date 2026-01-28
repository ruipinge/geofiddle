import { useCallback } from 'react';
import { Trash2, Link } from 'lucide-react';
import { DropZone } from './DropZone';
import { TextEditor } from './TextEditor';
import { FormatSelect } from './FormatSelect';
import { ProjectionSelect } from './ProjectionSelect';
import { StatusIndicator } from './StatusIndicator';
import { useGeometryStore } from '@/stores/geometryStore';

const ACCEPTED_EXTENSIONS = ['.json', '.geojson', '.wkt', '.csv', '.kml', '.gpx', '.txt'];

export function InputArea() {
    const {
        rawText,
        inputFormat,
        inputProjection,
        detectedFormat,
        detectedProjection,
        setRawText,
        setInputFormat,
        setInputProjection,
    } = useGeometryStore();

    const handleFileDrop = useCallback(
        (content: string, _filename: string) => {
            setRawText(content);
        },
        [setRawText]
    );

    const handleClear = useCallback(() => {
        setRawText('');
    }, [setRawText]);

    const handleShare = useCallback(async () => {
        await navigator.clipboard.writeText(window.location.href);
    }, []);

    return (
        <div className="border-b border-neutral-200 p-3 md:p-4 dark:border-neutral-700">
            <div className="mb-2 flex items-center gap-2 md:mb-3">
                <h2 className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                    Input Geometry
                </h2>
                <StatusIndicator />
                <div className="ml-auto flex gap-1">
                    {rawText && (
                        <button
                            onClick={handleShare}
                            className="rounded p-1 text-neutral-400 transition-colors hover:bg-neutral-200 hover:text-neutral-600 dark:hover:bg-neutral-700 dark:hover:text-neutral-300"
                            title="Copy link to clipboard"
                            aria-label="Copy shareable link to clipboard"
                        >
                            <Link className="h-4 w-4" />
                        </button>
                    )}
                    {rawText && (
                        <button
                            onClick={handleClear}
                            className="rounded p-1 text-neutral-400 transition-colors hover:bg-neutral-200 hover:text-neutral-600 dark:hover:bg-neutral-700 dark:hover:text-neutral-300"
                            title="Clear input"
                            aria-label="Clear input"
                        >
                            <Trash2 className="h-4 w-4" />
                        </button>
                    )}
                </div>
            </div>
            <div className="mb-2 flex gap-2 md:mb-3">
                <FormatSelect
                    value={inputFormat}
                    onChange={setInputFormat}
                    detectedValue={detectedFormat}
                    label="Format"
                />
                <ProjectionSelect
                    value={inputProjection}
                    onChange={setInputProjection}
                    detectedValue={detectedProjection}
                    label="Projection"
                />
            </div>
            <DropZone onFileDrop={handleFileDrop} accept={ACCEPTED_EXTENSIONS}>
                <TextEditor
                    value={rawText}
                    onChange={setRawText}
                    placeholder="Paste or drop GeoJSON, WKT, CSV, KML, GPX..."
                />
            </DropZone>
        </div>
    );
}
