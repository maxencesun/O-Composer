const BOOT_LOADING_ID = "oComposerBootLoading";
const BOOT_LOADING_STYLE_ID = "oComposerBootLoadingStyle";
const LANGUAGE_KEY = "purplePenLanguage";

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
      errorTitle: "O-Composer 启动失败",
      errorDetail: "请刷新页面，或打开开发者工具查看错误。"
    };
  }
  return {
    title: "Loading O-Composer…",
    detail: "Preparing the editor…",
    errorTitle: "O-Composer failed to start",
    errorDetail: "Refresh the page, or open developer tools to inspect the error."
  };
}

function ensureBootLoadingStyle() {
  if (typeof document === "undefined" || document.getElementById(BOOT_LOADING_STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = BOOT_LOADING_STYLE_ID;
  style.textContent = `
    #${BOOT_LOADING_ID} {
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
    #${BOOT_LOADING_ID} strong,
    #${BOOT_LOADING_ID} span {
      display: block;
    }
    #${BOOT_LOADING_ID} span {
      margin-top: 2px;
      color: #4b5563;
      font-size: 12px;
    }
    @keyframes appBootSpin {
      to { transform: rotate(360deg); }
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
      <div>
        <strong data-boot-title>${text.title}</strong>
        <span data-boot-detail>${text.detail}</span>
      </div>
    </div>
  `;
  const appendOverlay = () => {
    if (!document.body || document.getElementById(BOOT_LOADING_ID)) return;
    document.body.prepend(overlay);
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
  const title = overlay.querySelector("[data-boot-title]");
  const detail = overlay.querySelector("[data-boot-detail]");
  if (title) title.textContent = text.errorTitle;
  if (detail) detail.textContent = `${text.errorDetail}${error?.message ? ` ${error.message}` : ""}`;
}

ensureBootLoading();

import("./ui/app-shell.js")
  .then(({ PurplePenApp }) => {
    customElements.define("purple-pen-app", PurplePenApp);
  })
  .catch(error => {
    console.error(error);
    showBootError(error);
  });
