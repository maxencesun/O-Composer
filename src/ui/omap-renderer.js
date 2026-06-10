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


function canvasLineCap(capStyle) {
  const value = String(capStyle ?? "0");
  if (value === "1") return "round";
  if (value === "2") return "square";
  return "butt";
}

function drawLine(ctx, object, line, symbols, project, scale, transform, depth, targetPriority) {
  const points = object.coords.map(point => transformedPoint(point, transform)).filter(Boolean);
  if (points.length < 2) return;
  const closed = shouldClose(object);
  const fullParts = flattenPathParts(points);
  const drawableParts = linePartsForDrawing(fullParts, line, closed, true);
  if (!drawableParts.length && !fullParts.length) return;

  drawLineBorders(ctx, line, points, project, scale, targetPriority, closed);
  if (line.color && priorityMatches(line.priority, targetPriority) && line.width > 0 && drawableParts.length) {
    ctx.save();
    ctx.strokeStyle = line.color;
    ctx.lineWidth = Math.max(0.45, line.width * scale);
    ctx.lineCap = canvasLineCap(line.capStyle);
    ctx.lineJoin = line.joinStyle === "2" ? "round" : "miter";
    ctx.setLineDash([]);
    if (line.dashed) {
      for (const part of drawableParts) {
        drawDashedPathPart(ctx, part, line.dashInfo || line, project, closed, scale);
      }
    }
    else if (line.startOffset > 0 || line.endOffset > 0 || line.minimumLength > 0) {
      for (const part of drawableParts) {
        drawPathPart(ctx, part, project, closed);
        ctx.stroke();
      }
    }
    else {
      makePath(ctx, projectPoints(points, project), closed);
      ctx.stroke();
    }
    ctx.restore();
  }
  drawLineEndpointSymbols(ctx, line, fullParts, symbols, project, scale, depth, targetPriority);
  drawLineDashSymbols(ctx, line, fullParts, symbols, project, scale, depth, targetPriority);
  drawLineMidSymbols(ctx, line, drawableParts, symbols, project, scale, depth, targetPriority, closed);
}

function drawLineBorders(ctx, line, points, project, scale, targetPriority, closed) {
  for (const border of line.borders || []) {
    if (!priorityMatches(border.priority, targetPriority)) {
      continue;
    }
    const offsetDistance = line.width / 2 + border.width / 4 + border.shift / 2;
    const offset = border.side === "left" ? -offsetDistance : offsetDistance;
    const parts = flattenPathParts(points);
    ctx.save();
    ctx.strokeStyle = border.color;
    ctx.lineWidth = Math.max(0.45, border.width * scale);
    ctx.lineCap = canvasLineCap(line.capStyle);
    ctx.lineJoin = line.joinStyle === "2" ? "round" : "miter";
    ctx.setLineDash([]);
    for (const part of parts) {
      const offsetPart = offsetPathPart(part, offset, closed);
      if (offsetPart.length < 2) continue;
      if (line.dashed || border.dashed) {
        drawDashedPathPart(ctx, offsetPart, line.dashed ? (line.dashInfo || line) : (border.dashInfo || border), project, closed, scale);
      }
      else {
        drawPathPart(ctx, offsetPart, project, closed);
        ctx.stroke();
      }
    }
    ctx.restore();
  }
}

function drawLineMidSymbols(ctx, line, parts, symbols, project, scale, depth, targetPriority, closed) {
  if (!line.midSymbol || !symbolMatchesPriority(line.midSymbol, targetPriority)) {
    return;
  }

  for (const part of parts) {
    const length = pathLength(part);
    if (length <= 0) continue;
    const positions = line.dashed
      ? dashedMidSymbolPositions(line, part, closed)
      : lineSymbolPositions(line, part, closed);
    for (const distance of positions) {
      const sample = samplePathPart(part, distance);
      if (!sample) continue;
      renderPointLikeSymbol(ctx, line.midSymbol, sample.point, sample.angle, symbols, project, scale, depth + 1, targetPriority);
    }
  }
}

function renderPointLikeSymbol(ctx, symbol, point, rotation, symbols, project, scale, depth, targetPriority) {
  renderObject(ctx, {
    type: "0",
    symbolId: null,
    rotation,
    coords: [{ ...point, flags: 0 }],
    index: -1
  }, symbol, symbols, project, scale, null, depth, targetPriority);
}

function drawLineEndpointSymbols(ctx, line, parts, symbols, project, scale, depth, targetPriority) {
  if (line.startSymbol && symbolMatchesPriority(line.startSymbol, targetPriority)) {
    const first = parts.find(part => pathLength(part) > 0);
    if (first) {
      const sample = samplePathPart(first, 0);
      if (sample) renderPointLikeSymbol(ctx, line.startSymbol, sample.point, sample.angle, symbols, project, scale, depth + 1, targetPriority);
    }
  }
  if (line.endSymbol && symbolMatchesPriority(line.endSymbol, targetPriority)) {
    const last = [...parts].reverse().find(part => pathLength(part) > 0);
    if (last) {
      const sample = samplePathPart(last, pathLength(last));
      if (sample) renderPointLikeSymbol(ctx, line.endSymbol, sample.point, sample.angle, symbols, project, scale, depth + 1, targetPriority);
    }
  }
}

function drawLineDashSymbols(ctx, line, parts, symbols, project, scale, depth, targetPriority) {
  if (!line.dashSymbol || !symbolMatchesPriority(line.dashSymbol, targetPriority)) {
    return;
  }
  for (const part of parts) {
    const total = pathLength(part);
    if (total <= 0) continue;
    for (const { point, distance, angle } of dashPointSamples(part)) {
      if (line.suppressDashSymbolAtEnds && (distance <= 1e-6 || Math.abs(distance - total) <= 1e-6)) {
        continue;
      }
      renderPointLikeSymbol(ctx, line.dashSymbol, point, angle, symbols, project, scale, depth + 1, targetPriority);
    }
  }
}

function dashPointSamples(part) {
  const samples = [];
  let distance = 0;
  for (let i = 1; i < part.length; i += 1) {
    const previous = part[i - 1];
    const point = part[i];
    const segmentLength = pointDistance(previous, point);
    distance += segmentLength;
    if (hasFlag(point, DASH_POINT)) {
      const angle = segmentLength > 0
        ? Math.atan2(point.y - previous.y, point.x - previous.x)
        : (samples[samples.length - 1]?.angle || 0);
      samples.push({ point, distance, angle });
    }
  }
  return samples;
}

function linePartsForDrawing(parts, line, closed, applyShortening) {
  // OMAP/Purple Pen treats minimum_length as symbol metadata/validation, not as a
  // rendering clip.  Filtering by it drops short but intentional end pieces such
  // as cliff tags, wall ticks, stair steps, and other linear feature glyphs.
  return parts
    .map(part => applyShortening ? shortenPathPart(part, line.startOffset || 0, line.endOffset || 0, closed) : part)
    .filter(part => part.length > 1 && pathLength(part) > 0);
}

function drawPathPart(ctx, part, project, closed = false) {
  if (!part?.length) return false;
  const screenPoints = projectPoints(part, project);
  ctx.beginPath();
  ctx.moveTo(screenPoints[0].x, screenPoints[0].y);
  for (let i = 1; i < screenPoints.length; i += 1) {
    ctx.lineTo(screenPoints[i].x, screenPoints[i].y);
  }
  if (closed && samePoint(part[0], part[part.length - 1])) {
    ctx.closePath();
  }
  return true;
}

function shortenPathPart(part, startLength, endLength, closed) {
  if (closed || (!startLength && !endLength)) return part;
  const length = pathLength(part);
  if (length <= 0) return [];
  const start = Math.max(0, Math.min(length, Number(startLength) || 0));
  const stop = Math.max(start, Math.min(length, length - Math.max(0, Number(endLength) || 0)));
  if (stop <= start) return [];
  return slicePathPart(part, start, stop);
}

function drawDashedPathPart(ctx, part, dashInfo, project, closed, scale) {
  if (!part || part.length < 2) return;
  const gapLength = Math.max(0, dashInfo?.gapLength ?? dashInfo?.breakLength ?? 0);
  const secondaryGap = Math.max(0, dashInfo?.secondaryMiddleLength || dashInfo?.secondaryEndLength || 0);
  if (gapLength * scale < 0.35 && secondaryGap * scale < 0.35) {
    drawPathPart(ctx, part, project, closed);
    ctx.stroke();
    return;
  }
  const intervals = dashIntervalsForPart(part, dashInfo, closed);
  if (!intervals.length) return;
  for (const interval of intervals) {
    if (interval.stop - interval.start <= 1e-9) continue;
    const segment = slicePathPart(part, interval.start, interval.stop);
    if (segment.length > 1) {
      drawPathPart(ctx, segment, project, false);
      ctx.stroke();
    }
  }
}

function dashIntervalsForPart(part, dashInfo, closed) {
  const length = pathLength(part);
  if (length <= 0) return [];
  const groups = dashLayoutGroups(part);

  if (usesOpenMapperGroupedDashes(dashInfo)) {
    return mergeIntervals(openMapperGroupedDashIntervals(groups, dashInfo, closed, length), length);
  }

  const hasSecondaryGaps = hasSecondaryDashGaps(dashInfo);
  const intervals = [];
  for (const group of groups) {
    const distances = computeDashDistancesForLength(group.length, dashInfo, {
      closed,
      firstAtDash: hasSecondaryGaps ? false : group.firstAtDash,
      lastAtDash: hasSecondaryGaps ? false : group.lastAtDash
    });
    intervals.push(...dashDistancesToIntervals(distances, group.start, group.length));
  }
  return mergeIntervals(intervals, length);
}

function dashDistancesToIntervals(distances, startOffset, length) {
  const intervals = [];
  let cursor = startOffset;
  const stopOffset = startOffset + length;
  for (let i = 0; i < distances.length; i += 1) {
    const distance = Math.max(0, distances[i] || 0);
    const next = Math.min(stopOffset, cursor + distance);
    if (i % 2 === 0 && next > cursor) {
      intervals.push({ start: cursor, stop: next });
    }
    cursor = next;
  }
  return intervals;
}

function dashLayoutGroups(part) {
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

  const totalLength = pathLength(part);
  const fallback = [{ start: 0, length: totalLength, firstAtDash: false, lastAtDash: false }];
  return markDashLayoutGroupEnds(groups.length ? groups : fallback, totalLength);
}

function markDashLayoutGroupEnds(groups, totalLength) {
  return groups.map((group, index) => ({
    ...group,
    isPartStart: index === 0 && group.start <= 1e-9,
    isPartEnd: index === groups.length - 1 && Math.abs(group.start + group.length - totalLength) <= 1e-9
  }));
}

function usesOpenMapperGroupedDashes(dashInfo = {}) {
  const spacing = dashInfo.spacingMethod || "";
  const dashesInGroup = Math.max(1, Math.floor(dashInfo.dashesInGroup || 1));
  return spacing.startsWith("openmapper") && dashesInGroup >= 2;
}

function hasSecondaryDashGaps(dashInfo = {}) {
  return Math.max(0, dashInfo.secondaryMiddleGaps || 0) > 0
    || Math.max(0, dashInfo.secondaryEndGaps || 0) > 0;
}

function openMapperGroupedDashIntervals(groups, dashInfo, closed, totalLength) {
  const intervals = [];
  for (const group of groups) {
    const localIntervals = openMapperGroupedDashIntervalsForLength(group.length, dashInfo, {
      closed,
      firstAtDash: group.firstAtDash,
      lastAtDash: group.lastAtDash,
      isPartStart: group.isPartStart,
      isPartEnd: group.isPartEnd
    });
    for (const interval of localIntervals) {
      intervals.push({
        start: group.start + interval.start,
        stop: Math.min(totalLength, group.start + interval.stop)
      });
    }
  }
  return intervals;
}

function openMapperGroupedDashIntervalsForLength(length, dashInfo = {}, options = {}) {
  if (length <= 0) return [];

  const dashesInGroup = Math.max(1, Math.floor(dashInfo.dashesInGroup || 1));
  const inGroupBreakLength = Math.max(0, dashInfo.inGroupBreakLength ?? dashInfo.secondaryMiddleLength ?? 0);
  const fallbackSingleDash = dashInfo.dashLength
    ? Math.max(0.000001, (dashInfo.dashLength - Math.max(0, dashesInGroup - 1) * inGroupBreakLength) / dashesInGroup)
    : 0.000001;
  const singleDashLength = Math.max(0.000001, dashInfo.singleDashLength ?? dashInfo.rawDashLength ?? fallbackSingleDash);
  const breakLength = Math.max(0, dashInfo.gapLength ?? dashInfo.breakLength ?? 0);
  const totalInGroupBreakLength = Math.max(0, dashesInGroup - 1) * inGroupBreakLength;
  const totalGroupLength = dashesInGroup * singleDashLength + totalInGroupBreakLength;
  const totalGroupAndBreakLength = totalGroupLength + breakLength;
  if (totalGroupAndBreakLength <= 0) {
    return [{ start: 0, stop: length }];
  }

  const halfFirstGroup = options.isPartStart
    ? Boolean(dashInfo.halfOuterDashes || options.closed)
    : Boolean(options.firstAtDash && dashesInGroup === 1);
  const halfLastGroup = options.isPartEnd
    ? Boolean(dashInfo.halfOuterDashes || options.closed)
    : Boolean(options.lastAtDash && dashesInGroup === 1);
  const numHalfGroups = (halfFirstGroup ? 1 : 0) + (halfLastGroup ? 1 : 0);
  const lengthPlusBreak = length + breakLength;
  const numDashgroupsFloat = numHalfGroups
    + (lengthPlusBreak - numHalfGroups * singleDashLength / 2) / totalGroupAndBreakLength;
  const lowerDashgroupCount = Math.max(0, Math.floor(numDashgroupsFloat));
  const minimumOptimumNumDashes = dashesInGroup * 2 - numHalfGroups / 2;
  const minimumOptimumLength = 2 * totalGroupAndBreakLength;
  const switchDeviation = 0.2 * totalGroupAndBreakLength / dashesInGroup;

  if (lowerDashgroupCount <= 1 && length < minimumOptimumLength - minimumOptimumNumDashes * switchDeviation) {
    return [{ start: 0, stop: length }];
  }

  const higherDashgroupCount = Math.max(1, Math.ceil(numDashgroupsFloat));
  const lowerCount = Math.max(1, lowerDashgroupCount);
  const lowerDashgroupDeviation = (lengthPlusBreak - lowerCount * totalGroupAndBreakLength) / lowerCount;
  const higherDashgroupDeviation = (higherDashgroupCount * totalGroupAndBreakLength - lengthPlusBreak) / higherDashgroupCount;
  const numDashgroups = Math.max(2, lowerDashgroupDeviation > higherDashgroupDeviation ? higherDashgroupCount : lowerCount);

  const numHalfDashes = Math.max(1, 2 * numDashgroups * dashesInGroup - numHalfGroups);
  const adjustedDashLength = Math.max(0, (length
    - (numDashgroups - 1) * breakLength
    - numDashgroups * totalInGroupBreakLength) * 2 / numHalfDashes);
  if (!Number.isFinite(adjustedDashLength) || adjustedDashLength <= 0) {
    return [];
  }

  const intervals = [];
  let cursor = 0;
  for (let dashGroup = 1; dashGroup <= numDashgroups; dashGroup += 1) {
    for (let dash = 1; dash <= dashesInGroup; dash += 1) {
      const isFirstDash = dashGroup === 1 && dash === 1;
      const isLastDash = dashGroup === numDashgroups && dash === dashesInGroup;
      const hasStart = !(isFirstDash && halfFirstGroup);
      const hasEnd = !(isLastDash && halfLastGroup);
      const dashLength = hasStart !== hasEnd ? adjustedDashLength / 2 : adjustedDashLength;
      const dashStart = cursor;
      const dashStop = Math.min(length, cursor + dashLength);
      if (dashStop > dashStart) {
        intervals.push({ start: dashStart, stop: dashStop });
      }
      cursor += dashLength;
      if (dash < dashesInGroup) {
        cursor += inGroupBreakLength;
      }
    }
    if (dashGroup < numDashgroups) {
      cursor += breakLength;
    }
  }
  return intervals;
}

function computeDashDistancesForLength(pathLengthValue, dashInfo = {}, options = {}) {
  const nominalDash = Math.max(0.000001, dashInfo.dashLength ?? dashInfo.rawDashLength ?? 0.000001);
  const gapLength = Math.max(0, dashInfo.gapLength ?? dashInfo.breakLength ?? 0);
  let firstDashLength = Math.max(0, options.firstAtDash ? nominalDash / 2 : (dashInfo.firstDashLength ?? nominalDash));
  let lastDashLength = Math.max(0, options.lastAtDash ? nominalDash / 2 : (dashInfo.lastDashLength ?? nominalDash));
  const minGaps = Math.max(0, Math.floor(dashInfo.minGaps || 0));

  if (options.closed && dashInfo.halfEndDashLengthWhenClosed) {
    firstDashLength /= 2;
    lastDashLength /= 2;
  }

  let numGaps = 0;
  if (nominalDash + gapLength > 0) {
    const numShortDash = (firstDashLength < 0.6 * nominalDash ? 1 : 0) + (lastDashLength < 0.6 * nominalDash ? 1 : 0);
    const numberGaps = (pathLengthValue + nominalDash - firstDashLength - lastDashLength + gapLength * numShortDash) / (nominalDash + gapLength);
    const floorNumberGaps = Math.max(0, Math.floor(numberGaps));
    const ceilNumberGaps = Math.max(0, Math.ceil(numberGaps));
    const floorDenominator = Math.max(1, floorNumberGaps + 1);
    const ceilDenominator = Math.max(1, ceilNumberGaps + 1);
    const floorDeviation = (pathLengthValue + gapLength - (floorNumberGaps + 1) * (nominalDash + gapLength)) / floorDenominator;
    const ceilDeviation = -(pathLengthValue + gapLength - (ceilNumberGaps + 1) * (nominalDash + gapLength)) / ceilDenominator;
    numGaps = floorDeviation > ceilDeviation ? ceilNumberGaps : floorNumberGaps;

    const secondaryMiddleGaps = Math.max(0, dashInfo.secondaryMiddleGaps || 0);
    const minimumOptimumLength = 2 * (nominalDash + gapLength);
    const minimumOptimumNumDashes = (secondaryMiddleGaps + 1) * 2 - numShortDash * 0.5;
    const switchDeviation = 0.2 * (nominalDash + gapLength) / Math.max(1, secondaryMiddleGaps + 1);
    if (floorNumberGaps === 0 && pathLengthValue < minimumOptimumLength - minimumOptimumNumDashes * switchDeviation) {
      numGaps = 0;
    }
  }
  numGaps = Math.max(numGaps, minGaps);

  let actualDashLength;
  let actualFirstDashLength;
  let actualLastDashLength;
  if (numGaps === 0) {
    actualDashLength = actualFirstDashLength = actualLastDashLength = pathLengthValue;
  }
  else if (numGaps === 1 && firstDashLength === 0 && lastDashLength === 0) {
    actualDashLength = actualFirstDashLength = actualLastDashLength = 0;
  }
  else {
    const denominator = numGaps - 1 + firstDashLength / nominalDash + lastDashLength / nominalDash;
    actualDashLength = denominator > 0 ? (pathLengthValue - gapLength * numGaps) / denominator : 0;
    actualFirstDashLength = actualDashLength * firstDashLength / nominalDash;
    actualLastDashLength = actualDashLength * lastDashLength / nominalDash;
  }

  if (actualDashLength <= 0) {
    return [0, pathLengthValue, 0];
  }

  const distances = [];
  if (numGaps > 0) {
    distances.push(...dashLengthWithSecondaryGaps(actualFirstDashLength, dashInfo.secondaryEndGaps, dashInfo.secondaryEndLength, firstDashLength));
    for (let i = 1; i < numGaps; i += 1) {
      distances.push(gapLength);
      distances.push(...dashLengthWithSecondaryGaps(actualDashLength, dashInfo.secondaryMiddleGaps, dashInfo.secondaryMiddleLength, nominalDash));
    }
    distances.push(gapLength);
  }
  distances.push(...dashLengthWithSecondaryGaps(actualLastDashLength, dashInfo.secondaryEndGaps, dashInfo.secondaryEndLength, lastDashLength));
  return removeZeroGaps(distances);
}

function dashLengthWithSecondaryGaps(length, countGaps = 0, gapLength = 0, nominalLength = length) {
  const count = Math.max(0, Math.floor(countGaps || 0));
  const gap = Math.max(0, gapLength || 0);
  if (count > 0 && length >= Math.max(0, nominalLength) / 2 && length > count * gap) {
    const dash = (length - count * gap) / (count + 1);
    const distances = [dash];
    for (let i = 0; i < count; i += 1) {
      distances.push(gap, dash);
    }
    return distances;
  }
  return [length];
}

function removeZeroGaps(distances) {
  const list = [...distances];
  for (let i = list.length - 2; i >= 1; i -= 2) {
    if (Math.abs(list[i]) < 1e-9) {
      list[i - 1] = (list[i - 1] || 0) + (list[i + 1] || 0);
      list.splice(i, 2);
    }
  }
  return list;
}

function mergeIntervals(intervals, length) {
  return intervals
    .map(interval => ({ start: Math.max(0, Math.min(length, interval.start)), stop: Math.max(0, Math.min(length, interval.stop)) }))
    .filter(interval => interval.stop > interval.start)
    .sort((a, b) => a.start - b.start)
    .reduce((merged, interval) => {
      const previous = merged[merged.length - 1];
      if (previous && interval.start <= previous.stop + 1e-9) {
        previous.stop = Math.max(previous.stop, interval.stop);
      }
      else {
        merged.push({ ...interval });
      }
      return merged;
    }, []);
}

function slicePathPart(part, startDistance, stopDistance) {
  const total = pathLength(part);
  const start = Math.max(0, Math.min(total, startDistance));
  const stop = Math.max(start, Math.min(total, stopDistance));
  if (stop <= start || part.length < 2) return [];

  const result = [];
  let offset = 0;
  for (let i = 1; i < part.length; i += 1) {
    const from = part[i - 1];
    const to = part[i];
    const segmentLength = pointDistance(from, to);
    if (segmentLength <= 0) continue;
    const nextOffset = offset + segmentLength;
    if (nextOffset < start - 1e-9) {
      offset = nextOffset;
      continue;
    }
    if (offset > stop + 1e-9) break;

    const localStart = Math.max(0, (start - offset) / segmentLength);
    const localStop = Math.min(1, (stop - offset) / segmentLength);
    if (localStop >= 0 && localStart <= 1 && localStop >= localStart) {
      const startPoint = interpolatePoint(from, to, localStart);
      const stopPoint = interpolatePoint(from, to, localStop);
      if (!result.length || !samePoint(result[result.length - 1], startPoint)) {
        result.push(startPoint);
      }
      if (!samePoint(result[result.length - 1], stopPoint)) {
        result.push(stopPoint);
      }
    }
    offset = nextOffset;
  }
  return result;
}

function interpolatePoint(from, to, ratio) {
  const r = Math.max(0, Math.min(1, ratio));
  return {
    x: from.x + (to.x - from.x) * r,
    y: from.y + (to.y - from.y) * r,
    flags: 0
  };
}

function dashedMidSymbolPositions(line, part, closed) {
  const length = pathLength(part);
  if (length <= 0) return [];
  const distances = computeDashDistancesForLength(length, line.dashInfo || line, { closed });
  const positions = [];
  let cursor = 0;
  if (String(line.midSymbolPlacement) === "2") {
    cursor = distances[0] || 0;
    for (let i = 1; i < distances.length; i += 2) {
      positions.push(cursor + distances[i] / 2);
      cursor += distances[i] + (distances[i + 1] || 0);
    }
  }
  else {
    for (let i = 0; i < distances.length; i += 2) {
      const dash = distances[i] || 0;
      if (dash > 0) positions.push(cursor + dash / 2);
      cursor += dash + (distances[i + 1] || 0);
    }
  }
  return uniquePositions(positions, length);
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
  const midSymbolNumGaps = count - 1;
  const midSymbolsLength = midSymbolNumGaps * distance;
  const positions = [];

  if (firstAtDash || lastAtDash) {
    return dashedEndpointMidSymbolPositions(line, length, firstAtDash, lastAtDash);
  }

  if (endLength > 0) {
    if (length <= midSymbolsLength) {
      if (line.showAtLeastOneSymbol) {
        addMidSymbolGroupPositions(positions, { center: 0, count, distance, length });
        addMidSymbolGroupPositions(positions, { center: length, count, distance, length });
      }
      return uniquePositions(positions, length);
    }

    const segmentedLength = Math.max(0, length - 2 * endLength) - midSymbolsLength;
    const rawSegmentCount = Math.max(0, segmentedLength / (segmentLength + midSymbolsLength));
    const lowerSegmentCount = Math.floor(rawSegmentCount);
    const higherSegmentCount = Math.ceil(rawSegmentCount);
    const lowerAbsDeviation = Math.abs(length - lowerSegmentCount * segmentLength - (lowerSegmentCount + 1) * midSymbolsLength - 2 * endLength);
    const higherAbsDeviation = Math.abs(length - higherSegmentCount * segmentLength - (higherSegmentCount + 1) * midSymbolsLength - 2 * endLength);
    const segmentCount = lowerAbsDeviation >= higherAbsDeviation ? higherSegmentCount : lowerSegmentCount;
    const deviation = lowerAbsDeviation >= higherAbsDeviation ? -higherAbsDeviation : lowerAbsDeviation;
    const idealLength = segmentCount * segmentLength + 2 * endLength;
    if (idealLength <= 0) {
      return line.showAtLeastOneSymbol ? [length / 2] : [];
    }

    const adjustedEndLength = endLength + deviation * (endLength / idealLength);
    let adjustedSegmentLength = segmentLength + deviation * (segmentLength / idealLength);
    const shouldDraw = adjustedSegmentLength >= 0
      && (line.showAtLeastOneSymbol || higherSegmentCount > 0 || length > 2 * endLength - (segmentLength + midSymbolsLength) / 2);
    if (!shouldDraw) {
      return [];
    }

    adjustedSegmentLength += midSymbolsLength;
    for (let i = 0; i < segmentCount + 1; i += 1) {
      let position = adjustedEndLength + i * adjustedSegmentLength - distance;
      for (let s = 0; s < count; s += 1) {
        position += distance;
        if (position >= 0 && position <= length) {
          positions.push(position);
        }
      }
    }
    return uniquePositions(positions, length);
  }

  if (length > midSymbolsLength) {
    const segmentedLength = Math.max(0, length - midSymbolsLength);
    const rawSegmentCount = Math.max(1, segmentedLength / (segmentLength + midSymbolsLength));
    const lowerSegmentCount = Math.max(1, Math.floor(rawSegmentCount));
    const higherSegmentCount = Math.max(1, Math.ceil(rawSegmentCount));
    const lowerSegmentDeviation = Math.abs(length - lowerSegmentCount * segmentLength - (lowerSegmentCount + 1) * midSymbolsLength) / lowerSegmentCount;
    const higherSegmentDeviation = Math.abs(length - higherSegmentCount * segmentLength - (higherSegmentCount + 1) * midSymbolsLength) / higherSegmentCount;
    const segmentCount = lowerSegmentDeviation > higherSegmentDeviation ? higherSegmentCount : lowerSegmentCount;
    const adaptedSegmentLength = (length - (segmentCount + 1) * midSymbolsLength) / segmentCount + midSymbolsLength;

    if (adaptedSegmentLength >= midSymbolsLength) {
      for (let i = 0; i <= segmentCount; i += 1) {
        let position = i * adaptedSegmentLength - distance;
        for (let s = 0; s < count; s += 1) {
          position += distance;
          // The outermost symbols are handled outside this loop, matching OOM.
          if (i === 0 && s === 0) continue;
          if (i === segmentCount && s === midSymbolNumGaps) break;
          if (position >= 0 && position <= length) {
            positions.push(position);
          }
        }
      }
    }
  }

  positions.push(length);
  return uniquePositions(positions, length);
}

function dashedEndpointMidSymbolPositions(line, length, firstAtDash, lastAtDash) {
  const segmentLength = Math.max(0.01, line.segmentLength || 0.01);
  const count = Math.max(1, Math.floor(line.midSymbolsPerSpot || 1));
  const distance = Math.max(0, line.midSymbolDistance || 0);
  const symbolsLength = (count - 1) * distance;
  const firstLength = firstAtDash ? (segmentLength + symbolsLength) / 2 : Math.max(0, line.endLength || 0) + symbolsLength / 2;
  const lastLength = lastAtDash ? (segmentLength + symbolsLength) / 2 : Math.max(0, line.endLength || 0) + symbolsLength / 2;
  const combinedEndLength = firstLength + lastLength;
  const dashLength = segmentLength + symbolsLength;
  const averageEndLength = combinedEndLength / 2;
  const segmentedLength = Math.max(0, length - combinedEndLength);
  const rawCount = Math.max(averageEndLength === 0 ? 1 : 0, segmentedLength / dashLength);
  const lowerCount = Math.floor(rawCount);
  const higherCount = Math.ceil(rawCount);
  let spotCount = 0;

  if (averageEndLength > 0) {
    const lowerAbs = Math.abs(length - lowerCount * dashLength - combinedEndLength);
    const higherAbs = Math.abs(length - higherCount * dashLength - combinedEndLength);
    const segmentCount = lowerAbs >= higherAbs ? higherCount : lowerCount;
    spotCount = (higherCount > 0 || length > combinedEndLength - 0.5 * dashLength) ? segmentCount + 1 : 0;
  }
  else {
    const lowerSafe = Math.max(1, lowerCount);
    const higherSafe = Math.max(1, higherCount);
    const lowerDeviation = Math.abs(length - lowerSafe * dashLength) / lowerSafe;
    const higherDeviation = Math.abs(length - higherSafe * dashLength) / higherSafe;
    const segmentCount = lowerDeviation > higherDeviation ? higherSafe : lowerSafe;
    spotCount = segmentCount + 1;
  }

  if (line.showAtLeastOneSymbol && spotCount < 1) {
    spotCount = 1;
  }
  if (spotCount <= 0) return [];

  const denominator = spotCount - 1 + firstLength / dashLength + lastLength / dashLength;
  const actualDashLength = denominator > 0 ? length / denominator : 0;
  const positions = [];
  if (actualDashLength <= 0) {
    for (const center of spotCount > 1 ? [0, length] : [length / 2]) {
      addMidSymbolGroupPositions(positions, { center, count, distance, length });
    }
    return uniquePositions(positions, length);
  }

  let center = actualDashLength * firstLength / dashLength;
  for (let i = 0; i < spotCount; i += 1) {
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
  for (const nested of [symbol.line?.midSymbol, symbol.line?.startSymbol, symbol.line?.endSymbol, symbol.line?.dashSymbol]) {
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
