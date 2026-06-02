#!/usr/bin/env python3
from __future__ import annotations

import importlib.util
import re
import sys
import xml.etree.ElementTree as ET
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def main() -> None:
    run_build_validations()
    verify_app_files()
    verify_sample_event_shape()
    verify_samples_are_local()
    verify_parser_coverage()
    verify_omap_support()
    verify_reference_omap()
    verify_shahe_omap()
    print("O-Composer static verification passed.")


def run_build_validations() -> None:
    spec = importlib.util.spec_from_file_location("web_build", ROOT / "build.py")
    module = importlib.util.module_from_spec(spec)
    assert spec.loader is not None
    spec.loader.exec_module(module)
    module.validate_imports()
    module.validate_no_network_runtime()


def verify_app_files() -> None:
    index = (ROOT / "index.html").read_text(encoding="utf-8")
    assert "<purple-pen-app>" in index
    assert 'type="module"' in index
    assert (ROOT / "src" / "ui" / "app-shell.js").exists()
    assert (ROOT / "src" / "domain" / "ppen-parser.js").exists()
    assert (ROOT / "src" / "domain" / "print-area.js").exists()
    assert (ROOT / "src" / "domain" / "pdf-exporter.js").exists()
    assert (ROOT / "src" / "domain" / "control-descriptions.js").exists()
    assert (ROOT / "src" / "domain" / "omap-parser.js").exists()
    assert (ROOT / "src" / "ui" / "omap-renderer.js").exists()
    assert (ROOT / "src" / "ui" / "course-symbols.js").exists()
    assert (ROOT / "src" / "ui" / "icons.js").exists()
    assert (ROOT / "src" / "ui" / "i18n.js").exists()
    assert (ROOT / "src" / "workers" / "omap-render-worker.js").exists()
    assert (ROOT / "tests" / "omap-renderer-smoke.js").exists()
    assert (ROOT / "assets" / "purple-pen-symbols.xml").exists()

    imported = re.findall(r"from\s+[\"']([^\"']+)[\"']", (ROOT / "src" / "ui" / "app-shell.js").read_text(encoding="utf-8"))
    app_shell = (ROOT / "src" / "ui" / "app-shell.js").read_text(encoding="utf-8")
    assert "../domain/ppen-parser.js" in imported
    assert "../domain/omap-parser.js" in imported
    assert "../domain/print-area.js" in imported
    assert "../domain/pdf-exporter.js" in imported
    assert "../domain/control-descriptions.js" in imported
    assert "./icons.js" in imported
    assert "./i18n.js" in imported
    assert "./map-view.js" in imported
    assert "controlKindLabel" in app_shell
    for token in ["commandDialog", "openCommandDialog", "moveCourseOrderDraft", "enablePanelDrag", "startPanelDrag", "TEXT_PRESETS", "MAP_SCALES", "DESCRIPTION_LANGUAGES"]:
        assert token in app_shell, f"missing command palette UI: {token}"
    control_descriptions = (ROOT / "src" / "domain" / "control-descriptions.js").read_text(encoding="utf-8")
    ppen_parser = (ROOT / "src" / "domain" / "ppen-parser.js").read_text(encoding="utf-8")
    event_model = (ROOT / "src" / "domain" / "event-model.js").read_text(encoding="utf-8")
    for token in ['description: "2024"', 'const DESCRIPTION_STANDARD = "2024"', "symbolInDescriptionStandard", 'standard === "2024" && symbolInStandard(symbol, "2018")', "normalizeDescriptionStandard"]:
        assert token in app_shell + control_descriptions + ppen_parser + event_model, f"missing ISCD 2024 standard support: {token}"
    assert "std-desc-2024" in app_shell
    assert "Description Standard 2024" in app_shell
    assert "std-desc-2018" not in app_shell
    assert "Description Standard 2018" not in app_shell
    i18n = (ROOT / "src" / "ui" / "i18n.js").read_text(encoding="utf-8")
    for token in ["SUPPORTED_LANGUAGES", "setLanguage", "getLanguage", "t(", "purplePenLanguage", "中文", "All Controls", "所有检查点", "Description Standard 2024"]:
        assert token in i18n, f"missing multilingual support: {token}"
    for token in ["appLanguage", "this.t(", "SUPPORTED_LANGUAGES", "setLanguage(event.target.value)", "window.location.reload()"]:
        assert token in app_shell, f"missing app i18n hook: {token}"
    assert "prompt(" not in app_shell, "browser prompt dialogs should not be used"
    assert (ROOT / "src" / "state" / "cookie-cache.js").exists()
    cookie_cache = (ROOT / "src" / "state" / "cookie-cache.js").read_text(encoding="utf-8")
    for token in ["purplePenCookieConsent", "purplePenSessionCache", "saveCachedSession", "loadCachedSession", "indexedDB", "purplePenWebCache", "idbPut", "idbGet"]:
        assert token in cookie_cache + app_shell, f"missing cookie cache support: {token}"
    assert "MAX_COOKIE_CHUNKS" not in cookie_cache
    assert "CACHE_CHUNK_SIZE" not in cookie_cache
    assert "storage: \"localStorage\"" not in cookie_cache
    for token in ["cookieBanner", "data-cookie-accept", "Accept cookies", "restoreCachedSession", "scheduleSessionCache"]:
        assert token in app_shell, f"missing cookie consent/cache UI: {token}"
    for token in ["addExistingControlToCourse", "onAddExistingControlToCourse", "drawAddableControls", "addableControlsForTool", "insertionCourseControlId", "snappedControlForPlacement", "CONTROL_SNAP_SCREEN_RADIUS", "ADDABLE_CONTROL_SNAP_PIXELS", "Snapped to existing control."]:
        assert token in app_shell + (ROOT / "src" / "ui" / "map-view.js").read_text(encoding="utf-8") + (ROOT / "src" / "domain" / "actions.js").read_text(encoding="utf-8"), f"missing add existing control flow: {token}"
    assert "controlsUsedByCourse(state.eventModel, selectedCourseId).has" in app_shell, "snapping must avoid adding duplicate controls already in the selected course"
    for field in ["eventTitleChoice", "mapScaleChoice", "addCourseName", "duplicateCourseName", "courseLoadChoice", "textSpecialPreset"]:
        assert f'<input id="{field}"' in app_shell, f"{field} should allow typed input"
        assert f'<select id="{field}"' not in app_shell, f"{field} should not be a fixed select"
    assert "promptPrintArea" in app_shell
    assert "window.print" not in app_shell
    assert "print-courses" not in app_shell
    assert "print-descriptions" not in app_shell
    assert "@media print" not in (ROOT / "styles.css").read_text(encoding="utf-8")
    for token in ["export-pdf", "exportPdf", "createVectorMapPdfBlob", "renderAreaToContext", "3 mm"]:
        assert token in app_shell + (ROOT / "src" / "domain" / "pdf-exporter.js").read_text(encoding="utf-8"), f"missing PDF export support: {token}"
    pdf_exporter = (ROOT / "src" / "domain" / "pdf-exporter.js").read_text(encoding="utf-8")
    assert "DCTDecode" not in pdf_exporter, "PDF export should be vector, not a JPEG image wrapper"
    assert "PdfCanvasContext" in pdf_exporter
    for token in ["bezierCurveTo", "ellipse", "measureText", "clip", "fillText"]:
        assert token in pdf_exporter, f"missing vector PDF canvas support: {token}"
    for token in ["printAreaDialog", "printAreaPaper", "PAPER_SIZES", "Letter (8.5 x 11 in)", "A4 (210 x 297 mm)", "Custom drawn area", "Move paper-size frame", "Use current view", "applyPrintAreaDialog", "updatePrintAreaDialogPreview", "dialogPreview", "printAreaFixedFrameAt", "movePrintAreaFrame"]:
        assert token in app_shell, f"missing print area selection UI: {token}"
    for old_prompt in ["Print area mode:", "Rectangle: left, top, right, bottom", "Options: restrict-to-page-size"]:
        assert old_prompt not in app_shell, f"print area should not use manual prompt: {old_prompt}"
    assert "onPrintAreaPreview" in app_shell
    for token in ["DESCRIPTION_KINDS", "ISCD_COLUMNS", "ensureIscdSymbolDb", "getIscdSymbolOptions", "symbolOptionsForColumn", "createDescriptionSpecialOptions", "resizedDescriptionSpecial", "drawIscdSymbol", "symbolTooltip", "scheduleSymbolTooltip", "handleDescriptionPanelClick", "openIscdSymbolPicker", "onAddDescriptionSpecial", "onResizeSelection", "descriptionSpecialEditor"]:
        assert token in app_shell, f"missing standard control-description UI: {token}"
    assert 'toolButton("tool-description", "Add Control Description Table", "descriptions", "Descriptions")' in app_shell
    assert "descriptions:" in (ROOT / "src" / "ui" / "icons.js").read_text(encoding="utf-8")
    for token in ['symbol.id === "13.6"', "isMapIssueExtraLeftDash", "points[1].x === -660", "points[0].y === -50", "points[1].y === 50"]:
        assert token in control_descriptions, f"map issue left dashed line should have three segments: {token}"
    for token in ["existingDescriptionSpecialForTarget", "This course already has a control description table.", "Line height (mm)", 'data-field="special.cellSize"', "5.2"]:
        assert token in app_shell + control_descriptions, f"missing description-table course limit/line-height support: {token}"
    for token in ["data-course-finish-route", "finishRouteForCourse", "setFinishRouteFlagging", "finishLegPair"]:
        assert token in app_shell, f"missing Purple Pen finish-route description setting: {token}"
    assert '#selectionPanel").addEventListener("input"' not in app_shell, "selection panel fields should not re-render on every keystroke"
    assert "tool-icon" in (ROOT / "styles.css").read_text(encoding="utf-8")


def verify_sample_event_shape() -> None:
    sample = ROOT / "samples" / "standalone-sample.ppen"
    tree = ET.parse(sample)
    root = tree.getroot()
    assert root.tag == "course-scribe-event"
    controls = root.findall("control")
    courses = root.findall("course")
    course_controls = root.findall("course-control")
    assert len(controls) >= 3
    assert len(courses) >= 1
    assert len(course_controls) >= 1
    assert root.find("event/title").text == "Standalone Sample"
    assert root.find("event/standards").get("description") == "2024"


def verify_samples_are_local() -> None:
    samples = ROOT / "samples"
    assert (samples / "standalone-sample.ppen").exists()
    assert (samples / "original-sample-event.ppen").exists()
    assert (samples / "original-sample-event-exchange.ppen").exists()
    assert (samples / "forest-sample.omap").exists()
    assert (samples / "text-object.omap").exists()


def verify_parser_coverage() -> None:
    parser = (ROOT / "src" / "domain" / "ppen-parser.js").read_text(encoding="utf-8")
    for element in [
        "event",
        "control",
        "course",
        "course-control",
        "leg",
        "special-object",
        "print-area",
        "punch-pattern",
        "relay",
        "custom-symbol-text",
    ]:
        assert element in parser, f"missing parser support for {element}"


def verify_omap_support() -> None:
    app_shell = (ROOT / "src" / "ui" / "app-shell.js").read_text(encoding="utf-8")
    map_view = (ROOT / "src" / "ui" / "map-view.js").read_text(encoding="utf-8")
    print_area = (ROOT / "src" / "domain" / "print-area.js").read_text(encoding="utf-8")
    course_symbols = (ROOT / "src" / "ui" / "course-symbols.js").read_text(encoding="utf-8")
    ppen_parser = (ROOT / "src" / "domain" / "ppen-parser.js").read_text(encoding="utf-8")
    parser = (ROOT / "src" / "domain" / "omap-parser.js").read_text(encoding="utf-8")
    renderer = (ROOT / "src" / "ui" / "omap-renderer.js").read_text(encoding="utf-8")
    i18n = (ROOT / "src" / "ui" / "i18n.js").read_text(encoding="utf-8")
    for token in ["omapInput", "Import OMAP Map", "openOmapFile", "parseOmap"]:
        assert token in app_shell, f"missing app OMAP hook: {token}"
    for token in ["applyImportedMapScale", "applyMapScale", "positiveScale(omap.scale)", "model.event.allControls.printScale", "course.options.printScale"]:
        assert token in app_shell, f"missing OMAP map scale propagation: {token}"
    worker = (ROOT / "src" / "workers" / "omap-render-worker.js").read_text(encoding="utf-8")
    for token in ["setOmap", "drawOmap", "drawOmapMap", "requestDraw", "renderOmapLayer", "drawTransformedOmapLayer", "wheelZoomFactor", "ensureOmapWorker", "queueOmapLayerRender"]:
        assert token in map_view, f"missing map OMAP hook: {token}"
    control_descriptions = (ROOT / "src" / "domain" / "control-descriptions.js").read_text(encoding="utf-8")
    for token in ["drawToolPreview", "drawMovePreview", "drawResizePreview", "updateToolPreview", "drawPrintAreaRect", "currentViewBounds", "printAreaFrame", "PRINT_AREA_SCOPES", "printAreaFromPoints", "printAreaFromBounds", "printAreaFixedFrameAt", "effectivePrintArea", "setPrintArea", "drawControlDescriptionBlock", "descriptionBounds"]:
        assert token in map_view + print_area, f"missing print area/control preview support: {token}"
    for token in ["buildControlDescriptionRows", "drawControlDescriptionBlock", "drawIscdSymbol", "parsePurplePenSymbols", "drawXmlSymbol", "LEGACY_ID_ALIASES", "railway", "map-flip", "descriptionBounds", "resizedDescriptionSpecial", "DESCRIPTION_KINDS", "COLUMN_F_TEXT_PREFIX", "drawColumnFText", "storageForIscdSelection", "COLUMN_F_VISUAL_ALIASES", "10.1single", "10.2single", "courseHeaderRow", "allControlsHeaderRow", "directiveRow", "markedRouteRow", "localizedTextMap", "localizedSymbolText", "languageFallbacks", "zh-TW", "formatCourseClimb", "formatDirectiveDistance", "course_length_climb", "13.6", "14.1", "14.2", "14.3"]:
        assert token in control_descriptions, f"missing standard control-description support: {token}"
    for token in ["specialVisibleForCourse", 'special.kind === "descriptions"', "descriptionTargetForNewSpecial"]:
        assert token in control_descriptions + map_view, f"description tables must be course-scoped: {token}"
    for token in ['row.control.kind === "start"', 'descriptionValue(row.control, "D")', 'ASymbol: "start"', 'featureText: descriptionKind === "symbols" ? "" : text']:
        assert token in control_descriptions, f"start control descriptions must feed the map table: {token}"
    assert '"A", "B", "C", "D", "E", "F", "G", "H"' not in control_descriptions, "map descriptions must not render a nonstandard A-H column header row"
    for token in ["COLUMN_GAP_CELLS = 0.6", "THICK_LINE = 0.05", "THIN_LINE = 0.025", "TITLE_FONT = 0.63", "COLUMN_F_FONT = 0.50"]:
        assert token in control_descriptions, f"missing Purple Pen description renderer constant: {token}"
    for token in ["controlOutsideDiameter2017", "finishInsideDiameter2017", "startRadius2017", "drawStartTriangle", "drawCrossing", "drawCourseLeg", "defaultControlLabelPoint", "drawPolylineWithGaps", "normalizeLineGaps", "circleGaps"]:
        assert token in course_symbols, f"missing standardized course symbol support: {token}"
    for token in ["rgba(166, 38, 255", "COURSE_PURPLE_ALPHA", "ALL_CONTROLS_PURPLE_ALPHA"]:
        assert token in course_symbols + map_view, f"course symbols should use transparent Purple Pen purple: {token}"
    actions = (ROOT / "src" / "domain" / "actions.js").read_text(encoding="utf-8")
    for token in ["positiveMapScale", "course.options.printScale = positiveMapScale(eventModel)"]:
        assert token in actions, f"new courses must default to map scale: {token}"
    assert "drawControlCenterPoint" in map_view, "selected controls must show their center point"
    for token in ["emptySpacePan", "moveOffsetForHit", "moveTargetForDrag", "ctx.arc(point.x, point.y, 1.75"]:
        assert token in map_view, f"missing map drag/selection refinement: {token}"
    for token in ["leg-bend", "leg-bend-add", "onAddLegBend", "onLegBendMove", "onDeleteLegBend", "addLegBend", "moveLegBend", "deleteLegBend", "bendInsertIndex", "hitTestSelectedLegBend", "drawBendDot", "sameLegSelection", "data-add-leg-bend", "data-delete-leg-bend"]:
        assert token in app_shell + map_view, f"missing leg bend editing support: {token}"
    styles = (ROOT / "styles.css").read_text(encoding="utf-8")
    for token in [".course-tabs", "caret-color: transparent", "user-select: none"]:
        assert token in styles, f"missing course tab cursor guard: {token}"
    for token in ["tool-line-cut", "addManualLegCut", "moveLegGapHandle", "selectionKey", "leg-gap", "legEditor", "data-leg-flagging", "data-leg-flag-start", "data-leg-flag-end", "bindWorkspaceResizer", "data-select-leg-gap", "handleSelectionPanelClick", "control-number", "data-reset-control-number", "setControlNumberLocation"]:
        assert token in app_shell, f"missing manual purple line cutting support: {token}"
    actions = (ROOT / "src" / "domain" / "actions.js").read_text(encoding="utf-8")
    for token in ["controlCoursePlacement", "after-map-issue", "This course already has a start.", "This course already has a finish."]:
        assert token in actions + app_shell + i18n, f"missing special start/finish/map issue insertion support: {token}"
    for token in ["removeControlFromCourse", "selectedCourseId", "courseControlIds", "removeCourseControl(eventModel, courseControlId)", "deleteSelectedControl", "coursesUsingControl", "deleteControlConfirm", "Delete from all courses"]:
        assert token in actions + app_shell, f"missing safe course-control deletion support: {token}"
    assert "removeControlFromCourse(eventModel, controlId, selectedCourseId)" in actions
    assert "eventModel.controls = eventModel.controls.filter(control => Number(control.id) !== Number(controlId));" not in actions, "removing a control from one course must leave it in All Controls"
    for token in ["automaticLegGaps", "addLegCircleGaps", "automaticControlCircleGaps", "addPairedControlCircleGaps", "addControlCircleGap", "circleGapForCloseObject", "screenGapsForLeg", "screenFlagRangesForLeg", "bestControlLabelPoint", "labelPlacementScore", "onManualLegCut", "onLegGapHandleMove", "hitTestSelectedLegGap", "hitTestManualLegGap", "hitTestControlNumber", "controlNumberScreenRect", "legSelection", "selectedLegForSelection"]:
        assert token in map_view, f"missing automatic/manual line cut map support: {token}"
    for token in ["middle-part", "normalizeFlaggingKind", "serializeFlaggingKind"]:
        assert token in ppen_parser, f"missing extended leg flagging serialization: {token}"
    assert map_view.count("function clamp(") == 1, "map-view must not redeclare clamp; Safari rejects duplicate function declarations in modules"
    for token in [
        "colors",
        "symbols",
        "objects",
        "line_symbol",
        "area_symbol",
        "point_symbol",
        "text_symbol",
        "combined_symbol",
        "mid_symbol",
        "segment_length",
        "borders",
        "parseLineBorders",
        "parseCombinedSymbol",
        "computeObjectBounds",
        "innerPriority",
        "outerPriority",
        "rotatable",
        "resolveCombinedSymbolPriorities",
    ]:
        assert token in parser, f"missing OMAP parser support for {token}"
    for token in [
        "drawLine",
        "drawArea",
        "drawPointSymbol",
        "drawText",
        "drawPattern",
        "canvasScreenBounds",
        "projectedRange",
        "drawPointPattern",
        "drawLinePattern",
        "collectDrawPriorities",
        "drawLineMidSymbols",
        "drawLineBorders",
        "offsetPathPart",
        "lineSymbolPositions",
        "addMidSymbolGroupPositions",
        "boundsIntersects",
    ]:
        assert token in renderer, f"missing OMAP renderer support for {token}"
    for token in ["OffscreenCanvas", "transferToImageBitmap", "drawOmapMap", "mapBounds"]:
        assert token in worker, f"missing OMAP worker support for {token}"
    for token in ["CURVE_START", "CLOSE_POINT", "bezierCurveTo", "HOLE_POINT", "DASH_POINT", "midSymbolGroups"]:
        assert token in renderer, f"missing OMAP path flag support for {token}"
    assert "y: -" in parser, "OMAP parser must convert native positive-south Y to app positive-north Y"
    for token in ["drawLineSpecial", "drawRectSpecial", "drawTextSpecial", "specialShapeForDrag", "specialLineWidth", "SPECIAL_COLORS", "isCssColorValue"]:
        assert token in map_view, f"missing Purple Pen special-object rendering support: {token}"
    for token in ["specialHitDistance", "distancePointToPolyline", "ellipseHitDistance", "pointInPolygon", "DRAWN_SPECIAL_PRIORITY_BONUS", "specialThreshold", "normalizedRect", "hitTestSpecialHandle", "specialResizeHandles", "resizeForHit", "drawSquareHandle", "TEXT_MIN_WIDTH_PX", "TEXT_MIN_HEIGHT_PX", "move-anchor", "resize-text-font", "textMetrics", "textMeasureContext", "textCanvasFont"]:
        assert token in map_view, f"missing special-object hit testing support: {token}"
    for token in ["SPECIAL_COLOR_CHOICES", "LEGACY_COLOR_ALIASES", "data-special-color", "data-dialog-color", "data-special-color-picker", "data-dialog-color-picker", "data-special-color-hex", "color-spectrum", "color-spectrum-row", "color-swatch", "color-value-input", "resizedSpecialObject", "resizedTextFontHeight", "fontOptions", "normalizeHexColor", "normalizeColorValue", "colorToHex", "syncColorControls", "colorChoiceSelected", "colorChoiceLabel"]:
        assert token in app_shell + styles, f"missing special-object color swatch editing support: {token}"
    for token in ["Noto Sans Mono", "PingFang SC", "Microsoft YaHei", "Source Han Sans SC", "Noto Serif CJK SC", "KaiTi", "FangSong", "PMingLiU", "Consolas", "Garamond"]:
        assert token in app_shell, f"text tool font list is too small or missing common font: {token}"
    for token in ["type=\"color\"", "pattern=\"#[0-9A-Fa-f]{6}\"", "#facc15", "#14b8a6", "#c026d3", "repeat(auto-fill"]:
        assert token in app_shell + styles, f"missing expanded color palette support: {token}"
    assert 'data-field="special.kind"' not in app_shell, "special objects must not expose type conversion in the selection panel"
    assert 'data-field="special.font.name" value=' not in app_shell, "font selection must use a list, not a free-text field"
    assert "for (const special of eventModel.specials)" not in map_view[map_view.find("drawSpecialHandles"):map_view.find("drawMovePreview")], "special handles should only render for the selected object"
    assert "specialSelectionPoints(moved, ui, this.scale(ui))" in map_view, "dragging text must preview the measured text bounding box"
    assert ": moved.locations;" not in map_view[map_view.find("drawMovePreview"):map_view.find("drawResizePreview")], "special move preview must not use raw locations for text bounds"
    assert "y: points[0].y," in map_view, "text rendering must align to the same top-left anchor as text hit/selection bounds"
    assert "y: points[0].y - Math.max(TEXT_MIN_HEIGHT_PX" not in map_view, "text drawing must not offset above its selection box"
    assert "dashed: leg.from.control?.kind === \"map-issue\" && leg.to.control?.kind === \"start\"" in map_view

    tree = ET.parse(ROOT / "samples" / "forest-sample.omap")
    root = tree.getroot()
    assert root.tag.endswith("map")
    assert len(root.findall(".//{*}symbol")) > 50
    assert len(root.findall(".//{*}object")) > 100


def verify_reference_omap() -> None:
    reference = Path("/Users/main/orienteering/BUAA_orienteering/map_samples/beihang_xyl_jiaoxuequ_1000.omap")
    assert reference.exists(), f"missing reference OMAP: {reference}"
    root = ET.parse(reference).getroot()
    assert root.tag.endswith("map")
    tree_symbol = root.find(".//{*}symbol[@id='186']/{*}point_symbol")
    assert tree_symbol is not None, "reference missing prominent tree symbol"
    assert tree_symbol.get("inner_radius") == "435"
    assert tree_symbol.get("outer_width") == "310"
    fence_symbol = root.find(".//{*}symbol[@id='199']/{*}line_symbol")
    assert fence_symbol is not None, "reference missing passable fence symbol"
    assert fence_symbol.get("segment_length") == "4687"
    assert fence_symbol.find("{*}mid_symbol") is not None, "reference missing fence comb symbol"
    bench_symbol = root.find(".//{*}symbol[@id='213']/{*}line_symbol")
    assert bench_symbol is not None, "reference missing bench symbol"
    assert bench_symbol.get("end_length") == "0"
    assert bench_symbol.find("{*}mid_symbol/{*}symbol/{*}point_symbol").get("rotatable") == "true"
    road_symbol = root.find(".//{*}symbol[@id='194']/{*}line_symbol")
    assert road_symbol is not None, "reference missing paved road symbol"
    road_border = road_symbol.find("{*}borders/{*}border")
    assert road_border is not None, "reference missing paved road border"
    assert road_border.get("color") == "36"
    assert len(root.findall(".//{*}object")) > 1000


def verify_shahe_omap() -> None:
    reference = Path("/Users/main/orienteering/BUAA_orienteering/map_samples/shahe_full_4000_251127.omap")
    assert reference.exists(), f"missing Shahe OMAP: {reference}"
    root = ET.parse(reference).getroot()
    assert root.tag.endswith("map")
    combined = root.find(".//{*}symbol[@id='107']/{*}combined_symbol")
    assert combined is not None, "Shahe reference missing paved area combined symbol"
    private_part = combined.find("{*}part[@private='true']/{*}symbol/{*}line_symbol")
    assert private_part is not None, "Shahe paved area combined symbol missing private border line"
    assert private_part.get("color") in {"4", "14"}
    road_line = root.find(".//{*}symbol[@id='113']/{*}line_symbol")
    assert road_line is not None, "Shahe reference missing paved road line symbol"
    assert road_line.find("{*}borders/{*}border") is not None
    mixed_line = root.find(".//{*}symbol[@id='213']/{*}combined_symbol")
    assert mixed_line is not None, "Shahe reference missing combined small erosion/open-land line symbol"
    assert [part.get("symbol") for part in mixed_line.findall("{*}part")] == ["12", "94"]
    assert len(root.findall(".//{*}object")) > 3000


if __name__ == "__main__":
    try:
        main()
    except AssertionError as exc:
        print(f"verification failed: {exc}", file=sys.stderr)
        raise SystemExit(1)
