import Wkt from 'wicket';
import ConvertModel from 'models/convert';

test('instantiate new Convert model', () => {
    const model = new ConvertModel();

    expect(model.get('text')).toBeNull();
    expect(model.get('projection')).toEqual('auto');
    expect(model.get('format')).toEqual('auto');
});

test('get geometry for empty text', () => {
    const model = new ConvertModel();

    expect(model.getTexts()).toEqual([]);

    model.set('text', null);
    expect(model.getTexts()).toEqual([]);

    model.set('text', '');
    expect(model.getTexts()).toEqual([]);

    model.set('text', '\n');
    expect(model.getTexts()).toEqual([]);

    model.set('text', '\n\n');
    expect(model.getTexts()).toEqual([]);
});

test('get geometry for single geometry using default separator', () => {
    const model = new ConvertModel();

    model.set('text', '1 2');
    expect(model.getTexts()).toEqual(['1 2']);

    model.set('text', '\n1 2\t');
    expect(model.getTexts()).toEqual(['\n1 2\t']);

    model.set('text', '1 2\n1 2');
    expect(model.getTexts()).toEqual(['1 2\n1 2']);
});

test('get geometry for multiple geometries using default separator', () => {
    const model = new ConvertModel();

    model.set('text', '1 2\n\n3 4');
    expect(model.getTexts()).toEqual(['1 2', '3 4']);

    model.set('text', '1 2\n\n\n3 4');
    expect(model.getTexts()).toEqual(['1 2', '3 4']);

    model.set('text', '1 2\n\n\n3\n4');
    expect(model.getTexts()).toEqual(['1 2', '3\n4']);
});

test('get geometry for multiple geometries using custom separator', () => {
    const model = new ConvertModel();

    model.set('text', '1 2\n3 4');
    expect(model.getTexts('\n')).toEqual(['1 2', '3 4']);

    model.set('text', '1 2\n\n\n3 4');
    expect(model.getTexts('\n')).toEqual(['1 2', '3 4']);

    model.set('text', '1 2\n\n\n3\n4');
    expect(model.getTexts('\n')).toEqual(['1 2', '3', '4']);
});

test('get nth geometry for empty text', () => {
    const model = new ConvertModel();

    expect(model.getText()).toBeUndefined();

    model.set('text', '');
    expect(model.getText()).toBeUndefined();
});

test('get nth geometry for single text', () => {
    const model = new ConvertModel();

    model.set('text', '1 2\n\n3 4');
    expect(model.getText()).toEqual('1 2');
    expect(model.getText(0)).toEqual('1 2');
    expect(model.getText(1)).toEqual('3 4');
    expect(model.getText(2)).toBeUndefined();
});

test('get first geometry for text', () => {
    const model = new ConvertModel();

    expect(model.getFirstText()).toBeUndefined();

    model.set('text', '');
    expect(model.getFirstText()).toBeUndefined();

    model.set('text', '1 2\n\n3 4');
    expect(model.getFirstText()).toEqual('1 2');
});

test('build Wicket object for empty text', () => {
    const model = new ConvertModel();

    expect(model.buildWkts()).toEqual([]);
    expect(model.buildWkts('wgs84')).toEqual([]);
    expect(model.buildWkts('bng')).toEqual([]);
    expect(model.buildWkts('frfref')).toEqual([]);
});

test('build Wicket object for invalid geometries', () => {
    const model = new ConvertModel();

    model.set('text', '1');
    expect(model.buildWkts()).toEqual([]);

    model.set('text', '1 2 3');
    expect(model.buildWkts()).toEqual([]);

    model.set('text', 'abc cba');
    expect(model.buildWkts()).toEqual([]);
});

test('build Wicket object for mixed valid and invalid geometries', () => {
    const model = new ConvertModel();

    model.set('text', '1 2\n\n3');
    expect(model.buildWkts().length).toEqual(1);

    model.set('text', '1 2\n\n3\n\n4 5\n\n');
    expect(model.buildWkts().length).toEqual(2);
});

test('build Wicket object for single geometry', () => {
    const model = new ConvertModel();

    model.set('text', '1 2');
    expect(model.buildWkts().length).toEqual(1);

    model.set({
        text: '1 2',
        projection: 'bng',
        format: 'dsv'
    });
    const wkts = model.buildWkts('bng');
    expect(wkts.length).toEqual(1);
    expect(wkts[0].components[0].x).toEqual(1);
    expect(wkts[0].components[0].y).toEqual(2);
});

test('build Wicket object for multiple geometries', () => {
    const model = new ConvertModel();

    model.set('text', '1 2\n\n3 4');
    expect(model.buildWkts().length).toEqual(2);

    model.set({
        text: '1 2\n\n3 4\n\n5',
        projection: 'bng',
        format: 'dsv'
    });
    const wkts = model.buildWkts('bng');
    expect(wkts.length).toEqual(2);
    expect(wkts[0].components[0].x).toEqual(1);
    expect(wkts[0].components[0].y).toEqual(2);
    expect(wkts[1].components[0].x).toEqual(3);
    expect(wkts[1].components[0].y).toEqual(4);
});

test('build Wicket objects with conversion', () => {
    const model = new ConvertModel();

    model.set({
        text: '0 0',
        projection: 'bng'
    });
    const wktsBng = model.buildWkts('wgs84');
    expect(wktsBng.length).toEqual(1);
    expect(wktsBng[0].components[0].x).toEqual(-7.557159803196421);
    expect(wktsBng[0].components[0].y).toEqual(49.76680721248765);
});

test('get format without auto-detection', () => {
    const model = new ConvertModel();

    expect(model.getFormat()).toEqual('auto');
    expect(model.getFormat(false)).toEqual('auto');
    expect(model.getFormat(0)).toEqual('auto');
    expect(model.getFormat('')).toEqual('auto');
    expect(model.getFormat(null)).toEqual('auto');

    model.unset('format');
    expect(model.getFormat()).toBeUndefined();

    model.set('format', null);
    expect(model.getFormat()).toBeNull();

    model.set('format', 'geojson');
    expect(model.getFormat()).toEqual('geojson');

    model.set('format', 'dsv');
    expect(model.getFormat()).toEqual('dsv');
});

test('get format without text but with auto-detection', () => {
    const model = new ConvertModel();

    expect(model.getFormat(true)).toEqual('auto');
    expect(model.getFormat(1)).toEqual('auto');
    expect(model.getFormat('a')).toEqual('auto');

    model.unset('format');
    expect(model.getFormat(true)).toBeUndefined();

    model.set('format', null);
    expect(model.getFormat(true)).toBeNull();
});

test('get format with text and auto-detection', () => {
    const model = new ConvertModel();

    model.set('format', 'auto');

    model.set('text', '-1 -2');
    expect(model.getFormat(true)).toEqual('dsv');

    model.set('text', 'POINT(1 2)');
    expect(model.getFormat(true)).toEqual('wkt');
});

test('get projection without auto-detection', () => {
    const model = new ConvertModel();

    expect(model.getProjection()).toEqual('auto');
    expect(model.getProjection(false)).toEqual('auto');
    expect(model.getProjection(0)).toEqual('auto');
    expect(model.getProjection('')).toEqual('auto');
    expect(model.getProjection(null)).toEqual('auto');

    model.unset('projection');
    expect(model.getProjection()).toBeUndefined();

    model.set('projection', null);
    expect(model.getProjection()).toBeNull();

    model.set('projection', 'bng');
    expect(model.getProjection()).toEqual('bng');

    model.set('projection', 'wgs84');
    expect(model.getProjection()).toEqual('wgs84');
});

test('get projection without text but with auto-detection', () => {
    const model = new ConvertModel();

    expect(model.getProjection(true)).toEqual('auto');
    expect(model.getProjection(1)).toEqual('auto');
    expect(model.getProjection('a')).toEqual('auto');

    model.unset('projection');
    expect(model.getProjection(true)).toBeUndefined();

    model.set('projection', null);
    expect(model.getProjection(true)).toBeNull();
});

test('get projection for Polyline format and auto-detection', () => {
    const model = new ConvertModel();

    model.set({
        projection: 'auto',
        format: 'polyline5'
    });

    model.set('text', '-100000 -200000');
    expect(model.getProjection(true)).toEqual('wgs84');

    model.set('text', '1 2');
    expect(model.getProjection(true)).toEqual('wgs84');
});

test('add geometry from ordinates to clean slate model', () => {
    const model = new ConvertModel();

    model.addGeomFromOrdinates([0, 0]);
    expect(model.get('text')).toEqual('0 0');
});

test('add geometry from ordinates to clean slate model', () => {
    const model = new ConvertModel();

    model.set({
        projection: 'wgs84',
        format: 'wkt'
    });
    model.addGeomFromOrdinates([0, 0], 'bng');
    expect(model.get('text')).toEqual('POINT(-7.557159803196421 49.76680721248765)');
});

test('add geometry from ordinates to clean slate model with projection', () => {
    const model = new ConvertModel();

    model.addGeomFromOrdinates([0, 0], 'wgs84');
    expect(model.get('text')).toEqual('0 0');
});

test('add geometry from ordinates to model with existing geometries', () => {
    const model = new ConvertModel({
        text: '0 0',
        projection: 'bng',
        format: 'dsv'
    });

    model.addGeomFromOrdinates([0], 'bng');
    expect(model.get('text')).toEqual('0 0');

    model.addGeomFromOrdinates([0, 0], 'bng');
    expect(model.get('text')).toEqual('0 0\n\n0 0');
});

test('convert Wicket object with no values', () => {
    expect(ConvertModel.convert()).toBeUndefined();
    expect(ConvertModel.convert('dsv', 'wgs84', 'some wkt obj', undefined)).toBeUndefined();
    expect(ConvertModel.convert('dsv', 'wgs84', undefined, 'bng')).toBeUndefined();
});

test('convert Wicket object', () => {
    const wktBng = new Wkt.Wkt('POINT(0 0)');
    expect(ConvertModel.convert('dsv', 'wgs84', wktBng, 'bng')).toEqual('-7.557159803196421 49.76680721248765');

    const wktWgs84 = new Wkt.Wkt('POINT(-7.557159803196421 49.76680721248765)');
    expect(ConvertModel.convert('dsv', 'bng', wktWgs84, 'wgs84')).toEqual('-0.001 -0.001');
});
