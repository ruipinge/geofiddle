import { useCallback } from 'react';
import { DropZone } from './DropZone';
import { TextEditor } from './TextEditor';
import { FormatSelect } from './FormatSelect';
import { ProjectionSelect } from './ProjectionSelect';
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

    return (
        <div className="border-b border-neutral-200 p-4 dark:border-neutral-700">
            <h2 className="mb-3 text-sm font-medium text-neutral-700 dark:text-neutral-300">
                Input Geometry
            </h2>
            <div className="mb-3 flex gap-2">
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
