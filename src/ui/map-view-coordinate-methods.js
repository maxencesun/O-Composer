export function createMapViewCoordinateMethods(deps) {
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
  toScreen(point, ui) {
    const { width, height } = this.viewportSize(ui);
    const scale = this.scale(ui);
    const cx = (this.bounds.left + this.bounds.right) / 2;
    const cy = (this.bounds.top + this.bounds.bottom) / 2;
    return {
      x: width / 2 + (point.x - cx) * scale + ui.pan.x,
      y: height / 2 + (cy - point.y) * scale + ui.pan.y
    };
  },

  toMap(point, ui) {
    const { width, height } = this.viewportSize(ui);
    const scale = this.scale(ui);
    const cx = (this.bounds.left + this.bounds.right) / 2;
    const cy = (this.bounds.top + this.bounds.bottom) / 2;
    return {
      x: (point.x - width / 2 - ui.pan.x) / scale + cx,
      y: cy - (point.y - height / 2 - ui.pan.y) / scale
    };
  },

  scale(ui) {
    const { width, height } = this.viewportSize(ui);
    return Math.min(width / this.bounds.width, height / this.bounds.height) * (ui.zoom || 1);
  },

  viewportSize(ui) {
    return {
      width: ui?.__viewport?.width || this.canvas.clientWidth || 1,
      height: ui?.__viewport?.height || this.canvas.clientHeight || 1
    };
  },

  gridSpacing() {
    const size = Math.max(this.bounds.width, this.bounds.height);
    const rough = size / 10;
    const power = Math.pow(10, Math.floor(Math.log10(rough)));
    const normalized = rough / power;
    if (normalized > 5) return 10 * power;
    if (normalized > 2) return 5 * power;
    if (normalized > 1) return 2 * power;
    return power;
  },

  visibleBounds(eventModel, ui = this.store.snapshot().ui) {
    const omapBounds = this.omapMap?.bounds;
    const bgBounds = this.backgroundImage ? backgroundMapBounds(ui.background, this.backgroundImage) : null;
    let bounds = eventBounds(eventModel);
    if (bgBounds) {
      bounds = hasEventGeometry(eventModel) ? mergeBounds(bounds, paddedBounds(bgBounds)) : paddedBounds(bgBounds);
    }
    if (!omapBounds) {
      return bounds;
    }
    if (!hasEventGeometry(eventModel)) {
      return bgBounds ? mergeBounds(bounds, paddedBounds(omapBounds)) : paddedBounds(omapBounds);
    }
    return mergeBounds(bounds, paddedBounds(omapBounds));
  },

  currentViewBounds(ui = this.store.snapshot().ui) {
    const width = this.canvas.clientWidth || 1;
    const height = this.canvas.clientHeight || 1;
    const topLeft = this.toMap({ x: 0, y: 0 }, ui);
    const bottomRight = this.toMap({ x: width, y: height }, ui);
    return {
      left: Math.min(topLeft.x, bottomRight.x),
      right: Math.max(topLeft.x, bottomRight.x),
      top: Math.max(topLeft.y, bottomRight.y),
      bottom: Math.min(topLeft.y, bottomRight.y)
    };
  }
  };
}
