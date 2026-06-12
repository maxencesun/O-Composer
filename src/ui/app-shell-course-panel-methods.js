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
  setSelection(selection) {
    const state = this.store.snapshot();
    this.store.updateUi(ui => {
      ui.selection = selection;
      const role = teamAddControlRoleFromSelection(state.eventModel, ui, selection);
      if (role) {
        ui.teamAddControlRole = role;
      }
    }, "Selection");
  },

  render(state) {
    const keys = renderKeysFor(state);
    const preserveSelectionPanelInput = this.shouldPreserveSelectionPanelInput();
    const shouldRenderCourse = !this.renderKeys
      || this.renderKeys.eventModel !== keys.eventModel
      || this.renderKeys.selectedCourseId !== keys.selectedCourseId
      || this.renderKeys.showAllControls !== keys.showAllControls
      || this.renderKeys.variationMode !== keys.variationMode
      || this.renderKeys.variationCode !== keys.variationCode
      || this.renderKeys.relayTeam !== keys.relayTeam
      || this.renderKeys.relayLeg !== keys.relayLeg;
    const shouldRenderSelection = !preserveSelectionPanelInput && (shouldRenderCourse
      || !this.renderKeys
      || this.renderKeys.selection !== keys.selection);
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
      || this.renderKeys.selection !== keys.selection
      || this.renderKeys.variationBranch !== keys.variationBranch
      || this.renderKeys.variationAnchorCourseControl !== keys.variationAnchorCourseControl
      || this.renderKeys.variationInsertAfterCourseControl !== keys.variationInsertAfterCourseControl
      || this.renderKeys.variationInsertBeforeCourseControl !== keys.variationInsertBeforeCourseControl
      || this.renderKeys.variationSelectedSegment !== keys.variationSelectedSegment
      || this.renderKeys.variationAddKind !== keys.variationAddKind
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
    this.renderStatus(state);
    this.syncUiModeToggle();
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
    const nextCourseId = courseId === "all" ? "all" : Number(courseId);
    const nextCourseHasVariations = nextCourseId !== "all" && courseHasVariations(this.store.snapshot().eventModel, nextCourseId);
    this.store.updateUi(ui => {
      ui.selectedCourseId = nextCourseId;
      ui.selection = courseId === "all" ? null : { type: "course", id: Number(courseId) };
      ui.showAllControls = courseId === "all";
      ui.variationMode = nextCourseHasVariations ? "all" : "default";
      ui.variationCode = "";
      ui.variationBranch = null;
      ui.variationAnchorCourseControl = null;
      ui.variationInsertAfterCourseControl = null;
      ui.variationInsertBeforeCourseControl = null;
      ui.variationSelectedSegment = "";
      ui.relayTeam = 1;
      ui.relayLeg = 1;
      ui.printAreaEdit = null;
      if (ui.tool === "print-area" || ui.tool === "print-area-frame") {
        ui.tool = "select";
      }
    }, "Select course");
  },

  renderBanner({ eventModel, ui }) {
    const course = ui.selectedCourseId === "all" ? null : getCourse(eventModel, ui.selectedCourseId);
    const displayOptions = courseDisplayOptions(eventModel, ui);
    const title = course ? course.name : this.t("All Controls");
    const view = course ? courseView(eventModel, course.id, displayOptions) : [];
    const displayLabel = course ? variationDisplayLabel(eventModel, course.id, ui) : "";
    const details = course
      ? `${optionLabel(course.kind)}${displayLabel ? ` | ${this.t(displayLabel)}` : ""} | ${formatLength(courseLength(eventModel, course.id, displayOptions))} | ${view.length} ${this.t("controls")}`
      : `${eventModel.controls.length} ${this.t("controls")} | ${eventModel.specials.length} ${this.t("special objects")}`;
    this.querySelector("#courseBannerText").innerHTML = `<strong>${escapeHtml(eventModel.event.title || this.t("Untitled Event"))}</strong><span>${escapeHtml(title)}</span><span>${escapeHtml(details)}</span>`;
    this.querySelector("#courseVariationControls").innerHTML = course ? this.courseVariationControls(eventModel, course, ui) : "";
  },

  courseVariationControls(eventModel, course, ui) {
    if (!courseHasVariations(eventModel, course.id)) return "";
    const variations = allCourseVariations(eventModel, course.id);
    const relay = relayAssignments(eventModel, course.id);
    const mode = ui.variationMode || "default";
    const variationCode = ui.variationCode || variations[0]?.code || "";
    const team = Number(ui.relayTeam) || course.relay?.firstTeam || 1;
    const leg = Number(ui.relayLeg) || 1;
    return `
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
    `;
  },

  handleCourseBannerChange(event) {
    const target = event.target;
    if (target.dataset.courseVariationMode === undefined
      && target.dataset.courseVariationCode === undefined
      && target.dataset.relayTeam === undefined
      && target.dataset.relayLeg === undefined) {
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
      }
      if (target.dataset.courseVariationCode !== undefined) {
        ui.variationCode = target.value || "";
      }
      if (target.dataset.relayTeam !== undefined) {
        ui.relayTeam = clamp(Number(target.value) || course?.relay?.firstTeam || 1, course?.relay?.firstTeam || 1, (course?.relay?.firstTeam || 1) + Math.max(0, (course?.relay?.teams || 1) - 1));
      }
      if (target.dataset.relayLeg !== undefined) {
        ui.relayLeg = clamp(Number(target.value) || 1, 1, Math.max(1, course?.relay?.legs || 1));
      }
      if (!ui.variationCode && variations.length) {
        ui.variationCode = variations[0].code;
      }
    }, "Select variation");
  },

  renderDescription({ eventModel, ui }) {
    const courseId = ui.selectedCourseId;
    const showingCourseRows = courseId !== "all";
    const course = showingCourseRows ? getCourse(eventModel, courseId) : null;
    const isScoreCourse = course?.kind === "score";
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
    const mode = isTeamCourse ? "team" : (isScoreCourse ? "score" : "normal");
    const typeHeader = "";
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
        <thead><tr><th>#</th><th>${escapeHtml(this.t("Code"))}</th>${typeHeader}<th>C</th><th>D</th><th>E</th><th>F</th><th>G</th><th>H</th></tr></thead>
        <tbody>
          ${rows.map(row => this.descriptionRow(row, mode)).join("")}
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
      <td>${escapeHtml(row.control.code || this.t(controlKindLabel(row.control.kind)))}</td>
      ${typeCell}
      ${["C", "D", "E", "F", "G", "H"].map(box => {
        if (isScoreCourse && box === "H") {
          return this.scoreDescriptionCell(row);
        }
        const value = descriptions.get(box)?.ref || descriptions.get(box)?.text || "";
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
    if (event.target.closest("[data-field='courseControl.points']")) {
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
    const pointsInput = event.target.closest("[data-field='courseControl.points']");
    if (!pointsInput) return;
    const courseControlId = Number(pointsInput.dataset.courseControlId);
    if (!courseControlId) return;
    this.store.updateEvent(model => {
      const courseControl = getCourseControl(model, courseControlId);
      if (!courseControl) return;
      courseControl.points = Math.max(0, Number(pointsInput.value) || 0);
    }, "Change points");
  }

  };
}
