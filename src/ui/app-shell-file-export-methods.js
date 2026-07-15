import { debugLog } from "./debug-log.js?v=20260715-40";
import { coursePageCount } from "../domain/course-service.js?v=20260715-40";
import { mergePdfBlobs } from "../domain/pdf-exporter.js?v=20260715-40";
import { preparePythonPageLayout, validatePageBreakFormula } from "../domain/course-pages.js?v=20260715-40";

export function createAppShellFileExportMethods(deps) {
  const {
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
    requireBackgroundCalibration,
    backgroundCalibrationRequired,
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
  } = deps;
  return {
  openPpenFile(file) {
    if (!file || !this.confirmDirty()) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const model = parsePpen(String(reader.result), file.name);
        const embeddedBaseMap = this.restoreEmbeddedOcpBaseMap(model);
        this.store.setEventModel(model, "Open file", false);
        this.store.markClean(file.name);
        this.store.resetHistory("Loaded file");
        this.store.updateUi(ui => {
          applyCourseSelectionUi(model, ui, sortedCourses(model)[0]?.id || "all", { selection: null });
          ui.pan = { x: 0, y: 0 };
          ui.zoom = 1;
          ui.showPrintArea = this.modelHasSavedPrintArea(model);
          ui.background = embeddedBaseMap.background;
          ui.omap = embeddedBaseMap.omap;
          ui.measurement = measurementUiFromPersisted(model.metadata?.measurements);
          if (backgroundCalibrationRequired(ui.background)) {
            requireBackgroundCalibration(ui.background);
            ui.tool = "background-calibration";
            ui.selection = { type: "background" };
            ui.status = this.t("Complete the two-point map scale calibration before continuing.");
          }
        }, "Loaded");
      }
      catch (error) {
        alert(error.message);
      }
      finally {
        this.querySelector("#ppenInput").value = "";
      }
    };
    reader.readAsText(file);
  },

  async openBundledSample() {
    if (!this.confirmDirty()) return;
    try {
      const response = await fetch("./samples/standalone-sample.ppen");
      if (!response.ok) {
        throw new Error(`Could not load sample: ${response.status}`);
      }
      const model = parsePpen(await response.text(), "standalone-sample.ppen");
      const embeddedBaseMap = this.restoreEmbeddedOcpBaseMap(model);
      this.store.setEventModel(model, "Open sample", false);
      this.store.markClean("standalone-sample.ppen");
      this.store.resetHistory("Loaded sample");
      this.store.updateUi(ui => {
        applyCourseSelectionUi(model, ui, sortedCourses(model)[0]?.id || "all", { selection: null });
        ui.pan = { x: 0, y: 0 };
        ui.zoom = 1;
        ui.showPrintArea = this.modelHasSavedPrintArea(model);
        ui.background = embeddedBaseMap.background;
        ui.omap = embeddedBaseMap.omap;
        ui.measurement = measurementUiFromPersisted(model.metadata?.measurements);
        if (backgroundCalibrationRequired(ui.background)) {
          requireBackgroundCalibration(ui.background);
          ui.tool = "background-calibration";
          ui.selection = { type: "background" };
          ui.status = this.t("Complete the two-point map scale calibration before continuing.");
        }
      }, "Sample loaded");
    }
    catch (error) {
      alert(error.message);
    }
  },

  modelHasSavedPrintArea(model) {
    if (model.event?.printArea && model.event.printArea.automatic === false) return true;
    return (model.courses || []).some(course => course.printArea?.automatic === false
      || (course.partPrintAreas || []).some(partArea => partArea.area?.automatic === false));
  },
  async openMapFile(file) {
    if (!file) return;
    this.closeCommandDialog({ force: true });
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
        const metadata = requireBackgroundCalibration(backgroundMetadataForImage(file, url, image, this.store.snapshot().eventModel));
        this.store.updateUi(ui => {
          ui.background = metadata;
          ui.omap = null;
          ui.pan = { x: 0, y: 0 };
          ui.zoom = 1;
          ui.tool = "background-calibration";
          ui.selection = { type: "background" };
          ui.status = this.t("Click the first calibration point on the map.");
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
  },

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
      const metadata = requireBackgroundCalibration(backgroundMetadataForPdf(file, rendered, image, this.store.snapshot().eventModel));
      await cachePdfBasemapSource(metadata);
      this.store.updateUi(ui => {
        ui.background = metadata;
        ui.omap = null;
        ui.pan = { x: 0, y: 0 };
        ui.zoom = 1;
        ui.tool = "background-calibration";
        ui.selection = { type: "background" };
        ui.status = this.t("Click the first calibration point on the map.");
      }, "PDF map loaded");
    }
    catch (error) {
      this.store.updateUi(ui => { ui.status = "Ready"; }, "PDF map import failed");
      alert(this.t("Could not import PDF map {name}: {message}", {
        name: file.name || this.t("Unknown file"),
        message: error.message || String(error)
      }));
    }
  },

  choosePdfMapPage(file, pageCount) {
    const answer = window.prompt(this.t("PDF {name} has {count} pages. Import page:", {
      name: file.name || this.t("Unknown file"),
      count: pageCount
    }), "1");
    const value = Number(answer);
    return Number.isFinite(value) && value > 0 ? Math.floor(value) : 1;
  },

  openOmapFile(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const sourceText = String(reader.result || "");
        const currentMapScale = positiveScale(this.store.snapshot().eventModel.event?.map?.scale) || 15000;
        const omap = parseOmap(sourceText, file.name, { fallbackScale: currentMapScale });
        debugLog("omap.loaded", {
          name: omap.name,
          scale: omap.scale,
          objectCount: omap.objectCount,
          symbolCount: omap.symbolCount,
          bounds: omap.bounds,
          firstObjects: omap.objects?.slice(0, 5),
          firstSymbols: Object.values(omap.symbols || {}).slice(0, 5)
        });
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
            scale: omapScale || omap.scale,
            sourceText
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
  },

  downloadOcp() {
    const state = this.store.snapshot();
    const defaultFileName = `${baseName(state.eventModel.sourceName || "Untitled")}.ocp`;
    this.openCommandDialog({
      title: "Save .ocp",
      applyLabel: "Save",
      modal: true,
      body: `
        <div class="form-grid compact-form">
          <label>${escapeHtml(this.t("File name"))}
            <input id="ocpFileName" value="${escapeAttr(defaultFileName)}" autocomplete="off" spellcheck="false">
          </label>
        </div>
      `,
      onOpen: dialog => {
        const input = dialog.querySelector("#ocpFileName");
        input?.focus();
        input?.select();
      },
      apply: dialog => {
        const requestedName = dialog.querySelector("#ocpFileName")?.value.trim() || defaultFileName;
        const requestedStem = requestedName.replace(/\.ocp$/i, "");
        const fileName = `${safeFilePart(requestedStem)}.ocp`;
        const currentState = this.store.snapshot();
        const model = cloneEvent(currentState.eventModel);
        syncDescriptionLanguageWithApp(model);
        download(fileName, serializeOcp(model, { ocpData: this.ocpDataForSave(currentState) }), "application/xml");
        this.store.markClean(fileName);
      }
    });
  },

  downloadNativePpen() {
    const model = cloneEvent(this.store.snapshot().eventModel);
    const formulaCourses = model.courses
      .filter(course => course.kind === "normal" && String(course.pageBreakFormula || "").trim())
      .map(course => course.name || `Course ${course.id}`);
    if (formulaCourses.length && !confirm(this.t("Native .ppen cannot store advanced page code for: {courses}. Export anyway? Use .ocp to preserve it.", {
      courses: formulaCourses.join(", ")
    }))) return;
    syncDescriptionLanguageWithApp(model);
    const fileName = `${baseName(model.sourceName || "Untitled")}.ppen`;
    download(fileName, serializeNativePpen(model), "application/xml");
  },

  ocpDataForSave(state) {
    const background = state.ui.background ? ensurePdfBasemapCacheKey(cloneEvent(state.ui.background)) : null;
    if (background?.pdf) {
      background.pdf = { ...background.pdf };
    }
    const omap = state.ui.omap ? cloneEvent(state.ui.omap) : null;
    const omapSourceText = omap?.sourceText || "";
    if (omap) {
      delete omap.sourceText;
    }
    return {
      version: 1,
      background,
      omap,
      omapSourceText,
      measurements: state.eventModel.metadata?.measurements || measurementPersistedForSave(state.ui.measurement),
      // Avoid embedding the same map twice. The XML source is canonical and
      // restoreEmbeddedOcpBaseMap reparses it when an OCP file is opened.
      omapMap: omapSourceText ? null : this.mapView?.omapMap || null
    };
  },

  restoreEmbeddedOcpBaseMap(model) {
    const data = model.metadata?.ocp || {};
    const background = data.background || null;
    const omap = data.omap || null;
    const omapSourceText = data.omapSourceText || omap?.sourceText || "";
    if (background?.url) {
      this.mapView.setBackground(background.url);
      this.mapView.setOmap(null);
      return { background, omap: null };
    }
    if (omapSourceText) {
      try {
        const omapMap = parseOmap(omapSourceText, omap?.name || "embedded.omap", {
          fallbackScale: positiveScale(model.event?.map?.scale) || 15000
        });
        this.mapView.setBackground("");
        this.mapView.setOmap(omapMap);
        return {
          background: null,
          omap: {
            ...(omap || {}),
            name: omap?.name || omapMap.name,
            objectCount: omap?.objectCount ?? omapMap.objectCount,
            symbolCount: omap?.symbolCount ?? omapMap.symbolCount,
            scale: omap?.scale || omapMap.scale,
            sourceText: omapSourceText
          }
        };
      }
      catch {
        // Fall through to parsed-map fallback below.
      }
    }
    if (data.omapMap) {
      this.mapView.setBackground("");
      this.mapView.setOmap(data.omapMap);
      return {
        background: null,
        omap: {
          ...(omap || {}),
          name: omap?.name || data.omapMap.name || "embedded.omap",
          objectCount: omap?.objectCount ?? data.omapMap.objectCount,
          symbolCount: omap?.symbolCount ?? data.omapMap.symbolCount,
          scale: omap?.scale || data.omapMap.scale
        }
      };
    }
    this.mapView.setBackground("");
    this.mapView.setOmap(null);
    return { background: null, omap: null };
  },

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
  },

  exportPdf() {
    this.openPdfExportDialog();
  },

  openPdfExportDialog() {
    const dialog = this.querySelector("#pdfExportDialog");
    this.populatePdfExportDialog();
    this.setPdfExportProgress(null);
    openFloatingPalette(dialog);
    this.updatePdfExportDialogSummary();
  },

  closePdfExportDialog() {
    closeFloatingPalette(this.querySelector("#pdfExportDialog"));
  },

  handlePdfExportDialogClick(event) {
    if (event.target.closest("[data-pdf-export-cancel]")) {
      this.closePdfExportDialog();
      return;
    }
  },

  populatePdfExportDialog() {
    const state = this.store.snapshot();
    const currentPage = courseDisplayOptions(state.eventModel, state.ui).page || "global";
    const settings = readPdfExportSettings(effectivePrintArea(state.eventModel, state.ui.selectedCourseId, currentPage));
    this.populatePdfCourseOptions(state, settings.courseScope);
    this.querySelector("#pdfIncludeBaseMap").checked = settings.includeBaseMap !== false;
    this.querySelector("#pdfIncludeDescriptions").checked = settings.includeDescriptions !== false;
    this.querySelector("#pdfFilePrefix").value = settings.filePrefix || baseName(state.eventModel.sourceName);
    this.querySelector("#pdfUseCourseNames").checked = settings.useCourseNames !== false;
    this.querySelector("#pdfRelayUsedOnly").checked = settings.relayUsedOnly !== false;
    this.querySelector("#pdfLosslessCompression").checked = settings.losslessCompression !== false;
  },

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
  },

  pdfSettingsFromDialog() {
    return {
      courseScope: this.querySelector("#pdfCourseScope").value,
      includeBaseMap: this.querySelector("#pdfIncludeBaseMap").checked,
      includeDescriptions: this.querySelector("#pdfIncludeDescriptions").checked,
      pageBackground: false,
      outputMode: PDF_OUTPUT_MODES.VECTOR,
      filePrefix: this.querySelector("#pdfFilePrefix").value.trim() || baseName(this.store.snapshot().eventModel.sourceName),
      useCourseNames: this.querySelector("#pdfUseCourseNames").checked,
      relayUsedOnly: this.querySelector("#pdfRelayUsedOnly").checked,
      losslessCompression: this.querySelector("#pdfLosslessCompression").checked
    };
  },

  updatePdfExportDialogSummary() {
    const state = this.store.snapshot();
    const summary = this.querySelector("#pdfExportSummary");
    if (!summary) return;
    const settings = this.pdfSettingsFromDialog();
    const targets = this.pdfExportTargets(state, settings);
    const totalPages = targets.reduce((sum, target) => sum + this.pdfTargetPageCount(state, target), 0);
    const renderingLabel = "Vector PDF.";
    const parts = [
      this.t(targets.length === 1 ? "1 PDF will be created." : "{count} PDFs will be created.", { count: targets.length }),
      this.t(totalPages === 1 ? "1 map page." : "{count} map pages.", { count: totalPages }),
      this.t(settings.includeBaseMap ? "Base map included." : "Course overlay only."),
      this.t(renderingLabel),
      this.t(settings.losslessCompression !== false ? "Lossless PDF compression enabled." : "Lossless PDF compression disabled.")
    ];
    summary.hidden = false;
    summary.textContent = parts.join(" ");
  },

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
        const fileName = target.fileName || `${safeFilePart(settings.filePrefix)}${suffix}.pdf`;
        files.push({
          name: uniqueFileName(fileName, usedFileNames),
          blob
        });
        await this.showPdfExportProgress({
          current: stepBase + PDF_EXPORT_STEPS_PER_TARGET,
          total: totalSteps,
          message: this.t("Created {current} of {total} PDFs.", { current: index + 1, total: targets.length })
        });
      }
      const needsZipPackage = files.length > 1 || files.some(file => file.name.includes("/"));
      if (!needsZipPackage) {
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
  },

  async showPdfExportProgress(progress) {
    this.setPdfExportProgress(progress);
    await paintProgressFrame();
  },

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
  },

  setPdfExportProgress(progress) {
    const box = this.querySelector("#pdfExportProgress");
    const meter = this.querySelector("#pdfExportProgressMeter");
    const fill = this.querySelector("#pdfExportProgressFill");
    const text = this.querySelector("#pdfExportProgressText");
    const percent = this.querySelector("#pdfExportProgressPercent");
    if (!box || !meter || !text || !percent) return;
    if (!progress) {
      box.hidden = true;
      meter.setAttribute("aria-valuenow", "0");
      if (fill) fill.style.transform = "scaleX(0)";
      text.textContent = "";
      percent.textContent = "";
      return;
    }
    const total = Math.max(1, Number(progress.total) || 1);
    const current = clamp(Number(progress.current) || 0, 0, total);
    const value = Math.round(current / total * 100);
    box.hidden = false;
    meter.setAttribute("aria-valuenow", String(value));
    if (fill) fill.style.transform = `scaleX(${value / 100})`;
    text.textContent = progress.message || "";
    percent.textContent = `${value}%`;
  },

  pdfExportTargets(state, settings) {
    const scope = settings.courseScope || PDF_COURSE_SCOPES.CURRENT;
    const currentCourse = state.ui.selectedCourseId === "all" ? null : getCourse(state.eventModel, state.ui.selectedCourseId);
    if (scope === PDF_COURSE_SCOPES.ALL_COURSES) {
      return sortedCourses(state.eventModel).flatMap(course => this.pdfCourseTargets(state, course, settings));
    }
    if (scope === PDF_COURSE_SCOPES.ALL_CONTROLS) {
      return [{ type: "all-controls", uiCourseId: "all", name: this.t("All Controls") }];
    }
    if (scope.startsWith(PDF_COURSE_SCOPES.COURSE_PREFIX)) {
      const courseId = Number(scope.slice(PDF_COURSE_SCOPES.COURSE_PREFIX.length));
      const course = getCourse(state.eventModel, courseId);
      return course ? this.pdfCourseTargets(state, course, settings) : [];
    }
    if (currentCourse) {
      return this.pdfCourseTargets(state, currentCourse, settings);
    }
    return [{ type: "all-controls", uiCourseId: "all", name: this.t("All Controls") }];
  },

  pdfCourseTargets(state, course, settings = {}) {
    const baseNameText = course?.name || `course-${course?.id || "unknown"}`;
    const baseTarget = {
      type: "course",
      courseId: course.id,
      uiCourseId: course.id,
      name: baseNameText
    };
    if (!courseHasVariations(state.eventModel, course.id)) {
      return [baseTarget];
    }

    const hasConfiguredPages = course.kind === "normal" && (
      !!String(course.pageBreakFormula || "").trim()
      || courseView(state.eventModel, course.id, { allBranches: true })
        .some(row => row.courseControl?.mapExchange || row.courseControl?.mapFlip)
    );
    const exportsCurrentAllBranches = !hasConfiguredPages
      && (settings.courseScope || PDF_COURSE_SCOPES.CURRENT) === PDF_COURSE_SCOPES.CURRENT
      && Number(state.ui.selectedCourseId) === Number(course.id)
      && state.ui.variationMode === "all";
    if (exportsCurrentAllBranches) {
      return [{
        ...baseTarget,
        exportUi: {
          variationMode: "all",
          variationCode: ""
        }
      }];
    }

    const variations = allCourseVariations(state.eventModel, course.id);
    if (!variations.length) {
      return [baseTarget];
    }

    const folder = safeFilePart(baseNameText);
    const relay = relayAssignments(state.eventModel, course.id);
    const relayEntries = relay.entries.filter(entry => entry.variation?.code);
    const targets = relayEntries.map(entry => this.pdfRelayVariationTarget(course, folder, entry));
    if (settings.relayUsedOnly !== false && targets.length) {
      return targets;
    }

    const usedCodes = new Set(relayEntries.map(entry => String(entry.variation.code)));
    const variationTargets = variations
      .filter(variation => !targets.length || !usedCodes.has(String(variation.code)))
      .map(variation => this.pdfVariationTarget(course, folder, variation));
    return targets.length ? [...targets, ...variationTargets] : variationTargets;
  },

  pdfRelayVariationTarget(course, folder, entry) {
    const label = relayEntryLabel(course.relay || {}, entry.team, entry.leg);
    const code = entry.variation.code;
    const fileStem = `${safeFilePart(label)}-${safeFilePart(code)}`;
    return {
      type: "course",
      courseId: course.id,
      uiCourseId: course.id,
      name: `${course.name || `course-${course.id}`} / ${label}-${code}`,
      fileName: `${folder}/${fileStem}.pdf`,
      exportUi: {
        variationMode: "relay",
        variationCode: code,
        relayTeam: entry.team,
        relayLeg: entry.leg
      }
    };
  },

  pdfVariationTarget(course, folder, variation) {
    const code = variation.code;
    const fileStem = `${safeFilePart(this.t("Variation"))}-${safeFilePart(code)}`;
    return {
      type: "course",
      courseId: course.id,
      uiCourseId: course.id,
      name: `${course.name || `course-${course.id}`} / ${code}`,
      fileName: `${folder}/${fileStem}.pdf`,
      exportUi: {
        variationMode: "variation",
        variationCode: code
      }
    };
  },

  sourcePrintAreaForPdfTarget(state, target, coursePage = "global") {
    return target.type === "course"
      ? effectivePrintArea(state.eventModel, target.courseId, coursePage)
      : effectivePrintArea(state.eventModel, "all");
  },

  pdfAreaForTarget(state, target, settings, coursePage = "global", exportUi = state.ui) {
    const sourceArea = normalizePrintArea(this.sourcePrintAreaForPdfTarget(state, target, coursePage));
    if (!sourceArea.automatic) {
      return sourceArea;
    }
    return printAreaFromBounds(this.mapView.currentViewBounds(exportUi), sourceArea);
  },

  async createPdfBlobForTarget(state, target, settings, onProgress = async () => {}) {
    const course = target.type === "course" ? getCourse(state.eventModel, target.courseId) : null;
    const formulaError = course?.kind === "normal"
      ? validatePageBreakFormula(course.pageBreakFormula || "")
      : "";
    const exportUi = target.type === "course" ? {
      ...state.ui,
      selectedCourseId: target.uiCourseId,
      showAllControls: false,
      coursePage: "global",
      ...(target.exportUi || {})
    } : null;
    const runtimeDisplayOptions = typeof courseDisplayOptions === "function"
      ? courseDisplayOptions(state.eventModel, exportUi)
      : {};
    let runtimeError = "";
    if (course?.kind === "normal" && !formulaError && typeof courseView === "function") {
      const pageOptions = { ...runtimeDisplayOptions, page: "global" };
      const runtimeRows = courseView(state.eventModel, target.courseId, pageOptions);
      try {
        await preparePythonPageLayout(runtimeRows, course, pageOptions);
      }
      catch (error) {
        runtimeError = error?.message || String(error);
      }
      runtimeError ||= courseView(state.eventModel, target.courseId, pageOptions)
        .find(row => row.pageFormulaError)?.pageFormulaError || "";
    }
    if (formulaError || runtimeError) {
      throw new Error(this.t("Cannot export {course}: advanced page code is invalid ({message}).", {
        course: course?.name || target.name,
        message: formulaError || runtimeError
      }));
    }
    const pageCount = this.pdfTargetPageCount(state, target);
    const pageBlobs = [];
    for (let page = 1; page <= pageCount; page += 1) {
      const mappedProgress = async (phase, message) => {
        const numericPhase = Math.max(0, Math.min(7, Number(phase) || 0));
        // Reserve the tail of this target's progress range for assembling the
        // individual page documents, so progress never moves backwards.
        const overall = ((page - 1) * 7 + numericPhase) / Math.max(1, pageCount * 7) * 6.5;
        await onProgress(overall, pageCount > 1
          ? `${this.t("Page {page} of {count}", { page, count: pageCount })}: ${message}`
          : message);
      };
      pageBlobs.push(await this.createPdfPageBlobForTarget(state, target, settings, pageCount > 1 ? page : "global", mappedProgress));
    }
    if (pageBlobs.length > 1) {
      await onProgress(6.7, this.t("Combining {count} map pages…", { count: pageBlobs.length }));
    }
    const blob = await mergePdfBlobs(pageBlobs);
    await onProgress(7, this.t("Finalizing {name}…", { name: target.name }));
    return blob;
  },

  pdfTargetPageCount(state, target) {
    if (target.type !== "course") return 1;
    const course = getCourse(state.eventModel, target.courseId);
    if (course?.kind !== "normal") return 1;
    const exportUi = {
      ...state.ui,
      selectedCourseId: target.uiCourseId,
      showAllControls: false,
      coursePage: "global",
      ...(target.exportUi || {})
    };
    return coursePageCount(state.eventModel, target.courseId, {
      ...courseDisplayOptions(state.eventModel, exportUi),
      page: "global"
    });
  },

  async createPdfPageBlobForTarget(state, target, settings, coursePage = "global", onProgress = async () => {}) {
    const eventModel = settings.includeDescriptions
      ? state.eventModel
      : { ...cloneEvent(state.eventModel), specials: (state.eventModel.specials || []).filter(special => special.kind !== "descriptions") };
    const exportUi = {
      ...state.ui,
      // The on-screen map intensity slider is applied to the cached OMAP layer as
      // one grouped bitmap.  Vector PDF export draws OMAP objects one by one; if
      // we reused the slider value there, every base-map object would become
      // independently transparent and overlapping lower objects would show
      // through.  Printed/exported base maps should stay opaque; course purple
      // overprint/transparency is handled by the course drawing colours below.
      mapIntensity: 1,
      selectedCourseId: target.uiCourseId,
      showAllControls: target.type === "all-controls",
      ...(target.exportUi || {}),
      coursePage
    };
    const area = this.pdfAreaForTarget(state, target, settings, coursePage, exportUi);
    const page = pageSizeMm(area);
    const marginMm = pageMarginMm(area);
    const size = pdfPixelSize(page, marginMm);
    const pdfBackground = await this.vectorPdfBackgroundForExport(state, area, size, settings);
    await onProgress(1, this.t("Preparing {name} page…", { name: target.name }));
    const bitmapBackground = settings.includeBaseMap && this.mapView.hasBitmapBackground() && !this.mapView.omapMap && !pdfBackground
      ? this.mapView.renderAreaToCanvas(eventModel, exportUi, area, size, {
          includeBitmapBackground: true,
          includeOmapMap: false,
          includePageBackground: false,
          includeSpecials: false,
          includeCourse: false
        })
      : null;
    const blob = await createVectorMapPdfBlob({
      pageWidthMm: page.width,
      pageHeightMm: page.height,
      marginMm,
      canvasWidth: size.width,
      canvasHeight: size.height,
      backgroundPdf: pdfBackground,
      backgroundImage: bitmapBackground,
      needsUnicodeFont: containsUnicodeText(eventModel) || containsUnicodeText(target.name) || containsUnicodeText(this.mapView.omapMap),
      losslessCompression: settings.losslessCompression !== false,
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
,

  async vectorPdfBackgroundForExport(state, area, size, settings) {
    if (!settings.includeBaseMap) return null;
    const background = state.ui.background;
    if (background?.sourceKind !== "pdf") return null;
    let sourceDataUrl = background.pdf?.sourceDataUrl || null;
    if (!pdfDataUrlLooksLikePdf(sourceDataUrl) && background.pdf?.cacheKey) {
      sourceDataUrl = await loadCachedPdfBasemap(background.pdf.cacheKey);
    }
    if (!pdfDataUrlLooksLikePdf(sourceDataUrl)) {
      throw new Error(this.t("The original PDF base map data is missing or incomplete. Re-import the PDF base map, then export again."));
    }
    const canvasBox = this.mapView.backgroundExportCanvasBox(state.ui, area, size);
    if (!canvasBox || !(Math.abs(canvasBox.width) > 0) || !(Math.abs(canvasBox.height) > 0)) return null;
    return {
      sourceDataUrl,
      pageNumber: background.pdf.pageNumber || 1,
      canvasBox,
      canvasClipBox: this.mapView.exportAreaCanvasRect(area, size)
    };
  },

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
  },

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

  };
}

function measurementUiFromPersisted(value) {
  if (!value) return null;
  return {
    items: Array.isArray(value.items) ? value.items : [],
    showGroundLabels: !!value.showGroundLabels,
    color: value.color || "#007f93",
    lineStyle: ["solid", "dashed", "dotted"].includes(value.lineStyle) ? value.lineStyle : "solid",
    adding: false,
    selectedIndex: null,
    draft: { points: [], color: value.color || "#007f93", lineStyle: ["solid", "dashed", "dotted"].includes(value.lineStyle) ? value.lineStyle : "solid" }
  };
}

function measurementPersistedForSave(value) {
  if (!value) return null;
  return {
    items: Array.isArray(value.items) ? value.items : [],
    showGroundLabels: !!value.showGroundLabels,
    color: value.color || "#007f93",
    lineStyle: ["solid", "dashed", "dotted"].includes(value.lineStyle) ? value.lineStyle : "solid"
  };
}
