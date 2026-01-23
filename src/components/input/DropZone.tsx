import { useState, useCallback, type ReactNode, type DragEvent } from 'react';
import { Upload } from 'lucide-react';

interface DropZoneProps {
    children: ReactNode;
    onFileDrop: (content: string, filename: string) => void;
    accept?: string[];
}

export function DropZone({ children, onFileDrop, accept }: DropZoneProps) {
    const [isDragOver, setIsDragOver] = useState(false);

    const handleDragEnter = useCallback((e: DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(true);
    }, []);

    const handleDragLeave = useCallback((e: DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        // Only set to false if we're leaving the drop zone entirely
        if (e.currentTarget === e.target) {
            setIsDragOver(false);
        }
    }, []);

    const handleDragOver = useCallback((e: DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    }, []);

    const handleDrop = useCallback(
        (e: DragEvent) => {
            e.preventDefault();
            e.stopPropagation();
            setIsDragOver(false);

            const file = e.dataTransfer.files[0];
            if (!file) {
                return;
            }

            // Check file extension if accept list provided
            if (accept && accept.length > 0) {
                const ext = `.${file.name.split('.').pop()?.toLowerCase() ?? ''}`;
                if (!accept.includes(ext) && !accept.includes('*')) {
                    console.warn(`File type ${ext} not accepted`);
                    return;
                }
            }

            const reader = new FileReader();
            reader.onload = (event) => {
                const content = event.target?.result;
                if (typeof content === 'string') {
                    onFileDrop(content, file.name);
                }
            };
            reader.onerror = () => {
                console.error('Failed to read file');
            };
            reader.readAsText(file);
        },
        [onFileDrop, accept]
    );

    return (
        <div
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            className="relative"
        >
            {children}

            {/* Drag overlay */}
            {isDragOver && (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-md border-2 border-dashed border-primary-500 bg-primary-50/90 dark:bg-primary-950/90">
                    <Upload className="mb-2 h-8 w-8 text-primary-500" />
                    <p className="text-sm font-medium text-primary-700 dark:text-primary-300">
                        Drop file to load
                    </p>
                    <p className="text-xs text-primary-600 dark:text-primary-400">
                        GeoJSON, WKT, CSV, KML, GPX
                    </p>
                </div>
            )}
        </div>
    );
}
