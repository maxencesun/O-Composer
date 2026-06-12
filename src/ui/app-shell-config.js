export const PAPER_SIZES = Object.freeze([
  { id: "letter", label: "Letter (8.5 x 11 in)", width: 850, height: 1100 },
  { id: "legal", label: "Legal (8.5 x 14 in)", width: 850, height: 1400 },
  { id: "tabloid", label: "Tabloid (11 x 17 in)", width: 1100, height: 1700 },
  { id: "a5", label: "A5 (148 x 210 mm)", width: 583, height: 827 },
  { id: "a4", label: "A4 (210 x 297 mm)", width: 827, height: 1169 },
  { id: "a3", label: "A3 (297 x 420 mm)", width: 1169, height: 1654 },
  { id: "a2", label: "A2 (420 x 594 mm)", width: 1654, height: 2339 }
]);

export const PAPER_MARGINS = Object.freeze([
  { id: "0", label: "None", value: 0 },
  { id: "3mm", label: "3 mm", value: 11.811 },
  { id: "5mm", label: "5 mm", value: 19.685 },
  { id: "10mm", label: "10 mm", value: 39.37 },
  { id: "15mm", label: "15 mm", value: 59.055 }
]);

export const PDF_COURSE_SCOPES = Object.freeze({
  CURRENT: "current",
  ALL_CONTROLS: "all-controls",
  ALL_COURSES: "all-courses",
  COURSE_PREFIX: "course:"
});

export const PDF_OUTPUT_MODES = Object.freeze({
  VECTOR: "vector"
});

export const PDF_EXPORT_SETTINGS_KEY = "purplePenPdfExportSettings";
export const PDF_EXPORT_STEPS_PER_TARGET = 8;
export const PDF_EXPORT_DONE_HOLD_MS = 650;

export const MAP_SCALES = Object.freeze([4000, 5000, 7500, 10000, 15000]);
export const APP_VERSION = "0.0.0";
export const APP_RESOURCE_CACHE_PREFIX = "o-composer-resources-";
export const APP_RESOURCE_CACHE_NAME = `${APP_RESOURCE_CACHE_PREFIX}${APP_VERSION}`;
export const APP_RESOURCE_URLS = Object.freeze([
  "./assets/purple-pen-symbols.xml",
  "./assets/fonts/Roboto.ttf",
  "./assets/fonts/Roboto-Bold.ttf",
  "./assets/fonts/Roboto-Italic.ttf",
  "./assets/fonts/RobotoCondensed.ttf",
  "./assets/fonts/RobotoCondensed-Bold.ttf",
  "./assets/fonts/Heiti.ttf"
]);
export const LANGUAGE_REFRESH_PARAM = "__pp_language_refresh";
export const UI_MODE_KEY = "purplePenUiMode";
export const UI_MODES = Object.freeze({ AUTO: "auto", DESKTOP: "desktop", MOBILE: "mobile" });
export const COURSE_NAMES = Object.freeze(["Course 1", "Course 2", "Course 3", "Long", "Middle", "Sprint", "Score", "Training"]);
export const TEXT_PRESETS = Object.freeze(["Text", "Water", "First Aid", "Registration", "Start", "Finish", "Danger", "Out of Bounds"]);
export const COURSE_LABEL_KINDS = Object.freeze([
  "sequence",
  "code",
  "sequence-and-code",
  "sequence-and-code-slash",
  "sequence-and-score",
  "code-and-score-brackets",
  "code-and-score-dash",
  "code-and-score",
  "score"
]);
export const MOVE_DISTANCE_CHOICES = Object.freeze([1, 2, 5, 10, 25, 50, 100]);
export const DEFAULT_TEXT_FONT_HEIGHT = 3;
export const CONTROL_SNAP_SCREEN_RADIUS = 10;
export const FONT_CHOICES = Object.freeze([
  "Arial",
  "Arial Narrow",
  "Helvetica",
  "Segoe UI",
  "Source Sans Pro",
  "Calibri",
  "Candara",
  "Verdana",
  "Tahoma",
  "Trebuchet MS",
  "Gill Sans",
  "Avenir",
  "Futura",
  "Optima",
  "Noto Sans",
  "PingFang SC",
  "PingFang TC",
  "PingFang HK",
  "Microsoft YaHei",
  "Microsoft JhengHei",
  "Microsoft YaHei UI",
  "SimHei",
  "SimSun",
  "NSimSun",
  "KaiTi",
  "FangSong",
  "Heiti SC",
  "Heiti TC",
  "Hiragino Sans GB",
  "Hiragino Sans CNS",
  "Songti SC",
  "Songti TC",
  "Kaiti SC",
  "Kaiti TC",
  "STHeiti",
  "STSong",
  "STKaiti",
  "STFangsong",
  "Source Han Sans SC",
  "Source Han Sans TC",
  "Source Han Serif SC",
  "Source Han Serif TC",
  "Noto Sans CJK SC",
  "Noto Sans CJK TC",
  "Noto Serif CJK SC",
  "Noto Serif CJK TC",
  "WenQuanYi Micro Hei",
  "WenQuanYi Zen Hei",
  "PMingLiU",
  "MingLiU",
  "LiSong Pro",
  "LiHei Pro",
  "Noto Serif",
  "Times New Roman",
  "Georgia",
  "Garamond",
  "Palatino",
  "Baskerville",
  "Courier New",
  "Consolas",
  "Menlo",
  "Monaco",
  "Noto Sans Mono"
]);
export const SPECIAL_COLOR_CHOICES = Object.freeze([
  ["upper-purple", "#a626ff", "Upper purple"],
  ["lower-purple", "rgba(166, 38, 255, 0.46)", "Lower purple"],
  ["#000000", "#000000", "Black"],
  ["#404040", "#404040", "Dark gray"],
  ["#808080", "#808080", "Gray"],
  ["#c0c0c0", "#c0c0c0", "Light gray"],
  ["#ffffff", "#ffffff", "White"],
  ["#7f1d1d", "#7f1d1d", "Dark red"],
  ["#d73535", "#d73535", "Red"],
  ["#f97316", "#f97316", "Orange"],
  ["#f59e0b", "#f59e0b", "Amber"],
  ["#facc15", "#facc15", "Yellow"],
  ["#854d0e", "#854d0e", "Brown"],
  ["#365314", "#365314", "Dark green"],
  ["#2f855a", "#2f855a", "Green"],
  ["#22c55e", "#22c55e", "Bright green"],
  ["#14b8a6", "#14b8a6", "Teal"],
  ["#06b6d4", "#06b6d4", "Cyan"],
  ["#0f3d70", "#0f3d70", "Dark blue"],
  ["#2477c9", "#2477c9", "Blue"],
  ["#60a5fa", "#60a5fa", "Light blue"],
  ["#3730a3", "#3730a3", "Indigo"],
  ["#7e22ce", "#7e22ce", "Violet"],
  ["#a626ff", "#a626ff", "Purple"],
  ["#c026d3", "#c026d3", "Magenta"],
  ["#db2777", "#db2777", "Pink"]
]);
export const LEGACY_COLOR_ALIASES = Object.freeze({
  black: "#000000",
  white: "#ffffff",
  red: "#d73535",
  blue: "#2477c9",
  green: "#2f855a"
});

