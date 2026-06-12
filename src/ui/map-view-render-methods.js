export function createMapViewRenderMethods(deps) {
  const {
    allControlsView,
    courseLegs,
    courseView,
    eventBounds,
    getControl,
    getCourse,
    controlsUsedByCourse,
    isTeamFreeCourseControl,
    createDescriptionSpecialOptions,
    descriptionBounds,
    drawControlDescriptionBlock,
    resizedDescriptionSpecial,
    specialVisibleForCourse,
    effectivePrintArea,
    printAreaCenter,
    relayEntryLabel,
    relayVariationForLeg,
    variationForCode,
    createCourseSymbolMetrics,
    courseSymbolMmToMapDistance,
    courseLegTrimRadius,
    defaultControlLabelPoint,
    directionAngle,
    drawControlLabel,
    drawCourseControl,
    drawCourseLeg,
    drawPointSpecialSymbol,
    symbolApparentRadius,
    drawOmapMap,
    ADDABLE_CONTROL_SNAP_PIXELS,
    MAX_ZOOM,
    GRID,
    OMAP_LAYER_PADDING,
    OMAP_LAYER_CACHE_LIMIT,
    hasEventGeometry,
    backgroundMapBounds,
    backgroundCalibrationMapPoints,
    currentCourseLegs,
    moveOffsetForHit,
    moveTargetForDrag,
    resizeForHit,
    specialResizeHandles,
    specialSelectionPoints,
    specialHitDistance,
    addableControlsForTool,
    currentCourseLabelRows,
    selectedLegForSelection,
    selectedControlNumberRow,
    mapCourseDisplayOptions,
    legSelection,
    legGapSelection,
    legBendSelection,
    legKey,
    legMapPoints,
    automaticLegGaps,
    automaticControlCircleGaps,
    screenGapsForLeg,
    screenFlagRangesForLeg,
    isEntireLegFlagged,
    flaggedEndpointGapSuppression,
    pointAtPathDistance,
    nearestLeg,
    drawHandleDot,
    drawSquareHandle,
    drawBendDot,
    drawLegSelectionOutline,
    drawControlCenterPoint,
    line,
    distance,
    paddedBounds,
    mergeBounds,
    boundsCenter,
    sameBounds,
    nearlyEqual,
    nowMs,
    scheduleFrame,
    wheelZoomFactor,
    pointerPosition,
    printAreaFrameDragCenter,
    pinchGesture,
    layerMapBounds,
    viewportMapBounds,
    boundsContain,
    omapRenderKey,
    releaseOmapLayer,
    outgoingDirection,
    numberLocationPoint,
    mergedCourseLabelRows,
    controlNumberScreenRect,
    controlNumberRect,
    pointInRect,
    orientation,
    drawFallbackSpecialPoint,
    isDragSpecialTool,
    specialShapeForDrag,
    drawSpecialObject,
    drawLineSpecial,
    drawRectSpecial,
    drawTextSpecial,
    specialLineWidth,
    specialColor,
    pathLines,
    screenRectFromPoints,
    descriptionCornerPoints,
    fillForSpecial,
    specialCategoryForHitTest,
    symbolApparentRadiusControl,
    clamp
  } = deps;
  return {
  draw(state) {
    const { eventModel, ui } = state;
    this.lastDrawState = state;
    if (this.resizeForDpi()) {
      this.invalidateOmapLayer();
    }
    this.bounds = this.visibleBounds(eventModel, ui);
    const ctx = this.ctx;
    const width = this.canvas.clientWidth;
    const height = this.canvas.clientHeight;
    ctx.clearRect(0, 0, width, height);
    ctx.save();
    ctx.fillStyle = "#f8f7f2";
    ctx.fillRect(0, 0, width, height);
    this.drawGrid(ctx, width, height, ui);
    this.drawBackground(ctx, width, height, ui);
    this.drawOmap(ctx, ui);
    if (ui.showPrintArea) {
      this.drawPrintArea(ctx, eventModel, ui);
    }
    this.drawSpecials(ctx, eventModel, ui);
    this.drawCourse(ctx, eventModel, ui);
    this.drawAddableControls(ctx, eventModel, ui);
    this.drawSelection(ctx, eventModel, ui);
    this.drawBackgroundCalibration(ctx, ui);
    this.drawSpecialHandles(ctx, eventModel, ui);
    this.drawMovePreview(ctx, eventModel, ui);
    this.drawResizePreview(ctx, eventModel, ui);
    this.drawToolPreview(ctx, eventModel, ui);
    ctx.restore();
  },

  renderAreaToCanvas(eventModel, ui, area, size, options = {}) {
    const width = Math.max(1, Math.round(size?.width || 1200));
    const height = Math.max(1, Math.round(size?.height || 1600));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    this.renderAreaToContext(ctx, eventModel, ui, area, { width, height }, { includeBitmapBackground: true, ...options });
    return canvas;
  },

  renderAreaToContext(ctx, eventModel, ui, area, size, options = {}) {
    const width = Math.max(1, Math.round(size?.width || 1200));
    const height = Math.max(1, Math.round(size?.height || 1600));
    const previousBounds = this.bounds;
    const exportBounds = {
      left: Math.min(area.left, area.right),
      right: Math.max(area.left, area.right),
      top: Math.max(area.top, area.bottom),
      bottom: Math.min(area.top, area.bottom),
      width: Math.max(0.1, Math.abs(area.right - area.left)),
      height: Math.max(0.1, Math.abs(area.top - area.bottom))
    };
    const exportUi = {
      ...ui,
      pan: { x: 0, y: 0 },
      zoom: 1,
      showPrintArea: false,
      printAreaEdit: null,
      selection: null,
      movePreview: null,
      resizePreview: null,
      tool: "select",
      highQuality: true,
      __viewport: { width, height }
    };
    try {
      this.bounds = exportBounds;
      if (options.includePageBackground !== false) {
        ctx.fillStyle = options.pageBackgroundColor || "#f8f7f2";
        ctx.fillRect(0, 0, width, height);
      }
      if (options.includeBitmapBackground) {
        this.drawBackground(ctx, width, height, exportUi);
      }
      if (options.includeOmapMap !== false) {
        this.drawOmapDirect(ctx, exportUi);
      }
      if (options.includeSpecials !== false) {
        this.drawSpecials(ctx, eventModel, exportUi);
      }
      if (options.includeCourse !== false) {
        this.drawCourse(ctx, eventModel, exportUi);
      }
    }
    finally {
      this.bounds = previousBounds;
    }
  },

  resizeForDpi() {
    const ratio = window.devicePixelRatio || 1;
    const rect = this.canvas.getBoundingClientRect();
    const width = Math.max(1, Math.floor(rect.width));
    const height = Math.max(1, Math.floor(rect.height));
    if (this.canvas.width !== width * ratio || this.canvas.height !== height * ratio) {
      this.canvas.width = width * ratio;
      this.canvas.height = height * ratio;
      this.ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      return true;
    }
    return false;
  },

  requestDraw(state = this.store.snapshot()) {
    this.pendingState = state;
    if (this.drawFrame) {
      return;
    }
    this.drawFrame = scheduleFrame(() => {
      this.drawFrame = 0;
      const nextState = this.pendingState || this.store.snapshot();
      this.pendingState = null;
      this.draw(nextState);
    });
  },

  drawGrid(ctx, width, height, ui) {
    ctx.save();
    ctx.strokeStyle = GRID;
    ctx.lineWidth = 1;
    const spacing = this.gridSpacing();
    const startX = Math.floor(this.bounds.left / spacing) * spacing;
    const endX = Math.ceil(this.bounds.right / spacing) * spacing;
    const startY = Math.floor(this.bounds.bottom / spacing) * spacing;
    const endY = Math.ceil(this.bounds.top / spacing) * spacing;
    ctx.globalAlpha = 0.75;
    for (let x = startX; x <= endX; x += spacing) {
      const p1 = this.toScreen({ x, y: this.bounds.bottom }, ui);
      const p2 = this.toScreen({ x, y: this.bounds.top }, ui);
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
    }
    for (let y = startY; y <= endY; y += spacing) {
      const p1 = this.toScreen({ x: this.bounds.left, y }, ui);
      const p2 = this.toScreen({ x: this.bounds.right, y }, ui);
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
    }
    ctx.restore();
  },

  drawBackground(ctx, width, height, ui) {
    if (!this.backgroundImage) {
      return;
    }
    const bounds = backgroundMapBounds(ui.background, this.backgroundImage);
    const topLeft = this.toScreen({ x: bounds.left, y: bounds.top }, ui);
    const bottomRight = this.toScreen({ x: bounds.right, y: bounds.bottom }, ui);
    ctx.save();
    ctx.globalAlpha = ui.mapIntensity;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(this.backgroundImage, topLeft.x, topLeft.y, bottomRight.x - topLeft.x, bottomRight.y - topLeft.y);
    ctx.restore();
  },

  hasBitmapBackground() {
    return !!this.backgroundImage;
  },

  backgroundExportCanvasBox(ui, area, size) {
    if (!this.backgroundImage || !ui?.background || !area || !size) return null;
    const previousBounds = this.bounds;
    const exportBounds = {
      left: Math.min(area.left, area.right),
      right: Math.max(area.left, area.right),
      top: Math.max(area.top, area.bottom),
      bottom: Math.min(area.top, area.bottom),
      width: Math.max(0.1, Math.abs(area.right - area.left)),
      height: Math.max(0.1, Math.abs(area.top - area.bottom))
    };
    const exportUi = {
      ...ui,
      pan: { x: 0, y: 0 },
      zoom: 1,
      __viewport: {
        width: Math.max(1, Math.round(size.width || 1)),
        height: Math.max(1, Math.round(size.height || 1))
      }
    };
    try {
      this.bounds = exportBounds;
      const bounds = backgroundMapBounds(ui.background, this.backgroundImage);
      const topLeft = this.toScreen({ x: bounds.left, y: bounds.top }, exportUi);
      const bottomRight = this.toScreen({ x: bounds.right, y: bounds.bottom }, exportUi);
      return {
        x: topLeft.x,
        y: topLeft.y,
        width: bottomRight.x - topLeft.x,
        height: bottomRight.y - topLeft.y
      };
    }
    finally {
      this.bounds = previousBounds;
    }
  },

  drawPrintArea(ctx, eventModel, ui) {
    const current = ui.printAreaEdit?.area || effectivePrintArea(eventModel, ui.selectedCourseId);
    if (current) {
      this.drawPrintAreaRect(ctx, current, ui, "#2b6d62", 0.85);
    }
    if (ui.printAreaEdit?.preview) {
      this.drawPrintAreaRect(ctx, ui.printAreaEdit.preview, ui, "#2477c9", 1);
    }
  },

  drawPrintAreaRect(ctx, area, ui, color, alpha) {
    if (!area) return;
    const p1 = this.toScreen({ x: area.left, y: area.top }, ui);
    const p2 = this.toScreen({ x: area.right, y: area.bottom }, ui);
    const x = Math.min(p1.x, p2.x);
    const y = Math.min(p1.y, p2.y);
    const width = Math.abs(p2.x - p1.x);
    const height = Math.abs(p2.y - p1.y);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = color;
    ctx.fillStyle = "rgba(36, 119, 201, 0.08)";
    ctx.setLineDash([8, 5]);
    ctx.lineWidth = 2;
    if (ui.printAreaEdit?.preview === area) {
      ctx.fillRect(x, y, width, height);
    }
    ctx.strokeRect(x, y, width, height);
    ctx.restore();
  },

  drawSpecials(ctx, eventModel, ui) {
    const selectedCourse = ui.selectedCourseId === "all" ? null : getCourse(eventModel, ui.selectedCourseId);
    const metrics = createCourseSymbolMetrics(eventModel, selectedCourse, eventModel.event.courseAppearance, this.scale(ui), false);
    for (const special of eventModel.specials) {
      if (!specialVisibleForCourse(special, ui.selectedCourseId, ui.showAllControls)) {
        continue;
      }
      const points = (special.locations || []).map(point => this.toScreen(point, ui));
      ctx.save();
      if (["boundary", "line"].includes(special.kind) && points.length >= 2) {
        drawLineSpecial(ctx, special, points, this.scale(ui));
      }
      else if (["out-of-bounds", "dangerous-area", "temporary-construction", "white-out"].includes(special.kind) && points.length >= 3) {
        ctx.strokeStyle = specialColor(special);
        ctx.fillStyle = fillForSpecial(special.kind);
        ctx.lineWidth = specialLineWidth(special, this.scale(ui));
        pathLines(ctx, points, true);
        ctx.fill();
        ctx.stroke();
      }
      else if (special.kind === "rectangle" && points.length >= 2) {
        drawRectSpecial(ctx, special, points[0], points[1], this.scale(ui), false);
      }
      else if (special.kind === "ellipse" && points.length >= 2) {
        drawRectSpecial(ctx, special, points[0], points[1], this.scale(ui), true);
      }
      else if (special.kind === "text" && points.length >= 1) {
        drawTextSpecial(ctx, special, points, this.scale(ui));
      }
      else if (special.kind === "descriptions" && points.length >= 2) {
        drawControlDescriptionBlock(ctx, eventModel, special, ui.selectedCourseId, point => this.toScreen(point, ui), mapCourseDisplayOptions(eventModel, ui));
      }
      else if (points.length) {
        if (!drawPointSpecialSymbol(ctx, special, points[0], metrics)) {
          drawFallbackSpecialPoint(ctx, special.kind, points[0]);
        }
      }
      ctx.restore();
    }
  },

  drawCourse(ctx, eventModel, ui) {
    const selectedCourseId = ui.selectedCourseId || "all";
    const allControls = selectedCourseId === "all";
    const selectedCourse = allControls ? null : getCourse(eventModel, selectedCourseId);
    const displayOptions = mapCourseDisplayOptions(eventModel, ui);
    const rows = allControls
      ? allControlsView(eventModel)
      : courseView(eventModel, selectedCourseId, displayOptions);
    const legs = allControls ? [] : courseLegs(eventModel, selectedCourseId, displayOptions);
    const metrics = createCourseSymbolMetrics(eventModel, selectedCourse, eventModel.event.courseAppearance, this.scale(ui), allControls);
    const labelRows = mergedCourseLabelRows(rows);
    const autoGaps = automaticLegGaps(
      legs,
      rows,
      labelRows,
      metrics,
      this.scale(ui),
      eventModel.event.courseAppearance?.autoLegGapSize || 3.5,
      location => this.toScreen(location, ui)
    );
    const autoCircleGaps = allControls ? new Map() : automaticControlCircleGaps(rows, metrics, this.scale(ui));

    ctx.save();

    for (const leg of legs) {
      const mapPoints = legMapPoints(leg);
      const screenPoints = mapPoints.map(point => this.toScreen(point, ui));
      const endpointGaps = flaggedEndpointGapSuppression(leg);
      const startRadius = courseLegTrimRadius(leg.from.control, metrics, { suppressCourseLineGap: endpointGaps.start });
      const screenGaps = screenGapsForLeg(
        [...(leg.leg?.gaps || []), ...(autoGaps.get(legKey(leg)) || [])],
        this.scale(ui),
        startRadius
      );
      const flagRanges = screenFlagRangesForLeg(leg, this.scale(ui), startRadius);
      drawCourseLeg(ctx, screenPoints, leg.from.control, leg.to.control, metrics, isEntireLegFlagged(leg), {
        gaps: screenGaps,
        flagRanges,
        suppressStartCourseLineGap: endpointGaps.start,
        suppressEndCourseLineGap: endpointGaps.end,
        dashed: leg.from.control?.kind === "map-issue" && leg.to.control?.kind === "start"
      });
    }

    for (const row of rows) {
      const point = this.toScreen(row.control.location, ui);
      drawCourseControl(ctx, row.control, point, metrics, {
        directionAngle: outgoingDirection(row, legs),
        circleGaps: autoCircleGaps.get(String(row.control.id)) || []
      });
    }

    for (const row of labelRows) {
      if (row.label && row.control.kind === "normal") {
        const point = this.toScreen(row.control.location, ui);
        const labelPoint = numberLocationPoint(row, point, metrics, labelRows, legs, location => this.toScreen(location, ui));
        drawControlLabel(ctx, row.label, labelPoint, metrics);
      }
    }
    ctx.restore();
  },

  drawAddableControls(ctx, eventModel, ui) {
    if (!ui.tool?.startsWith("control:") || !ui.selectedCourseId || ui.selectedCourseId === "all") {
      return;
    }
    const kind = ui.tool.slice("control:".length);
    const controls = addableControlsForTool(eventModel, ui.selectedCourseId, kind);
    if (!controls.length) return;
    const selectedCourse = getCourse(eventModel, ui.selectedCourseId);
    const metrics = createCourseSymbolMetrics(eventModel, selectedCourse, eventModel.event.courseAppearance, this.scale(ui), false);
    ctx.save();
    ctx.globalAlpha = 0.28;
    for (const control of controls) {
      const point = this.toScreen(control.location, ui);
      drawCourseControl(ctx, control, point, metrics, { directionAngle: Math.PI / 2 });
    }
    ctx.restore();
  },

  drawSelection(ctx, eventModel, ui) {
    if (!ui.selection) return;
    ctx.save();
    ctx.strokeStyle = "#2477c9";
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    if (ui.selection.type === "control") {
      const control = getControl(eventModel, ui.selection.id);
      if (control) {
        const selectedCourseId = ui.selectedCourseId || "all";
        const allControls = selectedCourseId === "all";
        const selectedCourse = allControls ? null : getCourse(eventModel, selectedCourseId);
        const metrics = createCourseSymbolMetrics(eventModel, selectedCourse, eventModel.event.courseAppearance, this.scale(ui), allControls);
        const point = this.toScreen(control.location, ui);
        const radius = Math.max(4, symbolApparentRadius(control, metrics));
        ctx.strokeRect(point.x - radius, point.y - radius, radius * 2, radius * 2);
        drawControlCenterPoint(ctx, point);
      }
    }
    else if (ui.selection.type === "leg" || ui.selection.type === "leg-bend") {
      const leg = selectedLegForSelection(eventModel, ui);
      if (leg) {
        const points = legMapPoints(leg).map(point => this.toScreen(point, ui));
        drawLegSelectionOutline(ctx, points);
        for (let index = 0; index < (leg.leg?.bends || []).length; index += 1) {
          const bendPoint = this.toScreen(leg.leg.bends[index], ui);
          drawBendDot(ctx, bendPoint, ui.selection.type === "leg-bend" && Number(ui.selection.bendIndex) === index);
        }
      }
    }
    else if (ui.selection.type === "leg-gap") {
      const leg = selectedLegForSelection(eventModel, ui);
      const gap = leg?.leg?.gaps?.[ui.selection.gapIndex];
      if (leg && gap) {
        const points = legMapPoints(leg);
        const start = pointAtPathDistance(points, gap.start);
        const end = pointAtPathDistance(points, gap.start + gap.length);
        const startScreen = this.toScreen(start, ui);
        const endScreen = this.toScreen(end, ui);
        ctx.setLineDash([]);
        ctx.strokeStyle = "#2477c9";
        ctx.lineWidth = 2;
        line(ctx, startScreen.x, startScreen.y, endScreen.x, endScreen.y);
        drawHandleDot(ctx, startScreen, "start");
        drawHandleDot(ctx, endScreen, "end");
      }
    }
    else if (ui.selection.type === "control-number") {
      const row = selectedControlNumberRow(eventModel, ui);
      if (row) {
        const selectedCourse = getCourse(eventModel, ui.selectedCourseId);
        const metrics = createCourseSymbolMetrics(eventModel, selectedCourse, eventModel.event.courseAppearance, this.scale(ui), false);
        const displayOptions = mapCourseDisplayOptions(eventModel, ui);
        const rows = mergedCourseLabelRows(courseView(eventModel, ui.selectedCourseId, displayOptions));
        const legs = courseLegs(eventModel, ui.selectedCourseId, displayOptions);
        const rect = controlNumberScreenRect(row, metrics, rows, legs, location => this.toScreen(location, ui), 4);
        ctx.strokeRect(rect.left, rect.top, rect.right - rect.left, rect.bottom - rect.top);
      }
    }
    else if (ui.selection.type === "special") {
      const special = eventModel.specials.find(item => item.id === ui.selection.id);
      if (special?.locations?.length && specialVisibleForCourse(special, ui.selectedCourseId, ui.showAllControls)) {
        const sourcePoints = special.kind === "descriptions"
          ? descriptionCornerPoints(eventModel, special, ui.selectedCourseId, mapCourseDisplayOptions(eventModel, ui)).map(point => this.toScreen(point, ui))
          : specialSelectionPoints(special, ui, this.scale(ui)).map(point => this.toScreen(point, ui));
        if (sourcePoints.length) {
          const rect = screenRectFromPoints(sourcePoints);
          ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
        }
      }
    }
    ctx.restore();
  },

  drawBackgroundCalibration(ctx, ui) {
    if (ui.selection?.type !== "background") return;
    const points = backgroundCalibrationMapPoints(ui.background, this.backgroundImage);
    if (!points.length) return;
    ctx.save();
    ctx.strokeStyle = "#2477c9";
    ctx.fillStyle = "#2477c9";
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 4]);
    const screen = points.map(point => this.toScreen(point, ui));
    if (screen.length >= 2) {
      line(ctx, screen[0].x, screen[0].y, screen[1].x, screen[1].y);
    }
    ctx.setLineDash([]);
    for (const point of screen) {
      ctx.beginPath();
      ctx.arc(point.x, point.y, 5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  },

  drawSpecialHandles(ctx, eventModel, ui) {
    if (ui.selection?.type !== "special") return;
    const special = eventModel.specials.find(item => Number(item.id) === Number(ui.selection.id));
    if (!special || !specialVisibleForCourse(special, ui.selectedCourseId, ui.showAllControls)) return;
    const scale = this.scale(ui);
    ctx.save();
    const handles = specialResizeHandles(special, ui, scale, eventModel);
    for (const handle of handles) {
      drawSquareHandle(ctx, this.toScreen(handle.point, ui), true);
    }
    ctx.restore();
  },

  drawMovePreview(ctx, eventModel, ui) {
    const preview = ui.movePreview;
    if (!preview?.selection || !preview.location) return;

    ctx.save();
    ctx.globalAlpha = 0.55;
    ctx.setLineDash([6, 4]);
    if (preview.selection.type === "control") {
      const control = getControl(eventModel, preview.selection.id);
      if (control) {
        const selectedCourseId = ui.selectedCourseId || "all";
        const allControls = selectedCourseId === "all";
        const selectedCourse = allControls ? null : getCourse(eventModel, selectedCourseId);
        const metrics = createCourseSymbolMetrics(eventModel, selectedCourse, eventModel.event.courseAppearance, this.scale(ui), allControls);
        const point = this.toScreen(preview.location, ui);
        drawCourseControl(ctx, { ...control, location: preview.location }, point, metrics, { directionAngle: Math.PI / 2 });
        ctx.strokeStyle = "#2477c9";
        ctx.lineWidth = 2;
        ctx.strokeRect(point.x - 24, point.y - 24, 48, 48);
      }
    }
    else if (preview.selection.type === "control-number") {
      const row = selectedControlNumberRow(eventModel, { ...ui, selection: preview.selection });
      if (row) {
        const selectedCourse = getCourse(eventModel, ui.selectedCourseId);
        const metrics = createCourseSymbolMetrics(eventModel, selectedCourse, eventModel.event.courseAppearance, this.scale(ui), false);
        const point = this.toScreen(preview.location, ui);
        drawControlLabel(ctx, row.label, point, metrics);
        const rect = controlNumberRect(row.label, point, metrics, 4);
        ctx.strokeStyle = "#2477c9";
        ctx.lineWidth = 2;
        ctx.strokeRect(rect.left, rect.top, rect.right - rect.left, rect.bottom - rect.top);
      }
    }
    else if (preview.selection.type === "special") {
      const special = eventModel.specials.find(item => item.id === preview.selection.id);
      if (special?.locations?.length) {
        const first = special.locations[0];
        const dx = preview.location.x - first.x;
        const dy = preview.location.y - first.y;
        const moved = { ...special, locations: special.locations.map(point => ({ x: point.x + dx, y: point.y + dy })) };
        if (moved.kind === "descriptions") {
          drawControlDescriptionBlock(ctx, eventModel, moved, ui.selectedCourseId, point => this.toScreen(point, ui), mapCourseDisplayOptions(eventModel, ui));
        }
        const sourcePoints = moved.kind === "descriptions"
          ? descriptionCornerPoints(eventModel, moved, ui.selectedCourseId, mapCourseDisplayOptions(eventModel, ui))
          : specialSelectionPoints(moved, ui, this.scale(ui));
        const points = sourcePoints.map(point => this.toScreen(point, ui));
        const rect = screenRectFromPoints(points);
        ctx.strokeStyle = "#2477c9";
        ctx.lineWidth = 2;
        ctx.strokeRect(rect.x - 8, rect.y - 8, rect.w + 16, rect.h + 16);
      }
    }
    ctx.restore();
  },

  drawResizePreview(ctx, eventModel, ui) {
    const preview = ui.resizePreview;
    if (!preview?.special) return;
    ctx.save();
    ctx.globalAlpha = 0.58;
    drawSpecialObject(ctx, eventModel, preview.special, ui, point => this.toScreen(point, ui), this.scale(ui));
    const sourcePoints = preview.special.kind === "descriptions"
      ? descriptionCornerPoints(eventModel, preview.special, ui.selectedCourseId, mapCourseDisplayOptions(eventModel, ui))
      : specialSelectionPoints(preview.special, ui, this.scale(ui));
    const points = sourcePoints.map(point => this.toScreen(point, ui));
    const rect = screenRectFromPoints(points);
    ctx.strokeStyle = "#2477c9";
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 4]);
    ctx.strokeRect(rect.x - 8, rect.y - 8, rect.w + 16, rect.h + 16);
    ctx.restore();
  },

  drawToolPreview(ctx, eventModel, ui) {
    if (!this.toolPreview || this.toolPreview.tool !== ui.tool) {
      return;
    }
    const point = this.toScreen(this.toolPreview.point, ui);
    const selectedCourseId = ui.selectedCourseId || "all";
    const allControls = selectedCourseId === "all";
    const selectedCourse = allControls ? null : getCourse(eventModel, selectedCourseId);
    const metrics = createCourseSymbolMetrics(eventModel, selectedCourse, eventModel.event.courseAppearance, this.scale(ui), allControls);

    ctx.save();
    ctx.globalAlpha = 0.62;
    if (ui.tool.startsWith("control:")) {
      const kind = ui.tool.slice("control:".length);
      drawCourseControl(ctx, {
        kind,
        location: this.toolPreview.point,
        orientation: 0,
        stretch: 0,
        circleGaps: []
      }, point, metrics, { directionAngle: Math.PI / 2 });
    }
    else if (ui.tool.startsWith("special:")) {
      const kind = ui.tool.slice("special:".length);
      if (kind === "descriptions") {
        const special = this.descriptionDragPreview || {
          id: 0,
          kind,
          ...createDescriptionSpecialOptions(eventModel, this.toolPreview.point, ui.selectedCourseId, mapCourseDisplayOptions(eventModel, ui))
        };
        drawControlDescriptionBlock(ctx, eventModel, special, ui.selectedCourseId, mapPoint => this.toScreen(mapPoint, ui), mapCourseDisplayOptions(eventModel, ui));
      }
      else if (this.specialShapePreview && this.specialShapePreview.tool === ui.tool) {
        const special = this.specialShapePreview;
        const points = special.locations.map(location => this.toScreen(location, ui));
        if (special.kind === "line") {
          drawLineSpecial(ctx, special, points, this.scale(ui));
        }
        else if (special.kind === "rectangle") {
          drawRectSpecial(ctx, special, points[0], points[1], this.scale(ui), false);
        }
        else if (special.kind === "ellipse") {
          drawRectSpecial(ctx, special, points[0], points[1], this.scale(ui), true);
        }
      }
      else if (!drawPointSpecialSymbol(ctx, { kind, orientation: 0, stretch: 0 }, point, metrics)) {
        drawFallbackSpecialPoint(ctx, kind, point);
      }
    }
    ctx.restore();
  }

  };
}
