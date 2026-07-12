import assert from "node:assert/strict";
import { addControlAt, addCourse, addExistingControlToCourse } from "../src/domain/actions.js";
import { courseTopology, courseView } from "../src/domain/course-service.js";
import { createAppShellCoursePanelMethods } from "../src/ui/app-shell-course-panel-methods.js";
import { createAppShellDialogMethods } from "../src/ui/app-shell-dialog-methods.js";
import {
  insertionCourseControlId,
  topologyNodeCourseControlId,
  variationAnchorCourseControl
} from "../src/ui/app-shell-topology-helpers.js";
import { selectionKey } from "../src/ui/app-shell-ui-helpers.js";

const blankCourseModel = {
  event: { map: { scale: 10000 }, numbering: { start: 31, disallowInvertible: false } },
  controls: [
    { id: 1, kind: "start", code: "", location: { x: 0, y: 0 } },
    { id: 2, kind: "finish", code: "", location: { x: 100, y: 0 } }
  ],
  courses: [],
  courseControls: [],
  legs: [],
  specials: []
};
const createdCourse = addCourse(blankCourseModel, "New course");
assert.equal(blankCourseModel.courses[0].firstCourseControl, null, "new courses must not automatically reuse event start/finish controls");
assert.equal(blankCourseModel.courseControls.length, 0);

const newStart = addControlAt(blankCourseModel, "start", { x: 10, y: 10 }, createdCourse.id);
const newControl = addControlAt(blankCourseModel, "normal", { x: 50, y: 10 }, createdCourse.id);
const newFinish = addControlAt(blankCourseModel, "finish", { x: 110, y: 10 }, createdCourse.id);
assert.notEqual(newStart.id, 1);
assert.notEqual(newFinish.id, 2);
assert.deepEqual(courseView(blankCourseModel, createdCourse.id).map(row => row.control.kind), ["start", "normal", "finish"]);
assert.equal(courseView(blankCourseModel, createdCourse.id)[1].courseControl.id, newControl.courseControl);

const reuseCourse = addCourse(blankCourseModel, "Reuse course");
addExistingControlToCourse(blankCourseModel, reuseCourse.id, 1);
addExistingControlToCourse(blankCourseModel, reuseCourse.id, 2);
assert.deepEqual(courseView(blankCourseModel, reuseCourse.id).map(row => row.control.id), [1, 2], "clicking existing start/finish controls should still reuse them");

const branchModel = {
  event: { map: { scale: 10000 }, numbering: { start: 31, disallowInvertible: false } },
  controls: [
    { id: 10, kind: "normal", code: "31", location: { x: 0, y: 0 } },
    { id: 11, kind: "normal", code: "32", location: { x: 100, y: 0 } },
    { id: 12, kind: "normal", code: "33", location: { x: 0, y: 200 } },
    { id: 13, kind: "normal", code: "34", location: { x: 300, y: 0 } }
  ],
  courses: [{ id: 1, name: "Fork", kind: "normal", firstCourseControl: 1, options: {}, relay: {} }],
  courseControls: [
    { id: 1, control: 10, nextCourseControl: 4, variation: "fork", variationEnd: 4, variationCourseControls: [2, 3] },
    { id: 2, control: 10, nextCourseControl: 5, variation: "", variationEnd: null, variationCourseControls: [] },
    { id: 5, control: 11, nextCourseControl: 4, variation: "", variationEnd: null, variationCourseControls: [] },
    { id: 3, control: 10, nextCourseControl: 6, variation: "", variationEnd: null, variationCourseControls: [] },
    { id: 6, control: 12, nextCourseControl: 4, variation: "", variationEnd: null, variationCourseControls: [] },
    { id: 4, control: 13, nextCourseControl: null, variation: "", variationEnd: null, variationCourseControls: [] }
  ],
  legs: [],
  specials: []
};
const terminalUi = {
  selectedCourseId: 1,
  selection: { type: "control", id: 13, courseControl: 4 },
  variationAnchorCourseControl: 4,
  variationInsertAfterCourseControl: 4,
  variationInsertBeforeCourseControl: null,
  variationSelectedSegment: "node:4"
};
assert.equal(variationAnchorCourseControl(branchModel, 1, terminalUi), null, "a terminal node must not become a fork anchor without a following join");
assert.equal(variationAnchorCourseControl(branchModel, 1, terminalUi, { selectionOnly: true })?.id, 4, "a terminal node must still be selectable in the topology");

const state = {
  eventModel: branchModel,
  ui: {
    selectedCourseId: 1,
    selection: { type: "control", id: 10, courseControl: 1 },
    variationAnchorCourseControl: 1,
    variationInsertAfterCourseControl: 1,
    variationInsertBeforeCourseControl: null,
    variationSelectedSegment: "node:1",
    variationBranch: null,
    variationAdjustmentMode: ""
  }
};
const store = {
  snapshot: () => state,
  updateUi(update) { update(state.ui); }
};
const coursePanelMethods = createAppShellCoursePanelMethods({
  courseTopology,
  topologyNodeCourseControlId,
  teamAddControlRoleFromSelection: () => null
});
coursePanelMethods.setSelection.call({ store }, { type: "control", id: 13 });
assert.equal(state.ui.selection.courseControl, 4);
assert.equal(state.ui.variationAnchorCourseControl, 4);
assert.equal(state.ui.variationInsertAfterCourseControl, 4);
assert.equal(state.ui.variationSelectedSegment, "node:4");
assert.equal(insertionCourseControlId(state), 4);

const appended = addControlAt(branchModel, "normal", { x: 350, y: 0 }, 1, { afterCourseControl: insertionCourseControlId(state) });
assert.equal(branchModel.courseControls.find(item => item.id === 4).nextCourseControl, appended.courseControl, "a control selected on the map must insert after the corresponding topology node");
assert.notEqual(selectionKey({ type: "control", id: 10, courseControl: 1 }), selectionKey({ type: "control", id: 10, courseControl: 2 }));

const crossingModel = {
  controls: [{ id: 21, kind: "crossing-point", location: { x: 10, y: 20 }, orientation: 0 }],
  specials: [{ id: 31, kind: "optional-crossing-point", locations: [{ x: 30, y: 40 }], orientation: 0 }]
};
const crossingUi = {};
const rotationStore = {
  updateEvent(update) { update(crossingModel); },
  updateUi(update) { update(crossingUi); }
};
const rotationMethods = createAppShellDialogMethods({
  findById: (items, id) => items.find(item => Number(item.id) === Number(id)) || null
});
rotationMethods.previewCrossingRotation.call({ store: rotationStore }, { type: "control", id: 21 }, 45);
assert.equal(crossingUi.crossingRotationPreview.orientation, 45);
rotationMethods.commitCrossingRotation.call({ store: rotationStore }, { type: "control", id: 21 }, -90);
assert.equal(crossingModel.controls[0].orientation, 270, "mandatory crossing rotation must normalize and persist the dragged angle");
rotationMethods.commitCrossingRotation.call({ store: rotationStore }, { type: "special", id: 31 }, 450);
assert.equal(crossingModel.specials[0].orientation, 90, "optional crossing rotation must normalize and persist the dragged angle");
assert.equal(crossingUi.crossingRotationPreview, null);

console.log("course editing smoke test passed");
