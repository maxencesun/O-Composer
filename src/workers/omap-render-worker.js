import { drawOmapMap } from "../ui/omap-renderer.js";

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
    drawOmapMap(ctx, currentMap, point => project(point, view), view.scale, {
      highQuality: view.highQuality,
      mapBounds: view.mapBounds
    });

    const bitmap = canvas.transferToImageBitmap();
    self.postMessage({
      type: "rendered",
      requestId: message.requestId,
      mapVersion: message.mapVersion,
      view,
      bitmap
    }, [bitmap]);
  }
  catch (error) {
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
