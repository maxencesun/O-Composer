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
  const branchGroups = relayBranchGroups(eventModel, courseId);
  const relay = course?.relay || {};
  const teams = Math.max(0, Number(relay.teams) || 0);
  const legs = Math.max(1, Number(relay.legs) || 1);
  const firstTeam = Math.max(1, Number(relay.firstTeam) || 1);
  if (!course || !variations.length || teams <= 0) {
    return { firstTeam, teams: 0, legs, rows: [], entries: [], variations, branchGroups };
  }

  const rows = [];
  const entries = [];
  for (let teamIndex = 0; teamIndex < teams; teamIndex += 1) {
    const team = firstTeam + teamIndex;
    const assignments = [];
    for (let leg = 1; leg <= legs; leg += 1) {
      const variation = pickRelayVariation(variations, relay.branches || [], teamIndex, leg, legs, branchGroups);
      const entry = {
        team,
        leg,
        label: relayEntryLabel(relay, team, leg),
        variation
      };
      assignments.push(variation);
      entries.push(entry);
    }
    rows.push({ team, assignments, entries: entries.slice(entries.length - legs) });
  }
  return { firstTeam, teams, legs, rows, entries, variations, branchGroups };
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
    const course = getCourse(eventModel, courseId);
    const variation = relayVariationForLeg(eventModel, courseId, ui.relayTeam, ui.relayLeg);
    const label = relayEntryLabel(course?.relay || {}, ui.relayTeam, ui.relayLeg);
    return variation ? `${label}: ${variation.code}` : "Relay leg";
  }
  return "";
}

export function relayEntryLabel(relay = {}, team, leg) {
  const teamNumber = Number(team) || 1;
  const legNumber = Math.max(1, Number(leg) || 1);
  const digits = Math.max(0, Math.min(8, Math.round(Number(relay.teamDigits) || 0)));
  const prefix = String(relay.teamPrefix || "");
  const teamText = `${prefix}${digits ? String(teamNumber).padStart(digits, "0") : String(teamNumber)}`;
  return `${teamText}-${relayLegName(relay, legNumber)}`;
}

export function relayLegName(relay = {}, leg) {
  const index = Math.max(1, Number(leg) || 1) - 1;
  const name = Array.isArray(relay.legNames) ? String(relay.legNames[index] || "").trim() : "";
  return name || String(index + 1);
}

export function relayTeamSizeOptions(eventModel, courseId) {
  const groups = relayBranchGroups(eventModel, courseId).filter(group => group.codes.length > 1);
  if (!groups.length) return [1];
  const base = groups.reduce((value, group) => lcm(value, group.codes.length), 1);
  const options = new Set([base]);
  for (let multiplier = 1; options.size < 6 && base * multiplier <= Math.max(24, base); multiplier += 1) {
    options.add(base * multiplier);
  }
  for (const group of groups) {
    options.add(group.codes.length);
  }
  return [...options]
    .filter(value => value > 0)
    .sort((a, b) => a - b)
    .slice(0, 8);
}

export function relayBranchGroups(eventModel, courseId) {
  const course = getCourse(eventModel, courseId);
  if (!course) return [];
  const branchCodes = variationBranchCodeMap(eventModel, courseId);
  const groups = [];
  const seen = new Set();
  const maxSteps = Math.max(1000, (eventModel.courseControls?.length || 0) * 50);
  let steps = 0;

  function visit(startId, stopId = null) {
    let currentId = Number(startId) || 0;
    const stop = Number(stopId) || 0;
    while (currentId && currentId !== stop && steps++ < maxSteps) {
      const key = `${currentId}:${stop}`;
      if (seen.has(key)) break;
      seen.add(key);
      const courseControl = getCourseControl(eventModel, currentId);
      if (!courseControl) break;
      if (courseControl.variation && courseControl.variationCourseControls?.length) {
        const branches = variationBranches(courseControl);
        const codes = branches.map(branchId => branchCodes.get(Number(branchId))).filter(Boolean);
        if (codes.length) {
          groups.push({
            forkCourseControl: Number(courseControl.id),
            kind: courseControl.variation === "loop" ? "loop" : "fork",
            codes
          });
        }
        for (const branchId of branches) {
          const branch = getCourseControl(eventModel, branchId);
          visit(branchTraversalStart(courseControl, branch), courseControl.variationEnd);
        }
        currentId = Number(courseControl.variation === "loop" ? courseControl.nextCourseControl : courseControl.variationEnd) || 0;
      }
      else {
        currentId = Number(courseControl.nextCourseControl) || 0;
      }
    }
  }

  visit(course.firstCourseControl);
  return groups;
}

function pickRelayVariation(variations, fixedBranches, teamIndex, leg, legs, branchGroups = []) {
  const fixedCodes = fixedBranches
    .filter(branch => Number(branch.leg) === Number(leg))
    .map(branch => String(branch.branch || "").trim())
    .filter(Boolean);
  const candidates = fixedCodes.length
    ? variations.filter(variation => fixedCodes.every(code => variation.code.includes(code)))
    : variations;
  const pool = candidates.length ? candidates : variations;
  const desired = desiredRelayCodes(branchGroups, teamIndex, leg);
  if (desired.length) {
    const desiredMatch = pool.find(variation => desired.every(code => variation.code.includes(code)));
    if (desiredMatch) return desiredMatch;
  }
  const index = positiveModulo(teamIndex * legs + (leg - 1) + teamIndex, pool.length);
  return pool[index];
}

function desiredRelayCodes(branchGroups, teamIndex, leg) {
  const legIndex = Math.max(0, Number(leg) - 1);
  return branchGroups
    .filter(group => group.kind !== "loop" && group.codes.length > 1)
    .map((group, groupIndex) => group.codes[positiveModulo(teamIndex + legIndex + groupIndex, group.codes.length)])
    .filter(Boolean);
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
        const tails = enumerateVariationChoices(
          eventModel,
          branchTraversalStart(courseControl, branch),
          visited
        );
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

function branchTraversalStart(ownerCourseControl, branchCourseControl) {
  if (!branchCourseControl) return null;
  if (Number(branchCourseControl.id) === Number(ownerCourseControl?.id)) {
    return Number(branchCourseControl.nextCourseControl) || null;
  }
  // New branches are hidden markers using the same map control as the fork.
  // Imported files may put the first real branch control directly in the
  // variation list. Support both representations.
  if (Number(branchCourseControl.control) === Number(ownerCourseControl?.control)) {
    return Number(branchCourseControl.nextCourseControl) || null;
  }
  return Number(branchCourseControl.id) || null;
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

function gcd(a, b) {
  let x = Math.abs(Math.round(Number(a) || 0));
  let y = Math.abs(Math.round(Number(b) || 0));
  while (y) {
    const next = x % y;
    x = y;
    y = next;
  }
  return x || 1;
}

function lcm(a, b) {
  return Math.abs(Math.round(Number(a) || 1) * Math.round(Number(b) || 1)) / gcd(a, b);
}

function getCourse(eventModel, id) {
  return (eventModel.courses || []).find(course => Number(course.id) === Number(id)) || null;
}

function getCourseControl(eventModel, id) {
  return (eventModel.courseControls || []).find(courseControl => Number(courseControl.id) === Number(id)) || null;
}
