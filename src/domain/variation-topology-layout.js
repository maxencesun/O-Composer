export const TOPOLOGY_WIDTH_UNIT = 76;
export const TOPOLOGY_MIN_VERTICAL_SEGMENT = 24;
export const TOPOLOGY_NORMAL_CONTROL_RADIUS = 20;
export const TOPOLOGY_HEIGHT_UNIT = TOPOLOGY_NORMAL_CONTROL_RADIUS * 2 + TOPOLOGY_MIN_VERTICAL_SEGMENT;
export const TOPOLOGY_PADDING_X = 44;
export const TOPOLOGY_PADDING_Y = 26;

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
        const forkBlockHeight = loop ? maxForkHeight + 2 : maxForkHeight;
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
        tailStartYs.push(forkStart.y);
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
