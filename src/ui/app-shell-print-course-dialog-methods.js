export function createAppShellPrintCourseDialogMethods(deps) {
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
  },

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
  },

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
  },

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
  },

  promptPrintArea() {
    this.openPrintAreaDialog();
  },

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
  },

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
  },

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
  },

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
  },

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
  },

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
  },

  renderPrintAreaDialogSummary() {
    const state = this.store.snapshot();
    const target = this.printAreaTargetFromDialog();
    const summary = this.querySelector("#printAreaSummary");
    if (!target || !summary) return;
    const mode = selectedRadioValue(this, "printAreaMode");
    const paper = this.querySelector("#printAreaPaper").selectedOptions[0]?.textContent || "";
    const orientation = this.querySelector("#printAreaOrientation").value;
    summary.textContent = `${this.t(printAreaTargetLabel(state.eventModel, target))} | ${modeLabel(mode)} | ${paper} | ${this.t(orientation)}`;
  },

  syncPrintAreaModeForPaper() {
    const custom = this.printAreaPaperIsCustom();
    this.querySelector(`input[name="printAreaMode"][value="${custom ? "draw" : "frame"}"]`).checked = true;
    this.querySelector("#printAreaRestrict").checked = !custom;
  },

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
  },

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
  },

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
  },

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
  },

  printAreaTargetFromDialog() {
    const value = this.querySelector("#printAreaScope")?.value || PRINT_AREA_SCOPES.ALL;
    if (value.startsWith("course:")) {
      return { scope: PRINT_AREA_SCOPES.COURSE, courseId: Number(value.split(":")[1]) };
    }
    if (value === PRINT_AREA_SCOPES.ALL_CONTROLS) {
      return { scope: PRINT_AREA_SCOPES.ALL_CONTROLS };
    }
    return { scope: PRINT_AREA_SCOPES.ALL };
  },

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
  },

  printAreaPaperIsCustom() {
    return this.querySelector("#printAreaPaper").selectedOptions[0]?.dataset.custom === "true";
  },

  previewPrintArea(start, end) {
    const edit = this.store.snapshot().ui.printAreaEdit;
    if (!edit) return;
    const preview = printAreaFromPoints(start, end, edit.dialogPreview ? { ...edit.area, restrictToPageSize: false } : edit.area);
    this.store.updateUi(ui => {
      if (ui.printAreaEdit) {
        ui.printAreaEdit.preview = preview;
      }
    }, "Drag print area");
  },

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
  },

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
  },

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
  },

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
  },

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
  },

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
  },

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
  },

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
  },

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
  },

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
  },

  moveCourseOrderDraft(direction) {
    const list = this.querySelector("#courseOrderList");
    const index = list?.selectedIndex ?? -1;
    if (!list || index < 0) return;
    const offset = direction === "up" ? -1 : 1;
    const nextIndex = index + offset;
    if (nextIndex < 0 || nextIndex >= this.courseOrderDraft.length) return;
    [this.courseOrderDraft[index], this.courseOrderDraft[nextIndex]] = [this.courseOrderDraft[nextIndex], this.courseOrderDraft[index]];
    this.renderCourseOrderDraft(nextIndex);
  },

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
  },

  confirmDirty() {
    return !this.store.snapshot().eventModel.dirty || confirm(this.t("Discard unsaved changes?"));
  }
  };
}
