# O-Composer

Current version: **0.0.0**

O-Composer is a browser-based orienteering course setting tool. It runs as a static web app, keeps event editing local to the browser, and focuses on Purple Pen-compatible course planning workflows: controls, courses, score events, relay variations, control descriptions, printable export areas, and downloadable event/export files.

Live site:

```text
https://maxencesun.github.io/O-Composer/
```

User guide: [USER_GUIDE.md](USER_GUIDE.md)

## What It Does

- Create, open, edit, and save Purple Pen `.ppen` event files.
- Add, move, delete, duplicate, order, and edit courses and controls.
- Support normal courses, score courses with per-control points, team/free-control courses, map exchanges, map issue markers, flagged legs, manual leg cuts, and bend points.
- Design relay/forked courses with a visual variation tree, branch selection, and automatic relay team assignment tables.
- Edit IOF control descriptions, including symbols, text, score values, multi-column description tables, and black or upper-purple description-table rendering.
- Import OpenOrienteering Mapper `.omap`/`.xmap` XML maps for direct browser rendering.
- Import image or PDF basemaps, store original PDF basemap data when available, and calibrate basemap scale with two picked points.
- Export IOF XML 2.0.3/3.0, GPX, KML, RouteGadget-style XML, SVG overlays, PNG images, `.ppen`, and vector PDF files.
- Export multiple PDFs as a ZIP, including relay variation folders and optional filtering to used variation codes.
- Pre-cache app resources such as fonts and Purple Pen symbol XML, with versioned cache storage tied to the app version.

## PDF Export

PDF export is vector-first and does **not** fall back to full-page raster PDF generation.

- OMAP basemaps are drawn as vector objects in the exported PDF.
- Original PDF basemaps are merged back into the output PDF when the source PDF data is available.
- Image basemaps are embedded as image resources while courses, symbols, descriptions, and text remain vector overlay content.
- PDF text is embedded with local bundled fonts: Latin text uses Roboto, and CJK text uses Heiti bold.
- Course-line gaps, control-circle gaps, flagged legs, and print-area placement are handled in the vector export path.

## Interface Highlights

- Main work area with map canvas, course tabs, description/variation/report panels, selection adjustment panel, and quick tools.
- Mobile-aware layout with touch interaction and two-finger zoom.
- Print/export area dialog with paper sizes, margins, orientation, current view, fixed frame, custom drawn area, and automatic modes.
- Map background adjustment panel for imported image/PDF basemaps, including scale, printed width, and calibration distance controls.
- Top-bar app branding with the maintained three-level version number.

## Architecture

- `index.html` loads the static app shell.
- `src/ui/` contains UI modules, map interaction, course drawing, PDF/export dialogs, OMAP rendering, and mobile/desktop layout behavior.
- `src/domain/` contains the event model, Purple Pen `.ppen` parser/serializer, OMAP parser, control-description logic, print-area logic, course queries, actions, and exporters.
- `src/state/` contains undo/redo and browser persistence helpers.
- `assets/` contains bundled fonts and Purple Pen symbol XML used by rendering/export.
- `samples/` contains local sample `.ppen` and `.omap` files.
- `tests/` contains static verification and smoke tests.

The app uses native Web Components and ES modules. No server runtime is required after files are served.

## Running Locally

From this directory:

```sh
python3 run.py
```

Then open:

```text
http://localhost:5173/
```

For a build-only check:

```sh
python3 build.py
```

The static build is written to `dist/`.

## Browser-Only Limits

O-Composer intentionally runs in the browser, so some desktop Purple Pen capabilities are replaced or approximated:

- Native OCAD map parsing/rendering is not implemented; use OMAP/XMAP XML, PDF basemaps, or image basemaps instead.
- OMAP rendering covers common symbols, colors, text, paths, areas, hatching, combined symbols, line borders, and repeated symbols, but it is not the native OpenOrienteering Mapper renderer.
- GPX/KML exports use the app's map coordinate space unless future georeferencing metadata is added.
- Livelox publishing and direct desktop printer integration are not available from the static browser app.

## Samples

Use the bundled sample files for local testing:

- `samples/standalone-sample.ppen`
- `samples/original-sample-event.ppen`
- `samples/original-sample-event-exchange.ppen`
- `samples/forest-sample.omap`
- `samples/text-object.omap`

## GitHub Pages

The repository includes `.github/workflows/pages.yml`, which publishes the static app from the repository root.
