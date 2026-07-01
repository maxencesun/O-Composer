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
    sameBounds,
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
    console.info("OMAP draw", {
      renderQuality: ui.renderQuality || "balanced",
      highQuality: renderQualityHighQuality(ui),
      rawDevicePixelRatio: window.devicePixelRatio || 1,
      ratio,
      paddingMultiplier: omapPaddingMultiplier(ui),
      width,
      height,
      zoom: ui.zoom,
      pan: ui.pan,
      bounds: this.bounds,
      workerDisabled: this.omapWorkerDisabled,
      workerBusy: this.omapWorkerBusy,
      layerCacheSize: this.omapLayerCache.length
    });
    const matchingLayer = this.findOmapLayer(layer => this.omapLayerMatchesLayer(layer, ui, width, height, ratio));

    if (matchingLayer) {
      this.promoteOmapLayer(matchingLayer);
      this.drawTransformedOmapLayer(ctx, ui, width, height, ratio, matchingLayer);
      return;
    }

    if (this.shouldUseFastOmapLayer() && this.drawBestTransformedOmapLayer(ctx, ui, width, height, ratio)) {
      return;
    }

    if (this.queueOmapLayerRender(ui, width, height, ratio)) {
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
    console.info("OMAP layer draw", {
      alpha,
      sourceWidth: layer.source?.width,
      sourceHeight: layer.source?.height,
      width: layer.width,
      height: layer.height,
      padX: layer.padX,
      padY: layer.padY,
      ratio: layer.ratio,
      zoom: layer.zoom,
      pan: layer.pan,
      mapBounds: layer.mapBounds
    });
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.drawImage(layer.source, -layer.padX, -layer.padY, layer.width, layer.height);
    ctx.restore();
  },

  drawBestTransformedOmapLayer(ctx, ui, width, height, ratio) {
    const layer = this.findOmapLayer(candidate => this.omapLayerCanTransform(candidate, ui, width, height, ratio));
    if (!layer) return false;
    this.promoteOmapLayer(layer);
    return this.drawTransformedOmapLayer(ctx, ui, width, height, ratio, layer);
  },

  drawTransformedOmapLayer(ctx, ui, width, height, ratio, layer = this.omapLayer) {
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
    console.info("OMAP transformed layer draw", {
      currentScale,
      layerScale: layer.scale,
      factor,
      tx,
      ty,
      width,
      height,
      viewportWidth: layer.viewportWidth,
      viewportHeight: layer.viewportHeight,
      padX: layer.padX,
      padY: layer.padY,
      ratio: layer.ratio,
      layerZoom: layer.zoom,
      currentZoom: ui.zoom,
      layerPan: layer.pan,
      currentPan: ui.pan,
      layerBounds: layer.bounds,
      currentBounds: this.bounds,
      layerMapBounds: layer.mapBounds
    });

    ctx.save();
    ctx.globalAlpha = ui.mapIntensity;
    ctx.transform(factor, 0, 0, factor, tx, ty);
    ctx.drawImage(layer.source, 0, 0, layer.width, layer.height);
    ctx.restore();
    return true;
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
    return layer.map === this.omapMap
      && layer.mapVersion === this.omapMapVersion
      && layer.viewportWidth === width
      && layer.viewportHeight === height
      && layer.ratio === ratio
      && layer.highQuality === renderQualityHighQuality(ui)
      && (layer.renderQuality || "balanced") === (ui.renderQuality || "balanced")
      && sameBounds(layer.bounds, this.bounds)
      && layer.scale > 0;
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

  queueOmapLayerRender(ui, width, height, ratio) {
    const worker = this.ensureOmapWorker();
    if (!worker) {
      return false;
    }
    const request = this.createOmapLayerRequest(ui, width, height, ratio);
    if (this.omapWorkerPendingKey === request.key || this.omapWorkerDesired?.key === request.key) {
      return true;
    }
    console.info("OMAP worker queued", {
      key: request.key,
      mapVersion: request.mapVersion,
      view: request.view
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
    console.info("OMAP layer view", {
      renderQuality: view.renderQuality,
      highQuality: view.highQuality,
      ratio: view.ratio,
      paddingMultiplier: paddingScale,
      width: view.width,
      height: view.height,
      layerWidth: view.layerWidth,
      layerHeight: view.layerHeight,
      padX: view.padX,
      padY: view.padY,
      zoom: view.zoom,
      pan: view.pan,
      scale: view.scale,
      bounds: view.bounds,
      mapBounds: view.mapBounds
    });
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
    console.info("OMAP worker request", {
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
      const worker = new Worker(new URL("../workers/omap-render-worker.js?v=20260701-1", import.meta.url), { type: "module" });
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
    console.info("OMAP worker message", {
      type: message.type,
      requestId: message.requestId,
      mapVersion: message.mapVersion,
      currentMapVersion: this.omapMapVersion,
      hasBitmap: !!message.bitmap,
      error: message.error || "",
      view: message.view
    });
    if (message.error) {
      this.disableOmapWorker(message.error);
      return;
    }
    if (message.bitmap && message.mapVersion === this.omapMapVersion) {
      this.addOmapLayer({
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
    console.warn(`Falling back to main-thread OMAP rendering: ${reason}`);
    this.requestDraw(this.store.snapshot());
  }

  };
}
