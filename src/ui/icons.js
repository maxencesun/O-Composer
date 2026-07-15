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
  "map-issue": '<path d="M9 5v14"/><path d="M9 12h7"/>',
  "map-pages": '<rect x="3.5" y="5" width="11" height="14" rx="1"/><rect x="9.5" y="3" width="11" height="14" rx="1"/><path d="m12.5 8 2.5 2.5L12.5 13"/><path d="M15 10.5h3"/>',
  "restricted-special": '<path d="M3 5h8v14H3Z"/><path d="m3 12 7-7M3 18l8-8M6 19l5-5"/><path d="M16 5h3v5h3v4h-3v5h-3v-5h-3v-4h3Z"/>',
  decoration: '<path d="M4 18 10 7l4 11 2-5 4 5"/><circle cx="8" cy="15" r="2"/><path d="M15 5h6"/><path d="M18 5v8"/>',
  "out-of-bounds": '<path d="M5 18 19 6"/><path d="M5 6l14 12"/><path d="M8 4h8l4 4v8l-4 4H8l-4-4V8Z"/>',
  "dangerous-area": '<path d="M12 4 21 19H3Z"/><path d="M9 14h6"/><path d="M12 9v3"/>',
  construction: '<rect x="5" y="6" width="14" height="12" fill="currentColor" opacity=".42"/><rect x="5" y="6" width="14" height="12"/>',
  "forbidden-route": '<path d="M7 7 17 17"/><path d="M17 7 7 17"/>',
  "optional-crossing-point": '<path d="M7 4 9 7v10l-2 3"/><path d="m17 4-2 3v10l2 3"/>',
  water: '<ellipse cx="12" cy="6.5" rx="7" ry="2.5"/><path d="m5 6.5 2.5 12"/><path d="m19 6.5-2.5 12"/><path d="M7.5 18.5c2.5 1.4 6.5 1.4 9 0"/>',
  "first-aid": '<path d="M9 4h6v5h5v6h-5v5H9v-5H4V9h5Z" fill="currentColor" stroke="none"/>',
  "registration-mark": '<path d="M12 3v18"/><path d="M3 12h18"/>',
  boundary: '<path d="M5 12h14"/><path d="M5 9h14"/><path d="M5 15h14"/>',
  whiteout: '<rect x="5" y="6" width="14" height="12"/><path d="M8 9h8"/><path d="M8 12h8"/><path d="M8 15h8"/>',
  text: '<path d="M5 5h14"/><path d="M12 5v14"/><path d="M9 19h6"/>',
  line: '<path d="M5 18 19 6"/>',
  cut: '<path d="M5 18 19 6"/><path d="m8 6 8 12"/><circle cx="8" cy="6" r="1.5"/><circle cx="16" cy="18" r="1.5"/>',
  measure: '<path d="M4 18 9 9l5 5 6-9"/><circle cx="4" cy="18" r="1.5"/><circle cx="9" cy="9" r="1.5"/><circle cx="14" cy="14" r="1.5"/><circle cx="20" cy="5" r="1.5"/>',
  rectangle: '<rect x="5" y="6" width="14" height="12"/>',
  ellipse: '<ellipse cx="12" cy="12" rx="8" ry="5.5"/>',
  descriptions: '<rect x="4.5" y="5" width="15" height="14" rx="1"/><path d="M4.5 9h15"/><path d="M4.5 13h15"/><path d="M8.25 5v14"/><path d="M12 5v14"/><path d="M15.75 5v14"/>',
  "print-area": '<rect x="5" y="4" width="14" height="16" rx="1.5"/><path d="M8 8h8"/><path d="M8 16h8"/><path d="M8 4v3"/><path d="M16 17v3"/>',
  fit: '<path d="M8 4H4v4"/><path d="M16 4h4v4"/><path d="M8 20H4v-4"/><path d="M16 20h4v-4"/><path d="M4 4l5 5"/><path d="m20 4-5 5"/><path d="m4 20 5-5"/><path d="m20 20-5-5"/>'
};

export function iconSvg(name) {
  const content = ICONS[name] || ICONS.control;
  return `<svg class="tool-icon" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${content}</svg>`;
}
