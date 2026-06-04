const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

export function courseHasVariations(eventModel, courseId) {
  const course = getCourse(eventModel, courseId);
  if (!course || course.kind === "score") return false;
  return courseControlIdsInVariationOrder(eventModel, course)
    .some(id => !!getCourseControl(eventModel, id)?.variation);
}

export function variationBranchCodeMap(eventModel, courseId) {
  const course = getCourse(eventModel, courseId);
  const result = new Map();
  if (!course) return result;
  let next = 0;
  for (const id of courseControlIdsInVariationOrder(eventModel, course)) {
    const courseControl = getCourseControl(eventModel, id);
    if (!courseControl?.variation) continue;
    const branches = variationBranches(courseControl);
    for (const branchId of branches) {
      if (!result.has(Number(branchId))) {
        result.set(Number(branchId), LETTERS[next] || `V${next + 1}`);
        next += 1;
      }
    }
  }
  return result;
}

export function allCourseVariations(eventModel, courseId) {
  const course = getCourse(eventModel, courseId);
  if (!course || !courseHasVariations(eventModel, courseId)) return [];
  const branchCodes = variationBranchCodeMap(eventModel, courseId);
  const variations = enumerateVariationChoices(eventModel, course.firstCourseControl)
    .map(choices => ({
      code: choices.map(id => branchCodes.get(Number(id))).filter(Boolean).join(""),
      choices: choices.map(Number)
    }))
    .filter(variation => variation.code);
  return uniqueVariations(variations)
    .sort((a, b) => a.code.localeCompare(b.code));
}

export function variationForCode(eventModel, courseId, code) {
  const normalized = String(code || "").trim();
  return allCourseVariations(eventModel, courseId)
    .find(variation => variation.code === normalized) || null;
}

export function relayAssignments(eventModel, courseId) {
  const course = getCourse(eventModel, courseId);
  const variations = allCourseVariations(eventModel, courseId);
  const relay = course?.relay || {};
  const teams = Math.max(0, Number(relay.teams) || 0);
  const legs = Math.max(1, Number(relay.legs) || 1);
  const firstTeam = Math.max(1, Number(relay.firstTeam) || 1);
  if (!course || !variations.length || teams <= 0) {
    return { firstTeam, teams: 0, legs, rows: [], variations };
  }

  const rows = [];
  for (let teamIndex = 0; teamIndex < teams; teamIndex += 1) {
    const team = firstTeam + teamIndex;
    const assignments = [];
    for (let leg = 1; leg <= legs; leg += 1) {
      assignments.push(pickRelayVariation(variations, relay.branches || [], teamIndex, leg, legs));
    }
    rows.push({ team, assignments });
  }
  return { firstTeam, teams, legs, rows, variations };
}

export function relayVariationForLeg(eventModel, courseId, team, leg) {
  const assignments = relayAssignments(eventModel, courseId);
  const row = assignments.rows.find(candidate => Number(candidate.team) === Number(team));
  return row?.assignments[Math.max(0, Number(leg) - 1)] || null;
}

export function variationDisplayLabel(eventModel, courseId, ui = {}) {
  if (ui.variationMode === "all") return "All variations";
  if (ui.variationMode === "variation" && ui.variationCode) return `Variation ${ui.variationCode}`;
  if (ui.variationMode === "relay") {
    const variation = relayVariationForLeg(eventModel, courseId, ui.relayTeam, ui.relayLeg);
    return variation ? `Team ${ui.relayTeam} Leg ${ui.relayLeg}: ${variation.code}` : "Relay leg";
  }
  return "";
}

function pickRelayVariation(variations, fixedBranches, teamIndex, leg, legs) {
  const fixedCodes = fixedBranches
    .filter(branch => Number(branch.leg) === Number(leg))
    .map(branch => String(branch.branch || "").trim())
    .filter(Boolean);
  const candidates = fixedCodes.length
    ? variations.filter(variation => fixedCodes.every(code => variation.code.includes(code)))
    : variations;
  const pool = candidates.length ? candidates : variations;
  const index = positiveModulo(teamIndex * legs + (leg - 1) + teamIndex, pool.length);
  return pool[index];
}

function enumerateVariationChoices(eventModel, startId, visited = new Set()) {
  let currentId = Number(startId) || 0;
  while (currentId) {
    const courseControl = getCourseControl(eventModel, currentId);
    if (!courseControl) break;
    if (courseControl.variation && courseControl.variationCourseControls?.length) {
      if (courseControl.variation === "loop") {
        const branches = variationBranches(courseControl);
        const tails = enumerateVariationChoices(eventModel, courseControl.nextCourseControl, visited);
        const permutations = permute(branches);
        return permutations.flatMap(order => tails.map(tail => [...order, ...tail]));
      }

      const result = [];
      for (const branchId of variationBranches(courseControl)) {
        if (visited.has(Number(branchId))) continue;
        visited.add(Number(branchId));
        const branch = getCourseControl(eventModel, branchId);
        const tails = enumerateVariationChoices(eventModel, branch?.nextCourseControl, visited);
        visited.delete(Number(branchId));
        for (const tail of tails) {
          result.push([Number(branchId), ...tail]);
        }
      }
      return result.length ? result : [[]];
    }
    currentId = Number(courseControl.nextCourseControl) || 0;
  }
  return [[]];
}

function courseControlIdsInVariationOrder(eventModel, course) {
  const ids = [];
  const seen = new Set();
  const maxSteps = Math.max(1000, (eventModel.courseControls?.length || 0) * 20);
  let steps = 0;

  function visit(startId, joinId = null) {
    let currentId = Number(startId) || 0;
    while (currentId && currentId !== Number(joinId) && !seen.has(currentId) && steps++ < maxSteps) {
      const courseControl = getCourseControl(eventModel, currentId);
      if (!courseControl) break;
      ids.push(currentId);
      seen.add(currentId);
      if (courseControl.variation) {
        for (const branchId of variationBranches(courseControl)) {
          visit(branchId, courseControl.variationEnd);
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

function variationBranches(courseControl) {
  return (courseControl.variationCourseControls || [])
    .map(Number)
    .filter(Boolean);
}

function uniqueVariations(variations) {
  const seen = new Set();
  const result = [];
  for (const variation of variations) {
    if (seen.has(variation.code)) continue;
    seen.add(variation.code);
    result.push(variation);
  }
  return result;
}

function permute(values) {
  if (values.length <= 1) return [values.map(Number)];
  const result = [];
  values.forEach((value, index) => {
    const rest = [...values.slice(0, index), ...values.slice(index + 1)];
    for (const tail of permute(rest)) {
      result.push([Number(value), ...tail]);
    }
  });
  return result;
}

function positiveModulo(value, size) {
  return ((value % size) + size) % size;
}

function getCourse(eventModel, id) {
  return (eventModel.courses || []).find(course => Number(course.id) === Number(id)) || null;
}

function getCourseControl(eventModel, id) {
  return (eventModel.courseControls || []).find(courseControl => Number(courseControl.id) === Number(id)) || null;
}
