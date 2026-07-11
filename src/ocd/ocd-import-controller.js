import {
  convert as convertWithOfficialMapper,
  preload as preloadOfficialMapper,
  status as officialMapperStatus,
  subscribe as subscribeOfficialMapperStatus,
  MAPPER_BUNDLE_TOTAL_BYTES,
} from './official-mapper-adapter.js?v=20260712-2';

export const LARGE_OCD_FILE_BYTES = 64 * 1024 * 1024;
export const MAX_OCD_FILE_BYTES = 512 * 1024 * 1024;

const FALLBACK_WORKER_URL = new URL('../workers/ocd-convert-worker.js?v=20260712-2', import.meta.url);
const WORKER_PRELOAD_TIMEOUT_MS = 30_000;
const INITIAL_STATE = Object.freeze({
  phase: 'idle',
  mode: null,
  error: null,
  loadedBytes: 0,
  totalBytes: 0,
  engineLoadedBytes: 0,
  engineTotalBytes: MAPPER_BUNDLE_TOTAL_BYTES,
  engineDownloadComplete: false,
  currentFileName: null,
  large: false,
  operation: null,
  message: null,
});

let requestSequence = 0;

function nextRequestId() {
  requestSequence += 1;
  return `ocd-${Date.now()}-${requestSequence}`;
}

function asMessage(error) {
  return error instanceof Error ? error.message : String(error);
}

function formatMiB(bytes) {
  return `${(bytes / (1024 * 1024)).toFixed(bytes >= 100 * 1024 * 1024 ? 0 : 1)} MiB`;
}

function makeImportError(code, message, cause = null) {
  const error = new Error(message);
  error.name = 'OcadImportError';
  error.code = code;
  if (cause) error.cause = cause;
  return error;
}

function invokeProgress(callback, detail) {
  if (typeof callback !== 'function') return;
  try {
    callback(Object.freeze(detail));
  } catch (error) {
    console.error('OCAD import progress callback failed.', error);
  }
}

function readOmapStats(xml) {
  const countAttribute = (tag, attribute) => {
    const match = xml.match(new RegExp(`<${tag}\\b[^>]*\\b${attribute}="(\\d+)"`, 'i'));
    return match ? Number(match[1]) : 0;
  };
  const versionMatch = xml.match(/<map\b[^>]*\bversion="(\d+)"/i);
  // Only the first <objects> block is the active map part. Mapper may also
  // serialize undo history later in the document; counting all blocks would
  // inflate the visible object count and retain no useful information.
  return {
    colors: countAttribute('colors', 'count'),
    symbols: countAttribute('symbols', 'count'),
    objects: countAttribute('objects', 'count'),
    strings: null,
    omapVersion: versionMatch ? Number(versionMatch[1]) : 9,
  };
}

function validateFile(file) {
  if (!file || typeof file !== 'object' || typeof file.size !== 'number') {
    throw makeImportError('OCD_FILE_REQUIRED', '请选择一个 OCAD .ocd 地图文件。');
  }
  if (!Number.isFinite(file.size) || file.size < 0) {
    throw makeImportError('OCD_FILE_INVALID', '无法读取所选 OCAD 文件的大小。');
  }
  if (file.size === 0) {
    throw makeImportError('OCD_FILE_EMPTY', '所选 OCAD 文件为空。');
  }
  if (file.size > MAX_OCD_FILE_BYTES) {
    throw makeImportError(
      'OCD_FILE_TOO_LARGE',
      `该 OCAD 文件为 ${formatMiB(file.size)}，超过浏览器导入上限 ${formatMiB(MAX_OCD_FILE_BYTES)}。`,
    );
  }
}

function validateOcadHeader(buffer) {
  if (buffer.byteLength < 8) {
    throw makeImportError('OCD_HEADER_INVALID', '文件过短，不包含有效的 OCAD 文件头。');
  }
  const view = new DataView(buffer);
  const vendorMark = view.getUint16(0, true);
  if (vendorMark !== 0x0cad) {
    throw makeImportError('OCD_HEADER_INVALID', '所选文件不是有效的 OCAD 地图。');
  }
  const version = view.getUint16(4, true);
  if (![6, 7, 8, 9, 10, 11, 12, 2018].includes(version)) {
    throw makeImportError('OCD_VERSION_UNSUPPORTED', `暂不支持 OCAD ${version} 文件。`);
  }
}

function readFileAsArrayBuffer(file, onProgress, onState) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    const totalBytes = file.size;

    const cleanup = () => {
      reader.onload = null;
      reader.onerror = null;
      reader.onabort = null;
      reader.onprogress = null;
    };

    reader.onprogress = (event) => {
      const loadedBytes = Math.min(totalBytes, Number(event.loaded) || 0);
      onState(loadedBytes);
      invokeProgress(onProgress, {
        phase: 'reading',
        loadedBytes,
        totalBytes,
        progress: totalBytes ? loadedBytes / totalBytes : 0,
        large: totalBytes >= LARGE_OCD_FILE_BYTES,
      });
    };
    reader.onerror = () => {
      const cause = reader.error || new Error('Unknown FileReader error.');
      cleanup();
      reject(makeImportError('OCD_FILE_READ_FAILED', `读取 OCAD 文件失败：${asMessage(cause)}`, cause));
    };
    reader.onabort = () => {
      cleanup();
      reject(makeImportError('OCD_FILE_READ_ABORTED', 'OCAD 文件读取已取消。'));
    };
    reader.onload = () => {
      const result = reader.result;
      cleanup();
      if (!(result instanceof ArrayBuffer)) {
        reject(makeImportError('OCD_FILE_READ_FAILED', '浏览器未返回有效的 OCAD 二进制数据。'));
        return;
      }
      onState(totalBytes);
      invokeProgress(onProgress, {
        phase: 'reading',
        loadedBytes: totalBytes,
        totalBytes,
        progress: 1,
        large: totalBytes >= LARGE_OCD_FILE_BYTES,
      });
      resolve(result);
    };

    reader.readAsArrayBuffer(file);
  });
}

function nextPaint() {
  if (typeof requestAnimationFrame === 'function') {
    return new Promise((resolve) => requestAnimationFrame(() => resolve()));
  }
  return Promise.resolve();
}

class OcadImportController {
  constructor() {
    this._state = INITIAL_STATE;
    this._listeners = new Set();
    this._preloadPromise = null;
    this._preloaded = false;
    this._loaderFailed = false;
    this._officialAvailable = false;
    this._conversionPromise = null;
    this._fallbackWorker = null;
    this._fallbackWorkerPromise = null;
  }

  snapshot() {
    return this._state;
  }

  subscribe(listener) {
    if (typeof listener !== 'function') {
      throw new TypeError('OCAD import subscriber must be a function.');
    }
    this._listeners.add(listener);
    listener(this._state);
    return () => this._listeners.delete(listener);
  }

  _update(patch) {
    this._state = Object.freeze({ ...this._state, ...patch });
    for (const listener of this._listeners) {
      try {
        listener(this._state);
      } catch (error) {
        console.error('OCAD import subscriber failed.', error);
      }
    }
    return this._state;
  }

  async preload({ preserveFileContext = false } = {}) {
    if (this._conversionPromise) return this._state;
    if (this._preloaded) {
      return this._update({
        phase: 'ready',
        mode: this._officialAvailable ? 'official-wasm' : 'js-fallback',
        error: null,
        operation: null,
        message: 'OCAD 转换组件已就绪。',
        ...(preserveFileContext ? {} : {
          loadedBytes: 0,
          totalBytes: 0,
          currentFileName: null,
          large: false,
        }),
      });
    }
    if (this._preloadPromise) return this._preloadPromise;

    this._loaderFailed = false;
    this._update({
      phase: 'loading',
      error: null,
      operation: 'preloading',
      message: '正在加载 OCAD 转换组件…',
      engineLoadedBytes: 0,
      engineTotalBytes: MAPPER_BUNDLE_TOTAL_BYTES,
      engineDownloadComplete: false,
      ...(preserveFileContext ? {} : {
        loadedBytes: 0,
        totalBytes: 0,
        currentFileName: null,
        large: false,
      }),
    });

    const stopOfficialStatus = subscribeOfficialMapperStatus((mapperState) => {
      if (this._state.phase !== 'loading' || mapperState.phase !== 'loading') return;
      const loadedBytes = Number(mapperState.loadedBytes) || 0;
      const totalBytes = Number(mapperState.totalBytes) || 0;
      this._update({
        loadedBytes,
        totalBytes,
        engineLoadedBytes: loadedBytes,
        engineTotalBytes: totalBytes || MAPPER_BUNDLE_TOTAL_BYTES,
        engineDownloadComplete: mapperState.downloadComplete === true,
        message: totalBytes > 0
          ? `正在下载 OCAD 转换数据… ${formatMiB(loadedBytes)} / ${formatMiB(totalBytes)}`
          : '正在加载 OCAD 转换组件…',
      });
    });

    const task = (async () => {
      try {
        this._officialAvailable = await preloadOfficialMapper();
        if (!this._officialAvailable) await this._ensureFallbackWorker();
        const mapperState = officialMapperStatus();
        this._preloaded = true;
        this._loaderFailed = false;
        return this._update({
          phase: 'ready',
          mode: this._officialAvailable ? 'official-wasm' : 'js-fallback',
          error: null,
          operation: null,
          engineLoadedBytes: this._officialAvailable ? Number(mapperState.loadedBytes) || 0 : 0,
          engineTotalBytes: this._officialAvailable ? Number(mapperState.totalBytes) || MAPPER_BUNDLE_TOTAL_BYTES : 0,
          engineDownloadComplete: this._officialAvailable ? mapperState.downloadComplete === true : true,
          message: this._officialAvailable
            ? 'OCAD 转换组件已就绪。'
            : '官方转换组件不可用，将使用 JavaScript 兼容模式。',
        });
      } catch (error) {
        this._preloaded = false;
        this._loaderFailed = true;
        this._officialAvailable = false;
        this._update({
          phase: 'error',
          mode: null,
          error: asMessage(error),
          operation: 'preloading',
          message: 'OCAD 转换组件加载失败，请点击“导入 OCAD 地图”重试。',
          engineLoadedBytes: Number(officialMapperStatus().loadedBytes) || 0,
          engineTotalBytes: Number(officialMapperStatus().totalBytes) || MAPPER_BUNDLE_TOTAL_BYTES,
          engineDownloadComplete: officialMapperStatus().downloadComplete === true,
        });
        throw error;
      } finally {
        stopOfficialStatus();
        this._preloadPromise = null;
      }
    })();

    this._preloadPromise = task;
    return task;
  }

  async convertFile(file, { onProgress, legacyEncoding = 'Windows-1252' } = {}) {
    if (this._conversionPromise) {
      const activeName = this._state.currentFileName || '当前文件';
      throw makeImportError(
        'OCD_IMPORT_BUSY',
        `${activeName} 尚未读取或转换完成，请等待当前导入结束后再选择其他 OCAD 文件。`,
      );
    }

    try {
      validateFile(file);
    } catch (error) {
      this._update({
        phase: this._loaderFailed
          ? 'error'
          : (this._preloaded ? 'ready' : (this._preloadPromise ? 'loading' : 'idle')),
        error: asMessage(error),
        currentFileName: file?.name || null,
        totalBytes: Number(file?.size) || 0,
        loadedBytes: 0,
        large: Number(file?.size) >= LARGE_OCD_FILE_BYTES,
        operation: this._loaderFailed ? 'preloading' : null,
        message: asMessage(error),
      });
      throw error;
    }

    const task = this._convertFile(file, { onProgress, legacyEncoding });
    this._conversionPromise = task;
    try {
      return await task;
    } finally {
      if (this._conversionPromise === task) this._conversionPromise = null;
    }
  }

  async _convertFile(file, { onProgress, legacyEncoding }) {
    const fileName = typeof file.name === 'string' && file.name ? file.name : 'map.ocd';
    const fileSize = file.size;
    const large = fileSize >= LARGE_OCD_FILE_BYTES;

    try {
      this._update({
        phase: this._preloaded ? 'ready' : 'loading',
        error: null,
        loadedBytes: 0,
        totalBytes: fileSize,
        currentFileName: fileName,
        large,
        operation: this._preloaded ? null : 'preloading',
        message: this._preloaded
          ? 'OCAD 转换组件已就绪。'
          : '正在加载 OCAD 转换组件…',
      });
      invokeProgress(onProgress, {
        phase: 'preloading',
        loadedBytes: 0,
        totalBytes: fileSize,
        progress: 0,
        large,
      });
      const stopPreloadProgress = subscribeOfficialMapperStatus((mapperState) => {
        if (mapperState.phase !== 'loading') return;
        const loadedBytes = Number(mapperState.loadedBytes) || 0;
        const totalBytes = Number(mapperState.totalBytes) || 0;
        invokeProgress(onProgress, {
          phase: 'preloading',
          loadedBytes,
          totalBytes,
          progress: totalBytes ? loadedBytes / totalBytes : 0,
          large,
        });
      });
      try {
        await this.preload({ preserveFileContext: true });
      } finally {
        stopPreloadProgress();
      }

      this._update({
        phase: 'converting',
        mode: this._officialAvailable ? 'official-wasm' : 'js-fallback',
        error: null,
        loadedBytes: 0,
        totalBytes: fileSize,
        currentFileName: fileName,
        large,
        operation: 'reading',
        message: large
          ? `正在读取大文件 ${fileName}（${formatMiB(fileSize)}），完成前请勿重复点击导入。`
          : `正在读取 ${fileName}…`,
      });

      const buffer = await readFileAsArrayBuffer(
        file,
        onProgress,
        (loadedBytes) => this._update({ loadedBytes }),
      );
      validateOcadHeader(buffer);

      this._update({
        operation: 'converting',
        message: this._officialAvailable
          ? '正在使用 OpenOrienteering Mapper 转换地图…'
          : '正在 Worker 中使用 JavaScript 兼容转换器…',
      });
      invokeProgress(onProgress, {
        phase: 'converting',
        loadedBytes: fileSize,
        totalBytes: fileSize,
        progress: 1,
        large,
      });
      await nextPaint();

      let converted;
      if (this._officialAvailable) {
        converted = await convertWithOfficialMapper(buffer, legacyEncoding);
      } else {
        converted = await this._convertInFallbackWorker(buffer, {
          legacyEncoding,
          prettyXml: false,
        }, fileSize);
      }

      const warnings = Array.isArray(converted.warnings) ? [...converted.warnings] : [];
      if (!this._officialAvailable) {
        warnings.unshift(
          'OpenOrienteering Mapper WebAssembly 不可用；本次使用 JavaScript 兼容模式，高级符号可能存在差异。',
        );
      }
      const result = {
        xml: converted.xml,
        warnings,
        stats: converted.stats || readOmapStats(converted.xml),
        mode: converted.mode || (this._officialAvailable ? 'official-wasm' : 'js-fallback'),
        revision: converted.revision || (this._officialAvailable
          ? officialMapperStatus().revision
          : 'O-Composer JavaScript compatibility converter'),
        fileSize,
        large,
      };

      this._update({
        phase: 'ready',
        mode: result.mode,
        error: null,
        loadedBytes: fileSize,
        totalBytes: fileSize,
        currentFileName: fileName,
        large,
        operation: null,
        message: `${fileName} 已转换完成。`,
      });
      invokeProgress(onProgress, {
        phase: 'done',
        loadedBytes: fileSize,
        totalBytes: fileSize,
        progress: 1,
        large,
      });
      return result;
    } catch (error) {
      this._update({
        phase: this._loaderFailed ? 'error' : (this._preloaded ? 'ready' : 'idle'),
        error: asMessage(error),
        loadedBytes: Math.min(this._state.loadedBytes, fileSize),
        totalBytes: fileSize,
        currentFileName: fileName,
        large,
        operation: this._loaderFailed ? (this._state.operation || 'preloading') : null,
        message: `无法导入 ${fileName}：${asMessage(error)}`,
      });
      throw error;
    }
  }

  async _ensureFallbackWorker() {
    if (this._fallbackWorker) return this._fallbackWorker;
    if (this._fallbackWorkerPromise) return this._fallbackWorkerPromise;
    if (typeof Worker !== 'function') {
      throw makeImportError(
        'OCD_WORKER_UNAVAILABLE',
        '当前浏览器不支持 Web Worker，无法安全运行 OCAD JavaScript 兼容转换器。',
      );
    }

    this._fallbackWorkerPromise = new Promise((resolve, reject) => {
      const worker = new Worker(FALLBACK_WORKER_URL, { type: 'module' });
      let settled = false;
      const finish = (error) => {
        if (settled) return;
        settled = true;
        clearTimeout(timeout);
        worker.removeEventListener('message', onMessage);
        worker.removeEventListener('error', onError);
        if (error) {
          worker.terminate();
          reject(error);
          return;
        }
        this._fallbackWorker = worker;
        resolve(worker);
      };
      const onMessage = (event) => {
        if (event.data?.type === 'ready') finish(null);
      };
      const onError = (event) => {
        finish(event.error || makeImportError('OCD_WORKER_FAILED', event.message || 'OCAD Worker 加载失败。'));
      };
      const timeout = setTimeout(() => {
        finish(makeImportError('OCD_WORKER_TIMEOUT', 'OCAD JavaScript 转换 Worker 加载超时。'));
      }, WORKER_PRELOAD_TIMEOUT_MS);
      worker.addEventListener('message', onMessage);
      worker.addEventListener('error', onError);
      worker.postMessage({ id: nextRequestId(), type: 'preload' });
    }).finally(() => {
      this._fallbackWorkerPromise = null;
    });
    return this._fallbackWorkerPromise;
  }

  _discardFallbackWorker() {
    this._fallbackWorker?.terminate();
    this._fallbackWorker = null;
    this._fallbackWorkerPromise = null;
  }

  async _convertInFallbackWorker(buffer, options, fileSize) {
    const worker = await this._ensureFallbackWorker();
    const id = nextRequestId();
    const timeoutMs = Math.min(
      15 * 60_000,
      180_000 + Math.ceil(fileSize / (1024 * 1024)) * 2_000,
    );

    return new Promise((resolve, reject) => {
      let settled = false;
      const finish = (error, value) => {
        if (settled) return;
        settled = true;
        clearTimeout(timeout);
        worker.removeEventListener('message', onMessage);
        worker.removeEventListener('error', onError);
        if (error) reject(error);
        else resolve(value);
      };
      const onMessage = (event) => {
        if (event.data?.id !== id) return;
        if (event.data.ok) {
          finish(null, event.data);
        } else {
          finish(makeImportError(
            'OCD_CONVERSION_FAILED',
            event.data?.error || 'OCAD JavaScript 兼容转换失败。',
          ));
        }
      };
      const onError = (event) => {
        this._discardFallbackWorker();
        finish(event.error || makeImportError('OCD_WORKER_FAILED', event.message || 'OCAD Worker 执行失败。'));
      };
      const timeout = setTimeout(() => {
        this._discardFallbackWorker();
        finish(makeImportError('OCD_CONVERSION_TIMEOUT', 'OCAD JavaScript 兼容转换超时。'));
      }, timeoutMs);

      worker.addEventListener('message', onMessage);
      worker.addEventListener('error', onError);
      // Transfer ownership instead of cloning. After this call the main-thread
      // ArrayBuffer is detached, keeping peak memory bounded for large maps.
      worker.postMessage({ id, type: 'convert', buffer, options }, [buffer]);
    });
  }
}

export const ocadImportController = new OcadImportController();
