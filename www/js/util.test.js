const Util = require('./util');

test('clean a non trimmed string', () => {
    expect(Util.stringClean('    ab  ')).toBe('ab');
});

test('clean a string with multiple subsequent spaces', () => {
    expect(Util.stringClean('    a \t\n\r  b  ')).toBe('a b');
});

test('clean a string with tabs', () => {
    expect(Util.stringClean('\t    a \t  b  \t    cd\t')).toBe('a b cd');
});

test('clean a string with line breaks', () => {
    expect(Util.stringClean('\t  \n\n\n\r\n  a \t  b  \t    c\nd\t')).toBe('a b c d');
});

test('clean empty strings', () => {
    expect(Util.stringClean(null)).toBe('');
    expect(Util.stringClean(undefined)).toBe('');
    expect(Util.stringClean('  \n ')).toBe('');
    expect(Util.stringClean('  \r\n ')).toBe('');
    expect(Util.stringClean('  \t ')).toBe('');
    expect(Util.stringClean('   ')).toBe('');
    expect(Util.stringClean('')).toBe('');
});

test('clean a number', () => {
    expect(Util.stringClean(1.1)).toBe('1.1');
    expect(Util.stringClean(0)).toBe('0');
    expect(Util.stringClean(-10)).toBe('-10');
});


test('parse empty DSV', () => {
    expect(Util.parseDsv(null)).toEqual([]);
    expect(Util.parseDsv(undefined)).toEqual([]);
    expect(Util.parseDsv('    ')).toEqual([]);
    expect(Util.parseDsv('')).toEqual([]);
});

test('parse DSV with single values', () => {
    expect(Util.parseDsv(' 1 ')).toEqual([1]);
    expect(Util.parseDsv('2')).toEqual([2]);
    expect(Util.parseDsv('-3')).toEqual([-3]);
    expect(Util.parseDsv('-4.5\t')).toEqual([-4.5]);
});

test('parse DSV with multiple values', () => {
    expect(Util.parseDsv(' 1 , ,, 2')).toEqual([1, 2]);
    expect(Util.parseDsv('2\r\n3')).toEqual([2, 3]);
    expect(Util.parseDsv('-3\t;#4')).toEqual([-3, 4]);
    expect(Util.parseDsv('-4.5\t\t\t\t\r\n\n\n\\:|&-6.7')).toEqual([-4.5, -6.7]);
});

test('parse DSV with invalid numbers', () => {
    function parseInvalidDsv() {
        Util.parseDsv(' 1 , ,, aaaaa');
    }
    expect(parseInvalidDsv).toThrow(/^Invalid number: aaaaa$/);
});
