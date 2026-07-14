import assert from "node:assert/strict";
import { drawCourseControl, screenSize } from "../src/ui/course-symbols.js";
import { constrainPointToOctants, crossingOrientationForPoint, crossingRotationHandle, drawFallbackSpecialPoint, drawSquareHandle, mapScreenSize, specialLineWidth, textMetrics } from "../src/ui/map-view-helpers.js";
import { exportAreaCanvasRect, measurementLineDash, zoomScreenSize } from "../src/ui/map-view-render-methods.js";
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

assert.deepEqual(
  exportAreaCanvasRect({ left: 0, right: 200, top: 50, bottom: 0 }, { width: 400, height: 400 }),
  { x: 0, y: 150, width: 400, height: 100 },
  "a wide custom export area must be letterboxed and clipped vertically"
);
assert.deepEqual(
  exportAreaCanvasRect({ left: 0, right: 50, top: 200, bottom: 0 }, { width: 400, height: 400 }),
  { x: 150, y: 0, width: 100, height: 400 },
  "a tall custom export area must be letterboxed and clipped horizontally"
);

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

const crossing = { kind: "crossing-point", location: { x: 100, y: 200 }, orientation: 0 };
assert.deepEqual(crossingRotationHandle(crossing, 1), { x: 100, y: 234 });
assert.deepEqual(crossingRotationHandle({ ...crossing, orientation: 90 }, 1), { x: 66, y: 200 });
assert.equal(crossingOrientationForPoint(crossing, { x: 100, y: 240 }), 0);
assert.equal(crossingOrientationForPoint(crossing, { x: 60, y: 200 }), 90);
assert.equal(crossingOrientationForPoint(crossing, { x: 100, y: 160 }), 180);
assert.equal(crossingOrientationForPoint(crossing, { x: 140, y: 200 }), 270);
const optionalCrossing = { kind: "optional-crossing-point", locations: [{ x: 10, y: 20 }], orientation: 90 };
const optionalHandle = crossingRotationHandle(optionalCrossing, 1);
assert.equal(optionalHandle.x, -24);
assert.ok(Math.abs(optionalHandle.y - 20) < 1e-9);
assert.equal(crossingOrientationForPoint(optionalCrossing, { x: 10, y: -20 }), 180);

const exchangeArcs = [];
const exchangeLines = [];
const exchangeContext = {
  save() {},
  restore() {},
  beginPath() {},
  closePath() {},
  stroke() {},
  arc(x, y, radius) { exchangeArcs.push({ x, y, radius }); },
  moveTo(x, y) { exchangeLines.push({ x, y }); },
  lineTo(x, y) { exchangeLines.push({ x, y }); }
};
const exchangeMetrics = {
  unit: 1,
  color: "#b000b5",
  mapStandard: "2017",
  appearance: { controlCircleSizeRatio: 1, lineWidthRatio: 1, centerDotDiameter: 0 }
};
drawCourseControl(exchangeContext, { kind: "map-exchange" }, { x: 10, y: 20 }, exchangeMetrics, {
  exchangeStart: true,
  directionAngle: 0
});
assert.equal(exchangeArcs.length, 1, "a standalone exchange starts its new map with the IOF 7.15 control circle");
assert.ok(exchangeLines.some(point => point.x > 10 && Math.abs(point.y - 20) < 1e-9),
  "the IOF 7.15 triangle points along the outgoing course leg");

const horizontal = constrainPointToOctants({ x: 0, y: 0 }, { x: 10, y: 2 });
assert.equal(horizontal.y, 0);
assert.ok(Math.abs(Math.hypot(horizontal.x, horizontal.y) - Math.hypot(10, 2)) < 1e-9);
const diagonal = constrainPointToOctants({ x: 5, y: 7 }, { x: 13, y: 13 });
assert.ok(Math.abs((diagonal.x - 5) - (diagonal.y - 7)) < 1e-9);
const vertical = constrainPointToOctants({ x: 2, y: 3 }, { x: 4, y: -9 });
assert.equal(vertical.x, 2);
assert.ok(vertical.y < 3);

console.log("render zoom scaling smoke test passed");
