import { createControl, nextId } from "./event-model.js?v=20260729-85";
import { courseView, getCourse, naturalCode } from "./course-service.js?v=20260729-85";

export const MILITARY_COURSE_KIND = "military";

export function isMilitaryCourse(course) {
  return course?.kind === MILITARY_COURSE_KIND;
}

export function isScoreLikeCourse(course) {
  return ["score", MILITARY_COURSE_KIND].includes(course?.kind);
}

export function defaultMilitaryGrid(id = null, name = "") {
  return {
    id: Number(id) || null,
    name: String(name || ""),
    locations: [],
    spacingXcm: 1,
    spacingYcm: 1,
    lineWidthMm: 0.18,
    fontSizeMm: 1.8,
    startX: 0,
    startY: 0
  };
}

function militaryCourse(eventModel, courseOrId) {
  if (isMilitaryCourse(courseOrId)) return courseOrId;
  if (courseOrId === null || courseOrId === undefined || courseOrId === "all") return null;
  const course = getCourse(eventModel, Number(courseOrId));
  return isMilitaryCourse(course) ? course : null;
}

function normalizedMilitaryGrid(grid, fallbackId = null) {
  const id = Number(grid?.id) || Number(fallbackId) || null;
  return {
    ...defaultMilitaryGrid(id, grid?.name || (id ? `Grid ${id}` : "")),
    ...(grid || {}),
    id,
    name: String(grid?.name || (id ? `Grid ${id}` : ""))
  };
}

export function militaryGrids(eventModel) {
  const grids = Array.isArray(eventModel?.event?.militaryGrids)
    ? eventModel.event.militaryGrids
    : [];
  if (grids.length) {
    return grids.map((grid, index) => normalizedMilitaryGrid(grid, index + 1));
  }
  const legacy = eventModel?.event?.militaryGrid;
  return militaryGridBounds(legacy)
    ? [normalizedMilitaryGrid(legacy, 1)]
    : [];
}

export function ensureMilitaryGrids(eventModel) {
  if (!eventModel) return [];
  eventModel.event ||= {};
  const existing = Array.isArray(eventModel.event.militaryGrids)
    ? eventModel.event.militaryGrids
    : [];
  eventModel.event.militaryGrids = existing.map((grid, index) => normalizedMilitaryGrid(grid, index + 1));
  let nextGridId = eventModel.event.militaryGrids.reduce((max, grid) => Math.max(max, Number(grid.id) || 0), 0) + 1;
  const legacyEventGrid = eventModel.event.militaryGrid;
  if (militaryGridBounds(legacyEventGrid)) {
    const grid = normalizedMilitaryGrid(legacyEventGrid, nextGridId++);
    if (!eventModel.event.militaryGrids.some(item => Number(item.id) === Number(grid.id))) {
      eventModel.event.militaryGrids.push(grid);
    }
    const ownerCourse = getCourse(eventModel, Number(legacyEventGrid.courseId))
      || (eventModel.courses || []).find(isMilitaryCourse);
    if (ownerCourse) ensureMilitarySettings(ownerCourse).gridId ||= grid.id;
  }
  eventModel.event.militaryGrid = defaultMilitaryGrid();
  for (const course of (eventModel.courses || []).filter(isMilitaryCourse)) {
    const settings = ensureMilitarySettings(course);
    if (militaryGridBounds(settings.grid) && !(Number(settings.gridId) > 0)) {
      const grid = normalizedMilitaryGrid(settings.grid, nextGridId++);
      grid.name ||= `Grid ${grid.id}`;
      eventModel.event.militaryGrids.push(grid);
      settings.gridId = grid.id;
    }
    settings.grid = defaultMilitaryGrid();
  }
  return eventModel.event.militaryGrids;
}

export function addMilitaryGrid(eventModel, courseId = null, name = "") {
  const grids = ensureMilitaryGrids(eventModel);
  const id = grids.reduce((max, grid) => Math.max(max, Number(grid.id) || 0), 0) + 1;
  const grid = defaultMilitaryGrid(id, name || `Grid ${id}`);
  grids.push(grid);
  const course = militaryCourse(eventModel, courseId);
  if (course) ensureMilitarySettings(course).gridId = id;
  return grid;
}

export function removeMilitaryGrid(eventModel, gridId) {
  const id = Number(gridId);
  const grids = ensureMilitaryGrids(eventModel);
  const index = grids.findIndex(grid => Number(grid.id) === id);
  if (index < 0) return false;
  grids.splice(index, 1);
  for (const course of (eventModel.courses || []).filter(isMilitaryCourse)) {
    const settings = ensureMilitarySettings(course);
    if (Number(settings.gridId) === id) settings.gridId = null;
  }
  return true;
}

export function setMilitaryCourseGrid(eventModel, courseId, gridId = null) {
  const course = militaryCourse(eventModel, courseId);
  if (!course) return false;
  const id = Number(gridId) || null;
  if (id && !ensureMilitaryGrids(eventModel).some(grid => Number(grid.id) === id)) return false;
  ensureMilitarySettings(course).gridId = id;
  return true;
}

export function militaryGrid(eventModel, courseOrId = null) {
  const grids = militaryGrids(eventModel);
  const course = militaryCourse(eventModel, courseOrId);
  if (!course) return grids[0] || defaultMilitaryGrid();
  const gridId = Number(course.options?.military?.gridId) || null;
  return grids.find(grid => Number(grid.id) === gridId) || defaultMilitaryGrid();
}

export function ensureMilitaryGrid(eventModel, courseId = null, gridId = null) {
  const grids = ensureMilitaryGrids(eventModel);
  const course = militaryCourse(eventModel, courseId);
  let id = Number(gridId) || Number(course?.options?.military?.gridId) || null;
  let grid = grids.find(item => Number(item.id) === id);
  if (!grid) {
    grid = addMilitaryGrid(eventModel, course?.id || null);
    id = grid.id;
  }
  if (course) ensureMilitarySettings(course).gridId = id;
  return grid;
}

export function militaryGridBelongsToCourse(eventModel, courseOrId) {
  const course = militaryCourse(eventModel, courseOrId);
  return !!course && !!militaryGridBounds(militaryGrid(eventModel, course));
}

// Kept for older callers and files created by the first military-course build.
export function ensureMilitarySettings(course) {
  if (!course) return null;
  course.options ||= {};
  course.options.military ||= { grid: defaultMilitaryGrid(), gridId: null, timeWindows: [], windowOrder: [] };
  course.options.military.grid = { ...defaultMilitaryGrid(), ...(course.options.military.grid || {}) };
  course.options.military.gridId = Number(course.options.military.gridId) || null;
  course.options.military.timeWindows = Array.isArray(course.options.military.timeWindows) ? course.options.military.timeWindows : [];
  course.options.military.windowOrder = normalizedMilitaryWindowOrder(course.options.military.windowOrder);
  return course.options.military;
}

export function militarySettings(course) {
  const current = course?.options?.military || {};
  return {
    grid: { ...defaultMilitaryGrid(), ...(current.grid || {}) },
    gridId: Number(current.gridId) || null,
    timeWindows: Array.isArray(current.timeWindows) ? current.timeWindows : [],
    windowOrder: normalizedMilitaryWindowOrder(current.windowOrder)
  };
}

function normalizedMilitaryWindowOrder(order) {
  return [...new Set((Array.isArray(order) ? order : [])
    .map(value => Number(value))
    .filter(value => Number.isInteger(value) && value > 0))];
}

export function orderedMilitaryWindowRows(rows = [], course = null) {
  const windows = [...(rows || [])]
    .filter(row => row?.control?.kind === "normal" && row.courseControl?.timeWindow)
    .sort((a, b) => naturalCode(a.control?.code || String(a.control?.id || ""), b.control?.code || String(b.control?.id || ""))
      || (Number(a.courseControl?.id) || 0) - (Number(b.courseControl?.id) || 0));
  const effectiveCourse = course || windows[0]?.course || null;
  const explicitOrder = normalizedMilitaryWindowOrder(effectiveCourse?.options?.military?.windowOrder);
  if (!explicitOrder.length) return windows;
  const byCourseControl = new Map(windows.map(row => [Number(row.courseControl.id), row]));
  const ordered = explicitOrder.map(id => byCourseControl.get(id)).filter(Boolean);
  const included = new Set(ordered.map(row => Number(row.courseControl.id)));
  return [...ordered, ...windows.filter(row => !included.has(Number(row.courseControl.id)))];
}

export function militaryGridBounds(grid) {
  const points = Array.isArray(grid?.locations) ? grid.locations : [];
  if (points.length < 3) return null;
  const xs = points.map(point => Number(point.x) || 0);
  const ys = points.map(point => Number(point.y) || 0);
  const left = Math.min(...xs);
  const right = Math.max(...xs);
  const bottom = Math.min(...ys);
  const top = Math.max(...ys);
  return { left, right, bottom, top, width: right - left, height: top - bottom };
}

export function militaryGridSpacingMap(eventModel, axis = "x", courseOrId = null) {
  const grid = militaryGrid(eventModel, courseOrId);
  const centimeters = Math.max(0.01, Number(axis === "y" ? grid.spacingYcm : grid.spacingXcm) || 1);
  const mapScale = Math.max(1, Number(eventModel?.event?.map?.scale) || 15000);
  return centimeters / 100 * mapScale;
}

export function militaryWindowCoordinates(eventModel, windowPoint, courseOrId = null) {
  const grid = militaryGrid(eventModel, courseOrId);
  if (courseOrId !== null && !militaryGridBelongsToCourse(eventModel, courseOrId)) {
    return { y: null, x: null };
  }
  const bounds = militaryGridBounds(grid);
  const location = windowPoint?.location || { x: 0, y: 0 };
  if (!bounds) return { y: null, x: null };
  const spacingX = militaryGridSpacingMap(eventModel, "x", courseOrId);
  const spacingY = militaryGridSpacingMap(eventModel, "y", courseOrId);
  return {
    y: Number(grid.startY || 0) + (Number(location.y) - bounds.bottom) / spacingY,
    x: Number(grid.startX || 0) + (Number(location.x) - bounds.left) / spacingX
  };
}

export function formatMilitaryCoordinate(value) {
  if (!Number.isFinite(Number(value))) return "—";
  const rounded = Math.round(Number(value) * 100) / 100;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
}

export function militaryTimeWindowRows(eventModel, courseId) {
  if (!courseId || courseId === "all") return [];
  const course = getCourse(eventModel, courseId);
  return orderedMilitaryWindowRows(courseView(eventModel, courseId, { allBranches: true }), course);
}

export function moveMilitaryTimeWindow(eventModel, courseId, courseControlId, direction) {
  const course = getCourse(eventModel, courseId);
  if (!course || course.kind !== MILITARY_COURSE_KIND) return false;
  const rows = militaryTimeWindowRows(eventModel, course.id);
  const index = rows.findIndex(row => Number(row.courseControl?.id) === Number(courseControlId));
  const offset = Number(direction) < 0 ? -1 : Number(direction) > 0 ? 1 : 0;
  const targetIndex = index + offset;
  if (!offset || index < 0 || targetIndex < 0 || targetIndex >= rows.length) return false;
  const order = rows.map(row => Number(row.courseControl.id));
  [order[index], order[targetIndex]] = [order[targetIndex], order[index]];
  ensureMilitarySettings(course).windowOrder = order;
  return true;
}

export function militaryWindowDescriptionRows(eventModel, rows = [], language = "") {
  const windows = orderedMilitaryWindowRows(rows);
  if (!windows.length) return [];
  const effectiveLanguage = language || eventModel?.event?.descriptions?.lang || "en";
  const chinese = String(effectiveLanguage).toLowerCase().startsWith("zh");
  return [
    { kind: "military-window-section", text: chinese ? "时间窗口点" : "Time-window points" },
    { kind: "military-window-header", boxes: chinese ? ["时间窗口", "坐标（纵，横）", "分数"] : ["Time window", "Coordinates (Y, X)", "Score"] },
    ...windows.map(row => {
      const coordinates = militaryWindowCoordinates(eventModel, row.control, row.course);
      const startTime = row.courseControl.windowStartTime || "";
      const endTime = row.courseControl.windowEndTime || "";
      const coordinateY = formatMilitaryCoordinate(coordinates.y);
      const coordinateX = formatMilitaryCoordinate(coordinates.x);
      return {
        kind: "military-window",
        control: row.control,
        courseControl: row.courseControl,
        startTime,
        endTime,
        timeRange: `${startTime} - ${endTime}`,
        coordinateY,
        coordinateX,
        coordinates: `(${coordinateY}, ${coordinateX})`,
        score: String(Math.max(0, Number(row.courseControl.points) || 0))
      };
    })
  ];
}

export function migrateLegacyMilitaryData(eventModel) {
  if (!eventModel) return eventModel;
  ensureMilitaryGrids(eventModel);
  for (const control of eventModel.controls || []) {
    if (control.kind !== "time-window") continue;
    control.kind = "normal";
    for (const courseControl of eventModel.courseControls || []) {
      if (Number(courseControl.control) !== Number(control.id)) continue;
      courseControl.timeWindow = true;
      courseControl.windowStartTime = control.startTime || "00:00";
      courseControl.windowEndTime = control.endTime || "00:00";
    }
    delete control.startTime;
    delete control.endTime;
  }
  for (const course of eventModel.courses || []) {
    const legacy = course?.options?.military?.timeWindows;
    if (!Array.isArray(legacy) || !legacy.length) continue;
    for (const item of legacy) {
      const control = createControl(nextId(eventModel.controls), "normal", item.location, "");
      control.code = uniqueWindowCode(eventModel, item.code, control.id) || `W${control.id}`;
      eventModel.controls.push(control);
      appendLegacyWindowToCourse(eventModel, course, control.id, item);
    }
    course.options.military.timeWindows = [];
  }
  return eventModel;
}

function uniqueWindowCode(eventModel, preferred, controlId) {
  const value = String(preferred || "").trim();
  if (!value) return eventModel.controls.find(control => control.id === controlId)?.code || "";
  const duplicate = eventModel.controls.some(control => control.id !== controlId && String(control.code || "").trim().toUpperCase() === value.toUpperCase());
  return duplicate ? eventModel.controls.find(control => control.id === controlId)?.code || "" : value;
}

function appendLegacyWindowToCourse(eventModel, course, controlId, windowData = {}) {
  const courseControl = {
    id: nextId(eventModel.courseControls), control: controlId, nextCourseControl: null,
    variation: "", variationEnd: null, variationCourseControls: [], mapExchange: false, mapFlip: false,
    points: Number(windowData.points) || 0,
    timeWindow: true, windowStartTime: windowData.startTime || "00:00", windowEndTime: windowData.endTime || "00:00",
    teamRole: "mandatory", numberLocation: null, descTextBefore: "", descTextAfter: ""
  };
  eventModel.courseControls.push(courseControl);
  if (!course.firstCourseControl) {
    course.firstCourseControl = courseControl.id;
    return;
  }
  const seen = new Set();
  let current = eventModel.courseControls.find(item => item.id === course.firstCourseControl);
  while (current?.nextCourseControl && !seen.has(current.id)) {
    seen.add(current.id);
    current = eventModel.courseControls.find(item => item.id === current.nextCourseControl);
  }
  if (current) current.nextCourseControl = courseControl.id;
}
