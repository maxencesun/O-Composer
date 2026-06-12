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
  renderVariation({ eventModel, ui }) {
    const panel = this.querySelector("#variationPanel");
    panel.innerHTML = this.variationPanelHtml(eventModel, ui);
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
    const anchorCourseControl = variationAnchorCourseControl(eventModel, course.id, ui);
    const canAddVariation = canAddVariationAtCourseControl(eventModel, course, anchorCourseControl);
    const selectedBranch = normalizedVariationBranch(eventModel, course.id, ui.variationBranch);
    const selectedBranchCode = selectedBranch ? branchCodes.get(Number(selectedBranch.branchCourseControl)) || "" : "";
    const anchorControl = getControl(eventModel, anchorCourseControl?.control);
    const topologyHtml = this.variationTopologySvg(eventModel, course.id, ui, branchCodes);
    return `
      <div class="variation-actions">
        <label>${escapeHtml(this.t("Type"))}
          <select data-variation-add-kind>
            <option value="fork" ${(ui.variationAddKind || "fork") === "fork" ? "selected" : ""}>${escapeHtml(this.t("Fork"))}</option>
            <option value="loop" ${ui.variationAddKind === "loop" ? "selected" : ""}>${escapeHtml(this.t("Loop"))}</option>
          </select>
        </label>
        <label>${escapeHtml(this.t("Branches"))}
          <input data-variation-add-branches type="number" min="2" max="6" value="${Math.max(2, Math.min(6, Number(ui.variationAddBranches) || 2))}">
        </label>
        <button type="button" data-add-variation ${canAddVariation ? "" : "disabled"}>${iconSvg("plus")} ${escapeHtml(this.t("Add Variation"))}</button>
      </div>
      <p class="muted">${canAddVariation && anchorCourseControl && anchorControl
        ? escapeHtml(this.t("Variation will start at {control}.", { control: controlDisplayName(anchorControl) }))
        : escapeHtml(this.t("Select a non-finish control that has a following control, then add a variation."))}</p>
      ${selectedBranch ? `<p class="variation-branch-hint">${escapeHtml(this.t("Selected branch"))}: <strong>${escapeHtml(selectedBranchCode || controlDisplayName(getControl(eventModel, getCourseControl(eventModel, selectedBranch.branchCourseControl)?.control)))}</strong>. ${escapeHtml(this.t("New controls will be inserted on this branch."))}</p>` : ""}
      <p class="muted">${escapeHtml(this.t("Click the stem before a fork to insert before the branch block; click a branch edge or branch label to insert on that branch; click the join checkpoint or an outgoing edge to insert after the branch block."))}</p>
      <div class="variation-tree">${topologyHtml || `<p class="muted">${escapeHtml(this.t("This course has no controls."))}</p>`}</div>
      ${variations.length ? `
        <h3>${escapeHtml(this.t("All variations"))}</h3>
        <div class="variation-code-list">${variations.map(variation => `<button type="button" data-course-variation-code-select="${escapeAttr(variation.code)}">${escapeHtml(variation.code)}</button>`).join("")}</div>
      ` : `<p class="muted">${escapeHtml(this.t("This course has no variations."))}</p>`}
      ${this.relayAutoAssignmentPanel(eventModel, course, variations)}
    `;
  },

  relayAutoAssignmentPanel(eventModel, course, variations) {
    const relay = normalizedRelaySettings(course.relay);
    const recommendedSizeOptions = relayTeamSizeOptions(eventModel, course.id);
    const sizeOptions = uniqueNumbers([relay.legs, ...recommendedSizeOptions]).sort((a, b) => a - b);
    const selectedLegs = relay.legs;
    const assignments = relayAssignments(eventModel, course.id);
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
            <label>${escapeHtml(this.t("Participants per team"))}
              <select data-relay-settings-field="legs">
                ${sizeOptions.map(value => `<option value="${value}" ${value === selectedLegs ? "selected" : ""}>${value}</option>`).join("")}
              </select>
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
        ` : `<p class="muted">${escapeHtml(this.t("Add a fork or loop to this course to create relay variations."))}</p>`}
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
    const paths = [];
    const priorityHits = [];
    const junctions = [];
    const labels = [];
    const nodes = [];
    for (let index = 0; index < topology.length; index += 1) {
      const view = topology[index];
      const position = layout.positions[index];
      if (!position) continue;
      const commonJoinPoint = commonJoinPoints.get(index) || null;
      if (view.variation !== "loop" && (view.legTo || []).length > 1 && position.forkStart?.some(Boolean)) {
        const forkY = position.forkStart.find(Boolean)?.y;
        const forkOwnerCourseControlId = topologyNodeCourseControlId(view);
        junctions.push(`<circle class="variation-topology-junction-hit" cx="${formatSvgNumber(position.x)}" cy="${formatSvgNumber(forkY)}" r="22" data-select-variation-course-control="${forkOwnerCourseControlId}"></circle>`);
        const stemStartY = position.y + topologyConnectionRadius(view.control, nodeRadius);
        const stemPath = `M ${formatSvgNumber(position.x)} ${formatSvgNumber(stemStartY)} V ${formatSvgNumber(forkY)}`;
        paths.push(topologyPathSvg(stemPath, {
          insertAfterCourseControl: forkOwnerCourseControlId,
          segmentKey: `stem:${index}`,
          selected: ui.variationSelectedSegment === `stem:${index}`
        }));
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
        const forkStart = position.forkStart?.[legIndex] || null;
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
        const joinTarget = edgeBranch && Number(view.legTo[legIndex]) === Number(edgeBranch.joinIndex);
        if (joinTarget && edgeBranch && topology[edgeBranch.forkIndex]?.variation === "loop") {
          const ownerPosition = layout.positions[edgeBranch.forkIndex];
          const ownerView = topology[edgeBranch.forkIndex];
          const ownerRadius = topologyConnectionRadius(ownerView?.control, nodeRadius);
          const loopBottom = ownerPosition?.loopBottom || (Math.max(position.y, targetPosition.y) + TOPOLOGY_HEIGHT_UNIT * 0.75);
          const path = forkStart && topologyBranchIsEmpty(view, legIndex)
            ? topologyEmptyLoopBranchPath(ownerPosition, forkStart, loopBottom, ownerRadius)
            : topologyLoopReturnPath(position, ownerPosition, loopBottom, startRadius, ownerRadius);
          paths.push(topologyPathSvg(path, { insertAfterCourseControl, insertBeforeCourseControl, branchAttrs, segmentKey, selected }));
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
          paths.push(topologyPathSvg(path, { insertAfterCourseControl, insertBeforeCourseControl, branchAttrs, segmentKey, selected }));
        }
        else if (joinTarget && forkStart && topologyBranchIsEmpty(view, legIndex)) {
          const joinPoint = commonJoinPoint || topologyEmptyBranchJoinPoint(forkStart, targetPosition, endRadius);
          const path = topologyEmptyBranchPath(position, forkStart, joinPoint);
          paths.push(topologyPathSvg(path, { insertAfterCourseControl, insertBeforeCourseControl, branchAttrs, segmentKey, selected }));
        }
        else {
          const path = topologyLegPath(position, targetPosition, forkStart, startRadius, endRadius, !!edgeBranch);
          paths.push(topologyPathSvg(path, { insertAfterCourseControl, insertBeforeCourseControl, branchAttrs, segmentKey, selected }));
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
            paths.push(topologyPathSvg(preJoinPath, {
              insertBeforeCourseControl: joinCourseControlId,
              segmentKey: preJoinSegmentKey,
              selected: ui.variationSelectedSegment === preJoinSegmentKey
            }));
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
    const kindSelect = event.target.closest("[data-variation-add-kind]");
    const branchesInput = event.target.closest("[data-variation-add-branches]");
    const relayField = event.target.closest("[data-relay-settings-field]");
    const relayLegName = event.target.closest("[data-relay-leg-name]");
    if (!kindSelect && !branchesInput && !relayField && !relayLegName) return;
    if (relayField || relayLegName) {
      this.updateRelaySettingsFromVariationPanel(relayField, relayLegName);
      return;
    }
    this.store.updateUi(ui => {
      if (kindSelect) {
        ui.variationAddKind = kindSelect.value === "loop" ? "loop" : "fork";
      }
      if (branchesInput) {
        ui.variationAddBranches = Math.max(2, Math.min(6, Math.round(Number(branchesInput.value) || 2)));
      }
    }, "Variation options");
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
        kind: state.ui.variationAddKind || "fork",
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

  openIscdSymbolPicker(controlId, box, selectedValue = "") {
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
    return `
      <div class="iscd-picker-grid">
        ${options.map(([value, label]) => `
          <button type="button" class="iscd-picker-option ${value === selectedValue ? "selected" : ""}" data-iscd-symbol="${escapeAttr(value)}" data-control-id="${controlId}" data-box="${box}" data-symbol-tooltip="${escapeAttr(label === "Not specified" ? this.t(label) : label)}">
            <canvas class="iscd-picker-canvas" width="36" height="36" data-column="${box}" data-symbol="${escapeAttr(value)}"></canvas>
          </button>
        `).join("")}
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
