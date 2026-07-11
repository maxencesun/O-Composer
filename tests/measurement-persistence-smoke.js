import assert from "node:assert/strict";
import { createBlankEvent } from "../src/domain/event-model.js";
import { serializeOcp } from "../src/domain/ppen-parser.js";

const measurements = {
  items: [{
    points: [{ x: 1, y: 2 }, { x: 30, y: 40 }],
    closed: false,
    color: "#123456",
    labelPosition: { x: 15, y: 25 }
  }],
  showGroundLabels: true,
  color: "#123456"
};
const xml = serializeOcp(createBlankEvent(), { ocpData: { measurements } });
assert.match(xml, /<measurements>/);
assert.match(xml, /#123456/);
assert.match(xml, /showGroundLabels/);
assert.match(xml, /labelPosition/);
console.log("measurement persistence smoke test passed");
