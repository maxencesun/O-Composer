export function drawOmapMap(ctx, omap, project, scale, options = {}) {
  if (!omap?.objects?.length) {
    return;
  }

  const symbols = omap.symbols || {};
  const cullBounds = options.mapBounds ? expandBounds(options.mapBounds, Math.max(0.5, 4 / Math.max(scale || 1, 0.001))) : null;
  const objects = [...omap.objects]
    .filter(object => !cullBounds || !object.bounds || boundsIntersects(object.bounds, cullBounds))
    .sort((a, b) => a.index - b.index);
  const priorities = collectDrawPriorities(symbols);

  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  for (const priority of priorities) {
    for (const object of objects) {
      renderObject(ctx, object, symbols[object.symbolId], symbols, project, scale, null, 0, priority);
    }
  }
  ctx.restore();
}

function boundsIntersects(a, b) {
  return a.left <= b.right
    && a.right >= b.left
    && a.bottom <= b.top
    && a.top >= b.bottom;
}

function expandBounds(bounds, padding) {
  return {
    left: bounds.left - padding,
    right: bounds.right + padding,
    top: bounds.top + padding,
    bottom: bounds.bottom - padding
  };
}

const CURVE_START = 1;
const CLOSE_POINT = 2;
const GAP_POINT = 4;
const HOLE_POINT = 16;
const DASH_POINT = 32;
const FALLBACK_PRIORITY = 50;

function renderObject(ctx, object, symbol, symbols, project, scale, transform, depth, targetPriority) {
  if (!object || depth > 8) {
    return;
  }
  if (symbol?.hidden) {
    return;
  }
  if (symbol?.kind === "combined") {
    for (const part of symbol.combined?.parts || []) {
      const partSymbol = typeof part === "string" ? symbols[part] : part.symbol || symbols[part.symbolId];
      renderObject(ctx, object, partSymbol, symbols, project, scale, transform, depth + 1, targetPriority);
    }
    return;
  }

  if (object.type === "4" || symbol?.kind === "text") {
    drawText(ctx, object, symbol?.text, project, scale, transform, targetPriority);
    return;
  }

  if (object.type === "0" || symbol?.kind === "point") {
    const point = transformedPoint(object.coords[0], transform);
    if (!point) return;
    drawPointSymbol(ctx, symbol?.point, point, object.rotation || 0, symbols, project, scale, depth + 1, targetPriority);
    return;
  }

  if (symbol?.kind === "area" && symbol.area) {
    drawArea(ctx, object, symbol.area, project, scale, transform, targetPriority);
  }
  else if (symbol?.kind === "line" && symbol.line) {
    drawLine(ctx, object, symbol.line, symbols, project, scale, transform, depth, targetPriority);
  }
  else if (targetPriority === FALLBACK_PRIORITY) {
    drawFallbackPath(ctx, object, project, transform);
  }
}

function drawArea(ctx, object, area, project, scale, transform, targetPriority) {
  const points = object.coords.map(point => transformedPoint(point, transform)).filter(Boolean);
  if (points.length < 2) return;
  const screenPoints = projectPoints(points, project);
  ctx.save();
  makePath(ctx, screenPoints, true);
  if (area.innerColor && priorityMatches(area.innerPriority, targetPriority)) {
    ctx.fillStyle = area.innerColor;
    ctx.fill("evenodd");
  }
  for (const pattern of area.patterns || []) {
    drawPattern(ctx, pattern, screenPoints, scale, targetPriority);
  }
  ctx.restore();
}

function drawLine(ctx, object, line, symbols, project, scale, transform, depth, targetPriority) {
  const points = object.coords.map(point => transformedPoint(point, transform)).filter(Boolean);
  if (points.length < 2) return;
  const screenPoints = projectPoints(points, project);
  drawLineBorders(ctx, line, points, project, scale, targetPriority, shouldClose(object));
  if (line.color && priorityMatches(line.priority, targetPriority) && line.width > 0) {
    ctx.save();
    ctx.strokeStyle = line.color;
    ctx.lineWidth = Math.max(0.45, line.width * scale);
    ctx.lineCap = line.capStyle === "1" ? "round" : "butt";
    ctx.lineJoin = line.joinStyle === "2" ? "round" : "miter";
    ctx.setLineDash(line.dashed ? [
      Math.max(1, line.dashLength * scale),
      Math.max(1, line.breakLength * scale)
    ] : []);
    makePath(ctx, screenPoints, shouldClose(object));
    ctx.stroke();
    ctx.restore();
  }
  drawLineMidSymbols(ctx, line, points, symbols, project, scale, depth, targetPriority, shouldClose(object));
}

function drawLineBorders(ctx, line, points, project, scale, targetPriority, closed) {
  for (const border of line.borders || []) {
    if (!priorityMatches(border.priority, targetPriority)) {
      continue;
    }
    const offset = border.side === "left"
      ? -(line.width / 2 + border.shift)
      : line.width / 2 + border.shift;
    const parts = flattenPathParts(points);
    ctx.save();
    ctx.strokeStyle = border.color;
    ctx.lineWidth = Math.max(0.45, border.width * scale);
    ctx.lineCap = line.capStyle === "1" ? "round" : "butt";
    ctx.lineJoin = line.joinStyle === "2" ? "round" : "miter";
    ctx.setLineDash(border.dashed ? [
      Math.max(1, border.dashLength * scale),
      Math.max(1, border.breakLength * scale)
    ] : []);
    for (const part of parts) {
      if (drawOffsetPathPart(ctx, part, offset, project, closed)) {
        ctx.stroke();
      }
    }
    ctx.restore();
  }
}

function drawLineMidSymbols(ctx, line, points, symbols, project, scale, depth, targetPriority, closed) {
  if (!line.midSymbol || !symbolMatchesPriority(line.midSymbol, targetPriority)) {
    return;
  }

  const parts = flattenPathParts(points);
  for (const part of parts) {
    const length = pathLength(part);
    if (length <= 0) continue;
    const positions = lineSymbolPositions(line, part, closed);
    for (const distance of positions) {
      const sample = samplePathPart(part, distance);
      if (!sample) continue;
      renderObject(ctx, {
        type: "0",
        symbolId: null,
        rotation: sample.angle,
        coords: [{ ...sample.point, flags: 0 }],
        index: -1
      }, line.midSymbol, symbols, project, scale, null, depth + 1, targetPriority);
    }
  }
}

function drawPointSymbol(ctx, pointSymbol, origin, rotation, symbols, project, scale, depth, targetPriority) {
  const center = project(origin);
  if (!pointSymbol) {
    if (targetPriority !== FALLBACK_PRIORITY) return;
    ctx.save();
    ctx.fillStyle = "#222";
    ctx.beginPath();
    ctx.arc(center.x, center.y, Math.max(3, 1.2 * scale), 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    return;
  }

  ctx.save();
  if (pointSymbol.innerColor && pointSymbol.innerRadius > 0 && priorityMatches(pointSymbol.innerPriority, targetPriority)) {
    ctx.fillStyle = pointSymbol.innerColor;
    ctx.beginPath();
    ctx.arc(center.x, center.y, Math.max(0.75, pointSymbol.innerRadius * scale), 0, Math.PI * 2);
    ctx.fill();
  }
  if (pointSymbol.outerColor && pointSymbol.outerWidth > 0 && priorityMatches(pointSymbol.outerPriority, targetPriority)) {
    ctx.strokeStyle = pointSymbol.outerColor;
    ctx.lineWidth = Math.max(0.5, pointSymbol.outerWidth * scale);
    const radius = pointSymbol.innerRadius + pointSymbol.outerWidth / 2;
    ctx.beginPath();
    ctx.arc(center.x, center.y, Math.max(0.75, radius * scale), 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();

  for (const element of pointSymbol.elements || []) {
    const nestedTransform = {
      origin,
      rotation: pointSymbol.rotatable ? (rotation || 0) : 0
    };
    renderObject(ctx, element.object, element.symbol, symbols, project, scale, nestedTransform, depth + 1, targetPriority);
  }
}

function drawText(ctx, object, textStyle, project, scale, transform, targetPriority) {
  if (!priorityMatches(textStyle?.priority ?? FALLBACK_PRIORITY, targetPriority)) return;
  const anchor = transformedPoint(object.coords[0], transform);
  if (!anchor) return;
  const screen = project(anchor);
  const lines = String(object.text || "").split(/\r?\n/);
  const fontSize = Math.max(7, (textStyle?.size || 3.5) * scale);
  const lineHeight = fontSize * (textStyle?.lineSpacing || 1.15);
  const totalHeight = lineHeight * lines.length;

  ctx.save();
  ctx.translate(screen.x, screen.y);
  ctx.rotate(-(object.rotation || 0));
  ctx.fillStyle = textStyle?.color || "#222";
  ctx.font = `${fontSize}px ${quoteFont(textStyle?.family || "Arial")}, sans-serif`;
  ctx.textAlign = textAlign(object.hAlign);
  ctx.textBaseline = "top";
  let y = verticalOffset(object.vAlign, totalHeight);
  for (const line of lines) {
    ctx.fillText(line, 0, y);
    y += lineHeight;
  }
  ctx.restore();
}

function drawPattern(ctx, pattern, screenPoints, scale, targetPriority) {
  if (!pattern || !screenPoints.length) return;
  if (!pattern.priorities?.includes(targetPriority) && !priorityMatches(pattern.priority, targetPriority)) return;
  const bounds = screenBounds(screenPoints);
  const visibleBounds = intersectBounds(bounds, canvasScreenBounds(ctx));
  const diagonal = Math.hypot(bounds.width, bounds.height) + 20;
  if (diagonal <= 0) return;

  ctx.save();
  makePath(ctx, screenPoints, true);
  ctx.clip("evenodd");
  if (pattern.type === "2") {
    drawPointPattern(ctx, pattern, bounds, visibleBounds, scale, targetPriority);
  }
  else {
    drawLinePattern(ctx, pattern, bounds, visibleBounds, scale, targetPriority);
  }
  ctx.restore();
}

function drawLinePattern(ctx, pattern, bounds, visibleBounds, scale, targetPriority) {
  if (!priorityMatches(pattern.priority, targetPriority)) return;
  const spacing = Math.max(2, pattern.lineSpacing * scale);
  const direction = screenDirection(pattern.angle);
  const normal = { x: -direction.y, y: direction.x };
  const center = { x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height / 2 };
  const diagonal = Math.hypot(visibleBounds.width, visibleBounds.height) + 40;
  const range = projectedRange(visibleBounds, center, normal);
  const first = Math.floor((range.min - pattern.lineOffset * scale) / spacing) - 1;
  const last = Math.ceil((range.max - pattern.lineOffset * scale) / spacing) + 1;

  ctx.save();
  ctx.strokeStyle = pattern.color || "#777";
  ctx.lineWidth = Math.max(0.35, pattern.lineWidth * scale);
  ctx.beginPath();
  for (let i = first; i <= last; i += 1) {
    const offset = i * spacing + pattern.lineOffset * scale;
    const x = center.x + normal.x * offset;
    const y = center.y + normal.y * offset;
    ctx.moveTo(x - direction.x * diagonal, y - direction.y * diagonal);
    ctx.lineTo(x + direction.x * diagonal, y + direction.y * diagonal);
  }
  ctx.stroke();
  ctx.restore();
}

function drawPointPattern(ctx, pattern, bounds, visibleBounds, scale, targetPriority) {
  const pointStyle = pattern.symbol?.point || null;
  const canFill = pointStyle?.innerColor && pointStyle.innerRadius > 0 && priorityMatches(pointStyle.innerPriority, targetPriority);
  const canStroke = pointStyle?.outerColor && pointStyle.outerWidth > 0 && priorityMatches(pointStyle.outerPriority, targetPriority);
  const canFallback = !pointStyle && priorityMatches(pattern.priority, targetPriority);
  if (!canFill && !canStroke && !canFallback) return;
  const fallbackRadius = Math.max(0.7, (pattern.lineWidth || 0.45) * scale);
  const lineSpacing = Math.max(4, pattern.lineSpacing * scale);
  const pointDistance = Math.max(4, pattern.pointDistance * scale);
  const direction = screenDirection(pattern.angle);
  const normal = { x: -direction.y, y: direction.x };
  const center = { x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height / 2 };
  const normalRange = projectedRange(visibleBounds, center, normal);
  const pointRange = projectedRange(visibleBounds, center, direction);
  const firstNormal = Math.floor((normalRange.min - pattern.lineOffset * scale) / lineSpacing) - 2;
  const lastNormal = Math.ceil((normalRange.max - pattern.lineOffset * scale) / lineSpacing) + 2;
  const firstPoint = Math.floor((pointRange.min - pattern.offsetAlongLine * scale) / pointDistance) - 2;
  const lastPoint = Math.ceil((pointRange.max - pattern.offsetAlongLine * scale) / pointDistance) + 2;

  ctx.save();
  if (canStroke) {
    ctx.strokeStyle = pointStyle.outerColor;
    ctx.lineWidth = Math.max(0.5, pointStyle.outerWidth * scale);
  }
  if (canFill) {
    ctx.fillStyle = pointStyle.innerColor;
  }
  if (canFallback) {
    ctx.fillStyle = pattern.color || "#777";
  }
  for (let i = firstNormal; i <= lastNormal; i += 1) {
    for (let j = firstPoint; j <= lastPoint; j += 1) {
      const x = center.x + normal.x * (i * lineSpacing + pattern.lineOffset * scale) + direction.x * (j * pointDistance + pattern.offsetAlongLine * scale);
      const y = center.y + normal.y * (i * lineSpacing + pattern.lineOffset * scale) + direction.y * (j * pointDistance + pattern.offsetAlongLine * scale);
      if (canFill) {
        ctx.beginPath();
        ctx.arc(x, y, Math.max(0.7, pointStyle.innerRadius * scale), 0, Math.PI * 2);
        ctx.fill();
      }
      if (canStroke) {
        ctx.beginPath();
        ctx.arc(x, y, Math.max(0.7, (pointStyle.innerRadius + pointStyle.outerWidth / 2) * scale), 0, Math.PI * 2);
        ctx.stroke();
      }
      if (canFallback) {
        ctx.beginPath();
        ctx.arc(x, y, fallbackRadius, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
  ctx.restore();
}

function drawFallbackPath(ctx, object, project, transform) {
  const points = object.coords.map(point => transformedPoint(point, transform)).filter(Boolean);
  if (points.length < 2) return;
  ctx.save();
  ctx.strokeStyle = "rgba(30, 42, 54, 0.55)";
  ctx.lineWidth = 1;
  makePath(ctx, projectPoints(points, project), shouldClose(object));
  ctx.stroke();
  ctx.restore();
}

function makePath(ctx, points, closed) {
  if (!points.length) return;
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  let gap = hasFlag(points[0], GAP_POINT);
  let hole = false;
  for (let i = 1; i < points.length; i += 1) {
    if (gap) {
      if (hasFlag(points[i], HOLE_POINT)) {
        gap = false;
        hole = true;
      }
      else if (hasFlag(points[i], GAP_POINT)) {
        gap = false;
        ctx.moveTo(points[i].x, points[i].y);
      }
      continue;
    }

    if (hole) {
      ctx.moveTo(points[i].x, points[i].y);
      hole = false;
      continue;
    }

    if (hasFlag(points[i - 1], CURVE_START) && i + 2 < points.length) {
      ctx.bezierCurveTo(
        points[i].x, points[i].y,
        points[i + 1].x, points[i + 1].y,
        points[i + 2].x, points[i + 2].y
      );
      i += 2;
    }
    else {
      ctx.lineTo(points[i].x, points[i].y);
    }

    if (hasFlag(points[i], CLOSE_POINT)) {
      ctx.closePath();
    }
    if (hasFlag(points[i], HOLE_POINT)) {
      hole = true;
    }
    else if (hasFlag(points[i], GAP_POINT)) {
      gap = true;
    }
  }
  if (closed) ctx.closePath();
}

function flattenPathParts(points) {
  if (!points.length) return [];
  const parts = [];
  let part = [plainPoint(points[0])];
  let gap = hasFlag(points[0], GAP_POINT);
  let hole = false;

  for (let i = 1; i < points.length; i += 1) {
    if (gap) {
      if (hasFlag(points[i], HOLE_POINT)) {
        gap = false;
        hole = true;
      }
      else if (hasFlag(points[i], GAP_POINT)) {
        gap = false;
        pushPathPart(parts, part);
        part = [plainPoint(points[i])];
      }
      continue;
    }

    if (hole) {
      pushPathPart(parts, part);
      part = [plainPoint(points[i])];
      hole = false;
      continue;
    }

    if (!part.length) {
      part.push(plainPoint(points[i - 1]));
    }

    if (hasFlag(points[i - 1], CURVE_START) && i + 2 < points.length) {
      const start = part[part.length - 1];
      const c1 = plainPoint(points[i]);
      const c2 = plainPoint(points[i + 1]);
      const end = plainPoint(points[i + 2]);
      for (let step = 1; step <= 16; step += 1) {
        part.push(cubicPoint(start, c1, c2, end, step / 16));
      }
      i += 2;
    }
    else {
      part.push(plainPoint(points[i]));
    }

    if (hasFlag(points[i], CLOSE_POINT)) {
      const first = part[0];
      const last = part[part.length - 1];
      if (first && last && !samePoint(first, last)) {
        part.push({ ...first });
      }
      pushPathPart(parts, part);
      part = [];
    }
    if (hasFlag(points[i], HOLE_POINT)) {
      hole = true;
    }
    else if (hasFlag(points[i], GAP_POINT)) {
      gap = true;
    }
  }

  pushPathPart(parts, part);
  return parts;
}

function drawOffsetPathPart(ctx, part, offset, project, closed) {
  const offsetPart = offsetPathPart(part, offset, closed);
  if (offsetPart.length < 2) {
    return false;
  }
  const screenPoints = offsetPart.map(project);
  ctx.beginPath();
  ctx.moveTo(screenPoints[0].x, screenPoints[0].y);
  for (let i = 1; i < screenPoints.length; i += 1) {
    ctx.lineTo(screenPoints[i].x, screenPoints[i].y);
  }
  return true;
}

function offsetPathPart(part, offset, closed) {
  if (part.length < 2) return [];
  const pathClosed = closed || samePoint(part[0], part[part.length - 1]);
  const source = pathClosed && samePoint(part[0], part[part.length - 1])
    ? part.slice(0, -1)
    : part;
  if (source.length < 2) return [];

  const result = source.map((point, index) => {
    const previous = source[index - 1] || (pathClosed ? source[source.length - 1] : null);
    const next = source[index + 1] || (pathClosed ? source[0] : null);
    const normal = offsetNormal(previous, point, next, index, source.length, pathClosed);
    return {
      x: point.x + normal.x * offset,
      y: point.y + normal.y * offset
    };
  });
  if (pathClosed && result.length) {
    result.push({ ...result[0] });
  }
  return result;
}

function offsetNormal(previous, point, next, index, count, closed) {
  if (!previous && next) {
    return segmentRightNormal(point, next);
  }
  if (!next && previous) {
    return segmentRightNormal(previous, point);
  }
  if (!previous || !next) {
    return { x: 0, y: 0 };
  }

  const inNormal = segmentRightNormal(previous, point);
  const outNormal = segmentRightNormal(point, next);
  const normal = normalizeVector({
    x: inNormal.x + outNormal.x,
    y: inNormal.y + outNormal.y
  });
  if (normal.x === 0 && normal.y === 0) {
    return index === 0 && !closed ? outNormal : inNormal;
  }

  const dot = normal.x * outNormal.x + normal.y * outNormal.y;
  if (Math.abs(dot) < 0.2 || !Number.isFinite(dot)) {
    return outNormal;
  }
  const scale = Math.max(-4, Math.min(4, 1 / dot));
  return {
    x: normal.x * scale,
    y: normal.y * scale
  };
}

function segmentRightNormal(from, to) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const length = Math.hypot(dx, dy);
  if (length <= 0) {
    return { x: 0, y: 0 };
  }
  return {
    x: dy / length,
    y: -dx / length
  };
}

function normalizeVector(vector) {
  const length = Math.hypot(vector.x, vector.y);
  if (length <= 0) {
    return { x: 0, y: 0 };
  }
  return {
    x: vector.x / length,
    y: vector.y / length
  };
}

function lineSymbolPositions(line, part, closed) {
  const length = pathLength(part);
  const segmentLength = Math.max(0, line.segmentLength || 0);
  if (segmentLength <= 0 || length <= 0) {
    return line.showAtLeastOneSymbol && length > 0 ? [length / 2] : [];
  }

  const groups = midSymbolGroups(part);
  const endLength = Math.max(0, line.endLength || 0);
  const positions = [];

  if (endLength === 0 && !closed) {
    positions.push(0);
  }

  for (const group of groups) {
    positions.push(...lineSymbolGroupPositions(line, group.length, group.firstAtDash, group.lastAtDash).map(position => group.start + position));
  }

  if (endLength === 0 && !closed) {
    positions.push(length);
  }

  return uniquePositions(positions, length);
}

function lineSymbolGroupPositions(line, length, firstAtDash = false, lastAtDash = false) {
  const segmentLength = Math.max(0, line.segmentLength || 0);
  if (segmentLength <= 0 || length <= 0) {
    return line.showAtLeastOneSymbol && length > 0 ? [length / 2] : [];
  }

  const endLength = Math.max(0, line.endLength || 0);
  const count = Math.max(1, Math.floor(line.midSymbolsPerSpot || 1));
  const distance = Math.max(0, line.midSymbolDistance || 0);
  const symbolsLength = (count - 1) * distance;
  const positions = [];
  const dashLength = Math.max(0.01, segmentLength + symbolsLength);
  const firstLength = firstAtDash ? dashLength / 2 : endLength + symbolsLength / 2;
  const lastLength = lastAtDash ? dashLength / 2 : endLength + symbolsLength / 2;
  const combinedEndLength = firstLength + lastLength;
  const averageEndLength = combinedEndLength / 2;
  const segmentedLength = Math.max(0, length - combinedEndLength);
  const rawCount = Math.max(averageEndLength === 0 ? 1 : 0, segmentedLength / dashLength);
  const lowerCount = Math.floor(rawCount);
  const higherCount = Math.ceil(rawCount);
  let gapCount = 0;

  if (averageEndLength > 0) {
    const lowerAbs = Math.abs(length - lowerCount * dashLength - combinedEndLength);
    const higherAbs = Math.abs(length - higherCount * dashLength - combinedEndLength);
    const segmentCount = lowerAbs >= higherAbs ? higherCount : lowerCount;
    gapCount = (higherCount > 0 || length > combinedEndLength - 0.5 * dashLength) ? segmentCount + 1 : 0;
  }
  else {
    const lowerSafe = Math.max(1, lowerCount);
    const higherSafe = Math.max(1, higherCount);
    const lowerDeviation = Math.abs(length - lowerSafe * dashLength) / lowerSafe;
    const higherDeviation = Math.abs(length - higherSafe * dashLength) / higherSafe;
    const segmentCount = lowerDeviation > higherDeviation ? higherSafe : lowerSafe;
    gapCount = segmentCount + 1;
  }

  if (line.showAtLeastOneSymbol && gapCount < 1) {
    gapCount = 1;
  }
  if (gapCount <= 0) {
    return [];
  }

  const denominator = gapCount - 1 + firstLength / dashLength + lastLength / dashLength;
  const actualDashLength = denominator > 0 ? length / denominator : 0;
  if (actualDashLength <= 0) {
    for (const center of gapCount > 1 ? [0, length] : [length / 2]) {
      addMidSymbolGroupPositions(positions, { center, count, distance, length });
    }
    return uniquePositions(positions, length);
  }

  let center = actualDashLength * firstLength / dashLength;
  for (let i = 0; i < gapCount; i += 1) {
    addMidSymbolGroupPositions(positions, { center, count, distance, length });
    center += actualDashLength;
  }

  return uniquePositions(positions, length);
}

function midSymbolGroups(part) {
  const groups = [];
  let startIndex = 0;
  let startOffset = 0;
  let offset = 0;

  for (let index = 1; index < part.length; index += 1) {
    offset += pointDistance(part[index - 1], part[index]);
    if (hasFlag(part[index], DASH_POINT) || hasFlag(part[index], HOLE_POINT)) {
      if (offset > startOffset) {
        groups.push({
          start: startOffset,
          length: offset - startOffset,
          firstAtDash: startIndex > 0 && hasFlag(part[startIndex], DASH_POINT),
          lastAtDash: hasFlag(part[index], DASH_POINT)
        });
      }
      startIndex = index;
      startOffset = offset;
    }
  }

  if (part.length > startIndex + 1 && offset > startOffset) {
    groups.push({
      start: startOffset,
      length: offset - startOffset,
      firstAtDash: startIndex > 0 && hasFlag(part[startIndex], DASH_POINT),
      lastAtDash: false
    });
  }

  return groups.length ? groups : [{ start: 0, length: pathLength(part) }];
}

function addMidSymbolGroupPositions(positions, { center, count, distance, length }) {
  let position = center - ((count - 1) * distance) / 2;
  for (let index = 0; index < count; index += 1) {
    if (position >= 0 && position <= length) {
      positions.push(position);
    }
    position += distance;
  }
}

function uniquePositions(positions, length) {
  const normalized = [];
  for (const position of positions) {
    const value = Math.max(0, Math.min(length, position));
    if (!normalized.some(existing => Math.abs(existing - value) < 1e-6)) {
      normalized.push(value);
    }
  }
  return normalized.sort((a, b) => a - b);
}

function samplePathPart(part, distance) {
  if (part.length < 2) return null;
  let remaining = Math.max(0, distance);
  for (let i = 1; i < part.length; i += 1) {
    const from = part[i - 1];
    const to = part[i];
    const segmentLength = pointDistance(from, to);
    if (segmentLength <= 0) continue;
    if (remaining <= segmentLength || i === part.length - 1) {
      const ratio = Math.max(0, Math.min(1, remaining / segmentLength));
      return {
        point: {
          x: from.x + (to.x - from.x) * ratio,
          y: from.y + (to.y - from.y) * ratio
        },
        angle: Math.atan2(to.y - from.y, to.x - from.x)
      };
    }
    remaining -= segmentLength;
  }
  return null;
}

function pathLength(part) {
  let length = 0;
  for (let i = 1; i < part.length; i += 1) {
    length += pointDistance(part[i - 1], part[i]);
  }
  return length;
}

function pushPathPart(parts, part) {
  if (part.length > 1 && pathLength(part) > 0) {
    parts.push(part);
  }
}

function cubicPoint(p0, p1, p2, p3, t) {
  const mt = 1 - t;
  return {
    x: mt ** 3 * p0.x + 3 * mt ** 2 * t * p1.x + 3 * mt * t ** 2 * p2.x + t ** 3 * p3.x,
    y: mt ** 3 * p0.y + 3 * mt ** 2 * t * p1.y + 3 * mt * t ** 2 * p2.y + t ** 3 * p3.y
  };
}

function plainPoint(point) {
  return {
    x: point.x,
    y: point.y,
    flags: point.flags || 0
  };
}

function samePoint(a, b) {
  return Math.abs(a.x - b.x) < 1e-9 && Math.abs(a.y - b.y) < 1e-9;
}

function pointDistance(a, b) {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

function shouldClose(object) {
  return object.coords.length > 2 && object.coords.some(point => hasFlag(point, CLOSE_POINT));
}

function projectPoints(points, project) {
  return points.map(point => ({
    ...project(point),
    flags: point.flags || 0
  }));
}

function hasFlag(point, flag) {
  return ((point?.flags || 0) & flag) === flag;
}

function transformedPoint(point, transform) {
  if (!point) return null;
  if (!transform) {
    return point;
  }
  const rotation = transform.rotation || 0;
  const cos = Math.cos(rotation);
  const sin = Math.sin(rotation);
  return {
    x: transform.origin.x + point.x * cos - point.y * sin,
    y: transform.origin.y + point.x * sin + point.y * cos,
    flags: point.flags
  };
}

function screenDirection(angle) {
  return {
    x: Math.cos(angle || 0),
    y: -Math.sin(angle || 0)
  };
}

function screenBounds(points) {
  const xs = points.map(point => point.x);
  const ys = points.map(point => point.y);
  const left = Math.min(...xs);
  const right = Math.max(...xs);
  const top = Math.min(...ys);
  const bottom = Math.max(...ys);
  return {
    x: left,
    y: top,
    width: Math.max(1, right - left),
    height: Math.max(1, bottom - top)
  };
}

function canvasScreenBounds(ctx) {
  const canvas = ctx?.canvas;
  const width = Number(canvas?.width) || 4096;
  const height = Number(canvas?.height) || 4096;
  const transform = typeof ctx?.getTransform === "function" ? ctx.getTransform() : null;
  const scaleX = Math.max(0.001, Math.abs(Number(transform?.a) || 1));
  const scaleY = Math.max(0.001, Math.abs(Number(transform?.d) || 1));
  const padding = 64;
  return {
    x: -padding,
    y: -padding,
    width: width / scaleX + padding * 2,
    height: height / scaleY + padding * 2
  };
}

function intersectBounds(a, b) {
  const left = Math.max(a.x, b.x);
  const top = Math.max(a.y, b.y);
  const right = Math.min(a.x + a.width, b.x + b.width);
  const bottom = Math.min(a.y + a.height, b.y + b.height);
  if (right <= left || bottom <= top) {
    return b;
  }
  return {
    x: left,
    y: top,
    width: right - left,
    height: bottom - top
  };
}

function projectedRange(bounds, origin, axis) {
  const corners = [
    { x: bounds.x, y: bounds.y },
    { x: bounds.x + bounds.width, y: bounds.y },
    { x: bounds.x + bounds.width, y: bounds.y + bounds.height },
    { x: bounds.x, y: bounds.y + bounds.height }
  ];
  const values = corners.map(point => (point.x - origin.x) * axis.x + (point.y - origin.y) * axis.y);
  return {
    min: Math.min(...values),
    max: Math.max(...values)
  };
}

function collectDrawPriorities(symbols) {
  const priorities = new Set([FALLBACK_PRIORITY]);
  for (const symbol of Object.values(symbols || {})) {
    addSymbolPriorities(symbol, priorities, symbols, 0);
  }
  return [...priorities]
    .filter(priority => Number.isFinite(priority) && priority < 99)
    .sort((a, b) => b - a);
}

function addSymbolPriorities(symbol, priorities, symbols, depth) {
  if (!symbol || depth > 8) return;
  for (const priority of directSymbolPriorities(symbol)) {
    if (Number.isFinite(priority) && priority < 99) {
      priorities.add(priority);
    }
  }

  if (symbol.kind === "combined") {
    for (const part of symbol.combined?.parts || []) {
      const partSymbol = typeof part === "string" ? symbols[part] : part.symbol || symbols[part.symbolId];
      addSymbolPriorities(partSymbol, priorities, symbols, depth + 1);
    }
  }
  for (const nested of [symbol.line?.midSymbol, symbol.line?.startSymbol, symbol.line?.endSymbol]) {
    addSymbolPriorities(nested, priorities, symbols, depth + 1);
  }
  for (const pattern of symbol.area?.patterns || []) {
    addSymbolPriorities(pattern.symbol, priorities, symbols, depth + 1);
  }
  for (const element of symbol.point?.elements || []) {
    addSymbolPriorities(element.symbol, priorities, symbols, depth + 1);
  }
}

function symbolMatchesPriority(symbol, targetPriority) {
  return directSymbolPriorities(symbol).some(priority => priorityMatches(priority, targetPriority));
}

function directSymbolPriorities(symbol) {
  if (!symbol) return [];
  if (symbol.line) return symbol.line.priorities || [symbol.line.priority];
  if (symbol.area) return symbol.area.priorities || [symbol.area.priority];
  if (symbol.point) return symbol.point.priorities || [symbol.point.priority];
  if (symbol.text) return [symbol.text.priority];
  if (symbol.combined) return symbol.combined.priorities || [];
  return [];
}

function priorityMatches(priority, targetPriority) {
  return Number.isFinite(priority) && Number(priority) === Number(targetPriority);
}

function textAlign(value) {
  if (value === "1") return "center";
  if (value === "2") return "right";
  return "left";
}

function verticalOffset(value, height) {
  if (value === "1") return -height / 2;
  if (value === "2") return -height;
  return 0;
}

function quoteFont(font) {
  return String(font).includes(" ") ? `"${String(font).replace(/"/g, "")}"` : font;
}
