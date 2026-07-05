import { courseLength, courseView, formatLength, getCourse, sortedCourses } from "./course-service.js?v=20260706-6";
import { relayAssignments, relayLegName, relayVariationForLeg, variationDisplayLabel, variationForCode } from "./relay-variations.js?v=20260706-6";

export const BUILTIN_CONSTANTS = Object.freeze([
  { name: "\\event", description: "Event name" },
  { name: "\\course", description: "Course name" },
  { name: "\\group", description: "Class / group" },
  { name: "\\len", description: "Course length", unit: "m" },
  { name: "\\climb", description: "Climb", unit: "m" },
  { name: "\\controls", description: "Number of controls" },
  { name: "\\mapscale", description: "Map scale" },
  { name: "\\team", description: "Team name / number" },
  { name: "\\teamno", description: "Team number" },
  { name: "\\leg", description: "Relay leg" },
  { name: "\\variation", description: "Variation" }
]);

export function ensureEventConstants(eventModel) {
  eventModel.event ||= {};
  if (!Array.isArray(eventModel.event.constants)) {
    eventModel.event.constants = [];
  }
  eventModel.event.constants = normalizeCustomConstants(eventModel.event.constants);
  return eventModel.event.constants;
}

export function normalizeConstantName(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  const withoutSlash = raw.startsWith("\\") ? raw.slice(1) : raw;
  const cleaned = withoutSlash.replace(/[^A-Za-z0-9_\-]/g, "");
  return cleaned ? `\\${cleaned}` : "";
}

export function normalizeCustomConstants(constants = []) {
  const seen = new Set();
  const rows = [];
  for (const constant of constants || []) {
    const name = normalizeConstantName(constant?.name);
    if (!name || seen.has(name.toLowerCase())) continue;
    seen.add(name.toLowerCase());
    rows.push({
      name,
      description: String(constant?.description || ""),
      expression: String(constant?.expression ?? constant?.value ?? "")
    });
  }
  return rows;
}

export function addCustomConstant(eventModel) {
  const constants = ensureEventConstants(eventModel);
  let index = constants.length + 1;
  let name = `\\custom${index}`;
  const names = new Set(constants.map(item => String(item.name).toLowerCase()));
  while (names.has(name.toLowerCase()) || isBuiltinConstantName(name)) {
    index += 1;
    name = `\\custom${index}`;
  }
  constants.push({ name, description: "", expression: "" });
}

export function removeCustomConstant(eventModel, index) {
  const constants = ensureEventConstants(eventModel);
  const safeIndex = Number(index);
  if (Number.isInteger(safeIndex) && safeIndex >= 0 && safeIndex < constants.length) {
    constants.splice(safeIndex, 1);
  }
}

export function updateCustomConstant(eventModel, index, field, value) {
  const constants = ensureEventConstants(eventModel);
  const safeIndex = Number(index);
  if (!Number.isInteger(safeIndex) || safeIndex < 0 || safeIndex >= constants.length) return;
  const constant = constants[safeIndex];
  if (field === "name") {
    constant.name = normalizeConstantName(value);
  }
  else if (field === "description") {
    constant.description = String(value || "");
  }
  else if (field === "expression") {
    constant.expression = String(value || "");
  }
  eventModel.event.constants = normalizeCustomConstants(constants);
}

export function constantRowsForView(eventModel, ui = {}) {
  const builtins = builtinConstantsForView(eventModel, ui);
  const resolved = resolveConstantMap(eventModel, ui);
  const custom = normalizeCustomConstants(eventModel?.event?.constants || []).map(constant => ({
    ...constant,
    builtin: false,
    value: resolved.get(constant.name)?.display || "",
    unit: ""
  }));
  return { builtins, custom };
}

export function resolveTextConstants(text, eventModel, ui = {}) {
  const input = String(text ?? "");
  if (!input.includes("\\")) return input;
  const resolved = resolveConstantMap(eventModel, ui);
  const names = [...resolved.keys()].sort((a, b) => b.length - a.length);
  let output = input;
  for (const name of names) {
    output = output.split(name).join(resolved.get(name)?.display ?? "");
  }
  return output;
}

export function resolveConstantMap(eventModel, ui = {}) {
  const map = new Map();
  for (const row of builtinConstantsForView(eventModel, ui)) {
    map.set(row.name, { display: String(row.value ?? ""), raw: row.raw ?? row.value ?? "" });
  }
  const custom = normalizeCustomConstants(eventModel?.event?.constants || []);
  const resolving = new Set();
  const byName = new Map(custom.map(row => [row.name, row]));
  const resolveCustom = constant => {
    const key = constant.name;
    if (map.has(key) && !byName.has(key)) return map.get(key);
    if (resolving.has(key)) {
      return { display: "#cycle", raw: "#cycle" };
    }
    resolving.add(key);
    const value = evaluateConstantExpression(constant.expression, map, byName, resolveCustom);
    resolving.delete(key);
    map.set(key, value);
    return value;
  };
  for (const constant of custom) {
    if (isBuiltinConstantName(constant.name)) continue;
    resolveCustom(constant);
  }
  return map;
}

export function builtinConstantsForView(eventModel, ui = {}) {
  const selectedCourseId = ui?.selectedCourseId || "all";
  const courses = sortedCourses(eventModel || {});
  const course = selectedCourseId === "all" ? null : getCourse(eventModel, selectedCourseId);
  const selectedCourses = course ? [course] : courses;
  const displayOptions = course ? courseDisplayOptionsForConstants(eventModel, ui) : {};
  const lengthValues = selectedCourses.map(item => courseLength(eventModel, item.id, course && item.id === course.id ? displayOptions : {})).filter(Number.isFinite);
  const controlCounts = selectedCourses.map(item => courseView(eventModel, item.id, course && item.id === course.id ? displayOptions : {}).length).filter(Number.isFinite);
  const climbs = selectedCourses.map(item => Number(item.options?.climb)).filter(value => Number.isFinite(value) && value >= 0);
  const courseName = course ? course.name : rangeText(courses.map(item => item.name));
  const groupName = course ? (course.secondaryTitle || "") : rangeText(courses.map(item => item.secondaryTitle).filter(Boolean));
  const variation = course ? variationDisplayLabel(eventModel, course.id, ui) : "";
  const relayConstants = course ? relayConstantsForView(eventModel, course, ui) : { team: "", teamNumber: "", teamNumberRaw: "", leg: "", legRaw: "" };
  const lenValue = rangeNumberText(lengthValues, value => formatLength(value));
  const lenRaw = lengthValues.length === 1 ? roundNumber(lengthValues[0]) : rangeNumberText(lengthValues, value => String(roundNumber(value)));
  const controlsValue = rangeNumberText(controlCounts, value => String(value));
  const controlsRaw = controlCounts.length === 1 ? controlCounts[0] : controlsValue;
  const climbValue = climbs.length ? rangeNumberText(climbs, value => `${roundNumber(value)} m`) : "";
  const climbRaw = climbs.length === 1 ? roundNumber(climbs[0]) : rangeNumberText(climbs, value => String(roundNumber(value)));

  return [
    constantRow("\\event", "Event name", eventModel?.event?.title || "", eventModel?.event?.title || ""),
    constantRow("\\course", "Course name", courseName, courseName),
    constantRow("\\group", "Class / group", groupName, groupName),
    constantRow("\\len", "Course length", lenValue, lenRaw, "m"),
    constantRow("\\climb", "Climb", climbValue, climbRaw, "m"),
    constantRow("\\controls", "Number of controls", controlsValue, controlsRaw),
    constantRow("\\mapscale", "Map scale", mapScaleText(eventModel), Number(eventModel?.event?.map?.scale) || ""),
    constantRow("\\team", "Team name / number", relayConstants.team, relayConstants.team),
    constantRow("\\teamno", "Team number", relayConstants.teamNumber, relayConstants.teamNumberRaw),
    constantRow("\\leg", "Relay leg", relayConstants.leg, relayConstants.legRaw),
    constantRow("\\variation", "Variation", variation || "", variation || "")
  ];
}

function evaluateConstantExpression(expression, map, customByName, resolveCustom) {
  const source = String(expression || "");
  if (!source.trim()) return { display: "", raw: "" };
  const names = [...new Set([...map.keys(), ...customByName.keys()])].sort((a, b) => b.length - a.length);
  let rawExpression = source;
  let displayExpression = source;
  for (const name of names) {
    const value = map.get(name) || (customByName.has(name) ? resolveCustom(customByName.get(name)) : null);
    if (!value) continue;
    rawExpression = rawExpression.split(name).join(String(value.raw ?? value.display ?? ""));
    displayExpression = displayExpression.split(name).join(String(value.display ?? value.raw ?? ""));
  }
  const numeric = evaluateNumericExpression(rawExpression);
  if (numeric !== null) {
    const value = roundNumber(numeric);
    return { display: String(value), raw: value };
  }
  return { display: displayExpression, raw: displayExpression };
}

function evaluateNumericExpression(expression) {
  const text = String(expression || "").trim();
  if (!text || /[^0-9+\-*/(). %]/.test(text)) return null;
  try {
    // The regexp above limits this to numeric arithmetic only.
    const value = Function(`"use strict"; return (${text.replace(/%/g, "/100")});`)();
    return Number.isFinite(value) ? value : null;
  }
  catch {
    return null;
  }
}

function courseDisplayOptionsForConstants(eventModel, ui = {}) {
  const courseId = ui.selectedCourseId;
  if (!courseId || courseId === "all") return {};
  if (ui.variationMode === "all") return { allBranches: true };
  if (ui.variationMode === "variation") {
    const variation = variationForCode(eventModel, courseId, ui.variationCode);
    return variation ? { variationChoices: variation.choices } : {};
  }
  if (ui.variationMode === "relay") {
    const variation = relayVariationForLeg(eventModel, courseId, ui.relayTeam, ui.relayLeg);
    return variation ? { variationChoices: variation.choices } : {};
  }
  return {};
}

function relayConstantsForView(eventModel, course, ui = {}) {
  const relay = course?.relay || {};
  const teams = Math.max(0, Math.round(Number(relay.teams) || 0));
  const legs = Math.max(1, Math.round(Number(relay.legs) || 1));
  const firstTeam = Math.max(1, Math.round(Number(relay.firstTeam) || 1));
  const hasRelaySettings = teams > 0 || legs > 1 || String(relay.teamPrefix || "") || Number(relay.teamDigits) > 0 || Array.isArray(relay.legNames);
  if (!course || !hasRelaySettings) {
    return { team: "", teamNumber: "", teamNumberRaw: "", leg: "", legRaw: "" };
  }

  const showAllRelayBranches = ui.variationMode === "all";

  if (!showAllRelayBranches) {
    const current = relayEntryForConstantView(eventModel, course, ui);
    if (!current) {
      return { team: "", teamNumber: "", teamNumberRaw: "", leg: "", legRaw: "" };
    }
    const teamNumberText = String(current.team);
    return {
      team: relayTeamLabel(relay, current.team),
      teamNumber: teamNumberText,
      teamNumberRaw: current.team,
      leg: relayLegName(relay, current.leg),
      legRaw: current.leg
    };
  }

  const lastTeam = teams > 0 ? firstTeam + teams - 1 : firstTeam;
  const teamRange = firstTeam === lastTeam
    ? relayTeamLabel(relay, firstTeam)
    : `${relayTeamLabel(relay, firstTeam)} – ${relayTeamLabel(relay, lastTeam)}`;
  const teamNumberRange = firstTeam === lastTeam ? String(firstTeam) : `${firstTeam} – ${lastTeam}`;
  const legRange = legs <= 1
    ? relayLegName(relay, 1)
    : `${relayLegName(relay, 1)} – ${relayLegName(relay, legs)}`;

  return {
    team: teamRange,
    teamNumber: teamNumberRange,
    teamNumberRaw: firstTeam === lastTeam ? firstTeam : teamNumberRange,
    leg: legRange,
    legRaw: legs <= 1 ? 1 : legRange
  };
}

function relayEntryForConstantView(eventModel, course, ui = {}) {
  const relay = course?.relay || {};
  const teams = Math.max(0, Math.round(Number(relay.teams) || 0));
  const legs = Math.max(1, Math.round(Number(relay.legs) || 1));
  const firstTeam = Math.max(1, Math.round(Number(relay.firstTeam) || 1));
  const lastTeam = teams > 0 ? firstTeam + teams - 1 : firstTeam;

  if (ui.variationMode === "relay") {
    return {
      team: clampInteger(Number(ui.relayTeam) || firstTeam, firstTeam, lastTeam),
      leg: clampInteger(Number(ui.relayLeg) || 1, 1, legs)
    };
  }

  if (ui.variationMode === "variation" && ui.variationCode) {
    const entry = relayAssignments(eventModel, course.id)
      .entries
      .find(candidate => String(candidate.variation?.code || "") === String(ui.variationCode || ""));
    if (entry) {
      return {
        team: clampInteger(Number(entry.team) || firstTeam, firstTeam, lastTeam),
        leg: clampInteger(Number(entry.leg) || 1, 1, legs)
      };
    }
  }

  const hasExplicitTeam = ui.relayTeam !== undefined && ui.relayTeam !== null && String(ui.relayTeam) !== "";
  const hasExplicitLeg = ui.relayLeg !== undefined && ui.relayLeg !== null && String(ui.relayLeg) !== "";
  if (hasExplicitTeam || hasExplicitLeg) {
    return {
      team: clampInteger(Number(ui.relayTeam) || firstTeam, firstTeam, lastTeam),
      leg: clampInteger(Number(ui.relayLeg) || 1, 1, legs)
    };
  }

  return null;
}

function relayTeamLabel(relay = {}, team) {
  const teamNumber = Math.max(1, Math.round(Number(team) || 1));
  const digits = Math.max(0, Math.min(8, Math.round(Number(relay.teamDigits) || 0)));
  const prefix = String(relay.teamPrefix || "");
  return `${prefix}${digits ? String(teamNumber).padStart(digits, "0") : String(teamNumber)}`;
}

function clampInteger(value, min, max) {
  const number = Math.round(Number(value) || min);
  return Math.min(Math.max(number, min), Math.max(min, max));
}

function constantRow(name, description, value, raw = value, unit = "") {
  return { name, description, value: String(value ?? ""), raw, unit, builtin: true };
}

function isBuiltinConstantName(name) {
  return BUILTIN_CONSTANTS.some(item => item.name.toLowerCase() === String(name || "").toLowerCase());
}

function mapScaleText(eventModel) {
  const scale = Number(eventModel?.event?.map?.scale) || 0;
  return scale > 0 ? `1:${Math.round(scale)}` : "";
}

function rangeText(values) {
  const unique = [...new Set((values || []).map(value => String(value || "").trim()).filter(Boolean))];
  if (!unique.length) return "";
  if (unique.length <= 3) return unique.join(" / ");
  return `${unique[0]} … ${unique[unique.length - 1]}`;
}

function rangeNumberText(values, formatter) {
  const nums = (values || []).map(Number).filter(Number.isFinite);
  if (!nums.length) return "";
  const min = Math.min(...nums);
  const max = Math.max(...nums);
  if (Math.abs(min - max) < 1e-9) return formatter(roundNumber(min));
  return `${formatter(roundNumber(min))} – ${formatter(roundNumber(max))}`;
}

function roundNumber(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return "";
  if (Math.abs(number) >= 100) return Math.round(number);
  return Math.round(number * 100) / 100;
}
