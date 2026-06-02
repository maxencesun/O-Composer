import { defaultPrintArea } from "./event-model.js";
import { getCourse } from "./course-service.js";

export const PRINT_AREA_SCOPES = Object.freeze({
  ALL: "all",
  ALL_CONTROLS: "all-controls",
  COURSE: "course"
});

export function normalizePrintArea(area = defaultPrintArea()) {
  const base = defaultPrintArea();
  const normalized = {
    ...base,
    ...(area || {})
  };
  normalized.automatic = !!normalized.automatic;
  normalized.restrictToPageSize = !!normalized.restrictToPageSize;
  normalized.left = finiteNumber(normalized.left, base.left);
  normalized.right = finiteNumber(normalized.right, base.right);
  normalized.top = finiteNumber(normalized.top, base.top);
  normalized.bottom = finiteNumber(normalized.bottom, base.bottom);
  normalized.pageWidth = positiveNumber(normalized.pageWidth, base.pageWidth);
  normalized.pageHeight = positiveNumber(normalized.pageHeight, base.pageHeight);
  normalized.pageMargins = Math.max(0, finiteNumber(normalized.pageMargins, base.pageMargins));
  normalized.pageLandscape = !!normalized.pageLandscape;
  return normalized;
}

export function effectivePrintArea(eventModel, selectedCourseId = "all") {
  const course = selectedCourseId === "all" ? null : getCourse(eventModel, selectedCourseId);
  return normalizePrintArea(course?.printArea || eventModel.event.printArea || defaultPrintArea());
}

export function printAreaFromPoints(start, end, baseArea = defaultPrintArea()) {
  const base = normalizePrintArea(baseArea);
  const adjustedEnd = base.restrictToPageSize ? constrainEndToPageAspect(start, end, base) : end;
  return normalizePrintArea({
    ...base,
    automatic: false,
    restrictToPageSize: base.restrictToPageSize,
    left: Math.min(start.x, adjustedEnd.x),
    right: Math.max(start.x, adjustedEnd.x),
    top: Math.max(start.y, adjustedEnd.y),
    bottom: Math.min(start.y, adjustedEnd.y)
  });
}

export function printAreaFromBounds(bounds, baseArea = defaultPrintArea()) {
  const base = normalizePrintArea(baseArea);
  const rect = base.restrictToPageSize ? constrainToPageAspect(bounds, base) : bounds;
  return normalizePrintArea({
    ...base,
    automatic: false,
    restrictToPageSize: base.restrictToPageSize,
    left: Math.min(rect.left, rect.right),
    right: Math.max(rect.left, rect.right),
    top: Math.max(rect.top, rect.bottom),
    bottom: Math.min(rect.top, rect.bottom)
  });
}

export function printAreaFixedFrameAt(center, baseArea = defaultPrintArea(), eventModel = null, target = null) {
  const base = normalizePrintArea({
    ...baseArea,
    automatic: false,
    restrictToPageSize: true
  });
  const size = pageSizeInMapUnits(base, eventModel, target);
  return normalizePrintArea({
    ...base,
    left: center.x - size.width / 2,
    right: center.x + size.width / 2,
    top: center.y + size.height / 2,
    bottom: center.y - size.height / 2
  });
}

export function printAreaCenter(area) {
  const normalized = normalizePrintArea(area);
  return {
    x: (normalized.left + normalized.right) / 2,
    y: (normalized.top + normalized.bottom) / 2
  };
}

export function setPrintArea(eventModel, target, area) {
  const normalized = normalizePrintArea(area);
  const scope = target?.scope || PRINT_AREA_SCOPES.ALL;

  if (scope === PRINT_AREA_SCOPES.COURSE) {
    const course = getCourse(eventModel, target.courseId);
    if (course) {
      course.printArea = clonePrintArea(normalized);
    }
    return;
  }

  eventModel.event.printArea = clonePrintArea(normalized);

  if (scope === PRINT_AREA_SCOPES.ALL) {
    for (const course of eventModel.courses) {
      course.printArea = clonePrintArea(normalized);
      for (const partArea of course.partPrintAreas || []) {
        partArea.area = clonePrintArea(normalized);
      }
    }
  }
}

export function printAreaTargetLabel(eventModel, target) {
  if (target?.scope === PRINT_AREA_SCOPES.COURSE) {
    return getCourse(eventModel, target.courseId)?.name || "current course";
  }
  if (target?.scope === PRINT_AREA_SCOPES.ALL_CONTROLS) {
    return "All Controls";
  }
  return "all courses";
}

function clonePrintArea(area) {
  return { ...normalizePrintArea(area) };
}

function finiteNumber(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function positiveNumber(value, fallback) {
  const number = finiteNumber(value, fallback);
  return number > 0 ? number : fallback;
}

function pageSizeInMapUnits(area, eventModel, target) {
  const mapScale = positiveNumber(eventModel?.event?.map?.scale, 15000);
  const printScale = positiveNumber(printScaleForTarget(eventModel, target), mapScale);
  const scaleRatio = printScale / mapScale;
  const width = Math.max(0.1, (area.pageWidth - 2 * area.pageMargins) * 0.254 * scaleRatio);
  const height = Math.max(0.1, (area.pageHeight - 2 * area.pageMargins) * 0.254 * scaleRatio);
  return area.pageLandscape
    ? { width: height, height: width }
    : { width, height };
}

function printScaleForTarget(eventModel, target) {
  if (target?.scope === PRINT_AREA_SCOPES.COURSE) {
    return getCourse(eventModel, target.courseId)?.options?.printScale;
  }
  return eventModel?.event?.allControls?.printScale;
}

function constrainToPageAspect(bounds, area) {
  const center = {
    x: (bounds.left + bounds.right) / 2,
    y: (bounds.top + bounds.bottom) / 2
  };
  const width = Math.max(0.1, Math.abs(bounds.right - bounds.left));
  const height = Math.max(0.1, Math.abs(bounds.top - bounds.bottom));
  const aspect = pageAspect(area);
  let nextWidth = width;
  let nextHeight = height;

  if (width / height > aspect) {
    nextWidth = height * aspect;
  }
  else {
    nextHeight = width / aspect;
  }

  return {
    left: center.x - nextWidth / 2,
    right: center.x + nextWidth / 2,
    top: center.y + nextHeight / 2,
    bottom: center.y - nextHeight / 2
  };
}

function constrainEndToPageAspect(start, end, area) {
  const aspect = pageAspect(area);
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  let width = Math.max(0.1, Math.abs(dx));
  let height = Math.max(0.1, Math.abs(dy));

  if (width / height > aspect) {
    width = height * aspect;
  }
  else {
    height = width / aspect;
  }

  return {
    x: start.x + Math.sign(dx || 1) * width,
    y: start.y + Math.sign(dy || -1) * height
  };
}

function pageAspect(area) {
  const rawWidth = Math.max(1, area.pageWidth - area.pageMargins * 2);
  const rawHeight = Math.max(1, area.pageHeight - area.pageMargins * 2);
  const width = area.pageLandscape ? rawHeight : rawWidth;
  const height = area.pageLandscape ? rawWidth : rawHeight;
  return Math.max(0.05, width / height);
}
