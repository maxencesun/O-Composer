import assert from "node:assert/strict";
import { measurementLabelPoint, measurementMetrics, measurementPathDistance } from "../src/domain/measurement.js";

const open = measurementMetrics([{ x: 0, y: 0 }, { x: 30, y: 0 }, { x: 30, y: 40 }], false, 10000);
assert.equal(open.lineLengthM, 70);
assert.equal(open.lineLengthPaperMm, 7);
assert.equal(open.perimeterM, null);
assert.equal(open.areaM2, null);

const closed = measurementMetrics([{ x: 0, y: 0 }, { x: 30, y: 0 }, { x: 30, y: 40 }], true, 10000);
assert.equal(closed.lineLengthM, 70);
assert.equal(closed.perimeterM, 120);
assert.equal(closed.perimeterPaperMm, 12);
assert.equal(closed.areaM2, 600);
assert.equal(closed.areaPaperMm2, 6);
assert.deepEqual(measurementLabelPoint({ points: [{ x: 0, y: 0 }, { x: 10, y: 0 }] }), { x: 5, y: 0 });
assert.equal(measurementPathDistance({ x: 5, y: 3 }, { points: [{ x: 0, y: 0 }, { x: 10, y: 0 }] }), 3);

console.log("measurement smoke test passed");
