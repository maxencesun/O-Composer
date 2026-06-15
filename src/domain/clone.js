export function cloneDeep(value) {
  if (typeof structuredClone === "function") {
    return structuredClone(value);
  }
  return cloneValue(value, new WeakMap());
}

function cloneValue(value, seen) {
  if (value === null || typeof value !== "object") return value;
  if (seen.has(value)) return seen.get(value);

  if (value instanceof Date) return new Date(value.getTime());
  if (value instanceof RegExp) return new RegExp(value.source, value.flags);
  if (typeof Blob !== "undefined" && value instanceof Blob) return value.slice(0, value.size, value.type);
  if (value instanceof ArrayBuffer) return value.slice(0);
  if (ArrayBuffer.isView(value)) {
    if (value instanceof DataView) {
      return new DataView(cloneValue(value.buffer, seen), value.byteOffset, value.byteLength);
    }
    return new value.constructor(value);
  }

  if (value instanceof Map) {
    const clone = new Map();
    seen.set(value, clone);
    for (const [key, entry] of value.entries()) {
      clone.set(cloneValue(key, seen), cloneValue(entry, seen));
    }
    return clone;
  }

  if (value instanceof Set) {
    const clone = new Set();
    seen.set(value, clone);
    for (const entry of value.values()) {
      clone.add(cloneValue(entry, seen));
    }
    return clone;
  }

  if (Array.isArray(value)) {
    const clone = [];
    seen.set(value, clone);
    value.forEach((entry, index) => {
      clone[index] = cloneValue(entry, seen);
    });
    return clone;
  }

  const prototype = Object.getPrototypeOf(value);
  const clone = Object.create(prototype || Object.prototype);
  seen.set(value, clone);
  for (const key of Reflect.ownKeys(value)) {
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (!descriptor) continue;
    if ("value" in descriptor) {
      descriptor.value = cloneValue(descriptor.value, seen);
    }
    try {
      Object.defineProperty(clone, key, descriptor);
    } catch (_error) {
      clone[key] = cloneValue(value[key], seen);
    }
  }
  return clone;
}
