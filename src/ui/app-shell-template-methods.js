export function createAppShellTemplateMethods(deps) {
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
  template() {
    return `
      <style id="tabletDesktopLayoutFix">
        purple-pen-app .app-frame {
          position: relative;
        }
        purple-pen-app .app-init-loading {
          position: absolute;
          inset: 0;
          z-index: 10000;
          display: grid;
          place-items: center;
          background: rgba(248, 250, 252, 0.96);
          color: #111827;
          transition: opacity 0.18s ease;
        }
        purple-pen-app .app-init-loading[hidden] {
          display: none !important;
        }
        purple-pen-app .app-init-loading.is-done {
          opacity: 0;
          pointer-events: none;
        }
        purple-pen-app .app-init-loading-card {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px 18px;
          border: 1px solid #d1d5db;
          border-radius: 12px;
          background: #ffffff;
          box-shadow: 0 12px 36px rgba(15, 23, 42, 0.16);
        }
        purple-pen-app .app-init-spinner {
          width: 24px;
          height: 24px;
          border: 3px solid #e5e7eb;
          border-top-color: #a626ff;
          border-radius: 999px;
          animation: appInitSpin 0.85s linear infinite;
        }
        purple-pen-app .app-init-loading strong,
        purple-pen-app .app-init-loading span {
          display: block;
        }
        purple-pen-app .app-init-loading span {
          margin-top: 2px;
          color: #4b5563;
          font-size: 12px;
        }
        @keyframes appInitSpin {
          to { transform: rotate(360deg); }
        }
        purple-pen-app.desktop-ui {
          display: block !important;
          width: 100vw !important;
          max-width: 100vw !important;
          height: 100dvh !important;
          min-width: 0 !important;
          min-height: 0 !important;
          overflow: hidden !important;
        }
        purple-pen-app.desktop-ui .app-frame {
          display: flex !important;
          flex-direction: column !important;
          width: 100% !important;
          max-width: 100% !important;
          height: 100% !important;
          min-width: 0 !important;
          min-height: 0 !important;
          overflow: hidden !important;
        }
        purple-pen-app.desktop-ui .menubar,
        purple-pen-app.desktop-ui .toolbar,
        purple-pen-app.desktop-ui .course-tabs,
        purple-pen-app.desktop-ui .statusbar {
          flex: 0 0 auto !important;
          max-width: 100% !important;
          min-width: 0 !important;
        }
        purple-pen-app.desktop-ui .workspace {
          display: grid !important;
          grid-template-columns: var(--left-panel-width, 300px) 6px minmax(0, 1fr) !important;
          grid-template-rows: minmax(0, 1fr) !important;
          flex: 1 1 0 !important;
          width: 100% !important;
          max-width: 100% !important;
          height: auto !important;
          min-width: 0 !important;
          min-height: 0 !important;
          overflow: hidden !important;
        }
        purple-pen-app.desktop-ui .left-panel {
          grid-column: 1 !important;
          grid-row: 1 !important;
          display: flex !important;
          flex-direction: column !important;
          min-width: 0 !important;
          min-height: 0 !important;
          overflow: auto !important;
        }
        purple-pen-app.desktop-ui .workspace-divider {
          grid-column: 2 !important;
          grid-row: 1 !important;
          display: block !important;
          width: 6px !important;
          min-width: 6px !important;
        }
        purple-pen-app.desktop-ui .map-panel {
          grid-column: 3 !important;
          grid-row: 1 !important;
          display: flex !important;
          flex-direction: column !important;
          width: auto !important;
          height: 100% !important;
          min-width: 0 !important;
          min-height: 0 !important;
          flex: 1 1 0 !important;
          overflow: hidden !important;
        }
        purple-pen-app.desktop-ui .course-banner {
          flex: 0 0 auto !important;
          min-width: 0 !important;
          max-width: 100% !important;
        }
        purple-pen-app.desktop-ui .map-canvas {
          display: block !important;
          width: 100% !important;
          height: 100% !important;
          min-width: 0 !important;
          min-height: 0 !important;
          flex: 1 1 0 !important;
          max-width: 100% !important;
          touch-action: none !important;
        }
        purple-pen-app .ui-mode-toggle {
          flex: 0 0 auto;
          margin-left: auto;
          padding: 4px 9px;
          border-radius: 7px;
          border: 1px solid #c7c7c7;
          background: rgba(255,255,255,.96);
          color: #222;
          font: inherit;
          line-height: 1.2;
          cursor: pointer;
          white-space: nowrap;
        }
        purple-pen-app .ui-mode-toggle:hover,
        purple-pen-app .ui-mode-toggle:focus-visible {
          background: #fff;
          border-color: #8e8e8e;
          outline: none;
        }
        purple-pen-app .ui-mode-toggle + .feedback-link {
          margin-left: 6px !important;
        }
        purple-pen-app .pdf-export-dialog {
          width: min(760px, calc(100vw - 28px));
          max-width: calc(100vw - 28px);
        }
        purple-pen-app .pdf-export-form {
          min-width: min(720px, calc(100vw - 56px));
        }
        purple-pen-app .pdf-export-layout {
          display: grid;
          grid-template-columns: minmax(230px, .9fr) minmax(260px, 1.1fr);
          gap: 10px 14px;
          align-items: start;
        }
        purple-pen-app .pdf-export-layout fieldset {
          border: 1px solid #d6d6d6;
          border-radius: 8px;
          padding: 8px 10px 10px;
          margin: 0;
        }
        purple-pen-app .pdf-export-layout legend {
          font-weight: 600;
          padding: 0 4px;
        }
        purple-pen-app .pdf-export-layout label {
          display: grid;
          gap: 3px;
          margin: 6px 0;
        }
        purple-pen-app .pdf-export-layout .dialog-check {
          display: flex;
          align-items: center;
          gap: 6px;
          margin: 7px 0;
        }
        purple-pen-app .pdf-export-layout select,
        purple-pen-app .pdf-export-layout input[type="text"] {
          width: 100%;
          box-sizing: border-box;
        }
        purple-pen-app .pdf-export-summary {
          grid-column: 1 / -1;
          min-height: 1.2em;
        }
        @media (max-width: 700px) {
          purple-pen-app .pdf-export-layout {
            grid-template-columns: 1fr;
          }
          purple-pen-app .pdf-export-summary {
            grid-column: auto;
          }
        }
      </style>
      <div class="app-frame">
        <input id="ppenInput" type="file" accept=".ppen,.xml,text/xml" hidden>
        <input id="mapInput" type="file" accept="image/*,application/pdf,.pdf" hidden>
        <input id="omapInput" type="file" hidden>
        <div id="appInitLoading" class="app-init-loading" role="status" aria-live="polite">
          <div class="app-init-loading-card">
            <div class="app-init-spinner" aria-hidden="true"></div>
            <div>
              <strong>${escapeHtml(this.t("Loading O-Composer…"))}</strong>
              <span>${escapeHtml(this.t("Preparing the editor…"))}</span>
            </div>
          </div>
        </div>
        <div class="orientation-overlay" aria-live="polite">
          <div>
            <strong>${escapeHtml(this.t("Rotate your phone"))}</strong>
            <span>${escapeHtml(this.t("O-Composer works best in landscape on mobile."))}</span>
          </div>
        </div>
        <header class="menubar">
          ${this.menu("File", [
            ["new", "New Event"],
            ["open-sample", "Open Sample"],
            ["open", "Open .ppen"],
            ["save", "Save .ppen"],
            ["save-as", "Save As"],
            ["map-image", "Choose Map Image/PDF"],
            ["omap-import", "Import OMAP Map"],
            ["omap-clear", "Clear OMAP Map"],
            ["export-png", "Create Image File"],
            ["export-pdf", "Create PDF"],
            ["export-iof3", "Create IOF XML 3.0"],
            ["export-iof2", "Create IOF XML 2.0"],
            ["export-gpx", "Create GPX"],
            ["export-kml", "Create KML"],
            ["export-routegadget", "Create RouteGadget XML"],
            ["export-svg", "Create SVG Overlay"]
          ])}
          ${this.menu("Edit", [
            ["undo", "Undo"],
            ["redo", "Redo"],
            ["delete", "Delete"],
            ["cancel", "Cancel Mode"]
          ])}
          ${this.menu("View", [
            ["fit-course", "Entire Course"],
            ["fit-map", "Entire Map"],
            ["zoom-50", "Zoom 50%"],
            ["zoom-100", "Zoom 100%"],
            ["zoom-200", "Zoom 200%"],
            ["toggle-print-area", "Show Export Area"],
            ["set-print-area", "Set Export Area"],
            ["toggle-all-controls", "All Controls"],
            ["quality", "High Quality Map"]
          ])}
          ${this.menu("Add", [
            ["tool-start", "Start"],
            ["tool-control", "Control"],
            ["tool-finish", "Finish"],
            ["tool-map-exchange", "Map Exchange"],
            ["tool-crossing", "Mandatory Crossing"],
            ["tool-map-issue", "Map Issue"],
            ["add-variation", "Add Variation"],
            ["tool-line-cut", "Cut Line"],
            ["tool-description", "Descriptions"],
            ["tool-text", "Text"],
            ["tool-line", "Line"],
            ["tool-rectangle", "Rectangle"],
            ["tool-ellipse", "Ellipse"],
            ["tool-oob", "Out of Bounds"],
            ["tool-danger", "Dangerous Area"],
            ["tool-construction", "Construction"],
            ["tool-water", "Water"],
            ["tool-first-aid", "First Aid"],
            ["tool-forbidden", "Forbidden Route"],
            ["tool-boundary", "Boundary"],
            ["tool-regmark", "Registration Mark"],
            ["tool-whiteout", "White Out"]
          ])}
          ${this.menu("Event", [
            ["event-adjustment", "Event Adjustment"],
            ["map-info", "Map Info"]
          ])}
          ${this.menu("Course", [
            ["add-course", "Add Course"],
            ["delete-course", "Delete Course"],
            ["duplicate-course", "Duplicate Course"],
            ["course-properties", "Properties"],
            ["course-order", "Course Order"],
            ["course-load", "Course Load"],
            ["variation-report", "Course Variation Report"]
          ])}
          ${this.menu("Reports", [
            ["report-summary", "Course Summary"],
            ["report-audit", "Event Audit"],
            ["report-leg-lengths", "Leg Lengths"],
            ["report-crossref", "Control Cross-reference"],
            ["report-load", "Control and Leg Load"]
          ])}
          ${this.menu("Help", [
            ["about", "About O-Composer"],
            ["help", "Frontend Limitations"]
          ])}
          <button id="uiModeToggle" class="ui-mode-toggle" type="button" title="${escapeAttr(this.t("Switch between desktop and mobile UI"))}" aria-label="${escapeAttr(this.t("Switch between desktop and mobile UI"))}"></button>
          <a class="feedback-link" href="https://365.kdocs.cn/l/cmBYi18akxdM" target="_blank" rel="noopener noreferrer">${escapeHtml(this.t("Feedback"))}</a>
          <div class="app-brand" aria-label="${escapeAttr(`O-Composer ${APP_VERSION}`)}">
            <strong>O-Composer</strong>
            <span>${escapeHtml(APP_VERSION)}</span>
            <div id="resourceProgress" class="resource-progress" hidden aria-live="polite">
              <progress id="resourceProgressBar" max="100" value="0"></progress>
              <span id="resourceProgressText"></span>
            </div>
          </div>
        </header>
        <section class="toolbar" aria-label="${escapeAttr(this.t("Toolbar"))}">
          ${this.toolButton("open", "Open", "open")}
          ${this.toolButton("save", "Save", "save")}
          <span class="separator"></span>
          ${this.toolButton("undo", "Undo", "undo")}
          ${this.toolButton("redo", "Redo", "redo")}
          ${this.toolButton("delete", "Delete", "delete")}
          <span class="separator"></span>
          ${this.toolButton("tool-start", "Start", "start")}
          ${this.toolButton("tool-control", "Control", "control")}
          ${this.toolButton("tool-finish", "Finish", "finish")}
          ${this.toolButton("tool-map-issue", "Map Issue", "map-issue")}
          ${this.toolButton("tool-line-cut", "Cut Line", "cut")}
          ${this.toolButton("tool-description", "Add Control Description Table", "descriptions", "Descriptions")}
          ${this.toolButton("tool-text", "Text", "text")}
          ${this.toolButton("tool-line", "Line", "line")}
          ${this.toolButton("tool-rectangle", "Rectangle", "rectangle")}
          <span class="separator"></span>
          ${this.toolButton("set-print-area", "Set Export Area", "print-area", "Export Area")}
          <label class="toolbar-control">${escapeHtml(this.t("Language"))}
            <select id="appLanguage" autocomplete="off">${SUPPORTED_LANGUAGES.map(([code, label]) => `<option value="${code}" ${code === this.language ? "selected" : ""}>${escapeHtml(label)}</option>`).join("")}</select>
          </label>
        </section>
        <nav id="courseTabs" class="course-tabs" aria-label="${escapeAttr(this.t("Courses"))}"></nav>
        <main class="workspace">
          <aside class="left-panel">
            <div class="mobile-side-controls">
              <label>${escapeHtml(this.t("Course"))}
                <select id="mobileCourseSelect" aria-label="${escapeAttr(this.t("Courses"))}"></select>
              </label>
              <label>${escapeHtml(this.t("Panel"))}
                <select id="mobilePanelSelect" aria-label="${escapeAttr(this.t("Panel"))}">
                  <option value="description">${escapeHtml(this.t("Description"))}</option>
                  <option value="variation">${escapeHtml(this.t("Variation"))}</option>
                  <option value="report">${escapeHtml(this.t("Report"))}</option>
                </select>
              </label>
            </div>
            <section class="panel-block">
              <div class="panel-heading">
                <button class="segmented active" data-panel="description">${escapeHtml(this.t("Description"))}</button>
                <button class="segmented" data-panel="variation">${escapeHtml(this.t("Variation"))}</button>
                <button class="segmented" data-panel="report">${escapeHtml(this.t("Report"))}</button>
              </div>
              <div id="descriptionPanel" class="description-panel"></div>
              <div id="variationPanel" class="variation-panel" hidden></div>
              <div id="reportPanel" class="report-panel" hidden></div>
            </section>
            <section class="panel-block selection-panel">
              <h2>${escapeHtml(this.t("Adjustment"))}</h2>
              <div id="selectionPanel"></div>
            </section>
          </aside>
          <div id="workspaceDivider" class="workspace-divider" role="separator" aria-orientation="vertical" aria-label="${escapeAttr(this.t("Resize panels"))}"></div>
          <section class="map-panel">
            <div id="courseBanner" class="course-banner">
              <div id="courseBannerText" class="course-banner-text"></div>
              <div id="courseVariationControls" class="course-variation-controls"></div>
              <div class="map-view-controls" aria-label="${escapeAttr(this.t("Map view controls"))}">
                <label class="map-view-control"><span>${escapeHtml(this.t("Zoom"))}</span><input id="zoomSlider" type="range" min="20" max="2400" value="100"></label>
                <label class="map-view-control"><span>${escapeHtml(this.t("Intensity"))}</span><input id="intensitySlider" type="range" min="10" max="100" value="65"></label>
              </div>
            </div>
            <canvas id="mapCanvas" class="map-canvas"></canvas>
          </section>
        </main>
        <dialog id="printAreaDialog" class="print-area-dialog" aria-modal="false" hidden>
          <form id="printAreaForm" class="print-area-form" autocomplete="off">
            <header class="dialog-heading">
              <h2 id="printAreaTitle">${escapeHtml(this.t("Set Export Area"))}</h2>
              <button type="button" class="icon-button" data-print-area-cancel aria-label="${escapeAttr(this.t("Close"))}">x</button>
            </header>
            <div class="print-area-grid">
              <label>${escapeHtml(this.t("Apply to"))}
                <select id="printAreaScope"></select>
              </label>
              <label>${escapeHtml(this.t("Paper size"))}
                <select id="printAreaPaper"></select>
              </label>
              <label>${escapeHtml(this.t("Orientation"))}
                <select id="printAreaOrientation">
                  <option value="portrait">${escapeHtml(this.t("Portrait"))}</option>
                  <option value="landscape">${escapeHtml(this.t("Landscape"))}</option>
                </select>
              </label>
              <label>${escapeHtml(this.t("Margins"))}
                <select id="printAreaMargins"></select>
              </label>
            </div>
            <fieldset class="choice-group">
              <legend>${escapeHtml(this.t("Area"))}</legend>
              <label><input type="radio" name="printAreaMode" value="frame" checked> ${escapeHtml(this.t("Move paper-size frame"))}</label>
              <label><input type="radio" name="printAreaMode" value="draw"> ${escapeHtml(this.t("Draw custom rectangle"))}</label>
              <label><input type="radio" name="printAreaMode" value="viewport"> ${escapeHtml(this.t("Use current view"))}</label>
              <label><input type="radio" name="printAreaMode" value="automatic"> ${escapeHtml(this.t("Automatic"))}</label>
            </fieldset>
            <label class="dialog-check">
              <input id="printAreaRestrict" type="checkbox">
              ${escapeHtml(this.t("Restrict to selected paper size"))}
            </label>
            <div id="printAreaSummary" class="print-area-summary"></div>
            <footer class="dialog-actions">
              <button type="button" data-print-area-cancel>${escapeHtml(this.t("Cancel"))}</button>
              <button type="submit" class="primary-button">${escapeHtml(this.t("Apply"))}</button>
            </footer>
          </form>
        </dialog>
        <dialog id="pdfExportDialog" class="command-dialog pdf-export-dialog" aria-modal="false" hidden>
          <form id="pdfExportForm" class="command-form pdf-export-form" autocomplete="off">
            <header class="dialog-heading">
              <h2>${escapeHtml(this.t("Create PDF"))}</h2>
              <button type="button" class="icon-button" data-pdf-export-cancel aria-label="${escapeAttr(this.t("Close"))}">x</button>
            </header>
            <div class="pdf-export-layout">
              <fieldset>
                <legend>${escapeHtml(this.t("Courses"))}</legend>
                <label>${escapeHtml(this.t("Export"))}
                  <select id="pdfCourseScope"></select>
                </label>
              </fieldset>
              <fieldset>
                <legend>${escapeHtml(this.t("Appearance"))}</legend>
                <label class="dialog-check"><input id="pdfIncludeBaseMap" type="checkbox" checked> ${escapeHtml(this.t("Include base map"))}</label>
                <label class="dialog-check"><input id="pdfIncludeDescriptions" type="checkbox" checked> ${escapeHtml(this.t("Include control descriptions"))}</label>
              </fieldset>
              <fieldset>
                <legend>${escapeHtml(this.t("Files"))}</legend>
                <label>${escapeHtml(this.t("File name prefix"))}
                  <input id="pdfFilePrefix" type="text">
                </label>
                <label class="dialog-check"><input id="pdfUseCourseNames" type="checkbox" checked> ${escapeHtml(this.t("Add course names to exported files"))}</label>
                <label class="dialog-check"><input id="pdfRelayUsedOnly" type="checkbox" checked> ${escapeHtml(this.t("Only export used relay variation codes"))}</label>
              </fieldset>
              <div id="pdfExportSummary" class="command-message pdf-export-summary"></div>
              <div id="pdfExportProgress" class="pdf-export-progress" hidden>
                <div class="pdf-export-progress-row">
                  <span id="pdfExportProgressText"></span>
                  <span id="pdfExportProgressPercent"></span>
                </div>
                <div id="pdfExportProgressMeter" class="pdf-export-meter" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0">
                  <div id="pdfExportProgressFill" class="pdf-export-meter-fill"></div>
                </div>
              </div>
            </div>
            <footer class="dialog-actions">
              <button type="button" data-pdf-export-cancel>${escapeHtml(this.t("Cancel"))}</button>
              <button type="submit" class="primary-button" id="pdfExportCreateButton">${escapeHtml(this.t("Create"))}</button>
            </footer>
          </form>
        </dialog>
        <dialog id="commandDialog" class="command-dialog" hidden>
          <form id="commandForm" class="command-form">
            <header class="dialog-heading">
              <h2 id="commandTitle"></h2>
              <button type="button" class="icon-button" id="commandCloseButton" data-command-cancel aria-label="${escapeAttr(this.t("Close"))}">x</button>
            </header>
            <div id="commandBody" class="command-body"></div>
            <div id="commandMessage" class="command-message" hidden></div>
            <footer id="commandActions" class="dialog-actions" style="display:none">
              <button type="button" data-command-cancel>${escapeHtml(this.t("Cancel"))}</button>
              <button id="commandApplyButton" type="submit" class="primary-button">${escapeHtml(this.t("Apply"))}</button>
            </footer>
          </form>
        </dialog>
        <div id="symbolTooltip" class="symbol-tooltip" hidden></div>
        <div id="cookieBanner" class="cookie-banner" ${hasCookieConsent() ? "hidden" : ""}>
          <span>${escapeHtml(this.t("Allow cookies to cache this event and map locally for next time?"))}</span>
          <button type="button" data-cookie-accept>${escapeHtml(this.t("Accept cookies"))}</button>
          <button type="button" data-cookie-dismiss>${escapeHtml(this.t("Not now"))}</button>
        </div>
        <footer class="statusbar">
          <span id="statusText">${escapeHtml(this.t("Ready"))}</span>
          <span id="mouseText"></span>
          <span id="dirtyText"></span>
        </footer>
      </div>
    `;
  },

  menu(label, items) {
    return `<details class="menu"><summary>${escapeHtml(this.t(label))}</summary><div class="menu-list">${items.map(([command, text]) => `<button data-command="${command}">${escapeHtml(this.t(text))}</button>`).join("")}</div></details>`;
  },

  toolButton(command, title, icon, label = title) {
    return `<button class="tool-button" data-command="${command}" title="${escapeAttr(this.t(title))}" aria-label="${escapeAttr(this.t(title))}">${iconSvg(icon)}<span>${escapeHtml(this.t(label))}</span></button>`;
  }

  };
}
