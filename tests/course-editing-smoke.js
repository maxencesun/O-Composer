import assert from "node:assert/strict";
import {
  addControlAt,
  addCourse,
  addExistingControlToCourse,
  addVariationAtCourseControl,
  updateControlCode,
  validateControlCode
} from "../src/domain/actions.js";
import { courseTopology, courseView } from "../src/domain/course-service.js";
import { buildControlDescriptionRows } from "../src/domain/control-descriptions.js";
import { exportCourseSvg } from "../src/domain/exporters.js";
import { createAppShellCoursePanelMethods } from "../src/ui/app-shell-course-panel-methods.js";
import { createAppShellDialogMethods } from "../src/ui/app-shell-dialog-methods.js";
import {
  insertionCourseControlId,
  insertionVariationEndOwnerId,
  topologyNodeSvg,
  topologyNodeCourseControlId,
  topologyPathAttrs,
  variationAnchorCourseControl
} from "../src/ui/app-shell-topology-helpers.js";
import { selectionKey } from "../src/ui/app-shell-ui-helpers.js";

const scalableTopologyNode = topologyNodeSvg(
  { kind: "normal", code: "31" },
  { x: 40, y: 60 },
  1,
  false
);
assert.match(scalableTopologyNode, /font-size="26"/, "in-page topology text uses SVG user units so viewBox scaling changes its size");

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
assert.equal(blankCourseModel.controls.find(control => control.id === newStart.id).code, "S1", "new starts receive sequential S codes");
assert.equal(blankCourseModel.controls.find(control => control.id === newFinish.id).code, "F1", "new finishes receive sequential F codes");
assert.equal(updateControlCode(blankCourseModel, newStart.id, "START-A").ok, true, "start codes are editable");
assert.equal(updateControlCode(blankCourseModel, newFinish.id, "FINISH-A").ok, true, "finish codes are editable");
assert.notEqual(newStart.id, 1);
assert.notEqual(newFinish.id, 2);
assert.deepEqual(courseView(blankCourseModel, createdCourse.id).map(row => row.control.kind), ["start", "normal", "finish"]);
assert.equal(courseView(blankCourseModel, createdCourse.id)[1].courseControl.id, newControl.courseControl);
const allEndpointRows = buildControlDescriptionRows(blankCourseModel, "all");
assert.ok(allEndpointRows.some(row => row.code === "START-A"), "All Controls descriptions show start codes");
assert.ok(allEndpointRows.some(row => row.code === "FINISH-A"), "All Controls descriptions show finish codes");
const courseEndpointRows = buildControlDescriptionRows(blankCourseModel, createdCourse.id);
assert.ok(!courseEndpointRows.some(row => row.code === "START-A" || row.code === "FINISH-A"),
  "individual-course descriptions hide start and finish codes by default");
blankCourseModel.event.courseAppearance = { controlCircleSizeRatio: 2, lineWidthRatio: 1.25, numberSizeRatio: 1.5 };
const scaledSvg = exportCourseSvg(blankCourseModel, createdCourse.id);
assert.match(scaledSvg, /font-size="27"/, "SVG label font follows the course number-size ratio");
assert.match(scaledSvg, /r="30"/, "SVG control symbols follow the course circle-size ratio");
assert.doesNotMatch(scaledSvg, />START-A<|>FINISH-A</, "ordinary-course SVG maps hide start and finish codes");
const allControlsSvg = exportCourseSvg(blankCourseModel, "all");
assert.match(allControlsSvg, />START-A</, "All Controls SVG maps show start codes");
assert.match(allControlsSvg, />FINISH-A</, "All Controls SVG maps show finish codes");

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
assert.equal(validateControlCode(branchModel, 10, " 40 ").code, "40");
assert.equal(updateControlCode(branchModel, 10, " 40 ").ok, true);
assert.equal(branchModel.controls.find(control => control.id === 10).code, "40",
  "control-code edits are trimmed and applied");
const duplicateCode = updateControlCode(branchModel, 10, "32");
assert.equal(duplicateCode.ok, false);
assert.equal(duplicateCode.reason, "duplicate");
assert.equal(branchModel.controls.find(control => control.id === 10).code, "40",
  "a duplicate code never mutates the control");
assert.equal(updateControlCode(branchModel, 10, " ").reason, "empty");
branchModel.controls.find(control => control.id === 10).code = "31";
const terminalUi = {
  selectedCourseId: 1,
  selection: { type: "control", id: 13, courseControl: 4 },
  variationAnchorCourseControl: 4,
  variationInsertAfterCourseControl: 4,
  variationInsertBeforeCourseControl: null,
  variationSelectedSegment: "node:4"
};
assert.equal(variationAnchorCourseControl(branchModel, 1, terminalUi)?.id, 4, "a terminal non-finish node must support an open-ended fork");
assert.equal(variationAnchorCourseControl(branchModel, 1, terminalUi, { selectionOnly: true })?.id, 4, "a terminal node must still be selectable in the topology");

const startOnlyModel = {
  event: { map: { scale: 10000 }, numbering: { start: 31, disallowInvertible: false } },
  controls: [{ id: 20, kind: "start", code: "", location: { x: 0, y: 0 } }],
  courses: [{ id: 2, name: "Start only", kind: "normal", firstCourseControl: 20, options: {}, relay: {} }],
  courseControls: [{ id: 20, control: 20, nextCourseControl: null, variation: "", variationEnd: null, variationCourseControls: [] }],
  legs: [],
  specials: []
};
const startOnlyUi = {
  selectedCourseId: 2,
  selection: { type: "control", id: 20, courseControl: 20 },
  variationAnchorCourseControl: 20,
  variationInsertAfterCourseControl: 20
};
assert.equal(variationAnchorCourseControl(startOnlyModel, 2, startOnlyUi)?.id, 20, "a terminal start must be a valid fork anchor");
const openFork = addVariationAtCourseControl(startOnlyModel, 2, 20, { branches: 2 });
assert.ok(openFork?.branchCourseControl, "a fork must be creatable after a lone start");
assert.equal(startOnlyModel.courseControls.find(item => item.id === 20).variationEnd, null, "an open fork must not create a fake join control");
const openTopology = courseTopology(startOnlyModel, 2);
assert.equal(openTopology[0].legTo.length, 2, "empty open branches must remain visible and selectable in the topology");
const openVirtualJoinIndex = openTopology.findIndex(view => view.virtualVariationJoin);
assert.ok(openVirtualJoinIndex > 0, "an open fork must get one shared topology-only join");
assert.equal(openTopology[0].joinIndex, openVirtualJoinIndex);
assert.deepEqual(openTopology[0].legTo, [openVirtualJoinIndex, openVirtualJoinIndex], "all empty branches must close at the shared virtual join");
const firstOpenBranchControl = addControlAt(startOnlyModel, "normal", { x: 50, y: 0 }, 2, {
  afterCourseControl: openFork.branchCourseControl
});
assert.equal(
  startOnlyModel.courseControls.find(item => item.id === openFork.branchCourseControl)?.nextCourseControl,
  firstOpenBranchControl.courseControl,
  "the first real checkpoint must be inserted after the selected open branch marker"
);
const populatedOpenTopology = courseTopology(startOnlyModel, 2);
assert.equal(populatedOpenTopology[0].legTo.length, 2);
const populatedVirtualJoinIndex = populatedOpenTopology.findIndex(view => view.virtualVariationJoin);
assert.equal(populatedOpenTopology.filter(view => view.virtualVariationJoin).length, 1, "an open fork must keep exactly one shared virtual join");
const populatedBranchStart = populatedOpenTopology[0].legTo.find(index => index !== populatedVirtualJoinIndex);
assert.ok(Number.isInteger(populatedBranchStart), "the populated branch must start at its real checkpoint");
assert.deepEqual(populatedOpenTopology[populatedBranchStart].legTo, [populatedVirtualJoinIndex], "the real branch tail must close at the shared virtual join");
const openPostJoinSegment = `postjoin-open:0:${populatedVirtualJoinIndex}`;
startOnlyUi.variationSelectedSegment = openPostJoinSegment;
assert.equal(insertionVariationEndOwnerId({ eventModel: startOnlyModel, ui: startOnlyUi }), 20, "the post-join stem must target the open fork owner");
assert.match(
  topologyPathAttrs({ openVariationEndOwnerCourseControl: 20, segmentKey: openPostJoinSegment }),
  /data-select-variation-insertion/,
  "the post-join stem must be selectable"
);
const reusableFinishModel = structuredClone(startOnlyModel);
reusableFinishModel.controls.push({ id: 99, kind: "finish", code: "", location: { x: 120, y: 0 } });
const reusedFinish = addExistingControlToCourse(reusableFinishModel, 2, 99, {
  variationEndOwnerCourseControl: 20
});
assert.equal(
  reusableFinishModel.courseControls.find(item => item.id === 20)?.variationEnd,
  reusedFinish?.courseControl,
  "an existing finish added on the post-join stem must become variationEnd"
);
const sharedAfterOpenFork = addControlAt(startOnlyModel, "finish", { x: 100, y: 0 }, 2, {
  variationEndOwnerCourseControl: 20
});
const openForkOwner = startOnlyModel.courseControls.find(item => item.id === 20);
assert.equal(openForkOwner.variationEnd, sharedAfterOpenFork.courseControl, "a finish added on the post-join stem must become variationEnd");
assert.equal(startOnlyModel.controls.find(item => item.id === sharedAfterOpenFork.id)?.kind, "finish");
for (const branchId of openForkOwner.variationCourseControls) {
  let branch = startOnlyModel.courseControls.find(item => item.id === branchId);
  while (branch?.nextCourseControl && Number(branch.nextCourseControl) !== Number(sharedAfterOpenFork.courseControl)) {
    branch = startOnlyModel.courseControls.find(item => item.id === branch.nextCourseControl);
  }
  assert.equal(branch?.nextCourseControl, sharedAfterOpenFork.courseControl, "every open branch must connect to the new shared checkpoint");
}

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

const codeEditModel = structuredClone(branchModel);
let codeEditHistory = 0;
let codeEditStatus = "";
const codeEditStore = {
  snapshot: () => ({ eventModel: codeEditModel, ui: {} }),
  updateEvent(update) {
    codeEditHistory += 1;
    update(codeEditModel);
  },
  updateUi(update) {
    const ui = {};
    update(ui);
    codeEditStatus = ui.status || "";
  }
};
const codeEditMethods = createAppShellCoursePanelMethods({
  getControl: (model, id) => model.controls.find(control => Number(control.id) === Number(id)) || null,
  updateControlCode
});
const codeInput = {
  dataset: { controlId: "10" },
  value: "32",
  classList: { add() {}, remove() {} },
  setCustomValidity(message) { this.validityMessage = message; },
  reportValidity() { this.reported = true; }
};
const codeEditApp = { ...codeEditMethods, store: codeEditStore, t: (message, values = {}) =>
  message.replace(/\{code\}/g, values.code || "") };
assert.equal(codeEditApp.updateDescriptionControlCode(codeInput), false);
assert.equal(codeEditHistory, 0, "a colliding description-table edit does not create history");
assert.equal(codeInput.value, "31", "a colliding description-table edit restores the previous code");
assert.match(codeEditStatus, /already used/);
codeInput.value = "41";
assert.equal(codeEditApp.updateDescriptionControlCode(codeInput), true);
assert.equal(codeEditHistory, 1);
assert.equal(codeEditModel.controls.find(control => control.id === 10).code, "41");
const escapeHtml = value => String(value ?? "")
  .replace(/&/g, "&amp;")
  .replace(/</g, "&lt;")
  .replace(/>/g, "&gt;")
  .replace(/"/g, "&quot;");
const descriptionRenderMethods = createAppShellCoursePanelMethods({
  descriptionLanguageForEvent: () => "en",
  isTeamFreeCourseControl: () => false,
  columnFDescriptionDisplayValue: () => "",
  columnFDescriptionPickerValue: () => "",
  isColumnFTextValue: () => false,
  normalizeColumnFText: value => value,
  iscdSymbolLabel: () => "",
  ISCD_COLUMNS: ["C", "D", "E", "F", "G", "H"].map(box => [box, box]),
  controlKindLabel: kind => kind,
  escapeHtml,
  escapeAttr: escapeHtml
});
const descriptionRenderApp = {
  ...descriptionRenderMethods,
  store: { snapshot: () => ({ eventModel: codeEditModel, ui: { selection: null } }) },
  t: message => message
};
const editableDescriptionRow = descriptionRenderApp.descriptionRow({
  course: { kind: "normal" },
  courseControl: { id: 1 },
  control: codeEditModel.controls.find(control => control.id === 10),
  ordinal: 1
});
assert.match(editableDescriptionRow, /data-control-code/);
assert.match(editableDescriptionRow, /data-control-id="10"/,
  "normal-control codes are editable directly in the description table");
const hiddenStartDescriptionCode = descriptionRenderApp.descriptionRow({
  course: { kind: "normal" },
  courseControl: { id: 2 },
  control: { id: 20, kind: "start", code: "S1", descriptions: [] },
  ordinal: ""
});
assert.doesNotMatch(hiddenStartDescriptionCode, />S1</, "start codes stay hidden in the control-description table by default");
const visibleAllControlsStartCode = descriptionRenderApp.descriptionRow({
  course: null,
  courseControl: null,
  control: { id: 20, kind: "start", code: "S1", descriptions: [] },
  ordinal: ""
}, "all");
assert.match(visibleAllControlsStartCode, />S1</, "start codes appear in the All Controls description table");

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
