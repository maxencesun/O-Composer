import assert from "node:assert/strict";
import { createMapViewHitTestMethods } from "../src/ui/map-view-hit-test-methods.js";

const visibleControl = { id: 1, kind: "normal", location: { x: 0, y: 0 } };
const unusedControl = { id: 2, kind: "normal", location: { x: 100, y: 100 } };
const windowControl = { id: 3, kind: "normal", location: { x: 200, y: 200 } };
const suppressedControl = { id: 4, kind: "normal", location: { x: 300, y: 300 } };
const eventModel = {
  controls: [visibleControl, unusedControl, windowControl, suppressedControl],
  specials: [],
  courses: [
    { id: 7, kind: "normal" },
    { id: 8, kind: "military" }
  ],
  rowsByCourse: new Map([
    [7, [
      { control: visibleControl, courseControl: { id: 70, control: 1 } },
      { control: suppressedControl, courseControl: { id: 71, control: 4 }, suppressControlSymbol: true }
    ]],
    [8, [
      { control: visibleControl, courseControl: { id: 80, control: 1 } },
      { control: windowControl, courseControl: { id: 81, control: 3, timeWindow: true } }
    ]]
  ])
};

const methods = createMapViewHitTestMethods({
  allControlsView: model => model.controls.map(control => ({ control })),
  courseView: (model, courseId) => model.rowsByCourse.get(Number(courseId)) || [],
  getCourse: (model, courseId) => model.courses.find(course => Number(course.id) === Number(courseId)),
  mapCourseDisplayOptions: () => ({}),
  symbolApparentRadiusControl: () => 6,
  nearestLeg: () => null,
  legSelection: () => null
});
const mapView = {
  ...methods,
  scale: () => 1,
  hitTestBackgroundCalibrationPoint: () => null,
  hitTestSelectedCrossingRotation: () => null,
  hitTestSelectedLegBend: () => null,
  hitTestSelectedLegGap: () => null,
  hitTestManualLegGap: () => null,
  hitTestControlNumber: () => null,
  hitTestSpecialHandle: () => null
};

const stateFor = (selectedCourseId, extraUi = {}) => ({
  eventModel,
  ui: {
    selectedCourseId,
    showAllControls: selectedCourseId === "all",
    militaryWindowPreview: false,
    selection: null,
    ...extraUi
  }
});

assert.deepEqual(mapView.hitTest(visibleControl.location, stateFor(7)), { type: "control", id: 1 });
assert.equal(mapView.hitTest(unusedControl.location, stateFor(7)), null,
  "a global control unused by the selected course must not be hit-testable");
assert.equal(mapView.hitTest(unusedControl.location, stateFor(7, { showAllControls: true })), null,
  "hit testing must follow the selected course actually drawn on the map");
assert.equal(mapView.hitTest(suppressedControl.location, stateFor(7)), null,
  "a suppressed course symbol must not leave an invisible hit target");
assert.deepEqual(mapView.hitTest(unusedControl.location, stateFor("all")), { type: "control", id: 2 },
  "All Controls must keep every global control selectable");
assert.deepEqual(mapView.hitTest(windowControl.location, stateFor(8)), { type: "control", id: 3 },
  "a visible military window guide remains selectable while editing");
assert.equal(mapView.hitTest(windowControl.location, stateFor(8, { militaryWindowPreview: true })), null,
  "a hidden military window guide must not leave an invisible hit target");

console.log("map hit-testing smoke test passed");
