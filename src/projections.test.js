import Projections from 'projections';
import Wkt from 'wicket';

test('find option for invalid codes', () => {
    expect(Projections.findOption(null)).toBeUndefined();
    expect(Projections.findOption()).toBeUndefined();
    expect(Projections.findOption('')).toBeUndefined();
    expect(Projections.findOption(0)).toBeUndefined();
    expect(Projections.findOption('frfgrgef')).toBeUndefined();
});

test('find option for valid code', () => {
    const p = Projections.findOption('wgs84');
    expect(typeof p.label).toBe('string');
    expect(typeof p.description).toBe('string');
    expect(typeof p.value).toBe('string');
    expect(typeof p.srid).toBe('number');
});

test('get label for invalid code', () => {
    expect(() => {
        Projections.getLabel(null);
    }).toThrow('');
    expect(() => {
        Projections.getLabel(undefined);
    }).toThrow('');
    expect(() => {
        Projections.getLabel('');
    }).toThrow('');
    expect(() => {
        Projections.getLabel(0);
    }).toThrow('');
    expect(() => {
        Projections.getLabel('frfgrgef');
    }).toThrow('');
});

test('get label for valid codes', () => {
    expect(Projections.getLabel('wgs84')).toBe(Projections.findOption('wgs84').label);
    expect(Projections.getLabel('bng')).toBe(Projections.findOption('bng').label);
});

test('get SRID for invalid codes', () => {
    expect(() => {
        Projections.getSrid(undefined);
    }).toThrow('');
    expect(() => {
        Projections.getSrid(null);
    }).toThrow('');
    expect(() => {
        Projections.getSrid(NaN);
    }).toThrow('');
    expect(() => {
        Projections.getSrid(0);
    }).toThrow('');
    expect(() => {
        Projections.getSrid('fefe');
    }).toThrow('');
});

test('get SRID for valid codes', () => {
    expect(Projections.getSrid('bng')).toBe(27700);
    expect(Projections.getSrid('wgs84')).toBe(4326);
});

test('format auto-detect label without code', () => {
    expect(Projections.formatAutoDetectLabel()).toBe('Auto-detect');
});

test('format auto-detect label with invalid codes', () => {
    expect(() => {
        Projections.formatAutoDetectLabel('fefe');
    }).toThrow('');
    expect(() => {
        Projections.formatAutoDetectLabel(1);
    }).toThrow('');
});

test('format auto-detect label with valid codes', () => {
    expect(Projections.formatAutoDetectLabel('bng')).toBe('Auto-detect (BNG)');
    expect(Projections.formatAutoDetectLabel('wgs84')).toBe('Auto-detect (WGS84)');
    expect(Projections.formatAutoDetectLabel('auto')).toBe('Auto-detect');
});

test('auto-detect with code', () => {
    expect(Projections.autoDetect(0, 'some_format', 'some_code')).toBe('some_code');
    expect(Projections.autoDetect(10, 'some_format', 'some_code')).toBe('some_code');
    expect(Projections.autoDetect(-10, 'some_format', 'some_code')).toBe('some_code');
    expect(Projections.autoDetect(null, 'some_format', 'some_code')).toBe('some_code');
    expect(Projections.autoDetect(undefined, 'some_format', 'some_code')).toBe('some_code');
    expect(Projections.autoDetect('', 'some_format', 'some_code')).toBe('some_code');
    expect(Projections.autoDetect('some geometry', 'some_format', 'some_code')).toBe('some_code');
});

test('auto-detect without numbers', () => {
    expect(Projections.autoDetect()).toBeUndefined();
    expect(Projections.autoDetect(null)).toBeUndefined();
    expect(Projections.autoDetect('')).toBeUndefined();
    expect(Projections.autoDetect(' ')).toBeUndefined();
    expect(Projections.autoDetect(' | |')).toBeUndefined();
    expect(Projections.autoDetect('ufhrif hrigh reihgirhg ireigr gnriegn')).toBeUndefined();
});

test('auto-detect with Polyline formats', () => {
    expect(Projections.autoDetect('', 'polyline5')).toBe('wgs84');
    expect(Projections.autoDetect('', 'polyline6')).toBe('wgs84');
});

test('auto-detect with EWKT format', () => {
    expect(Projections.autoDetect('SRID=1;')).toBeUndefined();
    expect(Projections.autoDetect('SRID=27700;')).toBe('bng');
    expect(Projections.autoDetect('SRID=4326;')).toBe('wgs84');
});

test('auto-detect with DSV format', () => {
    expect(Projections.autoDetect('1 2')).toBe('wgs84');
    expect(Projections.autoDetect('10000 20000')).toBe('bng');
});

test('convert BNG coordinates to WGS84', () => {
    expect(Projections.convertBngToLatLon(0, 0)).toEqual({
        x: -7.557159803196421,
        y: 49.76680721248765
    });
});

test('convert BNG coordinates to WGS84', () => {
    expect(Projections.convertLatLonToBng(49.76680721248765, -7.557159803196421)).toEqual({
        x: -0.001,
        y: -0.001
    });
});

test('convert Wicket components from and to invalid projections', () => {
    expect(() => {
        Projections.convertWktComponents();
    }).toThrow('Projection to convert from and/or to not provided.');
    expect(() => {
        Projections.convertWktComponents(null, 'a');
    }).toThrow('Projection to convert from and/or to not provided.');
    expect(() => {
        Projections.convertWktComponents(null, undefined, 'a');
    }).toThrow('Projection to convert from and/or to not provided.');
    expect(() => {
        Projections.convertWktComponents(null, 'bng', 'a');
    }).toThrow('Projection not supported: a.');
    expect(() => {
        Projections.convertWktComponents(null, 'a', 'bng');
    }).toThrow('Projection not supported: a.');
    expect(() => {
        Projections.convertWktComponents(null, 1, 'bng');
    }).toThrow('Projection not supported: 1.');
});

test('convert invalid Wicket components', () => {
    expect(() => {
        Projections.convertWktComponents([{}], 'bng', 'wgs84');
    }).toThrow('Provided coordinate doesn\'t include x/y attributes.');
    expect(() => {
        Projections.convertWktComponents([{x: 0}], 'bng', 'wgs84');
    }).toThrow('Provided coordinate doesn\'t include x/y attributes.');
    expect(() => {
        Projections.convertWktComponents([{y: 1}], 'bng', 'wgs84');
    }).toThrow('Provided coordinate doesn\'t include x/y attributes.');
    expect(() => {
        Projections.convertWktComponents([{x: '0', y: 1}], 'bng', 'wgs84');
    }).toThrow('Provided coordinate x/y attributes are not numbers.');
    expect(() => {
        Projections.convertWktComponents([{x: 0, y: '1'}], 'bng', 'wgs84');
    }).toThrow('Provided coordinate x/y attributes are not numbers.');
    expect(() => {
        Projections.convertWktComponents([{x: NaN, y: 1}], 'bng', 'wgs84');
    }).toThrow('Provided coordinate x/y attributes are not numbers.');
    expect(() => {
        Projections.convertWktComponents([{x: 0, y: NaN}], 'bng', 'wgs84');
    }).toThrow('Provided coordinate x/y attributes are not numbers.');
});

test('convert Wicket components from and to the same projection', () => {
    const comps = {};
    expect(Projections.convertWktComponents(comps, 'bng', 'bng')).toBe(comps);
    expect(Projections.convertWktComponents(comps, 'wgs84', 'wgs84')).toBe(comps);
});

test('convert Wicket components from BNG into WGS84', () => {
    expect(Projections.convertWktComponents({x: 0, y: 0}, 'bng', 'wgs84')).toEqual({
        x: -7.557159803196421,
        y: 49.76680721248765
    });
});

test('convert Wicket components from BNG into WGS84', () => {
    expect(Projections.convertWktComponents({
        y: 49.76680721248765,
        x: -7.557159803196421
    }, 'wgs84', 'bng')).toEqual({
        x: -0.001,
        y: -0.001
    });
});

test('convert invalid Wicket object', () => {
    expect(() => {
        Projections.convert(null, 'wgs84', 'bng');
    }).toThrow('');
    expect(() => {
        Projections.convert(undefined, 'wgs84', 'bng');
    }).toThrow('');
    expect(() => {
        Projections.convert(NaN, 'wgs84', 'bng');
    }).toThrow('');
    expect(() => {
        Projections.convert(0, 'wgs84', 'bng');
    }).toThrow('');
    expect(() => {
        Projections.convert('a', 'wgs84', 'bng');
    }).toThrow('');
});

test('convert Wicket object from WGS84 to WGS84', () => {
    const wkt = new Wkt.Wkt('POINT(1 2)'),
        received = Projections.convert(wkt, 'wgs84', 'wgs84');

    expect(received).not.toBe(wkt);
    expect(received.write()).toEqual(wkt.write());
});

test('convert Wicket object from BNG to WGS84', () => {
    const wkt = new Wkt.Wkt('POINT(0 0)'),
        received = Projections.convert(wkt, 'bng', 'wgs84');

    expect(received).not.toBe(wkt);
    expect(received.write()).toEqual('POINT(-7.557159803196421 49.76680721248765)');
});

test('convert Wicket object from WGS84 to BNG', () => {
    const wkt = new Wkt.Wkt('POINT(-7.557159803196421 49.76680721248765)'),
        received = Projections.convert(wkt, 'wgs84', 'bng');

    expect(received).not.toBe(wkt);
    expect(received.write()).toEqual('POINT(-0.001 -0.001)');
});
