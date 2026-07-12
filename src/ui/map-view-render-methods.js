import { resolveTextConstants } from "../domain/constants.js?v=20260712-18";
import { measurementLabelPoint, measurementMetrics } from "../domain/measurement.js?v=20260712-18";

export function zoomScreenSize(basePixels, zoom) {
  const editorScale = Math.min(1, Math.max(0, Number(zoom) || 0));
  return Math.max(0.01, Math.abs(Number(basePixels) || 0) * editorScale);
}

export function measurementLineDash(lineStyle, zoom) {
  if (lineStyle === "dashed") return [zoomScreenSize(8, zoom), zoomScreenSize(5, zoom)];
  if (lineStyle === "dotted") return [zoomScreenSize(0.1, zoom), zoomScreenSize(5, zoom)];
  return [];
}

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
    crossingRotationHandle,
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
    drawAreaSpecial,
    drawLineSpecial,
    drawRectSpecial,
    drawTextSpecial,
    screenRectFromPoints,
    descriptionCornerPoints,
    specialCategoryForHitTest,
    symbolApparentRadiusControl,
    clamp,
    effectiveCanvasPixelRatio,
    renderQualityImageSmoothingQuality
  } = deps;
  return {
  draw(state) {
    const { eventModel, ui } = state;
    this.lastDrawState = state;
    if (this.resizeForDpi(ui)) {
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
    this.drawSpecials(ctx, eventModel, ui);
    if (ui.showPrintArea) {
      this.drawPrintArea(ctx, eventModel, ui);
    }
    this.drawCourse(ctx, eventModel, ui);
    this.drawMeasurement(ctx, ui);
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

  resizeForDpi(ui = this.store.snapshot().ui) {
    const ratio = effectiveCanvasPixelRatio(ui, window.devicePixelRatio || 1);
    const rect = this.canvas.getBoundingClientRect();
    const width = Math.max(1, Math.floor(rect.width));
    const height = Math.max(1, Math.floor(rect.height));
    // Canvas width/height are integer attributes. Balanced uses ratio=1.5, so
    // sizes such as 329 * 1.5 = 493.5 were being assigned as 493 but compared
    // against 493.5 on the next frame. That made resizeForDpi() return true on
    // every draw, which invalidated the OMAP cache immediately after the worker
    // stored a valid layer.
    const targetWidth = Math.max(1, Math.round(width * ratio));
    const targetHeight = Math.max(1, Math.round(height * ratio));
    if (this.canvas.width !== targetWidth || this.canvas.height !== targetHeight) {
      this.canvas.width = targetWidth;
      this.canvas.height = targetHeight;
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
    ctx.imageSmoothingQuality = renderQualityImageSmoothingQuality(ui);
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
      const rotationPreview = ui.crossingRotationPreview?.selection?.type === "special"
        && Number(ui.crossingRotationPreview.selection.id) === Number(special.id)
        ? ui.crossingRotationPreview.orientation
        : null;
      const renderedSpecial = rotationPreview === null ? special : { ...special, orientation: rotationPreview };
      const points = (renderedSpecial.locations || []).map(point => this.toScreen(point, ui));
      ctx.save();
      if (["boundary", "line"].includes(renderedSpecial.kind) && points.length >= 2) {
        drawLineSpecial(ctx, renderedSpecial, points, this.scale(ui), metrics);
      }
      else if (["out-of-bounds", "dangerous-area", "temporary-construction", "white-out"].includes(renderedSpecial.kind) && points.length >= 3) {
        drawAreaSpecial(ctx, renderedSpecial, points, this.scale(ui), metrics);
      }
      else if (renderedSpecial.kind === "rectangle" && points.length >= 2) {
        drawRectSpecial(ctx, renderedSpecial, points[0], points[1], this.scale(ui), false);
      }
      else if (renderedSpecial.kind === "ellipse" && points.length >= 2) {
        drawRectSpecial(ctx, renderedSpecial, points[0], points[1], this.scale(ui), true);
      }
      else if (renderedSpecial.kind === "text" && points.length >= 1) {
        drawTextSpecial(ctx, { ...renderedSpecial, text: resolveTextConstants(renderedSpecial.text, eventModel, ui) }, points, this.scale(ui));
      }
      else if (renderedSpecial.kind === "descriptions" && points.length >= 2) {
        drawControlDescriptionBlock(ctx, eventModel, renderedSpecial, ui.selectedCourseId, point => this.toScreen(point, ui), mapCourseDisplayOptions(eventModel, ui));
      }
      else if (points.length) {
        if (!drawPointSpecialSymbol(ctx, renderedSpecial, points[0], metrics)) {
          drawFallbackSpecialPoint(ctx, renderedSpecial.kind, points[0], Math.min(1, ui.zoom || 1));
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
      const rotationPreview = ui.crossingRotationPreview?.selection?.type === "control"
        && Number(ui.crossingRotationPreview.selection.id) === Number(row.control.id)
        ? ui.crossingRotationPreview.orientation
        : null;
      const renderedControl = rotationPreview === null ? row.control : { ...row.control, orientation: rotationPreview };
      drawCourseControl(ctx, renderedControl, point, metrics, {
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
        const rotationPreview = ui.crossingRotationPreview?.selection?.type === "control"
          && Number(ui.crossingRotationPreview.selection.id) === Number(control.id)
          ? ui.crossingRotationPreview.orientation
          : null;
        const displayedControl = rotationPreview === null ? control : { ...control, orientation: rotationPreview };
        const point = this.toScreen(displayedControl.location, ui);
        const radius = Math.max(4, symbolApparentRadius(displayedControl, metrics));
        ctx.strokeRect(point.x - radius, point.y - radius, radius * 2, radius * 2);
        drawControlCenterPoint(ctx, point);
        const rotationHandle = crossingRotationHandle(displayedControl, this.scale(ui));
        if (rotationHandle) {
          const handlePoint = this.toScreen(rotationHandle, ui);
          ctx.setLineDash([]);
          ctx.strokeStyle = "#2477c9";
          ctx.lineWidth = 1.5;
          line(ctx, point.x, point.y, handlePoint.x, handlePoint.y);
          drawHandleDot(ctx, handlePoint, "end", Math.min(1, ui.zoom || 1));
        }
      }
    }
    else if (ui.selection.type === "leg" || ui.selection.type === "leg-bend") {
      const leg = selectedLegForSelection(eventModel, ui);
      if (leg) {
        const points = legMapPoints(leg).map(point => this.toScreen(point, ui));
        drawLegSelectionOutline(ctx, points);
        for (let index = 0; index < (leg.leg?.bends || []).length; index += 1) {
          const bendPoint = this.toScreen(leg.leg.bends[index], ui);
          drawBendDot(ctx, bendPoint, ui.selection.type === "leg-bend" && Number(ui.selection.bendIndex) === index, Math.min(1, ui.zoom || 1));
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
        const handleScale = Math.min(1, ui.zoom || 1);
        drawHandleDot(ctx, startScreen, "start", handleScale);
        drawHandleDot(ctx, endScreen, "end", handleScale);
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
          : specialSelectionPoints(special, ui, this.scale(ui), eventModel).map(point => this.toScreen(point, ui));
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
    const screen = points.map(point => this.toScreen(point, ui));
    drawBackgroundCalibrationGuide(ctx, screen);
  },

  drawSpecialHandles(ctx, eventModel, ui) {
    if (ui.selection?.type !== "special") return;
    const special = eventModel.specials.find(item => Number(item.id) === Number(ui.selection.id));
    if (!special || !specialVisibleForCourse(special, ui.selectedCourseId, ui.showAllControls)) return;
    const scale = this.scale(ui);
    ctx.save();
    const rotationPreview = ui.crossingRotationPreview?.selection?.type === "special"
      && Number(ui.crossingRotationPreview.selection.id) === Number(special.id)
      ? ui.crossingRotationPreview.orientation
      : null;
    const displayedSpecial = rotationPreview === null ? special : { ...special, orientation: rotationPreview };
    const rotationHandle = crossingRotationHandle(displayedSpecial, scale);
    if (rotationHandle) {
      const center = this.toScreen(displayedSpecial.locations[0], ui);
      const handlePoint = this.toScreen(rotationHandle, ui);
      ctx.setLineDash([]);
      ctx.strokeStyle = "#2477c9";
      ctx.lineWidth = 1.5;
      line(ctx, center.x, center.y, handlePoint.x, handlePoint.y);
      drawHandleDot(ctx, handlePoint, "end", Math.min(1, ui.zoom || 1));
    }
    const handles = specialResizeHandles(special, ui, scale, eventModel);
    for (const handle of handles) {
      drawSquareHandle(ctx, this.toScreen(handle.point, ui), true, Math.min(1, ui.zoom || 1));
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
          : specialSelectionPoints(moved, ui, this.scale(ui), eventModel);
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
      : specialSelectionPoints(preview.special, ui, this.scale(ui), eventModel);
    const points = sourcePoints.map(point => this.toScreen(point, ui));
    const rect = screenRectFromPoints(points);
    ctx.strokeStyle = "#2477c9";
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 4]);
    ctx.strokeRect(rect.x - 8, rect.y - 8, rect.w + 16, rect.h + 16);
    ctx.restore();
  },

  drawMeasurement(ctx, ui) {
    const measurement = ui.tool === "measure" ? ui.measurement : null;
    if (!measurement) return;
    const items = measurement.items || [];
    for (let index = 0; index < items.length; index += 1) {
      this.drawMeasurementItem(ctx, ui, items[index], null, {
        selected: index === measurement.selectedIndex,
        showGroundLabel: !!measurement.showGroundLabels
      });
    }
    const draft = measurement.draft || { points: [], color: measurement.color, showGroundLabels: measurement.showGroundLabels };
    if (measurement.adding) {
      const hover = this.toolPreview?.tool === "measure" ? this.toolPreview.point : null;
      this.drawMeasurementItem(ctx, ui, draft, hover, { showGroundLabel: false, showHandles: true });
    }
  },

  drawMeasurementItem(ctx, ui, item, hover = null, options = {}) {
    const fixedLocations = item.points || [];
    if (!fixedLocations.length) return;
    const locations = [...fixedLocations, ...(hover ? [hover] : [])];
    const points = locations.map(location => this.toScreen(location, ui));
    const fixedCount = fixedLocations.length;
    const color = /^#[0-9a-f]{6}$/i.test(item.color || "") ? item.color : "#007f93";
    const zoomScale = Math.min(1, Math.max(0.01, Number(ui.zoom) || 1));
    ctx.save();
    if (item.closed && fixedCount >= 3) {
      ctx.fillStyle = hexWithAlpha(color, 0.14);
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      for (let index = 1; index < fixedCount; index += 1) ctx.lineTo(points[index].x, points[index].y);
      ctx.closePath();
      ctx.fill();
    }
    if (options.selected) {
      ctx.strokeStyle = "rgba(255, 166, 0, 0.9)";
      ctx.lineWidth = zoomScreenSize(8, zoomScale);
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      for (let index = 1; index < points.length; index += 1) ctx.lineTo(points[index].x, points[index].y);
      if (item.closed && fixedCount >= 3) ctx.closePath();
      ctx.stroke();
    }
    ctx.strokeStyle = color;
    ctx.lineWidth = zoomScreenSize(3, zoomScale);
    ctx.setLineDash(measurementLineDash(item.lineStyle, zoomScale));
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let index = 1; index < points.length; index += 1) ctx.lineTo(points[index].x, points[index].y);
    if (item.closed && fixedCount >= 3) ctx.closePath();
    ctx.stroke();

    if (options.selected || options.showHandles) {
      ctx.setLineDash([]);
      for (let index = 0; index < fixedCount; index += 1) {
        const point = points[index];
        ctx.fillStyle = index === 0 && fixedCount >= 3 && !item.closed ? "#fff4c2" : "#ffffff";
        ctx.strokeStyle = color;
        ctx.lineWidth = zoomScreenSize(2, zoomScale);
        ctx.beginPath();
        ctx.arc(point.x, point.y, zoomScreenSize(index === 0 ? 6 : 4.5, zoomScale), 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }
    }
    if (options.showGroundLabel && fixedCount >= 2) {
      const labelMapPoint = measurementLabelPoint(item);
      if (labelMapPoint) {
        const labelPoint = this.toScreen(labelMapPoint, ui);
        if (!item.labelPosition) labelPoint.y -= 14 * zoomScale;
        const metrics = measurementMetrics(fixedLocations, !!item.closed);
        const totalM = item.closed ? metrics.perimeterM : metrics.lineLengthM;
        drawGroundDistanceLabel(ctx, totalM, labelPoint, color, options.selected, zoomScale);
      }
    }
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
    if (ui.tool === "background-calibration") {
      const selectedPoints = backgroundCalibrationMapPoints(ui.background, this.backgroundImage);
      const previewPoints = selectedPoints.length
        ? [this.toScreen(selectedPoints[0], ui), point]
        : [point];
      drawBackgroundCalibrationGuide(ctx, previewPoints);
    }
    else if (ui.tool.startsWith("control:")) {
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
      if (this.areaSpecialDraft?.tool === ui.tool) {
        const hoverPoint = this.toolPreview?.tool === ui.tool ? this.toolPreview.point : null;
        const lastDraftPoint = this.areaSpecialDraft.points[this.areaSpecialDraft.points.length - 1] || null;
        const includeHover = hoverPoint && (!lastDraftPoint || Math.hypot(hoverPoint.x - lastDraftPoint.x, hoverPoint.y - lastDraftPoint.y) > 0.001);
        const draftLocations = [
          ...this.areaSpecialDraft.points,
          ...(includeHover ? [hoverPoint] : [])
        ];
        const points = draftLocations.map(location => this.toScreen(location, ui));
        const special = {
          id: 0,
          kind,
          locations: draftLocations,
          color: "upper-purple",
          lineKind: ui.specialToolOptions?.lineKind || (kind === "white-out" ? "none" : "single")
        };
        if (draftLocations.length >= 3) {
          drawAreaSpecial(ctx, special, points, this.scale(ui), metrics);
        }
        else if (points.length >= 1) {
          const previewZoom = Math.min(1, Math.max(0.01, Number(ui.zoom) || 1));
          ctx.strokeStyle = metrics.color;
          ctx.fillStyle = metrics.color;
          ctx.lineWidth = Math.max(0.01, 2 * previewZoom);
          ctx.setLineDash([6 * previewZoom, 4 * previewZoom]);
          ctx.beginPath();
          ctx.moveTo(points[0].x, points[0].y);
          for (let i = 1; i < points.length; i += 1) {
            ctx.lineTo(points[i].x, points[i].y);
          }
          ctx.stroke();
          for (const p of points) {
            ctx.beginPath();
            ctx.arc(p.x, p.y, 3 * previewZoom, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }
      else if (kind === "descriptions") {
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
        if (["line", "boundary"].includes(special.kind)) {
          drawLineSpecial(ctx, special, points, this.scale(ui), metrics);
        }
        else if (special.kind === "rectangle") {
          drawRectSpecial(ctx, special, points[0], points[1], this.scale(ui), false);
        }
        else if (special.kind === "ellipse") {
          drawRectSpecial(ctx, special, points[0], points[1], this.scale(ui), true);
        }
      }
      else if (!drawPointSpecialSymbol(ctx, { kind, orientation: 0, stretch: 0 }, point, metrics)) {
        drawFallbackSpecialPoint(ctx, kind, point, Math.min(1, ui.zoom || 1));
      }
    }
    ctx.restore();
  }

  };
}

export function drawBackgroundCalibrationGuide(ctx, points) {
  if (!Array.isArray(points) || !points.length) return;
  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  if (points.length >= 2) {
    ctx.strokeStyle = "rgba(255, 255, 255, 0.94)";
    ctx.lineWidth = 5;
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    ctx.lineTo(points[1].x, points[1].y);
    ctx.stroke();
    ctx.strokeStyle = "#2477c9";
    ctx.lineWidth = 2.5;
    ctx.setLineDash([7, 5]);
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    ctx.lineTo(points[1].x, points[1].y);
    ctx.stroke();
  }
  ctx.setLineDash([]);
  ctx.font = "700 10px Roboto, Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  for (let index = 0; index < Math.min(points.length, 2); index += 1) {
    const point = points[index];
    ctx.beginPath();
    ctx.arc(point.x, point.y, 8, 0, Math.PI * 2);
    ctx.fillStyle = "#2477c9";
    ctx.fill();
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = "#fff";
    ctx.fillText(String(index + 1), point.x, point.y + 0.5);
  }
  ctx.restore();
}

function drawGroundDistanceLabel(ctx, distanceM, point, color, selected, zoomScale) {
  const label = distanceM >= 1000 ? `${(distanceM / 1000).toFixed(2)} km` : `${distanceM.toFixed(distanceM < 10 ? 1 : 0)} m`;
  const fontSize = zoomScreenSize(12, zoomScale);
  if (fontSize < 0.5) return;
  ctx.font = `600 ${fontSize}px Roboto, Arial, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.lineJoin = "round";
  ctx.strokeStyle = selected ? "rgba(255, 214, 128, 0.98)" : "rgba(255, 255, 255, 0.94)";
  ctx.lineWidth = zoomScreenSize(selected ? 6 : 4, zoomScale);
  ctx.strokeText(label, point.x, point.y);
  ctx.fillStyle = color;
  ctx.fillText(label, point.x, point.y);
}

function hexWithAlpha(color, alpha) {
  const red = Number.parseInt(color.slice(1, 3), 16);
  const green = Number.parseInt(color.slice(3, 5), 16);
  const blue = Number.parseInt(color.slice(5, 7), 16);
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}
