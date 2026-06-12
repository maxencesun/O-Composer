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
    }, "New event");
  },

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
  },

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
  },

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
  },

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
    this.store.updateUi(ui => { ui.selection = { type: "leg-gap", startControl: selection.startControl, endControl: selection.endControl, gapIndex: selection.gapIndex }; }, "Select cut");
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
      if (!options.transient) {
        resetBackgroundCalibrationBase(background);
        applyBackgroundCalibration(background, backgroundAspect(background));
      }
    }, "Move calibration point");
    this.syncBackgroundMeasurement();
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
        endControl: selection.endControl
      };
      ui.tool = "select";
    }, "Select leg");
  },

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

  };
}
