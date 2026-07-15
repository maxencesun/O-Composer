import assert from "node:assert/strict";
import { builtinConstantsForView, pythonCoursePropertiesForView, resolveTextConstants } from "../src/domain/constants.js";
import { createAppShellCoursePanelMethods } from "../src/ui/app-shell-course-panel-methods.js";

const eventModel = {
  event: { title: "Fork constants", map: { scale: 10000 }, constants: [] },
  controls: [
    { id: 10, kind: "normal", code: "31", location: { x: 0, y: 0 } },
    { id: 11, kind: "normal", code: "32", location: { x: 100, y: 0 } },
    { id: 12, kind: "normal", code: "33", location: { x: 0, y: 200 } },
    { id: 13, kind: "normal", code: "34", location: { x: 300, y: 0 } }
  ],
  courses: [{
    id: 1,
    name: "Fork",
    kind: "normal",
    firstCourseControl: 1,
    options: {},
    relay: { legs: 2, branches: [{ branch: "A", legs: [1] }, { branch: "B", legs: [2] }] }
  }],
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

function lengthConstant(ui) {
  return builtinConstantsForView(eventModel, ui).find(row => row.name === "\\len");
}

const allBranches = lengthConstant({ selectedCourseId: 1, variationMode: "all" });
assert.equal(allBranches.value, "300 m – 561 m");
assert.equal(allBranches.raw, "300 – 561");
assert.equal(resolveTextConstants("Length: \\len", eventModel, { selectedCourseId: 1, variationMode: "all" }), "Length: 300 m – 561 m");

const defaultView = lengthConstant({ selectedCourseId: 1, variationMode: "default" });
assert.equal(defaultView.value, "300 m – 561 m", "a course-level length constant should remain a range until one variation is selected");

const variationA = lengthConstant({ selectedCourseId: 1, variationMode: "variation", variationCode: "A" });
assert.equal(variationA.value, "300 m");
assert.equal(variationA.raw, 300);

const courseProperties = pythonCoursePropertiesForView(eventModel, {
  selectedCourseId: 1,
  variationMode: "variation",
  variationCode: "A"
});
const propertyValue = name => courseProperties.find(row => row.name === name)?.value;
assert.equal(courseProperties.length, 15, "all Python course attributes are exposed in Constants");
assert.equal(propertyValue("course.branch_name"), '"A"');
assert.match(propertyValue("course.control_number"), /"31"/);
assert.match(propertyValue("course.point_branch"), /"A"/);
assert.match(propertyValue("course.point_allowed_legs"), /\[1\]/);
assert.equal(propertyValue("course.allowed_legs"), "[1]");
assert.equal(propertyValue("course.course_name"), '"Fork"');
assert.deepEqual(pythonCoursePropertiesForView(eventModel, { selectedCourseId: "all" }), [],
  "course properties wait for a concrete course selection");

const escape = value => String(value ?? "")
  .replace(/&/g, "&amp;")
  .replace(/</g, "&lt;")
  .replace(/>/g, "&gt;")
  .replace(/"/g, "&quot;");
const panel = {};
const panelMethods = createAppShellCoursePanelMethods({ escapeHtml: escape, escapeAttr: escape });
panelMethods.renderConstants.call({
  querySelector: selector => selector === "#constantsPanel" ? panel : null,
  t: message => message
}, {
  eventModel,
  ui: { selectedCourseId: 1, variationMode: "variation", variationCode: "A" }
});
assert.match(panel.innerHTML, /Advanced map-page course properties/);
assert.match(panel.innerHTML, /constants-course-property-value-column/,
  "the course-property table has a dedicated wide value column");
assert.match(panel.innerHTML, /course\.control_number/);
assert.match(panel.innerHTML, /\[&quot;31&quot;/, "the Constants panel shows the current route value");

console.log("constants smoke test passed");
