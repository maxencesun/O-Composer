import { relayAssignments } from "../src/domain/relay-variations.js";

const eventModel = {
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

console.log("relay variations smoke passed");
