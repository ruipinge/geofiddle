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
