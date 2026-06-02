import { findById } from "./event-model.js";

export function getControl(eventModel, id) {
  return findById(eventModel.controls, id);
}

export function getCourse(eventModel, id) {
  return findById(eventModel.courses, id);
}

export function getCourseControl(eventModel, id) {
  return findById(eventModel.courseControls, id);
}

export function sortedCourses(eventModel, includeHidden = true) {
  return [...eventModel.courses]
    .filter(course => includeHidden || !course.options?.hideFromReports)
    .sort((a, b) => (a.order || 0) - (b.order || 0) || a.name.localeCompare(b.name));
}

export function enumerateCourseControlIds(eventModel, courseId, options = {}) {
  const course = getCourse(eventModel, courseId);
  if (!course || !course.firstCourseControl) {
    return [];
  }

  const result = [];
  const seen = new Set();
  const allBranches = !!options.allBranches;
  const maxSteps = Math.max(1000, eventModel.courseControls.length * 20);
  let steps = 0;

  function visit(id, joinId = null, ignoreFirstSplit = false) {
    let currentId = id;
    let first = true;
    while (currentId && currentId !== joinId && steps++ < maxSteps) {
      const courseControl = getCourseControl(eventModel, currentId);
      if (!courseControl) {
        break;
      }

      const split = !!courseControl.variation;
      if (split && !(first && ignoreFirstSplit) && courseControl.variationCourseControls.length) {
        const branches = courseControl.variationCourseControls;
        if (allBranches) {
          for (const branchId of branches) {
            visit(branchId, courseControl.variationEnd, true);
          }
          currentId = courseControl.variation === "loop" ? courseControl.nextCourseControl : courseControl.variationEnd;
          first = false;
          continue;
        }

        const defaultBranch = branches[0] || currentId;
        if (defaultBranch !== currentId) {
          visit(defaultBranch, courseControl.variationEnd, true);
          currentId = courseControl.variationEnd;
          first = false;
          continue;
        }
      }

      if (!seen.has(currentId) || allBranches) {
        result.push(currentId);
        seen.add(currentId);
      }
      currentId = courseControl.nextCourseControl;
      first = false;
    }
  }

  visit(course.firstCourseControl);
  return result;
}

export function courseView(eventModel, courseId, options = {}) {
  if (courseId === "all") {
    return allControlsView(eventModel);
  }

  const course = getCourse(eventModel, courseId);
  if (!course) {
    return [];
  }

  let ordinal = course.firstControlOrdinal || 1;
  return enumerateCourseControlIds(eventModel, courseId, options)
    .map(courseControlId => {
      const courseControl = getCourseControl(eventModel, courseControlId);
      const control = getControl(eventModel, courseControl?.control);
      if (!courseControl || !control) {
        return null;
      }
      const displayOrdinal = control.kind === "normal" ? ordinal++ : "";
      return {
        course,
        courseControl,
        control,
        ordinal: displayOrdinal,
        label: labelForControl(course, courseControl, control, displayOrdinal)
      };
    })
    .filter(Boolean);
}

export function allControlsView(eventModel) {
  return [...eventModel.controls]
    .sort(compareControls)
    .map(control => ({
      course: null,
      courseControl: null,
      control,
      ordinal: "",
      label: control.code || controlKindLabel(control.kind)
    }));
}

export function courseLegs(eventModel, courseId, options = {}) {
  const course = getCourse(eventModel, courseId);
  if (!course || course.kind === "score") {
    return [];
  }

  const view = courseView(eventModel, courseId, options);
  const legs = [];
  for (let i = 0; i < view.length - 1; i += 1) {
    const from = view[i];
    const to = view[i + 1];
    if (!from.control || !to.control) {
      continue;
    }
    if (from.courseControl?.mapExchange && options.partOnly) {
      continue;
    }
    legs.push({
      from,
      to,
      leg: findLeg(eventModel, from.control.id, to.control.id),
      length: legLength(eventModel, from.control.id, to.control.id)
    });
  }
  return legs;
}

export function findLeg(eventModel, startControlId, endControlId) {
  return eventModel.legs.find(leg =>
    Number(leg.startControl) === Number(startControlId) &&
    Number(leg.endControl) === Number(endControlId)
  ) || null;
}

export function legPath(eventModel, startControlId, endControlId) {
  const start = getControl(eventModel, startControlId);
  const end = getControl(eventModel, endControlId);
  if (!start || !end) {
    return [];
  }
  const leg = findLeg(eventModel, startControlId, endControlId);
  return [start.location, ...(leg?.bends || []), end.location];
}

export function legLength(eventModel, startControlId, endControlId) {
  const path = legPath(eventModel, startControlId, endControlId);
  let length = 0;
  for (let i = 0; i < path.length - 1; i += 1) {
    length += distance(path[i], path[i + 1]);
  }
  return length;
}

export function courseLength(eventModel, courseId) {
  const course = getCourse(eventModel, courseId);
  if (!course) {
    return 0;
  }
  if (course.options?.courseLength) {
    return course.options.courseLength;
  }
  return courseLegs(eventModel, courseId).reduce((sum, leg) => sum + leg.length, 0);
}

export function controlsUsedByCourse(eventModel, courseId) {
  return new Set(courseView(eventModel, courseId, { allBranches: true }).map(row => row.control.id));
}

export function coursesUsingControl(eventModel, controlId) {
  return sortedCourses(eventModel)
    .filter(course => controlsUsedByCourse(eventModel, course.id).has(Number(controlId)));
}

export function eventBounds(eventModel) {
  const points = [];
  for (const control of eventModel.controls) {
    points.push(control.location);
  }
  for (const special of eventModel.specials) {
    points.push(...(special.locations || []));
  }

  if (eventModel.event.printArea && !eventModel.event.printArea.automatic) {
    const area = eventModel.event.printArea;
    points.push({ x: area.left, y: area.top }, { x: area.right, y: area.bottom });
  }
  for (const course of eventModel.courses || []) {
    if (course.printArea && !course.printArea.automatic) {
      points.push({ x: course.printArea.left, y: course.printArea.top }, { x: course.printArea.right, y: course.printArea.bottom });
    }
    for (const partArea of course.partPrintAreas || []) {
      if (partArea.area && !partArea.area.automatic) {
        points.push({ x: partArea.area.left, y: partArea.area.top }, { x: partArea.area.right, y: partArea.area.bottom });
      }
    }
  }

  if (!points.length) {
    return { left: -100, right: 100, top: 100, bottom: -100, width: 200, height: 200 };
  }

  let left = Infinity;
  let right = -Infinity;
  let top = -Infinity;
  let bottom = Infinity;
  for (const point of points) {
    left = Math.min(left, point.x);
    right = Math.max(right, point.x);
    top = Math.max(top, point.y);
    bottom = Math.min(bottom, point.y);
  }

  const padding = Math.max(20, Math.max(right - left, top - bottom) * 0.12);
  left -= padding;
  right += padding;
  top += padding;
  bottom -= padding;
  return {
    left,
    right,
    top,
    bottom,
    width: Math.max(1, right - left),
    height: Math.max(1, top - bottom)
  };
}

export function createCourseSummary(eventModel) {
  const rows = sortedCourses(eventModel).map(course => {
    const controls = courseView(eventModel, course.id).filter(row => row.control.kind === "normal").length;
    return {
      course: course.name,
      kind: course.kind,
      controls,
      length: courseLength(eventModel, course.id),
      climb: course.options?.climb ?? -1,
      load: course.options?.load ?? -1,
      hidden: !!course.options?.hideFromReports
    };
  });
  return rows;
}

export function createEventAudit(eventModel) {
  const issues = [];
  const codes = new Map();
  for (const control of eventModel.controls) {
    if (control.kind === "normal") {
      if (!control.code) {
        issues.push({ severity: "warning", item: `Control ${control.id}`, message: "Normal control has no code." });
      }
      if (codes.has(control.code)) {
        issues.push({ severity: "error", item: `Control ${control.id}`, message: `Code ${control.code} is used more than once.` });
      }
      codes.set(control.code, control.id);
    }
  }

  for (const course of sortedCourses(eventModel)) {
    const view = courseView(eventModel, course.id);
    if (!view.some(row => row.control.kind === "start")) {
      issues.push({ severity: "warning", item: course.name, message: "Course has no start control." });
    }
    if (!view.some(row => row.control.kind === "finish")) {
      issues.push({ severity: "warning", item: course.name, message: "Course has no finish control." });
    }
    for (const row of view) {
      if (!row.control) {
        issues.push({ severity: "error", item: course.name, message: `Missing control for course-control ${row.courseControl?.id}.` });
      }
    }
  }

  const usedControls = new Set();
  for (const course of sortedCourses(eventModel)) {
    for (const id of controlsUsedByCourse(eventModel, course.id)) {
      usedControls.add(id);
    }
  }
  for (const control of eventModel.controls) {
    if (!usedControls.has(control.id)) {
      issues.push({ severity: "info", item: `Control ${control.code || control.id}`, message: "Control is not used by any course." });
    }
  }

  return issues;
}

export function createLegLengthRows(eventModel) {
  const rows = [];
  for (const course of sortedCourses(eventModel)) {
    for (const leg of courseLegs(eventModel, course.id)) {
      rows.push({
        course: course.name,
        from: leg.from.control.code || controlKindLabel(leg.from.control.kind),
        to: leg.to.control.code || controlKindLabel(leg.to.control.kind),
        length: leg.length
      });
    }
  }
  return rows;
}

export function createControlCrossref(eventModel) {
  return [...eventModel.controls].sort(compareControls).map(control => ({
    id: control.id,
    code: control.code || controlKindLabel(control.kind),
    kind: control.kind,
    courses: coursesUsingControl(eventModel, control.id).map(course => course.name)
  }));
}

export function createLoadReport(eventModel) {
  const controls = createControlCrossref(eventModel).map(row => ({
    ...row,
    load: row.courses.reduce((sum, courseName) => {
      const course = eventModel.courses.find(candidate => candidate.name === courseName);
      const load = course?.options?.load ?? -1;
      return sum + (load > 0 ? load : 0);
    }, 0)
  }));

  const legMap = new Map();
  for (const course of sortedCourses(eventModel)) {
    const load = course.options?.load > 0 ? course.options.load : 0;
    for (const leg of courseLegs(eventModel, course.id)) {
      const key = `${leg.from.control.id}-${leg.to.control.id}`;
      const reverseKey = `${leg.to.control.id}-${leg.from.control.id}`;
      const existing = legMap.get(key) || legMap.get(reverseKey) || {
        from: leg.from.control.code || controlKindLabel(leg.from.control.kind),
        to: leg.to.control.code || controlKindLabel(leg.to.control.kind),
        courses: [],
        load: 0
      };
      existing.courses.push(course.name);
      existing.load += load;
      legMap.set(key, existing);
    }
  }

  return {
    controls,
    legs: [...legMap.values()]
  };
}

export function controlKindLabel(kind) {
  switch (kind) {
    case "start": return "Start";
    case "finish": return "Finish";
    case "crossing-point": return "Crossing";
    case "map-issue": return "Map issue";
    case "map-exchange": return "Map exchange";
    default: return "Control";
  }
}

export function compareControls(a, b) {
  const order = {
    "map-issue": 0,
    start: 1,
    "map-exchange": 2,
    normal: 3,
    finish: 4,
    "crossing-point": 5
  };
  const kindDiff = (order[a.kind] ?? 99) - (order[b.kind] ?? 99);
  if (kindDiff) return kindDiff;
  return naturalCode(a.code || String(a.id), b.code || String(b.id));
}

export function distance(a, b) {
  return Math.hypot((b.x || 0) - (a.x || 0), (b.y || 0) - (a.y || 0));
}

export function formatLength(length) {
  if (!Number.isFinite(length)) {
    return "";
  }
  if (length >= 1000) {
    return `${(length / 1000).toFixed(2)} km`;
  }
  return `${Math.round(length)} m`;
}

function labelForControl(course, courseControl, control, ordinal) {
  if (control.kind !== "normal") {
    return controlKindLabel(control.kind);
  }
  const code = control.code || "";
  const score = courseControl.points ? String(courseControl.points) : "";
  switch (course.labelKind) {
    case "code": return code;
    case "sequence-and-code": return `${ordinal}-${code}`;
    case "sequence-and-score": return score ? `${ordinal}(${score})` : String(ordinal);
    case "code-and-score": return score ? `${code}(${score})` : code;
    case "score": return score;
    default: return String(ordinal);
  }
}

function naturalCode(a, b) {
  const an = Number(a);
  const bn = Number(b);
  if (Number.isFinite(an) && Number.isFinite(bn) && an !== bn) {
    return an - bn;
  }
  return String(a).localeCompare(String(b), undefined, { numeric: true });
}
