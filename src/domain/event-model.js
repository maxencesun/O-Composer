const DEFAULT_PRINT_AREA = Object.freeze({
  automatic: true,
  restrictToPageSize: true,
  left: -100,
  top: 100,
  right: 100,
  bottom: -100,
  pageWidth: 850,
  pageHeight: 1100,
  pageMargins: 11.811,
  pageLandscape: false
});

export const CONTROL_KINDS = [
  "start",
  "normal",
  "finish",
  "crossing-point",
  "map-issue",
  "map-exchange"
];

export const SPECIAL_KINDS = [
  "first-aid",
  "water",
  "optional-crossing-point",
  "forbidden-route",
  "registration-mark",
  "boundary",
  "out-of-bounds",
  "dangerous-area",
  "temporary-construction",
  "white-out",
  "text",
  "descriptions",
  "image",
  "line",
  "rectangle",
  "ellipse"
];

export function cloneEvent(event) {
  return structuredClone(event);
}

export function createBlankEvent() {
  return {
    sourceName: "Untitled.ppen",
    dirty: false,
    event: {
      id: 1,
      title: "Untitled Event",
      notes: "",
      map: {
        kind: "none",
        scale: 15000,
        dpi: 0,
        fileName: "",
        absolutePath: "",
        ignoreMissingFonts: false
      },
      standards: {
        map: "2017",
        description: "2024"
      },
      allControls: {
        printScale: 15000,
        descriptionKind: "symbols"
      },
      printArea: { ...DEFAULT_PRINT_AREA },
      numbering: {
        start: 31,
        disallowInvertible: true
      },
      punchCard: {
        rows: 3,
        columns: 8,
        leftToRight: true,
        topToBottom: false
      },
      courseAppearance: {
        scaleSizes: "None",
        scaleSizesCircleGaps: true,
        autoLegGapSize: 3.5,
        blendPurple: true,
        blendStyle: "blend",
        numberFont: "Roboto",
        numberBold: false,
        numberOutlineWidth: 0,
        controlCircleSizeRatio: 1,
        lineWidthRatio: 1,
        numberSizeRatio: 1,
        centerDotDiameter: 0,
        purple: null,
        descriptionsPurple: false,
        useOcadOverprint: false,
        mapStandard: "2017"
      },
      descriptions: {
        lang: "en",
        color: "black"
      },
      ocad: {
        overprintColors: false
      },
      customSymbolText: [],
      liveloxImportableEventId: ""
    },
    controls: [],
    courses: [],
    courseControls: [],
    legs: [],
    specials: [],
    metadata: {
      unsupported: []
    }
  };
}

export function createControl(id, kind = "normal", location = { x: 0, y: 0 }, code = "") {
  const normal = kind === "normal";
  return {
    id,
    kind,
    code: normal ? code : "",
    location: { x: Number(location.x) || 0, y: Number(location.y) || 0 },
    orientation: 0,
    stretch: 0,
    mapIssueLocation: kind === "map-issue" ? "beginning" : "",
    descriptions: [],
    descriptionText: "",
    descTextBefore: "",
    descTextAfter: "",
    punchPattern: null,
    gaps: [],
    circleGaps: [],
    allControlsCodeAngle: null
  };
}

export function createCourse(id, name = `Course ${id}`, kind = "normal", order = id) {
  return {
    id,
    kind,
    order,
    name,
    secondaryTitle: "",
    hideVariationsOnMap: false,
    labelKind: kind === "score" ? "code-and-score" : "sequence",
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
      scoreColumn: kind === "score" ? 7 : -1,
      scoreFinishControl: null,
      hideFromReports: false
    },
    partOptions: [],
    relay: {
      firstTeam: 1,
      teams: 0,
      legs: 1,
      branches: [],
      teamPrefix: "",
      teamDigits: 0,
      legNames: []
    }
  };
}

export function createCourseControl(id, controlId, nextCourseControl = null) {
  return {
    id,
    control: controlId,
    nextCourseControl,
    variation: "",
    variationEnd: null,
    variationCourseControls: [],
    mapExchange: false,
    mapFlip: false,
    points: 0,
    teamRole: "mandatory",
    numberLocation: null,
    descTextBefore: "",
    descTextAfter: ""
  };
}

export function createSpecial(id, kind, point) {
  const p = { x: point.x, y: point.y };
  const box = [
    { x: p.x - 10, y: p.y + 6 },
    { x: p.x + 40, y: p.y - 16 }
  ];

  let locations = [p];
  if (kind === "descriptions") {
    locations = [
      { x: p.x, y: p.y },
      { x: p.x + 6, y: p.y }
    ];
  }
  else if (["text", "image", "rectangle", "ellipse"].includes(kind)) {
    locations = box;
  }
  else if (["boundary", "line"].includes(kind)) {
    locations = [
      { x: p.x - 20, y: p.y },
      { x: p.x + 20, y: p.y }
    ];
  }
  else if (["out-of-bounds", "dangerous-area", "temporary-construction", "white-out"].includes(kind)) {
    locations = [
      { x: p.x - 20, y: p.y - 15 },
      { x: p.x + 20, y: p.y - 15 },
      { x: p.x + 20, y: p.y + 15 },
      { x: p.x - 20, y: p.y + 15 }
    ];
  }

  return {
    id,
    kind,
    locations,
    orientation: 0,
    stretch: 0,
    allCourses: true,
    courses: [],
    color: "upper-purple",
    lineKind: "single",
    lineWidth: 0.5,
    gapSize: 2,
    dashSize: 4,
    cornerRadius: 0,
    text: kind === "text" ? "Text" : "",
    font: {
      name: "Arial",
      bold: false,
      italic: false,
      height: -1
    },
    numColumns: 1,
    cellSize: kind === "descriptions" ? 5.2 : null,
    descriptionKind: "symbols",
    imageData: null
  };
}

export function nextId(items) {
  return items.reduce((max, item) => Math.max(max, Number(item.id) || 0), 0) + 1;
}

export function findById(items, id) {
  const numeric = Number(id);
  return items.find(item => Number(item.id) === numeric) || null;
}

export function normalizeBool(value, fallback = false) {
  if (value === undefined || value === null || value === "") {
    return fallback;
  }
  return String(value).toLowerCase() === "true";
}

export function normalizeNumber(value, fallback = 0) {
  if (value === undefined || value === null || value === "") {
    return fallback;
  }
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

export function defaultPrintArea() {
  return { ...DEFAULT_PRINT_AREA };
}
