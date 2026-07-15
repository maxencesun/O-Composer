import assert from "node:assert/strict";
import { Worker } from "node:worker_threads";

const workerUrl = new URL("../src/workers/python-page-worker.js", import.meta.url).href;
const bootstrap = `
const { parentPort } = require("node:worker_threads");
globalThis.self = globalThis;
globalThis.WorkerGlobalScope = Object;
globalThis.postMessage = message => parentPort.postMessage(message);
globalThis.addEventListener = (type, listener) => {
  if (type === "message") parentPort.on("message", data => listener({ data }));
};
import(${JSON.stringify(workerUrl)});
`;
const worker = new Worker(bootstrap, { eval: true, execArgv: [] });

try {
  const statuses = [];
  const result = await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("Pyodide worker smoke test timed out")), 30_000);
    worker.on("error", reject);
    worker.on("message", message => {
      statuses.push(message.status);
      if (message.status !== "result" && message.status !== "error") return;
      clearTimeout(timer);
      if (message.status === "error") reject(new Error(message.error));
      else resolve(message.result);
    });
    worker.postMessage({
      id: "python-worker-smoke",
      type: "execute",
      source: `def advanced_flip_exchange(course):
    import statistics
    values = [int(code) for code in course.control_number]
    flip_list = [value > statistics.mean(values) for value in values]
    return flip_list, [False] * course.length`,
      course: {
        length: 3,
        control_number: ["31", "40", "32"],
        branch_name: "A"
      }
    });
  });
  assert.deepEqual(statuses.slice(0, 2), ["loading", "started"]);
  assert.deepEqual(result, [[false, true, false], [false, false, false]]);
}
finally {
  await worker.terminate();
}

console.log("Pyodide page worker smoke test passed");
