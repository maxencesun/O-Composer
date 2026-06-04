import { cloneEvent, createBlankEvent } from "../domain/event-model.js";

export class Store {
  constructor() {
    this.state = {
      eventModel: createBlankEvent(),
      ui: {
        selectedCourseId: 1,
        selection: null,
        tool: "select",
        zoom: 1,
        pan: { x: 0, y: 0 },
        mapIntensity: 0.65,
        highQuality: true,
        showPrintArea: false,
        showAllControls: false,
        variationMode: "default",
        variationCode: "",
        relayTeam: 1,
        relayLeg: 1,
        report: { title: "Course Summary", rows: [], kind: "summary" },
        status: "Ready",
        background: null
      }
    };
    this.undoStack = [];
    this.redoStack = [];
    this.listeners = new Set();
    this.maxHistory = 80;
    this.pushHistory("Initial");
  }

  subscribe(listener) {
    this.listeners.add(listener);
    listener(this.snapshot());
    return () => this.listeners.delete(listener);
  }

  snapshot() {
    return this.state;
  }

  setEventModel(eventModel, label = "Change", pushHistory = true) {
    this.state.eventModel = eventModel;
    this.state.eventModel.dirty = pushHistory;
    if (pushHistory) {
      this.pushHistory(label);
      this.redoStack = [];
    }
    this.notify(label);
  }

  updateEvent(mutator, label = "Change") {
    const next = cloneEvent(this.state.eventModel);
    mutator(next);
    next.dirty = true;
    this.setEventModel(next, label, true);
  }

  updateUi(mutator, label = "UI") {
    mutator(this.state.ui);
    this.notify(label);
  }

  setSelection(selection) {
    this.updateUi(ui => {
      ui.selection = selection;
    }, "Selection");
  }

  undo() {
    if (this.undoStack.length <= 1) {
      return false;
    }
    const current = this.undoStack.pop();
    this.redoStack.push(current);
    const previous = this.undoStack[this.undoStack.length - 1];
    this.state.eventModel = JSON.parse(previous.snapshot);
    this.state.eventModel.dirty = true;
    this.state.ui.selection = null;
    this.notify("Undo");
    return true;
  }

  redo() {
    const entry = this.redoStack.pop();
    if (!entry) {
      return false;
    }
    this.undoStack.push(entry);
    this.state.eventModel = JSON.parse(entry.snapshot);
    this.state.eventModel.dirty = true;
    this.state.ui.selection = null;
    this.notify("Redo");
    return true;
  }

  markClean(sourceName = this.state.eventModel.sourceName) {
    this.state.eventModel.sourceName = sourceName;
    this.state.eventModel.dirty = false;
    this.notify("Saved");
  }

  resetHistory(label = "Loaded") {
    this.undoStack = [];
    this.redoStack = [];
    this.pushHistory(label);
  }

  canUndo() {
    return this.undoStack.length > 1;
  }

  canRedo() {
    return this.redoStack.length > 0;
  }

  pushHistory(label) {
    this.undoStack.push({
      label,
      snapshot: JSON.stringify(this.state.eventModel)
    });
    if (this.undoStack.length > this.maxHistory) {
      this.undoStack.shift();
    }
  }

  notify(label) {
    this.state.ui.status = label || this.state.ui.status;
    for (const listener of this.listeners) {
      listener(this.snapshot());
    }
  }
}
