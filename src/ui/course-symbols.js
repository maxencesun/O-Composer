const COURSE_PURPLE_ALPHA = 0.82;
const COURSE_PURPLE = `rgba(166, 38, 255, ${COURSE_PURPLE_ALPHA})`;
const WHITE = "#ffffff";

const NORMAL = Object.freeze({
  lineThickness: 0.35,
  startRadius2000: 4.04,
  startRadius2017: 3.46,
  controlOutsideDiameter2000: 6.0,
  controlOutsideDiameter2017: 5.35,
  controlOutsideDiameterSpr2019: 6.35,
  finishOutsideDiameter2000: 7.0,
  finishOutsideDiameter2017: 6.35,
  finishOutsideDiameterSpr2019: 7.35,
  finishInsideDiameter2000: 5.0,
  finishInsideDiameter2017: 4.35,
  finishInsideDiameterSpr2019: 5.35,
  crossingRadius: 2.5,
  mapIssueLength: 2.5,
  mapIssueWidth: 0.6,
  modernCourseLineGap: 0.15,
  nominalControlNumberHeight: 4.0,
  controlNumberHeightFactor: 5.57 / 4.0,
  controlNumberCircleDistance: 1.825
});

const START_2000 = [
  { x: 0, y: 4.041 },
  { x: 3.5, y: -2.021 },
  { x: -3.5, y: -2.021 }
];
const START_2017 = [
  { x: 0, y: 3.464 },
  { x: 3.0, y: -1.732 },
  { x: -3.0, y: -1.732 }
];
const FIRST_AID_2000 = [
  { x: -0.5, y: 1.5 }, { x: 0.5, y: 1.5 }, { x: 0.5, y: 0.5 }, { x: 1.5, y: 0.5 },
  { x: 1.5, y: -0.5 }, { x: 0.5, y: -0.5 }, { x: 0.5, y: -1.5 }, { x: -0.5, y: -1.5 },
  { x: -0.5, y: -0.5 }, { x: -1.5, y: -0.5 }, { x: -1.5, y: 0.5 }, { x: -0.5, y: 0.5 }
];
const FIRST_AID_2017 = [
  { x: -0.667, y: 2.0 }, { x: 0.667, y: 2.0 }, { x: 0.667, y: 0.667 }, { x: 2.0, y: 0.667 },
  { x: 2.0, y: -0.667 }, { x: 0.667, y: -0.667 }, { x: 0.667, y: -2.0 }, { x: -0.667, y: -2.0 },
  { x: -0.667, y: -0.667 }, { x: -2.0, y: -0.667 }, { x: -2.0, y: 0.667 }, { x: -0.667, y: 0.667 }
];

export function createCourseSymbolMetrics(eventModel, course, appearance, pixelsPerMapMm, allControls = false) {
  const mapScale = positiveNumber(eventModel?.event?.map?.scale, 15000);
  const printScale = allControls
    ? positiveNumber(eventModel?.event?.allControls?.printScale, mapScale)
    : positiveNumber(course?.options?.printScale, mapScale);
  const courseObjRatio = courseObjectRatio(appearance, mapScale, printScale);
  const unit = pixelsPerMapMm * mapScale / 1000 * courseObjRatio;
  return {
    appearance,
    mapStandard: appearance?.mapStandard || eventModel?.event?.standards?.map || "2017",
    pixelsPerMapMm,
    courseObjRatio,
    unit,
    color: courseColor(appearance),
    allControls
  };
}

export function drawCourseLeg(ctx, screenPoints, fromControl, toControl, metrics, flagged = false, options = {}) {
  if (!screenPoints || screenPoints.length < 2) {
    return;
  }
  const startRadius = courseLegTrimRadius(fromControl, metrics);
  const endRadius = courseLegTrimRadius(toControl, metrics);
  const points = trimPolyline(screenPoints, startRadius, endRadius);
  if (points.length < 2) {
    return;
  }

  ctx.save();
  ctx.strokeStyle = metrics.color;
  ctx.lineWidth = lineWidth(metrics);
  ctx.lineCap = "butt";
  ctx.lineJoin = "bevel";
  if (options.flagRanges?.length) {
    drawPolylineWithFlagRanges(ctx, points, options.gaps || [], options.flagRanges);
    ctx.restore();
    return;
  }
  if (flagged || options.dashed) {
    ctx.setLineDash([Math.max(1, 2.0 * metrics.unit), Math.max(1, 0.5 * metrics.unit)]);
  }
  drawPolylineWithGaps(ctx, points, options.gaps || []);
  ctx.restore();
}

export function drawCourseControl(ctx, control, center, metrics, options = {}) {
  switch (control?.kind) {
    case "start":
    case "map-exchange":
      drawStartTriangle(ctx, center, metrics, options.directionAngle ?? Math.PI / 2);
      break;
    case "finish":
      drawFinish(ctx, center, metrics, options.circleGaps || []);
      break;
    case "crossing-point":
      drawCrossing(ctx, center, metrics, degreesToRadians(control.orientation || 0), control.stretch || 0);
      break;
    case "map-issue":
      drawMapIssue(ctx, center, metrics, (options.directionAngle ?? 0) + Math.PI / 2);
      break;
    default:
      drawControlCircle(ctx, center, metrics, control, options.circleGaps || []);
      break;
  }
}

export function drawControlLabel(ctx, text, center, metrics) {
  if (!text) {
    return;
  }
  const fontPx = Math.max(8, NORMAL.controlNumberHeightFactor * NORMAL.nominalControlNumberHeight * metrics.unit * (metrics.appearance?.numberSizeRatio || 1));
  const outline = Math.max(0, metrics.appearance?.numberOutlineWidth || 0) * metrics.unit;

  ctx.save();
  ctx.font = `${metrics.appearance?.numberBold ? "700 " : ""}${fontPx}px ${metrics.appearance?.numberFont === "Arial" ? "Arial" : "Roboto, Arial"}, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.lineJoin = "round";
  if (outline > 0) {
    ctx.strokeStyle = WHITE;
    ctx.lineWidth = outline * 2;
    ctx.strokeText(String(text), center.x, center.y);
  }
  ctx.fillStyle = metrics.color;
  ctx.fillText(String(text), center.x, center.y);
  ctx.restore();
}

export function defaultControlLabelPoint(center, metrics) {
  const distance = controlOutsideDiameter(metrics) * metrics.unit / 2
    + NORMAL.controlNumberCircleDistance * (metrics.appearance?.controlCircleSizeRatio || 1) * metrics.unit;
  const angle = Math.PI / 6;
  return {
    x: center.x + Math.cos(angle) * distance,
    y: center.y - Math.sin(angle) * distance
  };
}

export function drawPointSpecialSymbol(ctx, special, center, metrics) {
  switch (special?.kind) {
    case "first-aid":
      drawFilledPolygon(ctx, center, metrics, standard() === "2000" ? FIRST_AID_2000 : FIRST_AID_2017, 0, metrics.color);
      return true;
    case "water":
      drawWater(ctx, center, metrics);
      return true;
    case "optional-crossing-point":
      drawCrossing(ctx, center, metrics, degreesToRadians(special.orientation || 0), special.stretch || 0);
      return true;
    case "forbidden-route":
      drawForbidden(ctx, center, metrics);
      return true;
    case "registration-mark":
      drawRegistrationMark(ctx, center, metrics);
      return true;
    default:
      return false;
  }

  function standard() {
    return metrics.mapStandard || "2017";
  }
}

export function directionAngle(from, to) {
  if (!from || !to) {
    return Math.PI / 2;
  }
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  if (Math.hypot(dx, dy) <= 0) {
    return Math.PI / 2;
  }
  return Math.atan2(dy, dx);
}

function drawControlCircle(ctx, center, metrics, control, automaticGaps = []) {
  const lw = lineWidth(metrics);
  const radius = Math.max(0.1, (controlOutsideDiameter(metrics) * metrics.unit - lw) / 2);
  ctx.save();
  ctx.strokeStyle = metrics.color;
  ctx.lineWidth = lw;
  ctx.lineCap = "butt";
  ctx.lineJoin = "round";
  drawCircleWithGaps(ctx, center, radius, [...parseCircleGaps(control), ...automaticGaps]);
  if ((metrics.appearance?.centerDotDiameter || 0) > 0) {
    ctx.fillStyle = metrics.color;
    ctx.beginPath();
    ctx.arc(center.x, center.y, (metrics.appearance.centerDotDiameter * metrics.unit) / 2, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawFinish(ctx, center, metrics, automaticGaps = []) {
  const lw = lineWidth(metrics);
  const outer = Math.max(0.1, (finishOutsideDiameter(metrics) * metrics.unit - lw) / 2);
  const inner = Math.max(0.1, (finishInsideDiameter(metrics) * metrics.unit - lw) / 2);
  const gaps = automaticGaps || [];
  ctx.save();
  ctx.strokeStyle = metrics.color;
  ctx.lineWidth = lw;
  ctx.lineCap = "butt";
  ctx.lineJoin = "round";
  drawCircleWithGaps(ctx, center, outer, gaps);
  drawCircleWithGaps(ctx, center, inner, gaps);
  ctx.restore();
}

function drawStartTriangle(ctx, center, metrics, direction) {
  const coords = metrics.mapStandard === "2017" ? START_2017 : START_2000;
  const rotation = direction - Math.PI / 2;
  ctx.save();
  ctx.strokeStyle = metrics.color;
  ctx.lineWidth = lineWidth(metrics);
  ctx.lineCap = "butt";
  ctx.lineJoin = "miter";
  ctx.miterLimit = 10;
  pathLocalPolygon(ctx, center, metrics, coords, rotation);
  ctx.closePath();
  ctx.stroke();
  ctx.restore();
}

function drawMapIssue(ctx, center, metrics, direction) {
  const half = NORMAL.mapIssueLength / 2;
  const points = [
    localToScreen(center, { x: -half, y: 0 }, direction, metrics.unit),
    localToScreen(center, { x: half, y: 0 }, direction, metrics.unit)
  ];
  ctx.save();
  ctx.strokeStyle = metrics.color;
  ctx.lineWidth = Math.max(0.7, NORMAL.mapIssueWidth * metrics.unit * (metrics.appearance?.controlCircleSizeRatio || 1));
  ctx.lineCap = "butt";
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  ctx.lineTo(points[1].x, points[1].y);
  ctx.stroke();
  ctx.restore();
}

function drawCrossing(ctx, center, metrics, orientation, stretch = 0) {
  const sprint = metrics.mapStandard === "Spr2019";
  const inset = sprint ? 0.175 : 0;
  const hStretch = Math.max(0, stretch || 0) / 2;
  const left = hStretch > 0
    ? [
        { x: -0.85 - inset, y: -1.5 - hStretch }, { x: -0.6 - inset, y: -1.08 - hStretch },
        { x: -0.48 - inset, y: -0.5 - hStretch }, { x: -0.48 - inset, y: -hStretch },
        { x: -0.48 - inset, y: hStretch }, { x: -0.48 - inset, y: 0.5 + hStretch },
        { x: -0.6 - inset, y: 1.08 + hStretch }, { x: -0.85 - inset, y: 1.5 + hStretch }
      ]
    : [{ x: -0.85 - inset, y: -1.5 }, { x: -0.35 - inset, y: -0.65 }, { x: -0.35 - inset, y: 0.65 }, { x: -0.85 - inset, y: 1.5 }];
  const right = left.map(point => ({ x: -point.x, y: point.y }));

  ctx.save();
  ctx.strokeStyle = metrics.color;
  ctx.lineWidth = lineWidth(metrics);
  ctx.lineCap = "butt";
  ctx.lineJoin = "miter";
  ctx.beginPath();
  addBezierStripPath(ctx, center, metrics, left, orientation);
  addBezierStripPath(ctx, center, metrics, right, orientation);
  ctx.stroke();
  ctx.restore();
}

function drawForbidden(ctx, center, metrics) {
  const points = [
    [{ x: -1.06, y: -1.06 }, { x: 1.06, y: 1.06 }],
    [{ x: 1.06, y: -1.06 }, { x: -1.06, y: 1.06 }]
  ];
  ctx.save();
  ctx.strokeStyle = metrics.color;
  ctx.lineWidth = Math.max(0.7, NORMAL.lineThickness * metrics.unit * (metrics.appearance?.controlCircleSizeRatio || 1));
  ctx.lineCap = "butt";
  for (const line of points) {
    const a = localToScreen(center, line[0], 0, metrics.unit);
    const b = localToScreen(center, line[1], 0, metrics.unit);
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
  }
  ctx.restore();
}

function drawRegistrationMark(ctx, center, metrics) {
  const extent = 2 * metrics.unit;
  ctx.save();
  ctx.strokeStyle = metrics.color;
  ctx.lineWidth = Math.max(0.45, 0.1 * metrics.unit * (metrics.appearance?.lineWidthRatio || 1));
  ctx.lineCap = "butt";
  ctx.beginPath();
  ctx.moveTo(center.x - extent, center.y);
  ctx.lineTo(center.x + extent, center.y);
  ctx.moveTo(center.x, center.y - extent);
  ctx.lineTo(center.x, center.y + extent);
  ctx.stroke();
  ctx.restore();
}

function drawWater(ctx, center, metrics) {
  const u = metrics.unit;
  ctx.save();
  ctx.strokeStyle = metrics.color;
  ctx.lineWidth = Math.max(0.7, (metrics.mapStandard === "2000" ? NORMAL.lineThickness * (metrics.appearance?.lineWidthRatio || 1) : 0.4) * u);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();
  const topLeft = localToScreen(center, { x: -1.55, y: 1.05 }, 0, u);
  const topRight = localToScreen(center, { x: 1.55, y: 1.05 }, 0, u);
  const bottomRight = localToScreen(center, { x: 0.85, y: -1.55 }, 0, u);
  const bottomLeft = localToScreen(center, { x: -0.85, y: -1.55 }, 0, u);
  ctx.moveTo(topLeft.x, topLeft.y);
  ctx.quadraticCurveTo(center.x, center.y - 1.65 * u, topRight.x, topRight.y);
  ctx.lineTo(bottomRight.x, bottomRight.y);
  ctx.quadraticCurveTo(center.x, center.y + 1.85 * u, bottomLeft.x, bottomLeft.y);
  ctx.closePath();
  ctx.stroke();
  ctx.restore();
}

function drawFilledPolygon(ctx, center, metrics, coords, rotation, color) {
  ctx.save();
  ctx.fillStyle = color;
  pathLocalPolygon(ctx, center, metrics, coords, rotation);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function pathLocalPolygon(ctx, center, metrics, coords, rotation) {
  const first = localToScreen(center, coords[0], rotation, metrics.unit);
  ctx.beginPath();
  ctx.moveTo(first.x, first.y);
  for (let i = 1; i < coords.length; i += 1) {
    const point = localToScreen(center, coords[i], rotation, metrics.unit);
    ctx.lineTo(point.x, point.y);
  }
}

function addBezierStripPath(ctx, center, metrics, points, rotation) {
  const first = localToScreen(center, points[0], rotation, metrics.unit);
  ctx.moveTo(first.x, first.y);
  addCubic(points[1], points[2], points[3]);
  if (points.length > 4) {
    const middle = localToScreen(center, points[4], rotation, metrics.unit);
    ctx.lineTo(middle.x, middle.y);
    addCubic(points[5], points[6], points[7]);
  }

  function addCubic(a, b, c) {
    if (!a || !b || !c) {
      return;
    }
    const c1 = localToScreen(center, a, rotation, metrics.unit);
    const c2 = localToScreen(center, b, rotation, metrics.unit);
    const end = localToScreen(center, c, rotation, metrics.unit);
    ctx.bezierCurveTo(c1.x, c1.y, c2.x, c2.y, end.x, end.y);
  }
}

function drawCircleWithGaps(ctx, center, radius, gaps) {
  if (!gaps.length) {
    ctx.beginPath();
    ctx.arc(center.x, center.y, radius, 0, Math.PI * 2);
    ctx.stroke();
    return;
  }
  const normalized = normalizeGaps(gaps);
  let start = 0;
  for (const gap of normalized) {
    if (gap.start > start) {
      drawArcDegrees(ctx, center, radius, start, gap.start);
    }
    start = Math.max(start, gap.stop);
  }
  if (start < 360) {
    drawArcDegrees(ctx, center, radius, start, 360);
  }
}

function drawArcDegrees(ctx, center, radius, startDeg, stopDeg) {
  if (stopDeg - startDeg <= 0.01) return;
  ctx.beginPath();
  ctx.arc(center.x, center.y, radius, degreesToCanvasRadians(startDeg), degreesToCanvasRadians(stopDeg), true);
  ctx.stroke();
}

function parseCircleGaps(control) {
  const encoded = control?.circleGaps?.[0]?.value || control?.gaps?.[0]?.value || "";
  return String(encoded)
    .split(",")
    .map(item => item.trim())
    .filter(Boolean)
    .map(item => {
      const [start, stop] = item.split(":").map(Number);
      return Number.isFinite(start) && Number.isFinite(stop) ? { start, stop } : null;
    })
    .filter(Boolean);
}

function normalizeGaps(gaps) {
  return gaps
    .map(gap => ({
      start: modulo(gap.start, 360),
      stop: modulo(gap.stop, 360)
    }))
    .flatMap(gap => gap.stop < gap.start ? [{ start: 0, stop: gap.stop }, { start: gap.start, stop: 360 }] : [gap])
    .filter(gap => gap.stop - gap.start > 0.01)
    .sort((a, b) => a.start - b.start)
    .reduce((merged, gap) => {
      const previous = merged[merged.length - 1];
      if (previous && gap.start <= previous.stop + 0.01) {
        previous.stop = Math.max(previous.stop, gap.stop);
      }
      else {
        merged.push({ ...gap });
      }
      return merged;
    }, []);
}

function degreesToCanvasRadians(degrees) {
  return -degreesToRadians(degrees);
}

function localToScreen(center, local, rotation, unit) {
  const cos = Math.cos(rotation);
  const sin = Math.sin(rotation);
  const x = local.x * cos - local.y * sin;
  const y = local.x * sin + local.y * cos;
  return {
    x: center.x + x * unit,
    y: center.y - y * unit
  };
}

function trimPolyline(points, startTrim, endTrim) {
  let result = trimStart(points, startTrim);
  result = trimStart([...result].reverse(), endTrim).reverse();
  return pathLength(result) > 0.5 ? result : [];
}

function drawPolylineWithGaps(ctx, points, gaps) {
  const normalized = normalizeLineGaps(gaps, pathLength(points));
  if (!normalized.length) {
    strokePolyline(ctx, points);
    return;
  }
  let cursor = 0;
  for (const gap of normalized) {
    if (gap.start > cursor) {
      strokePolyline(ctx, slicePolyline(points, cursor, gap.start));
    }
    cursor = Math.max(cursor, gap.stop);
  }
  const total = pathLength(points);
  if (cursor < total) {
    strokePolyline(ctx, slicePolyline(points, cursor, total));
  }
}

function drawPolylineWithFlagRanges(ctx, points, gaps, flagRanges) {
  const total = pathLength(points);
  const ranges = normalizeLineGaps(flagRanges, total);
  let cursor = 0;
  for (const range of ranges) {
    if (range.start > cursor) {
      drawPolylineSegment(ctx, points, gaps, cursor, range.start, false);
    }
    drawPolylineSegment(ctx, points, gaps, range.start, range.stop, true);
    cursor = Math.max(cursor, range.stop);
  }
  if (cursor < total) {
    drawPolylineSegment(ctx, points, gaps, cursor, total, false);
  }
}

function drawPolylineSegment(ctx, points, gaps, start, stop, flagged) {
  const segment = slicePolyline(points, start, stop);
  if (segment.length < 2) return;
  ctx.save();
  if (flagged) {
    ctx.setLineDash([Math.max(1, 2.0 * Math.max(1, ctx.lineWidth / NORMAL.lineThickness)), Math.max(1, 0.5 * Math.max(1, ctx.lineWidth / NORMAL.lineThickness))]);
  }
  else {
    ctx.setLineDash([]);
  }
  drawPolylineWithGaps(ctx, segment, segmentGaps(gaps, start, stop));
  ctx.restore();
}

function segmentGaps(gaps, start, stop) {
  return normalizeLineGaps(gaps, stop)
    .map(gap => ({
      start: Math.max(0, gap.start - start),
      length: Math.min(stop, gap.stop) - Math.max(start, gap.start)
    }))
    .filter(gap => gap.length > 0.5);
}

function strokePolyline(ctx, points) {
  if (!points || points.length < 2) return;
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i += 1) {
    ctx.lineTo(points[i].x, points[i].y);
  }
  ctx.stroke();
}

function normalizeLineGaps(gaps, total) {
  return (gaps || [])
    .map(gap => ({
      start: clamp(Number(gap.start) || 0, 0, total),
      stop: clamp((Number(gap.start) || 0) + Math.max(0, Number(gap.length) || 0), 0, total)
    }))
    .filter(gap => gap.stop - gap.start > 0.5)
    .sort((a, b) => a.start - b.start)
    .reduce((merged, gap) => {
      const previous = merged[merged.length - 1];
      if (previous && gap.start <= previous.stop) {
        previous.stop = Math.max(previous.stop, gap.stop);
      }
      else {
        merged.push({ ...gap });
      }
      return merged;
    }, []);
}

function slicePolyline(points, startDistance, stopDistance) {
  const total = pathLength(points);
  const start = clamp(startDistance, 0, total);
  const stop = clamp(stopDistance, 0, total);
  if (stop <= start || points.length < 2) return [];
  const result = [pointAtDistance(points, start)];
  let cursor = 0;
  for (let i = 0; i < points.length - 1; i += 1) {
    const a = points[i];
    const b = points[i + 1];
    const length = Math.hypot(b.x - a.x, b.y - a.y);
    const next = cursor + length;
    if (next > start && next < stop) {
      result.push({ ...b });
    }
    cursor = next;
  }
  result.push(pointAtDistance(points, stop));
  return result;
}

function pointAtDistance(points, distance) {
  if (!points.length) return { x: 0, y: 0 };
  if (distance <= 0) return { ...points[0] };
  let remaining = distance;
  for (let i = 0; i < points.length - 1; i += 1) {
    const a = points[i];
    const b = points[i + 1];
    const length = Math.hypot(b.x - a.x, b.y - a.y);
    if (length >= remaining && length > 0) {
      const t = remaining / length;
      return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
    }
    remaining -= length;
  }
  return { ...points[points.length - 1] };
}

function trimStart(points, distance) {
  if (points.length < 2 || distance <= 0) {
    return [...points];
  }
  let remaining = distance;
  for (let i = 0; i < points.length - 1; i += 1) {
    const a = points[i];
    const b = points[i + 1];
    const length = Math.hypot(b.x - a.x, b.y - a.y);
    if (length > remaining) {
      const t = remaining / length;
      return [
        { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t },
        ...points.slice(i + 1)
      ];
    }
    remaining -= length;
  }
  return [points[points.length - 1]];
}

function pathLength(points) {
  let length = 0;
  for (let i = 1; i < points.length; i += 1) {
    length += Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y);
  }
  return length;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function symbolApparentRadius(control, metrics) {
  switch (control?.kind) {
    case "start":
    case "map-exchange":
      return startRadius(metrics) * metrics.unit;
    case "finish":
      return Math.max(0, (finishOutsideDiameter(metrics) * metrics.unit - lineWidth(metrics)) / 2);
    case "crossing-point":
      return ((metrics.mapStandard === "Spr2019" ? 1.82 : 1.72) + (control.stretch || 0) / 2) * metrics.unit;
    case "map-issue":
      return 0;
    default:
      return Math.max(0, (controlOutsideDiameter(metrics) * metrics.unit - lineWidth(metrics)) / 2);
  }
}

export function courseLegTrimRadius(control, metrics) {
  const radius = symbolApparentRadius(control, metrics);
  if (radius <= 0 || control?.kind === "map-issue") {
    return radius;
  }
  const strokeOuter = lineWidth(metrics) / 2;
  const gap = courseLineEndpointGap(metrics);
  return radius + strokeOuter + gap;
}

function lineWidth(metrics) {
  return Math.max(0.7, NORMAL.lineThickness * metrics.unit * (metrics.appearance?.lineWidthRatio || 1));
}

function courseLineEndpointGap(metrics) {
  if (metrics.mapStandard !== "2017" && metrics.mapStandard !== "Spr2019") {
    return 0;
  }
  return NORMAL.modernCourseLineGap * metrics.unit;
}

function controlOutsideDiameter(metrics) {
  const base = metrics.mapStandard === "2017"
    ? NORMAL.controlOutsideDiameter2017
    : metrics.mapStandard === "Spr2019"
      ? NORMAL.controlOutsideDiameterSpr2019
      : NORMAL.controlOutsideDiameter2000;
  return base * (metrics.appearance?.controlCircleSizeRatio || 1);
}

function finishOutsideDiameter(metrics) {
  const base = metrics.mapStandard === "2017"
    ? NORMAL.finishOutsideDiameter2017
    : metrics.mapStandard === "Spr2019"
      ? NORMAL.finishOutsideDiameterSpr2019
      : NORMAL.finishOutsideDiameter2000;
  return base * (metrics.appearance?.controlCircleSizeRatio || 1);
}

function finishInsideDiameter(metrics) {
  const controlSize = metrics.appearance?.controlCircleSizeRatio || 1;
  const lineSize = metrics.appearance?.lineWidthRatio || 1;
  const base = metrics.mapStandard === "2017"
    ? NORMAL.finishInsideDiameter2017
    : metrics.mapStandard === "Spr2019"
      ? NORMAL.finishInsideDiameterSpr2019
      : NORMAL.finishInsideDiameter2000;
  return (base + NORMAL.lineThickness) * controlSize - lineSize * NORMAL.lineThickness;
}

function startRadius(metrics) {
  return (metrics.mapStandard === "2017" ? NORMAL.startRadius2017 : NORMAL.startRadius2000) * (metrics.appearance?.controlCircleSizeRatio || 1);
}

function courseObjectRatio(appearance, mapScale, printScale) {
  switch (appearance?.scaleSizes) {
    case "RelativeToMap":
      return 1;
    case "RelativeTo15000":
      return 15000 / mapScale;
    default:
      return printScale / mapScale;
  }
}

function courseColor(appearance) {
  if (!appearance?.purple) {
    return COURSE_PURPLE;
  }
  const { cyan = 0.35, magenta = 0.85, yellow = 0, black = 0 } = appearance.purple;
  const r = Math.round(255 * (1 - cyan) * (1 - black));
  const g = Math.round(255 * (1 - magenta) * (1 - black));
  const b = Math.round(255 * (1 - yellow) * (1 - black));
  return `rgba(${r}, ${g}, ${b}, ${COURSE_PURPLE_ALPHA})`;
}

function positiveNumber(value, fallback) {
  return Number.isFinite(Number(value)) && Number(value) > 0 ? Number(value) : fallback;
}

function degreesToRadians(degrees) {
  return (Number(degrees) || 0) * Math.PI / 180;
}

function modulo(value, modulus) {
  return ((value % modulus) + modulus) % modulus;
}
