# GeoFiddle Product Requirements Document

## 1. Vision

GeoFiddle gives anyone the power to quickly preview, validate, and convert geospatial data right in the browser—no GIS software or server required.

## 2. Goals & Success Metrics

| Goal                    | KPI / Target                                             |
| ----------------------- | -------------------------------------------------------- |
| Zero‑install experience | 95 % successful first‑time load on modern browsers       |
| Fast rendering          | ≤1 s to display 5 MB GeoJSON (≈10 k features)            |
| Accurate conversions    | Coordinate/projection error <1 m on 99 % of tested cases |
| Usability               | SUS (System Usability Scale) ≥80                         |
| Uptime                  | 99.9 % (static hosting)                                  |

## 3. Scope

### In Scope

- Upload or paste coordinates in GeoJSON, CSV (lat,lon), WKT, KML, GPX
- Visualise geometries on an interactive map
- Convert data between supported formats
- Re‑project between common EPSG codes (default: 4326 ↔ 3857)
- List every geometry with:
  - ID / name (if provided)
  - Type (Point, LineString, Polygon, Multi‑\*)
  - Length (lines) or Area (polygons) in metric & imperial
  - Reverse‑geocoded context (street, city, admin levels, country)
- Download converted data as file or copy to clipboard
- Runs 100 % client‑side (no own backend)

### Out of Scope (v1)

- Editing geometries
- 3D visualization
- Batch geocoding of >2000 features in one go (rate‑limit external API)

## 4. Personas & User Stories

| Persona          | Story (MoSCoW) |
| ---------------- | -------------- |
| Field Researcher |                |

|   |
| - |

| *Must* drag a CSV of sample locations onto the map and instantly see points. |                                                                         |
| ---------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| Data Journalist                                                              | *Should* convert a municipality WKT boundary to GeoJSON for publishing. |
| Dev‑Ops Engineer                                                             | *Could* sanity‑check a KML route and export to WKT for PostGIS import.  |
| Teaching Assistant                                                           | *Won’t* teach buffer, clip, or advanced spatial analysis (future).      |

## 5. Functional Requirements

### 5.1 File & Text Import

FR‑1 Accept drag‑and‑drop or file picker (max 50 MB) FR‑2 Accept direct text paste into code editor pane

### 5.2 Format Detection & Parsing

FR‑3 Auto‑detect format and projection via content analysis; fallback to user selection FR‑4 Parse with incremental streaming for large files

### 5.3 Map Display

FR‑5 Render geometries with Leaflet or MapLibre GL JS FR‑6 Style by geometry type with default colours; support selectable basemap (OSM, Satellite) FR‑7 Zoom to bounds on load; cluster >5000 points for performance

### 5.4 Conversion & Projection

FR‑8 Convert any supported input format to any other FR‑9 Allow user to choose output CRS (EPSG code list or search) FR‑10 Use proj4js and wellknown packages client‑side; no server calls

### 5.5 Geometry List Panel

FR‑11 Display sortable table overlay with columns: ID, Type, Length/Area, Location FR‑12 Clicking a row highlights feature on map and pans/zooms FR‑13 Length computed with turf.length; area with turf.area (units m, km, feet, miles)

### 5.6 Reverse Geocoding

FR‑14 On demand, fetch location context via Nominatim/Photon API (free OSM) per feature or batch ≤50 FR‑15 Cache responses in local IndexedDB to reduce calls

### 5.7 Export

FR‑16 Provide Download and Copy buttons; MIME types: application/geo+json, text/plain (WKT), text/csv

### 5.8 Settings & Preferences

FR‑17 Persist last used projection, format, and basemap in localStorage FR‑18 Support deep‑linking of geometries and map state via URL parameters (encoded GeoJSON or CSV for small payloads) FR‑19 Provide **Share Link** button that copies the deep‑link URL to clipboard FR‑20 Plan for backend‑powered share links for large geometries (>10 kB) in v2

## 6. Non‑Functional Requirements

- **Performance:** 60 fps interaction; memory ≤512 MB for 20k features
- **Accessibility:** WCAG 2.1 AA, including keyboard map navigation
- **Internationalisation:** UI ready for i18n; default English
- **Privacy:** All parsing done offline; only outbound calls are optional reverse geocode queries the user initiates; show banner explaining this
- **Security:** Implement CSP, sandbox iframes; sanitise pasted text
- **Offline:** Core viewer works without network once cached via Service Worker

## 7. Technical Architecture

```
User  ──► React + Vite SPA (TypeScript)
            │
            ├─ MapLibre GL JS (vector tiles via public CDN)
            ├─ Parsing libs: geojsonhint, @mapbox/togeojson, wellknown, csv‑parse
            ├─ Spatial calc: turf.js, proj4js
            └─ Reverse Geocode fetch (Nominatim JSON)
```

Hosting: static site on Cloudflare Pages / GitHub Pages CI: GitHub Actions (lint, test, bundle size check)

## 8. UX Principles

- Minimal first screen: drop zone + map
- Split‑pane layout: control panels fixed on the **left**; map fixed on the **right**, occupying the full viewport height and width. Map does **not** scroll; left panel may scroll independently and is resizable.
- **Left control panel sections:**
  1. **Input area** – text area with drag‑and‑drop/upload, plus selectors for input projection and format.
  2. **Conversion area** – selectors for output format and projection; map updates instantly to reflect choice.
  3. **Geometry list** – sortable table listing each geometry.
- JSFiddle‑inspired compact UI: reduced padding, tight margins, and small visual footprint for operational efficiency.
- Dark & light theme via prefers‑color‑scheme
- Progressive disclosure: Only show advanced projection dialog when user clicks Convert

## 9. Open Source & Licensing

All code MIT; third‑party libs under compatible licenses (BSD/MIT).

## 10. Risks & Mitigations

| Risk                              | Impact | Likelihood | Mitigation                          |
| --------------------------------- | ------ | ---------- | ----------------------------------- |
| Large file freezes UI             | High   | Medium     | Stream parsing, Web Worker offload  |
| External geocode API rate‑limited | Medium | High       | Client cache + fallback message     |
| Browser CRS transforms inaccurate | Medium | Low        | Validate against proj4js test suite |

## 11. Milestones

| When          | Deliverable                                  |
| ------------- | -------------------------------------------- |
| M0 (Kick‑off) | Agree scope & tech stack                     |
| M1 (4 w)      | Parsing & map render MVP (GeoJSON only)      |
| M2 (8 w)      | Add CSV/WKT; conversion UI; table panel      |
| M3 (10 w)     | Projection support; performance optimisation |
| M4 (12 w)     | Reverse geocode, i18n, dark mode             |
| M5 (14 w)     | Beta release & user testing                  |
| M6 (16 w)     | Public launch                                |

## 12. Analytics & Telemetry (Opt‑in)

- Anonymised events: format upload counts, conversion types, error rates
- No geometry data ever transmitted

## 13. Acceptance Criteria

1. User drops a GeoJSON file and sees geometries within one second.
2. User converts a WKT polygon to GeoJSON and downloads file matching original vertices.
3. User selects EPSG 3857 output and area retains ±0.5 % accuracy vs authoritative value.
4. Reverse geocode of a point returns correct city, state, country for 95 % of test locations.
5. Works offline after first load (except geocoding).

## 14. Open Questions

- Support for zipped shapefile (requires wasm library)?
- Persist geometry edits? (Out of scope now)
- Premium basemap options (Mapbox token, Google Maps, Apple Maps) or purely free OSM?

— End of Document —

