import assert from "node:assert/strict";
import { createAppShellCommandMethods } from "../src/ui/app-shell-command-methods.js";
import { calibrationGroundDistance } from "../src/ui/app-shell-dialog-methods.js";
import {
  applyBackgroundCalibration,
  backgroundAspect,
  backgroundCalibrationAnchorCenter,
  backgroundCalibrationDistance,
  backgroundImagePointForMap,
  resetBackgroundCalibrationBase
} from "../src/ui/app-shell-model-helpers.js";
import { drawBackgroundCalibrationGuide } from "../src/ui/map-view-render-methods.js";

assert.equal(calibrationGroundDistance(2, "map", 10000), 200);
assert.equal(calibrationGroundDistance(125, "ground", 15000), 125);
assert.equal(calibrationGroundDistance(0, "ground", 15000), 0);
assert.equal(calibrationGroundDistance(-2, "map", 10000), 0);
assert.equal(calibrationGroundDistance(Infinity, "ground", 15000), 0);

const interactionState = {
  eventModel: {},
  ui: {
    tool: "background-calibration",
    selection: { type: "background" },
    background: {
      naturalWidth: 1000,
      naturalHeight: 1000,
      centerX: 0,
      centerY: 0,
      widthMeters: 100,
      heightMeters: 100,
      calibrationDistanceMeters: 25,
      calibration: { imagePoints: [], awaitingDistance: true }
    }
  }
};
const store = {
  snapshot: () => interactionState,
  updateUi(update) { update(interactionState.ui); }
};
let promptCount = 0;
let applyCount = 0;
const commandMethods = createAppShellCommandMethods({
  insertionCourseControlId: () => null,
  insertionBeforeCourseControlId: () => null,
  insertionVariationEndOwnerId: () => null,
  selectedLegCourseControlPair: () => null,
  backgroundImagePointForMap,
  backgroundCalibrationDistance,
  resetBackgroundCalibrationBase,
  backgroundAspect,
  applyBackgroundCalibration: () => { applyCount += 1; }
});
const commandHost = {
  store,
  t: value => value,
  syncBackgroundMeasurement() {},
  promptBackgroundCalibrationDistance() { promptCount += 1; }
};
commandMethods.applyTool.call(commandHost, "background-calibration", { x: -20, y: 0 });
assert.equal(promptCount, 0);
assert.equal(interactionState.ui.background.calibration.imagePoints.length, 1);
commandMethods.applyTool.call(commandHost, "background-calibration", { x: 20, y: 0 });
assert.equal(promptCount, 1);
assert.equal(applyCount, 0, "the second point must not apply a stale distance before dialog confirmation");
assert.equal(interactionState.ui.background.widthMeters, 100);
assert.equal(interactionState.ui.tool, "select");
commandMethods.moveBackgroundCalibrationPoint.call(commandHost, { type: "background-calibration-point", pointIndex: 1 }, { x: 25, y: 0 });
assert.equal(applyCount, 0, "pending calibration points should be draggable without scaling");
interactionState.ui.background.calibration.awaitingDistance = false;
commandMethods.moveBackgroundCalibrationPoint.call(commandHost, { type: "background-calibration-point", pointIndex: 1 }, { x: 30, y: 0 });
assert.equal(applyCount, 1, "committed calibration points should rescale after dragging");

const background = {
  naturalWidth: 2000,
  naturalHeight: 1000,
  centerX: 20,
  centerY: -10,
  widthMeters: 200,
  heightMeters: 100,
  printedWidthCm: 2,
  calibrationDistanceMeters: 50,
  calibration: {
    imagePoints: [{ x: 0.25, y: 0.5 }, { x: 0.75, y: 0.5 }]
  }
};
const anchorBefore = backgroundCalibrationAnchorCenter(background);
assert.equal(backgroundCalibrationDistance(background), 100);
applyBackgroundCalibration(background, backgroundAspect(background));
assert.equal(background.widthMeters, 100);
assert.equal(background.heightMeters, 50);
assert.equal(background.printedWidthCm, 1);
assert.equal(backgroundCalibrationDistance(background), 50);
assert.deepEqual(backgroundCalibrationAnchorCenter(background), anchorBefore);

background.calibration.imagePoints[1] = { x: 0.9, y: 0.8 };
const movedAnchor = backgroundCalibrationAnchorCenter(background);
resetBackgroundCalibrationBase(background);
applyBackgroundCalibration(background, backgroundAspect(background));
assert.ok(Math.abs(backgroundCalibrationDistance(background) - 50) < 1e-9);
assert.ok(Math.abs(backgroundCalibrationAnchorCenter(background).x - movedAnchor.x) < 1e-9);
assert.ok(Math.abs(backgroundCalibrationAnchorCenter(background).y - movedAnchor.y) < 1e-9);

const strokes = [];
const arcs = [];
const labels = [];
const context = {
  lineWidth: 0,
  save() {},
  restore() {},
  setLineDash(value) { this.dash = [...value]; },
  beginPath() {},
  moveTo() {},
  lineTo() {},
  stroke() { strokes.push({ width: this.lineWidth, dash: [...(this.dash || [])] }); },
  arc(x, y, radius) { arcs.push({ x, y, radius }); },
  fill() {},
  fillText(value) { labels.push(value); }
};
drawBackgroundCalibrationGuide(context, [{ x: 10, y: 20 }, { x: 90, y: 70 }]);
assert.deepEqual(strokes.slice(0, 2), [
  { width: 5, dash: [] },
  { width: 2.5, dash: [7, 5] }
]);
assert.deepEqual(arcs.map(item => item.radius), [8, 8]);
assert.deepEqual(labels, ["1", "2"]);

console.log("background calibration smoke test passed");
