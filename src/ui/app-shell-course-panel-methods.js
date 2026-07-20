import { addCustomConstant, constantRowsForView, removeCustomConstant, updateCustomConstant } from "../domain/constants.js?v=20260721-79";
import { coursePageCount } from "../domain/course-service.js?v=20260721-79";
import { militaryWindowDescriptionRows } from "../domain/military-orienteering.js?v=20260721-79";

export function createAppShellCoursePanelMethods(deps) {
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
    columnFDescriptionDisplayValue,
    columnFDescriptionPickerValue,
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
    courseLengthRange,
    courseTopology,
    courseView,
    createControlCrossref,
    createCourseSummary,
    createEventAudit,
    createLegLengthRows,
    createLoadReport,
    coursesUsingControl,
    formatLength,
    formatLengthRange,
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
  setSelection(selection) {
    const state = this.store.snapshot();
    const courseId = state.ui.selectedCourseId;
    let synchronizedSelection = selection;
    let topologyCourseControlId = null;
    if (selection?.type === "control" && courseId && courseId !== "all") {
      const matchingNodes = courseTopology(state.eventModel, courseId)
        .filter(view => Number(view.control?.id) === Number(selection.id))
        .map(view => Number(topologyNodeCourseControlId(view)) || null)
        .filter(Boolean);
      const requestedCourseControl = Number(selection.courseControl) || null;
      const previousAnchor = Number(state.ui.variationAnchorCourseControl) || null;
      topologyCourseControlId = matchingNodes.includes(requestedCourseControl)
        ? requestedCourseControl
        : matchingNodes.includes(previousAnchor)
          ? previousAnchor
          : matchingNodes[0] || null;
      if (topologyCourseControlId) {
        synchronizedSelection = { ...selection, courseControl: topologyCourseControlId };
      }
    }
    this.store.updateUi(ui => {
      ui.selection = synchronizedSelection;
      if (synchronizedSelection) {
        ui.variationBranch = null;
        ui.variationAdjustmentMode = "";
      }
      ui.variationAnchorCourseControl = topologyCourseControlId;
      ui.variationInsertAfterCourseControl = topologyCourseControlId;
      ui.variationInsertBeforeCourseControl = null;
      ui.variationSelectedSegment = topologyCourseControlId ? `node:${topologyCourseControlId}` : "";
      const role = teamAddControlRoleFromSelection(state.eventModel, ui, synchronizedSelection);
      if (role) {
        ui.teamAddControlRole = role;
      }
    }, "Selection");
  },

  render(state) {
    const calibrationRequired = backgroundCalibrationRequired?.(state.ui.background) === true;
    this.classList.toggle("background-calibration-required", calibrationRequired);
    for (const selector of [".menubar", ".toolbar", ".course-tabs", ".left-panel", "#topologyLeftDivider", "#variationTopologyColumn", "#workspaceDivider", "#courseBanner", "#measurementPanel", ".statusbar"]) {
      this.querySelector(selector)?.toggleAttribute("inert", calibrationRequired);
    }
    const calibrationGate = this.querySelector("#backgroundCalibrationGate");
    if (calibrationGate) calibrationGate.hidden = !calibrationRequired;
    const keys = renderKeysFor(state);
    const selectionContextChanged = !this.renderKeys
      || this.renderKeys.selection !== keys.selection
      || this.renderKeys.variationBranch !== keys.variationBranch
      || this.renderKeys.variationAdjustmentMode !== keys.variationAdjustmentMode;
    const preserveSelectionPanelInput = this.shouldPreserveSelectionPanelInput() && !selectionContextChanged;
    const shouldRenderCourse = !this.renderKeys
      || this.renderKeys.eventModel !== keys.eventModel
      || this.renderKeys.selectedCourseId !== keys.selectedCourseId
      || this.renderKeys.showAllControls !== keys.showAllControls
      || this.renderKeys.coursePage !== keys.coursePage
      || this.renderKeys.variationMode !== keys.variationMode
      || this.renderKeys.variationCode !== keys.variationCode
      || this.renderKeys.relayTeam !== keys.relayTeam
      || this.renderKeys.relayLeg !== keys.relayLeg;
    const shouldRenderSelection = !preserveSelectionPanelInput && (shouldRenderCourse
      || selectionContextChanged);
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
      || this.renderKeys.eventModel !== keys.eventModel
      || this.renderKeys.selection !== keys.selection
      || this.renderKeys.variationBranch !== keys.variationBranch
      || this.renderKeys.variationAnchorCourseControl !== keys.variationAnchorCourseControl
      || this.renderKeys.variationInsertAfterCourseControl !== keys.variationInsertAfterCourseControl
      || this.renderKeys.variationInsertBeforeCourseControl !== keys.variationInsertBeforeCourseControl
      || this.renderKeys.variationSelectedSegment !== keys.variationSelectedSegment
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
    if (shouldRenderCourse || shouldRenderReport || !this.renderKeys || this.renderKeys.eventModel !== keys.eventModel) {
      this.renderConstants(state);
    }
    if (shouldRenderCourse) {
      this.syncCoursePageSettingsDialogToSelectedCourse(state);
    }
    this.renderStatus(state);
    this.syncUiModeToggle();
    const hasVariationAdjustment = !!state.ui.variationBranch || state.ui.variationAdjustmentMode === "relay-auto";
    this.querySelector(".workspace")?.classList.toggle("has-variation-branch-adjustment", hasVariationAdjustment);
    this.querySelector(".left-panel")?.classList.toggle("has-variation-branch-adjustment", hasVariationAdjustment);
    this.querySelector("#zoomSlider").value = Math.round(state.ui.zoom * 100);
    this.querySelector("#intensitySlider").value = Math.round(state.ui.mapIntensity * 100);
    this.mapView.requestDraw(state);
    this.renderKeys = keys;
  },

  shouldPreserveSelectionPanelInput() {
    const active = document.activeElement;
    return !!active
      && active.closest?.("#selectionPanel")
      && active.dataset?.backgroundField !== undefined;
  },

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
  },

  selectCourse(courseId) {
    const eventModel = this.store.snapshot().eventModel;
    this.store.updateUi(ui => {
      applyCourseSelectionUi(eventModel, ui, courseId);
      if (ui.tool === "print-area" || ui.tool === "print-area-frame") {
        ui.tool = "select";
      }
    }, "Select course");
  },

  renderBanner({ eventModel, ui }) {
    const course = ui.selectedCourseId === "all" ? null : getCourse(eventModel, ui.selectedCourseId);
    const displayOptions = courseDisplayOptions(eventModel, ui);
    // The banner describes the whole concrete route; changing the visible map
    // page must not change the official course length or control count.
    const routeOptions = { ...displayOptions, page: "global" };
    const title = course ? course.name : this.t("All Controls");
    const view = course ? courseView(eventModel, course.id, routeOptions) : [];
    const displayLabel = course ? variationDisplayLabel(eventModel, course.id, ui) : "";
    const lengthText = course
      ? (routeOptions.allBranches
        ? formatLengthRange(courseLengthRange(eventModel, course.id, routeOptions))
        : formatLength(courseLength(eventModel, course.id, routeOptions)))
      : "";
    const details = course
      ? `${optionLabel(course.kind)}${displayLabel ? ` | ${this.t(displayLabel)}` : ""} | ${lengthText} | ${view.length} ${this.t("controls")}`
      : `${eventModel.controls.length} ${this.t("controls")} | ${eventModel.specials.length} ${this.t("special objects")}`;
    this.querySelector("#courseBannerText").innerHTML = `<strong>${escapeHtml(eventModel.event.title || this.t("Untitled Event"))}</strong><span>${escapeHtml(title)}</span><span>${escapeHtml(details)}</span>`;
    this.querySelector("#courseVariationControls").innerHTML = course ? this.courseVariationControls(eventModel, course, ui) : "";
  },

  courseVariationControls(eventModel, course, ui) {
    const hasVariations = courseHasVariations(eventModel, course.id);
    const variations = allCourseVariations(eventModel, course.id);
    const relay = relayAssignments(eventModel, course.id);
    const mode = ui.variationMode || "default";
    const variationCode = ui.variationCode || variations[0]?.code || "";
    const team = Number(ui.relayTeam) || course.relay?.firstTeam || 1;
    const leg = Number(ui.relayLeg) || 1;
    const variationControls = hasVariations ? `
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
    ` : "";
    return `${variationControls}${this.coursePageControls(eventModel, course, ui, hasVariations)}`;
  },

  coursePageControls(eventModel, course, ui, hasVariations = courseHasVariations(eventModel, course.id)) {
    if (course.kind !== "normal") return "";
    const concretePath = !hasVariations || ui.variationMode !== "all";
    const routeOptions = { ...courseDisplayOptions(eventModel, ui), page: "global" };
    const pageCount = concretePath ? coursePageCount(eventModel, course.id, routeOptions) : 1;
    const requestedPage = ui.coursePage === "global" ? "global" : String(Math.min(pageCount, Math.max(1, Number(ui.coursePage) || 1)));
    return `
      <label>${escapeHtml(this.t("Map page"))}
        <select data-course-page ${concretePath ? "" : "disabled"} title="${escapeAttr(concretePath ? this.t("Show the whole course or one map page") : this.t("Select one variation or relay leg to view its pages."))}">
          <option value="global" ${requestedPage === "global" ? "selected" : ""}>${escapeHtml(this.t("Global"))}</option>
          ${concretePath ? Array.from({ length: pageCount }, (_, index) => {
            const page = index + 1;
            return `<option value="${page}" ${requestedPage === String(page) ? "selected" : ""}>${escapeHtml(this.t("Page {page} of {count}", { page, count: pageCount }))}</option>`;
          }).join("") : ""}
        </select>
      </label>
    `;
  },

  handleCourseBannerChange(event) {
    const target = event.target;
    if (target.dataset.courseVariationMode === undefined
      && target.dataset.courseVariationCode === undefined
      && target.dataset.relayTeam === undefined
      && target.dataset.relayLeg === undefined
      && target.dataset.coursePage === undefined) {
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
        ui.coursePage = "global";
      }
      if (target.dataset.courseVariationCode !== undefined) {
        ui.variationCode = target.value || "";
        ui.coursePage = "global";
      }
      if (target.dataset.relayTeam !== undefined) {
        ui.relayTeam = clamp(Number(target.value) || course?.relay?.firstTeam || 1, course?.relay?.firstTeam || 1, (course?.relay?.firstTeam || 1) + Math.max(0, (course?.relay?.teams || 1) - 1));
        ui.coursePage = "global";
      }
      if (target.dataset.relayLeg !== undefined) {
        ui.relayLeg = clamp(Number(target.value) || 1, 1, Math.max(1, course?.relay?.legs || 1));
        ui.coursePage = "global";
      }
      if (target.dataset.coursePage !== undefined) {
        ui.coursePage = target.value === "global" ? "global" : Math.max(1, Number(target.value) || 1);
      }
      if (!ui.variationCode && variations.length) {
        ui.variationCode = variations[0].code;
      }
    }, "Select variation");
  },

  renderConstants({ eventModel, ui }) {
    const panel = this.querySelector("#constantsPanel");
    if (!panel) return;
    const { builtins, courseProperties, custom } = constantRowsForView(eventModel, ui);
    const builtinRows = builtins.map(row => `
      <tr>
        <td><code>${escapeHtml(row.name)}</code></td>
        <td>${escapeHtml(this.t(row.description))}</td>
        <td>${escapeHtml(row.value || "")}</td>
      </tr>
    `).join("");
    const coursePropertyRows = courseProperties.map(row => `
      <tr>
        <td><code>${escapeHtml(row.name)}</code></td>
        <td><code>${escapeHtml(row.type)}</code> — ${escapeHtml(this.t(row.description))}</td>
        <td class="constants-course-property-value"><code>${escapeHtml(row.value || "")}</code></td>
      </tr>
    `).join("");
    const customRows = custom.length ? custom.map((row, index) => `
      <tr data-constant-index="${index}">
        <td><input data-constant-field="name" value="${escapeAttr(row.name)}" placeholder="\\name" aria-label="${escapeAttr(this.t("Constant name"))}"></td>
        <td><input data-constant-field="description" value="${escapeAttr(row.description || "")}" placeholder="${escapeAttr(this.t("Optional"))}" aria-label="${escapeAttr(this.t("Explanation"))}"></td>
        <td>
          <input data-constant-field="expression" value="${escapeAttr(row.expression || "")}" placeholder="${escapeAttr(this.t("Value or expression"))}" aria-label="${escapeAttr(this.t("Value or expression"))}">
          <small>${escapeHtml(this.t("Current value"))}: ${escapeHtml(row.value || "")}</small>
        </td>
        <td><button type="button" class="constants-delete" data-constant-delete="${index}" aria-label="${escapeAttr(this.t("Delete"))}">×</button></td>
      </tr>
    `).join("") : `<tr><td colspan="4">${escapeHtml(this.t("No custom constants yet."))}</td></tr>`;
    panel.innerHTML = `
      <h2>${escapeHtml(this.t("Constants"))}</h2>
      <h3>${escapeHtml(this.t("Built-in constants"))}</h3>
      <table class="constants-table">
        <thead><tr><th>${escapeHtml(this.t("Constant name"))}</th><th>${escapeHtml(this.t("Explanation"))}</th><th>${escapeHtml(this.t("Current value / range"))}</th></tr></thead>
        <tbody>${builtinRows}</tbody>
      </table>
      <h3>${escapeHtml(this.t("Advanced map-page course properties"))}</h3>
      <p class="muted">${escapeHtml(courseProperties.length
        ? this.t("These Python properties are available as course attributes when advanced map-page code runs for each concrete route.")
        : this.t("Select a course to inspect the Python properties available to advanced map-page code."))}</p>
      ${courseProperties.length ? `
        <table class="constants-table constants-course-properties-table">
          <colgroup><col class="constants-course-property-name-column"><col class="constants-course-property-type-column"><col class="constants-course-property-value-column"></colgroup>
          <thead><tr><th>${escapeHtml(this.t("Property"))}</th><th>${escapeHtml(this.t("Type and meaning"))}</th><th>${escapeHtml(this.t("Current value / range"))}</th></tr></thead>
          <tbody>${coursePropertyRows}</tbody>
        </table>
      ` : ""}
      <h3>${escapeHtml(this.t("Custom constants"))}</h3>
      <table class="constants-table">
        <thead><tr><th>${escapeHtml(this.t("Constant name"))}</th><th>${escapeHtml(this.t("Explanation"))}</th><th>${escapeHtml(this.t("Value or expression"))}</th><th></th></tr></thead>
        <tbody>${customRows}</tbody>
      </table>
      <div class="constants-actions"><button type="button" data-constant-add>${escapeHtml(this.t("Add custom constant"))}</button></div>
    `;
  },

  handleConstantsPanelClick(event) {
    if (event.target.closest("[data-constant-add]")) {
      this.store.updateEvent(model => addCustomConstant(model), "Add custom constant");
      return;
    }
    const deleteButton = event.target.closest("[data-constant-delete]");
    if (deleteButton) {
      const index = Number(deleteButton.dataset.constantDelete);
      this.store.updateEvent(model => removeCustomConstant(model, index), "Delete custom constant");
    }
  },

  handleConstantsPanelChange(event) {
    const input = event.target.closest("[data-constant-field]");
    if (!input) return;
    const row = input.closest("[data-constant-index]");
    const index = Number(row?.dataset.constantIndex);
    const field = input.dataset.constantField;
    this.store.updateEvent(model => updateCustomConstant(model, index, field, input.value), "Update custom constant");
  },

  renderDescription({ eventModel, ui }) {
    const courseId = ui.selectedCourseId;
    const showingCourseRows = courseId !== "all";
    const course = showingCourseRows ? getCourse(eventModel, courseId) : null;
    const isScoreCourse = ["score", "military"].includes(course?.kind);
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
    const timeWindowRows = rows.filter(row => row.courseControl?.timeWindow);
    rows = rows.filter(row => !row.courseControl?.timeWindow);
    const mode = !showingCourseRows ? "all" : isTeamCourse ? "team" : (isScoreCourse ? "score" : "normal");
    const typeHeader = "";
    const militaryRows = militaryWindowDescriptionRows(eventModel, timeWindowRows, descriptionLanguageForEvent(eventModel));
    const militaryHtml = militaryRows.map(row => {
      if (row.kind === "military-window-section") {
        return `<tr class="military-description-section"><th colspan="8">${escapeHtml(this.t(row.text))}</th></tr>`;
      }
      if (row.kind === "military-window-header") {
        const values = row.boxes || [];
        return `<tr class="military-description-header"><th colspan="3">${escapeHtml(this.t(values[0] || ""))}</th><th colspan="4">${escapeHtml(this.t(values[1] || ""))}</th><th>${escapeHtml(this.t(values[2] || ""))}</th></tr>`;
      }
      return `<tr class="military-description-window" data-control-id="${Number(row.control?.id) || 0}"><td colspan="3">${escapeHtml(row.timeRange)}</td><td colspan="4">${escapeHtml(row.coordinates)}</td><td>${escapeHtml(row.score)}</td></tr>`;
    }).join("");
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
        <thead><tr><th class="description-order-column">#</th><th class="description-code-column">${escapeHtml(this.t("Code"))}</th>${typeHeader}<th>C</th><th>D</th><th>E</th><th>F</th><th>G</th><th>H</th></tr></thead>
        <tbody>
          ${rows.map(row => this.descriptionRow(row, mode)).join("")}
          ${militaryHtml}
        </tbody>
      </table>
    `;
    this.querySelector("#descriptionPanel").innerHTML = html;
    this.paintIscdCanvases(this.querySelector("#descriptionPanel"));
  },

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
      <td class="description-code-cell">${row.control.kind === "normal"
        ? `<input class="description-code-input" data-control-code data-control-id="${row.control.id}" value="${escapeAttr(row.control.code || "")}" aria-label="${escapeAttr(this.t("Control code"))}" autocomplete="off" spellcheck="false">`
        : mode === "all" && ["start", "finish"].includes(row.control.kind)
          ? escapeHtml(row.control.code || this.t(controlKindLabel(row.control.kind)))
        : escapeHtml(this.t(controlKindLabel(row.control.kind)))}</td>
      ${typeCell}
      ${["C", "D", "E", "F", "G", "H"].map(box => {
        if (isScoreCourse && box === "H") {
          return this.scoreDescriptionCell(row);
        }
        const description = descriptions.get(box) || {};
        const value = box === "F" ? columnFDescriptionDisplayValue(description) : description.ref || description.text || "";
        const pickerValue = box === "F" ? columnFDescriptionPickerValue(description) : value;
        const isColumnFText = box === "F" && isColumnFTextValue(value);
        if (isColumnFText) {
          const textValue = normalizeColumnFText(value);
          return `<td>
            <div class="iscd-cell-with-input">
              <button type="button" class="iscd-cell-button compact" data-iscd-cell data-control-id="${row.control.id}" data-box="${box}" data-value="${escapeAttr(pickerValue)}" data-symbol-tooltip="${escapeAttr(this.t(ISCD_COLUMNS.find(([id]) => id === box)?.[1] || box))}: ${escapeAttr(iscdSymbolLabel(box, value, language) || this.t("Not specified"))}">
                <canvas class="iscd-symbol-canvas" width="24" height="24" data-column="${box}" data-symbol="${escapeAttr(value)}"></canvas>
              </button>
              <input class="column-f-text-input" data-column-f-text data-control-id="${row.control.id}" value="${escapeAttr(textValue)}" inputmode="decimal">
            </div>
          </td>`;
        }
        return `<td>
          <button type="button" class="iscd-cell-button" data-iscd-cell data-control-id="${row.control.id}" data-box="${box}" data-value="${escapeAttr(value)}" data-symbol-tooltip="${escapeAttr(this.t(ISCD_COLUMNS.find(([id]) => id === box)?.[1] || box))}: ${escapeAttr(iscdSymbolLabel(box, value, language) || this.t("Not specified"))}">
            <canvas class="iscd-symbol-canvas" width="24" height="24" data-column="${box}" data-symbol="${escapeAttr(value)}"></canvas>
          </button>
        </td>`;
      }).join("")}
    </tr>`;
  },

  scoreDescriptionCell(row) {
    if (row.control.kind !== "normal" || !row.courseControl) {
      return `<td class="score-cell"></td>`;
    }
    return `<td class="score-cell"><input type="number" class="points-input" data-course-control-id="${row.courseControl.id}" data-field="courseControl.points" value="${row.courseControl.points || 0}" min="0"></td>`;
  }
,

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
  },

  handleDescriptionPanelClick(event) {
    if (event.target.closest("[data-control-code]")) {
      return;
    }
    if (event.target.closest("[data-field='courseControl.points']")) {
      return;
    }
    if (event.target.closest("[data-column-f-text]")) {
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
  },

  handleDescriptionPanelChange(event) {
    const newControlRoleInput = event.target.closest("[data-team-new-control-role]");
    if (newControlRoleInput) {
      this.store.updateUi(ui => {
        ui.teamAddControlRole = newControlRoleInput.value === "free" ? "free" : "mandatory";
      }, "Team add control role");
      return;
    }
    const codeInput = event.target.closest("[data-control-code]");
    if (codeInput) {
      this.updateDescriptionControlCode(codeInput);
      return;
    }
    const columnFInput = event.target.closest("[data-column-f-text]");
    if (columnFInput) {
      this.updateColumnFTextInput(columnFInput);
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
  },

  updateColumnFTextInput(input) {
    const controlId = Number(input.dataset.controlId);
    if (!controlId) return;
    const value = normalizeColumnFText(input.value);
    this.store.updateEvent(model => {
      const control = getControl(model, controlId);
      if (!control) return;
      const existing = control.descriptions?.find(description => description.box === "F");
      updateControlDescription(control, "F", existing?.ref || "", value);
    }, "Change column F text");
  },

  updateDescriptionControlCode(input) {
    const controlId = Number(input.dataset.controlId);
    if (!controlId || typeof updateControlCode !== "function") return false;
    const state = this.store.snapshot();
    const current = getControl(state.eventModel, controlId);
    if (!current) return false;
    const proposed = String(input.value ?? "").trim();
    const duplicate = (state.eventModel.controls || []).find(control =>
      Number(control.id) !== controlId
      && control.kind === "normal"
      && String(control.code || "").trim().toLocaleLowerCase() === proposed.toLocaleLowerCase()
    );
    const reason = !proposed ? "empty" : duplicate ? "duplicate" : "";
    if (reason) {
      const message = reason === "empty"
        ? this.t("Control code cannot be empty.")
        : this.t("Control code {code} is already used by another control.", { code: proposed });
      input.value = String(current.code || "");
      input.setCustomValidity?.(message);
      input.classList?.add?.("collision");
      input.reportValidity?.();
      this.store.updateUi(ui => { ui.status = message; }, "Control code rejected");
      return false;
    }
    input.setCustomValidity?.("");
    input.classList?.remove?.("collision");
    this.store.updateEvent(model => {
      updateControlCode(model, controlId, proposed);
    }, "Change control code");
    return true;
  }

  };
}
