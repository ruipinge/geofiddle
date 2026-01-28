// Type declarations for packages without built-in types

declare module '@mapbox/togeojson' {
    import type { FeatureCollection } from 'geojson';

    export function kml(doc: Document): FeatureCollection;
    export function gpx(doc: Document): FeatureCollection;
}

declare module 'wellknown' {
    import type { Geometry, Feature } from 'geojson';

    export function parse(wkt: string): Geometry | null;
    export function stringify(geojson: Geometry | Feature): string;
}

declare module 'shpjs' {
    import type { FeatureCollection } from 'geojson';

    function shp(input: ArrayBuffer | string): Promise<FeatureCollection | FeatureCollection[]>;
    export = shp;
}
