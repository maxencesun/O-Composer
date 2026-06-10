const OMAP_UNIT = 1000;
const DEFAULT_OMAP_SCALE = 15000;

export function parseOmap(xmlText, fileName = "map.omap", options = {}) {
  const text = String(xmlText || "");
  if (text.startsWith("PK")) {
    throw new Error("This looks like a compressed archive. Save or export the map as an uncompressed OpenOrienteering Mapper .omap/.xmap XML file, then import it again.");
  }
  if (!text.trim().startsWith("<")) {
    throw new Error("The selected file is not an OpenOrienteering Mapper XML map.");
  }

  const document = new DOMParser().parseFromString(text, "application/xml");
  const parseError = document.getElementsByTagName("parsererror")[0];
  if (parseError) {
    throw new Error(`Could not parse OMAP XML: ${parseError.textContent.trim().split("\n")[0]}`);
  }

  const root = document.documentElement;
  if (!root || localName(root) !== "map") {
    throw new Error("The selected file is not an OpenOrienteering Mapper map.");
  }

  const georeferencing = firstDescendant(root, "georeferencing");
  const mapScale = positiveScale(scaleAttr(georeferencing, "scale", null));
  const fallbackScale = positiveScale(options?.fallbackScale) || DEFAULT_OMAP_SCALE;
  const unitScale = omapUnitScale(mapScale || fallbackScale);
  const colors = parseColors(root);
  const symbols = parseSymbols(root, colors, unitScale);
  const objects = parseObjects(root, symbols, unitScale);
  const bounds = computeBounds(objects, symbols);

  return {
    kind: "omap",
    name: fileName,
    version: root.getAttribute("version") || "",
    scale: mapScale,
    unitScale,
    colors,
    symbols,
    objects,
    bounds,
    objectCount: objects.length,
    symbolCount: Object.keys(symbols).length
  };
}

function parseColors(root) {
  const colors = {};
  byTag(root, "color").forEach((element, index) => {
    const id = stringAttr(element, "priority", String(index));
    const opacity = numberAttr(element, "opacity", 1);
    const rgb = firstChild(element, "rgb");
    const name = stringAttr(element, "name", `Color ${id}`);
    let r = numberAttr(rgb, "r", null);
    let g = numberAttr(rgb, "g", null);
    let b = numberAttr(rgb, "b", null);
    const rgbMethod = stringAttr(rgb, "method", "");
    const c = numberAttr(element, "c", 0);
    const m = numberAttr(element, "m", 0);
    const y = numberAttr(element, "y", 0);
    const k = numberAttr(element, "k", 0);
    const cmykR = (1 - c) * (1 - k);
    const cmykG = (1 - m) * (1 - k);
    const cmykB = (1 - y) * (1 - k);
    const hasRgb = r !== null && g !== null && b !== null;
    const rgbIsBlack = hasRgb
      && Math.abs(r) < 1e-9
      && Math.abs(g) < 1e-9
      && Math.abs(b) < 1e-9;
    const cmykIsColored = cmykR > 1e-6 || cmykG > 1e-6 || cmykB > 1e-6;
    const rgbIsBlackPlaceholder = rgbIsBlack
      && cmykIsColored
      && (
        rgbMethod === "custom"
        || stringAttr(firstChild(element, "cmyk"), "method", "") === "custom"
        || /yellow|黄/i.test(name)
      );

    // Some OpenOrienteering Mapper files contain custom spot/CMYK colours where
    // <rgb method="custom" r="0" g="0" b="0"/> is only a stale/placeholder RGB
    // cache.  Symbol 9929 in the Shahe map uses such a colour for its yellow
    // base line.  Prefer the real CMYK values in that case, but keep genuine
    // RGB black when the CMYK components also describe black.
    if (!hasRgb || rgbIsBlackPlaceholder) {
      r = cmykR;
      g = cmykG;
      b = cmykB;
    }

    colors[id] = {
      id,
      name,
      priority: Number(id),
      css: rgba(r, g, b, opacity)
    };
  });
  return colors;
}

function parseSymbols(root, colors, unitScale) {
  const symbols = {};
  for (const element of byTag(root, "symbol")) {
    const id = element.getAttribute("id");
    if (id === null) continue;
    symbols[id] = parseSymbol(element, colors, 0, unitScale);
  }
  resolveCombinedSymbolPriorities(symbols);
  return symbols;
}

function parseSymbol(element, colors, depth = 0, unitScale = 1 / OMAP_UNIT) {
  if (!element) {
    return null;
  }

  const symbol = {
    id: element.getAttribute("id"),
    type: stringAttr(element, "type", ""),
    code: stringAttr(element, "code", ""),
    name: stringAttr(element, "name", ""),
    hidden: element.getAttribute("is_hidden") === "true",
    line: null,
    area: null,
    point: null,
    text: null,
    combined: null
  };

  const line = firstChild(element, "line_symbol");
  const area = firstChild(element, "area_symbol");
  const point = firstChild(element, "point_symbol");
  const text = firstChild(element, "text_symbol");
  const combined = firstChild(element, "combined_symbol");

  if (line) {
    symbol.kind = "line";
    symbol.line = parseLineSymbol(line, colors, unitScale);
  }
  else if (area) {
    symbol.kind = "area";
    symbol.area = parseAreaSymbol(area, colors, depth, unitScale);
  }
  else if (point) {
    symbol.kind = "point";
    symbol.point = parsePointSymbol(point, colors, depth, unitScale);
  }
  else if (text) {
    symbol.kind = "text";
    symbol.text = parseTextSymbol(text, colors, unitScale);
  }
  else if (combined) {
    symbol.kind = "combined";
    symbol.combined = parseCombinedSymbol(combined, colors, depth, unitScale);
  }
  else {
    symbol.kind = "unknown";
  }

  return symbol;
}

function parseCombinedSymbol(element, colors, depth, unitScale) {
  const parts = children(element, "part")
    .map(part => {
      const symbolId = part.getAttribute("symbol");
      if (symbolId !== null) {
        return { symbolId, symbol: null };
      }
      const inlineSymbol = depth < 5 ? parseSymbol(firstChild(part, "symbol"), colors, depth + 1, unitScale) : null;
      return inlineSymbol ? { symbolId: null, symbol: inlineSymbol } : null;
    })
    .filter(Boolean);
  return {
    parts,
    priorities: uniquePriorities(parts.flatMap(part => symbolPriorities(part.symbol)))
  };
}

function resolveCombinedSymbolPriorities(symbols) {
  for (const symbol of Object.values(symbols || {})) {
    if (!symbol?.combined) continue;
    symbol.combined.priorities = uniquePriorities(
      (symbol.combined.parts || []).flatMap(part => {
        const partSymbol = part.symbol || symbols[part.symbolId];
        return symbolPriorities(partSymbol);
      })
    );
  }
}

function parseLineSymbol(element, colors, unitScale) {
  const colorId = stringAttr(element, "color", "-1");
  const midSymbol = parseWrappedSymbol(firstChild(element, "mid_symbol"), colors, unitScale);
  const startSymbol = parseWrappedSymbol(firstChild(element, "start_symbol"), colors, unitScale);
  const endSymbol = parseWrappedSymbol(firstChild(element, "end_symbol"), colors, unitScale);
  const dashSymbol = parseWrappedSymbol(firstChild(element, "dash_symbol"), colors, unitScale);
  const borders = parseLineBorders(element, colors, unitScale);
  const dashed = element.getAttribute("dashed") === "true";
  const rawDashLength = unitAttr(element, "dash_length", 2000, unitScale);
  const inGroupBreakLength = unitAttr(element, "in_group_break_length", 0, unitScale);
  const dashesInGroup = Math.max(1, Math.floor(numberAttr(element, "dashes_in_group", 1) || 1));
  const groupedDashLength = dashesInGroup >= 2
    ? rawDashLength * dashesInGroup + inGroupBreakLength * (dashesInGroup - 1)
    : rawDashLength;
  const halfOuterDashes = element.getAttribute("half_outer_dashes") === "true";
  const dashLength = Math.max(0, groupedDashLength);
  const dashInfo = {
    spacingMethod: "openmapper-dashes",
    dashLength,
    rawDashLength,
    singleDashLength: rawDashLength,
    dashesInGroup,
    inGroupBreakLength,
    halfOuterDashes,
    firstDashLength: halfOuterDashes ? dashLength / 2 : dashLength,
    lastDashLength: halfOuterDashes ? dashLength / 2 : dashLength,
    gapLength: unitAttr(element, "break_length", 800, unitScale),
    halfEndDashLengthWhenClosed: !halfOuterDashes && dashesInGroup !== 2,
    secondaryMiddleGaps: dashesInGroup >= 2 ? dashesInGroup - 1 : 0,
    secondaryEndGaps: dashesInGroup >= 2 ? dashesInGroup - 1 : 0,
    secondaryMiddleLength: inGroupBreakLength,
    secondaryEndLength: inGroupBreakLength,
    minGaps: 0
  };
  return {
    colorId,
    color: colorFor(colors, colorId, "#222"),
    width: unitAttr(element, "line_width", 180, unitScale),
    minimumLength: unitAttr(element, "minimum_length", 0, unitScale),
    dashed,
    dashLength,
    rawDashLength,
    breakLength: dashInfo.gapLength,
    inGroupBreakLength,
    dashesInGroup,
    halfOuterDashes,
    dashInfo,
    segmentLength: unitAttr(element, "segment_length", 4000, unitScale),
    endLength: unitAttr(element, "end_length", 0, unitScale),
    showAtLeastOneSymbol: element.getAttribute("show_at_least_one_symbol") === "true",
    minimumMidSymbolCount: Math.max(0, Math.floor(numberAttr(element, "minimum_mid_symbol_count", 0) || 0)),
    minimumMidSymbolCountWhenClosed: Math.max(0, Math.floor(numberAttr(element, "minimum_mid_symbol_count_when_closed", 0) || 0)),
    midSymbolsPerSpot: Math.max(1, Math.floor(numberAttr(element, "mid_symbols_per_spot", 1) || 1)),
    midSymbolDistance: unitAttr(element, "mid_symbol_distance", 0, unitScale),
    midSymbolPlacement: stringAttr(element, "mid_symbol_placement", "0"),
    suppressDashSymbolAtEnds: element.getAttribute("suppress_dash_symbol_at_ends") === "true",
    scaleDashSymbol: element.getAttribute("scale_dash_symbol") !== "false",
    dashSymbolLocation: dashed || borders.some(border => border.dashed) ? "dash-points" : "corners",
    startOffset: unitAttr(element, "start_offset", 0, unitScale),
    endOffset: unitAttr(element, "end_offset", 0, unitScale),
    pointedCapLength: unitAttr(element, "pointed_cap_length", 0, unitScale),
    midSymbol,
    startSymbol,
    endSymbol,
    dashSymbol,
    borders,
    capStyle: stringAttr(element, "cap_style", "0"),
    joinStyle: stringAttr(element, "join_style", "1"),
    priority: colorPriority(colors, colorId),
    priorities: uniquePriorities([colorPriority(colors, colorId), ...borders.map(border => border.priority), ...symbolPriorities(midSymbol), ...symbolPriorities(startSymbol), ...symbolPriorities(endSymbol), ...symbolPriorities(dashSymbol)])
  };
}

function parseLineBorders(element, colors, unitScale) {
  const bordersElement = firstChild(element, "borders");
  const borders = children(bordersElement, "border").map(border => parseLineBorder(border, colors, unitScale)).filter(Boolean);
  if (borders.length === 1) {
    return [
      { ...borders[0], side: "left" },
      { ...borders[0], side: "right" }
    ];
  }
  if (borders.length >= 2) {
    return [
      { ...borders[0], side: "left" },
      { ...borders[1], side: "right" }
    ];
  }
  return [];
}

function parseLineBorder(element, colors, unitScale) {
  const colorId = stringAttr(element, "color", "-1");
  const width = unitAttr(element, "width", 0, unitScale);
  const color = colorFor(colors, colorId, null);
  if (!color || width <= 0) {
    return null;
  }
  const dashLength = unitAttr(element, "dash_length", 2000, unitScale);
  const breakLength = unitAttr(element, "break_length", 1000, unitScale);
  return {
    colorId,
    color,
    width,
    shift: unitAttr(element, "shift", 0, unitScale),
    dashed: element.getAttribute("dashed") === "true",
    dashLength,
    breakLength,
    dashInfo: {
      spacingMethod: "openmapper-dashes",
      dashLength,
      rawDashLength: dashLength,
      singleDashLength: dashLength,
      dashesInGroup: 1,
      inGroupBreakLength: 0,
      halfOuterDashes: false,
      firstDashLength: dashLength,
      lastDashLength: dashLength,
      gapLength: breakLength,
      halfEndDashLengthWhenClosed: true,
      secondaryMiddleGaps: 0,
      secondaryEndGaps: 0,
      secondaryMiddleLength: 0,
      secondaryEndLength: 0,
      minGaps: 0
    },
    priority: colorPriority(colors, colorId)
  };
}

function parseAreaSymbol(element, colors, depth, unitScale) {
  const innerColorId = stringAttr(element, "inner_color", "-1");
  const patterns = children(element, "pattern").map(pattern => parsePattern(pattern, colors, depth, unitScale));
  const priorities = uniquePriorities([colorPriority(colors, innerColorId), ...patterns.flatMap(pattern => pattern.priorities)]);
  return {
    innerColorId,
    innerColor: colorFor(colors, innerColorId, null),
    innerPriority: colorPriority(colors, innerColorId),
    minArea: unitAttr(element, "min_area", 0, unitScale * unitScale),
    patterns,
    priority: firstPriority(priorities),
    priorities
  };
}

function parsePattern(element, colors, depth, unitScale) {
  const colorId = stringAttr(element, "color", "-1");
  const nestedSymbol = depth < 5 ? parseSymbol(firstChild(element, "symbol"), colors, depth + 1, unitScale) : null;
  const priorities = uniquePriorities([colorPriority(colors, colorId), ...symbolPriorities(nestedSymbol)]);
  return {
    type: stringAttr(element, "type", "1"),
    angle: numberAttr(element, "angle", 0),
    rotatable: element.getAttribute("rotatable") === "true",
    lineSpacing: unitAttr(element, "line_spacing", 1000, unitScale),
    lineOffset: unitAttr(element, "line_offset", 0, unitScale),
    pointDistance: unitAttr(element, "point_distance", 1000, unitScale),
    offsetAlongLine: unitAttr(element, "offset_along_line", 0, unitScale),
    colorId,
    color: colorFor(colors, colorId, "#777"),
    lineWidth: unitAttr(element, "line_width", 160, unitScale),
    symbol: nestedSymbol,
    priority: firstPriority(priorities),
    priorities
  };
}

function parsePointSymbol(element, colors, depth, unitScale) {
  const innerColorId = stringAttr(element, "inner_color", "-1");
  const outerColorId = stringAttr(element, "outer_color", "-1");
  const elements = depth < 5 ? children(element, "element").map(child => parsePointElement(child, colors, depth + 1, unitScale)).filter(Boolean) : [];
  return {
    innerRadius: unitAttr(element, "inner_radius", 700, unitScale),
    rotatable: element.getAttribute("rotatable") === "true",
    innerColorId,
    innerColor: colorFor(colors, innerColorId, null),
    innerPriority: colorPriority(colors, innerColorId),
    outerWidth: unitAttr(element, "outer_width", 0, unitScale),
    outerColorId,
    outerColor: colorFor(colors, outerColorId, null),
    outerPriority: colorPriority(colors, outerColorId),
    elements,
    priority: Math.min(colorPriority(colors, innerColorId), colorPriority(colors, outerColorId), ...elements.flatMap(element => symbolPriorities(element.symbol))),
    priorities: uniquePriorities([colorPriority(colors, innerColorId), colorPriority(colors, outerColorId), ...elements.flatMap(element => symbolPriorities(element.symbol))])
  };
}

function parsePointElement(element, colors, depth, unitScale) {
  const symbol = parseSymbol(firstChild(element, "symbol"), colors, depth, unitScale);
  const object = parseObject(firstChild(element, "object"), -1, null, unitScale);
  if (!symbol || !object) {
    return null;
  }
  return { symbol, object };
}

function parseTextSymbol(element, colors, unitScale) {
  const font = firstChild(element, "font");
  const text = firstChild(element, "text");
  const colorId = stringAttr(text, "color", "-1");
  return {
    family: stringAttr(font, "family", "Arial"),
    size: unitAttr(font, "size", 3500, unitScale),
    colorId,
    color: colorFor(colors, colorId, "#222"),
    lineSpacing: numberAttr(text, "line_spacing", 1.15),
    priority: colorPriority(colors, colorId)
  };
}

function parseWrappedSymbol(element, colors, unitScale) {
  return parseSymbol(firstChild(element, "symbol"), colors, 1, unitScale);
}

function symbolPriorities(symbol) {
  if (!symbol) return [];
  if (symbol.line) return symbol.line.priorities || [symbol.line.priority];
  if (symbol.area) return symbol.area.priorities || [symbol.area.priority];
  if (symbol.point) return symbol.point.priorities || [symbol.point.priority];
  if (symbol.text) return [symbol.text.priority];
  if (symbol.combined) return symbol.combined.priorities || [];
  return [];
}

function uniquePriorities(values) {
  return [...new Set(values.filter(value => Number.isFinite(value) && value < 99))].sort((a, b) => b - a);
}

function firstPriority(values) {
  return values.length ? Math.min(...values) : 99;
}

function parseObjects(root, symbols, unitScale) {
  const objects = [];
  let index = 0;
  for (const part of byTag(root, "part")) {
    for (const container of children(part, "objects")) {
      for (const objectElement of children(container, "object")) {
        const object = parseObject(objectElement, index, symbols, unitScale);
        if (object) {
          objects.push(object);
          index += 1;
        }
      }
    }
  }
  return objects;
}

function parseObject(element, index, symbols, unitScale = 1 / OMAP_UNIT) {
  if (!element) {
    return null;
  }
  const coords = parseCoords(textOf(firstChild(element, "coords")), unitScale);
  const size = parseSize(element, coords, unitScale);
  const object = {
    type: stringAttr(element, "type", "1"),
    symbolId: element.getAttribute("symbol"),
    rotation: numberAttr(element, "rotation", 0),
    pattern: parseObjectPattern(firstChild(element, "pattern"), unitScale),
    hAlign: stringAttr(element, "h_align", "0"),
    vAlign: stringAttr(element, "v_align", "0"),
    coords,
    text: textOf(firstChild(element, "text")),
    size,
    index
  };
  object.bounds = computeObjectBounds(object, symbols?.[object.symbolId] || null, symbols || {});
  return object;
}

function parseObjectPattern(element, unitScale = 1 / OMAP_UNIT) {
  if (!element) {
    return { rotation: 0, origin: { x: 0, y: 0 } };
  }
  const coord = firstChild(element, "coord");
  return {
    rotation: numberAttr(element, "rotation", 0),
    origin: {
      x: numberAttr(coord, "x", 0) * unitScale,
      y: -numberAttr(coord, "y", 0) * unitScale
    }
  };
}

function parseCoords(text, unitScale = 1 / OMAP_UNIT) {
  return String(text || "")
    .split(";")
    .map(part => part.trim())
    .filter(Boolean)
    .map(part => {
      const values = part.split(/\s+/).map(Number).filter(Number.isFinite);
      return {
        x: (values[0] || 0) * unitScale,
        y: -(values[1] || 0) * unitScale,
        flags: values[2] || 0
      };
    });
}

function parseSize(element, coords, unitScale = 1 / OMAP_UNIT) {
  const size = firstChild(element, "size");
  if (size) {
    return {
      width: unitAttr(size, "width", 0, unitScale),
      height: unitAttr(size, "height", 0, unitScale)
    };
  }
  if (stringAttr(element, "type", "") === "4" && coords.length > 1) {
    return {
      width: Math.abs(coords[1].x),
      height: Math.abs(coords[1].y)
    };
  }
  return null;
}

function computeBounds(objects, symbols) {
  const bounds = emptyBounds();
  for (const object of objects) {
    if (object.bounds) {
      addBounds(bounds, object.bounds);
    }
  }
  if (!bounds.valid) {
    return { left: -100, right: 100, top: 100, bottom: -100, width: 200, height: 200 };
  }
  return finishBounds(bounds);
}

function computeObjectBounds(object, symbol, symbols) {
  const bounds = emptyBounds();
  if (object.type === "4") {
    addTextBounds(bounds, object, symbol);
  }
  else if (object.type === "0") {
    const point = object.coords[0];
    if (point) {
      const radius = Math.max(1.5, symbolRadius(symbol, symbols));
      addPoint(bounds, { x: point.x - radius, y: point.y - radius });
      addPoint(bounds, { x: point.x + radius, y: point.y + radius });
    }
  }
  else {
    for (const point of object.coords) {
      addPoint(bounds, point);
    }
    if (bounds.valid) {
      expandBounds(bounds, Math.max(0.25, symbolRadius(symbol, symbols)));
    }
  }
  return bounds.valid ? finishBounds(bounds) : null;
}

function addTextBounds(bounds, object, symbol) {
  const anchor = object.coords[0];
  if (!anchor) return;
  const textStyle = symbol?.text || null;
  const size = object.size || estimateTextSize(object.text, textStyle);
  const halfWidth = Math.max(1, size.width) / 2;
  const halfHeight = Math.max(1, size.height) / 2;
  addPoint(bounds, { x: anchor.x - halfWidth, y: anchor.y - halfHeight });
  addPoint(bounds, { x: anchor.x + halfWidth, y: anchor.y + halfHeight });
}

function estimateTextSize(value, style) {
  const lines = String(value || "").split(/\r?\n/);
  const size = style?.size || 3.5;
  return {
    width: Math.max(1, ...lines.map(line => line.length)) * size * 0.58,
    height: Math.max(1, lines.length) * size * (style?.lineSpacing || 1.15)
  };
}

function symbolRadius(symbol, symbols, depth = 0) {
  if (!symbol || depth > 5) return 1.5;
  if (symbol.kind === "point" && symbol.point) {
    let radius = symbol.point.innerRadius + symbol.point.outerWidth;
    for (const element of symbol.point.elements || []) {
      for (const point of element.object.coords || []) {
        radius = Math.max(radius, Math.hypot(point.x, point.y) + symbolRadius(element.symbol, symbols, depth + 1));
      }
    }
    return radius;
  }
  if (symbol.kind === "line" && symbol.line) {
    const borderRadius = Math.max(0, ...(symbol.line.borders || []).map(border => symbol.line.width / 2 + Math.abs(border.shift) + border.width));
    return Math.max(
      symbol.line.width / 2,
      borderRadius,
      optionalSymbolRadius(symbol.line.midSymbol, symbols, depth + 1),
      optionalSymbolRadius(symbol.line.startSymbol, symbols, depth + 1),
      optionalSymbolRadius(symbol.line.endSymbol, symbols, depth + 1)
    );
  }
  if (symbol.kind === "combined") {
    return Math.max(1.5, ...(symbol.combined?.parts || []).map(part => {
      const partSymbol = typeof part === "string" ? symbols[part] : part.symbol || symbols[part.symbolId];
      return symbolRadius(partSymbol, symbols, depth + 1);
    }));
  }
  return 1.5;
}

function optionalSymbolRadius(symbol, symbols, depth) {
  return symbol ? symbolRadius(symbol, symbols, depth) : 0;
}

function emptyBounds() {
  return {
    left: Infinity,
    right: -Infinity,
    top: -Infinity,
    bottom: Infinity,
    valid: false
  };
}

function addPoint(bounds, point) {
  bounds.left = Math.min(bounds.left, point.x);
  bounds.right = Math.max(bounds.right, point.x);
  bounds.top = Math.max(bounds.top, point.y);
  bounds.bottom = Math.min(bounds.bottom, point.y);
  bounds.valid = true;
}

function addBounds(target, source) {
  addPoint(target, { x: source.left, y: source.bottom });
  addPoint(target, { x: source.right, y: source.top });
}

function expandBounds(bounds, padding) {
  bounds.left -= padding;
  bounds.right += padding;
  bounds.top += padding;
  bounds.bottom -= padding;
}

function finishBounds(bounds) {
  return {
    left: bounds.left,
    right: bounds.right,
    top: bounds.top,
    bottom: bounds.bottom,
    width: Math.max(1, bounds.right - bounds.left),
    height: Math.max(1, bounds.top - bounds.bottom)
  };
}

function byTag(element, name) {
  return Array.from(element.getElementsByTagNameNS("*", name));
}

function children(element, name) {
  if (!element) return [];
  return Array.from(element.children).filter(child => localName(child) === name);
}

function firstChild(element, name) {
  return children(element, name)[0] || null;
}

function firstDescendant(element, name) {
  return byTag(element, name)[0] || null;
}

function localName(element) {
  return element.localName || element.nodeName.split(":").pop();
}

function textOf(element) {
  return element?.textContent || "";
}

function stringAttr(element, name, fallback = "") {
  return element?.getAttribute(name) ?? fallback;
}

function numberAttr(element, name, fallback = 0) {
  if (!element) return fallback;
  const value = Number(element.getAttribute(name));
  return Number.isFinite(value) ? value : fallback;
}

function unitAttr(element, name, fallback = 0, unitScale = 1 / OMAP_UNIT) {
  return numberAttr(element, name, fallback) * unitScale;
}

function omapUnitScale(mapScale) {
  // OMAP stores coordinates and symbol dimensions as 1/1000 mm on the printed map.
  // The rest of this app stores map geometry in real-world metres. Convert:
  //   raw / 1000 printed-mm * mapScale / 1000 metres-per-printed-mm.
  const scale = positiveScale(mapScale) || DEFAULT_OMAP_SCALE;
  return scale / (OMAP_UNIT * 1000);
}

function scaleAttr(element, name, fallback = null) {
  if (!element) return fallback;
  const raw = element.getAttribute(name);
  if (raw === null || raw === undefined || raw === "") return fallback;
  const direct = Number(raw);
  if (Number.isFinite(direct) && direct > 0) return direct;
  const match = String(raw).match(/(?:1\s*:\s*)?([0-9]+(?:\.[0-9]+)?)/);
  return match ? Number(match[1]) : fallback;
}

function positiveScale(value) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : null;
}

function colorFor(colors, id, fallback) {
  if (id === "-1" || id === null || id === undefined) {
    return null;
  }
  return colors[id]?.css || fallback;
}

function colorPriority(colors, id) {
  if (id === "-1" || id === null || id === undefined) {
    return 99;
  }
  const value = colors[id]?.priority;
  return Number.isFinite(value) ? value : 50;
}

function rgba(r, g, b, opacity) {
  const red = clampColor(r);
  const green = clampColor(g);
  const blue = clampColor(b);
  const alpha = Math.max(0, Math.min(1, opacity));
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

function clampColor(value) {
  return Math.round(Math.max(0, Math.min(1, value)) * 255);
}
