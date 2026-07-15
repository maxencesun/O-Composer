import assert from "node:assert/strict";
import {
  createBlankEvent,
  createControl,
  createCourse,
  createCourseControl
} from "../src/domain/event-model.js";
import {
  courseLegs,
  courseLength,
  coursePageCount,
  courseView,
  getControl,
  getCourse,
  getCourseControl
} from "../src/domain/course-service.js";
import { flaggedEndpointGapSuppression, isEntireLegFlagged, legFlagRange } from "../src/ui/map-view-helpers.js";
import {
  buildPythonPageCourse,
  compilePageBreakFormula,
  compilePageBreakRules,
  remapPageBreakFormulaCourseControls,
  validatePageBreakFormula
} from "../src/domain/course-pages.js";
import {
  PAGE_PYTHON_SAMPLE,
  executePythonPageScript,
  validatePythonPageScript
} from "../src/domain/python-page-script.js";
import { buildControlDescriptionRows, specialVisibleForCourse } from "../src/domain/control-descriptions.js";
import { effectivePrintArea, setPrintArea } from "../src/domain/print-area.js";
import { serializeNativePpen, serializeOcp } from "../src/domain/ppen-parser.js";
import { addControlAt, addExistingControlToCourse, addVariationAtCourseControl, deleteSelection, duplicateCourse } from "../src/domain/actions.js";
import { allCourseVariations } from "../src/domain/relay-variations.js";
import { createAppShellSelectionEditorMethods } from "../src/ui/app-shell-selection-editor-methods.js";
import { createAppShellCommandMethods } from "../src/ui/app-shell-command-methods.js";
import { createAppShellDialogMethods } from "../src/ui/app-shell-dialog-methods.js";
import { Store } from "../src/state/store.js";

assert.equal(validatePythonPageScript(PAGE_PYTHON_SAMPLE), "");
assert.deepEqual(executePythonPageScript(PAGE_PYTHON_SAMPLE, {
  length: 4,
  control_number: ["31", "32", "40", "32"],
  branch_name: "ABCD"
}), [[0, 0, 0, 1], [0, 0, 0, 0]], "the exact sample Python code executes without translation");

const model = createBlankEvent();
model.event.title = "Paging test";
model.controls = [
  createControl(1, "start", { x: 0, y: 0 }),
  createControl(2, "normal", { x: 10, y: 0 }, "31"),
  createControl(3, "normal", { x: 20, y: 0 }, "32"),
  createControl(4, "finish", { x: 30, y: 0 })
];
const course = createCourse(1, "Course 1", "normal", 1);
course.firstCourseControl = 1;
course.printArea = { ...model.event.printArea, automatic: false, left: -1, right: 31, top: 10, bottom: -10 };
course.partPrintAreas = [{
  part: 1,
  area: { ...model.event.printArea, automatic: false, left: 9, right: 31, top: 8, bottom: -8 }
}];
model.courses = [course];
model.courseControls = [
  createCourseControl(1, 1, 2),
  createCourseControl(2, 2, 3),
  createCourseControl(3, 3, 4),
  createCourseControl(4, 4, null)
];
model.courseControls[1].mapExchange = true;
model.courseControls[1].mapFlip = true;

assert.equal(coursePageCount(model, 1), 2);
const globalRows = courseView(model, 1, { page: "global" });
const page1 = courseView(model, 1, { page: 1 });
const page2 = courseView(model, 1, { page: 2 });
assert.deepEqual(page1.map(row => row.courseControl.id), [1, 2]);
assert.deepEqual(page2.map(row => row.courseControl.id), [2, 3, 4]);
assert.equal(page1.at(-1).exchangeStart, false, "the previous page ends with a normal control circle");
assert.equal(page2[0].exchangeStart, true, "the next page starts with the continuing-point symbol");
assert.equal(globalRows[1].exchangeStart, true, "global view uses the continuing-point symbol at the boundary");
assert.equal(page2[0].ordinal, 1, "control numbering stays global across pages");
assert.deepEqual(courseLegs(model, 1, { page: 1 }).map(leg => [leg.from.control.id, leg.to.control.id]), [[1, 2]]);
assert.deepEqual(courseLegs(model, 1, { page: 2 }).map(leg => [leg.from.control.id, leg.to.control.id]), [[2, 3], [3, 4]]);
assert.equal(courseLength(model, 1, { page: 1 }), courseLength(model, 1, { page: 2 }), "map pages retain the whole-course length");

const page1Description = buildControlDescriptionRows(model, 1, "symbols", { page: 1 });
const page2Description = buildControlDescriptionRows(model, 1, "symbols", { page: 2 });
assert.ok(page1Description.some(row => row.kind === "directive" && row.symbol === "15.6"));
assert.ok(!page2Description.some(row => row.kind === "directive" && row.symbol === "15.6"));
assert.equal(page1Description.find(row => row.kind === "header3").boxes[0], "Course 1-1");
assert.equal(page2Description.find(row => row.kind === "header3").boxes[0], "Course 1-2");
assert.equal(
  page1Description.find(row => row.kind === "header3").boxes[1],
  page2Description.find(row => row.kind === "header3").boxes[1],
  "each page description keeps the whole-course length"
);

model.courseControls[1].mapFlip = false;
const exchangeRows = courseView(model, 1, { page: "global" });
assert.equal(exchangeRows[1].pageBreakKind, "exchange", "map exchange keeps its action kind");
const exchangeDescription = buildControlDescriptionRows(model, 1, "symbols", { page: 1 });
assert.ok(exchangeDescription.some(row => row.kind === "directive"
  && row.symbol === "13.5control"
  && row.distance === "0 m"), "map exchange uses the at-control exchange directive");
const exchangePpen = serializeNativePpen(model);
assert.match(exchangePpen, /<course-control id="2" control="2" map-exchange="true">/);
assert.doesNotMatch(exchangePpen, /<course-control id="2"[^>]*map-flip/);
model.courseControls[1].mapFlip = true;
const flipPpen = serializeNativePpen(model);
assert.match(flipPpen, /<course-control id="2" control="2" map-exchange="true" map-flip="true">/);

const mixedDirectModel = structuredClone(model);
mixedDirectModel.courseControls[1].mapExchange = true;
mixedDirectModel.courseControls[1].mapFlip = false;
mixedDirectModel.courseControls[2].mapExchange = true;
mixedDirectModel.courseControls[2].mapFlip = true;
assert.equal(coursePageCount(mixedDirectModel, 1), 3, "multiple point actions create multiple map pages");
const mixedDirectRows = courseView(mixedDirectModel, 1, { page: "global" });
assert.equal(mixedDirectRows[1].pageBreakKind, "exchange");
assert.equal(mixedDirectRows[2].pageBreakKind, "flip");
assert.ok(buildControlDescriptionRows(mixedDirectModel, 1, "symbols", { page: 1 })
  .some(row => row.kind === "directive" && row.symbol === "13.5control"));
assert.ok(buildControlDescriptionRows(mixedDirectModel, 1, "symbols", { page: 2 })
  .some(row => row.kind === "directive" && row.symbol === "15.6"));

const orphanFlipModel = structuredClone(model);
orphanFlipModel.courseControls[1].mapExchange = false;
orphanFlipModel.courseControls[1].mapFlip = true;
assert.match(
  serializeNativePpen(orphanFlipModel),
  /<course-control id="2" control="2" map-exchange="true" map-flip="true">/,
  "serialization repairs an orphan map-flip flag"
);

assert.equal(effectivePrintArea(model, 1, 1).left, -1);
assert.equal(effectivePrintArea(model, 1, 2).left, 9);
setPrintArea(model, { scope: "course", courseId: 1, coursePage: 1 }, {
  ...model.event.printArea,
  automatic: false,
  left: 3,
  right: 13
});
assert.equal(effectivePrintArea(model, 1, 1).left, 3, "the current page can keep its own print area");
assert.equal(effectivePrintArea(model, 1, 2).left, 9, "editing page one does not change page two");
const partSpecial = { kind: "text", allCourses: false, courses: [{ course: 1, part: 1 }] };
assert.equal(specialVisibleForCourse(partSpecial, 1, false, "global"), true);
assert.equal(specialVisibleForCourse(partSpecial, 1, false, 1), false);
assert.equal(specialVisibleForCourse(partSpecial, 1, false, 2), true);
const partDescription = { kind: "descriptions", allCourses: false, courses: [{ course: 1, part: 1 }] };
const globalDescription = { kind: "descriptions", allCourses: false, courses: [{ course: 1, part: -1 }] };
assert.equal(specialVisibleForCourse(partDescription, 1, false, "global"), false, "global hides per-page description blocks");
assert.equal(specialVisibleForCourse(partDescription, 1, false, 2), true);
assert.equal(specialVisibleForCourse(globalDescription, 1, false, "global"), true);

model.courseControls[1].mapExchange = false;
model.courseControls[1].mapFlip = false;
course.pageBreakFormula = 'exchange: variation == "A" && point == 1';
assert.equal(coursePageCount(model, 1, { variationCode: "A" }), 2);
assert.equal(coursePageCount(model, 1, { variationCode: "B" }), 1);
assert.equal(courseView(model, 1, { variationCode: "A", page: "global" })[1].pageBreakKind, "exchange");
course.pageBreakFormula = "exchange: point == 1\nflip: point == 2";
assert.equal(coursePageCount(model, 1), 3, "one formula may create multiple pages");
const typedFormulaRows = courseView(model, 1, { page: "global" });
assert.equal(typedFormulaRows[1].pageBreakKind, "exchange");
assert.equal(typedFormulaRows[2].pageBreakKind, "flip");
const overlappingActionModel = structuredClone(model);
overlappingActionModel.courses[0].pageBreakFormula = "flip: point == 1";
overlappingActionModel.courseControls[1].mapExchange = true;
overlappingActionModel.courseControls[1].mapFlip = false;
assert.equal(
  courseView(overlappingActionModel, 1, { page: "global" })[1].pageBreakKind,
  "flip",
  "a formula flip wins over an imported fixed exchange at the same point"
);
assert.notEqual(validatePageBreakFormula("point === 2"), "");
assert.equal(validatePageBreakFormula("unknown == 2").includes("Unknown variable"), true);
assert.equal(validatePageBreakFormula("swap: point == 2").includes("Unknown page action"), true);
assert.equal(validatePageBreakFormula("standalone: point == 2").includes("Unknown page action"), true,
  "advanced formulas cannot create standalone map exchanges");
assert.equal(compilePageBreakFormula('code == "31" && point == 1')({ code: "31", point: 1 }), true);
assert.equal(compilePageBreakRules("point == 1")({ point: 1 }), "flip", "legacy formulas remain map flips");
assert.equal(compilePageBreakRules("exchange: point == 1")({ point: 1 }), "exchange");
assert.equal(
  compilePageBreakRules("exchange: point == 1; flip: code == '31'")({ point: 1, code: "31" }),
  "flip",
  "map flip wins if both typed rules match one point"
);
assert.equal(
  remapPageBreakFormulaCourseControls('exchange: courseControl == ((2)) || code == "courseControl == 2" || (3) != courseControl', new Map([[2, 20], [3, 30]])),
  'exchange: courseControl == ((20)) || code == "courseControl == 2" || (30) != courseControl'
);
assert.equal(
  remapPageBreakFormulaCourseControls("courseControl == (2", new Map([[2, 20]])),
  "courseControl == (2",
  "invalid formulas remain byte-for-byte unchanged during duplication"
);

const repeatedCodeModel = structuredClone(model);
repeatedCodeModel.courseControls.forEach(courseControl => {
  courseControl.mapExchange = false;
  courseControl.mapFlip = false;
});
repeatedCodeModel.courseControls.find(row => row.id === 3).nextCourseControl = 5;
repeatedCodeModel.courseControls.push(createCourseControl(5, 3, 4));
repeatedCodeModel.courses[0].pageBreakFormula = PAGE_PYTHON_SAMPLE;
const repeatedCodeRows = courseView(repeatedCodeModel, 1, { page: "global" });
const repeated32Rows = repeatedCodeRows.filter(row => row.control?.code === "32");
assert.equal(repeated32Rows.length, 2);
assert.equal(repeated32Rows[0].pageBreakKind, "", "the first visit to code 32 does not match occurrence == 2");
assert.equal(repeated32Rows[1].pageBreakKind, "flip", "the second visit to code 32 matches the sample logic");
assert.equal(coursePageCount(repeatedCodeModel, 1), 2);
const pythonOcp = serializeOcp(repeatedCodeModel);
assert.match(pythonOcp, /<page-breaks language="python">def advanced_flip_exchange\(course\):/);
assert.match(pythonOcp, /\n    flip_list=\[\]\n    exchange_list=\[\]/,
  "OCP persistence preserves Python indentation in element text");

model.event.standards.description = "2004";
course.pageBreakFormula = "point == 1";
const legacyDescription = buildControlDescriptionRows(model, 1, "symbols", { page: 1 });
assert.ok(legacyDescription.some(row => row.kind === "directive" && row.symbol === "13.5control" && row.distance === "0 m"));
model.event.standards.description = "2024";
course.pageBreakFormula = "exchange: point == 1\nflip: point == 2";

course.kind = "score";
assert.equal(coursePageCount(model, 1), 1, "paging is limited to normal courses");
assert.equal(courseView(model, 1, { page: 2 }).length, 4, "score courses are never page-filtered");
course.kind = "normal";

const ocp = serializeOcp(model);
const nativePpen = serializeNativePpen(model);
assert.match(ocp, /<page-breaks formula="exchange: point == 1; flip: point == 2"/, "typed new-line rules survive XML attribute normalization");
assert.doesNotMatch(nativePpen, /page-breaks/, "advanced formulas are an O-Composer extension");

const forkModel = createBlankEvent();
forkModel.controls = [
  createControl(1, "start", { x: 0, y: 0 }),
  createControl(2, "normal", { x: 10, y: 0 }, "31"),
  createControl(3, "normal", { x: 20, y: -5 }, "32"),
  createControl(4, "normal", { x: 20, y: 5 }, "33"),
  createControl(5, "normal", { x: 30, y: 0 }, "34"),
  createControl(6, "finish", { x: 40, y: 0 })
];
const forkCourse = createCourse(1, "Fork", "normal", 1);
forkCourse.firstCourseControl = 1;
forkCourse.pageBreakFormula = 'exchange: variation == "A" && code == "32"';
forkModel.courses = [forkCourse];
forkModel.courseControls = [
  createCourseControl(1, 1, 2),
  { ...createCourseControl(2, 2, 7), variation: "fork", variationEnd: 7, variationCourseControls: [3, 5] },
  createCourseControl(3, 2, 4),
  createCourseControl(4, 3, 7),
  createCourseControl(5, 2, 6),
  createCourseControl(6, 4, 7),
  createCourseControl(7, 5, 8),
  createCourseControl(8, 6, null)
];
const routeA = { variationChoices: [3], variationCode: "A" };
const routeB = { variationChoices: [5], variationCode: "B" };
const pythonRouteA = buildPythonPageCourse(courseView(forkModel, 1, { ...routeA, page: "global" }), forkCourse, routeA);
assert.equal(pythonRouteA.branch_name, "A");
assert.deepEqual(pythonRouteA.control_number, ["31", "32", "34"]);
assert.deepEqual(pythonRouteA.point, [1, 2, 3]);
assert.equal(pythonRouteA.course_name, "Fork");
assert.equal(coursePageCount(forkModel, 1, routeA), 2, "a formula is evaluated on a real A branch traversal");
assert.equal(coursePageCount(forkModel, 1, routeB), 1, "the same formula can leave the B branch on one page");
assert.equal(courseView(forkModel, 1, { ...routeA, page: "global" })
  .find(row => row.control.code === "32")?.pageBreakKind, "exchange");
assert.deepEqual(courseView(forkModel, 1, { ...routeA, page: 2 }).map(row => row.control.code), ["32", "34", ""]);

const branchPython = `def advanced_flip_exchange(course):
    flip_list=[]
    exchange_list=[]
    for i in range(course.length):
        flip=course.branch_name=="B" and course.control_number[i]=="33"
        exchange=course.branch_name=="A" and course.control_number[i]=="32"
        assert not flip*exchange
        flip_list.append(flip)
        exchange_list.append(exchange)
    return flip_list,exchange_list`;
forkCourse.pageBreakFormula = branchPython;
assert.equal(courseView(forkModel, 1, { ...routeA, page: "global" })
  .find(row => row.control.code === "32")?.pageBreakKind, "exchange",
"Python receives branch A and its concrete control_number list");
assert.equal(courseView(forkModel, 1, { ...routeB, page: "global" })
  .find(row => row.control.code === "33")?.pageBreakKind, "flip",
"the same Python function runs independently with branch B data");

const invalidPythonModel = structuredClone(forkModel);
invalidPythonModel.courses[0].pageBreakFormula = `def advanced_flip_exchange(course):
    return [1],[0]`;
const invalidPythonRows = courseView(invalidPythonModel, 1, { ...routeA, page: "global" });
assert.match(invalidPythonRows[0].pageFormulaError, /must each contain 3 item/,
  "runtime result-shape errors are exposed on the concrete route");
invalidPythonModel.courses[0].pageBreakFormula = `def advanced_flip_exchange(course):
    return [1,0,0],[1,0,0]`;
assert.match(courseView(invalidPythonModel, 1, { ...routeA, page: "global" })[0].pageFormulaError,
  /cannot be both a map flip and a map exchange/,
  "Python cannot request two incompatible actions at one point");

const migrationModel = structuredClone(model);
const migrationCourse = migrationModel.courses[0];
migrationCourse.pageBreakFormula = "";
migrationModel.courseControls[1].mapExchange = true;
migrationModel.courseControls[1].mapFlip = true;
migrationModel.courseControls[2].mapExchange = true;
migrationModel.courseControls[2].mapFlip = false;
assert.ok(addVariationAtCourseControl(migrationModel, 1, 2, { branches: 2 }));
assert.equal(
  migrationCourse.pageBreakFormula,
  "flip: courseControl == 2\nexchange: courseControl == 3",
  "adding a fork migrates both point action kinds to typed formulas"
);
assert.equal(migrationModel.courseControls[1].mapFlip, false);
assert.equal(migrationModel.courseControls[1].mapExchange, false);
assert.equal(migrationModel.courseControls[2].mapExchange, false);
for (const variation of allCourseVariations(migrationModel, 1)) {
  assert.equal(coursePageCount(migrationModel, 1, {
    variationChoices: variation.choices,
    variationCode: variation.code
  }), 3, "migrated typed actions still split every concrete branch path");
}
const duplicate = duplicateCourse(migrationModel, 1, "Fork copy");
const duplicateFormula = migrationModel.courses.find(candidate => candidate.id === duplicate.id)?.pageBreakFormula || "";
assert.match(duplicateFormula, /^flip: courseControl == \d+\nexchange: courseControl == \d+$/);
assert.notEqual(duplicateFormula, migrationCourse.pageBreakFormula, "duplicating a course remaps typed formula course-control IDs");

const pythonMigrationModel = structuredClone(model);
const pythonMigrationCourse = pythonMigrationModel.courses[0];
pythonMigrationCourse.pageBreakFormula = PAGE_PYTHON_SAMPLE;
pythonMigrationModel.courseControls.forEach(courseControl => {
  courseControl.mapExchange = false;
  courseControl.mapFlip = false;
});
pythonMigrationModel.courseControls[1].mapExchange = true;
assert.ok(addVariationAtCourseControl(pythonMigrationModel, 1, 2, { branches: 2 }));
assert.equal(pythonMigrationCourse.pageBreakFormula, PAGE_PYTHON_SAMPLE,
  "adding a fork never rewrites pasted Python into the legacy formula language");
assert.equal(pythonMigrationModel.courseControls[1].mapExchange, true,
  "fixed actions remain explicit when a pasted Python script already exists");

const standaloneExchange = createBlankEvent();
standaloneExchange.controls = [
  createControl(1, "start", { x: 0, y: 0 }),
  createControl(2, "normal", { x: 10, y: 0 }, "31"),
  createControl(3, "finish", { x: 30, y: 0 })
];
const standaloneCourse = createCourse(1, "Standalone exchange", "normal", 1);
standaloneCourse.firstCourseControl = 1;
standaloneExchange.courses = [standaloneCourse];
standaloneExchange.courseControls = [
  createCourseControl(1, 1, 2),
  createCourseControl(2, 2, 3),
  createCourseControl(3, 3, null)
];
const standaloneSelection = addControlAt(standaloneExchange, "map-exchange", { x: 20, y: 0 }, 1, {
  fromCourseControl: 2,
  toCourseControl: 3
});
const standaloneCourseControl = standaloneExchange.courseControls.find(row => row.id === standaloneSelection.courseControl);
assert.equal(standaloneExchange.controls.find(control => control.id === standaloneSelection.id)?.kind, "map-exchange");
assert.equal(standaloneCourseControl.mapExchange, true);
assert.equal(standaloneCourseControl.mapFlip, false);
assert.equal(standaloneExchange.courseControls.find(row => row.id === 2).nextCourseControl, standaloneCourseControl.id);
assert.equal(standaloneCourseControl.nextCourseControl, 3, "the independent point is inserted on the selected leg");
standaloneExchange.legs.push({
  startControl: 2,
  endControl: standaloneSelection.id,
  bends: [{ x: 15, y: 5 }],
  gaps: [],
  flagging: { kind: "none", point: null }
});
const standalonePage1 = courseView(standaloneExchange, 1, { page: 1 });
const standalonePage2 = courseView(standaloneExchange, 1, { page: 2 });
assert.equal(standalonePage1.at(-1).suppressControlSymbol, true, "a standalone exchange point is hidden at the end of the old map");
assert.equal(standalonePage2[0].suppressControlSymbol, false, "the standalone exchange start is shown on the new map");
assert.equal(buildControlDescriptionRows(standaloneExchange, 1, "symbols", { page: 1 })
  .some(row => row.kind === "directive" && ["13.1", "13.2", "13.5"].includes(row.symbol)), false,
"an unflagged incoming leg does not claim that tapes lead to the exchange");
const standalonePage2Descriptions = buildControlDescriptionRows(standaloneExchange, 1, "symbols", { page: 2 });
const standalonePage2Start = standalonePage2Descriptions.find(row => row.kind === "control" && row.ASymbol === "start");
assert.ok(standalonePage2Start, "the new map begins with a start row");
assert.equal(standalonePage2Start.D, "", "IOF 13.5 must not be drawn in column D of the new-map start row");
assert.equal(standalonePage2Descriptions.some(row => row.kind === "directive" && row.symbol === "13.5"), false,
  "the incoming 13.5 directive remains on the old map only");
const standaloneGlobalDescriptions = buildControlDescriptionRows(standaloneExchange, 1, "symbols", { page: "global" });
assert.equal(standaloneGlobalDescriptions
  .some(row => row.kind === "directive" && row.symbol === "13.5"), false);
assert.equal(standaloneGlobalDescriptions.find(row => row.kind === "control" && row.ASymbol === "start")?.D, "");
const standaloneIncomingLeg = courseLegs(standaloneExchange, 1, { page: 1 }).at(-1);
assert.equal(isEntireLegFlagged(standaloneIncomingLeg), false, "a standalone exchange does not implicitly flag its incoming leg");
assert.deepEqual(flaggedEndpointGapSuppression(standaloneIncomingLeg), { start: false, end: false });
assert.equal(standaloneIncomingLeg.length, 10, "an unflagged incoming leg keeps its straight-line length");
standaloneExchange.legs[0].flagging = { kind: "begin", point: null, end: 5 };
const partiallyFlaggedStandaloneLeg = courseLegs(standaloneExchange, 1, { page: 1 }).at(-1);
assert.equal(isEntireLegFlagged(partiallyFlaggedStandaloneLeg), false);
assert.deepEqual(flaggedEndpointGapSuppression(partiallyFlaggedStandaloneLeg), { start: true, end: false });
assert.deepEqual(legFlagRange(partiallyFlaggedStandaloneLeg), { start: 0, end: 5 },
  "the incoming leg renders only its configured flagged range");
assert.ok(partiallyFlaggedStandaloneLeg.length > 10 && partiallyFlaggedStandaloneLeg.length < 14.2);
const beginFlaggedDescription = buildControlDescriptionRows(standaloneExchange, 1, "symbols", { page: 1 })
  .find(row => row.kind === "directive");
assert.equal(beginFlaggedDescription?.symbol, "13.1", "flagging away from the previous control stays a 13.1 instruction");
standaloneExchange.legs[0].flagging = { kind: "end", point: null, start: 5 };
const endFlaggedDescription = buildControlDescriptionRows(standaloneExchange, 1, "symbols", { page: 1 })
  .find(row => row.kind === "directive");
assert.equal(endFlaggedDescription?.symbol, "13.5", "13.5 is used when the flagged range actually reaches the exchange");
assert.equal(endFlaggedDescription?.distance, "10 m", "13.5 reports only the flagged end segment length");
const standalonePpen = serializeNativePpen(standaloneExchange);
assert.match(standalonePpen, new RegExp(`<control id="${standaloneSelection.id}" kind="map-exchange"`));
assert.match(standalonePpen, new RegExp(`<course-control id="${standaloneCourseControl.id}" control="${standaloneSelection.id}" map-exchange="true">`));

const scoreExchange = createBlankEvent();
scoreExchange.courses = [createCourse(1, "Score", "score", 1)];
assert.throws(
  () => addControlAt(scoreExchange, "map-exchange", { x: 0, y: 0 }, 1),
  /Standalone map exchanges cannot be added to score courses/
);
assert.equal(scoreExchange.controls.length, 0, "a rejected score-course exchange leaves no orphan control");

const reusedExchange = createBlankEvent();
reusedExchange.controls = [
  createControl(1, "start", { x: 0, y: 0 }),
  createControl(2, "map-exchange", { x: 10, y: 0 }),
  createControl(3, "finish", { x: 20, y: 0 })
];
const reusedCourse = createCourse(1, "Reuse exchange", "normal", 1);
reusedCourse.firstCourseControl = 1;
reusedExchange.courses = [reusedCourse];
reusedExchange.courseControls = [
  createCourseControl(1, 1, 2),
  createCourseControl(2, 3, null)
];
const reusedSelection = addExistingControlToCourse(reusedExchange, 1, 2, {
  afterCourseControl: 1,
  beforeCourseControl: 2
});
const reusedCourseControl = reusedExchange.courseControls.find(row => row.id === reusedSelection.courseControl);
assert.equal(reusedCourseControl.mapExchange, true, "reusing a standalone map-exchange control creates a page boundary");
assert.equal(reusedCourseControl.mapFlip, false);

const translate = (message, values = {}) => String(message).replace(/\{(\w+)\}/g, (_match, key) => values[key] ?? "");
const escape = value => String(value ?? "")
  .replace(/&/g, "&amp;")
  .replace(/</g, "&lt;")
  .replace(/>/g, "&gt;")
  .replace(/"/g, "&quot;");
const editorMethods = createAppShellSelectionEditorMethods({
  courseHasVariations: () => false,
  courseView,
  allCourseVariations: () => [],
  escapeHtml: escape,
  escapeAttr: escape
});
const editor = { ...editorMethods, t: translate };
const editorModel = structuredClone(model);
editorModel.courses[0].pageBreakFormula = "";
editorModel.courseControls[2].nextCourseControl = 5;
editorModel.courseControls.push(createCourseControl(5, 2, 4));
editorModel.courseControls[1].mapExchange = true;
editorModel.courseControls[1].mapFlip = false;
editorModel.courseControls[2].mapExchange = false;
editorModel.courseControls[2].mapFlip = false;
const fixedEditorHtml = editor.coursePageEditor(editorModel, editorModel.courses[0]);
const pointActionSelects = [...fixedEditorHtml.matchAll(/<select data-course-page-break="(\d+)"[\s\S]*?<\/select>/g)];
assert.equal(pointActionSelects.length, 1, "the compact editor renders only configured point actions");
assert.deepEqual(pointActionSelects.map(match => Number(match[1])), [2]);
assert.match(pointActionSelects[0][0], /value="exchange" selected/, "an existing map exchange is selected");
assert.doesNotMatch(fixedEditorHtml, /data-course-page-break="3"/, "unconfigured points are not permanent rows");
assert.match(fixedEditorHtml, /data-course-page-move="2"/);
assert.match(fixedEditorHtml, /data-course-page-add-toggle[^>]*>Add map action<\/button>/);
assert.match(fixedEditorHtml, /data-course-page-add-form hidden/);
assert.match(fixedEditorHtml, /<option value="standalone-exchange">Standalone map exchange<\/option>/);
const addPointSelect = fixedEditorHtml.match(/<select data-course-page-add-point>([\s\S]*?)<\/select>/)?.[1] || "";
assert.match(addPointSelect, /value="3"/);
assert.match(addPointSelect, /value="5"/);
assert.doesNotMatch(addPointSelect, /value="2"/, "already configured occurrences are excluded from Add");
assert.match(fixedEditorHtml, /data-course-page-remove="2"/);
assert.match(fixedEditorHtml, /data-field="course\.pageBreakFormula"/, "fixed courses also expose the advanced formula editor");
assert.match(fixedEditorHtml, /def advanced_flip_exchange\(course\)/);
assert.match(fixedEditorHtml, /course\.control_number\[i\]/);
assert.match(fixedEditorHtml, /Use sample Python code/);
assert.match(fixedEditorHtml, /Course data available to Python/);
assert.match(fixedEditorHtml, /1:31/);
assert.match(fixedEditorHtml, /Python code can produce map exchanges and map flips at controls/);

const emptyEditorModel = structuredClone(editorModel);
emptyEditorModel.courseControls.forEach(courseControl => {
  courseControl.mapExchange = false;
  courseControl.mapFlip = false;
});
const emptyEditorHtml = editor.coursePageEditor(emptyEditorModel, emptyEditorModel.courses[0]);
assert.match(emptyEditorHtml, /No map actions configured\./);
assert.doesNotMatch(emptyEditorHtml, /data-course-page-break=/);

const standaloneEditorHtml = editor.coursePageEditor(standaloneExchange, standaloneCourse);
assert.match(standaloneEditorHtml, /data-course-page-remove-standalone="4"/,
  "the simple manager lists an existing standalone exchange without treating it as an at-control action");
assert.match(standaloneEditorHtml, /<option>Standalone map exchange<\/option>/);

const fullEditorModel = structuredClone(editorModel);
for (const id of [2, 3, 5]) {
  fullEditorModel.courseControls.find(row => row.id === id).mapExchange = true;
}
const fullEditorHtml = editor.coursePageEditor(fullEditorModel, fullEditorModel.courses[0]);
assert.match(fullEditorHtml, /data-course-page-add-toggle[^>]*disabled/);

const branchEditorMethods = createAppShellSelectionEditorMethods({
  courseHasVariations: () => true,
  courseView,
  allCourseVariations,
  escapeHtml: escape,
  escapeAttr: escape
});
const branchEditorHtml = ({ ...branchEditorMethods, t: translate }).coursePageEditor(forkModel, forkCourse);
assert.doesNotMatch(branchEditorHtml, /data-course-page-add-toggle/, "branch courses keep the formula-only editor");
assert.doesNotMatch(branchEditorHtml, /value="standalone-exchange"/, "advanced paging does not offer standalone map exchanges");
assert.match(branchEditorHtml, /<code role="cell">A<\/code>/, "the advanced editor exposes concrete branch names");
assert.match(branchEditorHtml, /2:32/, "the advanced editor exposes each branch point position and code");

const dialogMethods = createAppShellDialogMethods({});
let focusedDraft = false;
let focusedToggle = false;
const draftPoint = { focus: () => { focusedDraft = true; } };
const addForm = {
  hidden: true,
  querySelector: selector => selector === "[data-course-page-add-point]" ? draftPoint : null
};
const addToggle = {
  disabled: false,
  closest: selector => selector === ".course-page-action-manager" ? actionManager : null,
  setAttribute: (name, value) => { addToggle[name] = value; },
  focus: () => { focusedToggle = true; }
};
const actionManager = {
  querySelector: selector => {
    if (selector === "[data-course-page-add-form]") return addForm;
    if (selector === "[data-course-page-add-toggle]") return addToggle;
    return null;
  }
};
const addCancel = { closest: selector => selector === ".course-page-action-manager" ? actionManager : null };
const clickTarget = matches => ({ closest: selector => matches[selector] || null });
const dialogApp = { ...dialogMethods };
dialogApp.handleSelectionPanelClick({
  target: clickTarget({ "[data-course-page-add-toggle]": addToggle }),
  preventDefault: () => {}
});
assert.equal(addForm.hidden, false, "the Add button expands a transient draft without touching the model");
assert.equal(addToggle["aria-expanded"], "true");
assert.equal(focusedDraft, true);
dialogApp.handleSelectionPanelClick({
  target: clickTarget({ "[data-course-page-add-cancel]": addCancel }),
  preventDefault: () => {}
});
assert.equal(addForm.hidden, true);
assert.equal(addToggle["aria-expanded"], "false");
assert.equal(focusedToggle, true, "Cancel returns focus to the Add button");
const confirmAdd = {};
let confirmedAdd = null;
dialogApp.addCoursePageAction = button => { confirmedAdd = button; };
dialogApp.handleSelectionPanelClick({
  target: clickTarget({ "[data-course-page-add]": confirmAdd }),
  preventDefault: () => {}
});
assert.equal(confirmedAdd, confirmAdd, "the delegated click confirms the two-field Add draft");
const removeAction = { dataset: { coursePageRemove: "2" } };
let removeChange = null;
dialogApp.changeFixedCoursePageAction = change => { removeChange = change; };
dialogApp.handleSelectionPanelClick({
  target: clickTarget({ "[data-course-page-remove]": removeAction }),
  preventDefault: () => {}
});
assert.deepEqual(removeChange, { sourceId: "2", targetId: 0, kind: "" });
const removeStandaloneAction = { dataset: { coursePageRemoveStandalone: "4" } };
let removedStandaloneId = null;
dialogApp.removeStandaloneCoursePageAction = id => { removedStandaloneId = id; };
dialogApp.handleSelectionPanelClick({
  target: clickTarget({ "[data-course-page-remove-standalone]": removeStandaloneAction }),
  preventDefault: () => {}
});
assert.equal(removedStandaloneId, "4");

const pythonExampleButton = {};
let appliedPythonExample = false;
let refreshedPythonDialog = false;
dialogApp.activeCommandDialog = { coursePageSettings: true };
dialogApp.applyCoursePagePythonExample = () => { appliedPythonExample = true; };
dialogApp.refreshCoursePageSettingsDialog = () => { refreshedPythonDialog = true; };
dialogApp.handleCommandDialogClick({
  target: clickTarget({
    "[data-course-page-python-example]": pythonExampleButton,
    [[
      "[data-course-page-add-toggle]",
      "[data-course-page-add-cancel]",
      "[data-course-page-add]",
      "[data-course-page-python-example]",
      "[data-course-page-remove-standalone]",
      "[data-course-page-remove]"
    ].join(",")]: pythonExampleButton,
    [[
      "[data-course-page-add]",
      "[data-course-page-python-example]",
      "[data-course-page-remove-standalone]",
      "[data-course-page-remove]"
    ].join(",")]: pythonExampleButton
  }),
  preventDefault: () => {}
});
assert.equal(appliedPythonExample, true, "the sample button directly inserts the bundled Python function");
assert.equal(refreshedPythonDialog, true);

const mutuallyExclusiveModel = structuredClone(editorModel);
mutuallyExclusiveModel.courses[0].pageBreakFormula = "";
mutuallyExclusiveModel.courseControls[1].mapExchange = true;
mutuallyExclusiveModel.courseControls[1].mapFlip = true;
const commandState = {
  eventModel: mutuallyExclusiveModel,
  ui: { selectedCourseId: 1, selection: { type: "course", id: 1 }, coursePage: 2 }
};
let hasVariations = false;
const commandMethods = createAppShellCommandMethods({
  objectForSelection: eventModel => eventModel.courses[0],
  valueFromInput: target => target.value,
  setPath: (object, path, value) => { object[path[0]] = value; },
  deleteSelection,
  getControl,
  getCourse,
  getCourseControl,
  courseHasVariations: () => hasVariations,
  courseView,
  applyCourseKindDefaults: () => {},
  escapeHtml: escape
});
let eventUpdateCount = 0;
const commandApp = {
  ...commandMethods,
  store: {
    snapshot: () => commandState,
    updateEvent: callback => {
      eventUpdateCount += 1;
      callback(commandState.eventModel);
    },
    updateUi: callback => callback(commandState.ui)
  }
};
commandApp.updateSelectionField({
  target: { dataset: { field: "course.pageBreakFormula" }, type: "textarea", value: "point == 2" }
});
assert.equal(mutuallyExclusiveModel.courseControls[1].mapFlip, false, "a fixed-course formula replaces its simple page turn");
assert.equal(commandState.ui.coursePage, "global");

const addActionButton = (courseControlId, kind) => {
  const form = {
    querySelector: selector => selector === "[data-course-page-add-point]"
      ? { value: String(courseControlId) }
      : { value: kind }
  };
  return { closest: selector => selector === "[data-course-page-add-form]" ? form : null };
};

commandState.ui.coursePage = 2;
assert.equal(commandApp.addCoursePageAction(addActionButton(2, "exchange")), true);
assert.equal(mutuallyExclusiveModel.courses[0].pageBreakFormula, "", "a point action replaces the fixed-course formula");
assert.equal(mutuallyExclusiveModel.courseControls[1].mapExchange, true);
assert.equal(mutuallyExclusiveModel.courseControls[1].mapFlip, false);
assert.equal(commandState.ui.coursePage, "global");

commandState.ui.coursePage = 2;
const updatesBeforeRejectedAdd = eventUpdateCount;
assert.equal(commandApp.addCoursePageAction(addActionButton(2, "flip")), false, "Add never overwrites an occupied occurrence");
assert.equal(eventUpdateCount, updatesBeforeRejectedAdd, "a rejected Add does not create a no-op history entry");
assert.equal(commandState.ui.coursePage, 2, "a rejected Add does not change the displayed page");
assert.equal(mutuallyExclusiveModel.courseControls[1].mapExchange, true);
assert.equal(mutuallyExclusiveModel.courseControls[1].mapFlip, false);

const realStore = new Store();
realStore.state.eventModel = structuredClone(mutuallyExclusiveModel);
realStore.state.eventModel.dirty = false;
realStore.state.ui.selection = { type: "course", id: 1 };
realStore.state.ui.coursePage = 2;
let realStoreNotifications = 0;
const unsubscribeRealStore = realStore.subscribe(() => { realStoreNotifications += 1; });
realStoreNotifications = 0;
const realStoreHistoryLength = realStore.undoStack.length;
const realStoreCommandApp = { ...commandMethods, store: realStore };
assert.equal(realStoreCommandApp.addCoursePageAction(addActionButton(2, "flip")), false);
assert.equal(realStore.undoStack.length, realStoreHistoryLength, "a rejected Add does not create a real Store undo entry");
assert.equal(realStore.state.eventModel.dirty, false);
assert.equal(realStoreNotifications, 0, "a rejected Add does not notify or collapse the draft UI");
assert.equal(realStore.state.ui.coursePage, 2);
unsubscribeRealStore();

assert.equal(commandApp.addCoursePageAction(addActionButton(3, "flip")), true);
assert.equal(mutuallyExclusiveModel.courseControls[2].mapExchange, true);
assert.equal(mutuallyExclusiveModel.courseControls[2].mapFlip, true);

commandState.ui.coursePage = 2;
commandApp.updateSelectionField({
  target: { dataset: { coursePageMove: "2" }, value: "3" }
});
assert.equal(mutuallyExclusiveModel.courseControls[1].mapExchange, true, "an action cannot move onto an occupied occurrence");
assert.equal(commandState.ui.coursePage, 2);

commandApp.updateSelectionField({
  target: { dataset: { coursePageMove: "2" }, value: "5" }
});
assert.equal(mutuallyExclusiveModel.courseControls[1].mapExchange, false, "moving clears the old occurrence");
assert.equal(mutuallyExclusiveModel.courseControls[1].mapFlip, false);
const movedCourseControl = mutuallyExclusiveModel.courseControls.find(row => row.id === 5);
assert.equal(movedCourseControl.mapExchange, true, "moving preserves the action at the new occurrence");
assert.equal(movedCourseControl.mapFlip, false);
assert.equal(commandState.ui.coursePage, "global");

commandApp.updateSelectionField({
  target: { dataset: { coursePageBreak: "5" }, value: "flip" }
});
assert.equal(movedCourseControl.mapExchange, true);
assert.equal(movedCourseControl.mapFlip, true, "the configured action type remains editable");

assert.equal(commandApp.changeFixedCoursePageAction({ sourceId: 3, targetId: 0, kind: "" }), true);
assert.equal(mutuallyExclusiveModel.courseControls[2].mapExchange, false, "Delete clears only its configured occurrence");
assert.equal(mutuallyExclusiveModel.courseControls[2].mapFlip, false);
assert.equal(movedCourseControl.mapFlip, true, "Delete preserves other configured actions");

let openedPageSettings = null;
commandState.ui.selection = { type: "control", id: 1 };
commandApp.t = translate;
commandApp.coursePageEditor = (_eventModel, course) => `<div data-settings-course="${course.id}"></div>`;
commandApp.openCommandDialog = config => { openedPageSettings = config; };
assert.equal(commandApp.openCoursePageSettings(), true, "the independent tool opens for the selected course tab");
assert.equal(commandApp.coursePageSettingsCourseId, 1);
assert.equal(openedPageSettings?.coursePageSettings, true);
assert.match(openedPageSettings?.body || "", /data-settings-course="1"/);
assert.equal(commandApp.changeFixedCoursePageAction({ sourceId: 5, targetId: 5, kind: "exchange" }), true,
  "the independent settings remain bound to the course without replacing the Adjustment selection");
assert.equal(commandState.ui.selection.type, "control");
assert.equal(movedCourseControl.mapFlip, false);
commandApp.coursePageSettingsCourseId = null;
commandState.ui.selection = { type: "course", id: 1 };

hasVariations = true;
mutuallyExclusiveModel.courseControls[1].mapExchange = true;
mutuallyExclusiveModel.courseControls[1].mapFlip = true;
commandApp.updateSelectionField({
  target: { dataset: { field: "course.pageBreakFormula" }, type: "textarea", value: "variation == \"A\"" }
});
assert.equal(mutuallyExclusiveModel.courseControls[1].mapFlip, true, "branch formulas preserve imported fixed page turns");

hasVariations = false;
const simpleStandaloneModel = createBlankEvent();
simpleStandaloneModel.controls = [
  createControl(1, "start", { x: 0, y: 0 }),
  createControl(2, "normal", { x: 10, y: 0 }, "31"),
  createControl(3, "normal", { x: 20, y: 0 }, "32"),
  createControl(4, "finish", { x: 30, y: 0 })
];
const simpleStandaloneCourse = createCourse(1, "Simple standalone", "normal", 1);
simpleStandaloneModel.controls[1].descriptions = [{ box: "D", ref: "1.1", text: "" }];
simpleStandaloneModel.controls[1].descriptionText = "Original checkpoint";
simpleStandaloneModel.controls[1].punchPattern = { size: 3, rows: ["XXX", "X.X", "XXX"] };
simpleStandaloneCourse.firstCourseControl = 1;
simpleStandaloneCourse.pageBreakFormula = "flip: point == 2";
simpleStandaloneModel.courses = [simpleStandaloneCourse];
simpleStandaloneModel.courseControls = [
  createCourseControl(1, 1, 2),
  createCourseControl(2, 2, 3),
  createCourseControl(3, 3, 4),
  createCourseControl(4, 4, null)
];
const simpleStandaloneState = {
  eventModel: simpleStandaloneModel,
  ui: { selection: { type: "course", id: 1 }, coursePage: 2 }
};
const simpleStandaloneApp = {
  ...commandMethods,
  store: {
    snapshot: () => simpleStandaloneState,
    updateEvent: callback => callback(simpleStandaloneState.eventModel),
    updateUi: callback => callback(simpleStandaloneState.ui)
  }
};
const simpleCourseControlCount = simpleStandaloneModel.courseControls.length;
assert.equal(simpleStandaloneApp.addCoursePageAction(addActionButton(2, "standalone-exchange")), true);
assert.equal(simpleStandaloneModel.courseControls.length, simpleCourseControlCount,
  "simple standalone conversion does not insert another course node");
assert.equal(getControl(simpleStandaloneModel, 2).kind, "map-exchange");
assert.equal(getControl(simpleStandaloneModel, 2).code, "31", "conversion preserves the original checkpoint code for restoration");
assert.equal(getControl(simpleStandaloneModel, 2).descriptionText, "Original checkpoint");
assert.equal(getCourseControl(simpleStandaloneModel, 2).mapExchange, true);
assert.equal(getCourseControl(simpleStandaloneModel, 2).mapFlip, false);
assert.equal(simpleStandaloneCourse.pageBreakFormula, "", "simple conversion replaces the advanced formula");
assert.equal(coursePageCount(simpleStandaloneModel, 1), 2);
assert.deepEqual(courseView(simpleStandaloneModel, 1, { page: "global" })
  .filter(row => row.control.kind === "normal")
  .map(row => row.control.code), ["32"], "the converted point is removed from checkpoint numbering");
assert.equal(simpleStandaloneState.ui.coursePage, "global");
assert.equal(simpleStandaloneApp.removeStandaloneCoursePageAction(2), true);
assert.equal(simpleStandaloneModel.courseControls.length, simpleCourseControlCount,
  "removing a converted standalone exchange keeps its course node");
assert.equal(getControl(simpleStandaloneModel, 2).kind, "normal",
  "removing a converted standalone exchange restores the same normal checkpoint");
assert.equal(getControl(simpleStandaloneModel, 2).code, "31", "restoration keeps the original checkpoint code");
assert.deepEqual(getControl(simpleStandaloneModel, 2).descriptions, [{ box: "D", ref: "1.1", text: "" }]);
assert.equal(getControl(simpleStandaloneModel, 2).descriptionText, "Original checkpoint");
assert.deepEqual(getControl(simpleStandaloneModel, 2).punchPattern, { size: 3, rows: ["XXX", "X.X", "XXX"] });
assert.equal(getCourseControl(simpleStandaloneModel, 2).mapExchange, false);
assert.equal(getCourseControl(simpleStandaloneModel, 2).mapFlip, false);
assert.deepEqual(courseView(simpleStandaloneModel, 1, { page: "global" })
  .filter(row => row.control.kind === "normal")
  .map(row => row.control.code), ["31", "32"], "the restored checkpoint returns to course numbering");
assert.equal(courseView(simpleStandaloneModel, 1, { page: "global" })
  .some(row => row.control.kind === "map-exchange"), false);

const nativeStandaloneCount = standaloneExchange.courseControls.length;
deleteSelection(standaloneExchange, { type: "control", id: standaloneSelection.id }, { selectedCourseId: 1 });
assert.equal(standaloneExchange.courseControls.length, nativeStandaloneCount,
  "deleting an independently placed exchange restores instead of removing its course node");
assert.equal(getControl(standaloneExchange, standaloneSelection.id)?.kind, "normal");
assert.match(getControl(standaloneExchange, standaloneSelection.id)?.code || "", /^\d+$/,
  "a restored exchange without an original code receives an available checkpoint code");
assert.equal(getCourseControl(standaloneExchange, standaloneCourseControl.id)?.mapExchange, false);

const convertedExchangeModel = createBlankEvent();
convertedExchangeModel.controls = [createControl(1, "normal", { x: 0, y: 0 }, "31")];
convertedExchangeModel.courseControls = [createCourseControl(1, 1, null)];
convertedExchangeModel.courseControls[0].mapExchange = false;
convertedExchangeModel.courseControls[0].mapFlip = true;
const convertedExchangeState = {
  eventModel: convertedExchangeModel,
  ui: { selection: { type: "control", id: 1 } }
};
const conversionMethods = createAppShellCommandMethods({
  objectForSelection: eventModel => eventModel.controls[0],
  valueFromInput: target => target.value,
  setPath: (object, path, value) => { object[path[0]] = value; },
  courseHasVariations: () => false,
  courseView,
  applyCourseKindDefaults: () => {}
});
const conversionApp = {
  ...conversionMethods,
  store: {
    snapshot: () => convertedExchangeState,
    updateEvent: callback => callback(convertedExchangeState.eventModel),
    updateUi: callback => callback(convertedExchangeState.ui)
  },
  render: () => {}
};
conversionApp.updateSelectionField({
  target: { dataset: { field: "control.kind" }, value: "map-exchange" }
});
assert.equal(convertedExchangeModel.courseControls[0].mapExchange, true, "converting a point to standalone exchange marks every occurrence as an exchange");
assert.equal(convertedExchangeModel.courseControls[0].mapFlip, false);
conversionApp.updateSelectionField({
  target: { dataset: { field: "control.kind" }, value: "normal" }
});
assert.equal(convertedExchangeModel.courseControls[0].mapExchange, false, "converting away from standalone exchange clears its implicit boundary");
assert.equal(convertedExchangeModel.courseControls[0].mapFlip, false);

console.log("course pages smoke test passed");
