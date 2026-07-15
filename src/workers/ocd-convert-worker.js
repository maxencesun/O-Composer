import { convertOcadToOmap } from '../ocd/ocd2omap.js?v=20260715-37';

self.addEventListener('message', (event) => {
  const { id, type = 'convert', buffer, options = {} } = event.data || {};
  if (type === 'preload') {
    self.postMessage({ id, type: 'ready', ok: true });
    return;
  }
  try {
    if (!(buffer instanceof ArrayBuffer)) {
      throw new TypeError('OCD worker input must be an ArrayBuffer.');
    }
    const result = convertOcadToOmap(buffer, options);
    self.postMessage({
      id,
      ok: true,
      xml: result.xml,
      warnings: result.warnings,
      stats: result.stats,
      header: result.model?.header || null,
      mode: 'js-fallback',
    });
  } catch (error) {
    self.postMessage({
      id,
      ok: false,
      error: error?.stack || error?.message || String(error),
    });
  }
});

self.postMessage({ type: 'ready', ok: true });
