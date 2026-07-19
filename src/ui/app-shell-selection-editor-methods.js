import { coursePageCount } from "../domain/course-service.js?v=20260718-78";
import { validatePageBreakFormula } from "../domain/course-pages.js?v=20260718-78";
import { PAGE_PYTHON_SAMPLE } from "../domain/python-page-script.js?v=20260718-78";

function representativeIndexes(length, limit) {
  const count = Math.max(0, Number(length) || 0);
  const max = Math.max(1, Number(limit) || 1);
  if (count <= max) return Array.from({ length: count }, (_value, index) => index);
  return [...new Set(Array.from({ length: max }, (_value, index) =>
    Math.round(index * (count - 1) / Math.max(1, max - 1))))];
}

function representativePointIndexes(route, limit = 6) {
  const controls = route?.controlNumbers || [];
  const branches = route?.pointBranches || [];
  const count = controls.length;
  if (count <= limit) return representativeIndexes(count, limit);
  const candidates = [0, count - 1, 1, count - 2, Math.floor((count - 1) / 2)];
  const seenBranches = new Set();
  branches.forEach((branch, index) => {
    const code = String(branch || "");
    if (code && !seenBranches.has(code)) {
      seenBranches.add(code);
      candidates.push(index);
    }
  });
  for (const index of representativeIndexes(count, limit)) candidates.push(index);
  return [...new Set(candidates)]
    .slice(0, limit)
    .sort((a, b) => a - b);
}

function compactPromptRouteData(routeContexts = []) {
  const routeIndexes = representativeIndexes(routeContexts.length, 3);
  return routeIndexes.map(routeIndex => {
    const route = routeContexts[routeIndex] || {};
    const controls = route.controlNumbers || [];
    const branches = route.pointBranches || [];
    const pointLegs = route.pointAllowedLegs || [];
    const pointIndexes = representativePointIndexes(route);
    return {
      branch_name: String(route.branchName || ""),
      allowed_legs: route.allowedLegs || [],
      length: controls.length,
      representative_points: pointIndexes.map(index => ({
        point: index + 1,
        control_number: String(controls[index] || ""),
        point_branch: String(branches[index] || ""),
        point_allowed_legs: pointLegs[index] || []
      })),
      omitted_points: Math.max(0, controls.length - pointIndexes.length)
    };
  });
}

function formatPromptBranchTree(groups = [], relay = {}, effectiveLegsForBranch = () => []) {
  if (!groups.length) return "";
  const children = new Map();
  for (const group of groups) {
    const parent = group.parentPath?.[group.parentPath.length - 1];
    const key = parent ? `${parent.groupId}:${parent.code}` : "root";
    if (!children.has(key)) children.set(key, []);
    children.get(key).push(group);
  }
  const showLegs = Number(relay?.legs) > 1 || (relay?.branches || []).length > 0;
  const lines = ["course"];
  const maxLines = 30;
  let omitted = 0;
  const push = line => {
    if (lines.length < maxLines) lines.push(line);
    else omitted += 1;
  };
  const renderGroups = (items, prefix) => {
    items.forEach((group, groupIndex) => {
      const groupLast = groupIndex === items.length - 1;
      push(`${prefix}${groupLast ? "└─" : "├─"} ${group.kind || "fork"}@course_control:${group.forkCourseControl}`);
      const groupPrefix = `${prefix}${groupLast ? "   " : "│  "}`;
      (group.codes || []).forEach((rawCode, codeIndex) => {
        const code = String(rawCode || "");
        const branchLast = codeIndex === group.codes.length - 1;
        const legs = showLegs ? effectiveLegsForBranch(code) : [];
        push(`${groupPrefix}${branchLast ? "└─" : "├─"} ${code}${showLegs ? ` [allowed_legs=${JSON.stringify(legs)}]` : ""}`);
        const nested = children.get(`${group.groupId}:${code}`) || [];
        if (nested.length) {
          renderGroups(nested, `${groupPrefix}${branchLast ? "   " : "│  "}`);
        }
      });
    });
  };
  renderGroups(children.get("root") || [], "");
  if (omitted) lines.push(`… (+${omitted} lines)`);
  return lines.join("\n");
}

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
    measurementMetrics,
    formatGroundLength,
    formatPaperLength,
    formatGroundArea,
    formatPaperArea,
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
    relayBranchDisplayLegs,
    relayBranchEffectiveLegs,
    relayBranchGroups,
    relayBranchRestrictionIssues,
    relayBranchParentAllowedLegs,
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
  coursePagePythonExample() {
    return PAGE_PYTHON_SAMPLE;
  },
  coursePageBranchTree(eventModel, course) {
    if (!course || typeof relayBranchGroups !== "function") return "";
    const groups = relayBranchGroups(eventModel, course.id);
    const maxLegs = Math.max(1, Math.round(Number(course.relay?.legs) || 1));
    return formatPromptBranchTree(groups, course.relay || {}, code =>
      relayBranchEffectiveLegs(groups, course.relay?.branches || [], code, maxLegs));
  },
  coursePageAIPrompt(course, routeContexts = [], options = {}) {
    const routeData = compactPromptRouteData(routeContexts);
    const currentCourse = JSON.stringify({
      course_name: String(course?.name || ""),
      course_id: Number(course?.id) || 0,
      route_count: routeContexts.length,
      representative_routes: routeData,
      omitted_routes: Math.max(0, routeContexts.length - routeData.length)
    });
    const branchTree = String(options.branchTree || "").trim();
    const englishBranchTree = branchTree
      ? `\nBranch tree (indentation shows parent/child branches):\n${branchTree}\n`
      : "";
    const chineseBranchTree = branchTree
      ? `\n分支树（缩进表示父子分支）：\n${branchTree}\n`
      : "";
    const english = `Write O-Composer advanced map-page Python for my requirement below. Return only paste-ready Python source, without Markdown or explanation.

Background: O-Composer designs orienteering courses. A map flip turns over the current map; a map exchange collects another map. Either action creates a page boundary after a normal control. Fork/relay courses are expanded into concrete routes, and this function runs independently for each one.

Required entry: def advanced_flip_exchange(course): where course is a types.SimpleNamespace.
Interface types:
- course.length: int — number of normal controls.
- Per-point fields are parallel lists of length course.length, indexed by zero-based i: control_number: list[str]; point_branch: list[str] ("" on shared route); point_allowed_legs: list[list[int]] ([] on shared route); point: list[int] (one-based positions); ordinal: list[int]; course_control: list[int]; control_id: list[int].
- Route fields: branch_name: str (complete branch code, "" for fixed); variation: str (alias); allowed_legs: list[int] ([] means unrestricted/not applicable); course_name: str; course_id: int; team: int; leg: int (team/leg are 0 outside relay context).
- Return type: tuple[list[bool | int], list[bool | int]] named (flip_list, exchange_list). Both lists must have course.length items; integer items may only be 0 or 1.
flip_list[i] flips after point i; exchange_list[i] exchanges after it. Never set both, and do not act after the last point. Standard-library imports are allowed; no third-party/browser/editor APIs; 3-second limit. Standalone exchanges are unsupported here.

Example:
def advanced_flip_exchange(course):
    flip_list = [False] * course.length
    exchange_list = [False] * course.length
    for i, code in enumerate(course.control_number):
        if i >= course.length - 1:
            continue
        if str(code) == "32" and course.point_branch[i] == "A":
            flip_list[i] = True
        elif course.branch_name == "ABCD" and course.point[i] == 6:
            exchange_list[i] = True
    return flip_list, exchange_list

Representative current data only (omitted counts mean other routes/points exist):
${currentCourse}
${englishBranchTree}

My requirement:
[Add the desired flip/exchange rules here]`;
    if (this.language !== "zh") return english;
    return `请根据末尾需求编写 O-Composer 高级翻图/换图 Python。只返回可直接粘贴的 Python 源码，不要 Markdown 和解释。

背景：O-Composer 用于设计定向越野线路。“翻图”是在检查点后翻到当前地图背面，“换图”是在检查点后领取另一张地图，两者都会形成页面边界。分支/接力线路会先展开为具体线路，本函数对每条具体线路独立运行一次。

入口必须是 def advanced_flip_exchange(course):，其中 course 的类型是 types.SimpleNamespace。
接口类型：
- course.length: int — 普通检查点数量。
- 以下逐点字段都是长度为 course.length 的平行列表，使用从 0 开始的索引 i：control_number: list[str]；point_branch: list[str]（共用主线为 ""）；point_allowed_legs: list[list[int]]（共用主线为 []）；point: list[int]（值从 1 开始）；ordinal: list[int]；course_control: list[int]；control_id: list[int]。
- 线路字段：branch_name: str（完整分支名，固定线路为 ""）；variation: str（别名）；allowed_legs: list[int]（[] 表示无限制或不适用）；course_name: str；course_id: int；team: int；leg: int（非接力上下文中 team/leg 为 0）。
- 返回类型：tuple[list[bool | int], list[bool | int]]，即 (flip_list, exchange_list)。两个列表长度必须为 course.length；整数元素只能是 0 或 1。
flip_list[i] 表示该点后翻图，exchange_list[i] 表示该点后换图。同一点不能同时命中，最后一点后不要产生动作。可用标准库，不可用第三方包、浏览器或编辑器 API，限时 3 秒；这里不能创建独立换图点。

例子：
def advanced_flip_exchange(course):
    flip_list = [False] * course.length
    exchange_list = [False] * course.length
    for i, code in enumerate(course.control_number):
        if i >= course.length - 1:
            continue
        if str(code) == "32" and course.point_branch[i] == "A":
            flip_list[i] = True
        elif course.branch_name == "ABCD" and course.point[i] == 6:
            exchange_list[i] = True
    return flip_list, exchange_list

当前数据仅提供代表性抽样（omitted 计数表示还有其他线路或检查点）：
${currentCourse}
${chineseBranchTree}

我的具体需求：
[在这里补充希望在哪些条件下翻图或换图]`;
  },
  renderSelection({ eventModel, ui }) {
    const panel = this.querySelector("#selectionPanel");
    const selection = ui.selection;
    if (ui.variationAdjustmentMode === "relay-auto") {
      panel.innerHTML = this.variationRelayAutoAdjustmentEditor(eventModel, ui);
      return;
    }
    if (ui.variationBranch) {
      panel.innerHTML = this.variationBranchAdjustmentEditor(eventModel, ui);
      return;
    }
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

  variationBranchAdjustmentEditor(eventModel, ui) {
    const courseId = ui.selectedCourseId;
    const course = courseId && courseId !== "all" ? getCourse(eventModel, courseId) : null;
    if (!course) return `<p class="muted">${escapeHtml(this.t("No item selected."))}</p>`;
    const selectedBranch = normalizedVariationBranch(eventModel, course.id, ui.variationBranch);
    const branchCodes = variationBranchCodeMap(eventModel, course.id);
    const selectedBranchCode = selectedBranch ? branchCodes.get(Number(selectedBranch.branchCourseControl)) || "" : "";
    if (!selectedBranch || !selectedBranchCode) {
      return `<p class="muted">${escapeHtml(this.t("No item selected."))}</p>`;
    }
    const assignments = relayAssignments(eventModel, course.id);
    return `
      <p class="variation-branch-hint">${escapeHtml(this.t("Selected branch"))}: <strong>${escapeHtml(selectedBranchCode)}</strong></p>
      ${this.variationBranchLegEditor(course, assignments, selectedBranch, selectedBranchCode)}
    `;
  },

  variationRelayAutoAdjustmentEditor(eventModel, ui) {
    const courseId = ui.selectedCourseId;
    const course = courseId && courseId !== "all" ? getCourse(eventModel, courseId) : null;
    if (!course) return `<p class="muted">${escapeHtml(this.t("Select a course first."))}</p>`;
    const variations = allCourseVariations(eventModel, course.id);
    return this.relayAutoAssignmentPanel(eventModel, course, variations);
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
    const omap = ui.omap;
    if (!background && !omap) {
      return `<p class="muted">${escapeHtml(this.t("No item selected."))}</p>`;
    }
    const mapScale = positiveScale(eventModel.event?.map?.scale) || 15000;
    const movingBackground = ui.tool === "background-move";
    const moveButtonLabel = movingBackground ? this.t("Finish moving background") : this.t("Move background");
    if (!background && omap) {
      const sourceFormat = omap.sourceKind === "ocd" ? "OCAD (.ocd)" : "OpenOrienteering Mapper (.omap/.xmap)";
      const sourceName = omap.sourceFileName || omap.name || "";
      return `
        <div class="map-info-panel">
          <h2>${escapeHtml(this.t("Map"))}</h2>
          <div class="readonly-field"><span>${escapeHtml(this.t("File"))}</span><strong>${escapeHtml(sourceName)}</strong></div>
          <div class="readonly-field"><span>${escapeHtml(this.t("Format"))}</span><strong>${escapeHtml(sourceFormat)}</strong></div>
          <div class="readonly-field"><span>${escapeHtml(this.t("Objects"))}</span><strong>${Math.max(0, Number(omap.objectCount) || 0)}</strong></div>
          <div class="readonly-field"><span>${escapeHtml(this.t("Symbols"))}</span><strong>${Math.max(0, Number(omap.symbolCount) || 0)}</strong></div>
          <div class="form-grid">
            <label class="span-2">${escapeHtml(this.t("Scale"))} <input data-background-field="mapScale" type="number" min="1" step="1" value="${mapScale}"></label>
          </div>
          <button type="button" class="${movingBackground ? "primary" : "secondary"}" data-background-move>${escapeHtml(moveButtonLabel)}</button>
          <p class="muted">${escapeHtml(this.t("Drag on the canvas to move the background without moving course objects."))}</p>
        </div>
      `;
    }
    const width = positiveNumber(background.widthMeters, 0);
    const height = positiveNumber(background.heightMeters, 0);
    const aspect = backgroundAspect(background);
    const printedWidth = width ? width / mapScale * 100 : 0;
    const measured = backgroundCalibrationDistance(background);
    const calibrationPointCount = background.calibration?.imagePoints?.length || background.calibration?.points?.length || 0;
    const calibrationHint = calibrationPointCount === 1
      ? this.t("Point 1 selected. Click point 2.")
      : measured
        ? `${this.t("Selected line")}: ${formatDecimal(measured)} m · ${this.t("Drag point 1 or 2 to refine the reference line.")}`
        : this.t("Click two points on the map, then enter their real distance.");
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
        <button type="button" class="${movingBackground ? "primary" : "secondary"}" data-background-move>${escapeHtml(moveButtonLabel)}</button>
        <button type="button" class="secondary" data-background-calibrate>${escapeHtml(this.t("Calibrate with two points"))}</button>
        <p class="muted">${escapeHtml(this.t("Drag on the canvas to move the background without moving course objects."))}</p>
        <p class="muted" data-background-measured>${escapeHtml(calibrationHint)}</p>
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
        <label>${escapeHtml(this.t("Code"))} <input data-field="control.code" value="${escapeAttr(control.code || "")}" ${!["normal", "start", "finish"].includes(control.kind) ? "disabled" : ""}></label>
        <label>X <input data-field="control.location.x" type="number" step="0.1" value="${control.location.x}"></label>
        <label>Y <input data-field="control.location.y" type="number" step="0.1" value="${control.location.y}"></label>
        ${control.kind === "crossing-point" ? `<label class="span-2">${escapeHtml(this.t("Rotation angle (°)"))} <input data-field="control.orientation" type="number" min="0" max="359.9" step="0.1" value="${Math.round(((Number(control.orientation) || 0) % 360 + 360) % 360 * 10) / 10}"></label>` : ""}
        <label>${escapeHtml(this.t("Before"))} <input data-field="control.descTextBefore" value="${escapeAttr(control.descTextBefore || "")}"></label>
        <label>${escapeHtml(this.t("After"))} <input data-field="control.descTextAfter" value="${escapeAttr(control.descTextAfter || "")}"></label>
      </div>
      ${scoreFinishControl}
      ${teamControl}
      <h3>${escapeHtml(this.t("Descriptions"))}</h3>
      <div class="description-edit">
        ${ISCD_COLUMNS.map(([box, label]) => {
          const description = descriptions.get(box) || {};
          const selectedValue = box === "F" ? columnFDescriptionPickerValue(description) : description.ref || description.text || "";
          const displayValue = box === "F" ? columnFDescriptionDisplayValue(description) : selectedValue;
          const isColumnFText = box === "F" && isColumnFTextValue(displayValue);
          return `
            <label>${box}
              <select data-description-box="${box}" data-description-part="ref" title="${escapeAttr(this.t(label))}">
                ${symbolOptionsForColumn(box, language).map(([value, optionText]) => {
                  const selected = value === selectedValue || (isColumnFText && normalizeColumnFText(value) === normalizeColumnFText(selectedValue));
                  return `<option value="${escapeAttr(value)}" ${selected ? "selected" : ""}>${escapeHtml(optionText === "Not specified" ? this.t(optionText) : optionText)}</option>`;
                }).join("")}
              </select>
              ${isColumnFText ? `<input data-description-text-box="F" class="column-f-text-input" value="${escapeAttr(normalizeColumnFText(displayValue))}" inputmode="decimal">` : ""}
            </label>`;
        }).join("")}
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
    if (!course || !["score", "military"].includes(course.kind)) {
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
    `;
  },

  courseEditor(course) {
    const eventModel = this.store.snapshot().eventModel;
    const finishRoute = finishRouteForCourse(eventModel, course.id);
    const relay = course.relay || { firstTeam: 1, teams: 0, legs: 0, branches: [] };
    const assignments = relayAssignments(eventModel, course.id);
    const relaySizeOptions = relayTeamSizeOptions(eventModel, course.id);
    const relayLegs = rawRelayLegCount(course);
    const relayLegOptions = uniqueNumbers([
      ...relaySizeOptions,
      relayLegs
    ].filter(value => Number(value) > 0)).sort((a, b) => a - b);
    const relayLegsLocked = relayLegs > 0 && assignments.variations.length > 0;
    return `
      <div class="form-grid">
        <label>${escapeHtml(this.t("Name"))} <input data-field="course.name" value="${escapeAttr(course.name)}"></label>
        <label>${escapeHtml(this.t("Kind"))} <select data-field="course.kind"><option value="normal" ${course.kind === "normal" ? "selected" : ""}>${escapeHtml(this.t("normal"))}</option><option value="score" ${course.kind === "score" ? "selected" : ""}>${escapeHtml(this.t("score"))}</option><option value="military" ${course.kind === "military" ? "selected" : ""}>${escapeHtml(this.t("Military orienteering"))}</option><option value="team" ${course.kind === "team" ? "selected" : ""}>${escapeHtml(this.t("team"))}</option></select></label>
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
      ${course.kind === "team" ? "" : `
        <h3>${escapeHtml(this.t("Relay"))}</h3>
        <div class="form-grid">
          <label>${escapeHtml(this.t("Legs"))}
            <select data-field="course.relay.legs" ${relayLegsLocked ? "disabled" : ""}>
              <option value="" ${relayLegs ? "" : "selected"}>-</option>
              ${relayLegOptions.map(value => `<option value="${value}" ${value === relayLegs ? "selected" : ""}>${value}</option>`).join("")}
            </select>
          </label>
          <label>${escapeHtml(this.t("Teams"))} <input data-field="course.relay.teams" type="number" min="0" value="${relay.teams || 0}"></label>
          <label>${escapeHtml(this.t("First team"))} <input data-field="course.relay.firstTeam" type="number" min="1" value="${relay.firstTeam || 1}"></label>
          <label class="check"><input data-field="course.hideVariationsOnMap" type="checkbox" ${course.hideVariationsOnMap ? "checked" : ""}> ${escapeHtml(this.t("Hide variation codes on map"))}</label>
        </div>
        ${relayLegs ? `
          ${this.relayBranchEditor(course, assignments)}
          ${this.relayAssignmentTable(assignments)}
        ` : ""}
      `}
    `;
  },

  coursePageEditor(eventModel, course) {
    if (course.kind !== "normal") return "";
    const hasVariations = courseHasVariations(eventModel, course.id);
    if (!hasVariations) {
      const rows = courseView(eventModel, course.id, { page: "global" });
      let point = 0;
      const pointRows = [];
      const configuredActions = [];
      let previousPoint = null;
      rows.forEach((row, rowIndex) => {
        if (row.control?.kind === "normal" && row.courseControl) {
          point += 1;
          const item = {
            row,
            point,
            canStartNextPage: rowIndex < rows.length - 1,
            action: row.courseControl.mapFlip ? "flip" : row.courseControl.mapExchange ? "exchange" : "",
            standaloneAfter: false,
            standalone: false
          };
          pointRows.push(item);
          if (item.action) configuredActions.push(item);
          previousPoint = item;
          return;
        }
        if (row.control?.kind === "map-exchange" && row.courseControl) {
          if (previousPoint) previousPoint.standaloneAfter = true;
          configuredActions.push({
            row,
            point: previousPoint?.point || 0,
            anchor: previousPoint,
            action: "standalone-exchange",
            standalone: true
          });
        }
      });
      const availablePoints = pointRows.filter(item => !item.action && !item.standaloneAfter && item.canStartNextPage);
      const formula = String(course.pageBreakFormula || "").trim();
      const addFormId = `course-page-action-add-${course.id}`;
      return `
        <h3>${escapeHtml(this.t("Map pages"))}</h3>
        <div class="course-page-action-manager">
          ${configuredActions.length ? `
            <div class="course-page-action-list" role="group" aria-label="${escapeAttr(this.t("Configured map actions"))}">
              ${configuredActions.map(({ row, point, action, standalone, anchor }) => {
                const pointLabel = this.t("Point {point}: {code}", {
                  point,
                  code: (anchor?.row || row).control.code || (anchor?.row || row).ordinal || point
                });
                if (standalone) {
                  return `
                    <div class="course-page-action-row">
                      <select disabled aria-label="${escapeAttr(this.t("Control for map action"))}"><option>${escapeHtml(this.t("Standalone map exchange"))}</option></select>
                      <select disabled aria-label="${escapeAttr(this.t("Map action type"))}"><option>${escapeHtml(this.t("Standalone map exchange"))}</option></select>
                      <button type="button" class="course-page-action-remove" data-course-page-remove-standalone="${row.courseControl.id}" title="${escapeAttr(this.t("Remove standalone map exchange"))}" aria-label="${escapeAttr(this.t("Remove standalone map exchange"))}">×</button>
                    </div>
                  `;
                }
                const pointOptions = pointRows.filter(item =>
                  Number(item.row.courseControl.id) === Number(row.courseControl.id)
                  || (!item.action && !item.standaloneAfter && item.canStartNextPage));
                return `
                  <div class="course-page-action-row">
                    <select data-course-page-move="${row.courseControl.id}" aria-label="${escapeAttr(this.t("Control for map action"))}" ${pointOptions.length > 1 ? "" : "disabled"}>
                      ${pointOptions.map(item => {
                        const label = this.t("Point {point}: {code}", {
                          point: item.point,
                          code: item.row.control.code || item.row.ordinal || item.point
                        });
                        return `<option value="${item.row.courseControl.id}" ${Number(item.row.courseControl.id) === Number(row.courseControl.id) ? "selected" : ""}>${escapeHtml(label)}</option>`;
                      }).join("")}
                    </select>
                    <select data-course-page-break="${row.courseControl.id}" aria-label="${escapeAttr(this.t("Page action after {point}", { point: pointLabel }))}">
                      <option value="exchange" ${action === "exchange" ? "selected" : ""}>${escapeHtml(this.t("Map exchange"))}</option>
                      <option value="flip" ${action === "flip" ? "selected" : ""}>${escapeHtml(this.t("Map flip"))}</option>
                    </select>
                    <button type="button" class="course-page-action-remove" data-course-page-remove="${row.courseControl.id}" title="${escapeAttr(this.t("Remove map action"))}" aria-label="${escapeAttr(this.t("Remove map action after {point}", { point: pointLabel }))}">×</button>
                  </div>
                `;
              }).join("")}
            </div>
          ` : `<p class="muted course-page-action-empty">${escapeHtml(this.t("No map actions configured."))}</p>`}
          <button type="button" class="course-page-action-add-toggle" data-course-page-add-toggle aria-expanded="false" aria-controls="${escapeAttr(addFormId)}" ${availablePoints.length ? "" : "disabled"}>${escapeHtml(this.t("Add map action"))}</button>
          ${availablePoints.length ? `
            <div id="${escapeAttr(addFormId)}" class="course-page-action-add-form" data-course-page-add-form hidden>
              <label>${escapeHtml(this.t("Control"))}
                <select data-course-page-add-point>
                  ${availablePoints.map(({ row, point }) => {
                    const pointLabel = this.t("Point {point}: {code}", {
                      point,
                      code: row.control.code || row.ordinal || point
                    });
                    return `<option value="${row.courseControl.id}">${escapeHtml(pointLabel)}</option>`;
                  }).join("")}
                </select>
              </label>
              <label>${escapeHtml(this.t("Type"))}
                <select data-course-page-add-kind>
                  <option value="exchange">${escapeHtml(this.t("Map exchange"))}</option>
                  <option value="flip">${escapeHtml(this.t("Map flip"))}</option>
                  <option value="standalone-exchange">${escapeHtml(this.t("Standalone map exchange"))}</option>
                </select>
              </label>
              <div class="course-page-action-add-buttons">
                <button type="button" data-course-page-add>${escapeHtml(this.t("Add"))}</button>
                <button type="button" class="secondary" data-course-page-add-cancel>${escapeHtml(this.t("Cancel"))}</button>
              </div>
            </div>
          ` : ""}
        </div>
        <p class="muted">${escapeHtml(this.t("Map exchange and map flip happen at the selected control. Standalone map exchange converts the selected control at its current location and does not add another course point."))}</p>
        <p class="muted">${escapeHtml(this.t("The boundary point appears on both pages. The next page starts with the IOF continuing-point symbol."))}</p>
        ${formula ? `<p class="page-formula-warning">${escapeHtml(this.t("Advanced page code is active. Adding, changing, moving, or removing a point action clears the code."))}</p>` : ""}
        ${this.advancedCoursePageEditor(eventModel, course, { hasVariations: false })}
      `;
    }

    return this.advancedCoursePageEditor(eventModel, course, { hasVariations: true });
  },

  advancedCoursePageEditor(eventModel, course, { hasVariations = courseHasVariations(eventModel, course.id) } = {}) {
    const formula = String(course.pageBreakFormula || "");
    const syntaxError = validatePageBreakFormula(formula);
    const pythonScript = /^\s*def\s+advanced_flip_exchange\s*\(/m.test(formula);
    const variations = hasVariations ? allCourseVariations(eventModel, course.id) : [];
    const fixedBreakCount = new Set(courseView(eventModel, course.id, { allBranches: true })
      .filter(row => row.control?.kind === "normal" && (row.courseControl?.mapExchange || row.courseControl?.mapFlip))
      .map(row => Number(row.courseControl.id)))
      .size;
    const routeContexts = (hasVariations
      ? variations.slice(0, 12)
      : [{ code: "", choices: [] }])
      .map(variation => {
        const rows = courseView(eventModel, course.id, {
          variationChoices: variation.choices,
          variationCode: variation.code,
          page: "global"
        });
        const points = rows
          .filter(row => row.control?.kind === "normal")
          .map((row, index) => `${index + 1}:${row.control.code || "?"}`);
        return {
          branch: variation.code || this.t("Fixed route"),
          branchName: variation.code || "",
          controlNumbers: rows
            .filter(row => row.control?.kind === "normal")
            .map(row => String(row.control.code || "")),
          pointBranches: rows
            .filter(row => row.control?.kind === "normal")
            .map(row => String(row.pointBranch || "")),
          pointAllowedLegs: rows
            .filter(row => row.control?.kind === "normal")
            .map(row => Array.isArray(row.pointAllowedLegs) ? row.pointAllowedLegs : []),
          allowedLegs: Array.isArray(rows[0]?.routeAllowedLegs) ? rows[0].routeAllowedLegs : [],
          points,
          pageCount: coursePageCount(eventModel, course.id, {
            variationChoices: variation.choices,
            variationCode: variation.code,
            page: "global"
          }),
          error: rows.find(row => row.pageFormulaError)?.pageFormulaError || "",
          pending: rows.some(row => row.pageFormulaPending)
        };
      });
    const error = syntaxError || routeContexts.find(route => route.error)?.error || "";
    const pending = routeContexts.some(route => route.pending);
    const aiPrompt = this.coursePageAIPrompt(course, routeContexts, {
      branchTree: hasVariations ? this.coursePageBranchTree(eventModel, course) : ""
    });
    const preview = !error && !pending && formula.trim()
      ? routeContexts.map(route => `${route.branch}: ${this.t("{count} pages", { count: route.pageCount })}`).join(" · ")
      : "";
    return `
      <h3>${escapeHtml(this.t("Advanced map page Python"))}</h3>
      <div class="form-grid">
        <label class="span-2">${escapeHtml(this.t("Python code"))}
          <textarea class="page-python-editor" data-field="course.pageBreakFormula" rows="16" spellcheck="false" placeholder="${escapeAttr(this.coursePagePythonExample())}">${escapeHtml(formula)}</textarea>
        </label>
      </div>
      <div class="button-row"><button type="button" class="secondary" data-course-page-python-example>${escapeHtml(this.t("Use sample Python code"))}</button></div>
      <div class="page-ai-prompt">
        <div class="page-ai-prompt-intro">
          <p>${escapeHtml(this.t("If you are not sure how to write this code, copy the prompt below, add your requirements, and send it to any AI model. The returned code can be pasted here directly."))}</p>
          <button type="button" class="secondary" data-course-page-copy-ai-prompt>${escapeHtml(this.t("Copy AI prompt"))}</button>
        </div>
        <details>
          <summary>${escapeHtml(this.t("View AI prompt"))}</summary>
          <textarea class="page-ai-prompt-text" data-course-page-ai-prompt rows="14" readonly spellcheck="false" aria-label="${escapeAttr(this.t("AI prompt for advanced map pages"))}">${escapeHtml(aiPrompt)}</textarea>
        </details>
        <p class="page-ai-prompt-status" data-course-page-copy-status aria-live="polite"></p>
      </div>
      ${formula.trim() && !pythonScript ? `<p class="page-formula-warning">${escapeHtml(this.t("This course uses the legacy formula syntax. It remains supported; replace it with Python code when you are ready."))}</p>` : ""}
      <p class="muted">${escapeHtml(this.t("Python code can produce map exchanges and map flips at controls. Standalone map exchanges must still be added with the simple settings or the Add menu."))}</p>
      <div class="page-formula-course-data">
        <strong>${escapeHtml(this.t("Course data available to Python"))}</strong>
        <div class="page-formula-course-data-table" role="table" aria-label="${escapeAttr(this.t("Course data available to Python"))}">
          <div class="page-formula-course-data-row heading" role="row">
            <span role="columnheader">course.branch_name</span>
            <span role="columnheader">course.control_number (${escapeHtml(this.t("position:code"))})</span>
          </div>
          ${routeContexts.map(route => `
            <div class="page-formula-course-data-row" role="row">
              <code role="cell">${escapeHtml(route.branch)}</code>
              <span role="cell">${escapeHtml(route.points.join(" → ") || "-")}</span>
            </div>
          `).join("")}
        </div>
        ${hasVariations && variations.length > 12 ? `<p class="muted">${escapeHtml(this.t("Showing the first {count} branches.", { count: 12 }))}</p>` : ""}
      </div>
      ${!hasVariations ? `<p class="muted">${escapeHtml(this.t("Non-empty advanced page code replaces the point-by-point actions above."))}</p>` : ""}
      ${fixedBreakCount && hasVariations ? `<p class="page-formula-warning">${escapeHtml(this.t("This imported course also has {count} fixed page actions that apply to every matching variation.", { count: fixedBreakCount }))}</p>` : ""}
      ${error ? `<p class="page-formula-error">${escapeHtml(this.t("Advanced code error: {message}", { message: error }))}</p>` : ""}
      ${pending && !error ? `<p class="page-formula-preview">${escapeHtml(this.t("Loading Python runtime and evaluating routes…"))}</p>` : ""}
      ${preview ? `<p class="page-formula-preview">${escapeHtml(this.t("Preview"))}: ${escapeHtml(preview)}${variations.length > 12 ? " …" : ""}</p>` : ""}
    `;
  },

  relayBranchEditor(course, assignments) {
    const branchGroups = assignments.branchGroups || [];
    const branchCodes = branchGroups.length
      ? uniqueStrings(branchGroups.flatMap(group => group.codes || []))
      : (assignments.variations.length
        ? uniqueStrings(assignments.variations.flatMap(variation => variation.code.split("")))
        : []);
    if (!branchCodes.length) {
      return `<p class="muted">${escapeHtml(this.t("Add forks to this course to create relay variations."))}</p>`;
    }
    const legs = Math.max(1, assignments.legs || course.relay?.legs || 1);
    const groups = branchGroups.length
      ? branchGroups
      : [{ groupId: "branches", codes: branchCodes }];
    const issues = relayBranchRestrictionIssues(groups, course.relay?.branches || []);
    const rows = groups.map(group => {
      const branchRows = (group.codes || []).map(code => {
        const availableLegs = relayBranchParentAllowedLegs(groups, course.relay?.branches || [], code, legs);
        const allowedLegs = new Set(relayBranchEffectiveLegs(groups, course.relay?.branches || [], code, legs));
        const checks = availableLegs.map(leg => {
          return `
            <label class="check">
              <input data-relay-branch="${escapeAttr(code)}" type="checkbox" value="${leg}" ${allowedLegs.has(leg) ? "checked" : ""}>
              ${escapeHtml(relayLegName(course.relay || {}, leg))}
            </label>
          `;
        }).join("");
        return `
          <div class="relay-branch-leg-row">
            <strong>${escapeHtml(this.t("Branch"))} ${escapeHtml(code)}</strong>
            <div class="relay-branch-leg-checks">${checks}</div>
          </div>
        `;
      }).join("");
      return `<fieldset class="relay-branch-leg-group"><legend>${escapeHtml(this.t("Fork"))}</legend>${branchRows}</fieldset>`;
    }).join("");
    const warning = issues.length
      ? `<p class="relay-branch-warning">${escapeHtml(this.t("Every parallel branch must declare allowed legs. Missing: {branches}.", { branches: uniqueStrings(issues.flatMap(issue => issue.missingCodes)).join(", ") }))}</p>`
      : "";
    return `${warning}<div class="relay-branch-leg-editor">${rows}</div>`;
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
    const fields = [
      `<div class="readonly-field"><span>${escapeHtml(this.t("Kind"))}</span><strong>${escapeHtml(optionLabel(special.kind))}</strong></div>`,
      this.specialCourseVisibilityEditor(special)
    ];

    if (category === "point") {
      if (special.kind === "optional-crossing-point") {
        fields.push(`<label class="span-2">${escapeHtml(this.t("Rotation angle (°)"))} <input data-field="special.orientation" type="number" min="0" max="359.9" step="0.1" value="${Math.round(((Number(special.orientation) || 0) % 360 + 360) % 360 * 10) / 10}"></label>`);
      }
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
      fields.push(this.specialLineStyleSelect(special, ["single", "dashed", "none"]));
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

  specialCourseVisibilityEditor(special) {
    const courses = sortedCourses(this.store.snapshot().eventModel);
    const allCourses = special.allCourses !== false;
    const selected = new Set((special.courses || []).map(entry => Number(entry.course)).filter(Number.isFinite));
    const disabled = allCourses ? "disabled" : "";
    const courseRows = courses.length
      ? courses.map(course => `
          <label class="special-visibility-course ${allCourses ? "disabled" : ""}">
            <input
              type="checkbox"
              data-special-visibility-course
              value="${course.id}"
              ${!allCourses && selected.has(Number(course.id)) ? "checked" : ""}
              ${disabled}>
            <span title="${escapeAttr(course.name || `${this.t("Course")} ${course.id}`)}">${escapeHtml(course.name || `${this.t("Course")} ${course.id}`)}</span>
          </label>
        `).join("")
      : `<p class="muted special-visibility-empty">${escapeHtml(this.t("No courses have been created yet."))}</p>`;
    return `
      <fieldset class="special-visibility-field span-2">
        <legend>${escapeHtml(this.t("Shown for"))}</legend>
        <label class="check special-visibility-all">
          <input type="checkbox" data-special-visibility-all ${allCourses ? "checked" : ""}>
          ${escapeHtml(this.t("All courses"))}
        </label>
        <div class="special-visibility-courses" aria-label="${escapeAttr(this.t("Selected courses"))}">
          ${courseRows}
        </div>
      </fieldset>
    `;
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

  specialLineStyleSelect(special, choices = ["single", "double", "dashed"]) {
    return `<label>${escapeHtml(this.t("Line style"))} <select data-field="special.lineKind">${choices.map(kind => `<option value="${kind}" ${kind === special.lineKind ? "selected" : ""}>${escapeHtml(optionLabel(kind))}</option>`).join("")}</select></label>`;
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
      </div>
    `;
  },

  renderReport({ ui }) {
    const panel = this.querySelector("#reportPanel");
    panel.innerHTML = ui.report?.html || `<p class="muted">${escapeHtml(this.t("Choose a report from the Reports menu."))}</p>`;
  },

  renderStatus({ eventModel, ui }) {
    this.querySelector("#statusText").textContent = this.t(ui.status || "Ready");
    const backgroundMoveBanner = this.querySelector("#backgroundMoveModeBanner");
    if (backgroundMoveBanner) backgroundMoveBanner.hidden = ui.tool !== "background-move";
    const mapName = ui.omap?.name ? ` | OMAP: ${ui.omap.name}` : "";
    this.querySelector("#dirtyText").textContent = `${eventModel.sourceName || this.t("Untitled.ocp")}${eventModel.dirty ? " *" : ""}${mapName}`;
    const panel = this.querySelector("#measurementPanel");
    const summary = this.querySelector("#measurementSummary");
    if (panel && summary) {
      const measurement = ui.tool === "measure" ? ui.measurement : null;
      panel.hidden = !measurement;
      if (measurement) {
        const colorInput = this.querySelector("#measurementColor");
        const lineStyleInput = this.querySelector("#measurementLineStyle");
        const labelsInput = this.querySelector("#measurementGroundLabels");
        const selectedMeasurement = Number.isInteger(measurement.selectedIndex) ? measurement.items?.[measurement.selectedIndex] : null;
        const activeColor = selectedMeasurement?.color || measurement.draft?.color || measurement.color;
        if (colorInput && /^#[0-9a-f]{6}$/i.test(activeColor || "")) colorInput.value = activeColor;
        if (colorInput) colorInput.disabled = !measurement.adding && !selectedMeasurement;
        const activeLineStyle = selectedMeasurement?.lineStyle || measurement.draft?.lineStyle || measurement.lineStyle || "solid";
        if (lineStyleInput) {
          lineStyleInput.value = ["solid", "dashed", "dotted"].includes(activeLineStyle) ? activeLineStyle : "solid";
          lineStyleInput.disabled = !measurement.adding && !selectedMeasurement;
        }
        if (labelsInput) labelsInput.checked = !!measurement.showGroundLabels;
        const addButton = this.querySelector("#measurementAddButton");
        const finishButton = this.querySelector("#measurementFinishButton");
        const deleteButton = this.querySelector("#measurementDeleteButton");
        if (addButton) addButton.disabled = !!measurement.adding;
        if (finishButton) finishButton.disabled = !measurement.adding || (measurement.draft?.points?.length || 0) < 2;
        if (deleteButton) deleteButton.disabled = measurement.adding || !Number.isInteger(measurement.selectedIndex);
        const pair = (ground, paper) => `${this.t("Ground")} ${ground} · ${this.t("Paper")} ${paper}`;
        const result = (item, title, selected = false) => {
          const metrics = measurementMetrics(item.points, item.closed, eventModel.event?.map?.scale);
          const color = /^#[0-9a-f]{6}$/i.test(item.color || "") ? item.color : "#007f93";
          const rows = [
            `<div class="measurement-row"><span>${escapeHtml(this.t("Polyline length"))}</span><span>${escapeHtml(pair(formatGroundLength(metrics.lineLengthM), formatPaperLength(metrics.lineLengthPaperMm)))}</span></div>`,
            ...(item.closed ? [
              `<div class="measurement-row"><span>${escapeHtml(this.t("Perimeter"))}</span><span>${escapeHtml(pair(formatGroundLength(metrics.perimeterM), formatPaperLength(metrics.perimeterPaperMm)))}</span></div>`,
              `<div class="measurement-row"><span>${escapeHtml(this.t("Measured area"))}</span><span>${escapeHtml(pair(formatGroundArea(metrics.areaM2), formatPaperArea(metrics.areaPaperMm2)))}</span></div>`
            ] : [])
          ].join("");
          return `<div class="measurement-result${selected ? " selected" : ""}"><div class="measurement-result-title" style="color:${color}">${escapeHtml(title)}</div>${rows}</div>`;
        };
        const items = measurement.items || [];
        const draft = measurement.draft || { points: [] };
        const results = [
          ...items.map((item, index) => result(item, this.t("Polyline {number}", { number: index + 1 }), index === measurement.selectedIndex)),
          ...(measurement.adding && draft.points?.length >= 2 ? [result(draft, this.t("Current polyline"))] : [])
        ].join("");
        const rows = results || `<div class="measurement-hint">${escapeHtml(this.t(measurement.adding ? "Click the map to start measuring." : "No measurements yet."))}</div>`;
        const hint = measurement.adding
          ? this.t("Click to add vertices; click the first point to close. Double-click, right-click, or use Finish polyline to keep it open.")
          : this.t("Click a measurement on the map to select it, or choose Add measurement to draw a new one.");
        summary.innerHTML = `<strong>${escapeHtml(this.t("Measurement"))} · 1:${Math.round(Number(eventModel.event?.map?.scale) || 15000).toLocaleString()}</strong>${rows}<div class="measurement-hint">${escapeHtml(hint)}</div>`;
      }
    }
  },

  updateMouseStatus(point) {
    const mouse = this.querySelector("#mouseText");
    if (mouse) {
      mouse.textContent = `X: ${point.x.toFixed(1)}  Y: ${point.y.toFixed(1)}`;
    }
  }

  };
}

function rawRelayLegCount(course) {
  return Math.max(0, Math.round(Number(course?.relay?.legs) || 0));
}
