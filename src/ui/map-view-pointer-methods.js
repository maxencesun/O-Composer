export function createMapViewPointerMethods(deps) {
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
  pointerDown(event) {
    this.canvas.setPointerCapture(event.pointerId);
    const screen = pointerPosition(event);
    this._dragRect = event.currentTarget?.getBoundingClientRect?.() || null;
    this.activePointers.set(event.pointerId, screen);
    if (this.activePointers.size >= 2) {
      this.beginPinch();
      return;
    }
    const state = this.store.snapshot();
    const mapPoint = this.toMap(screen, state.ui);
    if (state.ui.tool === "print-area-frame") {
      const frameCenter = printAreaCenter(state.ui.printAreaEdit?.preview || state.ui.printAreaEdit?.area || effectivePrintArea(state.eventModel, state.ui.selectedCourseId));
      this.drag = {
        pointerId: event.pointerId,
        startScreen: screen,
        lastScreen: screen,
        startMap: mapPoint,
        hit: null,
        moved: false,
        panning: false,
        printAreaFrame: true,
        printAreaFrameOffset: {
          x: frameCenter.x - mapPoint.x,
          y: frameCenter.y - mapPoint.y
        }
      };
      return;
    }
    if (state.ui.tool === "print-area") {
      this.drag = {
        pointerId: event.pointerId,
        startScreen: screen,
        lastScreen: screen,
        startMap: mapPoint,
        hit: null,
        moved: false,
        panning: false,
        printArea: true
      };
      return;
    }
    if (state.ui.tool === "special:descriptions") {
      const options = createDescriptionSpecialOptions(state.eventModel, mapPoint, state.ui.selectedCourseId, mapCourseDisplayOptions(state.eventModel, state.ui));
      this.descriptionDragPreview = {
        ...options,
        id: 0,
        kind: "descriptions"
      };
      this.drag = {
        pointerId: event.pointerId,
        startScreen: screen,
        lastScreen: screen,
        startMap: mapPoint,
        hit: null,
        moved: false,
        panning: false,
        descriptionAdd: true
      };
      this.requestDraw(state);
      return;
    }
    if (isDragSpecialTool(state.ui.tool)) {
      this.specialShapePreview = specialShapeForDrag(state.ui.tool, mapPoint, mapPoint, state);
      this.drag = {
        pointerId: event.pointerId,
        startScreen: screen,
        lastScreen: screen,
        startMap: mapPoint,
        hit: null,
        moved: false,
        panning: false,
        specialShapeAdd: true,
        tool: state.ui.tool
      };
      this.requestDraw(state);
      return;
    }
    const hit = this.hitTest(mapPoint, state);
    const emptySpacePan = state.ui.tool === "select" && !state.ui.selection && !hit;
    this.drag = {
      pointerId: event.pointerId,
      startScreen: screen,
      lastScreen: screen,
      startMap: mapPoint,
      hit,
      moveOffset: moveOffsetForHit(state.eventModel, hit, mapPoint),
      resize: resizeForHit(hit),
      moved: false,
      panning: emptySpacePan || event.button === 1 || event.altKey || state.ui.tool === "pan"
    };
  },

  pointerMove(event) {
    const screen = pointerPosition(event, this._dragRect);
    if (this.activePointers.has(event.pointerId)) {
      this.activePointers.set(event.pointerId, screen);
    }
    if (this.pinch && this.activePointers.size >= 2) {
      this.updatePinch();
      return;
    }
    const state = this.store.snapshot();
    const mapPoint = this.toMap(screen, state.ui);
    const previewPoint = this.previewPointForTool(state.ui.tool, mapPoint, state);
    this.callbacks.onHover?.(previewPoint);
    this.updateToolPreview(state.ui.tool, previewPoint);
    if (!this.drag || this.drag.pointerId !== event.pointerId) {
      return;
    }
    const dx = screen.x - this.drag.lastScreen.x;
    const dy = screen.y - this.drag.lastScreen.y;
    const total = Math.hypot(screen.x - this.drag.startScreen.x, screen.y - this.drag.startScreen.y);
    this.drag.moved = this.drag.moved || total > 3;
    this.drag.lastScreen = screen;

    if (this.drag.panning) {
      this.startFastOmapInteraction();
      this.store.updateUi(ui => {
        ui.pan = { x: ui.pan.x + dx, y: ui.pan.y + dy };
      }, "Pan");
      return;
    }

    if (this.drag.printArea) {
      this.callbacks.onPrintAreaPreview?.(this.drag.startMap, mapPoint);
      return;
    }

    if (this.drag.printAreaFrame) {
      if (this.drag.moved) {
        this.callbacks.onPrintAreaFrameMove?.(printAreaFrameDragCenter(this.drag, mapPoint));
      }
      return;
    }

    if (this.drag.descriptionAdd) {
      const base = {
        id: 0,
        kind: "descriptions",
        ...createDescriptionSpecialOptions(state.eventModel, this.drag.startMap, state.ui.selectedCourseId, mapCourseDisplayOptions(state.eventModel, state.ui))
      };
      this.descriptionDragPreview = resizedDescriptionSpecial(state.eventModel, base, this.drag.startMap, mapPoint, state.ui.selectedCourseId, mapCourseDisplayOptions(state.eventModel, state.ui));
      this.requestDraw(state);
      return;
    }

    if (this.drag.specialShapeAdd) {
      this.specialShapePreview = specialShapeForDrag(this.drag.tool, this.drag.startMap, mapPoint, state);
      this.requestDraw(state);
      return;
    }

    if (this.drag.resize && this.drag.moved && state.ui.tool === "select") {
      this.callbacks.onResizeSelectionPreview?.(this.drag.hit, this.drag.resize, mapPoint);
      return;
    }

    if (this.drag.hit?.type === "leg-gap" && this.drag.hit.handle && this.drag.moved && state.ui.tool === "select") {
      this.callbacks.onLegGapHandleMove?.(this.drag.hit, mapPoint);
      return;
    }

    if (this.drag.hit?.type === "leg-bend" && this.drag.moved && state.ui.tool === "select") {
      this.callbacks.onLegBendMove?.(this.drag.hit, mapPoint);
      return;
    }

    if (this.drag.hit?.type === "background-calibration-point" && this.drag.moved && state.ui.tool === "select") {
      this.callbacks.onBackgroundCalibrationPointMove?.(this.drag.hit, mapPoint, { transient: true });
      return;
    }

    if (this.drag.hit && this.drag.moved && state.ui.tool === "select") {
      this.callbacks.onMoveSelectionPreview?.(this.drag.hit, moveTargetForDrag(this.drag, mapPoint));
    }
  },

  pointerUp(event) {
    const screen = pointerPosition(event);
    this.activePointers.delete(event.pointerId);
    if (this.pinch) {
      if (this.activePointers.size >= 2) {
        this.beginPinch();
      }
      else {
        this.pinch = null;
        this.cancelDrag();
      }
      return;
    }
    if (!this.drag || this.drag.pointerId !== event.pointerId) {
      return;
    }
    const state = this.store.snapshot();
    const mapPoint = this.toMap(screen, state.ui);
    if (this.drag.panning) {
      this.cancelDrag();
      return;
    }
    if (this.drag.printArea) {
      if (this.drag.moved) {
        this.callbacks.onPrintAreaCommit?.(this.drag.startMap, mapPoint);
      }
      this.cancelDrag();
      return;
    }
    if (this.drag.printAreaFrame) {
      if (this.drag.moved) {
        this.callbacks.onPrintAreaFrameMove?.(printAreaFrameDragCenter(this.drag, mapPoint));
      }
      this.cancelDrag();
      return;
    }
    if (this.drag.descriptionAdd) {
      const options = this.descriptionDragPreview || createDescriptionSpecialOptions(state.eventModel, this.drag.startMap, state.ui.selectedCourseId, mapCourseDisplayOptions(state.eventModel, state.ui));
      this.callbacks.onAddDescriptionSpecial?.(this.drag.startMap, options);
      this.descriptionDragPreview = null;
      this.cancelDrag();
      return;
    }
    if (this.drag.specialShapeAdd) {
      const preview = this.specialShapePreview || specialShapeForDrag(this.drag.tool, this.drag.startMap, mapPoint, state);
      if (this.drag.moved) {
        this.callbacks.onToolPoint?.(this.drag.tool, this.drag.startMap, { locations: preview.locations });
      }
      this.specialShapePreview = null;
      this.cancelDrag();
      return;
    }
    if (this.drag.resize && this.drag.moved && state.ui.tool === "select") {
      this.callbacks.onResizeSelection?.(this.drag.hit, this.drag.resize, mapPoint);
      this.drag.hit = null;
    }
    else if (this.drag.hit?.type === "leg-gap" && this.drag.hit.handle && this.drag.moved && state.ui.tool === "select") {
      this.callbacks.onLegGapHandleMove?.(this.drag.hit, mapPoint);
      this.drag.hit = null;
    }
    else if (this.drag.hit?.type === "leg-bend" && this.drag.moved && state.ui.tool === "select") {
      this.callbacks.onLegBendMove?.(this.drag.hit, mapPoint);
      this.drag.hit = null;
    }
    else if (this.drag.hit?.type === "background-calibration-point" && this.drag.moved && state.ui.tool === "select") {
      this.callbacks.onBackgroundCalibrationPointMove?.(this.drag.hit, mapPoint, { transient: false });
      this.drag.hit = null;
    }
    else if (this.drag.hit && this.drag.moved && state.ui.tool === "select") {
      this.callbacks.onMoveSelection?.(this.drag.hit, moveTargetForDrag(this.drag, mapPoint));
      this.drag.hit = null;
    }
    else if (state.ui.tool === "line-cut") {
      const legHit = nearestLeg(mapPoint, state, 16 / this.scale(state.ui));
      this.callbacks.onManualLegCut?.(mapPoint, legHit);
    }
    else if (state.ui.tool === "leg-bend-add") {
      const legHit = nearestLeg(mapPoint, state, 16 / this.scale(state.ui));
      const selected = selectedLegForSelection(state.eventModel, state.ui);
      if (legHit?.leg && selected && legKey(legHit.leg) === legKey(selected)) {
        this.callbacks.onAddLegBend?.(legSelection(legHit.leg), mapPoint);
      }
      else {
        this.callbacks.onSelect?.(this.drag.hit);
      }
    }
    else if (state.ui.tool !== "select") {
      if (state.ui.tool.startsWith("control:")) {
        const existing = this.hitTestAddableControl(mapPoint, state, ADDABLE_CONTROL_SNAP_PIXELS / this.scale(state.ui));
        if (existing) {
          this.callbacks.onAddExistingControlToCourse?.(existing);
          this.cancelDrag();
          return;
        }
      }
      this.callbacks.onToolPoint?.(state.ui.tool, mapPoint);
    }
    else {
      this.callbacks.onSelect?.(this.drag.hit);
    }
    this.cancelDrag();
  },

  pointerCancel(event) {
    this.activePointers.delete(event.pointerId);
    if (this.activePointers.size < 2) {
      this.pinch = null;
    }
    this.cancelDrag();
  },

  doubleClick(event) {
    const state = this.store.snapshot();
    const mapPoint = this.toMap({ x: event.offsetX, y: event.offsetY }, state.ui);
    const hit = this.hitTest(mapPoint, state);
    if (hit?.type === "leg-bend") {
      this.callbacks.onDeleteLegBend?.(hit);
      return;
    }
    const selected = selectedLegForSelection(state.eventModel, state.ui);
    if (!selected) return;
    const legHit = nearestLeg(mapPoint, state, 16 / this.scale(state.ui));
    if (legHit?.leg && legKey(legHit.leg) === legKey(selected)) {
      this.callbacks.onAddLegBend?.(legSelection(legHit.leg), mapPoint);
    }
  },

  cancelDrag() {
    if (this.drag?.hit) {
      this.callbacks.onMoveSelectionPreview?.(null, null);
      this.callbacks.onResizeSelectionPreview?.(null, null, null);
    }
    this.descriptionDragPreview = null;
    this.specialShapePreview = null;
    this.drag = null;
    this._dragRect = null;
  },

  updateToolPreview(tool, point) {
    const previewable = typeof tool === "string" && (tool.startsWith("control:") || tool.startsWith("special:"));
    if (!previewable) {
      this.clearToolPreview();
      return;
    }
    this.toolPreview = {
      tool,
      point: { x: point.x, y: point.y }
    };
    this.requestDraw(this.store.snapshot());
  },

  previewPointForTool(tool, point, state = this.store.snapshot()) {
    if (!tool?.startsWith?.("control:")) {
      return point;
    }
    const snapped = this.nearestAddableControl(point, state, ADDABLE_CONTROL_SNAP_PIXELS / this.scale(state.ui));
    return snapped?.control?.location || point;
  },

  clearToolPreview() {
    if (!this.toolPreview) {
      return;
    }
    this.toolPreview = null;
    this.requestDraw(this.store.snapshot());
  },

  wheel(event) {
    event.preventDefault();
    this.startFastOmapInteraction();
    const delta = wheelZoomFactor(event, this.canvas.clientHeight || 1);
    const cursor = { x: event.offsetX, y: event.offsetY };
    const before = this.toMap(cursor, this.store.snapshot().ui);
    this.store.updateUi(ui => {
      ui.zoom = clamp(ui.zoom * delta, 0.2, MAX_ZOOM);
      const after = this.toScreen(before, ui);
      ui.pan = {
        x: ui.pan.x + cursor.x - after.x,
        y: ui.pan.y + cursor.y - after.y
      };
    }, "Zoom");
  },

  beginPinch() {
    const state = this.store.snapshot();
    const gesture = pinchGesture([...this.activePointers.values()]);
    if (!gesture) return;
    this.cancelDrag();
    this.clearToolPreview();
    this.startFastOmapInteraction();
    this.pinch = {
      startDistance: Math.max(1, gesture.distance),
      startZoom: state.ui.zoom || 1,
      mapCenter: this.toMap(gesture.center, state.ui)
    };
  },

  updatePinch() {
    const gesture = pinchGesture([...this.activePointers.values()]);
    if (!gesture || !this.pinch) return;
    this.startFastOmapInteraction();
    this.store.updateUi(ui => {
      ui.zoom = clamp(this.pinch.startZoom * gesture.distance / this.pinch.startDistance, 0.2, MAX_ZOOM);
      const after = this.toScreen(this.pinch.mapCenter, ui);
      ui.pan = {
        x: ui.pan.x + gesture.center.x - after.x,
        y: ui.pan.y + gesture.center.y - after.y
      };
    }, "Pinch zoom");
  }

  };
}
