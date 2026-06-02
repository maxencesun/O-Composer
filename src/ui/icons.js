const ICONS = {
  open: '<path d="M3 7.5h5l1.5 2H21l-2 8.5H5L3 7.5Z"/><path d="M4 7.5V5.5h6l1.4 2"/>',
  save: '<path d="M5 4h12l2 2v14H5Z"/><path d="M8 4v6h8V4"/><path d="M8 20v-6h8v6"/>',
  undo: '<path d="M9 7 5 11l4 4"/><path d="M5 11h9a5 5 0 1 1 0 10h-2"/>',
  redo: '<path d="m15 7 4 4-4 4"/><path d="M19 11h-9a5 5 0 1 0 0 10h2"/>',
  delete: '<path d="M4 7h16"/><path d="M9 7V4h6v3"/><path d="m8 10 .7 10h6.6L16 10"/>',
  plus: '<path d="M12 5v14"/><path d="M5 12h14"/>',
  trash: '<path d="M4 7h16"/><path d="M9 7V4h6v3"/><path d="M8 10v9"/><path d="M12 10v9"/><path d="M16 10v9"/>',
  start: '<path d="M12 4 20 18H4Z"/>',
  control: '<circle cx="12" cy="12" r="7"/>',
  finish: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="5"/>',
  text: '<path d="M5 5h14"/><path d="M12 5v14"/><path d="M9 19h6"/>',
  line: '<path d="M5 18 19 6"/>',
  cut: '<path d="M5 18 19 6"/><path d="m8 6 8 12"/><circle cx="8" cy="6" r="1.5"/><circle cx="16" cy="18" r="1.5"/>',
  rectangle: '<rect x="5" y="6" width="14" height="12"/>',
  descriptions: '<rect x="4.5" y="5" width="15" height="14" rx="1"/><path d="M4.5 9h15"/><path d="M4.5 13h15"/><path d="M8.25 5v14"/><path d="M12 5v14"/><path d="M15.75 5v14"/>',
  "print-area": '<rect x="5" y="4" width="14" height="16" rx="1.5"/><path d="M8 8h8"/><path d="M8 16h8"/><path d="M8 4v3"/><path d="M16 17v3"/>',
  fit: '<path d="M8 4H4v4"/><path d="M16 4h4v4"/><path d="M8 20H4v-4"/><path d="M16 20h4v-4"/><path d="M4 4l5 5"/><path d="m20 4-5 5"/><path d="m4 20 5-5"/><path d="m20 20-5-5"/>'
};

export function iconSvg(name) {
  const content = ICONS[name] || ICONS.control;
  return `<svg class="tool-icon" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${content}</svg>`;
}
