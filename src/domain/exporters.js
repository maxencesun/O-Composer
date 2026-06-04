import {
  allControlsView,
  controlKindLabel,
  courseLegs,
  courseLength,
  courseView,
  eventBounds,
  formatLength,
  sortedCourses
} from "./course-service.js";
import { allCourseVariations } from "./relay-variations.js";

export function exportIofXml(eventModel, version = 3) {
  return version === 2 ? exportIofXml2(eventModel) : exportIofXml3(eventModel);
}

export function exportIofXml3(eventModel) {
  const now = new Date().toISOString();
  const lines = [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<CourseData xmlns="http://www.orienteering.org/datastandard/3.0" iofVersion="3.0" createTime="${escapeAttr(now)}" creator="O-Composer">`,
    `  <Event><Name>${escapeText(eventModel.event.title)}</Name></Event>`,
    `  <RaceCourseData>`
  ];
  const bounds = eventBounds(eventModel);
  lines.push(`    <Map>`);
  lines.push(`      <Scale>${eventModel.event.map.scale || 15000}</Scale>`);
  lines.push(`      <MapPositionTopLeft x="${round(bounds.left)}" y="${round(bounds.top)}" />`);
  lines.push(`      <MapPositionBottomRight x="${round(bounds.right)}" y="${round(bounds.bottom)}" />`);
  lines.push(`    </Map>`);

  for (const control of eventModel.controls) {
    lines.push(`    <Control type="${iofControlType(control.kind)}">`);
    lines.push(`      <Id>${escapeText(control.code || syntheticControlCode(control))}</Id>`);
    lines.push(`      <MapPosition x="${round(control.location.x)}" y="${round(control.location.y)}" />`);
    lines.push(`    </Control>`);
  }

  for (const course of sortedCourses(eventModel, false)) {
    const variations = allCourseVariations(eventModel, course.id);
    const courseVariants = variations.length ? variations : [{ code: "", choices: [] }];
    for (const variation of courseVariants) {
    const view = courseView(eventModel, course.id, variation.choices?.length ? { variationChoices: variation.choices } : {});
    const courseName = variation.code ? `${course.name} ${variation.code}` : course.name;
    lines.push(`    <Course>`);
    lines.push(`      <Name>${escapeText(courseName)}</Name>`);
    if (course.secondaryTitle) {
      for (const className of splitClassNames(course.secondaryTitle)) {
        lines.push(`      <ClassCourseAssignment><ClassName>${escapeText(className)}</ClassName><CourseName>${escapeText(courseName)}</CourseName></ClassCourseAssignment>`);
      }
    }
    lines.push(`      <Length>${Math.round(courseLength(eventModel, course.id, variation.choices?.length ? { variationChoices: variation.choices } : {}))}</Length>`);
    if ((course.options?.climb ?? -1) >= 0) {
      lines.push(`      <Climb>${Math.round(course.options.climb)}</Climb>`);
    }
    for (const row of view) {
      lines.push(`      <CourseControl type="${iofCourseControlType(row.control.kind, course.kind)}">`);
      lines.push(`        <Control>${escapeText(row.control.code || syntheticControlCode(row.control))}</Control>`);
      if (row.ordinal) {
        lines.push(`        <MapText>${escapeText(row.ordinal)}</MapText>`);
      }
      if (course.kind === "score" && row.courseControl.points) {
        lines.push(`        <Score>${row.courseControl.points}</Score>`);
      }
      lines.push(`      </CourseControl>`);
    }
    lines.push(`    </Course>`);
    }
  }
  lines.push(`  </RaceCourseData>`, `</CourseData>`);
  return `${lines.join("\n")}\n`;
}

export function exportIofXml2(eventModel) {
  const now = new Date();
  const lines = [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<CourseData>`,
    `  <IOFVersion version="2.0.3" />`,
    `  <ModifyDate><Date>${now.toISOString().slice(0, 10)}</Date><Clock>${now.toTimeString().slice(0, 5)}</Clock></ModifyDate>`,
    `  <Map><Scale>${eventModel.event.map.scale || 15000}</Scale></Map>`
  ];

  for (const control of eventModel.controls) {
    const elementName = control.kind === "finish" ? "FinishPoint" : control.kind === "start" ? "StartPoint" : "Control";
    lines.push(`  <${elementName}>`);
    lines.push(`    <${elementName}Code>${escapeText(control.code || syntheticControlCode(control))}</${elementName}Code>`);
    lines.push(`    <MapPosition x="${round(control.location.x)}" y="${round(control.location.y)}" />`);
    lines.push(`  </${elementName}>`);
  }

  for (const course of sortedCourses(eventModel, false)) {
    lines.push(`  <Course>`);
    lines.push(`    <CourseName>${escapeText(course.name)}</CourseName>`);
    lines.push(`    <CourseId>${course.id}</CourseId>`);
    const variations = allCourseVariations(eventModel, course.id);
    const courseVariants = variations.length ? variations : [{ code: "", choices: [] }];
    for (let variationIndex = 0; variationIndex < courseVariants.length; variationIndex += 1) {
    const variation = courseVariants[variationIndex];
    const options = variation.choices?.length ? { variationChoices: variation.choices } : {};
    lines.push(`    <CourseVariation>`);
    lines.push(`      <CourseVariationId>${variationIndex}</CourseVariationId>`);
    if (variation.code) {
      lines.push(`      <Name>${escapeText(variation.code)}</Name>`);
    }
    lines.push(`      <CourseLength>${Math.round(courseLength(eventModel, course.id, options))}</CourseLength>`);
    let sequence = 1;
    for (const row of courseView(eventModel, course.id, options)) {
      if (row.control.kind === "start") {
        lines.push(`      <StartPointCode>${escapeText(row.control.code || syntheticControlCode(row.control))}</StartPointCode>`);
      }
      else if (row.control.kind === "finish") {
        lines.push(`      <FinishPointCode>${escapeText(row.control.code || syntheticControlCode(row.control))}</FinishPointCode>`);
      }
      else {
        lines.push(`      <CourseControl>`);
        lines.push(`        <Sequence>${sequence++}</Sequence>`);
        lines.push(`        <ControlCode>${escapeText(row.control.code || syntheticControlCode(row.control))}</ControlCode>`);
        if (course.kind === "score" && row.courseControl.points) {
          lines.push(`        <ScoreOPoints>${row.courseControl.points}</ScoreOPoints>`);
        }
        lines.push(`      </CourseControl>`);
      }
    }
    lines.push(`    </CourseVariation>`);
    }
    lines.push(`  </Course>`);
  }
  lines.push(`</CourseData>`);
  return `${lines.join("\n")}\n`;
}

export function exportKml(eventModel) {
  const lines = [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<kml xmlns="http://www.opengis.net/kml/2.2">`,
    `  <Document>`,
    `    <name>${escapeText(eventModel.event.title)}</name>`
  ];
  for (const course of sortedCourses(eventModel, false)) {
    lines.push(`    <Folder><name>${escapeText(course.name)}</name>`);
    for (const row of courseView(eventModel, course.id)) {
      lines.push(`      <Placemark><name>${escapeText(row.control.code || controlKindLabel(row.control.kind))}</name>`);
      lines.push(`        <description>${escapeText("Map coordinates exported because browser-only Purple Pen has no georeferencing transform.")}</description>`);
      lines.push(`        <Point><coordinates>${round(row.control.location.x)},${round(row.control.location.y)},0</coordinates></Point>`);
      lines.push(`      </Placemark>`);
    }
    for (const leg of courseLegs(eventModel, course.id)) {
      lines.push(`      <Placemark><name>${escapeText(`${leg.from.label} - ${leg.to.label}`)}</name>`);
      lines.push(`        <LineString><coordinates>${legPathCoordinates(leg)}</coordinates></LineString>`);
      lines.push(`      </Placemark>`);
    }
    lines.push(`    </Folder>`);
  }
  lines.push(`  </Document>`, `</kml>`);
  return `${lines.join("\n")}\n`;
}

export function exportGpx(eventModel) {
  const lines = [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<gpx version="1.1" creator="O-Composer" xmlns="http://www.topografix.com/GPX/1/1">`,
    `  <metadata><name>${escapeText(eventModel.event.title)}</name><desc>Map x/y values are exported as lon/lat placeholders because no georeferencing transform is available in the browser.</desc></metadata>`
  ];
  for (const control of eventModel.controls) {
    lines.push(`  <wpt lat="${round(control.location.y)}" lon="${round(control.location.x)}"><name>${escapeText(control.code || syntheticControlCode(control))}</name></wpt>`);
  }
  for (const course of sortedCourses(eventModel, false)) {
    lines.push(`  <rte><name>${escapeText(course.name)}</name>`);
    for (const row of courseView(eventModel, course.id)) {
      lines.push(`    <rtept lat="${round(row.control.location.y)}" lon="${round(row.control.location.x)}"><name>${escapeText(row.control.code || row.label)}</name></rtept>`);
    }
    lines.push(`  </rte>`);
  }
  lines.push(`</gpx>`);
  return `${lines.join("\n")}\n`;
}

export function exportRouteGadgetXml(eventModel) {
  const lines = [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<routegadget-event source="O-Composer">`,
    `  <name>${escapeText(eventModel.event.title)}</name>`
  ];
  for (const course of sortedCourses(eventModel, false)) {
    lines.push(`  <course name="${escapeAttr(course.name)}" length="${Math.round(courseLength(eventModel, course.id))}">`);
    for (const row of courseView(eventModel, course.id)) {
      lines.push(`    <control code="${escapeAttr(row.control.code || row.label)}" x="${round(row.control.location.x)}" y="${round(row.control.location.y)}" />`);
    }
    lines.push(`  </course>`);
  }
  lines.push(`</routegadget-event>`);
  return `${lines.join("\n")}\n`;
}

export function exportCourseSvg(eventModel, selectedCourseId = "all") {
  const bounds = eventBounds(eventModel);
  const width = 1200;
  const height = Math.max(700, Math.round(width * bounds.height / bounds.width));
  const scale = Math.min(width / bounds.width, height / bounds.height);
  const tx = x => (x - bounds.left) * scale;
  const ty = y => (bounds.top - y) * scale;

  const selectedCourse = selectedCourseId === "all" ? null : sortedCourses(eventModel).find(course => course.id === Number(selectedCourseId));
  const rows = selectedCourse ? courseView(eventModel, selectedCourse.id) : allControlsView(eventModel);
  const legs = selectedCourse ? courseLegs(eventModel, selectedCourse.id) : [];
  const lines = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`,
    `<rect width="100%" height="100%" fill="#f8f7f2" />`,
    `<g stroke="#8f2aa8" fill="none" stroke-width="4">`
  ];
  for (const leg of legs) {
    lines.push(`<line x1="${tx(leg.from.control.location.x)}" y1="${ty(leg.from.control.location.y)}" x2="${tx(leg.to.control.location.x)}" y2="${ty(leg.to.control.location.y)}" />`);
  }
  lines.push(`</g>`);
  for (const row of rows) {
    const x = tx(row.control.location.x);
    const y = ty(row.control.location.y);
    if (row.control.kind === "start") {
      lines.push(`<polygon points="${x},${y - 14} ${x - 13},${y + 10} ${x + 13},${y + 10}" fill="none" stroke="#8f2aa8" stroke-width="4" />`);
    }
    else if (row.control.kind === "finish") {
      lines.push(`<circle cx="${x}" cy="${y}" r="15" fill="none" stroke="#8f2aa8" stroke-width="4" /><circle cx="${x}" cy="${y}" r="10" fill="none" stroke="#8f2aa8" stroke-width="4" />`);
    }
    else {
      lines.push(`<circle cx="${x}" cy="${y}" r="15" fill="none" stroke="#8f2aa8" stroke-width="4" />`);
    }
    if (row.label) {
      lines.push(`<text x="${x + 18}" y="${y - 12}" font-family="Arial, sans-serif" font-size="18" font-weight="700" fill="#8f2aa8">${escapeText(row.label)}</text>`);
    }
  }
  lines.push(`</svg>`);
  return `${lines.join("\n")}\n`;
}

export function reportToHtml(title, headers, rows) {
  const headerHtml = headers.map(header => `<th>${escapeText(header.label)}</th>`).join("");
  const rowsHtml = rows.map(row => `<tr>${headers.map(header => `<td>${escapeText(header.format ? header.format(row[header.key], row) : row[header.key] ?? "")}</td>`).join("")}</tr>`).join("");
  return `<section class="report-document"><h1>${escapeText(title)}</h1><table><thead><tr>${headerHtml}</tr></thead><tbody>${rowsHtml}</tbody></table></section>`;
}

function iofControlType(kind) {
  if (kind === "start") return "Start";
  if (kind === "finish") return "Finish";
  if (kind === "crossing-point") return "CrossingPoint";
  return "Control";
}

function iofCourseControlType(kind, courseKind) {
  if (kind === "start") return "Start";
  if (kind === "finish") return "Finish";
  if (kind === "crossing-point") return "CrossingPoint";
  return courseKind === "score" ? "Control" : "Control";
}

function syntheticControlCode(control) {
  if (control.kind === "start") return `STA${control.id}`;
  if (control.kind === "finish") return `FIN${control.id}`;
  if (control.kind === "map-exchange") return `XCHG${control.id}`;
  return `CTL${control.id}`;
}

function splitClassNames(value) {
  return String(value || "").split(/[|,]/).map(item => item.trim()).filter(Boolean);
}

function legPathCoordinates(leg) {
  return [
    `${round(leg.from.control.location.x)},${round(leg.from.control.location.y)},0`,
    `${round(leg.to.control.location.x)},${round(leg.to.control.location.y)},0`
  ].join(" ");
}

function round(value) {
  return Number(value || 0).toFixed(2).replace(/\.00$/, "");
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

export { formatLength };
