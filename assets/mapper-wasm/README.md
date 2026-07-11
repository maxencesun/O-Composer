# OpenOrienteering Mapper WebAssembly converter

This directory is a self-contained browser build of the official
OpenOrienteering Mapper OCAD importer and OMAP XML exporter. O-Composer loads
it lazily through `src/ocd/official-mapper-adapter.js`; no server-side
conversion or upload is involved.

Keep these three generated files together at the same URL:

- `mapper-converter.js` — Emscripten ES module loader
- `mapper-converter.wasm` — Mapper, Qt and PROJ conversion code
- `mapper-converter.data` — PROJ runtime data mounted at `/share/proj`

The `.data` file is required. A server hosting O-Composer must serve `.wasm`
files as `application/wasm` and must not omit large binary assets from its
static deployment.

## Runtime behavior

The bridge executes Mapper's native in-memory pipeline:

```text
OcdFileImport::doImport()
  -> Importer::validate()
  -> Map
  -> XMLFileExporter::doExport()
```

Input and output use Qt `QBuffer`; selected maps never leave the browser. The
official module is preferred. Only when the JS entry asset is absent does the
controller use O-Composer's JavaScript compatibility converter in a Web
Worker. A deployed but broken `.wasm` or `.data` file is reported as an error
instead of silently changing conversion semantics.

## Integrity

SHA-256 checksums for this build:

```text
1ee7109d3d3cb4afb7567552856fea6aebc83680fa96c45a1a21e36d03b2590f  mapper-converter.js
1b367b3bc0727b9ab4c2c9de4a2bc5b6a72f63597996e1bd4c38a36281c0a309  mapper-converter.wasm
0512daf888c9a85613185556caf284501310ce497972da3c8d5354e378084a60  mapper-converter.data
```

See [PROVENANCE.md](PROVENANCE.md) for exact source revisions and toolchain,
`source/BUILD.md` for reproducible build instructions, and
[THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) for licensing.
