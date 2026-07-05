import {
  allControlsView,
  courseLegs,
  courseView,
  eventBounds,
  getControl,
  getCourse,
  controlsUsedByCourse,
  isTeamFreeCourseControl
} from "../domain/course-service.js?v=20260706-3";
import {
  createDescriptionSpecialOptions,
  descriptionBounds,
  drawControlDescriptionBlock,
  resizedDescriptionSpecial,
  specialVisibleForCourse
} from "../domain/control-descriptions.js?v=20260706-3";
import { effectivePrintArea, printAreaCenter } from "../domain/print-area.js?v=20260706-3";
import { relayEntryLabel, relayVariationForLeg, variationForCode } from "../domain/relay-variations.js?v=20260706-3";
import {
  createCourseSymbolMetrics,
  courseSymbolMmToMapDistance,
  courseLegTrimRadius,
  defaultControlLabelPoint,
  directionAngle,
  drawControlLabel,
  drawCourseControl,
  drawCourseLeg,
  drawPointSpecialSymbol,
  symbolApparentRadius
} from "./course-symbols.js?v=20260706-3";
import { drawOmapMap } from "./omap-renderer.js?v=20260706-3";
import {
  effectiveCanvasPixelRatio,
  effectiveOmapPixelRatio,
  omapPaddingMultiplier,
  renderQualityHighQuality,
  renderQualityImageSmoothingQuality
} from "./render-quality.js?v=20260706-3";

import {
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
  isAreaSpecialTool,
  specialShapeForDrag,
  drawSpecialObject,
  drawAreaSpecial,
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
  clamp
} from "./map-view-helpers.js?v=20260706-3";
import { createMapViewRenderMethods } from "./map-view-render-methods.js?v=20260706-3";
import { createMapViewOmapMethods } from "./map-view-omap-methods.js?v=20260706-3";
import { createMapViewPointerMethods } from "./map-view-pointer-methods.js?v=20260706-3";
import { createMapViewHitTestMethods } from "./map-view-hit-test-methods.js?v=20260706-3";
import { createMapViewCoordinateMethods } from "./map-view-coordinate-methods.js?v=20260706-3";
import { debugLog, installDebugLogDownloadButton } from "./debug-log.js?v=20260706-3";
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
    this.omapLayerCache = [];
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
    this.areaSpecialDraft = null;
    this.suppressNextContextMenu = false;
    this.activePointers = new Map();
    this.pinch = null;
    installDebugLogDownloadButton();
    debugLog("map-view.constructor", {
      canvas: { width: canvas.width, height: canvas.height, clientWidth: canvas.clientWidth, clientHeight: canvas.clientHeight },
      devicePixelRatio: window.devicePixelRatio || 1,
      bounds: this.bounds
    });

    this.canvas.addEventListener("pointerdown", event => this.pointerDown(event));
    this.canvas.addEventListener("pointermove", event => this.pointerMove(event));
    this.canvas.addEventListener("pointerup", event => this.pointerUp(event));
    this.canvas.addEventListener("pointercancel", event => this.pointerCancel(event));
    this.canvas.addEventListener("pointerleave", () => this.clearToolPreview());
    this.canvas.addEventListener("contextmenu", event => this.contextMenu(event));
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

}
const MAP_VIEW_METHOD_DEPS = {
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
  effectiveCanvasPixelRatio,
  effectiveOmapPixelRatio,
  omapPaddingMultiplier,
  renderQualityHighQuality,
  renderQualityImageSmoothingQuality,
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
  isAreaSpecialTool,
  specialShapeForDrag,
  drawSpecialObject,
  drawAreaSpecial,
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
  clamp
};

Object.assign(
  MapView.prototype,
  createMapViewRenderMethods(MAP_VIEW_METHOD_DEPS),
  createMapViewOmapMethods(MAP_VIEW_METHOD_DEPS),
  createMapViewPointerMethods(MAP_VIEW_METHOD_DEPS),
  createMapViewHitTestMethods(MAP_VIEW_METHOD_DEPS),
  createMapViewCoordinateMethods(MAP_VIEW_METHOD_DEPS)
);
