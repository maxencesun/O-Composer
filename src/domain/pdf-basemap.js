const PDF_JS_CANDIDATES = Object.freeze([
  {
    module: "https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.mjs",
    worker: "https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.worker.mjs"
  },
  {
    module: "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.min.mjs",
    worker: "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.worker.min.mjs"
  }
]);

const DEFAULT_PDF_DPI = 300;
const MAX_RENDER_EDGE = 8192;
const MIN_RENDER_EDGE = 1200;

let pdfJsPromise = null;

export function isPdfFile(file) {
  const name = String(file?.name || "").toLowerCase();
  const type = String(file?.type || "").toLowerCase();
  return type === "application/pdf" || name.endsWith(".pdf");
}

export async function renderPdfBasemap(file, options = {}) {
  if (!file) {
    throw new Error("No PDF file was selected.");
  }
  const pdfjsLib = await loadPdfJs();
  const bytes = new Uint8Array(await file.arrayBuffer());
  const loadingTask = pdfjsLib.getDocument({
    data: bytes,
    useSystemFonts: true,
    disableFontFace: false,
    verbosity: 0
  });
  const document = await loadingTask.promise;
  const pageCount = Math.max(1, Number(document.numPages) || 1);
  let pageNumber = positiveInteger(options.pageNumber, 1);
  if (pageCount > 1 && typeof options.choosePageNumber === "function") {
    pageNumber = positiveInteger(await options.choosePageNumber(pageCount), 1);
  }
  pageNumber = clamp(pageNumber, 1, pageCount);

  const page = await document.getPage(pageNumber);
  const viewportAtOne = page.getViewport({ scale: 1 });
  const renderScale = pdfRenderScale(viewportAtOne, options);
  const viewport = page.getViewport({ scale: renderScale });
  const canvas = documentCanvas(Math.ceil(viewport.width), Math.ceil(viewport.height));
  const context = canvas.getContext("2d", { alpha: true });
  if (!context) {
    throw new Error("Could not create a canvas for rendering the PDF map.");
  }
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  await page.render({
    canvasContext: context,
    viewport,
    background: "rgba(255,255,255,0)"
  }).promise;

  const url = await canvasToDataUrl(canvas);
  await safeDestroy(document);
  return {
    url,
    naturalWidth: canvas.width,
    naturalHeight: canvas.height,
    pageNumber,
    pageCount,
    renderScale,
    renderDpi: renderScale * 72,
    sourceWidthPt: viewportAtOne.width,
    sourceHeightPt: viewportAtOne.height,
    sourceDataUrl: bytesToDataUrl(bytes, "application/pdf")
  };
}

function bytesToDataUrl(bytes, type = "application/octet-stream") {
  let binary = "";
  const chunkSize = 0x8000;
  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    const chunk = bytes.subarray(offset, offset + chunkSize);
    binary += String.fromCharCode(...chunk);
  }
  return `data:${type};base64,${btoa(binary)}`;
}

async function loadPdfJs() {
  if (pdfJsPromise) return pdfJsPromise;
  pdfJsPromise = (async () => {
    let lastError = null;
    for (const candidate of PDF_JS_CANDIDATES) {
      try {
        const pdfjsLib = await import(/* @vite-ignore */ candidate.module);
        if (pdfjsLib?.GlobalWorkerOptions) {
          pdfjsLib.GlobalWorkerOptions.workerSrc = candidate.worker;
        }
        return pdfjsLib;
      }
      catch (error) {
        lastError = error;
      }
    }
    throw new Error(`Could not load PDF renderer. Check your network connection or provide a browser build with pdfjsLib. ${lastError?.message || ""}`.trim());
  })();
  return pdfJsPromise;
}

function pdfRenderScale(viewport, options = {}) {
  const targetDpi = clamp(Number(options.dpi) || DEFAULT_PDF_DPI, 144, 600);
  const baseScale = targetDpi / 72;
  const maxEdge = Math.max(MIN_RENDER_EDGE, Number(options.maxEdge) || MAX_RENDER_EDGE);
  const largestAtTarget = Math.max(viewport.width * baseScale, viewport.height * baseScale);
  if (largestAtTarget > maxEdge) {
    return Math.max(1, maxEdge / Math.max(viewport.width, viewport.height));
  }
  const smallestAtTarget = Math.min(viewport.width * baseScale, viewport.height * baseScale);
  if (smallestAtTarget < MIN_RENDER_EDGE) {
    return Math.max(baseScale, MIN_RENDER_EDGE / Math.max(1, Math.min(viewport.width, viewport.height)));
  }
  return baseScale;
}

function documentCanvas(width, height) {
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.min(MAX_RENDER_EDGE, width));
  canvas.height = Math.max(1, Math.min(MAX_RENDER_EDGE, height));
  return canvas;
}

function canvasToDataUrl(canvas) {
  return new Promise(resolve => {
    if (!canvas.toBlob) {
      resolve(canvas.toDataURL("image/png"));
      return;
    }
    canvas.toBlob(blob => {
      if (!blob) {
        resolve(canvas.toDataURL("image/png"));
        return;
      }
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || canvas.toDataURL("image/png")));
      reader.onerror = () => resolve(canvas.toDataURL("image/png"));
      reader.readAsDataURL(blob);
    }, "image/png");
  });
}

async function safeDestroy(document) {
  try {
    await document.destroy?.();
  }
  catch {
    // Ignore PDF.js cleanup failures; the rendered canvas is already available.
  }
}

function positiveInteger(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? Math.floor(number) : fallback;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}
