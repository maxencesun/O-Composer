export const RENDER_QUALITY_KEY = "oComposerRenderQuality";

export const RENDER_QUALITY_IDS = Object.freeze({
  PERFORMANCE: "performance",
  BALANCED: "balanced",
  QUALITY: "quality",
  ULTRA: "ultra"
});

export const RENDER_QUALITIES = Object.freeze([
  {
    id: RENDER_QUALITY_IDS.PERFORMANCE,
    label: "Performance",
    description: "Best for low-power devices",
    canvasPixelRatio: 1,
    omapPixelRatio: 1,
    omapPaddingMultiplier: 0.5,
    highQuality: false,
    imageSmoothingQuality: "low"
  },
  {
    id: RENDER_QUALITY_IDS.BALANCED,
    label: "Balanced",
    description: "Recommended for most devices",
    canvasPixelRatio: 1.5,
    omapPixelRatio: 1.35,
    omapPaddingMultiplier: 0.75,
    highQuality: true,
    imageSmoothingQuality: "medium"
  },
  {
    id: RENDER_QUALITY_IDS.QUALITY,
    label: "High quality",
    description: "Sharper rendering on stronger devices",
    canvasPixelRatio: 2,
    omapPixelRatio: 2,
    omapPaddingMultiplier: 1,
    highQuality: true,
    imageSmoothingQuality: "high"
  },
  {
    id: RENDER_QUALITY_IDS.ULTRA,
    label: "Ultra",
    description: "Maximum detail; may be slower",
    canvasPixelRatio: 3,
    omapPixelRatio: 3,
    omapPaddingMultiplier: 1.25,
    highQuality: true,
    imageSmoothingQuality: "high"
  }
]);

export function isRenderQualityId(value) {
  return RENDER_QUALITIES.some(profile => profile.id === value);
}

export function renderQualityProfile(value) {
  const id = typeof value === "string" ? value : value?.renderQuality;
  return RENDER_QUALITIES.find(profile => profile.id === id) || RENDER_QUALITIES[1];
}

export function defaultRenderQualityId() {
  const deviceMemory = Number(globalThis.navigator?.deviceMemory || 0);
  const cores = Number(globalThis.navigator?.hardwareConcurrency || 0);
  const dpr = Number(globalThis.window?.devicePixelRatio || 1);
  const width = Math.max(1, Number(globalThis.window?.innerWidth || globalThis.document?.documentElement?.clientWidth || 0));
  const height = Math.max(1, Number(globalThis.window?.innerHeight || globalThis.document?.documentElement?.clientHeight || 0));
  const shortSide = Math.min(width, height);
  const longSide = Math.max(width, height);
  const maxTouchPoints = Number(globalThis.navigator?.maxTouchPoints || 0);
  const userAgent = globalThis.navigator?.userAgent || "";
  const phoneLike = /iPhone|iPod/i.test(userAgent)
    || (/Android/i.test(userAgent) && /Mobile/i.test(userAgent))
    || (maxTouchPoints > 0 && shortSide <= 560 && longSide <= 980);

  if (phoneLike || (deviceMemory > 0 && deviceMemory <= 4) || (cores > 0 && cores <= 4) || dpr >= 3) {
    return RENDER_QUALITY_IDS.PERFORMANCE;
  }
  if ((deviceMemory >= 8 || deviceMemory === 0) && (cores >= 8 || cores === 0) && dpr <= 2.5) {
    return RENDER_QUALITY_IDS.QUALITY;
  }
  return RENDER_QUALITY_IDS.BALANCED;
}

export function readRenderQualityPreference() {
  try {
    const value = globalThis.localStorage.getItem(RENDER_QUALITY_KEY);
    return isRenderQualityId(value) ? value : defaultRenderQualityId();
  }
  catch {
    return defaultRenderQualityId();
  }
}

export function setRenderQualityPreference(value) {
  try {
    if (isRenderQualityId(value)) {
      globalThis.localStorage.setItem(RENDER_QUALITY_KEY, value);
    }
  }
  catch {}
}

export function effectiveCanvasPixelRatio(ui, rawRatio = globalThis.window?.devicePixelRatio || 1) {
  const profile = renderQualityProfile(ui);
  return Math.max(1, Math.min(Number(rawRatio) || 1, profile.canvasPixelRatio));
}

export function effectiveOmapPixelRatio(ui, rawRatio = globalThis.window?.devicePixelRatio || 1) {
  const profile = renderQualityProfile(ui);
  return Math.max(1, Math.min(Number(rawRatio) || 1, profile.omapPixelRatio));
}

export function omapPaddingMultiplier(ui) {
  return renderQualityProfile(ui).omapPaddingMultiplier || 1;
}

export function renderQualityHighQuality(ui) {
  return renderQualityProfile(ui).highQuality !== false;
}

export function renderQualityImageSmoothingQuality(ui) {
  return renderQualityProfile(ui).imageSmoothingQuality || "high";
}
