const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
const IMPOSSIBLE_BRANCH_CODE = "__no_allowed_branch__";

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
  const configuredLegs = Math.max(1, Number(relay.legs) || 1);
  const requiredLegs = relayRequiredTeamSize(eventModel, courseId);
  const isConfiguredLegCountValid = !variations.length || configuredLegs % requiredLegs === 0;
  const legs = variations.length
    ? (isConfiguredLegCountValid ? configuredLegs : requiredLegs)
    : configuredLegs;
  const firstTeam = Math.max(1, Number(relay.firstTeam) || 1);
  if (!course || !variations.length || teams <= 0) {
    return {
      firstTeam,
      teams: 0,
      legs,
      configuredLegs,
      requiredLegs,
      isLegCountValid: isConfiguredLegCountValid,
      rows: [],
      entries: [],
      variations,
      branchGroups
    };
  }

  const decoratedVariations = decorateRelayVariations(variations, branchGroups);
  const assignmentPlan = planRelayAssignments(decoratedVariations, relay.branches || [], teams, legs, requiredLegs, branchGroups);
  const rows = [];
  const entries = [];
  for (let teamIndex = 0; teamIndex < teams; teamIndex += 1) {
    const team = firstTeam + teamIndex;
    const assignments = [];
    for (let leg = 1; leg <= legs; leg += 1) {
      const variation = assignmentPlan[teamIndex]?.[leg - 1] || null;
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
  return {
    firstTeam,
    teams,
    legs,
    configuredLegs,
    requiredLegs,
    isLegCountValid: isConfiguredLegCountValid,
    rows,
    entries,
    variations,
    branchGroups
  };
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
  const base = relayRequiredTeamSize(eventModel, courseId);
  const course = getCourse(eventModel, courseId);
  const configuredLegs = Math.max(1, Number(course?.relay?.legs) || 1);
  const maxMultiplier = Math.max(12, Math.ceil(configuredLegs / base));
  const options = [];
  for (let multiplier = 1; multiplier <= maxMultiplier; multiplier += 1) {
    options.push(base * multiplier);
  }
  if (configuredLegs % base === 0 && !options.includes(configuredLegs)) {
    options.push(configuredLegs);
  }
  return options.sort((a, b) => a - b);
}

export function relayBranchAllowedLegs(branchSettings = [], branchCode, maxLegs = Infinity) {
  const code = String(branchCode || "").trim();
  if (!code) return [];
  const rawLegs = (branchSettings || [])
    .filter(branch => String(branch.branch || "").trim() === code)
    .flatMap(branch => Array.isArray(branch.legs)
      ? branch.legs
      : (Number(branch.leg) > 0 ? [branch.leg] : []));
  const limit = Number.isFinite(Number(maxLegs)) ? Math.max(1, Math.round(Number(maxLegs))) : Infinity;
  return [...new Set(rawLegs
    .map(leg => Math.round(Number(leg) || 0))
    .filter(leg => leg > 0 && leg <= limit))]
    .sort((a, b) => a - b);
}

export function relayBranchLegLabel(relay = {}, branchCode, options = {}) {
  const legs = relayBranchAllowedLegs(relay.branches || [], branchCode, relay.legs || Infinity);
  if (!legs.length) return "";
  if (options.short) return legs.map(leg => relayLegName(relay, leg)).join(",");
  return legs.map(leg => `Leg ${relayLegName(relay, leg)}`).join(", ");
}

export function relayBranchRestrictionIssues(branchGroups = [], branchSettings = []) {
  const issues = [];
  for (const group of branchGroups || []) {
    const codes = (group.codes || []).map(code => String(code || "").trim()).filter(Boolean);
    if (codes.length <= 1) continue;
    const declaredCodes = codes.filter(code => relayBranchAllowedLegs(branchSettings, code).length);
    if (!declaredCodes.length || declaredCodes.length === codes.length) continue;
    issues.push({
      groupId: group.groupId,
      codes,
      declaredCodes,
      missingCodes: codes.filter(code => !declaredCodes.includes(code))
    });
  }
  return issues;
}

export function relayRequiredTeamSize(eventModel, courseId) {
  const groups = relayBranchGroups(eventModel, courseId).filter(group => group.codes.length > 1);
  if (!groups.length) return 1;
  return groups.reduce((value, group) => lcm(value, group.requiredDivisor || group.codes.length), 1);
}

export function relayBranchGroups(eventModel, courseId) {
  const course = getCourse(eventModel, courseId);
  if (!course) return [];
  const branchCodes = variationBranchCodeMap(eventModel, courseId);
  const groups = [];
  const seen = new Set();
  const maxSteps = Math.max(1000, (eventModel.courseControls?.length || 0) * 50);
  let steps = 0;

  function visit(startId, stopId = null, parentPath = [], contextDenominator = 1, depth = 0) {
    let currentId = Number(startId) || 0;
    const stop = Number(stopId) || 0;
    while (currentId && currentId !== stop && steps++ < maxSteps) {
      const key = `${currentId}:${stop}:${parentPath.map(item => `${item.groupId}=${item.code}`).join("/")}`;
      if (seen.has(key)) break;
      seen.add(key);
      const courseControl = getCourseControl(eventModel, currentId);
      if (!courseControl) break;
      if (courseControl.variation && courseControl.variationCourseControls?.length) {
        const branchIds = variationBranches(courseControl);
        const branches = branchIds
          .map(branchId => ({ id: Number(branchId), code: branchCodes.get(Number(branchId)) }))
          .filter(branch => branch.code);
        const codes = branches.map(branch => branch.code);
        const group = {
          id: Number(courseControl.id),
          groupId: Number(courseControl.id),
          forkCourseControl: Number(courseControl.id),
          kind: courseControl.variation === "loop" ? "loop" : "fork",
          branchIds: branches.map(branch => branch.id),
          codes,
          parentPath: parentPath.map(item => ({ ...item })),
          contextDenominator: Math.max(1, contextDenominator),
          requiredDivisor: Math.max(1, contextDenominator) * Math.max(1, codes.length),
          depth
        };
        if (codes.length) groups.push(group);
        for (const branch of branches) {
          const branchCourseControl = getCourseControl(eventModel, branch.id);
          const nextParentPath = group.kind === "loop"
            ? parentPath
            : [...parentPath, { groupId: group.groupId, code: branch.code, branchId: branch.id }];
          const nextContextDenominator = group.kind === "loop"
            ? contextDenominator
            : contextDenominator * Math.max(1, codes.length);
          visit(
            branchTraversalStart(courseControl, branchCourseControl),
            courseControl.variationEnd,
            nextParentPath,
            nextContextDenominator,
            depth + 1
          );
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

function planRelayAssignments(decoratedVariations, fixedBranches, teamCount, legsPerTeam, baseLegs, branchGroups = []) {
  if (!decoratedVariations.length || teamCount <= 0 || legsPerTeam <= 0) return [];
  const effectiveBaseLegs = Math.max(1, Math.min(Math.max(1, Number(baseLegs) || 1), Math.max(1, Number(legsPerTeam) || 1)));
  const blockCount = Math.max(1, Math.ceil(legsPerTeam / effectiveBaseLegs));
  const branchRules = relayBranchRuleMap(fixedBranches, legsPerTeam);
  const offsetSpace = relayOffsetSpace(decoratedVariations, branchGroups);
  const blockShifts = chooseRelayBlockShifts(offsetSpace, decoratedVariations, branchGroups, effectiveBaseLegs, blockCount, branchRules);
  const offsetUse = new Map();
  const globalRouteUse = new Map();
  const slotRouteUse = Array.from({ length: legsPerTeam }, () => new Map());
  const slotBranchUse = Array.from({ length: legsPerTeam }, () => new Map());
  const result = [];

  for (let teamIndex = 0; teamIndex < teamCount; teamIndex += 1) {
    let best = null;
    let bestScore = Infinity;
    for (const offset of offsetSpace) {
      const candidate = buildRelayTeamPlan({
        offset,
        blockShifts,
        decoratedVariations,
        branchRules,
        branchGroups,
        legsPerTeam,
        baseLegs: effectiveBaseLegs
      });
      const score = scoreRelayTeamPlan(candidate, offset, slotRouteUse, slotBranchUse, globalRouteUse, offsetUse);
      if (score < bestScore) {
        best = candidate;
        bestScore = score;
      }
    }
    const offset = best?.offset || offsetSpace[0];
    offsetUse.set(offset.key, (offsetUse.get(offset.key) || 0) + 1);
    for (let legIndex = 0; legIndex < legsPerTeam; legIndex += 1) {
      const item = best?.legs[legIndex];
      const code = item?.variation?.code || "";
      if (code) {
        slotRouteUse[legIndex].set(code, (slotRouteUse[legIndex].get(code) || 0) + 1);
        globalRouteUse.set(code, (globalRouteUse.get(code) || 0) + 1);
      }
      for (const [groupId, branchCode] of item?.signature || []) {
        const key = `${groupId}:${branchCode}`;
        slotBranchUse[legIndex].set(key, (slotBranchUse[legIndex].get(key) || 0) + 1);
      }
    }
    result.push((best?.legs || []).map(item => item.variation || null));
  }
  return result;
}

function relayOffsetSpace(decoratedVariations, branchGroups) {
  const seen = new Set();
  const offsets = [];
  for (const candidate of decoratedVariations) {
    const values = branchGroups.map(group => {
      const code = candidate.signature.get(String(group.groupId)) || group.codes?.[0] || "";
      return Math.max(0, (group.codes || []).indexOf(code));
    });
    const key = values.join(":");
    if (seen.has(key)) continue;
    seen.add(key);
    offsets.push({ values, key });
  }
  return offsets.length ? offsets : [{ values: branchGroups.map(() => 0), key: "" }];
}

function chooseRelayBlockShifts(offsetSpace, decoratedVariations, branchGroups, baseLegs, blockCount, branchRules = new Map()) {
  const shifts = [];
  const usedRoutes = new Map();
  const zeroOffset = { values: branchGroups.map(() => 0), key: branchGroups.map(() => 0).join(":") };
  for (let blockIndex = 0; blockIndex < blockCount; blockIndex += 1) {
    let best = offsetSpace[0];
    let bestScore = Infinity;
    for (const shift of offsetSpace) {
      let score = 0;
      for (let pos = 0; pos < baseLegs; pos += 1) {
        const signature = relaySignatureForLeg({
          offset: zeroOffset,
          blockShift: shift,
          branchGroups,
          branchRules,
          legIndex: pos,
          baseLegs
        });
        const variation = findRelayVariationForSignature(decoratedVariations, signature);
        score += usedRoutes.get(variation?.code || relaySignatureKey(signature)) || 0;
      }
      if (score < bestScore) {
        best = shift;
        bestScore = score;
      }
    }
    shifts.push(best);
    for (let pos = 0; pos < baseLegs; pos += 1) {
      const signature = relaySignatureForLeg({
        offset: zeroOffset,
        blockShift: best,
        branchGroups,
        branchRules,
        legIndex: pos,
        baseLegs
      });
      const variation = findRelayVariationForSignature(decoratedVariations, signature);
      const key = variation?.code || relaySignatureKey(signature);
      usedRoutes.set(key, (usedRoutes.get(key) || 0) + 1);
    }
  }
  return shifts;
}

function buildRelayTeamPlan({ offset, blockShifts, decoratedVariations, branchRules, branchGroups, legsPerTeam, baseLegs }) {
  const legs = [];
  for (let legIndex = 0; legIndex < legsPerTeam; legIndex += 1) {
    const blockIndex = Math.floor(legIndex / baseLegs);
    const signature = relaySignatureForLeg({
      offset,
      blockShift: blockShifts[blockIndex] || blockShifts[0],
      branchGroups,
      branchRules,
      legIndex,
      baseLegs
    });
    const fixed = fixedRelaySignature(branchGroups, branchRules, legIndex + 1);
    for (const [groupId, code] of fixed) {
      signature.set(groupId, code);
    }
    legs.push({
      signature,
      variation: findRelayVariationForSignature(decoratedVariations, signature)
        || pickRelayVariation(decoratedVariations, branchRules, 0, legIndex + 1, legsPerTeam, branchGroups)
    });
  }
  return { offset, legs };
}

function scoreRelayTeamPlan(candidate, offset, slotRouteUse, slotBranchUse, globalRouteUse, offsetUse) {
  let score = (offsetUse.get(offset.key) || 0) * 10000000;
  for (let legIndex = 0; legIndex < candidate.legs.length; legIndex += 1) {
    const item = candidate.legs[legIndex];
    const code = item?.variation?.code || "";
    score += (slotRouteUse[legIndex].get(code) || 0) * 100000;
    score += (globalRouteUse.get(code) || 0) * 10;
    for (const [groupId, branchCode] of item?.signature || []) {
      score += (slotBranchUse[legIndex].get(`${groupId}:${branchCode}`) || 0) * 100;
    }
  }
  return score;
}

function relaySignatureForLeg({ offset, blockShift, branchGroups, branchRules = new Map(), legIndex, baseLegs }) {
  const signatures = relaySignaturesForBlock({ offset, blockShift, branchGroups, branchRules, legIndex, baseLegs });
  return signatures[positiveModulo(legIndex, signatures.length || 1)] || new Map();
}

function relaySignaturesForBlock({ offset, blockShift, branchGroups, branchRules = new Map(), legIndex, baseLegs }) {
  const blockSize = Math.max(1, Number(baseLegs) || 1);
  const posInBlock = positiveModulo(legIndex, blockSize);
  const blockStart = Math.max(0, Number(legIndex) || 0) - posInBlock;
  const signatures = Array.from({ length: blockSize }, () => new Map());
  const activeCounts = new Map();

  for (let index = 0; index < branchGroups.length; index += 1) {
    const group = branchGroups[index];
    const groupId = String(group.groupId);
    for (let pos = 0; pos < blockSize; pos += 1) {
      const leg = blockStart + pos + 1;
      const codes = relayEligibleCodesForLeg(group, branchRules, leg);
      if (!codes.length) continue;
      const active = (group.parentPath || []).every(parent => signatures[pos].get(String(parent.groupId)) === parent.code);
      if (!active) continue;
      const occurrence = activeCounts.get(groupId) || 0;
      const branchIndex = positiveModulo((offset.values[index] || 0) + (blockShift.values[index] || 0) + occurrence, codes.length);
      signatures[pos].set(groupId, codes[branchIndex]);
      activeCounts.set(groupId, occurrence + 1);
    }
  }

  return signatures;
}

function findRelayVariationForSignature(decoratedVariations, signature) {
  return decoratedVariations.find(candidate => relaySignatureMatches(candidate.signature, signature))?.variation || null;
}

function relaySignatureKey(signature) {
  return [...signature.entries()].map(([groupId, code]) => `${groupId}:${code}`).join("|");
}

function pickRelayVariation(decoratedVariations, branchRules, teamIndex, leg, legs, branchGroups = []) {
  if (!decoratedVariations.length) return null;
  const desired = desiredRelaySignature(branchGroups, branchRules, teamIndex, leg, legs);
  const fixed = fixedRelaySignature(branchGroups, branchRules, leg);
  if (relaySignatureIsImpossible(desired) || relaySignatureIsImpossible(fixed)) return null;
  const constraints = new Map(desired);
  for (const [groupId, code] of fixed) constraints.set(groupId, code);

  const constrained = decoratedVariations.filter(candidate => relaySignatureMatches(candidate.signature, constraints));
  if (constrained.length) {
    return constrained[positiveModulo(teamIndex + leg - 1, constrained.length)].variation;
  }

  const fixedOnly = decoratedVariations.filter(candidate => relaySignatureMatches(candidate.signature, fixed));
  if (fixedOnly.length) {
    return fixedOnly[positiveModulo(teamIndex * legs + leg - 1, fixedOnly.length)].variation;
  }

  const desiredOnly = decoratedVariations.filter(candidate => relaySignatureMatches(candidate.signature, desired));
  if (desiredOnly.length) {
    return desiredOnly[positiveModulo(teamIndex + leg - 1, desiredOnly.length)].variation;
  }

  return decoratedVariations[positiveModulo(teamIndex * legs + (leg - 1) + teamIndex, decoratedVariations.length)].variation;
}

function decorateRelayVariations(variations, branchGroups) {
  return variations.map(variation => ({
    variation,
    signature: relayVariationSignature(variation, branchGroups)
  }));
}

function relayVariationSignature(variation, branchGroups) {
  const choices = (variation?.choices || []).map(Number);
  const signature = new Map();
  for (const group of branchGroups) {
    if (!group.branchIds?.length) continue;
    const indexedBranches = group.branchIds
      .map((branchId, index) => ({
        branchId: Number(branchId),
        code: group.codes[index],
        choiceIndex: choices.indexOf(Number(branchId))
      }))
      .filter(item => item.code && item.choiceIndex >= 0);
    if (!indexedBranches.length) continue;
    const selected = group.kind === "loop"
      ? indexedBranches.sort((a, b) => a.choiceIndex - b.choiceIndex)[0]
      : indexedBranches[0];
    if (selected?.code) signature.set(String(group.groupId), selected.code);
  }
  return signature;
}

function desiredRelaySignature(branchGroups, branchRules, teamIndex, leg, legs) {
  const desired = new Map();
  const legCount = Math.max(1, Number(legs) || 1);
  const legIndex = positiveModulo((Math.max(1, Number(leg) || 1) - 1) + Math.max(0, Number(teamIndex) || 0), legCount);
  for (const group of branchGroups) {
    const codes = relayEligibleCodesForLeg(group, branchRules, Math.max(1, Number(leg) || 1));
    if (!codes.length) {
      if ((group.codes || []).some(code => branchRules.has(String(code)))) {
        desired.set(String(group.groupId), IMPOSSIBLE_BRANCH_CODE);
      }
      continue;
    }
    if (codes.length <= 1 && !(group.codes || []).some(code => branchRules.has(String(code)))) continue;
    const active = (group.parentPath || []).every(parent => desired.get(String(parent.groupId)) === parent.code);
    if (!active) continue;
    const contextDenominator = Math.max(1, Number(group.contextDenominator) || 1);
    const cycleIndex = Math.floor(legIndex / contextDenominator);
    const code = codes[positiveModulo(cycleIndex, codes.length)];
    if (code) desired.set(String(group.groupId), code);
  }
  return desired;
}

function fixedRelaySignature(branchGroups, branchRules, leg) {
  const signature = new Map();
  for (const group of branchGroups || []) {
    const hasRule = (group.codes || []).some(code => branchRules.has(String(code)));
    if (!hasRule) continue;
    const eligibleCodes = relayEligibleCodesForLeg(group, branchRules, leg);
    if (!eligibleCodes.length) {
      signature.set(String(group.groupId), IMPOSSIBLE_BRANCH_CODE);
    }
    else if (eligibleCodes.length === 1) {
      signature.set(String(group.groupId), eligibleCodes[0]);
    }
  }
  return signature;
}

function relaySignatureMatches(signature, constraints) {
  for (const [groupId, code] of constraints) {
    if (code === IMPOSSIBLE_BRANCH_CODE) return false;
    if (signature.get(String(groupId)) !== code) return false;
  }
  return true;
}

function relaySignatureIsImpossible(signature) {
  return [...signature.values()].includes(IMPOSSIBLE_BRANCH_CODE);
}

function relayBranchRuleMap(branchSettings = [], maxLegs = Infinity) {
  const map = new Map();
  for (const setting of branchSettings || []) {
    const code = String(setting.branch || "").trim();
    if (!code) continue;
    const legs = relayBranchAllowedLegs(branchSettings, code, maxLegs);
    if (legs.length) map.set(code, new Set(legs));
  }
  return map;
}

function relayEligibleCodesForLeg(group, branchRules, leg) {
  const codes = (group.codes || []).map(code => String(code || "").trim()).filter(Boolean);
  if (!codes.length) return [];
  const hasRule = codes.some(code => branchRules.has(code));
  if (!hasRule) return codes;
  return codes.filter(code => branchRules.get(code)?.has(Number(leg)));
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
