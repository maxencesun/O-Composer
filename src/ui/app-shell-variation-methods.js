import { debugError } from "./debug-log.js?v=20260708-2";

export function createAppShellVariationMethods(deps) {
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
    addVariationBranch,
    removeVariationBranch,
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
    relayBranchAllowedLegs,
    relayBranchLegLabel,
    relayBranchRestrictionIssues,
    relayEntryLabel,
    relayLegName,
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
  renderVariation({ eventModel, ui }) {
    const panel = this.querySelector("#variationPanel");
    const scrollState = captureVariationScrollState(panel);
    panel.innerHTML = this.variationPanelHtml(eventModel, ui);
    restoreVariationScrollState(panel, scrollState);
  },

  variationPanelHtml(eventModel, ui) {
    const courseId = ui.selectedCourseId;
    const course = courseId === "all" ? null : getCourse(eventModel, courseId);
    if (!course) {
      return `<p class="muted">${escapeHtml(this.t("Select a course first."))}</p>`;
    }
    if (course.kind === "score") {
      return `<p class="muted">${escapeHtml(this.t("Variations cannot be added to score courses."))}</p>`;
    }
    if (course.kind === "team") {
      return `<p class="muted">${escapeHtml(this.t("Variations cannot be added to team courses."))}</p>`;
    }

    const branchCodes = variationBranchCodeMap(eventModel, course.id);
    const variations = allCourseVariations(eventModel, course.id);
    const assignments = relayAssignments(eventModel, course.id);
    const anchorCourseControl = variationAnchorCourseControl(eventModel, course.id, ui);
    const canAddVariation = canAddVariationAtCourseControl(eventModel, course, anchorCourseControl);
    const selectedBranch = normalizedVariationBranch(eventModel, course.id, ui.variationBranch);
    const selectedBranchFork = selectedBranch ? getCourseControl(eventModel, selectedBranch.forkCourseControl) : null;
    const canAddParallelBranch = !!selectedBranch && (selectedBranchFork?.variationCourseControls || []).length < 6;
    const canDeleteSelectedBranch = !!selectedBranch && (selectedBranchFork?.variationCourseControls || []).length > 1;
    const selectedBranchCode = selectedBranch ? branchCodes.get(Number(selectedBranch.branchCourseControl)) || "" : "";
    const anchorControl = getControl(eventModel, anchorCourseControl?.control);
    const topologyHtml = this.variationTopologySvg(eventModel, course.id, ui, branchCodes);
    const branchLegEditor = this.variationBranchLegEditor(course, assignments, selectedBranch, selectedBranchCode);
    const restrictionIssues = relayBranchRestrictionIssues(assignments.branchGroups || [], course.relay?.branches || []);
    const legsSelected = relayLegCountSelected(course);
    const legCountControl = this.variationLegCountControl(eventModel, course, variations);
    const addVariationLabel = this.t("Add Variation");
    const addParallelBranchLabel = this.t("Add Parallel Branch");
    const deleteBranchLabel = this.t("Delete Branch");
    if (!legsSelected) {
      return `
        <div class="variation-fixed-controls">
          ${legCountControl}
        </div>
      `;
    }
    return `
      <div class="variation-fixed-controls">
        ${legCountControl}
        <div class="variation-actions">
          <label>${escapeHtml(this.t("Branches"))}
            <input data-variation-add-branches type="number" min="2" max="6" value="${Math.max(2, Math.min(6, Number(ui.variationAddBranches) || 2))}">
          </label>
          <div class="variation-action-buttons">
            <button type="button" data-add-variation title="${escapeAttr(addVariationLabel)}" aria-label="${escapeAttr(addVariationLabel)}" ${canAddVariation ? "" : "disabled"}>${iconSvg("plus")} <span>${escapeHtml(addVariationLabel)}</span></button>
            <button type="button" data-add-parallel-variation-branch title="${escapeAttr(addParallelBranchLabel)}" aria-label="${escapeAttr(addParallelBranchLabel)}" ${canAddParallelBranch ? "" : "disabled"}>${iconSvg("plus")} <span>${escapeHtml(addParallelBranchLabel)}</span></button>
            <button type="button" data-delete-variation-branch title="${escapeAttr(deleteBranchLabel)}" aria-label="${escapeAttr(deleteBranchLabel)}" ${canDeleteSelectedBranch ? "" : "disabled"}>${iconSvg("trash")} <span>${escapeHtml(deleteBranchLabel)}</span></button>
          </div>
        </div>
      </div>
      <div class="variation-scroll-area">
        ${canAddVariation && anchorCourseControl && anchorControl
          ? `<p class="muted">${escapeHtml(this.t("Variation will start at {control}.", { control: controlDisplayName(anchorControl) }))}</p>`
          : ""}
        ${selectedBranch ? `<p class="variation-branch-hint">${escapeHtml(this.t("Selected branch"))}: <strong>${escapeHtml(selectedBranchCode || controlDisplayName(getControl(eventModel, getCourseControl(eventModel, selectedBranch.branchCourseControl)?.control)))}</strong></p>` : ""}
        ${branchLegEditor}
        ${restrictionIssues.length ? `<p class="relay-branch-warning">${escapeHtml(this.t("Every parallel branch must declare allowed legs. Missing: {branches}.", { branches: uniqueStrings(restrictionIssues.flatMap(issue => issue.missingCodes)).join(", ") }))}</p>` : ""}
        ${variations.length ? `
          <div class="variation-code-list">${variations.map(variation => `<button type="button" data-course-variation-code-select="${escapeAttr(variation.code)}">${escapeHtml(variation.code)}</button>`).join("")}</div>
        ` : `<p class="muted">${escapeHtml(this.t("This course has no variations."))}</p>`}
        ${this.relayAutoAssignmentPanel(eventModel, course, variations)}
        <div class="variation-tree">${topologyHtml || `<p class="muted">${escapeHtml(this.t("This course has no controls."))}</p>`}</div>
      </div>
    `;
  },

  variationLegCountControl(eventModel, course, variations) {
    const selectedLegs = rawRelayLegCount(course);
    const locked = selectedLegs > 0 && variations.length > 0;
    const sizeOptions = uniqueNumbers([
      ...relayTeamSizeOptions(eventModel, course.id),
      selectedLegs
    ].filter(value => Number(value) > 0)).sort((a, b) => a - b);
    return `
      <label class="variation-leg-count">${escapeHtml(this.t("Participants per team"))}
        <select data-relay-settings-field="legs" ${locked ? "disabled" : ""}>
          <option value="" ${selectedLegs ? "" : "selected"}>-</option>
          ${sizeOptions.map(value => `<option value="${value}" ${value === selectedLegs ? "selected" : ""}>${value}</option>`).join("")}
        </select>
      </label>
    `;
  },

  variationBranchLegEditor(course, assignments, selectedBranch, selectedBranchCode) {
    if (!selectedBranch || !selectedBranchCode) return "";
    const relay = normalizedRelaySettings(course.relay);
    const legs = Math.max(1, assignments.legs || relay.legs || 1);
    const allowedLegs = new Set(relayBranchAllowedLegs(relay.branches || [], selectedBranchCode, legs));
    const checks = Array.from({ length: legs }, (_, index) => {
      const leg = index + 1;
      return `
        <label class="check">
          <input data-variation-branch-leg="${escapeAttr(selectedBranchCode)}" type="checkbox" value="${leg}" ${allowedLegs.has(leg) ? "checked" : ""}>
          ${escapeHtml(relayLegName(relay, leg))}
        </label>
      `;
    }).join("");
    return `
      <div class="variation-branch-leg-editor">
        <strong>${escapeHtml(this.t("Allowed legs for branch {branch}", { branch: selectedBranchCode }))}</strong>
        <div class="variation-branch-leg-grid">${checks}</div>
      </div>
    `;
  },

  relayAutoAssignmentPanel(eventModel, course, variations) {
    const relay = normalizedRelaySettings(course.relay);
    const recommendedSizeOptions = relayTeamSizeOptions(eventModel, course.id);
    const assignments = relayAssignments(eventModel, course.id);
    const selectedLegs = rawRelayLegCount(course) || assignments.legs || relay.legs || 1;
    const legNameInputs = Array.from({ length: selectedLegs }, (_, index) => `
      <label>${escapeHtml(this.t("Leg {number} name", { number: index + 1 }))}
        <input data-relay-leg-name="${index}" value="${escapeAttr(relay.legNames[index] || "")}" placeholder="${escapeAttr(String(index + 1))}">
      </label>
    `).join("");
    return `
      <section class="relay-auto-panel">
        <h3>${escapeHtml(this.t("Relay auto assignment"))}</h3>
        ${variations.length ? `
          <div class="relay-auto-grid">
            <label>${escapeHtml(this.t("Total teams"))}
              <input data-relay-settings-field="teams" type="number" min="0" value="${relay.teams}">
            </label>
            <label>${escapeHtml(this.t("First team"))}
              <input data-relay-settings-field="firstTeam" type="number" min="1" value="${relay.firstTeam}">
            </label>
            <label>${escapeHtml(this.t("Team prefix"))}
              <input data-relay-settings-field="teamPrefix" value="${escapeAttr(relay.teamPrefix)}">
            </label>
            <label>${escapeHtml(this.t("Team digits"))}
              <input data-relay-settings-field="teamDigits" type="number" min="0" max="8" value="${relay.teamDigits}">
            </label>
            ${legNameInputs}
          </div>
          <p class="muted">${escapeHtml(this.t("Recommended participants per team: {options}.", { options: recommendedSizeOptions.join(", ") }))}</p>
          <div class="relay-assignment-preview">${this.relayAssignmentListTable(assignments)}</div>
        ` : `<p class="muted">${escapeHtml(this.t("Add forks to this course to create relay variations."))}</p>`}
      </section>
    `;
  },

  relayAssignmentListTable(assignments) {
    if (!assignments.entries?.length) {
      return `<p class="muted">${escapeHtml(this.t("Enter total teams to create relay assignments."))}</p>`;
    }
    const rows = assignments.entries.map(entry => `
      <tr>
        <td>${escapeHtml(entry.label)}</td>
        <td>${escapeHtml(entry.variation?.code || "")}</td>
      </tr>
    `).join("");
    return `
      <table class="report-table relay-assignment-table relay-assignment-list">
        <thead><tr><th>${escapeHtml(this.t("Team-leg"))}</th><th>${escapeHtml(this.t("Variation"))}</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    `;
  },

  variationTopologySvg(eventModel, courseId, ui, branchCodes) {
    const topology = courseTopology(eventModel, courseId);
    if (!topology.length) return "";
    const layout = layoutVariationTopology(topology, branchCodes);
    const nodeRadius = 16;
    const width = Math.max(180, Math.ceil(layout.width));
    const height = Math.max(120, Math.ceil(layout.height));
    const selectedBranch = normalizedVariationBranch(eventModel, courseId, ui.variationBranch);
    const selectedAnchor = variationAnchorCourseControl(eventModel, courseId, ui);
    const branchEdges = topologyBranchEdgeMap(topology);
    const commonJoinPoints = topologyCommonJoinPointMap(topology, layout.positions, nodeRadius);
    const previousCourseControls = topologyPreviousCourseControlMap(topology);
    const forkBranchFirstVerticalGap = (startIndex, joinIndex, commonJoinPoint) => {
      const startPosition = layout.positions[startIndex];
      const startView = topology[startIndex];
      if (!startPosition || !startView) return null;
      const startBottomY = startPosition.y + topologyConnectionRadius(startView.control, nodeRadius);
      const nextIndices = (startView.legTo || []).filter(Number.isInteger);
      const gaps = [];
      for (const nextIndex of nextIndices) {
        if (Number(nextIndex) === Number(joinIndex)) {
          gaps.push(commonJoinPoint.y - startBottomY);
          continue;
        }
        const nextPosition = layout.positions[nextIndex];
        const nextView = topology[nextIndex];
        if (!nextPosition) continue;
        const nextTopY = nextPosition.y - topologyConnectionRadius(nextView?.control, nodeRadius);
        const firstSegmentEndY = Math.abs(nextPosition.x - startPosition.x) < 0.1
          ? nextTopY
          : (startBottomY + nextTopY) / 2;
        gaps.push(firstSegmentEndY - startBottomY);
      }
      return gaps.filter(gap => Number.isFinite(gap) && gap > 0.1).sort((a, b) => a - b)[0] || null;
    };
    const forkBusYForView = (view, position, originalForkY, commonJoinPoint) => {
      if (!view || view.variation === "loop" || !Number.isFinite(originalForkY) || !commonJoinPoint) {
        return originalForkY;
      }
      const branchStarts = (view.legTo || [])
        .map(index => ({ index, position: layout.positions[index], view: topology[index] }))
        .filter(branch => branch.position);
      if (!branchStarts.length) return originalForkY;
      const branchTopY = Math.min(...branchStarts.map(branch => (
        branch.position.y - topologyConnectionRadius(branch.view?.control, nodeRadius)
      )));
      const ownerBottomY = position.y + topologyConnectionRadius(view.control, nodeRadius);
      const lowerGaps = branchStarts
        .map(branch => forkBranchFirstVerticalGap(branch.index, view.joinIndex, commonJoinPoint))
        .filter(gap => Number.isFinite(gap) && gap > 0.1);
      if (!lowerGaps.length) return originalForkY;
      const desiredGap = Math.max(4, Math.min(...lowerGaps));
      const symmetricY = branchTopY - desiredGap;
      return Math.max(ownerBottomY + 8, Math.min(branchTopY - 4, symmetricY));
    };
    const paths = [];
    const priorityHits = [];
    const branchPriorityHits = [];
    const junctions = [];
    const labels = [];
    const nodes = [];
    const pushTopologyPath = (path, options = {}) => {
      paths.push(topologyPathSvg(path, options));
      if (options.branchAttrs) {
        branchPriorityHits.push({
          priority: Number(options.branchHitPriority) || 0,
          svg: topologyHitPathSvg(path, options)
        });
      }
    };
    for (let index = 0; index < topology.length; index += 1) {
      const view = topology[index];
      const position = layout.positions[index];
      if (!position) continue;
      const commonJoinPoint = commonJoinPoints.get(index) || null;
      if (view.variation !== "loop" && (view.legTo || []).length > 1 && position.forkStart?.some(Boolean)) {
        const forkY = forkBusYForView(view, position, position.forkStart.find(Boolean)?.y, commonJoinPoint);
        const forkOwnerCourseControlId = topologyNodeCourseControlId(view);
        junctions.push(`<circle class="variation-topology-junction-hit" cx="${formatSvgNumber(position.x)}" cy="${formatSvgNumber(forkY)}" r="22" data-select-variation-course-control="${forkOwnerCourseControlId}"></circle>`);
        const stemStartY = position.y + topologyConnectionRadius(view.control, nodeRadius);
        const stemPath = `M ${formatSvgNumber(position.x)} ${formatSvgNumber(stemStartY)} V ${formatSvgNumber(forkY)}`;
        pushTopologyPath(stemPath, {
          insertAfterCourseControl: forkOwnerCourseControlId,
          segmentKey: `stem:${index}`,
          selected: ui.variationSelectedSegment === `stem:${index}`
        });
        priorityHits.push(topologyHitPathSvg(stemPath, {
          insertAfterCourseControl: forkOwnerCourseControlId,
          segmentKey: `stem:${index}`
        }));
      }
      for (let legIndex = 0; legIndex < view.legTo.length; legIndex += 1) {
        const targetPosition = layout.positions[view.legTo[legIndex]];
        if (!targetPosition) continue;
        const targetView = topology[view.legTo[legIndex]];
        const directBranch = (view.legTo || []).length > 1 && topologyBranchCourseControlId(view, legIndex)
          ? {
            forkIndex: index,
            forkCourseControl: topologyNodeCourseControlId(view),
            branchCourseControl: topologyBranchCourseControlId(view, legIndex),
            joinIndex: view.joinIndex
          }
          : null;
        const edgeBranch = directBranch || branchEdges.get(topologyEdgeKey(index, view.legTo[legIndex]));
        const branchSelected = selectedBranch
          && edgeBranch
          && Number(selectedBranch.forkCourseControl) === Number(edgeBranch.forkCourseControl)
          && Number(selectedBranch.branchCourseControl) === Number(edgeBranch.branchCourseControl);
        const rawForkStart = position.forkStart?.[legIndex] || null;
        const forkStart = rawForkStart && view.variation !== "loop"
          ? { ...rawForkStart, y: forkBusYForView(view, position, rawForkStart.y, commonJoinPoint) }
          : rawForkStart;
        const startRadius = topologyConnectionRadius(view.control, nodeRadius);
        const endRadius = topologyConnectionRadius(targetView?.control, nodeRadius);
        const loopFallThroughEdge = view.variation === "loop" && legIndex === 0 && !edgeBranch;
        const insertAfterCourseControl = loopFallThroughEdge
          ? null
          : (edgeBranch && (view.legTo || []).length > 1
            ? edgeBranch.branchCourseControl
            : topologyNodeCourseControlId(view));
        const insertBeforeCourseControl = loopFallThroughEdge
          ? topologyNodeCourseControlId(targetView)
          : null;
        const segmentKey = `edge:${index}:${legIndex}:${view.legTo[legIndex]}`;
        const selected = ui.variationSelectedSegment === segmentKey;
        const branchAttrs = edgeBranch
          ? ` data-select-variation-branch data-fork-course-control="${edgeBranch.forkCourseControl}" data-branch-course-control="${edgeBranch.branchCourseControl}"`
          : "";
        const forkOwnerPosition = Number.isInteger(edgeBranch?.forkIndex) ? layout.positions[edgeBranch.forkIndex] : null;
        const branchLaneX = forkStart?.x ?? position.x;
        const branchHitPriority = edgeBranch && forkOwnerPosition && Math.abs(branchLaneX - forkOwnerPosition.x) < 0.1 ? 2 : 1;
        const joinTarget = edgeBranch && Number(view.legTo[legIndex]) === Number(edgeBranch.joinIndex);
        if (joinTarget && edgeBranch && topology[edgeBranch.forkIndex]?.variation === "loop") {
          const ownerPosition = layout.positions[edgeBranch.forkIndex];
          const ownerView = topology[edgeBranch.forkIndex];
          const ownerRadius = topologyConnectionRadius(ownerView?.control, nodeRadius);
          const loopBottom = ownerPosition?.loopBottom || (Math.max(position.y, targetPosition.y) + TOPOLOGY_HEIGHT_UNIT * 0.75);
          const path = forkStart && topologyBranchIsEmpty(view, legIndex)
            ? topologyEmptyLoopBranchPath(ownerPosition, forkStart, loopBottom, ownerRadius)
            : topologyLoopReturnPath(position, ownerPosition, loopBottom, startRadius, ownerRadius);
          pushTopologyPath(path, { insertAfterCourseControl, insertBeforeCourseControl, branchAttrs, branchHitPriority, segmentKey, selected });
        }
        else if (joinTarget && !forkStart) {
          // For the last edge inside a branch, route only to the fork owner's
          // shared merge bus.  Do not draw it all the way to the join control.
          // With 3 branches the middle branch often sits on the same x as the
          // common post-merge stem; drawing to the join made the branch edge and
          // the outside-of-branch edge overlap into one SVG path/hit area.
          const forkJoinPoint = Number.isInteger(edgeBranch?.forkIndex)
            ? commonJoinPoints.get(edgeBranch.forkIndex)
            : null;
          const joinPoint = forkJoinPoint || commonJoinPoint || topologyBranchJoinPoint(position, targetPosition, startRadius, endRadius);
          const path = topologyBranchToJoinPath(position, joinPoint, startRadius);
          pushTopologyPath(path, { insertAfterCourseControl, insertBeforeCourseControl, branchAttrs, branchHitPriority, segmentKey, selected });
        }
        else if (joinTarget && forkStart && topologyBranchIsEmpty(view, legIndex)) {
          const joinPoint = commonJoinPoint || topologyEmptyBranchJoinPoint(forkStart, targetPosition, endRadius);
          const path = topologyEmptyBranchPath(position, forkStart, joinPoint);
          pushTopologyPath(path, { insertAfterCourseControl, insertBeforeCourseControl, branchAttrs, branchHitPriority, segmentKey, selected });
        }
        else {
          const path = topologyLegPath(position, targetPosition, forkStart, startRadius, endRadius, !!edgeBranch);
          pushTopologyPath(path, { insertAfterCourseControl, insertBeforeCourseControl, branchAttrs, branchHitPriority, segmentKey, selected });
          // Loop fall-through is the only edge that leaves the loop. Loop
          // return paths are drawn beside/over it, so give the exit edge a
          // late hit path with priority; otherwise clicks on the middle stem
          // are stolen by the loop branches.
          if (loopFallThroughEdge) {
            priorityHits.push(topologyHitPathSvg(path, {
              insertBeforeCourseControl,
              segmentKey
            }));
          }
        }
        const code = edgeBranch ? branchCodes.get(Number(edgeBranch.branchCourseControl)) : "";
        if (forkStart && code) {
          const labelX = forkStart.x + (forkStart.x < position.x ? -36 : 36);
          const labelY = forkStart.y + 2;
          labels.push(`<text class="variation-topology-code ${branchSelected ? "selected" : ""}" x="${formatSvgNumber(labelX)}" y="${formatSvgNumber(labelY)}" text-anchor="middle"${branchAttrs}>(${escapeHtml(code)})</text>`);
          const legLabel = relayBranchLegLabel(getCourse(eventModel, courseId)?.relay || {}, code, { short: true });
          if (legLabel) {
            labels.push(`<text class="variation-topology-branch-legs" x="${formatSvgNumber(labelX)}" y="${formatSvgNumber(labelY + 16)}" text-anchor="middle"${branchAttrs}>${escapeHtml(legLabel)}</text>`);
          }
        }
      }
      const joinHitPoint = commonJoinPoint;
      const joinCourseControlId = Number.isInteger(view.joinIndex) && view.joinIndex !== index
        ? topologyNodeCourseControlId(topology[view.joinIndex])
        : null;
      if (view.variation !== "loop" && (view.legTo || []).length > 1 && joinHitPoint && joinCourseControlId) {
        junctions.push(`<circle class="variation-topology-junction-hit" cx="${formatSvgNumber(joinHitPoint.x)}" cy="${formatSvgNumber(joinHitPoint.y)}" r="24" data-select-variation-course-control="${joinCourseControlId}"></circle>`);
        const joinPosition = layout.positions[view.joinIndex];
        if (joinPosition) {
          const preJoinSegmentKey = `prejoin:${index}:${view.joinIndex}`;
          const joinTopY = joinPosition.y - topologyConnectionRadius(topology[view.joinIndex]?.control, nodeRadius);
          if (joinHitPoint.y < joinTopY - 0.5) {
            const preJoinPath = `M ${formatSvgNumber(joinHitPoint.x)} ${formatSvgNumber(joinHitPoint.y)} V ${formatSvgNumber(joinTopY)}`;
            // The visible common segment after all branch lanes have merged is
            // outside the per-branch lanes, but it is still before the join
            // checkpoint itself. Clicking this segment means: insert one shared
            // checkpoint after the branch block and before the join checkpoint.
            // The domain insertion code promotes the new checkpoint to the
            // variationEnd so branch tails do not treat it as a per-branch point.
            pushTopologyPath(preJoinPath, {
              insertBeforeCourseControl: joinCourseControlId,
              segmentKey: preJoinSegmentKey,
              selected: ui.variationSelectedSegment === preJoinSegmentKey
            });
            priorityHits.push(topologyHitPathSvg(preJoinPath, {
              insertBeforeCourseControl: joinCourseControlId,
              segmentKey: preJoinSegmentKey
            }));
          }
        }
      }
    }
    for (let index = 0; index < topology.length; index += 1) {
      const view = topology[index];
      const position = layout.positions[index];
      if (!position) continue;
      const courseControlId = topologyNodeCourseControlId(view);
      const selected = Number(selectedAnchor?.id) === Number(courseControlId);
      nodes.push(topologyNodeSvg(view.control, position, courseControlId, selected));
    }
    return `
      <svg class="variation-topology" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="${escapeAttr(this.t("Variation"))}">
        <g>${junctions.join("")}</g>
        <g>${paths.join("")}</g>
        <g>${priorityHits.join("")}</g>
        <g>${branchPriorityHits.sort((a, b) => a.priority - b.priority).map(hit => hit.svg).join("")}</g>
        <g>${labels.join("")}</g>
        <g>${nodes.join("")}</g>
      </svg>
    `;
  },

  handleVariationPanelClick(event) {
    const addButton = event.target.closest("[data-add-variation]");
    if (addButton) {
      this.addVariationFromPanel();
      return;
    }
    const addParallelBranchButton = event.target.closest("[data-add-parallel-variation-branch]");
    if (addParallelBranchButton) {
      this.addParallelVariationBranch();
      return;
    }
    const deleteBranchButton = event.target.closest("[data-delete-variation-branch]");
    if (deleteBranchButton) {
      this.deleteSelectedVariationBranch();
      return;
    }
    const variationCodeButton = event.target.closest("[data-course-variation-code-select]");
    if (variationCodeButton) {
      this.store.updateUi(ui => {
        ui.variationMode = "variation";
        ui.variationCode = variationCodeButton.dataset.courseVariationCodeSelect || "";
      }, "Select variation");
      return;
    }
    const branchButton = event.target.closest("[data-select-variation-branch]");
    if (branchButton) {
      const branchCourseControl = Number(branchButton.dataset.branchCourseControl) || null;
      const forkCourseControl = Number(branchButton.dataset.forkCourseControl) || null;
      const insertAfterCourseControl = Number(branchButton.dataset.insertAfterCourseControl) || null;
      const segment = branchButton.dataset.variationSegment || "";
      this.store.updateUi(ui => {
        ui.variationBranch = { forkCourseControl, branchCourseControl };
        ui.variationAnchorCourseControl = insertAfterCourseControl || forkCourseControl;
        ui.variationInsertAfterCourseControl = insertAfterCourseControl;
        ui.variationInsertBeforeCourseControl = null;
        ui.variationSelectedSegment = segment;
        ui.variationMode = "all";
        ui.status = this.t("Branch selected. Add controls to insert them on this branch.");
      }, "Select variation branch");
      return;
    }
    const insertionButton = event.target.closest("[data-select-variation-insertion]");
    if (insertionButton) {
      const insertAfterCourseControl = Number(insertionButton.dataset.insertAfterCourseControl) || null;
      const insertBeforeCourseControl = Number(insertionButton.dataset.insertBeforeCourseControl) || null;
      const segment = insertionButton.dataset.variationSegment || "";
      this.store.updateUi(ui => {
        ui.variationInsertAfterCourseControl = insertAfterCourseControl;
        ui.variationInsertBeforeCourseControl = insertBeforeCourseControl;
        ui.variationAnchorCourseControl = insertAfterCourseControl || insertBeforeCourseControl;
        ui.variationBranch = null;
        ui.variationSelectedSegment = segment;
        ui.variationMode = "all";
        ui.status = this.t("Variation insertion point selected.");
      }, "Select variation insertion");
      return;
    }
    const courseControlButton = event.target.closest("[data-select-variation-course-control]");
    if (courseControlButton) {
      const courseControlId = Number(courseControlButton.dataset.selectVariationCourseControl) || null;
      const state = this.store.snapshot();
      const courseControl = getCourseControl(state.eventModel, courseControlId);
      const isForkOwner = !!courseControl?.variation;
      this.store.updateUi(ui => {
        ui.variationAnchorCourseControl = courseControlId;
        // Clicking a node means "after this checkpoint". If the checkpoint
        // owns a fork, insertion moves the fork ownership down to the newly
        // inserted checkpoint so the new point sits before the branch block.
        ui.variationInsertAfterCourseControl = courseControlId;
        ui.variationInsertBeforeCourseControl = null;
        ui.variationSelectedSegment = `node:${courseControlId}`;
        ui.variationBranch = null;
        ui.selection = courseControl ? { type: "control", id: courseControl.control, courseControl: courseControl.id } : ui.selection;
        ui.variationMode = "all";
        ui.status = isForkOwner
          ? this.t("Fork selected. Add a control to place it before this branch block.")
          : this.t("Checkpoint selected. Add a control to place it after this checkpoint.");
      }, "Select variation anchor");
    }
  },

  handleVariationPanelInput(event) {
    const relayField = event.target.closest("[data-relay-settings-field]");
    const relayLegName = event.target.closest("[data-relay-leg-name]");
    if (!relayField && !relayLegName) return;
    // Keep typing stable: update the in-memory relay settings and refresh only
    // the assignment table. The change event still records the undo step.
    this.previewRelaySettingsFromVariationPanel(relayField, relayLegName);
  },

  handleVariationPanelChange(event) {
    const branchesInput = event.target.closest("[data-variation-add-branches]");
    const branchLegInput = event.target.closest("[data-variation-branch-leg]");
    const relayField = event.target.closest("[data-relay-settings-field]");
    const relayLegName = event.target.closest("[data-relay-leg-name]");
    if (!branchesInput && !branchLegInput && !relayField && !relayLegName) return;
    if (branchLegInput) {
      this.updateVariationBranchLegRestriction(branchLegInput);
      return;
    }
    if (relayField || relayLegName) {
      this.updateRelaySettingsFromVariationPanel(relayField, relayLegName);
      return;
    }
    this.store.updateUi(ui => {
      if (branchesInput) {
        ui.variationAddBranches = Math.max(2, Math.min(6, Math.round(Number(branchesInput.value) || 2)));
      }
    }, "Variation options");
  },

  updateVariationBranchLegRestriction(input) {
    const state = this.store.snapshot();
    const courseId = state.ui.selectedCourseId;
    const branch = String(input.dataset.variationBranchLeg || "").trim();
    const leg = Math.max(1, Math.round(Number(input.value) || 1));
    if (!courseId || courseId === "all" || !branch) return;
    this.store.updateEvent(model => {
      const course = getCourse(model, courseId);
      if (!course) return;
      course.relay = normalizedRelaySettings(course.relay);
      const allowed = new Set(relayBranchAllowedLegs(course.relay.branches || [], branch, course.relay.legs || Infinity));
      if (input.checked) allowed.add(leg);
      else allowed.delete(leg);
      course.relay.branches = (course.relay.branches || []).filter(item => String(item.branch || "").trim() !== branch);
      const legs = [...allowed].sort((a, b) => a - b);
      if (legs.length) course.relay.branches.push({ branch, legs });
    }, "Change branch allowed legs");
    this.refreshRelayAssignmentPreview(this.store.snapshot().eventModel, courseId);
  },

  updateRelaySettingsFromVariationPanel(relayField, relayLegName) {
    const state = this.store.snapshot();
    const courseId = state.ui.selectedCourseId;
    if (!courseId || courseId === "all") return;
    if (!relayField || relayField.dataset.relaySettingsField !== "legs") {
      this.previewRelaySettingsFromVariationPanel(relayField, relayLegName);
      this.store.pushHistory("Change relay assignment");
      this.store.redoStack = [];
      return;
    }
    let nextRelay = null;
    this.store.updateEvent(model => {
      const course = getCourse(model, courseId);
      if (!course) return;
      course.relay = normalizedRelaySettings(course.relay);
      applyRelayInputToSettings(course.relay, relayField, relayLegName);
      nextRelay = { ...course.relay, legNames: [...(course.relay.legNames || [])] };
    }, "Change relay assignment");
    if (nextRelay) {
      this.store.updateUi(ui => {
        ui.relayTeam = clamp(Number(ui.relayTeam) || nextRelay.firstTeam || 1, nextRelay.firstTeam || 1, (nextRelay.firstTeam || 1) + Math.max(0, (nextRelay.teams || 1) - 1));
        ui.relayLeg = clamp(Number(ui.relayLeg) || 1, 1, Math.max(1, nextRelay.legs || 1));
      }, "Select relay leg");
    }
  },

  previewRelaySettingsFromVariationPanel(relayField, relayLegName) {
    const state = this.store.snapshot();
    const courseId = state.ui.selectedCourseId;
    if (!courseId || courseId === "all") return;
    const course = getCourse(state.eventModel, courseId);
    if (!course) return;
    course.relay = normalizedRelaySettings(course.relay);
    applyRelayInputToSettings(course.relay, relayField, relayLegName);
    state.eventModel.dirty = true;
    this.refreshRelayAssignmentPreview(state.eventModel, course.id);
  },

  refreshRelayAssignmentPreview(eventModel, courseId) {
    const container = this.querySelector(".relay-assignment-preview");
    if (!container) return;
    container.innerHTML = this.relayAssignmentListTable(relayAssignments(eventModel, courseId));
  },

  addVariationFromPanel() {
    const state = this.store.snapshot();
    const courseId = state.ui.selectedCourseId;
    if (!courseId || courseId === "all") return;
    const course = getCourse(state.eventModel, courseId);
    if (course?.kind === "team") {
      this.store.updateUi(ui => { ui.status = this.t("Variations cannot be added to team courses."); }, "Add variation");
      return;
    }
    const anchor = variationAnchorCourseControl(state.eventModel, courseId, state.ui);
    if (!anchor) {
      this.store.updateUi(ui => {
        ui.status = this.t("Select a start or control in the ordering below, then add a variation.");
      }, "Add variation");
      return;
    }
    this.store.updateEvent(model => {
      const pending = addVariationAtCourseControl(model, courseId, anchor.id, {
        kind: "fork",
        branches: state.ui.variationAddBranches || 2
      });
      model.metadata.pendingVariation = pending;
    }, "Add variation");
    const pending = this.store.snapshot().eventModel.metadata.pendingVariation;
    this.store.updateUi(ui => {
      if (pending?.branchCourseControl) {
        ui.variationBranch = {
          forkCourseControl: pending.forkCourseControl,
          branchCourseControl: pending.branchCourseControl
        };
        ui.variationAnchorCourseControl = pending.forkCourseControl;
        ui.variationInsertAfterCourseControl = pending.branchCourseControl || null;
        ui.variationInsertBeforeCourseControl = null;
        ui.variationSelectedSegment = pending.branchCourseControl ? `node:${pending.branchCourseControl}` : "";
        ui.variationMode = "all";
        ui.selection = pending.control ? { type: "control", id: pending.control, courseControl: pending.branchCourseControl || null } : ui.selection;
        ui.status = this.t("Variation added. The first branch is selected; add controls or choose another branch.");
      }
      else {
        ui.status = this.t("Could not add variation here.");
      }
    }, "Add variation");
  },

  addParallelVariationBranch() {
    const state = this.store.snapshot();
    const courseId = state.ui.selectedCourseId;
    if (!courseId || courseId === "all") return;
    const selectedBranch = normalizedVariationBranch(state.eventModel, courseId, state.ui.variationBranch);
    const fork = selectedBranch ? getCourseControl(state.eventModel, selectedBranch.forkCourseControl) : null;
    if (!selectedBranch) {
      this.store.updateUi(ui => {
        ui.status = this.t("Select a branch first.");
      }, "Add parallel branch");
      return;
    }
    if ((fork?.variationCourseControls || []).length >= 6) {
      this.store.updateUi(ui => {
        ui.status = this.t("A variation can have at most six branches.");
      }, "Add parallel branch");
      return;
    }
    let pending = null;
    this.store.updateEvent(model => {
      pending = addVariationBranch(model, courseId, selectedBranch);
    }, "Add parallel branch");
    this.store.updateUi(ui => {
      if (pending?.branchCourseControl) {
        ui.variationBranch = {
          forkCourseControl: pending.forkCourseControl,
          branchCourseControl: pending.branchCourseControl
        };
        ui.variationAnchorCourseControl = pending.forkCourseControl;
        ui.variationInsertAfterCourseControl = pending.branchCourseControl || null;
        ui.variationInsertBeforeCourseControl = null;
        ui.variationSelectedSegment = pending.branchCourseControl ? `node:${pending.branchCourseControl}` : "";
        ui.variationMode = "all";
        ui.selection = pending.control ? { type: "control", id: pending.control, courseControl: pending.branchCourseControl || null } : ui.selection;
        ui.status = this.t("Parallel branch added. Add controls to the new branch.");
      }
      else {
        ui.status = this.t("Could not add a parallel branch here.");
      }
    }, "Add parallel branch");
  },

  deleteSelectedVariationBranch() {
    const state = this.store.snapshot();
    const courseId = state.ui.selectedCourseId;
    if (!courseId || courseId === "all") return;
    const selectedBranch = normalizedVariationBranch(state.eventModel, courseId, state.ui.variationBranch);
    const fork = selectedBranch ? getCourseControl(state.eventModel, selectedBranch.forkCourseControl) : null;
    if (!selectedBranch) {
      this.store.updateUi(ui => {
        ui.status = this.t("Select a branch first.");
      }, "Delete variation branch");
      return;
    }
    if ((fork?.variationCourseControls || []).length <= 1) {
      this.store.updateUi(ui => {
        ui.status = this.t("This variation has no other branch to keep.");
      }, "Delete variation branch");
      return;
    }
    const previousBranchCodes = variationBranchCodeMap(state.eventModel, courseId);
    const previousCourse = getCourse(state.eventModel, courseId);
    const previousRelayBranches = previousCourse?.relay?.branches || [];
    const previousRelayLegs = previousCourse?.relay?.legs || Infinity;
    let removed = false;
    this.store.updateEvent(model => {
      removed = removeVariationBranch(model, courseId, selectedBranch);
      if (removed) {
        const course = getCourse(model, courseId);
        if (course?.relay?.branches) {
          const nextBranchCodes = variationBranchCodeMap(model, courseId);
          course.relay.branches = [...nextBranchCodes.entries()].flatMap(([branchId, nextCode]) => {
            const previousCode = previousBranchCodes.get(Number(branchId));
            const legs = relayBranchAllowedLegs(previousRelayBranches, previousCode, previousRelayLegs);
            return legs.length ? [{ branch: nextCode, legs }] : [];
          });
        }
      }
    }, "Delete variation branch");
    this.store.updateUi(ui => {
      ui.variationBranch = null;
      ui.variationInsertAfterCourseControl = null;
      ui.variationInsertBeforeCourseControl = null;
      ui.variationSelectedSegment = "";
      ui.variationMode = "all";
      ui.status = removed
        ? this.t("Branch deleted.")
        : this.t("Could not delete this branch.");
    }, "Delete variation branch");
  },

  async openIscdSymbolPicker(controlId, box, selectedValue = "") {
    try {
      await ensureIscdSymbolDb();
    }
    catch (error) {
      debugError("control-symbols.picker.failed", { message: error?.message || String(error), stack: error?.stack || "" });
      this.store.updateUi(ui => {
        ui.status = this.t("Could not load control symbols.");
      }, "Control symbols unavailable");
      return;
    }
    const columnLabel = this.t(ISCD_COLUMNS.find(([id]) => id === box)?.[1] || box);
    this.openCommandDialog({
      title: `${box}: ${columnLabel}`,
      body: this.iscdSymbolPickerHtml(controlId, box, selectedValue),
      showActions: false,
      onOpen: dialog => this.paintIscdCanvases(dialog),
      apply: () => true
    });
  },

  iscdSymbolPickerHtml(controlId, box, selectedValue = "") {
    const language = descriptionLanguageForEvent(this.store.snapshot().eventModel);
    const options = symbolOptionsForColumn(box, language);
    const selectedColumnFText = box === "F" && isColumnFTextValue(selectedValue);
    const seenPreviewKeys = new Set();
    const pickerOptions = options.filter(([value]) => {
      if (box !== "F") return true;
      const key = columnFOptionVisualKey(value);
      if (seenPreviewKeys.has(key)) return false;
      seenPreviewKeys.add(key);
      return true;
    });
    return `
      <div class="iscd-picker-grid">
        ${pickerOptions.map(([value, label]) => {
          const selected = value === selectedValue || (selectedColumnFText && normalizeColumnFText(value) === normalizeColumnFText(selectedValue));
          const previewValue = box === "F" ? columnFOptionDisplayValue(value) : value;
          return `
          <button type="button" class="iscd-picker-option ${selected ? "selected" : ""}" data-iscd-symbol="${escapeAttr(value)}" data-control-id="${controlId}" data-box="${box}" data-symbol-tooltip="${escapeAttr(label === "Not specified" ? this.t(label) : label)}">
            <canvas class="iscd-picker-canvas" width="36" height="36" data-column="${box}" data-symbol="${escapeAttr(previewValue)}"></canvas>
          </button>
        `;
        }).join("")}
      </div>
    `;
  },

  applyIscdSymbolSelection(controlId, box, value) {
    const storage = storageForIscdSelection(box, value);
    this.store.updateEvent(model => {
      const control = getControl(model, controlId);
      updateControlDescription(control, box, storage.ref, storage.text);
    }, "Change description symbol");
    this.store.updateUi(ui => {
      ui.selection = { type: "control", id: Number(controlId) };
    }, "Select control");
  },

  paintIscdCanvases(root = this) {
    for (const canvas of root.querySelectorAll(".iscd-symbol-canvas, .iscd-picker-canvas")) {
      const ctx = canvas.getContext("2d");
      const width = canvas.width || 28;
      const height = canvas.height || 28;
      ctx.clearRect(0, 0, width, height);
      const column = canvas.dataset.column;
      const symbol = canvas.dataset.symbol;
      if (!symbol) continue;
      ctx.strokeStyle = "#111827";
      ctx.fillStyle = "#111827";
      drawIscdSymbol(ctx, column, symbol, width / 2, height / 2, Math.min(width, height) * 0.28);
    }
  },

  scheduleSymbolTooltip(event) {
    const target = event.target.closest("[data-symbol-tooltip]");
    if (!target) return;
    this.hideSymbolTooltip();
    this.symbolTooltipTimer = window.setTimeout(() => {
      const tooltip = this.querySelector("#symbolTooltip");
      const rect = target.getBoundingClientRect();
      tooltip.textContent = target.dataset.symbolTooltip || "";
      tooltip.style.left = `${Math.min(window.innerWidth - 240, rect.left)}px`;
      tooltip.style.top = `${rect.bottom + 8}px`;
      tooltip.hidden = false;
    }, 2000);
  },

  hideSymbolTooltip(event = null) {
    if (event) {
      const from = event.target.closest("[data-symbol-tooltip]");
      const to = event.relatedTarget?.closest?.("[data-symbol-tooltip]");
      if (from && from === to) return;
    }
    if (this.symbolTooltipTimer) {
      window.clearTimeout(this.symbolTooltipTimer);
      this.symbolTooltipTimer = null;
    }
    const tooltip = this.querySelector("#symbolTooltip");
    if (tooltip) {
      tooltip.hidden = true;
    }
  }

  };
}

function rawRelayLegCount(course) {
  return Math.max(0, Math.round(Number(course?.relay?.legs) || 0));
}

function relayLegCountSelected(course) {
  return rawRelayLegCount(course) > 0;
}

function captureVariationScrollState(panel) {
  if (!panel) return null;
  const scrollArea = panel.querySelector(".variation-scroll-area");
  const tree = panel.querySelector(".variation-tree");
  return {
    scrollAreaTop: scrollArea?.scrollTop || 0,
    scrollAreaLeft: scrollArea?.scrollLeft || 0,
    treeTop: tree?.scrollTop || 0,
    treeLeft: tree?.scrollLeft || 0,
    treeOffsetTop: tree?.offsetTop || 0
  };
}

function restoreVariationScrollState(panel, state) {
  if (!panel || !state) return;
  const restore = () => {
    const scrollArea = panel.querySelector(".variation-scroll-area");
    const tree = panel.querySelector(".variation-tree");
    if (scrollArea) {
      const treeOffsetDelta = tree ? tree.offsetTop - state.treeOffsetTop : 0;
      scrollArea.scrollTop = state.scrollAreaTop + treeOffsetDelta;
      scrollArea.scrollLeft = state.scrollAreaLeft;
    }
    if (tree) {
      tree.scrollTop = state.treeTop;
      tree.scrollLeft = state.treeLeft;
    }
  };
  restore();
  if (typeof window !== "undefined" && window.requestAnimationFrame) {
    window.requestAnimationFrame(restore);
  }
}
