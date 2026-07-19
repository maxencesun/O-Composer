import { ocadImportController } from "../ocd/ocd-import-controller.js?v=20260718-78";
import { debugLog, debugWarn } from "./debug-log.js?v=20260718-78";

const LARGE_MAP_FILE_BYTES = 64 * 1024 * 1024;
const MAX_MAP_FILE_BYTES = 512 * 1024 * 1024;
const LARGE_SESSION_SOURCE_BYTES = 16 * 1024 * 1024;
const FIRST_LAYER_TIMEOUT_MS = 180_000;

function nextPaint() {
  return new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
}

function readTextFile(file, onProgress) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onprogress = event => onProgress?.({
      phase: "reading",
      loadedBytes: event.loaded,
      totalBytes: event.lengthComputable ? event.total : file.size
    });
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(reader.error || new Error("Could not read the map file."));
    reader.onabort = () => reject(new DOMException("Map import was cancelled.", "AbortError"));
    reader.readAsText(file);
  });
}

function outputNameForOcd(name) {
  const value = String(name || "map.ocd");
  return /\.ocd$/i.test(value) ? value.replace(/\.ocd$/i, ".omap") : `${value}.omap`;
}

function converterModeLabel(app, mode) {
  return mode === "official-wasm"
    ? app.t("Official Mapper WASM")
    : app.t("JavaScript compatibility mode");
}

function converterLoadingText(app, state) {
  const total = Number(state?.engineTotalBytes ?? state?.totalBytes) || 0;
  const loaded = Number(state?.engineLoadedBytes ?? state?.loadedBytes) || 0;
  if (state?.engineDownloadComplete === true) {
    return app.t("OCAD converter has downloaded and is initializing. Please wait, then click Import OCAD Map again.");
  }
  if (total > 0 && loaded >= total) {
    return app.t("OCAD converter is finishing its downloads. Please wait, then click Import OCAD Map again.");
  }
  if (loaded > 0 && total > 0) {
    return app.t("OCAD converter is still loading ({loaded} / {total}). Please wait, then click Import OCAD Map again.", {
      loaded: app.formatBytesForMapImport(loaded),
      total: app.formatBytesForMapImport(total)
    });
  }
  return app.t("OCAD converter is still loading (about 26 MB). Please wait, then click Import OCAD Map again.");
}

export function createAppShellMapImportMethods(deps) {
  const {
    parseOmap,
    positiveScale,
    applyImportedMapScale,
    formatBytes
  } = deps;

  return {
    initializeMapImporter() {
      this.mapImportSequence = Number(this.mapImportSequence) || 0;
      this.mapImportJob = null;
      this.ocadImportState = ocadImportController.snapshot();
      this.ocadImportUnsubscribe?.();
      this.ocadImportUnsubscribe = ocadImportController.subscribe(state => {
        this.ocadImportState = state;
        this.updateOcadPreloadProgress(state);
      });

      const preload = () => {
        void ocadImportController.preload().catch(error => {
          debugWarn("ocad.converter.preload.failed", {
            message: error?.message || String(error),
            stack: error?.stack || ""
          });
        });
      };
      // Start the network immediately so Mapper JS/data/WASM can overlap with
      // app-resource caching instead of waiting up to 1.5 seconds for idle time.
      preload();
      this.ocadPreloadHandle = 0;
    },

    disposeMapImporter() {
      this.ocadImportUnsubscribe?.();
      this.ocadImportUnsubscribe = null;
      if (typeof cancelIdleCallback === "function" && this.ocadPreloadHandle) {
        cancelIdleCallback(this.ocadPreloadHandle);
      }
      else if (this.ocadPreloadHandle) {
        clearTimeout(this.ocadPreloadHandle);
      }
      this.ocadPreloadHandle = 0;
    },

    formatBytesForMapImport(bytes) {
      return formatBytes(bytes);
    },

    updateOcadPreloadProgress(state) {
      this.updateResourcePrecacheProgress?.();
      if (this.mapImportJob) return;
      if (state?.phase === "loading") {
        this.setMapImportProgress(null);
        return;
      }
      if (state?.phase === "ready") {
        this.setMapImportProgress(null);
        return;
      }
      if (state?.phase === "error" && state?.operation === "preloading") {
        this.setMapImportProgress({
          percent: null,
          text: this.t("OCAD converter could not be loaded: {message}", {
            message: state.error || this.t("Unknown error")
          }),
          busy: false
        });
      }
    },

    requestOmapImport() {
      if (this.mapImportJob) {
        this.showMapImportBusyMessage();
        return;
      }
      this.querySelector("#omapInput")?.click();
    },

    requestOcadImport() {
      if (this.mapImportJob) {
        this.showMapImportBusyMessage();
        return;
      }
      const state = ocadImportController.snapshot();
      if (state.phase === "ready") {
        this.querySelector("#ocdInput")?.click();
        return;
      }
      if (state.phase === "error") {
        const message = state.error || this.t("Unknown error");
        void ocadImportController.preload().catch(() => {});
        alert(this.t("OCAD converter previously failed and is being retried: {message}", { message }));
        return;
      }
      if (state.phase === "loading") {
        alert(converterLoadingText(this, state));
        return;
      }
      void ocadImportController.preload().catch(() => {});
      alert(converterLoadingText(this, state));
    },

    showMapImportBusyMessage() {
      const job = this.mapImportJob;
      if (!job) return;
      alert(this.t("A map is still being imported: {name} ({stage}). Please wait for it to finish.", {
        name: job.fileName || this.t("Unknown file"),
        stage: job.stage || this.t("working")
      }));
    },

    beginMapImport(kind, file) {
      if (this.mapImportJob) {
        this.showMapImportBusyMessage();
        return null;
      }
      const job = {
        id: ++this.mapImportSequence,
        kind,
        fileName: file?.name || this.t("Unknown file"),
        fileSize: Number(file?.size) || 0,
        stage: this.t("reading")
      };
      this.mapImportJob = job;
      this.querySelector("#mapCanvas")?.setAttribute("aria-busy", "true");
      return job;
    },

    isCurrentMapImport(job) {
      return !!job && this.mapImportJob?.id === job.id;
    },

    finishMapImport(job, finalText = "") {
      if (!this.isCurrentMapImport(job)) return;
      this.mapImportJob = null;
      this.querySelector("#mapCanvas")?.removeAttribute("aria-busy");
      if (finalText) {
        this.store.updateUi(ui => { ui.status = finalText; }, finalText);
        this.setMapImportProgress({ percent: 100, text: finalText, busy: false });
        const completedId = job.id;
        window.setTimeout(() => {
          if (!this.mapImportJob && this.mapImportSequence === completedId
              && ocadImportController.snapshot().phase !== "loading") {
            this.setMapImportProgress(null);
          }
        }, 2200);
      }
      else {
        this.setMapImportProgress(null);
      }
    },

    setMapImportProgress(progress) {
      const box = this.querySelector("#mapImportProgress");
      const bar = this.querySelector("#mapImportProgressBar");
      const text = this.querySelector("#mapImportProgressText");
      if (!box || !bar || !text) return;
      if (!progress) {
        box.hidden = true;
        bar.removeAttribute("value");
        text.textContent = "";
        return;
      }
      box.hidden = false;
      const percent = Number(progress.percent);
      if (Number.isFinite(percent)) bar.value = Math.max(0, Math.min(100, percent));
      else bar.removeAttribute("value");
      text.textContent = progress.text || "";
    },

    confirmMapFileSize(file) {
      const size = Number(file?.size) || 0;
      if (size > MAX_MAP_FILE_BYTES) {
        alert(this.t("Map file {name} is too large ({size}). The browser limit is {limit}.", {
          name: file?.name || this.t("Unknown file"),
          size: formatBytes(size),
          limit: formatBytes(MAX_MAP_FILE_BYTES)
        }));
        return false;
      }
      if (size >= LARGE_MAP_FILE_BYTES) {
        return confirm(this.t("{name} is a large map file ({size}). Importing may temporarily use several times that amount of memory and pause the editor. Continue?", {
          name: file?.name || this.t("Unknown file"),
          size: formatBytes(size)
        }));
      }
      return true;
    },

    updateMapImportProgress(job, progress, fallbackText) {
      if (!this.isCurrentMapImport(job)) return;
      const loaded = Number(progress?.loadedBytes ?? progress?.loaded) || 0;
      const total = Number(progress?.totalBytes ?? progress?.total) || job.fileSize;
      const phase = progress?.phase || progress?.stage || job.stage;
      job.stage = this.t(String(phase || "working"));
      const percent = total > 0 && loaded > 0 ? loaded / total * 100 : null;
      const byteText = loaded > 0
        ? ` (${formatBytes(loaded)} / ${formatBytes(Math.max(total, loaded))})`
        : "";
      this.setMapImportProgress({
        percent,
        text: `${fallbackText || job.stage}${byteText}`,
        busy: true
      });
    },

    async openOmapFile(file) {
      if (!file || !this.confirmMapFileSize(file)) return;
      const job = this.beginMapImport("omap", file);
      if (!job) return;
      let finalText = "";
      try {
        this.updateMapImportProgress(job, { phase: "reading", totalBytes: file.size },
          this.t("Reading map {name}…", { name: file.name }));
        const sourceText = await readTextFile(file, progress => {
          this.updateMapImportProgress(job, progress,
            this.t("Reading map {name}…", { name: file.name }));
        });
        if (!this.isCurrentMapImport(job)) return;
        const loaded = await this.loadOmapSource(sourceText, file.name, job, {
          sourceKind: "omap",
          sourceSize: file.size
        });
        finalText = this.t("Map {name} is ready ({objects} objects).", {
          name: file.name,
          objects: loaded.omap.objectCount
        });
      }
      catch (error) {
        if (this.isCurrentMapImport(job)) {
          alert(this.t("Could not import OMAP file {name}: {message}", {
            name: file.name || this.t("Unknown file"),
            message: error?.message || String(error)
          }));
        }
      }
      finally {
        this.finishMapImport(job, finalText);
      }
    },

    async openOcadFile(file) {
      if (!file || !this.confirmMapFileSize(file)) return;
      if (ocadImportController.snapshot().phase !== "ready") {
        void ocadImportController.preload().catch(() => {});
        alert(converterLoadingText(this, ocadImportController.snapshot()));
        return;
      }
      const job = this.beginMapImport("ocd", file);
      if (!job) return;
      let finalText = "";
      try {
        this.updateMapImportProgress(job, { phase: "reading", totalBytes: file.size },
          this.t("Reading OCAD map {name}…", { name: file.name }));
        const converted = await ocadImportController.convertFile(file, {
          onProgress: progress => {
            const stage = progress?.phase || progress?.stage;
            const label = stage === "converting"
              ? this.t("Converting OCAD map {name}…", { name: file.name })
              : this.t("Reading OCAD map {name}…", { name: file.name });
            this.updateMapImportProgress(job, progress, label);
          }
        });
        if (!this.isCurrentMapImport(job)) return;
        const loaded = await this.loadOmapSource(converted.xml, outputNameForOcd(file.name), job, {
          sourceKind: "ocd",
          sourceFileName: file.name,
          sourceSize: file.size,
          converterMode: converted.mode,
          converterRevision: converted.revision,
          converterWarnings: converted.warnings || []
        });
        const warningCount = converted.warnings?.length || 0;
        if (warningCount) {
          debugWarn("ocad.import.warnings", {
            name: file.name,
            mode: converted.mode,
            warnings: converted.warnings
          });
        }
        const modeLabel = converterModeLabel(this, converted.mode);
        finalText = warningCount
          ? this.t("OCAD map {name} is ready in {mode} ({objects} objects, {warnings} warning(s)).", {
              name: file.name,
              mode: modeLabel,
              objects: loaded.omap.objectCount,
              warnings: warningCount
            })
          : this.t("OCAD map {name} is ready in {mode} ({objects} objects).", {
              name: file.name,
              mode: modeLabel,
              objects: loaded.omap.objectCount
            });
      }
      catch (error) {
        if (this.isCurrentMapImport(job)) {
          alert(this.t("Could not import OCAD file {name}: {message}", {
            name: file.name || this.t("Unknown file"),
            message: error?.message || String(error)
          }));
        }
      }
      finally {
        this.finishMapImport(job, finalText);
      }
    },

    async loadOmapSource(sourceText, displayName, job, metadata = {}) {
      if (!this.isCurrentMapImport(job)) throw new Error("Map import is no longer current.");
      job.stage = this.t("parsing");
      this.setMapImportProgress({
        percent: null,
        text: this.t("Parsing converted map {name}…", { name: displayName }),
        busy: true
      });
      await nextPaint();

      const currentMapScale = positiveScale(this.store.snapshot().eventModel.event?.map?.scale) || 15000;
      const omap = parseOmap(sourceText, displayName, { fallbackScale: currentMapScale });
      if (!this.isCurrentMapImport(job)) throw new Error("Map import is no longer current.");

      debugLog("omap.loaded", {
        name: omap.name,
        sourceKind: metadata.sourceKind || "omap",
        scale: omap.scale,
        objectCount: omap.objectCount,
        symbolCount: omap.symbolCount,
        bounds: omap.bounds
      });

      job.stage = this.t("rendering");
      this.setMapImportProgress({
        percent: null,
        text: this.t("Preparing the first map image…"),
        busy: true
      });
      const omapScale = positiveScale(omap.scale);
      const previousMap = this.mapView.omapMap || null;
      const previousBackgroundUrl = this.mapView.backgroundUrl || "";
      const currentUi = this.store.snapshot().ui;
      const previousUi = {
        omap: currentUi.omap || null,
        background: currentUi.background || null,
        pan: { x: Number(currentUi.pan?.x) || 0, y: Number(currentUi.pan?.y) || 0 },
        zoom: Number(currentUi.zoom) || 1
      };

      // Render the imported map at its default view before committing it to
      // session state. Direct assignment here is deliberate: setOmap() draws
      // from the current snapshot, while a failed first frame can still restore
      // the complete previous map/UI without creating a false successful save.
      currentUi.pan = { x: 0, y: 0 };
      currentUi.zoom = 1;
      this.mapView.setBackground("");
      const mapVersion = this.mapView.setOmap(omap);
      const sourceBytes = Number(metadata.sourceSize) || sourceText.length;
      const sessionCacheable = sourceText.length <= LARGE_SESSION_SOURCE_BYTES;

      try {
        await this.mapView.waitForOmapReady(mapVersion, { timeout: FIRST_LAYER_TIMEOUT_MS });
      }
      catch (error) {
        if (!this.isCurrentMapImport(job)) throw error;
        debugWarn("omap.first-layer.wait.failed", {
          name: displayName,
          mapVersion,
          message: error?.message || String(error)
        });
        if (this.mapView.omapMapVersion === mapVersion) {
          currentUi.pan = previousUi.pan;
          currentUi.zoom = previousUi.zoom;
          this.mapView.setBackground(previousBackgroundUrl);
          this.mapView.setOmap(previousMap);
          this.store.updateUi(ui => {
            ui.omap = previousUi.omap;
            ui.background = previousUi.background;
            ui.pan = previousUi.pan;
            ui.zoom = previousUi.zoom;
          }, this.t("Previous map restored after import failure."));
        }
        // Never announce a successful import while the map canvas is still
        // blank. The caller keeps the parsed map available for diagnosis, but
        // reports the first-layer timeout/failure to the user explicitly.
        throw error;
      }
      if (!this.isCurrentMapImport(job)) throw new Error("Map import is no longer current.");
      if (omapScale) {
        this.store.updateEvent(model => applyImportedMapScale(model, omapScale), "OMAP map scale loaded");
      }
      this.store.updateUi(ui => {
        ui.omap = {
          name: displayName,
          objectCount: omap.objectCount,
          symbolCount: omap.symbolCount,
          scale: omapScale || omap.scale,
          sourceText,
          sourceBytes,
          sessionCacheable,
          ...metadata
        };
        ui.background = null;
        ui.pan = { x: 0, y: 0 };
        ui.zoom = 1;
      }, this.t("Preparing imported map…"));
      return { omap, mapVersion, sessionCacheable };
    }
  };
}
