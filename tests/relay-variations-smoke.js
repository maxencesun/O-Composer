import {
  normalizeRelayBranchSettings,
  relayAssignments,
  relayBranchDisplayLegs,
  relayBranchEffectiveLegs,
  relayBranchGroups,
  relayBranchParentAllowedLegs
} from "../src/domain/relay-variations.js";
import { descriptionMetrics } from "../src/domain/control-descriptions.js";
import { addVariationAtCourseControl, appendControlToCourse, deleteSelection } from "../src/domain/actions.js";
import { courseTopology } from "../src/domain/course-service.js";
import { createAppShellCoursePanelMethods } from "../src/ui/app-shell-course-panel-methods.js";
import {
  alignTopologySharedJoinPoints,
  layoutVariationTopology,
  placeTopologyBranchLabel,
  TOPOLOGY_HEIGHT_UNIT,
  TOPOLOGY_MIN_VERTICAL_SEGMENT,
  TOPOLOGY_NORMAL_CONTROL_RADIUS,
  topologyCommonJoinPointMap,
  topologySharedJoinParentMap
} from "../src/domain/variation-topology-layout.js";
import { variationBranchCodeMap } from "../src/domain/relay-variations.js";

const eventModel = {
  event: { map: { scale: 15000 }, descriptions: { color: "black" } },
  legs: [],
  courses: [{
    id: 1,
    name: "Relay",
    kind: "normal",
    firstCourseControl: 1,
    relay: {
      teams: 2,
      legs: 4,
      branches: [
        { branch: "A", legs: [1, 2] },
        { branch: "B", legs: [3, 4] }
      ]
    }
  }],
  controls: [
    { id: 31, kind: "normal", code: "31", location: { x: 0, y: 0 } },
    { id: 32, kind: "normal", code: "32", location: { x: 1, y: 0 } },
    { id: 33, kind: "normal", code: "33", location: { x: 2, y: 0 } },
    { id: 34, kind: "normal", code: "34", location: { x: 2, y: 1 } },
    { id: 35, kind: "normal", code: "35", location: { x: 1, y: 1 } },
    { id: 99, kind: "finish", code: "F", location: { x: 3, y: 0 } }
  ],
  courseControls: [
    { id: 1, control: 31, nextCourseControl: 8, variation: "fork", variationEnd: 8, variationCourseControls: [2, 5] },
    { id: 2, control: 31, nextCourseControl: 3, variation: "", variationEnd: null, variationCourseControls: [] },
    { id: 3, control: 32, nextCourseControl: 8, variation: "fork", variationEnd: 8, variationCourseControls: [4, 6] },
    { id: 4, control: 32, nextCourseControl: 7, variation: "", variationEnd: null, variationCourseControls: [] },
    { id: 7, control: 33, nextCourseControl: 8, variation: "", variationEnd: null, variationCourseControls: [] },
    { id: 6, control: 32, nextCourseControl: 9, variation: "", variationEnd: null, variationCourseControls: [] },
    { id: 9, control: 34, nextCourseControl: 8, variation: "", variationEnd: null, variationCourseControls: [] },
    { id: 5, control: 31, nextCourseControl: 10, variation: "", variationEnd: null, variationCourseControls: [] },
    { id: 10, control: 35, nextCourseControl: 8, variation: "", variationEnd: null, variationCourseControls: [] },
    { id: 8, control: 99, nextCourseControl: null, variation: "", variationEnd: null, variationCourseControls: [] }
  ]
};

const rows = relayAssignments(eventModel, 1).rows.map(row => row.assignments.map(variation => variation?.code || ""));
const expected = [
  ["AC", "AD", "B", "B"],
  ["AD", "AC", "B", "B"]
];

if (JSON.stringify(rows) !== JSON.stringify(expected)) {
  throw new Error(`unexpected relay rows: ${JSON.stringify(rows)}`);
}

for (const row of rows) {
  const text = row.join("");
  const counts = Object.fromEntries(["A", "B", "C", "D"].map(code => [code, text.split(code).length - 1]));
  if (counts.A !== 2 || counts.B !== 2 || counts.C !== 1 || counts.D !== 1) {
    throw new Error(`branch coverage is not balanced for ${row.join(",")}: ${JSON.stringify(counts)}`);
  }
}

const unrestrictedLegs = relayBranchDisplayLegs([], "A", 4);
if (JSON.stringify(unrestrictedLegs) !== JSON.stringify([1, 2, 3, 4])) {
  throw new Error(`unrestricted branch should display all legs: ${JSON.stringify(unrestrictedLegs)}`);
}

const restrictedLegs = relayBranchDisplayLegs([{ branch: "A", legs: [2, 4] }], "A", 4);
if (JSON.stringify(restrictedLegs) !== JSON.stringify([2, 4])) {
  throw new Error(`restricted branch display mismatch: ${JSON.stringify(restrictedLegs)}`);
}

const branchGroups = relayBranchGroups(eventModel, 1);
const parentAllowedForC = relayBranchParentAllowedLegs(branchGroups, eventModel.courses[0].relay.branches, "C", 4);
if (JSON.stringify(parentAllowedForC) !== JSON.stringify([1, 2])) {
  throw new Error(`nested branch C should inherit parent A legs: ${JSON.stringify(parentAllowedForC)}`);
}
const childSettings = [...eventModel.courses[0].relay.branches, { branch: "C", legs: [2, 3] }];
const effectiveLegsForC = relayBranchEffectiveLegs(branchGroups, childSettings, "C", 4);
if (JSON.stringify(effectiveLegsForC) !== JSON.stringify([2])) {
  throw new Error(`nested branch C should intersect its parent restriction: ${JSON.stringify(effectiveLegsForC)}`);
}
const normalizedChildSettings = normalizeRelayBranchSettings(branchGroups, childSettings, 4);
const normalizedC = normalizedChildSettings.find(setting => setting.branch === "C")?.legs || [];
if (JSON.stringify(normalizedC) !== JSON.stringify([2])) {
  throw new Error(`nested branch C should discard leg 3 when saved: ${JSON.stringify(normalizedC)}`);
}

const nestedTopology = courseTopology(eventModel, 1);
const nestedLayout = layoutVariationTopology(nestedTopology, variationBranchCodeMap(eventModel, 1));
const sharedJoinParents = topologySharedJoinParentMap(nestedTopology);
const outerJoinIndex = nestedTopology[0]?.joinIndex;
if (!Number.isInteger(outerJoinIndex)
  || nestedLayout.positions[0]?.x !== nestedLayout.positions[outerJoinIndex]?.x) {
  throw new Error("checkpoints after a fork must remain on the incoming main axis");
}
if (sharedJoinParents.size !== 1) {
  throw new Error(`nested fork sharing its parent join was not detected: ${sharedJoinParents.size}`);
}
for (const [childForkIndex, parentForkIndex] of sharedJoinParents) {
  if (nestedTopology[childForkIndex].joinIndex !== nestedTopology[parentForkIndex].joinIndex) {
    throw new Error("nested shared join points must target the same course control");
  }
  if (!nestedLayout.positions[childForkIndex] || !nestedLayout.positions[parentForkIndex]) {
    throw new Error("nested shared join layout positions are missing");
  }
}
const labelPlacements = [];
const labelD = placeTopologyBranchLabel(labelPlacements, { forkX: 120, ownerX: 80, y: 100, code: "D", secondaryText: "1,2" });
const labelE = placeTopologyBranchLabel(labelPlacements, { forkX: 192, ownerX: 232, y: 100, code: "E", secondaryText: "3,4" });
if (Math.abs(labelD.x - labelE.x) < 28) {
  throw new Error(`adjacent nested branch labels still overlap: ${labelD.x}, ${labelE.x}`);
}

const emptyBranchModel = structuredClone(eventModel);
emptyBranchModel.courses[0].firstCourseControl = 1;
emptyBranchModel.courseControls = [
  { id: 1, control: 31, nextCourseControl: 8, variation: "fork", variationEnd: 8, variationCourseControls: [2, 5] },
  { id: 2, control: 31, nextCourseControl: 3, variation: "", variationEnd: null, variationCourseControls: [] },
  { id: 3, control: 32, nextCourseControl: 8, variation: "fork", variationEnd: 8, variationCourseControls: [4, 6] },
  { id: 4, control: 32, nextCourseControl: 8, variation: "", variationEnd: null, variationCourseControls: [] },
  { id: 6, control: 32, nextCourseControl: 8, variation: "", variationEnd: null, variationCourseControls: [] },
  { id: 5, control: 31, nextCourseControl: 8, variation: "", variationEnd: null, variationCourseControls: [] },
  { id: 8, control: 99, nextCourseControl: null, variation: "", variationEnd: null, variationCourseControls: [] }
];
const emptyBranchAssignments = relayAssignments(emptyBranchModel, 1);
const emptyBranchCodes = emptyBranchAssignments.variations.map(variation => variation.code);
if (JSON.stringify(emptyBranchCodes) !== JSON.stringify(["AC", "AD", "B"])
  || emptyBranchAssignments.rows.some(row => row.assignments.some(variation => !variation))) {
  throw new Error(`automatic relay assignment must include empty branches: ${JSON.stringify(emptyBranchCodes)}`);
}
const restrictedNestedEmptyBranchModel = structuredClone(emptyBranchModel);
restrictedNestedEmptyBranchModel.courses[0].relay.branches = [
  { branch: "C", legs: [2, 3] },
  { branch: "D", legs: [2, 3] }
];
const restrictedNestedEmptyRows = relayAssignments(restrictedNestedEmptyBranchModel, 1).rows;
for (const row of restrictedNestedEmptyRows) {
  const codes = row.assignments.map(variation => variation?.code || "");
  if (codes.some(code => !code) || codes[0] !== "B" || codes[3] !== "B") {
    throw new Error(`legs excluded from a nested fork must use its parent empty branch: ${codes.join(",")}`);
  }
  for (let index = 0; index < row.assignments.length; index += 1) {
    const leg = index + 1;
    for (const code of row.assignments[index].code) {
      const rule = restrictedNestedEmptyBranchModel.courses[0].relay.branches
        .find(branch => branch.branch === code);
      if (rule && !rule.legs.includes(leg)) {
        throw new Error(`relay assignment used branch ${code} on disallowed leg ${leg}`);
      }
    }
  }
}
const explicitlyRestrictedEmptyBranchModel = structuredClone(emptyBranchModel);
explicitlyRestrictedEmptyBranchModel.courses[0].relay.branches = [
  { branch: "A", legs: [2, 3] },
  { branch: "B", legs: [1, 4] },
  { branch: "C", legs: [2, 3] },
  { branch: "D", legs: [2, 3] }
];
for (const row of relayAssignments(explicitlyRestrictedEmptyBranchModel, 1).rows) {
  const codes = row.assignments.map(variation => variation?.code || "");
  if (codes.some(code => !code)
    || codes[0] !== "B"
    || codes[3] !== "B"
    || !codes[1].startsWith("A")
    || !codes[2].startsWith("A")) {
    throw new Error(`explicitly restricted empty branches must fill every relay leg: ${codes.join(",")}`);
  }
}
const emptyTopology = courseTopology(emptyBranchModel, 1);
const emptyLayout = layoutVariationTopology(emptyTopology, variationBranchCodeMap(emptyBranchModel, 1));
const emptyJoinPoints = topologyCommonJoinPointMap(emptyTopology, emptyLayout.positions, 16);
const emptySharedJoinParents = topologySharedJoinParentMap(emptyTopology);
alignTopologySharedJoinPoints(emptyTopology, emptyLayout.positions, emptyJoinPoints, emptySharedJoinParents);
const nestedEmptyForkIndex = emptyTopology.findIndex(view => Number(view.ownerCourseControlId) === 3);
const nestedEmptyForkY = emptyLayout.positions[nestedEmptyForkIndex]?.forkStart?.[0]?.y;
const nestedEmptyJoinY = emptyJoinPoints.get(nestedEmptyForkIndex)?.y;
if (!Number.isFinite(nestedEmptyForkY)
  || !Number.isFinite(nestedEmptyJoinY)
  || nestedEmptyJoinY - nestedEmptyForkY < TOPOLOGY_HEIGHT_UNIT) {
  throw new Error(`empty branches must reserve one checkpoint row: ${nestedEmptyForkY} -> ${nestedEmptyJoinY}`);
}
const nestedEmptyParentIndex = emptySharedJoinParents.get(nestedEmptyForkIndex);
const nestedEmptyParentJoinY = emptyJoinPoints.get(nestedEmptyParentIndex)?.y;
if (!Number.isFinite(nestedEmptyParentJoinY) || nestedEmptyParentJoinY <= nestedEmptyJoinY) {
  throw new Error("nested branches must merge before their parent branch level");
}

const firstPointBranchModel = structuredClone(emptyBranchModel);
firstPointBranchModel.courseControls.find(item => item.id === 4).nextCourseControl = 7;
firstPointBranchModel.courseControls.splice(-1, 0,
  { id: 7, control: 33, nextCourseControl: 8, variation: "", variationEnd: null, variationCourseControls: [] }
);
const firstPointTopology = courseTopology(firstPointBranchModel, 1);
const firstPointLayout = layoutVariationTopology(firstPointTopology, variationBranchCodeMap(firstPointBranchModel, 1));
const firstPointForkIndex = firstPointTopology.findIndex(view => Number(view.ownerCourseControlId) === 3);
const firstPointIndex = firstPointTopology.findIndex(view => Number(view.ownerCourseControlId) === 7);
const firstPointForkY = firstPointLayout.positions[firstPointForkIndex]?.forkStart?.[0]?.y;
const firstPointY = firstPointLayout.positions[firstPointIndex]?.y;
const emptyJoinControlY = emptyLayout.positions[emptyTopology.findIndex(view => Number(view.ownerCourseControlId) === 8)]?.y;
const firstPointJoinControlY = firstPointLayout.positions[firstPointTopology.findIndex(view => Number(view.ownerCourseControlId) === 8)]?.y;
if (firstPointJoinControlY !== emptyJoinControlY
  || firstPointY - firstPointForkY !== TOPOLOGY_HEIGHT_UNIT / 2) {
  throw new Error("the first real checkpoint must replace, not extend, an empty branch placeholder");
}
const firstPointJoinPoints = topologyCommonJoinPointMap(firstPointTopology, firstPointLayout.positions, 16);
const firstPointSharedParents = topologySharedJoinParentMap(firstPointTopology);
alignTopologySharedJoinPoints(firstPointTopology, firstPointLayout.positions, firstPointJoinPoints, firstPointSharedParents, 16);
const firstPointLocalJoinY = firstPointJoinPoints.get(firstPointForkIndex)?.y;
if (firstPointLocalJoinY - (firstPointY + TOPOLOGY_NORMAL_CONTROL_RADIUS) !== TOPOLOGY_MIN_VERTICAL_SEGMENT / 2) {
  throw new Error("a checkpoint below a nested fork must use the minimum lower vertical segment");
}

const relayDeletionModel = structuredClone(eventModel);
deleteSelection(relayDeletionModel, { type: "control", id: 34, courseControl: 9 }, { selectedCourseId: 1 });
if (!relayDeletionModel.controls.some(control => Number(control.id) === 34)) {
  throw new Error("removing a relay-only checkpoint from its course must preserve it in All Controls");
}
if (relayDeletionModel.courseControls.some(courseControl => Number(courseControl.id) === 9)) {
  throw new Error("the selected relay branch checkpoint was not removed from the course");
}
const postDeletionVariations = relayAssignments(relayDeletionModel, 1);
if (!postDeletionVariations.variations.some(variation => variation.code === "AD")
  || postDeletionVariations.rows.some(row => row.assignments.some(variation => !variation))) {
  throw new Error("a relay branch that becomes empty after deletion must remain available to automatic assignment");
}

const repeatedControlDeletionModel = structuredClone(eventModel);
repeatedControlDeletionModel.courseControls.find(courseControl => Number(courseControl.id) === 9).control = 33;
deleteSelection(repeatedControlDeletionModel, {
  type: "control",
  id: 33,
  courseControl: 9
}, { selectedCourseId: 1 });
if (repeatedControlDeletionModel.courseControls.some(courseControl => Number(courseControl.id) === 9)
  || !repeatedControlDeletionModel.courseControls.some(courseControl => Number(courseControl.id) === 7)
  || !repeatedControlDeletionModel.controls.some(control => Number(control.id) === 33)) {
  throw new Error("relay deletion must remove only the selected occurrence when one global control is reused by branches");
}

const ambiguousRelayDeletionModel = structuredClone(eventModel);
ambiguousRelayDeletionModel.courseControls.find(courseControl => Number(courseControl.id) === 9).control = 33;
deleteSelection(ambiguousRelayDeletionModel, { type: "control", id: 33 }, { selectedCourseId: 1 });
if (!ambiguousRelayDeletionModel.courseControls.some(courseControl => Number(courseControl.id) === 7)
  || !ambiguousRelayDeletionModel.courseControls.some(courseControl => Number(courseControl.id) === 9)) {
  throw new Error("an ambiguous relay occurrence must not delete an arbitrary branch checkpoint");
}

const selectionState = {
  eventModel: repeatedControlDeletionModel,
  ui: {
    selectedCourseId: 1,
    selection: null,
    variationAnchorCourseControl: null
  }
};
const selectionMethods = createAppShellCoursePanelMethods({
  courseTopology: () => [
    { control: { id: 33 }, ownerCourseControlId: 7 },
    { control: { id: 33 }, ownerCourseControlId: 9 }
  ],
  topologyNodeCourseControlId: view => view.ownerCourseControlId,
  teamAddControlRoleFromSelection: () => null
});
const selectionContext = {
  store: {
    snapshot: () => selectionState,
    updateUi: updater => updater(selectionState.ui)
  }
};
selectionMethods.setSelection.call(selectionContext, { type: "control", id: 33, courseControl: 9 });
if (Number(selectionState.ui.selection?.courseControl) !== 9) {
  throw new Error("relay selection must preserve the exact course-control occurrence");
}
selectionState.ui.variationAnchorCourseControl = null;
selectionMethods.setSelection.call(selectionContext, { type: "control", id: 33 });
if (selectionState.ui.selection?.courseControl || selectionState.ui.variationAnchorCourseControl) {
  throw new Error("ambiguous relay selection must not guess the first branch occurrence");
}

const scopedInsertionModel = structuredClone(eventModel);
scopedInsertionModel.controls.push({ id: 36, kind: "normal", code: "36", location: { x: 2.5, y: 0 } });
const insertedCourseControl = appendControlToCourse(scopedInsertionModel, 1, 36, {
  beforeCourseControl: 8,
  variationEndOwnerCourseControl: 3
});
if (scopedInsertionModel.courseControls.find(item => item.id === 3)?.variationEnd !== insertedCourseControl.id
  || scopedInsertionModel.courseControls.find(item => item.id === 7)?.nextCourseControl !== insertedCourseControl.id
  || scopedInsertionModel.courseControls.find(item => item.id === 9)?.nextCourseControl !== insertedCourseControl.id
  || insertedCourseControl.nextCourseControl !== 8) {
  throw new Error("checkpoint inserted on a nested pre-join segment must remain inside that branch");
}
if (scopedInsertionModel.courseControls.find(item => item.id === 1)?.variationEnd !== 8
  || scopedInsertionModel.courseControls.find(item => item.id === 10)?.nextCourseControl !== 8) {
  throw new Error("nested pre-join insertion must not move the outer join or sibling branch");
}

const inheritedAssignmentModel = structuredClone(eventModel);
inheritedAssignmentModel.courses[0].relay.branches.push(
  { branch: "C", legs: [3, 4] },
  { branch: "D", legs: [1, 2] }
);
const inheritedRows = relayAssignments(inheritedAssignmentModel, 1).rows;
for (const row of inheritedRows) {
  const codes = row.assignments.map(variation => variation?.code || "");
  if (codes.slice(0, 2).some(code => code !== "AD") || codes.slice(2).some(code => code !== "B")) {
    throw new Error(`automatic assignment ignored inherited branch legs: ${codes.join(",")}`);
  }
}

const configuredLegCountModel = structuredClone(eventModel);
configuredLegCountModel.courses[0].relay.teams = 1;
configuredLegCountModel.courses[0].relay.legs = 4;
addVariationAtCourseControl(configuredLegCountModel, 1, 7, { branches: 2 });
const configuredLegAssignments = relayAssignments(configuredLegCountModel, 1);
if (configuredLegAssignments.requiredLegs !== 8
  || configuredLegAssignments.legs !== 4
  || configuredLegAssignments.rows[0]?.assignments.length !== 4) {
  throw new Error("relay assignment must not replace the configured participant count with the recommended divisor");
}

const descriptionSpecial = {
  kind: "descriptions",
  locations: [{ x: 0, y: 0 }, { x: 5, y: 0 }],
  courses: [{ course: 1 }],
  cellSize: 5.2,
  descriptionKind: "symbols",
  color: "black"
};
const allBranchesDescription = descriptionMetrics(eventModel, descriptionSpecial, 1, { allBranches: true });
if (allBranchesDescription.kind !== "topology" || !allBranchesDescription.layout?.positions?.length) {
  throw new Error("all-branches descriptions should use the variation topology");
}
const singleVariationDescription = descriptionMetrics(eventModel, descriptionSpecial, 1, { allBranches: false });
if (singleVariationDescription.kind !== "symbols") {
  throw new Error(`single-variation descriptions should stay tabular: ${singleVariationDescription.kind}`);
}

console.log("relay variations smoke passed");
