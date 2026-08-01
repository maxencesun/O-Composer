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
  switchPanel(panel) {
    const nextPanel = ["description", "variation", "report", "constants"].includes(panel) ? panel : "description";
    this.querySelector("#descriptionPanel").hidden = nextPanel !== "description";
    this.querySelector("#variationPanel").hidden = nextPanel !== "variation";
    this.querySelector("#reportPanel").hidden = nextPanel !== "report";
    this.querySelector("#constantsPanel").hidden = nextPanel !== "constants";
    const mobilePanelSelect = this.querySelector("#mobilePanelSelect");
    if (mobilePanelSelect) {
      mobilePanelSelect.value = nextPanel;
    }
    for (const button of this.querySelectorAll("[data-panel]")) {
      button.classList.toggle("active", button.dataset.panel === nextPanel);
    }
    this.querySelector(".left-panel")?.classList.toggle("has-active-variation-panel", nextPanel === "variation");
    this.syncVariationTopologyColumnVisibility?.();
  },

  handleKey(event) {
    const key = event.key.toLowerCase();
    const userGuideDialog = this.querySelector("#userGuideDialog");
    if (event.key === "Escape" && userGuideDialog?.open && !userGuideDialog.hasAttribute("hidden")) {
      event.preventDefault();
      this.closeUserGuide();
      return;
    }
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
      const active = document.activeElement;
      const textEntry = active?.isContentEditable
        || active?.tagName === "TEXTAREA"
        || (active?.tagName === "INPUT" && !["button", "checkbox", "color", "radio", "range"].includes(active.type));
      const measurementUi = this.store.snapshot().ui;
      if (measurementUi.tool === "measure" && !textEntry) {
        event.preventDefault();
        if (event.key === "Backspace" && measurementUi.measurement?.adding) {
          this.undoMeasurementPoint();
        }
        else {
          this.deleteSelectedMeasurement();
        }
      }
      else if (!["INPUT", "TEXTAREA", "SELECT"].includes(active?.tagName)) {
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
    if (!config.coursePageSettings) this.coursePageSettingsCourseId = null;
    this.activeCommandDialog = config;
    this.querySelector("#commandTitle").textContent = this.t(config.title || "");
    this.querySelector("#commandBody").innerHTML = config.body || "";
    const hasActions = config.showActions !== false && typeof config.apply === "function";
    const actions = this.querySelector("#commandActions");
    actions.style.display = hasActions ? "" : "none";
    if (hasActions) {
      this.querySelector("#commandApplyButton").textContent = this.t(config.applyLabel || "Apply");
    }
    const cancelButton = this.querySelector('#commandActions [data-command-cancel]');
    if (cancelButton) cancelButton.hidden = config.showCancel === false;
    this.querySelector("#commandCloseButton").hidden = config.showClose === false;
    const message = this.querySelector("#commandMessage");
    message.hidden = !config.message;
    message.textContent = this.t(config.message || "");
    config.onOpen?.(this.querySelector("#commandDialog"));
    const dialog = this.querySelector("#commandDialog");
    if (dialog && !this.commandDialogCancelGuardInstalled) {
      dialog.addEventListener("cancel", event => {
        if (this.activeCommandDialog?.required === true) {
          event.preventDefault();
          this.store.updateUi(ui => {
            ui.status = this.t("Complete the two-point map scale calibration before continuing.");
          }, "Map scale calibration required");
        }
      });
      this.commandDialogCancelGuardInstalled = true;
    }
    dialog?.removeAttribute("hidden");
    if (!dialog.open) {
      if (config.modal === true && dialog.showModal) {
        dialog.showModal();
      }
      else if (dialog.show) {
        dialog.show();
      }
      else {
        dialog.setAttribute("open", "");
      }
    }
  },

  closeCommandDialog(options = {}) {
    if (this.activeCommandDialog?.required === true && options.force !== true) {
      this.store.updateUi(ui => {
        ui.status = this.t("Complete the two-point map scale calibration before continuing.");
      }, "Map scale calibration required");
      return false;
    }
    const dialog = this.querySelector("#commandDialog");
    const closesCoursePageSettings = this.activeCommandDialog?.coursePageSettings === true;
    this.activeCommandDialog = null;
    if (closesCoursePageSettings) this.coursePageSettingsCourseId = null;
    this.courseOrderDraft = null;
    if (dialog.open && dialog.close) {
      dialog.close();
    }
    else {
      dialog?.removeAttribute("open");
    }
    dialog?.setAttribute("hidden", "");
    return true;
  },

  applyCommandDialog() {
    const config = this.activeCommandDialog;
    if (!config) return;
    const shouldClose = config.apply?.(this.querySelector("#commandDialog")) !== false;
    if (shouldClose) {
      this.closeCommandDialog({ force: config.required === true });
    }
  },

  handleCommandDialogClick(event) {
    const pythonExampleTarget = event.target.closest("[data-course-page-python-example]");
    const coursePageTarget = event.target.closest([
      "[data-course-page-add-toggle]",
      "[data-course-page-add-cancel]",
      "[data-course-page-add]",
      "[data-course-page-python-example]",
      "[data-course-page-copy-ai-prompt]",
      "[data-course-page-remove-standalone]",
      "[data-course-page-remove]"
    ].join(","));
    if (this.activeCommandDialog?.coursePageSettings && coursePageTarget) {
      const changesModel = !!event.target.closest([
        "[data-course-page-add]",
        "[data-course-page-python-example]",
        "[data-course-page-remove-standalone]",
        "[data-course-page-remove]"
      ].join(","));
      if (pythonExampleTarget) {
        event.preventDefault();
        this.applyCoursePagePythonExample();
      }
      else {
        this.handleSelectionPanelClick(event);
      }
      if (changesModel) this.refreshCoursePageSettingsDialog();
      return;
    }
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
    const copyAIPrompt = event.target.closest("[data-course-page-copy-ai-prompt]");
    if (copyAIPrompt) {
      event.preventDefault();
      void this.copyCoursePageAIPrompt(copyAIPrompt);
      return;
    }
    const eventAction = event.target.closest("[data-event-action]")?.dataset.eventAction;
    if (eventAction) {
      event.preventDefault();
      this.handleEventAdjustmentAction(eventAction);
      return;
    }
    const pageActionToggle = event.target.closest("[data-course-page-add-toggle]");
    if (pageActionToggle) {
      event.preventDefault();
      if (pageActionToggle.disabled) return;
      const manager = pageActionToggle.closest(".course-page-action-manager");
      const form = manager?.querySelector("[data-course-page-add-form]");
      if (!form) return;
      const expanded = form.hidden;
      form.hidden = !expanded;
      pageActionToggle.setAttribute("aria-expanded", expanded ? "true" : "false");
      if (expanded) form.querySelector("[data-course-page-add-point]")?.focus();
      return;
    }
    const pageActionCancel = event.target.closest("[data-course-page-add-cancel]");
    if (pageActionCancel) {
      event.preventDefault();
      const manager = pageActionCancel.closest(".course-page-action-manager");
      const form = manager?.querySelector("[data-course-page-add-form]");
      const toggle = manager?.querySelector("[data-course-page-add-toggle]");
      if (form) form.hidden = true;
      toggle?.setAttribute("aria-expanded", "false");
      toggle?.focus();
      return;
    }
    const pageActionAdd = event.target.closest("[data-course-page-add]");
    if (pageActionAdd) {
      event.preventDefault();
      this.addCoursePageAction(pageActionAdd);
      return;
    }
    const standalonePageActionRemove = event.target.closest("[data-course-page-remove-standalone]");
    if (standalonePageActionRemove) {
      event.preventDefault();
      this.removeStandaloneCoursePageAction(standalonePageActionRemove.dataset.coursePageRemoveStandalone);
      return;
    }
    const pageActionRemove = event.target.closest("[data-course-page-remove]");
    if (pageActionRemove) {
      event.preventDefault();
      this.changeFixedCoursePageAction({
        sourceId: pageActionRemove.dataset.coursePageRemove,
        targetId: 0,
        kind: ""
      });
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
          const required = backgroundCalibrationRequired?.(ui.background) === true;
          const distanceMode = ui.background.calibration?.distanceMode === "map" ? "map" : "ground";
          ui.background.calibration = { imagePoints: [], awaitingDistance: true, distanceMode, required, completed: false };
          ui.tool = "background-calibration";
          ui.selection = { type: "background" };
          ui.status = this.t("Click the first calibration point on the map.");
        }
      }, "Calibrate map background");
      return;
    }
    if (event.target.closest("[data-background-move]")) {
      this.store.updateUi(ui => {
        if (!ui.background && !ui.omap) return;
        const wasMoving = ui.tool === "background-move";
        ui.tool = wasMoving ? "select" : "background-move";
        ui.selection = { type: "background" };
        ui.status = wasMoving ? this.t("Ready") : this.t("Drag the background on the canvas.");
      }, "Move map background");
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
          endControl: selection.endControl,
          startCourseControl: selection.startCourseControl || null,
          endCourseControl: selection.endCourseControl || null
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

  async copyCoursePageAIPrompt(button) {
    const container = button?.closest?.(".page-ai-prompt");
    const promptField = container?.querySelector?.("[data-course-page-ai-prompt]");
    const status = container?.querySelector?.("[data-course-page-copy-status]");
    const prompt = String(promptField?.value || promptField?.textContent || "");
    if (!prompt) return false;
    let copied = false;
    try {
      if (globalThis.navigator?.clipboard?.writeText) {
        await globalThis.navigator.clipboard.writeText(prompt);
        copied = true;
      }
    }
    catch (_) {}
    if (!copied) {
      promptField?.focus?.();
      promptField?.select?.();
      try {
        copied = globalThis.document?.execCommand?.("copy") === true;
      }
      catch (_) {}
    }
    if (copied) {
      if (status) status.textContent = this.t("Prompt copied.");
      const original = button.textContent;
      button.textContent = this.t("Copied");
      globalThis.setTimeout?.(() => {
        if (button.isConnected !== false) button.textContent = original;
        if (status?.isConnected !== false && status) status.textContent = "";
      }, 1600);
      return true;
    }
    promptField?.focus?.();
    promptField?.select?.();
    if (status) status.textContent = this.t("Could not copy automatically. Select and copy the prompt manually.");
    return false;
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
    const relayField = target.closest("[data-relay-settings-field]");
    const relayLegName = target.closest("[data-relay-leg-name]");
    if (relayField || relayLegName) {
      this.previewRelaySettingsFromVariationPanel(relayField, relayLegName);
      return;
    }
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
    if (!background) return;
    const measured = backgroundCalibrationDistance(background);
    if (output) {
      const pointCount = background.calibration?.imagePoints?.length || background.calibration?.points?.length || 0;
      output.textContent = pointCount === 1
        ? this.t("Point 1 selected. Click point 2.")
        : measured
          ? `${this.t("Selected line")}: ${formatDecimal(measured)} m · ${this.t("Drag point 1 or 2 to refine the reference line.")}`
          : this.t("Click two points on the map, then enter their real distance.");
    }
    const dialogOutput = this.querySelector("[data-background-calibration-current]");
    if (dialogOutput) {
      const paletteScale = Number(this.querySelector("#backgroundCalibrationMapScale")?.value);
      dialogOutput.textContent = this.backgroundCalibrationLineSummary(background, paletteScale);
    }
  },

  backgroundCalibrationLineSummary(background = this.store.snapshot().ui.background, mapScaleOverride = null) {
    const measured = backgroundCalibrationDistance(background);
    const mapScale = positiveScale(mapScaleOverride) || positiveScale(this.store.snapshot().eventModel.event?.map?.scale) || 15000;
    const printedCm = measured > 0 ? measured / mapScale * 100 : 0;
    return measured > 0
      ? this.t("The selected line currently represents {ground} m ({map} cm on a 1:{scale} map).", {
        ground: formatDecimal(measured),
        map: formatDecimal(printedCm),
        scale: Math.round(mapScale).toLocaleString()
      })
      : this.t("Select two different points before entering a distance.");
  },

  promptBackgroundCalibrationDistance() {
    const state = this.store.snapshot();
    const background = state.ui.background;
    if (!background || backgroundCalibrationDistance(background) <= 0) return;
    const mapScale = positiveScale(state.eventModel.event?.map?.scale) || 15000;
    const defaultMode = background.calibration?.distanceMode === "map" ? "map" : "ground";
    const required = backgroundCalibrationRequired?.(background) === true;
    const groundValue = positiveNumber(background.calibrationDistanceMeters, 0);
    const mapValue = positiveNumber(background.calibrationPrintedCm, groundValue > 0 ? groundValue / mapScale * 100 : 0);
    this.openCommandDialog({
      title: "Set two-point calibration distance",
      applyLabel: "Scale background",
      required,
      showClose: !required,
      showCancel: !required,
      body: `
        <div class="calibration-distance-dialog">
          <p class="muted" data-background-calibration-current>${escapeHtml(this.backgroundCalibrationLineSummary(background))}</p>
          <label class="calibration-map-scale">
            <span>${escapeHtml(this.t("Map scale"))}</span>
            <span class="calibration-map-scale-input">1:<input id="backgroundCalibrationMapScale" type="number" min="1" step="1" inputmode="numeric" value="${escapeAttr(Math.round(mapScale))}"></span>
          </label>
          <fieldset class="choice-group calibration-distance-options">
            <legend>${escapeHtml(this.t("Known distance type"))}</legend>
            <div class="calibration-distance-option">
              <label class="calibration-distance-option-title"><input type="radio" name="backgroundCalibrationDistanceMode" value="map" ${defaultMode === "map" ? "checked" : ""}> ${escapeHtml(this.t("Distance on map (cm)"))}</label>
              <input id="backgroundCalibrationMapDistance" type="number" min="0.001" step="any" inputmode="decimal" value="${escapeAttr(mapValue > 0 ? formatInputNumber(mapValue) : "")}">
              <small>${escapeHtml(this.t("Enter the length measured on the printed map."))}</small>
            </div>
            <div class="calibration-distance-option">
              <label class="calibration-distance-option-title"><input type="radio" name="backgroundCalibrationDistanceMode" value="ground" ${defaultMode === "ground" ? "checked" : ""}> ${escapeHtml(this.t("Ground distance (m)"))}</label>
              <input id="backgroundCalibrationGroundDistance" type="number" min="0.001" step="any" inputmode="decimal" value="${escapeAttr(groundValue > 0 ? formatInputNumber(groundValue) : "")}">
              <small>${escapeHtml(this.t("Enter the corresponding real-world distance."))}</small>
            </div>
          </fieldset>
        </div>
      `,
      onOpen: dialog => {
        const syncMode = () => {
          const mode = dialog.querySelector('input[name="backgroundCalibrationDistanceMode"]:checked')?.value || "ground";
          dialog.querySelectorAll(".calibration-distance-option").forEach(option => {
            const active = option.querySelector('input[type="radio"]')?.value === mode;
            option.classList.toggle("active", active);
            const input = option.querySelector('input[type="number"]');
            if (input) input.readOnly = !active;
          });
        };
        dialog.querySelectorAll('input[name="backgroundCalibrationDistanceMode"]').forEach(radio => {
          radio.addEventListener("change", () => {
            syncMode();
            radio.closest(".calibration-distance-option")?.querySelector('input[type="number"]')?.focus();
          });
        });
        dialog.querySelectorAll(".calibration-distance-option input[type=number]").forEach(input => {
          input.addEventListener("pointerdown", () => {
            const radio = input.closest(".calibration-distance-option")?.querySelector('input[type="radio"]');
            if (radio && !radio.checked) {
              radio.checked = true;
              syncMode();
            }
          });
          input.addEventListener("input", () => {
            const message = dialog.querySelector("#commandMessage");
            if (message) message.hidden = true;
          });
        });
        dialog.querySelector("#backgroundCalibrationMapScale")?.addEventListener("input", () => {
          const message = dialog.querySelector("#commandMessage");
          if (message) message.hidden = true;
          this.syncBackgroundMeasurement();
        });
        syncMode();
        setTimeout(() => {
          const activeInput = required
            ? dialog.querySelector("#backgroundCalibrationMapScale")
            : dialog.querySelector(".calibration-distance-option.active input[type=number]");
          activeInput?.focus();
          activeInput?.select();
        }, 0);
      },
      apply: dialog => {
        const mode = dialog.querySelector('input[name="backgroundCalibrationDistanceMode"]:checked')?.value === "map" ? "map" : "ground";
        const input = dialog.querySelector(mode === "map" ? "#backgroundCalibrationMapDistance" : "#backgroundCalibrationGroundDistance");
        const scaleInput = dialog.querySelector("#backgroundCalibrationMapScale");
        const targetMapScale = positiveScale(scaleInput?.value);
        if (!targetMapScale) {
          const message = dialog.querySelector("#commandMessage");
          if (message) {
            message.textContent = this.t("Enter a valid map scale.");
            message.hidden = false;
          }
          scaleInput?.focus();
          return false;
        }
        const value = Number(input?.value);
        const targetGroundDistance = calibrationGroundDistance(value, mode, targetMapScale);
        if (!(targetGroundDistance > 0)) {
          const message = dialog.querySelector("#commandMessage");
          if (message) {
            message.textContent = this.t("Enter a distance greater than zero.");
            message.hidden = false;
          }
          input?.focus();
          return false;
        }
        this.store.updateEvent(model => {
          applyMapScale(model, targetMapScale);
        }, "Set map scale");
        this.store.updateUi(ui => {
          const currentBackground = ui.background;
          if (!currentBackground || backgroundCalibrationDistance(currentBackground) <= 0) return;
          currentBackground.calibration ||= {};
          currentBackground.calibration.awaitingDistance = false;
          currentBackground.calibration.distanceMode = mode;
          currentBackground.calibration.required = false;
          currentBackground.calibration.completed = true;
          currentBackground.calibrationDistanceMeters = targetGroundDistance;
          currentBackground.calibrationPrintedCm = targetGroundDistance / targetMapScale * 100;
          resetBackgroundCalibrationBase(currentBackground);
          applyBackgroundCalibration(currentBackground, backgroundAspect(currentBackground));
          ui.tool = "select";
          ui.selection = { type: "background" };
          ui.status = this.t("Background scale calibrated.");
        }, "Calibrate map background");
        this.syncBackgroundFields();
        this.syncBackgroundMeasurement();
        return true;
      }
    });
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
    const topologyLeftDivider = this.querySelector("#topologyLeftDivider");
    const leftPanel = this.querySelector(".left-panel");
    const topologyColumn = this.querySelector("#variationTopologyColumn");
    if (!workspace || !divider) return;
    const leftWidthKey = "oComposerLeftPanelWidth";
    const topologyWidthKey = "oComposerVariationTopologyColumnWidth";
    const dividerWidth = 6;
    const setLeftWidth = width => {
      workspace.style.setProperty("--left-panel-width", `${width}px`);
      if (leftPanel && this.resolvedUiMode() === UI_MODES.DESKTOP) {
        leftPanel.style.width = `${width}px`;
        leftPanel.style.maxWidth = `${width}px`;
      }
      localStorage.setItem(leftWidthKey, String(Math.round(width)));
    };
    const setTopologyWidth = width => {
      workspace.style.setProperty("--variation-topology-column-width", `${width}px`);
      localStorage.setItem(topologyWidthKey, String(Math.round(width)));
    };
    const topologyColumnVisible = () => !!topologyColumn && !topologyColumn.hidden && workspace.classList.contains("show-variation-topology-column");
    const currentLeftWidth = () => {
      const rectWidth = leftPanel?.getBoundingClientRect().width || 0;
      const savedWidth = Number(localStorage.getItem(leftWidthKey) || 0);
      return rectWidth || savedWidth || 300;
    };
    const currentTopologyWidth = () => {
      const rectWidth = topologyColumn?.getBoundingClientRect().width || 0;
      const savedWidth = Number(localStorage.getItem(topologyWidthKey) || 0);
      return rectWidth || savedWidth || Math.min(430, Math.max(300, Math.floor(window.innerWidth * 0.32)));
    };
    const saved = Number(localStorage.getItem("oComposerLeftPanelWidth") || 0);
    if (saved > 0) {
      const width = clamp(saved, 260, Math.max(320, window.innerWidth - 360));
      setLeftWidth(width);
    }
    const savedTopologyWidth = Number(localStorage.getItem(topologyWidthKey) || 0);
    if (savedTopologyWidth > 0) {
      setTopologyWidth(clamp(savedTopologyWidth, 260, Math.max(260, window.innerWidth - 620)));
    }
    const bindDividerDrag = (handle, kind) => {
      if (!handle) return;
      handle.addEventListener("pointerdown", event => {
      if (event.button !== 0) return;
      event.preventDefault();
      handle.setPointerCapture(event.pointerId);
      handle.classList.add("dragging");
      const rect = workspace.getBoundingClientRect();
      const startTopologyWidth = currentTopologyWidth();
      const move = moveEvent => {
        if (kind === "left" && topologyColumnVisible()) {
          const maxLeftWidth = Math.max(260, rect.width - startTopologyWidth - dividerWidth * 2 - 360);
          setLeftWidth(clamp(moveEvent.clientX - rect.left, 260, maxLeftWidth));
        }
        else if (kind === "map" && topologyColumnVisible()) {
          const leftWidth = currentLeftWidth();
          const maxTopologyWidth = Math.max(260, rect.width - leftWidth - dividerWidth * 2 - 360);
          const width = moveEvent.clientX - rect.left - leftWidth - dividerWidth;
          setTopologyWidth(clamp(width, 260, maxTopologyWidth));
        }
        else {
          const width = clamp(moveEvent.clientX - rect.left, 260, Math.max(260, rect.width - 360));
          setLeftWidth(width);
        }
        this.mapView.requestDraw(this.store.snapshot());
      };
      const stop = stopEvent => {
        handle.classList.remove("dragging");
        handle.releasePointerCapture?.(stopEvent.pointerId);
        handle.removeEventListener("pointermove", move);
        handle.removeEventListener("pointerup", stop);
        handle.removeEventListener("pointercancel", stop);
        this.mapView.requestDraw(this.store.snapshot());
      };
      handle.addEventListener("pointermove", move);
      handle.addEventListener("pointerup", stop);
      handle.addEventListener("pointercancel", stop);
      });
    };
    bindDividerDrag(topologyLeftDivider, "left");
    bindDividerDrag(divider, "map");
  },

  enablePanelDrag(dialog) {
    const header = dialog?.querySelector(".dialog-heading, .user-guide-heading");
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
      offsetY: event.clientY - rect.top,
      startX: event.clientX,
      startY: event.clientY,
      moved: false
    };
    const move = moveEvent => {
      if (!drag.moved && Math.hypot(moveEvent.clientX - drag.startX, moveEvent.clientY - drag.startY) < 4) return;
      drag.moved = true;
      drag.dialog.dataset.userPositioned = "true";
      this.movePanelDrag(moveEvent, drag);
    };
    const stop = stopEvent => {
      stopEvent?.preventDefault?.();
      dialog.classList.remove("dragging");
      if (drag.moved && dialog.id === "userGuideDialog") {
        this.userGuideSuppressTitleRestoreUntil = Date.now() + 350;
      }
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
  },

  movePanelDrag(event, drag) {
    event.preventDefault();
    const margin = 8;
    const rect = drag.dialog.getBoundingClientRect();
    const maxLeft = Math.max(margin, window.innerWidth - rect.width - margin);
    const maxTop = Math.max(margin, window.innerHeight - rect.height - margin);
    const left = clamp(event.clientX - drag.offsetX, margin, maxLeft);
    const top = clamp(event.clientY - drag.offsetY, margin, maxTop);
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

  previewCrossingRotation(selection, orientation) {
    this.store.updateUi(ui => {
      ui.crossingRotationPreview = ["control", "special"].includes(selection?.type) && Number.isFinite(Number(orientation))
        ? { selection: { type: selection.type, id: selection.id }, orientation: Number(orientation) }
        : null;
    }, "Rotate preview");
  },

  commitCrossingRotation(selection, orientation) {
    const degrees = Number(orientation);
    if (!["control", "special"].includes(selection?.type) || !Number.isFinite(degrees)) {
      this.store.updateUi(ui => { ui.crossingRotationPreview = null; }, "Rotate crossing point");
      return;
    }
    this.store.updateEvent(model => {
      const crossing = findById(selection.type === "control" ? model.controls : model.specials, selection.id);
      const expectedKind = selection.type === "control" ? "crossing-point" : "optional-crossing-point";
      if (crossing?.kind === expectedKind) {
        crossing.orientation = ((degrees % 360) + 360) % 360;
      }
    }, "Rotate crossing point");
    this.store.updateUi(ui => { ui.crossingRotationPreview = null; }, "Rotate crossing point");
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

export function calibrationGroundDistance(value, mode, mapScale) {
  const distanceValue = Number(value);
  if (!Number.isFinite(distanceValue) || !(distanceValue > 0)) return 0;
  if (mode === "map") {
    const scale = Number(mapScale);
    return Number.isFinite(scale) && scale > 0 ? distanceValue / 100 * scale : 0;
  }
  return distanceValue;
}
