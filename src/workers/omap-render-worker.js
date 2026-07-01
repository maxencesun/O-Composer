import { drawOmapMap } from "../ui/omap-renderer.js?v=20260701-5";

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
    const summary = drawOmapMap(ctx, currentMap, point => project(point, view), view.scale, {
      highQuality: view.highQuality,
      mapBounds: view.mapBounds
    });
    const visibleObjectCount = Math.max(0, Number(summary?.visibleObjectCount) || 0);
    const painted = visibleObjectCount <= 0 || canvasHasPaint(canvas);
    console.info("OMAP worker rendered", {
      requestId: message.requestId,
      mapVersion: message.mapVersion,
      visibleObjectCount,
      painted,
      canvasWidth: canvas.width,
      canvasHeight: canvas.height,
      layerWidth: view.layerWidth,
      layerHeight: view.layerHeight,
      ratio: view.ratio,
      scale: view.scale,
      mapBounds: view.mapBounds
    });

    const bitmap = canvas.transferToImageBitmap();
    self.postMessage({
      type: "rendered",
      requestId: message.requestId,
      mapVersion: message.mapVersion,
      view,
      visibleObjectCount,
      painted,
      bitmap
    }, [bitmap]);
  }
  catch (error) {
    console.error("OMAP worker render failed", {
      requestId: message.requestId,
      mapVersion: message.mapVersion,
      message: error?.message || String(error),
      stack: error?.stack || ""
    });
    self.postMessage({
      type: "rendered",
      requestId: message.requestId,
      mapVersion: message.mapVersion,
      error: error?.message || String(error)
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

function canvasHasPaint(canvas) {
  const sampleSize = 32;
  const sample = new OffscreenCanvas(sampleSize, sampleSize);
  const sampleCtx = sample.getContext("2d", { willReadFrequently: true });
  if (!sampleCtx) return true;
  sampleCtx.drawImage(canvas, 0, 0, sampleSize, sampleSize);
  const data = sampleCtx.getImageData(0, 0, sampleSize, sampleSize).data;
  for (let index = 3; index < data.length; index += 4) {
    if (data[index] > 0) return true;
  }
  return false;
}
