import { Store } from "../state/store.js";
import {
  acceptCookieConsent,
  hasCookieConsent,
  loadCachedPdfBasemap,
  loadCachedSession,
  saveCachedPdfBasemap,
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
import { createVectorMapPdfBlob } from "../domain/pdf-exporter.js";
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
  createCourseSymbolMetrics,
  courseSymbolMmToMapDistance
} from "./course-symbols.js";
import {
  allCourseVariations,
  courseHasVariations,
  relayAssignments,
  relayEntryLabel,
  relayTeamSizeOptions,
  relayVariationForLeg,
  variationBranchCodeMap,
  variationDisplayLabel,
  variationForCode
} from "../domain/relay-variations.js";
import { SUPPORTED_LANGUAGES, getLanguage, optionLabel, setLanguage, t } from "./i18n.js";
import { iconSvg } from "./icons.js";
import { MapView } from "./map-view.js";
import { createAppShellTemplateMethods } from "./app-shell-template-methods.js";
import { createAppShellMenuMethods } from "./app-shell-menu-methods.js";
import { createAppShellCoursePanelMethods } from "./app-shell-course-panel-methods.js";
import { createAppShellVariationMethods } from "./app-shell-variation-methods.js";
import { createAppShellSelectionEditorMethods } from "./app-shell-selection-editor-methods.js";
import { createAppShellCommandMethods } from "./app-shell-command-methods.js";
import { createAppShellFileExportMethods } from "./app-shell-file-export-methods.js";
import { createAppShellDialogMethods } from "./app-shell-dialog-methods.js";
import { createAppShellPrintCourseDialogMethods } from "./app-shell-print-course-dialog-methods.js";

import {
  PAPER_SIZES,
  PAPER_MARGINS,
  PDF_COURSE_SCOPES,
  PDF_OUTPUT_MODES,
  PDF_EXPORT_SETTINGS_KEY,
  PDF_EXPORT_STEPS_PER_TARGET,
  PDF_EXPORT_DONE_HOLD_MS,
  MAP_SCALES,
  APP_VERSION,
  APP_RESOURCE_CACHE_PREFIX,
  APP_RESOURCE_CACHE_NAME,
  APP_RESOURCE_URLS,
  LANGUAGE_REFRESH_PARAM,
  UI_MODE_KEY,
  UI_MODES,
  COURSE_NAMES,
  TEXT_PRESETS,
  COURSE_LABEL_KINDS,
  MOVE_DISTANCE_CHOICES,
  DEFAULT_TEXT_FONT_HEIGHT,
  CONTROL_SNAP_SCREEN_RADIUS,
  FONT_CHOICES,
  SPECIAL_COLOR_CHOICES,
  LEGACY_COLOR_ALIASES
} from "./app-shell-config.js";
import {
  teamAddControlRoleFromSelection,
  objectForSelection,
  teamCourseDescriptionPanelRows,
  courseDisplayOptions,
  TOPOLOGY_HEIGHT_UNIT,
  layoutVariationTopology,
  topologyLegPath,
  topologyBranchJoinPoint,
  topologyBranchToJoinPath,
  topologyLoopReturnPath,
  topologyEmptyLoopBranchPath,
  topologyEmptyBranchJoinPoint,
  topologyEmptyBranchPath,
  topologyPathSvg,
  topologyHitPathSvg,
  topologyNodeCourseControlId,
  topologyBranchCourseControlId,
  topologyBranchIsEmpty,
  topologyBranchEdgeMap,
  topologyPreviousCourseControlMap,
  topologyEdgeKey,
  topologyCommonJoinPointMap,
  topologyConnectionRadius,
  topologyNodeSvg,
  formatSvgNumber,
  insertionCourseControlId,
  insertionBeforeCourseControlId,
  variationAnchorCourseControl,
  canAddVariationAtCourseControl,
  normalizedVariationBranch,
  safeCachedUi,
  applyImportedMapScale,
  applyMapScale,
  specialCategory,
  specialFontHeight,
  fontOptions,
  colorChoiceSelected,
  colorChoiceLabel,
  normalizeHexColor,
  normalizeColorValue,
  colorToHex,
  syncColorControls,
  resizedSpecialObject,
  positiveScale,
  positiveNumber,
  backgroundMetadataForImage,
  backgroundMetadataForPdf,
  cachePdfBasemapSource,
  ensurePdfBasemapCacheKey,
  backgroundForSessionCache,
  loadImage,
  backgroundAspect,
  applyBackgroundCalibration,
  resetBackgroundCalibrationBase,
  backgroundImagePointForMap,
  backgroundCalibrationDistance,
  formatInputNumber,
  setControlNumberLocation,
  resetControlNumberLocation,
  controlDisplayName,
  finishRouteForCourse,
  setFinishRouteFlagging,
  applyCourseKindDefaults,
  setScoreFinishControl,
  ensureLegBetween,
  normalizeLegFlaggingKind,
  setLegFlaggingKind,
  setLegFlaggingRange,
  flaggingRangeForUi,
  legPathPoints,
  pathLength,
  pointAtPathDistance,
  bendInsertIndex,
  distanceAlongPathAtPoint,
  distance,
  snappedControlForPlacement,
  clamp,
  openFloatingPalette,
  closeFloatingPalette,
  isFloatingDialogOpen,
  currentPrintAreaForTarget,
  selectedRadioValue,
  modeLabel,
  findPaperSize,
  paperOptionHtml,
  marginOptionHtml,
  pageSizeMm,
  pageMarginMm,
  pdfPixelSize,
  formatPageSize,
  formatMargin,
  formatDecimal,
  nearlySame,
  boundsCenter,
  selectOptions,
  uniqueNumbers,
  uniqueStrings,
  forceWholePageLanguageReload,
  consumeLanguageRefreshParam,
  symbolOptionsForColumn,
  descriptionKindLabel,
  directionVector,
  renderKeysFor,
  syncDescriptionLanguageWithApp,
  setPath,
  valueFromInput,
  tableHtml,
  readPdfExportSettings,
  writePdfExportSettings,
  safeFilePart,
  uniqueFileName,
  normalizedRelaySettings,
  applyRelayInputToSettings,
  vectorPdfProgressPhase,
  vectorPdfProgressMessage,
  wait,
  paintProgressFrame,
  createZipBlob,
  download,
  downloadBlob,
  baseName,
  readUiModePreference,
  setUiModePreference,
  isNarrowMobileViewport,
  isPhoneViewport,
  isTabletDevice,
  canScrollElement,
  containsUnicodeText,
  pdfDataUrlLooksLikePdf,
  installAppResourceFetchCache,
  precacheAppResources,
  formatBytes,
  escapeHtml,
  escapeAttr
} from "./app-shell-helpers.js";
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
    installAppResourceFetchCache(APP_RESOURCE_CACHE_NAME, APP_RESOURCE_URLS);
    this.startResourcePrecache();
    this.deferMapLayoutRefresh();
    const cachedSessionReady = this.restoreCachedSession();
    this.store.subscribe(state => this.render(state));
    this.store.subscribe(state => this.scheduleSessionCache(state));
    this.refreshAfterFontLoad();
    const symbolsReady = ensureIscdSymbolDb()
      .then(() => {
        this.renderKeys = null;
        this.render(this.store.snapshot());
      })
      .catch(error => {
        console.warn(error);
      });
    this.hideInitialLoadingWhenReady([cachedSessionReady, symbolsReady]);
  }

  hideInitialLoadingWhenReady(promises = []) {
    void Promise.allSettled(promises)
      .then(() => new Promise(resolve => requestAnimationFrame(resolve)))
      .then(() => this.hideInitialLoading());
  }

  hideInitialLoading() {
    const overlay = this.querySelector("#appInitLoading");
    if (!overlay || overlay.hidden) return;
    overlay.classList.add("is-done");
    window.setTimeout(() => {
      overlay.hidden = true;
    }, 180);
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

  startResourcePrecache() {
    void precacheAppResources({
      cacheName: APP_RESOURCE_CACHE_NAME,
      cachePrefix: APP_RESOURCE_CACHE_PREFIX,
      urls: APP_RESOURCE_URLS,
      onProgress: progress => this.updateResourcePrecacheProgress(progress)
    }).catch(error => {
      console.warn(error);
      this.updateResourcePrecacheProgress(null);
    });
  }

  updateResourcePrecacheProgress(progress) {
    const box = this.querySelector("#resourceProgress");
    const bar = this.querySelector("#resourceProgressBar");
    const text = this.querySelector("#resourceProgressText");
    if (!box || !bar || !text) return;
    if (!progress || progress.done) {
      box.hidden = true;
      bar.value = 0;
      text.textContent = "";
      return;
    }
    const downloaded = Math.max(0, Number(progress.downloadedBytes) || 0);
    const total = Math.max(downloaded, Number(progress.totalBytes) || 0);
    const percent = total > 0 ? clamp(Math.round(downloaded / total * 100), 0, 100) : 0;
    box.hidden = false;
    bar.value = percent;
    text.textContent = this.t("Resources {downloaded} / {total}", {
      downloaded: formatBytes(downloaded),
      total: total > 0 ? formatBytes(total) : this.t("calculating")
    });
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
    const background = ensurePdfBasemapCacheKey(state.ui.background);
    void cachePdfBasemapSource(background);
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
      background: backgroundForSessionCache(background),
      omap: state.ui.omap || null,
      omapMap: this.mapView?.omapMap || null
    });
  }

}
const APP_SHELL_METHOD_DEPS = {
  Store,
  acceptCookieConsent,
  hasCookieConsent,
  loadCachedPdfBasemap,
  loadCachedSession,
  saveCachedPdfBasemap,
  saveCachedSession,
  parseOmap,
  parsePpen,
  serializePpen,
  CONTROL_KINDS,
  cloneEvent,
  createBlankEvent,
  findById,
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
  updateControlDescription,
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
  resizedDescriptionSpecial,
  PRINT_AREA_SCOPES,
  effectivePrintArea,
  normalizePrintArea,
  printAreaCenter,
  printAreaFixedFrameAt,
  printAreaFromBounds,
  printAreaFromPoints,
  printAreaTargetLabel,
  setPrintArea,
  createVectorMapPdfBlob,
  isPdfFile,
  renderPdfBasemap,
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
  sortedCourses,
  exportCourseSvg,
  exportGpx,
  exportIofXml,
  exportKml,
  exportRouteGadgetXml,
  createCourseSymbolMetrics,
  courseSymbolMmToMapDistance,
  allCourseVariations,
  courseHasVariations,
  relayAssignments,
  relayEntryLabel,
  relayTeamSizeOptions,
  relayVariationForLeg,
  variationBranchCodeMap,
  variationDisplayLabel,
  variationForCode,
  SUPPORTED_LANGUAGES,
  getLanguage,
  optionLabel,
  setLanguage,
  t,
  iconSvg,
  MapView,
  PAPER_SIZES,
  PAPER_MARGINS,
  PDF_COURSE_SCOPES,
  PDF_OUTPUT_MODES,
  PDF_EXPORT_SETTINGS_KEY,
  PDF_EXPORT_STEPS_PER_TARGET,
  PDF_EXPORT_DONE_HOLD_MS,
  MAP_SCALES,
  APP_VERSION,
  APP_RESOURCE_CACHE_PREFIX,
  APP_RESOURCE_CACHE_NAME,
  APP_RESOURCE_URLS,
  LANGUAGE_REFRESH_PARAM,
  UI_MODE_KEY,
  UI_MODES,
  COURSE_NAMES,
  TEXT_PRESETS,
  COURSE_LABEL_KINDS,
  MOVE_DISTANCE_CHOICES,
  DEFAULT_TEXT_FONT_HEIGHT,
  CONTROL_SNAP_SCREEN_RADIUS,
  FONT_CHOICES,
  SPECIAL_COLOR_CHOICES,
  LEGACY_COLOR_ALIASES,
  teamAddControlRoleFromSelection,
  objectForSelection,
  teamCourseDescriptionPanelRows,
  courseDisplayOptions,
  TOPOLOGY_HEIGHT_UNIT,
  layoutVariationTopology,
  topologyLegPath,
  topologyBranchJoinPoint,
  topologyBranchToJoinPath,
  topologyLoopReturnPath,
  topologyEmptyLoopBranchPath,
  topologyEmptyBranchJoinPoint,
  topologyEmptyBranchPath,
  topologyPathSvg,
  topologyHitPathSvg,
  topologyNodeCourseControlId,
  topologyBranchCourseControlId,
  topologyBranchIsEmpty,
  topologyBranchEdgeMap,
  topologyPreviousCourseControlMap,
  topologyEdgeKey,
  topologyCommonJoinPointMap,
  topologyConnectionRadius,
  topologyNodeSvg,
  formatSvgNumber,
  insertionCourseControlId,
  insertionBeforeCourseControlId,
  variationAnchorCourseControl,
  canAddVariationAtCourseControl,
  normalizedVariationBranch,
  safeCachedUi,
  applyImportedMapScale,
  applyMapScale,
  specialCategory,
  specialFontHeight,
  fontOptions,
  colorChoiceSelected,
  colorChoiceLabel,
  normalizeHexColor,
  normalizeColorValue,
  colorToHex,
  syncColorControls,
  resizedSpecialObject,
  positiveScale,
  positiveNumber,
  backgroundMetadataForImage,
  backgroundMetadataForPdf,
  cachePdfBasemapSource,
  ensurePdfBasemapCacheKey,
  backgroundForSessionCache,
  loadImage,
  backgroundAspect,
  applyBackgroundCalibration,
  resetBackgroundCalibrationBase,
  backgroundImagePointForMap,
  backgroundCalibrationDistance,
  formatInputNumber,
  setControlNumberLocation,
  resetControlNumberLocation,
  controlDisplayName,
  finishRouteForCourse,
  setFinishRouteFlagging,
  applyCourseKindDefaults,
  setScoreFinishControl,
  ensureLegBetween,
  normalizeLegFlaggingKind,
  setLegFlaggingKind,
  setLegFlaggingRange,
  flaggingRangeForUi,
  legPathPoints,
  pathLength,
  pointAtPathDistance,
  bendInsertIndex,
  distanceAlongPathAtPoint,
  distance,
  snappedControlForPlacement,
  clamp,
  openFloatingPalette,
  closeFloatingPalette,
  isFloatingDialogOpen,
  currentPrintAreaForTarget,
  selectedRadioValue,
  modeLabel,
  findPaperSize,
  paperOptionHtml,
  marginOptionHtml,
  pageSizeMm,
  pageMarginMm,
  pdfPixelSize,
  formatPageSize,
  formatMargin,
  formatDecimal,
  nearlySame,
  boundsCenter,
  selectOptions,
  uniqueNumbers,
  uniqueStrings,
  forceWholePageLanguageReload,
  consumeLanguageRefreshParam,
  symbolOptionsForColumn,
  descriptionKindLabel,
  directionVector,
  renderKeysFor,
  syncDescriptionLanguageWithApp,
  setPath,
  valueFromInput,
  tableHtml,
  readPdfExportSettings,
  writePdfExportSettings,
  safeFilePart,
  uniqueFileName,
  normalizedRelaySettings,
  applyRelayInputToSettings,
  vectorPdfProgressPhase,
  vectorPdfProgressMessage,
  wait,
  paintProgressFrame,
  createZipBlob,
  download,
  downloadBlob,
  baseName,
  readUiModePreference,
  setUiModePreference,
  isNarrowMobileViewport,
  isPhoneViewport,
  isTabletDevice,
  canScrollElement,
  containsUnicodeText,
  pdfDataUrlLooksLikePdf,
  installAppResourceFetchCache,
  precacheAppResources,
  formatBytes,
  escapeHtml,
  escapeAttr
};

Object.assign(
  PurplePenApp.prototype,
  createAppShellTemplateMethods(APP_SHELL_METHOD_DEPS),
  createAppShellMenuMethods(APP_SHELL_METHOD_DEPS),
  createAppShellCoursePanelMethods(APP_SHELL_METHOD_DEPS),
  createAppShellVariationMethods(APP_SHELL_METHOD_DEPS),
  createAppShellSelectionEditorMethods(APP_SHELL_METHOD_DEPS),
  createAppShellCommandMethods(APP_SHELL_METHOD_DEPS),
  createAppShellFileExportMethods(APP_SHELL_METHOD_DEPS),
  createAppShellDialogMethods(APP_SHELL_METHOD_DEPS),
  createAppShellPrintCourseDialogMethods(APP_SHELL_METHOD_DEPS)
);
