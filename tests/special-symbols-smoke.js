import assert from "node:assert/strict";
import { addSpecialAt } from "../src/domain/actions.js";
import { createBlankEvent } from "../src/domain/event-model.js";
import { parsePpen, serializeNativePpen, serializeOcp } from "../src/domain/ppen-parser.js";
import { drawPointSpecialSymbol } from "../src/ui/course-symbols.js";

const SPECIAL_KINDS = [
  "first-aid",
  "water",
  "optional-crossing-point",
  "forbidden-route",
  "registration-mark"
];

const model = createBlankEvent();
const expectedLocations = SPECIAL_KINDS.map((_, index) => ({
  x: 100 + index * 17,
  y: -200 - index * 23
}));

for (const [index, kind] of SPECIAL_KINDS.entries()) {
  const selection = addSpecialAt(model, kind, expectedLocations[index]);
  assert.deepEqual(selection, { type: "special", id: index + 1 });

  const special = model.specials[index];
  assert.equal(special.kind, kind);
  assert.deepEqual(special.locations, [expectedLocations[index]], `${kind} must be created as a point special`);
  assert.equal(special.allCourses, true);
}

const ocpXml = serializeOcp(model);
const nativePpenXml = serializeNativePpen(model);
for (const xml of [ocpXml, nativePpenXml]) {
  for (const kind of SPECIAL_KINDS) {
    assert.match(xml, new RegExp(`<special-object id="\\d+" kind="${kind}"`));
  }
  assert.match(xml, /kind="optional-crossing-point" orientation="0"/);
}

for (const kind of SPECIAL_KINDS) {
  const drawing = recordingCanvasContext();
  assert.equal(
    drawPointSpecialSymbol(drawing.context, { kind, orientation: 0, stretch: 0 }, { x: 80, y: 60 }, {
      appearance: {},
      color: "#a626ff",
      mapStandard: "2017",
      unit: 5
    }),
    true,
    `${kind} must use its standard point-special renderer`
  );
  assert.ok(drawing.operations.length > 0, `${kind} renderer must draw onto the canvas`);
  if (kind === "water") {
    assert.equal(
      drawing.operations.filter(([operation]) => operation === "ellipse").length,
      2,
      "water symbol must draw both the complete cup rim and the curved base"
    );
  }
}

installDomParserForNode();
const parsed = parsePpen(ocpXml, "special-symbols.ocp");

assert.equal(parsed.sourceName, "special-symbols.ocp");
assert.deepEqual(
  parsed.specials.map(special => ({
    id: special.id,
    kind: special.kind,
    locations: special.locations,
    allCourses: special.allCourses,
    courses: special.courses
  })),
  SPECIAL_KINDS.map((kind, index) => ({
    id: index + 1,
    kind,
    locations: [expectedLocations[index]],
    allCourses: true,
    courses: []
  }))
);
assert.equal(parsed.specials.find(special => special.kind === "optional-crossing-point")?.orientation, 0);

console.log("special symbols smoke test passed");

function recordingCanvasContext() {
  const operations = [];
  const context = new Proxy({}, {
    get(target, property) {
      if (!(property in target)) {
        target[property] = (...args) => operations.push([String(property), ...args]);
      }
      return target[property];
    },
    set(target, property, value) {
      target[property] = value;
      return true;
    }
  });
  return { context, operations };
}

function installDomParserForNode() {
  if (typeof globalThis.DOMParser !== "undefined") return;

  class XmlElement {
    constructor(nodeName, attributes = {}) {
      this.nodeName = nodeName;
      this.attributes = attributes;
      this.children = [];
      this.textParts = [];
    }

    getAttribute(name) {
      return Object.prototype.hasOwnProperty.call(this.attributes, name) ? this.attributes[name] : null;
    }

    get textContent() {
      return `${this.textParts.join("")}${this.children.map(child => child.textContent).join("")}`;
    }
  }

  class XmlDocument {
    constructor(documentElement, parserError = null) {
      this.documentElement = documentElement;
      this.parserError = parserError;
    }

    querySelector(name) {
      if (name === "parsererror") return this.parserError;
      return findElement(this.documentElement, name);
    }
  }

  globalThis.DOMParser = class {
    parseFromString(source) {
      const stack = [];
      let root = null;

      for (const token of String(source).match(/<!--[\s\S]*?-->|<\?[\s\S]*?\?>|<![^>]*>|<\/[^>]+>|<[^>]+>|[^<]+/g) || []) {
        if (token.startsWith("<!--") || token.startsWith("<?") || token.startsWith("<!")) continue;

        if (token.startsWith("</")) {
          const expectedName = token.slice(2, -1).trim();
          const closed = stack.pop();
          if (!closed || closed.nodeName !== expectedName) return parserErrorDocument(XmlElement, XmlDocument);
          continue;
        }

        if (token.startsWith("<")) {
          const selfClosing = /\/\s*>$/.test(token);
          const content = token.slice(1, selfClosing ? token.lastIndexOf("/") : -1).trim();
          const nameMatch = content.match(/^([^\s/>]+)/);
          if (!nameMatch) return parserErrorDocument(XmlElement, XmlDocument);

          const element = new XmlElement(nameMatch[1], parseAttributes(content));
          if (stack.length) stack.at(-1).children.push(element);
          else if (!root) root = element;
          else return parserErrorDocument(XmlElement, XmlDocument);
          if (!selfClosing) stack.push(element);
          continue;
        }

        if (stack.length) stack.at(-1).textParts.push(decodeXml(token));
      }

      return root && stack.length === 0
        ? new XmlDocument(root)
        : parserErrorDocument(XmlElement, XmlDocument);
    }
  };
}

function parseAttributes(content) {
  const attributes = {};
  const expression = /([^\s=/>]+)\s*=\s*"([^"]*)"/g;
  for (const match of content.matchAll(expression)) attributes[match[1]] = decodeXml(match[2]);
  return attributes;
}

function decodeXml(value) {
  return value
    .replace(/&#x([0-9a-f]+);/gi, (_, digits) => String.fromCodePoint(Number.parseInt(digits, 16)))
    .replace(/&#(\d+);/g, (_, digits) => String.fromCodePoint(Number.parseInt(digits, 10)))
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}

function findElement(element, name) {
  if (!element) return null;
  if (element.nodeName === name) return element;
  for (const child of element.children) {
    const found = findElement(child, name);
    if (found) return found;
  }
  return null;
}

function parserErrorDocument(XmlElement, XmlDocument) {
  const error = new XmlElement("parsererror");
  error.textParts.push("Invalid XML");
  return new XmlDocument(null, error);
}
