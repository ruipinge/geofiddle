import { useState, useCallback, useRef, useEffect, type ReactNode } from 'react';

interface SplitPaneProps {
    left: ReactNode;
    right: ReactNode;
    leftWidthPercent: number;
    minLeftWidthPercent: number;
    maxLeftWidthPercent: number;
    onLeftWidthPercentChange: (percent: number) => void;
}

export function SplitPane({
    left,
    right,
    leftWidthPercent,
    minLeftWidthPercent,
    maxLeftWidthPercent,
    onLeftWidthPercentChange,
}: SplitPaneProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [containerWidth, setContainerWidth] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);

    // Track container width for percentage calculations
    useEffect(() => {
        const container = containerRef.current;
        if (!container) {
            return;
        }

        const updateWidth = () => {
            setContainerWidth(container.getBoundingClientRect().width);
        };

        updateWidth();

        const resizeObserver = new ResizeObserver(updateWidth);
        resizeObserver.observe(container);

        return () => {
            resizeObserver.disconnect();
        };
    }, []);

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
            const newPercent = (newWidth / containerRect.width) * 100;
            const clampedPercent = Math.min(maxLeftWidthPercent, Math.max(minLeftWidthPercent, newPercent));
            onLeftWidthPercentChange(clampedPercent);
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
    }, [isDragging, minLeftWidthPercent, maxLeftWidthPercent, onLeftWidthPercentChange]);

    // Calculate pixel width from percentage
    const leftWidth = containerWidth > 0 ? (leftWidthPercent / 100) * containerWidth : 0;

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
                    const stepPercent = 2; // 2% per key press
                    if (e.key === 'ArrowLeft') {
                        onLeftWidthPercentChange(Math.max(minLeftWidthPercent, leftWidthPercent - stepPercent));
                    } else if (e.key === 'ArrowRight') {
                        onLeftWidthPercentChange(Math.min(maxLeftWidthPercent, leftWidthPercent + stepPercent));
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
