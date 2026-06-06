# O-Composer

O-Composer is a simple, no-download web tool for designing orienteering courses directly in your browser. You can create and edit courses, place controls on the map, manage course descriptions, import OpenOrienteering Mapper maps, preview the course layout, and export files such as PDF, SVG, PNG, GPX, KML, IOF XML, and Purple Pen-compatible event files. It is designed to make course planning easier for beginners while still covering the common workflows needed for real orienteering events.


## Framework Choice

The implementation uses native Web Components plus ES modules. That choice fits this repository because the current workspace has no `dotnet`, `node`, or package manager available, and the app can still be organized as maintainable frontend modules without a build step or backend. It also avoids a CDN runtime dependency, which keeps the browser app fully client-side and self-contained.

## Architecture

- `index.html` loads the application shell.
- `src/ui/` contains browser UI components, the course canvas renderer, and the OMAP canvas renderer.
- `src/domain/` contains the Purple Pen event model, `.ppen` XML parser/serializer, OMAP XML parser, course queries, actions, and exporters.
- `src/state/` contains the undo/redo store.
- `tests/` contains static verification scripts and local fixtures that can run with the system Python.
- `samples/` contains bundled `.ppen` files, including the in-app standalone sample.

## Supported Workflows

- Create a new event.
- Open and save `.ppen` files in the original XML format.
- View all controls and individual course tabs.
- Add, select, edit, move, and delete controls and special objects.
- Add, duplicate, delete, order, and edit courses.
- Preserve course-control linked lists, score courses, map exchanges, text lines, descriptions, punch patterns, legs, special objects, relay metadata, and course appearance settings at the file-model level.
- Render course overlays in a browser canvas.
- Import and render uncompressed OpenOrienteering Mapper `.omap`/`.xmap` XML maps directly in the browser.
- Show description sheets and reports.
- Export IOF XML 2.0.3/3.0, GPX, KML, SVG overlays, PNG images, vector PDFs, and RouteGadget-style XML.

## Browser-Only Limitations

Browsers cannot directly access arbitrary file paths from `.ppen` files, installed fonts, native printer settings, or desktop helper executables. This means exact desktop behavior is replaced where needed:

- OMAP rendering is implemented for uncompressed OpenOrienteering Mapper XML files, including common paths, areas, hatching, point symbols, text, colors, combined symbols, line borders, and repeating mid-symbols. It is an approximate canvas renderer rather than the full native Mapper engine, so advanced symbol effects such as every clipping nuance, template, and overprint simulation may differ.
- OCAD and PDF map parsing is not implemented in this static app. Users can choose a browser-readable image as the map background for those formats.
- Desktop print commands are replaced by a selected-area vector PDF export.
- GPX/KML exports use map x/y coordinates unless a future georeferencing UI is added.
- Livelox publishing and direct RouteGadget file bundles are replaced by downloadable export files.
- Native OCAD export is replaced by SVG/PNG overlay export.

## Running

From this directory:

```sh
python3 run.py
```

Then open `http://localhost:5173/`.

For a build-only check:

```sh
python3 tests/verify_static_app.py
python3 build.py
```

To import an OMAP map in the app, choose **File > Import OMAP Map** and select a `.omap` or `.xmap` file. The bundled `samples/forest-sample.omap` and `samples/text-object.omap` files are local test maps.

## GitHub Pages

The repository includes a GitHub Pages workflow at `.github/workflows/pages.yml`. It publishes the static app directly from the repository root, using `index.html` as the site entry point.

After pushing this repository to GitHub, the Pages URL should be:

```text
https://maxencesun.github.io/O-Composer/
```
