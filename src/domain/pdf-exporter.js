const MM_TO_PT = 72 / 25.4;

export async function createVectorMapPdfBlob({ pageWidthMm, pageHeightMm, marginMm = 3, canvasWidth, canvasHeight, draw }) {
  const pageWidthPt = pageWidthMm * MM_TO_PT;
  const pageHeightPt = pageHeightMm * MM_TO_PT;
  const marginPt = Math.max(0, marginMm) * MM_TO_PT;
  const contentWidth = Math.max(1, pageWidthPt - marginPt * 2);
  const contentHeight = Math.max(1, pageHeightPt - marginPt * 2);
  const canvasAspect = canvasWidth / Math.max(1, canvasHeight);
  const contentAspect = contentWidth / contentHeight;
  const drawWidth = canvasAspect > contentAspect ? contentWidth : contentHeight * canvasAspect;
  const drawHeight = canvasAspect > contentAspect ? contentWidth / canvasAspect : contentHeight;
  const drawX = marginPt + (contentWidth - drawWidth) / 2;
  const drawY = marginPt + (contentHeight - drawHeight) / 2;
  const ctx = new PdfCanvasContext(canvasWidth, canvasHeight, {
    x: drawX,
    y: pageHeightPt - drawY - drawHeight,
    width: drawWidth,
    height: drawHeight
  });

  draw(ctx);

  return new Blob([buildPdf({
    pageWidthPt,
    pageHeightPt,
    content: ctx.content()
  })], { type: "application/pdf" });
}

class PdfCanvasContext {
  constructor(width, height, box) {
    this.canvas = { width, height, clientWidth: width, clientHeight: height };
    this.width = width;
    this.height = height;
    this.box = box;
    this.parts = [];
    this.path = [];
    this.state = defaultState();
    this.stack = [];
    this.currentPoint = { x: 0, y: 0 };
    this.currentTransform = identity();
    this.parts.push("q");
    this.parts.push(`${n(box.width / width)} 0 0 ${n(-box.height / height)} ${n(box.x)} ${n(box.y + box.height)} cm`);
    this.rect(0, 0, width, height);
    this.clip();
    this.beginPath();
  }

  content() {
    return `${this.parts.join("\n")}\nQ\n`;
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
    const size = fontSize(this.state.font);
    const p = this.apply(x, y);
    const rgb = parseColor(this.state.fillStyle, this.state.globalAlpha);
    const value = String(text ?? "");
    const estimated = value.length * size * 0.55;
    const scale = maxWidth > 0 && estimated > maxWidth ? maxWidth / estimated : 1;
    const offsetX = textOffsetX(this.state.textAlign, estimated * scale);
    const offsetY = textOffsetY(this.state.textBaseline, size);
    this.parts.push("BT");
    this.parts.push(`${n(rgb.r)} ${n(rgb.g)} ${n(rgb.b)} rg`);
    this.parts.push(`/F1 ${n(size)} Tf`);
    this.parts.push(`${n(scale)} 0 0 1 ${n(p.x + offsetX)} ${n(p.y + offsetY)} Tm`);
    this.parts.push(`(${pdfText(value)}) Tj`);
    this.parts.push("ET");
  }

  strokeText(text, x, y, maxWidth = 0) {
    this.fillText(text, x, y, maxWidth);
  }

  measureText(text) {
    return { width: String(text ?? "").length * fontSize(this.state.font) * 0.55 };
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
    commands.push(`${n(this.state.lineWidth)} w`);
    commands.push(`${lineCap(this.state.lineCap)} J`);
    commands.push(`${lineJoin(this.state.lineJoin)} j`);
    commands.push(`${n(this.state.miterLimit)} M`);
    commands.push(`[${this.state.lineDash.map(n).join(" ")}] 0 d`);
    if (stroke) {
      const color = parseColor(this.state.strokeStyle, this.state.globalAlpha);
      commands.push(`${n(color.r)} ${n(color.g)} ${n(color.b)} RG`);
    }
    if (fill) {
      const color = parseColor(this.state.fillStyle, this.state.globalAlpha);
      commands.push(`${n(color.r)} ${n(color.g)} ${n(color.b)} rg`);
    }
    return commands;
  }

  apply(x, y) {
    const [a, b, c, d, e, f] = this.currentTransform;
    return {
      x: a * x + c * y + e,
      y: b * x + d * y + f
    };
  }
}

function buildPdf({ pageWidthPt, pageHeightPt, content }) {
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
  object(3, `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${n(pageWidthPt)} ${n(pageHeightPt)}] /Resources << /Font << /F1 6 0 R >> >> /Contents 4 0 R >>`);
  streamObject(4, "<<", ascii(content));
  object(5, "<< /Producer (O-Composer) >>");
  object(6, "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");

  const xrefOffset = length;
  add("xref\n0 7\n0000000000 65535 f \n");
  for (let id = 1; id <= 6; id += 1) {
    add(`${String(offsets[id]).padStart(10, "0")} 00000 n \n`);
  }
  add(`trailer\n<< /Size 7 /Root 1 0 R /Info 5 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`);

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

function fontSize(font) {
  return Number(String(font).match(/([0-9.]+)px/)?.[1]) || 12;
}

function textOffsetX(align, width) {
  if (["center", "middle"].includes(align)) return -width / 2;
  if (["right", "end"].includes(align)) return -width;
  return 0;
}

function textOffsetY(baseline, size) {
  if (baseline === "top" || baseline === "hanging") return size;
  if (baseline === "middle") return size * 0.35;
  if (baseline === "bottom" || baseline === "ideographic") return 0;
  return 0;
}

function pdfText(value) {
  return String(value).replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function ascii(text) {
  const bytes = new Uint8Array(text.length);
  for (let index = 0; index < text.length; index += 1) {
    bytes[index] = text.charCodeAt(index) & 0xff;
  }
  return bytes;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, Number.isFinite(value) ? value : min));
}

function n(value) {
  const rounded = Number(value.toFixed(3));
  return Object.is(rounded, -0) ? "0" : String(rounded);
}
