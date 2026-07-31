import assert from "node:assert/strict";
import {
  circleAngleAtPoint,
  circleGapMidAngle,
  circleGapSpan,
  circlePointAtAngle,
  parseControlCircleGaps,
  setControlCircleGaps
} from "../src/domain/control-circle-gaps.js";
import { deleteSelection } from "../src/domain/actions.js";
import { drawCourseControl } from "../src/ui/course-symbols.js";

const control = {
  id: 1,
  kind: "normal",
  location: { x: 10, y: 20 },
  gaps: [],
  circleGaps: [{ scale: 0, value: "350:20,90:120" }]
};
assert.deepEqual(parseControlCircleGaps(control), [
  { start: 350, stop: 20 },
  { start: 90, stop: 120 }
]);
assert.equal(circleGapSpan(parseControlCircleGaps(control)[0]), 30);
assert.equal(circleGapMidAngle(parseControlCircleGaps(control)[0]), 5);
assert.equal(circleAngleAtPoint(control.location, { x: 10, y: 30 }), 90);
assert.deepEqual(circlePointAtAngle(control.location, 10, 180), { x: 0, y: 20 });

setControlCircleGaps(control, [{ start: -10, stop: 20.1254 }]);
assert.equal(control.circleGaps[0].value, "350:20.125");

const model = { controls: [control], courses: [], courseControls: [], legs: [], specials: [] };
deleteSelection(model, { type: "control-circle-gap", id: 1, gapIndex: 0 });
assert.equal(control.circleGaps[0].value, "", "deleting a selected circle cut updates its persisted PPen value");

control.circleGaps[0].value = "10:50";
const arcs = [];
const context = {
  save() {},
  restore() {},
  beginPath() {},
  stroke() {},
  fill() {},
  arc(...args) { arcs.push(args); }
};
const metrics = {
  unit: 1,
  color: "#b000b5",
  mapStandard: "2017",
  appearance: { controlCircleSizeRatio: 1, lineWidthRatio: 1, centerDotDiameter: 0 }
};
drawCourseControl(context, control, { x: 10, y: 20 }, metrics);
assert.ok(arcs.some(args => args.length >= 5), "a persisted manual cut is rendered as partial control-circle arcs");

arcs.length = 0;
drawCourseControl(context, { ...control, kind: "finish" }, { x: 10, y: 20 }, metrics);
assert.equal(arcs.filter(args => args.length >= 5).length, 4, "a finish cut is applied to both finish circles");
assert.equal(new Set(arcs.map(args => args[2])).size, 2, "the inner and outer finish rings are both cut");

console.log("control circle gaps smoke test passed");
