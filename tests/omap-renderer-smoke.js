import { drawOmapMap } from "../src/ui/omap-renderer.js";

const calls = [];
const ctx = {
  globalAlpha: 1,
  lineCap: "",
  lineJoin: "",
  strokeStyle: "",
  fillStyle: "",
  lineWidth: 1,
  save() { calls.push("save"); },
  restore() { calls.push("restore"); },
  beginPath() { calls.push("beginPath"); },
  moveTo(x, y) { calls.push(["moveTo", x, y]); },
  lineTo(x, y) { calls.push(["lineTo", x, y]); },
  bezierCurveTo(x1, y1, x2, y2, x3, y3) { calls.push(["bezierCurveTo", x1, y1, x2, y2, x3, y3]); },
  arc(x, y, radius) { calls.push(["arc", x, y, radius]); },
  closePath() { calls.push("closePath"); },
  fill() { calls.push("fill"); },
  stroke() { calls.push("stroke"); },
  clip() { calls.push("clip"); },
  setLineDash(value) { calls.push(["setLineDash", value.length]); }
};

drawOmapMap(ctx, {
  symbols: {
    1: {
      kind: "line",
      line: {
        color: "#000",
        width: 1,
        dashed: false,
        capStyle: "1",
        joinStyle: "2",
        priority: 1
      }
    },
    2: {
      kind: "line",
      line: {
        color: "#000",
        width: 1,
        dashed: false,
        capStyle: "1",
        joinStyle: "2",
        priority: 2,
        priorities: [2],
        segmentLength: 5,
        endLength: 2.5,
        showAtLeastOneSymbol: true,
        midSymbolsPerSpot: 1,
        midSymbolDistance: 0,
        midSymbol: {
          kind: "point",
          point: {
            innerRadius: 0,
            innerColor: null,
            innerPriority: 99,
            outerWidth: 0,
            outerColor: null,
            outerPriority: 99,
            rotatable: true,
            priorities: [2],
            elements: [{
              symbol: {
                kind: "line",
                line: {
                  color: "#000",
                  width: 1,
                  dashed: false,
                  capStyle: "1",
                  joinStyle: "2",
                  priority: 2,
                  priorities: [2]
                }
              },
              object: {
                type: "1",
                coords: [
                  { x: 0, y: 0, flags: 0 },
                  { x: 0, y: 1, flags: 0 }
                ]
              }
            }]
          }
        }
      }
    },
    3: {
      kind: "point",
      point: {
        innerRadius: 1,
        innerColor: "#fff",
        innerPriority: 10,
        outerWidth: 2,
        outerColor: "#080",
        outerPriority: 8,
        priorities: [10, 8],
        elements: []
      }
    },
    4: {
      kind: "line",
      line: {
        color: "#000",
        width: 0.18,
        dashed: false,
        capStyle: "0",
        joinStyle: "1",
        priority: 2,
        priorities: [2],
        segmentLength: 5,
        endLength: 0,
        showAtLeastOneSymbol: true,
        midSymbolsPerSpot: 1,
        midSymbolDistance: 0,
        midSymbol: {
          kind: "point",
          point: {
            innerRadius: 0,
            innerColor: null,
            innerPriority: 99,
            outerWidth: 0,
            outerColor: null,
            outerPriority: 99,
            rotatable: true,
            priorities: [2],
            elements: [{
              symbol: {
                kind: "line",
                line: {
                  color: "#000",
                  width: 0.22,
                  dashed: false,
                  capStyle: "0",
                  joinStyle: "1",
                  priority: 2,
                  priorities: [2]
                }
              },
              object: {
                type: "1",
                coords: [
                  { x: 0, y: -0.4, flags: 0 },
                  { x: 0, y: 0.4, flags: 0 }
                ]
              }
            }]
          }
        }
      }
    },
    5: {
      kind: "line",
      line: {
        color: "#eee",
        width: 2,
        dashed: false,
        capStyle: "0",
        joinStyle: "1",
        priority: 5,
        priorities: [6, 5],
        borders: [
          {
            side: "left",
            color: "#000",
            width: 0.2,
            shift: 0.1,
            dashed: false,
            priority: 6
          },
          {
            side: "right",
            color: "#000",
            width: 0.2,
            shift: 0.1,
            dashed: false,
            priority: 6
          }
        ]
      }
    },
    6: {
      kind: "combined",
      combined: {
        priorities: [7, 8],
        parts: [
          { symbolId: "7", symbol: null },
          {
            symbolId: null,
            symbol: {
              kind: "line",
              line: {
                color: "#000",
                width: 0.1,
                dashed: false,
                capStyle: "0",
                joinStyle: "1",
                priority: 7,
                priorities: [7]
              }
            }
          }
        ]
      }
    },
    7: {
      kind: "area",
      area: {
        innerColor: "#ddd",
        innerPriority: 8,
        patterns: [],
        priorities: [8]
      }
    }
  },
  objects: [
    {
      index: 0,
      type: "1",
      symbolId: "1",
      coords: [
        { x: 0, y: 0, flags: 1 },
        { x: 10, y: 0, flags: 0 },
        { x: 10, y: 10, flags: 0 },
        { x: 0, y: 10, flags: 2 }
      ]
    },
    {
      index: 1,
      type: "1",
      symbolId: "2",
      coords: [
        { x: 0, y: 20, flags: 0 },
        { x: 10, y: 20, flags: 0 }
      ]
    },
    {
      index: 2,
      type: "0",
      symbolId: "3",
      coords: [{ x: 20, y: 20, flags: 0 }]
    },
    {
      index: 3,
      type: "1",
      symbolId: "4",
      coords: [
        { x: 30, y: 20, flags: 0 },
        { x: 33, y: 20, flags: 0 }
      ]
    },
    {
      index: 4,
      type: "1",
      symbolId: "5",
      coords: [
        { x: 40, y: 20, flags: 0 },
        { x: 50, y: 20, flags: 0 }
      ]
    },
    {
      index: 5,
      type: "1",
      symbolId: "6",
      coords: [
        { x: 60, y: 60, flags: 0 },
        { x: 65, y: 60, flags: 0 },
        { x: 65, y: 65, flags: 0 },
        { x: 60, y: 65, flags: 2 }
      ]
    },
    {
      index: 6,
      type: "1",
      symbolId: "2",
      coords: [
        { x: 70, y: 20, flags: 0 },
        { x: 75, y: 20, flags: 32 },
        { x: 80, y: 20, flags: 0 }
      ]
    },
    {
      index: 7,
      type: "1",
      symbolId: "4",
      coords: [
        { x: 90, y: 20, flags: 0 },
        { x: 95, y: 20, flags: 32 },
        { x: 100, y: 20, flags: 0 }
      ]
    }
  ]
}, point => point, 1);

if (!calls.some(call => Array.isArray(call) && call[0] === "bezierCurveTo")) {
  throw new Error("OMAP curve did not render with bezierCurveTo");
}
if (!calls.includes("closePath")) {
  throw new Error("OMAP close point did not close the path");
}
if (calls.filter(call => Array.isArray(call) && call[0] === "lineTo").length < 3) {
  throw new Error("OMAP line mid symbols did not render comb marks");
}
if (!calls.some(call => Array.isArray(call) && call[0] === "arc" && call[3] === 2)) {
  throw new Error("OMAP point symbol outer ring radius is wrong");
}
if (!calls.some(call => approxCall(call, "lineTo", 30, 20.4)) || !calls.some(call => approxCall(call, "lineTo", 33, 20.4))) {
  throw new Error("OMAP bench end-length-zero comb symbols were not anchored at line ends");
}
if (!calls.some(call => approxCall(call, "lineTo", 50, 21.1)) || !calls.some(call => approxCall(call, "lineTo", 50, 18.9))) {
  throw new Error("OMAP road border lines were not rendered on both sides");
}
if (!calls.some(call => approxCall(call, "lineTo", 65, 65))) {
  throw new Error("OMAP combined private line part did not render");
}
if (calls.some(call => approxCall(call, "lineTo", 75, 21))) {
  throw new Error("OMAP dash points should split mid-symbol groups, not add an extra comb symbol");
}
if (!calls.some(call => approxCall(call, "lineTo", 72.5, 21)) || !calls.some(call => approxCall(call, "lineTo", 77.5, 21))) {
  throw new Error("OMAP dash-point split groups did not adapt comb positions like Mapper");
}
if (calls.some(call => approxCall(call, "lineTo", 95, 20.4))) {
  throw new Error("OMAP end-length-zero comb symbols should not be placed directly on dash points");
}
if (!calls.some(call => approxCall(call, "lineTo", 93.3333333333, 20.4)) || !calls.some(call => approxCall(call, "lineTo", 96.6666666667, 20.4))) {
  throw new Error("OMAP end-length-zero dash-point comb spacing does not match Purple Pen");
}

print("OMAP renderer smoke passed.");

function approxCall(call, name, x, y) {
  return Array.isArray(call)
    && call[0] === name
    && Math.abs(call[1] - x) < 1e-6
    && Math.abs(call[2] - y) < 1e-6;
}
