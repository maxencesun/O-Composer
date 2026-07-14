import assert from "node:assert/strict";
import { PDFDocument } from "../assets/vendor/pdf-lib/pdf-lib.esm.min.js";
import { mergePdfBlobs } from "../src/domain/pdf-exporter.js";
import { createAppShellFileExportMethods } from "../src/ui/app-shell-file-export-methods.js";

async function onePagePdf(width, height) {
  const document = await PDFDocument.create();
  document.addPage([width, height]);
  return new Blob([await document.save({ useObjectStreams: false })], { type: "application/pdf" });
}

const mergedBlob = await mergePdfBlobs([
  await onePagePdf(100, 200),
  await onePagePdf(300, 400)
]);
const merged = await PDFDocument.load(new Uint8Array(await mergedBlob.arrayBuffer()));

assert.equal(merged.getPageCount(), 2);
assert.deepEqual(
  merged.getPages().map(page => [page.getWidth(), page.getHeight()]),
  [[100, 200], [300, 400]],
  "course map pages should stay in order inside one PDF"
);

const renderedPages = [];
const methods = createAppShellFileExportMethods({
  getCourse: (eventModel, id) => eventModel.courses.find(course => Number(course.id) === Number(id))
});
const app = {
  ...methods,
  t: (message, values = {}) => message.replace(/\{(\w+)\}/g, (_match, key) => values[key] ?? "")
};
app.pdfTargetPageCount = () => 3;
app.createPdfPageBlobForTarget = async (_state, _target, _settings, page) => {
  renderedPages.push(page);
  return onePagePdf(100 * Number(page), 200);
};
const coursePdf = await app.createPdfBlobForTarget(
  { eventModel: { courses: [{ id: 7, name: "Paged", kind: "normal", pageBreakFormula: "" }] } },
  { type: "course", courseId: 7, name: "Paged" },
  {}
);
const courseDocument = await PDFDocument.load(new Uint8Array(await coursePdf.arrayBuffer()));
assert.deepEqual(renderedPages, [1, 2, 3], "every course page should be rendered before assembly");
assert.equal(courseDocument.getPageCount(), 3, "one course target should produce one multi-page PDF");

console.log("multi-page PDF smoke test passed");
