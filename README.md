# O-Composer

Current version: **0.0.2**

O-Composer is a browser-based orienteering course setting tool. It runs as a static web app, keeps event editing local to the browser, and focuses on `.ocp` and compatible `.ppen` course planning workflows: controls, courses, score events, relay variations, control descriptions, printable export areas, and downloadable event/export files.

Live site:

```text
https://maxencesun.github.io/O-Composer/
```

User guide: [USER_GUIDE.md](USER_GUIDE.md)

## What It Does

- Create, open, edit, and save full O-Composer `.ocp` event files.
- Import and export compatible `.ppen` files.
- Add, move, delete, duplicate, order, and edit courses and controls.
- Support normal courses, score courses with per-control points, team/free-control courses, map exchanges, map issue markers, flagged legs, manual leg cuts, and bend points.
- Design relay/forked courses with a visual variation tree, branch selection, and automatic relay team assignment tables.
- Edit IOF control descriptions, including symbols, text, score values, multi-column description tables, and black or upper-purple description-table rendering.
- Import OpenOrienteering Mapper `.omap`/`.xmap` XML maps for direct browser rendering.
- Import OCAD `.ocd` maps in the browser and convert them to OMAP before rendering.
- Import image or PDF basemaps, store original PDF basemap data when available, and calibrate basemap scale with two picked points.
- Export IOF XML 2.0.3/3.0, GPX, KML, RouteGadget-style XML, SVG overlays, PNG images, compatible `.ppen`, and vector PDF files.
- Export multiple PDFs as a ZIP, including relay variation folders and optional filtering to used variation codes.
- Pre-cache app resources such as fonts and control-description symbol XML, with versioned cache storage tied to the app version.

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
- `src/ocd/` contains the browser-side OCAD import component, conversion adapters, and worker support.
- `src/domain/` contains the event model, `.ocp`/compatible `.ppen` parser/serializers, OMAP parser, control-description logic, print-area logic, course queries, actions, and exporters.
- `src/state/` contains undo/redo and browser persistence helpers.
- `assets/` contains bundled fonts, control-description symbol XML, and the `mapper-wasm/` conversion engine used by OCAD import.
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

## OCAD Browser Import

Choose **File > Import OCAD Map** to open an `.ocd` map. Conversion and import happen locally in the browser; the map is not uploaded to a server.

The preferred path uses the bundled OpenOrienteering Mapper WebAssembly engine in `assets/mapper-wasm/`. Its JavaScript, WebAssembly, and projection-data files total about 26 MiB, so the first visit may need time to download them in the background. JS, data, and WASM start in parallel; WASM is compiled from a progress-tracked stream while bounded parallel workers cache the remaining app resources. The resource indicator at the top right uses pinned decoded sizes for those files plus the app fonts and symbol data, and switches to an indeterminate initialization state only after every stream has actually reached EOF. A download is considered stalled only when one unfinished artifact receives no bytes for 20 minutes; compilation/initialization has a separate five-minute inactivity limit, and background, offline, or suspended pages receive fresh grace time. A failure keeps the last progress visible and tells the user to retry with **Import OCAD Map**. Clicking that command during an active load reports the current state without opening a file picker or starting another loader. Later visits can reuse the versioned browser cache.

Large maps can take noticeably longer to read, convert, parse, and draw. Files at or above 64 MiB require confirmation; files above 512 MiB are rejected to protect the browser process. Keep the tab open and wait for the current stage to finish. O-Composer shows that an import is in progress and prevents another click from starting a competing conversion while the file is incomplete. For large converted maps, automatic session caching also avoids retaining both the source XML and a second parsed-map copy.

The import status identifies the conversion mode. **Official Mapper WASM** uses the Mapper engine and is the reference path. **JavaScript compatibility mode** is a fallback for supported OCAD content when the official engine is unavailable; it can emit warnings for features that cannot be reproduced exactly and is not presented as an official-equivalent conversion.

The Mapper WebAssembly bundle is built from [OpenOrienteering Mapper](https://github.com/OpenOrienteering/mapper) commit `064e6c943ee963277f1e930bda595723acd3e8c6`, which is distributed under the GNU GPL v3 or later. The browser bridge and corresponding source/provenance are retained with the project so the bundled engine remains traceable and rebuildable. O-Composer itself remains licensed under GNU AGPLv3.

## Browser-Only Limits

O-Composer intentionally runs in the browser, so some desktop-only capabilities are replaced or approximated:

- OCAD files are converted to OMAP in the browser before O-Composer renders them; compatibility-mode warnings should be reviewed for unsupported or approximated map features.
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
