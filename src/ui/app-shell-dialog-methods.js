export function createAppShellDialogMethods(deps) {
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
  },

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
  },

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
  },

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
  },

  applyCommandDialog() {
    const config = this.activeCommandDialog;
    if (!config) return;
    const shouldClose = config.apply?.(this.querySelector("#commandDialog")) !== false;
    if (shouldClose) {
      this.closeCommandDialog();
    }
  },

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
  },

  handleCommandDialogChange(event) {
    this.activeCommandDialog?.onChange?.(event, this.querySelector("#commandDialog"));
  },

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
  },

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
  },

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
  },

  syncBackgroundMeasurement() {
    const output = this.querySelector("[data-background-measured]");
    const background = this.store.snapshot().ui.background;
    if (!output || !background) return;
    const measured = backgroundCalibrationDistance(background);
    output.textContent = measured
      ? `${this.t("Selected line")}: ${formatDecimal(measured)} m`
      : this.t("Click two points on the map, then enter their real distance.");
  },

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
  },

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
  },

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
  },

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
  },

  enablePanelDrag(dialog) {
    const header = dialog?.querySelector(".dialog-heading");
    if (!dialog || !header) return;
    header.addEventListener("pointerdown", event => {
      if (event.button !== 0 || event.target.closest("button,input,select,textarea")) {
        return;
      }
      this.startPanelDrag(event, dialog, header);
    });
  },

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
  },

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
  },

  previewMoveSelection(selection, point) {
    this.store.updateUi(ui => {
      ui.movePreview = selection && point
        ? { selection: { ...selection }, location: { x: point.x, y: point.y } }
        : null;
    }, "Move preview");
  },

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
  },

  previewResizeSelection(selection, anchor, point) {
    const state = this.store.snapshot();
    const special = selection?.type === "special" ? findById(state.eventModel.specials, selection.id) : null;
    const preview = special && anchor && point
      ? resizedSpecialObject(state.eventModel, special, anchor, point, state.ui.selectedCourseId, courseDisplayOptions(state.eventModel, state.ui))
      : null;
    this.store.updateUi(ui => {
      ui.resizePreview = preview ? { selection: { type: "special", id: special.id }, special: preview } : null;
    }, "Resize preview");
  },

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

  };
}
