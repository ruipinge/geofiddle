# GeoFiddle [![Build Status](https://github.com/ruipinge/geofiddle/actions/workflows/build-deploy.yml/badge.svg)](https://github.com/ruipinge/geofiddle/actions/workflows/build-deploy.yml) [![Coverage Status](https://coveralls.io/repos/github/ruipinge/geofiddle/badge.svg?branch=master)](https://coveralls.io/github/ruipinge/geofiddle?branch=master)

Plot, share, and convert geometries using different formats and projections.
Try it at [geofiddle.com](https://geofiddle.com).

## Features

- Format and projection auto-detection
- Deep links for easy sharing of geometries and conversions
- Interactive drawing tools (point, line, polygon)
- Area and perimeter/length measurements
- Bounding box (envelope) display with coordinate transformation
- Geometry list with details, hover highlighting, and click-to-pan
- Reverse geocoding for location context
- Mobile-friendly responsive layout
- Multiple map providers (MapLibre and Google Maps)
- Dark mode support

## Supported Formats

- [GeoJSON](http://geojson.org/)
- [Well-Known Text](https://en.wikipedia.org/wiki/Well-known_text) (WKT)
- [Extended Well-Known Text](https://postgis.net/docs/using_postgis_dbmanagement.html#EWKB_EWKT) (EWKT)
- [CSV](https://en.wikipedia.org/wiki/Comma-separated_values) (coordinate pairs)
- [KML](https://developers.google.com/kml/documentation)
- [GPX](https://www.topografix.com/gpx.asp)
- [Polyline](https://developers.google.com/maps/documentation/utilities/polylinealgorithm) (precision 5 and 6)
- [Shapefile](https://en.wikipedia.org/wiki/Shapefile) (.zip)

## Supported Projections

- **WGS84** ([EPSG:4326](https://epsg.io/4326))
  - Unit: degree
  - Axes: longitude, latitude
- **Web Mercator** ([EPSG:3857](https://epsg.io/3857))
  - Unit: metre
  - Axes: easting, northing
- **British National Grid** ([EPSG:27700](https://epsg.io/27700))
  - Unit: metre
  - Axes: easting, northing

## Examples

Try pasting these geometries at [geofiddle.com](https://geofiddle.com):

**GeoJSON Point (BNG coordinates):**
```json
{
    "type": "Point",
    "coordinates": [531473, 181763]
}
```

**WKT Point (WGS84):**
```text
POINT(-9.129814 38.736847)
```

**CSV coordinates:**
```text
-0.1068354, 51.5114059
```

**BNG coordinate pairs:**
```text
200300 200200 200300 200300 200400 200300 200300 200200
```

## Development

### Prerequisites

- Node.js 18+
- npm

### Setup

```shell
npm install
```

### Development Server

```shell
npm run dev
```

### Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run lint` | Check code style |
| `npm run lint:fix` | Fix code style issues |
| `npm run typecheck` | Run TypeScript type checking |
| `npm test` | Run unit tests |
| `npm run clean` | Remove generated files |

### Google Maps API (Optional)

To enable Google Maps as an alternative map provider, create a `PRIVATE.json` file in the project root:

```json
{
  "apiKey": "YOUR_GOOGLE_MAPS_API_KEY",
  "mapId": "YOUR_MAP_ID"
}
```

Get an API key from the [Google Cloud Console](https://console.cloud.google.com/apis/credentials).

## Tech Stack

- [React](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- [Vite](https://vitejs.dev/) (build tool)
- [Tailwind CSS](https://tailwindcss.com/) (styling)
- [Zustand](https://zustand-demo.pmnd.rs/) (state management)
- [MapLibre GL JS](https://maplibre.org/) (default map)
- [Turf.js](https://turfjs.org/) (geospatial analysis)
- [Proj4js](http://proj4js.org/) (coordinate transformations)
- [Vitest](https://vitest.dev/) (testing)

## License

MIT
