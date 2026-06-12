export function createMapViewHitTestMethods(deps) {
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
  hitTest(point, state) {
    const scale = this.scale(state.ui);
    const baseThreshold = 16 / scale;
    const specialThreshold = 22 / scale;
    let best = null;
    let bestDistance = Infinity;
    const currentSelection = state.ui.selection;
    const calibrationPoint = this.hitTestBackgroundCalibrationPoint(point, state, baseThreshold);
    if (calibrationPoint) {
      return calibrationPoint;
    }
    const bendHandle = this.hitTestSelectedLegBend(point, state, baseThreshold);
    if (bendHandle) {
      return bendHandle;
    }
    const gapHandle = this.hitTestSelectedLegGap(point, state, baseThreshold);
    if (gapHandle) {
      return gapHandle;
    }
    const gapSelection = this.hitTestManualLegGap(point, state, baseThreshold);
    if (gapSelection) {
      return gapSelection;
    }
    const controlNumber = this.hitTestControlNumber(point, state, baseThreshold);
    if (controlNumber) {
      return controlNumber;
    }
    const specialHandle = this.hitTestSpecialHandle(point, state, baseThreshold);
    if (specialHandle) {
      return specialHandle;
    }

    // Gather all hit candidates with their distances, then pick the best.
    // Give a small priority bonus to the already-selected object so clicks
    // on overlapping items don't jump away unexpectedly.
    const SELECTION_PRIORITY_BONUS = 2 / scale;
    const DRAWN_SPECIAL_PRIORITY_BONUS = 7 / scale;
    const AREA_SPECIAL_PRIORITY_BONUS = 2 / scale;

    for (const control of state.eventModel.controls) {
      const dist = Math.hypot(control.location.x - point.x, control.location.y - point.y);
      // Use a larger threshold for controls — include clicking within the control circle
      const controlThreshold = Math.max(baseThreshold, symbolApparentRadiusControl(control, scale) + baseThreshold * 0.5);
      if (dist < controlThreshold) {
        let effectiveDist = dist;
        if (currentSelection?.type === "control" && Number(currentSelection.id) === Number(control.id)) {
          effectiveDist -= SELECTION_PRIORITY_BONUS;
        }
        if (effectiveDist < bestDistance) {
          best = { type: "control", id: control.id };
          bestDistance = effectiveDist;
        }
      }
    }

    for (const special of state.eventModel.specials) {
      if (!specialVisibleForCourse(special, state.ui.selectedCourseId, state.ui.showAllControls)) {
        continue;
      }
      if (special.kind === "descriptions") {
        const bounds = descriptionBounds(state.eventModel, special, state.ui.selectedCourseId, mapCourseDisplayOptions(state.eventModel, state.ui));
        const handleDistance = Math.hypot(bounds.right - point.x, bounds.bottom - point.y);
        if (handleDistance < specialThreshold * 1.5) {
          let effectiveDist = handleDistance;
          if (currentSelection?.type === "special" && Number(currentSelection.id) === Number(special.id)) {
            effectiveDist -= SELECTION_PRIORITY_BONUS;
          }
          if (effectiveDist < bestDistance) {
            best = {
              type: "special",
              id: special.id,
              handle: "resize-se",
              anchor: { x: bounds.left, y: bounds.top }
            };
            bestDistance = effectiveDist;
          }
        }
        if (point.x >= bounds.left && point.x <= bounds.right && point.y <= bounds.top && point.y >= bounds.bottom) {
          let effectiveDist = specialThreshold * 0.3 - DRAWN_SPECIAL_PRIORITY_BONUS;
          if (currentSelection?.type === "special" && Number(currentSelection.id) === Number(special.id)) {
            effectiveDist -= SELECTION_PRIORITY_BONUS;
          }
          if (effectiveDist < bestDistance) {
            best = { type: "special", id: special.id };
            bestDistance = effectiveDist;
          }
        }
        continue;
      }

      // For point specials, use a generous radius matching the symbol size
      const category = specialCategoryForHitTest(special.kind);
      if (category === "point" && special.locations?.length) {
        const symbolRadius = 12 / scale; // approximate visual extent of point symbols
        const pointThreshold = specialThreshold + symbolRadius;
        const dist = Math.hypot(special.locations[0].x - point.x, special.locations[0].y - point.y);
        if (dist < pointThreshold) {
          let effectiveDist = dist;
          if (currentSelection?.type === "special" && Number(currentSelection.id) === Number(special.id)) {
            effectiveDist -= SELECTION_PRIORITY_BONUS;
          }
          if (effectiveDist < bestDistance) {
            best = { type: "special", id: special.id };
            bestDistance = effectiveDist;
          }
        }
        continue;
      }

      const geometryDistance = specialHitDistance(special, point, specialThreshold, state.ui, scale);
      if (geometryDistance < Infinity) {
        let effectiveDist = geometryDistance;
        effectiveDist -= category === "area" ? AREA_SPECIAL_PRIORITY_BONUS : DRAWN_SPECIAL_PRIORITY_BONUS;
        if (currentSelection?.type === "special" && Number(currentSelection.id) === Number(special.id)) {
          effectiveDist -= SELECTION_PRIORITY_BONUS;
        }
        if (effectiveDist < bestDistance) {
          best = { type: "special", id: special.id };
          bestDistance = effectiveDist;
        }
        continue;
      }

      // Fallback: check proximity to location points
      for (const location of special.locations || []) {
        const dist = Math.hypot(location.x - point.x, location.y - point.y);
        if (dist < specialThreshold) {
          let effectiveDist = dist - DRAWN_SPECIAL_PRIORITY_BONUS * 0.5;
          if (currentSelection?.type === "special" && Number(currentSelection.id) === Number(special.id)) {
            effectiveDist -= SELECTION_PRIORITY_BONUS;
          }
          if (effectiveDist < bestDistance) {
            best = { type: "special", id: special.id };
            bestDistance = effectiveDist;
          }
        }
      }
    }

    if (best) return best;
    const legHit = nearestLeg(point, state, baseThreshold);
    return legHit ? legSelection(legHit.leg) : null;
  },

  hitTestSpecialHandle(point, state, threshold) {
    if (state.ui.selection?.type !== "special") return null;
    const scale = this.scale(state.ui);
    let best = null;
    let bestDistance = Infinity;
    const special = state.eventModel.specials.find(item => Number(item.id) === Number(state.ui.selection.id));
    if (!special || !specialVisibleForCourse(special, state.ui.selectedCourseId, state.ui.showAllControls)) return null;
    for (const handle of specialResizeHandles(special, state.ui, scale, state.eventModel)) {
      const candidateDistance = distance(point, handle.point);
      if (candidateDistance <= threshold * 0.9 && candidateDistance < bestDistance) {
        best = {
          type: "special",
          id: special.id,
          handle: handle.handle,
          anchor: handle.anchor,
          pointIndex: handle.pointIndex
        };
        bestDistance = candidateDistance;
      }
    }
    return best;
  },

  hitTestAddableControl(point, state, threshold) {
    const nearest = this.nearestAddableControl(point, state, threshold);
    return nearest ? { type: "control", id: nearest.control.id } : null;
  },

  nearestAddableControl(point, state, threshold) {
    if (!state.ui.tool?.startsWith("control:") || !state.ui.selectedCourseId || state.ui.selectedCourseId === "all") {
      return null;
    }
    const kind = state.ui.tool.slice("control:".length);
    let best = null;
    let bestDistance = Infinity;
    for (const control of addableControlsForTool(state.eventModel, state.ui.selectedCourseId, kind)) {
      const candidateDistance = distance(point, control.location);
      if (candidateDistance < threshold && candidateDistance < bestDistance) {
        best = { control, distance: candidateDistance };
        bestDistance = candidateDistance;
      }
    }
    return best;
  },

  hitTestControlNumber(point, state, threshold) {
    const labelRows = currentCourseLabelRows(state, this.scale(state.ui));
    if (!labelRows) return null;
    const { rows, legs, metrics } = labelRows;
    const screenPoint = this.toScreen(point, state.ui);
    const padding = Math.max(5, threshold * this.scale(state.ui));
    for (let index = rows.length - 1; index >= 0; index -= 1) {
      const row = rows[index];
      if (!row.courseControl || !row.label || row.control?.kind !== "normal") continue;
      const rect = controlNumberScreenRect(row, metrics, rows, legs, location => this.toScreen(location, state.ui), padding);
      if (pointInRect(screenPoint, rect)) {
        return {
          type: "control-number",
          courseControl: row.courseControl.id,
          courseControls: row.courseControlIds || [row.courseControl.id],
          control: row.control.id
        };
      }
    }
    return null;
  },

  hitTestBackgroundCalibrationPoint(point, state, threshold) {
    if (state.ui.selection?.type !== "background") return null;
    const points = backgroundCalibrationMapPoints(state.ui.background, this.backgroundImage);
    let best = null;
    let bestDistance = Infinity;
    for (let index = points.length - 1; index >= 0; index -= 1) {
      const candidateDistance = distance(point, points[index]);
      if (candidateDistance <= threshold * 1.35 && candidateDistance < bestDistance) {
        best = { type: "background-calibration-point", pointIndex: index };
        bestDistance = candidateDistance;
      }
    }
    return best;
  },

  hitTestSelectedLegBend(point, state, threshold) {
    if (!["leg", "leg-bend"].includes(state.ui.selection?.type)) return null;
    const leg = selectedLegForSelection(state.eventModel, state.ui);
    const bends = leg?.leg?.bends || [];
    for (let index = bends.length - 1; index >= 0; index -= 1) {
      if (distance(point, bends[index]) <= threshold * 1.35) {
        return legBendSelection(leg, index);
      }
    }
    return null;
  },

  hitTestSelectedLegGap(point, state, threshold) {
    if (state.ui.selection?.type !== "leg-gap") return null;
    const leg = selectedLegForSelection(state.eventModel, state.ui);
    const gap = leg?.leg?.gaps?.[state.ui.selection.gapIndex];
    if (!leg || !gap) return null;
    const points = legMapPoints(leg);
    const handles = [
      ["gap-start", pointAtPathDistance(points, gap.start)],
      ["gap-end", pointAtPathDistance(points, gap.start + gap.length)]
    ];
    for (const [handle, handlePoint] of handles) {
      if (distance(point, handlePoint) <= threshold * 1.5) {
        return { ...state.ui.selection, handle };
      }
    }
    return null;
  },

  hitTestManualLegGap(point, state, threshold) {
    const legs = currentCourseLegs(state);
    let best = null;
    let bestDistance = Infinity;
    for (const leg of legs) {
      for (let index = 0; index < (leg.leg?.gaps || []).length; index += 1) {
        const gap = leg.leg.gaps[index];
        const center = pointAtPathDistance(legMapPoints(leg), gap.start + gap.length / 2);
        const candidateDistance = distance(point, center);
        if (candidateDistance < threshold * 1.6 && candidateDistance < bestDistance) {
          best = legGapSelection(leg, index);
          bestDistance = candidateDistance;
        }
      }
    }
    return best;
  }

  };
}
