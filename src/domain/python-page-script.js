const SCRIPT_FUNCTION_NAME = "advanced_flip_exchange";
const EXECUTION_TIMEOUT_MS = 3_000;
const PRELOAD_TIMEOUT_MS = 90_000;
const MAX_CACHE_ENTRIES = 200;
const PYODIDE_BASE_URL = new URL("../../assets/pyodide/", import.meta.url);

const executionCache = new Map();
const pendingWorkerRequests = new Map();
const listeners = new Set();

let worker = null;
let workerPreloadPromise = null;
let nodeRuntimePromise = null;

export const PAGE_PYTHON_SAMPLE = `def advanced_flip_exchange(course):
    flip_list=[]
    exchange_list=[]
    num_32_count=0
    for i in range(course.length):
        flip=0
        exchange=0

        is_32=str(course.control_number[i])=="32"
        num_32_count+=is_32
        if is_32 and num_32_count==2:
            flip=1
        assert not flip*exchange

        flip_list.append(flip)
        exchange_list.append(exchange)

    return flip_list,exchange_list`;

export function isPythonPageScript(source) {
  return new RegExp(`^\\s*def\\s+${SCRIPT_FUNCTION_NAME}\\s*\\(`, "m").test(String(source || ""));
}

export function validatePythonPageScript(source) {
  const code = String(source || "");
  if (!code.trim()) return "Script is empty";
  if (!isPythonPageScript(code)) {
    return `Required function '${SCRIPT_FUNCTION_NAME}(course)' was not found`;
  }
  return "";
}

export function subscribePythonPageResults(listener) {
  if (typeof listener !== "function") return () => {};
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function pythonPageExecutionState(source, course) {
  const key = executionKey(source, course);
  const cached = executionCache.get(key);
  if (cached) return cached;
  const entry = { status: "pending", result: null, error: "" };
  executionCache.set(key, entry);
  trimExecutionCache();
  void executePythonPageScript(source, course).catch(() => {});
  return entry;
}

export async function executePythonPageScript(source, course) {
  const code = String(source || "");
  const input = cloneCourseInput(course);
  const validationError = validatePythonPageScript(code);
  if (validationError) throw new Error(validationError);
  const key = executionKey(code, input);
  const cached = executionCache.get(key);
  if (cached?.status === "ready") return cached.result;
  if (cached?.promise) return cached.promise;

  const entry = cached || { status: "pending", result: null, error: "" };
  executionCache.set(key, entry);
  trimExecutionCache();
  entry.promise = executeWithRuntime(code, input)
    .then(result => {
      entry.status = "ready";
      entry.result = result;
      entry.error = "";
      return result;
    })
    .catch(error => {
      entry.status = "error";
      entry.result = null;
      entry.error = cleanPythonError(error?.message || String(error));
      throw new Error(entry.error);
    })
    .finally(() => {
      delete entry.promise;
      notifyListeners();
    });
  return entry.promise;
}

export function preloadPythonPageRuntime() {
  if (typeof Worker === "undefined") return loadNodeRuntime().then(() => undefined);
  if (!workerPreloadPromise) {
    workerPreloadPromise = sendWorkerRequest({ type: "preload" }, PRELOAD_TIMEOUT_MS)
      .then(() => undefined)
      .catch(error => {
        workerPreloadPromise = null;
        throw error;
      });
  }
  return workerPreloadPromise;
}

export function clearPythonPageExecutionCache() {
  executionCache.clear();
}

function executeWithRuntime(source, course) {
  return typeof Worker === "undefined"
    ? executeInNode(source, course)
    : sendWorkerRequest({ type: "execute", source, course }, EXECUTION_TIMEOUT_MS);
}

async function executeInNode(source, course) {
  const pyodide = await loadNodeRuntime();
  pyodide.globals.set("__oc_source", source);
  pyodide.globals.set("__oc_course_json", JSON.stringify(course));
  try {
    const json = pyodide.runPython(`
import json as __oc_json
from types import SimpleNamespace as __oc_SimpleNamespace
__oc_namespace = {}
exec(compile(__oc_source, "<advanced-map-pages>", "exec"), __oc_namespace)
__oc_function = __oc_namespace.get("advanced_flip_exchange")
if not callable(__oc_function):
    raise TypeError("Required function 'advanced_flip_exchange(course)' was not found")
__oc_course = __oc_SimpleNamespace(**__oc_json.loads(__oc_course_json))
__oc_json.dumps(__oc_function(__oc_course))
`);
    return JSON.parse(String(json));
  }
  finally {
    pyodide.globals.delete("__oc_source");
    pyodide.globals.delete("__oc_course_json");
  }
}

function loadNodeRuntime() {
  if (!nodeRuntimePromise) {
    nodeRuntimePromise = import(PYODIDE_BASE_URL.href + "pyodide.mjs")
      .then(({ loadPyodide }) => loadPyodide({
        indexURL: PYODIDE_BASE_URL.protocol === "file:"
          ? decodeURIComponent(PYODIDE_BASE_URL.pathname)
          : PYODIDE_BASE_URL.href,
        jsglobals: Object.freeze(Object.create(null))
      }));
  }
  return nodeRuntimePromise;
}

function ensureWorker() {
  if (worker) return worker;
  worker = new Worker(new URL("../workers/python-page-worker.js?v=20260715-40", import.meta.url), { type: "module" });
  worker.addEventListener("message", handleWorkerMessage);
  worker.addEventListener("error", event => resetWorker(event.error || new Error(event.message || "Python worker failed")));
  worker.addEventListener("messageerror", () => resetWorker(new Error("Python worker returned unreadable data")));
  return worker;
}

function sendWorkerRequest(payload, timeoutMs) {
  const id = requestId();
  return new Promise((resolve, reject) => {
    const request = { resolve, reject, timer: 0, timeoutMs, type: payload.type };
    pendingWorkerRequests.set(id, request);
    if (payload.type === "preload") startRequestTimer(id, request);
    ensureWorker().postMessage({ ...payload, id });
  });
}

function handleWorkerMessage(event) {
  const message = event.data || {};
  const id = String(message.id || "");
  const request = pendingWorkerRequests.get(id);
  if (!request) return;
  if (message.status === "loading") {
    startRequestTimer(id, request, PRELOAD_TIMEOUT_MS);
    return;
  }
  if (message.status === "started") {
    clearTimeout(request.timer);
    request.timer = 0;
    startRequestTimer(id, request, request.timeoutMs);
    return;
  }
  clearTimeout(request.timer);
  pendingWorkerRequests.delete(id);
  if (message.status === "result") request.resolve(message.result);
  else if (message.status === "ready") request.resolve(undefined);
  else request.reject(new Error(message.error || "Python execution failed"));
}

function startRequestTimer(id, request, timeoutMs = request.timeoutMs) {
  if (request.timer) return;
  request.timer = setTimeout(() => {
    const label = request.type === "preload" ? "Python runtime loading" : "Python execution";
    resetWorker(new Error(`${label} timed out`));
  }, timeoutMs);
}

function resetWorker(error) {
  worker?.terminate();
  worker = null;
  workerPreloadPromise = null;
  for (const request of pendingWorkerRequests.values()) {
    clearTimeout(request.timer);
    request.reject(error);
  }
  pendingWorkerRequests.clear();
}

function executionKey(source, course) {
  return `${String(source || "")}\u0000${JSON.stringify(course || {})}`;
}

function cloneCourseInput(course) {
  return JSON.parse(JSON.stringify(course || {}));
}

function requestId() {
  return globalThis.crypto?.randomUUID?.()
    || `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

function cleanPythonError(message) {
  const text = String(message || "Python execution failed").trim();
  const lines = text.split("\n").map(line => line.trimEnd()).filter(Boolean);
  const traceback = lines.findIndex(line => line.startsWith("Traceback"));
  return (traceback >= 0 ? lines.slice(traceback) : lines).join("\n");
}

function notifyListeners() {
  for (const listener of listeners) {
    try { listener(); }
    catch {}
  }
}

function trimExecutionCache() {
  while (executionCache.size > MAX_CACHE_ENTRIES) {
    const first = executionCache.keys().next().value;
    if (executionCache.get(first)?.status === "pending") break;
    executionCache.delete(first);
  }
}
