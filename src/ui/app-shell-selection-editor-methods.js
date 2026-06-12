export function createAppShellSelectionEditorMethods(deps) {
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
  },

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
  },

  bindSelectionColorInputs(panel) {
    panel.querySelectorAll("[data-background-field]").forEach(input => {
      input.addEventListener("input", event => this.handleSelectionPanelInput(event));
    });
    panel.querySelector("[data-special-color-picker]")?.addEventListener("input", event => this.handleSelectionPanelInput(event));
    panel.querySelector("[data-special-color-hex]")?.addEventListener("input", event => this.handleSelectionPanelInput(event));
  },

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
  },

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
  },

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
,

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
  },

  courseEditor(course) {
    const finishRoute = finishRouteForCourse(this.store.snapshot().eventModel, course.id);
    const relay = course.relay || { firstTeam: 1, teams: 0, legs: 1, branches: [] };
    const assignments = relayAssignments(this.store.snapshot().eventModel, course.id);
    return `
      <div class="form-grid">
        <label>${escapeHtml(this.t("Name"))} <input data-field="course.name" value="${escapeAttr(course.name)}"></label>
        <label>${escapeHtml(this.t("Kind"))} <select data-field="course.kind"><option value="normal" ${course.kind === "normal" ? "selected" : ""}>${escapeHtml(this.t("normal"))}</option><option value="score" ${course.kind === "score" ? "selected" : ""}>${escapeHtml(this.t("score"))}</option><option value="team" ${course.kind === "team" ? "selected" : ""}>${escapeHtml(this.t("team"))}</option></select></label>
        <label>${escapeHtml(this.t("Labels"))} <select data-field="course.labelKind">${COURSE_LABEL_KINDS.map(kind => `<option value="${kind}" ${kind === course.labelKind ? "selected" : ""}>${escapeHtml(this.t(kind))}</option>`).join("")}</select></label>
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
  },

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
  },

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
  },

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
  },

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
  },

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
  },

  specialLineStyleSelect(special) {
    return `<label>${escapeHtml(this.t("Line style"))} <select data-field="special.lineKind">${["single", "double", "dashed"].map(kind => `<option value="${kind}" ${kind === special.lineKind ? "selected" : ""}>${escapeHtml(optionLabel(kind))}</option>`).join("")}</select></label>`;
  },

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
  },

  renderReport({ ui }) {
    const panel = this.querySelector("#reportPanel");
    panel.innerHTML = ui.report?.html || `<p class="muted">${escapeHtml(this.t("Choose a report from the Reports menu."))}</p>`;
  },

  renderStatus({ eventModel, ui }) {
    this.querySelector("#statusText").textContent = this.t(ui.status || "Ready");
    const mapName = ui.omap?.name ? ` | OMAP: ${ui.omap.name}` : "";
    this.querySelector("#dirtyText").textContent = `${eventModel.sourceName || this.t("Untitled.ppen")}${eventModel.dirty ? " *" : ""}${mapName}`;
  },

  updateMouseStatus(point) {
    const mouse = this.querySelector("#mouseText");
    if (mouse) {
      mouse.textContent = `X: ${point.x.toFixed(1)}  Y: ${point.y.toFixed(1)}`;
    }
  }

  };
}
