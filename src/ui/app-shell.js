import { Store } from "../state/store.js";
import {
  acceptCookieConsent,
  hasCookieConsent,
  loadCachedSession,
  saveCachedSession
} from "../state/cookie-cache.js";
import { parseOmap } from "../domain/omap-parser.js";
import { parsePpen, serializePpen } from "../domain/ppen-parser.js";
import {
  CONTROL_KINDS,
  cloneEvent,
  createBlankEvent,
  findById
} from "../domain/event-model.js";
import {
  addControlAt,
  addExistingControlToCourse,
  addCourse,
  addVariationAtCourseControl,
  addSpecialAt,
  autoNumberControls,
  deleteSelection,
  duplicateCourse,
  moveAllControls,
  moveSelection,
  replaceSpecial,
  removeUnusedControls,
  setCourseOrder,
  updateControlDescription
} from "../domain/actions.js";
import {
  DESCRIPTION_KINDS,
  ISCD_COLUMNS,
  createDescriptionSpecialOptions,
  drawIscdSymbol,
  ensureIscdSymbolDb,
  existingDescriptionSpecialForTarget,
  getIscdSymbolOptions,
  iscdSymbolLabel,
  scoreCourseDescriptionRows,
  storageForIscdSelection,
  resizedDescriptionSpecial
} from "../domain/control-descriptions.js";
import {
  PRINT_AREA_SCOPES,
  effectivePrintArea,
  normalizePrintArea,
  printAreaCenter,
  printAreaFixedFrameAt,
  printAreaFromBounds,
  printAreaFromPoints,
  printAreaTargetLabel,
  setPrintArea
} from "../domain/print-area.js";
import { createRasterMapPdfBlob, createVectorMapPdfBlob } from "../domain/pdf-exporter.js";
import {
  allControlsView,
  controlKindLabel,
  controlsUsedByCourse,
  courseLength,
  courseView,
  createControlCrossref,
  createCourseSummary,
  createEventAudit,
  createLegLengthRows,
  createLoadReport,
  coursesUsingControl,
  formatLength,
  findLeg,
  getControl,
  getCourse,
  getCourseControl,
  sortedCourses
} from "../domain/course-service.js";
import {
  exportCourseSvg,
  exportGpx,
  exportIofXml,
  exportKml,
  exportRouteGadgetXml
} from "../domain/exporters.js";
import {
  allCourseVariations,
  courseHasVariations,
  relayAssignments,
  relayVariationForLeg,
  variationBranchCodeMap,
  variationDisplayLabel,
  variationForCode
} from "../domain/relay-variations.js";
import { SUPPORTED_LANGUAGES, getLanguage, optionLabel, setLanguage, t } from "./i18n.js";
import { iconSvg } from "./icons.js";
import { MapView } from "./map-view.js";

const PAPER_SIZES = Object.freeze([
  { id: "letter", label: "Letter (8.5 x 11 in)", width: 850, height: 1100 },
  { id: "legal", label: "Legal (8.5 x 14 in)", width: 850, height: 1400 },
  { id: "tabloid", label: "Tabloid (11 x 17 in)", width: 1100, height: 1700 },
  { id: "a5", label: "A5 (148 x 210 mm)", width: 583, height: 827 },
  { id: "a4", label: "A4 (210 x 297 mm)", width: 827, height: 1169 },
  { id: "a3", label: "A3 (297 x 420 mm)", width: 1169, height: 1654 },
  { id: "a2", label: "A2 (420 x 594 mm)", width: 1654, height: 2339 }
]);

const PAPER_MARGINS = Object.freeze([
  { id: "0", label: "None", value: 0 },
  { id: "3mm", label: "3 mm", value: 11.811 },
  { id: "5mm", label: "5 mm", value: 19.685 },
  { id: "10mm", label: "10 mm", value: 39.37 },
  { id: "15mm", label: "15 mm", value: 59.055 }
]);

const MAP_SCALES = Object.freeze([4000, 5000, 7500, 10000, 15000]);
const APP_VERSION = "0.0.0";
const DESCRIPTION_LANGUAGES = Object.freeze([
  ["en", "English"],
  ["de", "Deutsch"],
  ["fr", "Francais"],
  ["es", "Espanol"],
  ["zh", "Chinese"],
  ["ja", "Japanese"],
  ["sv", "Svenska"],
  ["fi", "Suomi"],
  ["no", "Norsk"]
]);
const COURSE_NAMES = Object.freeze(["Course 1", "Course 2", "Course 3", "Long", "Middle", "Sprint", "Score", "Training"]);
const TEXT_PRESETS = Object.freeze(["Text", "Water", "First Aid", "Registration", "Start", "Finish", "Danger", "Out of Bounds"]);
const MOVE_DISTANCE_CHOICES = Object.freeze([1, 2, 5, 10, 25, 50, 100]);
const DEFAULT_TEXT_FONT_HEIGHT = 3;
const CONTROL_SNAP_SCREEN_RADIUS = 24;
const FONT_CHOICES = Object.freeze([
  "Arial",
  "Arial Narrow",
  "Helvetica",
  "Segoe UI",
  "Source Sans Pro",
  "Calibri",
  "Candara",
  "Verdana",
  "Tahoma",
  "Trebuchet MS",
  "Gill Sans",
  "Avenir",
  "Futura",
  "Optima",
  "Noto Sans",
  "PingFang SC",
  "PingFang TC",
  "PingFang HK",
  "Microsoft YaHei",
  "Microsoft JhengHei",
  "Microsoft YaHei UI",
  "SimHei",
  "SimSun",
  "NSimSun",
  "KaiTi",
  "FangSong",
  "Heiti SC",
  "Heiti TC",
  "Hiragino Sans GB",
  "Hiragino Sans CNS",
  "Songti SC",
  "Songti TC",
  "Kaiti SC",
  "Kaiti TC",
  "STHeiti",
  "STSong",
  "STKaiti",
  "STFangsong",
  "Source Han Sans SC",
  "Source Han Sans TC",
  "Source Han Serif SC",
  "Source Han Serif TC",
  "Noto Sans CJK SC",
  "Noto Sans CJK TC",
  "Noto Serif CJK SC",
  "Noto Serif CJK TC",
  "WenQuanYi Micro Hei",
  "WenQuanYi Zen Hei",
  "PMingLiU",
  "MingLiU",
  "LiSong Pro",
  "LiHei Pro",
  "Noto Serif",
  "Times New Roman",
  "Georgia",
  "Garamond",
  "Palatino",
  "Baskerville",
  "Courier New",
  "Consolas",
  "Menlo",
  "Monaco",
  "Noto Sans Mono"
]);
const SPECIAL_COLOR_CHOICES = Object.freeze([
  ["upper-purple", "#a626ff", "Upper purple"],
  ["lower-purple", "rgba(166, 38, 255, 0.46)", "Lower purple"],
  ["#000000", "#000000", "Black"],
  ["#404040", "#404040", "Dark gray"],
  ["#808080", "#808080", "Gray"],
  ["#c0c0c0", "#c0c0c0", "Light gray"],
  ["#ffffff", "#ffffff", "White"],
  ["#7f1d1d", "#7f1d1d", "Dark red"],
  ["#d73535", "#d73535", "Red"],
  ["#f97316", "#f97316", "Orange"],
  ["#f59e0b", "#f59e0b", "Amber"],
  ["#facc15", "#facc15", "Yellow"],
  ["#854d0e", "#854d0e", "Brown"],
  ["#365314", "#365314", "Dark green"],
  ["#2f855a", "#2f855a", "Green"],
  ["#22c55e", "#22c55e", "Bright green"],
  ["#14b8a6", "#14b8a6", "Teal"],
  ["#06b6d4", "#06b6d4", "Cyan"],
  ["#0f3d70", "#0f3d70", "Dark blue"],
  ["#2477c9", "#2477c9", "Blue"],
  ["#60a5fa", "#60a5fa", "Light blue"],
  ["#3730a3", "#3730a3", "Indigo"],
  ["#7e22ce", "#7e22ce", "Violet"],
  ["#a626ff", "#a626ff", "Purple"],
  ["#c026d3", "#c026d3", "Magenta"],
  ["#db2777", "#db2777", "Pink"]
]);
const LEGACY_COLOR_ALIASES = Object.freeze({
  black: "#000000",
  white: "#ffffff",
  red: "#d73535",
  blue: "#2477c9",
  green: "#2f855a"
});

export class PurplePenApp extends HTMLElement {
  connectedCallback() {
    this.language = getLanguage();
    this.store = new Store();
    this.innerHTML = this.template();
    this.renderKeys = null;
    this.cacheReady = false;
    this.mapView = new MapView(this.querySelector("#mapCanvas"), this.store, {
      onSelect: selection => this.store.setSelection(selection),
      onToolPoint: (tool, point, options) => this.applyTool(tool, point, options),
      onAddExistingControlToCourse: selection => this.addExistingControlToCurrentCourse(selection),
      onAddDescriptionSpecial: (point, options) => this.addDescriptionSpecial(point, options),
      onMoveSelection: (selection, point) => this.commitMoveSelection(selection, point),
      onMoveSelectionPreview: (selection, point) => this.previewMoveSelection(selection, point),
      onResizeSelection: (selection, anchor, point) => this.commitResizeSelection(selection, anchor, point),
      onResizeSelectionPreview: (selection, anchor, point) => this.previewResizeSelection(selection, anchor, point),
      onPrintAreaPreview: (start, end) => this.previewPrintArea(start, end),
      onPrintAreaCommit: (start, end) => this.commitPrintArea(start, end),
      onPrintAreaFrameMove: point => this.movePrintAreaFrame(point),
      onManualLegCut: (point, legHit) => this.addManualLegCut(point, legHit),
      onLegGapHandleMove: (selection, point) => this.moveLegGapHandle(selection, point),
      onAddLegBend: (selection, point) => this.addLegBend(selection, point),
      onLegBendMove: (selection, point) => this.moveLegBend(selection, point),
      onDeleteLegBend: selection => this.deleteLegBend(selection),
      onHover: point => this.updateMouseStatus(point)
    });
    this.bindEvents();
    this.restoreCachedSession();
    this.store.subscribe(state => this.render(state));
    this.store.subscribe(state => this.scheduleSessionCache(state));
    this.refreshAfterFontLoad();
    ensureIscdSymbolDb()
      .then(() => {
        this.renderKeys = null;
        this.render(this.store.snapshot());
      })
      .catch(error => {
        console.warn(error);
      });
  }

  refreshAfterFontLoad() {
    if (!document.fonts?.ready) return;
    document.fonts.ready
      .then(() => {
        this.renderKeys = null;
        this.render(this.store.snapshot());
      })
      .catch(() => {});
  }

  t(key, replacements = {}) {
    return t(key, replacements, this.language);
  }

  async restoreCachedSession() {
    const cached = await loadCachedSession();
    if (!cached?.eventModel) {
      this.cacheReady = true;
      return;
    }
    this.store.setEventModel(cached.eventModel, "Loaded cached session", false);
    this.store.resetHistory("Loaded cached session");
    this.store.updateUi(ui => {
      Object.assign(ui, safeCachedUi(cached.ui));
      ui.selection = null;
      ui.tool = "select";
      ui.report = { title: "Course Summary", rows: [], kind: "summary" };
      ui.status = "Loaded cached session";
      ui.background = cached.background || null;
      ui.omap = cached.omap || null;
    }, "Loaded cached session");
    if (cached.background?.url) {
      this.mapView.setBackground(cached.background.url);
    }
    if (cached.omapMap) {
      this.mapView.setOmap(cached.omapMap);
    }
    this.cacheReady = true;
  }

  scheduleSessionCache(state) {
    if (!this.cacheReady || !hasCookieConsent()) return;
    clearTimeout(this.cacheTimer);
    this.cacheTimer = setTimeout(() => this.saveSessionCache(state), 250);
  }

  saveSessionCache(state) {
    void saveCachedSession({
      eventModel: state.eventModel,
      ui: {
        selectedCourseId: state.ui.selectedCourseId,
        zoom: state.ui.zoom,
        pan: state.ui.pan,
        mapIntensity: state.ui.mapIntensity,
        highQuality: state.ui.highQuality,
        showPrintArea: state.ui.showPrintArea,
        showAllControls: state.ui.showAllControls
      },
      background: state.ui.background || null,
      omap: state.ui.omap || null,
      omapMap: this.mapView?.omapMap || null
    });
  }

  template() {
    return `
      <div class="app-frame">
        <input id="ppenInput" type="file" accept=".ppen,.xml,text/xml" hidden>
        <input id="mapInput" type="file" accept="image/*,.pdf" hidden>
        <input id="omapInput" type="file" hidden>
        <div class="orientation-overlay" aria-live="polite">
          <div>
            <strong>${escapeHtml(this.t("Rotate your phone"))}</strong>
            <span>${escapeHtml(this.t("O-Composer works best in landscape on mobile."))}</span>
          </div>
        </div>
        <header class="menubar">
          ${this.menu("File", [
            ["new", "New Event"],
            ["open-sample", "Open Sample"],
            ["open", "Open .ppen"],
            ["save", "Save .ppen"],
            ["save-as", "Save As"],
            ["map-image", "Choose Map Image"],
            ["omap-import", "Import OMAP Map"],
            ["omap-clear", "Clear OMAP Map"],
            ["export-png", "Create Image File"],
            ["export-pdf", "Create PDF"],
            ["export-iof3", "Create IOF XML 3.0"],
            ["export-iof2", "Create IOF XML 2.0"],
            ["export-gpx", "Create GPX"],
            ["export-kml", "Create KML"],
            ["export-routegadget", "Create RouteGadget XML"],
            ["export-svg", "Create SVG Overlay"]
          ])}
          ${this.menu("Edit", [
            ["undo", "Undo"],
            ["redo", "Redo"],
            ["delete", "Delete"],
            ["cancel", "Cancel Mode"]
          ])}
          ${this.menu("View", [
            ["fit-course", "Entire Course"],
            ["fit-map", "Entire Map"],
            ["zoom-50", "Zoom 50%"],
            ["zoom-100", "Zoom 100%"],
            ["zoom-200", "Zoom 200%"],
            ["toggle-print-area", "Show Export Area"],
            ["set-print-area", "Set Export Area"],
            ["toggle-all-controls", "All Controls"],
            ["quality", "High Quality Map"]
          ])}
          ${this.menu("Add", [
            ["tool-start", "Start"],
            ["tool-control", "Control"],
            ["tool-finish", "Finish"],
            ["tool-map-exchange", "Map Exchange"],
            ["tool-crossing", "Mandatory Crossing"],
            ["tool-map-issue", "Map Issue"],
            ["add-variation", "Add Variation"],
            ["tool-line-cut", "Cut Line"],
            ["tool-description", "Descriptions"],
            ["tool-text", "Text"],
            ["tool-line", "Line"],
            ["tool-rectangle", "Rectangle"],
            ["tool-ellipse", "Ellipse"],
            ["tool-oob", "Out of Bounds"],
            ["tool-danger", "Dangerous Area"],
            ["tool-construction", "Construction"],
            ["tool-water", "Water"],
            ["tool-first-aid", "First Aid"],
            ["tool-forbidden", "Forbidden Route"],
            ["tool-boundary", "Boundary"],
            ["tool-regmark", "Registration Mark"],
            ["tool-whiteout", "White Out"]
          ])}
          ${this.menu("Event", [
            ["change-title", "Change Event Title"],
            ["map-info", "Map Info"],
            ["change-map-scale", "Change Map Scale"],
            ["change-description-language", "Description Language"],
            ["auto-number", "Auto Numbering"],
            ["remove-unused", "Remove Unused Controls"],
            ["move-all", "Move All Controls"],
            ["std-desc-2004", "Description Standard 2004"],
            ["std-desc-2024", "Description Standard 2024"],
            ["std-map-2000", "Map Standard ISOM 2000"],
            ["std-map-2017", "Map Standard ISOM 2017"],
            ["std-map-sprint", "Map Standard ISSprOM 2019"],
            ["appearance", "Course Appearance"]
          ])}
          ${this.menu("Course", [
            ["add-course", "Add Course"],
            ["delete-course", "Delete Course"],
            ["duplicate-course", "Duplicate Course"],
            ["course-properties", "Properties"],
            ["course-order", "Course Order"],
            ["course-load", "Course Load"],
            ["variation-report", "Course Variation Report"]
          ])}
          ${this.menu("Reports", [
            ["report-summary", "Course Summary"],
            ["report-audit", "Event Audit"],
            ["report-leg-lengths", "Leg Lengths"],
            ["report-crossref", "Control Cross-reference"],
            ["report-load", "Control and Leg Load"]
          ])}
          ${this.menu("Help", [
            ["about", "About O-Composer"],
            ["help", "Frontend Limitations"]
          ])}
          <a class="feedback-link" href="https://365.kdocs.cn/l/cmBYi18akxdM" target="_blank" rel="noopener noreferrer">${escapeHtml(this.t("Feedback"))}</a>
          <div class="app-brand" aria-label="${escapeAttr(`O-Composer ${APP_VERSION}`)}">
            <strong>O-Composer</strong>
            <span>${escapeHtml(APP_VERSION)}</span>
          </div>
        </header>
        <section class="toolbar" aria-label="${escapeAttr(this.t("Toolbar"))}">
          ${this.toolButton("open", "Open", "open")}
          ${this.toolButton("save", "Save", "save")}
          <span class="separator"></span>
          ${this.toolButton("undo", "Undo", "undo")}
          ${this.toolButton("redo", "Redo", "redo")}
          ${this.toolButton("delete", "Delete", "delete")}
          <span class="separator"></span>
          ${this.toolButton("tool-start", "Start", "start")}
          ${this.toolButton("tool-control", "Control", "control")}
          ${this.toolButton("tool-finish", "Finish", "finish")}
          ${this.toolButton("tool-map-issue", "Map Issue", "map-issue")}
          ${this.toolButton("tool-line-cut", "Cut Line", "cut")}
          ${this.toolButton("tool-description", "Add Control Description Table", "descriptions", "Descriptions")}
          ${this.toolButton("tool-text", "Text", "text")}
          ${this.toolButton("tool-line", "Line", "line")}
          ${this.toolButton("tool-rectangle", "Rectangle", "rectangle")}
          <span class="separator"></span>
          ${this.toolButton("set-print-area", "Set Export Area", "print-area", "Export Area")}
          <label class="toolbar-control">${escapeHtml(this.t("Language"))}
            <select id="appLanguage">${SUPPORTED_LANGUAGES.map(([code, label]) => `<option value="${code}" ${code === this.language ? "selected" : ""}>${escapeHtml(label)}</option>`).join("")}</select>
          </label>
        </section>
        <nav id="courseTabs" class="course-tabs" aria-label="${escapeAttr(this.t("Courses"))}"></nav>
        <main class="workspace">
          <aside class="left-panel">
            <div class="mobile-side-controls">
              <label>${escapeHtml(this.t("Course"))}
                <select id="mobileCourseSelect" aria-label="${escapeAttr(this.t("Courses"))}"></select>
              </label>
              <label>${escapeHtml(this.t("Panel"))}
                <select id="mobilePanelSelect" aria-label="${escapeAttr(this.t("Panel"))}">
                  <option value="description">${escapeHtml(this.t("Description"))}</option>
                  <option value="variation">${escapeHtml(this.t("Variation"))}</option>
                  <option value="report">${escapeHtml(this.t("Report"))}</option>
                </select>
              </label>
            </div>
            <section class="panel-block">
              <div class="panel-heading">
                <button class="segmented active" data-panel="description">${escapeHtml(this.t("Description"))}</button>
                <button class="segmented" data-panel="variation">${escapeHtml(this.t("Variation"))}</button>
                <button class="segmented" data-panel="report">${escapeHtml(this.t("Report"))}</button>
              </div>
              <div id="descriptionPanel" class="description-panel"></div>
              <div id="variationPanel" class="variation-panel" hidden></div>
              <div id="reportPanel" class="report-panel" hidden></div>
            </section>
            <section class="panel-block selection-panel">
              <h2>${escapeHtml(this.t("Selection"))}</h2>
              <div id="selectionPanel"></div>
            </section>
          </aside>
          <div id="workspaceDivider" class="workspace-divider" role="separator" aria-orientation="vertical" aria-label="${escapeAttr(this.t("Resize panels"))}"></div>
          <section class="map-panel">
            <div id="courseBanner" class="course-banner">
              <div id="courseBannerText" class="course-banner-text"></div>
              <div id="courseVariationControls" class="course-variation-controls"></div>
              <div class="map-view-controls" aria-label="${escapeAttr(this.t("Map view controls"))}">
                <label class="map-view-control"><span>${escapeHtml(this.t("Zoom"))}</span><input id="zoomSlider" type="range" min="20" max="2400" value="100"></label>
                <label class="map-view-control"><span>${escapeHtml(this.t("Intensity"))}</span><input id="intensitySlider" type="range" min="10" max="100" value="65"></label>
              </div>
            </div>
            <canvas id="mapCanvas" class="map-canvas"></canvas>
          </section>
        </main>
        <dialog id="printAreaDialog" class="print-area-dialog">
          <form id="printAreaForm" class="print-area-form">
            <header class="dialog-heading">
              <h2>${escapeHtml(this.t("Set Export Area"))}</h2>
              <button type="button" class="icon-button" data-print-area-cancel aria-label="${escapeAttr(this.t("Close"))}">x</button>
            </header>
            <div class="print-area-grid">
              <label>${escapeHtml(this.t("Apply to"))}
                <select id="printAreaScope"></select>
              </label>
              <label>${escapeHtml(this.t("Paper size"))}
                <select id="printAreaPaper"></select>
              </label>
              <label>${escapeHtml(this.t("Orientation"))}
                <select id="printAreaOrientation">
                  <option value="portrait">${escapeHtml(this.t("Portrait"))}</option>
                  <option value="landscape">${escapeHtml(this.t("Landscape"))}</option>
                </select>
              </label>
              <label>${escapeHtml(this.t("Margins"))}
                <select id="printAreaMargins"></select>
              </label>
            </div>
            <fieldset class="choice-group">
              <legend>${escapeHtml(this.t("Area"))}</legend>
              <label><input type="radio" name="printAreaMode" value="frame" checked> ${escapeHtml(this.t("Move paper-size frame"))}</label>
              <label><input type="radio" name="printAreaMode" value="draw"> ${escapeHtml(this.t("Draw custom rectangle"))}</label>
              <label><input type="radio" name="printAreaMode" value="viewport"> ${escapeHtml(this.t("Use current view"))}</label>
              <label><input type="radio" name="printAreaMode" value="automatic"> ${escapeHtml(this.t("Automatic"))}</label>
            </fieldset>
            <label class="dialog-check">
              <input id="printAreaRestrict" type="checkbox">
              ${escapeHtml(this.t("Restrict to selected paper size"))}
            </label>
            <div id="printAreaSummary" class="print-area-summary"></div>
            <footer class="dialog-actions">
              <button type="button" data-print-area-cancel>${escapeHtml(this.t("Cancel"))}</button>
              <button type="submit" class="primary-button">${escapeHtml(this.t("Apply"))}</button>
            </footer>
          </form>
        </dialog>
        <dialog id="commandDialog" class="command-dialog">
          <form id="commandForm" class="command-form">
            <header class="dialog-heading">
              <h2 id="commandTitle"></h2>
              <button type="button" class="icon-button" id="commandCloseButton" data-command-cancel aria-label="${escapeAttr(this.t("Close"))}">x</button>
            </header>
            <div id="commandBody" class="command-body"></div>
            <div id="commandMessage" class="command-message" hidden></div>
            <footer id="commandActions" class="dialog-actions" style="display:none">
              <button type="button" data-command-cancel>${escapeHtml(this.t("Cancel"))}</button>
              <button id="commandApplyButton" type="submit" class="primary-button">${escapeHtml(this.t("Apply"))}</button>
            </footer>
          </form>
        </dialog>
        <div id="symbolTooltip" class="symbol-tooltip" hidden></div>
        <div id="cookieBanner" class="cookie-banner" ${hasCookieConsent() ? "hidden" : ""}>
          <span>${escapeHtml(this.t("Allow cookies to cache this event and map locally for next time?"))}</span>
          <button type="button" data-cookie-accept>${escapeHtml(this.t("Accept cookies"))}</button>
          <button type="button" data-cookie-dismiss>${escapeHtml(this.t("Not now"))}</button>
        </div>
        <footer class="statusbar">
          <span id="statusText">${escapeHtml(this.t("Ready"))}</span>
          <span id="mouseText"></span>
          <span id="dirtyText"></span>
        </footer>
      </div>
    `;
  }

  menu(label, items) {
    return `<details class="menu"><summary>${escapeHtml(this.t(label))}</summary><div class="menu-list">${items.map(([command, text]) => `<button data-command="${command}">${escapeHtml(this.t(text))}</button>`).join("")}</div></details>`;
  }

  toolButton(command, title, icon, label = title) {
    return `<button class="tool-button" data-command="${command}" title="${escapeAttr(this.t(title))}" aria-label="${escapeAttr(this.t(title))}">${iconSvg(icon)}<span>${escapeHtml(this.t(label))}</span></button>`;
  }

  bindEvents() {
    for (const menu of this.querySelectorAll(".menubar .menu")) {
      menu.addEventListener("toggle", () => {
        if (menu.open) {
          this.closeTopMenus(menu);
        }
      });
    }
    for (const menuList of this.querySelectorAll(".menubar .menu-list")) {
      this.bindMobileMenuScroll(menuList);
    }
    window.addEventListener("pointermove", event => this.closeTopMenusWhenPointerLeaves(event));

    this.addEventListener("click", event => {
      if (event.target.closest("[data-print-area-cancel]")) {
        this.closePrintAreaDialog();
        return;
      }
      if (event.target.closest("[data-command-cancel]")) {
        this.closeCommandDialog();
        return;
      }
      if (event.target.closest("[data-cookie-accept]")) {
        acceptCookieConsent();
        this.querySelector("#cookieBanner").hidden = true;
        this.cacheReady = true;
        this.saveSessionCache(this.store.snapshot());
        return;
      }
      if (event.target.closest("[data-cookie-dismiss]")) {
        this.querySelector("#cookieBanner").hidden = true;
        return;
      }
      const panelButton = event.target.closest("[data-panel]");
      if (panelButton) {
        this.switchPanel(panelButton.dataset.panel);
        return;
      }
      const tab = event.target.closest("[data-course-id]");
      if (tab) {
        this.selectCourse(tab.dataset.courseId);
        return;
      }
      const command = event.target.closest("[data-command]")?.dataset.command;
      if (command) {
        this.runCommand(command);
        this.closeTopMenus();
      }
    });

    this.querySelector("#ppenInput").addEventListener("change", event => this.openPpenFile(event.target.files?.[0]));
    this.querySelector("#mapInput").addEventListener("change", event => this.openMapFile(event.target.files?.[0]));
    this.querySelector("#omapInput").addEventListener("change", event => this.openOmapFile(event.target.files?.[0]));
    this.querySelector("#mobileCourseSelect").addEventListener("change", event => this.selectCourse(event.target.value));
    this.querySelector("#mobilePanelSelect").addEventListener("change", event => this.switchPanel(event.target.value));
    this.querySelector("#zoomSlider").addEventListener("input", event => {
      this.store.updateUi(ui => { ui.zoom = Number(event.target.value) / 100; }, "Zoom");
    });
    this.querySelector("#intensitySlider").addEventListener("input", event => {
      this.store.updateUi(ui => { ui.mapIntensity = Number(event.target.value) / 100; }, "Map intensity");
    });
    this.querySelector("#courseBanner").addEventListener("change", event => this.handleCourseBannerChange(event));
    this.querySelector("#appLanguage").addEventListener("change", event => {
      setLanguage(event.target.value);
      window.location.reload();
    });

    this.querySelector("#selectionPanel").addEventListener("change", event => this.updateSelectionField(event));
    this.querySelector("#selectionPanel").addEventListener("click", event => this.handleSelectionPanelClick(event));
    this.bindWorkspaceResizer();
    this.querySelector("#descriptionPanel").addEventListener("click", event => this.handleDescriptionPanelClick(event));
    this.querySelector("#descriptionPanel").addEventListener("change", event => this.handleDescriptionPanelChange(event));
    this.querySelector("#descriptionPanel").addEventListener("pointerover", event => this.scheduleSymbolTooltip(event));
    this.querySelector("#descriptionPanel").addEventListener("pointerout", event => this.hideSymbolTooltip(event));
    this.querySelector("#variationPanel").addEventListener("click", event => this.handleVariationPanelClick(event));
    this.querySelector("#variationPanel").addEventListener("change", event => this.handleVariationPanelChange(event));
    this.querySelector("#printAreaForm").addEventListener("submit", event => {
      event.preventDefault();
      this.applyPrintAreaDialog();
    });
    this.querySelector("#printAreaDialog").addEventListener("input", () => {
      this.renderPrintAreaDialogSummary();
      this.updatePrintAreaDialogPreview();
    });
    this.querySelector("#printAreaDialog").addEventListener("change", event => {
      if (event.target.id === "printAreaScope") {
        this.syncPrintAreaDialogFromScope();
      }
      else if (event.target.id === "printAreaPaper") {
        this.syncPrintAreaModeForPaper();
        this.renderPrintAreaDialogSummary();
        this.updatePrintAreaDialogPreview();
      }
      else {
        this.renderPrintAreaDialogSummary();
        this.updatePrintAreaDialogPreview();
      }
    });
    this.querySelector("#printAreaDialog").addEventListener("close", () => {
      if (this.keepPrintAreaDialogPreview) {
        this.keepPrintAreaDialogPreview = false;
        return;
      }
      this.clearPrintAreaDialogPreview();
    });
    this.querySelector("#commandForm").addEventListener("submit", event => {
      event.preventDefault();
      this.applyCommandDialog();
    });
    this.querySelector("#commandDialog").addEventListener("click", event => this.handleCommandDialogClick(event));
    this.querySelector("#commandDialog").addEventListener("input", event => this.handleCommandDialogInput(event));
    this.querySelector("#commandDialog").addEventListener("change", event => this.handleCommandDialogChange(event));
    this.querySelector("#commandDialog").addEventListener("pointerover", event => this.scheduleSymbolTooltip(event));
    this.querySelector("#commandDialog").addEventListener("pointerout", event => this.hideSymbolTooltip(event));
    this.enablePanelDrag(this.querySelector("#printAreaDialog"));
    this.enablePanelDrag(this.querySelector("#commandDialog"));
    window.addEventListener("keydown", event => this.handleKey(event));
    window.addEventListener("pointerdown", () => this.ensureMobileLandscapeMode(), { passive: true });
    window.addEventListener("touchstart", () => this.ensureMobileLandscapeMode(), { passive: true });
    window.addEventListener("orientationchange", () => this.mapView.requestDraw(this.store.snapshot()));
  }

  ensureMobileLandscapeMode() {
    if (this.mobileLandscapeRequested || !isNarrowMobileViewport()) {
      return;
    }
    this.mobileLandscapeRequested = true;
    const root = document.documentElement;
    if (!document.fullscreenElement && root.requestFullscreen) {
      root.requestFullscreen({ navigationUI: "hide" }).catch(() => {});
    }
    const orientation = screen.orientation;
    if (orientation?.lock) {
      orientation.lock("landscape").catch(() => {});
    }
  }

  closeTopMenus(except = null) {
    for (const menu of this.querySelectorAll(".menubar .menu[open]")) {
      if (menu !== except) {
        menu.open = false;
      }
    }
  }

  bindMobileMenuScroll(menuList) {
    let lastTouchY = 0;
    menuList.addEventListener("touchstart", event => {
      lastTouchY = event.touches[0]?.clientY || 0;
    }, { passive: true });
    menuList.addEventListener("touchmove", event => {
      if (!isNarrowMobileViewport()) return;
      const touchY = event.touches[0]?.clientY || lastTouchY;
      const deltaY = lastTouchY - touchY;
      lastTouchY = touchY;
      if (canScrollElement(menuList, deltaY)) {
        event.stopPropagation();
        return;
      }
      event.preventDefault();
      event.stopPropagation();
    }, { passive: false });
    menuList.addEventListener("wheel", event => {
      if (!isNarrowMobileViewport()) return;
      if (canScrollElement(menuList, event.deltaY)) {
        event.stopPropagation();
        return;
      }
      event.preventDefault();
      event.stopPropagation();
    }, { passive: false });
  }

  closeTopMenusWhenPointerLeaves(event) {
    if (!this.querySelector(".menubar .menu[open]")) {
      return;
    }
    const target = event.target;
    if (!(target instanceof Element) || !target.closest(".menubar .menu")) {
      this.closeTopMenus();
    }
  }

  render(state) {
    const keys = renderKeysFor(state);
    const shouldRenderCourse = !this.renderKeys
      || this.renderKeys.eventModel !== keys.eventModel
      || this.renderKeys.selectedCourseId !== keys.selectedCourseId
      || this.renderKeys.showAllControls !== keys.showAllControls
      || this.renderKeys.variationMode !== keys.variationMode
      || this.renderKeys.variationCode !== keys.variationCode
      || this.renderKeys.relayTeam !== keys.relayTeam
      || this.renderKeys.relayLeg !== keys.relayLeg;
    const shouldRenderSelection = shouldRenderCourse
      || !this.renderKeys
      || this.renderKeys.selection !== keys.selection;
    const shouldRenderReport = !this.renderKeys
      || this.renderKeys.reportTitle !== keys.reportTitle
      || this.renderKeys.reportKind !== keys.reportKind
      || this.renderKeys.reportHtml !== keys.reportHtml;
    const shouldRenderDescription = shouldRenderCourse
      || !this.renderKeys
      || this.renderKeys.selection !== keys.selection;
    const shouldRenderVariation = shouldRenderCourse
      || !this.renderKeys
      || this.renderKeys.selection !== keys.selection
      || this.renderKeys.variationBranch !== keys.variationBranch
      || this.renderKeys.variationAnchorCourseControl !== keys.variationAnchorCourseControl
      || this.renderKeys.variationAddKind !== keys.variationAddKind
      || this.renderKeys.variationAddBranches !== keys.variationAddBranches;

    if (shouldRenderCourse) {
      this.renderTabs(state);
      this.renderBanner(state);
    }
    if (shouldRenderDescription) {
      this.renderDescription(state);
    }
    if (shouldRenderVariation) {
      this.renderVariation(state);
    }
    if (shouldRenderSelection) {
      this.renderSelection(state);
    }
    if (shouldRenderReport) {
      this.renderReport(state);
    }
    this.renderStatus(state);
    this.querySelector("#zoomSlider").value = Math.round(state.ui.zoom * 100);
    this.querySelector("#intensitySlider").value = Math.round(state.ui.mapIntensity * 100);
    this.mapView.requestDraw(state);
    this.renderKeys = keys;
  }

  renderTabs({ eventModel, ui }) {
    const courses = sortedCourses(eventModel);
    const tabs = [
      `<button class="${ui.selectedCourseId === "all" ? "active" : ""}" data-course-id="all">${escapeHtml(this.t("All Controls"))}</button>`,
      ...courses.map(course => `<button class="${Number(ui.selectedCourseId) === course.id ? "active" : ""}" data-course-id="${course.id}">${escapeHtml(course.name)}</button>`)
    ];
    this.querySelector("#courseTabs").innerHTML = tabs.join("");
    this.querySelector("#mobileCourseSelect").innerHTML = [
      `<option value="all" ${ui.selectedCourseId === "all" ? "selected" : ""}>${escapeHtml(this.t("All Controls"))}</option>`,
      ...courses.map(course => `<option value="${course.id}" ${Number(ui.selectedCourseId) === course.id ? "selected" : ""}>${escapeHtml(course.name)}</option>`)
    ].join("");
  }

  selectCourse(courseId) {
    this.store.updateUi(ui => {
      ui.selectedCourseId = courseId === "all" ? "all" : Number(courseId);
      ui.selection = courseId === "all" ? null : { type: "course", id: Number(courseId) };
      ui.showAllControls = courseId === "all";
      ui.variationMode = "default";
      ui.variationCode = "";
      ui.variationBranch = null;
      ui.variationAnchorCourseControl = null;
      ui.relayTeam = 1;
      ui.relayLeg = 1;
      ui.printAreaEdit = null;
      if (ui.tool === "print-area" || ui.tool === "print-area-frame") {
        ui.tool = "select";
      }
    }, "Select course");
  }

  renderBanner({ eventModel, ui }) {
    const course = ui.selectedCourseId === "all" ? null : getCourse(eventModel, ui.selectedCourseId);
    const displayOptions = courseDisplayOptions(eventModel, ui);
    const title = course ? course.name : this.t("All Controls");
    const view = course ? courseView(eventModel, course.id, displayOptions) : [];
    const displayLabel = course ? variationDisplayLabel(eventModel, course.id, ui) : "";
    const details = course
      ? `${optionLabel(course.kind)}${displayLabel ? ` | ${this.t(displayLabel)}` : ""} | ${formatLength(courseLength(eventModel, course.id, displayOptions))} | ${view.length} ${this.t("controls")}`
      : `${eventModel.controls.length} ${this.t("controls")} | ${eventModel.specials.length} ${this.t("special objects")}`;
    this.querySelector("#courseBannerText").innerHTML = `<strong>${escapeHtml(eventModel.event.title || this.t("Untitled Event"))}</strong><span>${escapeHtml(title)}</span><span>${escapeHtml(details)}</span>`;
    this.querySelector("#courseVariationControls").innerHTML = course ? this.courseVariationControls(eventModel, course, ui) : "";
  }

  courseVariationControls(eventModel, course, ui) {
    if (!courseHasVariations(eventModel, course.id)) return "";
    const variations = allCourseVariations(eventModel, course.id);
    const relay = relayAssignments(eventModel, course.id);
    const mode = ui.variationMode || "default";
    const variationCode = ui.variationCode || variations[0]?.code || "";
    const team = Number(ui.relayTeam) || course.relay?.firstTeam || 1;
    const leg = Number(ui.relayLeg) || 1;
    return `
      <label>${escapeHtml(this.t("Variation"))}
        <select data-course-variation-mode>
          <option value="default" ${mode === "default" ? "selected" : ""}>${escapeHtml(this.t("Default"))}</option>
          <option value="all" ${mode === "all" ? "selected" : ""}>${escapeHtml(this.t("All variations"))}</option>
          <option value="variation" ${mode === "variation" ? "selected" : ""}>${escapeHtml(this.t("One variation"))}</option>
          <option value="relay" ${mode === "relay" ? "selected" : ""}>${escapeHtml(this.t("Relay leg"))}</option>
        </select>
      </label>
      ${mode === "variation" ? `
        <label>${escapeHtml(this.t("Code"))}
          <select data-course-variation-code>
            ${variations.map(variation => `<option value="${escapeAttr(variation.code)}" ${variation.code === variationCode ? "selected" : ""}>${escapeHtml(variation.code)}</option>`).join("")}
          </select>
        </label>
      ` : ""}
      ${mode === "relay" ? `
        <label>${escapeHtml(this.t("Team"))}<input data-relay-team type="number" min="${relay.firstTeam}" max="${Math.max(relay.firstTeam, relay.firstTeam + Math.max(0, relay.teams - 1))}" value="${team}"></label>
        <label>${escapeHtml(this.t("Leg"))}<input data-relay-leg type="number" min="1" max="${Math.max(1, relay.legs)}" value="${leg}"></label>
      ` : ""}
    `;
  }

  handleCourseBannerChange(event) {
    const target = event.target;
    if (target.dataset.courseVariationMode === undefined
      && target.dataset.courseVariationCode === undefined
      && target.dataset.relayTeam === undefined
      && target.dataset.relayLeg === undefined) {
      return;
    }
    const state = this.store.snapshot();
    const courseId = state.ui.selectedCourseId;
    if (!courseId || courseId === "all") return;
    const variations = allCourseVariations(state.eventModel, courseId);
    const course = getCourse(state.eventModel, courseId);
    this.store.updateUi(ui => {
      if (target.dataset.courseVariationMode !== undefined) {
        ui.variationMode = target.value || "default";
      }
      if (target.dataset.courseVariationCode !== undefined) {
        ui.variationCode = target.value || "";
      }
      if (target.dataset.relayTeam !== undefined) {
        ui.relayTeam = clamp(Number(target.value) || course?.relay?.firstTeam || 1, course?.relay?.firstTeam || 1, (course?.relay?.firstTeam || 1) + Math.max(0, (course?.relay?.teams || 1) - 1));
      }
      if (target.dataset.relayLeg !== undefined) {
        ui.relayLeg = clamp(Number(target.value) || 1, 1, Math.max(1, course?.relay?.legs || 1));
      }
      if (!ui.variationCode && variations.length) {
        ui.variationCode = variations[0].code;
      }
    }, "Select variation");
  }

  renderDescription({ eventModel, ui }) {
    const courseId = ui.selectedCourseId;
    const showingCourseRows = courseId !== "all" && !ui.showAllControls;
    const isScoreCourse = showingCourseRows && getCourse(eventModel, courseId)?.kind === "score";
    let rows = !showingCourseRows
      ? allControlsView(eventModel)
      : courseView(eventModel, courseId, courseDisplayOptions(eventModel, ui));
    if (isScoreCourse) {
      rows = scoreCourseDescriptionRows(rows);
    }
    const html = `
      <table class="description-table">
        <thead><tr><th>#</th><th>${escapeHtml(this.t("Code"))}</th><th>C</th><th>D</th><th>E</th><th>F</th><th>G</th><th>H</th></tr></thead>
        <tbody>
          ${rows.map(row => this.descriptionRow(row, isScoreCourse)).join("")}
        </tbody>
      </table>
    `;
    this.querySelector("#descriptionPanel").innerHTML = html;
    this.paintIscdCanvases(this.querySelector("#descriptionPanel"));
  }

  descriptionRow(row, isScoreCourse = false, selection = this.store.snapshot().ui.selection) {
    const descriptions = new Map((row.control.descriptions || []).map(item => [item.box, item]));
    const selected = selection?.type === "control" && Number(selection.id) === Number(row.control.id);
    return `<tr data-control-id="${row.control.id}" class="${selected ? "selected" : ""}">
      <td>${isScoreCourse ? "" : escapeHtml(row.ordinal || "")}</td>
      <td>${escapeHtml(row.control.code || this.t(controlKindLabel(row.control.kind)))}</td>
      ${["C", "D", "E", "F", "G", "H"].map(box => {
        if (isScoreCourse && box === "H") {
          return this.scoreDescriptionCell(row);
        }
        const value = descriptions.get(box)?.ref || descriptions.get(box)?.text || "";
        return `<td>
          <button type="button" class="iscd-cell-button" data-iscd-cell data-control-id="${row.control.id}" data-box="${box}" data-value="${escapeAttr(value)}" data-symbol-tooltip="${escapeAttr(this.t(ISCD_COLUMNS.find(([id]) => id === box)?.[1] || box))}: ${escapeAttr(this.t(iscdSymbolLabel(box, value) || "Not specified"))}">
            <canvas class="iscd-symbol-canvas" width="24" height="24" data-column="${box}" data-symbol="${escapeAttr(value)}"></canvas>
          </button>
        </td>`;
      }).join("")}
    </tr>`;
  }

  scoreDescriptionCell(row) {
    if (row.control.kind !== "normal" || !row.courseControl) {
      return `<td class="score-cell"></td>`;
    }
    return `<td class="score-cell"><input type="number" class="points-input" data-course-control-id="${row.courseControl.id}" data-field="courseControl.points" value="${row.courseControl.points || 0}" min="0"></td>`;
  }

  handleDescriptionPanelClick(event) {
    if (event.target.closest("[data-field='courseControl.points']")) {
      return;
    }
    const cell = event.target.closest("[data-iscd-cell]");
    const row = event.target.closest("[data-control-id]");
    if (!row) return;
    const controlId = Number(row.dataset.controlId);
    this.store.setSelection({ type: "control", id: controlId });
    if (cell) {
      event.preventDefault();
      this.openIscdSymbolPicker(controlId, cell.dataset.box, cell.dataset.value || "");
    }
  }

  handleDescriptionPanelChange(event) {
    const input = event.target.closest("[data-field='courseControl.points']");
    if (!input) return;
    const courseControlId = Number(input.dataset.courseControlId);
    if (!courseControlId) return;
    const points = Math.max(0, Number(input.value) || 0);
    this.store.updateEvent(model => {
      const courseControl = getCourseControl(model, courseControlId);
      if (courseControl) {
        courseControl.points = points;
      }
    }, "Change points");
  }

  renderVariation({ eventModel, ui }) {
    const panel = this.querySelector("#variationPanel");
    panel.innerHTML = this.variationPanelHtml(eventModel, ui);
  }

  variationPanelHtml(eventModel, ui) {
    const courseId = ui.selectedCourseId;
    const course = courseId === "all" ? null : getCourse(eventModel, courseId);
    if (!course) {
      return `<p class="muted">${escapeHtml(this.t("Select a course first."))}</p>`;
    }
    if (course.kind === "score") {
      return `<p class="muted">${escapeHtml(this.t("Variations cannot be added to score courses."))}</p>`;
    }

    const branchCodes = variationBranchCodeMap(eventModel, course.id);
    const variations = allCourseVariations(eventModel, course.id);
    const anchorCourseControl = variationAnchorCourseControl(eventModel, course.id, ui);
    const canAddVariation = canAddVariationAtCourseControl(eventModel, course, anchorCourseControl);
    const selectedBranch = normalizedVariationBranch(eventModel, course.id, ui.variationBranch);
    const selectedBranchCode = selectedBranch ? branchCodes.get(Number(selectedBranch.branchCourseControl)) || "" : "";
    const anchorControl = getControl(eventModel, anchorCourseControl?.control);
    const treeHtml = this.variationSequenceHtml(eventModel, course.id, course.firstCourseControl, null, ui, {
      branchCodes,
      seen: new Set(),
      depth: 0
    });
    return `
      <div class="variation-actions">
        <label>${escapeHtml(this.t("Type"))}
          <select data-variation-add-kind>
            <option value="fork" ${(ui.variationAddKind || "fork") === "fork" ? "selected" : ""}>${escapeHtml(this.t("Fork"))}</option>
            <option value="loop" ${ui.variationAddKind === "loop" ? "selected" : ""}>${escapeHtml(this.t("Loop"))}</option>
          </select>
        </label>
        <label>${escapeHtml(this.t("Branches"))}
          <input data-variation-add-branches type="number" min="2" max="6" value="${Math.max(2, Math.min(6, Number(ui.variationAddBranches) || 2))}">
        </label>
        <button type="button" data-add-variation ${canAddVariation ? "" : "disabled"}>${iconSvg("plus")} ${escapeHtml(this.t("Add Variation"))}</button>
      </div>
      <p class="muted">${anchorCourseControl && anchorControl
        ? escapeHtml(this.t("Variation will start at {control}.", { control: controlDisplayName(anchorControl) }))
        : escapeHtml(this.t("Select a start or control in the ordering below, then add a variation."))}</p>
      ${selectedBranch ? `<p class="variation-branch-hint">${escapeHtml(this.t("Selected branch"))}: <strong>${escapeHtml(selectedBranchCode || controlDisplayName(getControl(eventModel, getCourseControl(eventModel, selectedBranch.branchCourseControl)?.control)))}</strong>. ${escapeHtml(this.t("New controls will be inserted on this branch."))}</p>` : ""}
      <div class="variation-tree">${treeHtml || `<p class="muted">${escapeHtml(this.t("This course has no controls."))}</p>`}</div>
      ${variations.length ? `
        <h3>${escapeHtml(this.t("All variations"))}</h3>
        <div class="variation-code-list">${variations.map(variation => `<button type="button" data-course-variation-code-select="${escapeAttr(variation.code)}">${escapeHtml(variation.code)}</button>`).join("")}</div>
      ` : `<p class="muted">${escapeHtml(this.t("This course has no variations."))}</p>`}
    `;
  }

  variationSequenceHtml(eventModel, courseId, startId, joinId, ui, context) {
    const branchCodes = context.branchCodes;
    const depth = context.depth || 0;
    const seen = context.seen || new Set();
    let currentId = Number(startId) || 0;
    let html = "";
    let steps = 0;
    const maxSteps = Math.max(1000, (eventModel.courseControls?.length || 0) * 20);
    while (currentId && currentId !== Number(joinId) && !seen.has(currentId) && steps++ < maxSteps) {
      const courseControl = getCourseControl(eventModel, currentId);
      if (!courseControl) break;
      seen.add(currentId);
      html += this.variationCourseControlRowHtml(eventModel, courseId, courseControl, ui, depth);
      if (courseControl.variation && courseControl.variationCourseControls?.length) {
        const joinControl = getControl(eventModel, getCourseControl(eventModel, courseControl.variationEnd)?.control);
        html += `<div class="variation-split" style="--variation-depth:${depth}">
          <div class="variation-split-title">${escapeHtml(this.t(courseControl.variation === "loop" ? "Loop" : "Fork"))}${joinControl ? ` -> ${escapeHtml(controlDisplayName(joinControl))}` : ""}</div>
          ${courseControl.variationCourseControls.map(branchId => {
            const branch = getCourseControl(eventModel, branchId);
            const control = getControl(eventModel, branch?.control);
            const code = branchCodes.get(Number(branchId)) || "";
            const selected = Number(ui.variationBranch?.forkCourseControl) === Number(courseControl.id)
              && Number(ui.variationBranch?.branchCourseControl) === Number(branchId);
            const body = this.variationSequenceHtml(eventModel, courseId, branchId, courseControl.variationEnd, ui, {
              branchCodes,
              seen: new Set(seen),
              depth: depth + 1
            });
            return `<div class="variation-branch ${selected ? "selected" : ""}">
              <button type="button" class="variation-branch-button" data-select-variation-branch data-fork-course-control="${courseControl.id}" data-branch-course-control="${branchId}">
                <strong>${escapeHtml(this.t("Branch"))} ${escapeHtml(code || "?")}</strong>
                <span>${escapeHtml(control ? controlDisplayName(control) : this.t("Missing control"))}</span>
              </button>
              <div class="variation-branch-body">${body}</div>
            </div>`;
          }).join("")}
        </div>`;
        currentId = Number(courseControl.variation === "loop" ? courseControl.nextCourseControl : courseControl.variationEnd) || 0;
      }
      else {
        currentId = Number(courseControl.nextCourseControl) || 0;
      }
    }
    return html;
  }

  variationCourseControlRowHtml(eventModel, courseId, courseControl, ui, depth) {
    const control = getControl(eventModel, courseControl.control);
    if (!control) return "";
    const anchor = variationAnchorCourseControl(eventModel, courseId, ui);
    const selected = Number(anchor?.id) === Number(courseControl.id);
    return `
      <button type="button" class="variation-node ${selected ? "selected" : ""}" style="--variation-depth:${depth}" data-select-variation-course-control="${courseControl.id}">
        <span>${escapeHtml(controlDisplayName(control))}</span>
        <small>${escapeHtml(this.t(controlKindLabel(control.kind)))}</small>
      </button>
    `;
  }

  handleVariationPanelClick(event) {
    const addButton = event.target.closest("[data-add-variation]");
    if (addButton) {
      this.addVariationFromPanel();
      return;
    }
    const variationCodeButton = event.target.closest("[data-course-variation-code-select]");
    if (variationCodeButton) {
      this.store.updateUi(ui => {
        ui.variationMode = "variation";
        ui.variationCode = variationCodeButton.dataset.courseVariationCodeSelect || "";
      }, "Select variation");
      return;
    }
    const branchButton = event.target.closest("[data-select-variation-branch]");
    if (branchButton) {
      const branchCourseControl = Number(branchButton.dataset.branchCourseControl) || null;
      const forkCourseControl = Number(branchButton.dataset.forkCourseControl) || null;
      this.store.updateUi(ui => {
        ui.variationBranch = { forkCourseControl, branchCourseControl };
        ui.variationAnchorCourseControl = forkCourseControl;
        ui.variationMode = "all";
        ui.status = this.t("Branch selected. Add controls to insert them on this branch.");
      }, "Select variation branch");
      return;
    }
    const courseControlButton = event.target.closest("[data-select-variation-course-control]");
    if (courseControlButton) {
      const courseControlId = Number(courseControlButton.dataset.selectVariationCourseControl) || null;
      const courseControl = getCourseControl(this.store.snapshot().eventModel, courseControlId);
      this.store.updateUi(ui => {
        ui.variationAnchorCourseControl = courseControlId;
        ui.variationBranch = null;
        ui.selection = courseControl ? { type: "control", id: courseControl.control } : ui.selection;
      }, "Select variation anchor");
    }
  }

  handleVariationPanelChange(event) {
    const kindSelect = event.target.closest("[data-variation-add-kind]");
    const branchesInput = event.target.closest("[data-variation-add-branches]");
    if (!kindSelect && !branchesInput) return;
    this.store.updateUi(ui => {
      if (kindSelect) {
        ui.variationAddKind = kindSelect.value === "loop" ? "loop" : "fork";
      }
      if (branchesInput) {
        ui.variationAddBranches = Math.max(2, Math.min(6, Math.round(Number(branchesInput.value) || 2)));
      }
    }, "Variation options");
  }

  addVariationFromPanel() {
    const state = this.store.snapshot();
    const courseId = state.ui.selectedCourseId;
    if (!courseId || courseId === "all") return;
    const anchor = variationAnchorCourseControl(state.eventModel, courseId, state.ui);
    if (!anchor) {
      this.store.updateUi(ui => {
        ui.status = this.t("Select a start or control in the ordering below, then add a variation.");
      }, "Add variation");
      return;
    }
    this.store.updateEvent(model => {
      const pending = addVariationAtCourseControl(model, courseId, anchor.id, {
        kind: state.ui.variationAddKind || "fork",
        branches: state.ui.variationAddBranches || 2
      });
      model.metadata.pendingVariation = pending;
    }, "Add variation");
    const pending = this.store.snapshot().eventModel.metadata.pendingVariation;
    this.store.updateUi(ui => {
      if (pending?.branchCourseControl) {
        ui.variationBranch = {
          forkCourseControl: pending.forkCourseControl,
          branchCourseControl: pending.branchCourseControl
        };
        ui.variationAnchorCourseControl = pending.forkCourseControl;
        ui.variationMode = "all";
        ui.selection = pending.control ? { type: "control", id: pending.control } : ui.selection;
        ui.status = this.t("Variation added. Select a branch and add controls.");
      }
      else {
        ui.status = this.t("Could not add variation here.");
      }
    }, "Add variation");
  }

  openIscdSymbolPicker(controlId, box, selectedValue = "") {
    const columnLabel = this.t(ISCD_COLUMNS.find(([id]) => id === box)?.[1] || box);
    this.openCommandDialog({
      title: `${box}: ${columnLabel}`,
      body: this.iscdSymbolPickerHtml(controlId, box, selectedValue),
      onOpen: dialog => this.paintIscdCanvases(dialog),
      apply: () => true
    });
  }

  iscdSymbolPickerHtml(controlId, box, selectedValue = "") {
    const options = symbolOptionsForColumn(box);
    return `
      <div class="iscd-picker-grid">
        ${options.map(([value, label]) => `
          <button type="button" class="iscd-picker-option ${value === selectedValue ? "selected" : ""}" data-iscd-symbol="${escapeAttr(value)}" data-control-id="${controlId}" data-box="${box}" data-symbol-tooltip="${escapeAttr(this.t(label))}">
            <canvas class="iscd-picker-canvas" width="36" height="36" data-column="${box}" data-symbol="${escapeAttr(value)}"></canvas>
          </button>
        `).join("")}
      </div>
    `;
  }

  applyIscdSymbolSelection(controlId, box, value) {
    const storage = storageForIscdSelection(box, value);
    this.store.updateEvent(model => {
      const control = getControl(model, controlId);
      updateControlDescription(control, box, storage.ref, storage.text);
    }, "Change description symbol");
    this.store.updateUi(ui => {
      ui.selection = { type: "control", id: Number(controlId) };
    }, "Select control");
  }

  paintIscdCanvases(root = this) {
    for (const canvas of root.querySelectorAll(".iscd-symbol-canvas, .iscd-picker-canvas")) {
      const ctx = canvas.getContext("2d");
      const width = canvas.width || 28;
      const height = canvas.height || 28;
      ctx.clearRect(0, 0, width, height);
      const column = canvas.dataset.column;
      const symbol = canvas.dataset.symbol;
      if (!symbol) continue;
      ctx.strokeStyle = "#111827";
      ctx.fillStyle = "#111827";
      drawIscdSymbol(ctx, column, symbol, width / 2, height / 2, Math.min(width, height) * 0.28);
    }
  }

  scheduleSymbolTooltip(event) {
    const target = event.target.closest("[data-symbol-tooltip]");
    if (!target) return;
    this.hideSymbolTooltip();
    this.symbolTooltipTimer = window.setTimeout(() => {
      const tooltip = this.querySelector("#symbolTooltip");
      const rect = target.getBoundingClientRect();
      tooltip.textContent = target.dataset.symbolTooltip || "";
      tooltip.style.left = `${Math.min(window.innerWidth - 240, rect.left)}px`;
      tooltip.style.top = `${rect.bottom + 8}px`;
      tooltip.hidden = false;
    }, 2000);
  }

  hideSymbolTooltip(event = null) {
    if (event) {
      const from = event.target.closest("[data-symbol-tooltip]");
      const to = event.relatedTarget?.closest?.("[data-symbol-tooltip]");
      if (from && from === to) return;
    }
    if (this.symbolTooltipTimer) {
      window.clearTimeout(this.symbolTooltipTimer);
      this.symbolTooltipTimer = null;
    }
    const tooltip = this.querySelector("#symbolTooltip");
    if (tooltip) {
      tooltip.hidden = true;
    }
  }

  renderSelection({ eventModel, ui }) {
    const panel = this.querySelector("#selectionPanel");
    const selection = ui.selection;
    if (!selection) {
      panel.innerHTML = `<p class="muted">${escapeHtml(this.t("No item selected."))}</p>`;
      return;
    }
    if (selection.type === "background") {
      panel.innerHTML = this.mapBackgroundEditor(eventModel, ui);
    }
    else if (selection.type === "control") {
      const control = getControl(eventModel, selection.id);
      panel.innerHTML = control ? this.controlEditor(control) : `<p class="muted">${escapeHtml(this.t("Selected control no longer exists."))}</p>`;
    }
    else if (selection.type === "course") {
      const course = getCourse(eventModel, selection.id);
      panel.innerHTML = course ? this.courseEditor(course) : `<p class="muted">${escapeHtml(this.t("Selected course no longer exists."))}</p>`;
    }
    else if (selection.type === "special") {
      const special = findById(eventModel.specials, selection.id);
      panel.innerHTML = special ? this.specialEditor(special) : `<p class="muted">${escapeHtml(this.t("Selected object no longer exists."))}</p>`;
    }
    else if (selection.type === "leg" || selection.type === "leg-bend") {
      panel.innerHTML = this.legEditor(eventModel, selection);
    }
    else if (selection.type === "leg-gap") {
      panel.innerHTML = `<p class="muted">${escapeHtml(this.t("Line cut selected. Drag either blue handle on the map to adjust the cut range."))}</p>`;
    }
    else if (selection.type === "control-number") {
      const courseControl = getCourseControl(eventModel, selection.courseControl);
      const control = getControl(eventModel, courseControl?.control || selection.control);
      panel.innerHTML = courseControl && control
        ? `
          <p class="muted">${escapeHtml(this.t("Control"))} ${escapeHtml(controlDisplayName(control))}: ${escapeHtml(this.t("Drag the number on the map to move it around the control."))}</p>
          <button class="secondary" type="button" data-reset-control-number>${iconSvg("undo")} ${escapeHtml(this.t("Reset automatic placement"))}</button>
        `
        : `<p class="muted">${escapeHtml(this.t("Selected control number no longer exists."))}</p>`;
    }
    this.bindSelectionColorInputs(panel);
    this.paintIscdCanvases(panel);
  }

  bindSelectionColorInputs(panel) {
    panel.querySelectorAll("[data-background-field]").forEach(input => {
      input.addEventListener("input", event => this.handleSelectionPanelInput(event));
    });
    panel.querySelector("[data-special-color-picker]")?.addEventListener("input", event => this.handleSelectionPanelInput(event));
    panel.querySelector("[data-special-color-hex]")?.addEventListener("input", event => this.handleSelectionPanelInput(event));
  }

  mapBackgroundEditor(eventModel, ui) {
    const background = ui.background;
    if (!background) {
      return `<p class="muted">${escapeHtml(this.t("No item selected."))}</p>`;
    }
    const mapScale = positiveScale(eventModel.event?.map?.scale) || 15000;
    const width = positiveNumber(background.widthMeters, 0);
    const height = positiveNumber(background.heightMeters, 0);
    const aspect = backgroundAspect(background);
    const printedWidth = width ? width / mapScale * 100 : 0;
    const measured = backgroundCalibrationDistance(background);
    return `
      <div class="map-info-panel">
        <h2>${escapeHtml(this.t("Map"))}</h2>
        <div class="readonly-field"><span>${escapeHtml(this.t("File"))}</span><strong>${escapeHtml(background.name || "")}</strong></div>
        <div class="readonly-field"><span>${escapeHtml(this.t("Image size"))}</span><strong>${Math.round(background.naturalWidth || 0)} x ${Math.round(background.naturalHeight || 0)} px</strong></div>
        <div class="readonly-field"><span>${escapeHtml(this.t("Map scale"))}</span><strong>1:${escapeHtml(String(mapScale))}</strong></div>
        <div class="form-grid">
          <label>${escapeHtml(this.t("Map width (m)"))} <input data-background-field="widthMeters" type="number" min="0.1" step="0.1" value="${formatInputNumber(width)}"></label>
          <label>${escapeHtml(this.t("Map height (m)"))} <input data-background-field="heightMeters" type="number" min="0.1" step="0.1" value="${formatInputNumber(height || width * aspect)}"></label>
          <label>${escapeHtml(this.t("Printed width (cm)"))} <input data-background-field="printedWidthCm" type="number" min="0.01" step="0.01" value="${formatInputNumber(background.printedWidthCm || printedWidth)}"></label>
          <label>${escapeHtml(this.t("Scale"))} <input data-background-field="mapScale" type="number" min="1" step="1" value="${mapScale}"></label>
          <label class="span-2">${escapeHtml(this.t("Calibration distance (m)"))} <input data-background-field="calibrationDistanceMeters" type="number" min="0.01" step="0.01" value="${formatInputNumber(background.calibrationDistanceMeters || "")}"></label>
          <label class="span-2">${escapeHtml(this.t("Calibration printed length (cm)"))} <input data-background-field="calibrationPrintedCm" type="number" min="0.01" step="0.01" value="${formatInputNumber(background.calibrationPrintedCm || "")}"></label>
        </div>
        <button type="button" class="secondary" data-background-calibrate>${escapeHtml(this.t("Calibrate with two points"))}</button>
        <p class="muted" data-background-measured>${measured ? `${escapeHtml(this.t("Selected line"))}: ${formatDecimal(measured)} m` : escapeHtml(this.t("Click two points on the map, then enter their real distance."))}</p>
      </div>
    `;
  }

  controlEditor(control) {
    const descriptions = new Map((control.descriptions || []).map(item => [item.box, item]));
    const scoreFinishControl = this.scoreFinishControlEditor(control);
    return `
      <div class="form-grid">
        <label>${escapeHtml(this.t("Kind"))} <select data-field="control.kind">${CONTROL_KINDS.map(kind => `<option value="${kind}" ${kind === control.kind ? "selected" : ""}>${escapeHtml(optionLabel(kind))}</option>`).join("")}</select></label>
        <label>${escapeHtml(this.t("Code"))} <input data-field="control.code" value="${escapeAttr(control.code || "")}" ${control.kind !== "normal" ? "disabled" : ""}></label>
        <label>X <input data-field="control.location.x" type="number" step="0.1" value="${control.location.x}"></label>
        <label>Y <input data-field="control.location.y" type="number" step="0.1" value="${control.location.y}"></label>
        <label>${escapeHtml(this.t("Before"))} <input data-field="control.descTextBefore" value="${escapeAttr(control.descTextBefore || "")}"></label>
        <label>${escapeHtml(this.t("After"))} <input data-field="control.descTextAfter" value="${escapeAttr(control.descTextAfter || "")}"></label>
      </div>
      ${scoreFinishControl}
      <h3>${escapeHtml(this.t("Descriptions"))}</h3>
      <div class="description-edit">
        ${ISCD_COLUMNS.map(([box, label]) => `
          <label>${box}
            <select data-description-box="${box}" data-description-part="ref" title="${escapeAttr(this.t(label))}">
              ${symbolOptionsForColumn(box).map(([value, optionText]) => `<option value="${escapeAttr(value)}" ${value === (descriptions.get(box)?.ref || "") ? "selected" : ""}>${escapeHtml(this.t(optionText))}</option>`).join("")}
            </select>
          </label>`).join("")}
      </div>
      <label class="stacked">${escapeHtml(this.t("Punch pattern"))}
        <textarea data-field="control.punchPatternText" rows="5">${escapeHtml(control.punchPattern?.rows?.join("\n") || "")}</textarea>
      </label>
    `;
  }

  scoreFinishControlEditor(control) {
    const state = this.store.snapshot();
    const courseId = state.ui.selectedCourseId;
    if (!courseId || courseId === "all" || state.ui.showAllControls || control.kind !== "normal") {
      return "";
    }
    const course = getCourse(state.eventModel, courseId);
    if (course?.kind !== "score") {
      return "";
    }
    const view = courseView(state.eventModel, courseId, { allBranches: true });
    const inCourse = view.some(row => Number(row.control?.id) === Number(control.id));
    const hasFinish = view.some(row => row.control?.kind === "finish");
    if (!inCourse || !hasFinish) {
      return "";
    }
    const checked = Number(course.options?.scoreFinishControl) === Number(control.id);
    return `
      <label class="check span-2">
        <input type="checkbox" data-score-finish-control ${checked ? "checked" : ""}>
        ${escapeHtml(this.t("Flagged leg to finish"))}
      </label>
    `;
  }

  courseEditor(course) {
    const finishRoute = finishRouteForCourse(this.store.snapshot().eventModel, course.id);
    const relay = course.relay || { firstTeam: 1, teams: 0, legs: 1, branches: [] };
    const assignments = relayAssignments(this.store.snapshot().eventModel, course.id);
    return `
      <div class="form-grid">
        <label>${escapeHtml(this.t("Name"))} <input data-field="course.name" value="${escapeAttr(course.name)}"></label>
        <label>${escapeHtml(this.t("Kind"))} <select data-field="course.kind"><option value="normal" ${course.kind === "normal" ? "selected" : ""}>${escapeHtml(this.t("normal"))}</option><option value="score" ${course.kind === "score" ? "selected" : ""}>${escapeHtml(this.t("score"))}</option></select></label>
        <label>${escapeHtml(this.t("Labels"))} <select data-field="course.labelKind">${["sequence", "code", "sequence-and-code", "sequence-and-score", "code-and-score-brackets", "code-and-score-dash", "code-and-score", "score"].map(kind => `<option value="${kind}" ${kind === course.labelKind ? "selected" : ""}>${escapeHtml(this.t(kind))}</option>`).join("")}</select></label>
        <label>${escapeHtml(this.t("Print scale"))} <input data-field="course.options.printScale" type="number" value="${course.options.printScale || 15000}"></label>
        <label>${escapeHtml(this.t("Climb"))} <input data-field="course.options.climb" type="number" value="${course.options.climb ?? -1}"></label>
        <label>${escapeHtml(this.t("Load"))} <input data-field="course.options.load" type="number" value="${course.options.load ?? -1}"></label>
        <label>${escapeHtml(this.t("Length override"))} <input data-field="course.options.courseLength" type="number" value="${course.options.courseLength ?? ""}"></label>
        <label>${escapeHtml(this.t("First number"))} <input data-field="course.firstControlOrdinal" type="number" value="${course.firstControlOrdinal || 1}"></label>
        <label>${escapeHtml(this.t("Secondary title"))} <input data-field="course.secondaryTitle" value="${escapeAttr(course.secondaryTitle || "")}"></label>
        <label>${escapeHtml(this.t("Finish route"))}
          <select data-course-finish-route ${finishRoute.disabled ? "disabled" : ""}>
            <option value="none" ${finishRoute.value === "none" ? "selected" : ""}>${escapeHtml(this.t("Navigate to finish"))}</option>
            <option value="all" ${finishRoute.value === "all" ? "selected" : ""}>${escapeHtml(this.t("Taped route to finish"))}</option>
            <option value="end" ${finishRoute.value === "end" ? "selected" : ""}>${escapeHtml(this.t("Navigate to funnel, then tapes"))}</option>
          </select>
        </label>
        <label class="check"><input data-field="course.options.hideFromReports" type="checkbox" ${course.options.hideFromReports ? "checked" : ""}> ${escapeHtml(this.t("Hide from reports"))}</label>
      </div>
      <h3>${escapeHtml(this.t("Relay"))}</h3>
      <div class="form-grid">
        <label>${escapeHtml(this.t("Teams"))} <input data-field="course.relay.teams" type="number" min="0" value="${relay.teams || 0}"></label>
        <label>${escapeHtml(this.t("Legs"))} <input data-field="course.relay.legs" type="number" min="1" value="${relay.legs || 1}"></label>
        <label>${escapeHtml(this.t("First team"))} <input data-field="course.relay.firstTeam" type="number" min="1" value="${relay.firstTeam || 1}"></label>
        <label class="check"><input data-field="course.hideVariationsOnMap" type="checkbox" ${course.hideVariationsOnMap ? "checked" : ""}> ${escapeHtml(this.t("Hide variation codes on map"))}</label>
      </div>
      ${this.relayBranchEditor(course, assignments)}
      ${this.relayAssignmentTable(assignments)}
    `;
  }

  relayBranchEditor(course, assignments) {
    const branchCodes = assignments.variations.length
      ? uniqueStrings(assignments.variations.flatMap(variation => variation.code.split("")))
      : [];
    if (!branchCodes.length) {
      return `<p class="muted">${escapeHtml(this.t("Add a fork or loop to this course to create relay variations."))}</p>`;
    }
    const rows = branchCodes.map(code => {
      const fixed = course.relay?.branches?.find(branch => branch.branch === code);
      return `
        <label>${escapeHtml(this.t("Branch"))} ${escapeHtml(code)}
          <select data-relay-branch="${escapeAttr(code)}">
            <option value="">${escapeHtml(this.t("Any leg"))}</option>
            ${Array.from({ length: Math.max(1, course.relay?.legs || 1) }, (_, index) => index + 1)
              .map(leg => `<option value="${leg}" ${Number(fixed?.leg) === leg ? "selected" : ""}>${escapeHtml(this.t("Leg"))} ${leg}</option>`)
              .join("")}
          </select>
        </label>
      `;
    }).join("");
    return `<div class="form-grid">${rows}</div>`;
  }

  relayAssignmentTable(assignments) {
    if (!assignments.rows.length) return "";
    const headers = Array.from({ length: assignments.legs }, (_, index) => `<th>${escapeHtml(this.t("Leg"))} ${index + 1}</th>`).join("");
    const rows = assignments.rows.map(row => `
      <tr>
        <td>${escapeHtml(row.team)}</td>
        ${row.assignments.map(variation => `<td>${escapeHtml(variation?.code || "")}</td>`).join("")}
      </tr>
    `).join("");
    return `
      <table class="report-table relay-assignment-table">
        <thead><tr><th>${escapeHtml(this.t("Team"))}</th>${headers}</tr></thead>
        <tbody>${rows}</tbody>
      </table>
    `;
  }

  legEditor(eventModel, selection) {
    const from = getControl(eventModel, selection.startControl);
    const to = getControl(eventModel, selection.endControl);
    const leg = findLeg(eventModel, selection.startControl, selection.endControl);
    const flagging = normalizeLegFlaggingKind(leg?.flagging?.kind);
    const total = leg ? pathLength(legPathPoints(eventModel, leg)) : 0;
    const range = flaggingRangeForUi(eventModel, leg, total);
    const cuts = leg?.gaps || [];
    return `
      <div class="form-grid">
        <label>${escapeHtml(this.t("From"))} <input value="${escapeAttr(controlDisplayName(from))}" disabled></label>
        <label>${escapeHtml(this.t("To"))} <input value="${escapeAttr(controlDisplayName(to))}" disabled></label>
        <label class="span-2">${escapeHtml(this.t("Flagging"))}
          <select data-leg-flagging>
            <option value="none" ${flagging === "none" ? "selected" : ""}>${escapeHtml(this.t("None"))}</option>
            <option value="all" ${flagging === "all" ? "selected" : ""}>${escapeHtml(this.t("Entire leg marked"))}</option>
            <option value="begin" ${flagging === "begin" ? "selected" : ""}>${escapeHtml(this.t("Marked from control"))}</option>
            <option value="end" ${flagging === "end" ? "selected" : ""}>${escapeHtml(this.t("Marked into control"))}</option>
            <option value="middle" ${flagging === "middle" ? "selected" : ""}>${escapeHtml(this.t("Marked middle segment"))}</option>
          </select>
        </label>
        ${flagging === "begin" ? `
          <label class="span-2">${escapeHtml(this.t("Marked until"))}
            <span class="range-field"><input type="range" min="5" max="95" step="1" data-leg-flag-end value="${range.endPercent}"><output>${range.endPercent}%</output></span>
          </label>` : ""}
        ${flagging === "end" ? `
          <label class="span-2">${escapeHtml(this.t("Marked from"))}
            <span class="range-field"><input type="range" min="5" max="95" step="1" data-leg-flag-start value="${range.startPercent}"><output>${range.startPercent}%</output></span>
          </label>` : ""}
        ${flagging === "middle" ? `
          <label>${escapeHtml(this.t("Start"))}
            <span class="range-field"><input type="range" min="5" max="90" step="1" data-leg-flag-start value="${range.startPercent}"><output>${range.startPercent}%</output></span>
          </label>
          <label>${escapeHtml(this.t("End"))}
            <span class="range-field"><input type="range" min="10" max="95" step="1" data-leg-flag-end value="${range.endPercent}"><output>${range.endPercent}%</output></span>
          </label>` : ""}
      </div>
      <h3>${escapeHtml(this.t("Line Cuts"))}</h3>
      ${cuts.length
        ? `<div class="compact-list">${cuts.map((gap, index) => `<button type="button" data-select-leg-gap="${index}">${escapeHtml(this.t("Cut {number}: {length} m", { number: index + 1, length: formatDecimal(gap.length || 0) }))}</button>`).join("")}</div>`
        : `<p class="muted">${escapeHtml(this.t("No manual cuts. Use the Cut Line tool, then click this leg."))}</p>`}
      <h3>${escapeHtml(this.t("Bend Points"))}</h3>
      <div class="compact-list">
        <button type="button" data-add-leg-bend>${iconSvg("plus")} ${escapeHtml(this.t("Add Bend Point"))}</button>
        ${selection.type === "leg-bend" ? `<button type="button" data-delete-leg-bend>${iconSvg("trash")} ${escapeHtml(this.t("Delete Bend Point"))}</button>` : ""}
      </div>
    `;
  }

  specialEditor(special) {
    if (special.kind === "descriptions") {
      return this.descriptionSpecialEditor(special);
    }
    const category = specialCategory(special.kind);
    const colorSelect = this.specialColorSelect(special);
    const fields = [`<div class="readonly-field"><span>${escapeHtml(this.t("Kind"))}</span><strong>${escapeHtml(optionLabel(special.kind))}</strong></div>`];

    if (category === "point") {
      // Point specials: kind only (orientation handled by rotation tool if needed)
    }
    else if (category === "text") {
      fields.push(`<label class="span-2">${escapeHtml(this.t("Text"))} <input data-field="special.text" value="${escapeAttr(special.text || "")}"></label>`);
      fields.push(colorSelect);
      fields.push(`<label>${escapeHtml(this.t("Font"))} <select data-field="special.font.name">${fontOptions(special.font?.name || "Arial")}</select></label>`);
      fields.push(`<label class="check"><input data-field="special.font.bold" type="checkbox" ${special.font?.bold ? "checked" : ""}> ${escapeHtml(this.t("Bold"))}</label>`);
      fields.push(`<label class="check"><input data-field="special.font.italic" type="checkbox" ${special.font?.italic ? "checked" : ""}> ${escapeHtml(this.t("Italic"))}</label>`);
      fields.push(`<label>${escapeHtml(this.t("Font size"))} <input data-field="special.font.height" type="number" step="0.1" value="${specialFontHeight(special)}"></label>`);
    }
    else if (category === "line") {
      fields.push(colorSelect);
      fields.push(this.specialLineStyleSelect(special));
      fields.push(`<label>${escapeHtml(this.t("Width"))} <input data-field="special.lineWidth" type="number" step="0.1" value="${special.lineWidth || 0.35}"></label>`);
      if (special.lineKind === "dashed") {
        fields.push(`<label>${escapeHtml(this.t("Dash size"))} <input data-field="special.dashSize" type="number" step="0.1" value="${special.dashSize || 4}"></label>`);
        fields.push(`<label>${escapeHtml(this.t("Gap size"))} <input data-field="special.gapSize" type="number" step="0.1" value="${special.gapSize || 2}"></label>`);
      }
      if (special.lineKind === "double") {
        fields.push(`<label>${escapeHtml(this.t("Gap size"))} <input data-field="special.gapSize" type="number" step="0.1" value="${special.gapSize || 2}"></label>`);
      }
    }
    else if (category === "area") {
      fields.push(colorSelect);
    }
    else if (category === "rectangle") {
      fields.push(colorSelect);
      fields.push(this.specialLineStyleSelect(special));
      fields.push(`<label>${escapeHtml(this.t("Width"))} <input data-field="special.lineWidth" type="number" step="0.1" value="${special.lineWidth || 0.35}"></label>`);
      fields.push(`<label>${escapeHtml(this.t("Corner radius"))} <input data-field="special.cornerRadius" type="number" step="0.1" value="${special.cornerRadius || 0}"></label>`);
      if (special.lineKind === "dashed") {
        fields.push(`<label>${escapeHtml(this.t("Dash size"))} <input data-field="special.dashSize" type="number" step="0.1" value="${special.dashSize || 4}"></label>`);
        fields.push(`<label>${escapeHtml(this.t("Gap size"))} <input data-field="special.gapSize" type="number" step="0.1" value="${special.gapSize || 2}"></label>`);
      }
      if (special.lineKind === "double") {
        fields.push(`<label>${escapeHtml(this.t("Gap size"))} <input data-field="special.gapSize" type="number" step="0.1" value="${special.gapSize || 2}"></label>`);
      }
    }
    else if (category === "ellipse") {
      fields.push(colorSelect);
      fields.push(this.specialLineStyleSelect(special));
      fields.push(`<label>${escapeHtml(this.t("Width"))} <input data-field="special.lineWidth" type="number" step="0.1" value="${special.lineWidth || 0.35}"></label>`);
      if (special.lineKind === "dashed") {
        fields.push(`<label>${escapeHtml(this.t("Dash size"))} <input data-field="special.dashSize" type="number" step="0.1" value="${special.dashSize || 4}"></label>`);
        fields.push(`<label>${escapeHtml(this.t("Gap size"))} <input data-field="special.gapSize" type="number" step="0.1" value="${special.gapSize || 2}"></label>`);
      }
      if (special.lineKind === "double") {
        fields.push(`<label>${escapeHtml(this.t("Gap size"))} <input data-field="special.gapSize" type="number" step="0.1" value="${special.gapSize || 2}"></label>`);
      }
    }

    return `<div class="form-grid">${fields.join("\n")}</div>`;
  }

  specialColorSelect(special) {
    const current = special.color || "upper-purple";
    const hex = colorToHex(current);
    return `
      <div class="color-field span-2" role="group" aria-label="${escapeAttr(this.t("Color"))}">
        <span>${escapeHtml(this.t("Color"))}</span>
        <div class="color-spectrum-row">
          <input class="color-spectrum" type="color" data-special-color-picker value="${escapeAttr(hex)}" aria-label="${escapeAttr(this.t("Color spectrum"))}">
          <input class="color-value-input" data-special-color-hex value="${escapeAttr(hex)}" aria-label="${escapeAttr(this.t("Hex color"))}" pattern="#[0-9A-Fa-f]{6}">
        </div>
        <div class="color-swatches">
          ${SPECIAL_COLOR_CHOICES.map(([value, swatch, label]) => `
            <button
              type="button"
              class="color-swatch ${colorChoiceSelected(value, current) ? "selected" : ""}"
              data-special-color="${escapeAttr(value)}"
              style="--swatch:${escapeAttr(swatch)}"
              aria-label="${escapeAttr(colorChoiceLabel(value, label))}"
              title="${escapeAttr(colorChoiceLabel(value, label))}">
            </button>
          `).join("")}
        </div>
      </div>
    `;
  }

  specialLineStyleSelect(special) {
    return `<label>${escapeHtml(this.t("Line style"))} <select data-field="special.lineKind">${["single", "double", "dashed"].map(kind => `<option value="${kind}" ${kind === special.lineKind ? "selected" : ""}>${escapeHtml(optionLabel(kind))}</option>`).join("")}</select></label>`;
  }

  descriptionSpecialEditor(special) {
    const courseOptions = [
      ["all", this.t("All Controls")],
      ...sortedCourses(this.store.snapshot().eventModel).map(course => [String(course.id), course.name])
    ];
    const target = special.allCourses ? "all" : String(special.courses?.[0]?.course || "all");
    return `
      <div class="form-grid">
        <label>${escapeHtml(this.t("Shown for"))} <select data-field="special.descriptionTarget">${courseOptions.map(([value, label]) => `<option value="${value}" ${value === target ? "selected" : ""}>${escapeHtml(label)}</option>`).join("")}</select></label>
        <label>${escapeHtml(this.t("Format"))} <select data-field="special.descriptionKind">${DESCRIPTION_KINDS.map(kind => `<option value="${kind}" ${kind === (special.descriptionKind || "symbols") ? "selected" : ""}>${escapeHtml(this.t(descriptionKindLabel(kind)))}</option>`).join("")}</select></label>
        <label>${escapeHtml(this.t("Columns"))} <select data-field="special.numColumns">${[1, 2, 3, 4, 5, 6].map(value => `<option value="${value}" ${value === Number(special.numColumns || 1) ? "selected" : ""}>${value}</option>`).join("")}</select></label>
        <label>${escapeHtml(this.t("Line height (mm)"))} <input data-field="special.cellSize" type="number" min="1.2" step="0.1" value="${Number(special.cellSize || 5.2).toFixed(1)}"></label>
        <label>${escapeHtml(this.t("Color"))} <select data-field="special.color">${["black", "upper-purple"].map(color => `<option value="${color}" ${color === (special.color || "black") ? "selected" : ""}>${escapeHtml(optionLabel(color))}</option>`).join("")}</select></label>
        <p class="muted">${escapeHtml(this.t("Drag the block to move it. Drag the lower-right handle to resize; columns and cell size update together."))}</p>
      </div>
    `;
  }

  renderReport({ ui }) {
    const panel = this.querySelector("#reportPanel");
    panel.innerHTML = ui.report?.html || `<p class="muted">${escapeHtml(this.t("Choose a report from the Reports menu."))}</p>`;
  }

  renderStatus({ eventModel, ui }) {
    this.querySelector("#statusText").textContent = this.t(ui.status || "Ready");
    const mapName = ui.omap?.name ? ` | OMAP: ${ui.omap.name}` : "";
    this.querySelector("#dirtyText").textContent = `${eventModel.sourceName || this.t("Untitled.ppen")}${eventModel.dirty ? " *" : ""}${mapName}`;
  }

  updateMouseStatus(point) {
    const mouse = this.querySelector("#mouseText");
    if (mouse) {
      mouse.textContent = `X: ${point.x.toFixed(1)}  Y: ${point.y.toFixed(1)}`;
    }
  }

  createNewEvent() {
    this.mapView.setBackground("");
    this.mapView.setOmap(null);
    this.store.setEventModel(createBlankEvent(), "New event");
    this.store.updateUi(ui => {
      ui.selectedCourseId = "all";
      ui.showAllControls = true;
      ui.background = null;
      ui.omap = null;
      ui.selection = null;
      ui.printAreaEdit = null;
      ui.tool = "select";
    }, "New event");
  }

  runCommand(command) {
    const state = this.store.snapshot();
    const eventModel = state.eventModel;
    switch (command) {
      case "new":
        if (this.confirmDirty()) this.createNewEvent();
        break;
      case "open":
        this.querySelector("#ppenInput").click();
        break;
      case "open-sample":
        this.openBundledSample();
        break;
      case "save":
      case "save-as":
        this.downloadPpen();
        break;
      case "map-image":
        this.querySelector("#mapInput").click();
        break;
      case "omap-import":
        this.querySelector("#omapInput").click();
        break;
      case "omap-clear":
        this.mapView.setOmap(null);
        this.store.updateUi(ui => { ui.omap = null; }, "OMAP map cleared");
        break;
      case "undo":
        this.store.undo();
        break;
      case "redo":
        this.store.redo();
        break;
      case "delete":
        if (state.ui.selection?.type === "control") {
          this.deleteSelectedControl(state);
          break;
        }
        this.store.updateEvent(model => deleteSelection(model, state.ui.selection, {
          selectedCourseId: state.ui.selectedCourseId
        }), "Delete");
        this.store.setSelection(null);
        break;
      case "cancel":
        this.store.updateUi(ui => {
          ui.tool = "select";
          ui.printAreaEdit = null;
        }, "Select mode");
        break;
      case "fit-course":
      case "fit-map":
        this.mapView.fit();
        break;
      case "zoom-50":
      case "zoom-100":
      case "zoom-200":
        this.store.updateUi(ui => { ui.zoom = Number(command.split("-")[1]) / 100; }, "Zoom");
        break;
      case "toggle-print-area":
        this.store.updateUi(ui => { ui.showPrintArea = !ui.showPrintArea; }, "Print area");
        break;
      case "set-print-area":
        this.promptPrintArea();
        break;
      case "toggle-all-controls":
        this.store.updateUi(ui => {
          ui.selectedCourseId = "all";
          ui.showAllControls = true;
          ui.selection = null;
        }, "All controls");
        break;
      case "quality":
        this.store.updateUi(ui => { ui.highQuality = !ui.highQuality; }, "Map quality");
        break;
      case "change-title":
        this.promptEventTitle(eventModel);
        break;
      case "map-info":
        this.store.updateUi(ui => {
          ui.selection = { type: "background" };
        }, "Map info");
        break;
      case "change-map-scale":
        this.promptMapScale(eventModel);
        break;
      case "change-description-language":
        this.promptDescriptionLanguage(eventModel);
        break;
      case "auto-number":
        this.promptAutoNumber(eventModel);
        break;
      case "remove-unused":
        this.store.updateEvent(model => {
          const count = removeUnusedControls(model);
          model.metadata.lastMessage = `${count} unused controls removed.`;
        }, "Remove unused controls");
        break;
      case "move-all":
        this.promptMoveAll();
        break;
      case "std-desc-2004":
      case "std-desc-2024":
        this.store.updateEvent(model => {
          model.event.standards.description = command.endsWith("2004") ? "2004" : "2024";
        }, "Description standard");
        break;
      case "std-map-2000":
      case "std-map-2017":
      case "std-map-sprint":
        this.store.updateEvent(model => {
          model.event.standards.map = command === "std-map-sprint" ? "Spr2019" : command.endsWith("2000") ? "2000" : "2017";
          model.event.courseAppearance.mapStandard = model.event.standards.map;
        }, "Map standard");
        break;
      case "appearance":
        this.promptAppearance();
        break;
      case "add-course":
        this.promptAddCourse();
        break;
      case "delete-course":
        this.promptDeleteCourse();
        break;
      case "duplicate-course":
        this.promptDuplicateCourse();
        break;
      case "course-properties":
        if (state.ui.selectedCourseId !== "all") this.store.setSelection({ type: "course", id: state.ui.selectedCourseId });
        break;
      case "add-variation":
        this.switchPanel("variation");
        this.addVariationFromPanel();
        break;
      case "course-order":
        this.promptCourseOrder();
        break;
      case "course-load":
        this.promptCourseLoad();
        break;
      case "variation-report":
        this.showVariationReport();
        break;
      case "report-summary":
      case "report-audit":
      case "report-leg-lengths":
      case "report-crossref":
      case "report-load":
        this.showReport(command);
        break;
      case "export-iof3":
        download(`${baseName(eventModel.sourceName)}.iof3.xml`, exportIofXml(eventModel, 3), "application/xml");
        break;
      case "export-iof2":
        download(`${baseName(eventModel.sourceName)}.iof2.xml`, exportIofXml(eventModel, 2), "application/xml");
        break;
      case "export-gpx":
        download(`${baseName(eventModel.sourceName)}.gpx`, exportGpx(eventModel), "application/gpx+xml");
        break;
      case "export-kml":
        download(`${baseName(eventModel.sourceName)}.kml`, exportKml(eventModel), "application/vnd.google-earth.kml+xml");
        break;
      case "export-routegadget":
        download(`${baseName(eventModel.sourceName)}.routegadget.xml`, exportRouteGadgetXml(eventModel), "application/xml");
        break;
      case "export-svg":
        download(`${baseName(eventModel.sourceName)}.svg`, exportCourseSvg(eventModel, state.ui.selectedCourseId), "image/svg+xml");
        break;
      case "export-png":
        this.exportPng();
        break;
      case "export-pdf":
        this.exportPdf();
        break;
      case "about":
        alert(this.t("O-Composer {version}\nA browser-only app for creating, editing, viewing, and exporting orienteering event files.", { version: APP_VERSION }));
        break;
      case "help":
        alert(this.t("O-Composer {version}\n\nThis version runs entirely in the browser. It can read and write .ppen files, render uncompressed .omap/.xmap XML maps, and export browser-generated files. Native OCAD/PDF map rendering, installed-font checks, and Livelox API publishing require desktop/runtime capabilities that browsers do not expose.", { version: APP_VERSION }));
        break;
      default:
        if (command.startsWith("tool-")) {
          this.setTool(command);
        }
        break;
    }
  }

  setTool(command) {
    const toolMap = {
      "tool-start": "control:start",
      "tool-control": "control:normal",
      "tool-finish": "control:finish",
      "tool-map-exchange": "control:map-exchange",
      "tool-crossing": "control:crossing-point",
      "tool-map-issue": "control:map-issue",
      "tool-line-cut": "line-cut",
      "tool-description": "special:descriptions",
      "tool-text": "special:text",
      "tool-line": "special:line",
      "tool-rectangle": "special:rectangle",
      "tool-ellipse": "special:ellipse",
      "tool-oob": "special:out-of-bounds",
      "tool-danger": "special:dangerous-area",
      "tool-construction": "special:temporary-construction",
      "tool-water": "special:water",
      "tool-first-aid": "special:first-aid",
      "tool-forbidden": "special:forbidden-route",
      "tool-boundary": "special:boundary",
      "tool-regmark": "special:registration-mark",
      "tool-whiteout": "special:white-out"
    };
    this.store.updateUi(ui => {
      ui.tool = toolMap[command] || "select";
      ui.printAreaEdit = null;
    }, "Add mode");
  }

  applyTool(tool, point, toolOptions = {}) {
    const state = this.store.snapshot();
    const selectedCourseId = state.ui.selectedCourseId;
    const afterCourseControl = insertionCourseControlId(state);
    if (tool === "background-calibration") {
      this.store.updateUi(ui => {
        if (!ui.background) return;
        const imagePoint = backgroundImagePointForMap(ui.background, point);
        const imagePoints = [...(ui.background.calibration?.imagePoints || []), imagePoint].slice(-2);
        ui.background.calibration = { imagePoints };
        resetBackgroundCalibrationBase(ui.background);
        ui.selection = null;
        if (imagePoints.length >= 2) {
          applyBackgroundCalibration(ui.background, backgroundAspect(ui.background));
          ui.tool = "select";
          ui.status = this.t("Enter the real distance for the selected map line.");
        }
        else {
          ui.status = this.t("Click the second point on the map.");
        }
      }, "Calibrate map background");
      return;
    }
    if (tool.startsWith("control:")) {
      const kind = tool.split(":")[1];
      const snapped = snappedControlForPlacement(state, kind, point, this.mapView);
      if (snapped) {
        if (selectedCourseId && selectedCourseId !== "all" && !snapped.usedInSelectedCourse) {
          this.addExistingControlToCurrentCourse({ type: "control", id: snapped.control.id });
          return;
        }
        this.store.updateUi(ui => {
          ui.selection = { type: "control", id: snapped.control.id };
          ui.tool = "select";
          ui.status = this.t("Snapped to existing control.");
        }, "Snap to existing control");
        return;
      }
      try {
        this.store.updateEvent(model => {
          const selection = addControlAt(model, kind, point, selectedCourseId, { afterCourseControl });
          model.metadata.pendingSelection = selection;
        }, `Add ${kind}`);
      }
      catch (error) {
        this.store.updateUi(ui => { ui.status = this.t(error.message || "Cannot add control to this course."); }, "Add control failed");
        return;
      }
      const pending = this.store.snapshot().eventModel.metadata.pendingSelection;
      this.store.updateUi(ui => {
        ui.selection = pending;
        ui.tool = "select";
      }, "Select mode");
    }
    else if (tool.startsWith("special:")) {
      const kind = tool.slice("special:".length);
      const options = {};
      if (kind === "text") {
        this.openTextSpecialDialog(point);
        return;
      }
      if (kind === "descriptions") {
        const existing = existingDescriptionSpecialForTarget(state.eventModel, selectedCourseId);
        if (existing) {
          this.selectExistingDescriptionSpecial(existing);
          return;
        }
        Object.assign(options, createDescriptionSpecialOptions(this.store.snapshot().eventModel, point, selectedCourseId));
      }
      if (toolOptions.locations) {
        options.locations = toolOptions.locations;
      }
      this.store.updateEvent(model => {
        const selection = addSpecialAt(model, kind, point, options);
        model.metadata.pendingSelection = selection;
      }, `Add ${kind}`);
      const pending = this.store.snapshot().eventModel.metadata.pendingSelection;
      this.store.updateUi(ui => {
        ui.selection = pending;
        ui.tool = "select";
      }, "Select mode");
    }
  }

  addExistingControlToCurrentCourse(selection) {
    const state = this.store.snapshot();
    if (!selection?.id || !state.ui.selectedCourseId || state.ui.selectedCourseId === "all") return;
    const afterCourseControl = insertionCourseControlId(state);
    try {
      this.store.updateEvent(model => {
        const nextSelection = addExistingControlToCourse(model, state.ui.selectedCourseId, selection.id, { afterCourseControl });
        model.metadata.pendingSelection = nextSelection || selection;
      }, "Add existing control");
    }
    catch (error) {
      this.store.updateUi(ui => { ui.status = this.t(error.message || "Cannot add control to this course."); }, "Add existing control failed");
      return;
    }
    const pending = this.store.snapshot().eventModel.metadata.pendingSelection;
    this.store.updateUi(ui => {
      ui.selection = pending || selection;
      ui.tool = "select";
    }, "Select mode");
  }

  addDescriptionSpecial(point, options) {
    const state = this.store.snapshot();
    const targetCourseId = options?.allCourses ? "all" : options?.courses?.[0]?.course || state.ui.selectedCourseId || "all";
    const existing = existingDescriptionSpecialForTarget(state.eventModel, targetCourseId);
    if (existing) {
      this.selectExistingDescriptionSpecial(existing);
      return;
    }
    this.store.updateEvent(model => {
      const selection = addSpecialAt(model, "descriptions", point, options);
      model.metadata.pendingSelection = selection;
    }, "Add descriptions");
    const pending = this.store.snapshot().eventModel.metadata.pendingSelection;
    this.store.updateUi(ui => {
      ui.selection = pending;
      ui.tool = "select";
    }, "Select mode");
  }

  selectExistingDescriptionSpecial(special) {
    this.store.updateUi(ui => {
      ui.selection = { type: "special", id: special.id };
      ui.tool = "select";
      ui.status = this.t("This course already has a control description table.");
    }, "Select existing descriptions");
  }

  addManualLegCut(point, legHit) {
    if (!legHit?.leg) {
      this.store.updateUi(ui => { ui.status = "Click a purple course line to cut it."; }, "Cut line");
      return;
    }
    const gapSize = Math.max(0.5, Number(this.store.snapshot().eventModel.event.courseAppearance?.autoLegGapSize) || 3.5);
    this.store.updateEvent(model => {
      model.metadata.pendingSelection = null;
      const leg = ensureLegBetween(model, legHit.leg.from.control.id, legHit.leg.to.control.id);
      const points = legPathPoints(model, leg);
      const total = pathLength(points);
      if (total <= 0) return;
      const start = clamp(Number(legHit.pathDistance) - gapSize / 2, 0, Math.max(0, total - gapSize));
      leg.gaps = [...(leg.gaps || []), { start, length: Math.min(gapSize, total) }];
      model.metadata.pendingSelection = {
        type: "leg-gap",
        startControl: leg.startControl,
        endControl: leg.endControl,
        gapIndex: leg.gaps.length - 1
      };
    }, "Cut line");
    const pending = this.store.snapshot().eventModel.metadata.pendingSelection;
    if (!pending) return;
    this.store.updateUi(ui => {
      ui.selection = pending;
      ui.tool = "select";
    }, "Select cut");
  }

  moveLegGapHandle(selection, point) {
    this.store.updateEvent(model => {
      const leg = findLeg(model, selection.startControl, selection.endControl);
      const gap = leg?.gaps?.[selection.gapIndex];
      if (!leg || !gap) return;
      const position = distanceAlongPathAtPoint(legPathPoints(model, leg), point).distance;
      const total = pathLength(legPathPoints(model, leg));
      const minLength = 0.5;
      if (selection.handle === "gap-start") {
        const end = Math.min(total, gap.start + gap.length);
        gap.start = clamp(position, 0, Math.max(0, end - minLength));
        gap.length = Math.max(minLength, end - gap.start);
      }
      else if (selection.handle === "gap-end") {
        const end = clamp(position, gap.start + minLength, total);
        gap.length = Math.max(minLength, end - gap.start);
      }
    }, "Adjust line cut");
    this.store.updateUi(ui => { ui.selection = { type: "leg-gap", startControl: selection.startControl, endControl: selection.endControl, gapIndex: selection.gapIndex }; }, "Select cut");
  }

  addLegBend(selection, point) {
    if (selection?.type !== "leg") return;
    this.store.updateEvent(model => {
      model.metadata.pendingSelection = null;
      const leg = ensureLegBetween(model, selection.startControl, selection.endControl);
      const points = legPathPoints(model, leg);
      if (points.length < 2) return;
      const nearest = distanceAlongPathAtPoint(points, point);
      const bendPoint = pointAtPathDistance(points, nearest.distance);
      const bendIndex = clamp(bendInsertIndex(points, nearest.distance), 0, leg.bends.length);
      leg.bends.splice(bendIndex, 0, bendPoint);
      model.metadata.pendingSelection = {
        type: "leg-bend",
        startControl: leg.startControl,
        endControl: leg.endControl,
        bendIndex
      };
    }, "Add bend point");
    const pending = this.store.snapshot().eventModel.metadata.pendingSelection;
    if (!pending) return;
    this.store.updateUi(ui => {
      ui.selection = pending;
      ui.tool = "select";
    }, "Select bend");
  }

  moveLegBend(selection, point) {
    if (selection?.type !== "leg-bend") return;
    this.store.updateEvent(model => {
      const leg = findLeg(model, selection.startControl, selection.endControl);
      const index = Number(selection.bendIndex);
      if (!leg?.bends || !Number.isInteger(index) || index < 0 || index >= leg.bends.length) return;
      leg.bends[index] = { x: point.x, y: point.y };
    }, "Move bend point");
    this.store.updateUi(ui => {
      ui.selection = {
        type: "leg-bend",
        startControl: selection.startControl,
        endControl: selection.endControl,
        bendIndex: selection.bendIndex
      };
    }, "Select bend");
  }

  deleteLegBend(selection) {
    if (selection?.type !== "leg-bend") return;
    this.store.updateEvent(model => {
      const leg = findLeg(model, selection.startControl, selection.endControl);
      const index = Number(selection.bendIndex);
      if (!leg?.bends || !Number.isInteger(index) || index < 0 || index >= leg.bends.length) return;
      leg.bends.splice(index, 1);
    }, "Delete bend point");
    this.store.updateUi(ui => {
      ui.selection = {
        type: "leg",
        startControl: selection.startControl,
        endControl: selection.endControl
      };
      ui.tool = "select";
    }, "Select leg");
  }

  updateSelectionField(event) {
    const target = event.target;
    const state = this.store.snapshot();
    const selection = state.ui.selection;
    if (target.dataset.backgroundField !== undefined) {
      this.renderKeys = null;
      this.updateBackgroundField(target.dataset.backgroundField, target.value);
      return;
    }
    if (!selection) return;

    if (target.dataset.descriptionBox && selection.type === "control") {
      const storage = storageForIscdSelection(target.dataset.descriptionBox, target.value);
      this.store.updateEvent(model => {
        const control = getControl(model, selection.id);
        updateControlDescription(control, target.dataset.descriptionBox, storage.ref, storage.text);
      }, "Change description");
      return;
    }

    if (target.dataset.courseFinishRoute !== undefined && selection.type === "course") {
      this.store.updateEvent(model => setFinishRouteFlagging(model, selection.id, target.value), "Change finish route");
      return;
    }

    if (target.dataset.relayBranch !== undefined && selection.type === "course") {
      this.store.updateEvent(model => {
        const course = getCourse(model, selection.id);
        if (!course) return;
        course.relay ||= { firstTeam: 1, teams: 0, legs: 1, branches: [] };
        const branch = target.dataset.relayBranch;
        course.relay.branches = (course.relay.branches || []).filter(item => item.branch !== branch);
        const leg = Number(target.value) || 0;
        if (leg > 0) {
          course.relay.branches.push({ branch, leg });
        }
      }, "Change relay branch");
      return;
    }

    if (target.dataset.scoreFinishControl !== undefined && selection.type === "control") {
      this.store.updateEvent(model => {
        setScoreFinishControl(model, state.ui.selectedCourseId, selection.id, target.checked);
      }, "Change score finish route");
      return;
    }

    if (target.dataset.legFlagging !== undefined && ["leg", "leg-bend"].includes(selection.type)) {
      this.store.updateEvent(model => {
        const leg = ensureLegBetween(model, selection.startControl, selection.endControl);
        setLegFlaggingKind(model, leg, target.value || "none");
      }, "Change leg flagging");
      return;
    }

    if ((target.dataset.legFlagStart !== undefined || target.dataset.legFlagEnd !== undefined) && ["leg", "leg-bend"].includes(selection.type)) {
      this.store.updateEvent(model => {
        const leg = ensureLegBetween(model, selection.startControl, selection.endControl);
        const total = pathLength(legPathPoints(model, leg));
        const current = flaggingRangeForUi(model, leg, total);
        const startPercent = target.dataset.legFlagStart !== undefined ? Number(target.value) : current.startPercent;
        const endPercent = target.dataset.legFlagEnd !== undefined ? Number(target.value) : current.endPercent;
        setLegFlaggingRange(model, leg, startPercent, endPercent);
      }, "Change leg flagging");
      return;
    }

    if (target.dataset.specialColorPicker !== undefined || target.dataset.specialColorHex !== undefined) {
      const color = normalizeColorValue(target.value);
      if (color) {
        this.applySelectedSpecialColor(color);
      }
      return;
    }

    const field = target.dataset.field;
    if (!field) return;
    if (field === "special.kind") return;
    if (field === "special.descriptionTarget" && selection?.type === "special") {
      const existing = existingDescriptionSpecialForTarget(this.store.snapshot().eventModel, target.value, selection.id);
      if (existing) {
        this.selectExistingDescriptionSpecial(existing);
        return;
      }
    }
    this.store.updateEvent(model => {
      const object = objectForSelection(model, selection);
      if (!object) return;
      if (field === "control.punchPatternText") {
        object.punchPattern = {
          size: target.value.split(/\r?\n/).filter(Boolean)[0]?.length || 0,
          rows: target.value.split(/\r?\n/).map(row => row.trim()).filter(Boolean)
        };
        return;
      }
      if (field === "special.descriptionTarget" && object.kind === "descriptions") {
        object.allCourses = target.value === "all";
        object.courses = object.allCourses ? [] : [{ course: Number(target.value), part: -1 }];
        return;
      }
      if (field === "special.cellSize" && object.kind === "descriptions") {
        object.cellSize = Math.max(1.2, Number(target.value) || 5.2);
        return;
      }
      if (field.startsWith("special.font.")) {
        if (!object.font) {
          object.font = { name: "Arial", bold: false, italic: false, height: -1 };
        }
        if (field === "special.font.height") {
          object.font.height = target.value === "" ? -1 : Number(target.value);
          return;
        }
        setPath(object, field.split(".").slice(1), valueFromInput(target));
        return;
      }
      setPath(object, field.split(".").slice(1), valueFromInput(target));
    }, "Edit selection");
    // Re-render selection panel when kind or lineKind changes to show/hide relevant fields
    if (field === "special.lineKind" || field.startsWith("course.relay.") || field === "course.hideVariationsOnMap") {
      this.renderKeys = null;
      this.render(this.store.snapshot());
    }
  }

  updateBackgroundField(field, value) {
    const current = this.store.snapshot();
    if (field === "mapScale") {
      const previousScale = positiveScale(current.eventModel.event?.map?.scale) || 15000;
      const nextScale = positiveScale(value) || previousScale;
      this.store.updateEvent(model => applyMapScale(model, nextScale, previousScale), "Change map scale");
      this.store.updateUi(ui => {
        if (!ui.background) return;
        const background = ui.background;
        const aspect = backgroundAspect(background);
        const printedWidthCm = positiveNumber(background.printedWidthCm, background.widthMeters / previousScale * 100);
        background.printedWidthCm = printedWidthCm;
        background.widthMeters = printedWidthCm / 100 * nextScale;
        background.heightMeters = background.widthMeters * aspect;
        resetBackgroundCalibrationBase(background);
      }, "Edit map background");
      return;
    }
    this.store.updateUi(ui => {
      if (!ui.background) return;
      const background = ui.background;
      const aspect = backgroundAspect(background);
      if (field === "widthMeters") {
        const width = positiveNumber(value, background.widthMeters || 200);
        background.widthMeters = width;
        background.heightMeters = width * aspect;
        resetBackgroundCalibrationBase(background);
      }
      else if (field === "heightMeters") {
        const height = positiveNumber(value, background.heightMeters || 200 * aspect);
        background.heightMeters = height;
        background.widthMeters = height / aspect;
        resetBackgroundCalibrationBase(background);
      }
      else if (field === "printedWidthCm") {
        const printedWidthCm = positiveNumber(value, background.printedWidthCm || 0);
        const mapScale = positiveScale(current.eventModel.event?.map?.scale) || 15000;
        background.printedWidthCm = printedWidthCm;
        background.widthMeters = printedWidthCm / 100 * mapScale;
        background.heightMeters = background.widthMeters * aspect;
        resetBackgroundCalibrationBase(background);
      }
      else if (field === "calibrationDistanceMeters") {
        background.calibrationDistanceMeters = positiveNumber(value, 0);
        applyBackgroundCalibration(background, aspect);
      }
      else if (field === "calibrationPrintedCm") {
        const mapScale = positiveScale(this.store.snapshot().eventModel.event?.map?.scale) || 15000;
        background.calibrationPrintedCm = positiveNumber(value, 0);
        background.calibrationDistanceMeters = background.calibrationPrintedCm / 100 * mapScale;
        applyBackgroundCalibration(background, aspect);
      }
    }, "Edit map background");
  }

  openPpenFile(file) {
    if (!file || !this.confirmDirty()) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const model = parsePpen(String(reader.result), file.name);
        this.store.setEventModel(model, "Open file", false);
        this.store.markClean(file.name);
        this.store.resetHistory("Loaded file");
        this.store.updateUi(ui => {
          ui.selectedCourseId = sortedCourses(model)[0]?.id || "all";
          ui.selection = null;
          ui.pan = { x: 0, y: 0 };
          ui.zoom = 1;
        }, "Loaded");
      }
      catch (error) {
        alert(error.message);
      }
    };
    reader.readAsText(file);
  }

  async openBundledSample() {
    if (!this.confirmDirty()) return;
    try {
      const response = await fetch("./samples/standalone-sample.ppen");
      if (!response.ok) {
        throw new Error(`Could not load sample: ${response.status}`);
      }
      const model = parsePpen(await response.text(), "standalone-sample.ppen");
      this.store.setEventModel(model, "Open sample", false);
      this.store.markClean("standalone-sample.ppen");
      this.store.resetHistory("Loaded sample");
      this.store.updateUi(ui => {
        ui.selectedCourseId = sortedCourses(model)[0]?.id || "all";
        ui.selection = null;
        ui.pan = { x: 0, y: 0 };
        ui.zoom = 1;
      }, "Sample loaded");
    }
    catch (error) {
      alert(error.message);
    }
  }

  openMapFile(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const url = String(reader.result || "");
      const image = new Image();
      image.onload = () => {
        this.mapView.setBackground(url);
        this.mapView.setOmap(null);
        const metadata = backgroundMetadataForImage(file, url, image, this.store.snapshot().eventModel);
        this.store.updateUi(ui => {
          ui.background = metadata;
          ui.omap = null;
          ui.pan = { x: 0, y: 0 };
          ui.zoom = 1;
        }, "Map image loaded");
      };
      image.onerror = () => {
        alert(this.t("Could not import map image {name}. Convert PDF maps to an image if your browser cannot preview them directly.", {
          name: file.name || this.t("Unknown file")
        }));
      };
      image.src = url;
    };
    reader.readAsDataURL(file);
  }

  openOmapFile(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const omap = parseOmap(String(reader.result), file.name);
        const omapScale = positiveScale(omap.scale);
        this.mapView.setBackground("");
        this.mapView.setOmap(omap);
        if (omapScale) {
          this.store.updateEvent(model => applyImportedMapScale(model, omapScale), "OMAP map scale loaded");
        }
        this.store.updateUi(ui => {
          ui.omap = {
            name: file.name,
            objectCount: omap.objectCount,
            symbolCount: omap.symbolCount,
            scale: omapScale || omap.scale
          };
          ui.background = null;
          ui.pan = { x: 0, y: 0 };
          ui.zoom = 1;
        }, `OMAP map loaded: ${file.name}`);
      }
      catch (error) {
        alert(this.t("Could not import OMAP file {name}: {message}", {
          name: file.name || this.t("Unknown file"),
          message: error.message || String(error)
        }));
      }
      finally {
        this.querySelector("#omapInput").value = "";
      }
    };
    reader.readAsText(file);
  }

  downloadPpen() {
    const model = cloneEvent(this.store.snapshot().eventModel);
    const fileName = model.sourceName || "Untitled.ppen";
    download(fileName.endsWith(".ppen") ? fileName : `${baseName(fileName)}.ppen`, serializePpen(model), "application/xml");
    this.store.markClean(fileName);
  }

  exportPng() {
    const canvas = this.querySelector("#mapCanvas");
    canvas.toBlob(blob => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${baseName(this.store.snapshot().eventModel.sourceName)}.png`;
      a.click();
      URL.revokeObjectURL(url);
    }, "image/png");
  }

  async exportPdf() {
    const state = this.store.snapshot();
    const area = normalizePrintArea(state.ui.printAreaEdit?.preview || effectivePrintArea(state.eventModel, state.ui.selectedCourseId));
    if (area.automatic) {
      this.promptPrintArea();
      alert(this.t("Choose an export area first, then run Create PDF again."));
      return;
    }
    try {
      const page = pageSizeMm(area);
      const marginMm = pageMarginMm(area);
      const size = pdfPixelSize(page, marginMm);
      const hasRasterMap = this.mapView.hasBitmapBackground() && !this.mapView.omapMap;
      const blob = hasRasterMap
        ? await createRasterMapPdfBlob({
            pageWidthMm: page.width,
            pageHeightMm: page.height,
            marginMm,
            canvas: this.mapView.renderAreaToCanvas(state.eventModel, state.ui, area, size, {
              includeBitmapBackground: true,
              includePageBackground: false
            })
          })
        : await createVectorMapPdfBlob({
            pageWidthMm: page.width,
            pageHeightMm: page.height,
            marginMm,
            canvasWidth: size.width,
            canvasHeight: size.height,
            draw: ctx => this.mapView.renderAreaToContext(ctx, state.eventModel, state.ui, area, size, {
              includePageBackground: false
            })
          });
      downloadBlob(`${baseName(state.eventModel.sourceName)}.pdf`, blob);
    }
    catch (error) {
      alert(error.message || String(error));
    }
  }

  showReport(command) {
    const model = this.store.snapshot().eventModel;
    let title = "";
    let headers = [];
    let rows = [];
    if (command === "report-summary") {
      title = "Course Summary";
      headers = [
        { key: "course", label: "Course" },
        { key: "kind", label: "Kind" },
        { key: "controls", label: "Controls" },
        { key: "length", label: "Length", format: formatLength },
        { key: "climb", label: "Climb", format: value => value >= 0 ? `${value} m` : "" },
        { key: "load", label: "Load", format: value => value >= 0 ? value : "" }
      ];
      rows = createCourseSummary(model);
    }
    else if (command === "report-audit") {
      title = "Event Audit";
      headers = [
        { key: "severity", label: "Severity" },
        { key: "item", label: "Item" },
        { key: "message", label: "Message" }
      ];
      rows = createEventAudit(model);
    }
    else if (command === "report-leg-lengths") {
      title = "Leg Lengths";
      headers = [
        { key: "course", label: "Course" },
        { key: "from", label: "From" },
        { key: "to", label: "To" },
        { key: "length", label: "Length", format: formatLength }
      ];
      rows = createLegLengthRows(model);
    }
    else if (command === "report-crossref") {
      title = "Control Cross-reference";
      headers = [
        { key: "code", label: "Code" },
        { key: "kind", label: "Kind" },
        { key: "courses", label: "Courses", format: value => value.join(", ") }
      ];
      rows = createControlCrossref(model);
    }
    else if (command === "report-load") {
      const report = createLoadReport(model);
      title = "Control and Leg Load";
      headers = [
        { key: "code", label: "Control" },
        { key: "load", label: "Load" },
        { key: "courses", label: "Courses", format: value => value.join(", ") }
      ];
      rows = report.controls;
    }
    this.store.updateUi(ui => {
      ui.report = { title, rows, kind: command, html: tableHtml(title, headers, rows) };
    }, title);
    this.switchPanel("report");
  }

  showVariationReport() {
    const model = this.store.snapshot().eventModel;
    const courseId = this.store.snapshot().ui.selectedCourseId;
    if (courseId === "all") {
      alert(this.t("Select a course first."));
      return;
    }
    const course = getCourse(model, courseId);
    const variations = allCourseVariations(model, courseId);
    const variationRows = variations.map(variation => ({
      code: variation.code,
      controls: courseView(model, courseId, { variationChoices: variation.choices })
        .map(row => row.control.code || controlKindLabel(row.control.kind))
        .join(" - ")
    }));
    const relay = relayAssignments(model, courseId);
    const relayHtml = relay.rows.length
      ? `
        <h3>${escapeHtml(this.t("Relay assignments"))}</h3>
        ${this.relayAssignmentTable(relay)}
      `
      : "";
    const html = variations.length
      ? `
        ${tableHtml("Course Variation Report", [
          { key: "code", label: "Variation" },
          { key: "controls", label: "Controls" }
        ], variationRows)}
        ${relayHtml}
      `
      : `<p class="muted">${escapeHtml(this.t("This course has no variations."))}</p>`;
    this.store.updateUi(ui => {
      ui.report = {
        title: "Course Variation Report",
        rows: variationRows,
        kind: "variation",
        html
      };
    }, "Variation report");
    this.switchPanel("report");
  }

  switchPanel(panel) {
    const nextPanel = ["description", "variation", "report"].includes(panel) ? panel : "description";
    this.querySelector("#descriptionPanel").hidden = nextPanel !== "description";
    this.querySelector("#variationPanel").hidden = nextPanel !== "variation";
    this.querySelector("#reportPanel").hidden = nextPanel !== "report";
    const mobilePanelSelect = this.querySelector("#mobilePanelSelect");
    if (mobilePanelSelect) {
      mobilePanelSelect.value = nextPanel;
    }
    for (const button of this.querySelectorAll("[data-panel]")) {
      button.classList.toggle("active", button.dataset.panel === nextPanel);
    }
  }

  handleKey(event) {
    const key = event.key.toLowerCase();
    if ((event.ctrlKey || event.metaKey) && key === "o") {
      event.preventDefault();
      this.runCommand("open");
    }
    else if ((event.ctrlKey || event.metaKey) && key === "s") {
      event.preventDefault();
      this.runCommand("save");
    }
    else if ((event.ctrlKey || event.metaKey) && key === "z") {
      event.preventDefault();
      this.runCommand(event.shiftKey ? "redo" : "undo");
    }
    else if (event.key === "Delete" || event.key === "Backspace") {
      if (!["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement?.tagName)) {
        this.runCommand("delete");
      }
    }
    else if (event.key === "Escape") {
      this.runCommand("cancel");
    }
    else if (event.key === "F4") {
      event.preventDefault();
      this.runCommand("toggle-all-controls");
    }
  }

  openCommandDialog(config) {
    this.activeCommandDialog = config;
    this.querySelector("#commandTitle").textContent = this.t(config.title || "");
    this.querySelector("#commandBody").innerHTML = config.body || "";
    const hasActions = !!config.applyLabel;
    const actions = this.querySelector("#commandActions");
    actions.style.display = hasActions ? "" : "none";
    if (hasActions) {
      this.querySelector("#commandApplyButton").textContent = this.t(config.applyLabel || "Apply");
    }
    this.querySelector("#commandCloseButton").hidden = false;
    const message = this.querySelector("#commandMessage");
    message.hidden = !config.message;
    message.textContent = this.t(config.message || "");
    config.onOpen?.(this.querySelector("#commandDialog"));
    const dialog = this.querySelector("#commandDialog");
    if (!dialog.open) {
      if (dialog.show) {
        dialog.show();
      }
      else {
        dialog.setAttribute("open", "");
      }
    }
  }

  closeCommandDialog() {
    const dialog = this.querySelector("#commandDialog");
    this.activeCommandDialog = null;
    this.courseOrderDraft = null;
    if (dialog.open && dialog.close) {
      dialog.close();
    }
    else {
      dialog.removeAttribute("open");
    }
  }

  applyCommandDialog() {
    const config = this.activeCommandDialog;
    if (!config) return;
    const shouldClose = config.apply?.(this.querySelector("#commandDialog")) !== false;
    if (shouldClose) {
      this.closeCommandDialog();
    }
  }

  handleCommandDialogClick(event) {
    const symbolButton = event.target.closest("[data-iscd-symbol]");
    if (symbolButton) {
      event.preventDefault();
      this.applyIscdSymbolSelection(Number(symbolButton.dataset.controlId), symbolButton.dataset.box, symbolButton.dataset.iscdSymbol || "");
      this.closeCommandDialog();
      return;
    }
    const colorButton = event.target.closest("[data-dialog-color]");
    if (colorButton) {
      event.preventDefault();
      const dialog = this.querySelector("#commandDialog");
      const color = colorButton.dataset.dialogColor || "#000000";
      syncColorControls(dialog, color, "dialog");
      dialog?.querySelectorAll("[data-dialog-color]").forEach(button => {
        button.classList.toggle("selected", button === colorButton);
      });
      return;
    }
    const button = event.target.closest("[data-order-move]");
    if (!button) return;
    event.preventDefault();
    this.moveCourseOrderDraft(button.dataset.orderMove);
  }

  handleCommandDialogChange(event) {
    this.activeCommandDialog?.onChange?.(event, this.querySelector("#commandDialog"));
  }

  handleSelectionPanelClick(event) {
    const symbolButton = event.target.closest("[data-iscd-symbol]");
    if (symbolButton) {
      event.preventDefault();
      this.applyIscdSymbolSelection(Number(symbolButton.dataset.controlId), symbolButton.dataset.box, symbolButton.dataset.iscdSymbol || "");
      return;
    }
    if (event.target.closest("[data-background-calibrate]")) {
      this.store.updateUi(ui => {
        if (ui.background) {
          ui.background.calibration = { imagePoints: [] };
          ui.tool = "background-calibration";
          ui.selection = null;
          ui.status = this.t("Click two points on the map to calibrate the background.");
        }
      }, "Calibrate map background");
      return;
    }
    if (event.target.closest("[data-reset-control-number]")) {
      const selection = this.store.snapshot().ui.selection;
      if (selection?.type === "control-number") {
        this.store.updateEvent(model => resetControlNumberLocation(model, selection), "Reset control number");
      }
      return;
    }
    const colorButton = event.target.closest("[data-special-color]");
    if (colorButton) {
      const selection = this.store.snapshot().ui.selection;
      if (selection?.type === "special") {
        const color = colorButton.dataset.specialColor || "#000000";
        this.applySelectedSpecialColor(color);
      }
      return;
    }
    const button = event.target.closest("[data-select-leg-gap]");
    const selection = this.store.snapshot().ui.selection;
    if (event.target.closest("[data-add-leg-bend]") && ["leg", "leg-bend"].includes(selection?.type)) {
      this.store.updateUi(ui => {
        ui.selection = {
          type: "leg",
          startControl: selection.startControl,
          endControl: selection.endControl
        };
        ui.tool = "leg-bend-add";
        ui.status = this.t("Click the selected purple line to add a bend point.");
      }, "Add bend point mode");
      return;
    }
    if (event.target.closest("[data-delete-leg-bend]") && selection?.type === "leg-bend") {
      this.deleteLegBend(selection);
      return;
    }
    if (!button || !["leg", "leg-bend"].includes(selection?.type)) return;
    this.store.updateUi(ui => {
      ui.selection = {
        type: "leg-gap",
        startControl: selection.startControl,
        endControl: selection.endControl,
        gapIndex: Number(button.dataset.selectLegGap) || 0
      };
    }, "Select cut");
  }

  handleSelectionPanelInput(event) {
    const target = event.target;
    if (target.dataset.backgroundField !== undefined) {
      this.updateBackgroundField(target.dataset.backgroundField, target.value);
      this.syncBackgroundMeasurement();
      return;
    }
    if (target.dataset.specialColorPicker !== undefined) {
      syncColorControls(target.closest(".color-field"), target.value, "special");
      this.applySelectedSpecialColor(target.value, { transient: true });
      return;
    }
    if (target.dataset.specialColorHex !== undefined) {
      const color = normalizeHexColor(target.value);
      if (!color) return;
      syncColorControls(target.closest(".color-field"), color, "special");
      this.applySelectedSpecialColor(color, { transient: true });
    }
  }

  syncBackgroundMeasurement() {
    const output = this.querySelector("[data-background-measured]");
    const background = this.store.snapshot().ui.background;
    if (!output || !background) return;
    const measured = backgroundCalibrationDistance(background);
    output.textContent = measured
      ? `${this.t("Selected line")}: ${formatDecimal(measured)} m`
      : this.t("Click two points on the map, then enter their real distance.");
  }

  handleCommandDialogInput(event) {
    const target = event.target;
    if (target.dataset.dialogColorPicker !== undefined) {
      syncColorControls(target.closest(".color-field"), target.value, "dialog");
      return;
    }
    if (target.dataset.dialogColorValue !== undefined) {
      const color = normalizeHexColor(target.value);
      if (color) {
        syncColorControls(target.closest(".color-field"), color, "dialog");
      }
    }
  }

  applySelectedSpecialColor(color, options = {}) {
    const value = normalizeColorValue(color);
    if (!value) return;
    const selection = this.store.snapshot().ui.selection;
    if (selection?.type !== "special") return;
    if (options.transient) {
      const state = this.store.snapshot();
      const special = findById(state.eventModel.specials, selection.id);
      if (!special) return;
      special.color = value;
      state.eventModel.dirty = true;
      this.store.updateUi(ui => { ui.status = this.t("Ready"); }, "Preview special color");
      return;
    }
    this.store.updateEvent(model => {
      const special = findById(model.specials, selection.id);
      if (special) {
        special.color = value;
      }
    }, "Change special color");
  }

  bindWorkspaceResizer() {
    const workspace = this.querySelector(".workspace");
    const divider = this.querySelector("#workspaceDivider");
    if (!workspace || !divider) return;
    const saved = Number(localStorage.getItem("purplePenLeftPanelWidth") || 0);
    if (saved > 0) {
      workspace.style.setProperty("--left-panel-width", `${clamp(saved, 260, window.innerWidth - 360)}px`);
    }
    divider.addEventListener("pointerdown", event => {
      if (event.button !== 0) return;
      event.preventDefault();
      divider.setPointerCapture(event.pointerId);
      divider.classList.add("dragging");
      const rect = workspace.getBoundingClientRect();
      const move = moveEvent => {
        const width = clamp(moveEvent.clientX - rect.left, 260, Math.max(260, rect.width - 360));
        workspace.style.setProperty("--left-panel-width", `${width}px`);
        localStorage.setItem("purplePenLeftPanelWidth", String(Math.round(width)));
        this.mapView.requestDraw(this.store.snapshot());
      };
      const stop = stopEvent => {
        divider.classList.remove("dragging");
        divider.releasePointerCapture?.(stopEvent.pointerId);
        divider.removeEventListener("pointermove", move);
        divider.removeEventListener("pointerup", stop);
        divider.removeEventListener("pointercancel", stop);
        this.mapView.requestDraw(this.store.snapshot());
      };
      divider.addEventListener("pointermove", move);
      divider.addEventListener("pointerup", stop);
      divider.addEventListener("pointercancel", stop);
    });
  }

  enablePanelDrag(dialog) {
    const header = dialog?.querySelector(".dialog-heading");
    if (!dialog || !header) return;
    header.addEventListener("pointerdown", event => {
      if (event.button !== 0 || event.target.closest("button,input,select,textarea")) {
        return;
      }
      this.startPanelDrag(event, dialog, header);
    });
  }

  startPanelDrag(event, dialog, handle) {
    event.preventDefault();
    event.stopPropagation();
    const rect = dialog.getBoundingClientRect();
    const drag = {
      dialog,
      offsetX: event.clientX - rect.left,
      offsetY: event.clientY - rect.top
    };
    const move = moveEvent => this.movePanelDrag(moveEvent, drag);
    const stop = stopEvent => {
      stopEvent?.preventDefault?.();
      dialog.classList.remove("dragging");
      handle.releasePointerCapture?.(stopEvent?.pointerId ?? event.pointerId);
      document.removeEventListener("pointermove", move);
      document.removeEventListener("pointerup", stop);
      document.removeEventListener("pointercancel", stop);
    };
    dialog.classList.add("dragging");
    handle.setPointerCapture?.(event.pointerId);
    document.addEventListener("pointermove", move);
    document.addEventListener("pointerup", stop);
    document.addEventListener("pointercancel", stop);
    this.movePanelDrag(event, drag);
  }

  movePanelDrag(event, drag) {
    event.preventDefault();
    const margin = 8;
    const rect = drag.dialog.getBoundingClientRect();
    const left = clamp(event.clientX - drag.offsetX, margin, window.innerWidth - rect.width - margin);
    const top = clamp(event.clientY - drag.offsetY, margin, window.innerHeight - rect.height - margin);
    drag.dialog.style.left = `${left}px`;
    drag.dialog.style.top = `${top}px`;
    drag.dialog.style.right = "auto";
    drag.dialog.style.bottom = "auto";
  }

  previewMoveSelection(selection, point) {
    this.store.updateUi(ui => {
      ui.movePreview = selection && point
        ? { selection: { ...selection }, location: { x: point.x, y: point.y } }
        : null;
    }, "Move preview");
  }

  commitMoveSelection(selection, point) {
    if (selection?.type === "leg-gap") {
      this.store.updateUi(ui => { ui.movePreview = null; }, "Select cut");
      return;
    }
    if (selection?.type === "control-number") {
      this.store.updateEvent(model => setControlNumberLocation(model, selection, point), "Move control number");
      this.store.updateUi(ui => {
        ui.movePreview = null;
      }, "Move control number");
      return;
    }
    this.store.updateEvent(model => moveSelection(model, selection, point), "Move item");
    this.store.updateUi(ui => {
      ui.movePreview = null;
    }, "Move item");
  }

  previewResizeSelection(selection, anchor, point) {
    const state = this.store.snapshot();
    const special = selection?.type === "special" ? findById(state.eventModel.specials, selection.id) : null;
    const preview = special && anchor && point
      ? resizedSpecialObject(state.eventModel, special, anchor, point, state.ui.selectedCourseId)
      : null;
    this.store.updateUi(ui => {
      ui.resizePreview = preview ? { selection: { type: "special", id: special.id }, special: preview } : null;
    }, "Resize preview");
  }

  commitResizeSelection(selection, anchor, point) {
    const state = this.store.snapshot();
    const special = selection?.type === "special" ? findById(state.eventModel.specials, selection.id) : null;
    if (!special || !anchor || !point) {
      this.store.updateUi(ui => { ui.resizePreview = null; }, "Resize item");
      return;
    }
    const replacement = resizedSpecialObject(state.eventModel, special, anchor, point, state.ui.selectedCourseId);
    this.store.updateEvent(model => replaceSpecial(model, selection.id, replacement), "Resize special object");
    this.store.updateUi(ui => {
      ui.resizePreview = null;
    }, "Resize special object");
  }

  promptEventTitle(eventModel) {
    const current = eventModel.event.title || "Untitled Event";
    this.openCommandDialog({
      title: "Change Event Title",
      body: `
        <div class="form-grid compact-form">
          <label>${escapeHtml(this.t("Title"))}
            <input id="eventTitleChoice" value="${escapeAttr(current)}">
          </label>
        </div>
      `,
      apply: dialog => {
        const title = dialog.querySelector("#eventTitleChoice").value || "Untitled Event";
        this.store.updateEvent(model => { model.event.title = title; }, "Change title");
      }
    });
  }

  promptMapScale(eventModel) {
    const current = Number(eventModel.event.map.scale) || 15000;
    this.openCommandDialog({
      title: "Change Map Scale",
      body: `
        <div class="form-grid compact-form">
          <label>${escapeHtml(this.t("Scale"))}
            <input id="mapScaleChoice" type="number" min="1" step="1" value="${current}">
          </label>
        </div>
      `,
      apply: dialog => {
        const scale = Number(dialog.querySelector("#mapScaleChoice").value) || current;
        this.store.updateEvent(model => applyMapScale(model, scale, current), "Change map scale");
      }
    });
  }

  promptDescriptionLanguage(eventModel) {
    const current = eventModel.event.descriptions.lang || "en";
    const languages = DESCRIPTION_LANGUAGES.some(([code]) => code === current)
      ? DESCRIPTION_LANGUAGES
      : [[current, current], ...DESCRIPTION_LANGUAGES];
    this.openCommandDialog({
      title: "Description Language",
      body: `
        <div class="form-grid compact-form">
          <label>${escapeHtml(this.t("Language"))}
            <select id="descriptionLanguageChoice">
              ${languages.map(([code, label]) => `<option value="${escapeAttr(code)}" ${code === current ? "selected" : ""}>${escapeHtml(label)}</option>`).join("")}
            </select>
          </label>
        </div>
      `,
      apply: dialog => {
        const lang = dialog.querySelector("#descriptionLanguageChoice").value || "en";
        this.store.updateEvent(model => {
          model.event.descriptions.lang = lang;
          model.event.descriptionLangId = lang;
        }, "Description language");
      }
    });
  }

  promptAutoNumber(eventModel) {
    const current = Number(eventModel.event.numbering.start) || 31;
    this.openCommandDialog({
      title: "Auto Numbering",
      body: `
        <div class="form-grid compact-form">
          <label>${escapeHtml(this.t("First control code"))}
            <input id="autoNumberStart" type="number" min="1" step="1" value="${current}">
          </label>
          <label class="dialog-check"><input id="autoNumberDisallow" type="checkbox" ${eventModel.event.numbering.disallowInvertible ? "checked" : ""}> ${escapeHtml(this.t("Avoid invertible codes"))}</label>
        </div>
      `,
      apply: dialog => {
        const start = Number(dialog.querySelector("#autoNumberStart").value) || 31;
        const disallow = dialog.querySelector("#autoNumberDisallow").checked;
        this.store.updateEvent(model => autoNumberControls(model, start, disallow), "Auto numbering");
      }
    });
  }

  promptMoveAll() {
    this.openCommandDialog({
      title: "Move All Controls",
      body: `
        <div class="form-grid compact-form">
          <label>${escapeHtml(this.t("Direction"))}
            <select id="moveAllDirection">
              <option value="east">${escapeHtml(this.t("East"))}</option>
              <option value="west">${escapeHtml(this.t("West"))}</option>
              <option value="north">${escapeHtml(this.t("North"))}</option>
              <option value="south">${escapeHtml(this.t("South"))}</option>
              <option value="northeast">${escapeHtml(this.t("Northeast"))}</option>
              <option value="northwest">${escapeHtml(this.t("Northwest"))}</option>
              <option value="southeast">${escapeHtml(this.t("Southeast"))}</option>
              <option value="southwest">${escapeHtml(this.t("Southwest"))}</option>
            </select>
          </label>
          <label>${escapeHtml(this.t("Distance"))}
            <select id="moveAllDistance">${selectOptions(MOVE_DISTANCE_CHOICES, 10, value => `${value} ${this.t("map units")}`)}</select>
          </label>
        </div>
      `,
      apply: dialog => {
        const vector = directionVector(dialog.querySelector("#moveAllDirection").value);
        const distance = Number(dialog.querySelector("#moveAllDistance").value) || 0;
        this.store.updateEvent(model => moveAllControls(model, vector.x * distance, vector.y * distance), "Move all controls");
      }
    });
  }

  promptPrintArea() {
    this.openPrintAreaDialog();
  }

  openPrintAreaDialog() {
    const state = this.store.snapshot();
    this.printAreaDialogPreviousShowPrintArea = state.ui.showPrintArea;
    this.printAreaDialogPreviousTool = state.ui.tool;
    this.populatePrintAreaScopeOptions(state);
    this.syncPrintAreaDialogFromScope();
    const dialog = this.querySelector("#printAreaDialog");
    if (dialog.open) {
      this.updatePrintAreaDialogPreview();
      return;
    }
    if (dialog.show) {
      dialog.show();
    }
    else {
      dialog.setAttribute("open", "");
    }
    this.updatePrintAreaDialogPreview();
  }

  closePrintAreaDialog(clearPreview = true) {
    const dialog = this.querySelector("#printAreaDialog");
    this.keepPrintAreaDialogPreview = !clearPreview;
    if (dialog.open && dialog.close) {
      dialog.close();
    }
    else {
      dialog.removeAttribute("open");
      if (clearPreview) {
        this.clearPrintAreaDialogPreview();
      }
      this.keepPrintAreaDialogPreview = false;
    }
  }

  populatePrintAreaScopeOptions(state) {
    const select = this.querySelector("#printAreaScope");
    const currentCourse = state.ui.selectedCourseId === "all" ? null : getCourse(state.eventModel, state.ui.selectedCourseId);
    select.innerHTML = [
      `<option value="${PRINT_AREA_SCOPES.ALL}">${escapeHtml(this.t("All courses"))}</option>`,
      currentCourse
        ? `<option value="course:${currentCourse.id}">${escapeHtml(this.t("Current course"))}: ${escapeHtml(currentCourse.name)}</option>`
        : `<option value="course" disabled>${escapeHtml(this.t("Current course"))}</option>`,
      `<option value="${PRINT_AREA_SCOPES.ALL_CONTROLS}">${escapeHtml(this.t("All Controls"))}</option>`
    ].join("");
    select.value = currentCourse ? `course:${currentCourse.id}` : PRINT_AREA_SCOPES.ALL;
  }

  syncPrintAreaDialogFromScope() {
    const state = this.store.snapshot();
    const target = this.printAreaTargetFromDialog();
    if (!target) return;
    const current = currentPrintAreaForTarget(state.eventModel, state.ui, target);
    this.populatePaperSizeOptions(current);
    this.populateMarginOptions(current);
    this.querySelector("#printAreaOrientation").value = current.pageLandscape ? "landscape" : "portrait";
    this.querySelector("#printAreaRestrict").checked = !!current.restrictToPageSize;
    this.querySelector(`input[name="printAreaMode"][value="${current.restrictToPageSize || current.automatic ? "frame" : "draw"}"]`).checked = true;
    this.renderPrintAreaDialogSummary();
    this.updatePrintAreaDialogPreview();
  }

  populatePaperSizeOptions(area) {
    const select = this.querySelector("#printAreaPaper");
    const match = findPaperSize(area.pageWidth, area.pageHeight);
    const customSelected = !area.restrictToPageSize && !area.automatic;
    const options = PAPER_SIZES.map(size => paperOptionHtml(size, size.id === match?.id && !customSelected));
    if (!match && !customSelected) {
      const current = {
        id: "current",
        label: `${this.t("Current file size")} (${formatPageSize(area.pageWidth, area.pageHeight)})`,
        width: area.pageWidth,
        height: area.pageHeight
      };
      options.unshift(paperOptionHtml(current, true));
    }
    options.push(paperOptionHtml({
      id: "custom",
      label: "Custom drawn area",
      width: area.pageWidth,
      height: area.pageHeight,
      custom: true
    }, customSelected));
    select.innerHTML = options.join("");
  }

  populateMarginOptions(area) {
    const select = this.querySelector("#printAreaMargins");
    const match = PAPER_MARGINS.find(option => nearlySame(option.value, area.pageMargins));
    const options = PAPER_MARGINS.map(option => marginOptionHtml(option, option.id === match?.id));
    if (!match) {
      const current = {
        id: "current",
        label: `${this.t("Current")} (${formatMargin(area.pageMargins)})`,
        value: area.pageMargins
      };
      options.unshift(marginOptionHtml(current, true));
    }
    select.innerHTML = options.join("");
  }

  renderPrintAreaDialogSummary() {
    const state = this.store.snapshot();
    const target = this.printAreaTargetFromDialog();
    const summary = this.querySelector("#printAreaSummary");
    if (!target || !summary) return;
    const mode = selectedRadioValue(this, "printAreaMode");
    const paper = this.querySelector("#printAreaPaper").selectedOptions[0]?.textContent || "";
    const orientation = this.querySelector("#printAreaOrientation").value;
    summary.textContent = `${this.t(printAreaTargetLabel(state.eventModel, target))} | ${modeLabel(mode)} | ${paper} | ${this.t(orientation)}`;
  }

  syncPrintAreaModeForPaper() {
    const custom = this.printAreaPaperIsCustom();
    this.querySelector(`input[name="printAreaMode"][value="${custom ? "draw" : "frame"}"]`).checked = true;
    this.querySelector("#printAreaRestrict").checked = !custom;
  }

  updatePrintAreaDialogPreview() {
    const dialog = this.querySelector("#printAreaDialog");
    if (!dialog.open) return;
    const state = this.store.snapshot();
    const target = this.printAreaTargetFromDialog();
    if (!target) return;
    const current = currentPrintAreaForTarget(state.eventModel, state.ui, target);
    const base = normalizePrintArea({ ...current, ...this.printAreaSettingsFromDialog() });
    const mode = selectedRadioValue(this, "printAreaMode");
    const preview = this.printAreaDialogPreviewArea(current, base, mode);
    const tool = mode === "frame" ? "print-area-frame" : mode === "draw" ? "print-area" : "select";

    this.store.updateUi(ui => {
      ui.showPrintArea = true;
      ui.tool = tool;
      ui.printAreaEdit = {
        target,
        area: base,
        preview,
        dialogPreview: true
      };
    }, "Print area preview");
  }

  clearPrintAreaDialogPreview() {
    if (!this.store.snapshot().ui.printAreaEdit?.dialogPreview) return;
    const restoreShowPrintArea = !!this.printAreaDialogPreviousShowPrintArea;
    const restoreTool = this.printAreaDialogPreviousTool || "select";
    this.store.updateUi(ui => {
      if (ui.printAreaEdit?.dialogPreview) {
        ui.printAreaEdit = null;
        ui.showPrintArea = restoreShowPrintArea;
        ui.tool = restoreTool;
      }
    }, "Print area");
    this.printAreaDialogPreviousShowPrintArea = null;
    this.printAreaDialogPreviousTool = null;
  }

  printAreaDialogPreviewArea(current, base, mode) {
    if (mode === "automatic") {
      return normalizePrintArea({ ...base, automatic: true });
    }
    if (mode === "frame") {
      const existingPreview = this.store.snapshot().ui.printAreaEdit?.dialogPreview
        ? this.store.snapshot().ui.printAreaEdit.preview
        : null;
      const center = existingPreview
        ? printAreaCenter(existingPreview)
        : current.automatic
          ? boundsCenter(this.mapView.currentViewBounds(this.store.snapshot().ui))
          : printAreaCenter(current);
      return printAreaFixedFrameAt(center, base, this.store.snapshot().eventModel, this.printAreaTargetFromDialog());
    }
    if (mode === "draw") {
      const existingPreview = this.store.snapshot().ui.printAreaEdit?.dialogPreview
        ? this.store.snapshot().ui.printAreaEdit.preview
        : null;
      if (existingPreview && !existingPreview.automatic) {
        return normalizePrintArea({ ...existingPreview, ...this.printAreaSettingsFromDialog(), automatic: false, restrictToPageSize: false });
      }
      return current.automatic ? null : normalizePrintArea({ ...current, ...this.printAreaSettingsFromDialog(), automatic: false, restrictToPageSize: false });
    }
    if (mode === "viewport") {
      return printAreaFromBounds(this.mapView.currentViewBounds(this.store.snapshot().ui), base);
    }
    return printAreaFromBounds(current, base);
  }

  applyPrintAreaDialog() {
    const state = this.store.snapshot();
    const target = this.printAreaTargetFromDialog();
    if (!target) return;
    const current = currentPrintAreaForTarget(state.eventModel, state.ui, target);
    const settings = this.printAreaSettingsFromDialog();
    const base = normalizePrintArea({ ...current, ...settings });
    const mode = selectedRadioValue(this, "printAreaMode");
    const label = printAreaTargetLabel(state.eventModel, target);
    const preview = state.ui.printAreaEdit?.dialogPreview ? state.ui.printAreaEdit.preview : null;
    if ((mode === "frame" || mode === "draw") && !preview) {
      alert(this.t(mode === "draw" ? "Draw a custom print area on the map first." : "Move the paper-size frame on the map first."));
      return;
    }

    const area = mode === "frame" || mode === "draw"
      ? normalizePrintArea({ ...preview, ...settings, automatic: false, restrictToPageSize: mode === "frame" })
      : mode === "viewport"
      ? printAreaFromBounds(this.mapView.currentViewBounds(state.ui), base)
      : normalizePrintArea({ ...base, automatic: mode === "automatic" });

    this.closePrintAreaDialog(false);
    this.printAreaDialogPreviousShowPrintArea = null;
    this.store.updateEvent(model => setPrintArea(model, target, area), `Set print area (${label})`);
    this.store.updateUi(ui => {
      ui.showPrintArea = true;
      ui.printAreaEdit = null;
      ui.tool = "select";
    }, mode === "automatic" ? `Print area automatic for ${label}` : `Print area set for ${label}`);
  }

  printAreaTargetFromDialog() {
    const value = this.querySelector("#printAreaScope")?.value || PRINT_AREA_SCOPES.ALL;
    if (value.startsWith("course:")) {
      return { scope: PRINT_AREA_SCOPES.COURSE, courseId: Number(value.split(":")[1]) };
    }
    if (value === PRINT_AREA_SCOPES.ALL_CONTROLS) {
      return { scope: PRINT_AREA_SCOPES.ALL_CONTROLS };
    }
    return { scope: PRINT_AREA_SCOPES.ALL };
  }

  printAreaSettingsFromDialog() {
    const paperOption = this.querySelector("#printAreaPaper").selectedOptions[0];
    const marginOption = this.querySelector("#printAreaMargins").selectedOptions[0];
    const custom = this.printAreaPaperIsCustom();
    return {
      pageWidth: Number(paperOption?.dataset.width) || 850,
      pageHeight: Number(paperOption?.dataset.height) || 1100,
      pageMargins: Number(marginOption?.dataset.value) || 0,
      pageLandscape: this.querySelector("#printAreaOrientation").value === "landscape",
      restrictToPageSize: custom ? false : this.querySelector("#printAreaRestrict").checked
    };
  }

  printAreaPaperIsCustom() {
    return this.querySelector("#printAreaPaper").selectedOptions[0]?.dataset.custom === "true";
  }

  previewPrintArea(start, end) {
    const edit = this.store.snapshot().ui.printAreaEdit;
    if (!edit) return;
    const preview = printAreaFromPoints(start, end, edit.dialogPreview ? { ...edit.area, restrictToPageSize: false } : edit.area);
    this.store.updateUi(ui => {
      if (ui.printAreaEdit) {
        ui.printAreaEdit.preview = preview;
      }
    }, "Drag print area");
  }

  movePrintAreaFrame(center) {
    const state = this.store.snapshot();
    const edit = state.ui.printAreaEdit;
    if (!edit?.dialogPreview) return;
    const area = printAreaFixedFrameAt(center, edit.area, state.eventModel, edit.target);
    this.store.updateUi(ui => {
      if (ui.printAreaEdit?.dialogPreview) {
        ui.printAreaEdit.preview = area;
      }
    }, "Move print area frame");
  }

  commitPrintArea(start, end) {
    const state = this.store.snapshot();
    const edit = state.ui.printAreaEdit;
    if (!edit) return;
    const area = printAreaFromPoints(start, end, edit.area);
    if (Math.abs(area.right - area.left) < 0.1 || Math.abs(area.top - area.bottom) < 0.1) {
      this.store.updateUi(ui => {
        ui.printAreaEdit.preview = null;
      }, "Print area unchanged");
      return;
    }
    const target = edit.target;
    if (edit.dialogPreview) {
      this.store.updateUi(ui => {
        if (ui.printAreaEdit?.dialogPreview) {
          ui.printAreaEdit.preview = area;
        }
      }, "Print area preview");
      return;
    }
    const label = printAreaTargetLabel(state.eventModel, target);
    this.store.updateEvent(model => setPrintArea(model, target, area), `Set print area (${label})`);
    this.store.updateUi(ui => {
      ui.tool = "select";
      ui.printAreaEdit = null;
      ui.showPrintArea = true;
    }, `Print area set for ${label}`);
  }

  promptAppearance() {
    const current = this.store.snapshot().eventModel.event.courseAppearance;
    const ratio = Number(current.controlCircleSizeRatio) || 1;
    this.openCommandDialog({
      title: "Course Appearance",
      body: `
        <div class="form-grid compact-form">
          <label>${escapeHtml(this.t("Control circle size"))}
            <select id="appearanceCircleRatio">
              ${selectOptions(uniqueNumbers([ratio, 0.75, 0.9, 1, 1.1, 1.25, 1.5]), ratio, value => `${Math.round(value * 100)}%`)}
            </select>
          </label>
        </div>
      `,
      apply: dialog => {
        this.store.updateEvent(model => {
          model.event.courseAppearance.controlCircleSizeRatio = Number(dialog.querySelector("#appearanceCircleRatio").value) || 1;
        }, "Course appearance");
      }
    });
  }

  promptAddCourse() {
    const nextName = `Course ${this.store.snapshot().eventModel.courses.length + 1}`;
    this.openCommandDialog({
      title: "Add Course",
      body: `
        <div class="form-grid compact-form">
          <label>${escapeHtml(this.t("Name"))}
            <input id="addCourseName" list="courseNameChoices" value="${escapeAttr(nextName)}">
            <datalist id="courseNameChoices">${COURSE_NAMES.map(name => `<option value="${escapeAttr(name)}"></option>`).join("")}</datalist>
          </label>
          <label>${escapeHtml(this.t("Kind"))}
            <select id="addCourseKind">
              <option value="normal">${escapeHtml(this.t("Normal course"))}</option>
              <option value="score">${escapeHtml(this.t("Score course"))}</option>
            </select>
          </label>
        </div>
      `,
      apply: dialog => {
        const name = dialog.querySelector("#addCourseName").value || nextName;
        const kind = dialog.querySelector("#addCourseKind").value || "normal";
        this.store.updateEvent(model => {
          const selection = addCourse(model, name, kind);
          model.metadata.pendingSelection = selection;
        }, "Add course");
        const selection = this.store.snapshot().eventModel.metadata.pendingSelection;
        this.store.updateUi(ui => {
          ui.selectedCourseId = selection.id;
          ui.selection = selection;
        }, "Select course");
      }
    });
  }

  promptDeleteCourse() {
    const state = this.store.snapshot();
    if (state.ui.selectedCourseId === "all") {
      alert(this.t("Select a course first."));
      return;
    }
    const course = getCourse(state.eventModel, state.ui.selectedCourseId);
    this.openCommandDialog({
      title: "Delete Course",
      message: this.t("Delete {course}?", { course: course?.name || this.t("the current course") }),
      body: `
        <fieldset class="choice-group single-column">
          <label><input type="radio" name="deleteCourseConfirm" value="no" checked> ${escapeHtml(this.t("Keep course"))}</label>
          <label><input type="radio" name="deleteCourseConfirm" value="yes"> ${escapeHtml(this.t("Delete course"))}</label>
        </fieldset>
      `,
      applyLabel: "Continue",
      apply: dialog => {
        if (selectedRadioValue(dialog, "deleteCourseConfirm") !== "yes") {
          return;
        }
        this.store.updateEvent(model => deleteSelection(model, { type: "course", id: state.ui.selectedCourseId }), "Delete course");
        this.store.updateUi(ui => { ui.selectedCourseId = "all"; ui.selection = null; }, "All controls");
      }
    });
  }

  deleteSelectedControl(state = this.store.snapshot()) {
    const selection = state.ui.selection;
    if (selection?.type !== "control") return;
    if (state.ui.selectedCourseId !== "all") {
      this.store.updateEvent(model => deleteSelection(model, selection, {
        selectedCourseId: state.ui.selectedCourseId
      }), "Remove control from course");
      this.store.setSelection(null);
      return;
    }

    const control = getControl(state.eventModel, selection.id);
    const courses = coursesUsingControl(state.eventModel, selection.id);
    if (!courses.length) {
      this.store.updateEvent(model => deleteSelection(model, selection, {
        selectedCourseId: "all"
      }), "Delete control");
      this.store.setSelection(null);
      return;
    }

    this.openCommandDialog({
      title: "Delete Control",
      message: this.t("{control} is used by {count} course(s).", { control: controlDisplayName(control), count: courses.length }),
      body: `
        <p class="muted">${escapeHtml(this.t("Deleting it from All Controls will also remove it from:"))}</p>
        <ul class="confirm-list">${courses.map(course => `<li>${escapeHtml(course.name || `Course ${course.id}`)}</li>`).join("")}</ul>
        <fieldset class="choice-group single-column">
          <label><input type="radio" name="deleteControlConfirm" value="no" checked> ${escapeHtml(this.t("Keep control"))}</label>
          <label><input type="radio" name="deleteControlConfirm" value="yes"> ${escapeHtml(this.t("Delete from all courses"))}</label>
        </fieldset>
      `,
      applyLabel: "Continue",
      apply: dialog => {
        if (selectedRadioValue(dialog, "deleteControlConfirm") !== "yes") {
          return;
        }
        this.store.updateEvent(model => deleteSelection(model, selection, {
          selectedCourseId: "all"
        }), "Delete control");
        this.store.setSelection(null);
      }
    });
  }

  promptDuplicateCourse() {
    const courseId = this.store.snapshot().ui.selectedCourseId;
    if (courseId === "all") {
      alert(this.t("Select a course first."));
      return;
    }
    const course = getCourse(this.store.snapshot().eventModel, courseId);
    const choices = [`${course.name} Copy`, `${course.name} A`, `${course.name} B`, `${course.name} Training`];
    this.openCommandDialog({
      title: "Duplicate Course",
      body: `
        <div class="form-grid compact-form">
          <label>${escapeHtml(this.t("New name"))}
            <input id="duplicateCourseName" list="duplicateCourseNameChoices" value="${escapeAttr(choices[0])}">
            <datalist id="duplicateCourseNameChoices">${choices.map(name => `<option value="${escapeAttr(name)}"></option>`).join("")}</datalist>
          </label>
        </div>
      `,
      apply: dialog => {
        const name = dialog.querySelector("#duplicateCourseName").value || choices[0];
        this.store.updateEvent(model => {
          const selection = duplicateCourse(model, courseId, name);
          model.metadata.pendingSelection = selection;
        }, "Duplicate course");
        const selection = this.store.snapshot().eventModel.metadata.pendingSelection;
        this.store.updateUi(ui => {
          ui.selectedCourseId = selection.id;
          ui.selection = selection;
        }, "Select course");
      }
    });
  }

  promptCourseOrder() {
    const courses = sortedCourses(this.store.snapshot().eventModel);
    this.courseOrderDraft = courses.map(course => course.id);
    this.openCommandDialog({
      title: "Course Order",
      body: `
        <div class="course-order-editor">
          <select id="courseOrderList" size="${Math.min(8, Math.max(3, courses.length))}">
            ${courses.map(course => `<option value="${course.id}">${escapeHtml(course.name)}</option>`).join("")}
          </select>
          <div class="course-order-buttons">
            <button type="button" data-order-move="up">${escapeHtml(this.t("Move Up"))}</button>
            <button type="button" data-order-move="down">${escapeHtml(this.t("Move Down"))}</button>
          </div>
        </div>
      `,
      onOpen: dialog => {
        dialog.querySelector("#courseOrderList").selectedIndex = 0;
      },
      apply: () => {
        this.store.updateEvent(model => setCourseOrder(model, this.courseOrderDraft || []), "Course order");
      }
    });
  }

  promptCourseLoad() {
    const courseId = this.store.snapshot().ui.selectedCourseId;
    if (courseId === "all") {
      alert(this.t("Select a course first."));
      return;
    }
    const course = getCourse(this.store.snapshot().eventModel, courseId);
    const current = course.options.load >= 0 ? course.options.load : -1;
    this.openCommandDialog({
      title: "Course Load",
      body: `
        <div class="form-grid compact-form">
          <label>${escapeHtml(this.t("Competitor load"))}
            <input id="courseLoadChoice" type="number" min="-1" step="1" value="${current}">
          </label>
        </div>
      `,
      apply: dialog => {
        this.store.updateEvent(model => {
          getCourse(model, courseId).options.load = Number(dialog.querySelector("#courseLoadChoice").value);
        }, "Course load");
      }
    });
  }

  openTextSpecialDialog(point) {
    const textColor = "upper-purple";
    const textFont = "Arial";
    const textHex = colorToHex(textColor);
    this.openCommandDialog({
      title: "Add Text",
      body: `
        <div class="form-grid compact-form">
          <label class="span-2">${escapeHtml(this.t("Text"))}
            <input id="textSpecialPreset" list="textSpecialChoices" value="${escapeAttr(this.t("Text"))}">
            <datalist id="textSpecialChoices">${TEXT_PRESETS.map(text => `<option value="${escapeAttr(this.t(text))}"></option>`).join("")}</datalist>
          </label>
          <div class="color-field span-2" role="group" aria-label="${escapeAttr(this.t("Color"))}">
            <span>${escapeHtml(this.t("Color"))}</span>
            <div class="color-spectrum-row">
              <input id="textSpecialColorPicker" class="color-spectrum" type="color" data-dialog-color-picker value="${escapeAttr(textHex)}" aria-label="${escapeAttr(this.t("Color spectrum"))}">
              <input id="textSpecialColor" class="color-value-input" data-dialog-color-value value="${escapeAttr(textHex)}" aria-label="${escapeAttr(this.t("Hex color"))}" pattern="#[0-9A-Fa-f]{6}">
            </div>
            <div class="color-swatches">
              ${SPECIAL_COLOR_CHOICES.map(([value, swatch, label]) => `
                <button
                  type="button"
                  class="color-swatch ${value === textColor ? "selected" : ""}"
                  data-dialog-color="${escapeAttr(value)}"
                  style="--swatch:${escapeAttr(swatch)}"
                  aria-label="${escapeAttr(colorChoiceLabel(value, label))}"
                  title="${escapeAttr(colorChoiceLabel(value, label))}">
                </button>
              `).join("")}
            </div>
          </div>
          <label>${escapeHtml(this.t("Font"))} <select id="textSpecialFont">${fontOptions(textFont)}</select></label>
          <label class="check"><input id="textSpecialBold" type="checkbox"> ${escapeHtml(this.t("Bold"))}</label>
          <label class="check"><input id="textSpecialItalic" type="checkbox"> ${escapeHtml(this.t("Italic"))}</label>
        </div>
      `,
      apply: dialog => {
        const text = dialog.querySelector("#textSpecialPreset").value || this.t("Text");
        const color = dialog.querySelector("#textSpecialColor").value || "upper-purple";
        const fontName = dialog.querySelector("#textSpecialFont").value || "Arial";
        const bold = dialog.querySelector("#textSpecialBold").checked;
        const italic = dialog.querySelector("#textSpecialItalic").checked;
        this.store.updateEvent(model => {
          const selection = addSpecialAt(model, "text", point, { text, color, font: { name: fontName, bold, italic, height: -1 } });
          model.metadata.pendingSelection = selection;
        }, "Add text");
        const pending = this.store.snapshot().eventModel.metadata.pendingSelection;
        this.store.updateUi(ui => {
          ui.selection = pending;
          ui.tool = "select";
        }, "Select mode");
      }
    });
  }

  moveCourseOrderDraft(direction) {
    const list = this.querySelector("#courseOrderList");
    const index = list?.selectedIndex ?? -1;
    if (!list || index < 0) return;
    const offset = direction === "up" ? -1 : 1;
    const nextIndex = index + offset;
    if (nextIndex < 0 || nextIndex >= this.courseOrderDraft.length) return;
    [this.courseOrderDraft[index], this.courseOrderDraft[nextIndex]] = [this.courseOrderDraft[nextIndex], this.courseOrderDraft[index]];
    this.renderCourseOrderDraft(nextIndex);
  }

  renderCourseOrderDraft(selectedIndex = 0) {
    const model = this.store.snapshot().eventModel;
    const list = this.querySelector("#courseOrderList");
    if (!list) return;
    list.innerHTML = (this.courseOrderDraft || [])
      .map(id => getCourse(model, id))
      .filter(Boolean)
      .map(course => `<option value="${course.id}">${escapeHtml(course.name)}</option>`)
      .join("");
    list.selectedIndex = Math.max(0, Math.min(selectedIndex, list.options.length - 1));
  }

  confirmDirty() {
    return !this.store.snapshot().eventModel.dirty || confirm(this.t("Discard unsaved changes?"));
  }
}

function objectForSelection(model, selection) {
  if (selection.type === "control") return getControl(model, selection.id);
  if (selection.type === "course") return getCourse(model, selection.id);
  if (selection.type === "special") return findById(model.specials, selection.id);
  if (selection.type === "leg" || selection.type === "leg-bend") return findLeg(model, selection.startControl, selection.endControl);
  if (selection.type === "control-number") return getCourseControl(model, selection.courseControl);
  return null;
}

function courseDisplayOptions(eventModel, ui = {}) {
  const courseId = ui.selectedCourseId;
  if (!courseId || courseId === "all" || ui.showAllControls) return {};
  if (ui.variationMode === "all") return { allBranches: true };
  if (ui.variationMode === "variation") {
    const variation = variationForCode(eventModel, courseId, ui.variationCode);
    return variation ? { variationChoices: variation.choices } : {};
  }
  if (ui.variationMode === "relay") {
    const variation = relayVariationForLeg(eventModel, courseId, ui.relayTeam, ui.relayLeg);
    return variation ? { variationChoices: variation.choices } : {};
  }
  return {};
}

function insertionCourseControlId(state) {
  const selection = state.ui.selection;
  const courseId = state.ui.selectedCourseId;
  if (!courseId || courseId === "all") return null;
  const branchInsertion = lastCourseControlInVariationBranch(state.eventModel, courseId, state.ui.variationBranch);
  if (branchInsertion) return branchInsertion.id;
  if (!selection) return null;
  if (selection.type === "control-number" && selection.courseControl) {
    return selection.courseControl;
  }
  if (selection.type === "control") {
    return courseView(state.eventModel, courseId, { allBranches: false })
      .find(row => Number(row.control?.id) === Number(selection.id))
      ?.courseControl?.id || null;
  }
  if (selection.type === "leg" || selection.type === "leg-bend") {
    return courseView(state.eventModel, courseId, { allBranches: false })
      .find(row => Number(row.control?.id) === Number(selection.startControl))
      ?.courseControl?.id || null;
  }
  return null;
}

function variationAnchorCourseControl(eventModel, courseId, ui = {}) {
  if (!courseId || courseId === "all") return null;
  const rows = courseView(eventModel, courseId, { allBranches: true });
  const rowCourseControls = new Map(rows.map(row => [Number(row.courseControl?.id), row.courseControl]));
  const anchored = rowCourseControls.get(Number(ui.variationAnchorCourseControl));
  if (anchored) return anchored;
  const selection = ui.selection;
  if (selection?.type === "control-number" && selection.courseControl) {
    return rowCourseControls.get(Number(selection.courseControl)) || null;
  }
  if (selection?.type === "control") {
    return rows.find(row => Number(row.control?.id) === Number(selection.id))?.courseControl || null;
  }
  if (selection?.type === "leg" || selection?.type === "leg-bend") {
    return rows.find(row => Number(row.control?.id) === Number(selection.startControl))?.courseControl || null;
  }
  return rows[0]?.courseControl || null;
}

function canAddVariationAtCourseControl(eventModel, course, courseControl) {
  if (!course || course.kind === "score" || !courseControl || courseControl.variation) return false;
  const control = getControl(eventModel, courseControl.control);
  if (!control || control.kind === "finish") return false;
  return !!getCourseControl(eventModel, courseControl.nextCourseControl);
}

function normalizedVariationBranch(eventModel, courseId, variationBranch) {
  if (!variationBranch || !courseId || courseId === "all") return null;
  const fork = getCourseControl(eventModel, variationBranch.forkCourseControl);
  const branch = getCourseControl(eventModel, variationBranch.branchCourseControl);
  if (!fork?.variation || !branch) return null;
  if (!fork.variationCourseControls.map(Number).includes(Number(branch.id))) return null;
  const courseControlIds = new Set(courseView(eventModel, courseId, { allBranches: true }).map(row => Number(row.courseControl?.id)));
  if (!courseControlIds.has(Number(fork.id)) || !courseControlIds.has(Number(branch.id))) return null;
  return {
    forkCourseControl: Number(fork.id),
    branchCourseControl: Number(branch.id)
  };
}

function lastCourseControlInVariationBranch(eventModel, courseId, variationBranch) {
  const branchSelection = normalizedVariationBranch(eventModel, courseId, variationBranch);
  if (!branchSelection) return null;
  const fork = getCourseControl(eventModel, branchSelection.forkCourseControl);
  let current = getCourseControl(eventModel, branchSelection.branchCourseControl);
  let last = current;
  const joinId = Number(fork?.variationEnd) || 0;
  const seen = new Set();
  const maxSteps = Math.max(1000, (eventModel.courseControls?.length || 0) * 20);
  let steps = 0;
  while (current && Number(current.nextCourseControl) && Number(current.nextCourseControl) !== joinId && !seen.has(Number(current.id)) && steps++ < maxSteps) {
    seen.add(Number(current.id));
    current = getCourseControl(eventModel, current.nextCourseControl);
    if (current) last = current;
  }
  return last || null;
}

function safeCachedUi(ui = {}) {
  return {
    selectedCourseId: ui.selectedCourseId || "all",
    zoom: Number.isFinite(Number(ui.zoom)) ? Number(ui.zoom) : 1,
    pan: {
      x: Number(ui.pan?.x) || 0,
      y: Number(ui.pan?.y) || 0
    },
    mapIntensity: Number.isFinite(Number(ui.mapIntensity)) ? Number(ui.mapIntensity) : 0.65,
    highQuality: ui.highQuality !== false,
    showPrintArea: !!ui.showPrintArea,
    showAllControls: ui.selectedCourseId === "all" || !!ui.showAllControls,
    variationMode: ui.variationMode || "default",
    variationCode: ui.variationCode || "",
    variationAddKind: ui.variationAddKind === "loop" ? "loop" : "fork",
    variationAddBranches: Math.max(2, Math.min(6, Math.round(Number(ui.variationAddBranches) || 2))),
    variationAnchorCourseControl: Number(ui.variationAnchorCourseControl) || null,
    variationBranch: ui.variationBranch ? {
      forkCourseControl: Number(ui.variationBranch.forkCourseControl) || null,
      branchCourseControl: Number(ui.variationBranch.branchCourseControl) || null
    } : null,
    relayTeam: Math.max(1, Number(ui.relayTeam) || 1),
    relayLeg: Math.max(1, Number(ui.relayLeg) || 1)
  };
}

function applyImportedMapScale(model, scale) {
  const previousScale = positiveScale(model.event?.map?.scale) || 15000;
  applyMapScale(model, scale, previousScale);
}

function applyMapScale(model, scale, previousScale = positiveScale(model.event?.map?.scale) || 15000) {
  const nextScale = positiveScale(scale);
  if (!nextScale) return;
  model.event.map.scale = nextScale;
  if (!model.event.allControls) {
    model.event.allControls = {};
  }
  if (!positiveScale(model.event.allControls.printScale) || nearlySameScale(model.event.allControls.printScale, previousScale)) {
    model.event.allControls.printScale = nextScale;
  }
  for (const course of model.courses || []) {
    if (!course.options) course.options = {};
    if (!positiveScale(course.options.printScale) || nearlySameScale(course.options.printScale, previousScale)) {
      course.options.printScale = nextScale;
    }
  }
}

function specialCategory(kind) {
  if (["first-aid", "water", "optional-crossing-point", "forbidden-route", "registration-mark"].includes(kind)) return "point";
  if (["line", "boundary"].includes(kind)) return "line";
  if (["out-of-bounds", "dangerous-area", "temporary-construction", "white-out"].includes(kind)) return "area";
  if (kind === "text") return "text";
  if (kind === "rectangle") return "rectangle";
  if (kind === "ellipse") return "ellipse";
  if (kind === "descriptions") return "descriptions";
  if (kind === "image") return "image";
  return "point";
}

function specialFontHeight(special) {
  const value = Number(special.font?.height);
  return value > 0 ? value : DEFAULT_TEXT_FONT_HEIGHT;
}

function fontOptions(selectedFont) {
  const selected = FONT_CHOICES.includes(selectedFont) ? selectedFont : "Arial";
  return FONT_CHOICES
    .map(font => `<option value="${escapeAttr(font)}" ${font === selected ? "selected" : ""}>${escapeHtml(font)}</option>`)
    .join("");
}

function isCustomSpecialColor(color) {
  const normalized = LEGACY_COLOR_ALIASES[color] || color;
  return !SPECIAL_COLOR_CHOICES.some(([value]) => value !== "custom" && value === normalized);
}

function colorChoiceSelected(choice, current) {
  const normalized = LEGACY_COLOR_ALIASES[current] || current;
  return choice === normalized;
}

function colorChoiceLabel(value, label) {
  return t(label || value);
}

function normalizeHexColor(value) {
  const text = String(value || "").trim();
  const short = text.match(/^#([0-9a-f]{3})$/i);
  if (short) {
    return `#${short[1].split("").map(char => char + char).join("")}`.toLowerCase();
  }
  return /^#[0-9a-f]{6}$/i.test(text) ? text.toLowerCase() : null;
}

function normalizeColorValue(value) {
  const text = String(value || "").trim();
  if (text === "upper-purple" || text === "lower-purple") return text;
  return normalizeHexColor(text) || normalizeHexColor(LEGACY_COLOR_ALIASES[text]) || null;
}

function colorToHex(value) {
  const normalized = normalizeColorValue(value);
  if (normalized === "upper-purple" || normalized === "lower-purple") return "#a626ff";
  return normalized || "#000000";
}

function syncColorControls(root, color, scope) {
  if (!root) return;
  const normalized = normalizeColorValue(color);
  if (!normalized) return;
  const hex = colorToHex(normalized);
  const picker = root.querySelector(scope === "dialog" ? "[data-dialog-color-picker]" : "[data-special-color-picker]");
  const hexInput = root.querySelector(scope === "dialog" ? "[data-dialog-color-value]" : "[data-special-color-hex]");
  if (picker) picker.value = hex;
  if (hexInput) hexInput.value = hex;
  root.querySelectorAll(scope === "dialog" ? "[data-dialog-color]" : "[data-special-color]").forEach(button => {
    const buttonColor = button.dataset.dialogColor || button.dataset.specialColor || "";
    button.classList.toggle("selected", colorChoiceSelected(buttonColor, normalized));
  });
}

function resizedSpecialObject(eventModel, special, resize, point, selectedCourseId = "all") {
  if (special.kind === "descriptions") {
    return resizedDescriptionSpecial(eventModel, special, resize.anchor || resize, point, selectedCourseId);
  }
  const replacement = structuredClone(special);
  if (special.kind === "text" && resize.handle === "resize-text-font") {
    const anchor = resize.anchor || replacement.locations?.[0];
    if (!anchor) return replacement;
    const desiredWidth = Math.max(1, point.x - anchor.x);
    const desiredHeight = Math.max(1, anchor.y - point.y);
    replacement.font ||= { name: "Arial", bold: false, italic: false, height: DEFAULT_TEXT_FONT_HEIGHT };
    replacement.font.height = resizedTextFontHeight(replacement, desiredWidth, desiredHeight);
    replacement.locations = [{ x: anchor.x, y: anchor.y }];
    return replacement;
  }
  const locations = (replacement.locations || []).map(location => ({ x: location.x, y: location.y }));
  if (resize.handle?.startsWith("point-")) {
    const index = Number(resize.pointIndex);
    if (Number.isInteger(index) && index >= 0 && index < locations.length) {
      locations[index] = { x: point.x, y: point.y };
      replacement.locations = locations;
    }
    return replacement;
  }
  if (resize.anchor) {
    replacement.locations = [
      { x: resize.anchor.x, y: resize.anchor.y },
      { x: point.x, y: point.y }
    ];
  }
  return replacement;
}

function resizedTextFontHeight(special, desiredWidth, desiredHeight) {
  const lines = String(special.text || "Text").split(/\r?\n/);
  const lineCount = Math.max(1, lines.length);
  const maxLineLen = Math.max(1, ...lines.map(line => line.length || 1));
  const heightSize = desiredHeight / (lineCount * 1.15);
  const widthSize = desiredWidth / (maxLineLen * 0.62);
  return Math.max(0.5, Math.min(72, Math.min(heightSize, widthSize)));
}

function positiveScale(value) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : null;
}

function positiveNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : fallback;
}

function backgroundMetadataForImage(file, url, image, eventModel) {
  const naturalWidth = image.naturalWidth || image.width || 1;
  const naturalHeight = image.naturalHeight || image.height || 1;
  const aspect = Math.max(0.0001, naturalHeight / naturalWidth);
  const bounds = eventBoundsForBackground(eventModel);
  const widthMeters = Math.max(50, bounds.width || 200);
  const mapScale = positiveScale(eventModel.event?.map?.scale) || 15000;
  return {
    name: file.name,
    url,
    type: file.type,
    naturalWidth,
    naturalHeight,
    centerX: 0,
    centerY: 0,
    widthMeters,
    heightMeters: widthMeters * aspect,
    printedWidthCm: widthMeters / mapScale * 100,
    calibration: { imagePoints: [] }
  };
}

function backgroundAspect(background) {
  const width = positiveNumber(background?.naturalWidth, 1);
  const height = positiveNumber(background?.naturalHeight, 1);
  return Math.max(0.0001, height / width);
}

function applyBackgroundCalibration(background, aspect) {
  if (!(background?.calibrationDistanceMeters > 0)) return;
  const currentDistance = backgroundCalibrationDistance(background);
  if (!(currentDistance > 0)) return;
  const beforeCenter = backgroundCalibrationAnchorCenter(background);
  background.calibration ||= {};
  background.calibration.baseWidthMeters ||= positiveNumber(background.widthMeters, 200);
  background.calibration.baseDistanceMeters ||= currentDistance;
  background.calibration.basePrintedWidthCm ||= positiveNumber(background.printedWidthCm, 0);
  const factor = background.calibrationDistanceMeters / background.calibration.baseDistanceMeters;
  background.widthMeters = background.calibration.baseWidthMeters * factor;
  background.heightMeters = background.widthMeters * aspect;
  if (background.calibration.basePrintedWidthCm > 0) {
    background.printedWidthCm = background.calibration.basePrintedWidthCm * factor;
  }
  const afterCenter = backgroundCalibrationAnchorCenter(background);
  if (beforeCenter && afterCenter) {
    background.centerX = (Number(background.centerX) || 0) + beforeCenter.x - afterCenter.x;
    background.centerY = (Number(background.centerY) || 0) + beforeCenter.y - afterCenter.y;
  }
}

function resetBackgroundCalibrationBase(background) {
  if (!background?.calibration) return;
  delete background.calibration.baseWidthMeters;
  delete background.calibration.baseDistanceMeters;
  delete background.calibration.basePrintedWidthCm;
}

function backgroundBoundsForMetadata(background) {
  const aspect = backgroundAspect(background);
  const width = positiveNumber(background?.widthMeters, 200);
  const height = positiveNumber(background?.heightMeters, width * aspect);
  const centerX = Number(background?.centerX) || 0;
  const centerY = Number(background?.centerY) || 0;
  return {
    left: centerX - width / 2,
    right: centerX + width / 2,
    top: centerY + height / 2,
    bottom: centerY - height / 2,
    width,
    height
  };
}

function backgroundImagePointForMap(background, point) {
  const bounds = backgroundBoundsForMetadata(background);
  return {
    x: clamp((point.x - bounds.left) / bounds.width, 0, 1),
    y: clamp((bounds.top - point.y) / bounds.height, 0, 1)
  };
}

function backgroundMapPointForImage(background, point) {
  const bounds = backgroundBoundsForMetadata(background);
  return {
    x: bounds.left + point.x * bounds.width,
    y: bounds.top - point.y * bounds.height
  };
}

function backgroundCalibrationMapPoints(background) {
  const imagePoints = background?.calibration?.imagePoints || [];
  if (imagePoints.length) {
    return imagePoints.map(point => backgroundMapPointForImage(background, point));
  }
  return background?.calibration?.points || [];
}

function backgroundCalibrationAnchorCenter(background) {
  const points = backgroundCalibrationMapPoints(background);
  if (points.length < 2) return null;
  return {
    x: (points[0].x + points[1].x) / 2,
    y: (points[0].y + points[1].y) / 2
  };
}

function backgroundCalibrationDistance(background) {
  const imagePoints = background?.calibration?.imagePoints || [];
  if (imagePoints.length >= 2) {
    const bounds = backgroundBoundsForMetadata(background);
    const dx = (imagePoints[1].x - imagePoints[0].x) * bounds.width;
    const dy = (imagePoints[1].y - imagePoints[0].y) * bounds.height;
    return Math.hypot(dx, dy);
  }
  const points = background?.calibration?.points || [];
  return points.length >= 2 ? distance(points[0], points[1]) : 0;
}

function eventBoundsForBackground(eventModel) {
  const controls = eventModel.controls || [];
  if (!controls.length) return { width: 200, height: 200 };
  let left = Infinity;
  let right = -Infinity;
  let top = -Infinity;
  let bottom = Infinity;
  for (const control of controls) {
    left = Math.min(left, control.location.x);
    right = Math.max(right, control.location.x);
    top = Math.max(top, control.location.y);
    bottom = Math.min(bottom, control.location.y);
  }
  return { width: Math.max(200, right - left), height: Math.max(200, top - bottom) };
}

function formatInputNumber(value) {
  if (value === "" || value === null || value === undefined) return "";
  const number = Number(value);
  return Number.isFinite(number) ? String(Number(number.toFixed(3))) : "";
}

function nearlySameScale(a, b) {
  return Math.abs(Number(a) - Number(b)) < 0.001;
}

function setControlNumberLocation(model, selection, location) {
  const courseControl = getCourseControl(model, selection?.courseControl);
  const control = getControl(model, courseControl?.control || selection?.control);
  if (!courseControl || !control) return;
  courseControl.numberLocation = {
    x: location.x - control.location.x,
    y: location.y - control.location.y
  };
}

function resetControlNumberLocation(model, selection) {
  const courseControl = getCourseControl(model, selection?.courseControl);
  if (courseControl) {
    courseControl.numberLocation = null;
  }
}

function controlDisplayName(control) {
  if (!control) return "";
  if (control.kind === "normal") return control.code || `Control ${control.id}`;
  return control.kind.replace(/-/g, " ");
}

function finishRouteForCourse(model, courseId) {
  const pair = finishLegPair(model, courseId);
  if (!pair) return { value: "none", disabled: true };
  return {
    value: normalizeLegFlaggingKind(findLeg(model, pair.previous.control.id, pair.finish.control.id)?.flagging?.kind),
    disabled: false
  };
}

function setFinishRouteFlagging(model, courseId, kind) {
  const pair = finishLegPair(model, courseId);
  if (!pair) return;
  const leg = ensureLegBetween(model, pair.previous.control.id, pair.finish.control.id);
  leg.flagging = { kind: ["all", "end"].includes(kind) ? kind : "none", point: null };
}

function setScoreFinishControl(model, courseId, controlId, enabled) {
  const course = getCourse(model, courseId);
  if (!course || course.kind !== "score") return;
  course.options ||= {};
  const view = courseView(model, courseId, { allBranches: true });
  const finish = view.find(row => row.control?.kind === "finish");
  const from = view.find(row => Number(row.control?.id) === Number(controlId) && row.control?.kind === "normal");
  const previousControlId = Number(course.options.scoreFinishControl) || 0;
  if (previousControlId && finish && previousControlId !== Number(controlId)) {
    const previousLeg = findLeg(model, previousControlId, finish.control.id);
    if (previousLeg) {
      previousLeg.flagging = { kind: "none", point: null };
    }
  }
  if (!enabled || !finish || !from) {
    if (previousControlId === Number(controlId) || !enabled) {
      if (previousControlId && finish) {
        const previousLeg = findLeg(model, previousControlId, finish.control.id);
        if (previousLeg) previousLeg.flagging = { kind: "none", point: null };
      }
      course.options.scoreFinishControl = null;
    }
    return;
  }
  course.options.scoreFinishControl = Number(controlId);
  const leg = ensureLegBetween(model, from.control.id, finish.control.id);
  leg.flagging = { kind: "all", point: null };
}

function finishLegPair(model, courseId) {
  const view = courseView(model, courseId);
  const finishIndex = view.findIndex(row => row.control.kind === "finish");
  if (finishIndex <= 0) return null;
  return { previous: view[finishIndex - 1], finish: view[finishIndex] };
}

function nextNumericId(items) {
  return Math.max(0, ...items.map(item => Number(item.id) || 0)) + 1;
}

function ensureLegBetween(model, startControl, endControl) {
  let leg = findLeg(model, startControl, endControl);
  if (!leg) {
    leg = {
      id: nextNumericId(model.legs),
      startControl: Number(startControl),
      endControl: Number(endControl),
      flagging: { kind: "none", point: null },
      bends: [],
      gaps: []
    };
    model.legs.push(leg);
  }
  leg.gaps ||= [];
  leg.bends ||= [];
  leg.flagging ||= { kind: "none", point: null };
  leg.flagging.kind = normalizeLegFlaggingKind(leg.flagging.kind);
  return leg;
}

function normalizeLegFlaggingKind(kind) {
  return {
    "beginning-part": "begin",
    "end-part": "end",
    "middle-part": "middle"
  }[kind] || kind || "none";
}

function setLegFlaggingKind(model, leg, kind) {
  const normalized = normalizeLegFlaggingKind(kind);
  const total = pathLength(legPathPoints(model, leg));
  if (normalized === "none" || normalized === "all") {
    leg.flagging = { kind: normalized, point: null };
    return;
  }
  if (normalized === "begin") {
    const range = flaggingRangeForUi(model, leg, total);
    setLegFlaggingRange(model, leg, 0, range.endPercent || 50, "begin");
    return;
  }
  if (normalized === "end") {
    const range = flaggingRangeForUi(model, leg, total);
    setLegFlaggingRange(model, leg, range.startPercent || 50, 100, "end");
    return;
  }
  if (normalized === "middle") {
    const range = flaggingRangeForUi(model, leg, total);
    setLegFlaggingRange(model, leg, range.startPercent || 35, range.endPercent || 65, "middle");
  }
}

function setLegFlaggingRange(model, leg, startPercent, endPercent, forcedKind = null) {
  const total = pathLength(legPathPoints(model, leg));
  const kind = forcedKind || normalizeLegFlaggingKind(leg.flagging?.kind);
  const start = clamp(Number(startPercent) || 0, 0, 95);
  const end = clamp(Number(endPercent) || 100, 5, 100);
  if (kind === "begin") {
    const distanceAtEnd = total * clamp(end, 5, 95) / 100;
    leg.flagging = { kind: "begin", point: pointAtPathDistance(legPathPoints(model, leg), distanceAtEnd), end: distanceAtEnd };
  }
  else if (kind === "end") {
    const distanceAtStart = total * clamp(start, 5, 95) / 100;
    leg.flagging = { kind: "end", point: pointAtPathDistance(legPathPoints(model, leg), distanceAtStart), start: distanceAtStart };
  }
  else if (kind === "middle") {
    const orderedStart = Math.min(start, end - 5);
    const orderedEnd = Math.max(end, orderedStart + 5);
    leg.flagging = {
      kind: "middle",
      start: total * clamp(orderedStart, 0, 95) / 100,
      end: total * clamp(orderedEnd, 5, 100) / 100,
      point: null
    };
  }
}

function flaggingRangeForUi(model, leg, total = 0) {
  const kind = normalizeLegFlaggingKind(leg?.flagging?.kind);
  if (!leg || total <= 0) {
    return { startPercent: kind === "middle" ? 35 : 50, endPercent: kind === "middle" ? 65 : 50 };
  }
  const points = legPathPoints(model, leg);
  if (kind === "begin") {
    const end = Number(leg.flagging?.end) || (leg.flagging?.point ? distanceAlongPathAtPoint(points, leg.flagging.point).distance : total / 2);
    return { startPercent: 0, endPercent: clamp(Math.round(end / total * 100), 5, 95) };
  }
  if (kind === "end") {
    const start = Number(leg.flagging?.start) || (leg.flagging?.point ? distanceAlongPathAtPoint(points, leg.flagging.point).distance : total / 2);
    return { startPercent: clamp(Math.round(start / total * 100), 5, 95), endPercent: 100 };
  }
  if (kind === "middle") {
    const start = Number(leg.flagging?.start);
    const end = Number(leg.flagging?.end);
    return {
      startPercent: clamp(Math.round((Number.isFinite(start) ? start : total * 0.35) / total * 100), 5, 90),
      endPercent: clamp(Math.round((Number.isFinite(end) ? end : total * 0.65) / total * 100), 10, 95)
    };
  }
  return { startPercent: 50, endPercent: 50 };
}

function legPathPoints(model, leg) {
  const start = getControl(model, leg.startControl);
  const end = getControl(model, leg.endControl);
  return [start?.location, ...(leg.bends || []), end?.location].filter(Boolean);
}

function pathLength(points) {
  let length = 0;
  for (let index = 0; index < points.length - 1; index += 1) {
    length += distance(points[index], points[index + 1]);
  }
  return length;
}

function pointAtPathDistance(points, distanceAlongPath) {
  if (!points.length) return { x: 0, y: 0 };
  let remaining = clamp(distanceAlongPath, 0, pathLength(points));
  for (let i = 0; i < points.length - 1; i += 1) {
    const a = points[i];
    const b = points[i + 1];
    const length = distance(a, b);
    if (remaining <= length && length > 0) {
      const t = remaining / length;
      return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
    }
    remaining -= length;
  }
  return { ...points[points.length - 1] };
}

function bendInsertIndex(points, distanceAlongPath) {
  if (points.length < 2) return 0;
  let remaining = clamp(distanceAlongPath, 0, pathLength(points));
  for (let index = 0; index < points.length - 1; index += 1) {
    const length = distance(points[index], points[index + 1]);
    if (remaining <= length || index === points.length - 2) {
      return index;
    }
    remaining -= length;
  }
  return Math.max(0, points.length - 2);
}

function distanceAlongPathAtPoint(points, point) {
  let best = { distance: 0, screenDistance: Infinity };
  let offset = 0;
  for (let i = 0; i < points.length - 1; i += 1) {
    const a = points[i];
    const b = points[i + 1];
    const projected = projectPointToSegment(point, a, b);
    if (projected.distance < best.screenDistance) {
      best = { distance: offset + projected.t * distance(a, b), screenDistance: projected.distance };
    }
    offset += distance(a, b);
  }
  return best;
}

function projectPointToSegment(point, a, b) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lengthSq = dx * dx + dy * dy;
  const t = lengthSq > 0 ? clamp(((point.x - a.x) * dx + (point.y - a.y) * dy) / lengthSq, 0, 1) : 0;
  const projected = { x: a.x + dx * t, y: a.y + dy * t };
  return { t, distance: distance(point, projected) };
}

function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function snappedControlForPlacement(state, kind, point, mapView) {
  const scale = Math.max(0.0001, mapView?.scale?.(state.ui) || 1);
  const threshold = CONTROL_SNAP_SCREEN_RADIUS / scale;
  let best = null;
  let bestDistance = Infinity;
  for (const control of state.eventModel.controls || []) {
    if (control.kind !== kind) continue;
    const candidateDistance = distance(point, control.location);
    if (candidateDistance <= threshold && candidateDistance < bestDistance) {
      best = control;
      bestDistance = candidateDistance;
    }
  }
  if (!best) return null;
  const selectedCourseId = state.ui.selectedCourseId;
  const usedInSelectedCourse = selectedCourseId && selectedCourseId !== "all"
    ? controlsUsedByCourse(state.eventModel, selectedCourseId).has(Number(best.id))
    : false;
  return { control: best, distance: bestDistance, usedInSelectedCourse };
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function currentPrintAreaForTarget(eventModel, ui, target) {
  if (target.scope === PRINT_AREA_SCOPES.COURSE) {
    return effectivePrintArea(eventModel, target.courseId);
  }
  return normalizePrintArea(eventModel.event.printArea);
}

function selectedRadioValue(root, name) {
  return root.querySelector(`input[name="${name}"]:checked`)?.value || "";
}

function modeLabel(mode) {
  switch (mode) {
    case "frame": return t("Move frame");
    case "viewport": return t("Current view");
    case "automatic": return t("Automatic");
    default: return t("Custom rectangle");
  }
}

function findPaperSize(width, height) {
  return PAPER_SIZES.find(size =>
    (nearlySame(size.width, width) && nearlySame(size.height, height))
    || (nearlySame(size.width, height) && nearlySame(size.height, width))
  ) || null;
}

function paperOptionHtml(size, selected) {
  return `<option value="${escapeAttr(size.id)}" data-width="${size.width}" data-height="${size.height}" ${size.custom ? 'data-custom="true"' : ""} ${selected ? "selected" : ""}>${escapeHtml(t(size.label))}</option>`;
}

function marginOptionHtml(option, selected) {
  return `<option value="${escapeAttr(option.id)}" data-value="${option.value}" ${selected ? "selected" : ""}>${escapeHtml(t(option.label))}</option>`;
}

function pageSizeMm(area) {
  const width = area.pageWidth * 0.254;
  const height = area.pageHeight * 0.254;
  return area.pageLandscape ? { width: height, height: width } : { width, height };
}

function pageMarginMm(area) {
  return Math.max(0, Number(area.pageMargins) || 0) * 0.254;
}

function pdfPixelSize(page, marginMm) {
  const contentWidth = Math.max(10, page.width - marginMm * 2);
  const contentHeight = Math.max(10, page.height - marginMm * 2);
  const pixelsPerMm = 5;
  return {
    width: Math.max(600, Math.round(contentWidth * pixelsPerMm)),
    height: Math.max(600, Math.round(contentHeight * pixelsPerMm))
  };
}

function formatPageSize(width, height) {
  return `${formatDecimal(width / 100)} x ${formatDecimal(height / 100)} in`;
}

function formatMargin(value) {
  return value ? `${formatDecimal(value * 0.254)} mm` : "none";
}

function formatDecimal(value) {
  return Number(value).toFixed(2).replace(/\.?0+$/, "");
}

function nearlySame(a, b) {
  return Math.abs(Number(a || 0) - Number(b || 0)) < 0.5;
}

function boundsCenter(bounds) {
  return {
    x: (bounds.left + bounds.right) / 2,
    y: (bounds.top + bounds.bottom) / 2
  };
}

function selectOptions(values, selected, labeler = value => String(value)) {
  return values.map(value => {
    const isSelected = String(value) === String(selected);
    return `<option value="${escapeAttr(value)}" ${isSelected ? "selected" : ""}>${escapeHtml(t(labeler(value)))}</option>`;
  }).join("");
}

function uniqueNumbers(values) {
  return [...new Set(values.map(value => Number(value)).filter(value => Number.isFinite(value)))]
    .sort((a, b) => a - b);
}

function uniqueStrings(values) {
  return [...new Set(values.map(value => String(value)).filter(Boolean))];
}

function symbolOptionsForColumn(box) {
  const options = [["", "Not specified"], ...getIscdSymbolOptions(box)];
  const seen = new Set();
  return options.filter(([value]) => {
    const key = String(value || "");
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function descriptionKindLabel(kind) {
  return {
    symbols: "symbols",
    text: "text",
    "symbols-and-text": "symbols-and-text"
  }[kind] || kind;
}

function directionVector(direction) {
  const vectors = {
    east: { x: 1, y: 0 },
    west: { x: -1, y: 0 },
    north: { x: 0, y: 1 },
    south: { x: 0, y: -1 },
    northeast: { x: 1, y: 1 },
    northwest: { x: -1, y: 1 },
    southeast: { x: 1, y: -1 },
    southwest: { x: -1, y: -1 }
  };
  const vector = vectors[direction] || vectors.east;
  const length = Math.hypot(vector.x, vector.y) || 1;
  return { x: vector.x / length, y: vector.y / length };
}

function renderKeysFor({ eventModel, ui }) {
  return {
    eventModel,
    selectedCourseId: ui.selectedCourseId,
    showAllControls: ui.showAllControls,
    variationMode: ui.variationMode || "default",
    variationCode: ui.variationCode || "",
    variationAddKind: ui.variationAddKind || "fork",
    variationAddBranches: ui.variationAddBranches || 2,
    variationAnchorCourseControl: ui.variationAnchorCourseControl || "",
    variationBranch: ui.variationBranch ? `${ui.variationBranch.forkCourseControl || ""}:${ui.variationBranch.branchCourseControl || ""}` : "",
    relayTeam: ui.relayTeam || 1,
    relayLeg: ui.relayLeg || 1,
    selection: selectionKey(ui.selection),
    reportTitle: ui.report?.title || "",
    reportKind: ui.report?.kind || "",
    reportHtml: ui.report?.html || ""
  };
}

function selectionKey(selection) {
  if (!selection) return "";
  if (selection.type === "leg") {
    return `${selection.type}:${selection.startControl}:${selection.endControl}`;
  }
  if (selection.type === "leg-bend") {
    return `${selection.type}:${selection.startControl}:${selection.endControl}:${selection.bendIndex}`;
  }
  if (selection.type === "leg-gap") {
    return `${selection.type}:${selection.startControl}:${selection.endControl}:${selection.gapIndex}:${selection.handle || ""}`;
  }
  if (selection.type === "control-number") {
    return `${selection.type}:${selection.courseControl}`;
  }
  return `${selection.type}:${selection.id}`;
}

function setPath(object, path, value) {
  let cursor = object;
  for (let i = 0; i < path.length - 1; i += 1) {
    cursor = cursor[path[i]];
  }
  cursor[path[path.length - 1]] = value;
}

function valueFromInput(input) {
  if (input.type === "checkbox") {
    return input.checked;
  }
  if (input.type === "number") {
    return input.value === "" ? null : Number(input.value);
  }
  return input.value;
}

function tableHtml(title, headers, rows) {
  return `
    <h2>${escapeHtml(t(title))}</h2>
    <table class="report-table">
      <thead><tr>${headers.map(header => `<th>${escapeHtml(t(header.label))}</th>`).join("")}</tr></thead>
      <tbody>${rows.map(row => `<tr>${headers.map(header => {
        const value = header.format ? header.format(row[header.key], row) : row[header.key] ?? "";
        return `<td>${escapeHtml(typeof value === "string" ? t(value) : value)}</td>`;
      }).join("")}</tr>`).join("")}</tbody>
    </table>
  `;
}

function download(fileName, content, type) {
  const blob = new Blob([content], { type });
  downloadBlob(fileName, blob);
}

function downloadBlob(fileName, blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.append(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function baseName(name = "event.ppen") {
  return String(name).replace(/\.[^.]+$/, "") || "event";
}

function isNarrowMobileViewport() {
  return window.matchMedia?.("(max-width: 760px)")?.matches ?? window.innerWidth <= 760;
}

function canScrollElement(element, deltaY) {
  if (!element || !(Math.abs(deltaY) > 0)) return false;
  const maxScrollTop = element.scrollHeight - element.clientHeight;
  if (!(maxScrollTop > 0)) return false;
  if (deltaY < 0) return element.scrollTop > 0;
  return element.scrollTop < maxScrollTop - 1;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const escapeAttr = escapeHtml;
