# Samples

- `standalone-sample.ppen` is a small browser-friendly event used by the in-app **File > Open Sample** command and by verification.
- `original-sample-event.ppen` and `original-sample-event-exchange.ppen` are copied from the Purple Pen sample documentation so the standalone app can be tested with representative legacy `.ppen` files without reaching back into the original source tree.
- `forest-sample.omap` and `text-object.omap` are copied OpenOrienteering Mapper XML maps used to test standalone OMAP rendering.

The original Purple Pen samples reference OCAD map files from the desktop application. Browser-only Purple Pen can preserve those references in `.ppen` files, but it does not parse OCAD map data; use **File > Import OMAP Map** for OpenOrienteering Mapper XML maps or **File > Choose Map Image** for a browser-readable background image.
