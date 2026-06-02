import {
  createBlankEvent,
  defaultPrintArea,
  normalizeBool,
  normalizeNumber
} from "./event-model.js";

const BOX_ORDER = ["C", "D", "E", "F", "G", "H"];

export function parsePpen(text, sourceName = "Untitled.ppen") {
  const parser = new DOMParser();
  const doc = parser.parseFromString(text, "application/xml");
  const parserError = doc.querySelector("parsererror");
  if (parserError) {
    throw new Error(parserError.textContent.trim() || "The Purple Pen file is not valid XML.");
  }

  const root = doc.documentElement;
  if (!root || root.nodeName !== "course-scribe-event") {
    throw new Error("This is not a Purple Pen .ppen file.");
  }

  const model = createBlankEvent();
  model.sourceName = sourceName;
  model.dirty = false;
  model.controls = [];
  model.courses = [];
  model.courseControls = [];
  model.legs = [];
  model.specials = [];
  model.metadata.unsupported = [];

  for (const child of elements(root)) {
    switch (child.nodeName) {
      case "event":
        model.event = parseEvent(child);
        break;
      case "control":
        model.controls.push(parseControl(child));
        break;
      case "course":
        model.courses.push(parseCourse(child));
        break;
      case "course-control":
        model.courseControls.push(parseCourseControl(child));
        break;
      case "leg":
        model.legs.push(parseLeg(child));
        break;
      case "special-object":
        model.specials.push(parseSpecial(child));
        break;
      default:
        model.metadata.unsupported.push(child.nodeName);
        break;
    }
  }

  model.courses.sort((a, b) => (a.order || 0) - (b.order || 0) || a.name.localeCompare(b.name));
  return model;
}

export function serializePpen(model) {
  const lines = ["<course-scribe-event>"];
  writeEvent(lines, model.event, 1);
  for (const control of model.controls) {
    writeControl(lines, control, 1);
  }
  for (const course of model.courses) {
    writeCourse(lines, course, 1);
  }
  for (const courseControl of model.courseControls) {
    writeCourseControl(lines, courseControl, 1);
  }
  for (const leg of model.legs) {
    writeLeg(lines, leg, 1);
  }
  for (const special of model.specials) {
    writeSpecial(lines, special, 1);
  }
  lines.push("</course-scribe-event>");
  return `${lines.join("\n")}\n`;
}

function parseEvent(node) {
  const event = createBlankEvent().event;
  event.id = intAttr(node, "id", 1);

  for (const child of elements(node)) {
    switch (child.nodeName) {
      case "title":
        event.title = text(child);
        break;
      case "notes":
        event.notes = text(child);
        break;
      case "map":
        event.map = {
          kind: attr(child, "kind", "none"),
          scale: numAttr(child, "scale", 15000),
          dpi: numAttr(child, "dpi", 0),
          fileName: text(child),
          absolutePath: attr(child, "absolute-path", ""),
          ignoreMissingFonts: boolAttr(child, "ignore-missing-fonts", false)
        };
        break;
      case "standards":
        event.standards = {
          map: attr(child, "map", "2000"),
          description: normalizeDescriptionStandard(attr(child, "description", "2024"))
        };
        event.courseAppearance.mapStandard = event.standards.map;
        break;
      case "all-controls":
        event.allControls = {
          printScale: numAttr(child, "print-scale", event.map.scale || 15000),
          descriptionKind: attr(child, "description-kind", attr(child, "description", "symbols"))
        };
        break;
      case "print-area":
        event.printArea = parsePrintArea(child);
        break;
      case "numbering":
        event.numbering = {
          start: intAttr(child, "start", 31),
          disallowInvertible: boolAttr(child, "disallow-invertible", true)
        };
        break;
      case "punch-card":
        event.punchCard = {
          rows: intAttr(child, "rows", 3),
          columns: intAttr(child, "columns", 8),
          leftToRight: boolAttr(child, "left-to-right", true),
          topToBottom: boolAttr(child, "top-to-bottom", false)
        };
        break;
      case "course-appearance":
        event.courseAppearance = parseCourseAppearance(child, event.courseAppearance);
        break;
      case "descriptions":
        event.descriptions = {
          lang: attr(child, "lang", "en"),
          color: attr(child, "color", "black")
        };
        event.courseAppearance.descriptionsPurple = event.descriptions.color === "purple";
        break;
      case "ocad":
        event.ocad = {
          overprintColors: boolAttr(child, "overprint-colors", false)
        };
        event.courseAppearance.useOcadOverprint = event.ocad.overprintColors;
        break;
      case "custom-symbol-text":
        event.customSymbolText.push({
          ref: attr(child, "iof-2004-ref", ""),
          showKey: boolAttr(child, "show-key", false),
          text: text(child),
          texts: elements(child).filter(el => el.nodeName === "text").map(parseSymbolText)
        });
        break;
      case "livelox":
        event.liveloxImportableEventId = attr(child, "importable-event-id", "");
        break;
    }
  }

  if (!event.printArea) {
    event.printArea = defaultPrintArea();
  }
  if (!event.allControls.printScale) {
    event.allControls.printScale = event.map.scale || 15000;
  }
  return event;
}

function normalizeDescriptionStandard(value) {
  const standard = String(value || "").trim();
  if (!standard || standard === "2018") return "2024";
  return standard;
}

function parseCourseAppearance(node, previous) {
  const blendPurple = attr(node, "blend-purple", previous.blendPurple ? "true" : "false");
  const appearance = {
    ...previous,
    controlCircleSizeRatio: numAttr(node, "control-circle-size-ratio", 1),
    lineWidthRatio: numAttr(node, "line-width-ratio", 1),
    centerDotDiameter: numAttr(node, "center-dot-diameter", 0),
    numberSizeRatio: numAttr(node, "number-size-ratio", 1),
    scaleSizes: attr(node, "scale-sizes", "None"),
    scaleSizesCircleGaps: boolAttr(node, "scale-sizes-circle-gaps", false),
    numberBold: boolAttr(node, "number-bold", false),
    numberFont: attr(node, "number-font", "Roboto"),
    numberOutlineWidth: numAttr(node, "number-outline-width", 0),
    autoLegGapSize: numAttr(node, "auto-leg-gap-size", 3.5),
    blendPurple: blendPurple === "true",
    blendStyle: attr(node, "blend-style", "blend"),
    lowerPurpleLayer: intAttr(node, "lower-purple-layer", 0)
  };

  const cyan = attr(node, "purple-cyan", "");
  if (cyan !== "") {
    appearance.purple = {
      cyan: normalizeNumber(cyan, 1),
      magenta: numAttr(node, "purple-magenta", 1),
      yellow: numAttr(node, "purple-yellow", 1),
      black: numAttr(node, "purple-black", 1)
    };
  }
  return appearance;
}

function parseControl(node) {
  const control = {
    id: intAttr(node, "id", 0),
    kind: attr(node, "kind", "normal"),
    code: "",
    location: { x: 0, y: 0 },
    orientation: numAttr(node, "orientation", 0),
    stretch: numAttr(node, "stretch", 0),
    mapIssueLocation: attr(node, "map-issue-location", ""),
    descriptions: [],
    descriptionText: "",
    descTextBefore: "",
    descTextAfter: "",
    punchPattern: null,
    gaps: [],
    circleGaps: [],
    allControlsCodeAngle: attr(node, "all-controls-code-angle", "") === "" ? null : numAttr(node, "all-controls-code-angle", 0)
  };

  for (const child of elements(node)) {
    switch (child.nodeName) {
      case "code":
        control.code = text(child);
        break;
      case "location":
        control.location = pointFromNode(child);
        break;
      case "description":
        control.descriptions.push({
          box: attr(child, "box", ""),
          ref: attr(child, "iof-2004-ref", ""),
          text: text(child)
        });
        break;
      case "description-text":
        control.descriptionText = text(child);
        break;
      case "description-text-line":
        if (attr(child, "location", "") === "before") {
          control.descTextBefore = text(child);
        }
        else {
          control.descTextAfter = text(child);
        }
        break;
      case "punch-pattern":
        control.punchPattern = {
          size: intAttr(child, "size", 7),
          rows: text(child).split(/\r?\n/).map(row => row.trim()).filter(Boolean)
        };
        break;
      case "gaps":
        control.gaps.push({ scale: intAttr(child, "scale", 0), value: text(child).trim() });
        break;
      case "circle-gaps":
        control.circleGaps.push({ scale: intAttr(child, "scale", 0), value: text(child).trim() });
        break;
    }
  }
  return control;
}

function parseCourse(node) {
  const kind = attr(node, "kind", "normal");
  const course = {
    id: intAttr(node, "id", 0),
    kind,
    order: intAttr(node, "order", 0),
    name: "",
    secondaryTitle: "",
    hideVariationsOnMap: false,
    labelKind: kind === "score" ? "code" : "sequence",
    firstCourseControl: null,
    firstControlOrdinal: 1,
    printArea: null,
    partPrintAreas: [],
    options: {
      printScale: 15000,
      climb: -1,
      load: -1,
      courseLength: null,
      descriptionKind: "symbols",
      scoreColumn: kind === "score" ? 0 : -1,
      hideFromReports: false
    },
    partOptions: [],
    relay: {
      firstTeam: 1,
      teams: 0,
      legs: 1,
      branches: []
    }
  };

  for (const child of elements(node)) {
    switch (child.nodeName) {
      case "name":
        course.name = text(child);
        course.hideVariationsOnMap = boolAttr(child, "hide-variations-on-map", false);
        break;
      case "secondary-title":
        course.secondaryTitle = text(child);
        break;
      case "first":
        course.firstCourseControl = intAttr(child, "course-control", null);
        course.firstControlOrdinal = intAttr(child, "control-number", 1);
        break;
      case "labels":
        course.labelKind = attr(child, "label-kind", course.labelKind);
        break;
      case "print-area": {
        const part = intAttr(child, "part", -1);
        if (part >= 0) {
          course.partPrintAreas.push({ part, area: parsePrintArea(child) });
        }
        else {
          course.printArea = parsePrintArea(child);
        }
        break;
      }
      case "options":
        course.options = {
          printScale: numAttr(child, "print-scale", 15000),
          climb: numAttr(child, "climb", -1),
          load: intAttr(child, "load", -1),
          courseLength: attr(child, "course-length", "") === "" ? null : numAttr(child, "course-length", null),
          descriptionKind: attr(child, "description-kind", attr(child, "description", "symbols")),
          scoreColumn: scoreColumnFromNode(child, kind),
          hideFromReports: boolAttr(child, "hide-from-reports", false)
        };
        break;
      case "part-options":
        course.partOptions.push({
          part: intAttr(child, "part", -1),
          showFinish: boolAttr(child, "show-finish", false)
        });
        break;
      case "relay":
        course.relay.firstTeam = intAttr(child, "first-team", 1);
        course.relay.teams = intAttr(child, "teams", 0);
        course.relay.legs = intAttr(child, "legs", 1);
        break;
      case "relay-branch":
        course.relay.branches.push({
          branch: attr(child, "branch", ""),
          leg: intAttr(child, "leg", 1)
        });
        break;
    }
  }

  if (!course.order) {
    course.order = course.id;
  }
  return course;
}

function parseCourseControl(node) {
  const variation = attr(node, "variation", "");
  const courseControl = {
    id: intAttr(node, "id", 0),
    control: intAttr(node, "control", 0),
    nextCourseControl: null,
    variation,
    variationEnd: variation ? intAttr(node, "variation-end", null) : null,
    variationCourseControls: [],
    mapExchange: boolAttr(node, "map-exchange", false),
    mapFlip: boolAttr(node, "map-flip", false),
    points: intAttr(node, "points", 0),
    numberLocation: null,
    descTextBefore: "",
    descTextAfter: ""
  };

  for (const child of elements(node)) {
    switch (child.nodeName) {
      case "next":
        courseControl.nextCourseControl = intAttr(child, "course-control", null);
        break;
      case "variation":
        courseControl.variationCourseControls.push(intAttr(child, "course-control", 0));
        break;
      case "number-location":
        courseControl.numberLocation = pointFromNode(child);
        break;
      case "description-text-line":
        if (attr(child, "location", "") === "before") {
          courseControl.descTextBefore = text(child);
        }
        else {
          courseControl.descTextAfter = text(child);
        }
        break;
    }
  }
  return courseControl;
}

function parseLeg(node) {
  const leg = {
    id: intAttr(node, "id", 0),
    startControl: intAttr(node, "start-control", 0),
    endControl: intAttr(node, "end-control", 0),
    flagging: { kind: "none", point: null },
    bends: [],
    gaps: []
  };

  for (const child of elements(node)) {
    switch (child.nodeName) {
      case "flagging":
        leg.flagging = {
          kind: normalizeFlaggingKind(attr(child, "kind", "none")),
          point: attr(child, "x", "") === "" ? null : pointFromNode(child),
          start: attr(child, "start", "") === "" ? null : numAttr(child, "start", 0),
          end: attr(child, "end", "") === "" ? null : numAttr(child, "end", 0)
        };
        break;
      case "bends":
        leg.bends = elements(child).filter(el => el.nodeName === "location").map(pointFromNode);
        break;
      case "gaps":
        leg.gaps = elements(child).filter(el => el.nodeName === "gap").map(gap => ({
          start: numAttr(gap, "start", 0),
          length: numAttr(gap, "length", 0)
        }));
        break;
    }
  }
  return leg;
}

function parseSpecial(node) {
  const special = {
    id: intAttr(node, "id", 0),
    kind: attr(node, "kind", "text"),
    locations: [],
    orientation: numAttr(node, "orientation", 0),
    stretch: numAttr(node, "stretch", 0),
    allCourses: true,
    courses: [],
    color: "upper-purple",
    lineKind: "single",
    lineWidth: 0,
    gapSize: 0,
    dashSize: 0,
    cornerRadius: 0,
    text: "",
    font: {
      name: "Arial",
      bold: false,
      italic: false,
      height: -1
    },
    numColumns: 1,
    cellSize: null,
    descriptionKind: "symbols",
    imageData: null
  };

  for (const child of elements(node)) {
    switch (child.nodeName) {
      case "text":
        special.text = text(child);
        break;
      case "font":
        special.font = {
          name: attr(child, "name", "Arial"),
          bold: boolAttr(child, "bold", false),
          italic: boolAttr(child, "italic", false),
          height: numAttr(child, "height", -1)
        };
        break;
      case "location":
        special.locations.push(pointFromNode(child));
        break;
      case "appearance":
        special.numColumns = intAttr(child, "columns", special.numColumns);
        special.cellSize = numAttr(child, "cell-size", special.cellSize);
        special.descriptionKind = attr(child, "description-kind", special.descriptionKind);
        special.color = attr(child, "color", special.color);
        special.lineKind = attr(child, "line-kind", special.lineKind);
        special.lineWidth = numAttr(child, "line-width", special.lineWidth);
        special.gapSize = numAttr(child, "gap-size", special.gapSize);
        special.dashSize = numAttr(child, "dash-size", special.dashSize);
        special.cornerRadius = numAttr(child, "corner-radius", special.cornerRadius);
        break;
      case "courses":
        special.allCourses = boolAttr(child, "all", false);
        special.courses = elements(child).filter(el => el.nodeName === "course").map(course => ({
          course: intAttr(course, "course", 0),
          part: intAttr(course, "part", -1)
        }));
        break;
      case "image-data":
        special.imageData = {
          format: attr(child, "format", "png"),
          data: text(child).replace(/\s+/g, "")
        };
        break;
    }
  }
  return special;
}

function parsePrintArea(node) {
  return {
    automatic: boolAttr(node, "automatic", true),
    restrictToPageSize: boolAttr(node, "restrict-to-page-size", true),
    left: numAttr(node, "left", -100),
    top: numAttr(node, "top", 100),
    right: numAttr(node, "right", 100),
    bottom: numAttr(node, "bottom", -100),
    pageWidth: numAttr(node, "page-width", 850),
    pageHeight: numAttr(node, "page-height", 1100),
    pageMargins: numAttr(node, "page-margins", 0),
    pageLandscape: boolAttr(node, "page-landscape", false)
  };
}

function parseSymbolText(node) {
  return {
    lang: attr(node, "lang", "en"),
    plural: boolAttr(node, "plural", false),
    gender: attr(node, "gender", ""),
    caseName: attr(node, "case", ""),
    modifiedCase: attr(node, "modified-case", ""),
    text: text(node)
  };
}

function scoreColumnFromNode(node, kind) {
  if (kind !== "score") {
    return -1;
  }
  const raw = attr(node, "score-column", "");
  if (raw === "") {
    return 0;
  }
  const columns = { A: 0, B: 1, H: 7 };
  return raw in columns ? columns[raw] : normalizeNumber(raw, 0);
}

function writeEvent(lines, event, level) {
  open(lines, level, "event", { id: event.id || 1 });
  node(lines, level + 1, "title", event.title || "");
  if (event.notes) {
    node(lines, level + 1, "notes", event.notes);
  }

  const mapAttrs = {
    kind: event.map.kind,
    scale: event.map.scale
  };
  if (event.map.kind === "bitmap") {
    mapAttrs.dpi = event.map.dpi;
  }
  if (event.map.kind === "OCAD") {
    mapAttrs["ignore-missing-fonts"] = event.map.ignoreMissingFonts;
  }
  if (event.map.absolutePath) {
    mapAttrs["absolute-path"] = event.map.absolutePath;
  }
  node(lines, level + 1, "map", event.map.fileName || "", mapAttrs);

  empty(lines, level + 1, "standards", {
    map: event.standards.map,
    description: event.standards.description
  });
  empty(lines, level + 1, "all-controls", {
    "print-scale": event.allControls.printScale,
    "description-kind": event.allControls.descriptionKind
  });
  writePrintArea(lines, event.printArea, level + 1);
  empty(lines, level + 1, "numbering", {
    start: event.numbering.start,
    "disallow-invertible": event.numbering.disallowInvertible
  });
  empty(lines, level + 1, "punch-card", {
    rows: event.punchCard.rows,
    columns: event.punchCard.columns,
    "left-to-right": event.punchCard.leftToRight,
    "top-to-bottom": event.punchCard.topToBottom
  });

  const appearance = event.courseAppearance;
  const appearanceAttrs = {
    "scale-sizes": appearance.scaleSizes || "None",
    "scale-sizes-circle-gaps": true,
    "auto-leg-gap-size": appearance.autoLegGapSize || 3.5,
    "blend-purple": !!appearance.blendPurple
  };
  if (appearance.controlCircleSizeRatio && appearance.controlCircleSizeRatio !== 1) {
    appearanceAttrs["control-circle-size-ratio"] = appearance.controlCircleSizeRatio;
  }
  if (appearance.lineWidthRatio && appearance.lineWidthRatio !== 1) {
    appearanceAttrs["line-width-ratio"] = appearance.lineWidthRatio;
  }
  if (appearance.centerDotDiameter) {
    appearanceAttrs["center-dot-diameter"] = appearance.centerDotDiameter;
  }
  if (appearance.numberSizeRatio && appearance.numberSizeRatio !== 1) {
    appearanceAttrs["number-size-ratio"] = appearance.numberSizeRatio;
  }
  if (appearance.numberBold) {
    appearanceAttrs["number-bold"] = true;
  }
  if (appearance.numberFont) {
    appearanceAttrs["number-font"] = appearance.numberFont;
  }
  if (appearance.numberOutlineWidth) {
    appearanceAttrs["number-outline-width"] = appearance.numberOutlineWidth;
  }
  if (appearance.blendStyle) {
    appearanceAttrs["blend-style"] = appearance.blendStyle;
  }
  if (appearance.purple) {
    appearanceAttrs["purple-cyan"] = appearance.purple.cyan;
    appearanceAttrs["purple-magenta"] = appearance.purple.magenta;
    appearanceAttrs["purple-yellow"] = appearance.purple.yellow;
    appearanceAttrs["purple-black"] = appearance.purple.black;
  }
  empty(lines, level + 1, "course-appearance", appearanceAttrs);
  empty(lines, level + 1, "descriptions", {
    lang: event.descriptions.lang,
    color: event.courseAppearance.descriptionsPurple ? "purple" : event.descriptions.color || "black"
  });
  empty(lines, level + 1, "ocad", {
    "overprint-colors": !!event.ocad.overprintColors
  });

  for (const custom of event.customSymbolText || []) {
    open(lines, level + 1, "custom-symbol-text", {
      "iof-2004-ref": custom.ref,
      "show-key": !!custom.showKey
    });
    for (const customText of custom.texts || []) {
      node(lines, level + 2, "text", customText.text, {
        lang: customText.lang || "en",
        plural: !!customText.plural,
        gender: customText.gender || undefined,
        case: customText.caseName || undefined,
        "modified-case": customText.modifiedCase || undefined
      });
    }
    close(lines, level + 1, "custom-symbol-text");
  }
  if (event.liveloxImportableEventId) {
    empty(lines, level + 1, "livelox", { "importable-event-id": event.liveloxImportableEventId });
  }
  close(lines, level, "event");
}

function writeControl(lines, control, level) {
  const attrs = { id: control.id, kind: control.kind };
  if (control.kind === "crossing-point") {
    attrs.orientation = control.orientation || 0;
    if (control.stretch) attrs.stretch = control.stretch;
  }
  if (control.kind === "map-issue" && control.mapIssueLocation) {
    attrs["map-issue-location"] = control.mapIssueLocation;
  }
  if (control.allControlsCodeAngle !== null && control.allControlsCodeAngle !== undefined) {
    attrs["all-controls-code-angle"] = control.allControlsCodeAngle;
  }

  open(lines, level, "control", attrs);
  if (control.code) {
    node(lines, level + 1, "code", control.code);
  }
  empty(lines, level + 1, "location", control.location);
  for (const description of control.descriptions || []) {
    node(lines, level + 1, "description", description.text || "", {
      box: description.box,
      "iof-2004-ref": description.ref || undefined
    });
  }
  if (control.punchPattern && control.punchPattern.rows?.length) {
    lines.push(`${indent(level + 1)}<punch-pattern size="${escapeAttr(control.punchPattern.size || control.punchPattern.rows.length)}">`);
    lines.push(...control.punchPattern.rows.map(row => `${indent(level + 2)}${row}`));
    lines.push(`${indent(level + 1)}</punch-pattern>`);
  }
  for (const gap of control.gaps || []) {
    node(lines, level + 1, "gaps", gap.value || "", { scale: gap.scale || 0 });
  }
  for (const gap of control.circleGaps || []) {
    node(lines, level + 1, "circle-gaps", gap.value || "", { scale: gap.scale || 0 });
  }
  if (control.descriptionText) {
    node(lines, level + 1, "description-text", control.descriptionText);
  }
  if (control.descTextBefore) {
    node(lines, level + 1, "description-text-line", control.descTextBefore, { location: "before" });
  }
  if (control.descTextAfter) {
    node(lines, level + 1, "description-text-line", control.descTextAfter, { location: "after" });
  }
  close(lines, level, "control");
}

function writeCourse(lines, course, level) {
  open(lines, level, "course", { id: course.id, kind: course.kind, order: course.order });
  node(lines, level + 1, "name", course.name, {
    "hide-variations-on-map": course.hideVariationsOnMap || undefined
  });
  if (course.secondaryTitle) {
    node(lines, level + 1, "secondary-title", course.secondaryTitle);
  }
  empty(lines, level + 1, "labels", { "label-kind": course.labelKind });
  if (course.firstCourseControl) {
    empty(lines, level + 1, "first", {
      "course-control": course.firstCourseControl,
      "control-number": course.firstControlOrdinal !== 1 ? course.firstControlOrdinal : undefined
    });
  }
  if (course.printArea) {
    writePrintArea(lines, course.printArea, level + 1);
  }
  for (const partArea of course.partPrintAreas || []) {
    writePrintArea(lines, partArea.area, level + 1, partArea.part);
  }
  const options = course.options || {};
  empty(lines, level + 1, "options", {
    "print-scale": options.printScale || 15000,
    climb: options.climb >= 0 ? options.climb : undefined,
    load: options.load >= 0 ? options.load : undefined,
    "course-length": options.courseLength || undefined,
    "hide-from-reports": !!options.hideFromReports,
    "score-column": course.kind === "score" ? options.scoreColumn ?? 0 : undefined,
    "description-kind": options.descriptionKind || "symbols"
  });
  if ((course.relay?.teams || 0) > 0 || (course.relay?.legs || 1) > 1) {
    empty(lines, level + 1, "relay", {
      "first-team": course.relay.firstTeam || 1,
      teams: course.relay.teams || 0,
      legs: course.relay.legs || 1
    });
  }
  for (const branch of course.relay?.branches || []) {
    empty(lines, level + 1, "relay-branch", { branch: branch.branch, leg: branch.leg });
  }
  for (const part of course.partOptions || []) {
    empty(lines, level + 1, "part-options", { part: part.part, "show-finish": !!part.showFinish });
  }
  close(lines, level, "course");
}

function writeCourseControl(lines, courseControl, level) {
  const attrs = {
    id: courseControl.id,
    control: courseControl.control
  };
  if (courseControl.variation) {
    attrs.variation = courseControl.variation;
    attrs["variation-end"] = courseControl.variationEnd;
  }
  if (courseControl.mapExchange) attrs["map-exchange"] = true;
  if (courseControl.mapFlip) attrs["map-flip"] = true;
  if (courseControl.points) attrs.points = courseControl.points;

  open(lines, level, "course-control", attrs);
  if (courseControl.nextCourseControl) {
    empty(lines, level + 1, "next", { "course-control": courseControl.nextCourseControl });
  }
  for (const id of courseControl.variationCourseControls || []) {
    empty(lines, level + 1, "variation", { "course-control": id });
  }
  if (courseControl.numberLocation) {
    empty(lines, level + 1, "number-location", courseControl.numberLocation);
  }
  if (courseControl.descTextBefore) {
    node(lines, level + 1, "description-text-line", courseControl.descTextBefore, { location: "before" });
  }
  if (courseControl.descTextAfter) {
    node(lines, level + 1, "description-text-line", courseControl.descTextAfter, { location: "after" });
  }
  close(lines, level, "course-control");
}

function writeLeg(lines, leg, level) {
  open(lines, level, "leg", {
    id: leg.id,
    "start-control": leg.startControl,
    "end-control": leg.endControl
  });
  if (leg.flagging?.kind && leg.flagging.kind !== "none") {
    empty(lines, level + 1, "flagging", {
      kind: serializeFlaggingKind(leg.flagging.kind),
      x: leg.flagging.point?.x,
      y: leg.flagging.point?.y,
      start: leg.flagging.kind === "middle" ? leg.flagging.start : undefined,
      end: leg.flagging.kind === "middle" ? leg.flagging.end : undefined
    });
  }
  if (leg.bends?.length) {
    open(lines, level + 1, "bends");
    for (const bend of leg.bends) {
      empty(lines, level + 2, "location", bend);
    }
    close(lines, level + 1, "bends");
  }
  if (leg.gaps?.length) {
    open(lines, level + 1, "gaps");
    for (const gap of leg.gaps) {
      empty(lines, level + 2, "gap", { start: gap.start, length: gap.length });
    }
    close(lines, level + 1, "gaps");
  }
  close(lines, level, "leg");
}

function writeSpecial(lines, special, level) {
  const attrs = { id: special.id, kind: special.kind };
  if (special.kind === "optional-crossing-point") {
    attrs.orientation = special.orientation || 0;
    if (special.stretch) attrs.stretch = special.stretch;
  }
  open(lines, level, "special-object", attrs);
  if (special.text) {
    node(lines, level + 1, "text", special.text);
  }
  if (special.imageData?.data) {
    node(lines, level + 1, "image-data", special.imageData.data, { format: special.imageData.format || "png" });
  }
  if (special.kind === "text") {
    empty(lines, level + 1, "font", {
      name: special.font?.name || "Arial",
      bold: !!special.font?.bold,
      italic: !!special.font?.italic,
      height: special.font?.height > 0 ? special.font.height : undefined
    });
  }
  if (needsAppearance(special)) {
    empty(lines, level + 1, "appearance", {
      columns: special.kind === "descriptions" && special.numColumns > 1 ? special.numColumns : undefined,
      "cell-size": special.kind === "descriptions" && special.cellSize > 0 ? special.cellSize : undefined,
      "description-kind": special.kind === "descriptions" && special.descriptionKind ? special.descriptionKind : undefined,
      color: ["text", "line", "rectangle", "ellipse", "descriptions"].includes(special.kind) ? special.color : undefined,
      "line-kind": ["line", "rectangle", "ellipse"].includes(special.kind) ? special.lineKind : undefined,
      "line-width": ["line", "rectangle", "ellipse"].includes(special.kind) ? special.lineWidth : undefined,
      "gap-size": ["line", "rectangle", "ellipse"].includes(special.kind) && special.lineKind !== "single" ? special.gapSize : undefined,
      "dash-size": ["line", "rectangle", "ellipse"].includes(special.kind) && special.lineKind === "dashed" ? special.dashSize : undefined,
      "corner-radius": special.kind === "rectangle" ? special.cornerRadius : undefined
    });
  }
  for (const location of special.locations || []) {
    empty(lines, level + 1, "location", location);
  }
  open(lines, level + 1, "courses", special.allCourses ? { all: true } : {});
  if (!special.allCourses) {
    for (const course of special.courses || []) {
      empty(lines, level + 2, "course", {
        course: course.course,
        part: course.part >= 0 ? course.part : undefined
      });
    }
  }
  close(lines, level + 1, "courses");
  close(lines, level, "special-object");
}

function needsAppearance(special) {
  return special.kind === "descriptions" ||
    ["text", "line", "rectangle", "ellipse"].includes(special.kind);
}

function writePrintArea(lines, area = defaultPrintArea(), level, part = undefined) {
  empty(lines, level, "print-area", {
    part,
    automatic: !!area.automatic,
    "restrict-to-page-size": !!area.restrictToPageSize,
    left: area.left,
    top: area.top,
    right: area.right,
    bottom: area.bottom,
    "page-width": area.pageWidth,
    "page-height": area.pageHeight,
    "page-margins": area.pageMargins,
    "page-landscape": !!area.pageLandscape
  });
}

function elements(node) {
  return Array.from(node.children || []);
}

function pointFromNode(node) {
  return {
    x: numAttr(node, "x", 0),
    y: numAttr(node, "y", 0)
  };
}

function attr(node, name, fallback = "") {
  const value = node.getAttribute(name);
  return value === null || value === "" ? fallback : value;
}

function numAttr(node, name, fallback = 0) {
  return normalizeNumber(node.getAttribute(name), fallback);
}

function intAttr(node, name, fallback = 0) {
  const value = node.getAttribute(name);
  if (value === null || value === "") {
    return fallback;
  }
  const number = Number.parseInt(value, 10);
  return Number.isFinite(number) ? number : fallback;
}

function boolAttr(node, name, fallback = false) {
  return normalizeBool(node.getAttribute(name), fallback);
}

function normalizeFlaggingKind(kind) {
  return {
    "beginning-part": "begin",
    "end-part": "end",
    "middle-part": "middle"
  }[kind] || kind || "none";
}

function serializeFlaggingKind(kind) {
  return {
    begin: "beginning-part",
    end: "end-part",
    middle: "middle-part"
  }[kind] || kind || "none";
}

function text(node) {
  return node.textContent || "";
}

function indent(level) {
  return "  ".repeat(level);
}

function open(lines, level, name, attrs = {}) {
  lines.push(`${indent(level)}<${name}${attrsToString(attrs)}>`);
}

function close(lines, level, name) {
  lines.push(`${indent(level)}</${name}>`);
}

function empty(lines, level, name, attrs = {}) {
  lines.push(`${indent(level)}<${name}${attrsToString(attrs)} />`);
}

function node(lines, level, name, value = "", attrs = {}) {
  const safeValue = escapeText(value);
  lines.push(`${indent(level)}<${name}${attrsToString(attrs)}>${safeValue}</${name}>`);
}

function attrsToString(attrs) {
  return Object.entries(attrs)
    .filter(([, value]) => value !== undefined && value !== null && value !== "")
    .map(([name, value]) => ` ${name}="${escapeAttr(formatValue(value))}"`)
    .join("");
}

function formatValue(value) {
  if (typeof value === "boolean") {
    return value ? "true" : "false";
  }
  if (typeof value === "number") {
    return Number.isInteger(value) ? String(value) : String(Number(value.toFixed(7)));
  }
  return String(value);
}

function escapeText(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function escapeAttr(value) {
  return escapeText(value).replace(/"/g, "&quot;");
}
