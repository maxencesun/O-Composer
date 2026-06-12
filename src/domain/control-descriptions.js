import { courseLength, courseView, findLeg, getCourse, legLength, legPath, naturalCode, isTeamFreeCourseControl } from "./course-service.js";

export const DESCRIPTION_KINDS = Object.freeze(["symbols", "text", "symbols-and-text"]);
export const ISCD_COLUMNS = Object.freeze([
  ["C", "Which one"],
  ["D", "Control feature"],
  ["E", "Appearance"],
  ["F", "Dimension / combination"],
  ["G", "Location of flag"],
  ["H", "Other information"]
]);

const COLUMN_F_TEXT_SYMBOL_EXAMPLES = Object.freeze({
  "9.1high": "3.0",
  "9.1deep": "3.0",
  "9.2": "3x4",
  "9.3high": "3/2",
  "9.3deep": "3/2",
  "9.4": "1|2"
});

const COLUMN_F_VISUAL_ALIASES = Object.freeze({
  "10.1single": "10.1",
  "10.2single": "10.2"
});

export const ISCD_SYMBOLS = Object.freeze({
  C: [["", "Not specified"], ["north", "Northern"], ["north-east", "North-eastern"], ["east", "Eastern"], ["south-east", "South-eastern"], ["south", "Southern"], ["south-west", "South-western"], ["west", "Western"], ["north-west", "North-western"], ["upper", "Upper"], ["lower", "Lower"], ["middle", "Middle"]],
  D: [["", "Not specified"], ["terrace", "Terrace"], ["spur", "Spur"], ["reentrant", "Re-entrant"], ["earth-bank", "Earth bank"], ["earth-wall", "Earth wall"], ["erosion-gully", "Erosion gully"], ["knoll", "Small knoll"], ["depression", "Depression"], ["pit", "Pit"], ["cliff", "Cliff"], ["rock-pillar", "Rock pillar"], ["cave", "Cave"], ["boulder", "Boulder"], ["boulder-cluster", "Boulder cluster"], ["stony-ground", "Stony ground"], ["lake", "Lake"], ["pond", "Pond"], ["waterhole", "Waterhole"], ["river", "River"], ["stream", "Stream"], ["ditch", "Ditch"], ["marsh", "Marsh"], ["narrow-marsh", "Narrow marsh"], ["well", "Well"], ["spring", "Spring"], ["open-land", "Open land"], ["forest-corner", "Forest corner"], ["clearing", "Clearing"], ["thicket", "Thicket"], ["hedge", "Hedge"], ["vegetation-boundary", "Vegetation boundary"], ["copse", "Copse"], ["prominent-tree", "Prominent tree"], ["rootstock", "Rootstock"], ["road", "Road"], ["track", "Track"], ["path", "Path"], ["ride", "Ride"], ["bridge", "Bridge"], ["power-line", "Power line"], ["pylon", "Pylon"], ["tunnel", "Tunnel"], ["wall", "Wall"], ["fence", "Fence"], ["crossing-point", "Crossing point"], ["building", "Building"], ["paved-area", "Paved area"], ["ruin", "Ruin"], ["pipeline", "Pipeline"], ["tower", "Tower"], ["cairn", "Cairn"], ["monument", "Monument"], ["railway", "Railway / tramway"]],
  E: [["", "Not specified"], ["low", "Low"], ["shallow", "Shallow"], ["deep", "Deep"], ["overgrown", "Overgrown"], ["open", "Open"], ["rocky", "Rocky"], ["marshy", "Marshy"], ["sandy", "Sandy"], ["ruined", "Ruined"]],
  F: [["", "Not specified"], ["height", "Height"], ["length", "Length"], ["width", "Width"], ["height-width", "Height and width"], ["junction", "Junction"], ["crossing", "Crossing"], ["bend", "Bend"], ["fork", "Fork"], ["between", "Between"]],
  G: [["", "Not specified"], ["north-side", "North side"], ["north-east-side", "North-east side"], ["east-side", "East side"], ["south-east-side", "South-east side"], ["south-side", "South side"], ["south-west-side", "South-west side"], ["west-side", "West side"], ["north-west-side", "North-west side"], ["top", "Top"], ["foot", "Foot"], ["beneath", "Beneath"], ["edge", "Edge"], ["end", "End"], ["inside-corner", "Inside corner"], ["outside-corner", "Outside corner"], ["between", "Between"]],
  H: [["", "Not specified"], ["taped-route", "Taped route"], ["marked-route", "Marked route"], ["mandatory-crossing", "Mandatory crossing"], ["refreshment", "Refreshment"], ["radio", "Radio control"], ["first-aid", "First aid"], ["map-exchange", "Map exchange"], ["map-flip", "Map flip"]]
});

const DEFAULT_CELL_SIZE = 5.2;
const MIN_CELL_SIZE = 1.2;
const COLUMN_GAP_CELLS = 0.6;
const MARGIN_CELLS = 0.05;
const DESCRIPTION_STANDARD = "2024";
const DESCRIPTION_COLORS = Object.freeze({
  black: "#000",
  purple: "rgba(166, 38, 255, 0.82)",
  "upper-purple": "rgba(166, 38, 255, 0.82)",
  "lower-purple": "rgba(166, 38, 255, 0.46)"
});
const FALLBACK_DESCRIPTION_LANGUAGES = Object.freeze([["en", "English"]]);
const DESCRIPTION_LANGUAGE_LABELS = Object.freeze({
  en: "English",
  zh: "中文",
  "zh-CN": "简体中文",
  "zh-TW": "繁體中文",
  de: "Deutsch",
  fr: "Français",
  es: "Español",
  ja: "日本語",
  sv: "Svenska",
  fi: "Suomi",
  no: "Norsk",
  nl: "Nederlands",
  it: "Italiano",
  ca: "Català",
  sl: "Slovenščina"
});
const APP_DESCRIPTION_LANGUAGES = Object.freeze([
  ["en", "English"],
  ["zh", "中文"]
]);
const FALLBACK_ISCD_LABEL_TRANSLATIONS = Object.freeze({
  zh: Object.freeze({
    "Not specified": "未指定",
    "Northern": "北部",
    "North-eastern": "东北部",
    "Eastern": "东部",
    "South-eastern": "东南部",
    "Southern": "南部",
    "South-western": "西南部",
    "Western": "西部",
    "North-western": "西北部",
    "Upper": "上部",
    "Lower": "下部",
    "Middle": "中部",
    "Terrace": "台地",
    "Spur": "山鼻",
    "Re-entrant": "山谷",
    "Earth bank": "土坎",
    "Earth wall": "土墙",
    "Erosion gully": "冲沟",
    "Small knoll": "小土丘",
    "Depression": "凹地",
    "Pit": "坑",
    "Cliff": "崖",
    "Rock pillar": "石柱",
    "Cave": "洞穴",
    "Boulder": "巨石",
    "Boulder cluster": "巨石群",
    "Stony ground": "石块地",
    "Lake": "湖",
    "Pond": "池塘",
    "Waterhole": "水坑",
    "River": "河流",
    "Stream": "溪流",
    "Ditch": "沟渠",
    "Marsh": "沼泽",
    "Narrow marsh": "窄沼泽",
    "Well": "井",
    "Spring": "泉",
    "Open land": "开阔地",
    "Forest corner": "森林角",
    "Clearing": "林间空地",
    "Thicket": "密林",
    "Hedge": "树篱",
    "Vegetation boundary": "植被边界",
    "Copse": "小树林",
    "Prominent tree": "突出树",
    "Rootstock": "树根",
    "Road": "道路",
    "Track": "大路",
    "Path": "小径",
    "Ride": "林道",
    "Bridge": "桥",
    "Power line": "电力线",
    "Pylon": "电塔",
    "Tunnel": "隧道",
    "Wall": "墙",
    "Fence": "围栏",
    "Crossing point": "通过点",
    "Building": "建筑物",
    "Paved area": "铺装地",
    "Ruin": "废墟",
    "Pipeline": "管线",
    "Tower": "塔",
    "Cairn": "石堆",
    "Monument": "纪念物",
    "Railway / tramway": "铁路 / 有轨电车",
    "Low": "低",
    "Shallow": "浅",
    "Deep": "深",
    "Overgrown": "覆盖",
    "Open": "开阔",
    "Rocky": "多石",
    "Marshy": "沼泽",
    "Sandy": "沙质",
    "Ruined": "毁坏",
    "Height": "高度",
    "Length": "长度",
    "Width": "宽度",
    "Height and width": "高度和宽度",
    "Junction": "交汇",
    "Crossing": "交叉",
    "Bend": "弯曲",
    "Fork": "分叉",
    "Between": "之间",
    "North side": "北侧",
    "North-east side": "东北侧",
    "East side": "东侧",
    "South-east side": "东南侧",
    "South side": "南侧",
    "South-west side": "西南侧",
    "West side": "西侧",
    "North-west side": "西北侧",
    "Top": "顶部",
    "Foot": "脚部",
    "Beneath": "下方",
    "Edge": "边缘",
    "End": "末端",
    "Inside corner": "内角",
    "Outside corner": "外角",
    "Taped route": "标记路线",
    "Marked route": "标记路线",
    "Mandatory crossing": "强制通过点",
    "Refreshment": "补给",
    "Radio control": "无线电检查点",
    "First aid": "急救",
    "Map exchange": "换图",
    "Map flip": "翻图"
  })
});
const FALLBACK_SYMBOL_TEXT = Object.freeze({
  en: Object.freeze({
    all_controls: "All controls",
    number_controls: "{0} controls",
    course_length: "Length {0}",
    course_length_climb: "{0}, climb {1}",
    team_course_length: "{0}, {1} mandatory + {2} free",
    free_controls: "Free controls",
    "13.1": "Marked route {0}",
    "13.2": "Marked route {0}",
    "13.3": "Mandatory crossing point {0}",
    "13.5": "Map exchange {0}",
    "13.6": "Map issue {0}",
    "14.1": "Follow marked route to finish {0}",
    "14.2": "Marked route to finish {0}",
    "14.3": "Finish {0}"
  }),
  zh: Object.freeze({
    all_controls: "全部检查点",
    number_controls: "{0} 个检查点",
    course_length: "长度 {0}",
    course_length_climb: "{0}，爬升 {1}",
    team_course_length: "{0}，{1} 个必访 + {2} 个自由",
    free_controls: "自由检查点",
    "13.1": "标记路线 {0}",
    "13.2": "标记路线 {0}",
    "13.3": "强制通过点 {0}",
    "13.5": "换图 {0}",
    "13.6": "发图 {0}",
    "14.1": "沿标记路线到终点 {0}",
    "14.2": "标记路线到终点 {0}",
    "14.3": "终点 {0}"
  })
});
const FALLBACK_CONTROL_KIND_TEXT = Object.freeze({
  zh: Object.freeze({
    Control: "检查点",
    start: "起点",
    finish: "终点",
    normal: "检查点",
    "crossing-point": "通过点",
    "map-exchange": "换图",
    "map-issue": "发图"
  })
});
const COLUMN_F_TEXT_PREFIX = "column-f-text:";
const THICK_LINE = 0.05;
const THIN_LINE = 0.025;
const TITLE_FONT = 0.63;
const COLUMN_A_FONT = 0.63;
const COLUMN_B_FONT = 0.63;
const COLUMN_F_FONT = 0.50;
const COLUMN_F_SMALL_FONT = 0.45;
const DIRECTIVE_FONT = 0.63;
const TEXT_FONT = 0.43;
const TEXT_LINE_FONT = 0.56;

const LEGACY_ID_ALIASES = Object.freeze({
  north: "0.1N", "north-east": "0.2NE", east: "0.1E", "south-east": "0.2SE", south: "0.1S", "south-west": "0.2SW", west: "0.1W", "north-west": "0.2NW", upper: "0.3", lower: "0.4", middle: "0.5",
  terrace: "1.1", spur: "1.2", reentrant: "1.3", "earth-bank": "1.4", "earth-wall": "1.5", "erosion-gully": "1.6", knoll: "1.7", depression: "1.10", pit: "1.11", cliff: "2.1", "rock-pillar": "2.2", cave: "2.3", boulder: "2.4", "boulder-cluster": "2.5", "stony-ground": "2.6", lake: "3.1", pond: "3.2", waterhole: "3.3", river: "3.4", stream: "3.5", ditch: "3.6", marsh: "3.7", "narrow-marsh": "3.8", well: "3.9", spring: "3.10", "open-land": "4.1", "forest-corner": "4.2", clearing: "4.3", thicket: "4.4", hedge: "4.5", "vegetation-boundary": "4.6", copse: "4.7", "prominent-tree": "4.8", rootstock: "4.9", road: "5.1", track: "5.2", path: "5.3", ride: "5.4", bridge: "5.5", "power-line": "5.6", pylon: "5.7", tunnel: "5.8", wall: "5.9", fence: "5.10", "crossing-point": "5.11", building: "5.12", "paved-area": "5.13", ruin: "5.14", pipeline: "5.15", tower: "5.16", cairn: "5.17", monument: "5.18", railway: "5.25",
  low: "8.1", shallow: "8.2", deep: "8.3", overgrown: "8.4", open: "8.5", rocky: "8.6", marshy: "8.7", sandy: "8.8", ruined: "8.9",
  height: "9.1high", length: "10.1", width: "10.2", "height-width": "9.4", junction: "11.15", crossing: "11.15", bend: "11.9", fork: "11.10", between: "11.15",
  "north-side": "11.1N", "north-east-side": "11.1NE", "east-side": "11.1E", "south-east-side": "11.1SE", "south-side": "11.1S", "south-west-side": "11.1SW", "west-side": "11.1W", "north-west-side": "11.1NW", top: "11.7", foot: "11.8N", beneath: "11.9", edge: "11.10", end: "11.11", "inside-corner": "11.12", "outside-corner": "11.13",
  "first-aid": "12.1", refreshment: "12.2", radio: "12.4", "map-exchange": "13.5", "map-flip": "15.6", "taped-route": "13.1", "marked-route": "13.1", "mandatory-crossing": "13.3"
});

let symbolDb = null;
let symbolDbPromise = null;

export async function ensureIscdSymbolDb(url = "./assets/purple-pen-symbols.xml") {
  if (symbolDb) return symbolDb;
  if (!symbolDbPromise) {
    symbolDbPromise = fetch(url)
      .then(response => {
        if (!response.ok) throw new Error(`Could not load Purple Pen symbols: ${response.status}`);
        return response.text();
      })
      .then(parsePurplePenSymbols)
      .then(db => {
        symbolDb = db;
        return db;
      });
  }
  return symbolDbPromise;
}

export function hasIscdSymbolDb() {
  return !!symbolDb;
}

export function getDescriptionLanguageOptions() {
  return APP_DESCRIPTION_LANGUAGES;
}

export function normalizeDescriptionLanguage(language = "en") {
  const requested = String(language || "en");
  if (requested === "zh" || requested.startsWith("zh-")) return "zh";
  return APP_DESCRIPTION_LANGUAGES.some(([code]) => code === requested) ? requested : "en";
}

export function descriptionLanguageForEvent(eventModel) {
  return normalizeDescriptionLanguage(currentAppLanguage());
}

export function getIscdSymbolOptions(column, language = currentAppLanguage()) {
  if (!symbolDb) {
    return (ISCD_SYMBOLS[column] || []).map(([value, label]) => [value, localizedFallbackLabel(label, language)]);
  }
  const allowedKinds = column === "D" ? new Set(["D", "A", "Y"]) : new Set([column]);
  return symbolDb.order
    .map(id => symbolDb.symbols.get(id))
    .filter(symbol => symbol && allowedKinds.has(symbol.kind) && symbolInDescriptionStandard(symbol, DESCRIPTION_STANDARD))
    .map(symbol => [symbolOptionValue(column, symbol), symbolOptionLabel(column, symbol, language)]);
}

export function iscdSymbolLabel(column, value, language = currentAppLanguage()) {
  const id = normalizeIscdSymbolId(value);
  if (!String(value || "").trim()) return "";
  if (column === "F" && isColumnFTextValue(value)) {
    return columnFTextLabel(value, language);
  }
  if (symbolDb?.symbols.has(id)) {
    const symbol = symbolDb.symbols.get(id);
    const localized = localizedSymbolName(symbol, language);
    return localizedFallbackLabel(localized || symbol?.name || id, language);
  }
  const fallback = (ISCD_SYMBOLS[column] || []).find(([fallbackId]) => fallbackId === value || normalizeIscdSymbolId(fallbackId) === id);
  return fallback ? localizedFallbackLabel(fallback[1], language) : (value || "");
}

export function storageForIscdSelection(column, value) {
  const normalized = normalizeIscdSymbolId(value);
  const columnFText = column === "F" ? columnFTextForSymbolId(normalized) || normalizeColumnFText(value) : "";
  if (column === "F" && isColumnFTextValue(columnFText)) {
    return { ref: "", text: columnFText };
  }
  return { ref: value, text: "" };
}

export function createDescriptionSpecialOptions(eventModel, point, selectedCourseId = "all", displayOptions = {}) {
  const targetCourseId = descriptionTargetForNewSpecial(eventModel, selectedCourseId);
  const rows = buildControlDescriptionRows(eventModel, targetCourseId, "symbols", displayOptions);
  const cellSize = DEFAULT_CELL_SIZE;
  const cellSizeMap = descriptionCellSizeMap(eventModel, targetCourseId, { cellSize });
  return {
    locations: [{ x: point.x, y: point.y }, { x: point.x + cellSizeMap, y: point.y }],
    numColumns: bestDescriptionColumns(rows.length, 8),
    cellSize,
    descriptionKind: "symbols",
    allCourses: targetCourseId === "all",
    courses: targetCourseId === "all" ? [] : [{ course: Number(targetCourseId), part: -1 }],
    color: "black"
  };
}

export function scoreCourseDescriptionRows(rows) {
  return [...rows].sort(compareScoreDescriptionRows);
}

export function existingDescriptionSpecialForTarget(eventModel, selectedCourseId = "all", excludedSpecialId = null) {
  const targetCourseId = descriptionTargetForNewSpecial(eventModel, selectedCourseId);
  return (eventModel?.specials || []).find(special => {
    if (special.kind !== "descriptions") return false;
    if (excludedSpecialId !== null && Number(special.id) === Number(excludedSpecialId)) return false;
    if (targetCourseId === "all") return !!special.allCourses;
    return !special.allCourses && (special.courses || []).some(course => Number(course.course) === Number(targetCourseId));
  }) || null;
}

export function buildControlDescriptionRows(eventModel, selectedCourseId = "all", descriptionKind = "symbols", displayOptions = {}) {
  const language = descriptionLanguageForEvent(eventModel);
  const course = selectedCourseId === "all" ? null : getCourse(eventModel, selectedCourseId);
  const options = selectedCourseId === "all" ? {} : (displayOptions || {});
  let view = selectedCourseId === "all" ? courseView(eventModel, "all") : courseView(eventModel, selectedCourseId, options);
  if (course?.kind === "score") {
    view = scoreCourseDescriptionRows(view);
  }
  if (course?.kind === "team") {
    return buildTeamControlDescriptionRows(eventModel, course, selectedCourseId, view, descriptionKind, language);
  }
  const normalControls = view.filter(row => row.control.kind === "normal");
  const rows = [];
  rows.push(...titleRows("title", eventModel.event?.title || ""));
  if (displayOptions.relayLabel) rows.push(...titleRows("subtitle", displayOptions.relayLabel));
  else if (course?.secondaryTitle) rows.push(...titleRows("subtitle", course.secondaryTitle));
  rows.push(course ? courseHeaderRow(eventModel, course, normalControls.length, language) : allControlsHeaderRow(normalControls.length, language));
  for (let index = 0; index < view.length; index += 1) {
    const row = view[index];
    if (row.control.kind === "finish" || row.control.kind === "crossing-point" || row.control.kind === "map-issue") {
      rows.push(directiveRow(eventModel, view, index, selectedCourseId, language));
    }
    else {
      rows.push(iscdRow(row, descriptionKind, language));
    }
    if (selectedCourseId !== "all" && index < view.length - 1) {
      const marked = markedRouteRow(eventModel, view[index], view[index + 1], language);
      if (marked) rows.push(marked);
    }
  }
  return rows;
}

function buildTeamControlDescriptionRows(eventModel, course, selectedCourseId, view, descriptionKind, language) {
  const mandatoryView = view.filter(row => row.control?.kind !== "normal" || !isTeamFreeCourseControl(course, row.courseControl));
  const freeView = scoreCourseDescriptionRows(view.filter(row => row.control?.kind === "normal" && isTeamFreeCourseControl(course, row.courseControl)));
  const mandatoryCount = mandatoryView.filter(row => row.control?.kind === "normal").length;
  const rows = [];
  rows.push(...titleRows("title", eventModel.event?.title || ""));
  if (course?.secondaryTitle) rows.push(...titleRows("subtitle", course.secondaryTitle));
  rows.push(teamCourseHeaderRow(eventModel, course, mandatoryCount, freeView.length, language));
  for (let index = 0; index < mandatoryView.length; index += 1) {
    const row = mandatoryView[index];
    if (row.control.kind === "finish" || row.control.kind === "crossing-point" || row.control.kind === "map-issue") {
      rows.push(directiveRow(eventModel, mandatoryView, index, selectedCourseId, language));
    }
    else {
      rows.push(iscdRow(row, descriptionKind, language));
    }
    if (index < mandatoryView.length - 1) {
      const marked = markedRouteRow(eventModel, mandatoryView[index], mandatoryView[index + 1], language);
      if (marked) rows.push(marked);
    }
  }
  if (freeView.length) {
    rows.push(...titleRows("subtitle", symbolText("free_controls", "Free controls", language)));
    for (const row of freeView) {
      rows.push(iscdRow(row, descriptionKind, language));
    }
  }
  return rows;
}

function compareScoreDescriptionRows(a, b) {
  const order = {
    "map-issue": 0,
    start: 1,
    normal: 2,
    "crossing-point": 3,
    "map-exchange": 4,
    finish: 5
  };
  const aKind = a?.control?.kind || "";
  const bKind = b?.control?.kind || "";
  const kindDiff = (order[aKind] ?? 99) - (order[bKind] ?? 99);
  if (kindDiff) return kindDiff;
  const codeDiff = naturalCode(a?.control?.code || String(a?.control?.id || ""), b?.control?.code || String(b?.control?.id || ""));
  if (codeDiff) return codeDiff;
  return (Number(a?.courseControl?.id) || Number(a?.control?.id) || 0) - (Number(b?.courseControl?.id) || Number(b?.control?.id) || 0);
}

export function descriptionCellSize(special) {
  if (Number(special?.cellSize) > 0) return Number(special.cellSize);
  const locations = special?.locations || [];
  if (locations.length >= 2) return Math.max(0.01, Math.abs(locations[1].x - locations[0].x));
  return DEFAULT_CELL_SIZE;
}

function descriptionCellSizeMap(eventModel, targetCourseId, special) {
  return paperMmToMapUnits(descriptionCellSize(special), printScaleForDescription(eventModel, targetCourseId));
}

function paperMmToMapUnits(mm, printScale) {
  return Math.max(0.001, Number(mm) || DEFAULT_CELL_SIZE) / 1000 * Math.max(1, Number(printScale) || 15000);
}

function printScaleForDescription(eventModel, targetCourseId) {
  const mapScale = Math.max(1, Number(eventModel?.event?.map?.scale) || 15000);
  if (targetCourseId !== "all") {
    return Math.max(1, Number(getCourse(eventModel, targetCourseId)?.options?.printScale) || mapScale);
  }
  return Math.max(1, Number(eventModel?.event?.allControls?.printScale) || mapScale);
}

export function descriptionKindForSpecial(special, eventModel, selectedCourseId = "all") {
  return DESCRIPTION_KINDS.includes(special?.descriptionKind) ? special.descriptionKind : descriptionKindFromCourse(eventModel, selectedCourseId);
}

export function descriptionCoursesTarget(special, selectedCourseId = "all") {
  if (special?.allCourses) return "all";
  return special?.courses?.[0]?.course || selectedCourseId || "all";
}

export function specialVisibleForCourse(special, selectedCourseId = "all", showAllControls = false) {
  if (!special) return false;
  const courseId = selectedCourseId === undefined || selectedCourseId === null ? "all" : selectedCourseId;
  if (special.kind === "descriptions") {
    if (courseId === "all" || showAllControls) {
      return !!special.allCourses;
    }
    return !special.allCourses && (special.courses || []).some(course => Number(course.course) === Number(courseId));
  }
  if (courseId === "all" || showAllControls) {
    return !!special.allCourses;
  }
  if (special.allCourses) return true;
  return (special.courses || []).some(course => Number(course.course) === Number(courseId));
}

export function descriptionMetrics(eventModel, special, selectedCourseId = "all", displayOptions = {}) {
  const targetCourseId = descriptionCoursesTarget(special, selectedCourseId);
  const kind = descriptionKindForSpecial(special, eventModel, targetCourseId);
  const options = String(targetCourseId) === String(selectedCourseId) ? (displayOptions || {}) : {};
  const rows = buildControlDescriptionRows(eventModel, targetCourseId, kind, options);
  const columns = Math.max(1, Number(special?.numColumns) || 1);
  const cellSize = descriptionCellSizeMap(eventModel, targetCourseId, special);
  const widthCells = kind === "symbols-and-text" ? 13 : 8;
  const rowsPerColumn = Math.max(1, Math.ceil(rows.length / columns));
  const columnWidth = widthCells * cellSize;
  const columnGap = COLUMN_GAP_CELLS * cellSize;
  const margin = MARGIN_CELLS * cellSize;
  return { targetCourseId, kind, rows, columns, rowsPerColumn, widthCells, cellSize, columnWidth, columnGap, margin, width: columns * columnWidth + Math.max(0, columns - 1) * columnGap + margin * 2, height: rowsPerColumn * cellSize + margin * 2 };
}

export function descriptionBounds(eventModel, special, selectedCourseId = "all", displayOptions = {}) {
  const topLeft = special?.locations?.[0] || { x: 0, y: 0 };
  const metrics = descriptionMetrics(eventModel, special, selectedCourseId, displayOptions);
  return { left: topLeft.x, right: topLeft.x + metrics.width, top: topLeft.y, bottom: topLeft.y - metrics.height, width: metrics.width, height: metrics.height, metrics };
}

export function resizedDescriptionSpecial(eventModel, special, anchor, target, selectedCourseId = "all", displayOptions = {}) {
  const metrics = descriptionMetrics(eventModel, special, selectedCourseId, displayOptions);
  const targetCourseId = descriptionCoursesTarget(special, selectedCourseId);
  const printScale = printScaleForDescription(eventModel, targetCourseId);
  const minCellSizeMap = paperMmToMapUnits(MIN_CELL_SIZE, printScale);
  const rowCount = Math.max(1, metrics.rows.length);
  const desiredWidth = Math.max(Math.abs(target.x - anchor.x), minCellSizeMap * metrics.widthCells);
  const desiredHeight = Math.max(Math.abs(anchor.y - target.y), minCellSizeMap * 2);
  const maxColumns = Math.max(1, Math.ceil(rowCount / 4));
  let best = { columns: 1, score: Infinity };
  for (let columns = 1; columns <= maxColumns; columns += 1) {
    const rowsPerColumn = Math.ceil(rowCount / columns);
    const cell = Math.max(minCellSizeMap, Math.min(
      desiredWidth / (metrics.widthCells * columns + COLUMN_GAP_CELLS * Math.max(0, columns - 1) + MARGIN_CELLS * 2),
      desiredHeight / (rowsPerColumn + MARGIN_CELLS * 2)
    ));
    const score = Math.abs(cell * (metrics.widthCells * columns + COLUMN_GAP_CELLS * Math.max(0, columns - 1) + MARGIN_CELLS * 2) - desiredWidth) + Math.abs(cell * (rowsPerColumn + MARGIN_CELLS * 2) - desiredHeight);
    if (score < best.score) best = { columns, score };
  }
  const rowsPerColumn = Math.ceil(rowCount / best.columns);
  const cellSizeMap = Math.max(minCellSizeMap, Math.min(
    desiredWidth / (metrics.widthCells * best.columns + COLUMN_GAP_CELLS * Math.max(0, best.columns - 1) + MARGIN_CELLS * 2),
    desiredHeight / (rowsPerColumn + MARGIN_CELLS * 2)
  ));
  const cellSize = cellSizeMap / printScale * 1000;
  const topLeft = { x: Math.min(anchor.x, target.x), y: Math.max(anchor.y, target.y) };
  return { ...special, numColumns: best.columns, cellSize, locations: [topLeft, { x: topLeft.x + cellSizeMap, y: topLeft.y }] };
}

export function drawControlDescriptionBlock(ctx, eventModel, special, selectedCourseId, toScreen, displayOptions = {}) {
  const bounds = descriptionBounds(eventModel, special, selectedCourseId, displayOptions);
  const topLeft = toScreen({ x: bounds.left, y: bounds.top });
  const bottomRight = toScreen({ x: bounds.right, y: bounds.bottom });
  ctx.save();
  ctx.translate(topLeft.x, topLeft.y);
  ctx.scale((bottomRight.x - topLeft.x) / bounds.width, (bottomRight.y - topLeft.y) / bounds.height);
  drawDescriptionLocal(ctx, eventModel, special, bounds.metrics);
  ctx.restore();
}

function drawDescriptionLocal(ctx, eventModel, special, metrics) {
  const color = descriptionColor(special.color || eventModel?.event?.descriptions?.color);
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, metrics.width, metrics.height);
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineJoin = "miter";
  ctx.lineCap = "butt";
  for (let column = 0; column < metrics.columns; column += 1) {
    const colX = metrics.margin + column * (metrics.columnWidth + metrics.columnGap);
    const start = column * metrics.rowsPerColumn;
    const end = Math.min(metrics.rows.length, start + metrics.rowsPerColumn);
    if (start < metrics.rows.length) drawDescriptionColumn(ctx, metrics, colX, start, end);
  }
}

function drawDescriptionColumn(ctx, metrics, x, start, end) {
  const cs = metrics.cellSize;
  let thickLineCounter = 0;
  for (let rowIndex = start; rowIndex < end; rowIndex += 1) {
    const row = metrics.rows[rowIndex];
    const y = metrics.margin + (rowIndex - start) * cs;
    const isControl = row.kind === "control";
    ctx.lineWidth = (!isControl || thickLineCounter === 0 || rowIndex === start) ? cs * THICK_LINE : cs * THIN_LINE;
    line(ctx, x, y, x + metrics.columnWidth, y);
    ctx.lineWidth = cs * THICK_LINE;
    line(ctx, x, y - cs * THICK_LINE / 2, x, y + cs * (1 + THICK_LINE / 2));
    line(ctx, x + Math.min(metrics.columnWidth, cs * 8), y - cs * THICK_LINE / 2, x + Math.min(metrics.columnWidth, cs * 8), y + cs * (1 + THICK_LINE / 2));
    if (metrics.kind === "symbols-and-text") {
      line(ctx, x + cs * 13, y - cs * THICK_LINE / 2, x + cs * 13, y + cs * (1 + THICK_LINE / 2));
    }
    drawDescriptionRow(ctx, row, metrics, x, y);
    if (isControl) {
      thickLineCounter = row.ASymbol ? 0 : (thickLineCounter + 1) % 3;
    }
    else {
      thickLineCounter = 0;
    }
  }
  ctx.lineWidth = cs * THICK_LINE;
  line(ctx, x, metrics.margin + (end - start) * cs, x + metrics.columnWidth, metrics.margin + (end - start) * cs);
}

function drawDescriptionRow(ctx, row, metrics, x, y) {
  const cs = metrics.cellSize;
  ctx.save();
  ctx.fillStyle = ctx.strokeStyle;
  ctx.textBaseline = "middle";
  ctx.textAlign = "center";
  if (["title", "subtitle"].includes(row.kind)) {
    setDescriptionFont(ctx, cs, "title");
    fitSingleLineText(ctx, row.text || "", x, y, metrics.columnWidth, cs, "center");
  }
  else if (row.kind === "header3") {
    drawVerticals(ctx, x, y, [3, 6], cs);
    setDescriptionFont(ctx, cs, "title");
    fitSingleLineText(ctx, row.boxes?.[0] || "", x, y, cs * 3, cs, "center");
    fitSingleLineText(ctx, row.boxes?.[1] || "", x + cs * 3, y, cs * 3, cs, "center");
    fitSingleLineText(ctx, row.boxes?.[2] || "", x + cs * 6, y, cs * 2, cs, "center");
  }
  else if (row.kind === "header2") {
    drawVerticals(ctx, x, y, [3], cs);
    setDescriptionFont(ctx, cs, "title");
    fitSingleLineText(ctx, row.boxes?.[0] || "", x, y, cs * 3, cs, "center");
    fitSingleLineText(ctx, row.boxes?.[1] || "", x + cs * 3, y, cs * 5, cs, "center");
  }
  else if (row.kind === "directive") {
    drawIscdSymbol(ctx, "Z", row.symbol, x + cs * 4, y + cs / 2, cs * 0.36);
    if (row.distance) {
      setDescriptionFont(ctx, cs, "directive");
      fitSingleLineText(ctx, row.distance, x + cs * 3, y, cs * 2, cs, "center");
    }
    if (metrics.kind === "symbols-and-text") {
      setDescriptionFont(ctx, cs, "text");
      fitWrappedText(ctx, row.text || "", x + cs * 8.15, y, cs * 4.7, cs, "left");
    }
  }
  else if (metrics.kind === "text") {
    drawVerticals(ctx, x, y, [2], cs);
    setDescriptionFont(ctx, cs, "columnA");
    fitSingleLineText(ctx, row.ordinal || "", x, y, cs, cs, "center");
    setDescriptionFont(ctx, cs, "columnB");
    fitSingleLineText(ctx, row.code || "", x + cs, y, cs, cs, "center");
    setDescriptionFont(ctx, cs, "text");
    fitWrappedText(ctx, row.text || "", x + cs * 2.15, y, metrics.columnWidth - cs * 2.3, cs, "left");
  }
  else {
    if (row.kind === "box-header") {
      ctx.lineWidth = cs * THICK_LINE;
      drawVerticals(ctx, x, y, [3, 6], cs);
    }
    else {
      drawNormalVerticals(ctx, x, y, cs);
      if (row.ASymbol) {
        drawIscdSymbol(ctx, "D", row.ASymbol, x + cs * 0.5, y + cs / 2, cs * 0.34);
      }
      else {
        setDescriptionFont(ctx, cs, "columnA");
        fitSingleLineText(ctx, row.ordinal || "", x, y, cs, cs, "center");
      }
      setDescriptionFont(ctx, cs, "columnB");
      fitSingleLineText(ctx, row.code || "", x + cs, y, cs, cs, "center");
      drawIscdSymbol(ctx, "C", row.C, x + cs * 2.5, y + cs / 2, cs * 0.34);
      drawIscdSymbol(ctx, "D", row.D, x + cs * 3.5, y + cs / 2, cs * 0.34);
      drawIscdSymbol(ctx, "E", row.E, x + cs * 4.5, y + cs / 2, cs * 0.34);
      drawIscdSymbol(ctx, "F", row.F, x + cs * 5.5, y + cs / 2, cs * 0.34);
      drawIscdSymbol(ctx, "G", row.G, x + cs * 6.5, y + cs / 2, cs * 0.34);
      if (row.HScore !== undefined) {
        setDescriptionFont(ctx, cs, "columnB");
        fitSingleLineText(ctx, row.HScore, x + cs * 7, y, cs, cs, "center");
      }
      else {
        drawIscdSymbol(ctx, "H", row.H, x + cs * 7.5, y + cs / 2, cs * 0.34);
      }
      if (metrics.kind === "symbols-and-text") {
        setDescriptionFont(ctx, cs, "text");
        fitWrappedText(ctx, row.text || "", x + cs * 8.15, y, cs * 4.7, cs, "left");
      }
    }
  }
  ctx.restore();
}

function drawNormalVerticals(ctx, x, y, cellSize) {
  const thin = [1, 2, 4, 5, 7];
  const thick = [3, 6];
  ctx.lineWidth = cellSize * THIN_LINE;
  drawVerticals(ctx, x, y, thin, cellSize);
  ctx.lineWidth = cellSize * THICK_LINE;
  drawVerticals(ctx, x, y, thick, cellSize);
}

function setDescriptionFont(ctx, cellSize, kind) {
  const sans = "\"黑体\", Arial, sans-serif";
  const condensed = "\"Roboto Condensed\", \"黑体\", Arial Narrow, Arial, sans-serif";
  const regular = `Roboto, ${sans}`;
  const specs = {
    title: ["700", TITLE_FONT, condensed],
    columnA: ["700", COLUMN_A_FONT, regular],
    columnB: ["400", COLUMN_B_FONT, condensed],
    columnF: ["400", COLUMN_F_FONT, regular],
    columnFSmall: ["400", COLUMN_F_SMALL_FONT, condensed],
    directive: ["700", DIRECTIVE_FONT, condensed],
    text: ["400", TEXT_FONT, condensed],
    textLine: ["700", TEXT_LINE_FONT, condensed]
  };
  const [weight, ratio, family] = specs[kind] || specs.text;
  ctx.font = `${weight} ${Math.max(1, cellSize * ratio)}px ${family}`;
}

function fitSingleLineText(ctx, text, x, y, width, height, align = "center") {
  const label = String(text || "");
  if (!label) return;
  const originalFont = ctx.font;
  let workingFont = originalFont;
  if (hasCjkText(label)) {
    workingFont = cjkBoldFont(originalFont);
    ctx.font = workingFont;
  }
  const match = workingFont.match(/(^|\s)([0-9.]+)px\s+/);
  const baseSize = match ? Number(match[2]) : height * 0.6;
  let size = baseSize;
  while (size > 1 && ctx.measureText(label).width > width * 0.95) {
    size *= 0.95;
    ctx.font = workingFont.replace(/[0-9.]+px/, `${Math.max(1, size)}px`);
  }
  ctx.textAlign = align;
  ctx.textBaseline = "middle";
  const textX = align === "left" ? x + width * 0.03 : align === "right" ? x + width * 0.97 : x + width / 2;
  ctx.fillText(label, textX, y + height / 2, width * 0.98);
  ctx.font = originalFont;
}

function hasCjkText(value) {
  return /[\u3400-\u9fff\uf900-\ufaff]/.test(String(value || ""));
}

function cjkBoldFont(font) {
  const match = String(font || "").match(/([0-9.]+px)\s+(.+)$/);
  const size = match?.[1] || "12px";
  return `700 ${size} "黑体", ${match?.[2] || "Arial, sans-serif"}`;
}

function fitWrappedText(ctx, text, x, y, width, height, align = "left") {
  const label = String(text || "");
  if (!label) return;
  fitSingleLineText(ctx, label, x, y, width, height, align);
}

function titleRows(kind, text) {
  const value = String(text || "").trim();
  if (!value) return [];
  return value.split("|").map(part => ({ kind, text: part }));
}

function courseHeaderRow(eventModel, course, normalControlCount, language) {
  if (course.kind === "team") {
    return teamCourseHeaderRow(eventModel, course, normalControlCount, 0, language);
  }
  if (course.kind === "score") {
    return {
      kind: "header2",
      boxes: [
        course.name || "",
        formatSymbolText("number_controls", normalControlCount, `${normalControlCount} controls`, language)
      ]
    };
  }
  const length = formatCourseLength(courseLength(eventModel, course.id));
  const climb = formatCourseClimb(course.options?.climb);
  return {
    kind: "header3",
    boxes: [course.name || "", length, climb],
    text: climb ? formatSymbolText("course_length_climb", [length, climb], `${length}, ${climb}`, language) : formatSymbolText("course_length", length, `Length ${length}`, language)
  };
}

function teamCourseHeaderRow(eventModel, course, mandatoryControlCount, freeControlCount, language) {
  const length = formatCourseLength(courseLength(eventModel, course.id));
  const climb = formatCourseClimb(course.options?.climb);
  const suffix = freeControlCount ? ` + ${freeControlCount} free` : "";
  return {
    kind: "header3",
    boxes: [course.name || "", length, climb],
    text: climb
      ? formatSymbolText("course_length_climb", [length, climb], `${length}, ${climb}${suffix}`, language)
      : formatSymbolText("team_course_length", [length, mandatoryControlCount, freeControlCount], `${length}, ${mandatoryControlCount} mandatory${suffix}`, language)
  };
}

function allControlsHeaderRow(normalControlCount, language) {
  return {
    kind: "header2",
    boxes: [
      symbolText("all_controls", "All controls", language),
      formatSymbolText("number_controls", normalControlCount, `${normalControlCount} controls`, language)
    ]
  };
}

function directiveRow(eventModel, view, index, selectedCourseId, language) {
  const row = view[index];
  const control = row.control;
  const previous = index > 0 ? view[index - 1] : null;
  const next = index < view.length - 1 ? view[index + 1] : null;
  const course = selectedCourseId === "all" ? null : getCourse(eventModel, selectedCourseId);
  const scoreFinishFrom = course?.kind === "score" && control.kind === "finish"
    ? scoreFinishFromRow(course, view)
    : null;
  const distance = scoreFinishFrom
    ? formatDirectiveDistance(legLength(eventModel, scoreFinishFrom.control.id, control.id))
    : control.kind === "map-issue"
    ? (next ? formatDirectiveDistance(legLength(eventModel, control.id, next.control.id)) : "")
    : course?.kind === "score" && control.kind === "finish"
    ? ""
    : (previous ? formatDirectiveDistance(legLength(eventModel, previous.control.id, control.id)) : "");
  let symbol = directiveSymbol(control);
  if (selectedCourseId !== "all" && control.kind === "finish" && (scoreFinishFrom || previous)) {
    const from = scoreFinishFrom || previous;
    const flagging = normalizeLegFlaggingKind(findLeg(eventModel, from.control.id, control.id)?.flagging?.kind);
    if (flagging === "all") symbol = "14.1";
    else if (flagging === "end") symbol = "14.2";
  }
  return {
    kind: "directive",
    symbol,
    distance: (control.kind === "finish" || control.kind === "map-issue") ? distance : "",
    text: directiveText(symbol, distance, language)
  };
}

function scoreFinishFromRow(course, view) {
  const controlId = Number(course.options?.scoreFinishControl) || 0;
  if (!controlId) return null;
  return view.find(row => Number(row.control?.id) === controlId && row.control?.kind === "normal") || null;
}

function markedRouteRow(eventModel, from, to, language) {
  if (!from?.control || !to?.control) return null;
  const leg = findLeg(eventModel, from.control.id, to.control.id);
  const flagging = normalizeLegFlaggingKind(leg?.flagging?.kind);
  if (!leg || flagging === "none" || flagging === "end") return null;
  if (to.control.kind === "finish" || to.control.kind === "map-exchange") return null;
  const symbol = flagging === "begin" ? "13.1" : "13.2";
  const distance = formatDirectiveDistance(flaggedLegLength(eventModel, leg, flagging));
  return { kind: "directive", symbol, distance, text: directiveText(symbol, distance, language) };
}

function flaggedLegLength(eventModel, leg, flagging) {
  const path = legPath(eventModel, leg.startControl, leg.endControl);
  const total = pathLength(path);
  if (flagging === "all") return total;
  if (flagging === "begin") {
    return clamp(Number(leg.flagging?.end) || (leg.flagging?.point ? distanceAlongPathAtPoint(path, leg.flagging.point) : total / 2), 0, total);
  }
  if (flagging === "end") {
    const start = clamp(Number(leg.flagging?.start) || (leg.flagging?.point ? distanceAlongPathAtPoint(path, leg.flagging.point) : total / 2), 0, total);
    return Math.max(0, total - start);
  }
  if (flagging === "middle") {
    const start = clamp(Number(leg.flagging?.start) || total * 0.35, 0, total);
    const end = clamp(Number(leg.flagging?.end) || total * 0.65, start, total);
    return Math.max(0, end - start);
  }
  return total;
}

function pathLength(points) {
  let length = 0;
  for (let i = 0; i < points.length - 1; i += 1) {
    length += Math.hypot((points[i + 1].x || 0) - (points[i].x || 0), (points[i + 1].y || 0) - (points[i].y || 0));
  }
  return length;
}

function distanceAlongPathAtPoint(path, point) {
  let best = { distance: 0, offset: 0, score: Infinity };
  let offset = 0;
  for (let index = 0; index < path.length - 1; index += 1) {
    const a = path[index];
    const b = path[index + 1];
    const projected = projectPointToSegment(point, a, b);
    if (projected.distance < best.score) {
      best = { distance: offset + projected.t * segmentLength(a, b), offset, score: projected.distance };
    }
    offset += segmentLength(a, b);
  }
  return best.distance;
}

function projectPointToSegment(point, a, b) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lengthSq = dx * dx + dy * dy;
  const t = lengthSq > 0 ? clamp(((point.x - a.x) * dx + (point.y - a.y) * dy) / lengthSq, 0, 1) : 0;
  const projected = { x: a.x + dx * t, y: a.y + dy * t };
  return { t, distance: segmentLength(point, projected) };
}

function segmentLength(a, b) {
  return Math.hypot((b.x || 0) - (a.x || 0), (b.y || 0) - (a.y || 0));
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function normalizeLegFlaggingKind(kind) {
  return {
    "beginning-part": "begin",
    "end-part": "end",
    "middle-part": "middle"
  }[kind] || kind || "none";
}

function iscdRow(row, descriptionKind, language) {
  const HScore = scoreDescriptionValue(row);
  if (row.control.kind === "start" || row.control.kind === "map-exchange") {
    const D = descriptionValue(row.control, "D") || (row.control.kind === "start" ? "" : defaultFeatureForControl(row.control.kind));
    const text = row.control.descriptionText || iscdSymbolLabel("D", D, language) || controlKindText(row.control.kind, language);
    return {
      kind: "control",
      ordinal: "",
      code: "",
      ASymbol: "start",
      text,
      C: descriptionValue(row.control, "C"),
      D,
      E: descriptionValue(row.control, "E"),
      F: descriptionValue(row.control, "F"),
      G: descriptionValue(row.control, "G"),
      H: descriptionValue(row.control, "H"),
      ...(HScore !== undefined ? { HScore } : {}),
      featureText: descriptionKind === "symbols" ? "" : text
    };
  }
  const D = descriptionValue(row.control, "D") || defaultFeatureForControl(row.control.kind);
  const text = row.control.descriptionText || iscdSymbolLabel("D", D, language) || controlKindText(row.control.kind, language);
  return { kind: "control", ordinal: (row.course?.kind === "score" || isTeamFreeCourseControl(row.course, row.courseControl)) ? "" : String(row.ordinal || ""), code: row.control.code || "", text, C: descriptionValue(row.control, "C"), D, E: descriptionValue(row.control, "E"), F: descriptionValue(row.control, "F"), G: descriptionValue(row.control, "G"), H: descriptionValue(row.control, "H"), ...(HScore !== undefined ? { HScore } : {}), featureText: descriptionKind === "symbols" ? "" : text };
}

function scoreDescriptionValue(row) {
  if (row.control?.kind !== "normal") {
    return undefined;
  }
  // Team-course free controls are ordered like score controls in the table,
  // but they do not have per-control points. Keep column H as the normal
  // ISCD column instead of drawing a score value such as 0.
  if (row.course?.kind === "team") {
    return undefined;
  }
  if (row.course?.kind === "score") {
    return String(Math.max(0, Number(row.courseControl?.points) || 0));
  }
  return undefined;
}

export function drawIscdSymbol(ctx, column, value, cx, cy, r) {
  const normalized = normalizeIscdSymbolId(value);
  if (!normalized) return;
  if (column === "F" && isColumnFTextValue(value)) {
    drawColumnFText(ctx, normalizeColumnFText(value), cx, cy, r);
    return;
  }
  if (symbolDb?.symbols.has(normalized)) {
    const symbol = symbolDb.symbols.get(normalized);
    const columnFText = column === "F" ? columnFTextForSymbolId(symbol.id) : "";
    if (columnFText && !(symbol.strokes || []).length) {
      drawColumnFText(ctx, columnFText, cx, cy, r);
    }
    else if (column === "F" && !(symbol.strokes || []).length && COLUMN_F_VISUAL_ALIASES[symbol.id]) {
      drawXmlSymbol(ctx, symbolDb.symbols.get(COLUMN_F_VISUAL_ALIASES[symbol.id]) || symbol, cx, cy, r);
    }
    else {
      drawXmlSymbol(ctx, symbol, cx, cy, r);
    }
    return;
  }
  ctx.save();
  ctx.lineWidth = Math.max(r * 0.16, 0.04);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  if (column === "C") drawWhich(ctx, value, cx, cy, r);
  else if (column === "D") drawFeature(ctx, value, cx, cy, r);
  else if (column === "E") drawAppearance(ctx, value, cx, cy, r);
  else if (column === "F") drawDimension(ctx, value, cx, cy, r);
  else if (column === "G") drawLocation(ctx, value, cx, cy, r);
  else drawOther(ctx, value, cx, cy, r);
  ctx.restore();
}

function drawWhich(ctx, value, cx, cy, r) {
  const dir = { north: -90, "north-east": -45, east: 0, "south-east": 45, south: 90, "south-west": 135, west: 180, "north-west": -135 };
  if (value in dir) arrow(ctx, cx, cy, r, dir[value]);
  else if (value === "upper") chevron(ctx, cx, cy - r * 0.15, r, -1);
  else if (value === "lower") chevron(ctx, cx, cy + r * 0.15, r, 1);
  else if (value === "middle") line(ctx, cx - r, cy, cx + r, cy);
}

function drawFeature(ctx, value, cx, cy, r) {
  const simple = {
    terrace: () => poly(ctx, [[-1, 0.6], [-0.35, -0.5], [0.35, -0.5], [1, 0.6]], cx, cy, r),
    spur: () => poly(ctx, [[0, -1], [-0.8, 0.7], [0, 0.25], [0.8, 0.7]], cx, cy, r),
    reentrant: () => poly(ctx, [[-0.8, -0.75], [0, 0.8], [0.8, -0.75]], cx, cy, r),
    "earth-bank": () => ticks(ctx, cx, cy, r),
    "earth-wall": () => doubleLine(ctx, cx, cy, r),
    "erosion-gully": () => poly(ctx, [[-0.8, -0.8], [-0.3, -0.2], [-0.65, 0.2], [0.15, 0.85], [0.8, -0.2]], cx, cy, r),
    knoll: () => circle(ctx, cx, cy, r * 0.72),
    depression: () => { circle(ctx, cx, cy, r * 0.72); line(ctx, cx, cy - r * 0.35, cx, cy + r * 0.35); },
    pit: () => triangle(ctx, cx, cy, r),
    cliff: () => { line(ctx, cx - r, cy - r * 0.45, cx + r, cy - r * 0.45); for (const x of [-0.55, 0, 0.55]) line(ctx, cx + x * r, cy - r * 0.45, cx + (x - 0.2) * r, cy + r * 0.55); },
    "rock-pillar": () => rect(ctx, cx, cy, r * 1.0, r * 1.45),
    cave: () => arc(ctx, cx, cy + r * 0.25, r * 0.65, Math.PI, 0),
    boulder: () => diamond(ctx, cx, cy, r),
    "boulder-cluster": () => dots(ctx, cx, cy, r, [[0, -0.45], [-0.45, 0.35], [0.45, 0.35]]),
    "stony-ground": () => dots(ctx, cx, cy, r, [[-0.6, -0.35], [0.15, -0.55], [0.65, -0.05], [-0.25, 0.2], [0.35, 0.55], [-0.65, 0.55]]),
    lake: () => waves(ctx, cx, cy, r, 2),
    pond: () => waves(ctx, cx, cy, r, 1),
    waterhole: () => circle(ctx, cx, cy, r * 0.6),
    river: () => sinuous(ctx, cx - r * 0.2, cy, r) || sinuous(ctx, cx + r * 0.2, cy, r),
    stream: () => sinuous(ctx, cx, cy, r),
    ditch: () => dashed(ctx, cx, cy, r, true),
    marsh: () => marsh(ctx, cx, cy, r, 3),
    "narrow-marsh": () => marsh(ctx, cx, cy, r, 2),
    well: () => { circle(ctx, cx, cy, r * 0.6); line(ctx, cx - r * 0.45, cy, cx + r * 0.45, cy); line(ctx, cx, cy - r * 0.45, cx, cy + r * 0.45); },
    spring: () => { circle(ctx, cx - r * 0.25, cy, r * 0.35); line(ctx, cx + r * 0.05, cy, cx + r * 0.85, cy - r * 0.45); },
    "open-land": () => circle(ctx, cx, cy, r * 0.75),
    "forest-corner": () => poly(ctx, [[-0.8, -0.8], [-0.8, 0.8], [0.8, 0.8]], cx, cy, r),
    clearing: () => rect(ctx, cx, cy, r * 1.45, r * 1.05),
    thicket: () => hatchBox(ctx, cx, cy, r),
    hedge: () => ticks(ctx, cx, cy, r, true),
    "vegetation-boundary": () => dashed(ctx, cx, cy, r),
    copse: () => tree(ctx, cx, cy, r, true),
    "prominent-tree": () => tree(ctx, cx, cy, r),
    rootstock: () => poly(ctx, [[0, -0.8], [0, 0.7], [-0.55, 0.2], [0, 0.7], [0.55, 0.2]], cx, cy, r),
    road: () => doubleLine(ctx, cx, cy, r),
    track: () => dashedDouble(ctx, cx, cy, r),
    path: () => dashed(ctx, cx, cy, r),
    ride: () => { line(ctx, cx - r, cy, cx + r, cy); line(ctx, cx, cy - r * 0.8, cx, cy + r * 0.8); },
    bridge: () => { doubleLine(ctx, cx, cy, r); line(ctx, cx - r * 0.45, cy - r * 0.7, cx - r * 0.45, cy + r * 0.7); line(ctx, cx + r * 0.45, cy - r * 0.7, cx + r * 0.45, cy + r * 0.7); },
    "power-line": () => { line(ctx, cx - r, cy, cx + r, cy); line(ctx, cx, cy - r * 0.55, cx, cy + r * 0.55); },
    pylon: () => poly(ctx, [[0, -0.9], [-0.65, 0.8], [0.65, 0.8], [0, -0.9], [-0.45, 0.1], [0.45, 0.1]], cx, cy, r),
    tunnel: () => { dashedDouble(ctx, cx, cy, r); rect(ctx, cx, cy, r * 0.75, r * 1.1); },
    wall: () => wall(ctx, cx, cy, r),
    fence: () => fence(ctx, cx, cy, r),
    "crossing-point": () => crossing(ctx, cx, cy, r),
    building: () => rect(ctx, cx, cy, r * 1.4, r * 1.05, true),
    "paved-area": () => hatchBox(ctx, cx, cy, r),
    ruin: () => dashedRect(ctx, cx, cy, r),
    pipeline: () => { doubleLine(ctx, cx, cy, r); circle(ctx, cx, cy, r * 0.3); },
    tower: () => { poly(ctx, [[0, -0.9], [-0.7, 0.8], [0.7, 0.8], [0, -0.9]], cx, cy, r); dot(ctx, cx, cy - r * 0.1, r * 0.12); },
    cairn: () => triangle(ctx, cx, cy, r),
    monument: () => { rect(ctx, cx, cy + r * 0.1, r * 0.65, r * 1.15); line(ctx, cx - r * 0.55, cy + r * 0.75, cx + r * 0.55, cy + r * 0.75); },
    railway: () => { doubleLine(ctx, cx, cy, r); for (const x of [-0.65, 0, 0.65]) line(ctx, cx + x * r, cy - r * 0.5, cx + x * r, cy + r * 0.5); },
    start: () => triangle(ctx, cx, cy, r),
    finish: () => { circle(ctx, cx, cy, r * 0.8); circle(ctx, cx, cy, r * 0.52); },
    "map-exchange": () => labelBox(ctx, cx, cy, r, "M"),
    "map-flip": () => labelBox(ctx, cx, cy, r, "F")
  };
  (simple[value] || (() => labelBox(ctx, cx, cy, r, value.slice(0, 2))))();
}

function drawAppearance(ctx, value, cx, cy, r) {
  if (value === "low" || value === "shallow") chevron(ctx, cx, cy + r * 0.15, r, 1);
  else if (value === "deep") chevron(ctx, cx, cy - r * 0.15, r, -1);
  else if (value === "overgrown") hatchBox(ctx, cx, cy, r);
  else if (value === "open") circle(ctx, cx, cy, r * 0.72);
  else if (value === "rocky" || value === "sandy") dots(ctx, cx, cy, r, [[-0.5, -0.3], [0.1, -0.45], [0.55, 0.1], [-0.25, 0.3], [0.35, 0.55]]);
  else if (value === "marshy") marsh(ctx, cx, cy, r, 3);
  else if (value === "ruined") dashed(ctx, cx, cy, r);
}

function drawDimension(ctx, value, cx, cy, r) {
  if (value === "height") arrow(ctx, cx, cy, r, -90, true);
  else if (value === "length") arrow(ctx, cx, cy, r, 0, true);
  else if (value === "width") arrow(ctx, cx, cy, r, 90, true);
  else if (value === "height-width") { arrow(ctx, cx - r * 0.25, cy, r * 0.7, -90, true); arrow(ctx, cx + r * 0.25, cy, r * 0.7, 0, true); }
  else if (value === "junction") poly(ctx, [[-1, 0], [0, 0], [0.7, -0.7], [0, 0], [0.7, 0.7]], cx, cy, r);
  else if (value === "crossing") crossing(ctx, cx, cy, r);
  else if (value === "bend") poly(ctx, [[-0.8, 0.7], [-0.1, 0.4], [0.15, -0.15], [0.75, -0.75]], cx, cy, r);
  else if (value === "fork") poly(ctx, [[-0.8, 0.7], [0, 0], [0.8, 0.7], [0, 0], [0, -0.8]], cx, cy, r);
  else if (value === "between") between(ctx, cx, cy, r);
}

function drawColumnFText(ctx, value, cx, cy, r) {
  const text = normalizeColumnFText(value);
  if (!text) return;
  const rect = {
    left: cx - r * 1.28,
    top: cy - r * 1.16,
    width: r * 2.56,
    height: r * 2.32
  };
  const split = splitColumnFText(text, rect);
  ctx.save();
  ctx.lineCap = "butt";
  ctx.lineJoin = "miter";
  if (split) {
    if (split.diagonal) {
      ctx.lineWidth = Math.max(r * 0.07, 0.03);
      line(ctx, rect.left + rect.width, rect.top, rect.left, rect.top + rect.height);
    }
    drawColumnFSingleText(ctx, split.first, split.firstRect, r * 1.32, true);
    drawColumnFSingleText(ctx, split.second, split.secondRect, r * 1.32, true);
  }
  else {
    drawColumnFSingleText(ctx, text, rect, r * 1.47, false);
  }
  ctx.restore();
}

function splitColumnFText(text, rect) {
  const verticalIndex = text.indexOf("|");
  if (verticalIndex >= 0) {
    return {
      diagonal: false,
      first: text.slice(0, verticalIndex),
      second: text.slice(verticalIndex + 1),
      firstRect: { left: rect.left, top: rect.top, width: rect.width, height: rect.height / 2 },
      secondRect: { left: rect.left, top: rect.top + rect.height / 2, width: rect.width, height: rect.height / 2 }
    };
  }
  const diagonalIndex = text.indexOf("/");
  if (diagonalIndex >= 0) {
    return {
      diagonal: true,
      first: text.slice(0, diagonalIndex),
      second: text.slice(diagonalIndex + 1),
      firstRect: { left: rect.left, top: rect.top, width: rect.width * 0.63, height: rect.height / 2 },
      secondRect: { left: rect.left + rect.width * 0.37, top: rect.top + rect.height / 2, width: rect.width * 0.63, height: rect.height / 2 }
    };
  }
  return null;
}

function drawColumnFSingleText(ctx, text, rect, fontSize, small = false) {
  const label = String(text || "").replace(/x/gi, "\u00d7");
  if (!label) return;
  let size = fontSize;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  do {
    ctx.font = `400 ${Math.max(size, 1)}px ${small ? "\"Roboto Condensed\", Arial Narrow, Arial" : "Roboto, Arial"}, sans-serif`;
    if (ctx.measureText(label).width <= rect.width * 0.95 || size <= 1) break;
    size *= 0.9;
  } while (true);
  ctx.fillText(label, rect.left + rect.width / 2, rect.top + rect.height / 2, rect.width * 0.98);
}

function drawLocation(ctx, value, cx, cy, r) {
  const dir = value.match(/^(north|north-east|east|south-east|south|south-west|west|north-west)-side$/);
  if (dir) drawWhich(ctx, dir[1], cx, cy, r);
  else if (value === "top") chevron(ctx, cx, cy - r * 0.25, r, -1);
  else if (value === "foot") chevron(ctx, cx, cy + r * 0.25, r, 1);
  else if (value === "beneath") poly(ctx, [[-0.9, -0.35], [0.9, -0.35], [0.4, 0.45], [-0.4, 0.45], [-0.9, -0.35]], cx, cy, r);
  else if (value === "edge") poly(ctx, [[-0.7, -0.75], [-0.7, 0.75], [0.7, 0.75]], cx, cy, r);
  else if (value === "end") poly(ctx, [[-0.75, 0], [0.35, 0], [0.35, -0.45], [0.35, 0.45]], cx, cy, r);
  else if (value === "inside-corner") poly(ctx, [[-0.7, -0.7], [-0.7, 0.65], [0.65, 0.65]], cx, cy, r);
  else if (value === "outside-corner") poly(ctx, [[-0.65, 0.65], [0.65, 0.65], [0.65, -0.65]], cx, cy, r);
  else if (value === "between") between(ctx, cx, cy, r);
}

function drawOther(ctx, value, cx, cy, r) {
  if (value === "taped-route" || value === "marked-route") dashed(ctx, cx, cy, r);
  else if (value === "mandatory-crossing") crossing(ctx, cx, cy, r);
  else if (value === "refreshment") poly(ctx, [[-0.55, -0.6], [-0.35, 0.65], [0.35, 0.65], [0.55, -0.6]], cx, cy, r);
  else if (value === "radio") poly(ctx, [[-0.35, 0.8], [0.35, 0.8], [0.25, -0.25], [-0.25, -0.25], [-0.35, 0.8], [0, -0.25], [0.45, -0.85]], cx, cy, r);
  else if (value === "first-aid") { line(ctx, cx - r * 0.8, cy, cx + r * 0.8, cy); line(ctx, cx, cy - r * 0.8, cx, cy + r * 0.8); }
  else if (value === "map-exchange") labelBox(ctx, cx, cy, r, "M");
  else if (value === "map-flip") labelBox(ctx, cx, cy, r, "F");
}

function drawVerticals(ctx, x, y, columns, cellSize) {
  ctx.beginPath();
  for (const column of columns) {
    ctx.moveTo(x + column * cellSize, y);
    ctx.lineTo(x + column * cellSize, y + cellSize);
  }
  ctx.stroke();
}

function line(ctx, x1, y1, x2, y2) { ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); }
function poly(ctx, pts, cx, cy, r) { ctx.beginPath(); pts.forEach(([x, y], i) => i ? ctx.lineTo(cx + x * r, cy + y * r) : ctx.moveTo(cx + x * r, cy + y * r)); ctx.stroke(); }
function circle(ctx, cx, cy, r) { ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke(); }
function arc(ctx, cx, cy, r, a1, a2) { ctx.beginPath(); ctx.arc(cx, cy, r, a1, a2); ctx.stroke(); }
function rect(ctx, cx, cy, w, h, fill = false) { ctx.beginPath(); ctx.rect(cx - w / 2, cy - h / 2, w, h); fill ? ctx.fill() : ctx.stroke(); }
function dot(ctx, cx, cy, r) { ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill(); }
function dots(ctx, cx, cy, r, pts) { pts.forEach(([x, y]) => dot(ctx, cx + x * r, cy + y * r, r * 0.12)); }
function triangle(ctx, cx, cy, r) { poly(ctx, [[0, -0.9], [-0.82, 0.65], [0.82, 0.65], [0, -0.9]], cx, cy, r); }
function diamond(ctx, cx, cy, r) { poly(ctx, [[0, -0.9], [0.85, 0], [0, 0.9], [-0.85, 0], [0, -0.9]], cx, cy, r); }
function chevron(ctx, cx, cy, r, d) { poly(ctx, [[-0.75, -0.25 * d], [0, 0.55 * d], [0.75, -0.25 * d]], cx, cy, r); }
function doubleLine(ctx, cx, cy, r) { line(ctx, cx - r, cy - r * 0.28, cx + r, cy - r * 0.28); line(ctx, cx - r, cy + r * 0.28, cx + r, cy + r * 0.28); }
function dashed(ctx, cx, cy, r, vertical = false) { ctx.save(); ctx.setLineDash([r * 0.35, r * 0.22]); vertical ? line(ctx, cx, cy - r, cx, cy + r) : line(ctx, cx - r, cy, cx + r, cy); ctx.restore(); }
function dashedDouble(ctx, cx, cy, r) { ctx.save(); ctx.setLineDash([r * 0.3, r * 0.2]); doubleLine(ctx, cx, cy, r); ctx.restore(); }
function dashedRect(ctx, cx, cy, r) { ctx.save(); ctx.setLineDash([r * 0.28, r * 0.18]); rect(ctx, cx, cy, r * 1.45, r * 1.1); ctx.restore(); }
function ticks(ctx, cx, cy, r, vertical = false) { vertical ? line(ctx, cx, cy - r, cx, cy + r) : line(ctx, cx - r, cy, cx + r, cy); for (const t of [-0.55, 0, 0.55]) vertical ? line(ctx, cx, cy + t * r, cx + r * 0.45, cy + (t - 0.18) * r) : line(ctx, cx + t * r, cy, cx + (t - 0.18) * r, cy + r * 0.45); }
function hatchBox(ctx, cx, cy, r) { rect(ctx, cx, cy, r * 1.45, r * 1.1); for (const x of [-0.45, 0, 0.45]) line(ctx, cx + x * r, cy - r * 0.55, cx + (x + 0.45) * r, cy + r * 0.55); }
function waves(ctx, cx, cy, r, count) { for (let row = 0; row < count; row += 1) { ctx.beginPath(); for (let i = 0; i <= 20; i += 1) { const x = -r + i * r / 10; const y = (row - (count - 1) / 2) * r * 0.45 + Math.sin(i / 20 * Math.PI * 4) * r * 0.18; i ? ctx.lineTo(cx + x, cy + y) : ctx.moveTo(cx + x, cy + y); } ctx.stroke(); } }
function sinuous(ctx, cx, cy, r) { ctx.beginPath(); for (let i = 0; i <= 24; i += 1) { const y = -r + i * r / 12; const x = Math.sin(i / 24 * Math.PI * 3) * r * 0.35; i ? ctx.lineTo(cx + x, cy + y) : ctx.moveTo(cx + x, cy + y); } ctx.stroke(); }
function marsh(ctx, cx, cy, r, count) { for (let i = 0; i < count; i += 1) line(ctx, cx - r * 0.75, cy + (i - (count - 1) / 2) * r * 0.45, cx + r * 0.75, cy + (i - (count - 1) / 2) * r * 0.45); }
function tree(ctx, cx, cy, r, group = false) { circle(ctx, cx, cy - r * 0.25, r * 0.42); line(ctx, cx, cy + r * 0.15, cx, cy + r * 0.85); if (group) { circle(ctx, cx - r * 0.55, cy + r * 0.15, r * 0.28); circle(ctx, cx + r * 0.55, cy + r * 0.15, r * 0.28); } }
function wall(ctx, cx, cy, r) { line(ctx, cx - r, cy, cx + r, cy); for (const x of [-0.55, 0, 0.55]) line(ctx, cx + x * r, cy - r * 0.28, cx + x * r, cy + r * 0.28); }
function fence(ctx, cx, cy, r) { line(ctx, cx - r, cy, cx + r, cy); for (const x of [-0.55, 0, 0.55]) line(ctx, cx + x * r, cy, cx + x * r, cy - r * 0.48); }
function crossing(ctx, cx, cy, r) { line(ctx, cx - r * 0.8, cy - r * 0.8, cx + r * 0.8, cy + r * 0.8); line(ctx, cx - r * 0.8, cy + r * 0.8, cx + r * 0.8, cy - r * 0.8); }
function between(ctx, cx, cy, r) { circle(ctx, cx - r * 0.55, cy, r * 0.22); circle(ctx, cx + r * 0.55, cy, r * 0.22); line(ctx, cx - r * 0.25, cy, cx + r * 0.25, cy); }
function labelBox(ctx, cx, cy, r, text) { rect(ctx, cx, cy, r * 1.35, r); ctx.font = `${r * 0.85}px Arial`; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(String(text).slice(0, 2).toUpperCase(), cx, cy, r * 1.2); }
function arrow(ctx, cx, cy, r, degrees, both = false) { const a = degrees * Math.PI / 180; const ends = [[cx - Math.cos(a) * r * 0.85, cy - Math.sin(a) * r * 0.85], [cx + Math.cos(a) * r * 0.85, cy + Math.sin(a) * r * 0.85]]; line(ctx, ends[0][0], ends[0][1], ends[1][0], ends[1][1]); for (const [x, y, angle] of both ? [[...ends[0], a + Math.PI], [...ends[1], a]] : [[...ends[1], a]]) { line(ctx, x, y, x - Math.cos(angle - 0.7) * r * 0.35, y - Math.sin(angle - 0.7) * r * 0.35); line(ctx, x, y, x - Math.cos(angle + 0.7) * r * 0.35, y - Math.sin(angle + 0.7) * r * 0.35); } }

function descriptionValue(control, box) {
  const desc = control.descriptions?.find(description => description.box === box);
  if (box === "F" && desc?.text && !desc?.ref) {
    return COLUMN_F_TEXT_PREFIX + desc.text;
  }
  return normalizeIscdSymbolId(desc?.ref || desc?.text || "");
}

function descriptionKindFromCourse(eventModel, selectedCourseId) {
  if (selectedCourseId === "all") return eventModel.event?.allControls?.descriptionKind || "symbols";
  const course = getCourse(eventModel, selectedCourseId);
  return course?.options?.descriptionKind || eventModel.event?.allControls?.descriptionKind || "symbols";
}

function descriptionTargetForNewSpecial(eventModel, selectedCourseId) {
  if (selectedCourseId === "all") return "all";
  const course = getCourse(eventModel, selectedCourseId);
  return course ? course.id : "all";
}

function bestDescriptionColumns(rowCount, heightCells) {
  if (rowCount <= heightCells) return 1;
  return Math.min(4, Math.max(1, Math.ceil(rowCount / heightCells)));
}

function formatMeters(length) {
  if (!Number.isFinite(length) || length <= 0) return "";
  if (length >= 1000) return `${(length / 1000).toFixed(1)} km`;
  return `${Math.round(length)} m`;
}

function controlKindText(kind, language = currentAppLanguage()) {
  const normalized = String(kind || "Control");
  return FALLBACK_CONTROL_KIND_TEXT[normalizeDescriptionLanguage(language)]?.[normalized]
    || normalized.replace(/-/g, " ");
}

function defaultFeatureForControl(kind) {
  if (kind === "start") return "start";
  if (kind === "finish") return "";
  if (kind === "crossing-point") return "13.3";
  if (kind === "map-exchange") return "13.5";
  if (kind === "map-issue") return "13.6";
  return "";
}

function normalizeIscdSymbolId(value) {
  const id = String(value || "");
  return LEGACY_ID_ALIASES[id] || id;
}

function directiveSymbol(control) {
  const description = control.descriptions?.find(item => item.box === "all" || item.box === "D" || item.box === "");
  if (description?.ref) return normalizeIscdSymbolId(description.ref);
  if (control.kind === "finish") return "14.3";
  if (control.kind === "crossing-point") return "13.3";
  if (control.kind === "map-issue") return "13.6";
  return "";
}

function directiveText(symbolId, distance, language) {
  const distanceText = distance ? `${distance} ` : "";
  return formatSymbolText(symbolId, distanceText, `${symbolText(symbolId, symbolId, language)} ${distance}`.trim(), language);
}

function symbolText(id, fallback = "", language = currentAppLanguage()) {
  const normalizedLanguage = normalizeDescriptionLanguage(language);
  const symbol = symbolDb?.symbols.get(id);
  const localized = hasLocalizedValue(symbol?.texts, normalizedLanguage)
    ? localizedText(symbol.texts, normalizedLanguage)
    : hasLocalizedValue(symbol?.names, normalizedLanguage)
    ? localizedText(symbol.names, normalizedLanguage)
    : "";
  const englishFallback = localizedSymbolText(symbol, "en") || localizedSymbolName(symbol, "en") || fallback;
  return localized
    || FALLBACK_SYMBOL_TEXT[normalizedLanguage]?.[id]
    || FALLBACK_SYMBOL_TEXT.en?.[id]
    || localizedFallbackLabel(englishFallback, normalizedLanguage);
}

function formatSymbolText(id, values, fallback = "", language = currentAppLanguage()) {
  const template = symbolText(id, fallback, language);
  const parts = Array.isArray(values) ? values : [values];
  return parts.reduce((text, value, index) => text.replace(new RegExp(`\\{${index}\\}`, "g"), String(value ?? "")), template).trim();
}

function localizedFallbackLabel(label, language = currentAppLanguage()) {
  const normalizedLanguage = normalizeDescriptionLanguage(language);
  const value = String(label || "");
  return FALLBACK_ISCD_LABEL_TRANSLATIONS[normalizedLanguage]?.[value] || value;
}

function hasLocalizedValue(values = {}, preferredLanguage = currentAppLanguage()) {
  const normalizedLanguage = normalizeDescriptionLanguage(preferredLanguage);
  if (normalizedLanguage === "en") return !!localizedText(values, "en");
  return languageFallbacks(normalizedLanguage).filter(language => language !== "en").some(language => !!values?.[language]);
}

function formatCourseLength(lengthMeters) {
  const value = Number(lengthMeters);
  if (!Number.isFinite(value) || value <= 0) return "";
  return `${(value / 1000).toFixed(1)} km`;
}

function formatCourseClimb(climbMeters) {
  const value = Number(climbMeters);
  if (!Number.isFinite(value) || value < 0) return "";
  return `${Math.round(value / 5) * 5} m`;
}

function formatDirectiveDistance(lengthMeters) {
  const value = Number(lengthMeters);
  if (!Number.isFinite(value) || value <= 0) return "";
  return `${Math.round(value / 10) * 10} m`;
}

function symbolOptionValue(column, symbol) {
  if (column === "F") {
    const columnFText = columnFTextForSymbolId(symbol.id);
    return columnFText ? COLUMN_F_TEXT_PREFIX + columnFText : symbol.id;
  }
  return symbol.id;
}

function symbolOptionLabel(column, symbol, language = currentAppLanguage()) {
  const label = localizedSymbolName(symbol, language) || symbol.id;
  const columnFText = column === "F" ? columnFTextForSymbolId(symbol.id) : "";
  return columnFText ? `${label}: ${columnFTextLabel(columnFText, language)}` : label;
}

function columnFTextForSymbolId(id) {
  return COLUMN_F_TEXT_SYMBOL_EXAMPLES[id] || "";
}

function normalizeColumnFText(value) {
  const text = String(value || "").trim();
  const unprefixed = text.startsWith(COLUMN_F_TEXT_PREFIX) ? text.slice(COLUMN_F_TEXT_PREFIX.length) : text;
  return COLUMN_F_TEXT_SYMBOL_EXAMPLES[normalizeIscdSymbolId(unprefixed)] || unprefixed.replace(/\s+/g, "");
}

function isColumnFTextValue(value) {
  const raw = String(value || "").trim();
  if (raw.startsWith(COLUMN_F_TEXT_PREFIX)) return true;
  const normalized = normalizeIscdSymbolId(raw);
  const existingSymbol = symbolDb?.symbols.get(normalized);
  if (existingSymbol && (existingSymbol.strokes || []).length) return false;
  const text = normalizeColumnFText(value);
  return /^[0-9]+(?:[.,][0-9]+)?m?(?:[xX/|][0-9]+(?:[.,][0-9]+)?m?)*$/.test(text);
}

function columnFTextLabel(value, language = currentAppLanguage()) {
  const text = normalizeColumnFText(value).replace(/x/gi, "\u00d7");
  return normalizeDescriptionLanguage(language) === "zh" ? `F栏文字 ${text}` : `Column F text ${text}`;
}

function parsePurplePenSymbols(text) {
  if (typeof DOMParser === "undefined") {
    return { symbols: new Map(), order: [], languages: FALLBACK_DESCRIPTION_LANGUAGES };
  }
  const doc = new DOMParser().parseFromString(text, "application/xml");
  const symbolLanguages = parseSymbolLanguages(doc);
  const usedLanguages = new Set();
  const symbols = new Map();
  const order = [];
  for (const node of doc.querySelectorAll("symbol")) {
    const symbol = {
      id: node.getAttribute("id") || "",
      kind: node.getAttribute("kind") || "",
      standards: (node.getAttribute("standard") || "").split(",").map(item => item.trim()).filter(Boolean),
      replacementId: node.getAttribute("replacement-id") || "",
      names: localizedTextMap(node, "name"),
      texts: localizedTextMap(node, "text"),
      strokes: []
    };
    for (const lang of [...Object.keys(symbol.names), ...Object.keys(symbol.texts)]) {
      usedLanguages.add(lang);
      const base = lang.split("-")[0];
      if (base) usedLanguages.add(base);
    }
    symbol.name = localizedText(symbol.names, "en") || node.getAttribute("id") || "";
    symbol.text = localizedText(symbol.texts, "en") || "";
    if (!symbol.id) continue;
    for (const child of [...node.children]) {
      const tag = child.localName;
      if (!["filled-circle", "circle", "polygon", "filled-polygon", "lines", "beziers", "filled-beziers"].includes(tag)) {
        continue;
      }
      symbol.strokes.push({
        kind: tag,
        thickness: numberAttr(child, "thickness", 0),
        radius: numberAttr(child, "radius", 0),
        corners: child.getAttribute("corners") || "round",
        ends: child.getAttribute("ends") || "round",
        points: [...child.children].filter(point => point.localName === "point").map(point => ({
          x: numberAttr(point, "x", 0),
          y: numberAttr(point, "y", 0)
        }))
      });
    }
    if (!symbols.has(symbol.id)) {
      order.push(symbol.id);
    }
    const existing = symbols.get(symbol.id);
    if (!existing || !symbolInDescriptionStandard(existing, DESCRIPTION_STANDARD) || symbolInDescriptionStandard(symbol, DESCRIPTION_STANDARD)) {
      symbols.set(symbol.id, symbol);
    }
  }
  return { symbols, order, languages: supportedSymbolLanguages(symbolLanguages, usedLanguages) };
}

function parseSymbolLanguages(doc) {
  const languages = [];
  const root = doc.documentElement;
  if (!root) return FALLBACK_DESCRIPTION_LANGUAGES;
  for (const child of [...root.children]) {
    if (child.localName !== "language") continue;
    const code = child.getAttribute("lang") || "";
    const label = child.textContent?.trim() || code;
    if (code) languages.push([code, label]);
  }
  return languages.length ? languages : FALLBACK_DESCRIPTION_LANGUAGES;
}

function supportedSymbolLanguages(languages, usedLanguages) {
  const seen = new Set();
  const supported = [];
  for (const [code, label] of languages || []) {
    const base = String(code || "").split("-")[0];
    if (!code || seen.has(code)) continue;
    if (code === "en" || usedLanguages.has(code) || (base && usedLanguages.has(base))) {
      supported.push([code, label || code]);
      seen.add(code);
    }
  }
  for (const code of [...usedLanguages].sort()) {
    if (!code || seen.has(code)) continue;
    supported.push([code, DESCRIPTION_LANGUAGE_LABELS[code] || code]);
    seen.add(code);
  }
  if (!seen.has("en")) supported.unshift(["en", "English"]);
  return supported.length ? supported : FALLBACK_DESCRIPTION_LANGUAGES;
}

function localizedSymbolName(symbol, language = currentAppLanguage()) {
  return localizedText(symbol?.names, language) || symbol?.name || "";
}

function localizedSymbolText(symbol, language = currentAppLanguage()) {
  return localizedText(symbol?.texts, language) || symbol?.text || "";
}

function localizedTextMap(node, tagName) {
  const values = {};
  for (const child of [...node.children]) {
    if (child.localName !== tagName) continue;
    const lang = child.getAttribute("lang") || "";
    const value = child.textContent?.trim() || "";
    if (lang && value) values[lang] = value;
  }
  return values;
}

function localizedText(values = {}, preferredLanguage = currentAppLanguage()) {
  for (const language of languageFallbacks(preferredLanguage)) {
    if (values[language]) return values[language];
  }
  return Object.entries(values).find(([language]) => language.startsWith("en"))?.[1]
    || Object.values(values)[0]
    || "";
}

function currentAppLanguage() {
  try {
    return localStorage.getItem("purplePenLanguage") || "en";
  }
  catch {
    return "en";
  }
}

function languageFallbacks(language) {
  if (language === "zh") {
    return ["zh-CN", "zh", "zh-TW", "zh-HK", "en"];
  }
  return [language, language.split("-")[0], "en"];
}

function symbolInStandard(symbol, standard) {
  return !symbol.standards?.length || symbol.standards.includes(standard);
}

function symbolInDescriptionStandard(symbol, standard) {
  return symbolInStandard(symbol, standard)
    || (standard === "2024" && symbolInStandard(symbol, "2018"));
}

function numberAttr(node, name, fallback = 0) {
  const value = Number(node.getAttribute(name));
  return Number.isFinite(value) ? value : fallback;
}

function drawXmlSymbol(ctx, symbol, cx, cy, radius) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(radius / 70, -radius / 70);
  for (const stroke of symbol.strokes || []) {
    if (symbol.id === "13.6" && isMapIssueExtraLeftDash(stroke)) {
      continue;
    }
    drawXmlStroke(ctx, stroke);
  }
  ctx.restore();
}

function descriptionColor(value) {
  const color = String(value || "black").trim();
  return DESCRIPTION_COLORS[color] || (isCssColorValue(color) ? color : DESCRIPTION_COLORS.black);
}

function isCssColorValue(color) {
  return /^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(color)
    || /^rgba?\(/i.test(color)
    || /^hsla?\(/i.test(color);
}

function isMapIssueExtraLeftDash(stroke) {
  const points = stroke?.points || [];
  if (stroke?.kind !== "lines" || points.length !== 2) return false;
  return (
    points[0].x === -760
    && points[0].y === 0
    && points[1].x === -660
    && points[1].y === 0
  ) || (
    points[0].x === -760
    && points[0].y === -50
    && points[1].x === -760
    && points[1].y === 50
  );
}

function drawXmlStroke(ctx, stroke) {
  const points = stroke.points || [];
  if (!points.length) return;
  ctx.lineWidth = stroke.thickness || 12.5;
  ctx.lineCap = stroke.ends === "flat" ? "butt" : "round";
  ctx.lineJoin = stroke.corners === "sharp" ? "miter" : "round";
  if (stroke.kind === "filled-circle") {
    ctx.beginPath();
    ctx.arc(points[0].x, points[0].y, stroke.radius, 0, Math.PI * 2);
    ctx.fill();
  }
  else if (stroke.kind === "circle") {
    ctx.beginPath();
    ctx.arc(points[0].x, points[0].y, stroke.radius, 0, Math.PI * 2);
    ctx.stroke();
  }
  else if (stroke.kind === "lines") {
    xmlPath(ctx, points, false, false);
    ctx.stroke();
  }
  else if (stroke.kind === "polygon") {
    xmlPath(ctx, points, true, false);
    ctx.stroke();
  }
  else if (stroke.kind === "filled-polygon") {
    xmlPath(ctx, points, true, false);
    ctx.fill("evenodd");
  }
  else if (stroke.kind === "beziers") {
    xmlPath(ctx, points, false, true);
    ctx.stroke();
  }
  else if (stroke.kind === "filled-beziers") {
    xmlPath(ctx, points, true, true);
    ctx.fill("evenodd");
  }
}

function xmlPath(ctx, points, closed, bezier) {
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  if (bezier) {
    for (let i = 1; i + 2 < points.length; i += 3) {
      ctx.bezierCurveTo(points[i].x, points[i].y, points[i + 1].x, points[i + 1].y, points[i + 2].x, points[i + 2].y);
    }
  }
  else {
    for (let i = 1; i < points.length; i += 1) {
      ctx.lineTo(points[i].x, points[i].y);
    }
  }
  if (closed) ctx.closePath();
}
