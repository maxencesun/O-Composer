# Pyodide browser runtime

- Package: `pyodide`
- Version: `314.0.2`
- Python runtime: CPython `3.14.2`
- Source package: `https://registry.npmjs.org/pyodide/-/pyodide-314.0.2.tgz`
- Upstream source: `https://github.com/pyodide/pyodide/tree/314.0.2`
- License: Mozilla Public License 2.0; see `LICENSE`

O-Composer vendors only the loader, WebAssembly runtime, standard-library zip,
and lock file required by `loadPyodide()`. Advanced map-page code runs in a
dedicated module worker. No package CDN is used at runtime and user imports do
not trigger automatic third-party package downloads.

SHA-256 values:

```text
955d2088bbb7fc79a73c4802aca2370c1d95bfdfaffa4121e0faebda2b0ea3f9  pyodide.mjs
c7eccdfeb7a8419d61f910f0685b45cd5610b7ff5bbe844c3c1050ee6623b641  pyodide.asm.mjs
f7a8a169e513791e18fa0790fb69d6f2656b779e9012ba57e03e973f0df0b39f  pyodide.asm.wasm
101a9c94ca6304c1478c89b7b595136b9a51b4289bdc5b467d86db553efee9b3  python_stdlib.zip
c963d22858f6bcb8f41586a2142f03905ab370c88ea22a86a2736e95fac2a8f3  pyodide-lock.json
```
