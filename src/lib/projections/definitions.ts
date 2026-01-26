import proj4 from 'proj4';

// Define common projections
// WGS84 is built-in as EPSG:4326
proj4.defs('EPSG:4326', '+proj=longlat +datum=WGS84 +no_defs');

// Web Mercator
proj4.defs('EPSG:3857', '+proj=merc +a=6378137 +b=6378137 +lat_ts=0 +lon_0=0 +x_0=0 +y_0=0 +k=1 +units=m +nadgrids=@null +wktext +no_defs');

// British National Grid (OSGB36)
proj4.defs('EPSG:27700', '+proj=tmerc +lat_0=49 +lon_0=-2 +k=0.9996012717 +x_0=400000 +y_0=-100000 +ellps=airy +towgs84=446.448,-125.157,542.06,0.15,0.247,0.842,-20.489 +units=m +no_defs');

export type SupportedProjection = 'EPSG:4326' | 'EPSG:3857' | 'EPSG:27700';

export const projectionLabels: Record<SupportedProjection, string> = {
    'EPSG:4326': 'WGS84 (lon/lat)',
    'EPSG:3857': 'Web Mercator',
    'EPSG:27700': 'British National Grid',
};

export { proj4 };
