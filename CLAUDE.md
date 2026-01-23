# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

GeoFiddle is a client-side web application for plotting, sharing, and converting geometries using different formats and projections. No backend server is required - all processing happens in the browser. Live at https://geofiddle.com.

## Build & Development Commands

```bash
npm install          # Install dependencies
npm start            # Dev server with hot reload
npm test             # Run all tests with coverage
npm run lint         # Check code style
npm run lint:fix     # Auto-fix linting issues
npm run build        # Production build
npm run package      # Full release (clean, build, copy static)
```

Run a single test file:
```bash
npx jest tests/formats.test.js
```

Run tests matching a pattern:
```bash
npx jest -t "auto-detect"
```

## Architecture

### MVC Pattern with Backbone.js

```
User Input → Views → ConvertModel → Core Logic → Google Maps
                          ↓
                    URL State (Router)
```

**ConvertModel** (`src/models/convert.js`) is the central state holder:
- `text`: raw input geometry
- `format`: detected or selected format
- `projection`: detected or selected projection
- Views listen to model changes and update accordingly

### Core Logic Modules

- **formats.js**: Parse and format geometries (GeoJSON, WKT, EWKT, DSV, Polyline)
- **projections.js**: Convert between WGS84 (EPSG:4326) and BNG (EPSG:27700)
- **geofiddle-util.js**: DSV parsing utilities

All geometry processing uses the `Wicket` library as intermediate representation.

### Views (`src/views/`)

- `ConvertFormView`: Input textarea with format/projection selectors
- `ConvertResultView`: Output display with converted geometry
- `GoogleMapView`: Map rendering with geometry overlay
- `TopBarView`: Application header

### URL State

The router (`src/router.js`) encodes format/projection/geometry in the URL hash for deep linking and sharing.

## Supported Formats & Projections

**Formats**: GeoJSON, WKT, EWKT, DSV, Polyline (precision 5 & 6)

**Projections**: WGS84 (lat/lon degrees), BNG (easting/northing meters)

Note: Polyline format only supports WGS84 projection.

## Code Style

ESLint enforces: 4-space indent, single quotes, semicolons required, Unix line endings.

## Google Maps API Setup

Create `PRIVATE.json` in root with your API key:
```json
{
  "apiKey": "YOUR_API_KEY",
  "mapId": "YOUR_MAP_ID"
}
```

## Key Dependencies

- **wicket**: WKT/GeoJSON parsing
- **geodesy**: Projection math (WGS84 ↔ BNG)
- **backbone/jquery/lodash**: MVC framework
- **@material/\***: UI components
