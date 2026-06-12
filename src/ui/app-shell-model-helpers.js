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
import { escapeAttr, escapeHtml } from "./app-shell-ui-helpers.js";
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
import { safeFilePart } from "./app-shell-pdf-helpers.js";
import { pdfDataUrlLooksLikePdf } from "./app-shell-resource-helpers.js";

export function teamAddControlRoleFromSelection(eventModel, ui, selection) {
  const courseId = ui?.selectedCourseId;
  if (!courseId || courseId === "all" || !selection) return null;
  const course = getCourse(eventModel, courseId);
  if (course?.kind !== "team") return null;
  let courseControl = null;
  const candidateIds = [];
  if (selection.courseControl) candidateIds.push(Number(selection.courseControl));
  if (Array.isArray(selection.courseControls)) {
    candidateIds.push(...selection.courseControls.map(Number));
  }
  for (const id of candidateIds) {
    const candidate = getCourseControl(eventModel, id);
    if (candidate?.control) {
      courseControl = candidate;
      break;
    }
  }
  if (!courseControl && (selection.type === "control" || selection.type === "control-number")) {
    const controlId = Number(selection.id || selection.control) || 0;
    if (controlId) {
      const row = courseView(eventModel, courseId, { allBranches: true })
        .find(candidate => Number(candidate.control?.id) === controlId && candidate.courseControl);
      courseControl = row?.courseControl || null;
    }
  }
  if (!courseControl) return null;
  return isTeamFreeCourseControl(course, courseControl) ? "free" : "mandatory";
}

export function objectForSelection(model, selection) {
  if (selection.type === "control") return getControl(model, selection.id);
  if (selection.type === "course") return getCourse(model, selection.id);
  if (selection.type === "special") return findById(model.specials, selection.id);
  if (selection.type === "leg" || selection.type === "leg-bend") return findLeg(model, selection.startControl, selection.endControl);
  if (selection.type === "control-number") return getCourseControl(model, selection.courseControl);
  return null;
}

export function teamCourseDescriptionPanelRows(rows, course) {
  const mandatory = [];
  const free = [];
  for (const row of rows || []) {
    if (row.control?.kind === "normal" && isTeamFreeCourseControl(course, row.courseControl)) {
      free.push(row);
    }
    else {
      mandatory.push(row);
    }
  }
  return [...mandatory, ...scoreCourseDescriptionRows(free)];
}

export function courseDisplayOptions(eventModel, ui = {}) {
  const courseId = ui.selectedCourseId;
  if (!courseId || courseId === "all") return {};
  if (ui.variationMode === "all") return { allBranches: true };
  if (ui.variationMode === "variation") {
    const variation = variationForCode(eventModel, courseId, ui.variationCode);
    return variation ? { variationChoices: variation.choices } : {};
  }
  if (ui.variationMode === "relay") {
    const variation = relayVariationForLeg(eventModel, courseId, ui.relayTeam, ui.relayLeg);
    const course = getCourse(eventModel, courseId);
    return variation ? {
      variationChoices: variation.choices,
      relayLabel: relayEntryLabel(course?.relay || {}, ui.relayTeam, ui.relayLeg)
    } : {};
  }
  return {};
}

export function safeCachedUi(ui = {}) {
  return {
    selectedCourseId: ui.selectedCourseId || "all",
    zoom: Number.isFinite(Number(ui.zoom)) ? Number(ui.zoom) : 1,
    pan: {
      x: Number(ui.pan?.x) || 0,
      y: Number(ui.pan?.y) || 0
    },
    mapIntensity: Number.isFinite(Number(ui.mapIntensity)) ? Number(ui.mapIntensity) : 0.65,
    highQuality: ui.highQuality !== false,
    showPrintArea: !!ui.showPrintArea,
    showAllControls: (ui.selectedCourseId || "all") === "all",
    variationMode: ui.variationMode || "default",
    variationCode: ui.variationCode || "",
    variationAddKind: ui.variationAddKind === "loop" ? "loop" : "fork",
    variationAddBranches: Math.max(2, Math.min(6, Math.round(Number(ui.variationAddBranches) || 2))),
    variationAnchorCourseControl: Number(ui.variationAnchorCourseControl) || null,
    variationInsertAfterCourseControl: Number(ui.variationInsertAfterCourseControl) || null,
    variationInsertBeforeCourseControl: Number(ui.variationInsertBeforeCourseControl) || null,
    variationSelectedSegment: ui.variationSelectedSegment || "",
    variationBranch: ui.variationBranch ? {
      forkCourseControl: Number(ui.variationBranch.forkCourseControl) || null,
      branchCourseControl: Number(ui.variationBranch.branchCourseControl) || null
    } : null,
    relayTeam: Math.max(1, Number(ui.relayTeam) || 1),
    relayLeg: Math.max(1, Number(ui.relayLeg) || 1)
  };
}

export function applyImportedMapScale(model, scale) {
  const previousScale = positiveScale(model.event?.map?.scale) || 15000;
  applyMapScale(model, scale, previousScale);
}

export function applyMapScale(model, scale, previousScale = positiveScale(model.event?.map?.scale) || 15000) {
  const nextScale = positiveScale(scale);
  if (!nextScale) return;
  model.event.map.scale = nextScale;
  if (!model.event.allControls) {
    model.event.allControls = {};
  }
  if (!positiveScale(model.event.allControls.printScale) || nearlySameScale(model.event.allControls.printScale, previousScale)) {
    model.event.allControls.printScale = nextScale;
  }
  for (const course of model.courses || []) {
    if (!course.options) course.options = {};
    if (!positiveScale(course.options.printScale) || nearlySameScale(course.options.printScale, previousScale)) {
      course.options.printScale = nextScale;
    }
  }
}

export function specialCategory(kind) {
  if (["first-aid", "water", "optional-crossing-point", "forbidden-route", "registration-mark"].includes(kind)) return "point";
  if (["line", "boundary"].includes(kind)) return "line";
  if (["out-of-bounds", "dangerous-area", "temporary-construction", "white-out"].includes(kind)) return "area";
  if (kind === "text") return "text";
  if (kind === "rectangle") return "rectangle";
  if (kind === "ellipse") return "ellipse";
  if (kind === "descriptions") return "descriptions";
  if (kind === "image") return "image";
  return "point";
}

export function specialFontHeight(special) {
  const value = Number(special.font?.height);
  return value > 0 ? value : DEFAULT_TEXT_FONT_HEIGHT;
}

export function fontOptions(selectedFont) {
  const selected = FONT_CHOICES.includes(selectedFont) ? selectedFont : "Arial";
  return FONT_CHOICES
    .map(font => `<option value="${escapeAttr(font)}" ${font === selected ? "selected" : ""}>${escapeHtml(font)}</option>`)
    .join("");
}

export function isCustomSpecialColor(color) {
  const normalized = LEGACY_COLOR_ALIASES[color] || color;
  return !SPECIAL_COLOR_CHOICES.some(([value]) => value !== "custom" && value === normalized);
}

export function colorChoiceSelected(choice, current) {
  const normalized = LEGACY_COLOR_ALIASES[current] || current;
  return choice === normalized;
}

export function colorChoiceLabel(value, label) {
  return t(label || value);
}

export function normalizeHexColor(value) {
  const text = String(value || "").trim();
  const short = text.match(/^#([0-9a-f]{3})$/i);
  if (short) {
    return `#${short[1].split("").map(char => char + char).join("")}`.toLowerCase();
  }
  return /^#[0-9a-f]{6}$/i.test(text) ? text.toLowerCase() : null;
}

export function normalizeColorValue(value) {
  const text = String(value || "").trim();
  if (text === "upper-purple" || text === "lower-purple") return text;
  return normalizeHexColor(text) || normalizeHexColor(LEGACY_COLOR_ALIASES[text]) || null;
}

export function colorToHex(value) {
  const normalized = normalizeColorValue(value);
  if (normalized === "upper-purple" || normalized === "lower-purple") return "#a626ff";
  return normalized || "#000000";
}

export function syncColorControls(root, color, scope) {
  if (!root) return;
  const normalized = normalizeColorValue(color);
  if (!normalized) return;
  const hex = colorToHex(normalized);
  const picker = root.querySelector(scope === "dialog" ? "[data-dialog-color-picker]" : "[data-special-color-picker]");
  const hexInput = root.querySelector(scope === "dialog" ? "[data-dialog-color-value]" : "[data-special-color-hex]");
  if (picker) picker.value = hex;
  if (hexInput) hexInput.value = hex;
  root.querySelectorAll(scope === "dialog" ? "[data-dialog-color]" : "[data-special-color]").forEach(button => {
    const buttonColor = button.dataset.dialogColor || button.dataset.specialColor || "";
    button.classList.toggle("selected", colorChoiceSelected(buttonColor, normalized));
  });
}

export function resizedSpecialObject(eventModel, special, resize, point, selectedCourseId = "all", displayOptions = {}) {
  if (special.kind === "descriptions") {
    return resizedDescriptionSpecial(eventModel, special, resize.anchor || resize, point, selectedCourseId, displayOptions);
  }
  const replacement = structuredClone(special);
  if (special.kind === "text" && resize.handle === "resize-text-font") {
    const anchor = resize.anchor || replacement.locations?.[0];
    if (!anchor) return replacement;
    const desiredWidth = Math.max(1, point.x - anchor.x);
    const desiredHeight = Math.max(1, anchor.y - point.y);
    replacement.font ||= { name: "Arial", bold: false, italic: false, height: DEFAULT_TEXT_FONT_HEIGHT };
    replacement.font.height = resizedTextFontHeight(replacement, desiredWidth, desiredHeight);
    replacement.locations = [{ x: anchor.x, y: anchor.y }];
    return replacement;
  }
  const locations = (replacement.locations || []).map(location => ({ x: location.x, y: location.y }));
  if (resize.handle?.startsWith("point-")) {
    const index = Number(resize.pointIndex);
    if (Number.isInteger(index) && index >= 0 && index < locations.length) {
      locations[index] = { x: point.x, y: point.y };
      replacement.locations = locations;
    }
    return replacement;
  }
  if (resize.anchor) {
    replacement.locations = [
      { x: resize.anchor.x, y: resize.anchor.y },
      { x: point.x, y: point.y }
    ];
  }
  return replacement;
}

export function resizedTextFontHeight(special, desiredWidth, desiredHeight) {
  const lines = String(special.text || "Text").split(/\r?\n/);
  const lineCount = Math.max(1, lines.length);
  const maxLineLen = Math.max(1, ...lines.map(line => line.length || 1));
  const heightSize = desiredHeight / (lineCount * 1.15);
  const widthSize = desiredWidth / (maxLineLen * 0.62);
  return Math.max(0.5, Math.min(72, Math.min(heightSize, widthSize)));
}

export function positiveScale(value) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : null;
}

export function positiveNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : fallback;
}

export function backgroundMetadataForImage(file, url, image, eventModel) {
  const naturalWidth = image.naturalWidth || image.width || 1;
  const naturalHeight = image.naturalHeight || image.height || 1;
  const aspect = Math.max(0.0001, naturalHeight / naturalWidth);
  const bounds = eventBoundsForBackground(eventModel);
  const widthMeters = Math.max(50, bounds.width || 200);
  const mapScale = positiveScale(eventModel.event?.map?.scale) || 15000;
  return {
    name: file.name,
    url,
    type: file.type,
    sourceKind: "image",
    naturalWidth,
    naturalHeight,
    centerX: 0,
    centerY: 0,
    widthMeters,
    heightMeters: widthMeters * aspect,
    printedWidthCm: widthMeters / mapScale * 100,
    calibration: { imagePoints: [] }
  };
}

export function backgroundMetadataForPdf(file, rendered, image, eventModel) {
  const metadata = backgroundMetadataForImage({
    name: file.name,
    type: "application/pdf"
  }, rendered.url, image, eventModel);
  metadata.sourceKind = "pdf";
  metadata.pdf = {
    pageNumber: rendered.pageNumber,
    pageCount: rendered.pageCount,
    renderDpi: rendered.renderDpi,
    renderScale: rendered.renderScale,
    sourceWidthPt: rendered.sourceWidthPt,
    sourceHeightPt: rendered.sourceHeightPt,
    cacheKey: pdfBasemapCacheKey(file, rendered),
    sourceDataUrl: rendered.sourceDataUrl || null
  };
  return metadata;
}

export function pdfBasemapCacheKey(file, rendered) {
  const name = safeFilePart(file?.name || "map");
  const size = Number(file?.size || 0);
  const modified = Number(file?.lastModified || 0);
  const page = Number(rendered?.pageNumber || 1);
  return `pdf:${name}:${size}:${modified}:p${page}`;
}

export async function cachePdfBasemapSource(background) {
  const key = background?.pdf?.cacheKey;
  const sourceDataUrl = background?.pdf?.sourceDataUrl;
  if (!key || !pdfDataUrlLooksLikePdf(sourceDataUrl)) return;
  await saveCachedPdfBasemap(key, sourceDataUrl);
}

export function ensurePdfBasemapCacheKey(background) {
  if (background?.sourceKind !== "pdf" || !background.pdf || background.pdf.cacheKey) return background || null;
  if (!pdfDataUrlLooksLikePdf(background.pdf.sourceDataUrl)) return background;
  const page = Number(background.pdf.pageNumber || 1);
  return {
    ...background,
    pdf: {
      ...background.pdf,
      cacheKey: `pdf:${safeFilePart(background.name || "map")}:${background.pdf.sourceDataUrl.length}:p${page}`
    }
  };
}

export function backgroundForSessionCache(background) {
  if (!background?.pdf?.cacheKey) return background || null;
  return {
    ...background,
    pdf: {
      ...background.pdf,
      sourceDataUrl: null
    }
  };
}

export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Could not load rendered PDF image."));
    image.src = url;
  });
}

export function backgroundAspect(background) {
  const width = positiveNumber(background?.naturalWidth, 1);
  const height = positiveNumber(background?.naturalHeight, 1);
  return Math.max(0.0001, height / width);
}

export function applyBackgroundCalibration(background, aspect) {
  if (!(background?.calibrationDistanceMeters > 0)) return;
  const currentDistance = backgroundCalibrationDistance(background);
  if (!(currentDistance > 0)) return;
  const beforeCenter = backgroundCalibrationAnchorCenter(background);
  background.calibration ||= {};
  background.calibration.baseWidthMeters ||= positiveNumber(background.widthMeters, 200);
  background.calibration.baseDistanceMeters ||= currentDistance;
  background.calibration.basePrintedWidthCm ||= positiveNumber(background.printedWidthCm, 0);
  const factor = background.calibrationDistanceMeters / background.calibration.baseDistanceMeters;
  background.widthMeters = background.calibration.baseWidthMeters * factor;
  background.heightMeters = background.widthMeters * aspect;
  if (background.calibration.basePrintedWidthCm > 0) {
    background.printedWidthCm = background.calibration.basePrintedWidthCm * factor;
  }
  const afterCenter = backgroundCalibrationAnchorCenter(background);
  if (beforeCenter && afterCenter) {
    background.centerX = (Number(background.centerX) || 0) + beforeCenter.x - afterCenter.x;
    background.centerY = (Number(background.centerY) || 0) + beforeCenter.y - afterCenter.y;
  }
}

export function resetBackgroundCalibrationBase(background) {
  if (!background?.calibration) return;
  delete background.calibration.baseWidthMeters;
  delete background.calibration.baseDistanceMeters;
  delete background.calibration.basePrintedWidthCm;
}

export function backgroundBoundsForMetadata(background) {
  const aspect = backgroundAspect(background);
  const width = positiveNumber(background?.widthMeters, 200);
  const height = positiveNumber(background?.heightMeters, width * aspect);
  const centerX = Number(background?.centerX) || 0;
  const centerY = Number(background?.centerY) || 0;
  return {
    left: centerX - width / 2,
    right: centerX + width / 2,
    top: centerY + height / 2,
    bottom: centerY - height / 2,
    width,
    height
  };
}

export function backgroundImagePointForMap(background, point) {
  const bounds = backgroundBoundsForMetadata(background);
  return {
    x: clamp((point.x - bounds.left) / bounds.width, 0, 1),
    y: clamp((bounds.top - point.y) / bounds.height, 0, 1)
  };
}

export function backgroundMapPointForImage(background, point) {
  const bounds = backgroundBoundsForMetadata(background);
  return {
    x: bounds.left + point.x * bounds.width,
    y: bounds.top - point.y * bounds.height
  };
}

export function backgroundCalibrationMapPoints(background) {
  const imagePoints = background?.calibration?.imagePoints || [];
  if (imagePoints.length) {
    return imagePoints.map(point => backgroundMapPointForImage(background, point));
  }
  return background?.calibration?.points || [];
}

export function backgroundCalibrationAnchorCenter(background) {
  const points = backgroundCalibrationMapPoints(background);
  if (points.length < 2) return null;
  return {
    x: (points[0].x + points[1].x) / 2,
    y: (points[0].y + points[1].y) / 2
  };
}

export function backgroundCalibrationDistance(background) {
  const imagePoints = background?.calibration?.imagePoints || [];
  if (imagePoints.length >= 2) {
    const bounds = backgroundBoundsForMetadata(background);
    const dx = (imagePoints[1].x - imagePoints[0].x) * bounds.width;
    const dy = (imagePoints[1].y - imagePoints[0].y) * bounds.height;
    return Math.hypot(dx, dy);
  }
  const points = background?.calibration?.points || [];
  return points.length >= 2 ? distance(points[0], points[1]) : 0;
}

export function eventBoundsForBackground(eventModel) {
  const controls = eventModel.controls || [];
  if (!controls.length) return { width: 200, height: 200 };
  let left = Infinity;
  let right = -Infinity;
  let top = -Infinity;
  let bottom = Infinity;
  for (const control of controls) {
    left = Math.min(left, control.location.x);
    right = Math.max(right, control.location.x);
    top = Math.max(top, control.location.y);
    bottom = Math.min(bottom, control.location.y);
  }
  return { width: Math.max(200, right - left), height: Math.max(200, top - bottom) };
}

export function formatInputNumber(value) {
  if (value === "" || value === null || value === undefined) return "";
  const number = Number(value);
  return Number.isFinite(number) ? String(Number(number.toFixed(3))) : "";
}

export function nearlySameScale(a, b) {
  return Math.abs(Number(a) - Number(b)) < 0.001;
}

export function setControlNumberLocation(model, selection, location) {
  const courseControls = selectedNumberCourseControls(model, selection);
  const control = getControl(model, courseControls[0]?.control || selection?.control);
  if (!courseControls.length || !control) return;
  const numberLocation = {
    x: location.x - control.location.x,
    y: location.y - control.location.y
  };
  for (const courseControl of courseControls) {
    if (Number(courseControl.control) === Number(control.id)) {
      courseControl.numberLocation = { ...numberLocation };
    }
  }
}

export function resetControlNumberLocation(model, selection) {
  for (const courseControl of selectedNumberCourseControls(model, selection)) {
    courseControl.numberLocation = null;
  }
}

export function selectedNumberCourseControls(model, selection) {
  const ids = new Set([
    Number(selection?.courseControl) || 0,
    ...(Array.isArray(selection?.courseControls) ? selection.courseControls.map(Number) : [])
  ].filter(Boolean));
  const courseControls = [...ids]
    .map(id => getCourseControl(model, id))
    .filter(Boolean);
  if (courseControls.length) {
    return courseControls;
  }
  const controlId = Number(selection?.control) || 0;
  return controlId
    ? model.courseControls.filter(courseControl => Number(courseControl.control) === controlId)
    : [];
}

export function controlDisplayName(control) {
  if (!control) return "";
  if (control.kind === "normal") return control.code || `Control ${control.id}`;
  return control.kind.replace(/-/g, " ");
}

export function finishRouteForCourse(model, courseId) {
  const pair = finishLegPair(model, courseId);
  if (!pair) return { value: "none", disabled: true };
  return {
    value: normalizeLegFlaggingKind(findLeg(model, pair.previous.control.id, pair.finish.control.id)?.flagging?.kind),
    disabled: false
  };
}

export function setFinishRouteFlagging(model, courseId, kind) {
  const pair = finishLegPair(model, courseId);
  if (!pair) return;
  const leg = ensureLegBetween(model, pair.previous.control.id, pair.finish.control.id);
  leg.flagging = { kind: ["all", "end"].includes(kind) ? kind : "none", point: null };
}

export function applyCourseKindDefaults(course) {
  if (!course) return;
  course.options ||= {};
  if (course.kind === "score") {
    course.labelKind = course.labelKind === "sequence" ? "code-and-score" : course.labelKind;
    course.options.scoreColumn = course.options.scoreColumn >= 0 ? course.options.scoreColumn : 7;
  }
  else if (course.kind === "team") {
    course.labelKind = course.labelKind || "sequence";
    course.options.scoreColumn = -1;
  }
  else {
    course.labelKind = course.labelKind || "sequence";
    course.options.scoreColumn = -1;
  }
}

export function setScoreFinishControl(model, courseId, controlId, enabled) {
  const course = getCourse(model, courseId);
  if (!course || course.kind !== "score") return;
  course.options ||= {};
  const view = courseView(model, courseId, { allBranches: true });
  const finish = view.find(row => row.control?.kind === "finish");
  const from = view.find(row => Number(row.control?.id) === Number(controlId) && row.control?.kind === "normal");
  const previousControlId = Number(course.options.scoreFinishControl) || 0;
  if (previousControlId && finish && previousControlId !== Number(controlId)) {
    const previousLeg = findLeg(model, previousControlId, finish.control.id);
    if (previousLeg) {
      previousLeg.flagging = { kind: "none", point: null };
    }
  }
  if (!enabled || !finish || !from) {
    if (previousControlId === Number(controlId) || !enabled) {
      if (previousControlId && finish) {
        const previousLeg = findLeg(model, previousControlId, finish.control.id);
        if (previousLeg) previousLeg.flagging = { kind: "none", point: null };
      }
      course.options.scoreFinishControl = null;
    }
    return;
  }
  course.options.scoreFinishControl = Number(controlId);
  const leg = ensureLegBetween(model, from.control.id, finish.control.id);
  leg.flagging = { kind: "all", point: null };
}

export function finishLegPair(model, courseId) {
  const view = courseView(model, courseId);
  const finishIndex = view.findIndex(row => row.control.kind === "finish");
  if (finishIndex <= 0) return null;
  return { previous: view[finishIndex - 1], finish: view[finishIndex] };
}

export function nextNumericId(items) {
  return Math.max(0, ...items.map(item => Number(item.id) || 0)) + 1;
}

export function ensureLegBetween(model, startControl, endControl) {
  let leg = findLeg(model, startControl, endControl);
  if (!leg) {
    leg = {
      id: nextNumericId(model.legs),
      startControl: Number(startControl),
      endControl: Number(endControl),
      flagging: { kind: "none", point: null },
      bends: [],
      gaps: []
    };
    model.legs.push(leg);
  }
  leg.gaps ||= [];
  leg.bends ||= [];
  leg.flagging ||= { kind: "none", point: null };
  leg.flagging.kind = normalizeLegFlaggingKind(leg.flagging.kind);
  return leg;
}

export function normalizeLegFlaggingKind(kind) {
  return {
    "beginning-part": "begin",
    "end-part": "end",
    "middle-part": "middle"
  }[kind] || kind || "none";
}

export function setLegFlaggingKind(model, leg, kind) {
  const normalized = normalizeLegFlaggingKind(kind);
  const total = pathLength(legPathPoints(model, leg));
  if (normalized === "none" || normalized === "all") {
    leg.flagging = { kind: normalized, point: null };
    return;
  }
  if (normalized === "begin") {
    const range = flaggingRangeForUi(model, leg, total);
    setLegFlaggingRange(model, leg, 0, range.endPercent || 50, "begin");
    return;
  }
  if (normalized === "end") {
    const range = flaggingRangeForUi(model, leg, total);
    setLegFlaggingRange(model, leg, range.startPercent || 50, 100, "end");
    return;
  }
  if (normalized === "middle") {
    const range = flaggingRangeForUi(model, leg, total);
    setLegFlaggingRange(model, leg, range.startPercent || 35, range.endPercent || 65, "middle");
  }
}

export function setLegFlaggingRange(model, leg, startPercent, endPercent, forcedKind = null) {
  const total = pathLength(legPathPoints(model, leg));
  const kind = forcedKind || normalizeLegFlaggingKind(leg.flagging?.kind);
  const start = clamp(Number(startPercent) || 0, 0, 95);
  const end = clamp(Number(endPercent) || 100, 5, 100);
  if (kind === "begin") {
    const distanceAtEnd = total * clamp(end, 5, 95) / 100;
    leg.flagging = { kind: "begin", point: pointAtPathDistance(legPathPoints(model, leg), distanceAtEnd), end: distanceAtEnd };
  }
  else if (kind === "end") {
    const distanceAtStart = total * clamp(start, 5, 95) / 100;
    leg.flagging = { kind: "end", point: pointAtPathDistance(legPathPoints(model, leg), distanceAtStart), start: distanceAtStart };
  }
  else if (kind === "middle") {
    const orderedStart = Math.min(start, end - 5);
    const orderedEnd = Math.max(end, orderedStart + 5);
    leg.flagging = {
      kind: "middle",
      start: total * clamp(orderedStart, 0, 95) / 100,
      end: total * clamp(orderedEnd, 5, 100) / 100,
      point: null
    };
  }
}

export function flaggingRangeForUi(model, leg, total = 0) {
  const kind = normalizeLegFlaggingKind(leg?.flagging?.kind);
  if (!leg || total <= 0) {
    return { startPercent: kind === "middle" ? 35 : 50, endPercent: kind === "middle" ? 65 : 50 };
  }
  const points = legPathPoints(model, leg);
  if (kind === "begin") {
    const end = Number(leg.flagging?.end) || (leg.flagging?.point ? distanceAlongPathAtPoint(points, leg.flagging.point).distance : total / 2);
    return { startPercent: 0, endPercent: clamp(Math.round(end / total * 100), 5, 95) };
  }
  if (kind === "end") {
    const start = Number(leg.flagging?.start) || (leg.flagging?.point ? distanceAlongPathAtPoint(points, leg.flagging.point).distance : total / 2);
    return { startPercent: clamp(Math.round(start / total * 100), 5, 95), endPercent: 100 };
  }
  if (kind === "middle") {
    const start = Number(leg.flagging?.start);
    const end = Number(leg.flagging?.end);
    return {
      startPercent: clamp(Math.round((Number.isFinite(start) ? start : total * 0.35) / total * 100), 5, 90),
      endPercent: clamp(Math.round((Number.isFinite(end) ? end : total * 0.65) / total * 100), 10, 95)
    };
  }
  return { startPercent: 50, endPercent: 50 };
}

export function legPathPoints(model, leg) {
  const start = getControl(model, leg.startControl);
  const end = getControl(model, leg.endControl);
  return [start?.location, ...(leg.bends || []), end?.location].filter(Boolean);
}

export function pathLength(points) {
  let length = 0;
  for (let index = 0; index < points.length - 1; index += 1) {
    length += distance(points[index], points[index + 1]);
  }
  return length;
}

export function pointAtPathDistance(points, distanceAlongPath) {
  if (!points.length) return { x: 0, y: 0 };
  let remaining = clamp(distanceAlongPath, 0, pathLength(points));
  for (let i = 0; i < points.length - 1; i += 1) {
    const a = points[i];
    const b = points[i + 1];
    const length = distance(a, b);
    if (remaining <= length && length > 0) {
      const t = remaining / length;
      return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
    }
    remaining -= length;
  }
  return { ...points[points.length - 1] };
}

export function bendInsertIndex(points, distanceAlongPath) {
  if (points.length < 2) return 0;
  let remaining = clamp(distanceAlongPath, 0, pathLength(points));
  for (let index = 0; index < points.length - 1; index += 1) {
    const length = distance(points[index], points[index + 1]);
    if (remaining <= length || index === points.length - 2) {
      return index;
    }
    remaining -= length;
  }
  return Math.max(0, points.length - 2);
}

export function distanceAlongPathAtPoint(points, point) {
  let best = { distance: 0, screenDistance: Infinity };
  let offset = 0;
  for (let i = 0; i < points.length - 1; i += 1) {
    const a = points[i];
    const b = points[i + 1];
    const projected = projectPointToSegment(point, a, b);
    if (projected.distance < best.screenDistance) {
      best = { distance: offset + projected.t * distance(a, b), screenDistance: projected.distance };
    }
    offset += distance(a, b);
  }
  return best;
}

export function projectPointToSegment(point, a, b) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lengthSq = dx * dx + dy * dy;
  const t = lengthSq > 0 ? clamp(((point.x - a.x) * dx + (point.y - a.y) * dy) / lengthSq, 0, 1) : 0;
  const projected = { x: a.x + dx * t, y: a.y + dy * t };
  return { t, distance: distance(point, projected) };
}

export function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export function snappedControlForPlacement(state, kind, point, mapView) {
  const scale = Math.max(0.0001, mapView?.scale?.(state.ui) || 1);
  const threshold = CONTROL_SNAP_SCREEN_RADIUS / scale;
  let best = null;
  let bestDistance = Infinity;
  for (const control of state.eventModel.controls || []) {
    if (control.kind !== kind) continue;
    const candidateDistance = distance(point, control.location);
    if (candidateDistance <= threshold && candidateDistance < bestDistance) {
      best = control;
      bestDistance = candidateDistance;
    }
  }
  if (!best) return null;
  const selectedCourseId = state.ui.selectedCourseId;
  const usedInSelectedCourse = selectedCourseId && selectedCourseId !== "all"
    ? controlsUsedByCourse(state.eventModel, selectedCourseId).has(Number(best.id))
    : false;
  return { control: best, distance: bestDistance, usedInSelectedCourse };
}

export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}
