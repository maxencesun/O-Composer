const RESOURCE_BASE_URL = new URL('../../assets/mapper-wasm/', import.meta.url);
// Keep this token synchronized with APP_CACHE_VERSION in app-shell config.
const MAPPER_ASSET_VERSION = '20260711-3';
function mapperResourceUrl(path) {
  const url = new URL(path, RESOURCE_BASE_URL);
  url.searchParams.set('v', MAPPER_ASSET_VERSION);
  return url;
}
const MODULE_URL = mapperResourceUrl('mapper-converter.js');
const INITIALIZATION_TIMEOUT_MS = 120_000;
const QT_CANVAS_ID = 'ocad-mapper-wasm-canvas';

let modulePromise = null;
let mapperModule = null;
const statusListeners = new Set();
let currentStatus = Object.freeze({
  phase: 'idle',
  available: null,
  revision: null,
  error: null,
  loadedBytes: 0,
  totalBytes: 0,
  message: null,
});

function setStatus(patch) {
  currentStatus = Object.freeze({ ...currentStatus, ...patch });
  for (const listener of statusListeners) {
    try {
      listener(currentStatus);
    } catch (error) {
      console.error('Mapper WASM status subscriber failed.', error);
    }
  }
  return currentStatus;
}

function handleRuntimeStatus(message) {
  const text = String(message || '');
  const byteProgress = text.match(/Downloading data\.\.\. \((\d+)\/(\d+)\)/i);
  if (byteProgress) {
    setStatus({
      phase: 'loading',
      loadedBytes: Number(byteProgress[1]),
      totalBytes: Number(byteProgress[2]),
      message: text,
    });
    return;
  }
  if (text) setStatus({ message: text });
}

function errorMessage(error) {
  return error instanceof Error ? error.message : String(error);
}

function ensureQtCanvas() {
  if (typeof document === 'undefined') {
    throw new Error('OpenOrienteering Mapper WASM requires a browser document.');
  }

  let canvas = document.getElementById(QT_CANVAS_ID);
  if (canvas instanceof HTMLCanvasElement) return canvas;

  canvas = document.createElement('canvas');
  canvas.id = QT_CANVAS_ID;
  canvas.width = 1;
  canvas.height = 1;
  canvas.tabIndex = -1;
  canvas.setAttribute('aria-hidden', 'true');
  // Qt's wasm platform plugin needs a real canvas. Keep it laid out at 1 px
  // instead of display:none, while ensuring it can never intercept input.
  Object.assign(canvas.style, {
    position: 'fixed',
    left: '-10000px',
    top: '-10000px',
    width: '1px',
    height: '1px',
    opacity: '0',
    pointerEvents: 'none',
  });
  (document.body || document.documentElement).appendChild(canvas);
  return canvas;
}

function putCString(module, text) {
  const bytes = new TextEncoder().encode(`${text}\0`);
  const pointer = module._malloc(bytes.length);
  if (!pointer) throw new Error('Mapper WASM memory allocation failed.');
  module.HEAPU8.set(bytes, pointer);
  return pointer;
}

async function probeModuleResource() {
  try {
    const response = await fetch(MODULE_URL, { method: 'HEAD', cache: 'no-store' });
    if (response.status === 404 || response.status === 410) return 'missing';
    return response.ok ? 'present' : 'unknown';
  } catch (_error) {
    return 'unknown';
  }
}

async function createModule() {
  const imported = await import(MODULE_URL.href);
  const factory = imported.default;
  if (typeof factory !== 'function') {
    throw new Error('Invalid OpenOrienteering Mapper WASM module factory.');
  }

  const canvas = ensureQtCanvas();
  const previousGlobalModule = globalThis.Module;

  return new Promise((resolve, reject) => {
    let settled = false;
    let timeout = 0;
    const finish = (error, module) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      if (error) {
        if (globalThis.Module === config) {
          if (previousGlobalModule === undefined) delete globalThis.Module;
          else globalThis.Module = previousGlobalModule;
        }
        reject(error);
        return;
      }
      resolve(module);
    };

    const config = {
      canvas,
      qtCanvasElements: [canvas],
      setStatus: handleRuntimeStatus,
      locateFile(path) {
        return mapperResourceUrl(path).href;
      },
      onAbort(reason) {
        finish(new Error(`Mapper WASM aborted: ${reason || 'unknown reason'}`));
      },
      quit(exitCode, exception) {
        finish(exception instanceof Error
          ? exception
          : new Error(`Mapper WASM exited with status ${exitCode}.`));
      },
      onRuntimeInitialized() {
        // Emscripten 1.39.8 exposes Module as a thenable. Resolving a Promise
        // with it recursively assimilates the same object, so remove it first.
        delete config.then;
        // Qt 5.15's wasm platform code resolves helpers through global Module.
        globalThis.Module = config;
        // main() runs immediately after this hook. Resolve one microtask later
        // so a Qt startup failure is reported before the bridge is exposed.
        queueMicrotask(() => finish(null, config));
      },
    };

    globalThis.Module = config;
    timeout = setTimeout(() => {
      finish(new Error('Mapper WASM module initialization timed out.'));
    }, INITIALIZATION_TIMEOUT_MS);

    try {
      const createdModule = factory(config);
      if (createdModule !== config) {
        finish(new Error('Mapper WASM factory returned an unexpected module object.'));
      }
    } catch (error) {
      finish(error instanceof Error ? error : new Error(String(error)));
    }
  });
}

async function loadModule() {
  if (mapperModule) return mapperModule;
  if (!modulePromise) {
    setStatus({
      phase: 'loading',
      available: null,
      error: null,
      loadedBytes: 0,
      totalBytes: 0,
      message: 'Loading OpenOrienteering Mapper WebAssembly…',
    });
    modulePromise = createModule()
      .then((module) => {
        mapperModule = module;
        const revisionPointer = module._mapper_core_revision?.();
        const revision = revisionPointer
          ? module.UTF8ToString(revisionPointer)
          : 'OpenOrienteering Mapper';
        setStatus({ phase: 'ready', available: true, revision, error: null });
        return module;
      })
      .catch((error) => {
        modulePromise = null;
        throw error;
      });
  }
  return modulePromise;
}

/** Return an immutable snapshot of the official converter loader state. */
export function status() {
  return currentStatus;
}

/** Subscribe to loader state and `.data` download byte progress. */
export function subscribe(listener) {
  if (typeof listener !== 'function') {
    throw new TypeError('Mapper WASM status subscriber must be a function.');
  }
  statusListeners.add(listener);
  listener(currentStatus);
  return () => statusListeners.delete(listener);
}

/**
 * Warm the 26 MiB Mapper JS/WASM/data bundle before an OCD file is selected.
 * Returns false only when the module asset is not deployed; malformed assets
 * and initialization failures remain explicit errors.
 */
export async function preload() {
  try {
    await loadModule();
    return true;
  } catch (error) {
    if (await probeModuleResource() === 'missing') {
      setStatus({ phase: 'unavailable', available: false, revision: null, error: null });
      return false;
    }
    setStatus({ phase: 'error', available: false, revision: null, error: errorMessage(error) });
    throw new Error(`Mapper WASM initialization failed: ${errorMessage(error)}`, { cause: error });
  }
}

/** Convert one OCD ArrayBuffer through Mapper's native importer/exporter chain. */
export async function convert(arrayBuffer, legacyEncoding = 'Windows-1252') {
  if (!(arrayBuffer instanceof ArrayBuffer)) {
    throw new TypeError('Mapper conversion input must be an ArrayBuffer.');
  }

  const module = await loadModule();
  const input = new Uint8Array(arrayBuffer);
  const inputPointer = module._malloc(input.byteLength || 1);
  if (!inputPointer) throw new Error('Mapper WASM input allocation failed.');
  let encodingPointer = 0;

  try {
    encodingPointer = putCString(module, legacyEncoding);
    module.HEAPU8.set(input, inputPointer);
    const ok = module._mapper_convert_ocd(inputPointer, input.byteLength, encodingPointer);
    const warningsPointer = module._mapper_warnings_json();
    let warnings = [];
    if (warningsPointer) {
      try {
        warnings = JSON.parse(module.UTF8ToString(warningsPointer));
        if (!Array.isArray(warnings)) {
          warnings = ['Mapper returned malformed warning JSON.'];
        }
      } catch (_error) {
        warnings = ['Mapper returned malformed warning JSON.'];
      }
    }

    if (!ok) {
      const errorPointer = module._mapper_error_text();
      throw new Error(errorPointer
        ? module.UTF8ToString(errorPointer)
        : 'Official Mapper conversion failed.');
    }

    const outputPointer = module._mapper_output_data();
    const outputSize = module._mapper_output_size();
    if (!outputPointer || !outputSize || outputPointer + outputSize > module.HEAPU8.length) {
      throw new Error('Mapper returned an invalid OMAP output buffer.');
    }

    // Decode directly from the live WASM view. TextDecoder finishes before the
    // next conversion can overwrite Mapper's output, avoiding an extra slice.
    const xml = new TextDecoder('utf-8').decode(
      module.HEAPU8.subarray(outputPointer, outputPointer + outputSize),
    );
    if (!/^\s*<\?xml\b[\s\S]*<map\b/.test(xml)) {
      throw new Error('Mapper returned an invalid OMAP XML document.');
    }

    const revisionPointer = module._mapper_core_revision();
    const revision = revisionPointer
      ? module.UTF8ToString(revisionPointer)
      : currentStatus.revision || 'OpenOrienteering Mapper';
    return { xml, warnings, revision, mode: 'official-wasm' };
  } finally {
    if (encodingPointer) module._free(encodingPointer);
    module._free(inputPointer);
  }
}

export const preloadOfficialMapper = preload;
export const officialMapperStatus = status;
export const subscribeOfficialMapperStatus = subscribe;
export const convertWithOfficialMapper = convert;
