import { debugLog, debugWarn, debugError } from "./debug-log.js?v=20260706-7";
export function createMapViewOmapMethods(deps) {
  const {
    allControlsView,
    courseLegs,
    courseView,
    eventBounds,
    getControl,
    getCourse,
    controlsUsedByCourse,
    isTeamFreeCourseControl,
    createDescriptionSpecialOptions,
    descriptionBounds,
    drawControlDescriptionBlock,
    resizedDescriptionSpecial,
    specialVisibleForCourse,
    effectivePrintArea,
    printAreaCenter,
    relayEntryLabel,
    relayVariationForLeg,
    variationForCode,
    createCourseSymbolMetrics,
    courseSymbolMmToMapDistance,
    courseLegTrimRadius,
    defaultControlLabelPoint,
    directionAngle,
    drawControlLabel,
    drawCourseControl,
    drawCourseLeg,
    drawPointSpecialSymbol,
    symbolApparentRadius,
    drawOmapMap,
    ADDABLE_CONTROL_SNAP_PIXELS,
    MAX_ZOOM,
    GRID,
    OMAP_LAYER_PADDING,
    OMAP_LAYER_CACHE_LIMIT,
    hasEventGeometry,
    backgroundMapBounds,
    backgroundCalibrationMapPoints,
    currentCourseLegs,
    moveOffsetForHit,
    moveTargetForDrag,
    resizeForHit,
    specialResizeHandles,
    specialSelectionPoints,
    specialHitDistance,
    addableControlsForTool,
    currentCourseLabelRows,
    selectedLegForSelection,
    selectedControlNumberRow,
    mapCourseDisplayOptions,
    legSelection,
    legGapSelection,
    legBendSelection,
    legKey,
    legMapPoints,
    automaticLegGaps,
    automaticControlCircleGaps,
    screenGapsForLeg,
    screenFlagRangesForLeg,
    isEntireLegFlagged,
    flaggedEndpointGapSuppression,
    pointAtPathDistance,
    nearestLeg,
    drawHandleDot,
    drawSquareHandle,
    drawBendDot,
    drawLegSelectionOutline,
    drawControlCenterPoint,
    line,
    distance,
    paddedBounds,
    mergeBounds,
    boundsCenter,
    nearlyEqual,
    nowMs,
    scheduleFrame,
    wheelZoomFactor,
    pointerPosition,
    printAreaFrameDragCenter,
    pinchGesture,
    layerMapBounds,
    viewportMapBounds,
    boundsContain,
    omapRenderKey,
    releaseOmapLayer,
    outgoingDirection,
    numberLocationPoint,
    mergedCourseLabelRows,
    controlNumberScreenRect,
    controlNumberRect,
    pointInRect,
    orientation,
    drawFallbackSpecialPoint,
    isDragSpecialTool,
    specialShapeForDrag,
    drawSpecialObject,
    drawLineSpecial,
    drawRectSpecial,
    drawTextSpecial,
    specialLineWidth,
    specialColor,
    pathLines,
    screenRectFromPoints,
    descriptionCornerPoints,
    fillForSpecial,
    specialCategoryForHitTest,
    symbolApparentRadiusControl,
    clamp,
    effectiveOmapPixelRatio,
    omapPaddingMultiplier,
    renderQualityHighQuality
  } = deps;
  return {
  drawOmap(ctx, ui) {
    if (!this.omapMap) {
      return;
    }
    const width = this.canvas.clientWidth || 1;
    const height = this.canvas.clientHeight || 1;
    const ratio = effectiveOmapPixelRatio(ui, window.devicePixelRatio || 1);
    const request = this.createOmapLayerRequest(ui, width, height, ratio);
    const matchingLayer = this.findOmapLayer(layer =>
      layer?.key === request.key || this.omapLayerMatchesLayer(layer, ui, width, height, ratio)
    );
    debugLog("omap.draw.decision", {
      requestKey: request.key,
      renderQuality: ui.renderQuality || "balanced",
      ratio,
      highQuality: renderQualityHighQuality(ui),
      mapIntensity: ui.mapIntensity,
      canvas: summarizeCanvasForDebug(this.canvas),
      cssViewport: summarizeCanvasRectForDebug(this.canvas),
      viewport: { width, height },
      zoom: ui.zoom,
      pan: ui.pan,
      bounds: this.bounds,
      requestView: request.view,
      worker: {
        disabled: this.omapWorkerDisabled,
        busy: this.omapWorkerBusy,
        pendingKey: this.omapWorkerPendingKey,
        desiredKey: this.omapWorkerDesired?.key || ""
      },
      cache: summarizeOmapCacheForDebug(this.omapLayerCache, request.key, {
        map: this.omapMap,
        mapVersion: this.omapMapVersion,
        width,
        height,
        ratio,
        highQuality: renderQualityHighQuality(ui),
        renderQuality: ui.renderQuality || "balanced"
      }),
      matchingLayer: summarizeOmapLayerForDebug(matchingLayer, request.key)
    });

    if (matchingLayer) {
      debugLog("omap.draw.use-matching-layer", {
        requestKey: request.key,
        exactKey: matchingLayer.key === request.key,
        layer: summarizeOmapLayerForDebug(matchingLayer, request.key)
      });
      this.promoteOmapLayer(matchingLayer);
      this.drawTransformedOmapLayer(ctx, ui, width, height, ratio, matchingLayer);
      return;
    }

    if (this.shouldUseFastOmapLayer() && this.drawBestTransformedOmapLayer(ctx, ui, width, height, ratio)) {
      return;
    }

    if (this.queueOmapLayerRender(ui, width, height, ratio, request)) {
      if (this.drawBestTransformedOmapLayer(ctx, ui, width, height, ratio)) {
        return;
      }
      return;
    }

    const layer = this.addOmapLayer(this.renderOmapLayer(ui, width, height, ratio));
    if (layer) {
      this.drawOmapLayer(ctx, layer, ui.mapIntensity);
    }
  },

  drawOmapDirect(ctx, ui) {
    if (!this.omapMap) {
      return;
    }
    ctx.save();
    ctx.globalAlpha = ui.mapIntensity;
    drawOmapMap(ctx, this.omapMap, point => this.toScreen(point, ui), this.scale(ui), {
      highQuality: renderQualityHighQuality(ui),
      mapBounds: {
        left: this.bounds.left,
        right: this.bounds.right,
        top: this.bounds.top,
        bottom: this.bounds.bottom
      }
    });
    ctx.restore();
  },

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
      highQuality: renderQualityHighQuality(ui),
      mapBounds: view.mapBounds
    });

    return {
      key: omapRenderKey(this.omapMapVersion, view),
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
      highQuality: view.highQuality,
      renderQuality: view.renderQuality || "balanced",
      mapBounds: view.mapBounds
    };
  },

  drawOmapLayer(ctx, layer, alpha) {
    const drawDebug = {
      alpha,
      currentTransform: summarizeCanvasTransformForDebug(ctx),
      layer: summarizeOmapLayerForDebug(layer)
    };
    debugLog("omap.draw.layer.before-drawImage", drawDebug);
    ctx.save();
    try {
      ctx.globalAlpha = alpha;
      ctx.drawImage(layer.source, -layer.padX, -layer.padY, layer.width, layer.height);
      debugLog("omap.draw.layer.after-drawImage", {
        success: true,
        transformAfterDraw: summarizeCanvasTransformForDebug(ctx),
        layer: summarizeOmapLayerForDebug(layer)
      });
    }
    catch (error) {
      debugError("omap.draw.layer.drawImage-error", {
        message: error?.message || String(error),
        name: error?.name || "Error",
        stack: error?.stack || "",
        drawDebug
      });
      throw error;
    }
    finally {
      ctx.restore();
    }
  },

  drawBestTransformedOmapLayer(ctx, ui, width, height, ratio) {
    const layer = this.findOmapLayer(candidate => this.omapLayerCanTransform(candidate, ui, width, height, ratio));
    if (!layer) {
      debugLog("omap.draw.best-transformed.miss", {
        renderQuality: ui.renderQuality || "balanced",
        ratio,
        highQuality: renderQualityHighQuality(ui),
        viewport: { width, height },
        zoom: ui.zoom,
        pan: ui.pan,
        bounds: this.bounds,
        cache: summarizeOmapCacheForDebug(this.omapLayerCache, "", {
          map: this.omapMap,
          mapVersion: this.omapMapVersion,
          width,
          height,
          ratio,
          highQuality: renderQualityHighQuality(ui),
          renderQuality: ui.renderQuality || "balanced"
        })
      });
      this.logOmapLayerRejections(ui, width, height, ratio);
      return false;
    }
    debugLog("omap.draw.best-transformed.hit", { layer: summarizeOmapLayerForDebug(layer) });
    this.promoteOmapLayer(layer);
    return this.drawTransformedOmapLayer(ctx, ui, width, height, ratio, layer);
  },

  drawTransformedOmapLayer(ctx, ui, width, height, ratio, layer = this.omapLayer) {
    if (!layer) {
      debugLog("omap.draw.transformed.skip", { reason: "missing-layer" });
      return false;
    }
    const expected = {
      map: this.omapMap,
      mapVersion: this.omapMapVersion,
      width,
      height,
      ratio,
      highQuality: renderQualityHighQuality(ui),
      renderQuality: ui.renderQuality || "balanced"
    };
    const rejectReasons = omapLayerTransformRejectReasons(layer, expected);
    if (rejectReasons.length) {
      debugLog("omap.draw.transformed.skip", {
        reason: "cannot-transform",
        rejectReasons,
        expected: summarizeExpectedForDebug(expected, ui, this.bounds),
        layer: summarizeOmapLayerForDebug(layer)
      });
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
    const drawDebug = {
      currentScale,
      layerScale: layer.scale,
      factor,
      tx,
      ty,
      viewport: { width, height },
      alpha: ui.mapIntensity,
      currentTransform: summarizeCanvasTransformForDebug(ctx),
      layer: summarizeOmapLayerForDebug(layer),
      current: {
        renderQuality: ui.renderQuality || "balanced",
        highQuality: renderQualityHighQuality(ui),
        ratio,
        zoom: ui.zoom,
        pan: ui.pan,
        bounds: this.bounds,
        mapBounds: viewportMapBounds(this.bounds, width, height, ui.pan, currentScale)
      }
    };
    debugLog("omap.draw.transformed.before-drawImage", drawDebug);

    ctx.save();
    try {
      ctx.globalAlpha = ui.mapIntensity;
      ctx.transform(factor, 0, 0, factor, tx, ty);
      ctx.drawImage(layer.source, 0, 0, layer.width, layer.height);
      debugLog("omap.draw.transformed.after-drawImage", {
        success: true,
        transformAfterDraw: summarizeCanvasTransformForDebug(ctx),
        layer: summarizeOmapLayerForDebug(layer)
      });
      return true;
    }
    catch (error) {
      debugError("omap.draw.transformed.drawImage-error", {
        message: error?.message || String(error),
        name: error?.name || "Error",
        stack: error?.stack || "",
        drawDebug
      });
      throw error;
    }
    finally {
      ctx.restore();
    }
  },

  omapLayerMatches(ui, width, height, ratio) {
    return !!this.findOmapLayer(layer => this.omapLayerMatchesLayer(layer, ui, width, height, ratio));
  },

  omapLayerMatchesLayer(layer, ui, width, height, ratio) {
    return this.omapLayerCanTransform(layer, ui, width, height, ratio)
      && nearlyEqual(layer.zoom, ui.zoom)
      && boundsContain(layer.mapBounds, viewportMapBounds(this.bounds, width, height, ui.pan, this.scale(ui)));
  },

  omapLayerCanTransform(layer, ui, width, height, ratio) {
    return omapLayerTransformRejectReasons(layer, {
      map: this.omapMap,
      mapVersion: this.omapMapVersion,
      width,
      height,
      ratio,
      highQuality: renderQualityHighQuality(ui),
      renderQuality: ui.renderQuality || "balanced"
    }).length === 0;
  },

  logOmapLayerRejections(ui, width, height, ratio) {
    const layers = this.omapLayerCache.filter(Boolean);
    if (!layers.length) {
      return;
    }
    const expected = {
      map: this.omapMap,
      mapVersion: this.omapMapVersion,
      width,
      height,
      ratio,
      highQuality: renderQualityHighQuality(ui),
      renderQuality: ui.renderQuality || "balanced"
    };
    const summaries = layers.slice(0, OMAP_LAYER_CACHE_LIMIT).map(layer => ({
      key: layer.key,
      mapVersion: layer.mapVersion,
      viewportWidth: layer.viewportWidth,
      viewportHeight: layer.viewportHeight,
      ratio: layer.ratio,
      highQuality: layer.highQuality,
      renderQuality: layer.renderQuality || "balanced",
      zoom: layer.zoom,
      scale: layer.scale,
      bounds: layer.bounds,
      mapBounds: layer.mapBounds,
      sourceWidth: layer.source?.width,
      sourceHeight: layer.source?.height,
      reasons: omapLayerTransformRejectReasons(layer, expected)
    }));
    if (!summaries.some(summary => summary.reasons.length)) {
      return;
    }
    const logKey = [
      "OMAP cached layer rejected",
      this.omapMapVersion,
      width,
      height,
      ratio,
      expected.highQuality ? 1 : 0,
      expected.renderQuality,
      summaries.map(summary => `${summary.key}:${summary.reasons.join(",")}`).join("|")
    ].join(":");
    this.omapDebugLogTimes ||= new Map();
    const time = nowMs();
    const last = this.omapDebugLogTimes.get(logKey) || 0;
    if (time - last < 1000) {
      return;
    }
    this.omapDebugLogTimes.set(logKey, time);
    debugLog("omap.layer-cache.rejected", {
      expected: {
        mapVersion: expected.mapVersion,
        width: expected.width,
        height: expected.height,
        ratio: expected.ratio,
        highQuality: expected.highQuality,
        renderQuality: expected.renderQuality,
        bounds: this.bounds,
        zoom: ui.zoom,
        pan: ui.pan,
        scale: this.scale(ui)
      },
      cacheSize: layers.length,
      layers: summaries
    });
  },

  shouldUseFastOmapLayer() {
    return !!this.omapLayer && nowMs() < this.omapFastUntil;
  },

  findOmapLayer(predicate) {
    if (this.omapLayer && predicate(this.omapLayer)) {
      return this.omapLayer;
    }
    return this.omapLayerCache.find(layer => layer !== this.omapLayer && predicate(layer)) || null;
  },

  promoteOmapLayer(layer) {
    if (!layer) return null;
    this.omapLayer = layer;
    const others = this.omapLayerCache.filter(candidate => candidate !== layer);
    this.omapLayerCache = [layer, ...others];
    return layer;
  },

  addOmapLayer(layer) {
    if (!layer) return null;
    const replaced = [];
    const keep = [];
    for (const candidate of this.omapLayerCache) {
      if (candidate === layer) continue;
      if (candidate.key === layer.key) replaced.push(candidate);
      else keep.push(candidate);
    }
    this.omapLayer = layer;
    this.omapLayerCache = [layer, ...keep];
    for (const candidate of replaced) {
      releaseOmapLayer(candidate);
    }
    while (this.omapLayerCache.length > OMAP_LAYER_CACHE_LIMIT) {
      releaseOmapLayer(this.omapLayerCache.pop());
    }
    return layer;
  },

  startFastOmapInteraction() {
    if (!this.omapMap) {
      return;
    }
    this.omapFastUntil = nowMs() + 120;
    this.scheduleOmapRefresh();
  },

  scheduleOmapRefresh() {
    if (this.omapRefreshTimer) {
      clearTimeout(this.omapRefreshTimer);
    }
    this.omapRefreshTimer = setTimeout(() => {
      this.omapFastUntil = 0;
      this.requestDraw(this.store.snapshot());
    }, 70);
  },

  invalidateOmapLayer() {
    for (const layer of this.omapLayerCache) {
      releaseOmapLayer(layer);
    }
    this.omapLayer = null;
    this.omapLayerCache = [];
  },

  queueOmapLayerRender(ui, width, height, ratio, request = null) {
    request ||= this.createOmapLayerRequest(ui, width, height, ratio);
    if (this.findOmapLayer(layer => layer?.key === request.key)) {
      debugLog("omap.worker.queue.skip-exact-cache", { key: request.key });
      return false;
    }
    const worker = this.ensureOmapWorker();
    if (!worker) {
      debugLog("omap.worker.queue.skip-no-worker", {
        key: request.key,
        disabled: this.omapWorkerDisabled,
        hasWorkerApi: typeof Worker !== "undefined",
        hasOffscreenCanvas: typeof OffscreenCanvas !== "undefined"
      });
      return false;
    }
    if (this.omapWorkerPendingKey === request.key || this.omapWorkerDesired?.key === request.key) {
      debugLog("omap.worker.queue.skip-already-pending", {
        key: request.key,
        pendingKey: this.omapWorkerPendingKey,
        desiredKey: this.omapWorkerDesired?.key || ""
      });
      return true;
    }
    debugLog("omap.worker.queued", {
      key: request.key,
      mapVersion: request.mapVersion,
      view: request.view,
      cacheSize: this.omapLayerCache.length
    });
    this.omapWorkerDesired = request;
    this.pumpOmapWorker();
    return true;
  },

  createOmapLayerRequest(ui, width, height, ratio) {
    const view = this.createOmapLayerView(ui, width, height, ratio);
    return {
      key: omapRenderKey(this.omapMapVersion, view),
      map: this.omapMap,
      mapVersion: this.omapMapVersion,
      view
    };
  },

  createOmapLayerView(ui, width, height, ratio) {
    const paddingScale = omapPaddingMultiplier(ui);
    const padX = Math.ceil(width * OMAP_LAYER_PADDING * paddingScale);
    const padY = Math.ceil(height * OMAP_LAYER_PADDING * paddingScale);
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
      highQuality: renderQualityHighQuality(ui),
      renderQuality: ui.renderQuality || "balanced"
    };
    view.mapBounds = layerMapBounds(view);
    return view;
  },

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
    debugLog("omap.worker.request", {
      requestId,
      key: request.key,
      mapVersion: request.mapVersion,
      view: request.view
    });
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
  },

  ensureOmapWorker() {
    if (this.omapWorkerDisabled || !this.omapMap || typeof Worker === "undefined" || typeof OffscreenCanvas === "undefined") {
      return null;
    }
    if (this.omapWorker) {
      return this.omapWorker;
    }
    try {
      const worker = new Worker(new URL("../workers/omap-render-worker.js?v=20260706-7", import.meta.url), { type: "module" });
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
  },

  handleOmapWorkerMessage(message) {
    if (!message || message.type !== "rendered") {
      return;
    }
    this.omapWorkerBusy = false;
    this.omapWorkerPendingKey = "";
    debugLog("omap.worker.message", {
      type: message.type,
      requestId: message.requestId,
      mapVersion: message.mapVersion,
      currentMapVersion: this.omapMapVersion,
      hasBitmap: !!message.bitmap,
      bitmap: message.bitmap ? { width: message.bitmap.width, height: message.bitmap.height } : null,
      error: message.error || "",
      workerMetrics: message.metrics || null,
      view: message.view
    });
    if (message.error) {
      debugError("omap.worker.render-error", {
        requestId: message.requestId,
        mapVersion: message.mapVersion,
        error: message.error,
        stack: message.stack || "",
        workerMetrics: message.metrics || null,
        view: message.view || null
      });
      this.disableOmapWorker(message.error);
      return;
    }
    if (message.bitmap && message.mapVersion === this.omapMapVersion) {
      const layer = this.addOmapLayer({
        key: omapRenderKey(message.mapVersion, message.view),
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
        highQuality: message.view.highQuality,
        renderQuality: message.view.renderQuality || "balanced",
        mapBounds: message.view.mapBounds
      });
      const ui = this.store.snapshot().ui;
      const width = this.canvas.clientWidth || 1;
      const height = this.canvas.clientHeight || 1;
      const ratio = effectiveOmapPixelRatio(ui, window.devicePixelRatio || 1);
      const expected = {
        map: this.omapMap,
        mapVersion: this.omapMapVersion,
        width,
        height,
        ratio,
        highQuality: renderQualityHighQuality(ui),
        renderQuality: ui.renderQuality || "balanced"
      };
      const currentKey = omapRenderKey(this.omapMapVersion, {
        width,
        height,
        ratio,
        highQuality: expected.highQuality,
        renderQuality: expected.renderQuality,
        zoom: ui.zoom,
        pan: ui.pan,
        bounds: this.bounds
      });
      const reasons = omapLayerTransformRejectReasons(layer, expected);
      debugLog("omap.worker.layer-stored", {
        requestId: message.requestId,
        layerKey: layer.key,
        currentKey,
        keyMatchesCurrentView: layer.key === currentKey,
        reusable: reasons.length === 0,
        reasons,
        cacheSize: this.omapLayerCache.length,
        workerMetrics: message.metrics || null,
        expected: summarizeExpectedForDebug(expected, ui, this.bounds),
        layer: summarizeOmapLayerForDebug(layer, currentKey)
      });
      this.requestDraw(this.store.snapshot());
    }
    else if (message.bitmap?.close) {
      message.bitmap.close();
    }
    this.pumpOmapWorker();
  },

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
    debugWarn("omap.worker.disabled", { reason });
    this.requestDraw(this.store.snapshot());
  }

  };
}


function summarizeCanvasForDebug(canvas) {
  if (!canvas) return null;
  return {
    width: canvas.width,
    height: canvas.height,
    clientWidth: canvas.clientWidth,
    clientHeight: canvas.clientHeight
  };
}

function summarizeCanvasRectForDebug(canvas) {
  if (!canvas?.getBoundingClientRect) return null;
  const rect = canvas.getBoundingClientRect();
  return {
    x: roundDebug(rect.x),
    y: roundDebug(rect.y),
    width: roundDebug(rect.width),
    height: roundDebug(rect.height),
    top: roundDebug(rect.top),
    right: roundDebug(rect.right),
    bottom: roundDebug(rect.bottom),
    left: roundDebug(rect.left)
  };
}

function summarizeCanvasTransformForDebug(ctx) {
  try {
    const t = ctx.getTransform();
    return {
      a: roundDebug(t.a),
      b: roundDebug(t.b),
      c: roundDebug(t.c),
      d: roundDebug(t.d),
      e: roundDebug(t.e),
      f: roundDebug(t.f)
    };
  }
  catch (_) {
    return null;
  }
}

function summarizeOmapCacheForDebug(cache, currentKey, expected = null) {
  const layers = (cache || []).filter(Boolean);
  return {
    size: layers.length,
    currentKey,
    layers: layers.map(layer => summarizeOmapLayerForDebug(layer, currentKey, expected))
  };
}

function summarizeOmapLayerForDebug(layer, currentKey = "", expected = null) {
  if (!layer) return null;
  const summary = {
    key: layer.key,
    keyMatchesCurrent: !!currentKey && layer.key === currentKey,
    mapVersion: layer.mapVersion,
    viewportWidth: layer.viewportWidth,
    viewportHeight: layer.viewportHeight,
    width: layer.width,
    height: layer.height,
    ratio: layer.ratio,
    highQuality: layer.highQuality,
    renderQuality: layer.renderQuality || "balanced",
    zoom: layer.zoom,
    pan: layer.pan,
    bounds: layer.bounds,
    mapBounds: layer.mapBounds,
    scale: layer.scale,
    padX: layer.padX,
    padY: layer.padY,
    source: summarizeLayerSourceForDebug(layer.source)
  };
  if (expected) {
    summary.rejectReasons = omapLayerTransformRejectReasons(layer, expected);
  }
  return summary;
}

function summarizeLayerSourceForDebug(source) {
  if (!source) return null;
  return {
    type: source.constructor?.name || Object.prototype.toString.call(source),
    width: source.width,
    height: source.height,
    closedHint: source.width === 0 || source.height === 0,
    hasClose: typeof source.close === "function"
  };
}

function summarizeExpectedForDebug(expected, ui, bounds) {
  return {
    mapVersion: expected.mapVersion,
    width: expected.width,
    height: expected.height,
    ratio: expected.ratio,
    highQuality: expected.highQuality,
    renderQuality: expected.renderQuality,
    zoom: ui.zoom,
    pan: ui.pan,
    bounds
  };
}

function roundDebug(value) {
  return Number.isFinite(value) ? Math.round(value * 1000) / 1000 : value;
}

function omapLayerTransformRejectReasons(layer, expected) {
  const reasons = [];
  if (!layer) {
    return ["missing"];
  }
  if (layer.map !== expected.map) {
    reasons.push("map");
  }
  if (layer.mapVersion !== expected.mapVersion) {
    reasons.push("mapVersion");
  }
  if (layer.viewportWidth !== expected.width) {
    reasons.push("viewportWidth");
  }
  if (layer.viewportHeight !== expected.height) {
    reasons.push("viewportHeight");
  }
  if (layer.ratio !== expected.ratio) {
    reasons.push("ratio");
  }
  if (layer.highQuality !== expected.highQuality) {
    reasons.push("highQuality");
  }
  if ((layer.renderQuality || "balanced") !== expected.renderQuality) {
    reasons.push("renderQuality");
  }
  if (!(layer.scale > 0)) {
    reasons.push("scale");
  }
  return reasons;
}
