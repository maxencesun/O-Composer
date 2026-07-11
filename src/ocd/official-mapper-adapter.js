const RESOURCE_BASE_URL = new URL('../../assets/mapper-wasm/', import.meta.url);
// Generated artifacts are unchanged by app-shell hotfixes. Keep their own
// content version stable so a reload does not redownload the full 26 MiB.
const MAPPER_ARTIFACT_VERSION = '20260711-3';
function mapperResourceUrl(path) {
  const url = new URL(path, RESOURCE_BASE_URL);
  url.searchParams.set('v', MAPPER_ARTIFACT_VERSION);
  return url;
}
const MODULE_URL = mapperResourceUrl('mapper-converter.js');
const DOWNLOAD_STALL_TIMEOUT_MS = 20 * 60_000;
const INITIALIZATION_STALL_TIMEOUT_MS = 5 * 60_000;
const WATCHDOG_TIMER_DRIFT_GRACE_MS = 60_000;
const RESOURCE_PROBE_TIMEOUT_MS = 10_000;
const QT_CANVAS_ID = 'ocad-mapper-wasm-canvas';
const MAPPER_ARTIFACT_BYTES = Object.freeze({
  js: 355_903,
  data: 9_048_838,
  wasm: 18_182_118,
});
export const MAPPER_BUNDLE_TOTAL_BYTES = Object.values(MAPPER_ARTIFACT_BYTES)
  .reduce((sum, size) => sum + size, 0);

let modulePromise = null;
let mapperModule = null;
const statusListeners = new Set();
let clipboardPermissionGuardInstalled = false;
let moduleProgressHeartbeat = null;
let artifactProgress = { js: 0, data: 0, wasm: 0 };
let artifactComplete = { js: false, data: false, wasm: false };
let artifactLastProgressAt = { js: 0, data: 0, wasm: 0 };
let initializationLastProgressAt = 0;
let activeLoadAttempt = 0;
let currentStatus = Object.freeze({
  phase: 'idle',
  available: null,
  revision: null,
  error: null,
  loadedBytes: 0,
  totalBytes: 0,
  downloadComplete: false,
  message: null,
});

function resetArtifactProgress() {
  const now = Date.now();
  artifactProgress = { js: 0, data: 0, wasm: 0 };
  artifactComplete = { js: false, data: false, wasm: false };
  artifactLastProgressAt = { js: now, data: now, wasm: now };
  initializationLastProgressAt = now;
}

function updateArtifactProgress(
  kind,
  loadedBytes,
  { complete = false, message = '' } = {},
  attempt = activeLoadAttempt,
) {
  if (attempt !== activeLoadAttempt || !(kind in artifactProgress)) return;
  const total = MAPPER_ARTIFACT_BYTES[kind];
  const previousLoaded = artifactProgress[kind];
  const previouslyComplete = artifactComplete[kind];
  const downloadWasComplete = Object.values(artifactComplete).every(Boolean);
  const loaded = Math.max(
    previousLoaded,
    Math.min(total, Math.max(0, Number(loadedBytes) || 0)),
  );
  artifactProgress[kind] = loaded;
  if (complete) artifactComplete[kind] = true;
  const now = Date.now();
  if (loaded > previousLoaded || (complete && !previouslyComplete)) {
    artifactLastProgressAt[kind] = now;
  }
  const downloadComplete = Object.values(artifactComplete).every(Boolean);
  if (downloadComplete && !downloadWasComplete) {
    initializationLastProgressAt = now;
  }
  moduleProgressHeartbeat?.(attempt);
  setStatus({
    phase: 'loading',
    loadedBytes: Object.values(artifactProgress).reduce((sum, value) => sum + value, 0),
    totalBytes: MAPPER_BUNDLE_TOTAL_BYTES,
    downloadComplete,
    ...(message ? { message } : {}),
  });
}

function assertArtifactSize(kind, receivedBytes) {
  const expectedBytes = MAPPER_ARTIFACT_BYTES[kind];
  if (receivedBytes !== expectedBytes) {
    throw new Error(
      `Mapper ${kind} size mismatch: received ${receivedBytes} bytes, expected ${expectedBytes}.`,
    );
  }
}

function fallbackClipboardPermissionStatus() {
  const status = typeof EventTarget === 'function' ? new EventTarget() : {};
  Object.defineProperty(status, 'state', { configurable: true, enumerable: true, value: 'prompt' });
  status.onchange = null;
  return status;
}

/**
 * Qt 5.15.2's QWasmClipboard constructor calls Permissions.query() for
 * clipboard-read and clipboard-write, then discards both returned promises.
 * WebKit rejects these unsupported permission descriptors, which otherwise
 * becomes an unhandled rejection even though Mapper initializes and converts
 * successfully. Keep every other permission query untouched and turn only
 * those two WebKit-style rejections into the neutral "prompt" state.
 */
function installClipboardPermissionQueryGuard() {
  if (clipboardPermissionGuardInstalled || typeof navigator === 'undefined') return;
  const permissions = navigator.permissions;
  const originalQuery = permissions?.query;
  if (!permissions || typeof originalQuery !== 'function') return;

  const clipboardPermissions = new Set(['clipboard-read', 'clipboard-write']);
  const guardedQuery = function guardedPermissionQuery(descriptor) {
    const isClipboard = clipboardPermissions.has(String(descriptor?.name || ''));
    try {
      const result = Reflect.apply(originalQuery, permissions, [descriptor]);
      if (!isClipboard) return result;
      return Promise.resolve(result).catch(() => fallbackClipboardPermissionStatus());
    } catch (error) {
      if (isClipboard) return Promise.resolve(fallbackClipboardPermissionStatus());
      throw error;
    }
  };

  try {
    Object.defineProperty(permissions, 'query', {
      configurable: true,
      writable: true,
      value: guardedQuery,
    });
    clipboardPermissionGuardInstalled = true;
  } catch (_error) {
    try {
      permissions.query = guardedQuery;
      clipboardPermissionGuardInstalled = permissions.query === guardedQuery;
    } catch (_assignmentError) {
      // If a browser makes Permissions immutable, Mapper's normal loader error
      // path remains responsible for reporting a real initialization failure.
    }
  }
}

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

function handleRuntimeStatus(message, attempt = activeLoadAttempt) {
  if (attempt !== activeLoadAttempt) return;
  const text = String(message || '');
  const byteProgress = text.match(/Downloading data\.\.\. \((\d+)\/(\d+)\)/i);
  if (byteProgress) {
    // The bundled package is normally supplied through getPreloadedPackage().
    // Keep this fallback progress compatible with generated loaders, but never
    // trust XHR total: Pages reports compressed bytes while XHR exposes decoded
    // loaded bytes.
    updateArtifactProgress('data', Number(byteProgress[1]), { message: text }, attempt);
    return;
  }
  if (text) {
    if (Object.values(artifactComplete).every(Boolean)) {
      initializationLastProgressAt = Date.now();
      moduleProgressHeartbeat?.(attempt);
    }
    setStatus({ message: text });
  }
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
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), RESOURCE_PROBE_TIMEOUT_MS);
  try {
    const response = await fetch(MODULE_URL, {
      method: 'HEAD',
      cache: 'no-store',
      signal: controller.signal,
    });
    if (response.status === 404 || response.status === 410) return 'missing';
    return response.ok ? 'present' : 'unknown';
  } catch (_error) {
    return 'unknown';
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchArtifactResponse(kind, signal) {
  const url = mapperResourceUrl(`mapper-converter.${kind}`);
  const response = await fetch(url, { credentials: 'same-origin', signal });
  if (!response.ok) {
    throw new Error(`Could not download Mapper ${kind}: ${response.status}`);
  }
  return response;
}

async function readArtifactResponse(kind, response, attempt) {
  const expectedBytes = MAPPER_ARTIFACT_BYTES[kind];
  if (!response.body?.getReader) {
    const buffer = await response.arrayBuffer();
    assertArtifactSize(kind, buffer.byteLength);
    updateArtifactProgress(kind, buffer.byteLength, {
      complete: true,
      message: `Downloaded Mapper ${kind}.`,
    }, attempt);
    return buffer;
  }

  const reader = response.body.getReader();
  const bytes = new Uint8Array(expectedBytes);
  let received = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (!value?.byteLength) continue;
    if (received + value.byteLength > expectedBytes) {
      throw new Error(`Mapper ${kind} download exceeded the expected artifact size.`);
    }
    bytes.set(value, received);
    received += value.byteLength;
    updateArtifactProgress(kind, received, {
      message: `Downloading Mapper ${kind}… (${received}/${expectedBytes})`,
    }, attempt);
  }

  assertArtifactSize(kind, received);
  updateArtifactProgress(kind, received, {
    complete: true,
    message: `Downloaded Mapper ${kind}.`,
  }, attempt);
  return bytes.buffer;
}

async function fetchDataBinaryWithProgress(signal, attempt) {
  const response = await fetchArtifactResponse('data', signal);
  return readArtifactResponse('data', response, attempt);
}

async function compileWasmWithProgress(signal, attempt) {
  const response = await fetchArtifactResponse('wasm', signal);
  const expectedBytes = MAPPER_ARTIFACT_BYTES.wasm;

  if (response.body && typeof TransformStream === 'function') {
    let received = 0;
    const progressStream = response.body.pipeThrough(new TransformStream({
      transform(chunk, controller) {
        if (received + chunk.byteLength > expectedBytes) {
          throw new Error('Mapper wasm download exceeded the expected artifact size.');
        }
        received += chunk.byteLength;
        updateArtifactProgress('wasm', received, {
          message: `Downloading Mapper WebAssembly… (${received}/${expectedBytes})`,
        }, attempt);
        controller.enqueue(chunk);
      },
      flush() {
        assertArtifactSize('wasm', received);
        updateArtifactProgress('wasm', received, {
          complete: true,
          message: 'Downloaded Mapper WebAssembly; compiling…',
        }, attempt);
      },
    }));
    const trackedResponse = new Response(progressStream, {
      headers: { 'Content-Type': 'application/wasm' },
    });
    if (typeof WebAssembly.compileStreaming === 'function') {
      return WebAssembly.compileStreaming(trackedResponse);
    }
    const binary = await trackedResponse.arrayBuffer();
    return WebAssembly.compile(binary);
  }

  const binary = await readArtifactResponse('wasm', response, attempt);
  return WebAssembly.compile(binary);
}

function createModule(attempt) {
  installClipboardPermissionQueryGuard();
  const canvas = ensureQtCanvas();
  const previousGlobalModule = globalThis.Module;
  const abortController = new AbortController();
  return new Promise((resolve, reject) => {
    let settled = false;
    let timeout = 0;
    let config = null;
    let watchdogScheduledAt = 0;
    let watchdogDelay = 0;
    const resetWatchdogGrace = () => {
      const now = Date.now();
      for (const kind of Object.keys(artifactComplete)) {
        if (!artifactComplete[kind]) artifactLastProgressAt[kind] = now;
      }
      initializationLastProgressAt = now;
    };
    const watchdogState = () => {
      const now = Date.now();
      const incomplete = Object.keys(artifactComplete).filter(kind => !artifactComplete[kind]);
      if (incomplete.length) {
        const kind = incomplete.reduce((oldest, candidate) => (
          artifactLastProgressAt[candidate] < artifactLastProgressAt[oldest] ? candidate : oldest
        ));
        return {
          phase: 'download',
          kind,
          remaining: artifactLastProgressAt[kind] + DOWNLOAD_STALL_TIMEOUT_MS - now,
        };
      }
      return {
        phase: 'initialization',
        kind: null,
        remaining: initializationLastProgressAt + INITIALIZATION_STALL_TIMEOUT_MS - now,
      };
    };
    const armStallTimeout = () => {
      clearTimeout(timeout);
      if (settled || attempt !== activeLoadAttempt) return;
      const state = watchdogState();
      watchdogDelay = Math.max(1_000, state.remaining);
      watchdogScheduledAt = Date.now();
      timeout = setTimeout(checkStallTimeout, watchdogDelay);
    };
    const checkStallTimeout = () => {
      if (settled || attempt !== activeLoadAttempt) return;
      const now = Date.now();
      const timerDrift = now - (watchdogScheduledAt + watchdogDelay);
      const pagePaused = typeof document !== 'undefined' && document.visibilityState === 'hidden';
      const offline = typeof navigator !== 'undefined' && navigator.onLine === false;
      if (pagePaused || offline || timerDrift > WATCHDOG_TIMER_DRIFT_GRACE_MS) {
        resetWatchdogGrace();
        armStallTimeout();
        return;
      }
      const state = watchdogState();
      if (state.remaining > 0) {
        armStallTimeout();
        return;
      }
      if (state.phase === 'download') {
        finish(new Error(
          `Mapper ${state.kind} download received no data for ${DOWNLOAD_STALL_TIMEOUT_MS / 60_000} minutes.`,
        ));
        return;
      }
      finish(new Error(
        `Mapper WASM initialization made no progress for ${INITIALIZATION_STALL_TIMEOUT_MS / 60_000} minutes after download.`,
      ));
    };
    const noteInitializationProgress = () => {
      if (attempt !== activeLoadAttempt) return;
      initializationLastProgressAt = Date.now();
      armStallTimeout();
    };
    const handleVisibilityChange = () => {
      if (document.visibilityState !== 'visible') return;
      resetWatchdogGrace();
      armStallTimeout();
    };
    const handleOnline = () => {
      resetWatchdogGrace();
      armStallTimeout();
    };
    const heartbeat = (heartbeatAttempt = attempt) => {
      if (heartbeatAttempt === attempt) armStallTimeout();
    };
    const finish = (error, module) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      if (moduleProgressHeartbeat === heartbeat) moduleProgressHeartbeat = null;
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('online', handleOnline);
      if (error) {
        abortController.abort();
        if (globalThis.Module === config) {
          if (previousGlobalModule === undefined) delete globalThis.Module;
          else globalThis.Module = previousGlobalModule;
        }
        reject(error);
        return;
      }
      resolve(module);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('online', handleOnline);
    moduleProgressHeartbeat = heartbeat;
    armStallTimeout();

    void (async () => {
      // Start the three deploy artifacts together. Data is streamed directly
      // into its final ArrayBuffer, while WASM download and compilation overlap.
      let [imported, dataBinary, compiledWasm] = await Promise.all([
        import(MODULE_URL.href).then((module) => {
          updateArtifactProgress('js', MAPPER_ARTIFACT_BYTES.js, {
            complete: true,
            message: 'Loaded Mapper JavaScript.',
          }, attempt);
          return module;
        }),
        fetchDataBinaryWithProgress(abortController.signal, attempt),
        compileWasmWithProgress(abortController.signal, attempt),
      ]);
      if (settled) return;
      noteInitializationProgress();

      const factory = imported.default;
      imported = null;
      if (typeof factory !== 'function') {
        throw new Error('Invalid OpenOrienteering Mapper WASM module factory.');
      }

      config = {
        canvas,
        qtCanvasElements: [canvas],
        setStatus(message) {
          handleRuntimeStatus(message, attempt);
        },
        locateFile(path) {
          return mapperResourceUrl(path).href;
        },
        getPreloadedPackage(_packageName, packageSize) {
          if (!dataBinary) return null;
          if (Number(packageSize) && Number(packageSize) !== dataBinary.byteLength) {
            throw new Error('Mapper data package metadata does not match the downloaded artifact.');
          }
          const result = dataBinary;
          dataBinary = null;
          return result;
        },
        instantiateWasm(imports, receiveInstance) {
          const wasmModule = compiledWasm;
          compiledWasm = null;
          queueMicrotask(() => {
            void WebAssembly.instantiate(wasmModule, imports)
              .then((instance) => {
                noteInitializationProgress();
                receiveInstance(instance, wasmModule);
              })
              .catch(error => finish(error instanceof Error ? error : new Error(String(error))));
          });
          return {};
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
      const createdModule = factory(config);
      if (createdModule !== config) {
        throw new Error('Mapper WASM factory returned an unexpected module object.');
      }
    })().catch(error => finish(error instanceof Error ? error : new Error(String(error))));
  });
}

async function loadModule() {
  if (mapperModule) return mapperModule;
  if (!modulePromise) {
    const attempt = ++activeLoadAttempt;
    resetArtifactProgress();
    setStatus({
      phase: 'loading',
      available: null,
      error: null,
      loadedBytes: 0,
      totalBytes: MAPPER_BUNDLE_TOTAL_BYTES,
      downloadComplete: false,
      message: 'Loading OpenOrienteering Mapper WebAssembly…',
    });
    modulePromise = createModule(attempt)
      .then((module) => {
        if (attempt !== activeLoadAttempt) {
          throw new Error('Mapper WASM load was superseded by a newer attempt.');
        }
        mapperModule = module;
        const revisionPointer = module._mapper_core_revision?.();
        const revision = revisionPointer
          ? module.UTF8ToString(revisionPointer)
          : 'OpenOrienteering Mapper';
        setStatus({
          phase: 'ready',
          available: true,
          revision,
          error: null,
          loadedBytes: MAPPER_BUNDLE_TOTAL_BYTES,
          totalBytes: MAPPER_BUNDLE_TOTAL_BYTES,
          downloadComplete: true,
          message: 'OpenOrienteering Mapper WebAssembly is ready.',
        });
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

/** Subscribe to loader state and combined JS/data/WASM byte progress. */
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
    // Once any artifact bytes arrived, deployment is proven and a second HEAD
    // request only makes a weak-network failure slower. Probe only zero-byte
    // startup failures, with its own short timeout.
    if (currentStatus.loadedBytes === 0 && await probeModuleResource() === 'missing') {
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
