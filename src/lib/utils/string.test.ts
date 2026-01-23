import { describe, it, expect } from 'vitest';
import { stringClean, parseDsv } from './string';

describe('stringClean', () => {
    it('should trim whitespace', () => {
        expect(stringClean('  hello  ')).toBe('hello');
    });

    it('should replace line breaks with space', () => {
        expect(stringClean('hello\nworld')).toBe('hello world');
        expect(stringClean('hello\r\nworld')).toBe('hello world');
        expect(stringClean('hello\rworld')).toBe('hello world');
    });

    it('should replace multiple spaces with single space', () => {
        expect(stringClean('hello    world')).toBe('hello world');
    });

    it('should handle combined cases', () => {
        expect(stringClean('  hello\n\n  world  ')).toBe('hello world');
    });
});

describe('parseDsv', () => {
    it('should return empty array for empty string', () => {
        expect(parseDsv('')).toEqual([]);
        expect(parseDsv('   ')).toEqual([]);
    });

    it('should parse comma-separated values', () => {
        expect(parseDsv('1,2,3')).toEqual([1, 2, 3]);
    });

    it('should parse space-separated values', () => {
        expect(parseDsv('1 2 3')).toEqual([1, 2, 3]);
    });

    it('should parse semicolon-separated values', () => {
        expect(parseDsv('1;2;3')).toEqual([1, 2, 3]);
    });

    it('should parse pipe-separated values', () => {
        expect(parseDsv('1|2|3')).toEqual([1, 2, 3]);
    });

    it('should handle decimal numbers', () => {
        expect(parseDsv('1.5,2.5,3.5')).toEqual([1.5, 2.5, 3.5]);
    });

    it('should handle negative numbers', () => {
        expect(parseDsv('-1,-2,-3')).toEqual([-1, -2, -3]);
    });

    it('should handle mixed delimiters', () => {
        expect(parseDsv('1,2;3 4|5')).toEqual([1, 2, 3, 4, 5]);
    });

    it('should throw error for non-numeric values', () => {
        expect(() => parseDsv('1,abc,3')).toThrow('Invalid number: abc');
    });

    it('should handle multiline input', () => {
        expect(parseDsv('1,2\n3,4')).toEqual([1, 2, 3, 4]);
    });
});
