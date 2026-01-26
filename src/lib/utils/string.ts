/**
 * Cleans the provided string by:
 * - Trimming whitespace
 * - Replacing line breaks with a space
 * - Replacing multiple spaces with a single space
 */
export function stringClean(s: string): string {
    return s.trim().replace(/(?:\r\n|\r|\n)/g, ' ').replace(/\s+/g, ' ');
}

/**
 * Parses a delimiter-separated values string into an array of numbers.
 * Supports multiple delimiters: # & \ : / | ; , and whitespace
 * Note: This flattens all lines into a single array.
 *
 * @throws Error if any value cannot be parsed as a number
 */
export function parseDsv(s: string): number[] {
    const cleaned = stringClean(s);

    if (!cleaned) {
        return [];
    }

    const parts = cleaned.split(/[#&\\:/|;,\s]/);
    const result: number[] = [];

    for (const part of parts) {
        if (!part) {
            continue;
        }

        const n = Number(part);
        if (Number.isNaN(n)) {
            throw new Error(`Invalid number: ${part}`);
        }

        result.push(n);
    }

    return result;
}

/**
 * Parses a single line of delimiter-separated values into an array of numbers.
 * Supports multiple delimiters: # & \ : / | ; , and whitespace (except newlines)
 *
 * @throws Error if any value cannot be parsed as a number
 */
export function parseDsvLine(s: string): number[] {
    const trimmed = s.trim();

    if (!trimmed) {
        return [];
    }

    // Split on delimiters but not newlines
    const parts = trimmed.split(/[#&\\:/|;,\t ]+/);
    const result: number[] = [];

    for (const part of parts) {
        if (!part) {
            continue;
        }

        const n = Number(part);
        if (Number.isNaN(n)) {
            throw new Error(`Invalid number: ${part}`);
        }

        result.push(n);
    }

    return result;
}
