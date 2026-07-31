export function controlCircleGapStorage(control) {
  if (control?.circleGaps?.length) return "circleGaps";
  if (control?.gaps?.length) return "gaps";
  return "circleGaps";
}

export function parseControlCircleGaps(control) {
  const storage = controlCircleGapStorage(control);
  const encoded = control?.[storage]?.[0]?.value || "";
  return String(encoded)
    .split(",")
    .map(item => item.trim())
    .filter(Boolean)
    .map(item => {
      const [start, stop] = item.split(":").map(Number);
      return Number.isFinite(start) && Number.isFinite(stop) ? { start, stop } : null;
    })
    .filter(Boolean);
}

export function setControlCircleGaps(control, gaps) {
  if (!control) return;
  const storage = controlCircleGapStorage(control);
  control[storage] ||= [];
  const value = (gaps || [])
    .map(gap => `${formatAngle(gap.start)}:${formatAngle(gap.stop)}`)
    .join(",");
  if (control[storage].length) {
    control[storage][0] = { ...control[storage][0], value };
  }
  else {
    control[storage].push({ scale: 0, value });
  }
}

export function normalizeCircleAngle(value) {
  const angle = Number(value) || 0;
  return ((angle % 360) + 360) % 360;
}

export function circleGapSpan(gap) {
  return normalizeCircleAngle(Number(gap?.stop) - Number(gap?.start));
}

export function circleGapMidAngle(gap) {
  return normalizeCircleAngle(Number(gap?.start) + circleGapSpan(gap) / 2);
}

export function circlePointAtAngle(center, radius, angle) {
  const radians = normalizeCircleAngle(angle) * Math.PI / 180;
  return {
    x: Number(center?.x) + Math.cos(radians) * radius,
    y: Number(center?.y) + Math.sin(radians) * radius
  };
}

export function circleAngleAtPoint(center, point) {
  return normalizeCircleAngle(Math.atan2(
    Number(point?.y) - Number(center?.y),
    Number(point?.x) - Number(center?.x)
  ) * 180 / Math.PI);
}

function formatAngle(value) {
  const rounded = Math.round(normalizeCircleAngle(value) * 1000) / 1000;
  return String(rounded);
}
