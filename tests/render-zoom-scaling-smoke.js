import assert from "node:assert/strict";
import { screenSize } from "../src/ui/course-symbols.js";
import { drawFallbackSpecialPoint, drawSquareHandle, mapScreenSize, specialLineWidth, textMetrics } from "../src/ui/map-view-helpers.js";
import { measurementLineDash, zoomScreenSize } from "../src/ui/map-view-render-methods.js";
import { omapScreenSize } from "../src/ui/omap-renderer.js";

const quarter = 0.25;
assert.equal(omapScreenSize(8, quarter), omapScreenSize(8, 1) * quarter);
assert.equal(screenSize(8 * quarter), screenSize(8) * quarter);
assert.equal(mapScreenSize(8 * quarter), mapScreenSize(8) * quarter);
assert.equal(zoomScreenSize(8, quarter), zoomScreenSize(8, 1) * quarter);
assert.equal(zoomScreenSize(8, 24), zoomScreenSize(8, 1));
assert.deepEqual(measurementLineDash("solid", 1), []);
assert.deepEqual(measurementLineDash("dashed", 1), [8, 5]);
assert.deepEqual(measurementLineDash("dotted", 1), [0.1, 5]);
assert.equal(specialLineWidth({ lineWidth: 2 }, quarter), specialLineWidth({ lineWidth: 2 }, 1) * quarter);
assert.equal(textMetrics({ text: "A", font: { height: 8 } }, quarter).fontPx, textMetrics({ text: "A", font: { height: 8 } }, 1).fontPx * quarter);

const handleRects = [];
const handleContext = {
  globalAlpha: 1,
  save() {},
  restore() {},
  setLineDash() {},
  fillRect(x, y, width, height) { handleRects.push({ width, height }); },
  strokeRect() {}
};
drawSquareHandle(handleContext, { x: 0, y: 0 }, true, 24);
drawSquareHandle(handleContext, { x: 0, y: 0 }, true, quarter);
assert.deepEqual(handleRects.map(rect => rect.width), [8, 2]);

const fallbackRects = [];
const fallbackContext = {
  save() {},
  restore() {},
  beginPath() {},
  fill() {},
  stroke() {},
  rect(x, y, width, height) { fallbackRects.push({ width, height }); }
};
drawFallbackSpecialPoint(fallbackContext, "line", { x: 0, y: 0 }, 1);
drawFallbackSpecialPoint(fallbackContext, "line", { x: 0, y: 0 }, quarter);
assert.deepEqual(fallbackRects.map(rect => rect.width), [16, 4]);

console.log("render zoom scaling smoke test passed");
