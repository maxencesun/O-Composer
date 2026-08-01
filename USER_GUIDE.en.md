# O-Composer Project User Guide

- Applicable version: **0.0.4**
- Document language: **English**
- Intended readers: course planners, event directors, cartographers, controllers, print teams, and first-time O-Composer users

O-Composer is a browser-based orienteering course-planning application. It creates and edits complete O-Composer `.ocp` projects, opens and exports compatible `.ppen` files, imports OMAP/XMAP, OCAD, image, and PDF maps, supports standard, score, team, military-orienteering, and forked relay courses, and exports PDF, PNG, IOF XML, GPX, KML, RouteGadget XML, and SVG overlays.

This guide follows the complete workflow from a blank event to deliverable files. It also acts as a menu-by-menu, button-by-button, and field-by-field reference. It covers all currently visible functions, editing gestures, course formats, relay forks, map exchanges, control descriptions, line and circle cutting, measurements, military grids, print areas, compatibility boundaries, the supplied sample maps, and troubleshooting.

> [!TIP]
> Most users can open **[https://maxencesun.github.io/O-Composer/](https://maxencesun.github.io/O-Composer/)** directly. No installation or local server is required. Use a current desktop browser and allow downloads for generated `.ocp`, PDF, ZIP, and exchange files.

> [!IMPORTANT]
> Use `.ocp` as the primary working and archive format. Export native `.ppen` only when handing the event to Purple Pen or another workflow that specifically requires it. See [Section 21](#21-save-import-and-export-compatibility) for the compatibility boundaries.

## How to use this guide

- First-time users: complete [Section 0](#0-ten-minute-quick-start), then practise with one of the real maps in [Section 19](#19-complete-workflows-with-the-three-sample-maps).
- Event production: work in the order map → event settings → courses → descriptions → checks → export, then complete [Section 24](#24-pre-delivery-checklist).
- To locate a command, use [Section 2](#2-top-menu) and [Section 3](#3-quick-toolbar).
- For mouse, touch, and keyboard behaviour, use [Section 20](#20-complete-mouse-touch-and-keyboard-reference).
- For competition formats, use [Sections 12–15](#12-score-courses).
- For import, selection, circle cutting, map pages, PDF, or browser problems, go directly to [Section 23](#23-troubleshooting-and-faq).

<details>
<summary><strong>Show the complete table of contents</strong></summary>

- [0. Ten-minute quick start](#0-ten-minute-quick-start)
- [1. Starting O-Composer and understanding the interface](#1-starting-o-composer-and-understanding-the-interface)
- [2. Top menu](#2-top-menu)
- [3. Quick toolbar](#3-quick-toolbar)
- [4. Course tabs and map information bar](#4-course-tabs-and-map-information-bar)
- [5. Left panels](#5-left-panels)
- [6. Adjustment panel reference](#6-adjustment-panel-reference)
- [7. Set Print Area window](#7-set-print-area-window)
- [8. PDF export window](#8-pdf-export-window)
- [9–11. Text, deletion, standards, and symbols](#9-add-text-window)
- [12. Score courses](#12-score-courses)
- [13. Team courses](#13-team-courses)
- [14. Military orienteering](#14-military-orienteering)
- [15. Forks, variations, and relays](#15-forks-variations-and-relays)
- [16. Map exchange, map flip, and map pages](#16-map-exchange-map-flip-and-map-pages)
- [17. OCAD import in the browser](#17-ocad-import-in-the-browser)
- [18. Map import, replacement, movement, and calibration](#18-map-import-replacement-movement-and-calibration)
- [19. Workflows with the three sample maps](#19-complete-workflows-with-the-three-sample-maps)
- [20. Mouse, touch, and keyboard reference](#20-complete-mouse-touch-and-keyboard-reference)
- [21. Save/import/export compatibility](#21-save-import-and-export-compatibility)
- [22. Descriptions, constants, reports, and properties](#22-descriptions-constants-reports-and-properties)
- [23. Troubleshooting and FAQ](#23-troubleshooting-and-faq)
- [24. Pre-delivery checklist](#24-pre-delivery-checklist)
- [25. Browser, offline, and implementation boundaries](#25-browser-offline-and-implementation-boundaries)

</details>

## Core concepts

| Term | Meaning | Common source of confusion |
| --- | --- | --- |
| Event | Top-level project containing the map, global controls, courses, special objects, print areas, and settings | New Event clears the whole project; it does not merely add a course |
| Global control | A point object that can be reused by several courses | Removing it from one course does not necessarily delete the global object |
| Course | The set of rules and controls completed by a participant | Standard, score, team, and military courses have different ordering and description rules |
| Leg | The connection between two adjacent nodes in one concrete course | It may contain bends, flagging ranges, and manual gaps |
| Fork | Fork/branch topology inside a standard course | All Variations is an overview, not one uniquely ordered course |
| Map page | One page of a concrete course split by an exchange or flip | A boundary control appears on both adjacent pages |
| Print area | The paper rectangle used for PDF output | It can belong to All Controls, a course, or a particular page of a course |
| Control description | IOF/ISCD data and its map-table object | Editing the data and placing a description table are separate operations |
| Special object | Text, lines, forbidden areas, descriptions, and other non-control objects | It may be visible on all courses or only selected courses |

## 0. Ten-minute quick start

1. Open the **[online O-Composer application](https://maxencesun.github.io/O-Composer/)**. Developers may instead run `python3 run.py` in the project directory and open the displayed local URL. Do not open `index.html` through `file://`.
2. On first use, select **English**, an appropriate rendering quality, and Automatic/Desktop/Mobile interface mode.
3. Choose **File > Import OMAP Map** and open [`samples/beihang_xyl_jiaoxuequ_1000.omap`](samples/beihang_xyl_jiaoxuequ_1000.omap). The sample is an immediately renderable 1:1000 OMAP campus map.
4. Choose **Course > Add Course**, enter `Training Course`, and select **Standard Course**.
5. Use the Start, Control, and Finish toolbar tools to place the sequence. A start is kept at the beginning, after a map issue point if one exists; a finish is kept at the end.
6. In the Description panel, verify column A sequence numbers and column B codes. Click cells C–H to enter ISCD symbols and text.
7. Choose **Add > Control Description**, then click the map to place the description table.
8. If a connection obscures map detail, choose **Cut Line**. Click a purple leg to cut the line, or click the visible circumference of a normal-control or finish circle to cut the circle. Select a gap and drag its two blue end handles to refine it.
9. Choose **View > Set Print Area**, select A4, landscape, 5 mm margin, and Move Fixed Paper Frame. Position the frame and apply it.
10. Choose **File > Save .ocp**, then **File > Create PDF**. Select the current course and include the map and control descriptions.

You have now completed the essential map → course → descriptions → cutting → print → archive workflow.

## 1. Starting O-Composer and understanding the interface

At startup, O-Composer loads and caches fonts, the control-description symbol database, map conversion components, and other application resources. Download progress appears beside the version indicator. Cached resources are reused while their version remains current.

### 1.1 First-time setup

- **Language**: English or Chinese. This controls the interface, the in-app guide, and the default control-description language.
- **Rendering quality**: Performance is approximately a 1× canvas, Balanced 1.5×, High Quality 2×, and Maximum 3×. Higher settings improve fine linework but consume more memory and rendering time. Start with Performance or Balanced for very large OMAP/OCAD maps.
- **Interface mode**: Automatic, Desktop, or Mobile. Override Automatic if a tablet is classified incorrectly.

Portrait phones show a rotate-device prompt. Landscape orientation is strongly recommended because it leaves space for both map and editing panels.

You can change these options later through **Settings > Global Options**. Save before changing language because the application may reload.

### 1.2 Local data, cache, and privacy

O-Composer is a static front-end application. Event parsing, OCAD conversion, Python page formulas, rendering, and export run in the browser. Imported event and map data are not automatically uploaded.

If asked for permission to cache the current event and map:

- **Accept** permits recovery of the current event and basemap next time.
- **Not now** hides the prompt for the current session but does not store a permanent refusal.

Browser storage is not a substitute for files. Save `.ocp` versions regularly, especially before clearing browser data, using private browsing, changing devices, or changing browsers.

### 1.3 Main interface regions

From top to bottom, the desktop interface contains:

1. top menu;
2. quick toolbar;
3. course tabs and current-course information;
4. left panel for descriptions, forks, reports, constants, and adjustments;
5. centre map canvas;
6. optional variation topology and right-side adjustment area;
7. bottom status bar.

Panel dividers can be dragged. Floating dialogs such as print area, PDF export, course pages, and this guide use draggable title bars.

### 1.4 Ways to open the application

- **Normal use**: visit [https://maxencesun.github.io/O-Composer/](https://maxencesun.github.io/O-Composer/).
- **Development/local testing**: run `python3 run.py` in `O-Composer`, then open the displayed URL, normally `http://localhost:5180/`.
- **Static build only**: run `python3 build.py`; output is written to `dist/`.

HTTP is required for modules, workers, WASM, and fonts. Do not double-click `index.html`.

## 2. Top menu

### 2.1 File

**New Event**

Creates an empty event after warning about unsaved changes. It clears courses, controls, map, special objects, selections, and event-level settings.

**Open Sample**

Loads [`samples/standalone-sample.ppen`](samples/standalone-sample.ppen) for a quick tour of courses, descriptions, and exports.

**Open .ocp/.ppen**

Opens a local `.ocp`, compatible `.ppen`, or matching `course-scribe-event` XML file. This is not an IOF XML import command. Opening a file resets pan/zoom and selects the first course.

**Save .ocp / Save As**

Downloads the complete project. `.ocp` preserves O-Composer extensions including team-course semantics, relay allocation, custom constants, advanced page formulas, and measurements. Save As currently performs the same download under a chosen project name.

**Export Native .ppen**

Produces a Purple Pen-compatible file where possible. Unsupported O-Composer extensions are degraded or omitted: team courses are exported as standard courses, while custom constants, team-number formatting, leg names, measurements, and advanced Python page formulas are not preserved. Simple exchange/flip points on standard courses use Purple Pen fields.

**Select Map Image/PDF**

Imports an image or PDF basemap.

- Images retain their pixel dimensions.
- For PDF, choose a page; O-Composer renders a high-resolution preview and retains original PDF data for vector PDF merging where possible.
- Every newly imported image/PDF requires two-point scale calibration before editing continues.
- Later changes are available through **Settings > Map Information**.

**Import OMAP Map**

Imports uncompressed `.omap` or `.xmap` XML and renders its vector objects. Compressed/ZIP containers are rejected. Files at or above 64 MiB require confirmation; files above 512 MiB are rejected.

**Import OCAD Map**

Converts `.ocd` to OMAP locally in the browser, then parses and renders it. The official Mapper WebAssembly engine and projection resources total roughly 26 MiB and load in the background. Wait for loading to finish before retrying import. Progress covers reading, conversion, parsing, and first rendering. Official Mapper WASM is the reference path; JavaScript compatibility mode is used only if the official engine is unavailable and may report limitations.

**Clear OMAP Map**

Removes the current OMAP/XMAP or OCAD-derived basemap without deleting course objects. It does not clear image/PDF basemaps.

**Create Image File**

Exports the current canvas view as PNG.

**Create PDF**

Opens the PDF export window. Course linework and text remain vector. Pages of a concrete course are combined in order; multiple course/variation PDFs are packaged as ZIP.

**Create IOF XML 3.0 / IOF XML 2.0**

Exports course data for compatible timing or event systems. Version 2 uses the 2.0.3 structure.

**Create GPX / KML**

Exports structural coordinates. O-Composer currently writes internal X/Y as longitude/latitude placeholders and does not perform CRS conversion, so these files must not be treated as navigation-ready geographic data.

**Create RouteGadget XML**

Exports simplified RouteGadget-style course names, lengths, and point coordinates. It is not a full RouteGadget event package.

**Create SVG Overlay**

Exports a simplified current-course SVG of about 1200 px width. It omits the basemap and several print details such as specials, bends, manual gaps, and flagging; use it for exchange/debugging, not print-faithful production.

### 2.2 Edit

- **Undo / Redo**: traverse editable event history.
- **Delete**: deletes the selection. In All Controls, deleting a used global control offers removal from all courses. In one course, it normally removes only that course occurrence.
- **Cancel Mode**: exits add, cut, drawing, and other tool modes and returns to selection.

### 2.3 View

- **Entire Course / Entire Map**: currently both reset to the default zoom and pan; they do not yet calculate distinct fitted bounds.
- **Zoom 50% / 100% / 200%**: set a fixed zoom.
- **Show Print Area**: toggles print-area outlines.
- **Set Print Area**: opens the paper and export-range editor.
- **All Controls**: displays all event controls and applicable special objects.
- **Switch Rendering Quality**: cycles through the available quality levels.

### 2.4 Add

- **Start**: places a start triangle. A course normally has one start.
- **Control**: places a normal control. Clicking close to an existing compatible control snaps to and reuses it.
- **Finish**: places a finish double circle.
- **Map Pages**: opens exchange, flip, standalone-exchange, and advanced Python page settings for a standard course.
- **Standalone Map Exchange**: inserts a dedicated exchange point in a selected leg. The old map ends without a point symbol; the new map starts with the IOF 7.15 triangle-in-circle continuation symbol aimed toward the next control. Score courses do not support standalone exchanges.
- **Mandatory Crossing Point**: places a mandatory crossing symbol.
- **Map Issue Point**: places the map-issue symbol at the front of a course. Its leg to the start is dashed. It has no editable code.
- **Add Fork**: adds a fork at the selected topology position on a standard course. Score, team, and military courses do not accept forks.
- **Cut Line**: clicking a purple leg creates a manual leg gap; clicking the circumference of a normal-control or finish circle creates a circle gap. Select a gap near its midpoint to show and drag its two blue handles. Delete/Backspace removes the selected gap.
- **Measure**: opens the measurement palette in selection mode. Use Add Measurement to start a new polyline. Measurements can be open or closed, store independent colour and solid/dashed/dotted style, show ground/paper values, and optionally display a draggable total-distance label on the map.
- **Control Description**: places a description table, or selects the existing table for the current course.
- **Text**: opens the Add Text window after a map click.
- **Line / Rectangle / Ellipse**: drag to add decorative geometry; Shift constrains a straight line to horizontal, vertical, or ±45°.
- **Out of Bounds / Out of Bounds without Border / Dangerous Area / Construction Area**: draw polygonal special objects. Click vertices and right-click to finish; Esc cancels an unfinished polygon.
- **Optional Crossing / Water / First Aid**: place Purple Pen-compatible point symbols. Optional and mandatory crossings can be rotated with an angle field or blue rotation handle.
- **Forbidden Route / Boundary / Registration Mark / White Out**: add the corresponding special object.

Normal controls can be selected by clicking anywhere inside the circle or on its circumference; hitting the centre is not required. To select an existing circle gap, click near the middle of the missing arc until two blue endpoints appear.

Measurement details:

- Backspace removes the last point while drawing.
- In selection mode, Delete, Backspace, the main Delete command, or Delete Selected removes the selected measurement.
- Double-click a segment to insert a vertex; double-click a vertex to remove it.
- Shift constrains a newly drawn segment to horizontal, vertical, or ±45°.
- Minimising the measurement palette hides both palette and measurement graphics. Reopen **Add > Measure** to restore them.
- Measurements persist in cache and `.ocp`, but not native `.ppen`.

### 2.5 Settings

**Global Options** changes language, rendering quality, and Automatic/Desktop/Mobile interface mode.

**Event Settings** opens the event section of the adjustment panel.

**Map Information** opens map dimensions and calibration controls. Calibration handles are visible only while this section is active.

### 2.6 Course

**Add Course** asks for a name and one of Standard, Score, Team, or Military Orienteering. A new course is empty; it does not automatically adopt existing starts or finishes. Reuse a faded compatible global control by clicking it in an add mode. A start is kept first (after a map-issue point), and a finish is kept last.

**Delete Course** asks for confirmation. Global controls remain available until explicitly removed as unused.

**Duplicate Course** copies order, properties, and variation structure while sharing global control objects. Moving a shared control affects every course that uses it.

**Properties** selects the current course in the adjustment panel.

**Course Order** moves courses up or down and changes tab and export ordering.

**Course Load** records expected participant load; negative means unspecified.

**Course Fork Report** displays the combinations produced by the current fork topology.

### 2.7 Reports

- **Course Summary**: course name, control count, length, and related summary values.
- **Event Audit**: missing codes, missing starts/finishes, unused controls, and other common errors.
- **Leg Lengths**: detailed leg distances.
- **Control Cross-reference**: which courses use each control.
- **Control and Leg Load**: underlying calculations cover both; the current report view presents the control-load table. Use leg lengths, cross-reference data, and manual review when assessing leg congestion.

### 2.8 Help

**User Guide** opens this language-specific Markdown file in a non-modal floating reader, so the map and panels remain usable. The desktop sidebar lists top-level chapters and follows scrolling. Narrow screens hide it but retain the expandable contents above. Search requires two characters; use arrow buttons, Enter, or Shift+Enter to move between matches.

Drag an empty part of the purple title bar to move the full-size window, small window, or minimised title strip. Movement is constrained to the visible browser area. Title-bar buttons do not initiate dragging, and dragging the minimised strip does not accidentally restore it.

- **Minimise** animates to a bottom-right title strip. Click Restore or the title to return while preserving reading position and full/small mode.
- **Small Window** creates a compact reader without the sidebar for reading while editing. Click again for full size.
- **Close** closes the guide; Esc also closes it. Reopening starts in full-size mode.

The guide remains available during mandatory image/PDF calibration.

**About O-Composer** shows name, version, and licence.

**Browser Version Limitations** summarises browser capabilities: `.ocp` and native `.ppen`, local OCAD conversion through Mapper WASM, uncompressed OMAP/XMAP rendering, and PDF import are supported; desktop-only system-font detection and Livelox publishing remain outside the browser version.

## 3. Quick toolbar

The toolbar exposes the most-used menu commands: Open, Save, Undo, Redo, Delete, Start, Control, Finish, Map Issue, Map Pages, Cut Line, Measure, Control Description, special areas/symbols, decorations, and Print Area. On mobile it favours icons and may wrap.

## 4. Course tabs and map information bar

- **All Controls** shows global controls and global/applicable specials.
- A tab for each course switches the current course.
- In mobile landscape, tabs become a selector and the layout uses left panel, map, and right adjustment panel.
- The information bar shows event, course, type, variation mode, length, and control count.

Standard courses with page actions show a **Map Page** selector containing Global and each page. The boundary control appears on both pages: as a normal circle on the old page and an IOF triangle-in-circle continuation symbol on the new page. Ordinal numbering remains continuous across the whole course.

Forked courses show a **Course Variation** selector:

- **All Variations** displays the complete topology.
- A letter code displays one concrete course.
- Relay views select a team and leg after allocation is configured.

## 5. Left panels

### 5.1 Description

The description panel edits the current course's IOF/ISCD description rows. Standard courses follow course order. Score and military courses are sorted by control code and show score values in column H.

- Column A: ordinal number.
- Column B: control code.
- Columns C–H: feature, appearance, dimensions/combinations, location, other information, and course-type-specific values.
- Click a row to select the corresponding map point.
- Click cells C–H for the symbol palette. Unspecified clears a cell; hover a symbol for its meaning.

For a team course, the panel selects whether subsequently added normal controls are mandatory or free-choice. Existing points are changed in the adjustment panel. Starts and finishes cannot be free-choice controls.

### 5.2 Forks

The fork panel creates and edits standard-course branch topology.

- Branch count is 2–6.
- Select a node or segment, then Add Fork.
- Selecting above/below a node inserts before/after it.
- Select within a branch to add controls to that branch.
- Select the post-join segment to insert after the fork.
- Selecting a map control synchronises the topology selection.
- A final ordinary control remains selectable before a finish exists, but cannot start a fork without a following join point.

The panel lists the selected branch and all generated variation codes. Score, team, and military courses cannot add forks; the military course uses this space for its grid and time-window controls.

Relay allocation fields include team count, team size/number of legs, first team number, prefix, zero-padding digits, and a custom name for each leg. The table maps every team/leg to a variation code. Exported single-variation descriptions include the corresponding team and leg label.

### 5.3 Reports

Displays the report most recently chosen from the Report menu.

### 5.4 Constants

Built-in constants include event name, course name, class, course length, climb, control count, map scale, team name/number, team number, relay leg, and variation. A forked course without a concrete variation shows a shortest–longest length range; a concrete variation shows one value.

Custom constants have a name, explanation, and literal value or expression. They are O-Composer project data and may not survive native `.ppen` export.

### 5.5 Adjustments

The right-side adjustment area follows selection: no selection shows event settings; selecting a map, control, course, leg, label, description table, or special object shows the matching editor.

## 6. Adjustment panel reference

### 6.1 Event settings

- **Event name**: used in files, descriptions, and headings.
- **Control circle size**: percentage scaling for course symbols.
- **Description standard**: ISCD 2024 or ISCD 2004.
- **Map standard**: ISOM 2017, ISSprOM 2019, or ISOM 2000; affects symbol sizes and gaps.
- **First control code** and **Avoid upside-down codes**: rules for automatic numbering.
- **Apply automatic numbering**: renumbers normal controls.
- **Move all controls**: direction and distance batch operation.
- **Remove unused controls**: deletes global controls referenced by no course.

### 6.2 Map information

Read-only fields may include source file, format, object/symbol counts, pixel size, PDF page/total pages, PDF rendering DPI, and current scale. Editable fields include ground width/height, printed width, scale, calibration ground distance, and calibration printed length.

**Calibrate with Two Points** shows numbered endpoints and a preview line. Choose two recognisable points, enter map scale plus either printed centimetres or ground metres, then confirm. Shift constrains placement or handle movement to horizontal, vertical, or ±45°. While the calibration palette is open, both points remain draggable and calculated values update live; map size changes only on confirmation.

New image/PDF maps enforce this process and do not provide a cancel/close bypass. **Move Map** enters a basemap-only movement mode; course objects remain stationary. Use the button again, Esc, or right-click to leave it.

### 6.3 Control settings

- **Type**: start, normal control, finish, mandatory crossing, map issue, or map exchange.
- **Code**: editable for start, normal control, and finish; non-empty and case-insensitively unique among codable points.
- **X / Y**: map coordinates.
- **Rotation angle**: 0–359° for mandatory crossings; also editable with the blue handle.
- **Before / After**: control-description text.
- **Flagged connection to finish**: choose the score control from which the finish leg is flagged.
- **Team control type**: mandatory or free-choice.
- **Description C–H** and **punch box**: ISCD data and punch-box text.

### 6.4 Course settings

- **Name** and **Type**: Standard, Score, Team, or Military. Avoid changing type after detailed planning.
- **Number display**: ordinal; code; ordinal and code; ordinal/code; ordinal and score; code[score]; code-score; code(score); or score only.
- **Print scale**, **climb**, **load**, **length override**, **starting ordinal**, and **subtitle**.
- **Finish route**: navigate to finish; fully flagged; or navigate to a funnel then follow flagging.
- **Hide from reports**: currently excludes the course from IOF, GPX, KML, and RouteGadget exports, but interface reports and PDF All Courses still use the complete list.

Relay-specific settings include team count, team size/legs, first team number, hiding variation codes on the map, allowed legs for each branch, and the allocation table. Set team size before creating forks. Nested branch restrictions cannot exceed parent restrictions.

Map-page settings are opened separately through Add/toolbar Map Pages. Simple actions attach exchange, flip, or conversion-to-standalone-exchange to a normal control. Removing a standalone action restores the same node as a normal control and restores or assigns its code. Advanced Python is covered in [Section 16](#16-map-exchange-map-flip-and-map-pages).

### 6.5 Leg settings

- **From / To**: read-only endpoints.
- **Flagging**: none, entire leg, from control, into control, or middle portion.
- Percentage sliders set the start/end of partial flagging.
- Manual cut list selects an existing leg gap.
- **Add Bend** then click the selected purple leg.
- **Delete Bend** removes the selected bend.

### 6.6 Control-number settings

Drag a number on the map to move it. **Restore Automatic Placement** discards the manual offset.

### 6.7 Control-description table settings

- **Displayed for**: All Controls or one course.
- **Format**: symbols, text, or symbols and text.
- **Columns**: 1–6.
- **Row height (mm)**.
- **Colour**: black or upper purple.

### 6.8 Text special settings

Select visibility on all courses or any number of named courses, text, colour palette/spectrum/hex, font, bold, italic, and text height. Empty course selection normalises to all courses. Chinese PDF text uses an embedded bold CJK font; Latin text uses embedded Roboto.

### 6.9 Line, rectangle, and ellipse settings

Select visibility, one of the preset or custom colours, single/double/dashed line, width, dash length, gap/double-line separation, and rectangle corner radius.

### 6.10 Area and point special settings

Area objects such as out-of-bounds, danger, construction, and white-out normally expose visibility and colour. Water, first aid, registration marks, and similar point objects primarily expose type and visibility.

## 7. Set Print Area window

Open it from **View > Set Print Area** or the toolbar. It is a draggable non-modal window; map interaction remains available. When viewing a particular map page, Current Course means that course and page.

- **Apply to**: All Courses, Current Course, or All Controls.
- **Paper**: Letter, Legal, Tabloid, A5, A4, A3, A2, current file size, or custom.
- **Orientation**: portrait or landscape.
- **Margin**: 0, 3, 5, 10, 15 mm, or an existing custom value.
- **Area mode**: move fixed paper frame; draw custom rectangle; current view; or automatic.
- **Constrain to selected paper** preserves paper dimensions and margins; disabling it allows free dimensions.

In fixed-paper mode, drag the paper frame into position. In custom mode, actually draw a rectangle before Apply becomes valid. Choosing custom paper automatically selects drawing mode and releases the fixed-paper constraint. Cancel restores the print-area visibility state from before the window opened.

## 8. PDF export window

### 8.1 Course scope

Choose Current Course, Current View, All Controls, All Courses as separate PDFs, or a named course. Forked courses normally expand to concrete variations or relay allocations. If Current Course is explicitly in All Variations and has no map pages, one combined all-variation map may be produced. Multi-target output uses descriptive variation/team/leg filenames inside a ZIP.

### 8.2 Appearance

- **Include map**: OMAP/XMAP remains vector; retained source PDF can be merged; an image map is embedded as a high-quality JPEG page image at about 305 dpi while course symbols and text remain vector.
- **Include control descriptions**: includes/excludes map description-table objects.
- **Lossless PDF compression**: compresses generated PDF content streams; it does not promise byte-for-byte or pixel-codec losslessness for image basemaps.

O-Composer does not fall back to a full-page raster PDF.

### 8.3 Files and progress

Set a filename prefix and whether to append course names. For relays, **Only export used variation codes** limits output to codes present in automatic allocation; disabling it includes every possible code.

The window remembers recent settings and estimates file/page counts. A single progress bar reports preparation, fonts, drawing, PDF writing, compression, map merging, and ZIP packaging. Closing the dialog after generation begins does not cancel the background task; the download may still appear.

## 9. Add Text window

After choosing Add Text and clicking the map, enter text or use presets such as Text, Water, First Aid, Registration, Start, Finish, Danger, and Out of Bounds. Choose colour, font, bold/italic, and size. Apply creates it at the clicked point; Cancel creates nothing.

## 10. Delete confirmation window

Deleting a course offers Keep Course or Delete Course. Deleting a globally used control offers Keep Control or Remove from All Courses. Continue executes the selected action.

## 11. Standards, symbols, and display rules

- **ISCD 2024 / ISCD 2004** controls description symbols and directives. Newer directives may be downgraded under 2004.
- **ISOM 2017 / ISSprOM 2019 / ISOM 2000** controls printed course-symbol geometry.
- Course purple is separated into lower and upper purple where appropriate.
- Control-circle gaps and leg gaps are display geometry; they do not alter course sequence or measured centre-to-centre length.
- The map canvas may simplify at low zoom or low rendering quality. Use print preview/PDF and an appropriate zoom for final inspection.

## 12. Score courses

### 12.1 Creating and displaying a score course

Create a course with type **Score Course**. Add a start, normal controls, and a finish. Unlike a standard course, normal controls are not a required visit sequence: descriptions and many displays are sorted by control code.

Select each normal control and enter its score. Choose a number-display format that exposes the information competitors need, for example ordinal and score, code with score, or score only. The total score is calculated from the controls on the course.

Score-course control descriptions show the score in column H. A score value changes competition meaning, not map position.

### 12.2 Guiding competitors from a designated score control to the finish

Select a normal score control and enable the flagged connection to the finish. O-Composer records that specific control as the source of the flagged finish leg. Verify the rendered connection and corresponding description directive.

Only one selected source should represent the intended finish approach. If the finish or source control is removed, recheck the setting before export.

### 12.3 Limitations and saving

- Score courses do not support forks.
- Standalone map exchange points are not supported.
- The start and finish remain structural endpoints even though normal controls are unordered.
- Save as `.ocp` to preserve all score and O-Composer-specific settings. Verify the target system after exporting IOF or `.ppen`.

## 13. Team courses

A team course is intended for a team that must collectively complete required and free-choice controls.

### 13.1 Creating a team course

1. Add a course of type **Team Course**.
2. Add its start and finish.
3. In the Description panel, choose the add-state for **Mandatory** or **Free-choice** before placing normal controls.
4. To change an existing point, select it and change **Team control type** in the adjustment panel.
5. Review the map and description so required and optional responsibilities are unambiguous.

Starts and finishes cannot be free-choice. The add-state affects future points only; it does not retroactively modify existing controls.

### 13.2 Limitations and saving

- Team courses cannot contain forks.
- Native `.ppen` has no complete equivalent for O-Composer team semantics; export degrades the course to a standard course.
- Archive and hand off the `.ocp` file whenever the event depends on mandatory/free-choice meaning.
- Produce a competitor instruction sheet if downstream timing or printing software cannot express the team rules.

## 14. Military orienteering

Military orienteering courses add coordinate-grid and time-window semantics to a course. They are still stored inside the same event and can reuse global controls.

### 14.1 Creating a military course

1. Add a course of type **Military Orienteering**.
2. Add the start, normal controls, and finish.
3. Assign control scores where the competition requires them.
4. Open the military panel in the left topology area.
5. Configure the coordinate grid and time-window points.

Descriptions are code-sorted and display score values in column H. Military courses do not support forks.

### 14.2 Coordinate grid

The military panel creates a grid over a chosen map rectangle. Configure the grid bounds, row/column interval, displayed coordinate values, colour, and applicable course. Grid coordinates are event/map coordinates, not automatically transformed geographic coordinates.

Use the grid to communicate the coordinate scheme defined by the event. Confirm that labels increase in the intended X/Y directions and that the printed line weight remains legible without obscuring the map.

### 14.3 Drawing and editing grid bounds

- Enter grid drawing mode, then drag the intended map rectangle.
- Select the grid to edit its bounds and parameters.
- Drag visible handles to refine the rectangle.
- Preview the target course at its print scale.
- Deleting the grid removes the overlay, not the underlying controls or course.

If the imported basemap is moved or recalibrated after grid creation, verify alignment again.

### 14.4 Time-window points

A time-window point is a normal global control used with special timing semantics on the military course.

- Enter start and end times in `MM:ss`.
- Add a new hidden time-window point by clicking the map, or use a suitable existing control.
- Add/remove it from the current military course without destroying its global availability.
- During editing, time-window points are shown in blue; preview hides them.
- A control is hidden only where it serves as a time-window point. It remains reusable as an ordinary control on another course.

Check that time windows do not overlap incorrectly and that the event instructions explain how early/late arrival is scored.

### 14.5 Editing, preview, and deletion semantics

Use edit view to check grid and hidden time-window points; use preview to see the competitor-facing result. Removing a course occurrence is different from deleting a global control. Before global deletion, review the cross-reference report.

Save military projects as `.ocp`. Exchange formats may omit grid, timing, or other O-Composer-only semantics.

## 15. Forks, variations, and relays

### 15.1 Preconditions and basic procedure

Forks are available only on standard courses and require a meaningful join point after the fork.

1. Build the common start, at least one pre-fork point, a post-fork join/control, and finish.
2. Open the Fork panel and choose 2–6 branches.
3. Select the topology segment where the fork begins and choose Add Fork.
4. Select each branch and add its controls.
5. Add nested forks only where the parent topology permits them.
6. Review All Variations, then every concrete letter code.

### 15.2 Topology-tree selection logic

The selected line/node determines insertion:

- pre-fork vertical line → before the fork;
- a branch line → inside that branch;
- join/post-fork line → after the fork;
- above or below a node → before or after that node.

Map and topology selections synchronise. If a new control appears in the wrong branch, undo it, reselect the intended branch segment, and add again.

### 15.3 Variation codes, loops, and viewing

Each complete path receives a letter code such as `ABCD`. All Variations displays every branch simultaneously and therefore has no unique order. Select a concrete variation before judging length, descriptions, page actions, or page-specific print areas.

Nested structures must rejoin correctly. Inspect every generated code for missing endpoints, unintended repeated controls, and impossible sequences. Use the Course Fork Report as a structural cross-check.

### 15.4 Leg restrictions and recommended team size

For relays, set the number of legs before creating forks. Each branch may allow one or more relay legs. An unset restriction inherits from its parent; a nested branch cannot permit a leg forbidden by its parent. The interface proposes team sizes compatible with the topology, but the planner remains responsible for fairness.

### 15.5 Relay fields and automatic allocation

- total number of teams;
- number of legs/team members;
- first team number;
- optional team-number prefix;
- zero-padding digits;
- custom label for each leg;
- hide variation code on map;
- export only variation codes actually allocated.

The allocation table maps each team/leg to a complete variation code. Review distribution counts and lengths. A mathematically balanced code allocation can still be physically unfair because terrain and technical difficulty differ.

### 15.6 Length and export

All Variations may show a shortest–longest range. A concrete variation shows its own length. Relay PDF names and description subtitles can include team, leg, and variation identifiers. When exporting all teams, expect ZIP output.

Before publication:

- inspect every used variation;
- check map pages for every used variation;
- verify branch labels are visible or intentionally hidden;
- compare length and climb;
- confirm the allocation table against entries/start lists.

## 16. Map exchange, map flip, and map pages

### 16.1 Three page actions

- **Map exchange at a control**: the competitor collects another map after that control.
- **Map flip**: the competitor turns the current sheet over after that control.
- **Standalone map exchange point**: a dedicated course node, not a normal control.

Exchange and flip create page boundaries. The boundary control belongs to both pages. The old page uses its normal circle; the new page uses the IOF continuation triangle inside a circle. Whole-course ordinals remain continuous.

### 16.2 Simple settings for an unbranched standard course

Open **Add > Map Pages** or the toolbar button. Choose Add Map Action, the control, and Exchange, Flip, or Standalone Exchange. Only configured actions remain listed.

Converting a normal control to a standalone exchange changes that same node in place; it does not insert a second point. It stops counting as a normal control. Removing the action restores the same node as a normal control and restores its prior code where available.

Simple edits clear conflicting advanced code. A standalone exchange inserted through Add uses the currently selected leg.

### 16.3 Advanced Python pages

Advanced mode accepts a function in the form:

```python
def advanced_flip_exchange(course):
    flip_list = [0] * course.length
    exchange_list = [0] * course.length
    # Set a non-zero value after the relevant normal control.
    return flip_list, exchange_list
```

The two result lists must match the number of normal controls in that concrete course. One position cannot request both flip and exchange.

Available data includes `course.length`, `control_number`, `branch_name`/`variation`, `point`, `ordinal`, `course_control`, `control_id`, `point_branch`, `point_allowed_legs`, `allowed_legs`, `course_name`, `course_id`, `team`, and `leg`. The dialog displays the actual data passed for each concrete course.

Code runs asynchronously in an isolated worker using bundled Pyodide/CPython WebAssembly. Execution is limited to three seconds; a timeout terminates and rebuilds the worker. Only JSON course data is passed in, the Pyodide `js` global is empty, and the editor DOM is unavailable. Bundled standard-library modules may be used; user code does not trigger downloads of third-party packages.

The sample [`samples/map_exchange.py`](samples/map_exchange.py) demonstrates the expected structure. Standalone exchange points must still be created through simple settings or the Add menu.

### 16.4 Legacy conditional formulas

Older projects may contain legacy expressions. O-Composer continues reading them for migration. Open, inspect every generated page, and resave as `.ocp`; use the current Python editor for new complex rules.

### 16.5 Descriptions and per-page export

- Exchange uses directive `13.5` with `0 m`.
- Flip uses `15.6`; ISCD 2004 may display it as an exchange directive.
- A standalone-exchange incoming directive follows the actual flagging range: none; `13.1` from the previous control; `13.2` for a middle section; or `13.5` only when flagging reaches the exchange. Distance covers only the flagged portion.

Select a concrete variation before inspecting pages. Global shows the complete course. All Variations has no unique ordering and cannot define one page sequence.

For a selected page, **Set Print Area > Current Course, page n** stores a page-specific frame. Pages without one inherit the whole-course print area.

## 17. OCAD import in the browser

### 17.1 Loading and conversion stages

The official OpenOrienteering Mapper JavaScript/WASM engine, WASM binary, and projection data load in the background. Import is available after that batch completes.

The stages are:

1. read the selected `.ocd` file;
2. convert OCAD to OMAP in the browser;
3. parse map symbols and objects;
4. prepare rendering resources;
5. render the first frame.

Do not repeatedly click Import while a stage is running. A 64 MiB or larger file requires confirmation; more than 512 MiB is rejected to protect browser memory.

### 17.2 Support and result quality

**Official Mapper WASM** is the preferred conversion. **JavaScript compatibility mode** is a fallback and reports features it cannot fully reproduce. After import, inspect:

- colours and overprint order;
- line borders, dashes, and embedded symbols;
- combined/private symbol parts;
- text, paths, holes, and curves;
- map scale and extent.

Conversion is local. The resulting map can be cleared with Clear OMAP Map without deleting the event.

### 17.3 Large files and diagnostics

Large maps can take substantial memory during conversion and first rendering. Use Performance/Balanced quality, close unrelated tabs, and wait. If conversion fails, preserve the original `.ocd`, note the status message and mode, and try saving an uncompressed `.omap` from desktop Mapper as a diagnostic path.

## 18. Map import, replacement, movement, and calibration

### 18.1 Format selection

| Source | Command | Scale source | Browser rendering | Important limitation |
| --- | --- | --- | --- | --- |
| Uncompressed `.omap`/`.xmap` | Import OMAP Map | map metadata | vector | compressed container rejected |
| `.ocd` | Import OCAD Map | converted metadata | vector after local conversion | engine must finish loading |
| PNG/JPEG/WebP etc. | Select Map Image/PDF | mandatory two-point calibration | raster | original pixel resolution limits print quality |
| PDF | Select Map Image/PDF | mandatory two-point calibration | rendered preview; original data retained | select one source page |

### 18.2 Replacement and clearing

Importing another basemap replaces the current source of that category; controls and courses remain. Clear OMAP Map removes vector/OCAD-derived maps only. For a complete reset use New Event after saving.

Changing a map under established controls is risky. Confirm identical coordinate origin, scale, rotation, and extent. Keep a versioned `.ocp` before replacement.

### 18.3 Mandatory two-point calibration for image/PDF

1. Choose two map points whose printed or ground separation is known.
2. Place calibration point 1 and point 2; use Shift for constrained directions if useful.
3. Enter map scale.
4. Choose printed distance in centimetres or ground distance in metres.
5. Drag either point to refine; the calculated segment updates.
6. Confirm to resize the basemap and update event scale.

During mandatory calibration, most application controls are disabled and the palette cannot be dismissed. The User Guide remains available. Choose well-separated points to reduce relative error.

### 18.4 Moving the basemap

Open Map Information and choose Move Map. Dragging moves only the basemap while course objects stay fixed. Exit with the button again, Esc, or right-click. This is intended for small alignment corrections; if scale is wrong, recalibrate instead.

### 18.5 Calibration review

- Compare at least one third known distance not used for calibration.
- Check distant areas, not only the first two points.
- Verify the event and course print scales.
- Print or view a 100% PDF and measure a known grid/bar.
- Confirm north/orientation and control alignment.

## 19. Complete workflows with the three sample maps

### 19.1 Sample overview

| File | Format | Recommended exercise |
| --- | --- | --- |
| [`samples/beihang_xyl_jiaoxuequ_1000.omap`](samples/beihang_xyl_jiaoxuequ_1000.omap) | OMAP, 1:1000 | standard course, selection, line/circle cutting, descriptions, print area |
| [`samples/Kymen Rastiviesti, Viestiliiga 3_7.png`](samples/Kymen%20Rastiviesti,%20Viestiliiga%203_7.png) | PNG | mandatory calibration, score course, raster PDF output |
| [`samples/shahe_sample.ocd`](samples/shahe_sample.ocd) | OCAD | local conversion, map inspection, military grid and time windows |

When using the hosted application, download a linked sample first, then select it in the browser file picker. A website cannot silently open arbitrary files on your computer.

### 19.2 Beihang OMAP: standard course, cut lines, and cut circles

1. Import the OMAP sample and verify scale 1:1000.
2. Add a standard course with map issue, start, several controls, and finish.
3. Click each control inside its circle and on its circumference to confirm whole-circle selection.
4. Enter Cut Line mode. Click a leg crossing important detail; drag the blue endpoints of its gap.
5. Click the visible circumference of a normal control and the finish to add circle gaps. Click near each missing-arc midpoint to select and refine it.
6. Add bends and partial flagging to one leg.
7. Complete descriptions and place a description table.
8. Set an A4 print area and export a vector-map PDF.

### 19.3 Kymen PNG: mandatory calibration and score course

1. Select the PNG through Select Map Image/PDF.
2. Complete the mandatory two-point calibration using a reliable distance and the map's intended scale.
3. Verify a third distance with Measure.
4. Add a score course, scores, and a flagged source control for the finish.
5. Choose a number format that exposes code and score.
6. Set print area and export with the image basemap.
7. Inspect raster sharpness at 100%; linework and text should remain vector.

### 19.4 Shahe OCAD: conversion and military orienteering

1. Wait for Mapper resources to finish loading.
2. Import `shahe_sample.ocd` and watch the conversion stages.
3. Inspect representative area fills, road borders, combined symbols, text, and scale.
4. Create a military course and its points.
5. Draw a coordinate grid and configure labels/spacing.
6. Add at least one time-window point and compare edit versus preview.
7. Save `.ocp`, then export a PDF for visual verification.

### 19.5 Recommended production directory

Keep source maps, incoming event data, editable `.ocp` versions, exported PDFs/ZIPs, exchange files, and a read-only final package in separate dated directories. Never overwrite the only working copy immediately before printing.

## 20. Complete mouse, touch, and keyboard reference

### 20.1 Keyboard shortcuts

| Input | Effect |
| --- | --- |
| Esc | cancel current tool/drawing; close eligible dialog |
| Delete | delete selected object or selected gap/bend/measurement |
| Backspace | remove last point while drawing; otherwise delete eligible selection |
| Enter | next User Guide search match |
| Shift+Enter | previous User Guide search match |
| Shift while placing/moving constrained geometry | horizontal, vertical, or ±45° snapping where supported |

Use the Edit menu if the browser or operating system reserves a key.

### 20.2 Pan, zoom, and map intensity

Use the supported pointer/wheel gestures to pan and zoom. Fixed 50/100/200% commands provide repeatable inspection. Rendering quality affects canvas resolution, not event coordinates. Map intensity changes visual emphasis and does not alter exported data.

### 20.3 Selection and movement

- Click inside or on a normal-control circle; the centre is not required.
- Click a leg to select it.
- Click a number to select/move its label rather than its control.
- Drag a selected movable control or special object.
- Drag blue handles to resize/rotate supported objects.
- Circle gaps and leg gaps are selected near the centre of the missing segment.
- In All Controls, deleting a control is global; in a course it is normally course-local.

### 20.4 Point insertion order

With no specific insertion selected, controls are added according to course rules. Selecting a leg or topology segment inserts at that location. Starts always move to the front (after map issue), and finishes to the end. Fork branch selection takes precedence for new branch controls.

### 20.5 Cut lines, cut circles, and bends

**Cut a leg**: enter Cut Line, click the purple leg, select the gap, drag its two endpoints, or delete it.

**Cut a circle**: remain in Cut Line and click the visible circumference of a normal control or finish. Clicking inside the circle in normal selection selects the control; clicking near a missing-arc midpoint selects the existing gap. Starts are triangular and do not use circular gap editing.

**Bends**: select a leg, choose Add Bend, then click it. Select a bend to drag or delete it. Bends change drawn path and path length calculations where applicable but not endpoint identity.

### 20.6 Leg flagging

Select a leg and choose none, full, from control, into control, or middle section. Adjust percentage bounds. Verify the description directive and printed path. A standalone exchange uses the actual incoming flagged portion, not an automatic full-leg assumption.

### 20.7 Creating special objects

- polygon areas: click vertices, right-click to finish, Esc to cancel;
- line/rectangle/ellipse: press and drag;
- text: click a location, then complete the dialog;
- point symbols: single click;
- Shift constrains decorative straight lines, not rectangles or ellipses.

After creation, select for visibility, colour, style, movement, resizing, or rotation.

### 20.8 Measurement workflow

Open Measure; select an existing polyline or choose Add Measurement. Create points, use Shift constraints, and finish. Set colour and solid/dashed/dotted style per measurement. Open polylines show length; closed ones additionally show perimeter including the closing edge and polygon area. Ground and paper values use current scale.

Enable ground-distance labels to show one draggable total beside each line. Double-click segments/vertices to insert/remove points. Clear All asks for confirmation. Measurements persist in `.ocp` and cache, not `.ppen`.

### 20.9 Reading the status bar

Use the status bar to confirm current tool, selection, coordinates, zoom/scale, and action feedback. If a click appears ineffective, first check whether an add, cut, move-map, calibration, or drawing mode is still active.

## 21. Save, import, and export compatibility

### 21.1 `.ocp` and native `.ppen`

| Capability | `.ocp` | native `.ppen` |
| --- | --- | --- |
| Standard courses and controls | full | compatible |
| Score course basics | full | compatible subset |
| Team mandatory/free semantics | full | degraded to standard |
| Military grid/time windows | full | incomplete/omitted |
| Fork topology and basic relay data | full | compatible subset |
| Advanced Python page formulas | full | omitted |
| Simple exchange/flip actions | full | mapped where supported |
| Custom constants | full | omitted |
| Team prefix, digits, leg names | full | omitted |
| Measurements and labels | full | omitted |
| O-Composer-only UI metadata | full | omitted |

Open `.ocp` for ongoing work. Treat `.ppen` as an interoperability export and reopen it for a round-trip check before handoff.

### 21.2 General export matrix

| Export | Best use | Main limitation |
| --- | --- | --- |
| PDF | printing and review | output depends on configured print areas and map availability |
| PNG | current canvas snapshot | raster and view-dependent |
| IOF XML 3.0/2.0 | timing/event exchange | vendor support and O-Composer extensions vary |
| GPX | structural/debug export | no real CRS transformation |
| KML | structural/debug export | coordinates are not navigation-ready |
| RouteGadget XML | simplified course exchange | not a complete event package |
| SVG overlay | lightweight post-processing | simplified, no basemap, not print-faithful |

### 21.3 Exact PDF boundaries

- Output is vector for course symbols/text and OMAP geometry.
- Original PDF data may be merged when retained.
- Image maps are raster resources; linework stays vector.
- Multiple courses/variations become ZIP.
- Every map page can inherit or override its print area.
- Automatic print area falls back to current view if no explicit frame exists.
- Closing the progress dialog does not cancel generation.

### 21.4 PDF basemap portability

The editable `.ocp` may retain/map-cache sufficient PDF information in the current browser, but another browser/device may not share cached source data. For handoff, include the original PDF map alongside the `.ocp` and verify a freshly reopened project before final printing.

## 22. Descriptions, constants, reports, and properties

### 22.1 Editing control descriptions

Edit data in the Description panel or control adjustment fields; place a table separately on the map. Verify standard, language, header fields, row order, special directives, distances, scores, and table visibility. Moving/resizing a table does not change underlying description data.

### 22.2 Built-in constants

Available constants cover event, course, class, length, climb, control count, map scale, team, team number, relay leg, and variation. Exact labels are shown in the Constants panel. A selected concrete relay variation resolves team/leg/variation-specific values.

### 22.3 Custom constants and expressions

Add a stable name, explanation, and value/expression. Test it in the exact text/description consumer and concrete course view. Avoid names that collide with built-ins. Preserve `.ocp` because native `.ppen` omits these extensions.

### 22.4 Five report families

Use Course Summary for overview; Event Audit for missing/unused data; Leg Lengths for distance review; Control Cross-reference before deletion; and Control/Leg Load for congestion planning. The current UI exposes the control-load table while leg-load data remains an underlying calculation.

### 22.5 Event and course property quick reference

Event-level properties affect standards, numbering, circle geometry, and global operations. Course-level properties affect type, display, print scale, climb/load/length, subtitle, finish route, relay fields, and exchange/export behaviour. Control and leg fields are object-specific. Always check which object is selected before editing the right panel.

## 23. Troubleshooting and FAQ

### 23.1 Basemap and import

**The OMAP file is rejected.** It is probably compressed/ZIP-based. Save an uncompressed XML `.omap`/`.xmap` from Mapper.

**OCAD Import says the engine is still loading.** Wait for the background resource indicator to complete and try once. Do not start repeated imports.

**The imported image/PDF locks the interface.** This is mandatory two-point calibration. Complete scale and distance; the palette intentionally has no bypass. The guide can remain open.

**The map is offset but scale is correct.** Use Move Map. If the offset grows across the map, recalibrate instead.

**PDF page looks soft.** The source is a raster image or rendered PDF preview. Check source resolution and 100% PDF view; course symbols should remain sharp.

### 23.2 Selection, adding, and deletion

**I cannot select a control unless I click the centre.** Current behaviour accepts the interior and circumference. If it does not, cancel the active tool first and confirm you are in selection mode.

**A new control went to the wrong position in a fork.** Undo, select the intended topology branch/segment, then add again.

**Deleting a control removed it only from one course.** That is expected in course view. Use All Controls for global deletion, and read the cross-reference warning.

**I clicked a faded point and no new point appeared.** O-Composer reused the compatible global control, which is normally desired.

### 23.3 Circle cuts, line cuts, and legs

**I cannot cut a control circle.** Enter Cut Line, then click the visible circumference of a normal control or finish—not only its centre. Starts use triangles and are not circle-cut targets.

**I keep selecting the control instead of its gap.** In selection mode, click near the midpoint of the missing arc. Two blue endpoints confirm gap selection.

**The leg gap or circle gap disappeared.** Confirm the selected course/variation/page and zoom in. A gap belongs to the relevant drawn object and may not be visible in another context.

**A standalone exchange leg became fully flagged unexpectedly.** Current behaviour follows the leg's explicit flagging range. Inspect the incoming leg settings and project version.

### 23.4 Forks, pages, and military mode

**Map Page selector is unavailable.** Page actions apply to standard courses. Select a concrete variation when a forked course has no unique order.

**Add Fork is unavailable.** The course must be Standard and needs a valid selected insertion/join structure.

**Relay team size is locked.** It must be configured before fork creation. Rebuilding topology may be required to change it safely.

**Time-window point is missing in preview.** That is intentional; military edit view shows it in blue, while competitor preview hides it.

### 23.5 Saving, PDF, and exchange formats

**A feature vanished after `.ppen` export.** It is likely an O-Composer extension. Use `.ocp` as the master and consult Section 21.

**Create PDF downloaded a ZIP.** More than one course, variation, relay allocation, or target was produced.

**Nothing downloaded immediately after closing PDF export.** Generation continues in the background. Wait for the browser download; do not start duplicate jobs.

**GPX/KML appears in the wrong place.** O-Composer does not currently convert internal map coordinates to geographic coordinates.

### 23.6 Performance

For large maps, reduce rendering quality, close unrelated tabs, avoid repeated imports, and allow the first frame to complete. Browser memory limits vary. Save before changing quality, language, or device. If the page is killed by the browser, reopen the latest `.ocp` rather than relying solely on cached recovery.

## 24. Pre-delivery checklist

### 24.1 Map and project

- [ ] Correct source map, scale, orientation, and extent
- [ ] Calibration verified with an independent distance
- [ ] Final `.ocp` saved with a versioned filename
- [ ] Original OMAP/OCAD/image/PDF source archived
- [ ] No unintended map movement or stale replacement

### 24.2 Controls, courses, and descriptions

- [ ] Unique valid control codes
- [ ] Every course has intended start and finish
- [ ] Map-issue point and dashed start approach correct
- [ ] Course order and control order correct
- [ ] Descriptions use the intended ISCD version/language
- [ ] Description tables are visible on the right targets
- [ ] Circle and leg gaps preserve important map detail
- [ ] Bends and flagging match field marking
- [ ] Event Audit reviewed; unused controls intentional or removed

### 24.3 Competition-format checks

- [ ] Score totals and finish flagging verified
- [ ] Team mandatory/free-choice status explained
- [ ] Military grid coordinates and time windows verified
- [ ] Every used relay variation inspected
- [ ] Relay team/leg allocation matches entries
- [ ] Every map exchange/flip and standalone point field-tested
- [ ] Page-specific print areas checked

### 24.4 Output

- [ ] Correct paper, orientation, margin, and scale
- [ ] PDF includes/excludes map and descriptions as intended
- [ ] All PDF/ZIP files open successfully
- [ ] Text, symbols, circle gaps, line gaps, and map pages checked at 100%
- [ ] Raster map resolution is adequate
- [ ] Exchange files reopened or validated in their target system
- [ ] Filenames clearly identify event, course, variation/team, and revision

### 24.5 Freeze for event day

Archive the final `.ocp`, source map, generated PDFs/ZIPs, exported timing files, this guide version, and a checksum or read-only copy. Record which file was actually printed and distributed. Make later corrections as new revisions rather than silently overwriting the frozen package.

## 25. Browser, offline, and implementation boundaries

O-Composer is designed as a static site. Once application resources are cached, much work can continue locally, but the first visit, a new version, or cleared cache requires resources to load again. The hosted application does not grant access to arbitrary local files; every import uses the browser file picker and every export uses browser downloads.

Supported in the current browser application includes:

- complete `.ocp` read/write;
- compatible native `.ppen` import/export;
- uncompressed OMAP/XMAP vector rendering;
- local OCAD conversion with official Mapper WASM and a compatibility fallback;
- image and PDF import with mandatory calibration;
- vector course/PDF generation, multi-page and ZIP output;
- standard, score, team, military, forked, and relay course workflows;
- descriptions, specials, measurements, print areas, reports, and exchange exports.

Important boundaries:

- no real CRS/geographic conversion for GPX/KML;
- no direct Livelox publishing;
- no general system-font discovery equivalent to a desktop application;
- compressed OMAP containers are not parsed;
- browser memory limits apply to large OCAD/OMAP/PDF files;
- some O-Composer semantics cannot be represented in native `.ppen` or generic exchange formats;
- All Variations is not a uniquely ordered course and cannot define pages without choosing a concrete path;
- UI report filtering and exporter filtering are not identical for Hide from Reports;
- the current load report visually emphasises controls rather than exposing the full leg-load table.

### 25.1 User Guide reader boundaries

The User Guide reader loads `USER_GUIDE.en.md` when the application language is English and `USER_GUIDE.md` when it is Chinese. It is non-modal and supports search, chapter navigation, full/small/minimised modes, and title-bar dragging. Switching application language reloads the interface; save the project first. If the guide fails to load, confirm that the site deployment contains both Markdown files and use Retry.

For authoritative competition rules, symbol specifications, and organiser obligations, use the current IOF and national federation documents. O-Composer assists planning and output; it does not replace a qualified controller or field inspection.
