const CONSENT_COOKIE = "purplePenCookieConsent";
const CACHE_META_COOKIE = "purplePenSessionCache";
const LEGACY_CHUNK_PREFIX = "purplePenSessionCache.";
const LEGACY_STORAGE_KEY = "purplePenSessionCachePayload";
const COOKIE_DAYS = 180;
const DB_NAME = "purplePenWebCache";
const DB_VERSION = 1;
const STORE_NAME = "sessions";
const SESSION_KEY = "latest";

export function hasCookieConsent() {
  return getCookie(CONSENT_COOKIE) === "accepted";
}

export function acceptCookieConsent() {
  setCookie(CONSENT_COOKIE, "accepted");
}

export async function saveCachedSession(payload) {
  if (!hasCookieConsent()) return { saved: false, reason: "no-consent" };
  const record = {
    version: 2,
    updatedAt: new Date().toISOString(),
    payload
  };

  try {
    await idbPut(SESSION_KEY, record);
    clearLegacyCache();
    setCacheMeta({ version: 2, storage: "indexedDB", dbName: DB_NAME, storeName: STORE_NAME });
    return { saved: true, storage: "indexedDB" };
  }
  catch {
    return { saved: false, reason: "indexeddb-unavailable" };
  }
}

export async function loadCachedSession() {
  if (!hasCookieConsent()) return null;
  try {
    const record = await idbGet(SESSION_KEY);
    if (record?.payload) return record.payload;
  }
  catch {
    return null;
  }
  return null;
}

export async function clearCachedSession() {
  clearLegacyCache();
  deleteCookie(CACHE_META_COOKIE);
  try {
    await idbDelete(SESSION_KEY);
  }
  catch {
    // Cache clearing should never block the app.
  }
}

function openDatabase() {
  return new Promise((resolve, reject) => {
    if (!("indexedDB" in window)) {
      reject(new Error("IndexedDB unavailable"));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error("IndexedDB open failed"));
  });
}

async function idbPut(key, value) {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readwrite");
    transaction.objectStore(STORE_NAME).put(value, key);
    transaction.oncomplete = () => {
      db.close();
      resolve();
    };
    transaction.onerror = () => {
      db.close();
      reject(transaction.error || new Error("IndexedDB write failed"));
    };
  });
}

async function idbGet(key) {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readonly");
    const request = transaction.objectStore(STORE_NAME).get(key);
    request.onsuccess = () => resolve(request.result || null);
    transaction.oncomplete = () => db.close();
    transaction.onerror = () => {
      db.close();
      reject(transaction.error || new Error("IndexedDB read failed"));
    };
  });
}

async function idbDelete(key) {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readwrite");
    transaction.objectStore(STORE_NAME).delete(key);
    transaction.oncomplete = () => {
      db.close();
      resolve();
    };
    transaction.onerror = () => {
      db.close();
      reject(transaction.error || new Error("IndexedDB delete failed"));
    };
  });
}

function setCacheMeta(meta) {
  setCookie(CACHE_META_COOKIE, encodeURIComponent(JSON.stringify(meta)));
}

function clearLegacyCache() {
  localStorage.removeItem(LEGACY_STORAGE_KEY);
  for (let index = 0; index < 40; index += 1) {
    deleteCookie(`${LEGACY_CHUNK_PREFIX}${index}`);
  }
}

function getCookie(name) {
  const prefix = `${encodeURIComponent(name)}=`;
  return document.cookie
    .split(";")
    .map(part => part.trim())
    .find(part => part.startsWith(prefix))
    ?.slice(prefix.length) || "";
}

function setCookie(name, value) {
  document.cookie = `${encodeURIComponent(name)}=${value}; max-age=${COOKIE_DAYS * 86400}; path=/; SameSite=Lax`;
}

function deleteCookie(name) {
  document.cookie = `${encodeURIComponent(name)}=; max-age=0; path=/; SameSite=Lax`;
}
