import {
  PAPER_SIZES,
  PAPER_MARGINS,
  PDF_COURSE_SCOPES,
  PDF_OUTPUT_MODES,
  PDF_EXPORT_SETTINGS_KEY,
  PDF_EXPORT_STEPS_PER_TARGET,
  PDF_EXPORT_DONE_HOLD_MS,
  MAP_SCALES,
  APP_VERSION,
  APP_RESOURCE_CACHE_PREFIX,
  APP_RESOURCE_CACHE_NAME,
  APP_RESOURCE_URLS,
  LANGUAGE_REFRESH_PARAM,
  UI_MODE_KEY,
  UI_MODES,
  COURSE_NAMES,
  TEXT_PRESETS,
  COURSE_LABEL_KINDS,
  MOVE_DISTANCE_CHOICES,
  DEFAULT_TEXT_FONT_HEIGHT,
  CONTROL_SNAP_SCREEN_RADIUS,
  FONT_CHOICES,
  SPECIAL_COLOR_CHOICES,
  LEGACY_COLOR_ALIASES
} from "./app-shell-config.js";
import { saveCachedPdfBasemap } from "../state/cookie-cache.js";
import { findById } from "../domain/event-model.js";
import {
  descriptionLanguageForEvent,
  getIscdSymbolOptions,
  resizedDescriptionSpecial,
  scoreCourseDescriptionRows
} from "../domain/control-descriptions.js";
import { PRINT_AREA_SCOPES, effectivePrintArea, normalizePrintArea } from "../domain/print-area.js";
import {
  controlKindLabel,
  controlsUsedByCourse,
  courseView,
  findLeg,
  getControl,
  getCourse,
  getCourseControl,
  isTeamFreeCourseControl
} from "../domain/course-service.js";
import { relayEntryLabel, relayVariationForLeg, variationForCode } from "../domain/relay-variations.js";
import { t } from "./i18n.js";
import { escapeAttr, escapeHtml } from "./app-shell-ui-helpers.js";

export const TOPOLOGY_WIDTH_UNIT = 104;

export const TOPOLOGY_HEIGHT_UNIT = 60;

export const TOPOLOGY_PADDING_X = 56;

export const TOPOLOGY_PADDING_Y = 28;

export function layoutVariationTopology(topology, branchCodes) {
  const abstractPositions = Array(topology.length).fill(null);
  const maxSteps = Math.max(1000, topology.length * 50);
  let steps = 0;

  function assign(startIndex, endIndex, startX, startY) {
    let index = Number(startIndex);
    let x = startX;
    let y = startY;
    let totalWidth = 1;
    let totalHeight = 0;
    while (Number.isInteger(index) && index >= 0 && index < topology.length && index !== endIndex && steps++ < maxSteps) {
      const view = topology[index];
      const legTo = view.legTo || [];
      const numForks = legTo.length;
      abstractPositions[index] = { x, y, forkStart: null };
      totalWidth = Math.max(totalWidth, 1);
      totalHeight += 1;
      y += 1;

      if (numForks > 1) {
        const loop = view.joinIndex === index;
        const startFork = loop ? 1 : 0;
        const forkSize = Array(numForks).fill(null);
        const forkStart = Array(numForks).fill(null);
        let totalForkWidth = loop ? 1 : 0;
        let maxForkHeight = 1;

        for (let branchIndex = startFork; branchIndex < numForks; branchIndex += 1) {
          forkSize[branchIndex] = assign(legTo[branchIndex], view.joinIndex, 0, 0);
          totalForkWidth += forkSize[branchIndex].width;
          maxForkHeight = Math.max(maxForkHeight, forkSize[branchIndex].height);
        }

        if (loop) {
          const forkY = y;
          forkStart[0] = { x, y: forkY, code: "", loopFallThru: true };
          const halfForks = Math.ceil(numForks / 2);
          let leftX = x - 0.5;
          for (let branchIndex = startFork; branchIndex < halfForks; branchIndex += 1) {
            leftX -= forkSize[branchIndex].width;
          }
          let forkX = leftX;
          for (let branchIndex = startFork; branchIndex < halfForks; branchIndex += 1) {
            forkX += forkSize[branchIndex].width / 2;
            forkStart[branchIndex] = { x: forkX, y: forkY, code: branchCodes.get(Number(topologyBranchCourseControlId(view, branchIndex))) || "", loopStart: true };
            forkX += forkSize[branchIndex].width / 2;
          }
          forkX = x + 0.5;
          for (let branchIndex = halfForks; branchIndex < numForks; branchIndex += 1) {
            forkX += forkSize[branchIndex].width / 2;
            forkStart[branchIndex] = { x: forkX, y: forkY, code: branchCodes.get(Number(topologyBranchCourseControlId(view, branchIndex))) || "", loopStart: true };
            forkX += forkSize[branchIndex].width / 2;
          }
          totalForkWidth = Math.max(totalForkWidth, Math.abs(forkX - x) * 2, Math.abs(x - leftX) * 2);
          abstractPositions[index].loopBottom = y + maxForkHeight + 1.5;
        }
        else {
          const forkY = y - 0.5;
          let forkX = x - totalForkWidth / 2;
          for (let branchIndex = startFork; branchIndex < numForks; branchIndex += 1) {
            forkX += forkSize[branchIndex].width / 2;
            forkStart[branchIndex] = { x: forkX, y: forkY, code: branchCodes.get(Number(topologyBranchCourseControlId(view, branchIndex))) || "" };
            forkX += forkSize[branchIndex].width / 2;
          }
        }

        abstractPositions[index].forkStart = forkStart;
        for (let branchIndex = startFork; branchIndex < numForks; branchIndex += 1) {
          const branchStartY = loop ? forkStart[branchIndex].y + 1 : forkStart[branchIndex].y + 1;
          assign(legTo[branchIndex], view.joinIndex, forkStart[branchIndex].x, branchStartY);
        }
        const forkBlockHeight = loop ? maxForkHeight + 2 : maxForkHeight + 2;
        totalHeight += forkBlockHeight;
        y += forkBlockHeight;
        totalWidth = Math.max(totalWidth, totalForkWidth);
        index = view.joinIndex === index ? legTo[0] : view.joinIndex;
      }
      else {
        index = numForks === 1 ? legTo[0] : -1;
      }
    }
    return { width: Math.max(1, totalWidth), height: Math.max(1, totalHeight) };
  }

  assign(0, topology.length, 0, 0);

  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  function include(point) {
    if (!point) return;
    minX = Math.min(minX, point.x);
    maxX = Math.max(maxX, point.x);
    minY = Math.min(minY, point.y);
    maxY = Math.max(maxY, point.y);
  }
  for (const position of abstractPositions) {
    include(position);
    if (Number.isFinite(position?.loopBottom)) include({ x: position.x, y: position.loopBottom });
    for (const fork of position?.forkStart || []) include(fork);
  }
  if (!Number.isFinite(minX)) {
    minX = maxX = minY = maxY = 0;
  }

  const positions = abstractPositions.map(position => position && ({
    x: TOPOLOGY_PADDING_X + (position.x - minX) * TOPOLOGY_WIDTH_UNIT,
    y: TOPOLOGY_PADDING_Y + (position.y - minY) * TOPOLOGY_HEIGHT_UNIT,
    loopBottom: Number.isFinite(position.loopBottom) ? TOPOLOGY_PADDING_Y + (position.loopBottom - minY) * TOPOLOGY_HEIGHT_UNIT : null,
    forkStart: position.forkStart?.map(fork => fork && ({
      x: TOPOLOGY_PADDING_X + (fork.x - minX) * TOPOLOGY_WIDTH_UNIT,
      y: TOPOLOGY_PADDING_Y + (fork.y - minY) * TOPOLOGY_HEIGHT_UNIT,
      code: fork.code || "",
      loopStart: !!fork.loopStart,
      loopFallThru: !!fork.loopFallThru
    })) || null
  }));

  return {
    positions,
    width: (maxX - minX) * TOPOLOGY_WIDTH_UNIT + TOPOLOGY_PADDING_X * 2,
    height: (maxY - minY) * TOPOLOGY_HEIGHT_UNIT + TOPOLOGY_PADDING_Y * 2
  };
}

export function topologyLegPath(from, to, forkStart, startRadius, endRadius, skipForkStem = false) {
  const startY = from.y + startRadius;
  const endY = to.y - endRadius;
  if (forkStart) {
    if (forkStart.loopFallThru) {
      return `M ${formatSvgNumber(from.x)} ${formatSvgNumber(startY)} V ${formatSvgNumber(endY)}`;
    }
    const start = skipForkStem
      ? `M ${formatSvgNumber(from.x)} ${formatSvgNumber(forkStart.y)}`
      : `M ${formatSvgNumber(from.x)} ${formatSvgNumber(startY)} V ${formatSvgNumber(forkStart.y)}`;
    return [
      start,
      `H ${formatSvgNumber(forkStart.x)}`,
      `V ${formatSvgNumber(endY)}`
    ].join(" ");
  }
  if (Math.abs(from.x - to.x) < 0.1) {
    return `M ${formatSvgNumber(from.x)} ${formatSvgNumber(startY)} V ${formatSvgNumber(endY)}`;
  }
  const midY = (startY + endY) / 2;
  return [
    `M ${formatSvgNumber(from.x)} ${formatSvgNumber(startY)}`,
    `V ${formatSvgNumber(midY)}`,
    `H ${formatSvgNumber(to.x)}`,
    `V ${formatSvgNumber(endY)}`
  ].join(" ");
}

export function topologyBranchJoinPoint(from, join, startRadius, endRadius) {
  const startY = from.y + startRadius;
  const endY = join.y - endRadius;
  return {
    x: join.x,
    y: Math.abs(from.x - join.x) < 0.1 ? endY : (startY + endY) / 2
  };
}

export function topologyBranchToJoinPath(from, joinPoint, startRadius) {
  const startY = from.y + startRadius;
  if (Math.abs(from.x - joinPoint.x) < 0.1) {
    return `M ${formatSvgNumber(from.x)} ${formatSvgNumber(startY)} V ${formatSvgNumber(joinPoint.y)}`;
  }
  return [
    `M ${formatSvgNumber(from.x)} ${formatSvgNumber(startY)}`,
    `V ${formatSvgNumber(joinPoint.y)}`,
    `H ${formatSvgNumber(joinPoint.x)}`
  ].join(" ");
}

export function topologyLoopReturnPath(from, owner, loopBottom, startRadius, ownerRadius) {
  if (!from || !owner) return "";
  const startY = from.y + startRadius;
  const xDir = from.x < owner.x ? -1 : 1;
  const returnX = Math.abs(from.x - owner.x) < 0.1
    ? owner.x
    : owner.x + xDir * Math.max(10, ownerRadius * 0.75);
  const endY = owner.y + ownerRadius;
  const bottomY = Math.max(loopBottom || 0, startY + TOPOLOGY_HEIGHT_UNIT * 0.35, endY + TOPOLOGY_HEIGHT_UNIT * 0.8);
  return [
    `M ${formatSvgNumber(from.x)} ${formatSvgNumber(startY)}`,
    `V ${formatSvgNumber(bottomY)}`,
    `H ${formatSvgNumber(returnX)}`,
    `V ${formatSvgNumber(endY)}`
  ].join(" ");
}

export function topologyEmptyLoopBranchPath(owner, forkStart, loopBottom, ownerRadius) {
  if (!owner || !forkStart) return "";
  const xDir = forkStart.x < owner.x ? -1 : 1;
  const returnX = owner.x + xDir * Math.max(10, ownerRadius * 0.75);
  const endY = owner.y + ownerRadius;
  const bottomY = Math.max(loopBottom || 0, forkStart.y + TOPOLOGY_HEIGHT_UNIT * 0.6, endY + TOPOLOGY_HEIGHT_UNIT * 0.8);
  return [
    `M ${formatSvgNumber(owner.x)} ${formatSvgNumber(forkStart.y)}`,
    `H ${formatSvgNumber(forkStart.x)}`,
    `V ${formatSvgNumber(bottomY)}`,
    `H ${formatSvgNumber(returnX)}`,
    `V ${formatSvgNumber(endY)}`
  ].join(" ");
}

export function topologyEmptyBranchJoinPoint(forkStart, join, endRadius) {
  const joinTopY = join.y - endRadius;
  const desiredGap = TOPOLOGY_HEIGHT_UNIT * 0.45;
  return {
    x: join.x,
    y: Math.min(joinTopY, Math.max(forkStart.y + desiredGap, joinTopY - desiredGap))
  };
}

export function topologyEmptyBranchPath(from, forkStart, joinPoint) {
  return [
    `M ${formatSvgNumber(from.x)} ${formatSvgNumber(forkStart.y)}`,
    `H ${formatSvgNumber(forkStart.x)}`,
    `V ${formatSvgNumber(joinPoint.y)}`,
    `H ${formatSvgNumber(joinPoint.x)}`
  ].join(" ");
}

export function topologyPathSvg(path, options = {}) {
  const selectedClass = options.selected ? " selected" : "";
  return [
    topologyHitPathSvg(path, options),
    `<path class="variation-topology-leg${selectedClass}" d="${path}"${topologyPathAttrs(options)}></path>`
  ].join("");
}

export function topologyHitPathSvg(path, options = {}) {
  return `<path class="variation-topology-leg-hit" d="${path}"${topologyPathAttrs(options)}></path>`;
}

export function topologyPathAttrs(options = {}) {
  const insertAfter = Number(options.insertAfterCourseControl) || null;
  const insertBefore = Number(options.insertBeforeCourseControl) || null;
  const insertAttrs = insertAfter ? ` data-select-variation-insertion data-insert-after-course-control="${insertAfter}"` : "";
  const insertBeforeAttrs = insertBefore ? ` data-select-variation-insertion data-insert-before-course-control="${insertBefore}"` : "";
  const segmentAttr = options.segmentKey ? ` data-variation-segment="${escapeAttr(options.segmentKey)}"` : "";
  const branchAttrs = options.branchAttrs || "";
  return `${insertAttrs}${insertBeforeAttrs}${segmentAttr}${branchAttrs}`;
}

export function topologyNodeCourseControlId(view) {
  return Number(view?.ownerCourseControlId) || Number(view?.courseControlIds?.[0]) || null;
}

export function topologyBranchCourseControlId(view, branchIndex) {
  if (Array.isArray(view?.branchCourseControlIds) && branchIndex in view.branchCourseControlIds) {
    return Number(view.branchCourseControlIds[branchIndex]) || null;
  }
  return Number(view?.courseControlIds?.[branchIndex]) || null;
}

export function topologyBranchIsEmpty(view, branchIndex) {
  const branch = view?.branchCourseControls?.[branchIndex];
  return !!branch
    && Number(branch.control) === Number(view?.control?.id)
    && Number(branch.nextCourseControl) === Number(view?.joinCourseControlId);
}

export function topologyBranchEdgeMap(topology) {
  const branchEdges = new Map();
  for (let forkIndex = 0; forkIndex < topology.length; forkIndex += 1) {
    const fork = topology[forkIndex];
    if (!fork || (fork.legTo || []).length <= 1 || !(fork.branchCourseControlIds || fork.courseControlIds || []).length) continue;
    for (let legIndex = 0; legIndex < fork.legTo.length; legIndex += 1) {
      const targetIndex = fork.legTo[legIndex];
      if (!Number.isInteger(targetIndex)) continue;
      const branchCourseControl = topologyBranchCourseControlId(fork, legIndex);
      if (!branchCourseControl) continue;
      const branch = {
        forkIndex,
        forkCourseControl: topologyNodeCourseControlId(fork),
        branchCourseControl,
        joinIndex: fork.joinIndex
      };
      markTopologyBranchEdges(topology, branchEdges, forkIndex, targetIndex, fork.joinIndex, branch, new Set());
    }
  }
  return branchEdges;
}

export function topologyPreviousCourseControlMap(topology) {
  const previous = new Map();
  for (let fromIndex = 0; fromIndex < topology.length; fromIndex += 1) {
    const from = topology[fromIndex];
    const fromCourseControl = topologyNodeCourseControlId(from);
    if (!fromCourseControl) continue;
    for (const toIndex of from.legTo || []) {
      if (Number.isInteger(toIndex) && !previous.has(toIndex)) {
        previous.set(toIndex, fromCourseControl);
      }
    }
  }
  return previous;
}

export function markTopologyBranchEdges(topology, branchEdges, fromIndex, toIndex, joinIndex, branch, seen) {
  if (!Number.isInteger(fromIndex) || !Number.isInteger(toIndex)) return;
  branchEdges.set(topologyEdgeKey(fromIndex, toIndex), branch);
  if (toIndex === joinIndex || seen.has(toIndex)) return;
  seen.add(toIndex);
  const view = topology[toIndex];
  for (const nextIndex of view?.legTo || []) {
    if (Number.isInteger(nextIndex)) {
      markTopologyBranchEdges(topology, branchEdges, toIndex, nextIndex, joinIndex, branch, seen);
    }
  }
}

export function topologyEdgeKey(fromIndex, toIndex) {
  return `${fromIndex}:${toIndex}`;
}

export function topologyCommonJoinPointMap(topology, positions, nodeRadius) {
  const map = new Map();
  for (let index = 0; index < topology.length; index += 1) {
    const view = topology[index];
    if (!view || view.variation === "loop" || (view.legTo || []).length <= 1) continue;
    const point = topologyCommonJoinPoint(view, topology, positions, nodeRadius, positions[index]);
    if (point) map.set(index, point);
  }
  return map;
}

export function topologyCommonJoinPoint(view, topology, positions, nodeRadius, ownerPosition = null) {
  if (!Number.isInteger(view.joinIndex) || view.joinIndex < 0 || view.joinIndex >= positions.length) {
    return null;
  }
  const joinPosition = positions[view.joinIndex];
  if (!joinPosition) return null;
  const joinTopY = joinPosition.y - topologyConnectionRadius(topology[view.joinIndex]?.control, nodeRadius);
  const sideMergeYs = [];
  const centerTailBottomYs = [];
  const emptyMergeYs = [];

  for (let legIndex = 0; legIndex < (view.legTo || []).length; legIndex += 1) {
    const startIndex = view.legTo[legIndex];
    if (!Number.isInteger(startIndex)) continue;
    const forkStart = ownerPosition?.forkStart?.[legIndex] || null;
    const startsAtJoin = Number(startIndex) === Number(view.joinIndex);

    if (startsAtJoin && forkStart && topologyBranchIsEmpty(view, legIndex)) {
      emptyMergeYs.push(topologyEmptyBranchJoinPoint(forkStart, joinPosition, topologyConnectionRadius(topology[view.joinIndex]?.control, nodeRadius)).y);
      continue;
    }

    const tailIndices = topologyBranchTailIndices(topology, startIndex, view.joinIndex);
    for (const tailIndex of tailIndices) {
      if (!Number.isInteger(tailIndex) || tailIndex === view.joinIndex) continue;
      const tailPosition = positions[tailIndex];
      if (!tailPosition) continue;
      const tailStartY = tailPosition.y + topologyConnectionRadius(topology[tailIndex]?.control, nodeRadius);
      if (Math.abs(tailPosition.x - joinPosition.x) < 0.1) {
        // A centered branch is visually on the same x as the common post-merge
        // stem.  It must stop at the shared merge bus, not force that bus down
        // to the join checkpoint; otherwise the shared stem disappears.
        centerTailBottomYs.push(tailStartY);
      }
      else {
        sideMergeYs.push((tailStartY + joinTopY) / 2);
      }
    }
  }

  const mergeYs = sideMergeYs.length
    ? sideMergeYs.concat(centerTailBottomYs)
    : (centerTailBottomYs.length ? centerTailBottomYs : emptyMergeYs);
  if (!mergeYs.length) return null;
  // Use one shared merge bus for every branch before the join checkpoint.
  // Side branches determine the visible horizontal merge bus. Center branches
  // only require the bus to be below their checkpoint label; they must not
  // collapse the bus onto the join checkpoint, because that hides the public
  // post-branch edge and merges two different insertion targets.
  const y = Math.min(joinTopY, Math.max(...mergeYs));
  return { x: joinPosition.x, y };
}

export function topologyBranchTailIndices(topology, startIndex, joinIndex) {
  const tails = [];
  const seen = new Set();

  function visit(index) {
    if (!Number.isInteger(index) || index < 0 || index >= topology.length) return;
    if (index === joinIndex || seen.has(index)) return;
    seen.add(index);
    const nextIndices = (topology[index]?.legTo || []).filter(Number.isInteger);
    if (!nextIndices.length || nextIndices.includes(joinIndex)) {
      tails.push(index);
    }
    for (const nextIndex of nextIndices) {
      if (nextIndex !== joinIndex) visit(nextIndex);
    }
  }

  visit(startIndex);
  return tails;
}

export function topologyConnectionRadius(control, symbolRadius) {
  if (!control) return 0;
  if (control.kind === "start" || control.kind === "finish") return symbolRadius;
  // The ordering diagram is an editable graph. A checkpoint separates the
  // incoming edge from the outgoing edge, so the line and its hit area must stop
  // above the label and resume below it instead of running through the number.
  // Otherwise clicking near the checkpoint can select the wrong insertion edge.
  return symbolRadius + 2;
}

export function topologyNodeSvg(control, position, courseControlId, selected, options = {}) {
  const attrs = options.attrs || `data-select-variation-course-control="${courseControlId}"`;
  const selectedClass = selected ? " selected" : "";
  const hitCircle = `<circle class="variation-topology-node-hit" cx="${formatSvgNumber(position.x)}" cy="${formatSvgNumber(position.y)}" r="14" ${attrs}></circle>`;
  if (control.kind === "start") {
    const points = `${formatSvgNumber(position.x)},${formatSvgNumber(position.y - 18)} ${formatSvgNumber(position.x - 14)},${formatSvgNumber(position.y + 10)} ${formatSvgNumber(position.x + 14)},${formatSvgNumber(position.y + 10)}`;
    return `<g class="variation-topology-node${selectedClass}" ${attrs}>${hitCircle}<polygon points="${points}" ${attrs}></polygon></g>`;
  }
  if (control.kind === "finish") {
    return `<g class="variation-topology-node${selectedClass}" ${attrs}>${hitCircle}<circle cx="${formatSvgNumber(position.x)}" cy="${formatSvgNumber(position.y)}" r="13" ${attrs}></circle><circle cx="${formatSvgNumber(position.x)}" cy="${formatSvgNumber(position.y)}" r="9" ${attrs}></circle></g>`;
  }
  const label = control.kind === "normal" ? control.code || "" : controlKindLabel(control.kind);
  const className = control.kind === "normal" ? "variation-topology-number" : "variation-topology-special";
  return `<g class="variation-topology-node${selectedClass}" ${attrs}>${hitCircle}<text class="${className}" x="${formatSvgNumber(position.x)}" y="${formatSvgNumber(position.y + 8)}" text-anchor="middle" ${attrs}>${escapeHtml(label)}</text></g>`;
}

export function formatSvgNumber(value) {
  return Number(value).toFixed(2).replace(/\.?0+$/, "");
}

export function insertionCourseControlId(state) {
  const selection = state.ui.selection;
  const courseId = state.ui.selectedCourseId;
  if (!courseId || courseId === "all") return null;
  if (insertionBeforeCourseControlId(state)) return null;
  const explicitInsertion = Number(state.ui.variationInsertAfterCourseControl) || null;
  if (explicitInsertion && courseControlTopologyIds(state.eventModel, courseId).has(explicitInsertion)) {
    return explicitInsertion;
  }
  const branchTail = lastCourseControlInVariationBranch(state.eventModel, courseId, state.ui.variationBranch);
  if (branchTail?.id && courseControlTopologyIds(state.eventModel, courseId).has(Number(branchTail.id))) {
    return Number(branchTail.id);
  }
  if (!selection) return null;
  if (selection.type === "control-number" && selection.courseControl) {
    return selection.courseControl;
  }
  if (selection.type === "control") {
    return courseView(state.eventModel, courseId, { allBranches: false })
      .find(row => Number(row.control?.id) === Number(selection.id))
      ?.courseControl?.id || null;
  }
  if (selection.type === "leg" || selection.type === "leg-bend") {
    return courseView(state.eventModel, courseId, { allBranches: false })
      .find(row => Number(row.control?.id) === Number(selection.startControl))
      ?.courseControl?.id || null;
  }
  return null;
}

export function insertionBeforeCourseControlId(state) {
  const courseId = state.ui.selectedCourseId;
  if (!courseId || courseId === "all") return null;
  const explicitInsertion = Number(state.ui.variationInsertBeforeCourseControl) || null;
  return explicitInsertion && courseControlTopologyIds(state.eventModel, courseId).has(explicitInsertion)
    ? explicitInsertion
    : null;
}

export function variationAnchorCourseControl(eventModel, courseId, ui = {}) {
  if (!courseId || courseId === "all") return null;
  const rows = courseView(eventModel, courseId, { allBranches: true });
  const rowCourseControls = new Map(rows.map(row => [Number(row.courseControl?.id), row.courseControl]));
  const anchored = rowCourseControls.get(Number(ui.variationAnchorCourseControl));
  if (anchored && variationAnchorIsUsable(eventModel, anchored)) return anchored;
  const selection = ui.selection;
  if (selection?.type === "control-number" && selection.courseControl) {
    const candidate = rowCourseControls.get(Number(selection.courseControl)) || null;
    return variationAnchorIsUsable(eventModel, candidate) ? candidate : null;
  }
  if (selection?.type === "control") {
    const candidate = rows.find(row => Number(row.control?.id) === Number(selection.id))?.courseControl || null;
    return variationAnchorIsUsable(eventModel, candidate) ? candidate : null;
  }
  if (selection?.type === "leg" || selection?.type === "leg-bend") {
    const candidate = rows.find(row => Number(row.control?.id) === Number(selection.startControl))?.courseControl || null;
    return variationAnchorIsUsable(eventModel, candidate) ? candidate : null;
  }
  return null;
}

export function variationAnchorIsUsable(eventModel, courseControl) {
  if (!courseControl || courseControl.variation) return false;
  const control = getControl(eventModel, courseControl.control);
  if (!control || control.kind === "finish") return false;
  return !!getCourseControl(eventModel, courseControl.nextCourseControl);
}

export function canAddVariationAtCourseControl(eventModel, course, courseControl) {
  if (!course || course.kind === "score") return false;
  return variationAnchorIsUsable(eventModel, courseControl);
}

export function normalizedVariationBranch(eventModel, courseId, variationBranch) {
  if (!variationBranch || !courseId || courseId === "all") return null;
  const fork = getCourseControl(eventModel, variationBranch.forkCourseControl);
  const branch = getCourseControl(eventModel, variationBranch.branchCourseControl);
  if (!fork?.variation || !branch) return null;
  if (!fork.variationCourseControls.map(Number).includes(Number(branch.id))) return null;
  const courseControlIds = courseControlTopologyIds(eventModel, courseId);
  if (!courseControlIds.has(Number(fork.id)) || !courseControlIds.has(Number(branch.id))) return null;
  return {
    forkCourseControl: Number(fork.id),
    branchCourseControl: Number(branch.id)
  };
}

export function courseControlTopologyIds(eventModel, courseId) {
  const course = getCourse(eventModel, courseId);
  const ids = new Set();
  const maxSteps = Math.max(1000, (eventModel.courseControls?.length || 0) * 20);
  let steps = 0;

  function visit(startId, joinId = null) {
    let currentId = Number(startId) || 0;
    while (currentId && currentId !== Number(joinId) && steps++ < maxSteps) {
      const courseControl = getCourseControl(eventModel, currentId);
      if (!courseControl || ids.has(currentId)) break;
      ids.add(currentId);
      if (courseControl.variation) {
        for (const branchId of courseControl.variationCourseControls || []) {
          const branchCourseControl = getCourseControl(eventModel, branchId);
          if (!branchCourseControl) continue;
          ids.add(Number(branchCourseControl.id));
          visit(branchCourseControl.nextCourseControl, courseControl.variationEnd);
        }
        currentId = Number(courseControl.variation === "loop" ? courseControl.nextCourseControl : courseControl.variationEnd) || 0;
      }
      else {
        currentId = Number(courseControl.nextCourseControl) || 0;
      }
    }
  }

  visit(course?.firstCourseControl);
  return ids;
}

export function previousCourseControlId(eventModel, courseId, courseControlId) {
  const course = getCourse(eventModel, courseId);
  const target = Number(courseControlId) || 0;
  if (!course || !target) return null;
  const seen = new Set();
  const maxSteps = Math.max(1000, (eventModel.courseControls?.length || 0) * 20);
  let steps = 0;

  function visit(startId, joinId = null, previousId = null) {
    let currentId = Number(startId) || 0;
    let lastId = Number(previousId) || null;
    while (currentId && currentId !== Number(joinId) && steps++ < maxSteps) {
      if (currentId === target) return lastId;
      if (seen.has(currentId)) return null;
      seen.add(currentId);
      const courseControl = getCourseControl(eventModel, currentId);
      if (!courseControl) return null;
      if (courseControl.variation) {
        for (const branchId of courseControl.variationCourseControls || []) {
          const branchCourseControl = getCourseControl(eventModel, branchId);
          if (!branchCourseControl) continue;
          if (Number(branchCourseControl.id) === target) return lastId;
          const found = visit(branchCourseControl.nextCourseControl, courseControl.variationEnd, branchCourseControl.id);
          if (found) return found;
        }
        lastId = Number(courseControl.variation === "loop" ? courseControl.id : courseControl.variationEnd) || lastId;
        currentId = Number(courseControl.variation === "loop" ? courseControl.nextCourseControl : courseControl.variationEnd) || 0;
      }
      else {
        lastId = currentId;
        currentId = Number(courseControl.nextCourseControl) || 0;
      }
    }
    return null;
  }

  return visit(course.firstCourseControl);
}

export function lastCourseControlInVariationBranch(eventModel, courseId, variationBranch) {
  const branchSelection = normalizedVariationBranch(eventModel, courseId, variationBranch);
  if (!branchSelection) return null;
  const fork = getCourseControl(eventModel, branchSelection.forkCourseControl);
  let current = getCourseControl(eventModel, branchSelection.branchCourseControl);
  let last = current;
  const joinId = Number(fork?.variationEnd) || 0;
  const seen = new Set();
  const maxSteps = Math.max(1000, (eventModel.courseControls?.length || 0) * 20);
  let steps = 0;
  while (current && Number(current.nextCourseControl) && Number(current.nextCourseControl) !== joinId && !seen.has(Number(current.id)) && steps++ < maxSteps) {
    seen.add(Number(current.id));
    current = getCourseControl(eventModel, current.nextCourseControl);
    if (current) last = current;
  }
  return last || null;
}
