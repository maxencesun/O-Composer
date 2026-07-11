export function measurementMetrics(points, closed = false, mapScale = 15000) {
  const locations = Array.isArray(points) ? points.filter(validPoint) : [];
  const scale = positiveNumber(mapScale, 15000);
  let lineLengthM = 0;
  for (let index = 1; index < locations.length; index += 1) {
    lineLengthM += pointDistance(locations[index - 1], locations[index]);
  }

  const canClose = closed && locations.length >= 3;
  const closingLengthM = canClose ? pointDistance(locations[locations.length - 1], locations[0]) : 0;
  const perimeterM = canClose ? lineLengthM + closingLengthM : null;
  const areaM2 = canClose ? polygonArea(locations) : null;

  return {
    lineLengthM,
    lineLengthPaperMm: lineLengthM * 1000 / scale,
    perimeterM,
    perimeterPaperMm: perimeterM === null ? null : perimeterM * 1000 / scale,
    areaM2,
    areaPaperMm2: areaM2 === null ? null : areaM2 * 1_000_000 / (scale * scale)
  };
}

export function formatGroundLength(metres) {
  const value = Math.max(0, Number(metres) || 0);
  return value >= 1000 ? `${formatNumber(value / 1000, 3)} km` : `${formatNumber(value, 2)} m`;
}

export function formatPaperLength(millimetres) {
  return `${formatNumber(Math.max(0, Number(millimetres) || 0), 2)} mm`;
}

export function formatGroundArea(squareMetres) {
  const value = Math.max(0, Number(squareMetres) || 0);
  return value >= 10_000 ? `${formatNumber(value / 10_000, 3)} ha` : `${formatNumber(value, 2)} m²`;
}

export function formatPaperArea(squareMillimetres) {
  return `${formatNumber(Math.max(0, Number(squareMillimetres) || 0), 2)} mm²`;
}

export function measurementLabelPoint(item) {
  if (validPoint(item?.labelPosition)) {
    return { x: Number(item.labelPosition.x), y: Number(item.labelPosition.y) };
  }
  const points = Array.isArray(item?.points) ? item.points.filter(validPoint) : [];
  if (!points.length) return null;
  if (points.length === 1) return { x: Number(points[0].x), y: Number(points[0].y) };
  const segments = [];
  let total = 0;
  for (let index = 1; index < points.length; index += 1) {
    const length = pointDistance(points[index - 1], points[index]);
    segments.push([points[index - 1], points[index], length]);
    total += length;
  }
  if (item?.closed && points.length >= 3) {
    const length = pointDistance(points[points.length - 1], points[0]);
    segments.push([points[points.length - 1], points[0], length]);
    total += length;
  }
  let remaining = total / 2;
  for (const [start, end, length] of segments) {
    if (remaining <= length) {
      const ratio = length > 0 ? remaining / length : 0;
      return { x: start.x + (end.x - start.x) * ratio, y: start.y + (end.y - start.y) * ratio };
    }
    remaining -= length;
  }
  return { ...points[points.length - 1] };
}

export function measurementPathDistance(point, item) {
  const points = Array.isArray(item?.points) ? item.points.filter(validPoint) : [];
  let nearest = Infinity;
  for (let index = 1; index < points.length; index += 1) {
    nearest = Math.min(nearest, segmentDistance(point, points[index - 1], points[index]));
  }
  if (item?.closed && points.length >= 3) {
    nearest = Math.min(nearest, segmentDistance(point, points[points.length - 1], points[0]));
  }
  return nearest;
}

function polygonArea(points) {
  const origin = points[0];
  let twiceArea = 0;
  for (let index = 0; index < points.length; index += 1) {
    const current = points[index];
    const next = points[(index + 1) % points.length];
    const currentX = current.x - origin.x;
    const currentY = current.y - origin.y;
    const nextX = next.x - origin.x;
    const nextY = next.y - origin.y;
    twiceArea += currentX * nextY - nextX * currentY;
  }
  return Math.abs(twiceArea) / 2;
}

function pointDistance(a, b) {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

function segmentDistance(point, start, end) {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const lengthSquared = dx * dx + dy * dy;
  if (!(lengthSquared > 0)) return pointDistance(point, start);
  const ratio = Math.max(0, Math.min(1, ((point.x - start.x) * dx + (point.y - start.y) * dy) / lengthSquared));
  return Math.hypot(point.x - (start.x + dx * ratio), point.y - (start.y + dy * ratio));
}

function validPoint(point) {
  return Number.isFinite(Number(point?.x)) && Number.isFinite(Number(point?.y));
}

function positiveNumber(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : fallback;
}

function formatNumber(value, digits) {
  return value.toLocaleString(undefined, { maximumFractionDigits: digits });
}
