import type { Feature, FeatureCollection, Geometry } from 'geojson';

// Supported input/output formats
export type FormatType =
    | 'geojson'
    | 'wkt'
    | 'ewkt'
    | 'csv'
    | 'kml'
    | 'gpx'
    | 'shapefile'
    | 'polyline5'
    | 'polyline6';

// Supported projections (EPSG codes)
export type ProjectionType = 'EPSG:4326' | 'EPSG:3857' | 'EPSG:27700';

// Parsed geometry feature with metadata
export interface ParsedFeature extends Feature {
    id: string;
    properties: {
        name?: string;
        description?: string;
        area?: number;
        length?: number;
        location?: string;
        [key: string]: unknown;
    };
}

// Parse result from format parsers
export interface ParseResult {
    features: ParsedFeature[];
    errors: ParseError[];
    detectedFormat?: FormatType;
    detectedProjection?: ProjectionType;
}

// Parse error with location info
export interface ParseError {
    message: string;
    line?: number;
    column?: number;
}

// Format options for formatters
export interface FormatOptions {
    projection?: string;
}

// Format parser interface
export interface FormatParser {
    name: FormatType;
    parse(input: string): ParseResult;
    format(features: Feature[], options?: FormatOptions): string;
    detect(input: string): boolean;
}

// Projection transformer interface
export interface ProjectionTransformer {
    from: ProjectionType;
    to: ProjectionType;
    transform(geometry: Geometry): Geometry;
}

// Map state
export interface MapViewState {
    longitude: number;
    latitude: number;
    zoom: number;
}

// Theme options
export type Theme = 'light' | 'dark' | 'system';

// Basemap options
export type Basemap = 'osm' | 'satellite';

// Map provider options
export type MapProvider = 'maplibre' | 'google';

// Export format options
export interface ExportOptions {
    format: FormatType;
    projection: ProjectionType;
    filename?: string;
}

// Deep link state encoded in URL
export interface DeepLinkState {
    format?: FormatType | 'auto';
    projection?: ProjectionType | 'auto';
    geometry?: string;
}

// Feature collection type alias
export type GeoJSONFeatureCollection = FeatureCollection;
