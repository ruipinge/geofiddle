import { useEffect, useRef, useCallback } from 'react';
import { useGeometryStore } from '@/stores/geometryStore';
import type { ParserRequest, ParserResponse } from '@/workers/parser.worker';

// Size threshold for using Web Worker (100KB)
const WORKER_THRESHOLD = 100 * 1024;

// Debounce delay in ms
const DEBOUNCE_DELAY = 150;

/**
 * Hook that automatically parses geometry input when it changes
 * and updates the geometry store with features or errors.
 * Uses a Web Worker for large inputs to avoid blocking the main thread.
 */
export function useGeometryParsing(): void {
    const {
        rawText,
        inputFormat,
        inputProjection,
        setFeatures,
        setParseError,
        setDetectedFormat,
        setDetectedProjection,
        setIsParsing,
    } = useGeometryStore();

    const workerRef = useRef<Worker | null>(null);
    const requestIdRef = useRef(0);
    const debounceTimerRef = useRef<ReturnType<typeof setTimeout>>();

    // Cleanup worker on unmount
    useEffect(() => {
        return () => {
            if (workerRef.current) {
                workerRef.current.terminate();
                workerRef.current = null;
            }
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }
        };
    }, []);

    // Get or create worker
    const getWorker = useCallback(() => {
        if (!workerRef.current) {
            workerRef.current = new Worker(
                new URL('../workers/parser.worker.ts', import.meta.url),
                { type: 'module' }
            );
        }
        return workerRef.current;
    }, []);

    // Parse with worker (for large inputs)
    const parseWithWorker = useCallback(
        (text: string) => {
            const worker = getWorker();
            const requestId = ++requestIdRef.current;

            setIsParsing(true);

            worker.onmessage = (e: MessageEvent<ParserResponse>) => {
                const response = e.data;
                // Ignore stale responses
                if (response.id !== requestIdRef.current) {
                    return;
                }

                setIsParsing(false);

                if (response.parseError) {
                    setParseError(response.parseError);
                } else {
                    setFeatures(response.features);
                }
                setDetectedFormat(response.detectedFormat);
                setDetectedProjection(response.detectedProjection);
            };

            worker.onerror = (error) => {
                setIsParsing(false);
                setParseError(`Worker error: ${error.message}`);
            };

            const request: ParserRequest = {
                id: requestId,
                rawText: text,
                inputFormat,
                inputProjection,
            };
            worker.postMessage(request);
        },
        [
            getWorker,
            inputFormat,
            inputProjection,
            setFeatures,
            setParseError,
            setDetectedFormat,
            setDetectedProjection,
            setIsParsing,
        ]
    );

    // Parse synchronously (for small inputs)
    const parseSync = useCallback(
        async (text: string) => {
            // Dynamic import to avoid bundling in main thread when using worker
            const { parse } = await import('@/lib/parsers');
            const { detectFormat, detectProjection } = await import('@/lib/utils/format-detection');

            if (!text.trim()) {
                setFeatures([]);
                setDetectedFormat(null);
                setDetectedProjection(null);
                return;
            }

            const formatToUse = inputFormat === 'auto' ? detectFormat(text) : inputFormat;
            const detectedFormat = inputFormat === 'auto' ? formatToUse : null;

            if (!formatToUse) {
                setParseError('Could not auto-detect format. Please select a format manually.');
                return;
            }

            const detectedProjection = inputProjection === 'auto'
                ? detectProjection(text, formatToUse)
                : null;

            try {
                const result = parse(text, formatToUse);

                if (result.errors.length > 0) {
                    setParseError(result.errors.map((e) => e.message).join('\n'));
                } else {
                    setFeatures(result.features);
                }
                setDetectedFormat(detectedFormat);
                setDetectedProjection(detectedProjection ?? result.detectedProjection ?? null);
            } catch (err) {
                setParseError(err instanceof Error ? err.message : 'Parsing failed');
            }
        },
        [
            inputFormat,
            inputProjection,
            setFeatures,
            setParseError,
            setDetectedFormat,
            setDetectedProjection,
        ]
    );

    // Main parsing effect with debouncing
    useEffect(() => {
        // Clear any pending debounce
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }

        // Handle empty input immediately
        if (!rawText.trim()) {
            setFeatures([]);
            setDetectedFormat(null);
            setDetectedProjection(null);
            setIsParsing(false);
            return;
        }

        // Debounce parsing
        debounceTimerRef.current = setTimeout(() => {
            // Use worker for large inputs, sync for small
            if (rawText.length > WORKER_THRESHOLD) {
                parseWithWorker(rawText);
            } else {
                void parseSync(rawText);
            }
        }, DEBOUNCE_DELAY);

        return () => {
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }
        };
    }, [
        rawText,
        inputFormat,
        inputProjection,
        parseWithWorker,
        parseSync,
        setFeatures,
        setDetectedFormat,
        setDetectedProjection,
        setIsParsing,
    ]);
}
