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

export function readUiModePreference() {
  try {
    const value = localStorage.getItem(UI_MODE_KEY);
    return Object.values(UI_MODES).includes(value) ? value : UI_MODES.AUTO;
  }
  catch {
    return UI_MODES.AUTO;
  }
}

export function setUiModePreference(mode) {
  try {
    if (mode === UI_MODES.AUTO) {
      localStorage.removeItem(UI_MODE_KEY);
    }
    else {
      localStorage.setItem(UI_MODE_KEY, mode);
    }
  }
  catch {}
}

export function isNarrowMobileViewport() {
  return isPhoneViewport();
}

export function isPhoneViewport() {
  const width = Math.max(1, window.innerWidth || document.documentElement.clientWidth || 0);
  const height = Math.max(1, window.innerHeight || document.documentElement.clientHeight || 0);
  const shortSide = Math.min(width, height);
  const longSide = Math.max(width, height);
  const userAgent = navigator.userAgent || "";
  const platform = navigator.platform || "";
  const maxTouchPoints = Number(navigator.maxTouchPoints || 0);

  // iPad and Android tablets should keep the desktop UI, even when held in portrait.
  // Some iPad models report only 744 CSS px in portrait, which was below the old
  // 760px breakpoint and incorrectly triggered the phone/mobile layout.
  if (isTabletDevice()) {
    return false;
  }

  const explicitPhone = /iPhone|iPod/i.test(userAgent)
    || (/Android/i.test(userAgent) && /Mobile/i.test(userAgent));
  if (explicitPhone) {
    return shortSide <= 560 || longSide <= 980;
  }

  // Browser/device detection is imperfect, so keep a geometry fallback for very
  // small coarse-pointer screens, but do not classify tablet-sized viewports as phones.
  const coarsePointer = window.matchMedia?.("(pointer: coarse)")?.matches ?? maxTouchPoints > 0;
  const macTouchTablet = platform === "MacIntel" && maxTouchPoints > 1;
  return coarsePointer && !macTouchTablet && shortSide <= 520 && longSide <= 980;
}

export function isTabletDevice() {
  const userAgent = navigator.userAgent || "";
  const platform = navigator.platform || "";
  const maxTouchPoints = Number(navigator.maxTouchPoints || 0);
  if (/iPad/i.test(userAgent)) return true;
  if (platform === "MacIntel" && maxTouchPoints > 1) return true;
  if (/Android/i.test(userAgent) && !/Mobile/i.test(userAgent)) return true;
  return false;
}

export function canScrollElement(element, deltaY) {
  if (!element || !(Math.abs(deltaY) > 0)) return false;
  const maxScrollTop = element.scrollHeight - element.clientHeight;
  if (!(maxScrollTop > 0)) return false;
  if (deltaY < 0) return element.scrollTop > 0;
  return element.scrollTop < maxScrollTop - 1;
}

export function containsUnicodeText(value, seen = new Set(), key = "") {
  if (value == null) return false;
  if (typeof value === "string") {
    if (key && /(?:data|url|source|content)/i.test(key) && value.length > 256) return false;
    if (value.length > 10000) return false;
    for (const char of value) {
      if (char.codePointAt(0) > 255) return true;
    }
    return false;
  }
  if (typeof value !== "object") return false;
  if (seen.has(value)) return false;
  seen.add(value);
  if (Array.isArray(value)) {
    return value.some(item => containsUnicodeText(item, seen));
  }
  return Object.entries(value).some(([entryKey, entryValue]) => containsUnicodeText(entryValue, seen, entryKey));
}

export function pdfDataUrlLooksLikePdf(value) {
  const text = String(value || "");
  if (!text) return false;
  const comma = text.indexOf(",");
  const header = comma >= 0 ? text.slice(0, comma).toLowerCase() : "";
  const encoded = comma >= 0 ? text.slice(comma + 1) : text;
  try {
    const cleanBase64 = encoded.replace(/\s/g, "").slice(0, 1600);
    const paddedBase64 = `${cleanBase64}${"=".repeat((4 - cleanBase64.length % 4) % 4)}`;
    const sample = header.includes(";base64")
      ? atob(paddedBase64)
      : decodeURIComponent(encoded.slice(0, 1200));
    return sample.slice(0, 1024).includes("%PDF-");
  }
  catch {
    return false;
  }
}

let appResourceFetchCacheInstalled = false;

export function installAppResourceFetchCache(cacheName, urls) {
  if (appResourceFetchCacheInstalled || !("caches" in window)) return;
  appResourceFetchCacheInstalled = true;
  const originalFetch = window.fetch.bind(window);
  const resourceUrls = new Set(urls.map(url => new URL(url, window.location.href).href));
  window.fetch = async (input, init = {}) => {
    const request = input instanceof Request ? input : new Request(input, init);
    const method = String(init.method || request.method || "GET").toUpperCase();
    const url = new URL(request.url, window.location.href).href;
    if (method !== "GET" || !resourceUrls.has(url)) {
      return originalFetch(input, init);
    }
    try {
      const cached = await caches.open(cacheName).then(cache => cache.match(url));
      if (cached) return cached;
    }
    catch {}
    return originalFetch(input, init);
  };
}

export async function precacheAppResources({ cacheName, cachePrefix, urls, onProgress }) {
  if (!("caches" in window)) return;
  await deleteOldResourceCaches(cachePrefix, cacheName);
  const cache = await caches.open(cacheName);
  const entries = await Promise.all(urls.map(async url => {
    const request = new Request(url, { cache: "reload" });
    const cached = await cache.match(request);
    if (cached) {
      return {
        url,
        request,
        cached: true,
        size: await responseByteSize(cached)
      };
    }
    return {
      url,
      request,
      cached: false,
      size: await resourceContentLength(url)
    };
  }));
  let totalBytes = entries.reduce((sum, entry) => sum + (entry.size || 0), 0);
  let downloadedBytes = entries.reduce((sum, entry) => sum + (entry.cached ? entry.size || 0 : 0), 0);
  const uncached = entries.filter(entry => !entry.cached);
  const emitProgress = (done = false) => {
    const safeTotal = Math.max(totalBytes, downloadedBytes);
    onProgress?.({ downloadedBytes, totalBytes: safeTotal, done });
  };
  if (!uncached.length) {
    emitProgress(true);
    return;
  }
  emitProgress(false);
  for (const entry of uncached) {
    let entryDownloaded = 0;
    let accountedEntrySize = Math.max(0, Number(entry.size) || 0);
    const result = await cacheResourceWithProgress(cache, entry.request, bytes => {
      const chunkBytes = Math.max(0, Number(bytes) || 0);
      if (!chunkBytes) return;
      entryDownloaded += chunkBytes;
      downloadedBytes += chunkBytes;
      if (entry.size <= 0) {
        totalBytes += chunkBytes;
        accountedEntrySize = entryDownloaded;
      }
      else if (entryDownloaded > accountedEntrySize) {
        totalBytes += entryDownloaded - accountedEntrySize;
        accountedEntrySize = entryDownloaded;
      }
      emitProgress(false);
    });
    if (result.size > accountedEntrySize) {
      totalBytes += result.size - accountedEntrySize;
      accountedEntrySize = result.size;
    }
    if (result.size > entryDownloaded) {
      downloadedBytes += result.size - entryDownloaded;
      entryDownloaded = result.size;
    }
    if (entry.size <= 0 && result.size <= 0) {
      const cached = await cache.match(entry.request);
      const size = cached ? await responseByteSize(cached) : 0;
      if (size > 0 && size > entryDownloaded) {
        totalBytes += size - entryDownloaded;
        downloadedBytes += size - entryDownloaded;
      }
    }
    emitProgress(false);
  }
  emitProgress(true);
}

export async function deleteOldResourceCaches(prefix, keepName) {
  const names = await caches.keys();
  await Promise.all(names
    .filter(name => name.startsWith(prefix) && name !== keepName)
    .map(name => caches.delete(name)));
}

export async function resourceContentLength(url) {
  try {
    const response = await fetch(url, { method: "HEAD", cache: "reload" });
    if (!response.ok) return 0;
    return Number(response.headers.get("content-length")) || 0;
  }
  catch {
    return 0;
  }
}

export async function cacheResourceWithProgress(cache, request, onChunk) {
  const response = await fetch(request);
  if (!response.ok) {
    throw new Error(`Could not download ${request.url}: ${response.status}`);
  }
  if (!response.body?.getReader) {
    const blob = await response.blob();
    onChunk?.(blob.size || 0);
    await cache.put(request, cachedResourceResponse(blob, response));
    return { size: blob.size || 0 };
  }
  const reader = response.body.getReader();
  const chunks = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (!value) continue;
    chunks.push(value);
    size += value.byteLength;
    onChunk?.(value.byteLength);
  }
  const body = new Blob(chunks);
  await cache.put(request, cachedResourceResponse(body, response));
  return { size };
}

export function cachedResourceResponse(body, sourceResponse) {
  const headers = new Headers();
  for (const name of ["content-type", "cache-control", "etag", "last-modified"]) {
    const value = sourceResponse.headers.get(name);
    if (value) headers.set(name, value);
  }
  return new Response(body, {
    status: sourceResponse.status,
    statusText: sourceResponse.statusText,
    headers
  });
}

export async function responseByteSize(response) {
  try {
    return (await response.clone().blob()).size || 0;
  }
  catch {
    return Number(response.headers.get("content-length")) || 0;
  }
}

export function formatBytes(bytes) {
  const value = Math.max(0, Number(bytes) || 0);
  if (value >= 1024 * 1024) return `${(value / (1024 * 1024)).toFixed(1)} MB`;
  if (value >= 1024) return `${Math.round(value / 1024)} KB`;
  return `${Math.round(value)} B`;
}
