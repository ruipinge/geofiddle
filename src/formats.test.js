import Formats from 'formats';

const POLYLINE5_POINT = '_qnbI?';
const POLYLINE5_LINESTRING = 'wcpbI`_AnBlE'; // -0.01025 53.00812, -0.01128 53.00756
const POLYLINE5_POLYGON = '}hnbIlj@xOjS?_z@yOre@';
const POLYLINE6_POINT = '_szadB?';
const POLYLINE6_LINESTRING = 'snjbdBj_Sbb@j_A';
const POLYLINE6_POLYGON = 'ibxadBnqL|fDzjE?cmQ}fDfaK';

const EWKT_POINT = 'SRID=1;POINT(0 1)';
const WKT_POINT = 'POINT(0 1)';

const GEOJSON_POINT_LONG = {
    'type': 'Feature',
    'geometry': {
        'type': 'Point',
        'coordinates': [102.0, 0.5]
    },
    'properties': {
        'prop0': 'value0'
    }
};
const GEOJSON_POINT = {
    'coordinates': [0, 1],
    'type': 'Point'
};

const SEPARATOR_OPTIONS = {
    ordinateSep: '_',
    coordinateSep: '|'
};

test('find option for invalid codes', () => {
    expect(Formats.findOption(null)).toBeUndefined();
    expect(Formats.findOption()).toBeUndefined();
    expect(Formats.findOption('')).toBeUndefined();
    expect(Formats.findOption(0)).toBeUndefined();
    expect(Formats.findOption('frfgrgef')).toBeUndefined();
});

test('find option for valid code', () => {
    const f = Formats.findOption('dsv');
    expect(typeof f.label).toBe('string');
    expect(typeof f.description).toBe('string');
    expect(typeof f.value).toBe('string');
});

test('get label for invalid code', () => {
    expect(() => {
        Formats.getLabel(null);
    }).toThrow('');
    expect(() => {
        Formats.getLabel();
    }).toThrow('');
    expect(() => {
        Formats.getLabel('');
    }).toThrow('');
    expect(() => {
        Formats.getLabel(0);
    }).toThrow('');
    expect(() => {
        Formats.getLabel('frfgrgef');
    }).toThrow('');
});

test('get label for valid code', () => {
    expect(Formats.getLabel('dsv')).toBe(Formats.findOption('dsv').label);
});

test('format auto-detect label without code', () => {
    expect(Formats.formatAutoDetectLabel()).toBe('Auto-detect');
    expect(Formats.formatAutoDetectLabel('auto')).toBe('Auto-detect');
});

test('format auto-detect label with "dsv"', () => {
    expect(Formats.formatAutoDetectLabel('dsv')).toBe('Auto-detect (DSV)');
});

test('auto-detect with code', () => {
    expect(Formats.autoDetect(0, 'some_code')).toBe('some_code');
    expect(Formats.autoDetect(10, 'some_code')).toBe('some_code');
    expect(Formats.autoDetect(-10, 'some_code')).toBe('some_code');
    expect(Formats.autoDetect(null, 'some_code')).toBe('some_code');
    expect(Formats.autoDetect(undefined, 'some_code')).toBe('some_code');
    expect(Formats.autoDetect('', 'some_code')).toBe('some_code');
    expect(Formats.autoDetect('some geometry', 'some_code')).toBe('some_code');
});

test('auto-detect with empty text', () => {
    expect(Formats.autoDetect()).toBeUndefined();
    expect(Formats.autoDetect(null)).toBeUndefined();
    expect(Formats.autoDetect('')).toBeUndefined();
    expect(Formats.autoDetect(' ')).toBeUndefined();
    expect(Formats.autoDetect(' | |')).toBeUndefined();
});

test('auto-detect GeoJSON', () => {
    expect(Formats.autoDetect('1')).not.toBe('geojson');
    expect(Formats.autoDetect('a')).not.toBe('geojson');
    expect(Formats.autoDetect('}')).not.toBe('geojson');
    expect(Formats.autoDetect('{')).toBe('geojson');
    expect(Formats.autoDetect('  \t   {')).toBe('geojson');
    expect(Formats.autoDetect('  \n   {')).toBe('geojson');
    expect(Formats.autoDetect('  \n\n   {')).toBe('geojson');
    expect(Formats.autoDetect('  \n\n   {{{{{froifrjf}}}}')).toBe('geojson');
    expect(Formats.autoDetect(JSON.stringify(GEOJSON_POINT_LONG))).toBe('geojson');
    expect(Formats.autoDetect(JSON.stringify(GEOJSON_POINT))).toBe('geojson');
});

test('auto-detect EWKT', () => {
    expect(Formats.autoDetect('a')).not.toBe('ewkt');
    expect(Formats.autoDetect('srid=')).not.toBe('ewkt');
    expect(Formats.autoDetect('srid=;')).not.toBe('ewkt');
    expect(Formats.autoDetect('srid=1;')).not.toBe('ewkt');
    expect(Formats.autoDetect('srid=;a')).not.toBe('ewkt');
    expect(Formats.autoDetect('srid=1;1')).not.toBe('ewkt');
    expect(Formats.autoDetect('srid=1;a')).toBe('ewkt');
    expect(Formats.autoDetect('srid=12;a')).toBe('ewkt');
    expect(Formats.autoDetect('srid=1;aaaaa3434(23 23)')).toBe('ewkt');
    expect(Formats.autoDetect('   srid=1;a')).toBe('ewkt');
    expect(Formats.autoDetect(' \n\n  srid=1;a')).toBe('ewkt');
    expect(Formats.autoDetect(' \t\n  srid=1;a')).toBe('ewkt');
    expect(Formats.autoDetect(EWKT_POINT)).toBe('ewkt');
});

test('auto-detect WKT', () => {
    expect(Formats.autoDetect('a')).not.toBe('wkt');
    expect(Formats.autoDetect('srid=1;a')).not.toBe('wkt');
    expect(Formats.autoDetect('a(')).toBe('wkt');
    expect(Formats.autoDetect('aaa  (')).toBe('wkt');
    expect(Formats.autoDetect('aaa \n (')).toBe('wkt');
    expect(Formats.autoDetect('POINT(')).toBe('wkt');
    expect(Formats.autoDetect('aaaaa(23 23)')).toBe('wkt');
    expect(Formats.autoDetect(WKT_POINT)).toBe('wkt');
});

test('auto-detect DSV', () => {
    expect(Formats.autoDetect('0')).toBe('dsv');
    expect(Formats.autoDetect('0\n0')).toBe('dsv');
    expect(Formats.autoDetect(0)).toBe('dsv');
    expect(Formats.autoDetect(10)).toBe('dsv');
    expect(Formats.autoDetect(-10)).toBe('dsv');
    expect(Formats.autoDetect('0 1,2 3')).toBe('dsv');
    expect(Formats.autoDetect('0;1;2;3')).toBe('dsv');
    expect(Formats.autoDetect('0 1 2 3')).toBe('dsv');
    expect(Formats.autoDetect('   0 1 2 3')).toBe('dsv');
});

test('auto-detect Polyline with 5 and 6 decimal place precision', () => {
    expect(Formats.autoDetect(' | ')).toBe('polyline5');
    expect(Formats.autoDetect('|')).toBe('polyline5');
    expect(Formats.autoDetect('?')).toBe('polyline5');
    expect(Formats.autoDetect(POLYLINE6_POINT)).toBe('polyline6');
    expect(Formats.autoDetect(POLYLINE5_POINT)).toBe('polyline5');
});

test('build Wicket object with invalid values', () => {
    expect(Formats.buildWkt()).toBeUndefined();
    expect(Formats.buildWkt('')).toBeUndefined();
    expect(Formats.buildWkt(0)).toBeUndefined();
    expect(Formats.buildWkt([])).toBeUndefined();
    expect(Formats.buildWkt([0])).toBeUndefined();
    expect(Formats.buildWkt([0, 1, 2])).toBeUndefined();
    expect(Formats.buildWkt(['a', 'b'])).toBeUndefined();
    expect(Formats.buildWkt(['?', '-'])).toBeUndefined();
});

test('build Wicket object with valid values', () => {
    expect(Formats.buildWkt([1, 2]).write()).toEqual('POINT(1 2)');
    expect(Formats.buildWkt([1, 2, 3, 4]).write()).toEqual('LINESTRING(1 2,3 4)');
    expect(Formats.buildWkt([1, 2, 3, 4, 1, 2]).write()).toEqual('LINESTRING(1 2,3 4,1 2)');
    expect(Formats.buildWkt([1, 2, 3, 4, 5, 6, 1, 2]).write()).toEqual('POLYGON((1 2,3 4,5 6,1 2))');
});

test('parse DSV with invalid values', () => {
    expect(Formats.parseDsv()).toBeUndefined();
    expect(Formats.parseDsv('')).toBeUndefined();
    expect(Formats.parseDsv(0)).toBeUndefined();
    expect(Formats.parseDsv('0')).toBeUndefined();
    expect(Formats.parseDsv('0 1 2')).toBeUndefined();
    expect(Formats.parseDsv('a b')).toBeUndefined();
    expect(Formats.parseDsv('? -')).toBeUndefined();
});

test('parse DSV with valid values', () => {
    expect(Formats.parseDsv('1 2').type).toBe('point');
    expect(Formats.parseDsv('1 2 3 4').type).toBe('linestring');
    expect(Formats.parseDsv('1 2 3 4 6 7 1 2').type).toBe('polygon');
});

test('parse Polyline with invalid values', () => {
    expect(Formats.parsePolyline()).toBeUndefined();
    expect(Formats.parsePolyline(null)).toBeUndefined();
    expect(Formats.parsePolyline('')).toBeUndefined();
    expect(Formats.parsePolyline(undefined, 5)).toBeUndefined();
    expect(Formats.parsePolyline(null, 5)).toBeUndefined();
    expect(Formats.parsePolyline('', 5)).toBeUndefined();
    expect(Formats.parsePolyline(undefined, 6)).toBeUndefined();
    expect(Formats.parsePolyline(null, 6)).toBeUndefined();
    expect(Formats.parsePolyline('', 6)).toBeUndefined();
});

test('parse Polyline Point', () => {
    expect(Formats.parsePolyline(POLYLINE5_POINT).type).toBe('point');
    expect(Formats.parsePolyline(POLYLINE5_POINT, 5).type).toBe('point');
    expect(Formats.parsePolyline(POLYLINE6_POINT, 6).type).toBe('point');
});

test('parse Polyline LineString', () => {
    expect(Formats.parsePolyline(POLYLINE5_LINESTRING).type).toBe('linestring');
    expect(Formats.parsePolyline(POLYLINE5_LINESTRING, 5).type).toBe('linestring');
    expect(Formats.parsePolyline(POLYLINE6_LINESTRING, 6).type).toBe('linestring');
});

test('parse Polyline Polygon', () => {
    expect(Formats.parsePolyline(POLYLINE5_POLYGON).type).toBe('polygon');
    expect(Formats.parsePolyline(POLYLINE5_POLYGON, 5).type).toBe('polygon');
    expect(Formats.parsePolyline(POLYLINE6_POLYGON, 6).type).toBe('polygon');
});

test('parse invalid WKT string', () => {
    expect(Formats.parseWkt(undefined)).toBeUndefined();
    expect(Formats.parseWkt(null)).toBeUndefined();
    expect(Formats.parseWkt(0)).toBeUndefined();
    expect(Formats.parseWkt(10)).toBeUndefined();
    expect(Formats.parseWkt(-10)).toBeUndefined();
    expect(Formats.parseWkt(NaN)).toBeUndefined();
    expect(Formats.parseWkt('LINESTRING(')).toBeUndefined();
    expect(Formats.parseWkt('{}')).toBeUndefined();
    expect(Formats.parseWkt('POIT(1 2)')).toBeUndefined();
    expect(Formats.parseWkt('POINT()')).toBeUndefined();
    expect(Formats.parseWkt('LINESTRING()')).toBeUndefined();
    expect(Formats.parseWkt('LINESTRING(1)')).toBeUndefined();
    expect(Formats.parseWkt('POLYGON(())')).toBeUndefined();
});

test('parse WKT string', () => {
    expect(Formats.parseWkt(WKT_POINT).type).toBe('point');
});

test('parse GeoJSON string', () => {
    expect(Formats.parseWkt(JSON.stringify(GEOJSON_POINT)).type).toBe('point');
    expect(Formats.parseWkt(JSON.stringify(GEOJSON_POINT_LONG)).type).toBe('point');
});

test('parse invalid EWKT string', () => {
    expect(Formats.parseEwkt(undefined)).toBeUndefined();
    expect(Formats.parseEwkt(null)).toBeUndefined();
    expect(Formats.parseEwkt(0)).toBeUndefined();
    expect(Formats.parseEwkt(10)).toBeUndefined();
    expect(Formats.parseEwkt(-10)).toBeUndefined();
    expect(Formats.parseEwkt(NaN)).toBeUndefined();
    expect(Formats.parseEwkt(WKT_POINT)).toBeUndefined();
    expect(Formats.parseEwkt(JSON.stringify(GEOJSON_POINT))).toBeUndefined();
});

test('parse EWKT string', () => {
    expect(Formats.parseEwkt(EWKT_POINT).type).toBe('point');
});

test('parse generic string as DSV', () => {
    expect(Formats.parse('0 1', 'dsv').write()).toEqual(Formats.parseDsv('0 1').write());
});

test('parse generic string as EWKT', () => {
    expect(Formats.parse(EWKT_POINT, 'ewkt').write()).toEqual(Formats.parseEwkt(EWKT_POINT).write());
});

test('parse generic string as WKT', () => {
    expect(Formats.parse(WKT_POINT, 'wkt').write()).toEqual(Formats.parseWkt(WKT_POINT).write());
    expect(Formats.parse(WKT_POINT).write()).toEqual(Formats.parseWkt(WKT_POINT).write());
});

test('parse generic string as Polyline (precision 5)', () => {
    expect(Formats.parse(POLYLINE5_POINT, 'polyline5').write()).toEqual(Formats.parsePolyline(POLYLINE5_POINT, 5).write());
});

test('parse generic string as Polyline (precision 6)', () => {
    expect(Formats.parse(POLYLINE6_POINT, 'polyline6').write()).toEqual(Formats.parsePolyline(POLYLINE6_POINT, 6).write());
});

test('format ordinates with empty values', () => {
    expect(Formats.formatOrdinates(undefined)).toBe('');
    expect(Formats.formatOrdinates(null)).toBe('');
    expect(Formats.formatOrdinates(NaN)).toBe('');
    expect(Formats.formatOrdinates('')).toBe('');
    expect(Formats.formatOrdinates(0)).toBe('');
    expect(Formats.formatOrdinates([])).toEqual('');
});

test('format ordinates with invalid values', () => {
    expect(() => {
        Formats.formatOrdinates(1);
    }).toThrow(/^Odd number of ordinates:/);
    expect(() => {
        Formats.formatOrdinates([1]);
    }).toThrow('Odd number of ordinates: 1.');
    expect(() => {
        Formats.formatOrdinates([1, 2, 3]);
    }).toThrow('Odd number of ordinates: 3.');
    expect(() => {
        Formats.formatOrdinates(['1', 2]);
    }).toThrow('Ordinate 0/x with wrong type: 1 (string).');
    expect(() => {
        Formats.formatOrdinates([NaN, 2]);
    }).toThrow('Ordinate 0/x with wrong type: NaN (number).');
    expect(() => {
        Formats.formatOrdinates([1, NaN]);
    }).toThrow('Ordinate 1/y with wrong type: NaN (number).');
    expect(() => {
        Formats.formatOrdinates([1, 2, 3, undefined]);
    }).toThrow('Ordinate 3/y with wrong type: undefined (undefined).');
});

test('format ordinates with default separators', () => {
    expect(Formats.formatOrdinates([1, 2])).toBe('1 2');
    expect(Formats.formatOrdinates([1, 2, 3, 4])).toBe('1 2, 3 4');
    expect(Formats.formatOrdinates([1.1, 2.2, 3.3, 4.4])).toBe('1.1 2.2, 3.3 4.4');
});

test('format ordinates with custom separators', () => {
    expect(Formats.formatOrdinates([1, 2], SEPARATOR_OPTIONS)).toBe('1_2');
    expect(Formats.formatOrdinates([1, 2, 3, 4], SEPARATOR_OPTIONS)).toBe('1_2|3_4');
    expect(Formats.formatOrdinates([1.1, 2.2, 3.3, 4.4], SEPARATOR_OPTIONS)).toBe('1.1_2.2|3.3_4.4');
});

test('format components with empty values', () => {
    expect(Formats.formatComponents(undefined)).toBe('');
    expect(Formats.formatComponents(null)).toBe('');
    expect(Formats.formatComponents(NaN)).toBe('');
    expect(Formats.formatComponents('')).toBe('');
    expect(Formats.formatComponents(0)).toBe('');
    expect(Formats.formatComponents([])).toEqual('');
    expect(Formats.formatComponents({x: 1})).toBe('');
    expect(Formats.formatComponents({x: 1, y: 2})).toBe('');
});

test('format components with invalid values', () => {
    expect(() => {
        Formats.formatComponents([{x: 1}]);
    }).toThrow('Ordinate 1/y with wrong type: undefined (undefined).');
    expect(() => {
        Formats.formatComponents([{x: 1, y: 2}, {x: 3}]);
    }).toThrow('Ordinate 3/y with wrong type: undefined (undefined).');
    expect(() => {
        Formats.formatComponents([{x: '1', y: 2}]);
    }).toThrow('Ordinate 0/x with wrong type: 1 (string).');
    expect(() => {
        Formats.formatComponents([{x: NaN, y: 2}]);
    }).toThrow('Ordinate 0/x with wrong type: NaN (number).');
    expect(() => {
        Formats.formatComponents([{x: 1, y: NaN}]);
    }).toThrow('Ordinate 1/y with wrong type: NaN (number).');
    expect(() => {
        Formats.formatComponents([{x: 1, y: 2}, {x: 3, y: undefined}]);
    }).toThrow('Ordinate 3/y with wrong type: undefined (undefined).');
});

test('format components with default separators', () => {
    expect(Formats.formatComponents([{x: 1, y: 2}])).toBe('1 2');
    expect(Formats.formatComponents([{x: 1, y: 2}, {x: 3, y: 4}])).toBe('1 2, 3 4');
    expect(Formats.formatComponents([{x: 1.1, y: 2.2}, {x: 3.3, y: 4.4}])).toBe('1.1 2.2, 3.3 4.4');
});

test('format components with custom separators', () => {

    expect(Formats.formatComponents([{x: 1, y: 2}], SEPARATOR_OPTIONS)).toBe('1_2');
    expect(Formats.formatComponents([{x: 1, y: 2}, {x: 3, y: 4}], SEPARATOR_OPTIONS)).toBe('1_2|3_4');
    expect(Formats.formatComponents([{x: 1.1, y: 2.2}, {x: 3.3, y: 4.4}], SEPARATOR_OPTIONS)).toBe('1.1_2.2|3.3_4.4');
});

test('format Wicket object to invalid format', () => {
    expect(() => {
        Formats.format(undefined, 'geojson2');
    }).toThrow('Format not supported: geojson2.');
});

test('format Wicket object to WKT', () => {
    const wkt = Formats.parseWkt(WKT_POINT);
    expect(Formats.format(wkt, 'wkt')).toBe('POINT(0 1)');
    expect(Formats.format(wkt, 'wkt', SEPARATOR_OPTIONS)).toBe('POINT(0 1)');
});

test('format Wicket object to EWKT', () => {
    const wkt = Formats.parseWkt(WKT_POINT);
    expect(Formats.format(wkt, 'ewkt')).toBe('SRID=;POINT(0 1)');
    expect(Formats.format(wkt, 'ewkt', {srid: 1111})).toBe('SRID=1111;POINT(0 1)');
    expect(Formats.format(wkt, 'ewkt', SEPARATOR_OPTIONS)).toBe('SRID=;POINT(0 1)');
});

test('format Wicket object to GeoJSON', () => {
    const wkt = Formats.parseWkt(WKT_POINT);
    expect(Formats.format(wkt, 'geojson')).toEqual(JSON.stringify(GEOJSON_POINT, null, 4));
    expect(Formats.format(wkt, 'geojson', SEPARATOR_OPTIONS)).toEqual(JSON.stringify(GEOJSON_POINT, null, 4));
});

test('format Wicket object to DSV', () => {
    const pointWkt = Formats.parseWkt(WKT_POINT),
        lineWkt = Formats.parsePolyline(POLYLINE5_LINESTRING, 5);
    expect(Formats.format(pointWkt, 'dsv')).toEqual('0 1');
    expect(Formats.format(pointWkt, 'dsv', SEPARATOR_OPTIONS)).toEqual('0_1');
    expect(Formats.format(lineWkt, 'dsv')).toEqual('-0.01025 53.00812, -0.01128 53.00756');
    expect(Formats.format(lineWkt, 'dsv', SEPARATOR_OPTIONS)).toEqual('-0.01025_53.00812|-0.01128_53.00756');
});

test('format Wicket object to Polyline (precision 5)', () => {
    const wkt = Formats.parsePolyline(POLYLINE6_POINT, 6);
    expect(Formats.format(wkt, 'polyline5')).toEqual(POLYLINE5_POINT);
    expect(Formats.format(wkt, 'polyline5', SEPARATOR_OPTIONS)).toEqual(POLYLINE5_POINT);
});

test('format Wicket object to Polyline (precision 6)', () => {
    const wkt = Formats.parsePolyline(POLYLINE5_POINT, 5);
    expect(Formats.format(wkt, 'polyline6')).toEqual(POLYLINE6_POINT);
    expect(Formats.format(wkt, 'polyline6', SEPARATOR_OPTIONS)).toEqual(POLYLINE6_POINT);
});
