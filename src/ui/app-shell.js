import { Store } from "../state/store.js?v=20260630-4";
import {
  acceptCookieConsent,
  hasCookieConsent,
  loadCachedPdfBasemap,
  loadCachedSession,
  saveCachedPdfBasemap,
  saveCachedSession
} from "../state/cookie-cache.js?v=20260630-4";
import { parseOmap } from "../domain/omap-parser.js?v=20260630-4";
import { parsePpen, serializeNativePpen, serializeOcp, serializePpen } from "../domain/ppen-parser.js?v=20260630-4";
import {
  CONTROL_KINDS,
  cloneEvent,
  createBlankEvent,
  findById
} from "../domain/event-model.js?v=20260630-4";
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
} from "../domain/actions.js?v=20260630-4";
import {
  DESCRIPTION_KINDS,
  ISCD_COLUMNS,
  columnFDescriptionDisplayValue,
  columnFDescriptionPickerValue,
  columnFOptionDisplayValue,
  columnFOptionVisualKey,
  createDescriptionSpecialOptions,
  descriptionLanguageForEvent,
  drawIscdSymbol,
  ensureIscdSymbolDb,
  existingDescriptionSpecialForTarget,
  getIscdSymbolOptions,
  isColumnFTextValue,
  iscdSymbolLabel,
  normalizeColumnFText,
  scoreCourseDescriptionRows,
  storageForIscdSelection,
  resizedDescriptionSpecial
} from "../domain/control-descriptions.js?v=20260630-4";
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
} from "../domain/print-area.js?v=20260630-4";
import { createVectorMapPdfBlob } from "../domain/pdf-exporter.js?v=20260630-4";
import { isPdfFile, renderPdfBasemap } from "../domain/pdf-basemap.js?v=20260630-4";
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
} from "../domain/course-service.js?v=20260630-4";
import {
  exportCourseSvg,
  exportGpx,
  exportIofXml,
  exportKml,
  exportRouteGadgetXml
} from "../domain/exporters.js?v=20260630-4";
import {
  createCourseSymbolMetrics,
  courseSymbolMmToMapDistance
} from "./course-symbols.js?v=20260630-4";
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
} from "../domain/relay-variations.js?v=20260630-4";
import { SUPPORTED_LANGUAGES, getLanguage, optionLabel, setLanguage, t } from "./i18n.js?v=20260630-4";
import { iconSvg } from "./icons.js?v=20260630-4";
import { MapView } from "./map-view.js?v=20260630-4";
import { createAppShellTemplateMethods } from "./app-shell-template-methods.js?v=20260630-4";
import { createAppShellMenuMethods } from "./app-shell-menu-methods.js?v=20260630-4";
import { createAppShellCoursePanelMethods } from "./app-shell-course-panel-methods.js?v=20260630-4";
import { createAppShellVariationMethods } from "./app-shell-variation-methods.js?v=20260630-4";
import { createAppShellSelectionEditorMethods } from "./app-shell-selection-editor-methods.js?v=20260630-4";
import { createAppShellCommandMethods } from "./app-shell-command-methods.js?v=20260630-4";
import { createAppShellFileExportMethods } from "./app-shell-file-export-methods.js?v=20260630-4";
import { createAppShellDialogMethods } from "./app-shell-dialog-methods.js?v=20260630-4";
import { createAppShellPrintCourseDialogMethods } from "./app-shell-print-course-dialog-methods.js?v=20260630-4";
import {
  RENDER_QUALITIES,
  isRenderQualityId,
  readRenderQualityPreference,
  setRenderQualityPreference,
  renderQualityHighQuality
} from "./render-quality.js?v=20260630-4";
import { hasCompletedMetaSetup, saveMetaSetupPreference } from "./app-meta-setup.js?v=20260630-4";

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
} from "./app-shell-config.js?v=20260630-4";
import {
  teamAddControlRoleFromSelection,
  objectForSelection,
  teamCourseDescriptionPanelRows,
  courseDisplayOptions,
  applyCourseSelectionUi,
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
  selectedLegCourseControlPair,
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
} from "./app-shell-helpers.js?v=20260630-4";

function updateBootLoadingProgress(percent, detail) {
  globalThis.__oComposerBootLoading?.update?.({ percent, detail, indeterminate: false });
}

export class PurplePenApp extends HTMLElement {
  connectedCallback() {
    consumeLanguageRefreshParam();
    this.language = getLanguage();
    this.installViewportMetricSync();
    updateBootLoadingProgress(58, this.t("Building editor UI…"));
    this.store = new Store();
    const initialRenderQuality = readRenderQualityPreference();
    this.store.state.ui.renderQuality = initialRenderQuality;
    this.store.state.ui.highQuality = renderQualityHighQuality(initialRenderQuality);
    this.innerHTML = this.template();
    this.updateInitialLoadingProgress(60, this.t("Building editor UI…"));
    this.syncResponsiveUiClass();
    this.syncApplicationLanguageControl();
    this.syncRenderQualityControl();
    this.renderKeys = null;
    this.cacheReady = false;
    this.updateInitialLoadingProgress(68, this.t("Preparing map view…"));
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
    this.updateInitialLoadingProgress(74, this.t("Restoring cached session…"));
    installAppResourceFetchCache(APP_RESOURCE_CACHE_NAME, APP_RESOURCE_URLS);
    this.startResourcePrecache();
    this.deferMapLayoutRefresh();
    const cachedSessionReady = Promise.resolve(this.restoreInitialEvent())
      .then(result => {
        this.updateInitialLoadingProgress(84, this.t("Loading control symbols…"));
        return result;
      });
    this.store.subscribe(state => this.render(state));
    this.store.subscribe(state => this.scheduleSessionCache(state));
    this.refreshAfterFontLoad();
    const symbolsReady = ensureIscdSymbolDb()
      .then(() => {
        this.renderKeys = null;
        this.render(this.store.snapshot());
        this.updateInitialLoadingProgress(94, this.t("Finalizing…"));
      })
      .catch(error => {
        console.warn(error);
        this.updateInitialLoadingProgress(94, this.t("Finalizing…"));
      });
    this.hideInitialLoadingWhenReady([cachedSessionReady, symbolsReady]);
  }


  installViewportMetricSync() {
    this.updateViewportMetrics();
    if (this.viewportMetricCleanup) return;

    let frame = 0;
    const refresh = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        this.updateViewportMetrics();
        if (this.isConnected) {
          this.applyResponsiveInlineOverrides?.(this.resolvedUiMode?.() === UI_MODES.MOBILE);
          this.deferMapLayoutRefresh?.();
        }
      });
    };

    const options = { passive: true };
    window.addEventListener("resize", refresh, options);
    window.addEventListener("orientationchange", refresh, options);
    window.visualViewport?.addEventListener("resize", refresh, options);
    window.visualViewport?.addEventListener("scroll", refresh, options);
    this.viewportMetricCleanup = () => {
      window.removeEventListener("resize", refresh, options);
      window.removeEventListener("orientationchange", refresh, options);
      window.visualViewport?.removeEventListener("resize", refresh, options);
      window.visualViewport?.removeEventListener("scroll", refresh, options);
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
      this.viewportMetricCleanup = null;
    };
  }

  disconnectedCallback() {
    this.viewportMetricCleanup?.();
    clearTimeout(this.cacheTimer);
  }

  updateViewportMetrics() {
    const root = document.documentElement;
    const visual = window.visualViewport;
    const width = Math.max(1, Math.round(Number(visual?.width) || window.innerWidth || root.clientWidth || 1));
    const height = Math.max(1, Math.round(Number(visual?.height) || window.innerHeight || root.clientHeight || 1));
    root.style.setProperty("--o-composer-viewport-width", `${width}px`);
    root.style.setProperty("--o-composer-viewport-height", `${height}px`);
    this.style.setProperty("--o-composer-viewport-width", `${width}px`);
    this.style.setProperty("--o-composer-viewport-height", `${height}px`);
    document.body?.style.setProperty("--o-composer-viewport-width", `${width}px`);
    document.body?.style.setProperty("--o-composer-viewport-height", `${height}px`);
  }

  updateInitialLoadingProgress(percent, detail) {
    const safePercent = clamp(Math.round(Number(percent) || 0), 0, 100);
    const title = this.querySelector("#appInitLoadingTitle");
    const detailEl = this.querySelector("#appInitLoadingDetail");
    const bar = this.querySelector("#appInitProgressBar");
    const value = this.querySelector("#appInitProgressValue");
    if (title) title.textContent = this.t("Loading O-Composer…");
    if (detailEl && detail) detailEl.textContent = detail;
    if (bar) {
      bar.value = safePercent;
      bar.setAttribute("aria-valuenow", String(safePercent));
    }
    if (value) value.textContent = `${safePercent}%`;
    updateBootLoadingProgress(safePercent, detail);
  }

  hideInitialLoadingWhenReady(promises = []) {
    void Promise.allSettled(promises)
      .then(() => {
        this.updateInitialLoadingProgress(100, this.t("Ready."));
        return new Promise(resolve => requestAnimationFrame(resolve));
      })
      .then(() => this.hideInitialLoading())
      .then(() => this.showMetaSetupIfNeeded());
  }

  hideInitialLoading() {
    const overlays = [
      this.querySelector("#appInitLoading"),
      document.getElementById("oComposerBootLoading")
    ].filter(overlay => overlay && !overlay.hidden);
    if (!overlays.length) return Promise.resolve();
    for (const overlay of overlays) {
      overlay.classList.add("is-done");
    }
    return new Promise(resolve => {
      window.setTimeout(() => {
        for (const overlay of overlays) {
          overlay.hidden = true;
          if (overlay.id === "oComposerBootLoading") {
            overlay.remove();
            document.getElementById("oComposerBootLoadingStyle")?.remove();
          }
        }
        resolve();
      }, 180);
    });
  }

  showMetaSetupIfNeeded() {
    if (hasCompletedMetaSetup()) return;
    this.populateMetaSetupForm();
    const overlay = this.querySelector("#appMetaSetup");
    if (!overlay) return;
    overlay.hidden = false;
    overlay.classList.add("is-visible");
    const firstField = overlay.querySelector("select, button");
    requestAnimationFrame(() => firstField?.focus?.());
  }

  populateMetaSetupForm() {
    const languageSelect = this.querySelector("#setupLanguage");
    const renderQualitySelect = this.querySelector("#setupRenderQuality");
    const uiModeSelect = this.querySelector("#setupUiMode");
    if (languageSelect) languageSelect.value = this.language;
    if (renderQualitySelect) {
      const value = this.store?.snapshot?.().ui?.renderQuality || readRenderQualityPreference();
      renderQualitySelect.value = isRenderQualityId(value) ? value : readRenderQualityPreference();
    }
    if (uiModeSelect) uiModeSelect.value = this.uiModePreference();
  }

  applyMetaSetupForm() {
    const language = this.querySelector("#setupLanguage")?.value || this.language;
    const renderQuality = this.querySelector("#setupRenderQuality")?.value || readRenderQualityPreference();
    const uiMode = this.querySelector("#setupUiMode")?.value || UI_MODES.AUTO;
    const previousLanguage = this.language;

    if (SUPPORTED_LANGUAGES.some(([code]) => code === language)) {
      setLanguage(language);
    }
    if (isRenderQualityId(renderQuality)) {
      this.setRenderQuality(renderQuality);
    }
    if (Object.values(UI_MODES).includes(uiMode)) {
      setUiModePreference(uiMode);
      this.syncResponsiveUiClass();
    }

    saveMetaSetupPreference({ language, renderQuality, uiMode });

    if (language !== previousLanguage) {
      forceWholePageLanguageReload();
      return;
    }

    this.language = language;
    this.syncApplicationLanguageControl();
    this.syncRenderQualityControl();
    const overlay = this.querySelector("#appMetaSetup");
    if (overlay) {
      overlay.classList.remove("is-visible");
      overlay.hidden = true;
    }
    this.deferMapLayoutRefresh();
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
    const globalLanguageSelect = this.querySelector("#globalLanguage");
    if (globalLanguageSelect) globalLanguageSelect.value = this.language;
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

  setRenderQuality(value) {
    if (!isRenderQualityId(value)) return;
    setRenderQualityPreference(value);
    this.store.updateUi(ui => {
      ui.renderQuality = value;
      ui.highQuality = renderQualityHighQuality(value);
    }, this.t("Render quality"));
    this.syncRenderQualityControl();
    this.mapView?.invalidateOmapLayer?.();
    this.deferMapLayoutRefresh();
  }

  cycleRenderQuality() {
    const current = this.store.snapshot().ui.renderQuality || readRenderQualityPreference();
    const index = Math.max(0, RENDER_QUALITIES.findIndex(profile => profile.id === current));
    const next = RENDER_QUALITIES[(index + 1) % RENDER_QUALITIES.length];
    this.setRenderQuality(next.id);
  }

  syncRenderQualityControl() {
    const value = this.store?.snapshot?.().ui?.renderQuality || readRenderQualityPreference();
    const normalizedValue = isRenderQualityId(value) ? value : readRenderQualityPreference();
    const select = this.querySelector("#renderQualitySelect");
    if (select) select.value = normalizedValue;
    const globalSelect = this.querySelector("#globalRenderQuality");
    if (globalSelect) globalSelect.value = normalizedValue;
  }

  syncGlobalOptionsForm() {
    const languageSelect = this.querySelector("#globalLanguage");
    if (languageSelect) languageSelect.value = this.language;

    const renderQualitySelect = this.querySelector("#globalRenderQuality");
    if (renderQualitySelect) {
      const value = this.store?.snapshot?.().ui?.renderQuality || readRenderQualityPreference();
      renderQualitySelect.value = isRenderQualityId(value) ? value : readRenderQualityPreference();
    }

    const uiModeSelect = this.querySelector("#globalUiMode");
    if (uiModeSelect) uiModeSelect.value = this.uiModePreference();
  }

  openGlobalOptions() {
    this.syncGlobalOptionsForm();
    const dialog = this.querySelector("#globalOptionsDialog");
    if (!dialog) return;
    dialog.removeAttribute("hidden");
    if (!dialog.open) {
      if (dialog.showModal) {
        dialog.showModal();
      }
      else if (dialog.show) {
        dialog.show();
      }
      else {
        dialog.setAttribute("open", "");
      }
    }
  }

  closeGlobalOptions() {
    const dialog = this.querySelector("#globalOptionsDialog");
    if (dialog?.open && dialog.close) {
      dialog.close();
    }
    else {
      dialog?.removeAttribute("open");
    }
    dialog?.setAttribute("hidden", "");
  }

  applyGlobalOptionsForm() {
    const language = this.querySelector("#globalLanguage")?.value || this.language;
    const renderQuality = this.querySelector("#globalRenderQuality")?.value || readRenderQualityPreference();
    const uiMode = this.querySelector("#globalUiMode")?.value || UI_MODES.AUTO;
    const previousLanguage = this.language;

    if (isRenderQualityId(renderQuality)) {
      this.setRenderQuality(renderQuality);
    }

    if (Object.values(UI_MODES).includes(uiMode)) {
      setUiModePreference(uiMode);
      this.syncResponsiveUiClass();
      this.deferMapLayoutRefresh();
    }

    saveMetaSetupPreference({ language, renderQuality, uiMode });
    this.closeGlobalOptions();

    if (SUPPORTED_LANGUAGES.some(([code]) => code === language) && language !== previousLanguage) {
      this.applyApplicationLanguage(language);
    }
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
    this.updateViewportMetrics();
    const viewportWidth = Math.max(1, Math.round(Number(window.visualViewport?.width) || window.innerWidth || document.documentElement.clientWidth || 0));
    const saved = Number(localStorage.getItem("purplePenLeftPanelWidth"));
    const maxPanelWidth = Math.max(180, Math.min(340, Math.floor(viewportWidth * 0.42)));
    const defaultPanelWidth = Math.max(200, Math.min(320, Math.floor(viewportWidth * 0.34)));
    const width = Number.isFinite(saved) && saved > 0
      ? clamp(saved, 180, maxPanelWidth)
      : defaultPanelWidth;

    this.style.display = "block";
    this.style.width = "var(--o-composer-viewport-width, 100vw)";
    this.style.maxWidth = "var(--o-composer-viewport-width, 100vw)";
    this.style.height = "var(--o-composer-viewport-height, 100vh)";
    this.style.maxHeight = "var(--o-composer-viewport-height, 100vh)";
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

  async restoreInitialEvent() {
    await this.restoreCachedSession();
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
        renderQuality: state.ui.renderQuality,
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
  serializeNativePpen,
  serializeOcp,
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
  columnFDescriptionDisplayValue,
  columnFDescriptionPickerValue,
  columnFOptionDisplayValue,
  columnFOptionVisualKey,
  createDescriptionSpecialOptions,
  descriptionLanguageForEvent,
  drawIscdSymbol,
  ensureIscdSymbolDb,
  existingDescriptionSpecialForTarget,
  getIscdSymbolOptions,
  isColumnFTextValue,
  iscdSymbolLabel,
  normalizeColumnFText,
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
  applyCourseSelectionUi,
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
  selectedLegCourseControlPair,
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
  escapeAttr,
  RENDER_QUALITIES,
  isRenderQualityId,
  readRenderQualityPreference,
  setRenderQualityPreference,
  renderQualityHighQuality
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
