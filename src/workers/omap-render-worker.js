import { drawOmapMap } from "../ui/omap-renderer.js?v=20260706-2";

let currentMap = null;
let currentMapVersion = 0;

self.onmessage = event => {
  const message = event.data || {};
  if (message.type === "setMap") {
    currentMap = message.map || null;
    currentMapVersion = message.mapVersion || 0;
    return;
  }
  if (message.type === "render") {
    renderLayer(message);
  }
};

function renderLayer(message) {
  const startedAt = performance.now();
  try {
    if (!currentMap || currentMapVersion !== message.mapVersion) {
      throw new Error("OMAP worker map is not ready");
    }
    const view = message.view;
    const canvas = new OffscreenCanvas(
      Math.max(1, Math.floor(view.layerWidth * view.ratio)),
      Math.max(1, Math.floor(view.layerHeight * view.ratio))
    );
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("Could not create worker canvas context");
    }

    ctx.setTransform(view.ratio, 0, 0, view.ratio, 0, 0);
    const drawStartedAt = performance.now();
    const summary = drawOmapMap(ctx, currentMap, point => project(point, view), view.scale, {
      highQuality: view.highQuality,
      mapBounds: view.mapBounds
    });
    const drawEndedAt = performance.now();
    const metrics = {
      totalBeforeTransferMs: roundWorkerDebug(drawEndedAt - startedAt),
      drawMs: roundWorkerDebug(drawEndedAt - drawStartedAt),
      visibleObjectCount: Math.max(0, Number(summary?.visibleObjectCount) || 0),
      priorityCount: Math.max(0, Number(summary?.priorityCount) || 0),
      canvasWidth: canvas.width,
      canvasHeight: canvas.height,
      layerWidth: view.layerWidth,
      layerHeight: view.layerHeight,
      ratio: view.ratio,
      scale: view.scale,
      renderQuality: view.renderQuality,
      highQuality: view.highQuality,
      zoom: view.zoom,
      pan: view.pan,
      bounds: view.bounds,
      mapBounds: view.mapBounds
    };
    const transferStartedAt = performance.now();
    const bitmap = canvas.transferToImageBitmap();
    const transferEndedAt = performance.now();
    metrics.transferMs = roundWorkerDebug(transferEndedAt - transferStartedAt);
    metrics.totalMs = roundWorkerDebug(transferEndedAt - startedAt);
    metrics.bitmapWidth = bitmap.width;
    metrics.bitmapHeight = bitmap.height;
    self.postMessage({
      type: "rendered",
      requestId: message.requestId,
      mapVersion: message.mapVersion,
      view,
      metrics,
      bitmap
    }, [bitmap]);
  }
  catch (error) {
    self.postMessage({
      type: "rendered",
      requestId: message.requestId,
      mapVersion: message.mapVersion,
      error: error?.message || String(error),
      stack: error?.stack || "",
      view: message.view || null,
      metrics: {
        totalMs: roundWorkerDebug(performance.now() - startedAt),
        renderQuality: message.view?.renderQuality || "",
        ratio: message.view?.ratio || 0,
        layerWidth: message.view?.layerWidth || 0,
        layerHeight: message.view?.layerHeight || 0
      }
    });
  }
}

function project(point, view) {
  const cx = (view.bounds.left + view.bounds.right) / 2;
  const cy = (view.bounds.top + view.bounds.bottom) / 2;
  return {
    x: view.width / 2 + (point.x - cx) * view.scale + view.pan.x + view.padX,
    y: view.height / 2 + (cy - point.y) * view.scale + view.pan.y + view.padY
  };
}

function roundWorkerDebug(value) {
  return Number.isFinite(value) ? Math.round(value * 1000) / 1000 : value;
}
