const MM_TO_PT = 72 / 25.4;
const PDF_FONT_SOURCES = Object.freeze([
  { key: "roboto", resource: "F1", name: "Roboto", url: "./assets/fonts/Roboto.ttf" },
  { key: "roboto-bold", resource: "F2", name: "Roboto-Bold", url: "./assets/fonts/Roboto-Bold.ttf" },
  { key: "roboto-italic", resource: "F3", name: "Roboto-Italic", url: "./assets/fonts/Roboto-Italic.ttf" },
  { key: "roboto-condensed", resource: "F4", name: "RobotoCondensed", url: "./assets/fonts/RobotoCondensed.ttf" },
  { key: "roboto-condensed-bold", resource: "F5", name: "RobotoCondensed-Bold", url: "./assets/fonts/RobotoCondensed-Bold.ttf" }
]);
const PDF_CJK_FONT_SOURCES = Object.freeze([
  { key: "heiti-bold", resource: "F6", name: "Heiti-Bold", url: "./assets/fonts/Heiti.ttf", cjk: true }
]);

const PDF_LIB_CANDIDATES = Object.freeze([
  "https://cdn.jsdelivr.net/npm/pdf-lib@1.17.1/+esm",
  "https://unpkg.com/pdf-lib@1.17.1/dist/pdf-lib.esm.min.js"
]);

const pdfFontPromises = new Map();
let pdfLatinFontSetPromise = null;
let pdfCjkFontSetPromise = null;
let pdfLibPromise = null;

export async function createVectorMapPdfBlob({ pageWidthMm, pageHeightMm, marginMm = 3, canvasWidth, canvasHeight, draw, backgroundPdf = null, needsUnicodeFont = false, onProgress = async () => {} }) {
  await onProgress("loading-fonts");
  const fontSet = await loadPdfFontSet({ includeCjk: needsUnicodeFont });
  const layout = pdfPageLayout({ pageWidthMm, pageHeightMm, marginMm, canvasWidth, canvasHeight });
  const ctx = new PdfCanvasContext(canvasWidth, canvasHeight, layout.box, fontSet);

  await onProgress("drawing");
  draw(ctx);

  await onProgress("building");
  const overlayBytes = buildPdf({
    pageWidthPt: layout.pageWidthPt,
    pageHeightPt: layout.pageHeightPt,
    content: ctx.content(),
    fontSet,
    alphaResources: ctx.alphaResources()
  });

  if (backgroundPdf?.sourceDataUrl && backgroundPdf?.canvasBox) {
    return mergeVectorPdfWithPdfBasemap({
      overlayBytes,
      pageWidthPt: layout.pageWidthPt,
      pageHeightPt: layout.pageHeightPt,
      canvasBox: backgroundPdf.canvasBox,
      canvasWidth,
      canvasHeight,
      contentBox: layout.box,
      sourceDataUrl: backgroundPdf.sourceDataUrl,
      pageNumber: backgroundPdf.pageNumber || 1,
      onProgress
    });
  }

  await onProgress("done");
  return new Blob([overlayBytes], { type: "application/pdf" });
}

function pdfPageLayout({ pageWidthMm, pageHeightMm, marginMm = 3, canvasWidth, canvasHeight }) {
  const pageWidthPt = pageWidthMm * MM_TO_PT;
  const pageHeightPt = pageHeightMm * MM_TO_PT;
  const marginPt = Math.max(0, marginMm) * MM_TO_PT;
  const contentWidth = Math.max(1, pageWidthPt - marginPt * 2);
  const contentHeight = Math.max(1, pageHeightPt - marginPt * 2);
  const canvasAspect = canvasWidth / Math.max(1, canvasHeight);
  const contentAspect = contentWidth / contentHeight;
  const drawWidth = canvasAspect > contentAspect ? contentWidth : contentHeight * canvasAspect;
  const drawHeight = canvasAspect > contentAspect ? contentWidth / Math.max(0.0001, canvasAspect) : contentHeight;
  const drawX = marginPt + (contentWidth - drawWidth) / 2;
  const drawY = marginPt + (contentHeight - drawHeight) / 2;
  return {
    pageWidthPt,
    pageHeightPt,
    box: {
      x: drawX,
      y: pageHeightPt - drawY - drawHeight,
      width: drawWidth,
      height: drawHeight
    }
  };
}

async function mergeVectorPdfWithPdfBasemap({ overlayBytes, pageWidthPt, pageHeightPt, canvasBox, canvasWidth, canvasHeight, contentBox, sourceDataUrl, pageNumber, onProgress = async () => {} }) {
  await onProgress("loading-pdf-lib");
  const { PDFDocument } = await loadPdfLib();
  await onProgress("reading-base-map");
  const sourceBytes = dataUrlBytes(sourceDataUrl);
  if (!bytesLookLikePdf(sourceBytes)) {
    throw new Error("The original PDF base map data is not available. Export again as a raster PDF.");
  }
  if (!bytesLookLikePdf(overlayBytes)) {
    throw new Error("The generated course overlay is not a valid PDF.");
  }
  const sourceDocument = await PDFDocument.load(sourceBytes, { ignoreEncryption: true });
  const overlayDocument = await PDFDocument.load(overlayBytes, { ignoreEncryption: true });
  const sourcePageIndex = clamp(Math.floor(Number(pageNumber) || 1), 1, Math.max(1, sourceDocument.getPageCount())) - 1;
  const document = await PDFDocument.create();
  const [page] = await document.copyPages(sourceDocument, [sourcePageIndex]);
  const [overlayPage] = await document.embedPdf(overlayBytes, [0]);
  document.addPage(page);
  const box = pdfBoxForCanvasRect(canvasBox, canvasWidth, canvasHeight, contentBox);
  const sourceSize = page.getSize();
  const overlayBox = overlayBoxForCopiedPdfPage({
    pageWidthPt,
    pageHeightPt,
    baseBox: box,
    sourceWidthPt: sourceSize.width,
    sourceHeightPt: sourceSize.height
  });
  page.drawPage(overlayPage, {
    x: overlayBox.x,
    y: overlayBox.y,
    width: overlayBox.width,
    height: overlayBox.height
  });
  await onProgress("saving");
  const output = await document.save({ useObjectStreams: false });
  sourceDocument?.destroy?.();
  overlayDocument?.destroy?.();
  return new Blob([output], { type: "application/pdf" });
}

function overlayBoxForCopiedPdfPage({ pageWidthPt, pageHeightPt, baseBox, sourceWidthPt, sourceHeightPt }) {
  const scaleX = sourceWidthPt / Math.max(0.01, baseBox.width);
  const scaleY = sourceHeightPt / Math.max(0.01, baseBox.height);
  return {
    x: -baseBox.x * scaleX,
    y: -baseBox.y * scaleY,
    width: pageWidthPt * scaleX,
    height: pageHeightPt * scaleY
  };
}

function pdfBoxForCanvasRect(rect, canvasWidth, canvasHeight, contentBox) {
  const sx = contentBox.width / Math.max(1, canvasWidth);
  const sy = contentBox.height / Math.max(1, canvasHeight);
  const x = contentBox.x + (Number(rect.x) || 0) * sx;
  const width = Math.max(0.01, (Number(rect.width) || 0) * sx);
  const height = Math.max(0.01, (Number(rect.height) || 0) * sy);
  const y = contentBox.y + contentBox.height - ((Number(rect.y) || 0) + (Number(rect.height) || 0)) * sy;
  return { x, y, width, height };
}

async function loadPdfLib() {
  if (pdfLibPromise) return pdfLibPromise;
  pdfLibPromise = (async () => {
    let lastError = null;
    for (const url of PDF_LIB_CANDIDATES) {
      try {
        return await import(/* @vite-ignore */ url);
      }
      catch (error) {
        lastError = error;
      }
    }
    throw new Error(`Could not load the PDF vector embedding library. ${lastError?.message || ""}`.trim());
  })();
  return pdfLibPromise;
}

export async function createRasterMapPdfBlob({ pageWidthMm, pageHeightMm, marginMm = 3, canvas, onProgress = async () => {} }) {
  const pageWidthPt = pageWidthMm * MM_TO_PT;
  const pageHeightPt = pageHeightMm * MM_TO_PT;
  const marginPt = Math.max(0, marginMm) * MM_TO_PT;
  const contentWidth = Math.max(1, pageWidthPt - marginPt * 2);
  const contentHeight = Math.max(1, pageHeightPt - marginPt * 2);
  const canvasWidth = Math.max(1, canvas?.width || 1);
  const canvasHeight = Math.max(1, canvas?.height || 1);
  const canvasAspect = canvasWidth / canvasHeight;
  const contentAspect = contentWidth / contentHeight;
  const drawWidth = canvasAspect > contentAspect ? contentWidth : contentHeight * canvasAspect;
  const drawHeight = canvasAspect > contentAspect ? contentWidth / canvasAspect : contentHeight;
  const drawX = marginPt + (contentWidth - drawWidth) / 2;
  const drawY = marginPt + (contentHeight - drawHeight) / 2;
  await onProgress("encoding-image");
  const imageBytes = await canvasJpegBytes(canvas);

  await onProgress("building");
  return new Blob([buildImagePdf({
    pageWidthPt,
    pageHeightPt,
    imageBytes,
    imageWidth: canvasWidth,
    imageHeight: canvasHeight,
    drawX,
    drawY,
    drawWidth,
    drawHeight
  })], { type: "application/pdf" });
}

class PdfCanvasContext {
  constructor(width, height, box, fontSet) {
    this.canvas = { width, height, clientWidth: width, clientHeight: height };
    this.width = width;
    this.height = height;
    this.box = box;
    this.fontSet = fontSet;
    this.baseTransform = [box.width / width, 0, 0, -box.height / height, box.x, box.y + box.height];
    this.parts = [];
    this.path = [];
    this.state = defaultState();
    this.stack = [];
    this.currentPoint = { x: 0, y: 0 };
    this.currentTransform = identity();
    this.alphaStates = new Map();
    this.parts.push("q");
    this.rect(0, 0, width, height);
    this.clip();
    this.beginPath();
  }

  content() {
    return `${this.parts.join("\n")}\nQ\n`;
  }

  alphaResources() {
    return [...this.alphaStates.entries()]
      .map(([key, name]) => {
        const [strokeAlpha, fillAlpha] = key.split("|").map(Number);
        return `/${name} << /Type /ExtGState /CA ${n(strokeAlpha)} /ca ${n(fillAlpha)} >>`;
      })
      .join(" ");
  }

  save() {
    this.stack.push({ state: { ...this.state }, transform: [...this.currentTransform] });
    this.parts.push("q");
  }

  restore() {
    if (this.stack.length) {
      const item = this.stack.pop();
      this.state = item.state;
      this.currentTransform = item.transform;
    }
    this.parts.push("Q");
  }

  set fillStyle(value) { this.state.fillStyle = String(value || "#000"); }
  get fillStyle() { return this.state.fillStyle; }
  set strokeStyle(value) { this.state.strokeStyle = String(value || "#000"); }
  get strokeStyle() { return this.state.strokeStyle; }
  set lineWidth(value) { this.state.lineWidth = Math.max(0.001, Number(value) || 1); }
  get lineWidth() { return this.state.lineWidth; }
  set lineCap(value) { this.state.lineCap = value || "butt"; }
  get lineCap() { return this.state.lineCap; }
  set lineJoin(value) { this.state.lineJoin = value || "miter"; }
  get lineJoin() { return this.state.lineJoin; }
  set miterLimit(value) { this.state.miterLimit = Number(value) || 10; }
  get miterLimit() { return this.state.miterLimit; }
  set globalAlpha(value) { this.state.globalAlpha = clamp(Number(value), 0, 1); }
  get globalAlpha() { return this.state.globalAlpha; }
  set font(value) { this.state.font = String(value || "12px Helvetica"); }
  get font() { return this.state.font; }
  set textAlign(value) { this.state.textAlign = value || "start"; }
  get textAlign() { return this.state.textAlign; }
  set textBaseline(value) { this.state.textBaseline = value || "alphabetic"; }
  get textBaseline() { return this.state.textBaseline; }

  beginPath() {
    this.path = [];
  }

  closePath() {
    this.path.push("h");
  }

  moveTo(x, y) {
    const p = this.apply(x, y);
    this.currentPoint = { x, y };
    this.path.push(`${n(p.x)} ${n(p.y)} m`);
  }

  lineTo(x, y) {
    const p = this.apply(x, y);
    this.currentPoint = { x, y };
    this.path.push(`${n(p.x)} ${n(p.y)} l`);
  }

  bezierCurveTo(x1, y1, x2, y2, x3, y3) {
    const p1 = this.apply(x1, y1);
    const p2 = this.apply(x2, y2);
    const p3 = this.apply(x3, y3);
    this.currentPoint = { x: x3, y: y3 };
    this.path.push(`${n(p1.x)} ${n(p1.y)} ${n(p2.x)} ${n(p2.y)} ${n(p3.x)} ${n(p3.y)} c`);
  }

  quadraticCurveTo(x1, y1, x2, y2) {
    const p0 = this.currentPoint;
    this.bezierCurveTo(
      p0.x + (2 / 3) * (x1 - p0.x),
      p0.y + (2 / 3) * (y1 - p0.y),
      x2 + (2 / 3) * (x1 - x2),
      y2 + (2 / 3) * (y1 - y2),
      x2,
      y2
    );
  }

  rect(x, y, width, height) {
    this.moveTo(x, y);
    this.lineTo(x + width, y);
    this.lineTo(x + width, y + height);
    this.lineTo(x, y + height);
    this.closePath();
  }

  arc(cx, cy, radius, startAngle, endAngle, anticlockwise = false) {
    const total = normalizeSweep(startAngle, endAngle, anticlockwise);
    const steps = Math.max(1, Math.ceil(Math.abs(total) / (Math.PI / 2)));
    const step = total / steps;
    const start = { x: cx + Math.cos(startAngle) * radius, y: cy + Math.sin(startAngle) * radius };
    if (!this.path.length) {
      this.moveTo(start.x, start.y);
    }
    else {
      this.lineTo(start.x, start.y);
    }
    for (let index = 0; index < steps; index += 1) {
      const a0 = startAngle + step * index;
      const a1 = a0 + step;
      const k = 4 / 3 * Math.tan((a1 - a0) / 4);
      const p0 = { x: cx + Math.cos(a0) * radius, y: cy + Math.sin(a0) * radius };
      const p3 = { x: cx + Math.cos(a1) * radius, y: cy + Math.sin(a1) * radius };
      this.bezierCurveTo(
        p0.x - Math.sin(a0) * radius * k,
        p0.y + Math.cos(a0) * radius * k,
        p3.x + Math.sin(a1) * radius * k,
        p3.y - Math.cos(a1) * radius * k,
        p3.x,
        p3.y
      );
    }
  }

  ellipse(cx, cy, radiusX, radiusY, rotation, startAngle, endAngle, anticlockwise = false) {
    this.save();
    this.translate(cx, cy);
    this.rotate(rotation || 0);
    this.scale(radiusX || 1, radiusY || 1);
    this.arc(0, 0, 1, startAngle, endAngle, anticlockwise);
    this.restore();
  }

  fill(rule = "nonzero") {
    this.paintPath(false, true, rule);
  }

  stroke() {
    this.paintPath(true, false);
  }

  fillRect(x, y, width, height) {
    this.beginPath();
    this.rect(x, y, width, height);
    this.fill();
  }

  strokeRect(x, y, width, height) {
    this.beginPath();
    this.rect(x, y, width, height);
    this.stroke();
  }

  clip(rule = "nonzero") {
    this.parts.push(...this.path);
    this.parts.push(rule === "evenodd" ? "W* n" : "W n");
    this.beginPath();
  }

  setLineDash(dash) {
    this.state.lineDash = Array.isArray(dash) ? dash.map(value => Math.max(0, Number(value) || 0)) : [];
  }

  translate(x, y) {
    this.transform(1, 0, 0, 1, x, y);
  }

  rotate(angle) {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    this.transform(cos, sin, -sin, cos, 0, 0);
  }

  scale(x, y = x) {
    this.transform(x, 0, 0, y, 0, 0);
  }

  transform(a, b, c, d, e, f) {
    this.currentTransform = multiply(this.currentTransform, [a, b, c, d, e, f]);
  }

  setTransform(a, b, c, d, e, f) {
    this.currentTransform = [a, b, c, d, e, f];
  }

  fillText(text, x, y, maxWidth = 0) {
    const scaleFactor = transformScale(this.outputTransform());
    const size = fontSize(this.state.font) * scaleFactor;
    const value = String(text ?? "");
    const font = this.pdfFont(this.state.font, value);
    const p = this.apply(x, y);
    const rgb = parseColor(this.state.fillStyle, this.state.globalAlpha);
    const estimated = textWidth(value, size, font);
    const maxWidthPt = Math.max(0, Number(maxWidth) || 0) * scaleFactor;
    const fitScale = maxWidthPt > 0 && estimated > maxWidthPt ? maxWidthPt / estimated : 1;
    const offsetX = textOffsetX(this.state.textAlign, estimated * fitScale);
    const offsetY = textOffsetY(this.state.textBaseline, size);
    this.parts.push(`/${this.alphaStateName(rgb.a, rgb.a)} gs`);
    this.parts.push("BT");
    this.parts.push(`${n(rgb.r)} ${n(rgb.g)} ${n(rgb.b)} rg`);
    if (font.syntheticBold) {
      this.parts.push(`${n(rgb.r)} ${n(rgb.g)} ${n(rgb.b)} RG`);
      this.parts.push(`${n(Math.max(0.01, size * 0.035))} w`);
      this.parts.push("2 Tr");
    }
    this.parts.push(`/${font.resource} ${n(size)} Tf`);
    this.parts.push(`${n(fitScale)} 0 0 1 ${n(p.x + offsetX)} ${n(p.y + offsetY)} Tm`);
    this.parts.push(`<${pdfTextHex(value, font)}> Tj`);
    if (font.syntheticBold) {
      this.parts.push("0 Tr");
    }
    this.parts.push("ET");
  }

  strokeText(text, x, y, maxWidth = 0) {
    this.fillText(text, x, y, maxWidth);
  }

  measureText(text) {
    const font = this.pdfFont(this.state.font, String(text ?? ""));
    return { width: textWidth(String(text ?? ""), fontSize(this.state.font), font) };
  }

  pdfFont(font, text = "") {
    return pdfFont(this.fontSet, font, text);
  }

  drawImage() {
    // Bitmap map images are intentionally omitted from vector PDF output.
  }

  paintPath(stroke, fill, rule = "nonzero") {
    if (!this.path.length) return;
    this.parts.push(...this.graphicsState(stroke, fill));
    this.parts.push(...this.path);
    if (stroke && fill) {
      this.parts.push(rule === "evenodd" ? "B*" : "B");
    }
    else if (fill) {
      this.parts.push(rule === "evenodd" ? "f*" : "f");
    }
    else {
      this.parts.push("S");
    }
    this.beginPath();
  }

  graphicsState(stroke, fill) {
    const commands = [];
    const scaleFactor = transformScale(this.outputTransform());
    const strokeColor = stroke ? parseColor(this.state.strokeStyle, this.state.globalAlpha) : null;
    const fillColor = fill ? parseColor(this.state.fillStyle, this.state.globalAlpha) : null;
    commands.push(`${n(this.state.lineWidth * scaleFactor)} w`);
    commands.push(`${lineCap(this.state.lineCap)} J`);
    commands.push(`${lineJoin(this.state.lineJoin)} j`);
    commands.push(`${n(this.state.miterLimit)} M`);
    commands.push(`[${this.state.lineDash.map(value => n(value * scaleFactor)).join(" ")}] 0 d`);
    commands.push(`/${this.alphaStateName(strokeColor?.a ?? 1, fillColor?.a ?? 1)} gs`);
    if (stroke) {
      commands.push(`${n(strokeColor.r)} ${n(strokeColor.g)} ${n(strokeColor.b)} RG`);
    }
    if (fill) {
      commands.push(`${n(fillColor.r)} ${n(fillColor.g)} ${n(fillColor.b)} rg`);
    }
    return commands;
  }

  alphaStateName(strokeAlpha, fillAlpha) {
    const roundedStroke = alphaKey(strokeAlpha);
    const roundedFill = alphaKey(fillAlpha);
    const key = `${roundedStroke}|${roundedFill}`;
    if (!this.alphaStates.has(key)) {
      this.alphaStates.set(key, `GS${this.alphaStates.size + 1}`);
    }
    return this.alphaStates.get(key);
  }

  apply(x, y) {
    const [a, b, c, d, e, f] = this.outputTransform();
    return {
      x: a * x + c * y + e,
      y: b * x + d * y + f
    };
  }

  outputTransform() {
    return multiply(this.baseTransform, this.currentTransform);
  }
}

function buildPdf({ pageWidthPt, pageHeightPt, content, fontSet, alphaResources = "" }) {
  const chunks = [];
  const offsets = [0];
  let length = 0;

  const add = chunk => {
    const bytes = typeof chunk === "string" ? ascii(chunk) : chunk;
    chunks.push(bytes);
    length += bytes.length;
  };
  const object = (id, body) => {
    offsets[id] = length;
    add(`${id} 0 obj\n${body}\nendobj\n`);
  };
  const streamObject = (id, dict, data) => {
    offsets[id] = length;
    add(`${id} 0 obj\n${dict} /Length ${data.length} >>\nstream\n`);
    add(data);
    add("\nendstream\nendobj\n");
  };
  const fontObjects = createFontObjects(fontSet, 6);

  add("%PDF-1.4\n%\xE2\xE3\xCF\xD3\n");
  object(1, "<< /Type /Catalog /Pages 2 0 R >>");
  object(2, "<< /Type /Pages /Kids [3 0 R] /Count 1 >>");
  object(3, `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${n(pageWidthPt)} ${n(pageHeightPt)}] /Resources << /Font << ${fontObjects.resources} >>${alphaResources ? ` /ExtGState << ${alphaResources} >>` : ""} >> /Contents 4 0 R >>`);
  streamObject(4, "<<", ascii(content));
  object(5, "<< /Producer (O-Composer) >>");
  for (const item of fontObjects.objects) {
    if (item.stream) {
      streamObject(item.id, item.dict, item.data);
    }
    else {
      object(item.id, item.body);
    }
  }

  const xrefOffset = length;
  add(`xref\n0 ${fontObjects.nextId}\n0000000000 65535 f \n`);
  for (let id = 1; id < fontObjects.nextId; id += 1) {
    add(`${String(offsets[id]).padStart(10, "0")} 00000 n \n`);
  }
  add(`trailer\n<< /Size ${fontObjects.nextId} /Root 1 0 R /Info 5 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`);

  const output = new Uint8Array(length);
  let cursor = 0;
  for (const chunk of chunks) {
    output.set(chunk, cursor);
    cursor += chunk.length;
  }
  return output;
}

function buildImagePdf({ pageWidthPt, pageHeightPt, imageBytes, imageWidth, imageHeight, drawX, drawY, drawWidth, drawHeight }) {
  const content = ascii([
    "q",
    `${n(drawWidth)} 0 0 ${n(drawHeight)} ${n(drawX)} ${n(pageHeightPt - drawY - drawHeight)} cm`,
    "/Im1 Do",
    "Q"
  ].join("\n"));
  const chunks = [];
  const offsets = [0];
  let length = 0;

  const add = chunk => {
    const bytes = typeof chunk === "string" ? ascii(chunk) : chunk;
    chunks.push(bytes);
    length += bytes.length;
  };
  const object = (id, body) => {
    offsets[id] = length;
    add(`${id} 0 obj\n${body}\nendobj\n`);
  };
  const streamObject = (id, dict, data) => {
    offsets[id] = length;
    add(`${id} 0 obj\n${dict} /Length ${data.length} >>\nstream\n`);
    add(data);
    add("\nendstream\nendobj\n");
  };

  add("%PDF-1.4\n%\xE2\xE3\xCF\xD3\n");
  object(1, "<< /Type /Catalog /Pages 2 0 R >>");
  object(2, "<< /Type /Pages /Kids [3 0 R] /Count 1 >>");
  object(3, `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${n(pageWidthPt)} ${n(pageHeightPt)}] /Resources << /XObject << /Im1 5 0 R >> >> /Contents 4 0 R >>`);
  streamObject(4, "<<", content);
  streamObject(5, `<< /Type /XObject /Subtype /Image /Width ${Math.round(imageWidth)} /Height ${Math.round(imageHeight)} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode`, imageBytes);
  object(6, "<< /Producer (O-Composer) >>");

  const xrefOffset = length;
  add("xref\n0 7\n0000000000 65535 f \n");
  for (let id = 1; id <= 6; id += 1) {
    add(`${String(offsets[id]).padStart(10, "0")} 00000 n \n`);
  }
  add(`trailer\n<< /Size 7 /Root 1 0 R /Info 6 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`);

  const output = new Uint8Array(length);
  let cursor = 0;
  for (const chunk of chunks) {
    output.set(chunk, cursor);
    cursor += chunk.length;
  }
  return output;
}

function defaultState() {
  return {
    fillStyle: "#000",
    strokeStyle: "#000",
    lineWidth: 1,
    lineCap: "butt",
    lineJoin: "miter",
    miterLimit: 10,
    lineDash: [],
    globalAlpha: 1,
    font: "12px Helvetica",
    textAlign: "start",
    textBaseline: "alphabetic"
  };
}

function identity() {
  return [1, 0, 0, 1, 0, 0];
}

function multiply(m1, m2) {
  return [
    m1[0] * m2[0] + m1[2] * m2[1],
    m1[1] * m2[0] + m1[3] * m2[1],
    m1[0] * m2[2] + m1[2] * m2[3],
    m1[1] * m2[2] + m1[3] * m2[3],
    m1[0] * m2[4] + m1[2] * m2[5] + m1[4],
    m1[1] * m2[4] + m1[3] * m2[5] + m1[5]
  ];
}

function transformScale(matrix) {
  const sx = Math.hypot(matrix[0], matrix[1]);
  const sy = Math.hypot(matrix[2], matrix[3]);
  if (sx > 0 && sy > 0) {
    return (sx + sy) / 2;
  }
  return sx || sy || 1;
}

function normalizeSweep(start, end, anticlockwise) {
  let sweep = end - start;
  if (!anticlockwise && sweep < 0) sweep += Math.PI * 2;
  if (anticlockwise && sweep > 0) sweep -= Math.PI * 2;
  if (Math.abs(sweep) >= Math.PI * 2) return (anticlockwise ? -1 : 1) * Math.PI * 2;
  return sweep;
}

function parseColor(value, alpha = 1) {
  const text = String(value || "#000").trim();
  if (text.startsWith("#")) {
    const hex = text.slice(1);
    const full = hex.length === 3 ? hex.split("").map(char => char + char).join("") : hex.padEnd(6, "0").slice(0, 6);
    return {
      r: parseInt(full.slice(0, 2), 16) / 255,
      g: parseInt(full.slice(2, 4), 16) / 255,
      b: parseInt(full.slice(4, 6), 16) / 255,
      a: alpha
    };
  }
  const match = text.match(/rgba?\(([^)]+)\)/);
  if (match) {
    const parts = match[1].split(",").map(part => Number(part.trim()));
    return {
      r: clamp(parts[0] ?? 0, 0, 255) / 255,
      g: clamp(parts[1] ?? 0, 0, 255) / 255,
      b: clamp(parts[2] ?? 0, 0, 255) / 255,
      a: clamp((parts[3] ?? 1) * alpha, 0, 1)
    };
  }
  return { r: 0, g: 0, b: 0, a: alpha };
}

function lineCap(value) {
  return value === "round" ? 1 : value === "square" ? 2 : 0;
}

function lineJoin(value) {
  return value === "round" ? 1 : value === "bevel" ? 2 : 0;
}

function alphaKey(value) {
  return Number(clamp(Number(value), 0, 1).toFixed(3));
}

function fontSize(font) {
  return Number(String(font).match(/([0-9.]+)px/)?.[1]) || 12;
}

async function loadPdfFontSet({ includeCjk = false } = {}) {
  if (!pdfLatinFontSetPromise) {
    pdfLatinFontSetPromise = buildPdfFontSet(PDF_FONT_SOURCES);
  }
  if (!includeCjk) {
    return pdfLatinFontSetPromise;
  }
  if (!pdfCjkFontSetPromise) {
    pdfCjkFontSetPromise = buildPdfFontSet([...PDF_FONT_SOURCES, ...PDF_CJK_FONT_SOURCES]);
  }
  return pdfCjkFontSetPromise;
}

async function buildPdfFontSet(sources) {
  const fonts = await Promise.all(sources.map(loadPdfFont));
  const byKey = new Map(fonts.map(font => [font.key, font]));
  return { fonts, byKey };
}

async function loadPdfFont(source) {
  if (!pdfFontPromises.has(source.key)) {
    pdfFontPromises.set(source.key, (async () => {
      const response = await fetch(source.url);
      if (!response.ok) {
        throw new Error(`Could not load PDF font ${source.url}: ${response.status}`);
      }
      const bytes = new Uint8Array(await response.arrayBuffer());
      return { ...source, bytes, metrics: parseTrueTypeFont(bytes, source.name) };
    })());
  }
  return pdfFontPromises.get(source.key);
}

function pdfFont(fontSet, font, text = "") {
  if (requiresUnicodeFont(text)) {
    const face = fontSet.byKey.get("heiti-bold") || fontSet.fonts[0];
    return { ...face, syntheticBold: true, widthFactor: 1 };
  }
  const fontText = String(font || "");
  const lower = fontText.toLowerCase();
  const italic = /\b(italic|oblique)\b/i.test(fontText);
  const bold = /\b(700|800|900|bold)\b/i.test(fontText);
  const condensed = lower.includes("condensed") || lower.includes("narrow");
  const face = fontSet.byKey.get(condensed && bold ? "roboto-condensed-bold" : condensed ? "roboto-condensed" : bold ? "roboto-bold" : italic ? "roboto-italic" : "roboto")
    || fontSet.fonts[0];
  return {
    ...face,
    widthFactor: condensed ? 0.50 : 0.55
  };
}

function requiresUnicodeFont(text) {
  for (const char of String(text ?? "")) {
    const code = char.codePointAt(0);
    if (code > 255) return true;
  }
  return false;
}

function textWidth(text, size, font) {
  const metrics = font.metrics;
  const unitsPerEm = metrics?.unitsPerEm || 1000;
  let units = 0;
  for (const char of String(text ?? "")) {
    const code = char.codePointAt(0);
    units += metrics?.widths?.get(code) || metrics?.widths?.get(32) || unitsPerEm * font.widthFactor;
  }
  return units / unitsPerEm * size;
}

function textOffsetX(align, width) {
  if (["center", "middle"].includes(align)) return -width / 2;
  if (["right", "end"].includes(align)) return -width;
  return 0;
}

function textOffsetY(baseline, size) {
  if (baseline === "top" || baseline === "hanging") return -size;
  if (baseline === "middle") return -size * 0.35;
  if (baseline === "bottom" || baseline === "ideographic") return 0;
  return 0;
}

function createFontObjects(fontSet, firstId) {
  const objects = [];
  const resources = [];
  let id = firstId;
  for (const font of fontSet.fonts) {
    const fontId = id++;
    const descriptorId = id++;
    const fileId = id++;
    if (font.cjk) {
      const cidFontId = id++;
      const cidMapId = id++;
      resources.push(`/${font.resource} ${fontId} 0 R`);
      objects.push({
        id: fontId,
        body: `<< /Type /Font /Subtype /Type0 /BaseFont /${pdfName(font.metrics.name)} /Encoding /Identity-H /DescendantFonts [${cidFontId} 0 R] >>`
      });
      objects.push({
        id: cidFontId,
        body: `<< /Type /Font /Subtype /CIDFontType2 /BaseFont /${pdfName(font.metrics.name)} /CIDSystemInfo << /Registry (Adobe) /Ordering (Identity) /Supplement 0 >> /FontDescriptor ${descriptorId} 0 R /DW 1000 /W ${cidWidths(font)} /CIDToGIDMap ${cidMapId} 0 R >>`
      });
      objects.push({
        id: descriptorId,
        body: fontDescriptor(font, fileId, 4)
      });
      objects.push({
        id: fileId,
        dict: `<< /Length1 ${font.bytes.length}`,
        data: font.bytes,
        stream: true
      });
      objects.push({
        id: cidMapId,
        dict: "<<",
        data: cidToGidMap(font),
        stream: true
      });
      continue;
    }
    const widths = [];
    for (let code = 32; code <= 255; code += 1) {
      widths.push(Math.round(font.metrics.widths.get(code) || font.metrics.widths.get(32) || font.metrics.unitsPerEm * 0.55));
    }
    resources.push(`/${font.resource} ${fontId} 0 R`);
    objects.push({
      id: fontId,
      body: `<< /Type /Font /Subtype /TrueType /BaseFont /${pdfName(font.metrics.name)} /FirstChar 32 /LastChar 255 /Widths [${widths.join(" ")}] /Encoding /WinAnsiEncoding /FontDescriptor ${descriptorId} 0 R >>`
    });
    objects.push({
      id: descriptorId,
      body: fontDescriptor(font, fileId, 32)
    });
    objects.push({
      id: fileId,
      dict: `<< /Length1 ${font.bytes.length}`,
      data: font.bytes,
      stream: true
    });
  }
  return { resources: resources.join(" "), objects, nextId: id };
}

function fontDescriptor(font, fileId, flags) {
  return `<< /Type /FontDescriptor /FontName /${pdfName(font.metrics.name)} /Flags ${flags} /FontBBox [${font.metrics.bbox.map(n).join(" ")}] /ItalicAngle ${font.key.includes("italic") ? -12 : 0} /Ascent ${n(font.metrics.ascent)} /Descent ${n(font.metrics.descent)} /CapHeight ${n(font.metrics.capHeight)} /StemV 80 /FontFile2 ${fileId} 0 R >>`;
}

function cidWidths(font) {
  const values = [];
  for (let code = 0; code <= 0xffff; code += 1) {
    values.push(Math.round(font.metrics.widths.get(code) || font.metrics.widths.get(32) || 1000));
  }
  return `[0 [${values.join(" ")}]]`;
}

function cidToGidMap(font) {
  const bytes = new Uint8Array(0x10000 * 2);
  for (let code = 0; code <= 0xffff; code += 1) {
    const glyph = font.metrics.cmap.get(code) || 0;
    bytes[code * 2] = (glyph >> 8) & 0xff;
    bytes[code * 2 + 1] = glyph & 0xff;
  }
  return bytes;
}

function parseTrueTypeFont(bytes, fallbackName) {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const tables = ttfTables(view);
  const head = table(view, tables, "head");
  const hhea = table(view, tables, "hhea");
  const maxp = table(view, tables, "maxp");
  const hmtx = table(view, tables, "hmtx");
  const os2 = table(view, tables, "OS/2");
  const unitsPerEm = u16(view, head + 18) || 1000;
  const bbox = [i16(view, head + 36), i16(view, head + 38), i16(view, head + 40), i16(view, head + 42)].map(value => value * 1000 / unitsPerEm);
  const ascent = i16(view, hhea + 4) * 1000 / unitsPerEm;
  const descent = i16(view, hhea + 6) * 1000 / unitsPerEm;
  const capHeight = os2 ? i16(view, os2 + 88) * 1000 / unitsPerEm : ascent * 0.7;
  const numberOfHMetrics = u16(view, hhea + 34);
  const numGlyphs = u16(view, maxp + 4);
  const advanceWidths = [];
  let lastWidth = 0;
  for (let glyph = 0; glyph < numGlyphs; glyph += 1) {
    if (glyph < numberOfHMetrics) {
      lastWidth = u16(view, hmtx + glyph * 4);
    }
    advanceWidths[glyph] = lastWidth;
  }
  const cmap = parseCmap(view, table(view, tables, "cmap"));
  const widths = new Map();
  for (const [code, glyph] of cmap) {
    if (code > 0xffff) continue;
    widths.set(code, (advanceWidths[glyph] || advanceWidths[0] || unitsPerEm * 0.55) * 1000 / unitsPerEm);
  }
  for (let code = 0; code <= 255; code += 1) {
    const glyph = cmap.get(code) || 0;
    widths.set(code, (advanceWidths[glyph] || advanceWidths[0] || unitsPerEm * 0.55) * 1000 / unitsPerEm);
  }
  return { name: fallbackName, unitsPerEm: 1000, bbox, ascent, descent, capHeight, widths, cmap };
}

function ttfTables(view) {
  const count = u16(view, 4);
  const tables = new Map();
  for (let index = 0; index < count; index += 1) {
    const offset = 12 + index * 16;
    const tag = String.fromCharCode(u8(view, offset), u8(view, offset + 1), u8(view, offset + 2), u8(view, offset + 3));
    tables.set(tag, { offset: u32(view, offset + 8), length: u32(view, offset + 12) });
  }
  return tables;
}

function table(view, tables, tag) {
  const item = tables.get(tag);
  if (!item) throw new Error(`PDF font is missing ${tag} table`);
  if (item.offset + item.length > view.byteLength) throw new Error(`PDF font has invalid ${tag} table`);
  return item.offset;
}

function parseCmap(view, cmapOffset) {
  const count = u16(view, cmapOffset + 2);
  let selected = 0;
  let selectedFormat = 0;
  for (let index = 0; index < count; index += 1) {
    const record = cmapOffset + 4 + index * 8;
    const platform = u16(view, record);
    const encoding = u16(view, record + 2);
    const offset = cmapOffset + u32(view, record + 4);
    const format = u16(view, offset);
    if (format === 12 && ((platform === 3 && encoding === 10) || platform === 0)) {
      selected = offset;
      selectedFormat = format;
      break;
    }
    if (!selected && format === 4 && ((platform === 3 && [1, 10].includes(encoding)) || platform === 0)) {
      selected = offset;
      selectedFormat = format;
    }
  }
  if (!selected) throw new Error("PDF font is missing a Unicode cmap");
  return selectedFormat === 12 ? parseCmapFormat12(view, selected) : parseCmapFormat4(view, selected);
}

function parseCmapFormat4(view, offset) {
  const segCount = u16(view, offset + 6) / 2;
  const endCodes = offset + 14;
  const startCodes = endCodes + segCount * 2 + 2;
  const idDeltas = startCodes + segCount * 2;
  const idRangeOffsets = idDeltas + segCount * 2;
  const cmap = new Map();
  for (let segment = 0; segment < segCount; segment += 1) {
    const end = u16(view, endCodes + segment * 2);
    const start = u16(view, startCodes + segment * 2);
    const delta = i16(view, idDeltas + segment * 2);
    const rangeOffset = u16(view, idRangeOffsets + segment * 2);
    for (let code = start; code <= end && code <= 0xffff; code += 1) {
      if (code === 0xffff) continue;
      let glyph = 0;
      if (rangeOffset === 0) {
        glyph = (code + delta) & 0xffff;
      }
      else {
        const glyphOffset = idRangeOffsets + segment * 2 + rangeOffset + (code - start) * 2;
        if (glyphOffset + 2 <= view.byteLength) {
          const raw = u16(view, glyphOffset);
          glyph = raw ? (raw + delta) & 0xffff : 0;
        }
      }
      cmap.set(code, glyph);
    }
  }
  return cmap;
}

function parseCmapFormat12(view, offset) {
  const groupCount = u32(view, offset + 12);
  const cmap = new Map();
  for (let index = 0; index < groupCount; index += 1) {
    const group = offset + 16 + index * 12;
    const start = u32(view, group);
    const end = u32(view, group + 4);
    const startGlyph = u32(view, group + 8);
    for (let code = start; code <= end && code <= 0xffff; code += 1) {
      cmap.set(code, startGlyph + code - start);
    }
  }
  return cmap;
}

function pdfTextHex(value, font) {
  if (font?.cjk) {
    const bytes = [];
    for (const char of String(value ?? "")) {
      const code = char.codePointAt(0);
      const value16 = code <= 0xffff ? code : 63;
      bytes.push((value16 >> 8) & 0xff, value16 & 0xff);
    }
    return bytes.map(byte => byte.toString(16).padStart(2, "0")).join("").toUpperCase();
  }
  const bytes = [];
  for (const char of String(value ?? "")) {
    const code = char.codePointAt(0);
    bytes.push(code >= 32 && code <= 255 ? code : 63);
  }
  return bytes.map(byte => byte.toString(16).padStart(2, "0")).join("").toUpperCase();
}

function pdfName(value) {
  return String(value || "Roboto").replace(/[^A-Za-z0-9_-]/g, "");
}

function dataUrlBytes(dataUrl) {
  const text = String(dataUrl || "");
  const comma = text.indexOf(",");
  const header = comma >= 0 ? text.slice(0, comma).toLowerCase() : "";
  const encoded = comma >= 0 ? text.slice(comma + 1) : text;
  const binary = header.includes(";base64")
    ? atob(encoded)
    : decodeURIComponent(encoded);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

function bytesLookLikePdf(bytes) {
  if (!bytes || bytes.length < 5) return false;
  const maxOffset = Math.min(1024, bytes.length - 5);
  for (let offset = 0; offset <= maxOffset; offset += 1) {
    if (bytes[offset] === 0x25
      && bytes[offset + 1] === 0x50
      && bytes[offset + 2] === 0x44
      && bytes[offset + 3] === 0x46
      && bytes[offset + 4] === 0x2d) {
      return true;
    }
  }
  return false;
}

async function canvasJpegBytes(canvas) {
  if (canvas?.toBlob) {
    const blob = await new Promise((resolve, reject) => {
      canvas.toBlob(result => {
        if (result) {
          resolve(result);
        }
        else {
          reject(new Error("Could not encode PDF map image."));
        }
      }, "image/jpeg", 1.0);
    });
    return new Uint8Array(await blob.arrayBuffer());
  }
  return dataUrlBytes(canvas.toDataURL("image/jpeg", 1.0));
}

function ascii(text) {
  const bytes = new Uint8Array(text.length);
  for (let index = 0; index < text.length; index += 1) {
    bytes[index] = text.charCodeAt(index) & 0xff;
  }
  return bytes;
}

function u8(view, offset) {
  return view.getUint8(offset);
}

function u16(view, offset) {
  return view.getUint16(offset, false);
}

function i16(view, offset) {
  return view.getInt16(offset, false);
}

function u32(view, offset) {
  return view.getUint32(offset, false);
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, Number.isFinite(value) ? value : min));
}

function n(value) {
  const rounded = Number(value.toFixed(3));
  return Object.is(rounded, -0) ? "0" : String(rounded);
}
