#!/usr/bin/env bash
set -euo pipefail

: "${MAPPER_SRC:?Set MAPPER_SRC to the OpenOrienteering Mapper checkout}"
: "${QT_WASM_CMAKE:?Set QT_WASM_CMAKE to the Qt 5 WebAssembly CMake package directory}"
: "${PROJ_WASM_PREFIX:?Set PROJ_WASM_PREFIX to the WebAssembly PROJ install prefix}"

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BUILD_DIR="${BUILD_DIR:-$ROOT/build/mapper-wasm}"

command -v emcmake >/dev/null || { echo 'emcmake was not found. Activate emsdk first.' >&2; exit 2; }
command -v emcc >/dev/null || { echo 'emcc was not found. Activate emsdk first.' >&2; exit 2; }
command -v cmake >/dev/null || { echo 'cmake was not found.' >&2; exit 2; }
command -v ninja >/dev/null || { echo 'ninja was not found.' >&2; exit 2; }

[[ -f "$QT_WASM_CMAKE/Qt5Config.cmake" ]] || {
  echo "Qt5Config.cmake was not found in QT_WASM_CMAKE=$QT_WASM_CMAKE" >&2
  exit 2
}
[[ -f "$PROJ_WASM_PREFIX/lib/libproj.a" ]] || {
  echo "A static WebAssembly libproj.a was not found in $PROJ_WASM_PREFIX/lib" >&2
  exit 2
}
[[ -f "$PROJ_WASM_PREFIX/share/proj/proj.db" ]] || {
  echo "PROJ data was not found in $PROJ_WASM_PREFIX/share/proj" >&2
  exit 2
}

QT_WASM_PREFIX="$(cd "$QT_WASM_CMAKE/../../.." && pwd)"
QT_VERSION="$($QT_WASM_PREFIX/bin/qmake -query QT_VERSION)"
EMCC_VERSION="$(emcc --version | sed -n '1s/.*replacement) \([0-9][0-9.]*\).*/\1/p')"
if [[ "${MAPPER_ALLOW_UNSUPPORTED_TOOLCHAIN:-0}" != 1 ]]; then
  [[ "$QT_VERSION" == 5.15.2 ]] || {
    echo "This verified build requires Qt 5.15.2 wasm_32 (found $QT_VERSION)." >&2
    exit 2
  }
  [[ "$EMCC_VERSION" == 1.39.8 ]] || {
    echo "Qt 5.15.2 wasm_32 requires Emscripten 1.39.8 (found $EMCC_VERSION)." >&2
    exit 2
  }
fi

node "$ROOT/scripts/install-bridge.mjs" "$MAPPER_SRC"

emcmake cmake -S "$MAPPER_SRC" -B "$BUILD_DIR" -G Ninja \
  -DCMAKE_BUILD_TYPE=Release \
  -DCMAKE_POLICY_VERSION_MINIMUM=3.5 \
  -DMapper_QT=Qt5 \
  -DQt5_DIR="$QT_WASM_CMAKE" \
  -DCMAKE_PREFIX_PATH="$PROJ_WASM_PREFIX;$QT_WASM_PREFIX" \
  -DCMAKE_FIND_ROOT_PATH="$QT_WASM_PREFIX;$PROJ_WASM_PREFIX" \
  -DPROJ_DIR="$PROJ_WASM_PREFIX/lib/cmake/proj" \
  -DMAPPER_WASM_PROJ_DATA_DIR="$PROJ_WASM_PREFIX/share/proj" \
  -DBUILD_TESTING=OFF \
  -DMapper_DEVELOPMENT_BUILD=OFF \
  -DMapper_AUTORUN_SYSTEM_TESTS=OFF \
  -DMapper_AUTORUN_MANUAL_TESTS=OFF \
  -DMapper_USE_GDAL=OFF \
  -DMapper_WITH_COVE=OFF \
  -DMapper_BUILD_CLIPPER=ON \
  -DMapper_PACKAGE_PROJ=OFF \
  -DMapper_PACKAGE_GDAL=OFF \
  -DMapper_PACKAGE_QT=OFF \
  -DMapper_PACKAGE_ASSISTANT=OFF

cmake --build "$BUILD_DIR" --target MapperConverter
mkdir -p "$ROOT/wasm/dist"
rm -f "$ROOT/wasm/dist/mapper-converter.js" \
      "$ROOT/wasm/dist/mapper-converter.wasm" \
      "$ROOT/wasm/dist/mapper-converter.data" \
      "$ROOT/wasm/dist/mapper-converter.worker.js"
cp "$BUILD_DIR/src/mapper-converter.js" "$ROOT/wasm/dist/"
cp "$BUILD_DIR/src/mapper-converter.wasm" "$ROOT/wasm/dist/"
find "$BUILD_DIR/src" -maxdepth 1 -type f \( -name 'mapper-converter.data' -o -name 'mapper-converter.worker.js' \) \
  -exec cp {} "$ROOT/wasm/dist/" \;

echo "WASM artifacts copied to $ROOT/wasm/dist"
ls -lh "$ROOT"/wasm/dist/mapper-converter.*
