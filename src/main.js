const BOOT_LOADING_ID = "oComposerBootLoading";
const BOOT_LOADING_STYLE_ID = "oComposerBootLoadingStyle";
const LANGUAGE_KEY = "oComposerLanguage";
const bootProgressState = {
  percent: 4,
  title: "",
  detail: "",
  indeterminate: false
};


function ensureViewportMeta() {
  if (typeof document === "undefined") return;
  let meta = document.querySelector('meta[name="viewport"]');
  const content = "width=device-width, initial-scale=1, viewport-fit=cover";
  if (!meta) {
    meta = document.createElement("meta");
    meta.setAttribute("name", "viewport");
    const first = document.head?.firstChild || null;
    document.head?.insertBefore(meta, first);
  }
  if (meta && !/width\s*=\s*device-width/i.test(meta.getAttribute("content") || "")) {
    meta.setAttribute("content", content);
  }
}

function viewportNumber(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : fallback;
}

function updateRootViewportMetrics() {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  const visual = window.visualViewport;
  const width = Math.max(1, Math.round(viewportNumber(visual?.width, window.innerWidth || root.clientWidth || 1)));
  const height = Math.max(1, Math.round(viewportNumber(visual?.height, window.innerHeight || root.clientHeight || 1)));
  root.style.setProperty("--o-composer-viewport-width", `${width}px`);
  root.style.setProperty("--o-composer-viewport-height", `${height}px`);
}

function ensureViewportShellStyle() {
  if (typeof document === "undefined" || document.getElementById("oComposerViewportShellStyle")) return;
  const style = document.createElement("style");
  style.id = "oComposerViewportShellStyle";
  style.textContent = `
    html, body {
      width: 100%;
      height: var(--o-composer-viewport-height, 100vh);
      min-height: var(--o-composer-viewport-height, 100vh);
      margin: 0;
      padding: 0;
      overflow: hidden;
      overscroll-behavior: none;
      -webkit-text-size-adjust: 100%;
    }
    body {
      position: fixed;
      inset: 0;
      box-sizing: border-box;
    }
    o-composer-app {
      display: block;
      width: var(--o-composer-viewport-width, 100vw);
      max-width: var(--o-composer-viewport-width, 100vw);
      height: var(--o-composer-viewport-height, 100vh);
      max-height: var(--o-composer-viewport-height, 100vh);
      min-width: 0;
      min-height: 0;
      overflow: hidden;
      box-sizing: border-box;
    }
  `;
  document.head?.appendChild(style) || document.documentElement.appendChild(style);
}

function installRootViewportMetrics() {
  ensureViewportMeta();
  updateRootViewportMetrics();
  ensureViewportShellStyle();
  let frame = 0;
  const schedule = () => {
    if (frame) return;
    frame = requestAnimationFrame(() => {
      frame = 0;
      updateRootViewportMetrics();
    });
  };
  window.addEventListener("resize", schedule, { passive: true });
  window.addEventListener("orientationchange", schedule, { passive: true });
  window.visualViewport?.addEventListener("resize", schedule, { passive: true });
  window.visualViewport?.addEventListener("scroll", schedule, { passive: true });
}

function bootText() {
  let language = "en";
  try {
    language = localStorage.getItem(LANGUAGE_KEY) === "zh" ? "zh" : "en";
  } catch (_error) {
    language = "en";
  }
  if (language === "zh") {
    return {
      title: "正在加载 O-Composer…",
      detail: "正在准备编辑器…",
      moduleDetail: "正在加载编辑器模块…",
      initializeDetail: "正在初始化编辑器…",
      errorTitle: "O-Composer 启动失败",
      errorDetail: "请刷新页面，或打开开发者工具查看错误。"
    };
  }
  return {
    title: "Loading O-Composer…",
    detail: "Preparing the editor…",
    moduleDetail: "Loading editor modules…",
    initializeDetail: "Initializing the editor…",
    errorTitle: "O-Composer failed to start",
    errorDetail: "Refresh the page, or open developer tools to inspect the error."
  };
}

function clampPercent(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 0;
  return Math.max(0, Math.min(100, Math.round(number)));
}

function applyBootLoadingProgress() {
  const overlay = typeof document === "undefined" ? null : document.getElementById(BOOT_LOADING_ID);
  if (!overlay) return;
  const title = overlay.querySelector("[data-boot-title]");
  const detail = overlay.querySelector("[data-boot-detail]");
  const bar = overlay.querySelector("[data-boot-progress]");
  const value = overlay.querySelector("[data-boot-progress-value]");
  const percent = clampPercent(bootProgressState.percent);
  overlay.classList.toggle("is-indeterminate", Boolean(bootProgressState.indeterminate));
  overlay.style.setProperty("--app-boot-progress", `${percent}%`);
  if (title && bootProgressState.title) title.textContent = bootProgressState.title;
  if (detail && bootProgressState.detail) detail.textContent = bootProgressState.detail;
  if (bar) {
    bar.setAttribute("aria-valuenow", String(percent));
    bar.setAttribute("aria-valuetext", `${percent}%`);
  }
  if (value) value.textContent = `${percent}%`;
}

function updateBootLoadingProgress(update = {}) {
  const text = bootText();
  if (update.title !== undefined) {
    bootProgressState.title = update.title || text.title;
  } else if (!bootProgressState.title) {
    bootProgressState.title = text.title;
  }
  if (update.detail !== undefined) {
    bootProgressState.detail = update.detail || text.detail;
  } else if (!bootProgressState.detail) {
    bootProgressState.detail = text.detail;
  }
  if (update.percent !== undefined) {
    bootProgressState.percent = clampPercent(update.percent);
  }
  if (update.indeterminate !== undefined) {
    bootProgressState.indeterminate = Boolean(update.indeterminate);
  }
  applyBootLoadingProgress();
}

function ensureBootLoadingStyle() {
  if (typeof document === "undefined" || document.getElementById(BOOT_LOADING_STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = BOOT_LOADING_STYLE_ID;
  style.textContent = `
    #${BOOT_LOADING_ID} {
      --app-boot-progress: 4%;
      position: fixed;
      inset: 0;
      z-index: 2147483647;
      display: grid;
      place-items: center;
      box-sizing: border-box;
      background: rgba(248, 250, 252, 0.98);
      color: #111827;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      transition: opacity 0.18s ease;
    }
    #${BOOT_LOADING_ID}[hidden] {
      display: none !important;
    }
    #${BOOT_LOADING_ID}.is-done {
      opacity: 0;
      pointer-events: none;
    }
    #${BOOT_LOADING_ID}.is-error .app-boot-spinner {
      display: none;
    }
    #${BOOT_LOADING_ID} .app-boot-card {
      display: flex;
      align-items: center;
      gap: 12px;
      width: min(420px, calc(100vw - 32px));
      max-width: min(420px, calc(100vw - 32px));
      padding: 16px 18px;
      border: 1px solid #d1d5db;
      border-radius: 12px;
      background: #ffffff;
      box-shadow: 0 12px 36px rgba(15, 23, 42, 0.16);
    }
    #${BOOT_LOADING_ID} .app-boot-spinner {
      flex: 0 0 auto;
      width: 24px;
      height: 24px;
      border: 3px solid #e5e7eb;
      border-top-color: #a626ff;
      border-radius: 999px;
      animation: appBootSpin 0.85s linear infinite;
    }
    #${BOOT_LOADING_ID} .app-boot-content {
      flex: 1 1 auto;
      min-width: 0;
    }
    #${BOOT_LOADING_ID} strong,
    #${BOOT_LOADING_ID} span {
      display: block;
    }
    #${BOOT_LOADING_ID} span {
      margin-top: 2px;
      color: #4b5563;
      font-size: 12px;
    }
    #${BOOT_LOADING_ID} .app-boot-progress-row {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-top: 9px;
    }
    #${BOOT_LOADING_ID} .app-boot-progress-track {
      position: relative;
      flex: 1 1 auto;
      height: 7px;
      overflow: hidden;
      border-radius: 999px;
      background: #e5e7eb;
    }
    #${BOOT_LOADING_ID} .app-boot-progress-fill {
      position: absolute;
      inset: 0 auto 0 0;
      width: var(--app-boot-progress);
      min-width: 7px;
      border-radius: inherit;
      background: #a626ff;
      transition: width 0.18s ease;
    }
    #${BOOT_LOADING_ID}.is-indeterminate .app-boot-progress-fill {
      width: 38%;
      min-width: 38%;
      animation: appBootProgressIndeterminate 1.1s ease-in-out infinite;
      transition: none;
    }
    #${BOOT_LOADING_ID} .app-boot-progress-value {
      flex: 0 0 auto;
      min-width: 34px;
      text-align: right;
      font-variant-numeric: tabular-nums;
      color: #4b5563;
      font-size: 12px;
    }
    #${BOOT_LOADING_ID}.is-indeterminate .app-boot-progress-value {
      visibility: hidden;
    }
    @keyframes appBootSpin {
      to { transform: rotate(360deg); }
    }
    @keyframes appBootProgressIndeterminate {
      0% { transform: translateX(-115%); }
      100% { transform: translateX(265%); }
    }
  `;
  document.head?.appendChild(style) || document.documentElement.appendChild(style);
}

function ensureBootLoading() {
  if (typeof document === "undefined" || document.getElementById(BOOT_LOADING_ID)) return;
  ensureBootLoadingStyle();
  const text = bootText();
  const overlay = document.createElement("div");
  overlay.id = BOOT_LOADING_ID;
  overlay.setAttribute("role", "status");
  overlay.setAttribute("aria-live", "polite");
  overlay.innerHTML = `
    <div class="app-boot-card">
      <div class="app-boot-spinner" aria-hidden="true"></div>
      <div class="app-boot-content">
        <strong data-boot-title>${text.title}</strong>
        <span data-boot-detail>${text.detail}</span>
        <div class="app-boot-progress-row">
          <div class="app-boot-progress-track" data-boot-progress role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="4" aria-valuetext="4%">
            <div class="app-boot-progress-fill"></div>
          </div>
          <span class="app-boot-progress-value" data-boot-progress-value>4%</span>
        </div>
      </div>
    </div>
  `;
  const appendOverlay = () => {
    if (!document.body || document.getElementById(BOOT_LOADING_ID)) return;
    document.body.prepend(overlay);
    applyBootLoadingProgress();
  };
  if (document.body) {
    appendOverlay();
  } else {
    document.addEventListener("DOMContentLoaded", appendOverlay, { once: true });
  }
}

function showBootError(error) {
  const overlay = document.getElementById(BOOT_LOADING_ID);
  if (!overlay) return;
  const text = bootText();
  overlay.classList.add("is-error");
  overlay.classList.remove("is-indeterminate");
  updateBootLoadingProgress({
    percent: 100,
    title: text.errorTitle,
    detail: `${text.errorDetail}${error?.message ? ` ${error.message}` : ""}`
  });
}

const text = bootText();
globalThis.__oComposerBootLoading = {
  update: updateBootLoadingProgress
};

installRootViewportMetrics();
ensureBootLoading();
updateBootLoadingProgress({ percent: 8, detail: text.detail });

requestAnimationFrame(() => {
  updateBootLoadingProgress({ percent: 18, detail: text.moduleDetail, indeterminate: true });
});

import("./ui/app-shell.js?v=20260706-7")
  .then(({ OComposerApp }) => {
    updateBootLoadingProgress({ percent: 52, detail: text.initializeDetail, indeterminate: false });
    customElements.define("o-composer-app", OComposerApp);
  })
  .catch(error => {
    showBootError(error);
  });
