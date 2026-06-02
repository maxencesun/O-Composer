import {
  allControlsView,
  courseLegs,
  courseView,
  eventBounds,
  getControl,
  getCourse,
  controlsUsedByCourse
} from "../domain/course-service.js";
import {
  createDescriptionSpecialOptions,
  descriptionBounds,
  drawControlDescriptionBlock,
  resizedDescriptionSpecial
} from "../domain/control-descriptions.js";
import { effectivePrintArea } from "../domain/print-area.js";
import {
  createCourseSymbolMetrics,
  defaultControlLabelPoint,
  directionAngle,
  drawControlLabel,
  drawCourseControl,
  drawCourseLeg,
  drawPointSpecialSymbol,
  symbolApparentRadius
} from "./course-symbols.js";
import { drawOmapMap } from "./omap-renderer.js";

const PURPLE = "rgba(166, 38, 255, 0.82)";
const LOWER_PURPLE = "rgba(166, 38, 255, 0.46)";
const DEFAULT_TEXT_FONT_HEIGHT = 3;
const TEXT_MIN_WIDTH_PX = 48;
const TEXT_MIN_HEIGHT_PX = 20;
const ADDABLE_CONTROL_SNAP_PIXELS = 24;
const SPECIAL_COLORS = Object.freeze({
  "upper-purple": PURPLE,
  "lower-purple": LOWER_PURPLE,
  black: "#1f2933",
  white: "#ffffff",
  red: "#d73535",
  blue: "#2477c9",
  green: "#2f855a"
});
const GRID = "#d8d4c7";
const OMAP_LAYER_PADDING = 0.35;
const NORMALIZED_CONTROL_NUMBER_DISTANCE = 1.825;

export class MapView {
  constructor(canvas, store, callbacks = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.store = store;
    this.callbacks = callbacks;
    this.bounds = eventBounds(store.snapshot().eventModel);
    this.drag = null;
    this.backgroundImage = null;
    this.backgroundUrl = "";
    this.omapMap = null;
    this.omapLayer = null;
    this.omapFastUntil = 0;
    this.omapRefreshTimer = 0;
    this.omapWorker = null;
    this.omapWorkerDisabled = false;
    this.omapWorkerBusy = false;
    this.omapWorkerDesired = null;
    this.omapWorkerPendingKey = "";
    this.omapWorkerRequestId = 0;
    this.omapMapVersion = 0;
    this.omapWorkerMapVersion = 0;
    this.drawFrame = 0;
    this.pendingState = null;
    this.lastDrawState = store.snapshot();
    this.toolPreview = null;

    this.canvas.addEventListener("pointerdown", event => this.pointerDown(event));
    this.canvas.addEventListener("pointermove", event => this.pointerMove(event));
    this.canvas.addEventListener("pointerup", event => this.pointerUp(event));
    this.canvas.addEventListener("pointercancel", () => this.cancelDrag());
    this.canvas.addEventListener("pointerleave", () => this.clearToolPreview());
    this.canvas.addEventListener("dblclick", event => this.doubleClick(event));
    this.canvas.addEventListener("wheel", event => this.wheel(event), { passive: false });
    window.addEventListener("resize", () => {
      this.invalidateOmapLayer();
      this.requestDraw(this.store.snapshot());
    });
  }

  setBackground(url) {
    this.backgroundUrl = url || "";
    this.backgroundImage = null;
    if (url) {
      const image = new Image();
      image.onload = () => {
        this.backgroundImage = image;
        this.requestDraw(this.store.snapshot());
      };
      image.src = url;
    }
  }

  setOmap(omapMap) {
    this.omapMap = omapMap || null;
    this.omapMapVersion += 1;
    this.omapWorkerMapVersion = 0;
    this.omapWorkerDesired = null;
    this.invalidateOmapLayer();
    this.requestDraw(this.store.snapshot());
  }

  fit() {
    this.store.updateUi(ui => {
      ui.zoom = 1;
      ui.pan = { x: 0, y: 0 };
    }, "Fit view");
  }

  draw(state) {
    const { eventModel, ui } = state;
    this.lastDrawState = state;
    if (this.resizeForDpi()) {
      this.invalidateOmapLayer();
    }
    this.bounds = this.visibleBounds(eventModel);
    const ctx = this.ctx;
    const width = this.canvas.clientWidth;
    const height = this.canvas.clientHeight;
    ctx.clearRect(0, 0, width, height);
    ctx.save();
    ctx.fillStyle = "#f8f7f2";
    ctx.fillRect(0, 0, width, height);
    this.drawGrid(ctx, width, height, ui);
    this.drawBackground(ctx, width, height, ui);
    this.drawOmap(ctx, ui);
    if (ui.showPrintArea) {
      this.drawPrintArea(ctx, eventModel, ui);
    }
    this.drawSpecials(ctx, eventModel, ui);
    this.drawCourse(ctx, eventModel, ui);
    this.drawAddableControls(ctx, eventModel, ui);
    this.drawSelection(ctx, eventModel, ui);
    this.drawSpecialHandles(ctx, eventModel, ui);
    this.drawMovePreview(ctx, eventModel, ui);
    this.drawResizePreview(ctx, eventModel, ui);
    this.drawToolPreview(ctx, eventModel, ui);
    ctx.restore();
  }

  renderAreaToCanvas(eventModel, ui, area, size) {
    const width = Math.max(1, Math.round(size?.width || 1200));
    const height = Math.max(1, Math.round(size?.height || 1600));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    this.renderAreaToContext(ctx, eventModel, ui, area, { width, height }, { includeBitmapBackground: true });
    return canvas;
  }

  renderAreaToContext(ctx, eventModel, ui, area, size, options = {}) {
    const width = Math.max(1, Math.round(size?.width || 1200));
    const height = Math.max(1, Math.round(size?.height || 1600));
    const previousBounds = this.bounds;
    const exportBounds = {
      left: Math.min(area.left, area.right),
      right: Math.max(area.left, area.right),
      top: Math.max(area.top, area.bottom),
      bottom: Math.min(area.top, area.bottom),
      width: Math.max(0.1, Math.abs(area.right - area.left)),
      height: Math.max(0.1, Math.abs(area.top - area.bottom))
    };
    const exportUi = {
      ...ui,
      pan: { x: 0, y: 0 },
      zoom: 1,
      showPrintArea: false,
      printAreaEdit: null,
      selection: null,
      movePreview: null,
      resizePreview: null,
      tool: "select",
      highQuality: true,
      __viewport: { width, height }
    };
    try {
      this.bounds = exportBounds;
      ctx.fillStyle = "#f8f7f2";
      ctx.fillRect(0, 0, width, height);
      if (options.includeBitmapBackground) {
        this.drawBackground(ctx, width, height, exportUi);
      }
      this.drawOmapDirect(ctx, exportUi);
      this.drawSpecials(ctx, eventModel, exportUi);
      this.drawCourse(ctx, eventModel, exportUi);
    }
    finally {
      this.bounds = previousBounds;
    }
  }

  resizeForDpi() {
    const ratio = window.devicePixelRatio || 1;
    const rect = this.canvas.getBoundingClientRect();
    const width = Math.max(1, Math.floor(rect.width));
    const height = Math.max(1, Math.floor(rect.height));
    if (this.canvas.width !== width * ratio || this.canvas.height !== height * ratio) {
      this.canvas.width = width * ratio;
      this.canvas.height = height * ratio;
      this.ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      return true;
    }
    return false;
  }

  requestDraw(state = this.store.snapshot()) {
    this.pendingState = state;
    if (this.drawFrame) {
      return;
    }
    this.drawFrame = scheduleFrame(() => {
      this.drawFrame = 0;
      const nextState = this.pendingState || this.store.snapshot();
      this.pendingState = null;
      this.draw(nextState);
    });
  }

  drawGrid(ctx, width, height, ui) {
    ctx.save();
    ctx.strokeStyle = GRID;
    ctx.lineWidth = 1;
    const spacing = this.gridSpacing();
    const startX = Math.floor(this.bounds.left / spacing) * spacing;
    const endX = Math.ceil(this.bounds.right / spacing) * spacing;
    const startY = Math.floor(this.bounds.bottom / spacing) * spacing;
    const endY = Math.ceil(this.bounds.top / spacing) * spacing;
    ctx.globalAlpha = 0.75;
    for (let x = startX; x <= endX; x += spacing) {
      const p1 = this.toScreen({ x, y: this.bounds.bottom }, ui);
      const p2 = this.toScreen({ x, y: this.bounds.top }, ui);
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
    }
    for (let y = startY; y <= endY; y += spacing) {
      const p1 = this.toScreen({ x: this.bounds.left, y }, ui);
      const p2 = this.toScreen({ x: this.bounds.right, y }, ui);
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
    }
    ctx.restore();
  }

  drawBackground(ctx, width, height, ui) {
    if (!this.backgroundImage) {
      return;
    }
    const topLeft = this.toScreen({ x: this.bounds.left, y: this.bounds.top }, ui);
    const bottomRight = this.toScreen({ x: this.bounds.right, y: this.bounds.bottom }, ui);
    ctx.save();
    ctx.globalAlpha = ui.mapIntensity;
    ctx.drawImage(this.backgroundImage, topLeft.x, topLeft.y, bottomRight.x - topLeft.x, bottomRight.y - topLeft.y);
    ctx.restore();
  }

  drawOmap(ctx, ui) {
    if (!this.omapMap) {
      return;
    }
    const width = this.canvas.clientWidth || 1;
    const height = this.canvas.clientHeight || 1;
    const ratio = window.devicePixelRatio || 1;

    if (this.shouldUseFastOmapLayer() && this.drawTransformedOmapLayer(ctx, ui, width, height, ratio)) {
      return;
    }

    if (!this.omapLayerMatches(ui, width, height, ratio) && this.queueOmapLayerRender(ui, width, height, ratio)) {
      if (this.drawTransformedOmapLayer(ctx, ui, width, height, ratio)) {
        return;
      }
      if (!this.omapLayer) {
        return;
      }
    }

    if (!this.omapLayerMatches(ui, width, height, ratio)) {
      const previous = this.omapLayer;
      this.omapLayer = this.renderOmapLayer(ui, width, height, ratio);
      if (this.omapLayer !== previous) {
        releaseOmapLayer(previous);
      }
    }
    if (this.omapLayer) {
      this.drawOmapLayer(ctx, this.omapLayer, ui.mapIntensity);
    }
  }

  drawOmapDirect(ctx, ui) {
    if (!this.omapMap) {
      return;
    }
    ctx.save();
    ctx.globalAlpha = ui.mapIntensity;
    drawOmapMap(ctx, this.omapMap, point => this.toScreen(point, ui), this.scale(ui), {
      highQuality: true,
      mapBounds: {
        left: this.bounds.left,
        right: this.bounds.right,
        top: this.bounds.top,
        bottom: this.bounds.bottom
      }
    });
    ctx.restore();
  }

  renderOmapLayer(ui, width, height, ratio) {
    const view = this.createOmapLayerView(ui, width, height, ratio);
    const layer = document.createElement("canvas");
    layer.width = Math.max(1, Math.floor(view.layerWidth * view.ratio));
    layer.height = Math.max(1, Math.floor(view.layerHeight * view.ratio));

    const layerCtx = layer.getContext("2d");
    if (!layerCtx) {
      return null;
    }

    layerCtx.setTransform(view.ratio, 0, 0, view.ratio, 0, 0);
    drawOmapMap(layerCtx, this.omapMap, point => {
      const screen = this.toScreen(point, ui);
      return { x: screen.x + view.padX, y: screen.y + view.padY };
    }, view.scale, {
      highQuality: ui.highQuality,
      mapBounds: view.mapBounds
    });

    return {
      source: layer,
      map: this.omapMap,
      mapVersion: this.omapMapVersion,
      width: view.layerWidth,
      height: view.layerHeight,
      viewportWidth: view.width,
      viewportHeight: view.height,
      padX: view.padX,
      padY: view.padY,
      ratio: view.ratio,
      bounds: view.bounds,
      zoom: view.zoom,
      pan: view.pan,
      scale: view.scale,
      highQuality: view.highQuality
    };
  }

  drawOmapLayer(ctx, layer, alpha) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.drawImage(layer.source, -layer.padX, -layer.padY, layer.width, layer.height);
    ctx.restore();
  }

  drawTransformedOmapLayer(ctx, ui, width, height, ratio) {
    const layer = this.omapLayer;
    if (!layer || !this.omapLayerCanTransform(layer, ui, width, height, ratio)) {
      return false;
    }
    const currentScale = this.scale(ui);
    const factor = currentScale / layer.scale;
    const oldCenter = boundsCenter(layer.bounds);
    const newCenter = boundsCenter(this.bounds);
    const screenTx = width / 2 + (oldCenter.x - newCenter.x) * currentScale + ui.pan.x - factor * (layer.viewportWidth / 2 + layer.pan.x);
    const screenTy = height / 2 + (newCenter.y - oldCenter.y) * currentScale + ui.pan.y - factor * (layer.viewportHeight / 2 + layer.pan.y);
    const tx = screenTx - factor * layer.padX;
    const ty = screenTy - factor * layer.padY;

    ctx.save();
    ctx.globalAlpha = ui.mapIntensity;
    ctx.transform(factor, 0, 0, factor, tx, ty);
    ctx.drawImage(layer.source, 0, 0, layer.width, layer.height);
    ctx.restore();
    return true;
  }

  omapLayerMatches(ui, width, height, ratio) {
    const layer = this.omapLayer;
    return !!layer
      && this.omapLayerCanTransform(layer, ui, width, height, ratio)
      && nearlyEqual(layer.zoom, ui.zoom)
      && nearlyEqual(layer.pan.x, ui.pan.x)
      && nearlyEqual(layer.pan.y, ui.pan.y);
  }

  omapLayerCanTransform(layer, ui, width, height, ratio) {
    return layer.map === this.omapMap
      && layer.mapVersion === this.omapMapVersion
      && layer.viewportWidth === width
      && layer.viewportHeight === height
      && layer.ratio === ratio
      && layer.highQuality === ui.highQuality
      && sameBounds(layer.bounds, this.bounds)
      && layer.scale > 0;
  }

  shouldUseFastOmapLayer() {
    return !!this.omapLayer && nowMs() < this.omapFastUntil;
  }

  startFastOmapInteraction() {
    if (!this.omapMap) {
      return;
    }
    this.omapFastUntil = nowMs() + 120;
    this.scheduleOmapRefresh();
  }

  scheduleOmapRefresh() {
    if (this.omapRefreshTimer) {
      clearTimeout(this.omapRefreshTimer);
    }
    this.omapRefreshTimer = setTimeout(() => {
      this.omapFastUntil = 0;
      this.requestDraw(this.store.snapshot());
    }, 70);
  }

  invalidateOmapLayer() {
    releaseOmapLayer(this.omapLayer);
    this.omapLayer = null;
  }

  queueOmapLayerRender(ui, width, height, ratio) {
    const worker = this.ensureOmapWorker();
    if (!worker) {
      return false;
    }
    const request = this.createOmapLayerRequest(ui, width, height, ratio);
    if (this.omapWorkerPendingKey === request.key || this.omapWorkerDesired?.key === request.key) {
      return true;
    }
    this.omapWorkerDesired = request;
    this.pumpOmapWorker();
    return true;
  }

  createOmapLayerRequest(ui, width, height, ratio) {
    const view = this.createOmapLayerView(ui, width, height, ratio);
    return {
      key: omapRenderKey(this.omapMapVersion, view),
      map: this.omapMap,
      mapVersion: this.omapMapVersion,
      view
    };
  }

  createOmapLayerView(ui, width, height, ratio) {
    const padX = Math.ceil(width * OMAP_LAYER_PADDING);
    const padY = Math.ceil(height * OMAP_LAYER_PADDING);
    const layerWidth = width + padX * 2;
    const layerHeight = height + padY * 2;
    const view = {
      width,
      height,
      layerWidth,
      layerHeight,
      padX,
      padY,
      ratio,
      bounds: { ...this.bounds },
      zoom: ui.zoom,
      pan: { ...ui.pan },
      scale: this.scale(ui),
      highQuality: ui.highQuality
    };
    view.mapBounds = layerMapBounds(view);
    return view;
  }

  pumpOmapWorker() {
    if (this.omapWorkerBusy || !this.omapWorkerDesired) {
      return;
    }
    const worker = this.ensureOmapWorker();
    if (!worker) {
      return;
    }
    const request = this.omapWorkerDesired;
    this.omapWorkerDesired = null;
    this.omapWorkerBusy = true;
    this.omapWorkerPendingKey = request.key;
    const requestId = ++this.omapWorkerRequestId;

    if (this.omapWorkerMapVersion !== request.mapVersion) {
      worker.postMessage({
        type: "setMap",
        map: request.map,
        mapVersion: request.mapVersion
      });
      this.omapWorkerMapVersion = request.mapVersion;
    }

    worker.postMessage({
      type: "render",
      requestId,
      mapVersion: request.mapVersion,
      view: request.view
    });
  }

  ensureOmapWorker() {
    if (this.omapWorkerDisabled || !this.omapMap || typeof Worker === "undefined" || typeof OffscreenCanvas === "undefined") {
      return null;
    }
    if (this.omapWorker) {
      return this.omapWorker;
    }
    try {
      const worker = new Worker(new URL("../workers/omap-render-worker.js", import.meta.url), { type: "module" });
      worker.onmessage = event => this.handleOmapWorkerMessage(event.data);
      worker.onerror = error => {
        this.disableOmapWorker(error?.message || "OMAP worker failed");
      };
      this.omapWorker = worker;
      return worker;
    }
    catch (error) {
      this.disableOmapWorker(error?.message || "OMAP worker unavailable");
      return null;
    }
  }

  handleOmapWorkerMessage(message) {
    if (!message || message.type !== "rendered") {
      return;
    }
    this.omapWorkerBusy = false;
    this.omapWorkerPendingKey = "";
    if (message.error) {
      this.disableOmapWorker(message.error);
      return;
    }
    if (message.bitmap && message.mapVersion === this.omapMapVersion) {
      const previous = this.omapLayer;
      this.omapLayer = {
        source: message.bitmap,
        map: this.omapMap,
        mapVersion: message.mapVersion,
        width: message.view.layerWidth,
        height: message.view.layerHeight,
        viewportWidth: message.view.width,
        viewportHeight: message.view.height,
        padX: message.view.padX,
        padY: message.view.padY,
        ratio: message.view.ratio,
        bounds: message.view.bounds,
        zoom: message.view.zoom,
        pan: message.view.pan,
        scale: message.view.scale,
        highQuality: message.view.highQuality
      };
      releaseOmapLayer(previous);
      this.requestDraw(this.store.snapshot());
    }
    else if (message.bitmap?.close) {
      message.bitmap.close();
    }
    this.pumpOmapWorker();
  }

  disableOmapWorker(reason) {
    if (this.omapWorkerDisabled) {
      return;
    }
    this.omapWorkerDisabled = true;
    this.omapWorkerBusy = false;
    this.omapWorkerDesired = null;
    this.omapWorkerPendingKey = "";
    if (this.omapWorker) {
      this.omapWorker.terminate();
      this.omapWorker = null;
    }
    console.warn(`Falling back to main-thread OMAP rendering: ${reason}`);
    this.requestDraw(this.store.snapshot());
  }

  drawPrintArea(ctx, eventModel, ui) {
    const current = ui.printAreaEdit?.area || effectivePrintArea(eventModel, ui.selectedCourseId);
    if (current) {
      this.drawPrintAreaRect(ctx, current, ui, "#2b6d62", 0.85);
    }
    if (ui.printAreaEdit?.preview) {
      this.drawPrintAreaRect(ctx, ui.printAreaEdit.preview, ui, "#2477c9", 1);
    }
  }

  drawPrintAreaRect(ctx, area, ui, color, alpha) {
    if (!area) return;
    const p1 = this.toScreen({ x: area.left, y: area.top }, ui);
    const p2 = this.toScreen({ x: area.right, y: area.bottom }, ui);
    const x = Math.min(p1.x, p2.x);
    const y = Math.min(p1.y, p2.y);
    const width = Math.abs(p2.x - p1.x);
    const height = Math.abs(p2.y - p1.y);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = color;
    ctx.fillStyle = "rgba(36, 119, 201, 0.08)";
    ctx.setLineDash([8, 5]);
    ctx.lineWidth = 2;
    if (ui.printAreaEdit?.preview === area) {
      ctx.fillRect(x, y, width, height);
    }
    ctx.strokeRect(x, y, width, height);
    ctx.restore();
  }

  drawSpecials(ctx, eventModel, ui) {
    const selectedCourse = ui.selectedCourseId === "all" ? null : getCourse(eventModel, ui.selectedCourseId);
    const metrics = createCourseSymbolMetrics(eventModel, selectedCourse, eventModel.event.courseAppearance, this.scale(ui), false);
    for (const special of eventModel.specials) {
      const points = (special.locations || []).map(point => this.toScreen(point, ui));
      ctx.save();
      if (["boundary", "line"].includes(special.kind) && points.length >= 2) {
        drawLineSpecial(ctx, special, points, this.scale(ui));
      }
      else if (["out-of-bounds", "dangerous-area", "temporary-construction", "white-out"].includes(special.kind) && points.length >= 3) {
        ctx.strokeStyle = specialColor(special);
        ctx.fillStyle = fillForSpecial(special.kind);
        ctx.lineWidth = specialLineWidth(special, this.scale(ui));
        pathLines(ctx, points, true);
        ctx.fill();
        ctx.stroke();
      }
      else if (special.kind === "rectangle" && points.length >= 2) {
        drawRectSpecial(ctx, special, points[0], points[1], this.scale(ui), false);
      }
      else if (special.kind === "ellipse" && points.length >= 2) {
        drawRectSpecial(ctx, special, points[0], points[1], this.scale(ui), true);
      }
      else if (special.kind === "text" && points.length >= 1) {
        drawTextSpecial(ctx, special, points, this.scale(ui));
      }
      else if (special.kind === "descriptions" && points.length >= 2) {
        drawControlDescriptionBlock(ctx, eventModel, special, ui.selectedCourseId, point => this.toScreen(point, ui));
      }
      else if (points.length) {
        if (!drawPointSpecialSymbol(ctx, special, points[0], metrics)) {
          drawFallbackSpecialPoint(ctx, special.kind, points[0]);
        }
      }
      ctx.restore();
    }
  }

  drawCourse(ctx, eventModel, ui) {
    const selectedCourseId = ui.selectedCourseId || "all";
    const allControls = selectedCourseId === "all" || ui.showAllControls;
    const selectedCourse = allControls ? null : getCourse(eventModel, selectedCourseId);
    const rows = selectedCourseId === "all" || ui.showAllControls
      ? allControlsView(eventModel)
      : courseView(eventModel, selectedCourseId);
    const legs = selectedCourseId === "all" || ui.showAllControls ? [] : courseLegs(eventModel, selectedCourseId);
    const metrics = createCourseSymbolMetrics(eventModel, selectedCourse, eventModel.event.courseAppearance, this.scale(ui), allControls);
    const autoGaps = automaticLegGaps(legs, rows, metrics, this.scale(ui), eventModel.event.courseAppearance?.autoLegGapSize || 3.5);
    const autoCircleGaps = allControls ? new Map() : automaticControlCircleGaps(rows, metrics, this.scale(ui));

    ctx.save();

    for (const leg of legs) {
      const mapPoints = legMapPoints(leg);
      const screenPoints = mapPoints.map(point => this.toScreen(point, ui));
      const startRadius = symbolApparentRadius(leg.from.control, metrics);
      const screenGaps = screenGapsForLeg(
        [...(leg.leg?.gaps || []), ...(autoGaps.get(legKey(leg)) || [])],
        this.scale(ui),
        startRadius
      );
      const flagRanges = screenFlagRangesForLeg(leg, this.scale(ui), startRadius);
      drawCourseLeg(ctx, screenPoints, leg.from.control, leg.to.control, metrics, isEntireLegFlagged(leg), {
        gaps: screenGaps,
        flagRanges,
        dashed: leg.from.control?.kind === "map-issue" && leg.to.control?.kind === "start"
      });
    }

    for (const row of rows) {
      const point = this.toScreen(row.control.location, ui);
      drawCourseControl(ctx, row.control, point, metrics, {
        directionAngle: outgoingDirection(row, legs),
        circleGaps: autoCircleGaps.get(String(row.control.id)) || []
      });
      if (row.label && row.control.kind === "normal") {
        const labelPoint = numberLocationPoint(row, point, metrics, rows, legs, location => this.toScreen(location, ui));
        drawControlLabel(ctx, row.label, labelPoint, metrics);
      }
    }
    ctx.restore();
  }

  drawAddableControls(ctx, eventModel, ui) {
    if (!ui.tool?.startsWith("control:") || !ui.selectedCourseId || ui.selectedCourseId === "all" || ui.showAllControls) {
      return;
    }
    const kind = ui.tool.slice("control:".length);
    const controls = addableControlsForTool(eventModel, ui.selectedCourseId, kind);
    if (!controls.length) return;
    const selectedCourse = getCourse(eventModel, ui.selectedCourseId);
    const metrics = createCourseSymbolMetrics(eventModel, selectedCourse, eventModel.event.courseAppearance, this.scale(ui), false);
    ctx.save();
    ctx.globalAlpha = 0.28;
    for (const control of controls) {
      const point = this.toScreen(control.location, ui);
      drawCourseControl(ctx, control, point, metrics, { directionAngle: Math.PI / 2 });
    }
    ctx.restore();
  }

  drawSelection(ctx, eventModel, ui) {
    if (!ui.selection) return;
    ctx.save();
    ctx.strokeStyle = "#2477c9";
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    if (ui.selection.type === "control") {
      const control = getControl(eventModel, ui.selection.id);
      if (control) {
        const selectedCourseId = ui.selectedCourseId || "all";
        const allControls = selectedCourseId === "all" || ui.showAllControls;
        const selectedCourse = allControls ? null : getCourse(eventModel, selectedCourseId);
        const metrics = createCourseSymbolMetrics(eventModel, selectedCourse, eventModel.event.courseAppearance, this.scale(ui), allControls);
        const point = this.toScreen(control.location, ui);
        const radius = Math.max(4, symbolApparentRadius(control, metrics));
        ctx.strokeRect(point.x - radius, point.y - radius, radius * 2, radius * 2);
        drawControlCenterPoint(ctx, point);
      }
    }
    else if (ui.selection.type === "leg" || ui.selection.type === "leg-bend") {
      const leg = selectedLegForSelection(eventModel, ui);
      if (leg) {
        const points = legMapPoints(leg).map(point => this.toScreen(point, ui));
        ctx.setLineDash([8, 5]);
        ctx.strokeStyle = "#2477c9";
        ctx.lineWidth = 3;
        pathLines(ctx, points, false);
        ctx.stroke();
        ctx.setLineDash([]);
        for (let index = 0; index < (leg.leg?.bends || []).length; index += 1) {
          const bendPoint = this.toScreen(leg.leg.bends[index], ui);
          drawBendDot(ctx, bendPoint, ui.selection.type === "leg-bend" && Number(ui.selection.bendIndex) === index);
        }
      }
    }
    else if (ui.selection.type === "leg-gap") {
      const leg = selectedLegForSelection(eventModel, ui);
      const gap = leg?.leg?.gaps?.[ui.selection.gapIndex];
      if (leg && gap) {
        const points = legMapPoints(leg);
        const start = pointAtPathDistance(points, gap.start);
        const end = pointAtPathDistance(points, gap.start + gap.length);
        const startScreen = this.toScreen(start, ui);
        const endScreen = this.toScreen(end, ui);
        ctx.setLineDash([]);
        ctx.strokeStyle = "#2477c9";
        ctx.lineWidth = 2;
        line(ctx, startScreen.x, startScreen.y, endScreen.x, endScreen.y);
        drawHandleDot(ctx, startScreen, "start");
        drawHandleDot(ctx, endScreen, "end");
      }
    }
    else if (ui.selection.type === "control-number") {
      const row = selectedControlNumberRow(eventModel, ui);
      if (row) {
        const selectedCourse = getCourse(eventModel, ui.selectedCourseId);
        const metrics = createCourseSymbolMetrics(eventModel, selectedCourse, eventModel.event.courseAppearance, this.scale(ui), false);
        const rows = courseView(eventModel, ui.selectedCourseId);
        const legs = courseLegs(eventModel, ui.selectedCourseId);
        const rect = controlNumberScreenRect(row, metrics, rows, legs, location => this.toScreen(location, ui), 4);
        ctx.strokeRect(rect.left, rect.top, rect.right - rect.left, rect.bottom - rect.top);
      }
    }
    else if (ui.selection.type === "special") {
      const special = eventModel.specials.find(item => item.id === ui.selection.id);
      if (special?.locations?.length) {
        const sourcePoints = special.kind === "descriptions"
          ? descriptionCornerPoints(eventModel, special, ui.selectedCourseId).map(point => this.toScreen(point, ui))
          : specialSelectionPoints(special, ui, this.scale(ui)).map(point => this.toScreen(point, ui));
        if (sourcePoints.length) {
          const rect = screenRectFromPoints(sourcePoints);
          ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
        }
        if (special.kind === "descriptions") {
          const points = descriptionCornerPoints(eventModel, special, ui.selectedCourseId).map(point => this.toScreen(point, ui));
          const rect = screenRectFromPoints(points);
          ctx.setLineDash([]);
          ctx.fillStyle = "#2477c9";
          ctx.fillRect(rect.x + rect.w + 2, rect.y + rect.h + 2, 10, 10);
        }
      }
    }
    ctx.restore();
  }

  drawSpecialHandles(ctx, eventModel, ui) {
    if (ui.selection?.type !== "special") return;
    const special = eventModel.specials.find(item => Number(item.id) === Number(ui.selection.id));
    if (!special) return;
    const scale = this.scale(ui);
    ctx.save();
    const handles = specialResizeHandles(special, ui, scale, eventModel);
    for (const handle of handles) {
      drawSquareHandle(ctx, this.toScreen(handle.point, ui), true);
    }
    ctx.restore();
  }

  drawMovePreview(ctx, eventModel, ui) {
    const preview = ui.movePreview;
    if (!preview?.selection || !preview.location) return;

    ctx.save();
    ctx.globalAlpha = 0.55;
    ctx.setLineDash([6, 4]);
    if (preview.selection.type === "control") {
      const control = getControl(eventModel, preview.selection.id);
      if (control) {
        const selectedCourseId = ui.selectedCourseId || "all";
        const allControls = selectedCourseId === "all" || ui.showAllControls;
        const selectedCourse = allControls ? null : getCourse(eventModel, selectedCourseId);
        const metrics = createCourseSymbolMetrics(eventModel, selectedCourse, eventModel.event.courseAppearance, this.scale(ui), allControls);
        const point = this.toScreen(preview.location, ui);
        drawCourseControl(ctx, { ...control, location: preview.location }, point, metrics, { directionAngle: Math.PI / 2 });
        ctx.strokeStyle = "#2477c9";
        ctx.lineWidth = 2;
        ctx.strokeRect(point.x - 24, point.y - 24, 48, 48);
      }
    }
    else if (preview.selection.type === "control-number") {
      const row = selectedControlNumberRow(eventModel, { ...ui, selection: preview.selection });
      if (row) {
        const selectedCourse = getCourse(eventModel, ui.selectedCourseId);
        const metrics = createCourseSymbolMetrics(eventModel, selectedCourse, eventModel.event.courseAppearance, this.scale(ui), false);
        const point = this.toScreen(preview.location, ui);
        drawControlLabel(ctx, row.label, point, metrics);
        const rect = controlNumberRect(row.label, point, metrics, 4);
        ctx.strokeStyle = "#2477c9";
        ctx.lineWidth = 2;
        ctx.strokeRect(rect.left, rect.top, rect.right - rect.left, rect.bottom - rect.top);
      }
    }
    else if (preview.selection.type === "special") {
      const special = eventModel.specials.find(item => item.id === preview.selection.id);
      if (special?.locations?.length) {
        const first = special.locations[0];
        const dx = preview.location.x - first.x;
        const dy = preview.location.y - first.y;
        const moved = { ...special, locations: special.locations.map(point => ({ x: point.x + dx, y: point.y + dy })) };
        if (moved.kind === "descriptions") {
          drawControlDescriptionBlock(ctx, eventModel, moved, ui.selectedCourseId, point => this.toScreen(point, ui));
        }
        const sourcePoints = moved.kind === "descriptions"
          ? descriptionCornerPoints(eventModel, moved, ui.selectedCourseId)
          : specialSelectionPoints(moved, ui, this.scale(ui));
        const points = sourcePoints.map(point => this.toScreen(point, ui));
        const rect = screenRectFromPoints(points);
        ctx.strokeStyle = "#2477c9";
        ctx.lineWidth = 2;
        ctx.strokeRect(rect.x - 8, rect.y - 8, rect.w + 16, rect.h + 16);
      }
    }
    ctx.restore();
  }

  drawResizePreview(ctx, eventModel, ui) {
    const preview = ui.resizePreview;
    if (!preview?.special) return;
    ctx.save();
    ctx.globalAlpha = 0.58;
    drawSpecialObject(ctx, eventModel, preview.special, ui, point => this.toScreen(point, ui), this.scale(ui));
    const sourcePoints = preview.special.kind === "descriptions"
      ? descriptionCornerPoints(eventModel, preview.special, ui.selectedCourseId)
      : specialSelectionPoints(preview.special, ui, this.scale(ui));
    const points = sourcePoints.map(point => this.toScreen(point, ui));
    const rect = screenRectFromPoints(points);
    ctx.strokeStyle = "#2477c9";
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 4]);
    ctx.strokeRect(rect.x - 8, rect.y - 8, rect.w + 16, rect.h + 16);
    ctx.restore();
  }

  drawToolPreview(ctx, eventModel, ui) {
    if (!this.toolPreview || this.toolPreview.tool !== ui.tool) {
      return;
    }
    const point = this.toScreen(this.toolPreview.point, ui);
    const selectedCourseId = ui.selectedCourseId || "all";
    const allControls = selectedCourseId === "all" || ui.showAllControls;
    const selectedCourse = allControls ? null : getCourse(eventModel, selectedCourseId);
    const metrics = createCourseSymbolMetrics(eventModel, selectedCourse, eventModel.event.courseAppearance, this.scale(ui), allControls);

    ctx.save();
    ctx.globalAlpha = 0.62;
    if (ui.tool.startsWith("control:")) {
      const kind = ui.tool.slice("control:".length);
      drawCourseControl(ctx, {
        kind,
        location: this.toolPreview.point,
        orientation: 0,
        stretch: 0,
        circleGaps: []
      }, point, metrics, { directionAngle: Math.PI / 2 });
    }
    else if (ui.tool.startsWith("special:")) {
      const kind = ui.tool.slice("special:".length);
      if (kind === "descriptions") {
        const special = this.descriptionDragPreview || {
          id: 0,
          kind,
          ...createDescriptionSpecialOptions(eventModel, this.toolPreview.point, ui.selectedCourseId)
        };
        drawControlDescriptionBlock(ctx, eventModel, special, ui.selectedCourseId, mapPoint => this.toScreen(mapPoint, ui));
      }
      else if (this.specialShapePreview && this.specialShapePreview.tool === ui.tool) {
        const special = this.specialShapePreview;
        const points = special.locations.map(location => this.toScreen(location, ui));
        if (special.kind === "line") {
          drawLineSpecial(ctx, special, points, this.scale(ui));
        }
        else if (special.kind === "rectangle") {
          drawRectSpecial(ctx, special, points[0], points[1], this.scale(ui), false);
        }
        else if (special.kind === "ellipse") {
          drawRectSpecial(ctx, special, points[0], points[1], this.scale(ui), true);
        }
      }
      else if (!drawPointSpecialSymbol(ctx, { kind, orientation: 0, stretch: 0 }, point, metrics)) {
        drawFallbackSpecialPoint(ctx, kind, point);
      }
    }
    ctx.restore();
  }

  pointerDown(event) {
    this.canvas.setPointerCapture(event.pointerId);
    const state = this.store.snapshot();
    const mapPoint = this.toMap({ x: event.offsetX, y: event.offsetY }, state.ui);
    if (state.ui.tool === "print-area-frame") {
      this.callbacks.onPrintAreaFrameMove?.(mapPoint);
      this.drag = {
        pointerId: event.pointerId,
        startScreen: { x: event.offsetX, y: event.offsetY },
        lastScreen: { x: event.offsetX, y: event.offsetY },
        startMap: mapPoint,
        hit: null,
        moved: false,
        panning: false,
        printAreaFrame: true
      };
      return;
    }
    if (state.ui.tool === "print-area") {
      this.drag = {
        pointerId: event.pointerId,
        startScreen: { x: event.offsetX, y: event.offsetY },
        lastScreen: { x: event.offsetX, y: event.offsetY },
        startMap: mapPoint,
        hit: null,
        moved: false,
        panning: false,
        printArea: true
      };
      return;
    }
    if (state.ui.tool === "special:descriptions") {
      const options = createDescriptionSpecialOptions(state.eventModel, mapPoint, state.ui.selectedCourseId);
      this.descriptionDragPreview = {
        ...options,
        id: 0,
        kind: "descriptions"
      };
      this.drag = {
        pointerId: event.pointerId,
        startScreen: { x: event.offsetX, y: event.offsetY },
        lastScreen: { x: event.offsetX, y: event.offsetY },
        startMap: mapPoint,
        hit: null,
        moved: false,
        panning: false,
        descriptionAdd: true
      };
      this.requestDraw(state);
      return;
    }
    if (isDragSpecialTool(state.ui.tool)) {
      this.specialShapePreview = specialShapeForDrag(state.ui.tool, mapPoint, mapPoint, state);
      this.drag = {
        pointerId: event.pointerId,
        startScreen: { x: event.offsetX, y: event.offsetY },
        lastScreen: { x: event.offsetX, y: event.offsetY },
        startMap: mapPoint,
        hit: null,
        moved: false,
        panning: false,
        specialShapeAdd: true,
        tool: state.ui.tool
      };
      this.requestDraw(state);
      return;
    }
    const hit = this.hitTest(mapPoint, state);
    const emptySpacePan = state.ui.tool === "select" && !state.ui.selection && !hit;
    this.drag = {
      pointerId: event.pointerId,
      startScreen: { x: event.offsetX, y: event.offsetY },
      lastScreen: { x: event.offsetX, y: event.offsetY },
      startMap: mapPoint,
      hit,
      moveOffset: moveOffsetForHit(state.eventModel, hit, mapPoint),
      resize: resizeForHit(hit),
      moved: false,
      panning: emptySpacePan || event.button === 1 || event.altKey || state.ui.tool === "pan"
    };
  }

  pointerMove(event) {
    const state = this.store.snapshot();
    const mapPoint = this.toMap({ x: event.offsetX, y: event.offsetY }, state.ui);
    this.callbacks.onHover?.(mapPoint);
    this.updateToolPreview(state.ui.tool, mapPoint);
    if (!this.drag || this.drag.pointerId !== event.pointerId) {
      return;
    }
    const dx = event.offsetX - this.drag.lastScreen.x;
    const dy = event.offsetY - this.drag.lastScreen.y;
    const total = Math.hypot(event.offsetX - this.drag.startScreen.x, event.offsetY - this.drag.startScreen.y);
    this.drag.moved = this.drag.moved || total > 3;
    this.drag.lastScreen = { x: event.offsetX, y: event.offsetY };

    if (this.drag.panning) {
      this.startFastOmapInteraction();
      this.store.updateUi(ui => {
        ui.pan = { x: ui.pan.x + dx, y: ui.pan.y + dy };
      }, "Pan");
      return;
    }

    if (this.drag.printArea) {
      this.callbacks.onPrintAreaPreview?.(this.drag.startMap, mapPoint);
      return;
    }

    if (this.drag.printAreaFrame) {
      this.callbacks.onPrintAreaFrameMove?.(mapPoint);
      return;
    }

    if (this.drag.descriptionAdd) {
      const base = {
        id: 0,
        kind: "descriptions",
        ...createDescriptionSpecialOptions(state.eventModel, this.drag.startMap, state.ui.selectedCourseId)
      };
      this.descriptionDragPreview = resizedDescriptionSpecial(state.eventModel, base, this.drag.startMap, mapPoint, state.ui.selectedCourseId);
      this.requestDraw(state);
      return;
    }

    if (this.drag.specialShapeAdd) {
      this.specialShapePreview = specialShapeForDrag(this.drag.tool, this.drag.startMap, mapPoint, state);
      this.requestDraw(state);
      return;
    }

    if (this.drag.resize && this.drag.moved && state.ui.tool === "select") {
      this.callbacks.onResizeSelectionPreview?.(this.drag.hit, this.drag.resize, mapPoint);
      return;
    }

    if (this.drag.hit?.type === "leg-gap" && this.drag.hit.handle && this.drag.moved && state.ui.tool === "select") {
      this.callbacks.onLegGapHandleMove?.(this.drag.hit, mapPoint);
      return;
    }

    if (this.drag.hit?.type === "leg-bend" && this.drag.moved && state.ui.tool === "select") {
      this.callbacks.onLegBendMove?.(this.drag.hit, mapPoint);
      return;
    }

    if (this.drag.hit && this.drag.moved && state.ui.tool === "select") {
      this.callbacks.onMoveSelectionPreview?.(this.drag.hit, moveTargetForDrag(this.drag, mapPoint));
    }
  }

  pointerUp(event) {
    if (!this.drag || this.drag.pointerId !== event.pointerId) {
      return;
    }
    const state = this.store.snapshot();
    const mapPoint = this.toMap({ x: event.offsetX, y: event.offsetY }, state.ui);
    if (this.drag.panning) {
      this.cancelDrag();
      return;
    }
    if (this.drag.printArea) {
      if (this.drag.moved) {
        this.callbacks.onPrintAreaCommit?.(this.drag.startMap, mapPoint);
      }
      this.cancelDrag();
      return;
    }
    if (this.drag.printAreaFrame) {
      this.callbacks.onPrintAreaFrameMove?.(mapPoint);
      this.cancelDrag();
      return;
    }
    if (this.drag.descriptionAdd) {
      const options = this.descriptionDragPreview || createDescriptionSpecialOptions(state.eventModel, this.drag.startMap, state.ui.selectedCourseId);
      this.callbacks.onAddDescriptionSpecial?.(this.drag.startMap, options);
      this.descriptionDragPreview = null;
      this.cancelDrag();
      return;
    }
    if (this.drag.specialShapeAdd) {
      const preview = this.specialShapePreview || specialShapeForDrag(this.drag.tool, this.drag.startMap, mapPoint, state);
      if (this.drag.moved) {
        this.callbacks.onToolPoint?.(this.drag.tool, this.drag.startMap, { locations: preview.locations });
      }
      this.specialShapePreview = null;
      this.cancelDrag();
      return;
    }
    if (this.drag.resize && this.drag.moved && state.ui.tool === "select") {
      this.callbacks.onResizeSelection?.(this.drag.hit, this.drag.resize, mapPoint);
      this.drag.hit = null;
    }
    else if (this.drag.hit?.type === "leg-gap" && this.drag.hit.handle && this.drag.moved && state.ui.tool === "select") {
      this.callbacks.onLegGapHandleMove?.(this.drag.hit, mapPoint);
      this.drag.hit = null;
    }
    else if (this.drag.hit?.type === "leg-bend" && this.drag.moved && state.ui.tool === "select") {
      this.callbacks.onLegBendMove?.(this.drag.hit, mapPoint);
      this.drag.hit = null;
    }
    else if (this.drag.hit && this.drag.moved && state.ui.tool === "select") {
      this.callbacks.onMoveSelection?.(this.drag.hit, moveTargetForDrag(this.drag, mapPoint));
      this.drag.hit = null;
    }
    else if (state.ui.tool === "line-cut") {
      const legHit = nearestLeg(mapPoint, state, 16 / this.scale(state.ui));
      this.callbacks.onManualLegCut?.(mapPoint, legHit);
    }
    else if (state.ui.tool === "leg-bend-add") {
      const legHit = nearestLeg(mapPoint, state, 16 / this.scale(state.ui));
      const selected = selectedLegForSelection(state.eventModel, state.ui);
      if (legHit?.leg && selected && legKey(legHit.leg) === legKey(selected)) {
        this.callbacks.onAddLegBend?.(legSelection(legHit.leg), mapPoint);
      }
      else {
        this.callbacks.onSelect?.(this.drag.hit);
      }
    }
    else if (state.ui.tool !== "select") {
      if (state.ui.tool.startsWith("control:")) {
        const existing = this.hitTestAddableControl(mapPoint, state, ADDABLE_CONTROL_SNAP_PIXELS / this.scale(state.ui));
        if (existing) {
          this.callbacks.onAddExistingControlToCourse?.(existing);
          this.cancelDrag();
          return;
        }
      }
      this.callbacks.onToolPoint?.(state.ui.tool, mapPoint);
    }
    else {
      this.callbacks.onSelect?.(this.drag.hit);
    }
    this.cancelDrag();
  }

  doubleClick(event) {
    const state = this.store.snapshot();
    const mapPoint = this.toMap({ x: event.offsetX, y: event.offsetY }, state.ui);
    const hit = this.hitTest(mapPoint, state);
    if (hit?.type === "leg-bend") {
      this.callbacks.onDeleteLegBend?.(hit);
      return;
    }
    const selected = selectedLegForSelection(state.eventModel, state.ui);
    if (!selected) return;
    const legHit = nearestLeg(mapPoint, state, 16 / this.scale(state.ui));
    if (legHit?.leg && legKey(legHit.leg) === legKey(selected)) {
      this.callbacks.onAddLegBend?.(legSelection(legHit.leg), mapPoint);
    }
  }

  cancelDrag() {
    if (this.drag?.hit) {
      this.callbacks.onMoveSelectionPreview?.(null, null);
      this.callbacks.onResizeSelectionPreview?.(null, null, null);
    }
    this.descriptionDragPreview = null;
    this.specialShapePreview = null;
    this.drag = null;
  }

  updateToolPreview(tool, point) {
    const previewable = typeof tool === "string" && (tool.startsWith("control:") || tool.startsWith("special:"));
    if (!previewable) {
      this.clearToolPreview();
      return;
    }
    this.toolPreview = {
      tool,
      point: { x: point.x, y: point.y }
    };
    this.requestDraw(this.store.snapshot());
  }

  clearToolPreview() {
    if (!this.toolPreview) {
      return;
    }
    this.toolPreview = null;
    this.requestDraw(this.store.snapshot());
  }

  wheel(event) {
    event.preventDefault();
    this.startFastOmapInteraction();
    const delta = wheelZoomFactor(event, this.canvas.clientHeight || 1);
    const cursor = { x: event.offsetX, y: event.offsetY };
    const before = this.toMap(cursor, this.store.snapshot().ui);
    this.store.updateUi(ui => {
      ui.zoom = clamp(ui.zoom * delta, 0.2, 12);
      const after = this.toScreen(before, ui);
      ui.pan = {
        x: ui.pan.x + cursor.x - after.x,
        y: ui.pan.y + cursor.y - after.y
      };
    }, "Zoom");
  }

  hitTest(point, state) {
    const scale = this.scale(state.ui);
    const baseThreshold = 16 / scale;
    const specialThreshold = 22 / scale;
    let best = null;
    let bestDistance = Infinity;
    const currentSelection = state.ui.selection;
    const bendHandle = this.hitTestSelectedLegBend(point, state, baseThreshold);
    if (bendHandle) {
      return bendHandle;
    }
    const gapHandle = this.hitTestSelectedLegGap(point, state, baseThreshold);
    if (gapHandle) {
      return gapHandle;
    }
    const gapSelection = this.hitTestManualLegGap(point, state, baseThreshold);
    if (gapSelection) {
      return gapSelection;
    }
    const controlNumber = this.hitTestControlNumber(point, state, baseThreshold);
    if (controlNumber) {
      return controlNumber;
    }
    const specialHandle = this.hitTestSpecialHandle(point, state, baseThreshold);
    if (specialHandle) {
      return specialHandle;
    }

    // Gather all hit candidates with their distances, then pick the best.
    // Give a small priority bonus to the already-selected object so clicks
    // on overlapping items don't jump away unexpectedly.
    const SELECTION_PRIORITY_BONUS = 2 / scale;
    const DRAWN_SPECIAL_PRIORITY_BONUS = 7 / scale;
    const AREA_SPECIAL_PRIORITY_BONUS = 2 / scale;

    for (const control of state.eventModel.controls) {
      const dist = Math.hypot(control.location.x - point.x, control.location.y - point.y);
      // Use a larger threshold for controls — include clicking within the control circle
      const controlThreshold = Math.max(baseThreshold, symbolApparentRadiusControl(control, scale) + baseThreshold * 0.5);
      if (dist < controlThreshold) {
        let effectiveDist = dist;
        if (currentSelection?.type === "control" && Number(currentSelection.id) === Number(control.id)) {
          effectiveDist -= SELECTION_PRIORITY_BONUS;
        }
        if (effectiveDist < bestDistance) {
          best = { type: "control", id: control.id };
          bestDistance = effectiveDist;
        }
      }
    }

    for (const special of state.eventModel.specials) {
      if (special.kind === "descriptions") {
        const bounds = descriptionBounds(state.eventModel, special, state.ui.selectedCourseId);
        const handleDistance = Math.hypot(bounds.right - point.x, bounds.bottom - point.y);
        if (handleDistance < specialThreshold * 1.5) {
          let effectiveDist = handleDistance;
          if (currentSelection?.type === "special" && Number(currentSelection.id) === Number(special.id)) {
            effectiveDist -= SELECTION_PRIORITY_BONUS;
          }
          if (effectiveDist < bestDistance) {
            best = {
              type: "special",
              id: special.id,
              handle: "resize-se",
              anchor: { x: bounds.left, y: bounds.top }
            };
            bestDistance = effectiveDist;
          }
        }
        if (point.x >= bounds.left && point.x <= bounds.right && point.y <= bounds.top && point.y >= bounds.bottom) {
          let effectiveDist = specialThreshold * 0.3 - DRAWN_SPECIAL_PRIORITY_BONUS;
          if (currentSelection?.type === "special" && Number(currentSelection.id) === Number(special.id)) {
            effectiveDist -= SELECTION_PRIORITY_BONUS;
          }
          if (effectiveDist < bestDistance) {
            best = { type: "special", id: special.id };
            bestDistance = effectiveDist;
          }
        }
        continue;
      }

      // For point specials, use a generous radius matching the symbol size
      const category = specialCategoryForHitTest(special.kind);
      if (category === "point" && special.locations?.length) {
        const symbolRadius = 12 / scale; // approximate visual extent of point symbols
        const pointThreshold = specialThreshold + symbolRadius;
        const dist = Math.hypot(special.locations[0].x - point.x, special.locations[0].y - point.y);
        if (dist < pointThreshold) {
          let effectiveDist = dist;
          if (currentSelection?.type === "special" && Number(currentSelection.id) === Number(special.id)) {
            effectiveDist -= SELECTION_PRIORITY_BONUS;
          }
          if (effectiveDist < bestDistance) {
            best = { type: "special", id: special.id };
            bestDistance = effectiveDist;
          }
        }
        continue;
      }

      const geometryDistance = specialHitDistance(special, point, specialThreshold, state.ui, scale);
      if (geometryDistance < Infinity) {
        let effectiveDist = geometryDistance;
        effectiveDist -= category === "area" ? AREA_SPECIAL_PRIORITY_BONUS : DRAWN_SPECIAL_PRIORITY_BONUS;
        if (currentSelection?.type === "special" && Number(currentSelection.id) === Number(special.id)) {
          effectiveDist -= SELECTION_PRIORITY_BONUS;
        }
        if (effectiveDist < bestDistance) {
          best = { type: "special", id: special.id };
          bestDistance = effectiveDist;
        }
        continue;
      }

      // Fallback: check proximity to location points
      for (const location of special.locations || []) {
        const dist = Math.hypot(location.x - point.x, location.y - point.y);
        if (dist < specialThreshold) {
          let effectiveDist = dist - DRAWN_SPECIAL_PRIORITY_BONUS * 0.5;
          if (currentSelection?.type === "special" && Number(currentSelection.id) === Number(special.id)) {
            effectiveDist -= SELECTION_PRIORITY_BONUS;
          }
          if (effectiveDist < bestDistance) {
            best = { type: "special", id: special.id };
            bestDistance = effectiveDist;
          }
        }
      }
    }

    if (best) return best;
    const legHit = nearestLeg(point, state, baseThreshold);
    return legHit ? legSelection(legHit.leg) : null;
  }

  hitTestSpecialHandle(point, state, threshold) {
    if (state.ui.selection?.type !== "special") return null;
    const scale = this.scale(state.ui);
    let best = null;
    let bestDistance = Infinity;
    const special = state.eventModel.specials.find(item => Number(item.id) === Number(state.ui.selection.id));
    if (!special) return null;
    for (const handle of specialResizeHandles(special, state.ui, scale, state.eventModel)) {
      const candidateDistance = distance(point, handle.point);
      if (candidateDistance <= threshold * 0.9 && candidateDistance < bestDistance) {
        best = {
          type: "special",
          id: special.id,
          handle: handle.handle,
          anchor: handle.anchor,
          pointIndex: handle.pointIndex
        };
        bestDistance = candidateDistance;
      }
    }
    return best;
  }

  hitTestAddableControl(point, state, threshold) {
    if (!state.ui.tool?.startsWith("control:") || !state.ui.selectedCourseId || state.ui.selectedCourseId === "all") {
      return null;
    }
    const kind = state.ui.tool.slice("control:".length);
    let best = null;
    let bestDistance = Infinity;
    for (const control of addableControlsForTool(state.eventModel, state.ui.selectedCourseId, kind)) {
      const candidateDistance = distance(point, control.location);
      if (candidateDistance < threshold && candidateDistance < bestDistance) {
        best = { type: "control", id: control.id };
        bestDistance = candidateDistance;
      }
    }
    return best;
  }

  hitTestControlNumber(point, state, threshold) {
    const labelRows = currentCourseLabelRows(state, this.scale(state.ui));
    if (!labelRows) return null;
    const { rows, legs, metrics } = labelRows;
    const screenPoint = this.toScreen(point, state.ui);
    const padding = Math.max(5, threshold * this.scale(state.ui));
    for (let index = rows.length - 1; index >= 0; index -= 1) {
      const row = rows[index];
      if (!row.courseControl || !row.label || row.control?.kind !== "normal") continue;
      const rect = controlNumberScreenRect(row, metrics, rows, legs, location => this.toScreen(location, state.ui), padding);
      if (pointInRect(screenPoint, rect)) {
        return {
          type: "control-number",
          courseControl: row.courseControl.id,
          control: row.control.id
        };
      }
    }
    return null;
  }

  hitTestSelectedLegBend(point, state, threshold) {
    if (!["leg", "leg-bend"].includes(state.ui.selection?.type)) return null;
    const leg = selectedLegForSelection(state.eventModel, state.ui);
    const bends = leg?.leg?.bends || [];
    for (let index = bends.length - 1; index >= 0; index -= 1) {
      if (distance(point, bends[index]) <= threshold * 1.35) {
        return legBendSelection(leg, index);
      }
    }
    return null;
  }

  hitTestSelectedLegGap(point, state, threshold) {
    if (state.ui.selection?.type !== "leg-gap") return null;
    const leg = selectedLegForSelection(state.eventModel, state.ui);
    const gap = leg?.leg?.gaps?.[state.ui.selection.gapIndex];
    if (!leg || !gap) return null;
    const points = legMapPoints(leg);
    const handles = [
      ["gap-start", pointAtPathDistance(points, gap.start)],
      ["gap-end", pointAtPathDistance(points, gap.start + gap.length)]
    ];
    for (const [handle, handlePoint] of handles) {
      if (distance(point, handlePoint) <= threshold * 1.5) {
        return { ...state.ui.selection, handle };
      }
    }
    return null;
  }

  hitTestManualLegGap(point, state, threshold) {
    const legs = currentCourseLegs(state);
    let best = null;
    let bestDistance = Infinity;
    for (const leg of legs) {
      for (let index = 0; index < (leg.leg?.gaps || []).length; index += 1) {
        const gap = leg.leg.gaps[index];
        const center = pointAtPathDistance(legMapPoints(leg), gap.start + gap.length / 2);
        const candidateDistance = distance(point, center);
        if (candidateDistance < threshold * 1.6 && candidateDistance < bestDistance) {
          best = legGapSelection(leg, index);
          bestDistance = candidateDistance;
        }
      }
    }
    return best;
  }

  toScreen(point, ui) {
    const { width, height } = this.viewportSize(ui);
    const scale = this.scale(ui);
    const cx = (this.bounds.left + this.bounds.right) / 2;
    const cy = (this.bounds.top + this.bounds.bottom) / 2;
    return {
      x: width / 2 + (point.x - cx) * scale + ui.pan.x,
      y: height / 2 + (cy - point.y) * scale + ui.pan.y
    };
  }

  toMap(point, ui) {
    const { width, height } = this.viewportSize(ui);
    const scale = this.scale(ui);
    const cx = (this.bounds.left + this.bounds.right) / 2;
    const cy = (this.bounds.top + this.bounds.bottom) / 2;
    return {
      x: (point.x - width / 2 - ui.pan.x) / scale + cx,
      y: cy - (point.y - height / 2 - ui.pan.y) / scale
    };
  }

  scale(ui) {
    const { width, height } = this.viewportSize(ui);
    return Math.min(width / this.bounds.width, height / this.bounds.height) * (ui.zoom || 1);
  }

  viewportSize(ui) {
    return {
      width: ui?.__viewport?.width || this.canvas.clientWidth || 1,
      height: ui?.__viewport?.height || this.canvas.clientHeight || 1
    };
  }

  gridSpacing() {
    const size = Math.max(this.bounds.width, this.bounds.height);
    const rough = size / 10;
    const power = Math.pow(10, Math.floor(Math.log10(rough)));
    const normalized = rough / power;
    if (normalized > 5) return 10 * power;
    if (normalized > 2) return 5 * power;
    if (normalized > 1) return 2 * power;
    return power;
  }

  visibleBounds(eventModel) {
    const omapBounds = this.omapMap?.bounds;
    if (!omapBounds) {
      return eventBounds(eventModel);
    }
    if (!hasEventGeometry(eventModel)) {
      return paddedBounds(omapBounds);
    }
    return mergeBounds(eventBounds(eventModel), paddedBounds(omapBounds));
  }

  currentViewBounds(ui = this.store.snapshot().ui) {
    const width = this.canvas.clientWidth || 1;
    const height = this.canvas.clientHeight || 1;
    const topLeft = this.toMap({ x: 0, y: 0 }, ui);
    const bottomRight = this.toMap({ x: width, y: height }, ui);
    return {
      left: Math.min(topLeft.x, bottomRight.x),
      right: Math.max(topLeft.x, bottomRight.x),
      top: Math.max(topLeft.y, bottomRight.y),
      bottom: Math.min(topLeft.y, bottomRight.y)
    };
  }
}

function hasEventGeometry(eventModel) {
  if (eventModel.controls.length || eventModel.specials.some(special => special.locations?.length)) {
    return true;
  }
  if (eventModel.event.printArea && !eventModel.event.printArea.automatic) {
    return true;
  }
  return eventModel.courses.some(course =>
    (course.printArea && !course.printArea.automatic)
    || (course.partPrintAreas || []).some(partArea => partArea.area && !partArea.area.automatic)
  );
}

function currentCourseLegs(state) {
  const selectedCourseId = state.ui.selectedCourseId || "all";
  return selectedCourseId === "all" || state.ui.showAllControls ? [] : courseLegs(state.eventModel, selectedCourseId);
}

function moveOffsetForHit(eventModel, hit, mapPoint) {
  if (hit?.type !== "special") return null;
  const special = eventModel.specials.find(item => item.id === hit.id);
  const first = special?.locations?.[0];
  return first ? { x: mapPoint.x - first.x, y: mapPoint.y - first.y } : null;
}

function moveTargetForDrag(drag, mapPoint) {
  return drag?.moveOffset
    ? { x: mapPoint.x - drag.moveOffset.x, y: mapPoint.y - drag.moveOffset.y }
    : mapPoint;
}

function resizeForHit(hit) {
  const resizable = hit?.handle?.startsWith("resize-") || hit?.handle?.startsWith("point-");
  return hit?.type === "special" && resizable
    ? {
      handle: hit.handle,
      anchor: hit.anchor || null,
      pointIndex: Number.isInteger(hit.pointIndex) ? hit.pointIndex : null
    }
    : null;
}

function specialResizeHandles(special, ui, scale, eventModel) {
  if (!special?.locations?.length) return [];
  if (special.kind === "descriptions") {
    const bounds = eventModel ? descriptionBounds(eventModel, special, ui.selectedCourseId) : null;
    return bounds ? [{
      handle: "resize-se",
      point: { x: bounds.right, y: bounds.bottom },
      anchor: { x: bounds.left, y: bounds.top }
    }] : [];
  }
  if (["line", "boundary", "out-of-bounds", "dangerous-area", "temporary-construction", "white-out"].includes(special.kind)) {
    return special.locations.map((point, index) => ({
      handle: `point-${index}`,
      point,
      pointIndex: index
    }));
  }
  if (["text", "rectangle", "ellipse"].includes(special.kind)) {
    if (special.kind === "text") {
      const anchor = special.locations[0];
      const bounds = specialMapBounds(special, ui, scale);
      return anchor && bounds ? [
        { handle: "move-anchor", point: anchor },
        { handle: "resize-text-font", point: { x: bounds.right, y: bounds.bottom }, anchor }
      ] : [];
    }
    const rect = specialMapBounds(special, ui, scale);
    if (!rect) return [];
    return [
      { handle: "resize-nw", point: { x: rect.left, y: rect.top }, anchor: { x: rect.right, y: rect.bottom } },
      { handle: "resize-ne", point: { x: rect.right, y: rect.top }, anchor: { x: rect.left, y: rect.bottom } },
      { handle: "resize-se", point: { x: rect.right, y: rect.bottom }, anchor: { x: rect.left, y: rect.top } },
      { handle: "resize-sw", point: { x: rect.left, y: rect.bottom }, anchor: { x: rect.right, y: rect.top } }
    ];
  }
  return [];
}

function specialSelectionPoints(special, ui, scale) {
  if (special.kind === "descriptions") return [];
  if (["text", "rectangle", "ellipse"].includes(special.kind)) {
    const rect = specialMapBounds(special, ui, scale);
    return rect ? [
      { x: rect.left, y: rect.top },
      { x: rect.right, y: rect.top },
      { x: rect.right, y: rect.bottom },
      { x: rect.left, y: rect.bottom }
    ] : [];
  }
  return special.locations || [];
}

function specialMapBounds(special, ui, scale) {
  const rect = special.kind === "text"
    ? specialTextBounds(special, ui, scale)
    : specialRectBounds(special, ui);
  if (!rect) return null;
  return {
    left: Math.min(rect.left, rect.right),
    right: Math.max(rect.left, rect.right),
    top: Math.max(rect.top, rect.bottom),
    bottom: Math.min(rect.top, rect.bottom)
  };
}

function specialHitDistance(special, point, threshold, ui, scale = 1) {
  const points = special.locations || [];
  if (!points.length) return Infinity;
  const lineWidthMap = Math.max(0.2, Number(special.lineWidth) || 0.35);
  const lineTolerance = Math.max(threshold, threshold * 0.7 + lineWidthMap * 2);
  if (["line", "boundary"].includes(special.kind)) {
    const distanceToLine = distancePointToPolyline(point, points);
    return distanceToLine <= lineTolerance ? distanceToLine : Infinity;
  }
  if (special.kind === "text") {
    const rect = specialTextBounds(special, ui, scale);
    if (!rect) return Infinity;
    if (pointInRect(point, rect)) return 0;
    const distanceToRect = distancePointToRect(point, rect);
    return distanceToRect <= threshold ? distanceToRect : Infinity;
  }
  if (special.kind === "rectangle") {
    const rect = specialRectBounds(special, ui);
    if (!rect) return Infinity;
    // Expand rect by threshold for easier clicking
    const expanded = expandRect(rect, threshold);
    if (pointInRect(point, expanded)) {
      return pointInRect(point, rect) ? 0 : distancePointToRect(point, rect);
    }
    return Infinity;
  }
  if (special.kind === "ellipse") {
    const rect = specialRectBounds(special, ui);
    if (!rect) return Infinity;
    const distanceToEllipse = ellipseHitDistance(point, rect);
    return distanceToEllipse <= threshold ? distanceToEllipse : Infinity;
  }
  if (["out-of-bounds", "dangerous-area", "temporary-construction", "white-out"].includes(special.kind) && points.length >= 3) {
    if (pointInPolygon(point, points)) return 0;
    const distanceToEdge = distancePointToPolyline(point, [...points, points[0]]);
    return distanceToEdge <= threshold ? distanceToEdge : Infinity;
  }
  return Infinity;
}

function specialRectBounds(special, ui) {
  const points = special.locations || [];
  if (points.length >= 2) {
    const left = Math.min(points[0].x, points[1].x);
    const right = Math.max(points[0].x, points[1].x);
    const top = Math.max(points[0].y, points[1].y);
    const bottom = Math.min(points[0].y, points[1].y);
    return { left, right, top, bottom };
  }
  return null;
}

function specialTextBounds(special, ui, scale = 1) {
  const points = special.locations || [];
  if (!points[0]) return null;
  const metrics = textMetrics(special, scale);
  return {
    left: points[0].x,
    right: points[0].x + metrics.width / Math.max(0.0001, scale),
    top: points[0].y,
    bottom: points[0].y - metrics.height / Math.max(0.0001, scale)
  };
}

function textFontHeight(special) {
  const value = Number(special.font?.height);
  return value > 0 ? value : DEFAULT_TEXT_FONT_HEIGHT;
}

function textMetrics(special, scale = 1, context = null) {
  const lines = String(special.text || "Text").split(/\r?\n/);
  const fontPx = Math.max(6, textFontHeight(special) * Math.max(0.0001, scale));
  const ctx = context || textMeasureContext();
  let maxLineWidth = 1;
  if (ctx) {
    ctx.font = textCanvasFont(special, fontPx);
    maxLineWidth = Math.max(1, ...lines.map(line => ctx.measureText(line).width));
  }
  else {
    const maxLineLen = Math.max(1, ...lines.map(line => line.length));
    maxLineWidth = maxLineLen * fontPx * 0.6;
  }
  const lineHeight = fontPx * 1.15;
  return {
    lines,
    fontPx,
    lineHeight,
    width: Math.max(TEXT_MIN_WIDTH_PX, maxLineWidth),
    height: Math.max(TEXT_MIN_HEIGHT_PX, lineHeight * lines.length)
  };
}

function textMeasureContext() {
  if (textMeasureContext.ctx !== undefined) {
    return textMeasureContext.ctx;
  }
  if (typeof document === "undefined") {
    textMeasureContext.ctx = null;
    return null;
  }
  textMeasureContext.ctx = document.createElement("canvas").getContext("2d");
  return textMeasureContext.ctx;
}

function textCanvasFont(special, fontPx) {
  const bold = special.font?.bold ? "700 " : "";
  const italic = special.font?.italic ? "italic " : "";
  const family = special.font?.name || "Arial";
  return `${italic}${bold}${fontPx}px ${quoteFont(family)}, Arial, sans-serif`;
}

function expandRect(rect, padding) {
  return {
    left: rect.left - padding,
    right: rect.right + padding,
    top: rect.top + padding,
    bottom: rect.bottom - padding
  };
}

function distancePointToPolyline(point, points) {
  if (points.length < 2) return Infinity;
  let best = Infinity;
  for (let index = 0; index < points.length - 1; index += 1) {
    best = Math.min(best, distancePointToSegment(point, points[index], points[index + 1]));
  }
  return best;
}

function ellipseHitDistance(point, rect) {
  const cx = (rect.left + rect.right) / 2;
  const cy = (rect.top + rect.bottom) / 2;
  const rx = Math.max(0.0001, (rect.right - rect.left) / 2);
  const ry = Math.max(0.0001, (rect.top - rect.bottom) / 2);
  const dx = point.x - cx;
  const dy = point.y - cy;
  const normalized = (dx * dx) / (rx * rx) + (dy * dy) / (ry * ry);
  if (normalized <= 1) return 0;
  const angle = Math.atan2(dy / ry, dx / rx);
  return distance(point, { x: cx + Math.cos(angle) * rx, y: cy + Math.sin(angle) * ry });
}

function pointInPolygon(point, polygon) {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i, i += 1) {
    const a = polygon[i];
    const b = polygon[j];
    const intersects = ((a.y > point.y) !== (b.y > point.y))
      && point.x < ((b.x - a.x) * (point.y - a.y)) / ((b.y - a.y) || 1e-9) + a.x;
    if (intersects) inside = !inside;
  }
  return inside;
}

function addableControlsForTool(eventModel, courseId, kind) {
  const used = controlsUsedByCourse(eventModel, courseId);
  return eventModel.controls
    .filter(control => control.kind === kind && !used.has(Number(control.id)));
}

function currentCourseLabelRows(state, scale) {
  const selectedCourseId = state.ui.selectedCourseId || "all";
  if (selectedCourseId === "all" || state.ui.showAllControls) {
    return null;
  }
  const selectedCourse = getCourse(state.eventModel, selectedCourseId);
  if (!selectedCourse) return null;
  const rows = courseView(state.eventModel, selectedCourseId);
  return {
    rows,
    legs: courseLegs(state.eventModel, selectedCourseId),
    metrics: createCourseSymbolMetrics(state.eventModel, selectedCourse, state.eventModel.event.courseAppearance, scale, false)
  };
}

function selectedLegForSelection(eventModel, ui) {
  const selected = ui.selection;
  if (!["leg", "leg-gap", "leg-bend"].includes(selected?.type)) return null;
  return courseLegs(eventModel, ui.selectedCourseId)
    .find(leg => Number(leg.from.control.id) === Number(selected.startControl) && Number(leg.to.control.id) === Number(selected.endControl)) || null;
}

function selectedControlNumberRow(eventModel, ui) {
  if (ui.selection?.type !== "control-number" || !ui.selectedCourseId || ui.selectedCourseId === "all") return null;
  return courseView(eventModel, ui.selectedCourseId)
    .find(row => Number(row.courseControl?.id) === Number(ui.selection.courseControl)) || null;
}

function legSelection(leg) {
  return {
    type: "leg",
    startControl: leg.from.control.id,
    endControl: leg.to.control.id
  };
}

function legGapSelection(leg, gapIndex) {
  return {
    type: "leg-gap",
    startControl: leg.from.control.id,
    endControl: leg.to.control.id,
    gapIndex
  };
}

function legBendSelection(leg, bendIndex) {
  return {
    type: "leg-bend",
    startControl: leg.from.control.id,
    endControl: leg.to.control.id,
    bendIndex
  };
}

function sameLegSelection(a, b) {
  return a?.type === "leg"
    && b?.type === "leg"
    && Number(a.startControl) === Number(b.startControl)
    && Number(a.endControl) === Number(b.endControl);
}

function legKey(leg) {
  return `${leg.from.control.id}:${leg.to.control.id}`;
}

function legMapPoints(leg) {
  return [leg.from.control.location, ...(leg.leg?.bends || []), leg.to.control.location];
}

function automaticLegGaps(legs, rows, metrics, pixelsPerMapUnit, gapSize) {
  const result = new Map();
  const length = Math.max(0.5, Number(gapSize) || 3.5);
  const segmentSets = legs.map(leg => legSegments(legMapPoints(leg)));
  for (let i = 0; i < legs.length; i += 1) {
    for (let j = i + 1; j < legs.length; j += 1) {
      if (legsShareControl(legs[i], legs[j])) continue;
      for (const a of segmentSets[i]) {
        for (const b of segmentSets[j]) {
          const hit = segmentIntersection(a.a, a.b, b.a, b.b);
          if (!hit) continue;
          const targetLeg = j > i ? legs[j] : legs[i];
          const targetSegment = targetLeg === legs[j] ? b : a;
          const start = targetSegment.offset + targetSegment.length * (targetLeg === legs[j] ? hit.tb : hit.ta) - length / 2;
          const key = legKey(targetLeg);
          const gaps = result.get(key) || [];
          gaps.push({ start: Math.max(0, start), length, automatic: true });
          result.set(key, gaps);
        }
      }
    }
  }
  addLegCircleGaps(result, legs, segmentSets, rows, metrics, pixelsPerMapUnit, length);
  return result;
}

function addLegCircleGaps(result, legs, segmentSets, rows, metrics, pixelsPerMapUnit, gapSize) {
  const lineWidthMap = Math.max(0.7, 0.35 * metrics.unit * (metrics.appearance?.lineWidthRatio || 1)) / Math.max(0.0001, pixelsPerMapUnit);
  const controls = uniqueDrawableControls(rows)
    .map(control => ({
      control,
      radius: symbolApparentRadius(control, metrics) / Math.max(0.0001, pixelsPerMapUnit)
        + lineWidthMap * 2
    }))
    .filter(item => item.radius > 0);

  for (let legIndex = 0; legIndex < legs.length; legIndex += 1) {
    const leg = legs[legIndex];
    const total = pathLength(legMapPoints(leg));
    for (const item of controls) {
      if (legEndpointIds(leg).has(Number(item.control.id))) continue;
      for (const segment of segmentSets[legIndex]) {
        const projected = projectPointToSegment(item.control.location, segment.a, segment.b);
        if (projected.t <= 0.0001 || projected.t >= 0.9999 || projected.distance >= item.radius) continue;
        const center = segment.offset + projected.t * segment.length;
        if (center <= 0.5 || total - center <= 0.5) continue;
        const halfChord = Math.sqrt(Math.max(0, item.radius * item.radius - projected.distance * projected.distance));
        const key = legKey(leg);
        const gaps = result.get(key) || [];
        gaps.push({
          start: Math.max(0, center - halfChord - gapSize / 2),
          length: halfChord * 2 + gapSize,
          automatic: true
        });
        result.set(key, gaps);
      }
    }
  }
}

function legEndpointIds(leg) {
  return new Set([Number(leg.from.control.id), Number(leg.to.control.id)]);
}

function automaticControlCircleGaps(rows, metrics, pixelsPerMapUnit) {
  const result = new Map();
  const lineWidthMap = Math.max(0.7, 0.35 * metrics.unit * (metrics.appearance?.lineWidthRatio || 1)) / Math.max(0.0001, pixelsPerMapUnit);
  const controls = uniqueDrawableControls(rows)
    .map(control => ({
      control,
      radius: symbolApparentRadius(control, metrics) / Math.max(0.0001, pixelsPerMapUnit),
      visibleRadius: symbolApparentRadius(control, metrics) / Math.max(0.0001, pixelsPerMapUnit) + lineWidthMap
    }))
    .filter(item => item.radius > 0);

  for (let i = 0; i < controls.length; i += 1) {
    for (let j = i + 1; j < controls.length; j += 1) {
      const first = controls[i];
      const second = controls[j];
      if (Number(first.control.id) === Number(second.control.id)) continue;
      addPairedControlCircleGaps(result, first, second);
    }
  }
  return result;
}

function addPairedControlCircleGaps(result, first, second) {
  if (controlCircleCanBeCut(first.control)) {
    addControlCircleGap(result, first.control.id, circleGapForCloseObject(first.control.location, first.radius, second.control.location, second.visibleRadius));
  }
  if (controlCircleCanBeCut(second.control)) {
    addControlCircleGap(result, second.control.id, circleGapForCloseObject(second.control.location, second.radius, first.control.location, first.visibleRadius));
  }
}

function addControlCircleGap(result, controlId, gap) {
  if (!gap) return;
  const key = String(controlId);
  const gaps = result.get(key) || [];
  gaps.push(gap);
  result.set(key, gaps);
}

function uniqueDrawableControls(rows) {
  const seen = new Set();
  const controls = [];
  for (const row of rows || []) {
    const control = row.control;
    if (!control || seen.has(String(control.id))) continue;
    seen.add(String(control.id));
    controls.push(control);
  }
  return controls;
}

function controlCircleCanBeCut(control) {
  return ["normal", "finish"].includes(control?.kind || "normal");
}

function circleGapForCloseObject(centerControl, radiusControl, centerOther, radiusOther) {
  const distanceBetween = distance(centerControl, centerOther);
  const combinedRadius = radiusControl + radiusOther;
  if (!(distanceBetween < combinedRadius && distanceBetween > combinedRadius * 0.25)) {
    return null;
  }

  const denominator = 2 * radiusControl * distanceBetween;
  if (denominator <= 0) return null;
  const arcCos = (radiusControl * radiusControl + distanceBetween * distanceBetween - radiusOther * radiusOther) / denominator;
  if (Math.abs(arcCos) >= 1) return null;

  const halfAngleGap = radiansToDegrees(Math.acos(arcCos));
  const angleGap = radiansToDegrees(Math.atan2(centerOther.y - centerControl.y, centerOther.x - centerControl.x));
  return {
    start: angleGap - halfAngleGap,
    stop: angleGap + halfAngleGap,
    automatic: true
  };
}

function legSegments(points) {
  const segments = [];
  let offset = 0;
  for (let i = 0; i < points.length - 1; i += 1) {
    const a = points[i];
    const b = points[i + 1];
    const length = distance(a, b);
    if (length > 0.001) {
      segments.push({ a, b, offset, length });
    }
    offset += length;
  }
  return segments;
}

function legsShareControl(a, b) {
  const aIds = new Set([a.from.control.id, a.to.control.id].map(Number));
  return aIds.has(Number(b.from.control.id)) || aIds.has(Number(b.to.control.id));
}

function segmentIntersection(a, b, c, d) {
  const r = { x: b.x - a.x, y: b.y - a.y };
  const s = { x: d.x - c.x, y: d.y - c.y };
  const denominator = cross(r, s);
  if (Math.abs(denominator) < 1e-9) return null;
  const q = { x: c.x - a.x, y: c.y - a.y };
  const ta = cross(q, s) / denominator;
  const tb = cross(q, r) / denominator;
  const eps = 1e-5;
  if (ta <= eps || ta >= 1 - eps || tb <= eps || tb >= 1 - eps) return null;
  return { ta, tb };
}

function screenGapsForLeg(gaps, pixelsPerMapUnit, startTrimPx) {
  return mergeGaps(gaps)
    .map(gap => ({
      start: Math.max(0, (Number(gap.start) || 0) * pixelsPerMapUnit - startTrimPx),
      length: Math.max(0, (Number(gap.length) || 0) * pixelsPerMapUnit)
    }))
    .filter(gap => gap.length > 0);
}

function screenFlagRangesForLeg(leg, pixelsPerMapUnit, startTrimPx) {
  const range = legFlagRange(leg);
  if (!range) return [];
  return [{
    start: Math.max(0, range.start * pixelsPerMapUnit - startTrimPx),
    length: Math.max(0, (range.end - range.start) * pixelsPerMapUnit)
  }];
}

function legFlagRange(leg) {
  const flagging = normalizeLegFlaggingKind(leg.leg?.flagging?.kind);
  if (!["begin", "end", "middle"].includes(flagging)) return null;
  const points = legMapPoints(leg);
  const total = pathLength(points);
  if (total <= 0) return null;
  if (flagging === "begin") {
    const end = leg.leg?.flagging?.end ?? (leg.leg?.flagging?.point ? distanceAlongPathAtPoint(points, leg.leg.flagging.point).distance : total / 2);
    return { start: 0, end: clamp(end, 0, total) };
  }
  if (flagging === "end") {
    const start = leg.leg?.flagging?.start ?? (leg.leg?.flagging?.point ? distanceAlongPathAtPoint(points, leg.leg.flagging.point).distance : total / 2);
    return { start: clamp(start, 0, total), end: total };
  }
  const start = clamp(Number(leg.leg?.flagging?.start) || total * 0.35, 0, total);
  const end = clamp(Number(leg.leg?.flagging?.end) || total * 0.65, start, total);
  return { start, end };
}

function isEntireLegFlagged(leg) {
  return normalizeLegFlaggingKind(leg.leg?.flagging?.kind) === "all";
}

function normalizeLegFlaggingKind(kind) {
  return {
    "beginning-part": "begin",
    "end-part": "end",
    "middle-part": "middle"
  }[kind] || kind || "none";
}

function mergeGaps(gaps) {
  return [...(gaps || [])]
    .map(gap => ({ start: Math.max(0, Number(gap.start) || 0), stop: Math.max(0, (Number(gap.start) || 0) + Math.max(0, Number(gap.length) || 0)) }))
    .filter(gap => gap.stop > gap.start)
    .sort((a, b) => a.start - b.start)
    .reduce((merged, gap) => {
      const last = merged[merged.length - 1];
      if (last && gap.start <= last.stop) {
        last.stop = Math.max(last.stop, gap.stop);
      }
      else {
        merged.push({ ...gap });
      }
      return merged;
    }, [])
    .map(gap => ({ start: gap.start, length: gap.stop - gap.start }));
}

function pointAtPathDistance(points, distanceAlongPath) {
  if (!points.length) return { x: 0, y: 0 };
  let remaining = Math.max(0, distanceAlongPath);
  for (let i = 0; i < points.length - 1; i += 1) {
    const a = points[i];
    const b = points[i + 1];
    const length = distance(a, b);
    if (length >= remaining && length > 0) {
      const t = remaining / length;
      return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
    }
    remaining -= length;
  }
  return { ...points[points.length - 1] };
}

function pathLength(points) {
  let length = 0;
  for (let index = 0; index < points.length - 1; index += 1) {
    length += distance(points[index], points[index + 1]);
  }
  return length;
}

function distanceAlongPathAtPoint(points, point) {
  let best = { distance: 0, screenDistance: Infinity };
  let offset = 0;
  for (let i = 0; i < points.length - 1; i += 1) {
    const a = points[i];
    const b = points[i + 1];
    const projected = projectPointToSegment(point, a, b);
    if (projected.distance < best.screenDistance) {
      best = { distance: offset + projected.t * distance(a, b), screenDistance: projected.distance };
    }
    offset += distance(a, b);
  }
  return best;
}

function projectPointToSegment(point, a, b) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lengthSq = dx * dx + dy * dy;
  const t = lengthSq > 0 ? clamp(((point.x - a.x) * dx + (point.y - a.y) * dy) / lengthSq, 0, 1) : 0;
  const projected = { x: a.x + dx * t, y: a.y + dy * t };
  return { t, point: projected, distance: distance(point, projected) };
}

function nearestLeg(point, state, threshold) {
  let best = null;
  for (const leg of currentCourseLegs(state)) {
    const nearest = distanceAlongPathAtPoint(legMapPoints(leg), point);
    if (nearest.screenDistance <= threshold && (!best || nearest.screenDistance < best.distance)) {
      best = { leg, pathDistance: nearest.distance, distance: nearest.screenDistance };
    }
  }
  return best;
}

function drawHandleDot(ctx, point, label) {
  ctx.save();
  ctx.fillStyle = label === "start" ? "#ffffff" : "#2477c9";
  ctx.strokeStyle = "#2477c9";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(point.x, point.y, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function drawSquareHandle(ctx, point, selected = false) {
  const size = selected ? 8 : 6;
  ctx.save();
  ctx.setLineDash([]);
  ctx.globalAlpha = selected ? 1 : 0.78;
  ctx.fillStyle = selected ? "#2477c9" : "#ffffff";
  ctx.strokeStyle = "#2477c9";
  ctx.lineWidth = 1.5;
  ctx.fillRect(point.x - size / 2, point.y - size / 2, size, size);
  ctx.strokeRect(point.x - size / 2, point.y - size / 2, size, size);
  ctx.restore();
}

function drawBendDot(ctx, point, selected = false) {
  ctx.save();
  ctx.fillStyle = selected ? "#2477c9" : "#ffffff";
  ctx.strokeStyle = "#2477c9";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(point.x, point.y, 4.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function drawControlCenterPoint(ctx, point) {
  ctx.save();
  ctx.setLineDash([]);
  ctx.fillStyle = "#2477c9";
  ctx.beginPath();
  ctx.arc(point.x, point.y, 1.75, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function line(ctx, x1, y1, x2, y2) {
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}

function cross(a, b) {
  return a.x * b.y - a.y * b.x;
}

function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function paddedBounds(bounds) {
  const padding = Math.max(2, Math.max(bounds.width, bounds.height) * 0.08);
  return {
    left: bounds.left - padding,
    right: bounds.right + padding,
    top: bounds.top + padding,
    bottom: bounds.bottom - padding,
    width: Math.max(1, bounds.width + padding * 2),
    height: Math.max(1, bounds.height + padding * 2)
  };
}

function mergeBounds(a, b) {
  const left = Math.min(a.left, b.left);
  const right = Math.max(a.right, b.right);
  const top = Math.max(a.top, b.top);
  const bottom = Math.min(a.bottom, b.bottom);
  return {
    left,
    right,
    top,
    bottom,
    width: Math.max(1, right - left),
    height: Math.max(1, top - bottom)
  };
}

function boundsCenter(bounds) {
  return {
    x: (bounds.left + bounds.right) / 2,
    y: (bounds.top + bounds.bottom) / 2
  };
}

function sameBounds(a, b) {
  return nearlyEqual(a.left, b.left)
    && nearlyEqual(a.right, b.right)
    && nearlyEqual(a.top, b.top)
    && nearlyEqual(a.bottom, b.bottom)
    && nearlyEqual(a.width, b.width)
    && nearlyEqual(a.height, b.height);
}

function nearlyEqual(a, b) {
  return Math.abs((a || 0) - (b || 0)) < 0.0001;
}

function nowMs() {
  if (typeof performance !== "undefined" && performance.now) {
    return performance.now();
  }
  return Date.now();
}

function scheduleFrame(callback) {
  if (typeof window !== "undefined" && window.requestAnimationFrame) {
    return window.requestAnimationFrame(callback);
  }
  return setTimeout(() => callback(nowMs()), 16);
}

function wheelZoomFactor(event, fallbackHeight) {
  const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? fallbackHeight : 1;
  const deltaY = event.deltaY * unit;
  return clamp(Math.exp(-deltaY * 0.0015), 0.72, 1.38);
}

function layerMapBounds(view) {
  const cx = (view.bounds.left + view.bounds.right) / 2;
  const cy = (view.bounds.top + view.bounds.bottom) / 2;
  const left = cx + (-view.padX - view.width / 2 - view.pan.x) / view.scale;
  const right = cx + (view.width + view.padX - view.width / 2 - view.pan.x) / view.scale;
  const top = cy - (-view.padY - view.height / 2 - view.pan.y) / view.scale;
  const bottom = cy - (view.height + view.padY - view.height / 2 - view.pan.y) / view.scale;
  return {
    left: Math.min(left, right),
    right: Math.max(left, right),
    top: Math.max(top, bottom),
    bottom: Math.min(top, bottom)
  };
}

function omapRenderKey(mapVersion, view) {
  return [
    mapVersion,
    view.width,
    view.height,
    view.ratio,
    view.highQuality ? 1 : 0,
    roundKey(view.zoom),
    roundKey(view.pan.x),
    roundKey(view.pan.y),
    roundKey(view.bounds.left),
    roundKey(view.bounds.right),
    roundKey(view.bounds.top),
    roundKey(view.bounds.bottom)
  ].join(":");
}

function roundKey(value) {
  return Math.round((value || 0) * 1000) / 1000;
}

function releaseOmapLayer(layer) {
  if (layer?.source?.close) {
    layer.source.close();
  }
}

function outgoingDirection(row, legs) {
  const leg = legs.find(candidate => candidate.from.courseControl?.id === row.courseControl?.id);
  if (!leg) {
    return Math.PI / 2;
  }
  const nextPoint = leg.leg?.bends?.[0] || leg.to.control.location;
  return directionAngle(row.control.location, nextPoint);
}

function numberLocationPoint(row, point, metrics, rows, legs, project) {
  if (row.courseControl?.numberLocation) {
    return project({
      x: row.control.location.x + row.courseControl.numberLocation.x,
      y: row.control.location.y + row.courseControl.numberLocation.y
    });
  }
  return bestControlLabelPoint(row, point, metrics, rows, legs, project);
}

function bestControlLabelPoint(row, point, metrics, rows, legs, project) {
  const baseDistance = symbolApparentRadius(row.control, metrics)
    + NORMALIZED_LABEL_GAP(metrics)
    + controlLabelSize(row.label, metrics).height * 0.45;
  const angles = [-35, 35, -90, 90, 0, 180, -135, 135, -60, 60, -120, 120];
  let best = null;
  for (const angle of angles) {
    const radians = angle * Math.PI / 180;
    const candidate = {
      x: point.x + Math.cos(radians) * baseDistance,
      y: point.y + Math.sin(radians) * baseDistance
    };
    const score = labelPlacementScore(candidate, row, metrics, rows, legs, project);
    if (!best || score < best.score) {
      best = { point: candidate, score };
    }
    if (score <= 0) break;
  }
  return best?.point || defaultControlLabelPoint(point, metrics);
}

function NORMALIZED_LABEL_GAP(metrics) {
  return NORMALIZED_CONTROL_NUMBER_DISTANCE * (metrics.appearance?.controlCircleSizeRatio || 1) * metrics.unit;
}

function controlLabelSize(text, metrics) {
  const fontPx = Math.max(8, 5.57 * metrics.unit * (metrics.appearance?.numberSizeRatio || 1));
  return {
    width: Math.max(fontPx * 0.75, String(text || "").length * fontPx * 0.62),
    height: fontPx
  };
}

function controlNumberScreenRect(row, metrics, rows, legs, project, padding = 0) {
  const point = numberLocationPoint(row, project(row.control.location), metrics, rows, legs, project);
  return controlNumberRect(row.label, point, metrics, padding);
}

function controlNumberRect(label, point, metrics, padding = 0) {
  const size = controlLabelSize(label, metrics);
  return {
    left: point.x - size.width / 2 - padding,
    right: point.x + size.width / 2 + padding,
    top: point.y - size.height / 2 - padding,
    bottom: point.y + size.height / 2 + padding
  };
}

function labelPlacementScore(center, row, metrics, rows, legs, project) {
  const size = controlLabelSize(row.label, metrics);
  const rect = {
    left: center.x - size.width / 2,
    right: center.x + size.width / 2,
    top: center.y - size.height / 2,
    bottom: center.y + size.height / 2
  };
  let score = 0;
  for (const other of rows || []) {
    if (!other.control) continue;
    const otherPoint = project(other.control.location);
    const radius = symbolApparentRadius(other.control, metrics) + 2;
    const overlap = radius - distancePointToRect(otherPoint, rect);
    if (overlap > 0) {
      score += other.control === row.control ? overlap * 12 : overlap * 7;
    }
  }
  for (const leg of legs || []) {
    const points = legMapPoints(leg).map(project);
    for (let index = 0; index < points.length - 1; index += 1) {
      if (segmentIntersectsRect(points[index], points[index + 1], rect)) {
        score += 80;
      }
      else {
        const near = Math.min(
          distancePointToSegment({ x: rect.left, y: rect.top }, points[index], points[index + 1]),
          distancePointToSegment({ x: rect.right, y: rect.top }, points[index], points[index + 1]),
          distancePointToSegment({ x: rect.left, y: rect.bottom }, points[index], points[index + 1]),
          distancePointToSegment({ x: rect.right, y: rect.bottom }, points[index], points[index + 1]),
          distancePointToSegment(center, points[index], points[index + 1])
        );
        if (near < 4) score += (4 - near) * 4;
      }
    }
  }
  return score;
}

function distancePointToRect(point, rect) {
  const bounds = normalizedRect(rect);
  const dx = Math.max(bounds.left - point.x, 0, point.x - bounds.right);
  const dy = Math.max(bounds.top - point.y, 0, point.y - bounds.bottom);
  return Math.hypot(dx, dy);
}

function distancePointToSegment(point, a, b) {
  return projectPointToSegment(point, a, b).distance;
}

function segmentIntersectsRect(a, b, rect) {
  if (pointInRect(a, rect) || pointInRect(b, rect)) return true;
  const corners = [
    { x: rect.left, y: rect.top },
    { x: rect.right, y: rect.top },
    { x: rect.right, y: rect.bottom },
    { x: rect.left, y: rect.bottom }
  ];
  for (let index = 0; index < corners.length; index += 1) {
    if (segmentsIntersect(a, b, corners[index], corners[(index + 1) % corners.length])) return true;
  }
  return false;
}

function pointInRect(point, rect) {
  const bounds = normalizedRect(rect);
  return point.x >= bounds.left && point.x <= bounds.right && point.y >= bounds.top && point.y <= bounds.bottom;
}

function normalizedRect(rect) {
  return {
    left: Math.min(rect.left, rect.right),
    right: Math.max(rect.left, rect.right),
    top: Math.min(rect.top, rect.bottom),
    bottom: Math.max(rect.top, rect.bottom)
  };
}

function segmentsIntersect(a, b, c, d) {
  const ab1 = orientation(a, b, c);
  const ab2 = orientation(a, b, d);
  const cd1 = orientation(c, d, a);
  const cd2 = orientation(c, d, b);
  return ab1 * ab2 <= 0 && cd1 * cd2 <= 0;
}

function orientation(a, b, c) {
  return Math.sign((b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x));
}

function drawFallbackSpecialPoint(ctx, kind, point) {
  ctx.save();
  ctx.lineWidth = 2;
  ctx.strokeStyle = "#222";
  ctx.fillStyle = fillForSpecial(kind);
  ctx.beginPath();
  if (kind === "water") {
    ctx.arc(point.x, point.y, 9, 0, Math.PI * 2);
    ctx.fill();
  }
  else if (kind === "first-aid") {
    ctx.fillRect(point.x - 9, point.y - 3, 18, 6);
    ctx.fillRect(point.x - 3, point.y - 9, 6, 18);
  }
  else {
    ctx.rect(point.x - 8, point.y - 8, 16, 16);
    ctx.fill();
    ctx.stroke();
  }
  ctx.restore();
}

function isDragSpecialTool(tool) {
  return ["special:line", "special:rectangle", "special:ellipse"].includes(tool);
}

function specialShapeForDrag(tool, start, end, state) {
  const kind = tool.slice("special:".length);
  const min = 0.001;
  const safeEnd = distance(start, end) > min ? end : { x: start.x + 20 / Math.max(1, state.ui?.zoom || 1), y: start.y - 12 / Math.max(1, state.ui?.zoom || 1) };
  return {
    tool,
    id: 0,
    kind,
    locations: [{ x: start.x, y: start.y }, { x: safeEnd.x, y: safeEnd.y }],
    color: "upper-purple",
    lineKind: "single",
    lineWidth: 0.35,
    gapSize: 2,
    dashSize: 4,
    cornerRadius: 0
  };
}

function drawSpecialObject(ctx, eventModel, special, ui, project, scale) {
  const points = (special.locations || []).map(project);
  if (["boundary", "line"].includes(special.kind) && points.length >= 2) {
    drawLineSpecial(ctx, special, points, scale);
  }
  else if (["out-of-bounds", "dangerous-area", "temporary-construction", "white-out"].includes(special.kind) && points.length >= 3) {
    ctx.save();
    ctx.strokeStyle = specialColor(special);
    ctx.fillStyle = fillForSpecial(special.kind);
    ctx.lineWidth = specialLineWidth(special, scale);
    pathLines(ctx, points, true);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
  else if (special.kind === "rectangle" && points.length >= 2) {
    drawRectSpecial(ctx, special, points[0], points[1], scale, false);
  }
  else if (special.kind === "ellipse" && points.length >= 2) {
    drawRectSpecial(ctx, special, points[0], points[1], scale, true);
  }
  else if (special.kind === "text" && points.length >= 1) {
    drawTextSpecial(ctx, special, points, scale);
  }
  else if (special.kind === "descriptions" && points.length >= 2) {
    drawControlDescriptionBlock(ctx, eventModel, special, ui.selectedCourseId, project);
  }
}

function drawLineSpecial(ctx, special, points, scale) {
  const width = specialLineWidth(special, scale);
  ctx.save();
  ctx.strokeStyle = specialColor(special);
  ctx.lineCap = "butt";
  ctx.lineJoin = "bevel";
  if (special.lineKind === "double") {
    const gap = Math.max(0, Number(special.gapSize) || 0) * scale;
    drawDoublePolyline(ctx, points, width, gap);
  }
  else {
    ctx.lineWidth = width;
    if (special.lineKind === "dashed") {
      ctx.setLineDash(specialDashArray(special, scale));
    }
    pathLines(ctx, points, false);
    ctx.stroke();
  }
  ctx.restore();
}

function drawRectSpecial(ctx, special, a, b, scale, ellipse) {
  const width = specialLineWidth(special, scale);
  const drawPath = (inset = 0) => {
    const rect = rectFromPoints(
      { x: a.x + Math.sign(b.x - a.x || 1) * inset, y: a.y + Math.sign(b.y - a.y || 1) * inset },
      { x: b.x - Math.sign(b.x - a.x || 1) * inset, y: b.y - Math.sign(b.y - a.y || 1) * inset }
    );
    if (ellipse) {
      ctx.beginPath();
      ctx.ellipse(rect.x + rect.w / 2, rect.y + rect.h / 2, Math.max(0.1, Math.abs(rect.w / 2)), Math.max(0.1, Math.abs(rect.h / 2)), 0, 0, Math.PI * 2);
    }
    else {
      roundRect(ctx, rect.x, rect.y, rect.w, rect.h, Math.abs(special.cornerRadius || 0) * scale);
    }
  };

  ctx.save();
  ctx.strokeStyle = specialColor(special);
  ctx.lineWidth = width;
  ctx.lineCap = "butt";
  ctx.lineJoin = "miter";
  if (special.lineKind === "dashed") {
    ctx.setLineDash(specialDashArray(special, scale));
  }
  if (special.lineKind === "double") {
    const gap = Math.max(0, Number(special.gapSize) || 0) * scale;
    const inset = width + gap / 2;
    drawPath(0);
    ctx.stroke();
    if (Math.abs(a.x - b.x) > inset * 2 && Math.abs(a.y - b.y) > inset * 2) {
      drawPath(inset);
      ctx.stroke();
    }
  }
  else {
    drawPath(0);
    ctx.stroke();
  }
  ctx.restore();
}

function drawTextSpecial(ctx, special, points, scale) {
  const metrics = textMetrics(special, scale, ctx);

  ctx.save();
  ctx.fillStyle = specialColor(special);
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.font = textCanvasFont(special, metrics.fontPx);
  const rect = {
    x: points[0].x,
    y: points[0].y,
    w: metrics.width,
    h: metrics.height
  };
  let y = rect.y;
  for (const lineText of metrics.lines) {
    ctx.fillText(lineText, rect.x, y);
    y += metrics.lineHeight;
  }
  ctx.restore();
}

function drawDoublePolyline(ctx, points, width, gap) {
  const offset = width / 2 + gap / 2;
  ctx.lineWidth = width;
  for (const side of [-1, 1]) {
    pathLines(ctx, offsetPolyline(points, side * offset), false);
    ctx.stroke();
  }
}

function offsetPolyline(points, offset) {
  if (points.length < 2) return points;
  return points.map((point, index) => {
    const previous = points[index - 1] || null;
    const next = points[index + 1] || null;
    const normal = polylineNormal(previous, point, next);
    return { x: point.x + normal.x * offset, y: point.y + normal.y * offset };
  });
}

function polylineNormal(previous, point, next) {
  const from = previous || point;
  const to = next || point;
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const length = Math.hypot(dx, dy);
  if (length <= 0) return { x: 0, y: 0 };
  return { x: -dy / length, y: dx / length };
}

function specialLineWidth(special, scale) {
  return Math.max(1, (Number(special.lineWidth) > 0 ? Number(special.lineWidth) : 0.35) * scale);
}

function specialDashArray(special, scale) {
  const dash = Math.max(1, (Number(special.dashSize) > 0 ? Number(special.dashSize) : 4) * scale);
  const gap = Math.max(1, (Number(special.gapSize) > 0 ? Number(special.gapSize) : 2) * scale);
  return [dash, gap];
}

function specialColor(special) {
  const color = String(special.color || "upper-purple").trim();
  return SPECIAL_COLORS[color] || (isCssColorValue(color) ? color : PURPLE);
}

function isCssColorValue(color) {
  return /^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(color)
    || /^rgba?\(/i.test(color)
    || /^hsla?\(/i.test(color);
}

function pathLines(ctx, points, closed) {
  if (!points.length) return;
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i += 1) {
    ctx.lineTo(points[i].x, points[i].y);
  }
  if (closed) ctx.closePath();
}

function quoteFont(name) {
  return String(name || "Arial").includes(" ") ? `"${String(name).replace(/"/g, "")}"` : String(name || "Arial");
}

function rectFromPoints(a, b) {
  return {
    x: Math.min(a.x, b.x),
    y: Math.min(a.y, b.y),
    w: Math.abs(b.x - a.x),
    h: Math.abs(b.y - a.y)
  };
}

function screenRectFromPoints(points) {
  const xs = points.map(point => point.x);
  const ys = points.map(point => point.y);
  return {
    x: Math.min(...xs),
    y: Math.min(...ys),
    w: Math.max(...xs) - Math.min(...xs),
    h: Math.max(...ys) - Math.min(...ys)
  };
}

function descriptionCornerPoints(eventModel, special, selectedCourseId) {
  const bounds = descriptionBounds(eventModel, special, selectedCourseId);
  return [
    { x: bounds.left, y: bounds.top },
    { x: bounds.right, y: bounds.top },
    { x: bounds.right, y: bounds.bottom },
    { x: bounds.left, y: bounds.bottom }
  ];
}

function roundRect(ctx, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + width - r, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + r);
  ctx.lineTo(x + width, y + height - r);
  ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  ctx.lineTo(x + r, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
}

function fillForSpecial(kind) {
  switch (kind) {
    case "water": return "#3f8fd2";
    case "first-aid": return "#d43f3a";
    case "out-of-bounds": return "rgba(183, 54, 61, 0.18)";
    case "dangerous-area": return "rgba(236, 167, 44, 0.28)";
    case "temporary-construction": return "rgba(123, 95, 64, 0.25)";
    case "white-out": return "rgba(255,255,255,0.88)";
    default: return "rgba(143,42,168,0.20)";
  }
}

function specialCategoryForHitTest(kind) {
  if (["first-aid", "water", "optional-crossing-point", "forbidden-route", "registration-mark"].includes(kind)) return "point";
  if (["line", "boundary"].includes(kind)) return "line";
  if (["out-of-bounds", "dangerous-area", "temporary-construction", "white-out"].includes(kind)) return "area";
  if (kind === "text") return "text";
  if (kind === "rectangle") return "rectangle";
  if (kind === "ellipse") return "ellipse";
  if (kind === "descriptions") return "descriptions";
  if (kind === "image") return "image";
  return "point";
}

// Approximate the visual radius of a control in map units, for hit testing.
function symbolApparentRadiusControl(control, scale) {
  // Normal/finish controls have a circle ~5mm diameter at print scale.
  // Start has a triangle. We approximate all as a radius in map units.
  // At 1:15000 scale, 5mm = 75m. In the ppen coordinate system (0.01mm units),
  // this is 500 units. But coordinates in the web version use a different scale.
  // We use a fixed screen-pixel approximation: the control circle is about 14px
  // radius on screen, converted to map units via scale.
  const screenRadius = control.kind === "start" ? 16 : control.kind === "finish" ? 14 : 12;
  return screenRadius / Math.max(0.001, scale);
}

function radiansToDegrees(radians) {
  return radians * 180 / Math.PI;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}
