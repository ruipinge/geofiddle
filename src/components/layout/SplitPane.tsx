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
        <main
            id="main-content"
            ref={containerRef}
            className="flex flex-1 overflow-hidden"
            role="main"
        >
            <section
                style={{ width: leftWidth }}
                className="shrink-0 overflow-hidden"
                aria-label="Input and conversion panel"
            >
                {left}
            </section>
            <div
                onMouseDown={handleMouseDown}
                role="separator"
                aria-orientation="vertical"
                aria-label="Resize panels"
                tabIndex={0}
                onKeyDown={(e) => {
                    if (e.key === 'ArrowLeft') {
                        setLeftWidth((w) => Math.max(minLeftWidth, w - 20));
                    } else if (e.key === 'ArrowRight') {
                        setLeftWidth((w) => Math.min(maxLeftWidth, w + 20));
                    }
                }}
                className={`w-1 shrink-0 cursor-col-resize bg-neutral-200 transition-colors hover:bg-primary-400 focus-visible:bg-primary-500 focus-visible:outline-none dark:bg-neutral-700 dark:hover:bg-primary-500 ${
                    isDragging ? 'bg-primary-500 dark:bg-primary-500' : ''
                }`}
            />
            <section className="flex-1 overflow-hidden" aria-label="Map view">
                {right}
            </section>
        </main>
    );
}
