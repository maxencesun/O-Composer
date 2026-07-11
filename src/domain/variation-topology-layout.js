export const TOPOLOGY_WIDTH_UNIT = 76;
export const TOPOLOGY_MIN_VERTICAL_SEGMENT = 24;
export const TOPOLOGY_NORMAL_CONTROL_RADIUS = 20;
export const TOPOLOGY_HEIGHT_UNIT = TOPOLOGY_NORMAL_CONTROL_RADIUS * 2 + TOPOLOGY_MIN_VERTICAL_SEGMENT;
export const TOPOLOGY_PADDING_X = 44;
export const TOPOLOGY_PADDING_Y = 26;

const TOPOLOGY_EMPTY_BRANCH_TAIL_OFFSET = TOPOLOGY_NORMAL_CONTROL_RADIUS * 2
  + TOPOLOGY_MIN_VERTICAL_SEGMENT / 2;

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
      abstractPositions[index] = { x, y, forkStart: null, spacerYs: [] };
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
          maxForkHeight = Math.max(maxForkHeight, forkSize[branchIndex].height);
        }
        const branchCount = Math.max(0, numForks - startFork);
        const laneWidth = Math.max(1, ...forkSize.slice(startFork).filter(Boolean).map(size => size.width || 1));
        totalForkWidth = (loop ? 1 : 0) + branchCount * laneWidth;

        if (loop) {
          const forkY = y;
          forkStart[0] = { x, y: forkY, code: "", loopFallThru: true };
          const firstLaneCenter = x - (branchCount - 1) * laneWidth / 2;
          for (let branchIndex = startFork; branchIndex < numForks; branchIndex += 1) {
            const laneIndex = branchIndex - startFork;
            const forkX = firstLaneCenter + laneIndex * laneWidth;
            forkStart[branchIndex] = { x: forkX, y: forkY, code: branchCodes.get(Number(topologyBranchCourseControlId(view, branchIndex))) || "", loopStart: true };
          }
          totalForkWidth = Math.max(totalForkWidth, branchCount * laneWidth);
          abstractPositions[index].loopBottom = y + maxForkHeight + 1.5;
        }
        else {
          const forkY = y - 0.5;
          let forkX = x - totalForkWidth / 2;
          for (let branchIndex = startFork; branchIndex < numForks; branchIndex += 1) {
            forkX += laneWidth / 2;
            forkStart[branchIndex] = { x: forkX, y: forkY, code: branchCodes.get(Number(topologyBranchCourseControlId(view, branchIndex))) || "" };
            forkX += laneWidth / 2;
          }
        }

        abstractPositions[index].forkStart = forkStart;
        for (let branchIndex = startFork; branchIndex < numForks; branchIndex += 1) {
          const branchStartY = loop ? forkStart[branchIndex].y + 1 : forkStart[branchIndex].y + 0.5;
          assign(legTo[branchIndex], view.joinIndex, forkStart[branchIndex].x, branchStartY);
        }
        const sharesEnclosingJoin = !loop
          && Number.isInteger(endIndex)
          && endIndex < topology.length
          && Number(view.joinIndex) === Number(endIndex);
        const forkBlockHeight = loop ? maxForkHeight + 2 : maxForkHeight + (sharesEnclosingJoin ? 0.5 : 0);
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
    x: scaledCoordinate(position.x, minX, TOPOLOGY_PADDING_X, TOPOLOGY_WIDTH_UNIT),
    y: scaledCoordinate(position.y, minY, TOPOLOGY_PADDING_Y, TOPOLOGY_HEIGHT_UNIT),
    loopBottom: Number.isFinite(position.loopBottom) ? scaledCoordinate(position.loopBottom, minY, TOPOLOGY_PADDING_Y, TOPOLOGY_HEIGHT_UNIT) : null,
    forkStart: position.forkStart?.map(fork => fork && ({
      x: scaledCoordinate(fork.x, minX, TOPOLOGY_PADDING_X, TOPOLOGY_WIDTH_UNIT),
      y: scaledCoordinate(fork.y, minY, TOPOLOGY_PADDING_Y, TOPOLOGY_HEIGHT_UNIT),
      code: fork.code || "",
      loopStart: !!fork.loopStart,
      loopFallThru: !!fork.loopFallThru
    })) || null
  }));

  return {
    positions,
    width: Math.max(1, (maxX - minX) * TOPOLOGY_WIDTH_UNIT + TOPOLOGY_PADDING_X * 2),
    height: Math.max(1, (maxY - minY) * TOPOLOGY_HEIGHT_UNIT + TOPOLOGY_PADDING_Y * 2)
  };
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
      const branchCourseControl = topologyBranchCourseControlId(fork, legIndex);
      if (!Number.isInteger(targetIndex) || !branchCourseControl) continue;
      const branch = {
        forkIndex,
        forkCourseControl: topologyNodeCourseControlId(fork),
        branchCourseControl,
        joinIndex: fork.joinIndex
      };
      markBranchEdges(topology, branchEdges, forkIndex, targetIndex, fork.joinIndex, branch, new Set());
    }
  }
  return branchEdges;
}

export function topologySharedJoinParentMap(topology) {
  const result = new Map();
  for (let childForkIndex = 0; childForkIndex < topology.length; childForkIndex += 1) {
    const childFork = topology[childForkIndex];
    if (!childFork || (childFork.legTo || []).length <= 1 || !Number.isInteger(childFork.joinIndex)) continue;
    let nearestParent = null;
    let nearestDistance = Infinity;
    for (let parentForkIndex = 0; parentForkIndex < topology.length; parentForkIndex += 1) {
      const parentFork = topology[parentForkIndex];
      if (parentForkIndex === childForkIndex
        || !parentFork
        || (parentFork.legTo || []).length <= 1
        || Number(parentFork.joinIndex) !== Number(childFork.joinIndex)) continue;
      for (const branchStartIndex of parentFork.legTo || []) {
        const distance = topologyDistanceBeforeJoin(
          topology,
          branchStartIndex,
          childForkIndex,
          parentFork.joinIndex,
          new Set()
        );
        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearestParent = parentForkIndex;
        }
      }
    }
    if (Number.isInteger(nearestParent)) result.set(childForkIndex, nearestParent);
  }
  return result;
}

function topologyDistanceBeforeJoin(topology, index, targetIndex, joinIndex, seen) {
  if (!Number.isInteger(index) || index === joinIndex || seen.has(index)) return Infinity;
  if (index === targetIndex) return 0;
  seen.add(index);
  let distance = Infinity;
  for (const nextIndex of topology[index]?.legTo || []) {
    const nestedDistance = topologyDistanceBeforeJoin(topology, nextIndex, targetIndex, joinIndex, new Set(seen));
    if (Number.isFinite(nestedDistance)) distance = Math.min(distance, nestedDistance + 1);
  }
  return distance;
}

export function alignTopologySharedJoinPoints(topology, positions, commonJoinPoints, sharedJoinParents = null, nodeRadius = 16) {
  const parents = sharedJoinParents || topologySharedJoinParentMap(topology);
  for (const childForkIndex of parents.keys()) {
    const childPoint = commonJoinPoints.get(childForkIndex);
    const ownerPosition = positions[childForkIndex];
    if (!childPoint || !ownerPosition) continue;
    const childFork = topology[childForkIndex];
    const tailStartYs = [];
    for (let legIndex = 0; legIndex < (childFork?.legTo || []).length; legIndex += 1) {
      const startIndex = childFork.legTo[legIndex];
      const forkStart = ownerPosition.forkStart?.[legIndex] || null;
      if (Number(startIndex) === Number(childFork.joinIndex) && forkStart && topologyBranchIsEmpty(childFork, legIndex)) {
        tailStartYs.push(forkStart.y + TOPOLOGY_EMPTY_BRANCH_TAIL_OFFSET);
        continue;
      }
      for (const tailIndex of branchTailIndices(topology, startIndex, childFork.joinIndex)) {
        const tailPosition = positions[tailIndex];
        if (tailPosition) {
          tailStartYs.push(tailPosition.y + connectionRadius(topology[tailIndex]?.control, nodeRadius));
        }
      }
    }
    const localJoinY = tailStartYs.length
      ? Math.max(...tailStartYs) + TOPOLOGY_MIN_VERTICAL_SEGMENT / 2
      : childPoint.y;
    commonJoinPoints.set(childForkIndex, { ...childPoint, x: ownerPosition.x, y: localJoinY });
  }
  for (let pass = 0; pass <= parents.size; pass += 1) {
    for (const [childForkIndex, parentForkIndex] of parents) {
      const childPoint = commonJoinPoints.get(childForkIndex);
      const parentPoint = commonJoinPoints.get(parentForkIndex);
      const joinIndex = topology[parentForkIndex]?.joinIndex;
      const joinPosition = positions[joinIndex];
      if (childPoint && parentPoint && joinPosition) {
        const joinTopY = joinPosition.y - connectionRadius(topology[joinIndex]?.control, nodeRadius);
        const hierarchicalY = (childPoint.y + joinTopY) / 2;
        if (hierarchicalY > parentPoint.y) {
          commonJoinPoints.set(parentForkIndex, { ...parentPoint, y: hierarchicalY });
        }
      }
    }
  }
  return commonJoinPoints;
}

export function topologyEdgeKey(fromIndex, toIndex) {
  return `${fromIndex}:${toIndex}`;
}

export function topologyCommonJoinPointMap(topology, positions, nodeRadius) {
  const result = new Map();
  for (let index = 0; index < topology.length; index += 1) {
    const view = topology[index];
    if (!view || view.variation === "loop" || (view.legTo || []).length <= 1) continue;
    const joinPosition = positions[view.joinIndex];
    if (!joinPosition) continue;
    const joinTopY = joinPosition.y - connectionRadius(topology[view.joinIndex]?.control, nodeRadius);
    const tailStartYs = [];
    for (let legIndex = 0; legIndex < view.legTo.length; legIndex += 1) {
      const startIndex = view.legTo[legIndex];
      const forkStart = positions[index]?.forkStart?.[legIndex] || null;
      if (Number(startIndex) === Number(view.joinIndex) && forkStart && topologyBranchIsEmpty(view, legIndex)) {
        tailStartYs.push(forkStart.y + TOPOLOGY_EMPTY_BRANCH_TAIL_OFFSET);
        continue;
      }
      for (const tailIndex of branchTailIndices(topology, startIndex, view.joinIndex)) {
        const tailPosition = positions[tailIndex];
        if (tailPosition) {
          tailStartYs.push(tailPosition.y + connectionRadius(topology[tailIndex]?.control, nodeRadius));
        }
      }
    }
    if (tailStartYs.length) {
      result.set(index, { x: joinPosition.x, y: (Math.max(...tailStartYs) + joinTopY) / 2 });
    }
  }
  return result;
}

export function placeTopologyBranchLabel(placements, { forkX, ownerX, y, code, secondaryText = "" }) {
  const direction = forkX < ownerX ? -1 : 1;
  const candidates = [
    forkX + direction * 36,
    forkX - direction * 28,
    forkX + direction * 58,
    forkX - direction * 50
  ];
  const width = Math.max(18, String(`(${code || ""})`).length * 8.5, String(secondaryText || "").length * 7.5);
  const top = y - 10;
  const bottom = y + (secondaryText ? 26 : 10);
  const collides = x => placements.some(box => (
    x + width / 2 + 4 > box.left
    && x - width / 2 - 4 < box.right
    && bottom + 3 > box.top
    && top - 3 < box.bottom
  ));
  const x = candidates.find(candidate => !collides(candidate)) ?? candidates[candidates.length - 1];
  placements.push({ left: x - width / 2, right: x + width / 2, top, bottom });
  return { x, y };
}

function markBranchEdges(topology, branchEdges, fromIndex, toIndex, joinIndex, branch, seen) {
  if (!Number.isInteger(fromIndex) || !Number.isInteger(toIndex)) return;
  branchEdges.set(topologyEdgeKey(fromIndex, toIndex), branch);
  if (toIndex === joinIndex || seen.has(toIndex)) return;
  seen.add(toIndex);
  for (const nextIndex of topology[toIndex]?.legTo || []) {
    if (Number.isInteger(nextIndex)) {
      markBranchEdges(topology, branchEdges, toIndex, nextIndex, joinIndex, branch, seen);
    }
  }
}

function branchTailIndices(topology, startIndex, joinIndex) {
  const tails = [];
  const seen = new Set();
  function visit(index) {
    if (!Number.isInteger(index) || index < 0 || index >= topology.length || index === joinIndex || seen.has(index)) return;
    seen.add(index);
    const nextIndices = (topology[index]?.legTo || []).filter(Number.isInteger);
    if (!nextIndices.length || nextIndices.includes(joinIndex)) tails.push(index);
    for (const nextIndex of nextIndices) {
      if (nextIndex !== joinIndex) visit(nextIndex);
    }
  }
  visit(startIndex);
  return tails;
}

function connectionRadius(control, symbolRadius) {
  if (!control) return 0;
  if (control.kind === "start" || control.kind === "finish") return symbolRadius;
  return control.kind === "normal" ? TOPOLOGY_NORMAL_CONTROL_RADIUS : symbolRadius + 2;
}

function scaledCoordinate(value, min, padding, unit) {
  return padding + (Number(value) - min) * unit;
}
