import {
  createControl,
  createCourse,
  createCourseControl,
  createSpecial,
  findById,
  nextId
} from "./event-model.js";
import {
  controlsUsedByCourse,
  courseView,
  getControl,
  getCourse,
  getCourseControl,
  sortedCourses
} from "./course-service.js";

export function addControlAt(eventModel, kind, location, selectedCourseId = null, options = {}) {
  const coursePlacement = controlCoursePlacement(kind, eventModel, selectedCourseId);
  const id = nextId(eventModel.controls);
  const code = kind === "normal" ? nextAvailableCode(eventModel) : "";
  const control = createControl(id, kind, location, code);
  if (kind === "crossing-point") {
    control.orientation = options.orientation ?? 0;
  }
  if (kind === "map-issue") {
    control.mapIssueLocation = options.mapIssueLocation || "beginning";
    control.descriptions.push({ box: "all", ref: "13.6", text: "" });
  }
  eventModel.controls.push(control);

  if (selectedCourseId && selectedCourseId !== "all") {
    appendControlToCourse(eventModel, Number(selectedCourseId), control.id, {
      mapExchange: kind === "map-exchange",
      mapFlip: !!options.mapFlip,
      afterCourseControl: coursePlacement ? null : options.afterCourseControl,
      placement: coursePlacement
    });
  }

  return { type: "control", id: control.id };
}

export function addExistingControlToCourse(eventModel, courseId, controlId, options = {}) {
  const control = getControl(eventModel, controlId);
  const coursePlacement = controlCoursePlacement(control?.kind, eventModel, courseId);
  const courseControl = appendControlToCourse(eventModel, Number(courseId), Number(controlId), {
    afterCourseControl: coursePlacement ? null : options.afterCourseControl,
    placement: coursePlacement,
    beforeFinish: options.beforeFinish
  });
  return courseControl ? { type: "control", id: Number(controlId) } : null;
}

export function addSpecialAt(eventModel, kind, location, options = {}) {
  const special = createSpecial(nextId(eventModel.specials), kind, location);
  if (options.locations) {
    special.locations = options.locations.map(point => ({ x: point.x, y: point.y }));
  }
  if (options.numColumns) {
    special.numColumns = Math.max(1, Number(options.numColumns) || 1);
  }
  if (options.cellSize) {
    special.cellSize = Math.max(0.1, Number(options.cellSize) || special.cellSize || 6);
  }
  if (options.descriptionKind) {
    special.descriptionKind = options.descriptionKind;
  }
  if (options.courses) {
    special.courses = options.courses.map(course => ({ ...course }));
    special.allCourses = false;
  }
  if (options.allCourses !== undefined) {
    special.allCourses = !!options.allCourses;
  }
  if (options.text) {
    special.text = options.text;
  }
  if (options.color) {
    special.color = options.color;
  }
  if (options.font) {
    special.font = { ...special.font, ...options.font };
  }
  if (options.imageData) {
    special.imageData = options.imageData;
  }
  eventModel.specials.push(special);
  return { type: "special", id: special.id };
}

export function replaceSpecial(eventModel, specialId, replacement) {
  const index = eventModel.specials.findIndex(special => Number(special.id) === Number(specialId));
  if (index >= 0) {
    eventModel.specials[index] = replacement;
  }
}

export function appendControlToCourse(eventModel, courseId, controlId, options = {}) {
  const course = getCourse(eventModel, courseId);
  if (!course) {
    return null;
  }
  const newCourseControl = createCourseControl(nextId(eventModel.courseControls), controlId, null);
  newCourseControl.mapExchange = !!options.mapExchange;
  newCourseControl.mapFlip = !!options.mapFlip;
  eventModel.courseControls.push(newCourseControl);

  if (!course.firstCourseControl) {
    course.firstCourseControl = newCourseControl.id;
    return newCourseControl;
  }

  if (options.placement === "beginning" || options.placement === "after-map-issue") {
    const first = getCourseControl(eventModel, course.firstCourseControl);
    if (options.placement === "after-map-issue" && first && getControl(eventModel, first.control)?.kind === "map-issue") {
      newCourseControl.nextCourseControl = first.nextCourseControl || null;
      first.nextCourseControl = newCourseControl.id;
    }
    else {
      newCourseControl.nextCourseControl = course.firstCourseControl;
      course.firstCourseControl = newCourseControl.id;
    }
    return newCourseControl;
  }

  if (options.placement === "end") {
    const ids = courseView(eventModel, courseId, { allBranches: false })
      .map(row => row.courseControl.id)
      .filter(id => id !== newCourseControl.id);
    const last = ids.map(id => getCourseControl(eventModel, id)).filter(Boolean).at(-1);
    if (last) {
      last.nextCourseControl = newCourseControl.id;
    }
    else {
      course.firstCourseControl = newCourseControl.id;
    }
    return newCourseControl;
  }

  const insertAfter = options.afterCourseControl ? getCourseControl(eventModel, options.afterCourseControl) : null;
  if (insertAfter && courseView(eventModel, courseId, { allBranches: true }).some(row => row.courseControl.id === insertAfter.id)) {
    newCourseControl.nextCourseControl = insertAfter.nextCourseControl || null;
    insertAfter.nextCourseControl = newCourseControl.id;
    return newCourseControl;
  }

  const ids = courseView(eventModel, courseId, { allBranches: false })
    .map(row => row.courseControl.id)
    .filter(id => id !== newCourseControl.id);
  const insertBeforeFinish = options.beforeFinish !== false;
  let previous = null;
  let before = null;

  if (insertBeforeFinish) {
    for (const id of ids) {
      const candidate = getCourseControl(eventModel, id);
      const control = getControl(eventModel, candidate.control);
      if (control?.kind === "finish") {
        before = candidate;
        break;
      }
      previous = candidate;
    }
  }

  if (before) {
    newCourseControl.nextCourseControl = before.id;
    if (previous) {
      previous.nextCourseControl = newCourseControl.id;
    }
    else {
      course.firstCourseControl = newCourseControl.id;
    }
  }
  else {
    const last = ids.map(id => getCourseControl(eventModel, id)).filter(Boolean).at(-1);
    if (last) {
      last.nextCourseControl = newCourseControl.id;
    }
  }
  return newCourseControl;
}

export function controlCoursePlacement(kind, eventModel, selectedCourseId) {
  if (!selectedCourseId || selectedCourseId === "all") {
    return null;
  }
  if (kind === "start" || kind === "finish") {
    if (courseHasControlKind(eventModel, selectedCourseId, kind)) {
      throw new Error(`This course already has a ${kind === "start" ? "start" : "finish"}.`);
    }
    return kind === "finish" ? "end" : "after-map-issue";
  }
  if (kind === "map-issue") {
    return "beginning";
  }
  return null;
}

function courseHasControlKind(eventModel, courseId, kind) {
  return courseView(eventModel, courseId, { allBranches: true })
    .some(row => row.control?.kind === kind);
}

export function moveSelection(eventModel, selection, location) {
  if (!selection) return;
  if (selection.type === "control") {
    const control = getControl(eventModel, selection.id);
    if (control) {
      control.location = { x: location.x, y: location.y };
    }
  }
  else if (selection.type === "special") {
    const special = findById(eventModel.specials, selection.id);
    if (special && special.locations.length) {
      const first = special.locations[0];
      const dx = location.x - first.x;
      const dy = location.y - first.y;
      special.locations = special.locations.map(point => ({ x: point.x + dx, y: point.y + dy }));
    }
  }
}

export function deleteSelection(eventModel, selection, options = {}) {
  if (!selection) return null;
  if (selection.type === "control") {
    if (!removeControlFromCourse(eventModel, selection.id, options.selectedCourseId)) {
      removeControl(eventModel, selection.id);
    }
  }
  else if (selection.type === "course") {
    removeCourse(eventModel, selection.id);
  }
  else if (selection.type === "special") {
    eventModel.specials = eventModel.specials.filter(special => special.id !== selection.id);
  }
  else if (selection.type === "course-control") {
    removeCourseControl(eventModel, selection.id);
  }
  else if (selection.type === "leg-gap") {
    const leg = eventModel.legs.find(candidate =>
      Number(candidate.startControl) === Number(selection.startControl)
      && Number(candidate.endControl) === Number(selection.endControl)
    );
    if (leg?.gaps) {
      leg.gaps.splice(selection.gapIndex, 1);
    }
  }
  return null;
}

export function removeControl(eventModel, controlId) {
  const id = Number(controlId);
  const courseControlIds = [];
  for (const course of eventModel.courses) {
    courseControlIds.push(...courseView(eventModel, course.id, { allBranches: true })
      .map(row => row.courseControl)
      .filter(courseControl => courseControl.control === id)
      .map(courseControl => courseControl.id));
  }
  for (const courseControlId of courseControlIds) {
    removeCourseControl(eventModel, courseControlId);
  }
  eventModel.controls = eventModel.controls.filter(control => control.id !== id);
  eventModel.courseControls = eventModel.courseControls.filter(courseControl => courseControl.control !== id);
  eventModel.legs = eventModel.legs.filter(leg => leg.startControl !== id && leg.endControl !== id);
}

export function removeControlFromCourse(eventModel, controlId, selectedCourseId) {
  if (!selectedCourseId || selectedCourseId === "all") return false;
  const row = courseView(eventModel, selectedCourseId, { allBranches: false })
    .find(candidate => Number(candidate.control?.id) === Number(controlId));
  if (!row?.courseControl) return false;
  removeCourseControl(eventModel, row.courseControl.id);
  return true;
}

export function removeCourse(eventModel, courseId) {
  const course = getCourse(eventModel, courseId);
  if (!course) return;
  const usedCourseControls = new Set(courseView(eventModel, course.id, { allBranches: true }).map(row => row.courseControl.id));
  eventModel.courses = eventModel.courses.filter(candidate => candidate.id !== Number(courseId));
  eventModel.courseControls = eventModel.courseControls.filter(courseControl => !usedCourseControls.has(courseControl.id));
  resequenceCourses(eventModel);
}

export function removeCourseControl(eventModel, courseControlId) {
  const id = Number(courseControlId);
  for (const course of eventModel.courses) {
    if (course.firstCourseControl === id) {
      course.firstCourseControl = getCourseControl(eventModel, id)?.nextCourseControl || null;
    }
  }
  for (const courseControl of eventModel.courseControls) {
    if (courseControl.nextCourseControl === id) {
      courseControl.nextCourseControl = getCourseControl(eventModel, id)?.nextCourseControl || null;
    }
    courseControl.variationCourseControls = courseControl.variationCourseControls.filter(candidate => candidate !== id);
    if (courseControl.variationEnd === id) {
      courseControl.variationEnd = null;
      courseControl.variation = "";
    }
  }
  eventModel.courseControls = eventModel.courseControls.filter(courseControl => courseControl.id !== id);
}

export function addCourse(eventModel, name, kind = "normal") {
  const course = createCourse(nextId(eventModel.courses), name, kind, eventModel.courses.length + 1);
  course.options.printScale = positiveMapScale(eventModel);
  const start = eventModel.controls.find(control => control.kind === "start");
  const finish = eventModel.controls.find(control => control.kind === "finish");
  if (start) {
    const startCourseControl = appendCourseControlRaw(eventModel, start.id);
    course.firstCourseControl = startCourseControl.id;
    if (finish) {
      const finishCourseControl = appendCourseControlRaw(eventModel, finish.id);
      startCourseControl.nextCourseControl = finishCourseControl.id;
    }
  }
  eventModel.courses.push(course);
  resequenceCourses(eventModel);
  return { type: "course", id: course.id };
}

function positiveMapScale(eventModel) {
  const scale = Number(eventModel?.event?.map?.scale);
  return Number.isFinite(scale) && scale > 0 ? scale : 15000;
}

export function duplicateCourse(eventModel, courseId, name) {
  const source = getCourse(eventModel, courseId);
  if (!source) return null;
  const clone = structuredClone(source);
  clone.id = nextId(eventModel.courses);
  clone.name = name || `${source.name} Copy`;
  clone.order = eventModel.courses.length + 1;

  const idMap = new Map();
  const sourceControls = courseView(eventModel, source.id, { allBranches: true }).map(row => row.courseControl);
  for (const sourceCourseControl of sourceControls) {
    const copied = structuredClone(sourceCourseControl);
    copied.id = nextId([...eventModel.courseControls, ...idMapValues(idMap)]);
    idMap.set(sourceCourseControl.id, copied);
  }
  for (const copied of idMap.values()) {
    copied.nextCourseControl = copied.nextCourseControl ? idMap.get(copied.nextCourseControl)?.id || null : null;
    copied.variationEnd = copied.variationEnd ? idMap.get(copied.variationEnd)?.id || null : null;
    copied.variationCourseControls = copied.variationCourseControls.map(id => idMap.get(id)?.id).filter(Boolean);
    eventModel.courseControls.push(copied);
  }
  clone.firstCourseControl = source.firstCourseControl ? idMap.get(source.firstCourseControl)?.id || null : null;
  eventModel.courses.push(clone);
  resequenceCourses(eventModel);
  return { type: "course", id: clone.id };
}

export function resequenceCourses(eventModel) {
  sortedCourses(eventModel).forEach((course, index) => {
    course.order = index + 1;
  });
}

export function autoNumberControls(eventModel, startCode = eventModel.event.numbering.start, disallowInvertible = eventModel.event.numbering.disallowInvertible) {
  let code = Number(startCode) || 31;
  for (const control of [...eventModel.controls].sort((a, b) => a.id - b.id)) {
    if (control.kind !== "normal") continue;
    while (disallowInvertible && isInvertibleCode(code)) {
      code += 1;
    }
    control.code = String(code);
    code += 1;
  }
  eventModel.event.numbering.start = Number(startCode) || 31;
  eventModel.event.numbering.disallowInvertible = !!disallowInvertible;
}

export function removeUnusedControls(eventModel) {
  const used = new Set();
  for (const course of eventModel.courses) {
    for (const id of controlsUsedByCourse(eventModel, course.id)) {
      used.add(id);
    }
  }
  const removed = eventModel.controls.filter(control => !used.has(control.id));
  eventModel.controls = eventModel.controls.filter(control => used.has(control.id));
  return removed.length;
}

export function moveAllControls(eventModel, dx, dy) {
  for (const control of eventModel.controls) {
    control.location = {
      x: control.location.x + dx,
      y: control.location.y + dy
    };
  }
  for (const special of eventModel.specials) {
    special.locations = special.locations.map(point => ({ x: point.x + dx, y: point.y + dy }));
  }
  for (const leg of eventModel.legs) {
    leg.bends = leg.bends.map(point => ({ x: point.x + dx, y: point.y + dy }));
    if (leg.flagging.point) {
      leg.flagging.point = { x: leg.flagging.point.x + dx, y: leg.flagging.point.y + dy };
    }
  }
}

export function updateControlDescription(control, box, ref, value = "") {
  const existing = control.descriptions.find(description => description.box === box);
  if (existing) {
    existing.ref = ref;
    existing.text = value;
  }
  else if (ref || value) {
    control.descriptions.push({ box, ref, text: value });
  }
  control.descriptions = control.descriptions.filter(description => description.ref || description.text);
}

export function setCourseOrder(eventModel, orderedIds) {
  orderedIds.forEach((id, index) => {
    const course = getCourse(eventModel, id);
    if (course) {
      course.order = index + 1;
    }
  });
}

function appendCourseControlRaw(eventModel, controlId) {
  const courseControl = createCourseControl(nextId(eventModel.courseControls), controlId, null);
  eventModel.courseControls.push(courseControl);
  return courseControl;
}

function nextAvailableCode(eventModel) {
  let code = Number(eventModel.event.numbering.start) || 31;
  const used = new Set(eventModel.controls.map(control => control.code).filter(Boolean));
  while (used.has(String(code)) || (eventModel.event.numbering.disallowInvertible && isInvertibleCode(code))) {
    code += 1;
  }
  return String(code);
}

function isInvertibleCode(code) {
  const text = String(code);
  const rotated = text.split("").reverse().map(ch => {
    if (ch === "6") return "9";
    if (ch === "9") return "6";
    if (["0", "1", "8"].includes(ch)) return ch;
    return "?";
  }).join("");
  return !rotated.includes("?") && rotated !== text;
}

function idMapValues(map) {
  return [...map.values()].map(value => ({ id: value.id }));
}
