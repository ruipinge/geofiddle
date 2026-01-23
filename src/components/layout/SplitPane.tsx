import { useState, useCallback, useRef, useEffect, type ReactNode } from 'react';

interface SplitPaneProps {
    left: ReactNode;
    right: ReactNode;
    defaultLeftWidth: number;
    minLeftWidth: number;
    maxLeftWidth: number;
}

export function SplitPane({
    left,
    right,
    defaultLeftWidth,
    minLeftWidth,
    maxLeftWidth,
}: SplitPaneProps) {
    const [leftWidth, setLeftWidth] = useState(defaultLeftWidth);
    const [isDragging, setIsDragging] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const handleMouseDown = useCallback(() => {
        setIsDragging(true);
    }, []);

    // Attach/detach event listeners based on isDragging state
    useEffect(() => {
        if (!isDragging) {
            return;
        }

        const handleMouseMove = (e: MouseEvent) => {
            if (!containerRef.current) {
                return;
            }
            const containerRect = containerRef.current.getBoundingClientRect();
            const newWidth = e.clientX - containerRect.left;
            setLeftWidth(Math.min(maxLeftWidth, Math.max(minLeftWidth, newWidth)));
        };

        const handleMouseUp = () => {
            setIsDragging(false);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, minLeftWidth, maxLeftWidth]);

    return (
        <div ref={containerRef} className="flex flex-1 overflow-hidden">
            <div
                style={{ width: leftWidth }}
                className="shrink-0 overflow-hidden"
            >
                {left}
            </div>
            <div
                onMouseDown={handleMouseDown}
                className={`w-1 shrink-0 cursor-col-resize bg-neutral-200 transition-colors hover:bg-primary-400 dark:bg-neutral-700 dark:hover:bg-primary-500 ${
                    isDragging ? 'bg-primary-500 dark:bg-primary-500' : ''
                }`}
            />
            <div className="flex-1 overflow-hidden">{right}</div>
        </div>
    );
}
