import {
  courseControlMapChangeKind,
  setCourseControlMapChange
} from "../domain/course-pages.js?v=20260726-83";
import { ensureMilitaryGrid } from "../domain/military-orienteering.js?v=20260726-83";

export function createAppShellCommandMethods(deps) {
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
    updateControlCode,
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
    normalizeRelayBranchSettings,
    relayAssignments,
    relayBranchAllowedLegs,
    relayBranchDisplayLegs,
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
    insertionVariationEndOwnerId,
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
      ui.measurement = null;
    }, "New event");
  },

  runCommand(command) {
    const state = this.store.snapshot();
    if (backgroundCalibrationRequired?.(state.ui.background) === true) {
      this.store.updateUi(ui => {
        ui.tool = "background-calibration";
        ui.selection = { type: "background" };
        ui.status = this.t("Complete the two-point map scale calibration before continuing.");
      }, "Map scale calibration required");
      return;
    }
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
        this.downloadOcp();
        break;
      case "export-ppen":
        this.downloadNativePpen();
        break;
      case "map-image":
        this.querySelector("#mapInput").click();
        break;
      case "omap-import":
        this.requestOmapImport();
        break;
      case "ocd-import":
        this.requestOcadImport();
        break;
      case "omap-clear":
        if (this.mapImportJob) {
          this.showMapImportBusyMessage();
          break;
        }
        this.mapView.setOmap(null);
        this.store.updateUi(ui => { ui.omap = null; }, "OMAP map cleared");
        break;
      case "undo":
        if (this.store.undo()) this.restoreMeasurementsFromEvent();
        break;
      case "redo":
        if (this.store.redo()) this.restoreMeasurementsFromEvent();
        break;
      case "delete":
        if (state.ui.tool === "measure" && state.ui.measurement?.selectedIndex !== null && state.ui.measurement?.selectedIndex !== undefined) {
          this.deleteSelectedMeasurement();
          break;
        }
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
        this.mapView?.cancelDrag?.();
        this.store.updateUi(ui => {
          ui.tool = "select";
          ui.printAreaEdit = null;
          ui.specialToolOptions = null;
        }, "Select mode");
        break;
      case "measure-finish":
        this.finishMeasurement();
        break;
      case "measure-add":
        this.beginMeasurement();
        break;
      case "measure-delete":
        this.deleteSelectedMeasurement();
        break;
      case "measure-clear":
        this.clearMeasurement();
        break;
      case "open-measure":
        this.openMeasurementPanel();
        break;
      case "course-pages":
        this.openCoursePageSettings();
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
          applyCourseSelectionUi(eventModel, ui, "all");
        }, "All controls");
        break;
      case "quality":
        this.cycleRenderQuality();
        break;
      case "global-options":
        this.openGlobalOptions();
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
        alert(this.t("O-Composer {version}\nA browser-only app for creating, editing, viewing, and exporting orienteering event files.\n\nLicensed under the GNU AGPLv3.", { version: APP_VERSION }));
        break;
      case "help":
        alert(this.t("O-Composer {version}\n\nThis version runs entirely in the browser. It can read and write .ocp files, import and export compatible .ppen files, convert OCAD maps locally with bundled Mapper WebAssembly, render uncompressed .omap/.xmap XML maps, import high-resolution PDF basemaps, and export browser-generated files. Installed-font checks and Livelox API publishing still require desktop/runtime capabilities that browsers do not expose.", { version: APP_VERSION }));
        break;
      default:
        if (command.startsWith("tool-")) {
          this.setTool(command);
        }
        break;
    }
  },

  setTool(command) {
    if (backgroundCalibrationRequired?.(this.store.snapshot().ui.background) === true) {
      this.store.updateUi(ui => {
        ui.tool = "background-calibration";
        ui.selection = { type: "background" };
        ui.status = this.t("Complete the two-point map scale calibration before continuing.");
      }, "Map scale calibration required");
      return;
    }
    const toolMap = {
      "tool-start": "control:start",
      "tool-control": "control:normal",
      "tool-finish": "control:finish",
      "tool-map-exchange": "control:map-exchange",
      "tool-crossing": "control:crossing-point",
      "tool-map-issue": "control:map-issue",
      "tool-line-cut": "line-cut",
      "tool-measure": "measure",
      "tool-description": "special:descriptions",
      "tool-text": "special:text",
      "tool-line": "special:line",
      "tool-rectangle": "special:rectangle",
      "tool-ellipse": "special:ellipse",
      "tool-oob": "special:out-of-bounds",
      "tool-oob-no-boundary": { tool: "special:out-of-bounds", options: { lineKind: "none" } },
      "tool-danger": "special:dangerous-area",
      "tool-construction": "special:temporary-construction",
      "tool-opt-crossing": "special:optional-crossing-point",
      "tool-water": "special:water",
      "tool-first-aid": "special:first-aid",
      "tool-forbidden": "special:forbidden-route",
      "tool-boundary": "special:boundary",
      "tool-regmark": "special:registration-mark",
      "tool-whiteout": "special:white-out"
    };
    const mapped = toolMap[command] || "select";
    this.store.updateUi(ui => {
      if (mapped === "measure" && ui.tool === "measure") {
        const current = normalizeMeasurementState(ui.measurement);
        ui.tool = "select";
        ui.measurement = { ...current, adding: false, selectedIndex: null, draft: { ...current.draft, points: [] } };
        return;
      }
      ui.tool = typeof mapped === "string" ? mapped : mapped.tool;
      ui.specialToolOptions = typeof mapped === "string" ? null : { ...(mapped.options || {}) };
      ui.printAreaEdit = null;
      if (mapped === "measure") {
        const current = normalizeMeasurementState(ui.measurement);
        ui.measurement = {
          ...current,
          adding: false,
          selectedIndex: null,
          draft: { ...current.draft, points: [] }
        };
      }
      if (mapped === "measure") ui.status = this.t("Measurement mode");
      if (mapped === "control:map-exchange") {
        ui.status = this.t("Click the map to place a standalone map exchange. Select a course leg first to insert it on that leg.");
      }
    }, "Add mode");
  },

  addMeasurementPoint(point) {
    const state = this.store.snapshot();
    if (state.ui.tool !== "measure" || !state.ui.measurement?.adding) return;
    const closeDistance = 12 / Math.max(0.001, this.mapView.scale(state.ui));
    let completed = false;
    this.store.updateUi(ui => {
      const current = normalizeMeasurementState(ui.measurement);
      const points = [...current.draft.points];
      const first = points[0];
      const closes = points.length >= 3 && first && distance(first, point) <= closeDistance;
      completed = closes;
      if (!closes) points.push({ x: point.x, y: point.y });
      ui.measurement = {
        ...current,
        items: closes ? [...current.items, measurementItem(current, points, true)] : current.items,
        draft: { ...current.draft, points: closes ? [] : points },
        adding: !closes,
        selectedIndex: closes ? current.items.length : null
      };
      ui.status = this.t("Measurement mode");
    }, "Measurement");
    if (completed) this.persistMeasurements("Add measurement");
  },

  finishMeasurement(options = {}) {
    let completed = false;
    this.store.updateUi(ui => {
      if (ui.tool !== "measure" || !ui.measurement?.adding) return;
      const current = normalizeMeasurementState(ui.measurement);
      const points = [...current.draft.points];
      if (options.removeDuplicate && points.length >= 2) {
        const last = points[points.length - 1];
        const previous = points[points.length - 2];
        const tolerance = 3 / Math.max(0.001, this.mapView.scale(ui));
        if (distance(last, previous) <= tolerance) points.pop();
      }
      if (points.length >= 2) {
        completed = true;
        ui.measurement = {
          ...current,
          items: [...current.items, measurementItem(current, points, false)],
          draft: { ...current.draft, points: [] },
          adding: false,
          selectedIndex: current.items.length
        };
        ui.status = this.t("Measurement finished");
      }
    }, "Measurement finished");
    if (completed) this.persistMeasurements("Add measurement");
  },

  clearMeasurement() {
    const currentState = normalizeMeasurementState(this.store.snapshot().ui.measurement);
    if ((currentState.items.length || currentState.draft.points.length) && !confirm(this.t("Clear all measurements?"))) return;
    this.store.updateUi(ui => {
      const current = normalizeMeasurementState(ui.measurement);
      ui.measurement = { ...current, items: [], draft: { ...current.draft, points: [] }, adding: false, selectedIndex: null };
      ui.status = this.t("Measurement cleared");
    }, "Measurement cleared");
    this.persistMeasurements("Clear measurements");
  },

  undoMeasurementPoint() {
    this.store.updateUi(ui => {
      if (ui.tool !== "measure" || !ui.measurement?.adding) return;
      const current = normalizeMeasurementState(ui.measurement);
      if (!current.draft.points.length) return;
      ui.measurement = {
        ...current,
        draft: { ...current.draft, points: current.draft.points.slice(0, -1) }
      };
      ui.status = this.t("Last measurement point removed");
    }, "Measurement point removed");
  },

  updateMeasurementOptions(options = {}) {
    let shouldPersist = false;
    this.store.updateUi(ui => {
      const current = normalizeMeasurementState(ui.measurement);
      const color = /^#[0-9a-f]{6}$/i.test(String(options.color || "")) ? String(options.color) : current.color;
      const lineStyle = normalizeMeasurementLineStyle(options.lineStyle || current.lineStyle);
      const showGroundLabels = options.showGroundLabels === undefined ? current.showGroundLabels : !!options.showGroundLabels;
      const items = [...current.items];
      if (options.color && !current.adding && Number.isInteger(current.selectedIndex) && items[current.selectedIndex]) {
        items[current.selectedIndex] = { ...items[current.selectedIndex], color };
        shouldPersist = true;
      }
      if (options.lineStyle && !current.adding && Number.isInteger(current.selectedIndex) && items[current.selectedIndex]) {
        items[current.selectedIndex] = { ...items[current.selectedIndex], lineStyle };
        shouldPersist = true;
      }
      if (options.showGroundLabels !== undefined) shouldPersist = true;
      ui.measurement = {
        ...current,
        items,
        color,
        lineStyle,
        showGroundLabels,
        draft: { ...current.draft, color, lineStyle }
      };
    }, "Measurement options");
    if (shouldPersist) this.persistMeasurements("Change measurement appearance");
  },

  beginMeasurement() {
    this.store.updateUi(ui => {
      if (ui.tool !== "measure") ui.tool = "measure";
      const current = normalizeMeasurementState(ui.measurement);
      ui.measurement = {
        ...current,
        adding: true,
        selectedIndex: null,
        draft: { ...current.draft, points: [], color: current.color, lineStyle: current.lineStyle }
      };
      ui.status = this.t("Click the map to add the first measurement point.");
    }, "Add measurement");
  },

  openMeasurementPanel() {
    this.store.updateUi(ui => {
      const current = normalizeMeasurementState(ui.measurement);
      ui.tool = "measure";
      ui.printAreaEdit = null;
      ui.measurement = {
        ...current,
        adding: false,
        selectedIndex: null,
        draft: { ...current.draft, points: [] }
      };
      ui.status = this.t("Measurement mode");
    }, "Measurement mode");
  },

  selectMeasurement(index) {
    this.store.updateUi(ui => {
      if (ui.tool !== "measure" || ui.measurement?.adding) return;
      const current = normalizeMeasurementState(ui.measurement);
      ui.measurement = {
        ...current,
        selectedIndex: Number.isInteger(index) && index >= 0 && index < current.items.length ? index : null
      };
    }, "Select measurement");
  },

  moveMeasurementLabel(index, point, options = {}) {
    this.store.updateUi(ui => {
      if (ui.tool !== "measure" || ui.measurement?.adding) return;
      const current = normalizeMeasurementState(ui.measurement);
      if (!Number.isInteger(index) || !current.items[index]) return;
      const items = [...current.items];
      items[index] = { ...items[index], labelPosition: { x: point.x, y: point.y } };
      ui.measurement = { ...current, items, selectedIndex: index };
    }, "Move measurement label");
    if (!options.transient) this.persistMeasurements("Move measurement label");
  },

  deleteSelectedMeasurement() {
    let deleted = false;
    this.store.updateUi(ui => {
      if (ui.tool !== "measure") return;
      const current = normalizeMeasurementState(ui.measurement);
      const index = current.selectedIndex;
      if (!Number.isInteger(index) || !current.items[index]) return;
      deleted = true;
      ui.measurement = {
        ...current,
        items: current.items.filter((_, itemIndex) => itemIndex !== index),
        selectedIndex: null
      };
      ui.status = this.t("Measurement deleted");
    }, "Delete measurement");
    if (deleted) this.persistMeasurements("Delete measurement");
  },

  addMeasurementVertex(index, insertIndex, point) {
    let changed = false;
    this.store.updateUi(ui => {
      if (ui.tool !== "measure" || ui.measurement?.adding) return;
      const current = normalizeMeasurementState(ui.measurement);
      const item = current.items[index];
      if (!item || !Number.isInteger(insertIndex)) return;
      const points = [...item.points];
      points.splice(Math.max(0, Math.min(points.length, insertIndex)), 0, { x: point.x, y: point.y });
      const items = [...current.items];
      items[index] = { ...item, points };
      ui.measurement = { ...current, items, selectedIndex: index };
      changed = true;
    }, "Add measurement vertex");
    if (changed) this.persistMeasurements("Add measurement vertex");
  },

  deleteMeasurementVertex(index, vertexIndex) {
    let changed = false;
    this.store.updateUi(ui => {
      if (ui.tool !== "measure" || ui.measurement?.adding) return;
      const current = normalizeMeasurementState(ui.measurement);
      const item = current.items[index];
      const minimum = item?.closed ? 3 : 2;
      if (!item || item.points.length <= minimum || !Number.isInteger(vertexIndex) || !item.points[vertexIndex]) return;
      const items = [...current.items];
      items[index] = { ...item, points: item.points.filter((_, pointIndex) => pointIndex !== vertexIndex) };
      ui.measurement = { ...current, items, selectedIndex: index };
      changed = true;
    }, "Delete measurement vertex");
    if (changed) this.persistMeasurements("Delete measurement vertex");
  },

  moveMeasurementVertex(index, vertexIndex, point, options = {}) {
    let changed = false;
    this.store.updateUi(ui => {
      if (ui.tool !== "measure" || ui.measurement?.adding) return;
      const current = normalizeMeasurementState(ui.measurement);
      const item = current.items[index];
      if (!item || !Number.isInteger(vertexIndex) || !item.points[vertexIndex]) return;
      const points = [...item.points];
      points[vertexIndex] = { x: point.x, y: point.y };
      const items = [...current.items];
      items[index] = { ...item, points };
      ui.measurement = { ...current, items, selectedIndex: index };
      changed = true;
    }, "Move measurement vertex");
    if (changed && !options.transient) this.persistMeasurements("Move measurement vertex");
  },

  persistMeasurements(label = "Change measurements") {
    const measurement = normalizeMeasurementState(this.store.snapshot().ui.measurement);
    const persisted = {
      items: measurement.items.map(item => ({
        points: item.points.map(point => ({ x: point.x, y: point.y })),
        closed: !!item.closed,
        color: item.color,
        lineStyle: normalizeMeasurementLineStyle(item.lineStyle),
        labelPosition: item.labelPosition ? { ...item.labelPosition } : null
      })),
      showGroundLabels: !!measurement.showGroundLabels,
      color: measurement.color,
      lineStyle: measurement.lineStyle
    };
    this.store.updateEvent(model => {
      model.metadata ||= {};
      model.metadata.measurements = persisted;
    }, label);
  },

  restoreMeasurementsFromEvent() {
    const saved = this.store.snapshot().eventModel.metadata?.measurements;
    this.store.updateUi(ui => {
      const current = normalizeMeasurementState(ui.measurement);
      ui.measurement = {
        ...current,
        items: Array.isArray(saved?.items) ? saved.items : [],
        showGroundLabels: !!saved?.showGroundLabels,
        color: saved?.color || current.color,
        lineStyle: normalizeMeasurementLineStyle(saved?.lineStyle || current.lineStyle),
        adding: false,
        selectedIndex: null,
        draft: { ...current.draft, points: [], color: saved?.color || current.color, lineStyle: normalizeMeasurementLineStyle(saved?.lineStyle || current.lineStyle) }
      };
    }, "Restore measurements");
  },

  applyTool(tool, point, toolOptions = {}) {
    const state = this.store.snapshot();
    if (backgroundCalibrationRequired?.(state.ui.background) === true && tool !== "background-calibration") {
      this.store.updateUi(ui => {
        ui.tool = "background-calibration";
        ui.selection = { type: "background" };
        ui.status = this.t("Complete the two-point map scale calibration before continuing.");
      }, "Map scale calibration required");
      return;
    }
    const selectedCourseId = state.ui.selectedCourseId;
    const selectedLegCourseControls = selectedLegCourseControlPair(state);
    const afterCourseControl = insertionCourseControlId(state);
    const beforeCourseControl = insertionBeforeCourseControlId(state);
    const variationEndOwnerCourseControl = insertionVariationEndOwnerId(state);
    if (tool === "background-calibration") {
      let shouldPromptForDistance = false;
      this.store.updateUi(ui => {
        if (!ui.background) return;
        const imagePoint = backgroundImagePointForMap(ui.background, point);
        const imagePoints = [...(ui.background.calibration?.imagePoints || []), imagePoint].slice(-2);
        ui.background.calibration = {
          ...(ui.background.calibration || {}),
          imagePoints,
          awaitingDistance: true
        };
        resetBackgroundCalibrationBase(ui.background);
        ui.selection = { type: "background" };
        if (imagePoints.length >= 2) {
          if (backgroundCalibrationDistance(ui.background) > 0.0001) {
            ui.tool = backgroundCalibrationRequired?.(ui.background) === true ? "background-calibration" : "select";
            ui.status = this.t("Enter the known distance for the selected map line.");
            shouldPromptForDistance = true;
          }
          else {
            ui.background.calibration.imagePoints = imagePoints.slice(0, 1);
            ui.status = this.t("Choose a different second calibration point.");
          }
        }
        else {
          ui.status = this.t("Click the second point on the map.");
        }
      }, "Calibrate map background");
      this.syncBackgroundMeasurement();
      if (shouldPromptForDistance) this.promptBackgroundCalibrationDistance();
      return;
    }
    if (tool === "military:window") {
      const course = getCourse(state.eventModel, selectedCourseId);
      if (course?.kind !== "military") return;
      const snapped = snappedControlForPlacement(state, "normal", point, this.mapView);
      let windowId = Number(snapped?.control?.id) || null;
      this.store.updateEvent(model => {
        let row = windowId
          ? courseView(model, selectedCourseId, { allBranches: true })
            .find(item => Number(item.control?.id) === windowId)
          : null;
        if (!row && windowId) {
          const selection = addExistingControlToCourse(model, selectedCourseId, windowId, { beforeFinish: true });
          row = selection ? {
            control: getControl(model, windowId),
            courseControl: getCourseControl(model, selection.courseControl)
          } : null;
        }
        if (!row) {
          const selection = addControlAt(model, "normal", point, selectedCourseId);
          windowId = selection.id;
          row = {
            control: getControl(model, selection.id),
            courseControl: getCourseControl(model, selection.courseControl)
          };
        }
        if (!row?.courseControl) return;
        row.courseControl.timeWindow = true;
        row.courseControl.windowStartTime ||= "00:00";
        row.courseControl.windowEndTime ||= "00:00";
      }, "Add military time window");
      this.store.updateUi(ui => {
        ui.tool = "select";
        ui.selection = windowId ? { type: "control", id: windowId } : null;
        ui.status = this.t(snapped ? "Existing control used as a time-window point." : "Hidden time-window point added.");
      }, "Select military time window");
      return;
    }
    if (tool === "special:military-grid") {
      const courseId = state.ui.specialToolOptions?.courseId || selectedCourseId;
      const gridId = state.ui.specialToolOptions?.gridId || null;
      this.store.updateEvent(model => {
        const course = getCourse(model, courseId);
        if (course?.kind !== "military") return;
        ensureMilitaryGrid(model, courseId, gridId).locations = (toolOptions.locations || []).map(location => ({ x: location.x, y: location.y }));
      }, "Set military grid boundary");
      this.store.updateUi(ui => {
        ui.tool = "select";
        ui.specialToolOptions = null;
        ui.status = this.t("Coordinate grid created.");
      }, "Finish military grid");
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
      const blockedMessage = this.controlInsertionBlockedMessage(state, kind, selectedLegCourseControls, afterCourseControl);
      if (blockedMessage) {
        this.store.updateUi(ui => { ui.status = blockedMessage; }, "Add control failed");
        return;
      }
      const snapped = snappedControlForPlacement(state, kind, point, this.mapView);
      if (snapped) {
        const shouldInsertSnappedControl = selectedCourseId
          && selectedCourseId !== "all"
          && (!snapped.usedInSelectedCourse || afterCourseControl || beforeCourseControl || selectedLegCourseControls || state.ui.variationBranch);
        if (shouldInsertSnappedControl) {
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
          const selection = addControlAt(model, kind, point, selectedCourseId, {
            afterCourseControl,
            beforeCourseControl,
            variationEndOwnerCourseControl,
            fromCourseControl: selectedLegCourseControls?.from?.id || null,
            toCourseControl: selectedLegCourseControls?.to?.id || null,
            teamRole: teamAddRole
          });
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
        if ((afterCourseControl || beforeCourseControl || variationEndOwnerCourseControl || selectedLegCourseControls || ui.variationBranch) && pending?.courseControl) {
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
      const options = { ...(state.ui.specialToolOptions || {}) };
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
        ui.specialToolOptions = null;
      }, "Select mode");
    }
  },

  addExistingControlToCurrentCourse(selection, options = {}) {
    const state = this.store.snapshot();
    if (!selection?.id || !state.ui.selectedCourseId || state.ui.selectedCourseId === "all") return;
    const selectedLegCourseControls = selectedLegCourseControlPair(state);
    const afterCourseControl = insertionCourseControlId(state);
    const beforeCourseControl = insertionBeforeCourseControlId(state);
    const variationEndOwnerCourseControl = insertionVariationEndOwnerId(state);
    const course = getCourse(state.eventModel, state.ui.selectedCourseId);
    const control = getControl(state.eventModel, selection.id);
    const teamRole = options.teamRole || (course?.kind === "team" && state.ui.teamAddControlRole === "free" ? "free" : "mandatory");
    if (course?.kind === "team" && teamRole === "free" && (control?.kind === "start" || control?.kind === "finish")) {
      this.store.updateUi(ui => { ui.status = this.t("Free controls cannot be start or finish."); }, "Add existing control failed");
      return;
    }
    const blockedMessage = this.controlInsertionBlockedMessage(state, control?.kind, selectedLegCourseControls, afterCourseControl);
    if (blockedMessage) {
      this.store.updateUi(ui => { ui.status = blockedMessage; }, "Add existing control failed");
      return;
    }
    try {
      this.store.updateEvent(model => {
        const nextSelection = addExistingControlToCourse(model, state.ui.selectedCourseId, selection.id, {
          afterCourseControl,
          beforeCourseControl,
          variationEndOwnerCourseControl,
          fromCourseControl: selectedLegCourseControls?.from?.id || null,
          toCourseControl: selectedLegCourseControls?.to?.id || null,
          teamRole
        });
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
      if ((afterCourseControl || beforeCourseControl || variationEndOwnerCourseControl || selectedLegCourseControls || ui.variationBranch) && pending?.courseControl) {
        ui.variationInsertAfterCourseControl = pending.courseControl;
        ui.variationInsertBeforeCourseControl = null;
        ui.variationAnchorCourseControl = pending.courseControl;
        ui.variationSelectedSegment = `node:${pending.courseControl}`;
      }
      ui.tool = "select";
    }, "Select mode");
  },

  controlInsertionBlockedMessage(state, kind, selectedLegCourseControls, afterCourseControl) {
    if (!["normal", "crossing-point", "map-exchange"].includes(kind)) return "";
    if (selectedLegCourseControls?.fromControl?.kind === "map-issue"
      && selectedLegCourseControls?.toControl?.kind === "start") {
      return this.t("Controls cannot be added between map issue and start.");
    }
    const afterControl = getControl(state.eventModel, getCourseControl(state.eventModel, afterCourseControl)?.control);
    return afterControl?.kind === "finish"
      ? this.t("Controls cannot be added after finish.")
      : "";
  },

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
  },

  selectExistingDescriptionSpecial(special) {
    this.store.updateUi(ui => {
      ui.selection = { type: "special", id: special.id };
      ui.tool = "select";
      ui.status = this.t("This course already has a control description table.");
    }, "Select existing descriptions");
  },

  addManualLegCut(point, legHit) {
    if (!legHit?.leg) {
      this.store.updateUi(ui => { ui.status = "Click a purple course line to cut it."; }, "Cut line");
      return;
    }
    const state = this.store.snapshot();
    const selectedCourse = state.ui.selectedCourseId === "all" ? null : getCourse(state.eventModel, state.ui.selectedCourseId);
    const metrics = createCourseSymbolMetrics(state.eventModel, selectedCourse, state.eventModel.event.courseAppearance, this.mapView.scale(state.ui), state.ui.selectedCourseId === "all");
    const gapSize = Math.max(0.5, courseSymbolMmToMapDistance(Number(state.eventModel.event.courseAppearance?.autoLegGapSize) || 3.5, metrics, this.mapView.scale(state.ui)));
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
  },

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
    this.store.updateUi(ui => {
      ui.selection = {
        type: "leg-gap",
        startControl: selection.startControl,
        endControl: selection.endControl,
        startCourseControl: selection.startCourseControl || null,
        endCourseControl: selection.endCourseControl || null,
        gapIndex: selection.gapIndex
      };
    }, "Select cut");
  },

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
        startCourseControl: selection.startCourseControl || null,
        endCourseControl: selection.endCourseControl || null,
        bendIndex
      };
    }, "Add bend point");
    const pending = this.store.snapshot().eventModel.metadata.pendingSelection;
    if (!pending) return;
    this.store.updateUi(ui => {
      ui.selection = pending;
      ui.tool = "select";
    }, "Select bend");
  },

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
        startCourseControl: selection.startCourseControl || null,
        endCourseControl: selection.endCourseControl || null,
        bendIndex: selection.bendIndex
      };
    }, "Select bend");
  },

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
      if (!options.transient && !background.calibration.awaitingDistance) {
        resetBackgroundCalibrationBase(background);
        applyBackgroundCalibration(background, backgroundAspect(background));
      }
    }, "Move calibration point");
    this.syncBackgroundMeasurement();
  },

  moveBackground(point, options = {}) {
    this.store.updateUi(ui => {
      if (ui.background) {
        ui.background.centerX = Number(point?.x) || 0;
        ui.background.centerY = Number(point?.y) || 0;
      }
      else if (ui.omap) {
        ui.omap.offset = { x: Number(point?.x) || 0, y: Number(point?.y) || 0 };
      }
      if (!options.transient) ui.status = this.t("Drag the background on the canvas.");
    }, "Move map background");
  },

  updateMilitaryGridBoundary(locations, options = {}) {
    if (options.operation === "delete-blocked") {
      this.store.updateUi(ui => {
        ui.status = this.t("A grid boundary must keep at least three vertices.");
      }, "Keep military grid boundary");
      return;
    }
    const points = (locations || [])
      .map(point => ({ x: Number(point?.x), y: Number(point?.y) }))
      .filter(point => Number.isFinite(point.x) && Number.isFinite(point.y));
    if (points.length < 3) return;
    const courseId = this.store.snapshot().ui.selectedCourseId;
    this.store.updateEvent(model => {
      ensureMilitaryGrid(model, courseId).locations = points;
    }, this.t(options.operation === "add"
      ? "Grid boundary vertex added."
      : options.operation === "delete"
        ? "Grid boundary vertex deleted."
        : "Coordinate grid boundary updated."));
  },

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
        endControl: selection.endControl,
        startCourseControl: selection.startCourseControl || null,
        endCourseControl: selection.endCourseControl || null
      };
      ui.tool = "select";
    }, "Select leg");
  },

  changeFixedCoursePageAction({ sourceId = 0, targetId = 0, kind = null, addOnly = false } = {}) {
    const state = this.store.snapshot();
    const selection = state.ui.selection;
    const courseId = Number(this.coursePageSettingsCourseId)
      || (selection?.type === "course" ? Number(selection.id) : 0);
    if (!courseId) return false;
    if (kind !== null && kind !== "" && kind !== "exchange" && kind !== "flip") return false;

    const sourceCourseControlId = Number(sourceId) || 0;
    const targetCourseControlId = Number(targetId) || 0;
    const resolveChange = model => {
      const course = getCourse(model, courseId);
      if (!course || course.kind !== "normal" || courseHasVariations(model, course.id)) return null;
      const rows = courseView(model, course.id, { page: "global" });
      const normalRows = rows.map((row, rowIndex) => ({ row, rowIndex }))
        .filter(item => item.row.control?.kind === "normal" && item.row.courseControl);
      const source = sourceCourseControlId
        ? normalRows.find(item => Number(item.row.courseControl.id) === sourceCourseControlId)
        : null;
      const target = targetCourseControlId
        ? normalRows.find(item => Number(item.row.courseControl.id) === targetCourseControlId)
        : null;
      if (sourceCourseControlId && !source) return null;
      const sourceKind = courseControlMapChangeKind(source?.row.courseControl);
      const finalKind = kind === null ? sourceKind : kind;
      if (!finalKind && !sourceKind) return null;
      const editsExistingTerminalAction = sourceCourseControlId === targetCourseControlId && !!sourceKind;
      if (finalKind && (!target || (target.rowIndex >= rows.length - 1 && !editsExistingTerminalAction))) return null;
      const targetKind = courseControlMapChangeKind(target?.row.courseControl);
      if ((addOnly || sourceCourseControlId !== targetCourseControlId) && targetKind) return null;
      const changesFlags = sourceCourseControlId !== targetCourseControlId
        || (target ? targetKind !== finalKind : !!sourceKind);
      if (!changesFlags && !String(course.pageBreakFormula || "").trim()) return null;
      return { course, source, target, finalKind };
    };

    if (!resolveChange(state.eventModel)) return false;
    let updated = false;
    this.store.updateEvent(model => {
      const change = resolveChange(model);
      if (!change) return;
      const { course, source, target, finalKind } = change;

      if (source && sourceCourseControlId !== targetCourseControlId) {
        setCourseControlMapChange(source.row.courseControl, "");
      }
      if (target) {
        setCourseControlMapChange(target.row.courseControl, finalKind);
      }
      else if (source) {
        setCourseControlMapChange(source.row.courseControl, "");
      }
      course.pageBreakFormula = "";
      updated = true;
    }, "Change course page action");
    if (updated) {
      this.store.updateUi(ui => { ui.coursePage = "global"; }, "Show global course page");
    }
    return updated;
  },

  addCoursePageAction(button) {
    const form = button?.closest?.("[data-course-page-add-form]");
    const pointInput = form?.querySelector?.("[data-course-page-add-point]");
    const kindInput = form?.querySelector?.("[data-course-page-add-kind]");
    if (kindInput?.value === "standalone-exchange") {
      return this.convertFixedCoursePointToStandaloneMapExchange(Number(pointInput?.value) || 0);
    }
    return this.changeFixedCoursePageAction({
      targetId: Number(pointInput?.value) || 0,
      kind: kindInput?.value,
      addOnly: true
    });
  },

  convertFixedCoursePointToStandaloneMapExchange(courseControlId) {
    const state = this.store.snapshot();
    const selection = state.ui.selection;
    const courseId = Number(this.coursePageSettingsCourseId)
      || (selection?.type === "course" ? Number(selection.id) : 0);
    if (!courseId) return false;
    const course = getCourse(state.eventModel, courseId);
    if (!course || course.kind !== "normal" || courseHasVariations(state.eventModel, course.id)) return false;
    const rows = courseView(state.eventModel, course.id, { page: "global" });
    const rowIndex = rows.findIndex(row => Number(row.courseControl?.id) === Number(courseControlId));
    const row = rows[rowIndex];
    if (!row?.courseControl || row.control?.kind !== "normal" || rowIndex >= rows.length - 1) return false;
    if (courseControlMapChangeKind(row.courseControl)) return false;

    this.store.updateEvent(model => {
      const targetCourse = getCourse(model, courseId);
      const targetCourseControl = getCourseControl(model, courseControlId);
      const control = getControl(model, targetCourseControl?.control);
      if (!targetCourse || !targetCourseControl || control?.kind !== "normal") return;
      control.kind = "map-exchange";
      // Keep the original code and description data hidden on the exchange so
      // removing the action can restore this exact checkpoint in place.
      for (const occurrence of model.courseControls || []) {
        if (Number(occurrence.control) === Number(control.id)) {
          setCourseControlMapChange(occurrence, "exchange");
        }
      }
      targetCourse.pageBreakFormula = "";
    }, "Convert control to standalone map exchange");
    this.store.updateUi(ui => { ui.coursePage = "global"; }, "Show global course page");
    return true;
  },

  removeStandaloneCoursePageAction(courseControlId) {
    const state = this.store.snapshot();
    const selection = state.ui.selection;
    const courseId = Number(this.coursePageSettingsCourseId)
      || (selection?.type === "course" ? Number(selection.id) : 0);
    if (!courseId) return false;
    const course = getCourse(state.eventModel, courseId);
    if (!course || course.kind !== "normal" || courseHasVariations(state.eventModel, course.id)) return false;
    const row = courseView(state.eventModel, course.id, { page: "global" })
      .find(item => Number(item.courseControl?.id) === Number(courseControlId));
    if (row?.control?.kind !== "map-exchange") return false;

    this.store.updateEvent(model => {
      deleteSelection(model, { type: "course-control", id: Number(courseControlId) });
    }, "Remove standalone map exchange");
    this.store.updateUi(ui => { ui.coursePage = "global"; }, "Show global course page");
    return true;
  },

  openCoursePageSettings() {
    const state = this.store.snapshot();
    const courseId = state.ui.selectedCourseId === "all" ? 0 : Number(state.ui.selectedCourseId);
    const course = getCourse(state.eventModel, courseId);
    if (!course) {
      alert(this.t("Select a course first."));
      return false;
    }
    if (course.kind !== "normal") {
      alert(this.t("Map pages are available only for normal courses."));
      return false;
    }

    this.coursePageSettingsCourseId = course.id;
    this.openCommandDialog({
      title: "Map pages",
      body: this.coursePageSettingsDialogBody(state.eventModel, course),
      showActions: false,
      coursePageSettings: true,
      onChange: event => {
        const target = event.target;
        if (target.dataset.coursePageMove === undefined
          && target.dataset.coursePageBreak === undefined
          && target.dataset.field !== "course.pageBreakFormula") {
          return;
        }
        this.updateSelectionField(event, { courseId: this.coursePageSettingsCourseId });
        this.refreshCoursePageSettingsDialog();
      }
    });
    return true;
  },

  coursePageSettingsDialogBody(eventModel, course) {
    return `
      <div class="course-page-settings-dialog-body">
        <p class="course-page-settings-course"><span>${escapeHtml(this.t("Course"))}</span><strong>${escapeHtml(course.name || `Course ${course.id}`)}</strong></p>
        ${this.coursePageEditor(eventModel, course)}
      </div>
    `;
  },

  refreshCoursePageSettingsDialog() {
    if (!this.activeCommandDialog?.coursePageSettings || !this.coursePageSettingsCourseId) return;
    const state = this.store.snapshot();
    const course = getCourse(state.eventModel, this.coursePageSettingsCourseId);
    if (!course || course.kind !== "normal") {
      this.closeCommandDialog();
      return;
    }
    const body = this.querySelector("#commandBody");
    if (body) body.innerHTML = this.coursePageSettingsDialogBody(state.eventModel, course);
  },

  syncCoursePageSettingsDialogToSelectedCourse(state = this.store.snapshot()) {
    if (!this.activeCommandDialog?.coursePageSettings) return false;
    const selectedCourseId = state.ui?.selectedCourseId === "all"
      ? 0
      : Number(state.ui?.selectedCourseId) || 0;
    const course = getCourse(state.eventModel, selectedCourseId);
    if (!course || course.kind !== "normal") {
      this.closeCommandDialog();
      return false;
    }
    this.coursePageSettingsCourseId = course.id;
    this.refreshCoursePageSettingsDialog();
    return true;
  },

  applyCoursePagePythonExample() {
    const courseId = Number(this.coursePageSettingsCourseId);
    if (!courseId) return false;
    this.updateSelectionField({
      target: {
        dataset: { field: "course.pageBreakFormula" },
        type: "textarea",
        value: this.coursePagePythonExample()
      }
    }, { courseId });
    return true;
  },

  updateSelectionField(event, options = {}) {
    const target = event.target;
    const state = this.store.snapshot();
    const selection = Number(options.courseId)
      ? { type: "course", id: Number(options.courseId) }
      : state.ui.selection;
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
    if (target.dataset.variationBranchLeg !== undefined) {
      this.updateVariationBranchLegRestriction(target);
      return;
    }
    if (target.dataset.relaySettingsField !== undefined || target.dataset.relayLegName !== undefined) {
      this.updateRelaySettingsFromVariationPanel(
        target.dataset.relaySettingsField !== undefined ? target : null,
        target.dataset.relayLegName !== undefined ? target : null
      );
      return;
    }
    if (!selection) return;

    if (target.dataset.descriptionTextBox && selection.type === "control") {
      const box = target.dataset.descriptionTextBox;
      const value = box === "F" ? normalizeColumnFText(target.value) : target.value;
      this.store.updateEvent(model => {
        const control = getControl(model, selection.id);
        const existing = control?.descriptions?.find(description => description.box === box);
        updateControlDescription(control, box, existing?.ref || "", value);
      }, "Change description text");
      return;
    }

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
        const branch = String(target.dataset.relayBranch || "").trim();
        if (!branch) return;
        const leg = Number(target.value) || 0;
        if (target.type === "checkbox") {
          const inputs = [...target.closest(".relay-branch-leg-row")?.querySelectorAll("[data-relay-branch]") || []]
            .filter(candidate => String(candidate.dataset.relayBranch || "").trim() === branch);
          const allowed = new Set(inputs
            .filter(candidate => candidate.checked)
            .map(candidate => Math.max(1, Math.round(Number(candidate.value) || 1))));
          course.relay.branches = (course.relay.branches || []).filter(item => String(item.branch || "").trim() !== branch);
          const legs = [...allowed].sort((a, b) => a - b);
          if (legs.length && legs.length < inputs.length) course.relay.branches.push({ branch, legs });
          course.relay.branches = normalizeRelayBranchSettings(
            relayAssignments(model, course.id).branchGroups || [],
            course.relay.branches,
            course.relay.legs || 1
          );
        }
        else {
          course.relay.branches = (course.relay.branches || []).filter(item => String(item.branch || "").trim() !== branch);
          if (leg > 0) {
            course.relay.branches.push({ branch, legs: [leg] });
          }
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

    if (target.dataset.coursePageMove !== undefined && selection.type === "course") {
      this.changeFixedCoursePageAction({
        sourceId: target.dataset.coursePageMove,
        targetId: target.value,
        kind: null
      });
      return;
    }

    if (target.dataset.coursePageBreak !== undefined && selection.type === "course") {
      this.changeFixedCoursePageAction({
        sourceId: target.dataset.coursePageBreak,
        targetId: target.dataset.coursePageBreak,
        kind: target.value
      });
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

    if (target.dataset.specialVisibilityAll !== undefined && selection?.type === "special") {
      this.updateSelectedSpecialVisibility({ allCourses: target.checked });
      return;
    }

    if (target.dataset.specialVisibilityCourse !== undefined && selection?.type === "special") {
      this.updateSelectedSpecialVisibility({ courseId: Number(target.value), visible: target.checked });
      return;
    }

    const field = target.dataset.field;
    if (!field) return;
    if (field === "special.kind") return;
    if (field === "control.code" && selection?.type === "control") {
      const current = getControl(state.eventModel, selection.id);
      const proposed = String(target.value ?? "").trim();
      const duplicate = (state.eventModel.controls || []).find(control =>
        Number(control.id) !== Number(selection.id)
        && ["normal", "start", "finish"].includes(control.kind)
        && String(control.code || "").trim().toLocaleLowerCase() === proposed.toLocaleLowerCase()
      );
      if (!proposed || duplicate) {
        const message = !proposed
          ? this.t("Control code cannot be empty.")
          : this.t("Control code {code} is already used by another control.", { code: proposed });
        target.value = String(current?.code || "");
        target.setCustomValidity?.(message);
        target.reportValidity?.();
        this.store.updateUi(ui => { ui.status = message; }, "Control code rejected");
        return;
      }
      target.setCustomValidity?.("");
      this.store.updateEvent(model => {
        updateControlCode(model, selection.id, proposed);
      }, "Change control code");
      return;
    }
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
      if (field === "control.orientation" && object.kind === "crossing-point") {
        const degrees = Number(target.value);
        object.orientation = Number.isFinite(degrees) ? ((degrees % 360) + 360) % 360 : 0;
        return;
      }
      if (field === "special.orientation" && object.kind === "optional-crossing-point") {
        const degrees = Number(target.value);
        object.orientation = Number.isFinite(degrees) ? ((degrees % 360) + 360) % 360 : 0;
        return;
      }
      if (field === "course.relay.legs") {
        object.relay ||= { firstTeam: 1, teams: 0, legs: 0, branches: [], teamPrefix: "", teamDigits: 0, legNames: [] };
        const legs = target.value === "" ? 0 : Math.max(1, Math.round(Number(target.value) || 1));
        object.relay.legs = legs;
        if (legs > 0) {
          const relay = normalizedRelaySettings(object.relay);
          object.relay.branches = relay.branches;
          object.relay.legNames = relay.legNames;
        }
        else {
          object.relay.branches = [];
          object.relay.legNames = [];
        }
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
      const previousControlKind = field === "control.kind" ? object.kind : null;
      setPath(object, field.split(".").slice(1), valueFromInput(target));
      if (field === "control.kind" && (previousControlKind === "map-exchange" || object.kind === "map-exchange")) {
        for (const courseControl of model.courseControls || []) {
          if (Number(courseControl.control) !== Number(object.id)) continue;
          const standaloneExchange = object.kind === "map-exchange";
          courseControl.mapExchange = standaloneExchange;
          courseControl.mapFlip = false;
        }
      }
      if (field === "course.pageBreakFormula"
        && object.kind === "normal"
        && !courseHasVariations(model, object.id)
        && String(object.pageBreakFormula || "").trim()) {
        // On a fixed course, advanced and point-by-point paging are two editing
        // modes for the same boundaries. A non-empty formula is authoritative.
        for (const row of courseView(model, object.id, { allBranches: true, page: "global" })) {
          if (row.control?.kind !== "normal" || !row.courseControl) continue;
          row.courseControl.mapExchange = false;
          row.courseControl.mapFlip = false;
        }
      }
      if (field === "course.kind") {
        applyCourseKindDefaults(object);
      }
    }, "Edit selection");
    if (field === "course.pageBreakFormula") {
      this.store.updateUi(ui => { ui.coursePage = "global"; }, "Show global course page");
    }
    // Re-render selection panel when kind or lineKind changes to show/hide relevant fields
    if (field === "special.lineKind" || field === "control.kind" || field === "course.kind" || field.startsWith("course.relay.") || field === "course.hideVariationsOnMap") {
      this.renderKeys = null;
      this.render(this.store.snapshot());
    }
  },

  updateSelectedSpecialVisibility(change) {
    const snapshot = this.store.snapshot();
    const selection = snapshot.ui.selection;
    const selectedCourseId = snapshot.ui.selectedCourseId;
    if (selection?.type !== "special") return;
    this.store.updateEvent(model => {
      const special = objectForSelection(model, selection);
      if (!special || special.kind === "descriptions") return;
      const courses = sortedCourses(model);
      if (change.allCourses !== undefined) {
        special.allCourses = !!change.allCourses;
        if (special.allCourses) {
          special.courses = [];
          return;
        }
        const fallbackCourse = courses.find(course => String(course.id) === String(selectedCourseId)) || courses[0];
        special.courses = fallbackCourse ? [{ course: Number(fallbackCourse.id), part: -1 }] : [];
        if (!special.courses.length) {
          special.allCourses = true;
        }
        return;
      }
      const courseId = Number(change.courseId);
      if (!Number.isFinite(courseId)) return;
      special.allCourses = false;
      const selected = new Set((special.courses || []).map(entry => Number(entry.course)).filter(Number.isFinite));
      if (change.visible) {
        selected.add(courseId);
      }
      else {
        selected.delete(courseId);
      }
      special.courses = courses
        .filter(course => selected.has(Number(course.id)))
        .map(course => ({ course: Number(course.id), part: -1 }));
      if (!special.courses.length) {
        special.allCourses = true;
      }
    }, "Change special visibility");
    this.renderKeys = null;
    this.render(this.store.snapshot());
  },

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
  },

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
        background.calibration ||= {};
        background.calibration.awaitingDistance = false;
        background.calibration.distanceMode = "ground";
        background.calibrationPrintedCm = background.calibrationDistanceMeters / (positiveScale(current.eventModel.event?.map?.scale) || 15000) * 100;
        resetBackgroundCalibrationBase(background);
        applyBackgroundCalibration(background, aspect);
      }
      else if (field === "calibrationPrintedCm") {
        const mapScale = positiveScale(this.store.snapshot().eventModel.event?.map?.scale) || 15000;
        background.calibrationPrintedCm = positiveNumber(value, 0);
        background.calibrationDistanceMeters = background.calibrationPrintedCm / 100 * mapScale;
        background.calibration ||= {};
        background.calibration.awaitingDistance = false;
        background.calibration.distanceMode = "map";
        resetBackgroundCalibrationBase(background);
        applyBackgroundCalibration(background, aspect);
      }
    }, "Edit map background");
  }

  };
}

function normalizeMeasurementState(value) {
  const color = /^#[0-9a-f]{6}$/i.test(String(value?.color || "")) ? String(value.color) : "#007f93";
  const lineStyle = normalizeMeasurementLineStyle(value?.lineStyle);
  const showGroundLabels = !!value?.showGroundLabels;
  if (Array.isArray(value?.items)) {
    return {
      items: value.items.map(item => ({ ...item, lineStyle: normalizeMeasurementLineStyle(item?.lineStyle) })),
      draft: {
        points: [...(value.draft?.points || [])],
        color: value.draft?.color || color,
        lineStyle: normalizeMeasurementLineStyle(value.draft?.lineStyle || lineStyle),
        showGroundLabels: value.draft?.showGroundLabels ?? showGroundLabels
      },
      color,
      lineStyle,
      showGroundLabels,
      adding: !!value.adding,
      selectedIndex: Number.isInteger(value.selectedIndex) ? value.selectedIndex : null
    };
  }
  const legacyPoints = [...(value?.points || [])];
  const legacyFinished = !!value?.finished;
  return {
    items: legacyFinished && legacyPoints.length >= 2
      ? [{ points: legacyPoints, closed: !!value.closed, color, lineStyle, showGroundLabels }]
      : [],
    draft: {
      points: legacyFinished ? [] : legacyPoints,
      color,
      lineStyle,
      showGroundLabels
    },
    color,
    lineStyle,
    showGroundLabels,
    adding: false,
    selectedIndex: null
  };
}

function measurementItem(measurement, points, closed) {
  return {
    points: points.map(point => ({ x: point.x, y: point.y })),
    closed,
    color: measurement.draft.color || measurement.color,
    lineStyle: normalizeMeasurementLineStyle(measurement.draft.lineStyle || measurement.lineStyle),
    showGroundLabels: measurement.draft.showGroundLabels ?? measurement.showGroundLabels
  };
}

function normalizeMeasurementLineStyle(value) {
  return ["solid", "dashed", "dotted"].includes(value) ? value : "solid";
}
