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

export function isAppleTouchDevice() {
  const nav = window.navigator || {};
  const platform = nav.platform || "";
  const userAgent = nav.userAgent || "";
  return /iPad|iPhone|iPod/i.test(userAgent) || (platform === "MacIntel" && Number(nav.maxTouchPoints || 0) > 1);
}

export function useInlineFloatingPalette() {
  // iPad Safari has long-standing quirks around non-modal <dialog> plus native
  // <select> pickers: touches can remain captured by the dialog's top-layer
  // state after the picker closes. For the export-area palette we do not need
  // native dialog modality, so on Apple touch devices we keep it as a normal
  // positioned element with an open attribute.
  return isAppleTouchDevice();
}

export function openFloatingPalette(dialog) {
  if (!dialog) return;
  if (useInlineFloatingPalette()) {
    dialog.dataset.inlinePalette = "true";
    dialog.setAttribute("open", "");
    dialog.removeAttribute("hidden");
    dialog.style.display = "";
    return;
  }
  dialog.dataset.inlinePalette = "false";
  dialog.removeAttribute("hidden");
  if (dialog.show) {
    dialog.show();
  }
  else {
    dialog.setAttribute("open", "");
  }
}

export function closeFloatingPalette(dialog) {
  if (!dialog) return false;
  const inline = dialog.dataset.inlinePalette === "true" || useInlineFloatingPalette();
  if (!inline && dialog.open && dialog.close) {
    dialog.close();
    dialog.setAttribute("hidden", "");
    return true;
  }
  dialog.removeAttribute("open");
  dialog.setAttribute("hidden", "");
  dialog.dataset.inlinePalette = inline ? "true" : "false";
  return false;
}

export function isFloatingDialogOpen(dialog) {
  return !!dialog && !dialog.hasAttribute("hidden") && (dialog.open || dialog.hasAttribute("open"));
}

export function currentPrintAreaForTarget(eventModel, ui, target) {
  if (target.scope === PRINT_AREA_SCOPES.COURSE) {
    return effectivePrintArea(eventModel, target.courseId);
  }
  return normalizePrintArea(eventModel.event.printArea);
}

export function selectedRadioValue(root, name) {
  return root.querySelector(`input[name="${name}"]:checked`)?.value || "";
}

export function modeLabel(mode) {
  switch (mode) {
    case "frame": return t("Move frame");
    case "viewport": return t("Current view");
    case "automatic": return t("Automatic");
    default: return t("Custom rectangle");
  }
}

export function findPaperSize(width, height) {
  return PAPER_SIZES.find(size =>
    (nearlySame(size.width, width) && nearlySame(size.height, height))
    || (nearlySame(size.width, height) && nearlySame(size.height, width))
  ) || null;
}

export function paperOptionHtml(size, selected) {
  return `<option value="${escapeAttr(size.id)}" data-width="${size.width}" data-height="${size.height}" ${size.custom ? 'data-custom="true"' : ""} ${selected ? "selected" : ""}>${escapeHtml(t(size.label))}</option>`;
}

export function marginOptionHtml(option, selected) {
  return `<option value="${escapeAttr(option.id)}" data-value="${option.value}" ${selected ? "selected" : ""}>${escapeHtml(t(option.label))}</option>`;
}

export function pageSizeMm(area) {
  const width = area.pageWidth * 0.254;
  const height = area.pageHeight * 0.254;
  return area.pageLandscape ? { width: height, height: width } : { width, height };
}

export function pageMarginMm(area) {
  return Math.max(0, Number(area.pageMargins) || 0) * 0.254;
}

export function pdfPixelSize(page, marginMm) {
  const contentWidth = Math.max(10, page.width - marginMm * 2);
  const contentHeight = Math.max(10, page.height - marginMm * 2);
  // 12 px/mm is about 305 dpi. This keeps PDF/bitmap basemaps sharp in raster PDF exports.
  const pixelsPerMm = 12;
  return {
    width: Math.max(600, Math.round(contentWidth * pixelsPerMm)),
    height: Math.max(600, Math.round(contentHeight * pixelsPerMm))
  };
}

export function formatPageSize(width, height) {
  return `${formatDecimal(width / 100)} x ${formatDecimal(height / 100)} in`;
}

export function formatMargin(value) {
  return value ? `${formatDecimal(value * 0.254)} mm` : "none";
}

export function formatDecimal(value) {
  return Number(value).toFixed(2).replace(/\.?0+$/, "");
}

export function nearlySame(a, b) {
  return Math.abs(Number(a || 0) - Number(b || 0)) < 0.5;
}

export function boundsCenter(bounds) {
  return {
    x: (bounds.left + bounds.right) / 2,
    y: (bounds.top + bounds.bottom) / 2
  };
}

export function selectOptions(values, selected, labeler = value => String(value)) {
  return values.map(value => {
    const isSelected = String(value) === String(selected);
    return `<option value="${escapeAttr(value)}" ${isSelected ? "selected" : ""}>${escapeHtml(t(labeler(value)))}</option>`;
  }).join("");
}

export function uniqueNumbers(values) {
  return [...new Set(values.map(value => Number(value)).filter(value => Number.isFinite(value)))]
    .sort((a, b) => a - b);
}

export function uniqueStrings(values) {
  return [...new Set(values.map(value => String(value)).filter(Boolean))];
}

export function forceWholePageLanguageReload() {
  const location = window.location;
  const url = new URL(location.href);
  url.searchParams.set(LANGUAGE_REFRESH_PARAM, String(Date.now()));
  location.replace(url.toString());
}

export function consumeLanguageRefreshParam() {
  const location = window.location;
  const url = new URL(location.href);
  if (!url.searchParams.has(LANGUAGE_REFRESH_PARAM)) return;
  url.searchParams.delete(LANGUAGE_REFRESH_PARAM);
  const cleanUrl = `${url.pathname}${url.search}${url.hash}`;
  window.history.replaceState(window.history.state, document.title, cleanUrl || location.pathname);
}

export function symbolOptionsForColumn(box, language = "en") {
  const options = [["", "Not specified"], ...getIscdSymbolOptions(box, language)];
  const seen = new Set();
  return options.filter(([value]) => {
    const key = String(value || "");
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function descriptionKindLabel(kind) {
  return {
    symbols: "symbols",
    text: "text",
    "symbols-and-text": "symbols-and-text"
  }[kind] || kind;
}

export function directionVector(direction) {
  const vectors = {
    east: { x: 1, y: 0 },
    west: { x: -1, y: 0 },
    north: { x: 0, y: 1 },
    south: { x: 0, y: -1 },
    northeast: { x: 1, y: 1 },
    northwest: { x: -1, y: 1 },
    southeast: { x: 1, y: -1 },
    southwest: { x: -1, y: -1 }
  };
  const vector = vectors[direction] || vectors.east;
  const length = Math.hypot(vector.x, vector.y) || 1;
  return { x: vector.x / length, y: vector.y / length };
}

export function renderKeysFor({ eventModel, ui }) {
  return {
    eventModel,
    selectedCourseId: ui.selectedCourseId,
    showAllControls: ui.showAllControls,
    variationMode: ui.variationMode || "default",
    variationCode: ui.variationCode || "",
    variationAddKind: ui.variationAddKind || "fork",
    variationAddBranches: ui.variationAddBranches || 2,
    variationAnchorCourseControl: ui.variationAnchorCourseControl || "",
    variationInsertAfterCourseControl: ui.variationInsertAfterCourseControl || "",
    variationInsertBeforeCourseControl: ui.variationInsertBeforeCourseControl || "",
    variationSelectedSegment: ui.variationSelectedSegment || "",
    variationBranch: ui.variationBranch ? `${ui.variationBranch.forkCourseControl || ""}:${ui.variationBranch.branchCourseControl || ""}` : "",
    relayTeam: ui.relayTeam || 1,
    relayLeg: ui.relayLeg || 1,
    selection: selectionKey(ui.selection),
    reportTitle: ui.report?.title || "",
    reportKind: ui.report?.kind || "",
    reportHtml: ui.report?.html || ""
  };
}

export function syncDescriptionLanguageWithApp(eventModel) {
  const language = descriptionLanguageForEvent(eventModel);
  eventModel.event ||= {};
  eventModel.event.descriptions ||= { lang: language, color: "black" };
  eventModel.event.descriptions.lang = language;
  eventModel.event.descriptionLangId = language;
}

export function selectionKey(selection) {
  if (!selection) return "";
  if (selection.type === "leg") {
    return `${selection.type}:${selection.startControl}:${selection.endControl}`;
  }
  if (selection.type === "leg-bend") {
    return `${selection.type}:${selection.startControl}:${selection.endControl}:${selection.bendIndex}`;
  }
  if (selection.type === "leg-gap") {
    return `${selection.type}:${selection.startControl}:${selection.endControl}:${selection.gapIndex}:${selection.handle || ""}`;
  }
  if (selection.type === "control-number") {
    return `${selection.type}:${selection.courseControl}`;
  }
  return `${selection.type}:${selection.id}`;
}

export function setPath(object, path, value) {
  let cursor = object;
  for (let i = 0; i < path.length - 1; i += 1) {
    cursor = cursor[path[i]];
  }
  cursor[path[path.length - 1]] = value;
}

export function valueFromInput(input) {
  if (input.type === "checkbox") {
    return input.checked;
  }
  if (input.type === "number") {
    return input.value === "" ? null : Number(input.value);
  }
  return input.value;
}

export function tableHtml(title, headers, rows) {
  return `
    <h2>${escapeHtml(t(title))}</h2>
    <table class="report-table">
      <thead><tr>${headers.map(header => `<th>${escapeHtml(t(header.label))}</th>`).join("")}</tr></thead>
      <tbody>${rows.map(row => `<tr>${headers.map(header => {
        const value = header.format ? header.format(row[header.key], row) : row[header.key] ?? "";
        return `<td>${escapeHtml(typeof value === "string" ? t(value) : value)}</td>`;
      }).join("")}</tr>`).join("")}</tbody>
    </table>
  `;
}

export function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export const escapeAttr = escapeHtml;
