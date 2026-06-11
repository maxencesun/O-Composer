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
  descriptionLanguageForEvent,
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
import { isPdfFile, renderPdfBasemap } from "../domain/pdf-basemap.js";
import {
  allControlsView,
  controlKindLabel,
  controlsUsedByCourse,
  courseLength,
  courseTopology,
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
  isTeamFreeCourseControl,
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

const PDF_COURSE_SCOPES = Object.freeze({
  CURRENT: "current",
  ALL_CONTROLS: "all-controls",
  ALL_COURSES: "all-courses",
  COURSE_PREFIX: "course:"
});

const PDF_OUTPUT_MODES = Object.freeze({
  AUTO: "auto",
  VECTOR: "vector",
  RASTER: "raster"
});

const PDF_EXPORT_SETTINGS_KEY = "purplePenPdfExportSettings";
const PDF_EXPORT_STEPS_PER_TARGET = 8;
const PDF_EXPORT_DONE_HOLD_MS = 650;

const MAP_SCALES = Object.freeze([4000, 5000, 7500, 10000, 15000]);
const APP_VERSION = "0.0.0";
const LANGUAGE_REFRESH_PARAM = "__pp_language_refresh";
const UI_MODE_KEY = "purplePenUiMode";
const UI_MODES = Object.freeze({ AUTO: "auto", DESKTOP: "desktop", MOBILE: "mobile" });
const COURSE_NAMES = Object.freeze(["Course 1", "Course 2", "Course 3", "Long", "Middle", "Sprint", "Score", "Training"]);
const TEXT_PRESETS = Object.freeze(["Text", "Water", "First Aid", "Registration", "Start", "Finish", "Danger", "Out of Bounds"]);
const MOVE_DISTANCE_CHOICES = Object.freeze([1, 2, 5, 10, 25, 50, 100]);
const DEFAULT_TEXT_FONT_HEIGHT = 3;
const CONTROL_SNAP_SCREEN_RADIUS = 10;
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
    consumeLanguageRefreshParam();
    this.language = getLanguage();
    this.store = new Store();
    this.innerHTML = this.template();
    this.syncResponsiveUiClass();
    this.syncApplicationLanguageControl();
    this.renderKeys = null;
    this.cacheReady = false;
    this.mapView = new MapView(this.querySelector("#mapCanvas"), this.store, {
      onSelect: selection => this.setSelection(selection),
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
      onBackgroundCalibrationPointMove: (selection, point, options) => this.moveBackgroundCalibrationPoint(selection, point, options),
      onHover: point => this.updateMouseStatus(point)
    });
    this.bindEvents();
    this.deferMapLayoutRefresh();
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

  applyApplicationLanguage(language) {
    setLanguage(language);
    forceWholePageLanguageReload();
  }

  syncApplicationLanguageControl() {
    const languageSelect = this.querySelector("#appLanguage");
    if (languageSelect) languageSelect.value = this.language;
  }

  uiModePreference() {
    return readUiModePreference();
  }

  resolvedUiMode() {
    const preference = this.uiModePreference();
    if (preference === UI_MODES.DESKTOP || preference === UI_MODES.MOBILE) {
      return preference;
    }
    return isPhoneViewport() ? UI_MODES.MOBILE : UI_MODES.DESKTOP;
  }

  toggleUiMode() {
    const nextMode = this.resolvedUiMode() === UI_MODES.DESKTOP ? UI_MODES.MOBILE : UI_MODES.DESKTOP;
    setUiModePreference(nextMode);
    this.syncResponsiveUiClass();
    this.deferMapLayoutRefresh();
  }

  syncResponsiveUiClass() {
    const mode = this.resolvedUiMode();
    const phoneUi = mode === UI_MODES.MOBILE;
    const tabletDesktopUi = mode === UI_MODES.DESKTOP && isTabletDevice();
    this.classList.toggle("phone-ui", phoneUi);
    this.classList.toggle("desktop-ui", !phoneUi);
    this.classList.toggle("tablet-desktop-ui", tabletDesktopUi);
    this.dataset.uiMode = mode;
    document.documentElement.classList.toggle("phone-ui", phoneUi);
    document.documentElement.classList.toggle("desktop-ui", !phoneUi);
    document.documentElement.classList.toggle("tablet-desktop-ui", tabletDesktopUi);
    document.documentElement.dataset.uiMode = mode;

    // Do not rely only on CSS media queries: iPad portrait can be below desktop
    // breakpoints while still needing the desktop/tablet workflow. Keep the mobile
    // side controls disabled unless this is a phone-sized viewport or the user
    // explicitly selected mobile UI.
    const mobileSideControls = this.querySelector(".mobile-side-controls");
    if (mobileSideControls) mobileSideControls.hidden = !phoneUi;
    const courseTabs = this.querySelector("#courseTabs");
    if (courseTabs) courseTabs.hidden = phoneUi;
    this.applyResponsiveInlineOverrides(phoneUi);
    this.syncUiModeToggle(phoneUi);
    this.deferMapLayoutRefresh();
  }

  applyResponsiveInlineOverrides(phoneUi) {
    const appFrame = this.querySelector(".app-frame");
    const menubar = this.querySelector(".menubar");
    const toolbar = this.querySelector(".toolbar");
    const courseTabs = this.querySelector("#courseTabs");
    const workspace = this.querySelector(".workspace");
    const leftPanel = this.querySelector(".left-panel");
    const divider = this.querySelector("#workspaceDivider");
    const mapPanel = this.querySelector(".map-panel");
    const courseBanner = this.querySelector("#courseBanner");
    const canvas = this.querySelector("#mapCanvas");
    const statusbar = this.querySelector(".statusbar");
    if (phoneUi) {
      for (const element of [this, appFrame, menubar, toolbar, courseTabs, workspace, leftPanel, divider, mapPanel, courseBanner, canvas, statusbar]) {
        element?.removeAttribute("style");
      }
      return;
    }

    // iPad Safari can still match stylesheet mobile media queries in portrait.
    // Force the whole shell back to a desktop grid from the host down to the
    // canvas. This avoids the map grid track collapsing to a one-pixel slit.
    const viewportWidth = Math.max(1, window.visualViewport?.width || window.innerWidth || document.documentElement.clientWidth || 0);
    const saved = Number(localStorage.getItem("purplePenLeftPanelWidth"));
    const maxPanelWidth = Math.max(180, Math.min(340, Math.floor(viewportWidth * 0.42)));
    const defaultPanelWidth = Math.max(200, Math.min(320, Math.floor(viewportWidth * 0.34)));
    const width = Number.isFinite(saved) && saved > 0
      ? clamp(saved, 180, maxPanelWidth)
      : defaultPanelWidth;

    this.style.display = "block";
    this.style.width = "100vw";
    this.style.maxWidth = "100vw";
    this.style.height = "100dvh";
    this.style.minWidth = "0";
    this.style.minHeight = "0";
    this.style.overflow = "hidden";

    if (appFrame) {
      appFrame.style.display = "flex";
      appFrame.style.flexDirection = "column";
      appFrame.style.width = "100%";
      appFrame.style.height = "100%";
      appFrame.style.minWidth = "0";
      appFrame.style.minHeight = "0";
      appFrame.style.maxWidth = "100%";
      appFrame.style.overflow = "hidden";
    }
    for (const fixed of [menubar, toolbar, courseTabs, statusbar]) {
      if (!fixed) continue;
      fixed.style.flex = "0 0 auto";
      fixed.style.minWidth = "0";
      fixed.style.maxWidth = "100%";
    }
    if (courseTabs) {
      courseTabs.hidden = false;
      courseTabs.style.display = "flex";
    }
    if (workspace) {
      workspace.style.display = "grid";
      workspace.style.gridTemplateColumns = `${width}px 6px minmax(0, 1fr)`;
      workspace.style.gridTemplateRows = "minmax(0, 1fr)";
      workspace.style.width = "100%";
      workspace.style.maxWidth = "100%";
      workspace.style.minWidth = "0";
      workspace.style.minHeight = "0";
      workspace.style.flex = "1 1 0";
      workspace.style.height = "auto";
      workspace.style.overflow = "hidden";
      workspace.style.setProperty("--left-panel-width", `${width}px`);
    }
    if (leftPanel) {
      leftPanel.hidden = false;
      leftPanel.style.gridColumn = "1";
      leftPanel.style.gridRow = "1";
      leftPanel.style.display = "flex";
      leftPanel.style.flexDirection = "column";
      leftPanel.style.width = `${width}px`;
      leftPanel.style.maxWidth = `${width}px`;
      leftPanel.style.minWidth = "0";
      leftPanel.style.minHeight = "0";
      leftPanel.style.overflow = "auto";
    }
    if (divider) {
      divider.hidden = false;
      divider.style.gridColumn = "2";
      divider.style.gridRow = "1";
      divider.style.display = "block";
      divider.style.width = "6px";
      divider.style.minWidth = "6px";
    }
    if (mapPanel) {
      mapPanel.style.gridColumn = "3";
      mapPanel.style.gridRow = "1";
      mapPanel.style.display = "flex";
      mapPanel.style.flexDirection = "column";
      mapPanel.style.width = "auto";
      mapPanel.style.height = "100%";
      mapPanel.style.minWidth = "0";
      mapPanel.style.minHeight = "0";
      mapPanel.style.flex = "1 1 0";
      mapPanel.style.overflow = "hidden";
    }
    if (courseBanner) {
      courseBanner.style.flex = "0 0 auto";
      courseBanner.style.minWidth = "0";
      courseBanner.style.maxWidth = "100%";
    }
    if (canvas) {
      canvas.style.display = "block";
      canvas.style.width = "100%";
      canvas.style.height = "100%";
      canvas.style.minWidth = "0";
      canvas.style.minHeight = "0";
      canvas.style.flex = "1 1 0";
      canvas.style.maxWidth = "100%";
      canvas.style.touchAction = "none";
    }
  }

  syncUiModeToggle(phoneUi = this.resolvedUiMode() === UI_MODES.MOBILE) {
    const button = this.querySelector("#uiModeToggle");
    if (!button) return;
    const nextLabel = phoneUi ? this.t("Desktop UI") : this.t("Mobile UI");
    button.textContent = nextLabel;
    button.title = this.t("Switch between desktop and mobile UI");
    button.setAttribute("aria-label", nextLabel);
    button.dataset.mode = phoneUi ? UI_MODES.MOBILE : UI_MODES.DESKTOP;
  }

  deferMapLayoutRefresh() {
    if (!this.mapView) return;
    const redraw = () => {
      this.mapView.invalidateOmapLayer?.();
      this.mapView.requestDraw?.(this.store.snapshot());
    };
    requestAnimationFrame(() => requestAnimationFrame(redraw));
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
      <style id="tabletDesktopLayoutFix">
        purple-pen-app.desktop-ui {
          display: block !important;
          width: 100vw !important;
          max-width: 100vw !important;
          height: 100dvh !important;
          min-width: 0 !important;
          min-height: 0 !important;
          overflow: hidden !important;
        }
        purple-pen-app.desktop-ui .app-frame {
          display: flex !important;
          flex-direction: column !important;
          width: 100% !important;
          max-width: 100% !important;
          height: 100% !important;
          min-width: 0 !important;
          min-height: 0 !important;
          overflow: hidden !important;
        }
        purple-pen-app.desktop-ui .menubar,
        purple-pen-app.desktop-ui .toolbar,
        purple-pen-app.desktop-ui .course-tabs,
        purple-pen-app.desktop-ui .statusbar {
          flex: 0 0 auto !important;
          max-width: 100% !important;
          min-width: 0 !important;
        }
        purple-pen-app.desktop-ui .workspace {
          display: grid !important;
          grid-template-columns: var(--left-panel-width, 300px) 6px minmax(0, 1fr) !important;
          grid-template-rows: minmax(0, 1fr) !important;
          flex: 1 1 0 !important;
          width: 100% !important;
          max-width: 100% !important;
          height: auto !important;
          min-width: 0 !important;
          min-height: 0 !important;
          overflow: hidden !important;
        }
        purple-pen-app.desktop-ui .left-panel {
          grid-column: 1 !important;
          grid-row: 1 !important;
          display: flex !important;
          flex-direction: column !important;
          min-width: 0 !important;
          min-height: 0 !important;
          overflow: auto !important;
        }
        purple-pen-app.desktop-ui .workspace-divider {
          grid-column: 2 !important;
          grid-row: 1 !important;
          display: block !important;
          width: 6px !important;
          min-width: 6px !important;
        }
        purple-pen-app.desktop-ui .map-panel {
          grid-column: 3 !important;
          grid-row: 1 !important;
          display: flex !important;
          flex-direction: column !important;
          width: auto !important;
          height: 100% !important;
          min-width: 0 !important;
          min-height: 0 !important;
          flex: 1 1 0 !important;
          overflow: hidden !important;
        }
        purple-pen-app.desktop-ui .course-banner {
          flex: 0 0 auto !important;
          min-width: 0 !important;
          max-width: 100% !important;
        }
        purple-pen-app.desktop-ui .map-canvas {
          display: block !important;
          width: 100% !important;
          height: 100% !important;
          min-width: 0 !important;
          min-height: 0 !important;
          flex: 1 1 0 !important;
          max-width: 100% !important;
          touch-action: none !important;
        }
        purple-pen-app .ui-mode-toggle {
          flex: 0 0 auto;
          margin-left: auto;
          padding: 4px 9px;
          border-radius: 7px;
          border: 1px solid #c7c7c7;
          background: rgba(255,255,255,.96);
          color: #222;
          font: inherit;
          line-height: 1.2;
          cursor: pointer;
          white-space: nowrap;
        }
        purple-pen-app .ui-mode-toggle:hover,
        purple-pen-app .ui-mode-toggle:focus-visible {
          background: #fff;
          border-color: #8e8e8e;
          outline: none;
        }
        purple-pen-app .ui-mode-toggle + .feedback-link {
          margin-left: 6px !important;
        }
        purple-pen-app .pdf-export-dialog {
          width: min(760px, calc(100vw - 28px));
          max-width: calc(100vw - 28px);
        }
        purple-pen-app .pdf-export-form {
          min-width: min(720px, calc(100vw - 56px));
        }
        purple-pen-app .pdf-export-layout {
          display: grid;
          grid-template-columns: minmax(230px, .9fr) minmax(260px, 1.1fr);
          gap: 10px 14px;
          align-items: start;
        }
        purple-pen-app .pdf-export-layout fieldset {
          border: 1px solid #d6d6d6;
          border-radius: 8px;
          padding: 8px 10px 10px;
          margin: 0;
        }
        purple-pen-app .pdf-export-layout legend {
          font-weight: 600;
          padding: 0 4px;
        }
        purple-pen-app .pdf-export-layout label {
          display: grid;
          gap: 3px;
          margin: 6px 0;
        }
        purple-pen-app .pdf-export-layout .dialog-check {
          display: flex;
          align-items: center;
          gap: 6px;
          margin: 7px 0;
        }
        purple-pen-app .pdf-export-layout select,
        purple-pen-app .pdf-export-layout input[type="text"] {
          width: 100%;
          box-sizing: border-box;
        }
        purple-pen-app .pdf-export-summary {
          grid-column: 1 / -1;
          min-height: 1.2em;
        }
        @media (max-width: 700px) {
          purple-pen-app .pdf-export-layout {
            grid-template-columns: 1fr;
          }
          purple-pen-app .pdf-export-summary {
            grid-column: auto;
          }
        }
      </style>
      <div class="app-frame">
        <input id="ppenInput" type="file" accept=".ppen,.xml,text/xml" hidden>
        <input id="mapInput" type="file" accept="image/*,application/pdf,.pdf" hidden>
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
            ["map-image", "Choose Map Image/PDF"],
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
            ["event-adjustment", "Event Adjustment"],
            ["map-info", "Map Info"]
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
          <button id="uiModeToggle" class="ui-mode-toggle" type="button" title="${escapeAttr(this.t("Switch between desktop and mobile UI"))}" aria-label="${escapeAttr(this.t("Switch between desktop and mobile UI"))}"></button>
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
            <select id="appLanguage" autocomplete="off">${SUPPORTED_LANGUAGES.map(([code, label]) => `<option value="${code}" ${code === this.language ? "selected" : ""}>${escapeHtml(label)}</option>`).join("")}</select>
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
              <h2>${escapeHtml(this.t("Adjustment"))}</h2>
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
        <dialog id="printAreaDialog" class="print-area-dialog" aria-modal="false" hidden>
          <form id="printAreaForm" class="print-area-form" autocomplete="off">
            <header class="dialog-heading">
              <h2 id="printAreaTitle">${escapeHtml(this.t("Set Export Area"))}</h2>
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
        <dialog id="pdfExportDialog" class="command-dialog pdf-export-dialog" aria-modal="false" hidden>
          <form id="pdfExportForm" class="command-form pdf-export-form" autocomplete="off">
            <header class="dialog-heading">
              <h2>${escapeHtml(this.t("Create PDF"))}</h2>
              <button type="button" class="icon-button" data-pdf-export-cancel aria-label="${escapeAttr(this.t("Close"))}">x</button>
            </header>
            <div class="pdf-export-layout">
              <fieldset>
                <legend>${escapeHtml(this.t("Courses"))}</legend>
                <label>${escapeHtml(this.t("Export"))}
                  <select id="pdfCourseScope"></select>
                </label>
              </fieldset>
              <fieldset>
                <legend>${escapeHtml(this.t("Appearance"))}</legend>
                <label class="dialog-check"><input id="pdfIncludeBaseMap" type="checkbox" checked> ${escapeHtml(this.t("Include base map"))}</label>
                <label class="dialog-check"><input id="pdfIncludeDescriptions" type="checkbox" checked> ${escapeHtml(this.t("Include control descriptions"))}</label>
                <label>${escapeHtml(this.t("Rendering"))}
                  <select id="pdfOutputMode">
                    <option value="auto">${escapeHtml(this.t("Automatic"))}</option>
                    <option value="vector">${escapeHtml(this.t("Vector PDF"))}</option>
                    <option value="raster">${escapeHtml(this.t("Raster PDF"))}</option>
                  </select>
                </label>
              </fieldset>
              <fieldset>
                <legend>${escapeHtml(this.t("Files"))}</legend>
                <label>${escapeHtml(this.t("File name prefix"))}
                  <input id="pdfFilePrefix" type="text">
                </label>
                <label class="dialog-check"><input id="pdfUseCourseNames" type="checkbox" checked> ${escapeHtml(this.t("Add course names to exported files"))}</label>
              </fieldset>
              <div id="pdfExportSummary" class="command-message pdf-export-summary"></div>
              <div id="pdfExportProgress" class="pdf-export-progress" hidden>
                <div class="pdf-export-progress-row">
                  <span id="pdfExportProgressText"></span>
                  <span id="pdfExportProgressPercent"></span>
                </div>
                <progress id="pdfExportProgressBar" value="0" max="100"></progress>
                <div class="pdf-export-meter" role="presentation">
                  <div id="pdfExportProgressFill" class="pdf-export-meter-fill"></div>
                </div>
              </div>
            </div>
            <footer class="dialog-actions">
              <button type="button" data-pdf-export-cancel>${escapeHtml(this.t("Cancel"))}</button>
              <button type="submit" class="primary-button" id="pdfExportCreateButton">${escapeHtml(this.t("Create"))}</button>
            </footer>
          </form>
        </dialog>
        <dialog id="commandDialog" class="command-dialog" hidden>
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
      this.applyApplicationLanguage(event.target.value);
    });
    this.querySelector("#uiModeToggle").addEventListener("click", () => this.toggleUiMode());

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
    this.querySelector("#printAreaDialog").addEventListener("input", event => {
      // iPad Safari can keep native select/radio controls in a stuck focus state if
      // the floating palette redraws while the picker is still committing a value.
      // The change handler below is enough for these controls; keep input only for
      // future text/number inputs that should preview while typing.
      if (event.target?.matches?.("select,input[type=radio],input[type=checkbox]")) {
        return;
      }
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
    this.querySelector("#pdfExportForm").addEventListener("submit", event => {
      event.preventDefault();
      void this.createPdfFromDialog();
    });
    this.querySelector("#pdfExportDialog").addEventListener("click", event => this.handlePdfExportDialogClick(event));
    this.querySelector("#pdfExportDialog").addEventListener("input", () => this.updatePdfExportDialogSummary());
    this.querySelector("#pdfExportDialog").addEventListener("change", () => this.updatePdfExportDialogSummary());
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
    this.enablePanelDrag(this.querySelector("#pdfExportDialog"));
    this.enablePanelDrag(this.querySelector("#commandDialog"));
    window.addEventListener("keydown", event => this.handleKey(event));
    window.addEventListener("pointerdown", () => this.ensureMobileLandscapeMode(), { passive: true });
    window.addEventListener("touchstart", () => this.ensureMobileLandscapeMode(), { passive: true });
    window.addEventListener("resize", () => {
      this.syncResponsiveUiClass();
      this.deferMapLayoutRefresh();
    });
    window.addEventListener("orientationchange", () => {
      this.syncResponsiveUiClass();
      this.deferMapLayoutRefresh();
    });
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

  setSelection(selection) {
    const state = this.store.snapshot();
    this.store.updateUi(ui => {
      ui.selection = selection;
      const role = teamAddControlRoleFromSelection(state.eventModel, ui, selection);
      if (role) {
        ui.teamAddControlRole = role;
      }
    }, "Selection");
  }

  render(state) {
    const keys = renderKeysFor(state);
    const preserveSelectionPanelInput = this.shouldPreserveSelectionPanelInput();
    const shouldRenderCourse = !this.renderKeys
      || this.renderKeys.eventModel !== keys.eventModel
      || this.renderKeys.selectedCourseId !== keys.selectedCourseId
      || this.renderKeys.showAllControls !== keys.showAllControls
      || this.renderKeys.variationMode !== keys.variationMode
      || this.renderKeys.variationCode !== keys.variationCode
      || this.renderKeys.relayTeam !== keys.relayTeam
      || this.renderKeys.relayLeg !== keys.relayLeg;
    const shouldRenderSelection = !preserveSelectionPanelInput && (shouldRenderCourse
      || !this.renderKeys
      || this.renderKeys.selection !== keys.selection);
    const shouldRenderReport = !this.renderKeys
      || this.renderKeys.reportTitle !== keys.reportTitle
      || this.renderKeys.reportKind !== keys.reportKind
      || this.renderKeys.reportHtml !== keys.reportHtml;
    const shouldRenderDescription = shouldRenderCourse
      || !this.renderKeys
      || this.renderKeys.selection !== keys.selection
      || this.renderKeys.teamAddControlRole !== keys.teamAddControlRole;
    const shouldRenderVariation = shouldRenderCourse
      || !this.renderKeys
      || this.renderKeys.selection !== keys.selection
      || this.renderKeys.variationBranch !== keys.variationBranch
      || this.renderKeys.variationAnchorCourseControl !== keys.variationAnchorCourseControl
      || this.renderKeys.variationInsertAfterCourseControl !== keys.variationInsertAfterCourseControl
      || this.renderKeys.variationInsertBeforeCourseControl !== keys.variationInsertBeforeCourseControl
      || this.renderKeys.variationSelectedSegment !== keys.variationSelectedSegment
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
    else if (preserveSelectionPanelInput) {
      this.syncBackgroundFields(document.activeElement);
      this.syncBackgroundMeasurement();
    }
    if (shouldRenderReport) {
      this.renderReport(state);
    }
    this.renderStatus(state);
    this.syncUiModeToggle();
    this.querySelector("#zoomSlider").value = Math.round(state.ui.zoom * 100);
    this.querySelector("#intensitySlider").value = Math.round(state.ui.mapIntensity * 100);
    this.mapView.requestDraw(state);
    this.renderKeys = keys;
  }

  shouldPreserveSelectionPanelInput() {
    const active = document.activeElement;
    return !!active
      && active.closest?.("#selectionPanel")
      && active.dataset?.backgroundField !== undefined;
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
    const nextCourseId = courseId === "all" ? "all" : Number(courseId);
    const nextCourseHasVariations = nextCourseId !== "all" && courseHasVariations(this.store.snapshot().eventModel, nextCourseId);
    this.store.updateUi(ui => {
      ui.selectedCourseId = nextCourseId;
      ui.selection = courseId === "all" ? null : { type: "course", id: Number(courseId) };
      ui.showAllControls = courseId === "all";
      ui.variationMode = nextCourseHasVariations ? "all" : "default";
      ui.variationCode = "";
      ui.variationBranch = null;
      ui.variationAnchorCourseControl = null;
      ui.variationInsertAfterCourseControl = null;
      ui.variationInsertBeforeCourseControl = null;
      ui.variationSelectedSegment = "";
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
      <label>${escapeHtml(this.t("Course branch"))}
        <select data-course-variation-mode>
          <option value="default" ${mode === "default" ? "selected" : ""}>${escapeHtml(this.t("Default"))}</option>
          <option value="all" ${mode === "all" ? "selected" : ""}>${escapeHtml(this.t("All branches"))}</option>
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
    const showingCourseRows = courseId !== "all";
    const course = showingCourseRows ? getCourse(eventModel, courseId) : null;
    const isScoreCourse = course?.kind === "score";
    const isTeamCourse = course?.kind === "team";
    let rows = !showingCourseRows
      ? allControlsView(eventModel)
      : courseView(eventModel, courseId, courseDisplayOptions(eventModel, ui));
    if (isScoreCourse) {
      rows = scoreCourseDescriptionRows(rows);
    }
    if (isTeamCourse) {
      rows = teamCourseDescriptionPanelRows(rows, course);
    }
    const mode = isTeamCourse ? "team" : (isScoreCourse ? "score" : "normal");
    const typeHeader = "";
    const addRole = ui.teamAddControlRole === "free" ? "free" : "mandatory";
    const teamToolbar = isTeamCourse ? `
      <div class="panel-inline-toolbar team-add-control-toolbar">
        <label>${escapeHtml(this.t("New normal controls"))}
          <select data-team-new-control-role>
            <option value="mandatory" ${addRole === "mandatory" ? "selected" : ""}>${escapeHtml(this.t("Mandatory"))}</option>
            <option value="free" ${addRole === "free" ? "selected" : ""}>${escapeHtml(this.t("Free"))}</option>
          </select>
        </label>
      </div>` : "";
    const html = `
      ${teamToolbar}
      <table class="description-table">
        <thead><tr><th>#</th><th>${escapeHtml(this.t("Code"))}</th>${typeHeader}<th>C</th><th>D</th><th>E</th><th>F</th><th>G</th><th>H</th></tr></thead>
        <tbody>
          ${rows.map(row => this.descriptionRow(row, mode)).join("")}
        </tbody>
      </table>
    `;
    this.querySelector("#descriptionPanel").innerHTML = html;
    this.paintIscdCanvases(this.querySelector("#descriptionPanel"));
  }

  descriptionRow(row, mode = "normal", selection = this.store.snapshot().ui.selection) {
    const language = descriptionLanguageForEvent(this.store.snapshot().eventModel);
    const descriptions = new Map((row.control.descriptions || []).map(item => [item.box, item]));
    const selected = selection?.type === "control" && Number(selection.id) === Number(row.control.id);
    const isScoreCourse = mode === "score";
    const isTeamCourse = mode === "team";
    const isTeamFree = isTeamCourse && isTeamFreeCourseControl(row.course, row.courseControl);
    const typeCell = "";
    return `<tr data-control-id="${row.control.id}" class="${selected ? "selected" : ""}">
      <td>${isScoreCourse || isTeamFree ? "" : escapeHtml(row.ordinal || "")}</td>
      <td>${escapeHtml(row.control.code || this.t(controlKindLabel(row.control.kind)))}</td>
      ${typeCell}
      ${["C", "D", "E", "F", "G", "H"].map(box => {
        if (isScoreCourse && box === "H") {
          return this.scoreDescriptionCell(row);
        }
        const value = descriptions.get(box)?.ref || descriptions.get(box)?.text || "";
        return `<td>
          <button type="button" class="iscd-cell-button" data-iscd-cell data-control-id="${row.control.id}" data-box="${box}" data-value="${escapeAttr(value)}" data-symbol-tooltip="${escapeAttr(this.t(ISCD_COLUMNS.find(([id]) => id === box)?.[1] || box))}: ${escapeAttr(iscdSymbolLabel(box, value, language) || this.t("Not specified"))}">
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


  teamRoleDescriptionCell(row) {
    if (row.control.kind !== "normal" || !row.courseControl) {
      return `<td class="team-role-cell"></td>`;
    }
    const role = isTeamFreeCourseControl(row.course, row.courseControl) ? "free" : "mandatory";
    return `<td class="team-role-cell">
      <select data-course-control-id="${row.courseControl.id}" data-field="courseControl.teamRole" title="${escapeAttr(this.t("Team role"))}">
        <option value="mandatory" ${role === "mandatory" ? "selected" : ""}>${escapeHtml(this.t("Mandatory"))}</option>
        <option value="free" ${role === "free" ? "selected" : ""}>${escapeHtml(this.t("Free"))}</option>
      </select>
    </td>`;
  }

  handleDescriptionPanelClick(event) {
    if (event.target.closest("[data-field='courseControl.points']")) {
      return;
    }
    const cell = event.target.closest("[data-iscd-cell]");
    const row = event.target.closest("[data-control-id]");
    if (!row) return;
    const controlId = Number(row.dataset.controlId);
    this.setSelection({ type: "control", id: controlId });
    if (cell) {
      event.preventDefault();
      this.openIscdSymbolPicker(controlId, cell.dataset.box, cell.dataset.value || "");
    }
  }

  handleDescriptionPanelChange(event) {
    const newControlRoleInput = event.target.closest("[data-team-new-control-role]");
    if (newControlRoleInput) {
      this.store.updateUi(ui => {
        ui.teamAddControlRole = newControlRoleInput.value === "free" ? "free" : "mandatory";
      }, "Team add control role");
      return;
    }
    const pointsInput = event.target.closest("[data-field='courseControl.points']");
    if (!pointsInput) return;
    const courseControlId = Number(pointsInput.dataset.courseControlId);
    if (!courseControlId) return;
    this.store.updateEvent(model => {
      const courseControl = getCourseControl(model, courseControlId);
      if (!courseControl) return;
      courseControl.points = Math.max(0, Number(pointsInput.value) || 0);
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
    if (course.kind === "team") {
      return `<p class="muted">${escapeHtml(this.t("Variations cannot be added to team courses."))}</p>`;
    }

    const branchCodes = variationBranchCodeMap(eventModel, course.id);
    const variations = allCourseVariations(eventModel, course.id);
    const anchorCourseControl = variationAnchorCourseControl(eventModel, course.id, ui);
    const canAddVariation = canAddVariationAtCourseControl(eventModel, course, anchorCourseControl);
    const selectedBranch = normalizedVariationBranch(eventModel, course.id, ui.variationBranch);
    const selectedBranchCode = selectedBranch ? branchCodes.get(Number(selectedBranch.branchCourseControl)) || "" : "";
    const anchorControl = getControl(eventModel, anchorCourseControl?.control);
    const topologyHtml = this.variationTopologySvg(eventModel, course.id, ui, branchCodes);
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
      <p class="muted">${canAddVariation && anchorCourseControl && anchorControl
        ? escapeHtml(this.t("Variation will start at {control}.", { control: controlDisplayName(anchorControl) }))
        : escapeHtml(this.t("Select a non-finish control that has a following control, then add a variation."))}</p>
      ${selectedBranch ? `<p class="variation-branch-hint">${escapeHtml(this.t("Selected branch"))}: <strong>${escapeHtml(selectedBranchCode || controlDisplayName(getControl(eventModel, getCourseControl(eventModel, selectedBranch.branchCourseControl)?.control)))}</strong>. ${escapeHtml(this.t("New controls will be inserted on this branch."))}</p>` : ""}
      <p class="muted">${escapeHtml(this.t("Click the stem before a fork to insert before the branch block; click a branch edge or branch label to insert on that branch; click the join checkpoint or an outgoing edge to insert after the branch block."))}</p>
      <div class="variation-tree">${topologyHtml || `<p class="muted">${escapeHtml(this.t("This course has no controls."))}</p>`}</div>
      ${variations.length ? `
        <h3>${escapeHtml(this.t("All variations"))}</h3>
        <div class="variation-code-list">${variations.map(variation => `<button type="button" data-course-variation-code-select="${escapeAttr(variation.code)}">${escapeHtml(variation.code)}</button>`).join("")}</div>
      ` : `<p class="muted">${escapeHtml(this.t("This course has no variations."))}</p>`}
    `;
  }

  variationTopologySvg(eventModel, courseId, ui, branchCodes) {
    const topology = courseTopology(eventModel, courseId);
    if (!topology.length) return "";
    const layout = layoutVariationTopology(topology, branchCodes);
    const nodeRadius = 16;
    const width = Math.max(180, Math.ceil(layout.width));
    const height = Math.max(120, Math.ceil(layout.height));
    const selectedBranch = normalizedVariationBranch(eventModel, courseId, ui.variationBranch);
    const selectedAnchor = variationAnchorCourseControl(eventModel, courseId, ui);
    const branchEdges = topologyBranchEdgeMap(topology);
    const commonJoinPoints = topologyCommonJoinPointMap(topology, layout.positions, nodeRadius);
    const previousCourseControls = topologyPreviousCourseControlMap(topology);
    const paths = [];
    const priorityHits = [];
    const junctions = [];
    const labels = [];
    const nodes = [];
    for (let index = 0; index < topology.length; index += 1) {
      const view = topology[index];
      const position = layout.positions[index];
      if (!position) continue;
      const commonJoinPoint = commonJoinPoints.get(index) || null;
      if (view.variation !== "loop" && (view.legTo || []).length > 1 && position.forkStart?.some(Boolean)) {
        const forkY = position.forkStart.find(Boolean)?.y;
        const forkOwnerCourseControlId = topologyNodeCourseControlId(view);
        junctions.push(`<circle class="variation-topology-junction-hit" cx="${formatSvgNumber(position.x)}" cy="${formatSvgNumber(forkY)}" r="22" data-select-variation-course-control="${forkOwnerCourseControlId}"></circle>`);
        const stemStartY = position.y + topologyConnectionRadius(view.control, nodeRadius);
        const stemPath = `M ${formatSvgNumber(position.x)} ${formatSvgNumber(stemStartY)} V ${formatSvgNumber(forkY)}`;
        paths.push(topologyPathSvg(stemPath, {
          insertAfterCourseControl: forkOwnerCourseControlId,
          segmentKey: `stem:${index}`,
          selected: ui.variationSelectedSegment === `stem:${index}`
        }));
        priorityHits.push(topologyHitPathSvg(stemPath, {
          insertAfterCourseControl: forkOwnerCourseControlId,
          segmentKey: `stem:${index}`
        }));
      }
      for (let legIndex = 0; legIndex < view.legTo.length; legIndex += 1) {
        const targetPosition = layout.positions[view.legTo[legIndex]];
        if (!targetPosition) continue;
        const targetView = topology[view.legTo[legIndex]];
        const directBranch = (view.legTo || []).length > 1 && topologyBranchCourseControlId(view, legIndex)
          ? {
            forkIndex: index,
            forkCourseControl: topologyNodeCourseControlId(view),
            branchCourseControl: topologyBranchCourseControlId(view, legIndex),
            joinIndex: view.joinIndex
          }
          : null;
        const edgeBranch = directBranch || branchEdges.get(topologyEdgeKey(index, view.legTo[legIndex]));
        const branchSelected = selectedBranch
          && edgeBranch
          && Number(selectedBranch.forkCourseControl) === Number(edgeBranch.forkCourseControl)
          && Number(selectedBranch.branchCourseControl) === Number(edgeBranch.branchCourseControl);
        const forkStart = position.forkStart?.[legIndex] || null;
        const startRadius = topologyConnectionRadius(view.control, nodeRadius);
        const endRadius = topologyConnectionRadius(targetView?.control, nodeRadius);
        const loopFallThroughEdge = view.variation === "loop" && legIndex === 0 && !edgeBranch;
        const insertAfterCourseControl = loopFallThroughEdge
          ? null
          : (edgeBranch && (view.legTo || []).length > 1
            ? edgeBranch.branchCourseControl
            : topologyNodeCourseControlId(view));
        const insertBeforeCourseControl = loopFallThroughEdge
          ? topologyNodeCourseControlId(targetView)
          : null;
        const segmentKey = `edge:${index}:${legIndex}:${view.legTo[legIndex]}`;
        const selected = ui.variationSelectedSegment === segmentKey;
        const branchAttrs = edgeBranch
          ? ` data-select-variation-branch data-fork-course-control="${edgeBranch.forkCourseControl}" data-branch-course-control="${edgeBranch.branchCourseControl}"`
          : "";
        const joinTarget = edgeBranch && Number(view.legTo[legIndex]) === Number(edgeBranch.joinIndex);
        if (joinTarget && edgeBranch && topology[edgeBranch.forkIndex]?.variation === "loop") {
          const ownerPosition = layout.positions[edgeBranch.forkIndex];
          const ownerView = topology[edgeBranch.forkIndex];
          const ownerRadius = topologyConnectionRadius(ownerView?.control, nodeRadius);
          const loopBottom = ownerPosition?.loopBottom || (Math.max(position.y, targetPosition.y) + TOPOLOGY_HEIGHT_UNIT * 0.75);
          const path = forkStart && topologyBranchIsEmpty(view, legIndex)
            ? topologyEmptyLoopBranchPath(ownerPosition, forkStart, loopBottom, ownerRadius)
            : topologyLoopReturnPath(position, ownerPosition, loopBottom, startRadius, ownerRadius);
          paths.push(topologyPathSvg(path, { insertAfterCourseControl, insertBeforeCourseControl, branchAttrs, segmentKey, selected }));
        }
        else if (joinTarget && !forkStart) {
          // For the last edge inside a branch, route only to the fork owner's
          // shared merge bus.  Do not draw it all the way to the join control.
          // With 3 branches the middle branch often sits on the same x as the
          // common post-merge stem; drawing to the join made the branch edge and
          // the outside-of-branch edge overlap into one SVG path/hit area.
          const forkJoinPoint = Number.isInteger(edgeBranch?.forkIndex)
            ? commonJoinPoints.get(edgeBranch.forkIndex)
            : null;
          const joinPoint = forkJoinPoint || commonJoinPoint || topologyBranchJoinPoint(position, targetPosition, startRadius, endRadius);
          const path = topologyBranchToJoinPath(position, joinPoint, startRadius);
          paths.push(topologyPathSvg(path, { insertAfterCourseControl, insertBeforeCourseControl, branchAttrs, segmentKey, selected }));
        }
        else if (joinTarget && forkStart && topologyBranchIsEmpty(view, legIndex)) {
          const joinPoint = commonJoinPoint || topologyEmptyBranchJoinPoint(forkStart, targetPosition, endRadius);
          const path = topologyEmptyBranchPath(position, forkStart, joinPoint);
          paths.push(topologyPathSvg(path, { insertAfterCourseControl, insertBeforeCourseControl, branchAttrs, segmentKey, selected }));
        }
        else {
          const path = topologyLegPath(position, targetPosition, forkStart, startRadius, endRadius, !!edgeBranch);
          paths.push(topologyPathSvg(path, { insertAfterCourseControl, insertBeforeCourseControl, branchAttrs, segmentKey, selected }));
          // Loop fall-through is the only edge that leaves the loop. Loop
          // return paths are drawn beside/over it, so give the exit edge a
          // late hit path with priority; otherwise clicks on the middle stem
          // are stolen by the loop branches.
          if (loopFallThroughEdge) {
            priorityHits.push(topologyHitPathSvg(path, {
              insertBeforeCourseControl,
              segmentKey
            }));
          }
        }
        const code = edgeBranch ? branchCodes.get(Number(edgeBranch.branchCourseControl)) : "";
        if (forkStart && code) {
          const labelX = forkStart.x + (forkStart.x < position.x ? -36 : 36);
          const labelY = forkStart.y + 2;
          labels.push(`<text class="variation-topology-code ${branchSelected ? "selected" : ""}" x="${formatSvgNumber(labelX)}" y="${formatSvgNumber(labelY)}" text-anchor="middle"${branchAttrs}>(${escapeHtml(code)})</text>`);
        }
      }
      const joinHitPoint = commonJoinPoint;
      const joinCourseControlId = Number.isInteger(view.joinIndex) && view.joinIndex !== index
        ? topologyNodeCourseControlId(topology[view.joinIndex])
        : null;
      if (view.variation !== "loop" && (view.legTo || []).length > 1 && joinHitPoint && joinCourseControlId) {
        junctions.push(`<circle class="variation-topology-junction-hit" cx="${formatSvgNumber(joinHitPoint.x)}" cy="${formatSvgNumber(joinHitPoint.y)}" r="24" data-select-variation-course-control="${joinCourseControlId}"></circle>`);
        const joinPosition = layout.positions[view.joinIndex];
        if (joinPosition) {
          const preJoinSegmentKey = `prejoin:${index}:${view.joinIndex}`;
          const joinTopY = joinPosition.y - topologyConnectionRadius(topology[view.joinIndex]?.control, nodeRadius);
          if (joinHitPoint.y < joinTopY - 0.5) {
            const preJoinPath = `M ${formatSvgNumber(joinHitPoint.x)} ${formatSvgNumber(joinHitPoint.y)} V ${formatSvgNumber(joinTopY)}`;
            // The visible common segment after all branch lanes have merged is
            // outside the per-branch lanes, but it is still before the join
            // checkpoint itself. Clicking this segment means: insert one shared
            // checkpoint after the branch block and before the join checkpoint.
            // The domain insertion code promotes the new checkpoint to the
            // variationEnd so branch tails do not treat it as a per-branch point.
            paths.push(topologyPathSvg(preJoinPath, {
              insertBeforeCourseControl: joinCourseControlId,
              segmentKey: preJoinSegmentKey,
              selected: ui.variationSelectedSegment === preJoinSegmentKey
            }));
            priorityHits.push(topologyHitPathSvg(preJoinPath, {
              insertBeforeCourseControl: joinCourseControlId,
              segmentKey: preJoinSegmentKey
            }));
          }
        }
      }
    }
    for (let index = 0; index < topology.length; index += 1) {
      const view = topology[index];
      const position = layout.positions[index];
      if (!position) continue;
      const courseControlId = topologyNodeCourseControlId(view);
      const selected = Number(selectedAnchor?.id) === Number(courseControlId);
      nodes.push(topologyNodeSvg(view.control, position, courseControlId, selected));
    }
    return `
      <svg class="variation-topology" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="${escapeAttr(this.t("Variation"))}">
        <g>${junctions.join("")}</g>
        <g>${paths.join("")}</g>
        <g>${priorityHits.join("")}</g>
        <g>${labels.join("")}</g>
        <g>${nodes.join("")}</g>
      </svg>
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
      const insertAfterCourseControl = Number(branchButton.dataset.insertAfterCourseControl) || null;
      const segment = branchButton.dataset.variationSegment || "";
      this.store.updateUi(ui => {
        ui.variationBranch = { forkCourseControl, branchCourseControl };
        ui.variationAnchorCourseControl = insertAfterCourseControl || forkCourseControl;
        ui.variationInsertAfterCourseControl = insertAfterCourseControl;
        ui.variationInsertBeforeCourseControl = null;
        ui.variationSelectedSegment = segment;
        ui.variationMode = "all";
        ui.status = this.t("Branch selected. Add controls to insert them on this branch.");
      }, "Select variation branch");
      return;
    }
    const insertionButton = event.target.closest("[data-select-variation-insertion]");
    if (insertionButton) {
      const insertAfterCourseControl = Number(insertionButton.dataset.insertAfterCourseControl) || null;
      const insertBeforeCourseControl = Number(insertionButton.dataset.insertBeforeCourseControl) || null;
      const segment = insertionButton.dataset.variationSegment || "";
      this.store.updateUi(ui => {
        ui.variationInsertAfterCourseControl = insertAfterCourseControl;
        ui.variationInsertBeforeCourseControl = insertBeforeCourseControl;
        ui.variationAnchorCourseControl = insertAfterCourseControl || insertBeforeCourseControl;
        ui.variationBranch = null;
        ui.variationSelectedSegment = segment;
        ui.variationMode = "all";
        ui.status = this.t("Variation insertion point selected.");
      }, "Select variation insertion");
      return;
    }
    const courseControlButton = event.target.closest("[data-select-variation-course-control]");
    if (courseControlButton) {
      const courseControlId = Number(courseControlButton.dataset.selectVariationCourseControl) || null;
      const state = this.store.snapshot();
      const courseControl = getCourseControl(state.eventModel, courseControlId);
      const isForkOwner = !!courseControl?.variation;
      this.store.updateUi(ui => {
        ui.variationAnchorCourseControl = courseControlId;
        // Clicking a node means "after this checkpoint". If the checkpoint
        // owns a fork, insertion moves the fork ownership down to the newly
        // inserted checkpoint so the new point sits before the branch block.
        ui.variationInsertAfterCourseControl = courseControlId;
        ui.variationInsertBeforeCourseControl = null;
        ui.variationSelectedSegment = `node:${courseControlId}`;
        ui.variationBranch = null;
        ui.selection = courseControl ? { type: "control", id: courseControl.control, courseControl: courseControl.id } : ui.selection;
        ui.variationMode = "all";
        ui.status = isForkOwner
          ? this.t("Fork selected. Add a control to place it before this branch block.")
          : this.t("Checkpoint selected. Add a control to place it after this checkpoint.");
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
    const course = getCourse(state.eventModel, courseId);
    if (course?.kind === "team") {
      this.store.updateUi(ui => { ui.status = this.t("Variations cannot be added to team courses."); }, "Add variation");
      return;
    }
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
        ui.variationInsertAfterCourseControl = pending.branchCourseControl || null;
        ui.variationInsertBeforeCourseControl = null;
        ui.variationSelectedSegment = pending.branchCourseControl ? `node:${pending.branchCourseControl}` : "";
        ui.variationMode = "all";
        ui.selection = pending.control ? { type: "control", id: pending.control, courseControl: pending.branchCourseControl || null } : ui.selection;
        ui.status = this.t("Variation added. The first branch is selected; add controls or choose another branch.");
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
      showActions: false,
      onOpen: dialog => this.paintIscdCanvases(dialog),
      apply: () => true
    });
  }

  iscdSymbolPickerHtml(controlId, box, selectedValue = "") {
    const language = descriptionLanguageForEvent(this.store.snapshot().eventModel);
    const options = symbolOptionsForColumn(box, language);
    return `
      <div class="iscd-picker-grid">
        ${options.map(([value, label]) => `
          <button type="button" class="iscd-picker-option ${value === selectedValue ? "selected" : ""}" data-iscd-symbol="${escapeAttr(value)}" data-control-id="${controlId}" data-box="${box}" data-symbol-tooltip="${escapeAttr(label === "Not specified" ? this.t(label) : label)}">
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
    if (!selection || selection.type === "event") {
      panel.innerHTML = this.eventAdjustmentEditor(eventModel);
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

  eventAdjustmentEditor(eventModel) {
    const event = eventModel.event || {};
    const descriptionStandard = event.standards?.description || "2024";
    const mapStandard = event.standards?.map || event.courseAppearance?.mapStandard || "2017";
    const circleRatio = Number(event.courseAppearance?.controlCircleSizeRatio) || 1;
    const numberingStart = Number(event.numbering?.start) || 31;
    return `
      <div class="event-adjustment-panel">
        <h3>${escapeHtml(this.t("Event Settings"))}</h3>
        <div class="form-grid">
          <label class="span-2">${escapeHtml(this.t("Event title"))}
            <input data-event-field="event.title" value="${escapeAttr(event.title || "")}" placeholder="${escapeAttr(this.t("Untitled Event"))}">
          </label>
          <label>${escapeHtml(this.t("Control circle size"))}
            <select data-event-field="event.courseAppearance.controlCircleSizeRatio">
              ${selectOptions(uniqueNumbers([circleRatio, 0.75, 0.9, 1, 1.1, 1.25, 1.5]), circleRatio, value => `${Math.round(value * 100)}%`)}
            </select>
          </label>
        </div>

        <h3>${escapeHtml(this.t("Standards"))}</h3>
        <div class="form-grid">
          <label>${escapeHtml(this.t("Description standard"))}
            <select data-event-field="event.standards.description">
              <option value="2024" ${descriptionStandard === "2024" ? "selected" : ""}>${escapeHtml(this.t("ISCD 2024"))}</option>
              <option value="2004" ${descriptionStandard === "2004" ? "selected" : ""}>${escapeHtml(this.t("ISCD 2004"))}</option>
            </select>
          </label>
          <label>${escapeHtml(this.t("Map standard"))}
            <select data-event-field="event.standards.map">
              <option value="2017" ${mapStandard === "2017" ? "selected" : ""}>${escapeHtml(this.t("ISOM 2017"))}</option>
              <option value="Spr2019" ${mapStandard === "Spr2019" ? "selected" : ""}>${escapeHtml(this.t("ISSprOM 2019"))}</option>
              <option value="2000" ${mapStandard === "2000" ? "selected" : ""}>${escapeHtml(this.t("ISOM 2000"))}</option>
            </select>
          </label>
        </div>
        <p class="muted">${escapeHtml(this.t("Current standards are shown directly in the selectors above."))}</p>

        <h3>${escapeHtml(this.t("Control numbering"))}</h3>
        <div class="form-grid">
          <label>${escapeHtml(this.t("First control code"))}
            <input data-event-field="event.numbering.start" type="number" min="1" step="1" value="${numberingStart}">
          </label>
          <label class="check">
            <input data-event-field="event.numbering.disallowInvertible" type="checkbox" ${event.numbering?.disallowInvertible ? "checked" : ""}>
            ${escapeHtml(this.t("Avoid invertible codes"))}
          </label>
        </div>
        <button type="button" class="secondary" data-event-action="auto-number">${escapeHtml(this.t("Apply auto numbering"))}</button>

        <h3>${escapeHtml(this.t("Bulk actions"))}</h3>
        <div class="form-grid">
          <label>${escapeHtml(this.t("Direction"))}
            <select data-event-move-direction>
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
            <select data-event-move-distance>${selectOptions(MOVE_DISTANCE_CHOICES, 10, value => `${value} ${this.t("map units")}`)}</select>
          </label>
        </div>
        <div class="button-row">
          <button type="button" class="secondary" data-event-action="move-all">${escapeHtml(this.t("Move all controls"))}</button>
          <button type="button" class="secondary" data-event-action="remove-unused">${escapeHtml(this.t("Remove unused controls"))}</button>
        </div>
      </div>
    `;
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
        ${background.sourceKind === "pdf" ? `<div class="readonly-field"><span>${escapeHtml(this.t("PDF page"))}</span><strong>${escapeHtml(String(background.pdf?.pageNumber || 1))} / ${escapeHtml(String(background.pdf?.pageCount || 1))}</strong></div>` : ""}
        ${background.sourceKind === "pdf" ? `<div class="readonly-field"><span>${escapeHtml(this.t("PDF render resolution"))}</span><strong>${Math.round(background.pdf?.renderDpi || 0)} dpi</strong></div>` : ""}
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
    const language = descriptionLanguageForEvent(this.store.snapshot().eventModel);
    const descriptions = new Map((control.descriptions || []).map(item => [item.box, item]));
    const scoreFinishControl = this.scoreFinishControlEditor(control);
    const teamControl = this.teamControlEditor(control);
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
      ${teamControl}
      <h3>${escapeHtml(this.t("Descriptions"))}</h3>
      <div class="description-edit">
        ${ISCD_COLUMNS.map(([box, label]) => `
          <label>${box}
            <select data-description-box="${box}" data-description-part="ref" title="${escapeAttr(this.t(label))}">
              ${symbolOptionsForColumn(box, language).map(([value, optionText]) => `<option value="${escapeAttr(value)}" ${value === (descriptions.get(box)?.ref || "") ? "selected" : ""}>${escapeHtml(optionText === "Not specified" ? this.t(optionText) : optionText)}</option>`).join("")}
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


  teamControlEditor(control) {
    const state = this.store.snapshot();
    const courseId = state.ui.selectedCourseId;
    if (!courseId || courseId === "all" || state.ui.showAllControls || control.kind !== "normal") {
      return "";
    }
    const course = getCourse(state.eventModel, courseId);
    if (course?.kind !== "team") {
      return "";
    }
    const row = courseView(state.eventModel, courseId, { allBranches: true })
      .find(candidate => Number(candidate.control?.id) === Number(control.id));
    if (!row?.courseControl) return "";
    const role = isTeamFreeCourseControl(course, row.courseControl) ? "free" : "mandatory";
    return `
      <h3>${escapeHtml(this.t("Team course"))}</h3>
      <div class="form-grid">
        <label>${escapeHtml(this.t("Team role"))}
          <select data-team-course-control-role="${row.courseControl.id}">
            <option value="mandatory" ${role === "mandatory" ? "selected" : ""}>${escapeHtml(this.t("Mandatory"))}</option>
            <option value="free" ${role === "free" ? "selected" : ""}>${escapeHtml(this.t("Free"))}</option>
          </select>
        </label>
      </div>
      <p class="muted">${escapeHtml(this.t("Team courses combine mandatory controls drawn like a normal course with free controls drawn like score controls."))}</p>
    `;
  }

  courseEditor(course) {
    const finishRoute = finishRouteForCourse(this.store.snapshot().eventModel, course.id);
    const relay = course.relay || { firstTeam: 1, teams: 0, legs: 1, branches: [] };
    const assignments = relayAssignments(this.store.snapshot().eventModel, course.id);
    return `
      <div class="form-grid">
        <label>${escapeHtml(this.t("Name"))} <input data-field="course.name" value="${escapeAttr(course.name)}"></label>
        <label>${escapeHtml(this.t("Kind"))} <select data-field="course.kind"><option value="normal" ${course.kind === "normal" ? "selected" : ""}>${escapeHtml(this.t("normal"))}</option><option value="score" ${course.kind === "score" ? "selected" : ""}>${escapeHtml(this.t("score"))}</option><option value="team" ${course.kind === "team" ? "selected" : ""}>${escapeHtml(this.t("team"))}</option></select></label>
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
      ${course.kind === "team" ? `<p class="muted">${escapeHtml(this.t("Team courses combine mandatory controls drawn like a normal course with free controls drawn without route legs."))}</p>` : `
        <h3>${escapeHtml(this.t("Relay"))}</h3>
        <div class="form-grid">
          <label>${escapeHtml(this.t("Teams"))} <input data-field="course.relay.teams" type="number" min="0" value="${relay.teams || 0}"></label>
          <label>${escapeHtml(this.t("Legs"))} <input data-field="course.relay.legs" type="number" min="1" value="${relay.legs || 1}"></label>
          <label>${escapeHtml(this.t("First team"))} <input data-field="course.relay.firstTeam" type="number" min="1" value="${relay.firstTeam || 1}"></label>
          <label class="check"><input data-field="course.hideVariationsOnMap" type="checkbox" ${course.hideVariationsOnMap ? "checked" : ""}> ${escapeHtml(this.t("Hide variation codes on map"))}</label>
        </div>
        ${this.relayBranchEditor(course, assignments)}
        ${this.relayAssignmentTable(assignments)}
      `}
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
        this.setSelection(null);
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
      case "event-adjustment":
        this.store.updateUi(ui => { ui.selection = { type: "event" }; }, "Event adjustment");
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
        if (state.ui.selectedCourseId !== "all") this.setSelection({ type: "course", id: state.ui.selectedCourseId });
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
        alert(this.t("O-Composer {version}\n\nThis version runs entirely in the browser. It can read and write .ppen files, render uncompressed .omap/.xmap XML maps, import high-resolution PDF basemaps, and export browser-generated files. Native OCAD map rendering, installed-font checks, and Livelox API publishing require desktop/runtime capabilities that browsers do not expose.", { version: APP_VERSION }));
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
    const beforeCourseControl = insertionBeforeCourseControlId(state);
    if (tool === "background-calibration") {
      this.store.updateUi(ui => {
        if (!ui.background) return;
        const imagePoint = backgroundImagePointForMap(ui.background, point);
        const imagePoints = [...(ui.background.calibration?.imagePoints || []), imagePoint].slice(-2);
        ui.background.calibration = { imagePoints };
        resetBackgroundCalibrationBase(ui.background);
        ui.selection = { type: "background" };
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
      const selectedCourse = selectedCourseId && selectedCourseId !== "all" ? getCourse(state.eventModel, selectedCourseId) : null;
      const teamAddRole = selectedCourse?.kind === "team" && state.ui.teamAddControlRole === "free" ? "free" : "mandatory";
      if (teamAddRole === "free" && (kind === "start" || kind === "finish")) {
        this.store.updateUi(ui => { ui.status = this.t("Free controls cannot be start or finish."); }, "Add control failed");
        return;
      }
      const snapped = snappedControlForPlacement(state, kind, point, this.mapView);
      if (snapped) {
        if (selectedCourseId && selectedCourseId !== "all" && !snapped.usedInSelectedCourse) {
          this.addExistingControlToCurrentCourse({ type: "control", id: snapped.control.id }, { teamRole: teamAddRole });
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
          const selection = addControlAt(model, kind, point, selectedCourseId, { afterCourseControl, beforeCourseControl, teamRole: teamAddRole });
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
        if ((afterCourseControl || beforeCourseControl || ui.variationBranch) && pending?.courseControl) {
          ui.variationInsertAfterCourseControl = pending.courseControl;
          ui.variationInsertBeforeCourseControl = null;
          ui.variationAnchorCourseControl = pending.courseControl;
          ui.variationSelectedSegment = `node:${pending.courseControl}`;
        }
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
        Object.assign(options, createDescriptionSpecialOptions(
          this.store.snapshot().eventModel,
          point,
          selectedCourseId,
          courseDisplayOptions(this.store.snapshot().eventModel, this.store.snapshot().ui)
        ));
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

  addExistingControlToCurrentCourse(selection, options = {}) {
    const state = this.store.snapshot();
    if (!selection?.id || !state.ui.selectedCourseId || state.ui.selectedCourseId === "all") return;
    const afterCourseControl = insertionCourseControlId(state);
    const beforeCourseControl = insertionBeforeCourseControlId(state);
    const course = getCourse(state.eventModel, state.ui.selectedCourseId);
    const control = getControl(state.eventModel, selection.id);
    const teamRole = options.teamRole || (course?.kind === "team" && state.ui.teamAddControlRole === "free" ? "free" : "mandatory");
    if (course?.kind === "team" && teamRole === "free" && (control?.kind === "start" || control?.kind === "finish")) {
      this.store.updateUi(ui => { ui.status = this.t("Free controls cannot be start or finish."); }, "Add existing control failed");
      return;
    }
    try {
      this.store.updateEvent(model => {
        const nextSelection = addExistingControlToCourse(model, state.ui.selectedCourseId, selection.id, { afterCourseControl, beforeCourseControl, teamRole });
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
      if ((afterCourseControl || beforeCourseControl || ui.variationBranch) && pending?.courseControl) {
        ui.variationInsertAfterCourseControl = pending.courseControl;
        ui.variationInsertBeforeCourseControl = null;
        ui.variationAnchorCourseControl = pending.courseControl;
        ui.variationSelectedSegment = `node:${pending.courseControl}`;
      }
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

  moveBackgroundCalibrationPoint(selection, point, options = {}) {
    if (selection?.type !== "background-calibration-point") return;
    this.store.updateUi(ui => {
      const background = ui.background;
      const pointIndex = Number(selection.pointIndex);
      if (!background || !Number.isInteger(pointIndex)) return;
      const imagePoints = [...(background.calibration?.imagePoints || [])];
      if (!imagePoints[pointIndex]) return;
      imagePoints[pointIndex] = backgroundImagePointForMap(background, point);
      background.calibration = { ...(background.calibration || {}), imagePoints };
      ui.selection = { type: "background" };
      if (!options.transient) {
        resetBackgroundCalibrationBase(background);
        applyBackgroundCalibration(background, backgroundAspect(background));
      }
    }, "Move calibration point");
    this.syncBackgroundMeasurement();
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
      this.updateBackgroundField(target.dataset.backgroundField, target.value);
      this.syncBackgroundFields(target);
      this.syncBackgroundMeasurement();
      return;
    }
    if (target.dataset.eventField !== undefined) {
      this.updateEventAdjustmentField(target.dataset.eventField, valueFromInput(target));
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

    if (target.dataset.teamCourseControlRole !== undefined && selection.type === "control") {
      const courseControlId = Number(target.dataset.teamCourseControlRole) || 0;
      this.store.updateEvent(model => {
        const courseControl = getCourseControl(model, courseControlId);
        if (courseControl) {
          courseControl.teamRole = target.value === "free" ? "free" : "mandatory";
          if (courseControl.teamRole === "free") courseControl.points = 0;
        }
      }, "Change team role");
      this.renderKeys = null;
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
      if (field === "course.kind") {
        applyCourseKindDefaults(object);
      }
    }, "Edit selection");
    // Re-render selection panel when kind or lineKind changes to show/hide relevant fields
    if (field === "special.lineKind" || field === "course.kind" || field.startsWith("course.relay.") || field === "course.hideVariationsOnMap") {
      this.renderKeys = null;
      this.render(this.store.snapshot());
    }
  }

  updateEventAdjustmentField(field, value) {
    this.store.updateEvent(model => {
      model.event ||= {};
      model.event.standards ||= { map: "2017", description: "2024" };
      model.event.descriptions ||= { lang: "en", color: "black" };
      model.event.numbering ||= { start: 31, disallowInvertible: true };
      model.event.courseAppearance ||= {};
      if (field === "event.title") {
        model.event.title = String(value || "").trim() || "Untitled Event";
        return;
      }
      if (field === "event.standards.description") {
        model.event.standards.description = value === "2004" ? "2004" : "2024";
        return;
      }
      if (field === "event.standards.map") {
        const mapStandard = value === "Spr2019" ? "Spr2019" : value === "2000" ? "2000" : "2017";
        model.event.standards.map = mapStandard;
        model.event.courseAppearance.mapStandard = mapStandard;
        return;
      }
      if (field === "event.numbering.start") {
        model.event.numbering.start = Math.max(1, Number(value) || 31);
        return;
      }
      if (field === "event.numbering.disallowInvertible") {
        model.event.numbering.disallowInvertible = !!value;
        return;
      }
      if (field === "event.courseAppearance.controlCircleSizeRatio") {
        model.event.courseAppearance.controlCircleSizeRatio = Number(value) || 1;
      }
    }, "Edit event settings");
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

  async openMapFile(file) {
    if (!file) return;
    if (isPdfFile(file)) {
      await this.openPdfMapFile(file);
      return;
    }
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
        alert(this.t("Could not import map image {name}.", {
          name: file.name || this.t("Unknown file")
        }));
      };
      image.src = url;
    };
    reader.readAsDataURL(file);
  }

  async openPdfMapFile(file) {
    this.store.updateUi(ui => {
      ui.status = this.t("Rendering PDF map…");
    }, "PDF map import started");
    try {
      const rendered = await renderPdfBasemap(file, {
        dpi: 300,
        choosePageNumber: pageCount => this.choosePdfMapPage(file, pageCount)
      });
      const image = await loadImage(rendered.url);
      this.mapView.setBackground(rendered.url);
      this.mapView.setOmap(null);
      const metadata = backgroundMetadataForPdf(file, rendered, image, this.store.snapshot().eventModel);
      this.store.updateUi(ui => {
        ui.background = metadata;
        ui.omap = null;
        ui.pan = { x: 0, y: 0 };
        ui.zoom = 1;
        ui.status = this.t("PDF map imported at {dpi} dpi.", { dpi: Math.round(rendered.renderDpi) });
      }, "PDF map loaded");
    }
    catch (error) {
      this.store.updateUi(ui => { ui.status = "Ready"; }, "PDF map import failed");
      alert(this.t("Could not import PDF map {name}: {message}", {
        name: file.name || this.t("Unknown file"),
        message: error.message || String(error)
      }));
    }
  }

  choosePdfMapPage(file, pageCount) {
    const answer = window.prompt(this.t("PDF {name} has {count} pages. Import page:", {
      name: file.name || this.t("Unknown file"),
      count: pageCount
    }), "1");
    const value = Number(answer);
    return Number.isFinite(value) && value > 0 ? Math.floor(value) : 1;
  }

  openOmapFile(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const currentMapScale = positiveScale(this.store.snapshot().eventModel.event?.map?.scale) || 15000;
        const omap = parseOmap(String(reader.result), file.name, { fallbackScale: currentMapScale });
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
    syncDescriptionLanguageWithApp(model);
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

  exportPdf() {
    this.openPdfExportDialog();
  }

  openPdfExportDialog() {
    const dialog = this.querySelector("#pdfExportDialog");
    this.populatePdfExportDialog();
    this.setPdfExportProgress(null);
    openFloatingPalette(dialog);
    this.updatePdfExportDialogSummary();
  }

  closePdfExportDialog() {
    closeFloatingPalette(this.querySelector("#pdfExportDialog"));
  }

  handlePdfExportDialogClick(event) {
    if (event.target.closest("[data-pdf-export-cancel]")) {
      this.closePdfExportDialog();
      return;
    }
  }

  populatePdfExportDialog() {
    const state = this.store.snapshot();
    const settings = readPdfExportSettings(effectivePrintArea(state.eventModel, state.ui.selectedCourseId));
    this.populatePdfCourseOptions(state, settings.courseScope);
    this.querySelector("#pdfIncludeBaseMap").checked = settings.includeBaseMap !== false;
    this.querySelector("#pdfIncludeDescriptions").checked = settings.includeDescriptions !== false;
    this.querySelector("#pdfOutputMode").value = settings.outputMode || PDF_OUTPUT_MODES.AUTO;
    this.querySelector("#pdfFilePrefix").value = settings.filePrefix || baseName(state.eventModel.sourceName);
    this.querySelector("#pdfUseCourseNames").checked = settings.useCourseNames !== false;
  }

  populatePdfCourseOptions(state, preferredValue) {
    const select = this.querySelector("#pdfCourseScope");
    const selectedCourse = state.ui.selectedCourseId === "all" ? null : getCourse(state.eventModel, state.ui.selectedCourseId);
    const options = [];
    if (selectedCourse) {
      options.push(`<option value="${PDF_COURSE_SCOPES.CURRENT}">${escapeHtml(this.t("Current course"))}: ${escapeHtml(selectedCourse.name)}</option>`);
    }
    else {
      options.push(`<option value="${PDF_COURSE_SCOPES.CURRENT}">${escapeHtml(this.t("Current view"))}</option>`);
    }
    options.push(`<option value="${PDF_COURSE_SCOPES.ALL_CONTROLS}">${escapeHtml(this.t("All Controls"))}</option>`);
    if (state.eventModel.courses.length) {
      options.push(`<option value="${PDF_COURSE_SCOPES.ALL_COURSES}">${escapeHtml(this.t("All courses, separate PDFs"))}</option>`);
    }
    for (const course of sortedCourses(state.eventModel)) {
      options.push(`<option value="${PDF_COURSE_SCOPES.COURSE_PREFIX}${course.id}">${escapeHtml(this.t("Course"))}: ${escapeHtml(course.name)}</option>`);
    }
    select.innerHTML = options.join("");
    const values = new Set(Array.from(select.options).map(option => option.value));
    select.value = values.has(preferredValue) ? preferredValue : PDF_COURSE_SCOPES.CURRENT;
  }

  pdfSettingsFromDialog() {
    return {
      courseScope: this.querySelector("#pdfCourseScope").value,
      includeBaseMap: this.querySelector("#pdfIncludeBaseMap").checked,
      includeDescriptions: this.querySelector("#pdfIncludeDescriptions").checked,
      pageBackground: false,
      outputMode: this.querySelector("#pdfOutputMode").value,
      filePrefix: this.querySelector("#pdfFilePrefix").value.trim() || baseName(this.store.snapshot().eventModel.sourceName),
      useCourseNames: this.querySelector("#pdfUseCourseNames").checked
    };
  }

  updatePdfExportDialogSummary() {
    const state = this.store.snapshot();
    const summary = this.querySelector("#pdfExportSummary");
    if (!summary) return;
    const settings = this.pdfSettingsFromDialog();
    const targets = this.pdfExportTargets(state, settings);
    const bitmapBaseMap = settings.includeBaseMap && this.mapView.hasBitmapBackground() && !this.mapView.omapMap;
    const renderingLabel = bitmapBaseMap
      ? "Raster PDF (bitmap base map)."
      : settings.outputMode === PDF_OUTPUT_MODES.RASTER
        ? "Raster PDF."
        : settings.outputMode === PDF_OUTPUT_MODES.VECTOR
          ? "Vector PDF."
          : "Automatic rendering.";
    const parts = [
      this.t(targets.length === 1 ? "1 PDF will be created." : "{count} PDFs will be created.", { count: targets.length }),
      this.t(settings.includeBaseMap ? "Base map included." : "Course overlay only."),
      this.t(renderingLabel)
    ];
    summary.hidden = false;
    summary.textContent = parts.join(" ");
  }

  async createPdfFromDialog() {
    try {
      this.setPdfExportBusy(true);
      await this.showPdfExportProgress({
        current: 0,
        total: 1,
        message: this.t("Preparing PDF export…")
      });

      const state = this.store.snapshot();
      const settings = this.pdfSettingsFromDialog();
      writePdfExportSettings(settings);
      const targets = this.pdfExportTargets(state, settings);
      if (!targets.length) {
        alert(this.t("No courses are available to export."));
        return;
      }

      const totalSteps = targets.length * PDF_EXPORT_STEPS_PER_TARGET + (targets.length > 1 ? 1 : 0);
      await this.showPdfExportProgress({
        current: 0,
        total: totalSteps,
        message: this.t("Preparing PDF export…")
      });
      const files = [];
      const usedFileNames = new Set();
      for (let index = 0; index < targets.length; index += 1) {
        const target = targets[index];
        const stepBase = index * PDF_EXPORT_STEPS_PER_TARGET;
        await this.showPdfExportProgress({
          current: stepBase,
          total: totalSteps,
          message: this.t("Creating {name}…", { name: target.name })
        });
        const blob = await this.createPdfBlobForTarget(state, target, settings, async (phase, message) => {
          await this.showPdfExportProgress({
            current: stepBase + phase,
            total: totalSteps,
            message
          });
        });
        const suffix = settings.useCourseNames || targets.length > 1 ? `-${safeFilePart(target.name)}` : "";
        files.push({
          name: uniqueFileName(`${safeFilePart(settings.filePrefix)}${suffix}.pdf`, usedFileNames),
          blob
        });
        await this.showPdfExportProgress({
          current: stepBase + PDF_EXPORT_STEPS_PER_TARGET,
          total: totalSteps,
          message: this.t("Created {current} of {total} PDFs.", { current: index + 1, total: targets.length })
        });
      }
      if (files.length === 1) {
        await this.showPdfExportProgress({
          current: totalSteps,
          total: totalSteps,
          message: this.t("PDF export ready.")
        });
        await wait(PDF_EXPORT_DONE_HOLD_MS);
        downloadBlob(files[0].name, files[0].blob);
      }
      else {
        await this.showPdfExportProgress({
          current: targets.length * PDF_EXPORT_STEPS_PER_TARGET,
          total: totalSteps,
          message: this.t("Packaging {count} PDFs into ZIP…", { count: files.length })
        });
        const zipBlob = await createZipBlob(files);
        await this.showPdfExportProgress({
          current: totalSteps,
          total: totalSteps,
          message: this.t("PDF export ready.")
        });
        await wait(PDF_EXPORT_DONE_HOLD_MS);
        downloadBlob(`${safeFilePart(settings.filePrefix)}.zip`, zipBlob);
      }
      this.closePdfExportDialog();
    }
    catch (error) {
      alert(error.message || String(error));
    }
    finally {
      this.setPdfExportBusy(false);
      this.setPdfExportProgress(null);
    }
  }

  async showPdfExportProgress(progress) {
    this.setPdfExportProgress(progress);
    await paintProgressFrame();
  }

  setPdfExportBusy(isBusy) {
    const dialog = this.querySelector("#pdfExportDialog");
    dialog?.querySelectorAll("input, select, button").forEach(control => {
      if (control.matches("[data-pdf-export-cancel]")) {
        control.disabled = false;
      }
      else {
        control.disabled = !!isBusy;
      }
    });
  }

  setPdfExportProgress(progress) {
    const box = this.querySelector("#pdfExportProgress");
    const bar = this.querySelector("#pdfExportProgressBar");
    const fill = this.querySelector("#pdfExportProgressFill");
    const text = this.querySelector("#pdfExportProgressText");
    const percent = this.querySelector("#pdfExportProgressPercent");
    if (!box || !bar || !text || !percent) return;
    if (!progress) {
      box.hidden = true;
      bar.value = 0;
      if (fill) fill.style.transform = "scaleX(0)";
      text.textContent = "";
      percent.textContent = "";
      return;
    }
    const total = Math.max(1, Number(progress.total) || 1);
    const current = clamp(Number(progress.current) || 0, 0, total);
    const value = Math.round(current / total * 100);
    box.hidden = false;
    bar.value = value;
    if (fill) fill.style.transform = `scaleX(${value / 100})`;
    text.textContent = progress.message || "";
    percent.textContent = `${value}%`;
  }

  pdfExportTargets(state, settings) {
    const scope = settings.courseScope || PDF_COURSE_SCOPES.CURRENT;
    const currentCourse = state.ui.selectedCourseId === "all" ? null : getCourse(state.eventModel, state.ui.selectedCourseId);
    if (scope === PDF_COURSE_SCOPES.ALL_COURSES) {
      return sortedCourses(state.eventModel).map(course => ({
        type: "course",
        courseId: course.id,
        uiCourseId: course.id,
        name: course.name || `course-${course.id}`
      }));
    }
    if (scope === PDF_COURSE_SCOPES.ALL_CONTROLS) {
      return [{ type: "all-controls", uiCourseId: "all", name: this.t("All Controls") }];
    }
    if (scope.startsWith(PDF_COURSE_SCOPES.COURSE_PREFIX)) {
      const courseId = Number(scope.slice(PDF_COURSE_SCOPES.COURSE_PREFIX.length));
      const course = getCourse(state.eventModel, courseId);
      return course ? [{ type: "course", courseId, uiCourseId: courseId, name: course.name || `course-${courseId}` }] : [];
    }
    if (currentCourse) {
      return [{ type: "course", courseId: currentCourse.id, uiCourseId: currentCourse.id, name: currentCourse.name || `course-${currentCourse.id}` }];
    }
    return [{ type: "all-controls", uiCourseId: "all", name: this.t("All Controls") }];
  }

  sourcePrintAreaForPdfTarget(state, target) {
    return target.type === "course"
      ? effectivePrintArea(state.eventModel, target.courseId)
      : effectivePrintArea(state.eventModel, "all");
  }

  pdfAreaForTarget(state, target, settings) {
    const sourceArea = normalizePrintArea(this.sourcePrintAreaForPdfTarget(state, target));
    if (!sourceArea.automatic) {
      return sourceArea;
    }
    return printAreaFromBounds(this.mapView.currentViewBounds(state.ui), sourceArea);
  }

  async createPdfBlobForTarget(state, target, settings, onProgress = async () => {}) {
    const area = this.pdfAreaForTarget(state, target, settings);
    const page = pageSizeMm(area);
    const marginMm = pageMarginMm(area);
    const size = pdfPixelSize(page, marginMm);
    const eventModel = settings.includeDescriptions
      ? state.eventModel
      : { ...cloneEvent(state.eventModel), specials: (state.eventModel.specials || []).filter(special => special.kind !== "descriptions") };
    const exportUi = {
      ...state.ui,
      selectedCourseId: target.uiCourseId,
      showAllControls: target.type === "all-controls"
    };
    const pdfBackground = this.vectorPdfBackgroundForExport(state, area, size, settings);
    const hasRasterMap = settings.includeBaseMap
      && this.mapView.hasBitmapBackground()
      && !this.mapView.omapMap
      && !pdfBackground;
    const forceRaster = settings.outputMode === PDF_OUTPUT_MODES.RASTER;
    const forceVector = settings.outputMode === PDF_OUTPUT_MODES.VECTOR;
    if (forceRaster || hasRasterMap) {
      await onProgress(1, this.t("Preparing {name} page…", { name: target.name }));
      await onProgress(2, this.t("Drawing {name} map…", { name: target.name }));
      const canvas = this.mapView.renderAreaToCanvas(eventModel, exportUi, area, size, {
        includeBitmapBackground: settings.includeBaseMap,
        includeOmapMap: settings.includeBaseMap,
        includePageBackground: false
      });
      await onProgress(4, this.t("Encoding {name} image…", { name: target.name }));
      const blob = await createRasterMapPdfBlob({
        pageWidthMm: page.width,
        pageHeightMm: page.height,
        marginMm,
        canvas,
        onProgress: async stage => {
          if (stage === "encoding-image") {
            await onProgress(5, this.t("Encoding {name} image…", { name: target.name }));
          }
          else if (stage === "building") {
            await onProgress(6, this.t("Writing {name} PDF…", { name: target.name }));
          }
        }
      });
      await onProgress(7, this.t("Finalizing {name}…", { name: target.name }));
      return blob;
    }
    await onProgress(1, this.t("Preparing {name} page…", { name: target.name }));
    const blob = await createVectorMapPdfBlob({
      pageWidthMm: page.width,
      pageHeightMm: page.height,
      marginMm,
      canvasWidth: size.width,
      canvasHeight: size.height,
      backgroundPdf: pdfBackground,
      onProgress: async stage => {
        const phase = vectorPdfProgressPhase(stage);
        const message = vectorPdfProgressMessage(stage, target.name, this.t.bind(this));
        if (phase && message) {
          await onProgress(phase, message);
        }
      },
      draw: ctx => this.mapView.renderAreaToContext(ctx, eventModel, exportUi, area, size, {
        includeBitmapBackground: false,
        includeOmapMap: settings.includeBaseMap,
        includePageBackground: false
      })
    });
    await onProgress(7, this.t("Finalizing {name}…", { name: target.name }));
    return blob;
  }


  vectorPdfBackgroundForExport(state, area, size, settings) {
    if (!settings.includeBaseMap) return null;
    const background = state.ui.background;
    if (background?.sourceKind !== "pdf" || !background.pdf?.sourceDataUrl) return null;
    const canvasBox = this.mapView.backgroundExportCanvasBox(state.ui, area, size);
    if (!canvasBox || !(Math.abs(canvasBox.width) > 0) || !(Math.abs(canvasBox.height) > 0)) return null;
    return {
      sourceDataUrl: background.pdf.sourceDataUrl,
      pageNumber: background.pdf.pageNumber || 1,
      canvasBox
    };
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
    const hasActions = config.showActions !== false && typeof config.apply === "function";
    const actions = this.querySelector("#commandActions");
    actions.style.display = hasActions ? "" : "none";
    if (hasActions) {
      this.querySelector("#commandApplyButton").textContent = this.t(config.applyLabel || "Apply");
    }
    this.querySelector("#commandCloseButton").hidden = config.showClose === false;
    const message = this.querySelector("#commandMessage");
    message.hidden = !config.message;
    message.textContent = this.t(config.message || "");
    config.onOpen?.(this.querySelector("#commandDialog"));
    const dialog = this.querySelector("#commandDialog");
    dialog?.removeAttribute("hidden");
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
      dialog?.removeAttribute("open");
    }
    dialog?.setAttribute("hidden", "");
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
    const eventAction = event.target.closest("[data-event-action]")?.dataset.eventAction;
    if (eventAction) {
      event.preventDefault();
      this.handleEventAdjustmentAction(eventAction);
      return;
    }
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
          ui.selection = { type: "background" };
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

  handleEventAdjustmentAction(action) {
    const state = this.store.snapshot();
    if (action === "auto-number") {
      const start = Number(state.eventModel.event.numbering?.start) || 31;
      const disallow = !!state.eventModel.event.numbering?.disallowInvertible;
      this.store.updateEvent(model => autoNumberControls(model, start, disallow), "Auto numbering");
      return;
    }
    if (action === "remove-unused") {
      this.store.updateEvent(model => {
        const count = removeUnusedControls(model);
        model.metadata.lastMessage = `${count} unused controls removed.`;
      }, "Remove unused controls");
      return;
    }
    if (action === "move-all") {
      const panel = this.querySelector("#selectionPanel");
      const direction = panel?.querySelector("[data-event-move-direction]")?.value || "east";
      const distance = Number(panel?.querySelector("[data-event-move-distance]")?.value) || 0;
      const vector = directionVector(direction);
      this.store.updateEvent(model => moveAllControls(model, vector.x * distance, vector.y * distance), "Move all controls");
    }
  }

  handleSelectionPanelInput(event) {
    const target = event.target;
    if (target.dataset.backgroundField !== undefined) {
      this.updateBackgroundField(target.dataset.backgroundField, target.value);
      this.syncBackgroundFields(target);
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

  syncBackgroundFields(activeTarget = null) {
    const background = this.store.snapshot().ui.background;
    if (!background) return;
    const eventModel = this.store.snapshot().eventModel;
    const mapScale = positiveScale(eventModel.event?.map?.scale) || 15000;
    const width = positiveNumber(background.widthMeters, 0);
    const aspect = backgroundAspect(background);
    const values = {
      widthMeters: formatInputNumber(width),
      heightMeters: formatInputNumber(positiveNumber(background.heightMeters, width * aspect)),
      printedWidthCm: formatInputNumber(background.printedWidthCm || (width ? width / mapScale * 100 : 0)),
      mapScale: String(mapScale),
      calibrationDistanceMeters: formatInputNumber(background.calibrationDistanceMeters || ""),
      calibrationPrintedCm: formatInputNumber(background.calibrationPrintedCm || "")
    };
    this.querySelectorAll("#selectionPanel [data-background-field]").forEach(input => {
      if (input === activeTarget) return;
      const nextValue = values[input.dataset.backgroundField];
      if (nextValue !== undefined && input.value !== nextValue) {
        input.value = nextValue;
      }
    });
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
      const width = clamp(saved, 260, Math.max(320, window.innerWidth - 360));
      workspace.style.setProperty("--left-panel-width", `${width}px`);
      if (this.resolvedUiMode() === UI_MODES.DESKTOP) {
        workspace.style.gridTemplateColumns = `${width}px 6px minmax(0, 1fr)`;
      }
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
        if (this.resolvedUiMode() === UI_MODES.DESKTOP) {
          workspace.style.gridTemplateColumns = `${width}px 6px minmax(0, 1fr)`;
        }
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
      ? resizedSpecialObject(state.eventModel, special, anchor, point, state.ui.selectedCourseId, courseDisplayOptions(state.eventModel, state.ui))
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
    const replacement = resizedSpecialObject(state.eventModel, special, anchor, point, state.ui.selectedCourseId, courseDisplayOptions(state.eventModel, state.ui));
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
    if (isFloatingDialogOpen(dialog)) {
      this.updatePrintAreaDialogPreview();
      return;
    }
    openFloatingPalette(dialog);
    this.updatePrintAreaDialogPreview();
  }

  closePrintAreaDialog(clearPreview = true) {
    const dialog = this.querySelector("#printAreaDialog");
    this.keepPrintAreaDialogPreview = !clearPreview;
    const closedNatively = closeFloatingPalette(dialog);
    if (!closedNatively) {
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
    if (!isFloatingDialogOpen(dialog)) return;
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
              <option value="team">${escapeHtml(this.t("Team course"))}</option>
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
      this.setSelection(null);
      return;
    }

    const control = getControl(state.eventModel, selection.id);
    const courses = coursesUsingControl(state.eventModel, selection.id);
    if (!courses.length) {
      this.store.updateEvent(model => deleteSelection(model, selection, {
        selectedCourseId: "all"
      }), "Delete control");
      this.setSelection(null);
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
        this.setSelection(null);
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

function teamAddControlRoleFromSelection(eventModel, ui, selection) {
  const courseId = ui?.selectedCourseId;
  if (!courseId || courseId === "all" || !selection) return null;
  const course = getCourse(eventModel, courseId);
  if (course?.kind !== "team") return null;
  let courseControl = null;
  const candidateIds = [];
  if (selection.courseControl) candidateIds.push(Number(selection.courseControl));
  if (Array.isArray(selection.courseControls)) {
    candidateIds.push(...selection.courseControls.map(Number));
  }
  for (const id of candidateIds) {
    const candidate = getCourseControl(eventModel, id);
    if (candidate?.control) {
      courseControl = candidate;
      break;
    }
  }
  if (!courseControl && (selection.type === "control" || selection.type === "control-number")) {
    const controlId = Number(selection.id || selection.control) || 0;
    if (controlId) {
      const row = courseView(eventModel, courseId, { allBranches: true })
        .find(candidate => Number(candidate.control?.id) === controlId && candidate.courseControl);
      courseControl = row?.courseControl || null;
    }
  }
  if (!courseControl) return null;
  return isTeamFreeCourseControl(course, courseControl) ? "free" : "mandatory";
}

function objectForSelection(model, selection) {
  if (selection.type === "control") return getControl(model, selection.id);
  if (selection.type === "course") return getCourse(model, selection.id);
  if (selection.type === "special") return findById(model.specials, selection.id);
  if (selection.type === "leg" || selection.type === "leg-bend") return findLeg(model, selection.startControl, selection.endControl);
  if (selection.type === "control-number") return getCourseControl(model, selection.courseControl);
  return null;
}

function teamCourseDescriptionPanelRows(rows, course) {
  const mandatory = [];
  const free = [];
  for (const row of rows || []) {
    if (row.control?.kind === "normal" && isTeamFreeCourseControl(course, row.courseControl)) {
      free.push(row);
    }
    else {
      mandatory.push(row);
    }
  }
  return [...mandatory, ...scoreCourseDescriptionRows(free)];
}

function courseDisplayOptions(eventModel, ui = {}) {
  const courseId = ui.selectedCourseId;
  if (!courseId || courseId === "all") return {};
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

const TOPOLOGY_WIDTH_UNIT = 104;
const TOPOLOGY_HEIGHT_UNIT = 60;
const TOPOLOGY_PADDING_X = 56;
const TOPOLOGY_PADDING_Y = 28;

function layoutVariationTopology(topology, branchCodes) {
  const abstractPositions = Array(topology.length).fill(null);
  const maxSteps = Math.max(1000, topology.length * 50);
  let steps = 0;

  function assign(startIndex, endIndex, startX, startY) {
    let index = Number(startIndex);
    let x = startX;
    let y = startY;
    let totalWidth = 1;
    let totalHeight = 0;
    while (Number.isInteger(index) && index >= 0 && index < topology.length && index !== endIndex && steps++ < maxSteps) {
      const view = topology[index];
      const legTo = view.legTo || [];
      const numForks = legTo.length;
      abstractPositions[index] = { x, y, forkStart: null };
      totalWidth = Math.max(totalWidth, 1);
      totalHeight += 1;
      y += 1;

      if (numForks > 1) {
        const loop = view.joinIndex === index;
        const startFork = loop ? 1 : 0;
        const forkSize = Array(numForks).fill(null);
        const forkStart = Array(numForks).fill(null);
        let totalForkWidth = loop ? 1 : 0;
        let maxForkHeight = 1;

        for (let branchIndex = startFork; branchIndex < numForks; branchIndex += 1) {
          forkSize[branchIndex] = assign(legTo[branchIndex], view.joinIndex, 0, 0);
          totalForkWidth += forkSize[branchIndex].width;
          maxForkHeight = Math.max(maxForkHeight, forkSize[branchIndex].height);
        }

        if (loop) {
          const forkY = y;
          forkStart[0] = { x, y: forkY, code: "", loopFallThru: true };
          const halfForks = Math.ceil(numForks / 2);
          let leftX = x - 0.5;
          for (let branchIndex = startFork; branchIndex < halfForks; branchIndex += 1) {
            leftX -= forkSize[branchIndex].width;
          }
          let forkX = leftX;
          for (let branchIndex = startFork; branchIndex < halfForks; branchIndex += 1) {
            forkX += forkSize[branchIndex].width / 2;
            forkStart[branchIndex] = { x: forkX, y: forkY, code: branchCodes.get(Number(topologyBranchCourseControlId(view, branchIndex))) || "", loopStart: true };
            forkX += forkSize[branchIndex].width / 2;
          }
          forkX = x + 0.5;
          for (let branchIndex = halfForks; branchIndex < numForks; branchIndex += 1) {
            forkX += forkSize[branchIndex].width / 2;
            forkStart[branchIndex] = { x: forkX, y: forkY, code: branchCodes.get(Number(topologyBranchCourseControlId(view, branchIndex))) || "", loopStart: true };
            forkX += forkSize[branchIndex].width / 2;
          }
          totalForkWidth = Math.max(totalForkWidth, Math.abs(forkX - x) * 2, Math.abs(x - leftX) * 2);
          abstractPositions[index].loopBottom = y + maxForkHeight + 1.5;
        }
        else {
          const forkY = y - 0.5;
          let forkX = x - totalForkWidth / 2;
          for (let branchIndex = startFork; branchIndex < numForks; branchIndex += 1) {
            forkX += forkSize[branchIndex].width / 2;
            forkStart[branchIndex] = { x: forkX, y: forkY, code: branchCodes.get(Number(topologyBranchCourseControlId(view, branchIndex))) || "" };
            forkX += forkSize[branchIndex].width / 2;
          }
        }

        abstractPositions[index].forkStart = forkStart;
        for (let branchIndex = startFork; branchIndex < numForks; branchIndex += 1) {
          const branchStartY = loop ? forkStart[branchIndex].y + 1 : forkStart[branchIndex].y + 1;
          assign(legTo[branchIndex], view.joinIndex, forkStart[branchIndex].x, branchStartY);
        }
        const forkBlockHeight = loop ? maxForkHeight + 2 : maxForkHeight + 2;
        totalHeight += forkBlockHeight;
        y += forkBlockHeight;
        totalWidth = Math.max(totalWidth, totalForkWidth);
        index = view.joinIndex === index ? legTo[0] : view.joinIndex;
      }
      else {
        index = numForks === 1 ? legTo[0] : -1;
      }
    }
    return { width: Math.max(1, totalWidth), height: Math.max(1, totalHeight) };
  }

  assign(0, topology.length, 0, 0);

  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  function include(point) {
    if (!point) return;
    minX = Math.min(minX, point.x);
    maxX = Math.max(maxX, point.x);
    minY = Math.min(minY, point.y);
    maxY = Math.max(maxY, point.y);
  }
  for (const position of abstractPositions) {
    include(position);
    if (Number.isFinite(position?.loopBottom)) include({ x: position.x, y: position.loopBottom });
    for (const fork of position?.forkStart || []) include(fork);
  }
  if (!Number.isFinite(minX)) {
    minX = maxX = minY = maxY = 0;
  }

  const positions = abstractPositions.map(position => position && ({
    x: TOPOLOGY_PADDING_X + (position.x - minX) * TOPOLOGY_WIDTH_UNIT,
    y: TOPOLOGY_PADDING_Y + (position.y - minY) * TOPOLOGY_HEIGHT_UNIT,
    loopBottom: Number.isFinite(position.loopBottom) ? TOPOLOGY_PADDING_Y + (position.loopBottom - minY) * TOPOLOGY_HEIGHT_UNIT : null,
    forkStart: position.forkStart?.map(fork => fork && ({
      x: TOPOLOGY_PADDING_X + (fork.x - minX) * TOPOLOGY_WIDTH_UNIT,
      y: TOPOLOGY_PADDING_Y + (fork.y - minY) * TOPOLOGY_HEIGHT_UNIT,
      code: fork.code || "",
      loopStart: !!fork.loopStart,
      loopFallThru: !!fork.loopFallThru
    })) || null
  }));

  return {
    positions,
    width: (maxX - minX) * TOPOLOGY_WIDTH_UNIT + TOPOLOGY_PADDING_X * 2,
    height: (maxY - minY) * TOPOLOGY_HEIGHT_UNIT + TOPOLOGY_PADDING_Y * 2
  };
}

function topologyLegPath(from, to, forkStart, startRadius, endRadius, skipForkStem = false) {
  const startY = from.y + startRadius;
  const endY = to.y - endRadius;
  if (forkStart) {
    if (forkStart.loopFallThru) {
      return `M ${formatSvgNumber(from.x)} ${formatSvgNumber(startY)} V ${formatSvgNumber(endY)}`;
    }
    const start = skipForkStem
      ? `M ${formatSvgNumber(from.x)} ${formatSvgNumber(forkStart.y)}`
      : `M ${formatSvgNumber(from.x)} ${formatSvgNumber(startY)} V ${formatSvgNumber(forkStart.y)}`;
    return [
      start,
      `H ${formatSvgNumber(forkStart.x)}`,
      `V ${formatSvgNumber(endY)}`
    ].join(" ");
  }
  if (Math.abs(from.x - to.x) < 0.1) {
    return `M ${formatSvgNumber(from.x)} ${formatSvgNumber(startY)} V ${formatSvgNumber(endY)}`;
  }
  const midY = (startY + endY) / 2;
  return [
    `M ${formatSvgNumber(from.x)} ${formatSvgNumber(startY)}`,
    `V ${formatSvgNumber(midY)}`,
    `H ${formatSvgNumber(to.x)}`,
    `V ${formatSvgNumber(endY)}`
  ].join(" ");
}

function topologyBranchJoinPoint(from, join, startRadius, endRadius) {
  const startY = from.y + startRadius;
  const endY = join.y - endRadius;
  return {
    x: join.x,
    y: Math.abs(from.x - join.x) < 0.1 ? endY : (startY + endY) / 2
  };
}

function topologyBranchToJoinPath(from, joinPoint, startRadius) {
  const startY = from.y + startRadius;
  if (Math.abs(from.x - joinPoint.x) < 0.1) {
    return `M ${formatSvgNumber(from.x)} ${formatSvgNumber(startY)} V ${formatSvgNumber(joinPoint.y)}`;
  }
  return [
    `M ${formatSvgNumber(from.x)} ${formatSvgNumber(startY)}`,
    `V ${formatSvgNumber(joinPoint.y)}`,
    `H ${formatSvgNumber(joinPoint.x)}`
  ].join(" ");
}


function topologyLoopReturnPath(from, owner, loopBottom, startRadius, ownerRadius) {
  if (!from || !owner) return "";
  const startY = from.y + startRadius;
  const xDir = from.x < owner.x ? -1 : 1;
  const returnX = Math.abs(from.x - owner.x) < 0.1
    ? owner.x
    : owner.x + xDir * Math.max(10, ownerRadius * 0.75);
  const endY = owner.y + ownerRadius;
  const bottomY = Math.max(loopBottom || 0, startY + TOPOLOGY_HEIGHT_UNIT * 0.35, endY + TOPOLOGY_HEIGHT_UNIT * 0.8);
  return [
    `M ${formatSvgNumber(from.x)} ${formatSvgNumber(startY)}`,
    `V ${formatSvgNumber(bottomY)}`,
    `H ${formatSvgNumber(returnX)}`,
    `V ${formatSvgNumber(endY)}`
  ].join(" ");
}

function topologyEmptyLoopBranchPath(owner, forkStart, loopBottom, ownerRadius) {
  if (!owner || !forkStart) return "";
  const xDir = forkStart.x < owner.x ? -1 : 1;
  const returnX = owner.x + xDir * Math.max(10, ownerRadius * 0.75);
  const endY = owner.y + ownerRadius;
  const bottomY = Math.max(loopBottom || 0, forkStart.y + TOPOLOGY_HEIGHT_UNIT * 0.6, endY + TOPOLOGY_HEIGHT_UNIT * 0.8);
  return [
    `M ${formatSvgNumber(owner.x)} ${formatSvgNumber(forkStart.y)}`,
    `H ${formatSvgNumber(forkStart.x)}`,
    `V ${formatSvgNumber(bottomY)}`,
    `H ${formatSvgNumber(returnX)}`,
    `V ${formatSvgNumber(endY)}`
  ].join(" ");
}

function topologyEmptyBranchJoinPoint(forkStart, join, endRadius) {
  const joinTopY = join.y - endRadius;
  const desiredGap = TOPOLOGY_HEIGHT_UNIT * 0.45;
  return {
    x: join.x,
    y: Math.min(joinTopY, Math.max(forkStart.y + desiredGap, joinTopY - desiredGap))
  };
}

function topologyEmptyBranchPath(from, forkStart, joinPoint) {
  return [
    `M ${formatSvgNumber(from.x)} ${formatSvgNumber(forkStart.y)}`,
    `H ${formatSvgNumber(forkStart.x)}`,
    `V ${formatSvgNumber(joinPoint.y)}`,
    `H ${formatSvgNumber(joinPoint.x)}`
  ].join(" ");
}

function topologyPathSvg(path, options = {}) {
  const selectedClass = options.selected ? " selected" : "";
  return [
    topologyHitPathSvg(path, options),
    `<path class="variation-topology-leg${selectedClass}" d="${path}"${topologyPathAttrs(options)}></path>`
  ].join("");
}

function topologyHitPathSvg(path, options = {}) {
  return `<path class="variation-topology-leg-hit" d="${path}"${topologyPathAttrs(options)}></path>`;
}

function topologyPathAttrs(options = {}) {
  const insertAfter = Number(options.insertAfterCourseControl) || null;
  const insertBefore = Number(options.insertBeforeCourseControl) || null;
  const insertAttrs = insertAfter ? ` data-select-variation-insertion data-insert-after-course-control="${insertAfter}"` : "";
  const insertBeforeAttrs = insertBefore ? ` data-select-variation-insertion data-insert-before-course-control="${insertBefore}"` : "";
  const segmentAttr = options.segmentKey ? ` data-variation-segment="${escapeAttr(options.segmentKey)}"` : "";
  const branchAttrs = options.branchAttrs || "";
  return `${insertAttrs}${insertBeforeAttrs}${segmentAttr}${branchAttrs}`;
}

function topologyNodeCourseControlId(view) {
  return Number(view?.ownerCourseControlId) || Number(view?.courseControlIds?.[0]) || null;
}

function topologyBranchCourseControlId(view, branchIndex) {
  if (Array.isArray(view?.branchCourseControlIds) && branchIndex in view.branchCourseControlIds) {
    return Number(view.branchCourseControlIds[branchIndex]) || null;
  }
  return Number(view?.courseControlIds?.[branchIndex]) || null;
}

function topologyBranchIsEmpty(view, branchIndex) {
  const branch = view?.branchCourseControls?.[branchIndex];
  return !!branch
    && Number(branch.control) === Number(view?.control?.id)
    && Number(branch.nextCourseControl) === Number(view?.joinCourseControlId);
}

function topologyBranchEdgeMap(topology) {
  const branchEdges = new Map();
  for (let forkIndex = 0; forkIndex < topology.length; forkIndex += 1) {
    const fork = topology[forkIndex];
    if (!fork || (fork.legTo || []).length <= 1 || !(fork.branchCourseControlIds || fork.courseControlIds || []).length) continue;
    for (let legIndex = 0; legIndex < fork.legTo.length; legIndex += 1) {
      const targetIndex = fork.legTo[legIndex];
      if (!Number.isInteger(targetIndex)) continue;
      const branchCourseControl = topologyBranchCourseControlId(fork, legIndex);
      if (!branchCourseControl) continue;
      const branch = {
        forkIndex,
        forkCourseControl: topologyNodeCourseControlId(fork),
        branchCourseControl,
        joinIndex: fork.joinIndex
      };
      markTopologyBranchEdges(topology, branchEdges, forkIndex, targetIndex, fork.joinIndex, branch, new Set());
    }
  }
  return branchEdges;
}

function topologyPreviousCourseControlMap(topology) {
  const previous = new Map();
  for (let fromIndex = 0; fromIndex < topology.length; fromIndex += 1) {
    const from = topology[fromIndex];
    const fromCourseControl = topologyNodeCourseControlId(from);
    if (!fromCourseControl) continue;
    for (const toIndex of from.legTo || []) {
      if (Number.isInteger(toIndex) && !previous.has(toIndex)) {
        previous.set(toIndex, fromCourseControl);
      }
    }
  }
  return previous;
}

function markTopologyBranchEdges(topology, branchEdges, fromIndex, toIndex, joinIndex, branch, seen) {
  if (!Number.isInteger(fromIndex) || !Number.isInteger(toIndex)) return;
  branchEdges.set(topologyEdgeKey(fromIndex, toIndex), branch);
  if (toIndex === joinIndex || seen.has(toIndex)) return;
  seen.add(toIndex);
  const view = topology[toIndex];
  for (const nextIndex of view?.legTo || []) {
    if (Number.isInteger(nextIndex)) {
      markTopologyBranchEdges(topology, branchEdges, toIndex, nextIndex, joinIndex, branch, seen);
    }
  }
}

function topologyEdgeKey(fromIndex, toIndex) {
  return `${fromIndex}:${toIndex}`;
}

function topologyCommonJoinPointMap(topology, positions, nodeRadius) {
  const map = new Map();
  for (let index = 0; index < topology.length; index += 1) {
    const view = topology[index];
    if (!view || view.variation === "loop" || (view.legTo || []).length <= 1) continue;
    const point = topologyCommonJoinPoint(view, topology, positions, nodeRadius, positions[index]);
    if (point) map.set(index, point);
  }
  return map;
}

function topologyCommonJoinPoint(view, topology, positions, nodeRadius, ownerPosition = null) {
  if (!Number.isInteger(view.joinIndex) || view.joinIndex < 0 || view.joinIndex >= positions.length) {
    return null;
  }
  const joinPosition = positions[view.joinIndex];
  if (!joinPosition) return null;
  const joinTopY = joinPosition.y - topologyConnectionRadius(topology[view.joinIndex]?.control, nodeRadius);
  const sideMergeYs = [];
  const centerTailBottomYs = [];
  const emptyMergeYs = [];

  for (let legIndex = 0; legIndex < (view.legTo || []).length; legIndex += 1) {
    const startIndex = view.legTo[legIndex];
    if (!Number.isInteger(startIndex)) continue;
    const forkStart = ownerPosition?.forkStart?.[legIndex] || null;
    const startsAtJoin = Number(startIndex) === Number(view.joinIndex);

    if (startsAtJoin && forkStart && topologyBranchIsEmpty(view, legIndex)) {
      emptyMergeYs.push(topologyEmptyBranchJoinPoint(forkStart, joinPosition, topologyConnectionRadius(topology[view.joinIndex]?.control, nodeRadius)).y);
      continue;
    }

    const tailIndices = topologyBranchTailIndices(topology, startIndex, view.joinIndex);
    for (const tailIndex of tailIndices) {
      if (!Number.isInteger(tailIndex) || tailIndex === view.joinIndex) continue;
      const tailPosition = positions[tailIndex];
      if (!tailPosition) continue;
      const tailStartY = tailPosition.y + topologyConnectionRadius(topology[tailIndex]?.control, nodeRadius);
      if (Math.abs(tailPosition.x - joinPosition.x) < 0.1) {
        // A centered branch is visually on the same x as the common post-merge
        // stem.  It must stop at the shared merge bus, not force that bus down
        // to the join checkpoint; otherwise the shared stem disappears.
        centerTailBottomYs.push(tailStartY);
      }
      else {
        sideMergeYs.push((tailStartY + joinTopY) / 2);
      }
    }
  }

  const mergeYs = sideMergeYs.length
    ? sideMergeYs.concat(centerTailBottomYs)
    : (centerTailBottomYs.length ? centerTailBottomYs : emptyMergeYs);
  if (!mergeYs.length) return null;
  // Use one shared merge bus for every branch before the join checkpoint.
  // Side branches determine the visible horizontal merge bus. Center branches
  // only require the bus to be below their checkpoint label; they must not
  // collapse the bus onto the join checkpoint, because that hides the public
  // post-branch edge and merges two different insertion targets.
  const y = Math.min(joinTopY, Math.max(...mergeYs));
  return { x: joinPosition.x, y };
}

function topologyBranchTailIndices(topology, startIndex, joinIndex) {
  const tails = [];
  const seen = new Set();

  function visit(index) {
    if (!Number.isInteger(index) || index < 0 || index >= topology.length) return;
    if (index === joinIndex || seen.has(index)) return;
    seen.add(index);
    const nextIndices = (topology[index]?.legTo || []).filter(Number.isInteger);
    if (!nextIndices.length || nextIndices.includes(joinIndex)) {
      tails.push(index);
    }
    for (const nextIndex of nextIndices) {
      if (nextIndex !== joinIndex) visit(nextIndex);
    }
  }

  visit(startIndex);
  return tails;
}

function topologyConnectionRadius(control, symbolRadius) {
  if (!control) return 0;
  if (control.kind === "start" || control.kind === "finish") return symbolRadius;
  // The ordering diagram is an editable graph. A checkpoint separates the
  // incoming edge from the outgoing edge, so the line and its hit area must stop
  // above the label and resume below it instead of running through the number.
  // Otherwise clicking near the checkpoint can select the wrong insertion edge.
  return symbolRadius + 2;
}

function topologyNodeSvg(control, position, courseControlId, selected, options = {}) {
  const attrs = options.attrs || `data-select-variation-course-control="${courseControlId}"`;
  const selectedClass = selected ? " selected" : "";
  const hitCircle = `<circle class="variation-topology-node-hit" cx="${formatSvgNumber(position.x)}" cy="${formatSvgNumber(position.y)}" r="14" ${attrs}></circle>`;
  if (control.kind === "start") {
    const points = `${formatSvgNumber(position.x)},${formatSvgNumber(position.y - 18)} ${formatSvgNumber(position.x - 14)},${formatSvgNumber(position.y + 10)} ${formatSvgNumber(position.x + 14)},${formatSvgNumber(position.y + 10)}`;
    return `<g class="variation-topology-node${selectedClass}" ${attrs}>${hitCircle}<polygon points="${points}" ${attrs}></polygon></g>`;
  }
  if (control.kind === "finish") {
    return `<g class="variation-topology-node${selectedClass}" ${attrs}>${hitCircle}<circle cx="${formatSvgNumber(position.x)}" cy="${formatSvgNumber(position.y)}" r="13" ${attrs}></circle><circle cx="${formatSvgNumber(position.x)}" cy="${formatSvgNumber(position.y)}" r="9" ${attrs}></circle></g>`;
  }
  const label = control.kind === "normal" ? control.code || "" : controlKindLabel(control.kind);
  const className = control.kind === "normal" ? "variation-topology-number" : "variation-topology-special";
  return `<g class="variation-topology-node${selectedClass}" ${attrs}>${hitCircle}<text class="${className}" x="${formatSvgNumber(position.x)}" y="${formatSvgNumber(position.y + 8)}" text-anchor="middle" ${attrs}>${escapeHtml(label)}</text></g>`;
}

function formatSvgNumber(value) {
  return Number(value).toFixed(2).replace(/\.?0+$/, "");
}

function insertionCourseControlId(state) {
  const selection = state.ui.selection;
  const courseId = state.ui.selectedCourseId;
  if (!courseId || courseId === "all") return null;
  if (insertionBeforeCourseControlId(state)) return null;
  const explicitInsertion = Number(state.ui.variationInsertAfterCourseControl) || null;
  if (explicitInsertion && courseControlTopologyIds(state.eventModel, courseId).has(explicitInsertion)) {
    return explicitInsertion;
  }
  const branchTail = lastCourseControlInVariationBranch(state.eventModel, courseId, state.ui.variationBranch);
  if (branchTail?.id && courseControlTopologyIds(state.eventModel, courseId).has(Number(branchTail.id))) {
    return Number(branchTail.id);
  }
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

function insertionBeforeCourseControlId(state) {
  const courseId = state.ui.selectedCourseId;
  if (!courseId || courseId === "all") return null;
  const explicitInsertion = Number(state.ui.variationInsertBeforeCourseControl) || null;
  return explicitInsertion && courseControlTopologyIds(state.eventModel, courseId).has(explicitInsertion)
    ? explicitInsertion
    : null;
}

function variationAnchorCourseControl(eventModel, courseId, ui = {}) {
  if (!courseId || courseId === "all") return null;
  const rows = courseView(eventModel, courseId, { allBranches: true });
  const rowCourseControls = new Map(rows.map(row => [Number(row.courseControl?.id), row.courseControl]));
  const anchored = rowCourseControls.get(Number(ui.variationAnchorCourseControl));
  if (anchored && variationAnchorIsUsable(eventModel, anchored)) return anchored;
  const selection = ui.selection;
  if (selection?.type === "control-number" && selection.courseControl) {
    const candidate = rowCourseControls.get(Number(selection.courseControl)) || null;
    return variationAnchorIsUsable(eventModel, candidate) ? candidate : null;
  }
  if (selection?.type === "control") {
    const candidate = rows.find(row => Number(row.control?.id) === Number(selection.id))?.courseControl || null;
    return variationAnchorIsUsable(eventModel, candidate) ? candidate : null;
  }
  if (selection?.type === "leg" || selection?.type === "leg-bend") {
    const candidate = rows.find(row => Number(row.control?.id) === Number(selection.startControl))?.courseControl || null;
    return variationAnchorIsUsable(eventModel, candidate) ? candidate : null;
  }
  return null;
}

function variationAnchorIsUsable(eventModel, courseControl) {
  if (!courseControl || courseControl.variation) return false;
  const control = getControl(eventModel, courseControl.control);
  if (!control || control.kind === "finish") return false;
  return !!getCourseControl(eventModel, courseControl.nextCourseControl);
}

function canAddVariationAtCourseControl(eventModel, course, courseControl) {
  if (!course || course.kind === "score") return false;
  return variationAnchorIsUsable(eventModel, courseControl);
}

function normalizedVariationBranch(eventModel, courseId, variationBranch) {
  if (!variationBranch || !courseId || courseId === "all") return null;
  const fork = getCourseControl(eventModel, variationBranch.forkCourseControl);
  const branch = getCourseControl(eventModel, variationBranch.branchCourseControl);
  if (!fork?.variation || !branch) return null;
  if (!fork.variationCourseControls.map(Number).includes(Number(branch.id))) return null;
  const courseControlIds = courseControlTopologyIds(eventModel, courseId);
  if (!courseControlIds.has(Number(fork.id)) || !courseControlIds.has(Number(branch.id))) return null;
  return {
    forkCourseControl: Number(fork.id),
    branchCourseControl: Number(branch.id)
  };
}

function courseControlTopologyIds(eventModel, courseId) {
  const course = getCourse(eventModel, courseId);
  const ids = new Set();
  const maxSteps = Math.max(1000, (eventModel.courseControls?.length || 0) * 20);
  let steps = 0;

  function visit(startId, joinId = null) {
    let currentId = Number(startId) || 0;
    while (currentId && currentId !== Number(joinId) && steps++ < maxSteps) {
      const courseControl = getCourseControl(eventModel, currentId);
      if (!courseControl || ids.has(currentId)) break;
      ids.add(currentId);
      if (courseControl.variation) {
        for (const branchId of courseControl.variationCourseControls || []) {
          const branchCourseControl = getCourseControl(eventModel, branchId);
          if (!branchCourseControl) continue;
          ids.add(Number(branchCourseControl.id));
          visit(branchCourseControl.nextCourseControl, courseControl.variationEnd);
        }
        currentId = Number(courseControl.variation === "loop" ? courseControl.nextCourseControl : courseControl.variationEnd) || 0;
      }
      else {
        currentId = Number(courseControl.nextCourseControl) || 0;
      }
    }
  }

  visit(course?.firstCourseControl);
  return ids;
}

function previousCourseControlId(eventModel, courseId, courseControlId) {
  const course = getCourse(eventModel, courseId);
  const target = Number(courseControlId) || 0;
  if (!course || !target) return null;
  const seen = new Set();
  const maxSteps = Math.max(1000, (eventModel.courseControls?.length || 0) * 20);
  let steps = 0;

  function visit(startId, joinId = null, previousId = null) {
    let currentId = Number(startId) || 0;
    let lastId = Number(previousId) || null;
    while (currentId && currentId !== Number(joinId) && steps++ < maxSteps) {
      if (currentId === target) return lastId;
      if (seen.has(currentId)) return null;
      seen.add(currentId);
      const courseControl = getCourseControl(eventModel, currentId);
      if (!courseControl) return null;
      if (courseControl.variation) {
        for (const branchId of courseControl.variationCourseControls || []) {
          const branchCourseControl = getCourseControl(eventModel, branchId);
          if (!branchCourseControl) continue;
          if (Number(branchCourseControl.id) === target) return lastId;
          const found = visit(branchCourseControl.nextCourseControl, courseControl.variationEnd, branchCourseControl.id);
          if (found) return found;
        }
        lastId = Number(courseControl.variation === "loop" ? courseControl.id : courseControl.variationEnd) || lastId;
        currentId = Number(courseControl.variation === "loop" ? courseControl.nextCourseControl : courseControl.variationEnd) || 0;
      }
      else {
        lastId = currentId;
        currentId = Number(courseControl.nextCourseControl) || 0;
      }
    }
    return null;
  }

  return visit(course.firstCourseControl);
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
    showAllControls: (ui.selectedCourseId || "all") === "all",
    variationMode: ui.variationMode || "default",
    variationCode: ui.variationCode || "",
    variationAddKind: ui.variationAddKind === "loop" ? "loop" : "fork",
    variationAddBranches: Math.max(2, Math.min(6, Math.round(Number(ui.variationAddBranches) || 2))),
    variationAnchorCourseControl: Number(ui.variationAnchorCourseControl) || null,
    variationInsertAfterCourseControl: Number(ui.variationInsertAfterCourseControl) || null,
    variationInsertBeforeCourseControl: Number(ui.variationInsertBeforeCourseControl) || null,
    variationSelectedSegment: ui.variationSelectedSegment || "",
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

function resizedSpecialObject(eventModel, special, resize, point, selectedCourseId = "all", displayOptions = {}) {
  if (special.kind === "descriptions") {
    return resizedDescriptionSpecial(eventModel, special, resize.anchor || resize, point, selectedCourseId, displayOptions);
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
    sourceKind: "image",
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

function backgroundMetadataForPdf(file, rendered, image, eventModel) {
  const metadata = backgroundMetadataForImage({
    name: file.name,
    type: "application/pdf"
  }, rendered.url, image, eventModel);
  metadata.sourceKind = "pdf";
  metadata.pdf = {
    pageNumber: rendered.pageNumber,
    pageCount: rendered.pageCount,
    renderDpi: rendered.renderDpi,
    renderScale: rendered.renderScale,
    sourceWidthPt: rendered.sourceWidthPt,
    sourceHeightPt: rendered.sourceHeightPt,
    sourceDataUrl: rendered.sourceDataUrl || null
  };
  return metadata;
}

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Could not load rendered PDF image."));
    image.src = url;
  });
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
  const courseControls = selectedNumberCourseControls(model, selection);
  const control = getControl(model, courseControls[0]?.control || selection?.control);
  if (!courseControls.length || !control) return;
  const numberLocation = {
    x: location.x - control.location.x,
    y: location.y - control.location.y
  };
  for (const courseControl of courseControls) {
    if (Number(courseControl.control) === Number(control.id)) {
      courseControl.numberLocation = { ...numberLocation };
    }
  }
}

function resetControlNumberLocation(model, selection) {
  for (const courseControl of selectedNumberCourseControls(model, selection)) {
    courseControl.numberLocation = null;
  }
}

function selectedNumberCourseControls(model, selection) {
  const ids = new Set([
    Number(selection?.courseControl) || 0,
    ...(Array.isArray(selection?.courseControls) ? selection.courseControls.map(Number) : [])
  ].filter(Boolean));
  const courseControls = [...ids]
    .map(id => getCourseControl(model, id))
    .filter(Boolean);
  if (courseControls.length) {
    return courseControls;
  }
  const controlId = Number(selection?.control) || 0;
  return controlId
    ? model.courseControls.filter(courseControl => Number(courseControl.control) === controlId)
    : [];
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

function applyCourseKindDefaults(course) {
  if (!course) return;
  course.options ||= {};
  if (course.kind === "score") {
    course.labelKind = course.labelKind === "sequence" ? "code-and-score" : course.labelKind;
    course.options.scoreColumn = course.options.scoreColumn >= 0 ? course.options.scoreColumn : 7;
  }
  else if (course.kind === "team") {
    course.labelKind = course.labelKind || "sequence";
    course.options.scoreColumn = -1;
  }
  else {
    course.options.scoreColumn = -1;
    if (["code-and-score", "code-and-score-brackets", "code-and-score-dash", "score"].includes(course.labelKind)) {
      course.labelKind = "sequence";
    }
  }
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


function isAppleTouchDevice() {
  const nav = window.navigator || {};
  const platform = nav.platform || "";
  const userAgent = nav.userAgent || "";
  return /iPad|iPhone|iPod/i.test(userAgent) || (platform === "MacIntel" && Number(nav.maxTouchPoints || 0) > 1);
}

function useInlineFloatingPalette() {
  // iPad Safari has long-standing quirks around non-modal <dialog> plus native
  // <select> pickers: touches can remain captured by the dialog's top-layer
  // state after the picker closes. For the export-area palette we do not need
  // native dialog modality, so on Apple touch devices we keep it as a normal
  // positioned element with an open attribute.
  return isAppleTouchDevice();
}

function openFloatingPalette(dialog) {
  if (!dialog) return;
  if (useInlineFloatingPalette()) {
    dialog.dataset.inlinePalette = "true";
    dialog.setAttribute("open", "");
    dialog.removeAttribute("hidden");
    dialog.style.display = "";
    return;
  }
  dialog.dataset.inlinePalette = "false";
  dialog.removeAttribute("hidden");
  if (dialog.show) {
    dialog.show();
  }
  else {
    dialog.setAttribute("open", "");
  }
}

function closeFloatingPalette(dialog) {
  if (!dialog) return false;
  const inline = dialog.dataset.inlinePalette === "true" || useInlineFloatingPalette();
  if (!inline && dialog.open && dialog.close) {
    dialog.close();
    dialog.setAttribute("hidden", "");
    return true;
  }
  dialog.removeAttribute("open");
  dialog.setAttribute("hidden", "");
  dialog.dataset.inlinePalette = inline ? "true" : "false";
  return false;
}

function isFloatingDialogOpen(dialog) {
  return !!dialog && !dialog.hasAttribute("hidden") && (dialog.open || dialog.hasAttribute("open"));
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
  // 12 px/mm is about 305 dpi. This keeps PDF/bitmap basemaps sharp in raster PDF exports.
  const pixelsPerMm = 12;
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


function forceWholePageLanguageReload() {
  const location = window.location;
  const url = new URL(location.href);
  url.searchParams.set(LANGUAGE_REFRESH_PARAM, String(Date.now()));
  location.replace(url.toString());
}

function consumeLanguageRefreshParam() {
  const location = window.location;
  const url = new URL(location.href);
  if (!url.searchParams.has(LANGUAGE_REFRESH_PARAM)) return;
  url.searchParams.delete(LANGUAGE_REFRESH_PARAM);
  const cleanUrl = `${url.pathname}${url.search}${url.hash}`;
  window.history.replaceState(window.history.state, document.title, cleanUrl || location.pathname);
}

function symbolOptionsForColumn(box, language = "en") {
  const options = [["", "Not specified"], ...getIscdSymbolOptions(box, language)];
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
    variationInsertAfterCourseControl: ui.variationInsertAfterCourseControl || "",
    variationInsertBeforeCourseControl: ui.variationInsertBeforeCourseControl || "",
    variationSelectedSegment: ui.variationSelectedSegment || "",
    variationBranch: ui.variationBranch ? `${ui.variationBranch.forkCourseControl || ""}:${ui.variationBranch.branchCourseControl || ""}` : "",
    relayTeam: ui.relayTeam || 1,
    relayLeg: ui.relayLeg || 1,
    selection: selectionKey(ui.selection),
    reportTitle: ui.report?.title || "",
    reportKind: ui.report?.kind || "",
    reportHtml: ui.report?.html || ""
  };
}

function syncDescriptionLanguageWithApp(eventModel) {
  const language = descriptionLanguageForEvent(eventModel);
  eventModel.event ||= {};
  eventModel.event.descriptions ||= { lang: language, color: "black" };
  eventModel.event.descriptions.lang = language;
  eventModel.event.descriptionLangId = language;
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


function defaultPdfExportSettings() {
  return {
    courseScope: PDF_COURSE_SCOPES.CURRENT,
    pageWidth: 827,
    pageHeight: 1169,
    pageMargins: 11.811,
    pageLandscape: false,
    includeBaseMap: true,
    includeDescriptions: true,
    pageBackground: false,
    outputMode: PDF_OUTPUT_MODES.AUTO,
    filePrefix: "",
    useCourseNames: true
  };
}

function readPdfExportSettings(fallbackArea = null) {
  const defaults = { ...defaultPdfExportSettings() };
  if (fallbackArea) {
    defaults.pageWidth = fallbackArea.pageWidth;
    defaults.pageHeight = fallbackArea.pageHeight;
    defaults.pageMargins = fallbackArea.pageMargins;
    defaults.pageLandscape = fallbackArea.pageLandscape;
  }
  try {
    const raw = localStorage.getItem(PDF_EXPORT_SETTINGS_KEY);
    if (!raw) return defaults;
    const parsed = JSON.parse(raw);
    return { ...defaults, ...(parsed || {}) };
  }
  catch {
    return defaults;
  }
}

function writePdfExportSettings(settings) {
  try {
    localStorage.setItem(PDF_EXPORT_SETTINGS_KEY, JSON.stringify(settings));
  }
  catch {
    // Ignore quota/private-mode failures; export still works with this run's settings.
  }
}

function safeFilePart(value) {
  const cleaned = String(value || "event")
    .trim()
    .replace(/[\\/:*?"<>|]+/g, "-")
    .replace(/\s+/g, " ")
    .replace(/^-+|-+$/g, "");
  return cleaned || "event";
}

function uniqueFileName(fileName, usedNames) {
  const normalized = fileName || "event.pdf";
  if (!usedNames.has(normalized)) {
    usedNames.add(normalized);
    return normalized;
  }
  const dotIndex = normalized.lastIndexOf(".");
  const stem = dotIndex > 0 ? normalized.slice(0, dotIndex) : normalized;
  const extension = dotIndex > 0 ? normalized.slice(dotIndex) : "";
  let index = 2;
  let candidate = `${stem}-${index}${extension}`;
  while (usedNames.has(candidate)) {
    index += 1;
    candidate = `${stem}-${index}${extension}`;
  }
  usedNames.add(candidate);
  return candidate;
}

function vectorPdfProgressPhase(stage) {
  return {
    "loading-fonts": 2,
    drawing: 3,
    building: 5,
    "loading-pdf-lib": 6,
    "reading-base-map": 6,
    saving: 7,
    done: 7
  }[stage] || 0;
}

function vectorPdfProgressMessage(stage, name, translate) {
  if (stage === "loading-fonts") return translate("Loading PDF fonts…");
  if (stage === "drawing") return translate("Drawing {name} map…", { name });
  if (stage === "building") return translate("Writing {name} PDF…", { name });
  if (stage === "loading-pdf-lib" || stage === "reading-base-map") return translate("Merging {name} base map…", { name });
  if (stage === "saving" || stage === "done") return translate("Finalizing {name}…", { name });
  return "";
}

function nextFrame() {
  return new Promise(resolve => requestAnimationFrame(() => resolve()));
}

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function paintProgressFrame() {
  await nextFrame();
  await wait(30);
}

async function createZipBlob(files) {
  const encoder = new TextEncoder();
  const localParts = [];
  const centralParts = [];
  let offset = 0;
  const timestamp = zipDosDateTime(new Date());
  for (const file of files) {
    const nameBytes = encoder.encode(file.name);
    const bytes = new Uint8Array(await file.blob.arrayBuffer());
    const crc = crc32(bytes);
    const localHeader = zipLocalHeader(nameBytes, bytes.length, crc, timestamp);
    const centralHeader = zipCentralHeader(nameBytes, bytes.length, crc, offset, timestamp);
    localParts.push(localHeader, bytes);
    centralParts.push(centralHeader);
    offset += localHeader.length + bytes.length;
  }
  const centralSize = centralParts.reduce((sum, part) => sum + part.length, 0);
  const endRecord = zipEndRecord(files.length, centralSize, offset);
  return new Blob([...localParts, ...centralParts, endRecord], { type: "application/zip" });
}

function zipLocalHeader(nameBytes, size, crc, timestamp) {
  const header = new Uint8Array(30 + nameBytes.length);
  const view = new DataView(header.buffer);
  view.setUint32(0, 0x04034b50, true);
  view.setUint16(4, 20, true);
  view.setUint16(6, 0x0800, true);
  view.setUint16(8, 0, true);
  view.setUint16(10, timestamp.time, true);
  view.setUint16(12, timestamp.date, true);
  view.setUint32(14, crc, true);
  view.setUint32(18, size, true);
  view.setUint32(22, size, true);
  view.setUint16(26, nameBytes.length, true);
  header.set(nameBytes, 30);
  return header;
}

function zipCentralHeader(nameBytes, size, crc, offset, timestamp) {
  const header = new Uint8Array(46 + nameBytes.length);
  const view = new DataView(header.buffer);
  view.setUint32(0, 0x02014b50, true);
  view.setUint16(4, 20, true);
  view.setUint16(6, 20, true);
  view.setUint16(8, 0x0800, true);
  view.setUint16(10, 0, true);
  view.setUint16(12, timestamp.time, true);
  view.setUint16(14, timestamp.date, true);
  view.setUint32(16, crc, true);
  view.setUint32(20, size, true);
  view.setUint32(24, size, true);
  view.setUint16(28, nameBytes.length, true);
  view.setUint32(42, offset, true);
  header.set(nameBytes, 46);
  return header;
}

function zipEndRecord(count, centralSize, centralOffset) {
  const header = new Uint8Array(22);
  const view = new DataView(header.buffer);
  view.setUint32(0, 0x06054b50, true);
  view.setUint16(8, count, true);
  view.setUint16(10, count, true);
  view.setUint32(12, centralSize, true);
  view.setUint32(16, centralOffset, true);
  return header;
}

function zipDosDateTime(date) {
  const year = Math.max(1980, date.getFullYear());
  return {
    date: ((year - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate(),
    time: (date.getHours() << 11) | (date.getMinutes() << 5) | Math.floor(date.getSeconds() / 2)
  };
}

let crc32Table = null;

function crc32(bytes) {
  if (!crc32Table) {
    crc32Table = new Uint32Array(256);
    for (let index = 0; index < 256; index += 1) {
      let value = index;
      for (let bit = 0; bit < 8; bit += 1) {
        value = (value & 1) ? (0xedb88320 ^ (value >>> 1)) : (value >>> 1);
      }
      crc32Table[index] = value >>> 0;
    }
  }
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc = crc32Table[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
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

function readUiModePreference() {
  try {
    const value = localStorage.getItem(UI_MODE_KEY);
    return Object.values(UI_MODES).includes(value) ? value : UI_MODES.AUTO;
  }
  catch {
    return UI_MODES.AUTO;
  }
}

function setUiModePreference(mode) {
  try {
    if (mode === UI_MODES.AUTO) {
      localStorage.removeItem(UI_MODE_KEY);
    }
    else {
      localStorage.setItem(UI_MODE_KEY, mode);
    }
  }
  catch {}
}

function isNarrowMobileViewport() {
  return isPhoneViewport();
}

function isPhoneViewport() {
  const width = Math.max(1, window.innerWidth || document.documentElement.clientWidth || 0);
  const height = Math.max(1, window.innerHeight || document.documentElement.clientHeight || 0);
  const shortSide = Math.min(width, height);
  const longSide = Math.max(width, height);
  const userAgent = navigator.userAgent || "";
  const platform = navigator.platform || "";
  const maxTouchPoints = Number(navigator.maxTouchPoints || 0);

  // iPad and Android tablets should keep the desktop UI, even when held in portrait.
  // Some iPad models report only 744 CSS px in portrait, which was below the old
  // 760px breakpoint and incorrectly triggered the phone/mobile layout.
  if (isTabletDevice()) {
    return false;
  }

  const explicitPhone = /iPhone|iPod/i.test(userAgent)
    || (/Android/i.test(userAgent) && /Mobile/i.test(userAgent));
  if (explicitPhone) {
    return shortSide <= 560 || longSide <= 980;
  }

  // Browser/device detection is imperfect, so keep a geometry fallback for very
  // small coarse-pointer screens, but do not classify tablet-sized viewports as phones.
  const coarsePointer = window.matchMedia?.("(pointer: coarse)")?.matches ?? maxTouchPoints > 0;
  const macTouchTablet = platform === "MacIntel" && maxTouchPoints > 1;
  return coarsePointer && !macTouchTablet && shortSide <= 520 && longSide <= 980;
}

function isTabletDevice() {
  const userAgent = navigator.userAgent || "";
  const platform = navigator.platform || "";
  const maxTouchPoints = Number(navigator.maxTouchPoints || 0);
  if (/iPad/i.test(userAgent)) return true;
  if (platform === "MacIntel" && maxTouchPoints > 1) return true;
  if (/Android/i.test(userAgent) && !/Mobile/i.test(userAgent)) return true;
  return false;
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
