# Rebuild-source archive

These files are preserved alongside the generated WebAssembly artifacts so
the exact O-Composer build can be audited and reproduced:

- `mapper_wasm_bridge.cpp` — in-memory Mapper C API bridge
- `CMakeLists.addendum.txt` — Emscripten target injected into Mapper
- `install-bridge.mjs` — commit verification and idempotent platform patch
- `build-wasm.sh` — checked toolchain validation and artifact copy
- `BUILD.md` — complete Qt/Emscripten/SQLite/PROJ/Mapper procedure

The scripts retain their original `ocd2omap-frontend` directory assumptions.
To rebuild, place `build-wasm.sh` and `install-bridge.mjs` under `scripts/`,
the bridge files under `wasm/bridge/`, and `BUILD.md` under `wasm/`, then
follow `BUILD.md`. OpenOrienteering Mapper itself is intentionally referenced
by its immutable upstream commit rather than duplicated here.
