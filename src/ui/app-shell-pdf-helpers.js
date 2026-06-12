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

export function defaultPdfExportSettings() {
  return {
    courseScope: PDF_COURSE_SCOPES.CURRENT,
    pageWidth: 827,
    pageHeight: 1169,
    pageMargins: 11.811,
    pageLandscape: false,
    includeBaseMap: true,
    includeDescriptions: true,
    pageBackground: false,
    outputMode: PDF_OUTPUT_MODES.VECTOR,
    filePrefix: "",
    useCourseNames: true,
    relayUsedOnly: true
  };
}

export function readPdfExportSettings(fallbackArea = null) {
  const defaults = { ...defaultPdfExportSettings() };
  if (fallbackArea) {
    defaults.pageWidth = fallbackArea.pageWidth;
    defaults.pageHeight = fallbackArea.pageHeight;
    defaults.pageMargins = fallbackArea.pageMargins;
    defaults.pageLandscape = fallbackArea.pageLandscape;
  }
  try {
    const raw = localStorage.getItem(PDF_EXPORT_SETTINGS_KEY);
    if (!raw) return defaults;
    const parsed = JSON.parse(raw);
    return { ...defaults, ...(parsed || {}) };
  }
  catch {
    return defaults;
  }
}

export function writePdfExportSettings(settings) {
  try {
    localStorage.setItem(PDF_EXPORT_SETTINGS_KEY, JSON.stringify(settings));
  }
  catch {
    // Ignore quota/private-mode failures; export still works with this run's settings.
  }
}

export function safeFilePart(value) {
  const cleaned = String(value || "event")
    .trim()
    .replace(/[\\/:*?"<>|]+/g, "-")
    .replace(/\s+/g, " ")
    .replace(/^-+|-+$/g, "");
  return cleaned || "event";
}

export function uniqueFileName(fileName, usedNames) {
  const normalized = fileName || "event.pdf";
  if (!usedNames.has(normalized)) {
    usedNames.add(normalized);
    return normalized;
  }
  const dotIndex = normalized.lastIndexOf(".");
  const stem = dotIndex > 0 ? normalized.slice(0, dotIndex) : normalized;
  const extension = dotIndex > 0 ? normalized.slice(dotIndex) : "";
  let index = 2;
  let candidate = `${stem}-${index}${extension}`;
  while (usedNames.has(candidate)) {
    index += 1;
    candidate = `${stem}-${index}${extension}`;
  }
  usedNames.add(candidate);
  return candidate;
}

export function normalizedRelaySettings(relay = {}) {
  const legs = Math.max(1, Math.round(Number(relay.legs) || 1));
  return {
    firstTeam: Math.max(1, Math.round(Number(relay.firstTeam) || 1)),
    teams: Math.max(0, Math.round(Number(relay.teams) || 0)),
    legs,
    branches: Array.isArray(relay.branches) ? relay.branches : [],
    teamPrefix: String(relay.teamPrefix || ""),
    teamDigits: Math.max(0, Math.min(8, Math.round(Number(relay.teamDigits) || 0))),
    legNames: Array.isArray(relay.legNames) ? relay.legNames.slice(0, legs).map(name => String(name || "")) : []
  };
}

export function applyRelayInputToSettings(relay, relayField, relayLegName) {
  if (relayField) {
    const field = relayField.dataset.relaySettingsField;
    if (field === "teams") relay.teams = Math.max(0, Math.round(Number(relayField.value) || 0));
    else if (field === "legs") relay.legs = Math.max(1, Math.round(Number(relayField.value) || 1));
    else if (field === "firstTeam") relay.firstTeam = Math.max(1, Math.round(Number(relayField.value) || 1));
    else if (field === "teamDigits") relay.teamDigits = Math.max(0, Math.min(8, Math.round(Number(relayField.value) || 0)));
    else if (field === "teamPrefix") relay.teamPrefix = String(relayField.value || "");
  }
  if (relayLegName) {
    const index = Math.max(0, Number(relayLegName.dataset.relayLegName) || 0);
    relay.legNames ||= [];
    relay.legNames[index] = String(relayLegName.value || "").trim();
  }
  relay.legNames = (relay.legNames || []).slice(0, Math.max(1, relay.legs || 1));
}

export function vectorPdfProgressPhase(stage) {
  return {
    "loading-fonts": 2,
    drawing: 3,
    building: 5,
    "loading-pdf-lib": 6,
    "reading-base-map": 6,
    saving: 7,
    done: 7
  }[stage] || 0;
}

export function vectorPdfProgressMessage(stage, name, translate) {
  if (stage === "loading-fonts") return translate("Loading PDF fonts…");
  if (stage === "drawing") return translate("Drawing {name} map…", { name });
  if (stage === "building") return translate("Writing {name} PDF…", { name });
  if (stage === "loading-pdf-lib" || stage === "reading-base-map") return translate("Merging {name} base map…", { name });
  if (stage === "saving" || stage === "done") return translate("Finalizing {name}…", { name });
  return "";
}

export function nextFrame() {
  return new Promise(resolve => requestAnimationFrame(() => resolve()));
}

export function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function paintProgressFrame() {
  await nextFrame();
  await wait(30);
}

export async function createZipBlob(files) {
  const encoder = new TextEncoder();
  const localParts = [];
  const centralParts = [];
  let offset = 0;
  const timestamp = zipDosDateTime(new Date());
  for (const file of files) {
    const nameBytes = encoder.encode(file.name);
    const bytes = new Uint8Array(await file.blob.arrayBuffer());
    const crc = crc32(bytes);
    const localHeader = zipLocalHeader(nameBytes, bytes.length, crc, timestamp);
    const centralHeader = zipCentralHeader(nameBytes, bytes.length, crc, offset, timestamp);
    localParts.push(localHeader, bytes);
    centralParts.push(centralHeader);
    offset += localHeader.length + bytes.length;
  }
  const centralSize = centralParts.reduce((sum, part) => sum + part.length, 0);
  const endRecord = zipEndRecord(files.length, centralSize, offset);
  return new Blob([...localParts, ...centralParts, endRecord], { type: "application/zip" });
}

export function zipLocalHeader(nameBytes, size, crc, timestamp) {
  const header = new Uint8Array(30 + nameBytes.length);
  const view = new DataView(header.buffer);
  view.setUint32(0, 0x04034b50, true);
  view.setUint16(4, 20, true);
  view.setUint16(6, 0x0800, true);
  view.setUint16(8, 0, true);
  view.setUint16(10, timestamp.time, true);
  view.setUint16(12, timestamp.date, true);
  view.setUint32(14, crc, true);
  view.setUint32(18, size, true);
  view.setUint32(22, size, true);
  view.setUint16(26, nameBytes.length, true);
  header.set(nameBytes, 30);
  return header;
}

export function zipCentralHeader(nameBytes, size, crc, offset, timestamp) {
  const header = new Uint8Array(46 + nameBytes.length);
  const view = new DataView(header.buffer);
  view.setUint32(0, 0x02014b50, true);
  view.setUint16(4, 20, true);
  view.setUint16(6, 20, true);
  view.setUint16(8, 0x0800, true);
  view.setUint16(10, 0, true);
  view.setUint16(12, timestamp.time, true);
  view.setUint16(14, timestamp.date, true);
  view.setUint32(16, crc, true);
  view.setUint32(20, size, true);
  view.setUint32(24, size, true);
  view.setUint16(28, nameBytes.length, true);
  view.setUint32(42, offset, true);
  header.set(nameBytes, 46);
  return header;
}

export function zipEndRecord(count, centralSize, centralOffset) {
  const header = new Uint8Array(22);
  const view = new DataView(header.buffer);
  view.setUint32(0, 0x06054b50, true);
  view.setUint16(8, count, true);
  view.setUint16(10, count, true);
  view.setUint32(12, centralSize, true);
  view.setUint32(16, centralOffset, true);
  return header;
}

export function zipDosDateTime(date) {
  const year = Math.max(1980, date.getFullYear());
  return {
    date: ((year - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate(),
    time: (date.getHours() << 11) | (date.getMinutes() << 5) | Math.floor(date.getSeconds() / 2)
  };
}

let crc32Table = null;

export function crc32(bytes) {
  if (!crc32Table) {
    crc32Table = new Uint32Array(256);
    for (let index = 0; index < 256; index += 1) {
      let value = index;
      for (let bit = 0; bit < 8; bit += 1) {
        value = (value & 1) ? (0xedb88320 ^ (value >>> 1)) : (value >>> 1);
      }
      crc32Table[index] = value >>> 0;
    }
  }
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc = crc32Table[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

export function download(fileName, content, type) {
  const blob = new Blob([content], { type });
  downloadBlob(fileName, blob);
}

export function downloadBlob(fileName, blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.append(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function baseName(name = "event.ppen") {
  return String(name).replace(/\.[^.]+$/, "") || "event";
}
