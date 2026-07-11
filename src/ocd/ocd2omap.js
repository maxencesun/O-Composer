/*
 * Browser-only OCAD -> OpenOrienteering Mapper XML converter.
 *
 * This is an independent JavaScript port following the data flow used by
 * OpenOrienteering Mapper: OCAD binary -> normalized map model -> OMAP v9 XML.
 * No npm package, server, native executable or Node.js API is required.
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

const OMAP_NS = 'http://openorienteering.org/apps/mapper/xml/v2';

const OCAD_SYMBOL = Object.freeze({
  POINT: 1,
  LINE: 2,
  AREA: 3,
  TEXT: 4,
  RECTANGLE_V8: 5,
  LINE_TEXT: 6,
  RECTANGLE_V9: 7,
});

const OMAP_SYMBOL = Object.freeze({ POINT: 1, LINE: 2, AREA: 4, TEXT: 8, COMBINED: 16 });
const OMAP_OBJECT = Object.freeze({ POINT: 0, PATH: 1, TEXT: 4 });
const MAP_FLAG = Object.freeze({ CURVE_START: 1, CLOSE: 2, GAP: 4, HOLE: 16, DASH: 32 });

class OcadError extends Error {
  constructor(message, offset = null) {
    super(offset == null ? message : `${message} (offset 0x${offset.toString(16)})`);
    this.name = 'OcadError';
    this.offset = offset;
  }
}

class BinaryView {
  constructor(buffer) {
    if (!(buffer instanceof ArrayBuffer)) throw new TypeError('Expected an ArrayBuffer');
    this.buffer = buffer;
    this.view = new DataView(buffer);
    this.bytesView = new Uint8Array(buffer);
    this.length = buffer.byteLength;
  }

  ensure(offset, size, label = 'binary field') {
    if (!Number.isSafeInteger(offset) || !Number.isSafeInteger(size) || offset < 0 || size < 0 || offset + size > this.length) {
      throw new OcadError(`Out-of-range ${label}: need ${size} bytes`, offset);
    }
  }

  u8(o) { this.ensure(o, 1); return this.view.getUint8(o); }
  i8(o) { this.ensure(o, 1); return this.view.getInt8(o); }
  u16(o) { this.ensure(o, 2); return this.view.getUint16(o, true); }
  i16(o) { this.ensure(o, 2); return this.view.getInt16(o, true); }
  u32(o) { this.ensure(o, 4); return this.view.getUint32(o, true); }
  i32(o) { this.ensure(o, 4); return this.view.getInt32(o, true); }
  f64(o) { this.ensure(o, 8); return this.view.getFloat64(o, true); }

  bytes(offset, length) {
    this.ensure(offset, length, 'byte slice');
    return this.bytesView.subarray(offset, offset + length);
  }

  pascal8(offset, capacity, decoder) {
    this.ensure(offset, capacity + 1, 'Pascal string');
    const length = Math.min(this.u8(offset), capacity);
    return decodeBytes(this.bytes(offset + 1, length), decoder);
  }

  utf16Fixed(offset, units) {
    this.ensure(offset, units * 2, 'UTF-16 string');
    let endUnits = 0;
    while (endUnits < units && this.u16(offset + endUnits * 2) !== 0) endUnits++;
    return decodeBytes(this.bytes(offset, endUnits * 2), 'utf-16le');
  }
}

function decodeBytes(bytes, encoding = 'windows-1252') {
  if (!bytes || bytes.length === 0) return '';
  let end = bytes.length;
  if (/^utf-16/i.test(encoding)) {
    end -= end % 2;
    while (end >= 2 && bytes[end - 2] === 0 && bytes[end - 1] === 0) end -= 2;
  } else {
    while (end > 0 && bytes[end - 1] === 0) end--;
  }
  const sliced = bytes.subarray(0, end);
  try {
    return new TextDecoder(encoding, { fatal: false }).decode(sliced);
  } catch {
    return new TextDecoder('windows-1252', { fatal: false }).decode(sliced);
  }
}

function decodeUtf16NullTerminated(bytes) {
  let end = bytes.length - (bytes.length % 2);
  for (let i = 0; i + 1 < end; i += 2) {
    if (bytes[i] === 0 && bytes[i + 1] === 0) { end = i; break; }
  }
  return decodeBytes(bytes.subarray(0, end), 'utf-16le');
}

function parseParameterString(text) {
  const fields = text.split('\t');
  const value = fields.shift() ?? '';
  const params = new Map();
  for (const field of fields) {
    if (!field) continue;
    const key = field[0];
    const val = field.slice(1);
    if (!params.has(key)) params.set(key, []);
    params.get(key).push(val);
  }
  return {
    value,
    params,
    get(key, fallback = '') {
      const list = params.get(key);
      return list?.length ? list[list.length - 1] : fallback;
    },
    getAll(key) { return params.get(key) ?? []; },
  };
}

function numberValue(v, fallback = 0) {
  if (v == null || v === '') return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function clamp(v, lo, hi) { return Math.min(hi, Math.max(lo, v)); }
function lengthToMapper(v) { return Number(v) * 10; }
function angleToRadians(v) { return ((((Number(v) || 0) + 3600) % 3600) * 0.1 * Math.PI) / 180; }

function formatSymbolCode(raw, factor) {
  if (!Number.isFinite(raw)) return '';
  const sign = raw < 0 ? '-' : '';
  const n = Math.abs(Math.trunc(raw));
  const major = Math.floor(n / factor);
  const rest = n % factor;
  if (rest === 0) return `${sign}${major}`;
  return `${sign}${major}.${rest}`;
}

function cmykToRgb(c, m, y, k) {
  return {
    r: clamp(1 - Math.min(1, c * (1 - k) + k), 0, 1),
    g: clamp(1 - Math.min(1, m * (1 - k) + k), 0, 1),
    b: clamp(1 - Math.min(1, y * (1 - k) + k), 0, 1),
  };
}

function fixed(n, digits = 6) {
  if (!Number.isFinite(n)) return '0';
  const rounded = Number(n.toFixed(digits));
  return String(Object.is(rounded, -0) ? 0 : rounded);
}

function escapeXml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

function attrs(object) {
  const out = [];
  for (const [key, value] of Object.entries(object)) {
    if (value === undefined || value === null || value === false) continue;
    out.push(`${key}="${escapeXml(value === true ? 'true' : value)}"`);
  }
  return out.length ? ` ${out.join(' ')}` : '';
}

class XmlWriter {
  constructor(pretty = false) {
    this.pretty = pretty;
    this.depth = 0;
    this.parts = ['<?xml version="1.0" encoding="UTF-8"?>'];
  }
  line(text) {
    this.parts.push(`${this.pretty ? '\n' + '  '.repeat(this.depth) : ''}${text}`);
  }
  open(name, attributes = {}) { this.line(`<${name}${attrs(attributes)}>`); this.depth++; }
  close(name) { this.depth--; this.line(`</${name}>`); }
  empty(name, attributes = {}) { this.line(`<${name}${attrs(attributes)}/>`); }
  textElement(name, text, attributes = {}) {
    this.line(`<${name}${attrs(attributes)}>${escapeXml(text)}</${name}>`);
  }
  raw(text) { this.line(text); }
  toString() { return this.parts.join(''); }
}

function readHeader(bin) {
  bin.ensure(0, 8, 'OCAD header');
  const vendorMark = bin.u16(0);
  if (vendorMark !== 0x0cad) throw new OcadError(`Not an OCAD file: vendor mark is 0x${vendorMark.toString(16)}`, 0);
  const version = bin.u16(4);
  if (![6, 7, 8, 9, 10, 11, 12, 2018].includes(version)) {
    throw new OcadError(`Unsupported OCAD version ${version}`, 4);
  }
  const effectiveVersion = version === 2018 ? 12 : version;
  const header = {
    vendorMark,
    fileType: bin.u8(2),
    fileStatus: bin.u8(3),
    version,
    effectiveVersion,
    subversion: bin.u8(6),
    subsubversion: bin.u8(7),
    firstSymbolBlock: bin.u32(8),
    firstObjectBlock: bin.u32(12),
  };
  if (effectiveVersion <= 8) {
    header.setupPos = bin.u32(16);
    header.setupSize = bin.u32(20);
    header.infoPos = bin.u32(24);
    header.infoSize = bin.u32(28);
    header.firstStringBlock = bin.u32(32);
  } else {
    header.firstStringBlock = bin.u32(32);
    header.fileNamePos = bin.u32(36);
    header.fileNameSize = bin.u32(40);
  }
  return header;
}

function walkIndexBlocks(bin, firstBlock, entrySize, parseEntry, warnings, label) {
  const results = [];
  const seen = new Set();
  let blockPos = firstBlock;
  let blockCount = 0;
  while (blockPos !== 0) {
    if (seen.has(blockPos)) {
      warnings.push(`${label} index contains a cycle at 0x${blockPos.toString(16)}; stopped.`);
      break;
    }
    seen.add(blockPos);
    if (++blockCount > 65536) throw new OcadError(`${label} index has too many blocks`, blockPos);
    const blockSize = 4 + 256 * entrySize;
    try { bin.ensure(blockPos, blockSize, `${label} index block`); }
    catch (error) { warnings.push(error.message); break; }
    const next = bin.u32(blockPos);
    for (let i = 0; i < 256; i++) {
      const entryPos = blockPos + 4 + i * entrySize;
      try {
        const entry = parseEntry(entryPos, i, blockPos);
        if (entry) results.push(entry);
      } catch (error) {
        warnings.push(`${label} index entry ${i} at 0x${entryPos.toString(16)}: ${error.message}`);
      }
    }
    blockPos = next;
  }
  return results;
}

function readParameterStrings(bin, header, options, warnings) {
  if (!header.firstStringBlock) return [];
  const entries = walkIndexBlocks(bin, header.firstStringBlock, 16, (o) => {
    const pos = bin.u32(o);
    const size = bin.u32(o + 4);
    const type = bin.i32(o + 8);
    const objIndex = bin.u32(o + 12);
    if (!pos || !size) return null;
    if (pos + size > bin.length) throw new OcadError('Parameter string points outside file', pos);
    return { pos, size, type, objIndex };
  }, warnings, 'Parameter-string');

  const encoding = header.effectiveVersion >= 11 ? 'utf-8' : options.legacyEncoding;
  return entries.map((entry) => ({
    ...entry,
    text: decodeBytes(bin.bytes(entry.pos, entry.size), encoding).replace(/\0+$/g, ''),
  }));
}

function readV8Colors(bin, warnings) {
  const colors = [];
  const colorIdToIndex = new Map();
  const numColors = Math.min(256, bin.u16(48));
  const colorStart = 72;
  const colorSize = 72;
  for (let i = 0; i < numColors; i++) {
    const o = colorStart + i * colorSize;
    try {
      const number = bin.u16(o);
      const c = clamp(bin.u8(o + 4) * 0.005, 0, 1);
      const m = clamp(bin.u8(o + 5) * 0.005, 0, 1);
      const y = clamp(bin.u8(o + 6) * 0.005, 0, 1);
      const k = clamp(bin.u8(o + 7) * 0.005, 0, 1);
      const name = bin.pascal8(o + 8, 31, 'windows-1252') || `Color ${number}`;
      const color = { number, priority: colors.length, name, c, m, y, k, opacity: 1 };
      colorIdToIndex.set(number, colors.length);
      colors.push(color);
    } catch (error) {
      warnings.push(`Could not read OCAD 8 color ${i}: ${error.message}`);
    }
  }
  return { colors, colorIdToIndex };
}

function readModernColors(strings, warnings) {
  const colors = [];
  const colorIdToIndex = new Map();
  const colorStrings = strings.filter((item) => item.type === 9);
  for (const item of colorStrings) {
    const p = parseParameterString(item.text);
    const numberText = p.get('n', '');
    if (numberText === '') { warnings.push(`Skipped color without id: ${p.value}`); continue; }
    const number = Number.parseInt(numberText, 10);
    if (!Number.isFinite(number)) { warnings.push(`Skipped color with invalid id: ${numberText}`); continue; }
    const c = clamp(numberValue(p.get('c')) * 0.01, 0, 1);
    const m = clamp(numberValue(p.get('m')) * 0.01, 0, 1);
    const y = clamp(numberValue(p.get('y')) * 0.01, 0, 1);
    const k = clamp(numberValue(p.get('k')) * 0.01, 0, 1);
    const opacity = clamp(numberValue(p.get('t'), 100) * 0.01, 0, 1);
    const color = {
      number,
      priority: colors.length,
      name: p.value || `Color ${number}`,
      c, m, y, k,
      opacity,
      overprinting: numberValue(p.get('o'), 0) !== 0,
    };
    colorIdToIndex.set(number, colors.length);
    colors.push(color);
  }
  if (!colors.length) warnings.push('No OCAD color parameter strings were found; generated fallback colors may be used.');
  return { colors, colorIdToIndex };
}

function parseGeoreferencing(bin, header, strings, warnings) {
  const georef = { scale: 10000, projectedCrsId: 'Local coordinates' };
  if (header.effectiveVersion <= 8 && header.setupPos) {
    try {
      bin.ensure(header.setupPos, 56, 'OCAD setup');
      const scale = bin.f64(header.setupPos + 24);
      const x = bin.f64(header.setupPos + 32);
      const y = bin.f64(header.setupPos + 40);
      const angle = bin.f64(header.setupPos + 48);
      if (Number.isFinite(scale) && scale > 0) georef.scale = Math.round(scale);
      if (Number.isFinite(x) && Number.isFinite(y)) georef.projectedRef = { x, y };
      if (Number.isFinite(angle)) georef.grivation = angle;
    } catch (error) { warnings.push(`Could not read OCAD setup/georeferencing: ${error.message}`); }
    return georef;
  }

  const scaleString = strings.find((item) => item.type === 1039);
  if (scaleString) {
    const p = parseParameterString(scaleString.text);
    const scale = numberValue(p.get('m'), 0);
    if (scale > 0) georef.scale = Math.round(scale);
    const x = numberValue(p.get('x'), NaN);
    const y = numberValue(p.get('y'), NaN);
    const angle = numberValue(p.get('a'), NaN);
    if (Number.isFinite(x) && Number.isFinite(y)) georef.projectedRef = { x, y };
    if (Number.isFinite(angle)) georef.grivation = angle;
  }
  return georef;
}

function readBaseSymbol(bin, header, pos, options) {
  const version = header.effectiveVersion;
  if (version <= 8) {
    bin.ensure(pos, 348, 'OCAD 8 base symbol');
    return {
      baseSize: 348,
      recordSize: bin.u16(pos),
      rawNumber: bin.u16(pos + 2),
      factor: 10,
      type: bin.u16(pos + 4),
      flags: bin.u8(pos + 7),
      status: bin.u8(pos + 11),
      name: bin.pascal8(pos + 52, 31, options.legacyEncoding),
    };
  }
  if (version <= 10) {
    bin.ensure(pos, 572, 'OCAD 9/10 base symbol');
    return {
      baseSize: 572,
      recordSize: bin.u32(pos),
      rawNumber: bin.u32(pos + 4),
      factor: 1000,
      type: bin.u8(pos + 8),
      flags: bin.u8(pos + 9),
      status: bin.u8(pos + 11),
      name: bin.pascal8(pos + 56, 31, options.legacyEncoding),
    };
  }
  bin.ensure(pos, 796, 'OCAD 11/12 base symbol');
  return {
    baseSize: 796,
    recordSize: bin.u32(pos),
    rawNumber: bin.u32(pos + 4),
    factor: 1000,
    type: bin.u8(pos + 8),
    flags: bin.u8(pos + 9),
    status: bin.u8(pos + 11),
    name: bin.utf16Fixed(pos + 56, 64),
  };
}

function colorIndex(colorMap, id) {
  return colorMap.has(id) ? colorMap.get(id) : -1;
}

function parsePointElement(bin, offset, colorMap, version, warnings) {
  bin.ensure(offset, 16, 'point-symbol element');
  const type = bin.u16(offset);
  const flags = bin.u16(offset + 2);
  const color = bin.u16(offset + 4);
  const lineWidth = bin.i16(offset + 6);
  const diameter = bin.i16(offset + 8);
  const numCoords = bin.u16(offset + 10);
  bin.ensure(offset + 16, numCoords * 8, 'point-symbol element coordinates');
  const coords = [];
  for (let i = 0; i < numCoords; i++) {
    const rawX = bin.i32(offset + 16 + i * 8);
    const rawY = bin.i32(offset + 20 + i * 8);
    coords.push(convertRawCoord(rawX, rawY));
  }
  if (![1, 2, 3, 4].includes(type)) warnings.push(`Unknown point-symbol element type ${type}.`);
  return { type, flags, color: colorIndex(colorMap, color), lineWidth, diameter, numCoords, coords, units: 2 + numCoords, version };
}

function lineStyleFromOcad(style) {
  switch (style) {
    case 1: return { join: 2, cap: 1 };
    case 2:
    case 3:
    case 6:
      // Mapper forces round joins for pointed caps after decoding the
      // original bevel/round/miter OCAD variants.
      return { join: 2, cap: 3 };
    case 4: return { join: 1, cap: 0 };
    default: return { join: 0, cap: 0 };
  }
}

function parseLineCommon(bin, o, colorMap) {
  bin.ensure(o, 76, 'line symbol attributes');
  const style = lineStyleFromOcad(bin.u16(o + 4));
  const common = {
    color: colorIndex(colorMap, bin.u16(o)),
    lineWidth: lengthToMapper(bin.u16(o + 2)),
    joinStyle: style.join,
    capStyle: style.cap,
    startOffset: Math.max(0, lengthToMapper(bin.i16(o + 6))),
    endOffset: Math.max(0, lengthToMapper(bin.i16(o + 8))),
    mainLength: bin.i16(o + 10),
    endLengthRaw: bin.i16(o + 12),
    mainGap: bin.i16(o + 14),
    secondaryGap: bin.i16(o + 16),
    endGap: bin.i16(o + 18),
    minSymbols: bin.i16(o + 20),
    numPrimarySymbols: bin.i16(o + 22),
    primarySymbolDistance: bin.i16(o + 24),
    doubleMode: bin.u16(o + 26),
    doubleFlags: bin.u16(o + 28),
    doubleColor: colorIndex(colorMap, bin.u16(o + 30)),
    doubleLeftColor: colorIndex(colorMap, bin.u16(o + 32)),
    doubleRightColor: colorIndex(colorMap, bin.u16(o + 34)),
    doubleWidth: bin.i16(o + 36),
    doubleLeftWidth: bin.i16(o + 38),
    doubleRightWidth: bin.i16(o + 40),
    doubleLength: bin.i16(o + 42),
    doubleGap: bin.i16(o + 44),
    framingColor: colorIndex(colorMap, bin.u16(o + 58)),
    framingWidth: bin.i16(o + 60),
    framingStyle: bin.u16(o + 62),
    primaryDataSize: bin.u16(o + 64),
    secondaryDataSize: bin.u16(o + 66),
    cornerDataSize: bin.u16(o + 68),
    startDataSize: bin.u16(o + 70),
    endDataSize: bin.u16(o + 72),
  };

  common.segmentLength = lengthToMapper(common.mainLength);
  common.endLength = lengthToMapper(common.endLengthRaw);
  common.dashed = false;
  common.dashLength = 4000;
  common.breakLength = 1000;
  common.dashesInGroup = 1;
  common.inGroupBreakLength = 500;
  common.halfOuterDashes = false;

  if (common.mainGap || common.secondaryGap) {
    if (common.mainLength) {
      common.dashed = true;
      if (common.secondaryGap && !common.mainGap) {
        common.dashLength = lengthToMapper(common.mainLength - common.secondaryGap);
        common.breakLength = lengthToMapper(common.secondaryGap);
      } else {
        common.dashLength = lengthToMapper(common.mainLength);
        common.breakLength = lengthToMapper(common.mainGap);
        if (common.endLengthRaw && common.endLengthRaw !== common.mainLength && common.endLengthRaw / common.mainLength <= 0.75) {
          common.halfOuterDashes = true;
        }
        if (common.secondaryGap) {
          common.dashesInGroup = 2;
          common.inGroupBreakLength = lengthToMapper(common.secondaryGap);
          common.dashLength = (common.dashLength - common.inGroupBreakLength) / 2;
        }
      }
    }
  }
  return common;
}

function parsePointPattern(bin, dataOffset, dataSize, colorMap, version, warnings) {
  const model = { kind: 'point', innerRadius: 1000, innerColor: -1, outerWidth: 0, outerColor: -1, elements: [] };
  let usedBase = false;
  let units = 0;
  while (units + 2 <= dataSize) {
    const elementOffset = dataOffset + units * 8;
    let element;
    try { element = parsePointElement(bin, elementOffset, colorMap, version, warnings); }
    catch (error) { warnings.push(`Stopped point pattern: ${error.message}`); break; }
    if (units + element.units > dataSize) {
      warnings.push('Point-symbol element exceeds declared data size; stopped.');
      break;
    }
    const centered = element.numCoords === 0 || (element.coords[0]?.x === 0 && element.coords[0]?.y === 0);
    if (element.type === 4 && element.diameter > 0) {
      const point = { kind: 'point', innerRadius: lengthToMapper(element.diameter) / 2, innerColor: element.color, outerWidth: 0, outerColor: -1, elements: [] };
      if (!usedBase && centered) { Object.assign(model, point); usedBase = true; }
      else model.elements.push({ symbol: point, object: { type: OMAP_OBJECT.POINT, coords: element.numCoords ? [element.coords[0]] : [{ x: 0, y: 0, flags: 0 }] } });
    } else if (element.type === 3 && element.lineWidth > 0) {
      const radiusRaw = version <= 8 ? element.diameter / 2 - element.lineWidth : (element.diameter - element.lineWidth) / 2;
      if (radiusRaw > 0) {
        const point = { kind: 'point', innerRadius: lengthToMapper(radiusRaw), innerColor: -1, outerWidth: lengthToMapper(element.lineWidth), outerColor: element.color, elements: [] };
        if (!usedBase && centered) { Object.assign(model, point); usedBase = true; }
        else model.elements.push({ symbol: point, object: { type: OMAP_OBJECT.POINT, coords: element.numCoords ? [element.coords[0]] : [{ x: 0, y: 0, flags: 0 }] } });
      }
    } else if (element.type === 1 && element.lineWidth > 0) {
      const ls = element.flags === 1 ? { join: 1, cap: 1 } : element.flags === 4 ? { join: 2, cap: 0 } : { join: 0, cap: 0 };
      model.elements.push({
        symbol: defaultLineModel({ color: element.color, lineWidth: lengthToMapper(element.lineWidth), joinStyle: ls.join, capStyle: ls.cap }),
        object: { type: OMAP_OBJECT.PATH, coords: normalizePathCoords(element.coords, false), patternRotation: 0 },
      });
    } else if (element.type === 2) {
      model.elements.push({
        symbol: { kind: 'area', innerColor: element.color, minArea: 0, rotatable: false, patterns: [] },
        object: { type: OMAP_OBJECT.PATH, coords: normalizePathCoords(element.coords, true), patternRotation: 0 },
      });
    }
    units += element.units;
  }
  return model;
}

function defaultLineModel(overrides = {}) {
  return {
    kind: 'line', color: -1, lineWidth: 0, minimumLength: 0, joinStyle: 0, capStyle: 0,
    startOffset: 0, endOffset: 0, dashed: false, segmentLength: 4000, endLength: 0,
    showAtLeastOneSymbol: false, minimumMidSymbolCount: 0, minimumMidSymbolCountWhenClosed: 0,
    dashLength: 4000, breakLength: 1000, dashesInGroup: 1, inGroupBreakLength: 500,
    halfOuterDashes: false, midSymbolsPerSpot: 1, midSymbolDistance: 0, borders: [],
    ...overrides,
  };
}

function lineModelFromCommon(c) {
  return defaultLineModel({
    color: c.lineWidth ? c.color : -1,
    lineWidth: c.lineWidth,
    joinStyle: c.joinStyle,
    capStyle: c.capStyle,
    startOffset: c.startOffset,
    endOffset: c.endOffset,
    dashed: c.dashed,
    segmentLength: c.segmentLength,
    endLength: c.endLength,
    showAtLeastOneSymbol: c.primaryDataSize > 0 || c.secondaryDataSize > 0,
    dashLength: c.dashLength,
    breakLength: c.breakLength,
    dashesInGroup: c.dashesInGroup,
    inGroupBreakLength: c.inGroupBreakLength,
    halfOuterDashes: c.halfOuterDashes,
    midSymbolsPerSpot: Math.max(1, c.numPrimarySymbols || 1),
    midSymbolDistance: lengthToMapper(c.primarySymbolDistance),
  });
}

function parseSymbolRecord(bin, header, pos, colorMap, options, warnings) {
  const base = readBaseSymbol(bin, header, pos, options);
  if (!base.recordSize || base.recordSize > bin.length - pos) {
    warnings.push(`Symbol ${base.rawNumber} has suspicious size ${base.recordSize}; bounded to available data.`);
  }
  const code = formatSymbolCode(base.rawNumber, base.factor);
  const common = {
    rawNumber: base.rawNumber,
    code,
    name: base.name || `Symbol ${code}`,
    hidden: Boolean(base.status & 2),
    protected: Boolean(base.status & 1),
    rotatable: Boolean(base.flags & 1),
    ocdType: base.type,
  };
  const o = pos + base.baseSize;
  let model;

  switch (base.type) {
    case OCAD_SYMBOL.POINT: {
      const dataSize = bin.u16(o);
      model = parsePointPattern(bin, o + 4, dataSize, colorMap, header.effectiveVersion, warnings);
      model.rotatable = common.rotatable;
      break;
    }
    case OCAD_SYMBOL.LINE: {
      const c = parseLineCommon(bin, o, colorMap);
      const main = lineModelFromCommon(c);
      const parts = [main];
      if (c.doubleMode !== 0 && (c.doubleWidth > 0 || c.doubleLeftWidth > 0 || c.doubleRightWidth > 0)) {
        const doubleLine = defaultLineModel({
          color: (c.doubleFlags & 1) && c.doubleWidth ? c.doubleColor : -1,
          lineWidth: lengthToMapper(c.doubleWidth),
          joinStyle: 2,
          capStyle: 0,
          borders: [
            { color: c.doubleLeftWidth ? c.doubleLeftColor : -1, width: lengthToMapper(c.doubleLeftWidth), shift: lengthToMapper(c.doubleLeftWidth) / 2 },
            { color: c.doubleRightWidth ? c.doubleRightColor : -1, width: lengthToMapper(c.doubleRightWidth), shift: lengthToMapper(c.doubleRightWidth) / 2 },
          ],
        });
        if (c.doubleGap > 0 && c.doubleMode !== 1) {
          for (const border of doubleLine.borders) {
            border.dashed = true;
            border.dashLength = lengthToMapper(c.doubleLength);
            border.breakLength = lengthToMapper(c.doubleGap);
          }
          if (c.doubleMode === 4) {
            doubleLine.dashed = true;
            doubleLine.dashLength = lengthToMapper(c.doubleLength);
            doubleLine.breakLength = lengthToMapper(c.doubleGap);
          }
        }
        parts.push(doubleLine);
      }
      if (c.framingWidth > 0) {
        const fs = lineStyleFromOcad(c.framingStyle);
        parts.push(defaultLineModel({ color: c.framingColor, lineWidth: lengthToMapper(c.framingWidth), joinStyle: fs.join, capStyle: fs.cap }));
      }
      model = parts.length === 1 ? main : { kind: 'combined', parts };
      if (c.secondaryDataSize) warnings.push(`Symbol ${code}: secondary line point symbol is not represented.`);
      if (c.primaryDataSize || c.cornerDataSize || c.startDataSize || c.endDataSize) {
        warnings.push(`Symbol ${code}: line-attached point symbols are currently omitted; base/double/framing line is preserved.`);
      }
      break;
    }
    case OCAD_SYMBOL.AREA: {
      let commonOffset;
      let fillOn;
      let dataSize;
      if (header.effectiveVersion <= 8) {
        fillOn = bin.u16(o + 2) !== 0;
        commonOffset = o + 4;
        dataSize = bin.u16(commonOffset + 26);
      } else {
        commonOffset = o + 4;
        fillOn = bin.u8(commonOffset + 14) !== 0;
        dataSize = header.effectiveVersion >= 12 ? bin.u16(commonOffset + 30) : bin.u16(commonOffset + 26);
      }
      const fillColor = colorIndex(colorMap, bin.u16(commonOffset));
      const hatchMode = bin.u16(commonOffset + 2);
      const hatchColor = colorIndex(colorMap, bin.u16(commonOffset + 4));
      const hatchWidth = bin.u16(commonOffset + 6);
      const hatchDistance = bin.u16(commonOffset + 8);
      const patterns = [];
      if (hatchMode && hatchWidth) {
        const spacing = lengthToMapper(hatchDistance) + (header.effectiveVersion <= 8 ? lengthToMapper(hatchWidth) : 0);
        patterns.push({ type: 1, angle: angleToRadians(bin.i16(commonOffset + 10)), rotatable: true, lineSpacing: spacing, lineOffset: 0, offsetAlongLine: 0, color: hatchColor, lineWidth: lengthToMapper(hatchWidth) });
        if (hatchMode === 2) patterns.push({ ...patterns[0], angle: angleToRadians(bin.i16(commonOffset + 12)) });
      }
      const structureMode = bin.u8(commonOffset + 16);
      if (structureMode && dataSize) warnings.push(`Symbol ${code}: area point-pattern structure is not represented; fill and hatching are preserved.`);
      model = { kind: 'area', innerColor: fillOn ? fillColor : -1, minArea: 0, rotatable: common.rotatable, patterns };
      break;
    }
    case OCAD_SYMBOL.TEXT:
    case OCAD_SYMBOL.LINE_TEXT: {
      const fontOffset = o;
      const fontFamily = header.effectiveVersion >= 11 ? bin.pascal8(fontOffset, 31, 'utf-8') : bin.pascal8(fontOffset, 31, options.legacyEncoding);
      const basic = fontOffset + 32;
      const textColor = colorIndex(colorMap, bin.u16(basic));
      const fontSizeTenthsPt = bin.u16(basic + 2);
      const fontSizeMapper = Math.round(fontSizeTenthsPt * 0.1 * 25.4 / 72 * 1000);
      const weight = bin.u16(basic + 4);
      const italic = bin.u8(basic + 6) !== 0;
      const characterSpacing = bin.u16(basic + 8) / 100;
      const alignment = bin.u16(basic + 12);
      const special = basic + 14;
      const lineSpacing = bin.u16(special) / 100;
      const paragraphSpacing = lengthToMapper(bin.i16(special + 2));
      model = {
        kind: 'text', fontFamily: fontFamily || 'Arial', fontSize: Math.max(10, fontSizeMapper),
        bold: weight >= 700, italic, underline: false, color: textColor,
        lineSpacing: lineSpacing || 1, paragraphSpacing, characterSpacing,
        kerning: true, rotatable: common.rotatable,
        hAlign: alignment & 3, vAlign: (alignment & 12) >> 2,
      };
      if (base.type === OCAD_SYMBOL.LINE_TEXT) {
        common.hidden = true;
        warnings.push(`Symbol ${code}: OCAD line text is imported as hidden normal text, matching Mapper's unsupported-feature behavior.`);
      }
      break;
    }
    case OCAD_SYMBOL.RECTANGLE_V8:
    case OCAD_SYMBOL.RECTANGLE_V9: {
      const color = colorIndex(colorMap, bin.u16(o));
      const width = lengthToMapper(bin.u16(o + 2));
      model = defaultLineModel({ color: width ? color : -1, lineWidth: width, joinStyle: 1, capStyle: 1 });
      model.rectangle = {
        cornerRadius: lengthToMapper(bin.u16(o + 4)),
        gridFlags: bin.u16(o + 6),
        cellWidth: lengthToMapper(bin.u16(o + 8)),
        cellHeight: lengthToMapper(bin.u16(o + 10)),
      };
      break;
    }
    default:
      warnings.push(`Symbol ${code}: unknown OCAD symbol type ${base.type}; imported as an empty point symbol.`);
      model = { kind: 'point', innerRadius: 1000, innerColor: -1, outerWidth: 0, outerColor: -1, elements: [], rotatable: common.rotatable };
  }

  return { ...common, model };
}

function readSymbols(bin, header, colorMap, options, warnings) {
  const entries = walkIndexBlocks(bin, header.firstSymbolBlock, 4, (o) => {
    const pos = bin.u32(o);
    return pos ? { pos } : null;
  }, warnings, 'Symbol');
  const symbols = [];
  const symbolIdToIndex = new Map();
  for (const entry of entries) {
    try {
      const symbol = parseSymbolRecord(bin, header, entry.pos, colorMap, options, warnings);
      if (symbolIdToIndex.has(symbol.rawNumber)) {
        warnings.push(`Duplicate OCAD symbol number ${symbol.rawNumber}; objects use the last definition.`);
      }
      symbolIdToIndex.set(symbol.rawNumber, symbols.length);
      symbols.push(symbol);
    } catch (error) {
      warnings.push(`Could not import symbol at 0x${entry.pos.toString(16)}: ${error.message}`);
    }
  }
  return { symbols, symbolIdToIndex };
}

function convertRawCoord(rawX, rawY) {
  let x = rawX >> 8;
  let y = rawY >> 8;
  const invalid = -8388608;
  if (x === invalid) x = 0;
  if (y === invalid) y = 0;
  return { x: x * 10, y: y * -10, flags: 0, rawX, rawY };
}

function setHolePoint(coords, pos) {
  if (pos >= 1 && (coords[pos].flags & MAP_FLAG.CURVE_START)) return;
  if (pos >= 2 && (coords[pos - 1].flags & MAP_FLAG.CURVE_START)) return;
  if (pos >= 3 && (coords[pos - 2].flags & MAP_FLAG.CURVE_START)) return;
  if (pos > 0) coords[pos].flags |= MAP_FLAG.HOLE;
}

function applyOcadFlags(coords, rawCoords, isArea) {
  for (let i = 0; i < coords.length; i++) {
    const { rawX, rawY } = rawCoords[i];
    if ((rawX & 0x01) && i > 0) coords[i - 1].flags |= MAP_FLAG.CURVE_START;
    if ((rawY & 0x08) || (rawY & 0x01)) coords[i].flags |= MAP_FLAG.DASH;
    if ((rawY & 0x02) && i > 1 && isArea) setHolePoint(coords, i - 1);
  }
}

function samePosition(a, b) { return a.x === b.x && a.y === b.y; }

function normalizePathCoords(inputCoords, isArea) {
  const coords = inputCoords.map((c) => ({ x: c.x, y: c.y, flags: c.flags || 0 }));
  if (!isArea || coords.length === 0) return coords;
  let start = 0;
  for (let i = 0; i < coords.length; i++) {
    const isPartEnd = (coords[i].flags & MAP_FLAG.HOLE) !== 0 || i === coords.length - 1;
    if (!isPartEnd) continue;
    const close = { ...coords[start] };
    close.flags = (close.flags & ~MAP_FLAG.CURVE_START) | MAP_FLAG.CLOSE | (coords[i].flags & MAP_FLAG.HOLE);
    if (samePosition(coords[i], close)) {
      coords[i].flags = close.flags;
    } else {
      coords[i].flags &= ~MAP_FLAG.HOLE;
      coords.splice(i + 1, 0, close);
      i++;
    }
    if (i - start >= 2) coords[i - 2].flags &= ~MAP_FLAG.CURVE_START;
    if (i - start >= 1) coords[i - 1].flags &= ~MAP_FLAG.CURVE_START;
    start = i + 1;
  }
  return coords;
}

function readObjectEntries(bin, header, warnings) {
  if (header.effectiveVersion <= 8) {
    return walkIndexBlocks(bin, header.firstObjectBlock, 24, (o) => {
      const pos = bin.u32(o + 16);
      const size = bin.u16(o + 20);
      const symbol = bin.i16(o + 22);
      return pos ? { pos, size, symbol, status: 1 } : null;
    }, warnings, 'Object');
  }
  return walkIndexBlocks(bin, header.firstObjectBlock, 40, (o) => {
    const pos = bin.u32(o + 16);
    const size = bin.u32(o + 20);
    const symbol = bin.i32(o + 24);
    const type = bin.u8(o + 28);
    const status = bin.u8(o + 30);
    return pos ? { pos, size, symbol, type, status } : null;
  }, warnings, 'Object');
}

function readRawCoordinates(bin, offset, count) {
  bin.ensure(offset, count * 8, 'object coordinates');
  const raw = [];
  const coords = [];
  for (let i = 0; i < count; i++) {
    const rawX = bin.i32(offset + i * 8);
    const rawY = bin.i32(offset + i * 8 + 4);
    raw.push({ rawX, rawY });
    coords.push(convertRawCoord(rawX, rawY));
  }
  return { raw, coords };
}

function fallbackSymbolForObject(type, colors, symbols, symbolIdToIndex, warnings) {
  const key = `fallback:${type}`;
  if (symbolIdToIndex.has(key)) return symbolIdToIndex.get(key);
  if (!colors.length) colors.push({ number: -1, priority: 0, name: 'Fallback black', c: 0, m: 0, y: 0, k: 1, opacity: 1 });
  let symbol;
  if (type === 1) {
    symbol = { rawNumber: key, code: '', name: 'Undefined point', hidden: false, protected: false, rotatable: true, ocdType: 1, model: { kind: 'point', innerRadius: 300, innerColor: 0, outerWidth: 0, outerColor: -1, elements: [], rotatable: true } };
  } else if (type === 4 || type === 5) {
    symbol = { rawNumber: key, code: '', name: 'Undefined text', hidden: false, protected: false, rotatable: true, ocdType: 4, model: { kind: 'text', fontFamily: 'Arial', fontSize: 3000, color: 0, lineSpacing: 1, paragraphSpacing: 0, characterSpacing: 0, kerning: true, rotatable: true, hAlign: 0, vAlign: 0 } };
  } else {
    symbol = { rawNumber: key, code: '', name: 'Undefined line', hidden: false, protected: false, rotatable: false, ocdType: 2, model: defaultLineModel({ color: 0, lineWidth: 150 }) };
  }
  const index = symbols.length;
  symbols.push(symbol);
  symbolIdToIndex.set(key, index);
  warnings.push(`Created ${symbol.name} fallback symbol.`);
  return index;
}

function objectText(bin, header, object, options) {
  const start = object.coordsOffset + object.numItems * 8;
  const maxBytes = object.numText * 8;
  if (!maxBytes || start >= bin.length) return '';
  const bytes = bin.bytes(start, Math.min(maxBytes, bin.length - start));
  let text;
  if (header.effectiveVersion <= 8 && !object.unicode) text = decodeBytes(bytes, options.legacyEncoding).split('\0')[0];
  else text = decodeUtf16NullTerminated(bytes);
  if (text.startsWith('\r\n')) text = text.slice(2);
  return text;
}

function parseObjectRecord(bin, header, entry, symbols, symbolIdToIndex, colors, options, warnings) {
  if (header.effectiveVersion <= 8) {
    bin.ensure(entry.pos, 32, 'OCAD 8 object');
    const object = {
      symbolRaw: bin.i16(entry.pos), type: bin.u8(entry.pos + 2), unicode: bin.u8(entry.pos + 3) !== 0,
      numItems: bin.u16(entry.pos + 4), numText: bin.u16(entry.pos + 6), angle: bin.i16(entry.pos + 8),
      coordsOffset: entry.pos + 32,
    };
    return finishObject(bin, header, object, symbols, symbolIdToIndex, colors, options, warnings);
  }
  if (header.effectiveVersion >= 12) {
    bin.ensure(entry.pos, 56, 'OCAD 12 object');
    const object = {
      symbolRaw: bin.i32(entry.pos), type: bin.u8(entry.pos + 4), unicode: true,
      angle: bin.i16(entry.pos + 6), numItems: bin.u32(entry.pos + 44), numText: bin.u16(entry.pos + 48),
      coordsOffset: entry.pos + 56,
    };
    return finishObject(bin, header, object, symbols, symbolIdToIndex, colors, options, warnings);
  }
  bin.ensure(entry.pos, 40, 'OCAD 9-11 object');
  const object = {
    symbolRaw: bin.i32(entry.pos), type: bin.u8(entry.pos + 4), unicode: true,
    angle: bin.i16(entry.pos + 6), numItems: bin.u32(entry.pos + 8), numText: bin.u16(entry.pos + 12),
    coordsOffset: entry.pos + 40,
  };
  return finishObject(bin, header, object, symbols, symbolIdToIndex, colors, options, warnings);
}

function finishObject(bin, header, object, symbols, symbolIdToIndex, colors, options, warnings) {
  if (object.numItems > 10_000_000) throw new OcadError(`Unreasonable object coordinate count ${object.numItems}`, object.coordsOffset);
  const read = readRawCoordinates(bin, object.coordsOffset, object.numItems);
  let symbolIndex = symbolIdToIndex.get(object.symbolRaw);
  if (symbolIndex == null) symbolIndex = fallbackSymbolForObject(object.type, colors, symbols, symbolIdToIndex, warnings);
  const symbol = symbols[symbolIndex];
  const kind = symbol.model.kind;
  const isArea = kind === 'area' || (kind === 'combined' && symbol.model.parts.some((part) => part.kind === 'area'));
  applyOcadFlags(read.coords, read.raw, isArea);

  if (kind === 'point') {
    return { type: OMAP_OBJECT.POINT, symbol: symbolIndex, rotation: symbol.rotatable ? angleToRadians(object.angle) : 0, coords: read.coords.slice(0, 1) };
  }
  if (kind === 'text') {
    const text = objectText(bin, header, object, options);
    const first = read.coords[0] ?? { x: 0, y: 0, flags: 0 };
    const result = { type: OMAP_OBJECT.TEXT, symbol: symbolIndex, rotation: angleToRadians(object.angle), hAlign: symbol.model.hAlign ?? 0, vAlign: symbol.model.vAlign ?? 0, coords: [first], text };
    if (read.coords.length >= 4) {
      const xs = read.coords.map((p) => p.x), ys = read.coords.map((p) => p.y);
      result.size = { width: Math.max(...xs) - Math.min(...xs), height: Math.max(...ys) - Math.min(...ys) };
      result.coords = [first, { x: result.size.width, y: result.size.height, flags: 0 }];
    }
    return result;
  }
  return { type: OMAP_OBJECT.PATH, symbol: symbolIndex, rotation: 0, patternRotation: angleToRadians(object.angle), coords: normalizePathCoords(read.coords, isArea) };
}

function readObjects(bin, header, symbols, symbolIdToIndex, colors, options, warnings) {
  const entries = readObjectEntries(bin, header, warnings);
  const objects = [];
  for (const entry of entries) {
    if (header.effectiveVersion >= 9 && (entry.status === 0 || entry.status === 3)) continue;
    try {
      const object = parseObjectRecord(bin, header, entry, symbols, symbolIdToIndex, colors, options, warnings);
      if (object && object.coords.length) objects.push(object);
    } catch (error) {
      warnings.push(`Could not import object at 0x${entry.pos.toString(16)}: ${error.message}`);
    }
  }
  return objects;
}

function symbolType(model) {
  return model.kind === 'point' ? OMAP_SYMBOL.POINT : model.kind === 'line' ? OMAP_SYMBOL.LINE : model.kind === 'area' ? OMAP_SYMBOL.AREA : model.kind === 'text' ? OMAP_SYMBOL.TEXT : OMAP_SYMBOL.COMBINED;
}

function writeLineModel(xml, model) {
  xml.open('line_symbol', {
    color: model.color, line_width: Math.round(model.lineWidth), minimum_length: Math.round(model.minimumLength),
    join_style: model.joinStyle, cap_style: model.capStyle, start_offset: Math.round(model.startOffset), end_offset: Math.round(model.endOffset),
    dashed: model.dashed || undefined, segment_length: Math.round(model.segmentLength), end_length: Math.round(model.endLength),
    show_at_least_one_symbol: model.showAtLeastOneSymbol || undefined,
    minimum_mid_symbol_count: model.minimumMidSymbolCount, minimum_mid_symbol_count_when_closed: model.minimumMidSymbolCountWhenClosed,
    dash_length: Math.round(model.dashLength), break_length: Math.round(model.breakLength), dashes_in_group: model.dashesInGroup,
    in_group_break_length: Math.round(model.inGroupBreakLength), half_outer_dashes: model.halfOuterDashes || undefined,
    mid_symbols_per_spot: model.midSymbolsPerSpot, mid_symbol_distance: Math.round(model.midSymbolDistance),
  });
  if (model.borders?.length) {
    xml.open('borders', { borders_different: model.borders.length > 1 || undefined });
    for (const border of model.borders) {
      xml.empty('border', {
        color: border.color, width: Math.round(border.width), shift: Math.round(border.shift || 0),
        dashed: border.dashed || undefined, dash_length: border.dashLength ? Math.round(border.dashLength) : undefined,
        break_length: border.breakLength ? Math.round(border.breakLength) : undefined,
      });
    }
    xml.close('borders');
  }
  xml.close('line_symbol');
}

function writeCoords(xml, coords) {
  const text = coords.map((c) => `${Math.round(c.x)} ${Math.round(c.y)}${c.flags ? ` ${c.flags}` : ''};`).join('');
  xml.textElement('coords', text, { count: coords.length });
}

function writeInlineObject(xml, object) {
  xml.open('object', { type: object.type, rotation: object.rotation || undefined });
  writeCoords(xml, object.coords);
  if (object.type === OMAP_OBJECT.PATH) {
    xml.open('pattern', { rotation: fixed(object.patternRotation || 0) });
    xml.empty('coord', { x: 0, y: 0 });
    xml.close('pattern');
  }
  xml.close('object');
}

function writeSymbolModel(xml, model, metadata = {}) {
  if (model.kind === 'point') {
    xml.open('point_symbol', { rotatable: model.rotatable || undefined, inner_radius: Math.round(model.innerRadius), inner_color: model.innerColor, outer_width: Math.round(model.outerWidth), outer_color: model.outerColor, elements: model.elements?.length || 0 });
    for (const element of model.elements ?? []) {
      xml.open('element');
      writeSymbol(xml, { rawNumber: '', code: '', name: '', hidden: false, protected: false, rotatable: false, model: element.symbol }, null);
      writeInlineObject(xml, element.object);
      xml.close('element');
    }
    xml.close('point_symbol');
  } else if (model.kind === 'line') {
    writeLineModel(xml, model);
  } else if (model.kind === 'area') {
    xml.open('area_symbol', { inner_color: model.innerColor, min_area: model.minArea || 0, rotatable: model.rotatable || undefined, patterns: model.patterns?.length || 0 });
    for (const pattern of model.patterns ?? []) {
      xml.empty('pattern', {
        type: pattern.type, angle: fixed(pattern.angle), rotatable: pattern.rotatable || undefined,
        line_spacing: Math.round(pattern.lineSpacing), line_offset: Math.round(pattern.lineOffset || 0), offset_along_line: Math.round(pattern.offsetAlongLine || 0),
        color: pattern.color, line_width: Math.round(pattern.lineWidth),
      });
    }
    xml.close('area_symbol');
  } else if (model.kind === 'text') {
    xml.open('text_symbol', { icon_text: metadata.iconText || '', rotatable: model.rotatable || undefined });
    xml.empty('font', { family: model.fontFamily, size: Math.round(model.fontSize), bold: model.bold || undefined, italic: model.italic || undefined, underline: model.underline || undefined });
    xml.empty('text', { color: model.color, line_spacing: fixed(model.lineSpacing, 4), paragraph_spacing: Math.round(model.paragraphSpacing), character_spacing: fixed(model.characterSpacing, 4), kerning: model.kerning || undefined });
    xml.close('text_symbol');
  } else if (model.kind === 'combined') {
    xml.open('combined_symbol', { parts: model.parts.length });
    for (const part of model.parts) {
      xml.open('part', { private: true });
      writeSymbol(xml, { rawNumber: '', code: '', name: '', hidden: false, protected: false, rotatable: false, model: part }, null);
      xml.close('part');
    }
    xml.close('combined_symbol');
  }
}

function writeSymbol(xml, symbol, id) {
  xml.open('symbol', {
    type: symbolType(symbol.model), id: id == null ? undefined : id, code: symbol.code,
    name: symbol.name || undefined, is_helper_symbol: false, is_hidden: symbol.hidden, is_protected: symbol.protected,
  });
  writeSymbolModel(xml, symbol.model, symbol);
  xml.close('symbol');
}

function writeColor(xml, color, index) {
  const rgb = cmykToRgb(color.c, color.m, color.y, color.k);
  xml.open('color', {
    priority: index, name: color.name, c: fixed(color.c, 3), m: fixed(color.m, 3), y: fixed(color.y, 3), k: fixed(color.k, 3), opacity: fixed(color.opacity, 3),
  });
  xml.empty('cmyk', { method: 'custom' });
  xml.empty('rgb', { method: 'cmyk', r: fixed(rgb.r, 3), g: fixed(rgb.g, 3), b: fixed(rgb.b, 3) });
  xml.close('color');
}

function writeObject(xml, object) {
  xml.open('object', {
    type: object.type, symbol: object.symbol, rotation: object.rotation ? fixed(object.rotation) : undefined,
    h_align: object.type === OMAP_OBJECT.TEXT ? object.hAlign : undefined,
    v_align: object.type === OMAP_OBJECT.TEXT ? object.vAlign : undefined,
  });
  writeCoords(xml, object.coords);
  if (object.type === OMAP_OBJECT.PATH) {
    xml.open('pattern', { rotation: fixed(object.patternRotation || 0) });
    xml.empty('coord', { x: 0, y: 0 });
    xml.close('pattern');
  } else if (object.type === OMAP_OBJECT.TEXT) {
    if (object.size) xml.empty('size', { width: Math.round(object.size.width), height: Math.round(object.size.height) });
    xml.textElement('text', object.text || '');
  }
  xml.close('object');
}

function writeOmap(model, options) {
  const xml = new XmlWriter(options.prettyXml);
  xml.open('map', { xmlns: OMAP_NS, version: 9 });
  xml.textElement('notes', `Converted in-browser from OCAD ${model.header.version}.${model.header.subversion}. ${model.warnings.length} conversion warning(s).`);
  xml.open('georeferencing', { scale: model.georeferencing.scale, grivation: model.georeferencing.grivation ? fixed(model.georeferencing.grivation) : undefined });
  xml.empty('projected_crs', { id: model.georeferencing.projectedCrsId });
  xml.close('georeferencing');

  xml.open('colors', { count: model.colors.length });
  model.colors.forEach((color, i) => writeColor(xml, color, i));
  xml.close('colors');

  xml.open('barrier', { version: 6, required: '0.6.0' });
  xml.open('symbols', { count: model.symbols.length, id: 'OCD' });
  model.symbols.forEach((symbol, i) => writeSymbol(xml, symbol, i));
  xml.close('symbols');

  xml.open('parts', { count: 1, current: 0 });
  xml.open('part', { name: 'OCAD import' });
  xml.open('objects', { count: model.objects.length });
  model.objects.forEach((object) => writeObject(xml, object));
  xml.close('objects');
  xml.close('part');
  xml.close('parts');

  xml.empty('templates', { count: 0, first_front_template: 0 });
  xml.open('view', { grid: false, map: true, templates: true, map_opacity: 1, map_visible: true, map_xray: false, template_opacity: 1, template_visible: true });
  xml.empty('map_view', { zoom: 1, rotation: 0, position_x: 0, position_y: 0 });
  xml.close('view');
  xml.close('barrier');
  xml.close('map');
  return xml.toString();
}

export function parseOcad(arrayBuffer, userOptions = {}) {
  const options = {
    legacyEncoding: userOptions.legacyEncoding || 'windows-1252',
    prettyXml: Boolean(userOptions.prettyXml),
  };
  const warnings = [];
  const bin = new BinaryView(arrayBuffer);
  const header = readHeader(bin);
  if (header.version === 2018) warnings.push('OCAD 2018 is interpreted using the OCAD 12 structures, as Mapper does experimentally.');
  if (header.effectiveVersion < 8) warnings.push(`OCAD ${header.version} is parsed through the OCAD 8-compatible layout; very old records may need additional compatibility handling.`);
  const strings = readParameterStrings(bin, header, options, warnings);
  const colorData = header.effectiveVersion <= 8 ? readV8Colors(bin, warnings) : readModernColors(strings, warnings);
  const georeferencing = parseGeoreferencing(bin, header, strings, warnings);
  const symbolData = readSymbols(bin, header, colorData.colorIdToIndex, options, warnings);
  const objects = readObjects(bin, header, symbolData.symbols, symbolData.symbolIdToIndex, colorData.colors, options, warnings);
  return {
    header, strings, colors: colorData.colors, symbols: symbolData.symbols, objects, georeferencing, warnings,
    stats: { colors: colorData.colors.length, symbols: symbolData.symbols.length, objects: objects.length, strings: strings.length },
  };
}

export function convertOcadToOmap(arrayBuffer, options = {}) {
  const model = parseOcad(arrayBuffer, options);
  const xml = writeOmap(model, { prettyXml: Boolean(options.prettyXml) });
  return { xml, model, warnings: model.warnings, stats: model.stats };
}

export function downloadOmap(xml, filename = 'converted.omap') {
  const blob = new Blob([xml], { type: 'application/vnd.openorienteering.mapper+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export { OcadError };
