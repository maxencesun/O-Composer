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
  const variationChoices = Array.isArray(options.variationChoices)
    ? options.variationChoices.map(Number).filter(Boolean)
    : [];
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
        if (!seen.has(currentId) || allBranches) {
          result.push(currentId);
          seen.add(currentId);
        }
        const branches = courseControl.variationCourseControls;
        if (allBranches) {
          for (const branchId of branches) {
            visit(branchId, courseControl.variationEnd, true);
          }
          currentId = courseControl.variation === "loop" ? courseControl.nextCourseControl : courseControl.variationEnd;
          first = false;
          continue;
        }

        if (variationChoices.length) {
          if (courseControl.variation === "loop") {
            const loopBranches = variationChoices.filter(choice => branches.includes(choice));
            for (const branchId of loopBranches) {
              visit(branchId, courseControl.variationEnd, true);
            }
            currentId = courseControl.nextCourseControl;
            first = false;
            continue;
          }
          const selectedBranch = variationChoices.find(choice => branches.includes(choice)) || branches[0];
          if (selectedBranch) {
            visit(selectedBranch, courseControl.variationEnd, true);
            currentId = courseControl.variationEnd;
            first = false;
            continue;
          }
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
  if (!course) {
    return [];
  }

  const view = courseView(eventModel, courseId, options);
  if (course.kind === "score") {
    return scoreCourseFinishLeg(eventModel, course, view);
  }
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

function scoreCourseFinishLeg(eventModel, course, view) {
  const legs = [];
  const mapIssue = view.find(row => row.control?.kind === "map-issue");
  const start = view.find(row => row.control?.kind === "start");
  if (mapIssue && start) {
    legs.push({
      from: mapIssue,
      to: start,
      leg: findLeg(eventModel, mapIssue.control.id, start.control.id),
      length: legLength(eventModel, mapIssue.control.id, start.control.id)
    });
  }
  const startControlId = Number(course.options?.scoreFinishControl) || 0;
  if (!startControlId) {
    return legs;
  }
  const from = view.find(row => Number(row.control?.id) === startControlId && row.control?.kind === "normal");
  const to = view.find(row => row.control?.kind === "finish");
  if (!from || !to) {
    return legs;
  }
  legs.push({
    from,
    to,
    leg: findLeg(eventModel, from.control.id, to.control.id),
    length: legLength(eventModel, from.control.id, to.control.id)
  });
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
  const start = getControl(eventModel, startControlId);
  const end = getControl(eventModel, endControlId);
  if (!start || !end) {
    return 0;
  }

  const leg = findLeg(eventModel, startControlId, endControlId);
  const flagging = normalizeFlaggingKind(leg?.flagging?.kind);

  // No mandatory route or entire leg mandatory — use path distance for "all",
  // straight-line for "none"
  if (flagging === "none") {
    return distance(start.location, end.location);
  }
  if (flagging === "all") {
    const path = legPath(eventModel, startControlId, endControlId);
    return pathLength(path);
  }

  // Partial mandatory route:
  // - Unmarked segments: straight-line distance between endpoints
  // - Mandatory (flagged) segment: distance along the purple line (path)
  const path = legPath(eventModel, startControlId, endControlId);
  const total = pathLength(path);
  if (total <= 0) {
    return distance(start.location, end.location);
  }

  // Determine flag start/end distances along the path
  let flagStart = 0;
  let flagEnd = total;

  if (flagging === "begin") {
    flagStart = 0;
    flagEnd = clamp(Number(leg.flagging?.end) || total / 2, 0, total);
  } else if (flagging === "end") {
    flagStart = clamp(Number(leg.flagging?.start) || total / 2, 0, total);
    flagEnd = total;
  } else if (flagging === "middle") {
    flagStart = clamp(Number(leg.flagging?.start) || total * 0.35, 0, total);
    flagEnd = clamp(Number(leg.flagging?.end) || total * 0.65, flagStart, total);
  }

  const flagStartPoint = pointAtPathDistance(path, flagStart);
  const flagEndPoint = pointAtPathDistance(path, flagEnd);

  // Unmarked before flag: start → flag start (straight line)
  // Mandatory segment: flag start → flag end (along purple line path)
  // Unmarked after flag: flag end → end (straight line)
  let length = 0;
  length += distance(start.location, flagStartPoint);
  length += pathSegmentLength(path, flagStart, flagEnd);
  length += distance(flagEndPoint, end.location);
  return length;
}

function normalizeFlaggingKind(kind) {
  return { "beginning-part": "begin", "end-part": "end", "middle-part": "middle" }[kind] || kind || "none";
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function pathLength(points) {
  let length = 0;
  for (let i = 0; i < points.length - 1; i += 1) {
    length += distance(points[i], points[i + 1]);
  }
  return length;
}

function pathSegmentLength(points, startDist, endDist) {
  let length = 0;
  let offset = 0;
  for (let i = 0; i < points.length - 1; i += 1) {
    const segLen = distance(points[i], points[i + 1]);
    const segStart = offset;
    const segEnd = offset + segLen;
    // Overlap of [startDist, endDist] with [segStart, segEnd]
    const overlapStart = Math.max(startDist, segStart);
    const overlapEnd = Math.min(endDist, segEnd);
    if (overlapStart < overlapEnd) {
      length += overlapEnd - overlapStart;
    }
    offset = segEnd;
  }
  return length;
}

function pointAtPathDistance(points, target) {
  let remaining = clamp(target, 0, pathLength(points));
  for (let i = 0; i < points.length - 1; i += 1) {
    const a = points[i];
    const b = points[i + 1];
    const length = distance(a, b);
    if (remaining <= length && length > 0) {
      const t = remaining / length;
      return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
    }
    remaining -= length;
  }
  return { ...points[points.length - 1] };
}

export function courseLength(eventModel, courseId, options = {}) {
  const course = getCourse(eventModel, courseId);
  if (!course) {
    return 0;
  }
  if (!options.variationChoices?.length && !options.allBranches && course.options?.courseLength) {
    return course.options.courseLength;
  }
  return courseLegs(eventModel, courseId, options).reduce((sum, leg) => sum + leg.length, 0);
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
  const score = course.kind === "score"
    ? String(Math.max(0, Number(courseControl?.points) || 0))
    : (courseControl?.points ? String(courseControl.points) : "");
  switch (course.labelKind) {
    case "code": return code;
    case "sequence-and-code": return `${ordinal}-${code}`;
    case "sequence-and-score": return score ? `${ordinal}(${score})` : String(ordinal);
    case "code-and-score-brackets": return score ? `${code}[${score}]` : code;
    case "code-and-score-dash": return score ? `${code}-${score}` : code;
    case "code-and-score":
    case "code-and-score-parens": return score ? `${code}(${score})` : code;
    case "score": return score;
    default: return String(ordinal);
  }
}

export function naturalCode(a, b) {
  const an = Number(a);
  const bn = Number(b);
  if (Number.isFinite(an) && Number.isFinite(bn) && an !== bn) {
    return an - bn;
  }
  return String(a).localeCompare(String(b), undefined, { numeric: true });
}
