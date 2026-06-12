import {
  courseLegs,
  courseView,
  getCourse,
  controlsUsedByCourse,
  isTeamFreeCourseControl
} from "../domain/course-service.js";
import { descriptionBounds, drawControlDescriptionBlock } from "../domain/control-descriptions.js";
import { relayEntryLabel, relayVariationForLeg, variationForCode } from "../domain/relay-variations.js";
import {
  createCourseSymbolMetrics,
  courseSymbolMmToMapDistance,
  defaultControlLabelPoint,
  directionAngle,
  symbolApparentRadius
} from "./course-symbols.js";

export const PURPLE = "rgba(166, 38, 255, 0.82)";
export const LOWER_PURPLE = "rgba(166, 38, 255, 0.46)";
export const DEFAULT_TEXT_FONT_HEIGHT = 3;
export const TEXT_MIN_WIDTH_PX = 48;
export const TEXT_MIN_HEIGHT_PX = 20;
export const ADDABLE_CONTROL_SNAP_PIXELS = 10;
export const MAX_ZOOM = 24;
export const SPECIAL_COLORS = Object.freeze({
  "upper-purple": PURPLE,
  "lower-purple": LOWER_PURPLE,
  black: "#1f2933",
  white: "#ffffff",
  red: "#d73535",
  blue: "#2477c9",
  green: "#2f855a"
});
export const GRID = "#d8d4c7";
export const OMAP_LAYER_PADDING = 1;
export const OMAP_LAYER_CACHE_LIMIT = 3;
export const NORMALIZED_CONTROL_NUMBER_DISTANCE = 1.825;

export function hasEventGeometry(eventModel) {
  if (eventModel.controls.length || eventModel.specials.some(special => special.locations?.length)) {
    return true;
  }
  if (eventModel.event.printArea && !eventModel.event.printArea.automatic) {
    return true;
  }
  return eventModel.courses.some(course =>
    (course.printArea && !course.printArea.automatic)
    || (course.partPrintAreas || []).some(partArea => partArea.area && !partArea.area.automatic)
  );
}

export function backgroundMapBounds(background, image = null) {
  const naturalWidth = positiveNumber(background?.naturalWidth, image?.naturalWidth || image?.width || 1);
  const naturalHeight = positiveNumber(background?.naturalHeight, image?.naturalHeight || image?.height || 1);
  const aspect = Math.max(0.0001, naturalHeight / naturalWidth);
  const width = positiveNumber(background?.widthMeters, 200);
  const height = positiveNumber(background?.heightMeters, width * aspect);
  const centerX = Number(background?.centerX) || 0;
  const centerY = Number(background?.centerY) || 0;
  return {
    left: centerX - width / 2,
    right: centerX + width / 2,
    top: centerY + height / 2,
    bottom: centerY - height / 2,
    width,
    height
  };
}

export function backgroundCalibrationMapPoints(background, image = null) {
  const imagePoints = background?.calibration?.imagePoints || [];
  if (imagePoints.length) {
    const bounds = backgroundMapBounds(background, image);
    return imagePoints.map(point => ({
      x: bounds.left + point.x * bounds.width,
      y: bounds.top - point.y * bounds.height
    }));
  }
  return background?.calibration?.points || [];
}

export function positiveNumber(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : fallback;
}

export function currentCourseLegs(state) {
  const selectedCourseId = state.ui.selectedCourseId || "all";
  return selectedCourseId === "all" ? [] : courseLegs(state.eventModel, selectedCourseId);
}

export function moveOffsetForHit(eventModel, hit, mapPoint) {
  if (hit?.type !== "special") return null;
  const special = eventModel.specials.find(item => item.id === hit.id);
  const first = special?.locations?.[0];
  return first ? { x: mapPoint.x - first.x, y: mapPoint.y - first.y } : null;
}

export function moveTargetForDrag(drag, mapPoint) {
  return drag?.moveOffset
    ? { x: mapPoint.x - drag.moveOffset.x, y: mapPoint.y - drag.moveOffset.y }
    : mapPoint;
}

export function resizeForHit(hit) {
  const resizable = hit?.handle?.startsWith("resize-") || hit?.handle?.startsWith("point-");
  return hit?.type === "special" && resizable
    ? {
      handle: hit.handle,
      anchor: hit.anchor || null,
      pointIndex: Number.isInteger(hit.pointIndex) ? hit.pointIndex : null
    }
    : null;
}

export function specialResizeHandles(special, ui, scale, eventModel) {
  if (!special?.locations?.length) return [];
  if (special.kind === "descriptions") {
    const bounds = eventModel ? descriptionBounds(eventModel, special, ui.selectedCourseId, mapCourseDisplayOptions(eventModel, ui)) : null;
    return bounds ? [
      {
        handle: "move-anchor",
        point: { x: bounds.left, y: bounds.top }
      },
      {
        handle: "resize-se",
        point: { x: bounds.right, y: bounds.bottom },
        anchor: { x: bounds.left, y: bounds.top }
      }
    ] : [];
  }
  if (["line", "boundary", "out-of-bounds", "dangerous-area", "temporary-construction", "white-out"].includes(special.kind)) {
    return special.locations.map((point, index) => ({
      handle: `point-${index}`,
      point,
      pointIndex: index
    }));
  }
  if (["text", "rectangle", "ellipse"].includes(special.kind)) {
    if (special.kind === "text") {
      const anchor = special.locations[0];
      const bounds = specialMapBounds(special, ui, scale);
      return anchor && bounds ? [
        { handle: "move-anchor", point: anchor },
        { handle: "resize-text-font", point: { x: bounds.right, y: bounds.bottom }, anchor }
      ] : [];
    }
    const rect = specialMapBounds(special, ui, scale);
    if (!rect) return [];
    return [
      { handle: "resize-nw", point: { x: rect.left, y: rect.top }, anchor: { x: rect.right, y: rect.bottom } },
      { handle: "resize-ne", point: { x: rect.right, y: rect.top }, anchor: { x: rect.left, y: rect.bottom } },
      { handle: "resize-se", point: { x: rect.right, y: rect.bottom }, anchor: { x: rect.left, y: rect.top } },
      { handle: "resize-sw", point: { x: rect.left, y: rect.bottom }, anchor: { x: rect.right, y: rect.top } }
    ];
  }
  return [];
}

export function specialSelectionPoints(special, ui, scale) {
  if (special.kind === "descriptions") return [];
  if (["text", "rectangle", "ellipse"].includes(special.kind)) {
    const rect = specialMapBounds(special, ui, scale);
    return rect ? [
      { x: rect.left, y: rect.top },
      { x: rect.right, y: rect.top },
      { x: rect.right, y: rect.bottom },
      { x: rect.left, y: rect.bottom }
    ] : [];
  }
  if (specialCategoryForHitTest(special.kind) === "point" && special.locations?.length) {
    const point = special.locations[0];
    const radius = 14 / Math.max(0.001, scale);
    return [
      { x: point.x - radius, y: point.y + radius },
      { x: point.x + radius, y: point.y + radius },
      { x: point.x + radius, y: point.y - radius },
      { x: point.x - radius, y: point.y - radius }
    ];
  }
  return special.locations || [];
}

export function specialMapBounds(special, ui, scale) {
  const rect = special.kind === "text"
    ? specialTextBounds(special, ui, scale)
    : specialRectBounds(special, ui);
  if (!rect) return null;
  return {
    left: Math.min(rect.left, rect.right),
    right: Math.max(rect.left, rect.right),
    top: Math.max(rect.top, rect.bottom),
    bottom: Math.min(rect.top, rect.bottom)
  };
}

export function specialHitDistance(special, point, threshold, ui, scale = 1) {
  const points = special.locations || [];
  if (!points.length) return Infinity;
  const lineWidthMap = Math.max(0.2, Number(special.lineWidth) || 0.35);
  const lineTolerance = Math.max(threshold, threshold * 0.7 + lineWidthMap * 2);
  if (["line", "boundary"].includes(special.kind)) {
    const distanceToLine = distancePointToPolyline(point, points);
    return distanceToLine <= lineTolerance ? distanceToLine : Infinity;
  }
  if (special.kind === "text") {
    const rect = specialTextBounds(special, ui, scale);
    if (!rect) return Infinity;
    if (pointInRect(point, rect)) return 0;
    const distanceToRect = distancePointToRect(point, rect);
    return distanceToRect <= threshold ? distanceToRect : Infinity;
  }
  if (special.kind === "rectangle") {
    const rect = specialRectBounds(special, ui);
    if (!rect) return Infinity;
    // Expand rect by threshold for easier clicking
    const expanded = expandRect(rect, threshold);
    if (pointInRect(point, expanded)) {
      return pointInRect(point, rect) ? 0 : distancePointToRect(point, rect);
    }
    return Infinity;
  }
  if (special.kind === "ellipse") {
    const rect = specialRectBounds(special, ui);
    if (!rect) return Infinity;
    const distanceToEllipse = ellipseHitDistance(point, rect);
    return distanceToEllipse <= threshold ? distanceToEllipse : Infinity;
  }
  if (["out-of-bounds", "dangerous-area", "temporary-construction", "white-out"].includes(special.kind) && points.length >= 3) {
    if (pointInPolygon(point, points)) return 0;
    const distanceToEdge = distancePointToPolyline(point, [...points, points[0]]);
    return distanceToEdge <= threshold ? distanceToEdge : Infinity;
  }
  return Infinity;
}

export function specialRectBounds(special, ui) {
  const points = special.locations || [];
  if (points.length >= 2) {
    const left = Math.min(points[0].x, points[1].x);
    const right = Math.max(points[0].x, points[1].x);
    const top = Math.max(points[0].y, points[1].y);
    const bottom = Math.min(points[0].y, points[1].y);
    return { left, right, top, bottom };
  }
  return null;
}

export function specialTextBounds(special, ui, scale = 1) {
  const points = special.locations || [];
  if (!points[0]) return null;
  const metrics = textMetrics(special, scale);
  return {
    left: points[0].x,
    right: points[0].x + metrics.width / Math.max(0.0001, scale),
    top: points[0].y,
    bottom: points[0].y - metrics.height / Math.max(0.0001, scale)
  };
}

export function textFontHeight(special) {
  const value = Number(special.font?.height);
  return value > 0 ? value : DEFAULT_TEXT_FONT_HEIGHT;
}

export function textMetrics(special, scale = 1, context = null) {
  const lines = String(special.text || "Text").split(/\r?\n/);
  const fontPx = Math.max(6, textFontHeight(special) * Math.max(0.0001, scale));
  const ctx = context || textMeasureContext();
  let maxLineWidth = 1;
  if (ctx) {
    ctx.font = textCanvasFont(special, fontPx);
    maxLineWidth = Math.max(1, ...lines.map(line => ctx.measureText(line).width));
  }
  else {
    const maxLineLen = Math.max(1, ...lines.map(line => line.length));
    maxLineWidth = maxLineLen * fontPx * 0.6;
  }
  const lineHeight = fontPx * 1.15;
  return {
    lines,
    fontPx,
    lineHeight,
    width: Math.max(TEXT_MIN_WIDTH_PX, maxLineWidth),
    height: Math.max(TEXT_MIN_HEIGHT_PX, lineHeight * lines.length)
  };
}

export function textMeasureContext() {
  if (textMeasureContext.ctx !== undefined) {
    return textMeasureContext.ctx;
  }
  if (typeof document === "undefined") {
    textMeasureContext.ctx = null;
    return null;
  }
  textMeasureContext.ctx = document.createElement("canvas").getContext("2d");
  return textMeasureContext.ctx;
}

export function textCanvasFont(special, fontPx) {
  const bold = special.font?.bold ? "700 " : "";
  const italic = special.font?.italic ? "italic " : "";
  const family = special.font?.name || "Arial";
  return `${italic}${bold}${fontPx}px ${quoteFont(family)}, Arial, sans-serif`;
}

export function expandRect(rect, padding) {
  return {
    left: rect.left - padding,
    right: rect.right + padding,
    top: rect.top + padding,
    bottom: rect.bottom - padding
  };
}

export function distancePointToPolyline(point, points) {
  if (points.length < 2) return Infinity;
  let best = Infinity;
  for (let index = 0; index < points.length - 1; index += 1) {
    best = Math.min(best, distancePointToSegment(point, points[index], points[index + 1]));
  }
  return best;
}

export function ellipseHitDistance(point, rect) {
  const cx = (rect.left + rect.right) / 2;
  const cy = (rect.top + rect.bottom) / 2;
  const rx = Math.max(0.0001, (rect.right - rect.left) / 2);
  const ry = Math.max(0.0001, (rect.top - rect.bottom) / 2);
  const dx = point.x - cx;
  const dy = point.y - cy;
  const normalized = (dx * dx) / (rx * rx) + (dy * dy) / (ry * ry);
  if (normalized <= 1) return 0;
  const angle = Math.atan2(dy / ry, dx / rx);
  return distance(point, { x: cx + Math.cos(angle) * rx, y: cy + Math.sin(angle) * ry });
}

export function pointInPolygon(point, polygon) {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i, i += 1) {
    const a = polygon[i];
    const b = polygon[j];
    const intersects = ((a.y > point.y) !== (b.y > point.y))
      && point.x < ((b.x - a.x) * (point.y - a.y)) / ((b.y - a.y) || 1e-9) + a.x;
    if (intersects) inside = !inside;
  }
  return inside;
}

export function addableControlsForTool(eventModel, courseId, kind) {
  const used = controlsUsedByCourse(eventModel, courseId);
  return eventModel.controls
    .filter(control => control.kind === kind && !used.has(Number(control.id)));
}

export function currentCourseLabelRows(state, scale) {
  const selectedCourseId = state.ui.selectedCourseId || "all";
  if (selectedCourseId === "all") {
    return null;
  }
  const selectedCourse = getCourse(state.eventModel, selectedCourseId);
  if (!selectedCourse) return null;
  const displayOptions = mapCourseDisplayOptions(state.eventModel, state.ui);
  const rows = courseView(state.eventModel, selectedCourseId, displayOptions);
  return {
    rows: mergedCourseLabelRows(rows),
    legs: courseLegs(state.eventModel, selectedCourseId, displayOptions),
    metrics: createCourseSymbolMetrics(state.eventModel, selectedCourse, state.eventModel.event.courseAppearance, scale, false)
  };
}

export function selectedLegForSelection(eventModel, ui) {
  const selected = ui.selection;
  if (!["leg", "leg-gap", "leg-bend"].includes(selected?.type)) return null;
  return courseLegs(eventModel, ui.selectedCourseId, mapCourseDisplayOptions(eventModel, ui))
    .find(leg => Number(leg.from.control.id) === Number(selected.startControl) && Number(leg.to.control.id) === Number(selected.endControl)) || null;
}

export function selectedControlNumberRow(eventModel, ui) {
  if (ui.selection?.type !== "control-number" || !ui.selectedCourseId || ui.selectedCourseId === "all") return null;
  const selectedIds = new Set([
    Number(ui.selection.courseControl) || 0,
    ...(Array.isArray(ui.selection.courseControls) ? ui.selection.courseControls.map(Number) : [])
  ].filter(Boolean));
  return mergedCourseLabelRows(courseView(eventModel, ui.selectedCourseId, mapCourseDisplayOptions(eventModel, ui)))
    .find(row => (row.courseControlIds || [row.courseControl?.id]).some(id => selectedIds.has(Number(id)))) || null;
}

export function mapCourseDisplayOptions(eventModel, ui = {}) {
  const courseId = ui.selectedCourseId;
  if (!courseId || courseId === "all") return {};
  if (ui.variationMode === "all") return { allBranches: true };
  if (ui.variationMode === "variation") {
    const variation = variationForCode(eventModel, courseId, ui.variationCode);
    return variation ? { variationChoices: variation.choices } : {};
  }
  if (ui.variationMode === "relay") {
    const variation = relayVariationForLeg(eventModel, courseId, ui.relayTeam, ui.relayLeg);
    const course = getCourse(eventModel, courseId);
    return variation ? {
      variationChoices: variation.choices,
      relayLabel: relayEntryLabel(course?.relay || {}, ui.relayTeam, ui.relayLeg)
    } : {};
  }
  return {};
}

export function legSelection(leg) {
  return {
    type: "leg",
    startControl: leg.from.control.id,
    endControl: leg.to.control.id
  };
}

export function legGapSelection(leg, gapIndex) {
  return {
    type: "leg-gap",
    startControl: leg.from.control.id,
    endControl: leg.to.control.id,
    gapIndex
  };
}

export function legBendSelection(leg, bendIndex) {
  return {
    type: "leg-bend",
    startControl: leg.from.control.id,
    endControl: leg.to.control.id,
    bendIndex
  };
}

export function sameLegSelection(a, b) {
  return a?.type === "leg"
    && b?.type === "leg"
    && Number(a.startControl) === Number(b.startControl)
    && Number(a.endControl) === Number(b.endControl);
}

export function legKey(leg) {
  return `${leg.from.control.id}:${leg.to.control.id}`;
}

export function legMapPoints(leg) {
  return [leg.from.control.location, ...(leg.leg?.bends || []), leg.to.control.location];
}

export function automaticLegGaps(legs, rows, labelRows, metrics, pixelsPerMapUnit, gapSize, project) {
  const result = new Map();
  const length = Math.max(0.5, courseSymbolMmToMapDistance(Number(gapSize) || 3.5, metrics, pixelsPerMapUnit));
  const segmentSets = legs.map(leg => legSegments(legMapPoints(leg)));
  for (let i = 0; i < legs.length; i += 1) {
    for (let j = i + 1; j < legs.length; j += 1) {
      if (legsShareControl(legs[i], legs[j])) continue;
      for (const a of segmentSets[i]) {
        for (const b of segmentSets[j]) {
          const hit = segmentIntersection(a.a, a.b, b.a, b.b);
          if (!hit) continue;
          const targetLeg = j > i ? legs[j] : legs[i];
          const targetSegment = targetLeg === legs[j] ? b : a;
          const start = targetSegment.offset + targetSegment.length * (targetLeg === legs[j] ? hit.tb : hit.ta) - length / 2;
          const key = legKey(targetLeg);
          const gaps = result.get(key) || [];
          gaps.push({ start: Math.max(0, start), length, automatic: true });
          result.set(key, gaps);
        }
      }
    }
  }
  addLegCircleGaps(result, legs, segmentSets, rows, metrics, pixelsPerMapUnit, length);
  addLegLabelGaps(result, legs, segmentSets, labelRows || rows, metrics, pixelsPerMapUnit, length, project);
  return result;
}

export function addLegLabelGaps(result, legs, segmentSets, rows, metrics, pixelsPerMapUnit, gapSize, project) {
  if (typeof project !== "function") return;
  const labelItems = (rows || [])
    .filter(row => row?.control?.kind === "normal" && row.label)
    .map(row => ({
      row,
      rect: controlNumberScreenRect(row, metrics, rows, legs, project, Math.max(2, 0.15 * metrics.unit))
    }));
  if (!labelItems.length) return;

  for (let legIndex = 0; legIndex < legs.length; legIndex += 1) {
    const leg = legs[legIndex];
    const mapPoints = legMapPoints(leg);
    const screenPoints = mapPoints.map(project);
    let screenOffset = 0;
    for (let segmentIndex = 0; segmentIndex < screenPoints.length - 1; segmentIndex += 1) {
      const screenA = screenPoints[segmentIndex];
      const screenB = screenPoints[segmentIndex + 1];
      const screenLength = distance(screenA, screenB);
      const mapSegment = segmentSets[legIndex]?.[segmentIndex];
      if (!mapSegment || screenLength <= 0.001) {
        screenOffset += screenLength;
        continue;
      }
      for (const item of labelItems) {
        const range = segmentRectIntersectionRange(screenA, screenB, item.rect);
        if (!range) continue;
        const centerT = (range.start + range.end) / 2;
        const visibleScreenLength = Math.max(0, (range.end - range.start) * screenLength);
        const extraMap = Math.max(gapSize, visibleScreenLength / Math.max(0.0001, pixelsPerMapUnit));
        const center = mapSegment.offset + centerT * mapSegment.length;
        const key = legKey(leg);
        const gaps = result.get(key) || [];
        gaps.push({
          start: Math.max(0, center - extraMap / 2 - gapSize / 2),
          length: extraMap + gapSize,
          automatic: true,
          attachedObject: "control-label"
        });
        result.set(key, gaps);
      }
      screenOffset += screenLength;
    }
  }
}

export function segmentRectIntersectionRange(a, b, rect) {
  const bounds = normalizedRect(rect);
  let t0 = 0;
  let t1 = 1;
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const checks = [
    [-dx, a.x - bounds.left],
    [dx, bounds.right - a.x],
    [-dy, a.y - bounds.top],
    [dy, bounds.bottom - a.y]
  ];
  for (const [p, q] of checks) {
    if (Math.abs(p) < 1e-9) {
      if (q < 0) return null;
      continue;
    }
    const r = q / p;
    if (p < 0) {
      if (r > t1) return null;
      if (r > t0) t0 = r;
    }
    else {
      if (r < t0) return null;
      if (r < t1) t1 = r;
    }
  }
  const start = Math.max(0, Math.min(1, t0));
  const end = Math.max(0, Math.min(1, t1));
  return end > start ? { start, end } : null;
}

export function addLegCircleGaps(result, legs, segmentSets, rows, metrics, pixelsPerMapUnit, gapSize) {
  const lineWidthMap = Math.max(0.7, 0.35 * metrics.unit * (metrics.appearance?.lineWidthRatio || 1)) / Math.max(0.0001, pixelsPerMapUnit);
  const controls = uniqueDrawableControls(rows)
    .map(control => ({
      control,
      radius: symbolApparentRadius(control, metrics) / Math.max(0.0001, pixelsPerMapUnit)
        + lineWidthMap * 2
    }))
    .filter(item => item.radius > 0);

  for (let legIndex = 0; legIndex < legs.length; legIndex += 1) {
    const leg = legs[legIndex];
    const total = pathLength(legMapPoints(leg));
    for (const item of controls) {
      if (legEndpointIds(leg).has(Number(item.control.id))) continue;
      for (const segment of segmentSets[legIndex]) {
        const projected = projectPointToSegment(item.control.location, segment.a, segment.b);
        if (projected.t <= 0.0001 || projected.t >= 0.9999 || projected.distance >= item.radius) continue;
        const center = segment.offset + projected.t * segment.length;
        if (center <= 0.5 || total - center <= 0.5) continue;
        const halfChord = Math.sqrt(Math.max(0, item.radius * item.radius - projected.distance * projected.distance));
        const key = legKey(leg);
        const gaps = result.get(key) || [];
        gaps.push({
          start: Math.max(0, center - halfChord - gapSize / 2),
          length: halfChord * 2 + gapSize,
          automatic: true
        });
        result.set(key, gaps);
      }
    }
  }
}

export function legEndpointIds(leg) {
  return new Set([Number(leg.from.control.id), Number(leg.to.control.id)]);
}

export function automaticControlCircleGaps(rows, metrics, pixelsPerMapUnit) {
  const result = new Map();
  const lineWidthMap = Math.max(0.7, 0.35 * metrics.unit * (metrics.appearance?.lineWidthRatio || 1)) / Math.max(0.0001, pixelsPerMapUnit);
  const controls = uniqueDrawableControls(rows)
    .map(control => ({
      control,
      radius: symbolApparentRadius(control, metrics) / Math.max(0.0001, pixelsPerMapUnit),
      visibleRadius: symbolApparentRadius(control, metrics) / Math.max(0.0001, pixelsPerMapUnit) + lineWidthMap
    }))
    .filter(item => item.radius > 0);

  for (let i = 0; i < controls.length; i += 1) {
    for (let j = i + 1; j < controls.length; j += 1) {
      const first = controls[i];
      const second = controls[j];
      if (Number(first.control.id) === Number(second.control.id)) continue;
      addPairedControlCircleGaps(result, first, second);
    }
  }
  return result;
}

export function addPairedControlCircleGaps(result, first, second) {
  if (controlCircleCanBeCut(first.control)) {
    addControlCircleGap(result, first.control.id, circleGapForCloseObject(first.control.location, first.radius, second.control.location, second.visibleRadius));
  }
  if (controlCircleCanBeCut(second.control)) {
    addControlCircleGap(result, second.control.id, circleGapForCloseObject(second.control.location, second.radius, first.control.location, first.visibleRadius));
  }
}

export function addControlCircleGap(result, controlId, gap) {
  if (!gap) return;
  const key = String(controlId);
  const gaps = result.get(key) || [];
  gaps.push(gap);
  result.set(key, gaps);
}

export function uniqueDrawableControls(rows) {
  const seen = new Set();
  const controls = [];
  for (const row of rows || []) {
    const control = row.control;
    if (!control || seen.has(String(control.id))) continue;
    seen.add(String(control.id));
    controls.push(control);
  }
  return controls;
}

export function controlCircleCanBeCut(control) {
  return ["normal", "finish"].includes(control?.kind || "normal");
}

export function circleGapForCloseObject(centerControl, radiusControl, centerOther, radiusOther) {
  const distanceBetween = distance(centerControl, centerOther);
  const combinedRadius = radiusControl + radiusOther;
  if (!(distanceBetween < combinedRadius && distanceBetween > combinedRadius * 0.25)) {
    return null;
  }

  const denominator = 2 * radiusControl * distanceBetween;
  if (denominator <= 0) return null;
  const arcCos = (radiusControl * radiusControl + distanceBetween * distanceBetween - radiusOther * radiusOther) / denominator;
  if (Math.abs(arcCos) >= 1) return null;

  const halfAngleGap = radiansToDegrees(Math.acos(arcCos));
  const angleGap = radiansToDegrees(Math.atan2(centerOther.y - centerControl.y, centerOther.x - centerControl.x));
  return {
    start: angleGap - halfAngleGap,
    stop: angleGap + halfAngleGap,
    automatic: true
  };
}

export function legSegments(points) {
  const segments = [];
  let offset = 0;
  for (let i = 0; i < points.length - 1; i += 1) {
    const a = points[i];
    const b = points[i + 1];
    const length = distance(a, b);
    if (length > 0.001) {
      segments.push({ a, b, offset, length });
    }
    offset += length;
  }
  return segments;
}

export function legsShareControl(a, b) {
  const aIds = new Set([a.from.control.id, a.to.control.id].map(Number));
  return aIds.has(Number(b.from.control.id)) || aIds.has(Number(b.to.control.id));
}

export function segmentIntersection(a, b, c, d) {
  const r = { x: b.x - a.x, y: b.y - a.y };
  const s = { x: d.x - c.x, y: d.y - c.y };
  const denominator = cross(r, s);
  if (Math.abs(denominator) < 1e-9) return null;
  const q = { x: c.x - a.x, y: c.y - a.y };
  const ta = cross(q, s) / denominator;
  const tb = cross(q, r) / denominator;
  const eps = 1e-5;
  if (ta <= eps || ta >= 1 - eps || tb <= eps || tb >= 1 - eps) return null;
  return { ta, tb };
}

export function screenGapsForLeg(gaps, pixelsPerMapUnit, startTrimPx) {
  return mergeGaps(gaps)
    .map(gap => ({
      start: Math.max(0, (Number(gap.start) || 0) * pixelsPerMapUnit - startTrimPx),
      length: Math.max(0, (Number(gap.length) || 0) * pixelsPerMapUnit)
    }))
    .filter(gap => gap.length > 0);
}

export function screenFlagRangesForLeg(leg, pixelsPerMapUnit, startTrimPx) {
  const range = legFlagRange(leg);
  if (!range) return [];
  return [{
    start: Math.max(0, range.start * pixelsPerMapUnit - startTrimPx),
    length: Math.max(0, (range.end - range.start) * pixelsPerMapUnit)
  }];
}

export function legFlagRange(leg) {
  const flagging = normalizeLegFlaggingKind(leg.leg?.flagging?.kind);
  if (!["begin", "end", "middle"].includes(flagging)) return null;
  const points = legMapPoints(leg);
  const total = pathLength(points);
  if (total <= 0) return null;
  if (flagging === "begin") {
    const end = leg.leg?.flagging?.end ?? (leg.leg?.flagging?.point ? distanceAlongPathAtPoint(points, leg.leg.flagging.point).distance : total / 2);
    return { start: 0, end: clamp(end, 0, total) };
  }
  if (flagging === "end") {
    const start = leg.leg?.flagging?.start ?? (leg.leg?.flagging?.point ? distanceAlongPathAtPoint(points, leg.leg.flagging.point).distance : total / 2);
    return { start: clamp(start, 0, total), end: total };
  }
  const start = clamp(Number(leg.leg?.flagging?.start) || total * 0.35, 0, total);
  const end = clamp(Number(leg.leg?.flagging?.end) || total * 0.65, start, total);
  return { start, end };
}

export function isEntireLegFlagged(leg) {
  return normalizeLegFlaggingKind(leg.leg?.flagging?.kind) === "all";
}

export function flaggedEndpointGapSuppression(leg) {
  const flagging = normalizeLegFlaggingKind(leg.leg?.flagging?.kind);
  return {
    start: flagging === "all" || flagging === "begin",
    end: flagging === "all" || flagging === "end"
  };
}

export function normalizeLegFlaggingKind(kind) {
  return {
    "beginning-part": "begin",
    "end-part": "end",
    "middle-part": "middle"
  }[kind] || kind || "none";
}

export function mergeGaps(gaps) {
  return [...(gaps || [])]
    .map(gap => ({ start: Math.max(0, Number(gap.start) || 0), stop: Math.max(0, (Number(gap.start) || 0) + Math.max(0, Number(gap.length) || 0)) }))
    .filter(gap => gap.stop > gap.start)
    .sort((a, b) => a.start - b.start)
    .reduce((merged, gap) => {
      const last = merged[merged.length - 1];
      if (last && gap.start <= last.stop) {
        last.stop = Math.max(last.stop, gap.stop);
      }
      else {
        merged.push({ ...gap });
      }
      return merged;
    }, [])
    .map(gap => ({ start: gap.start, length: gap.stop - gap.start }));
}

export function pointAtPathDistance(points, distanceAlongPath) {
  if (!points.length) return { x: 0, y: 0 };
  let remaining = Math.max(0, distanceAlongPath);
  for (let i = 0; i < points.length - 1; i += 1) {
    const a = points[i];
    const b = points[i + 1];
    const length = distance(a, b);
    if (length >= remaining && length > 0) {
      const t = remaining / length;
      return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
    }
    remaining -= length;
  }
  return { ...points[points.length - 1] };
}

export function pathLength(points) {
  let length = 0;
  for (let index = 0; index < points.length - 1; index += 1) {
    length += distance(points[index], points[index + 1]);
  }
  return length;
}

export function distanceAlongPathAtPoint(points, point) {
  let best = { distance: 0, screenDistance: Infinity };
  let offset = 0;
  for (let i = 0; i < points.length - 1; i += 1) {
    const a = points[i];
    const b = points[i + 1];
    const projected = projectPointToSegment(point, a, b);
    if (projected.distance < best.screenDistance) {
      best = { distance: offset + projected.t * distance(a, b), screenDistance: projected.distance };
    }
    offset += distance(a, b);
  }
  return best;
}

export function projectPointToSegment(point, a, b) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lengthSq = dx * dx + dy * dy;
  const t = lengthSq > 0 ? clamp(((point.x - a.x) * dx + (point.y - a.y) * dy) / lengthSq, 0, 1) : 0;
  const projected = { x: a.x + dx * t, y: a.y + dy * t };
  return { t, point: projected, distance: distance(point, projected) };
}

export function nearestLeg(point, state, threshold) {
  let best = null;
  for (const leg of currentCourseLegs(state)) {
    const nearest = distanceAlongPathAtPoint(legMapPoints(leg), point);
    if (nearest.screenDistance <= threshold && (!best || nearest.screenDistance < best.distance)) {
      best = { leg, pathDistance: nearest.distance, distance: nearest.screenDistance };
    }
  }
  return best;
}

export function drawHandleDot(ctx, point, label) {
  ctx.save();
  ctx.fillStyle = label === "start" ? "#ffffff" : "#2477c9";
  ctx.strokeStyle = "#2477c9";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(point.x, point.y, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

export function drawSquareHandle(ctx, point, selected = false) {
  const size = selected ? 8 : 6;
  ctx.save();
  ctx.setLineDash([]);
  ctx.globalAlpha = selected ? 1 : 0.78;
  ctx.fillStyle = selected ? "#2477c9" : "#ffffff";
  ctx.strokeStyle = "#2477c9";
  ctx.lineWidth = 1.5;
  ctx.fillRect(point.x - size / 2, point.y - size / 2, size, size);
  ctx.strokeRect(point.x - size / 2, point.y - size / 2, size, size);
  ctx.restore();
}

export function drawBendDot(ctx, point, selected = false) {
  ctx.save();
  ctx.fillStyle = selected ? "#2477c9" : "#ffffff";
  ctx.strokeStyle = "#2477c9";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(point.x, point.y, 4.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

export function drawLegSelectionOutline(ctx, points) {
  if (!points || points.length < 2) return;
  const offset = 6;
  ctx.save();
  ctx.setLineDash([]);
  ctx.strokeStyle = "#2477c9";
  ctx.lineWidth = 2;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  for (let i = 1; i < points.length; i += 1) {
    const a = points[i - 1];
    const b = points[i];
    const length = distance(a, b);
    if (!(length > 0.01)) continue;
    const nx = -(b.y - a.y) / length;
    const ny = (b.x - a.x) / length;
    const leftA = { x: a.x + nx * offset, y: a.y + ny * offset };
    const leftB = { x: b.x + nx * offset, y: b.y + ny * offset };
    const rightA = { x: a.x - nx * offset, y: a.y - ny * offset };
    const rightB = { x: b.x - nx * offset, y: b.y - ny * offset };
    ctx.beginPath();
    ctx.moveTo(leftA.x, leftA.y);
    ctx.lineTo(leftB.x, leftB.y);
    ctx.moveTo(rightA.x, rightA.y);
    ctx.lineTo(rightB.x, rightB.y);
    ctx.moveTo(leftA.x, leftA.y);
    ctx.lineTo(rightA.x, rightA.y);
    ctx.moveTo(leftB.x, leftB.y);
    ctx.lineTo(rightB.x, rightB.y);
    ctx.stroke();
  }
  ctx.restore();
}

export function drawControlCenterPoint(ctx, point) {
  ctx.save();
  ctx.setLineDash([]);
  ctx.fillStyle = "#2477c9";
  ctx.beginPath();
  ctx.arc(point.x, point.y, 1.75, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export function line(ctx, x1, y1, x2, y2) {
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}

export function cross(a, b) {
  return a.x * b.y - a.y * b.x;
}

export function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export function paddedBounds(bounds) {
  const padding = Math.max(2, Math.max(bounds.width, bounds.height) * 0.08);
  return {
    left: bounds.left - padding,
    right: bounds.right + padding,
    top: bounds.top + padding,
    bottom: bounds.bottom - padding,
    width: Math.max(1, bounds.width + padding * 2),
    height: Math.max(1, bounds.height + padding * 2)
  };
}

export function mergeBounds(a, b) {
  const left = Math.min(a.left, b.left);
  const right = Math.max(a.right, b.right);
  const top = Math.max(a.top, b.top);
  const bottom = Math.min(a.bottom, b.bottom);
  return {
    left,
    right,
    top,
    bottom,
    width: Math.max(1, right - left),
    height: Math.max(1, top - bottom)
  };
}

export function boundsCenter(bounds) {
  return {
    x: (bounds.left + bounds.right) / 2,
    y: (bounds.top + bounds.bottom) / 2
  };
}

export function sameBounds(a, b) {
  return nearlyEqual(a.left, b.left)
    && nearlyEqual(a.right, b.right)
    && nearlyEqual(a.top, b.top)
    && nearlyEqual(a.bottom, b.bottom)
    && nearlyEqual(a.width, b.width)
    && nearlyEqual(a.height, b.height);
}

export function nearlyEqual(a, b) {
  return Math.abs((a || 0) - (b || 0)) < 0.0001;
}

export function nowMs() {
  if (typeof performance !== "undefined" && performance.now) {
    return performance.now();
  }
  return Date.now();
}

export function scheduleFrame(callback) {
  if (typeof window !== "undefined" && window.requestAnimationFrame) {
    return window.requestAnimationFrame(callback);
  }
  return setTimeout(() => callback(nowMs()), 16);
}

export function wheelZoomFactor(event, fallbackHeight) {
  const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? fallbackHeight : 1;
  const deltaY = event.deltaY * unit;
  return clamp(Math.exp(-deltaY * 0.0015), 0.72, 1.38);
}

export function pointerPosition(event, cachedRect) {
  const rect = cachedRect || event.currentTarget?.getBoundingClientRect?.();
  if (!rect) return { x: event.offsetX, y: event.offsetY };
  return { x: event.clientX - rect.left, y: event.clientY - rect.top };
}

export function printAreaFrameDragCenter(drag, point) {
  const offset = drag?.printAreaFrameOffset || { x: 0, y: 0 };
  return {
    x: point.x + offset.x,
    y: point.y + offset.y
  };
}

export function pinchGesture(points) {
  if (points.length < 2) return null;
  const a = points[0];
  const b = points[1];
  return {
    center: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 },
    distance: Math.max(1, Math.hypot(b.x - a.x, b.y - a.y))
  };
}

export function layerMapBounds(view) {
  return viewportMapBounds(view.bounds, view.width, view.height, view.pan, view.scale, view.padX, view.padY);
}

export function viewportMapBounds(bounds, width, height, pan, scale, padX = 0, padY = 0) {
  const cx = (bounds.left + bounds.right) / 2;
  const cy = (bounds.top + bounds.bottom) / 2;
  const left = cx + (-padX - width / 2 - pan.x) / scale;
  const right = cx + (width + padX - width / 2 - pan.x) / scale;
  const top = cy - (-padY - height / 2 - pan.y) / scale;
  const bottom = cy - (height + padY - height / 2 - pan.y) / scale;
  return {
    left: Math.min(left, right),
    right: Math.max(left, right),
    top: Math.max(top, bottom),
    bottom: Math.min(top, bottom)
  };
}

export function boundsContain(outer, inner) {
  const epsilon = 0.001;
  return !!outer && !!inner
    && outer.left <= inner.left + epsilon
    && outer.right >= inner.right - epsilon
    && outer.top >= inner.top - epsilon
    && outer.bottom <= inner.bottom + epsilon;
}

export function omapRenderKey(mapVersion, view) {
  return [
    mapVersion,
    view.width,
    view.height,
    view.ratio,
    view.highQuality ? 1 : 0,
    roundKey(view.zoom),
    roundKey(view.pan.x),
    roundKey(view.pan.y),
    roundKey(view.bounds.left),
    roundKey(view.bounds.right),
    roundKey(view.bounds.top),
    roundKey(view.bounds.bottom)
  ].join(":");
}

export function roundKey(value) {
  return Math.round((value || 0) * 1000) / 1000;
}

export function releaseOmapLayer(layer) {
  if (layer?.source?.close) {
    layer.source.close();
  }
}

export function outgoingDirection(row, legs) {
  const leg = legs.find(candidate => candidate.from.courseControl?.id === row.courseControl?.id);
  if (!leg) {
    return Math.PI / 2;
  }
  const nextPoint = leg.leg?.bends?.[0] || leg.to.control.location;
  return directionAngle(row.control.location, nextPoint);
}

export function numberLocationPoint(row, point, metrics, rows, legs, project) {
  const numberLocation = controlNumberLocationForRow(row);
  if (numberLocation) {
    return project({
      x: row.control.location.x + numberLocation.x,
      y: row.control.location.y + numberLocation.y
    });
  }
  return bestControlLabelPoint(row, point, metrics, rows, legs, project);
}

export function controlNumberLocationForRow(row) {
  if (row.courseControl?.numberLocation) {
    return row.courseControl.numberLocation;
  }
  return (row.courseControls || []).find(courseControl => courseControl?.numberLocation)?.numberLocation || null;
}

export function mergedCourseLabelRows(rows) {
  const result = [];
  const groups = new Map();
  for (const row of rows || []) {
    if (!row?.control || row.control.kind !== "normal" || !row.label) {
      continue;
    }
    const key = String(row.control.id);
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key).push(row);
  }

  for (const row of rows || []) {
    if (!row?.control || row.control.kind !== "normal" || !row.label) {
      result.push(row);
      continue;
    }
    const key = String(row.control.id);
    const group = groups.get(key) || [row];
    if (group[0] !== row) {
      continue;
    }
    if (group.length === 1) {
      result.push({
        ...row,
        courseControls: [row.courseControl].filter(Boolean),
        courseControlIds: [row.courseControl?.id].filter(Boolean)
      });
      continue;
    }
    const courseControls = group.map(item => item.courseControl).filter(Boolean);
    const courseControlIds = uniqueValues(courseControls.map(item => item.id));
    const ordinals = uniqueValues(group.map(item => item.ordinal).filter(value => value !== "" && value != null));
    const fallbackLabels = uniqueValues(group.map(item => item.label).filter(Boolean));
    const ordinal = ordinals.join("/");
    const label = mergedControlLabel(row.course, row.control, courseControls, ordinal, fallbackLabels);
    const placementCourseControl = courseControls.find(item => item.numberLocation) || courseControls[0] || row.courseControl;
    result.push({
      ...row,
      courseControl: placementCourseControl,
      courseControls,
      courseControlIds,
      ordinal,
      label,
      mergedLabels: fallbackLabels
    });
  }
  return result;
}

export function mergedControlLabel(course, control, courseControls, ordinal, fallbackLabels) {
  if (!course || !control || control.kind !== "normal") {
    return fallbackLabels.join("/");
  }
  if (course.kind === "team" && courseControls.some(courseControl => isTeamFreeCourseControl(course, courseControl))) {
    return fallbackLabels.join("/");
  }
  const code = control.code || "";
  const firstCourseControl = courseControls[0] || {};
  const scores = uniqueValues(courseControls
    .map(item => Number(item?.points) || 0)
    .filter(value => value > 0)
    .map(String));
  const score = scores.join("/") || (firstCourseControl.points ? String(firstCourseControl.points) : "");
  const mergedOrdinal = ordinal || fallbackLabels.join("/");
  switch (course.labelKind) {
    case "code": return code;
    case "sequence-and-code": return `${mergedOrdinal}-${code}`;
    case "sequence-and-code-slash": return `${mergedOrdinal}/${code}`;
    case "sequence-and-score": return score ? `${mergedOrdinal}(${score})` : String(mergedOrdinal);
    case "code-and-score-brackets": return score ? `${code}[${score}]` : code;
    case "code-and-score-dash": return score ? `${code}-${score}` : code;
    case "code-and-score":
    case "code-and-score-parens": return score ? `${code}(${score})` : code;
    case "score": return score;
    default: return String(mergedOrdinal);
  }
}

export function uniqueValues(values) {
  const result = [];
  const seen = new Set();
  for (const value of values || []) {
    const key = String(value);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    result.push(value);
  }
  return result;
}

export function bestControlLabelPoint(row, point, metrics, rows, legs, project) {
  const baseDistance = symbolApparentRadius(row.control, metrics)
    + NORMALIZED_LABEL_GAP(metrics)
    + controlLabelSize(row.label, metrics).height * 0.45;
  const angles = [-35, 35, -90, 90, 0, 180, -135, 135, -60, 60, -120, 120];
  let best = null;
  for (const angle of angles) {
    const radians = angle * Math.PI / 180;
    const candidate = {
      x: point.x + Math.cos(radians) * baseDistance,
      y: point.y + Math.sin(radians) * baseDistance
    };
    const score = labelPlacementScore(candidate, row, metrics, rows, legs, project);
    if (!best || score < best.score) {
      best = { point: candidate, score };
    }
    if (score <= 0) break;
  }
  return best?.point || defaultControlLabelPoint(point, metrics);
}

export function NORMALIZED_LABEL_GAP(metrics) {
  return NORMALIZED_CONTROL_NUMBER_DISTANCE * (metrics.appearance?.controlCircleSizeRatio || 1) * metrics.unit;
}

export function controlLabelSize(text, metrics) {
  const fontPx = Math.max(8, 5.57 * metrics.unit * (metrics.appearance?.numberSizeRatio || 1));
  return {
    width: Math.max(fontPx * 0.75, String(text || "").length * fontPx * 0.62),
    height: fontPx
  };
}

export function controlNumberScreenRect(row, metrics, rows, legs, project, padding = 0) {
  const point = numberLocationPoint(row, project(row.control.location), metrics, rows, legs, project);
  return controlNumberRect(row.label, point, metrics, padding);
}

export function controlNumberRect(label, point, metrics, padding = 0) {
  const size = controlLabelSize(label, metrics);
  return {
    left: point.x - size.width / 2 - padding,
    right: point.x + size.width / 2 + padding,
    top: point.y - size.height / 2 - padding,
    bottom: point.y + size.height / 2 + padding
  };
}

export function labelPlacementScore(center, row, metrics, rows, legs, project) {
  const size = controlLabelSize(row.label, metrics);
  const rect = {
    left: center.x - size.width / 2,
    right: center.x + size.width / 2,
    top: center.y - size.height / 2,
    bottom: center.y + size.height / 2
  };
  let score = 0;
  for (const other of rows || []) {
    if (!other.control) continue;
    const otherPoint = project(other.control.location);
    const radius = symbolApparentRadius(other.control, metrics) + 2;
    const overlap = radius - distancePointToRect(otherPoint, rect);
    if (overlap > 0) {
      score += other.control === row.control ? overlap * 12 : overlap * 7;
    }
  }
  for (const leg of legs || []) {
    const points = legMapPoints(leg).map(project);
    for (let index = 0; index < points.length - 1; index += 1) {
      if (segmentIntersectsRect(points[index], points[index + 1], rect)) {
        score += 80;
      }
      else {
        const near = Math.min(
          distancePointToSegment({ x: rect.left, y: rect.top }, points[index], points[index + 1]),
          distancePointToSegment({ x: rect.right, y: rect.top }, points[index], points[index + 1]),
          distancePointToSegment({ x: rect.left, y: rect.bottom }, points[index], points[index + 1]),
          distancePointToSegment({ x: rect.right, y: rect.bottom }, points[index], points[index + 1]),
          distancePointToSegment(center, points[index], points[index + 1])
        );
        if (near < 4) score += (4 - near) * 4;
      }
    }
  }
  return score;
}

export function distancePointToRect(point, rect) {
  const bounds = normalizedRect(rect);
  const dx = Math.max(bounds.left - point.x, 0, point.x - bounds.right);
  const dy = Math.max(bounds.top - point.y, 0, point.y - bounds.bottom);
  return Math.hypot(dx, dy);
}

export function distancePointToSegment(point, a, b) {
  return projectPointToSegment(point, a, b).distance;
}

export function segmentIntersectsRect(a, b, rect) {
  if (pointInRect(a, rect) || pointInRect(b, rect)) return true;
  const corners = [
    { x: rect.left, y: rect.top },
    { x: rect.right, y: rect.top },
    { x: rect.right, y: rect.bottom },
    { x: rect.left, y: rect.bottom }
  ];
  for (let index = 0; index < corners.length; index += 1) {
    if (segmentsIntersect(a, b, corners[index], corners[(index + 1) % corners.length])) return true;
  }
  return false;
}

export function pointInRect(point, rect) {
  const bounds = normalizedRect(rect);
  return point.x >= bounds.left && point.x <= bounds.right && point.y >= bounds.top && point.y <= bounds.bottom;
}

export function normalizedRect(rect) {
  return {
    left: Math.min(rect.left, rect.right),
    right: Math.max(rect.left, rect.right),
    top: Math.min(rect.top, rect.bottom),
    bottom: Math.max(rect.top, rect.bottom)
  };
}

export function segmentsIntersect(a, b, c, d) {
  const ab1 = orientation(a, b, c);
  const ab2 = orientation(a, b, d);
  const cd1 = orientation(c, d, a);
  const cd2 = orientation(c, d, b);
  return ab1 * ab2 <= 0 && cd1 * cd2 <= 0;
}

export function orientation(a, b, c) {
  return Math.sign((b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x));
}

export function drawFallbackSpecialPoint(ctx, kind, point) {
  ctx.save();
  ctx.lineWidth = 2;
  ctx.strokeStyle = "#222";
  ctx.fillStyle = fillForSpecial(kind);
  ctx.beginPath();
  if (kind === "water") {
    ctx.arc(point.x, point.y, 9, 0, Math.PI * 2);
    ctx.fill();
  }
  else if (kind === "first-aid") {
    ctx.fillRect(point.x - 9, point.y - 3, 18, 6);
    ctx.fillRect(point.x - 3, point.y - 9, 6, 18);
  }
  else {
    ctx.rect(point.x - 8, point.y - 8, 16, 16);
    ctx.fill();
    ctx.stroke();
  }
  ctx.restore();
}

export function isDragSpecialTool(tool) {
  return ["special:line", "special:rectangle", "special:ellipse"].includes(tool);
}

export function specialShapeForDrag(tool, start, end, state) {
  const kind = tool.slice("special:".length);
  const min = 0.001;
  const safeEnd = distance(start, end) > min ? end : { x: start.x + 20 / Math.max(1, state.ui?.zoom || 1), y: start.y - 12 / Math.max(1, state.ui?.zoom || 1) };
  return {
    tool,
    id: 0,
    kind,
    locations: [{ x: start.x, y: start.y }, { x: safeEnd.x, y: safeEnd.y }],
    color: "upper-purple",
    lineKind: "single",
    lineWidth: 0.35,
    gapSize: 2,
    dashSize: 4,
    cornerRadius: 0
  };
}

export function drawSpecialObject(ctx, eventModel, special, ui, project, scale) {
  const points = (special.locations || []).map(project);
  if (["boundary", "line"].includes(special.kind) && points.length >= 2) {
    drawLineSpecial(ctx, special, points, scale);
  }
  else if (["out-of-bounds", "dangerous-area", "temporary-construction", "white-out"].includes(special.kind) && points.length >= 3) {
    ctx.save();
    ctx.strokeStyle = specialColor(special);
    ctx.fillStyle = fillForSpecial(special.kind);
    ctx.lineWidth = specialLineWidth(special, scale);
    pathLines(ctx, points, true);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
  else if (special.kind === "rectangle" && points.length >= 2) {
    drawRectSpecial(ctx, special, points[0], points[1], scale, false);
  }
  else if (special.kind === "ellipse" && points.length >= 2) {
    drawRectSpecial(ctx, special, points[0], points[1], scale, true);
  }
  else if (special.kind === "text" && points.length >= 1) {
    drawTextSpecial(ctx, special, points, scale);
  }
  else if (special.kind === "descriptions" && points.length >= 2) {
    drawControlDescriptionBlock(ctx, eventModel, special, ui.selectedCourseId, project, mapCourseDisplayOptions(eventModel, ui));
  }
}

export function drawLineSpecial(ctx, special, points, scale) {
  const width = specialLineWidth(special, scale);
  ctx.save();
  ctx.strokeStyle = specialColor(special);
  ctx.lineCap = "butt";
  ctx.lineJoin = "bevel";
  if (special.lineKind === "double") {
    const gap = Math.max(0, Number(special.gapSize) || 0) * scale;
    drawDoublePolyline(ctx, points, width, gap);
  }
  else {
    ctx.lineWidth = width;
    if (special.lineKind === "dashed") {
      ctx.setLineDash(specialDashArray(special, scale));
    }
    pathLines(ctx, points, false);
    ctx.stroke();
  }
  ctx.restore();
}

export function drawRectSpecial(ctx, special, a, b, scale, ellipse) {
  const width = specialLineWidth(special, scale);
  const drawPath = (inset = 0) => {
    const rect = rectFromPoints(
      { x: a.x + Math.sign(b.x - a.x || 1) * inset, y: a.y + Math.sign(b.y - a.y || 1) * inset },
      { x: b.x - Math.sign(b.x - a.x || 1) * inset, y: b.y - Math.sign(b.y - a.y || 1) * inset }
    );
    if (ellipse) {
      ctx.beginPath();
      ctx.ellipse(rect.x + rect.w / 2, rect.y + rect.h / 2, Math.max(0.1, Math.abs(rect.w / 2)), Math.max(0.1, Math.abs(rect.h / 2)), 0, 0, Math.PI * 2);
    }
    else {
      roundRect(ctx, rect.x, rect.y, rect.w, rect.h, Math.abs(special.cornerRadius || 0) * scale);
    }
  };

  ctx.save();
  ctx.strokeStyle = specialColor(special);
  ctx.lineWidth = width;
  ctx.lineCap = "butt";
  ctx.lineJoin = "miter";
  if (special.lineKind === "dashed") {
    ctx.setLineDash(specialDashArray(special, scale));
  }
  if (special.lineKind === "double") {
    const gap = Math.max(0, Number(special.gapSize) || 0) * scale;
    const inset = width + gap / 2;
    drawPath(0);
    ctx.stroke();
    if (Math.abs(a.x - b.x) > inset * 2 && Math.abs(a.y - b.y) > inset * 2) {
      drawPath(inset);
      ctx.stroke();
    }
  }
  else {
    drawPath(0);
    ctx.stroke();
  }
  ctx.restore();
}

export function drawTextSpecial(ctx, special, points, scale) {
  const metrics = textMetrics(special, scale, ctx);

  ctx.save();
  ctx.fillStyle = specialColor(special);
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.font = textCanvasFont(special, metrics.fontPx);
  const rect = {
    x: points[0].x,
    y: points[0].y,
    w: metrics.width,
    h: metrics.height
  };
  let y = rect.y;
  for (const lineText of metrics.lines) {
    ctx.fillText(lineText, rect.x, y);
    y += metrics.lineHeight;
  }
  ctx.restore();
}

export function drawDoublePolyline(ctx, points, width, gap) {
  const offset = width / 2 + gap / 2;
  ctx.lineWidth = width;
  for (const side of [-1, 1]) {
    pathLines(ctx, offsetPolyline(points, side * offset), false);
    ctx.stroke();
  }
}

export function offsetPolyline(points, offset) {
  if (points.length < 2) return points;
  return points.map((point, index) => {
    const previous = points[index - 1] || null;
    const next = points[index + 1] || null;
    const normal = polylineNormal(previous, point, next);
    return { x: point.x + normal.x * offset, y: point.y + normal.y * offset };
  });
}

export function polylineNormal(previous, point, next) {
  const from = previous || point;
  const to = next || point;
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const length = Math.hypot(dx, dy);
  if (length <= 0) return { x: 0, y: 0 };
  return { x: -dy / length, y: dx / length };
}

export function specialLineWidth(special, scale) {
  return Math.max(1, (Number(special.lineWidth) > 0 ? Number(special.lineWidth) : 0.35) * scale);
}

export function specialDashArray(special, scale) {
  const dash = Math.max(1, (Number(special.dashSize) > 0 ? Number(special.dashSize) : 4) * scale);
  const gap = Math.max(1, (Number(special.gapSize) > 0 ? Number(special.gapSize) : 2) * scale);
  return [dash, gap];
}

export function specialColor(special) {
  const color = String(special.color || "upper-purple").trim();
  return SPECIAL_COLORS[color] || (isCssColorValue(color) ? color : PURPLE);
}

export function isCssColorValue(color) {
  return /^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(color)
    || /^rgba?\(/i.test(color)
    || /^hsla?\(/i.test(color);
}

export function pathLines(ctx, points, closed) {
  if (!points.length) return;
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i += 1) {
    ctx.lineTo(points[i].x, points[i].y);
  }
  if (closed) ctx.closePath();
}

export function quoteFont(name) {
  return String(name || "Arial").includes(" ") ? `"${String(name).replace(/"/g, "")}"` : String(name || "Arial");
}

export function rectFromPoints(a, b) {
  return {
    x: Math.min(a.x, b.x),
    y: Math.min(a.y, b.y),
    w: Math.abs(b.x - a.x),
    h: Math.abs(b.y - a.y)
  };
}

export function screenRectFromPoints(points) {
  const xs = points.map(point => point.x);
  const ys = points.map(point => point.y);
  return {
    x: Math.min(...xs),
    y: Math.min(...ys),
    w: Math.max(...xs) - Math.min(...xs),
    h: Math.max(...ys) - Math.min(...ys)
  };
}

export function descriptionCornerPoints(eventModel, special, selectedCourseId, displayOptions = {}) {
  const bounds = descriptionBounds(eventModel, special, selectedCourseId, displayOptions);
  return [
    { x: bounds.left, y: bounds.top },
    { x: bounds.right, y: bounds.top },
    { x: bounds.right, y: bounds.bottom },
    { x: bounds.left, y: bounds.bottom }
  ];
}

export function roundRect(ctx, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + width - r, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + r);
  ctx.lineTo(x + width, y + height - r);
  ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  ctx.lineTo(x + r, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
}

export function fillForSpecial(kind) {
  switch (kind) {
    case "water": return "#3f8fd2";
    case "first-aid": return "#d43f3a";
    case "out-of-bounds": return "rgba(183, 54, 61, 0.18)";
    case "dangerous-area": return "rgba(236, 167, 44, 0.28)";
    case "temporary-construction": return "rgba(123, 95, 64, 0.25)";
    case "white-out": return "rgba(255,255,255,0.88)";
    default: return "rgba(143,42,168,0.20)";
  }
}

export function specialCategoryForHitTest(kind) {
  if (["first-aid", "water", "optional-crossing-point", "forbidden-route", "registration-mark"].includes(kind)) return "point";
  if (["line", "boundary"].includes(kind)) return "line";
  if (["out-of-bounds", "dangerous-area", "temporary-construction", "white-out"].includes(kind)) return "area";
  if (kind === "text") return "text";
  if (kind === "rectangle") return "rectangle";
  if (kind === "ellipse") return "ellipse";
  if (kind === "descriptions") return "descriptions";
  if (kind === "image") return "image";
  return "point";
}

// Approximate the visual radius of a control in map units, for hit testing.
export function symbolApparentRadiusControl(control, scale) {
  // Normal/finish controls have a circle ~5mm diameter at print scale.
  // Start has a triangle. We approximate all as a radius in map units.
  // At 1:15000 scale, 5mm = 75m. In the ppen coordinate system (0.01mm units),
  // this is 500 units. But coordinates in the web version use a different scale.
  // We use a fixed screen-pixel approximation: the control circle is about 14px
  // radius on screen, converted to map units via scale.
  const screenRadius = control.kind === "start" ? 16 : control.kind === "finish" ? 14 : 12;
  return screenRadius / Math.max(0.001, scale);
}

export function radiansToDegrees(radians) {
  return radians * 180 / Math.PI;
}

export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}
