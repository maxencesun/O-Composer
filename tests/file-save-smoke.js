import assert from "node:assert/strict";
import { createAppShellFileExportMethods } from "../src/ui/app-shell-file-export-methods.js";
import { baseName, safeFilePart } from "../src/ui/app-shell-pdf-helpers.js";

const downloads = [];
const cleanNames = [];
let dialogConfig = null;
const state = {
  eventModel: { sourceName: "Original.ocp", event: {}, metadata: {} },
  ui: {}
};
const methods = createAppShellFileExportMethods({
  cloneEvent: value => structuredClone(value),
  syncDescriptionLanguageWithApp: () => {},
  serializeOcp: () => "<ocp />",
  download: (...args) => downloads.push(args),
  baseName,
  safeFilePart,
  escapeHtml: value => String(value),
  escapeAttr: value => String(value)
});
const context = {
  store: {
    snapshot: () => state,
    markClean: fileName => cleanNames.push(fileName)
  },
  t: value => value,
  openCommandDialog: config => { dialogConfig = config; },
  ocpDataForSave: () => ({})
};

methods.downloadOcp.call(context);
assert.ok(dialogConfig, "saving must open a naming dialog before downloading");
assert.match(dialogConfig.body, /Original\.ocp/);
assert.equal(downloads.length, 0, "opening the naming dialog must not download immediately");

const input = { value: "校园赛:决赛" };
dialogConfig.apply({ querySelector: selector => selector === "#ocpFileName" ? input : null });
assert.equal(downloads[0][0], "校园赛-决赛.ocp", "the save dialog must sanitize the chosen name and append .ocp");
assert.equal(cleanNames[0], "校园赛-决赛.ocp", "later saves must reuse the chosen file name");

console.log("file save smoke test passed");
