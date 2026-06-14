export const META_SETUP_KEY = "oComposerMetaSetup";
export const META_SETUP_VERSION = 1;

function readRawMetaSetup() {
  try {
    const raw = globalThis.localStorage?.getItem(META_SETUP_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : null;
  }
  catch {
    return null;
  }
}

export function readMetaSetupPreference() {
  return readRawMetaSetup();
}

export function hasCompletedMetaSetup() {
  const preference = readRawMetaSetup();
  return Boolean(preference?.completed && Number(preference.version || 0) >= META_SETUP_VERSION);
}

export function saveMetaSetupPreference(settings = {}) {
  try {
    const payload = {
      version: META_SETUP_VERSION,
      completed: true,
      updatedAt: new Date().toISOString(),
      ...settings
    };
    globalThis.localStorage?.setItem(META_SETUP_KEY, JSON.stringify(payload));
    return payload;
  }
  catch {
    return null;
  }
}

export function resetMetaSetupPreference() {
  try {
    globalThis.localStorage?.removeItem(META_SETUP_KEY);
  }
  catch {}
}
