import assert from "node:assert/strict";
import { createAppShellCommandMethods } from "../src/ui/app-shell-command-methods.js";

function createClassList(initial = []) {
  const values = new Set(initial);
  return {
    add(...names) { names.forEach(name => values.add(name)); },
    remove(...names) { names.forEach(name => values.delete(name)); },
    contains(name) { return values.has(name); },
    toggle(name, force) {
      const enabled = force === undefined ? !values.has(name) : !!force;
      if (enabled) values.add(name);
      else values.delete(name);
      return enabled;
    }
  };
}

function createButton(iconSelector) {
  const attributes = new Map();
  const icon = { textContent: "" };
  return {
    attributes,
    disabled: false,
    title: "",
    setAttribute(name, value) { attributes.set(name, String(value)); },
    querySelector(selector) { return selector === iconSelector ? icon : null; },
    icon
  };
}

const methods = createAppShellCommandMethods({});
const style = {
  setProperty(name, value) { this[name] = value; },
  removeProperty(name) { delete this[name]; }
};
const dialog = {
  id: "userGuideDialog",
  classList: createClassList(),
  dataset: {},
  style,
  open: true,
  close() { this.open = false; },
  setAttribute() {},
  getBoundingClientRect() {
    const compact = this.classList.contains("compact");
    const minimized = this.classList.contains("minimized");
    const width = minimized ? 330 : compact ? 500 : 1128;
    const height = minimized ? 54 : compact ? 700 : 752;
    const left = Number.parseFloat(this.style.left) || (minimized || compact ? 1200 - width - 14 : 36);
    const top = Number.parseFloat(this.style.top) || (minimized || compact ? 800 - height - 14 : 24);
    return { left, top, width, height, right: left + width, bottom: top + height };
  }
};
const minimizeButton = createButton("[data-user-guide-minimize-icon]");
const compactButton = createButton("[data-user-guide-compact-icon]");
const search = { focus() {} };
const app = {
  ...methods,
  t(message) { return message; },
  querySelector(selector) {
    if (selector === "#userGuideDialog") return dialog;
    if (selector === "[data-user-guide-minimize]") return minimizeButton;
    if (selector === "[data-user-guide-compact]") return compactButton;
    if (selector === "#userGuideSearch") return search;
    return null;
  },
  finishUserGuideWindowAnimation(callback) { callback(); },
  scheduleUserGuideSidebarSelection() {},
  updateUserGuideSidebarSelection() {}
};

globalThis.requestAnimationFrame = callback => {
  callback();
  return 1;
};
globalThis.window = { innerWidth: 1200, innerHeight: 800 };

app.toggleUserGuideCompact();
assert.equal(dialog.classList.contains("compact"), true, "small-window mode should use the compact class");
assert.equal(compactButton.attributes.get("aria-pressed"), "true");
assert.equal(compactButton.title, "Full-size window");
assert.equal(compactButton.icon.textContent, "▣");

app.toggleUserGuideMinimize();
assert.equal(dialog.classList.contains("minimized"), true, "minimize should finish at the bottom-right title-bar state");
assert.equal(dialog.style.left, undefined, "minimized guide should dock at the viewport edge");
assert.equal(minimizeButton.title, "Restore guide");
assert.equal(minimizeButton.icon.textContent, "▢");

app.toggleUserGuideMinimize();
assert.equal(dialog.classList.contains("minimized"), false, "restore should leave minimized mode");
assert.equal(dialog.classList.contains("compact"), true, "restore should recover the previous small-window state");
assert.equal(dialog.style.left, "686px", "restore should recover the previous window position");

app.toggleUserGuideCompact();
assert.equal(dialog.classList.contains("compact"), false, "small-window button should restore the full-size reader");
assert.equal(compactButton.attributes.get("aria-pressed"), "false");

console.log("user guide window smoke test passed");
