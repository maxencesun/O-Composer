import {
  APP_RESOURCE_CACHE_NAME,
  APP_RESOURCE_URLS
} from "../ui/app-shell-config.js?v=20260802-90";

const pyodideBase = new URL("../../assets/pyodide/", import.meta.url);
const PYODIDE_BASE_URL = pyodideBase.href;
const PYODIDE_INDEX_URL = pyodideBase.protocol === "file:"
  ? decodeURIComponent(pyodideBase.pathname)
  : pyodideBase.href;
const nativePostMessage = self.postMessage.bind(self);
const nativeFetch = self.fetch.bind(self);
const cachedResourceUrls = new Set(APP_RESOURCE_URLS.map(url => new URL(`../../${url.replace(/^\.\//, "")}`, import.meta.url).href));

self.fetch = async (input, init = {}) => {
  const request = input instanceof Request ? input : new Request(input, init);
  if (String(init.method || request.method || "GET").toUpperCase() === "GET"
    && cachedResourceUrls.has(request.url)
    && "caches" in self) {
    try {
      const cached = await caches.open(APP_RESOURCE_CACHE_NAME).then(cache => cache.match(request.url));
      if (cached) return cached;
    }
    catch {}
  }
  return nativeFetch(input, init);
};

let runtimePromise = null;
let requestQueue = Promise.resolve();

function runtime() {
  if (!runtimePromise) {
    runtimePromise = import(`${PYODIDE_BASE_URL}pyodide.mjs`)
      .then(({ loadPyodide }) => loadPyodide({
        indexURL: PYODIDE_INDEX_URL,
        jsglobals: Object.freeze(Object.create(null))
      }));
  }
  return runtimePromise;
}

async function executePython(source, course) {
  const pyodide = await runtime();
  pyodide.globals.set("__oc_source", String(source || ""));
  pyodide.globals.set("__oc_course_json", JSON.stringify(course || {}));
  try {
    const resultJson = pyodide.runPython(`
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
    return JSON.parse(String(resultJson));
  }
  finally {
    pyodide.globals.delete("__oc_source");
    pyodide.globals.delete("__oc_course_json");
  }
}

async function handleRequest(message) {
  const id = String(message?.id || "");
  if (!id) return;
  try {
    if (message.type === "preload") {
      await runtime();
      nativePostMessage({ id, status: "ready" });
      return;
    }
    if (message.type !== "execute") return;
    nativePostMessage({ id, status: "loading" });
    await runtime();
    nativePostMessage({ id, status: "started" });
    const result = await executePython(message.source, message.course);
    nativePostMessage({ id, status: "result", result });
  }
  catch (error) {
    nativePostMessage({
      id,
      status: "error",
      error: error?.message || String(error)
    });
  }
}

self.addEventListener("message", event => {
  requestQueue = requestQueue.then(() => handleRequest(event.data));
});
