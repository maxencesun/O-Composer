import assert from "node:assert/strict";
import { createAppShellDialogMethods } from "../src/ui/app-shell-dialog-methods.js";

const listeners = new Map();
globalThis.document = {
  addEventListener(type, listener) { listeners.set(type, listener); },
  removeEventListener(type, listener) {
    if (listeners.get(type) === listener) listeners.delete(type);
  }
};
globalThis.window = { innerWidth: 1000, innerHeight: 700 };

const style = {};
const classes = new Set();
const dialog = {
  id: "userGuideDialog",
  dataset: {},
  style,
  classList: {
    add(name) { classes.add(name); },
    remove(name) { classes.delete(name); }
  },
  getBoundingClientRect() {
    const left = Number.parseFloat(style.left) || 100;
    const top = Number.parseFloat(style.top) || 80;
    return { left, top, width: 300, height: 200, right: left + 300, bottom: top + 200 };
  }
};
const handle = {
  captured: null,
  released: null,
  setPointerCapture(pointerId) { this.captured = pointerId; },
  releasePointerCapture(pointerId) { this.released = pointerId; }
};
const methods = createAppShellDialogMethods({
  clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }
});
const app = { ...methods };
const pointerDown = {
  clientX: 130,
  clientY: 100,
  pointerId: 7,
  preventDefault() {},
  stopPropagation() {}
};

app.startPanelDrag(pointerDown, dialog, handle);
assert.equal(classes.has("dragging"), true, "pointer down should enter dragging state");
assert.equal(handle.captured, 7, "the title bar should capture the active pointer");

listeners.get("pointermove")({ clientX: 20, clientY: 10, preventDefault() {} });
assert.equal(style.left, "8px", "dragging should clamp the left edge to the viewport");
assert.equal(style.top, "8px", "dragging should clamp the top edge to the viewport");
assert.equal(dialog.dataset.userPositioned, "true", "a real drag should remember that the guide was positioned by the user");

listeners.get("pointermove")({ clientX: 2000, clientY: 1500, preventDefault() {} });
assert.equal(style.left, "692px", "dragging should clamp the right edge to the viewport");
assert.equal(style.top, "492px", "dragging should clamp the bottom edge to the viewport");

listeners.get("pointerup")({ pointerId: 7, preventDefault() {} });
assert.equal(classes.has("dragging"), false, "pointer up should leave dragging state");
assert.equal(handle.released, 7, "pointer up should release pointer capture");
assert.ok(app.userGuideSuppressTitleRestoreUntil > Date.now(), "dragging a minimized title must suppress the following restore click");
assert.equal(listeners.has("pointermove"), false, "drag listeners should be removed after pointer up");

console.log("user guide drag smoke test passed");
