const DEBUG_ENABLED = (() => {
  try {
    const params = new URLSearchParams(window.location.search || "");
    const value = String(params.get("debug") || "").toLowerCase();
    return value === "true" || value === "1" || value === "yes";
  }
  catch (_) {
    return false;
  }
})();

const MAX_DEBUG_ENTRIES = 8000;
const debugEntries = [];
let debugPanel = null;
let debugCountNode = null;
let consolePatched = false;
let globalHandlersInstalled = false;

export function isDebugEnabled() {
  return DEBUG_ENABLED;
}

export function debugLog(event, data = null) {
  appendDebugEntry("debug", event, data);
}

export function debugWarn(event, data = null) {
  appendDebugEntry("warn", event, data);
}

export function debugError(event, data = null) {
  appendDebugEntry("error", event, data);
}

export function installDebugLogDownloadButton() {
  if (!DEBUG_ENABLED || typeof document === "undefined") {
    return;
  }
  patchConsoleForDebugLog();
  installGlobalDebugHandlers();
  window.__OC_DEBUG_LOG__ = {
    entries: debugEntries,
    download: downloadDebugLog,
    snapshot: createDebugPayload,
    clear() {
      debugEntries.length = 0;
      updateDebugPanel();
    }
  };
  if (debugPanel) {
    return;
  }
  const panel = document.createElement("div");
  panel.id = "oc-debug-log-panel";
  panel.style.cssText = [
    "position:fixed",
    "top:10px",
    "right:10px",
    "z-index:2147483647",
    "display:flex",
    "align-items:center",
    "gap:6px",
    "padding:6px 8px",
    "border-radius:8px",
    "background:rgba(17,24,39,0.88)",
    "color:#fff",
    "font:12px/1.2 -apple-system,BlinkMacSystemFont,Segoe UI,sans-serif",
    "box-shadow:0 4px 16px rgba(0,0,0,0.25)",
    "user-select:none",
    "pointer-events:auto"
  ].join(";");

  const label = document.createElement("span");
  label.textContent = "Debug";
  label.style.fontWeight = "700";
  panel.appendChild(label);

  debugCountNode = document.createElement("span");
  debugCountNode.textContent = "0 logs";
  debugCountNode.style.opacity = "0.86";
  panel.appendChild(debugCountNode);

  const download = document.createElement("button");
  download.type = "button";
  download.textContent = "Download log";
  download.title = "Download O-Composer debug log as JSON";
  download.style.cssText = buttonCss();
  download.addEventListener("click", event => {
    event.preventDefault();
    event.stopPropagation();
    downloadDebugLog();
  });
  panel.appendChild(download);

  const copy = document.createElement("button");
  copy.type = "button";
  copy.textContent = "Copy";
  copy.title = "Copy debug log JSON to clipboard";
  copy.style.cssText = buttonCss();
  copy.addEventListener("click", async event => {
    event.preventDefault();
    event.stopPropagation();
    const payload = JSON.stringify(createDebugPayload(), null, 2);
    try {
      await navigator.clipboard.writeText(payload);
      copy.textContent = "Copied";
      setTimeout(() => { copy.textContent = "Copy"; }, 1200);
    }
    catch (error) {
      debugError("debug.copy.failed", { message: error?.message || String(error) });
      downloadDebugLog();
    }
  });
  panel.appendChild(copy);

  const clear = document.createElement("button");
  clear.type = "button";
  clear.textContent = "Clear";
  clear.title = "Clear debug buffer";
  clear.style.cssText = buttonCss();
  clear.addEventListener("click", event => {
    event.preventDefault();
    event.stopPropagation();
    debugEntries.length = 0;
    updateDebugPanel();
  });
  panel.appendChild(clear);

  document.documentElement.appendChild(panel);
  debugPanel = panel;
  updateDebugPanel();
  debugLog("debug.panel.installed", {
    href: location.href,
    userAgent: navigator.userAgent,
    devicePixelRatio: window.devicePixelRatio || 1,
    viewport: { width: window.innerWidth, height: window.innerHeight },
    screen: window.screen ? {
      width: window.screen.width,
      height: window.screen.height,
      availWidth: window.screen.availWidth,
      availHeight: window.screen.availHeight
    } : null
  });
}

function buttonCss() {
  return [
    "appearance:none",
    "border:1px solid rgba(255,255,255,0.35)",
    "border-radius:6px",
    "background:rgba(255,255,255,0.14)",
    "color:#fff",
    "padding:4px 7px",
    "font:12px/1 -apple-system,BlinkMacSystemFont,Segoe UI,sans-serif",
    "cursor:pointer"
  ].join(";");
}

function appendDebugEntry(level, event, data) {
  if (!DEBUG_ENABLED) {
    return;
  }
  const entry = {
    id: debugEntries.length ? debugEntries[debugEntries.length - 1].id + 1 : 1,
    level,
    event,
    isoTime: new Date().toISOString(),
    perfMs: roundNumber(typeof performance !== "undefined" ? performance.now() : 0, 3),
    data: safeClone(data)
  };
  debugEntries.push(entry);
  if (debugEntries.length > MAX_DEBUG_ENTRIES) {
    debugEntries.splice(0, debugEntries.length - MAX_DEBUG_ENTRIES);
  }
  updateDebugPanel();
}

function patchConsoleForDebugLog() {
  if (consolePatched || typeof console === "undefined") {
    return;
  }
  consolePatched = true;
  for (const level of ["log", "info", "warn", "error", "debug"]) {
    const original = console[level]?.bind(console);
    if (!original) continue;
    console[level] = (...args) => {
      try {
        appendDebugEntry(level === "error" ? "error" : level === "warn" ? "warn" : "console", `console.${level}`, {
          args: args.map(arg => safeClone(arg))
        });
      }
      catch (_) {
        // Never break the app because debug logging failed.
      }
      original(...args);
    };
  }
}

function installGlobalDebugHandlers() {
  if (globalHandlersInstalled || typeof window === "undefined") {
    return;
  }
  globalHandlersInstalled = true;
  window.addEventListener("error", event => {
    debugError("window.error", {
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      error: serializeError(event.error)
    });
  });
  window.addEventListener("unhandledrejection", event => {
    debugError("window.unhandledrejection", {
      reason: serializeError(event.reason)
    });
  });
}

function downloadDebugLog() {
  const payload = JSON.stringify(createDebugPayload(), null, 2);
  const blob = new Blob([payload], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  a.href = url;
  a.download = `o-composer-debug-${stamp}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

function createDebugPayload() {
  return {
    app: "O-Composer",
    createdAt: new Date().toISOString(),
    location: typeof location !== "undefined" ? {
      href: location.href,
      pathname: location.pathname,
      search: location.search,
      hash: location.hash
    } : null,
    environment: typeof window !== "undefined" ? {
      userAgent: navigator.userAgent,
      language: navigator.language,
      languages: navigator.languages,
      devicePixelRatio: window.devicePixelRatio || 1,
      viewport: { width: window.innerWidth, height: window.innerHeight },
      screen: window.screen ? {
        width: window.screen.width,
        height: window.screen.height,
        availWidth: window.screen.availWidth,
        availHeight: window.screen.availHeight,
        colorDepth: window.screen.colorDepth,
        pixelDepth: window.screen.pixelDepth
      } : null,
      offscreenCanvas: typeof OffscreenCanvas !== "undefined",
      imageBitmap: typeof ImageBitmap !== "undefined",
      worker: typeof Worker !== "undefined"
    } : null,
    entries: debugEntries.slice()
  };
}

function updateDebugPanel() {
  if (!debugCountNode) {
    return;
  }
  const errors = debugEntries.filter(entry => entry.level === "error").length;
  const warns = debugEntries.filter(entry => entry.level === "warn").length;
  debugCountNode.textContent = `${debugEntries.length} logs${errors ? `, ${errors} err` : ""}${warns ? `, ${warns} warn` : ""}`;
}

function safeClone(value, depth = 0, seen = new WeakSet()) {
  if (value == null || typeof value === "string" || typeof value === "boolean") {
    return value;
  }
  if (typeof value === "number") {
    return Number.isFinite(value) ? roundNumber(value, 6) : String(value);
  }
  if (typeof value === "bigint") {
    return String(value);
  }
  if (typeof value === "function") {
    return `[Function ${value.name || "anonymous"}]`;
  }
  if (value instanceof Error) {
    return serializeError(value);
  }
  if (typeof DOMMatrix !== "undefined" && value instanceof DOMMatrix) {
    return { a: value.a, b: value.b, c: value.c, d: value.d, e: value.e, f: value.f };
  }
  if (typeof DOMRect !== "undefined" && value instanceof DOMRect) {
    return { x: value.x, y: value.y, width: value.width, height: value.height, top: value.top, right: value.right, bottom: value.bottom, left: value.left };
  }
  if (typeof ImageBitmap !== "undefined" && value instanceof ImageBitmap) {
    return { type: "ImageBitmap", width: value.width, height: value.height };
  }
  if (typeof HTMLCanvasElement !== "undefined" && value instanceof HTMLCanvasElement) {
    return { type: "HTMLCanvasElement", width: value.width, height: value.height, clientWidth: value.clientWidth, clientHeight: value.clientHeight };
  }
  if (depth >= 5) {
    return "[MaxDepth]";
  }
  if (typeof value === "object") {
    if (seen.has(value)) {
      return "[Circular]";
    }
    seen.add(value);
    if (Array.isArray(value)) {
      const max = 80;
      const items = value.slice(0, max).map(item => safeClone(item, depth + 1, seen));
      if (value.length > max) {
        items.push(`[${value.length - max} more items]`);
      }
      return items;
    }
    if (value instanceof Map) {
      return { type: "Map", entries: safeClone(Array.from(value.entries()).slice(0, 80), depth + 1, seen), size: value.size };
    }
    if (value instanceof Set) {
      return { type: "Set", values: safeClone(Array.from(value.values()).slice(0, 80), depth + 1, seen), size: value.size };
    }
    const output = {};
    const entries = Object.entries(value);
    const max = 100;
    for (const [key, item] of entries.slice(0, max)) {
      if (key === "map" || key === "omapMap" || key === "eventModel") {
        output[key] = summarizeLargeObject(item);
      }
      else {
        output[key] = safeClone(item, depth + 1, seen);
      }
    }
    if (entries.length > max) {
      output.__truncatedKeys = entries.length - max;
    }
    seen.delete(value);
    return output;
  }
  return String(value);
}

function summarizeLargeObject(value) {
  if (!value || typeof value !== "object") return value;
  return {
    type: value.constructor?.name || "Object",
    keys: Object.keys(value).slice(0, 20),
    symbolCount: Array.isArray(value.symbols) ? value.symbols.length : undefined,
    objectCount: Array.isArray(value.objects) ? value.objects.length : undefined,
    controlCount: Array.isArray(value.controls) ? value.controls.length : undefined,
    courseCount: Array.isArray(value.courses) ? value.courses.length : undefined,
    specialCount: Array.isArray(value.specials) ? value.specials.length : undefined
  };
}

function serializeError(error) {
  if (!error) return error;
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack
    };
  }
  if (typeof error === "object") {
    return safeClone(error, 0);
  }
  return String(error);
}

function roundNumber(value, digits = 3) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}
