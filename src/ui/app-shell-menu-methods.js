export function createAppShellMenuMethods(deps) {
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
  bindEvents() {
    this.bindRootScrollLock();
    for (const menu of this.querySelectorAll(".menubar .menu")) {
      menu.addEventListener("toggle", () => {
        if (menu.open) {
          this.closeTopMenus(menu);
          this.closeToolbarGroups();
        }
      });
    }
    for (const menuList of this.querySelectorAll(".menubar .menu-list")) {
      this.bindMobileMenuScroll(menuList);
    }
    for (const group of this.querySelectorAll(".toolbar .tool-group")) {
      group.addEventListener("toggle", () => {
        if (group.open) {
          this.closeToolbarGroups(group);
          this.closeTopMenus();
        }
      });
    }
    window.addEventListener("pointermove", event => {
      this.closeTopMenusWhenPointerLeaves(event);
      this.closeToolbarGroupsWhenPointerLeaves(event);
    });

    this.addEventListener("contextmenu", event => {
      const saveOcpCommand = event.target.closest('.menubar [data-command="save"]');
      if (!saveOcpCommand) return;
      event.preventDefault();
      event.stopPropagation();
      this.downloadOcp();
      this.closeTopMenus();
      this.closeToolbarGroups();
    });

    this.addEventListener("click", event => {
      if (event.target.closest("[data-print-area-cancel]")) {
        this.closePrintAreaDialog();
        return;
      }
      if (event.target.closest("[data-command-cancel]")) {
        this.closeCommandDialog();
        return;
      }
      if (event.target.closest("[data-cookie-accept]")) {
        acceptCookieConsent();
        this.querySelector("#cookieBanner").hidden = true;
        this.cacheReady = true;
        this.saveSessionCache(this.store.snapshot());
        return;
      }
      if (event.target.closest("[data-cookie-dismiss]")) {
        this.querySelector("#cookieBanner").hidden = true;
        return;
      }
      const panelButton = event.target.closest("[data-panel]");
      if (panelButton) {
        this.switchPanel(panelButton.dataset.panel);
        return;
      }
      const tab = event.target.closest("[data-course-id]");
      if (tab) {
        this.selectCourse(tab.dataset.courseId);
        return;
      }
      const command = event.target.closest("[data-command]")?.dataset.command;
      if (command) {
        this.runCommand(command);
        this.closeTopMenus();
        this.closeToolbarGroups();
      }
    });

    this.querySelector("#ppenInput").addEventListener("change", event => this.openPpenFile(event.target.files?.[0]));
    this.querySelector("#mapInput").addEventListener("change", event => this.openMapFile(event.target.files?.[0]));
    this.querySelector("#omapInput").addEventListener("change", event => {
      const file = event.target.files?.[0];
      event.target.value = "";
      this.openOmapFile(file);
    });
    this.querySelector("#ocdInput").addEventListener("change", event => {
      const file = event.target.files?.[0];
      event.target.value = "";
      this.openOcadFile(file);
    });
    this.querySelector("#mobileCourseSelect").addEventListener("change", event => this.selectCourse(event.target.value));
    this.querySelector("#mobilePanelSelect").addEventListener("change", event => this.switchPanel(event.target.value));
    this.querySelector("#zoomSlider").addEventListener("input", event => {
      this.store.updateUi(ui => { ui.zoom = Number(event.target.value) / 100; }, "Zoom");
    });
    this.querySelector("#intensitySlider").addEventListener("input", event => {
      this.store.updateUi(ui => { ui.mapIntensity = Number(event.target.value) / 100; }, "Map intensity");
    });
    this.querySelector("#measurementColor")?.addEventListener("change", event => {
      this.updateMeasurementOptions({ color: event.target.value });
    });
    this.querySelector("#measurementLineStyle")?.addEventListener("change", event => {
      this.updateMeasurementOptions({ lineStyle: event.target.value });
    });
    this.querySelector("#measurementGroundLabels")?.addEventListener("change", event => {
      this.updateMeasurementOptions({ showGroundLabels: event.target.checked });
    });
    this.querySelector("#courseBanner").addEventListener("change", event => this.handleCourseBannerChange(event));
    this.querySelector("#appLanguage")?.addEventListener("change", event => {
      this.applyApplicationLanguage(event.target.value);
    });
    this.querySelector("#uiModeToggle")?.addEventListener("click", () => this.toggleUiMode());
    this.querySelector("#renderQualitySelect")?.addEventListener("change", event => this.setRenderQuality(event.target.value));
    this.querySelector("#globalOptionsForm")?.addEventListener("submit", event => {
      event.preventDefault();
      this.applyGlobalOptionsForm();
    });
    this.querySelector("#globalOptionsDialog")?.addEventListener("click", event => {
      if (event.target.closest("[data-global-options-cancel]")) {
        this.closeGlobalOptions();
      }
    });
    this.querySelector("#appMetaSetupForm")?.addEventListener("submit", event => {
      event.preventDefault();
      this.applyMetaSetupForm();
    });

    const selectionPanel = this.querySelector("#selectionPanel");
    selectionPanel.addEventListener("change", event => this.updateSelectionField(event));
    selectionPanel.addEventListener("input", event => this.handleSelectionPanelInput(event));
    selectionPanel.addEventListener("click", event => this.handleSelectionPanelClick(event));
    this.bindContainedScroll(selectionPanel.closest(".selection-panel") || selectionPanel, selectionPanel);
    this.bindWorkspaceResizer();
    this.querySelector("#descriptionPanel").addEventListener("click", event => this.handleDescriptionPanelClick(event));
    this.querySelector("#descriptionPanel").addEventListener("change", event => this.handleDescriptionPanelChange(event));
    this.querySelector("#descriptionPanel").addEventListener("pointerover", event => this.scheduleSymbolTooltip(event));
    this.querySelector("#descriptionPanel").addEventListener("pointerout", event => this.hideSymbolTooltip(event));
    this.querySelector("#variationPanel").addEventListener("click", event => this.handleVariationPanelClick(event));
    this.querySelector("#variationPanel").addEventListener("input", event => this.handleVariationPanelInput(event));
    this.querySelector("#variationPanel").addEventListener("change", event => this.handleVariationPanelChange(event));
    const variationTopologyColumn = this.querySelector("#variationTopologyColumn");
    const variationTopologyScroller = this.querySelector("#variationTopologyColumnContent");
    variationTopologyColumn?.addEventListener("click", event => this.handleVariationPanelClick(event));
    variationTopologyColumn?.addEventListener("input", event => this.handleVariationPanelInput(event));
    variationTopologyColumn?.addEventListener("change", event => this.handleVariationPanelChange(event));
    if (variationTopologyColumn && variationTopologyScroller) {
      this.bindContainedScroll(variationTopologyColumn, variationTopologyScroller);
    }
    this.querySelector("#constantsPanel").addEventListener("click", event => this.handleConstantsPanelClick(event));
    this.querySelector("#constantsPanel").addEventListener("change", event => this.handleConstantsPanelChange(event));
    this.querySelector("#printAreaForm").addEventListener("submit", event => {
      event.preventDefault();
      this.applyPrintAreaDialog();
    });
    this.querySelector("#printAreaDialog").addEventListener("input", event => {
      // iPad Safari can keep native select/radio controls in a stuck focus state if
      // the floating palette redraws while the picker is still committing a value.
      // The change handler below is enough for these controls; keep input only for
      // future text/number inputs that should preview while typing.
      if (event.target?.matches?.("select,input[type=radio],input[type=checkbox]")) {
        return;
      }
      this.renderPrintAreaDialogSummary();
      this.updatePrintAreaDialogPreview();
    });
    this.querySelector("#printAreaDialog").addEventListener("change", event => {
      if (event.target.id === "printAreaScope") {
        this.syncPrintAreaDialogFromScope();
      }
      else if (event.target.id === "printAreaPaper") {
        this.syncPrintAreaModeForPaper();
        this.renderPrintAreaDialogSummary();
        this.updatePrintAreaDialogPreview();
      }
      else {
        this.renderPrintAreaDialogSummary();
        this.updatePrintAreaDialogPreview();
      }
    });
    this.querySelector("#printAreaDialog").addEventListener("close", () => {
      if (this.keepPrintAreaDialogPreview) {
        this.keepPrintAreaDialogPreview = false;
        return;
      }
      this.clearPrintAreaDialogPreview();
    });
    this.querySelector("#pdfExportForm").addEventListener("submit", event => {
      event.preventDefault();
      void this.createPdfFromDialog();
    });
    this.querySelector("#pdfExportDialog").addEventListener("click", event => this.handlePdfExportDialogClick(event));
    this.querySelector("#pdfExportDialog").addEventListener("input", () => this.updatePdfExportDialogSummary());
    this.querySelector("#pdfExportDialog").addEventListener("change", () => this.updatePdfExportDialogSummary());
    this.querySelector("#commandForm").addEventListener("submit", event => {
      event.preventDefault();
      this.applyCommandDialog();
    });
    this.querySelector("#commandDialog").addEventListener("click", event => this.handleCommandDialogClick(event));
    this.querySelector("#commandDialog").addEventListener("input", event => this.handleCommandDialogInput(event));
    this.querySelector("#commandDialog").addEventListener("change", event => this.handleCommandDialogChange(event));
    this.querySelector("#commandDialog").addEventListener("pointerover", event => this.scheduleSymbolTooltip(event));
    this.querySelector("#commandDialog").addEventListener("pointerout", event => this.hideSymbolTooltip(event));
    this.enablePanelDrag(this.querySelector("#printAreaDialog"));
    this.enablePanelDrag(this.querySelector("#pdfExportDialog"));
    this.enablePanelDrag(this.querySelector("#commandDialog"));
    window.addEventListener("keydown", event => this.handleKey(event));
    window.addEventListener("pointerdown", () => this.ensureMobileLandscapeMode(), { passive: true });
    window.addEventListener("touchstart", () => this.ensureMobileLandscapeMode(), { passive: true });
    window.addEventListener("resize", () => {
      this.syncResponsiveUiClass();
      this.deferMapLayoutRefresh();
    });
    window.addEventListener("orientationchange", () => {
      this.syncResponsiveUiClass();
      this.deferMapLayoutRefresh();
    });
  },

  ensureMobileLandscapeMode() {
    if (this.mobileLandscapeRequested || !isNarrowMobileViewport()) {
      return;
    }
    this.mobileLandscapeRequested = true;
    const root = document.documentElement;
    if (!document.fullscreenElement && root.requestFullscreen) {
      root.requestFullscreen({ navigationUI: "hide" }).catch(() => {});
    }
    const orientation = screen.orientation;
    if (orientation?.lock) {
      orientation.lock("landscape").catch(() => {});
    }
  },

  closeTopMenus(except = null) {
    for (const menu of this.querySelectorAll(".menubar .menu[open]")) {
      if (menu !== except) {
        menu.open = false;
      }
    }
  },

  closeToolbarGroups(except = null) {
    for (const group of this.querySelectorAll(".toolbar .tool-group[open]")) {
      if (group !== except) {
        group.open = false;
      }
    }
  },

  bindMobileMenuScroll(menuList) {
    let lastTouchY = 0;
    menuList.addEventListener("touchstart", event => {
      lastTouchY = event.touches[0]?.clientY || 0;
    }, { passive: true });
    menuList.addEventListener("touchmove", event => {
      if (!isNarrowMobileViewport()) return;
      const touchY = event.touches[0]?.clientY || lastTouchY;
      const deltaY = lastTouchY - touchY;
      lastTouchY = touchY;
      if (canScrollElement(menuList, deltaY)) {
        event.stopPropagation();
        return;
      }
      event.preventDefault();
      event.stopPropagation();
    }, { passive: false });
    menuList.addEventListener("wheel", event => {
      if (!isNarrowMobileViewport()) return;
      if (canScrollElement(menuList, event.deltaY)) {
        event.stopPropagation();
        return;
      }
      event.preventDefault();
      event.stopPropagation();
    }, { passive: false });
  },

  bindContainedScroll(eventSource, scroller = eventSource) {
    const lockRootScroll = () => {
      const root = document.documentElement;
      if (window.scrollX || window.scrollY) {
        window.scrollTo(0, 0);
      }
      if (root.scrollLeft || root.scrollTop) {
        root.scrollLeft = 0;
        root.scrollTop = 0;
      }
      if (document.body && (document.body.scrollLeft || document.body.scrollTop)) {
        document.body.scrollLeft = 0;
        document.body.scrollTop = 0;
      }
    };
    let lastTouchX = 0;
    let lastTouchY = 0;
    eventSource.addEventListener("touchstart", event => {
      lastTouchX = event.touches[0]?.clientX || 0;
      lastTouchY = event.touches[0]?.clientY || 0;
    }, { passive: true });
    eventSource.addEventListener("touchmove", event => {
      const touchX = event.touches[0]?.clientX || lastTouchX;
      const touchY = event.touches[0]?.clientY || lastTouchY;
      const deltaX = lastTouchX - touchX;
      const deltaY = lastTouchY - touchY;
      lastTouchX = touchX;
      lastTouchY = touchY;
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        return;
      }
      const maxScrollTop = Math.max(0, scroller.scrollHeight - scroller.clientHeight);
      if (maxScrollTop > 0) {
        scroller.scrollTop = Math.max(0, Math.min(maxScrollTop, scroller.scrollTop + deltaY));
      }
      event.preventDefault();
      event.stopPropagation();
      lockRootScroll();
    }, { passive: false });
    eventSource.addEventListener("wheel", event => {
      if (Math.abs(event.deltaX) > Math.abs(event.deltaY)) {
        return;
      }
      const maxScrollTop = Math.max(0, scroller.scrollHeight - scroller.clientHeight);
      if (maxScrollTop > 0) {
        scroller.scrollTop = Math.max(0, Math.min(maxScrollTop, scroller.scrollTop + event.deltaY));
      }
      event.preventDefault();
      event.stopPropagation();
      lockRootScroll();
    }, { passive: false });
  },

  bindRootScrollLock() {
    const lock = () => this.lockRootScrollPosition();
    let lastTouchX = 0;
    let lastTouchY = 0;
    window.addEventListener("scroll", lock, { passive: true });
    document.addEventListener("wheel", event => {
      if (this.shouldAllowRootScrollEvent(event, event.deltaY, event.deltaX)) {
        requestAnimationFrame(lock);
        return;
      }
      event.preventDefault();
      lock();
    }, { capture: true, passive: false });
    document.addEventListener("touchstart", event => {
      lastTouchX = event.touches[0]?.clientX || 0;
      lastTouchY = event.touches[0]?.clientY || 0;
    }, { capture: true, passive: true });
    document.addEventListener("touchmove", event => {
      const touchX = event.touches[0]?.clientX || lastTouchX;
      const touchY = event.touches[0]?.clientY || lastTouchY;
      const deltaX = lastTouchX - touchX;
      const deltaY = lastTouchY - touchY;
      lastTouchX = touchX;
      lastTouchY = touchY;
      if (this.shouldAllowRootScrollEvent(event, deltaY, deltaX)) {
        requestAnimationFrame(lock);
        return;
      }
      event.preventDefault();
      lock();
    }, { capture: true, passive: false });
  },

  shouldAllowRootScrollEvent(event, deltaY = 0, deltaX = 0) {
    const target = event.target instanceof Element ? event.target : null;
    if (!target) return false;
    if (target.closest(".map-canvas")) return true;
    if (Math.abs(deltaX) > Math.abs(deltaY)) return true;
    for (let node = target; node && node instanceof Element; node = node.parentElement) {
      if (node === document.body || node === document.documentElement) break;
      if (canScrollElement(node, deltaY)) return true;
      if (node === this) break;
    }
    return false;
  },

  lockRootScrollPosition() {
    const root = document.documentElement;
    if (window.scrollX || window.scrollY) {
      window.scrollTo(0, 0);
    }
    if (root.scrollLeft || root.scrollTop) {
      root.scrollLeft = 0;
      root.scrollTop = 0;
    }
    if (document.body && (document.body.scrollLeft || document.body.scrollTop)) {
      document.body.scrollLeft = 0;
      document.body.scrollTop = 0;
    }
  },

  closeTopMenusWhenPointerLeaves(event) {
    if (!this.querySelector(".menubar .menu[open]")) {
      return;
    }
    const target = event.target;
    if (target instanceof Element && target.closest(".menubar .menu")) {
      return;
    }
    if (this.pointerInOpenMenuBridge(event)) {
      return;
    }
    this.closeTopMenus();
  },

  closeToolbarGroupsWhenPointerLeaves(event) {
    if (!this.querySelector(".toolbar .tool-group[open]")) {
      return;
    }
    const target = event.target;
    if (target instanceof Element && target.closest(".toolbar .tool-group")) {
      return;
    }
    if (this.pointerInOpenPopupBridge(event, ".toolbar .tool-group[open]", "summary", ".tool-group-menu", 10)) {
      return;
    }
    this.closeToolbarGroups();
  },

  pointerInOpenMenuBridge(event) {
    return this.pointerInOpenPopupBridge(event, ".menubar .menu[open]", "summary", ".menu-list", 6);
  },

  pointerInOpenPopupBridge(event, rootSelector, anchorSelector, popupSelector, padding) {
    const x = Number(event.clientX);
    const y = Number(event.clientY);
    if (!Number.isFinite(x) || !Number.isFinite(y)) {
      return false;
    }
    for (const menu of this.querySelectorAll(rootSelector)) {
      const rects = [menu.querySelector(anchorSelector), menu.querySelector(popupSelector)]
        .map(element => element?.getBoundingClientRect?.())
        .filter(rect => rect && rect.width > 0 && rect.height > 0);
      if (!rects.length) continue;
      const left = Math.min(...rects.map(rect => rect.left)) - padding;
      const right = Math.max(...rects.map(rect => rect.right)) + padding;
      const top = Math.min(...rects.map(rect => rect.top)) - padding;
      const bottom = Math.max(...rects.map(rect => rect.bottom)) + padding;
      if (x >= left && x <= right && y >= top && y <= bottom) {
        return true;
      }
    }
    return false;
  }

  };
}
