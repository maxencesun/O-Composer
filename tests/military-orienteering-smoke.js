import assert from "node:assert/strict";
import { createBlankEvent, createCourse } from "../src/domain/event-model.js";
import { addControlAt, addExistingControlToCourse } from "../src/domain/actions.js";
import { buildControlDescriptionRows } from "../src/domain/control-descriptions.js";
import {
  ensureMilitaryGrid,
  ensureMilitaryGrids,
  militaryGrid,
  militaryGridBelongsToCourse,
  militaryGrids,
  militaryGridSpacingMap,
  militaryTimeWindowRows,
  militaryWindowCoordinates,
  moveMilitaryTimeWindow,
  setMilitaryCourseGrid
} from "../src/domain/military-orienteering.js";
import { serializePpen } from "../src/domain/ppen-parser.js";
import { normalizeMilitaryWindowTime } from "../src/ui/app-shell-variation-methods.js";
import { drawMilitaryGrid } from "../src/ui/map-view-helpers.js";
import { militaryGridEdgeHit, militaryGridVertexHit } from "../src/ui/map-view-pointer-methods.js";

const model = createBlankEvent();
const legacyGridModel = createBlankEvent();
const legacyGridCourse = createCourse(1, "Legacy military", "military", 1);
legacyGridModel.courses = [legacyGridCourse];
legacyGridModel.event.militaryGrid = {
  courseId: legacyGridCourse.id,
  locations: [{ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 100, y: 100 }, { x: 0, y: 100 }],
  spacingXcm: 1, spacingYcm: 1, lineWidthMm: 0.18, fontSizeMm: 1.8, startX: 0, startY: 0
};
ensureMilitaryGrids(legacyGridModel);
assert.equal(legacyGridModel.event.militaryGrids.length, 1,
  "a legacy event-level grid should migrate into the global grid library");
assert.equal(legacyGridCourse.options.military.gridId, legacyGridModel.event.militaryGrids[0].id,
  "the legacy owning course should select the migrated grid");
assert.equal(normalizeMilitaryWindowTime("8:05"), "08:05");
assert.equal(normalizeMilitaryWindowTime("65:30"), "65:30", "the first field is elapsed minutes, not hours");
assert.equal(normalizeMilitaryWindowTime("05:60", "09:30"), "09:30", "seconds must stay below 60");
assert.equal(normalizeMilitaryWindowTime("100:00", "09:30"), "09:30", "MM is stored as a two-digit field");
Object.defineProperty(globalThis, "localStorage", {
  configurable: true,
  value: { getItem: key => key === "oComposerLanguage" ? "zh" : null }
});
model.event.map.scale = 10000;
model.event.descriptions.lang = "en"; // Stale file metadata must not override the current Chinese app language.
const course = createCourse(1, "Military", "military", 1);
course.options.printScale = 10000;
const secondCourse = createCourse(2, "Military 2", "military", 2);
const normalCourse = createCourse(3, "Normal", "normal", 3);
model.courses = [course, secondCourse];
const firstGrid = ensureMilitaryGrid(model, course.id);
Object.assign(firstGrid, {
  name: "Main grid",
  locations: [{ x: 0, y: 0 }, { x: 300, y: 0 }, { x: 300, y: 200 }, { x: 0, y: 200 }],
  spacingXcm: 1,
  spacingYcm: 2,
  lineWidthMm: 0.2,
  startX: 10,
  startY: 20,
  fontSizeMm: 2.2
});
assert.equal(militaryGridBelongsToCourse(model, course.id), true);
assert.equal(militaryGridBelongsToCourse(model, secondCourse.id), false,
  "another military course should not reuse the grid until selected");
assert.equal(militaryGridBelongsToCourse(model, "all"), false,
  "the coordinate grid must be hidden from All Controls");
assert.equal(militaryGridBelongsToCourse(model, normalCourse), false,
  "the coordinate grid must be hidden from non-military courses");
assert.deepEqual(militaryGrids(model).map(item => item.name), ["Main grid"],
  "the first grid should be available in the global grid library");
const gridDrawContext = {
  strokes: 0,
  save() {},
  restore() {},
  beginPath() {},
  moveTo() {},
  lineTo() {},
  closePath() {},
  clip() {},
  setLineDash() {},
  stroke() { this.strokes += 1; },
  strokeText() {},
  fillText() {}
};
drawMilitaryGrid(gridDrawContext, model, null, point => point, 1);
assert.equal(gridDrawContext.strokes, 0, "All Controls must not render the military grid");
drawMilitaryGrid(gridDrawContext, model, secondCourse, point => point, 1);
assert.equal(gridDrawContext.strokes, 0, "an independent military course without a grid should render no grid");
drawMilitaryGrid(gridDrawContext, model, course, point => point, 1);
assert.ok(gridDrawContext.strokes > 0, "the grid should render in its owning course");
const secondGrid = ensureMilitaryGrid(model, secondCourse.id);
Object.assign(secondGrid, {
  name: "Second grid",
  locations: [{ x: 400, y: 400 }, { x: 600, y: 400 }, { x: 600, y: 600 }, { x: 400, y: 600 }],
  startX: 50,
  startY: 60
});
assert.deepEqual(militaryGrids(model).map(item => item.name), ["Main grid", "Second grid"],
  "multiple grids should coexist in the global grid library");
assert.equal(setMilitaryCourseGrid(model, secondCourse.id, firstGrid.id), true);
assert.equal(militaryGridBelongsToCourse(model, secondCourse.id), true,
  "the second military course should render a selected global grid");
assert.equal(militaryGrid(model, secondCourse.id).startX, 10);
assert.equal(setMilitaryCourseGrid(model, secondCourse.id, secondGrid.id), true);
assert.equal(militaryGrid(model, secondCourse.id).startX, 50,
  "selecting a different global grid should use that grid independently");
assert.equal(setMilitaryCourseGrid(model, secondCourse.id, firstGrid.id), true);
assert.equal(militaryGrid(model, secondCourse.id).startX, 10,
  "multiple courses can select and share the same global grid");
assert.equal(militaryGridVertexHit({ x: 4, y: 3 }, firstGrid.locations, 6)?.index, 0,
  "grid boundary editing should hit the nearest existing vertex");
assert.equal(militaryGridVertexHit({ x: 30, y: 30 }, firstGrid.locations, 6), null,
  "grid boundary editing should ignore empty map space");
assert.deepEqual(militaryGridEdgeHit({ x: 48, y: 4 }, firstGrid.locations, 6), {
  segmentIndex: 0,
  insertIndex: 1,
  point: { x: 48, y: 0 },
  distance: 4
}, "double-clicking a grid edge should project the new vertex onto that edge");
assert.deepEqual(militaryGridEdgeHit({ x: -3, y: 40 }, firstGrid.locations, 6), {
  segmentIndex: 3,
  insertIndex: 4,
  point: { x: 0, y: 40 },
  distance: 3
}, "the closing grid edge should accept a new vertex");
assert.equal(militaryGridEdgeHit({ x: 40, y: 40 }, firstGrid.locations, 6), null,
  "double-clicking away from a grid edge should make no change");

const selection = addControlAt(model, "normal", { x: 150, y: 100 });
const control = model.controls.find(item => item.id === selection.id);
const firstReference = addExistingControlToCourse(model, course.id, control.id);
const secondReference = addExistingControlToCourse(model, secondCourse.id, control.id);
const firstCourseControl = model.courseControls.find(item => item.id === firstReference.courseControl);
const secondCourseControl = model.courseControls.find(item => item.id === secondReference.courseControl);
secondCourseControl.points = 40;
firstCourseControl.timeWindow = true;
firstCourseControl.windowStartTime = "08:15";
firstCourseControl.windowEndTime = "08:30";
firstCourseControl.points = 25;
const laterSelection = addControlAt(model, "normal", { x: 250, y: 150 });
const laterControl = model.controls.find(item => item.id === laterSelection.id);
const laterReference = addExistingControlToCourse(model, course.id, laterControl.id);
const laterCourseControl = model.courseControls.find(item => item.id === laterReference.courseControl);
laterCourseControl.timeWindow = true;
laterCourseControl.windowStartTime = "09:00";
laterCourseControl.windowEndTime = "09:15";
laterCourseControl.points = 30;

assert.equal(control.kind, "normal", "a time-window point remains a normal global control");
assert.equal(secondCourseControl.timeWindow, false, "window identity belongs only to one course reference");
assert.equal(militaryGridSpacingMap(model, "x"), 100);
assert.equal(militaryGridSpacingMap(model, "y"), 200);
assert.deepEqual(militaryWindowCoordinates(model, control), { y: 20.5, x: 11.5 });
assert.deepEqual(militaryTimeWindowRows(model, course.id).map(row => row.courseControl.id), [firstCourseControl.id, laterCourseControl.id]);
assert.equal(moveMilitaryTimeWindow(model, course.id, laterCourseControl.id, -1), true);
assert.deepEqual(militaryTimeWindowRows(model, course.id).map(row => row.courseControl.id), [laterCourseControl.id, firstCourseControl.id],
  "moving a window up should change the route-specific description order");
assert.equal(moveMilitaryTimeWindow(model, course.id, laterCourseControl.id, -1), false,
  "the first window cannot move above the beginning");
assert.equal(moveMilitaryTimeWindow(model, course.id, laterCourseControl.id, 1), true);
assert.deepEqual(militaryTimeWindowRows(model, course.id).map(row => row.courseControl.id), [firstCourseControl.id, laterCourseControl.id],
  "moving a window down should restore the following position");
assert.equal(moveMilitaryTimeWindow(model, course.id, firstCourseControl.id, 1), true);
assert.deepEqual(militaryTimeWindowRows(model, course.id).map(row => row.courseControl.id), [laterCourseControl.id, firstCourseControl.id]);
assert.equal(militaryTimeWindowRows(model, secondCourse.id).length, 0);

const rows = buildControlDescriptionRows(model, course.id);
assert.deepEqual(rows.filter(row => row.kind === "military-window").map(row => row.control.id), [laterControl.id, control.id],
  "the control description should use the configured window order");
assert.deepEqual(rows.find(row => row.kind === "header3")?.boxes, ["Military", "2 个检查点", "55分"],
  "the score total should share the course summary row and include every time-window point once");
assert.ok(rows.some(row => row.kind === "military-window-section" && row.text === "时间窗口点"));
assert.ok(rows.some(row => row.kind === "military-window-header"
  && row.boxes.join("|") === "时间窗口|坐标（纵，横）|分数"));
assert.ok(rows.some(row => row.kind === "military-window"
  && row.startTime === "08:15"
  && row.endTime === "08:30"
  && row.timeRange === "08:15 - 08:30"
  && row.coordinateY === "20.5"
  && row.coordinateX === "11.5"
  && row.coordinates === "(20.5, 11.5)"
  && row.score === "25"));
assert.ok(!rows.some(row => row.kind === "control" && row.code === control.code),
  "the window is hidden from the ordinary section of its military course");

const secondRows = buildControlDescriptionRows(model, secondCourse.id);
assert.ok(secondRows.some(row => row.kind === "control" && row.code === control.code),
  "the same point is an ordinary control in another course");
assert.ok(!secondRows.some(row => row.kind.startsWith("military-window")));
assert.deepEqual(secondRows.find(row => row.kind === "header3")?.boxes, ["Military 2", "1 个检查点", "40分"],
  "ordinary scored controls should contribute to the total in the course summary row");

const allRows = buildControlDescriptionRows(model, "all");
assert.ok(allRows.some(row => row.kind === "control" && row.code === control.code),
  "All Controls includes the point as an ordinary global control");
assert.ok(!allRows.some(row => row.kind.startsWith("military-window")));
assert.ok(!allRows.some(row => row.kind === "score-total"),
  "All Controls is not a scored course and should not show a total");
assert.equal(model.controls.filter(item => item.id === control.id).length, 1);
assert.equal(model.courseControls.filter(item => item.control === control.id).length, 2);

const saved = serializePpen(model);
assert.match(saved, /kind="military"/);
assert.match(saved, /<military-grids>/);
assert.match(saved, /"name":"Main grid"/);
assert.match(saved, /"name":"Second grid"/);
assert.match(saved, new RegExp(`"gridId":${firstGrid.id}`),
  "the selected global grid should be serialized with each military course");
assert.doesNotMatch(saved, /kind="time-window"/);
assert.match(saved, /time-window="true"[^>]*window-start="08:15"[^>]*window-end="08:30"[^>]*points="25"|points="25"[^>]*time-window="true"[^>]*window-start="08:15"[^>]*window-end="08:30"/);
assert.ok(saved.includes(`"windowOrder":[${laterCourseControl.id},${firstCourseControl.id}]`),
  "the custom window order should persist in the military course extension");

assert.equal((saved.match(new RegExp(`<course-control[^>]*control="${control.id}"`, "g")) || []).length, 2,
  "both course references are serialized");
assert.equal((saved.match(/time-window="true"/g) || []).length, 2,
  "only the two military-course references are serialized as time windows");

console.log("military orienteering smoke test passed");
