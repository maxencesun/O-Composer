import { measurementLabelPoint, measurementPathDistance } from "../domain/measurement.js?v=20260713-20";

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
    constrainPointToOctants,
    crossingOrientationForPoint,
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
    isAreaSpecialTool,
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
    if (event.button === 2) {
      if (this.store.snapshot().ui.tool === "measure" && this.store.snapshot().ui.measurement?.adding) {
        event.preventDefault();
        this.callbacks.onMeasurementFinish?.();
        return;
      }
      this.finishAreaSpecialDraft(event);
      return;
    }
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
    if (state.ui.tool === "measure") {
      if (state.ui.measurement?.adding) {
        this.drag = { pointerId: event.pointerId, measurement: true, startScreen: screen, moved: false };
      }
      else {
        const hit = measurementHit(this, mapPoint, state);
        this.callbacks.onMeasurementSelect?.(hit?.index ?? null);
        this.drag = {
          pointerId: event.pointerId,
          measurementSelect: true,
          measurementLabel: !!hit?.label,
          measurementVertex: Number.isInteger(hit?.vertexIndex),
          measurementVertexIndex: hit?.vertexIndex ?? null,
          measurementIndex: hit?.index ?? null,
          measurementLabelOffset: hit?.labelPoint ? { x: hit.labelPoint.x - mapPoint.x, y: hit.labelPoint.y - mapPoint.y } : { x: 0, y: 0 },
          startScreen: screen,
          moved: false
        };
      }
      return;
    }
    if (isAreaSpecialTool(state.ui.tool)) {
      this.addAreaSpecialDraftPoint(state.ui.tool, mapPoint);
      return;
    }
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
    const calibrationPointCount = state.ui.background?.calibration?.imagePoints?.length
      || state.ui.background?.calibration?.points?.length
      || 0;
    const calibrationAdjusting = state.ui.tool === "background-calibration" && calibrationPointCount >= 2;
    let hit = this.hitTest(mapPoint, state);
    if (calibrationAdjusting && hit?.type !== "background-calibration-point") {
      hit = null;
    }
    const emptySpacePan = state.ui.tool === "select" && !state.ui.selection && !hit;
    if (hit?.type === "background-calibration-point") {
      this.canvas.style.cursor = "grabbing";
    }
    else if (["control", "special"].includes(hit?.type) && hit.handle === "rotate") {
      this.canvas.style.cursor = "grabbing";
    }
    this.drag = {
      pointerId: event.pointerId,
      startScreen: screen,
      lastScreen: screen,
      startMap: mapPoint,
      hit,
      moveOffset: moveOffsetForHit(state.eventModel, hit, mapPoint),
      resize: resizeForHit(hit),
      moved: false,
      panning: emptySpacePan || (calibrationAdjusting && !hit) || event.button === 1 || event.altKey || state.ui.tool === "pan"
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
    const mapPoint = this.shiftConstrainedPoint(this.toMap(screen, state.ui), state, event);
    const previewPoint = this.previewPointForTool(state.ui.tool, mapPoint, state);
    this.callbacks.onHover?.(previewPoint);
    this.updateToolPreview(state.ui.tool === "measure" && !state.ui.measurement?.adding ? "select" : state.ui.tool, previewPoint);
    if (!this.drag || this.drag.pointerId !== event.pointerId) {
      const calibrationHit = ["select", "background-calibration"].includes(state.ui.tool)
        ? this.hitTestBackgroundCalibrationPoint(mapPoint, state, 16 / this.scale(state.ui))
        : null;
      const rotationHit = state.ui.tool === "select"
        ? this.hitTestSelectedCrossingRotation(mapPoint, state, 16 / this.scale(state.ui))
        : null;
      this.canvas.style.cursor = calibrationHit || rotationHit ? "grab" : "";
      return;
    }
    if (this.drag.measurement) {
      const total = Math.hypot(screen.x - this.drag.startScreen.x, screen.y - this.drag.startScreen.y);
      this.drag.moved = this.drag.moved || total > 5;
      return;
    }
    if (this.drag.measurementSelect) {
      const total = Math.hypot(screen.x - this.drag.startScreen.x, screen.y - this.drag.startScreen.y);
      this.drag.moved = this.drag.moved || total > 3;
      if (this.drag.measurementVertex && this.drag.moved && Number.isInteger(this.drag.measurementIndex)) {
        this.callbacks.onMeasurementVertexMove?.(this.drag.measurementIndex, this.drag.measurementVertexIndex, mapPoint, { transient: true });
      }
      else if (this.drag.measurementLabel && this.drag.moved && Number.isInteger(this.drag.measurementIndex)) {
        this.callbacks.onMeasurementLabelMove?.(this.drag.measurementIndex, measurementLabelDragPoint(this.drag, mapPoint), { transient: true });
      }
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

    if (this.drag.hit?.type === "background-calibration-point" && this.drag.moved && ["select", "background-calibration"].includes(state.ui.tool)) {
      this.callbacks.onBackgroundCalibrationPointMove?.(this.drag.hit, mapPoint, { transient: true });
      return;
    }

    if (["control", "special"].includes(this.drag.hit?.type) && this.drag.hit.handle === "rotate" && this.drag.moved && state.ui.tool === "select") {
      const crossing = this.drag.hit.type === "control"
        ? getControl(state.eventModel, this.drag.hit.id)
        : state.eventModel.specials.find(special => Number(special.id) === Number(this.drag.hit.id));
      this.callbacks.onCrossingRotationPreview?.(this.drag.hit, crossingOrientationForPoint(crossing, mapPoint));
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
    const mapPoint = this.shiftConstrainedPoint(this.toMap(screen, state.ui), state, event);
    if (this.drag.measurement) {
      if (!this.drag.moved) this.callbacks.onMeasurementPoint?.(mapPoint);
      this.cancelDrag();
      return;
    }
    if (this.drag.measurementSelect) {
      if (this.drag.measurementVertex && this.drag.moved && Number.isInteger(this.drag.measurementIndex)) {
        this.callbacks.onMeasurementVertexMove?.(this.drag.measurementIndex, this.drag.measurementVertexIndex, mapPoint);
      }
      else if (this.drag.measurementLabel && this.drag.moved && Number.isInteger(this.drag.measurementIndex)) {
        this.callbacks.onMeasurementLabelMove?.(this.drag.measurementIndex, measurementLabelDragPoint(this.drag, mapPoint));
      }
      this.cancelDrag();
      return;
    }
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
    else if (this.drag.hit?.type === "background-calibration-point" && this.drag.moved && ["select", "background-calibration"].includes(state.ui.tool)) {
      this.callbacks.onBackgroundCalibrationPointMove?.(this.drag.hit, mapPoint, { transient: false });
      this.drag.hit = null;
    }
    else if (["control", "special"].includes(this.drag.hit?.type) && this.drag.hit.handle === "rotate" && this.drag.moved && state.ui.tool === "select") {
      const crossing = this.drag.hit.type === "control"
        ? getControl(state.eventModel, this.drag.hit.id)
        : state.eventModel.specials.find(special => Number(special.id) === Number(this.drag.hit.id));
      this.callbacks.onCrossingRotation?.(this.drag.hit, crossingOrientationForPoint(crossing, mapPoint));
      this.drag.hit = null;
    }
    else if (["control", "special"].includes(this.drag.hit?.type) && this.drag.hit.handle === "rotate" && state.ui.tool === "select") {
      const { handle, ...selection } = this.drag.hit;
      this.callbacks.onSelect?.(selection);
      this.drag.hit = null;
    }
    else if (this.drag.hit?.type === "background-calibration-point" && ["select", "background-calibration"].includes(state.ui.tool)) {
      this.callbacks.onSelect?.({ type: "background" });
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
    if (state.ui.tool === "measure") {
      event.preventDefault();
      if (state.ui.measurement?.adding) {
        this.callbacks.onMeasurementFinish?.({ removeDuplicate: true });
      }
      else {
        const mapPoint = this.toMap({ x: event.offsetX, y: event.offsetY }, state.ui);
        const edit = measurementEditHit(mapPoint, state.ui.measurement, 10 / Math.max(0.001, this.scale(state.ui)));
        if (edit?.vertexIndex !== undefined) {
          this.callbacks.onMeasurementVertexDelete?.(edit.index, edit.vertexIndex);
        }
        else if (edit) {
          this.callbacks.onMeasurementVertexAdd?.(edit.index, edit.insertIndex, edit.point);
        }
      }
      return;
    }
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

  addAreaSpecialDraftPoint(tool, point) {
    if (!this.areaSpecialDraft || this.areaSpecialDraft.tool !== tool) {
      this.areaSpecialDraft = { tool, points: [] };
    }
    this.areaSpecialDraft.points.push({ x: point.x, y: point.y });
    this.toolPreview = { tool, point: { x: point.x, y: point.y } };
    this.requestDraw(this.store.snapshot());
  },

  finishAreaSpecialDraft(event) {
    const state = this.store.snapshot();
    if (!this.areaSpecialDraft && !isAreaSpecialTool(state.ui.tool)) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    this.suppressNextContextMenu = true;
    const draft = this.areaSpecialDraft;
    if (draft?.points?.length >= 3) {
      this.callbacks.onToolPoint?.(draft.tool, draft.points[0], { locations: draft.points });
    }
    this.areaSpecialDraft = null;
    this.toolPreview = null;
    this.cancelDrag();
    this.requestDraw(this.store.snapshot());
  },

  contextMenu(event) {
    if (this.suppressNextContextMenu) {
      this.suppressNextContextMenu = false;
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    if (this.store.snapshot().ui.tool === "measure") {
      event.preventDefault();
      event.stopPropagation();
      if (this.store.snapshot().ui.measurement?.adding) this.callbacks.onMeasurementFinish?.();
    }
    else if (this.areaSpecialDraft || isAreaSpecialTool(this.store.snapshot().ui.tool)) {
      this.finishAreaSpecialDraft(event);
    }
  },

  cancelDrag() {
    if (this.drag?.hit) {
      this.callbacks.onMoveSelectionPreview?.(null, null);
      this.callbacks.onResizeSelectionPreview?.(null, null, null);
      this.callbacks.onCrossingRotationPreview?.(null, null);
    }
    this.descriptionDragPreview = null;
    this.specialShapePreview = null;
    if (!this.store.snapshot().ui.tool || !isAreaSpecialTool(this.store.snapshot().ui.tool)) {
      this.areaSpecialDraft = null;
    }
    this.drag = null;
    this._dragRect = null;
    this.canvas.style.cursor = "";
  },

  shiftConstrainedPoint(point, state, event) {
    if (!event?.shiftKey) return point;
    if (this.drag?.specialShapeAdd && this.drag.tool === "special:line") {
      return constrainPointToOctants(this.drag.startMap, point);
    }
    if (this.drag?.hit?.type === "background-calibration-point") {
      const points = backgroundCalibrationMapPoints(state.ui.background, this.backgroundImage);
      const anchor = points[Number(this.drag.hit.pointIndex) === 0 ? 1 : 0];
      return anchor ? constrainPointToOctants(anchor, point) : point;
    }
    if (state.ui.tool === "measure" && state.ui.measurement?.adding) {
      const points = state.ui.measurement?.draft?.points || [];
      const anchor = points[points.length - 1];
      return anchor ? constrainPointToOctants(anchor, point) : point;
    }
    if (state.ui.tool === "background-calibration") {
      const points = backgroundCalibrationMapPoints(state.ui.background, this.backgroundImage);
      return points.length === 1 ? constrainPointToOctants(points[0], point) : point;
    }
    return point;
  },

  updateToolPreview(tool, point) {
    const previewable = typeof tool === "string" && (tool === "measure" || tool === "background-calibration" || tool.startsWith("control:") || tool.startsWith("special:"));
    if (!previewable) {
      this.clearToolPreview();
      this.areaSpecialDraft = null;
      return;
    }
    if (this.areaSpecialDraft && this.areaSpecialDraft.tool !== tool) {
      this.areaSpecialDraft = null;
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

function measurementHit(view, mapPoint, state) {
  const measurement = state.ui.measurement;
  const items = measurement?.items || [];
  const scale = Math.max(0.001, view.scale(state.ui));
  for (let index = items.length - 1; index >= 0; index -= 1) {
    const item = items[index];
    if (index === measurement.selectedIndex) {
      for (let vertexIndex = 0; vertexIndex < item.points.length; vertexIndex += 1) {
        if (Math.hypot(mapPoint.x - item.points[vertexIndex].x, mapPoint.y - item.points[vertexIndex].y) <= 9 / scale) {
          return { index, vertexIndex };
        }
      }
    }
    if (measurement.showGroundLabels) {
      const labelPoint = measurementLabelPoint(item);
      if (labelPoint) {
        const labelScreen = view.toScreen(labelPoint, state.ui);
        if (!item.labelPosition) labelScreen.y -= 14 * Math.min(1, Math.max(0.01, Number(state.ui.zoom) || 1));
        const pointerScreen = view.toScreen(mapPoint, state.ui);
        if (Math.abs(pointerScreen.x - labelScreen.x) <= 42 && Math.abs(pointerScreen.y - labelScreen.y) <= 14) {
          return { index, label: true, labelPoint: view.toMap(labelScreen, state.ui) };
        }
      }
    }
    if (measurementPathDistance(mapPoint, item) <= 10 / scale) return { index, label: false };
  }
  return null;
}

function measurementLabelDragPoint(drag, point) {
  return {
    x: point.x + (drag.measurementLabelOffset?.x || 0),
    y: point.y + (drag.measurementLabelOffset?.y || 0)
  };
}

function measurementEditHit(point, measurement, tolerance) {
  const index = measurement?.selectedIndex;
  const item = Number.isInteger(index) ? measurement.items?.[index] : null;
  if (!item) return null;
  for (let vertexIndex = 0; vertexIndex < item.points.length; vertexIndex += 1) {
    if (Math.hypot(point.x - item.points[vertexIndex].x, point.y - item.points[vertexIndex].y) <= tolerance) {
      return { index, vertexIndex };
    }
  }
  let best = null;
  for (let endIndex = 1; endIndex < item.points.length; endIndex += 1) {
    const projected = projectedPointOnSegment(point, item.points[endIndex - 1], item.points[endIndex]);
    if (!best || projected.distance < best.distance) best = { index, insertIndex: endIndex, ...projected };
  }
  if (item.closed && item.points.length >= 3) {
    const projected = projectedPointOnSegment(point, item.points[item.points.length - 1], item.points[0]);
    if (!best || projected.distance < best.distance) best = { index, insertIndex: item.points.length, ...projected };
  }
  return best?.distance <= tolerance ? best : null;
}

function projectedPointOnSegment(point, start, end) {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const lengthSquared = dx * dx + dy * dy;
  const ratio = lengthSquared > 0
    ? Math.max(0, Math.min(1, ((point.x - start.x) * dx + (point.y - start.y) * dy) / lengthSquared))
    : 0;
  const projected = { x: start.x + dx * ratio, y: start.y + dy * ratio };
  return { point: projected, distance: Math.hypot(point.x - projected.x, point.y - projected.y) };
}
