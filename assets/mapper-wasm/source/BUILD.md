# 构建官方 OpenOrienteering Mapper WebAssembly 转换核心

## 目标

构建出的模块不是重新实现 OCAD，而是直接执行 Mapper 的：

```text
OcdFileImport::doImport()
  → Importer::validate()
  → XMLFileExporter::doExport()
```

输入和输出都使用 `QBuffer`，不依赖服务器文件系统。

## 已验证工具链

仓库内的 `wasm/dist/mapper-converter.{js,wasm,data}` 使用以下组合构建：

| 组件 | 已验证版本 | 要求 |
| --- | --- | --- |
| OpenOrienteering Mapper | `064e6c943ee963277f1e930bda595723acd3e8c6` | `install-bridge.mjs` 会拒绝其他提交 |
| Qt for WebAssembly | `5.15.2`、`wasm_32` | 需要 Core、Gui 和 Widgets；Qt Sensors/Positioning 是可选组件 |
| Emscripten | `1.39.8` | 必须与 Qt 5.15.2 `wasm_32` 的 ABI 一致 |
| PROJ | `7.2.1` | 同一 Emscripten 构建的静态 `libproj.a`，并安装 `share/proj/proj.db` |
| SQLite | `3.34.1` amalgamation | 用同一 Emscripten 构建，供 PROJ 静态链接 |

此外需要 Node.js、CMake、Ninja、Git，以及用于生成 PROJ 数据库的宿主机 `sqlite3` 命令。
`scripts/build-wasm.sh` 默认严格检查 Qt `5.15.2` 与 Emscripten `1.39.8`。设置
`MAPPER_ALLOW_UNSUPPORTED_TOOLCHAIN=1` 可以跳过版本检查，但这样的组合不属于本项目已验证范围。

> Apple Silicon 注意：Qt 5.15.2 官方 `wasm_32` 主机工具是 x86_64 程序，需要 Rosetta 2。旧版 emsdk
> 也应显式安装 x86_64 release；否则 emsdk 可能尝试获取并不存在的旧 arm64 归档。

## 1. 准备 Qt 与 Emscripten

以下 macOS 示例使用 aqtinstall 取得 Qt 官方归档：

```bash
python3 -m venv /tmp/aqt-venv
source /tmp/aqt-venv/bin/activate
python -m pip install 'aqtinstall==3.3.0'
aqt install-qt mac desktop 5.15.2 wasm_32 -O /absolute/path/to/qt-wasm

export QT_WASM_CMAKE=/absolute/path/to/qt-wasm/5.15.2/wasm_32/lib/cmake/Qt5
"${QT_WASM_CMAKE}/../../../bin/qmake" -query QT_VERSION
```

安装与该 Qt 包匹配的 Emscripten release：

```bash
git clone https://github.com/emscripten-core/emsdk.git /absolute/path/to/emsdk
cd /absolute/path/to/emsdk
export EMSDK_RELEASE=releases-9e60f34accb4627d7358223862a7e74291886ab6-64bit
EMSDK_ARCH=x86_64 ./emsdk install "$EMSDK_RELEASE"
EMSDK_ARCH=x86_64 ./emsdk activate "$EMSDK_RELEASE"
source ./emsdk_env.sh
emcc --version
```

最后一条命令应报告 `1.39.8`。每次新开终端后，都要再次 `source emsdk_env.sh`。

## 2. 构建 SQLite 与 PROJ

PROJ 必须与 Mapper 使用相同的 Emscripten。下面给出与内置产物一致的最小静态构建；路径可自行调整：

```bash
curl -LO https://www.sqlite.org/2021/sqlite-amalgamation-3340100.zip
unzip sqlite-amalgamation-3340100.zip
mkdir -p /absolute/path/to/sqlite-wasm/include /absolute/path/to/sqlite-wasm/lib
cp sqlite-amalgamation-3340100/sqlite3.h \
   sqlite-amalgamation-3340100/sqlite3ext.h \
   /absolute/path/to/sqlite-wasm/include/
emcc -O2 -DSQLITE_OMIT_LOAD_EXTENSION=1 -DSQLITE_THREADSAFE=0 \
  -c sqlite-amalgamation-3340100/sqlite3.c -o /tmp/sqlite3-wasm.o
emar rcs /absolute/path/to/sqlite-wasm/lib/libsqlite3.a /tmp/sqlite3-wasm.o

curl -LO https://download.osgeo.org/proj/proj-7.2.1.tar.gz
tar xf proj-7.2.1.tar.gz
emcmake cmake -S proj-7.2.1 -B /absolute/path/to/proj-wasm-build -G Ninja \
  -DCMAKE_BUILD_TYPE=Release \
  -DCMAKE_INSTALL_PREFIX=/absolute/path/to/proj-wasm \
  -DBUILD_SHARED_LIBS=OFF \
  -DBUILD_TESTING=OFF \
  -DBUILD_CCT=OFF \
  -DBUILD_CS2CS=OFF \
  -DBUILD_GEOD=OFF \
  -DBUILD_GIE=OFF \
  -DBUILD_PROJ=OFF \
  -DBUILD_PROJINFO=OFF \
  -DBUILD_PROJSYNC=OFF \
  -DENABLE_CURL=OFF \
  -DENABLE_TIFF=OFF \
  -DSQLITE3_INCLUDE_DIR=/absolute/path/to/sqlite-wasm/include \
  -DSQLITE3_LIBRARY=/absolute/path/to/sqlite-wasm/lib/libsqlite3.a \
  -DEXE_SQLITE3="$(command -v sqlite3)"
cmake --build /absolute/path/to/proj-wasm-build
cmake --install /absolute/path/to/proj-wasm-build
```

完成后以下两个文件必须存在：

```text
/absolute/path/to/proj-wasm/lib/libproj.a
/absolute/path/to/proj-wasm/share/proj/proj.db
```

## 3. 获取固定版本 Mapper 源码

```bash
git clone https://github.com/OpenOrienteering/mapper.git mapper
cd mapper
git checkout 064e6c943ee963277f1e930bda595723acd3e8c6
```

## 4. 安装桥接与平台补丁

在本项目目录运行：

```bash
node scripts/install-bridge.mjs /absolute/path/to/mapper
```

脚本会：

- 验证 Mapper checkout 的 commit；
- 复制 `mapper_wasm_bridge.cpp` 到 Mapper 的 `src/`；
- 向 `src/CMakeLists.txt` 加入带唯一标记的 `MapperConverter` 目标；
- 在 `EMSCRIPTEN` 构建中仅配置转换核心所需的 `src/sensors` 和 `src`，跳过桌面程序、文档、示例、
  翻译、打印、打包和测试目标；
- 让 WebAssembly 转换目标读取 Mapper 的已注册默认设置，避免 Qt 5.15 的短生命周期 `QSettings`
  触发延迟 IndexedDB 回调；转换器没有持久首选项，字符编码由桥接参数显式提供；
- 保留 `Mapper_Common` 的 OCAD、Map、Object、Symbol、Template、XML 及传感器相关源码；
- 重复执行时更新而不会重复追加。

脚本会修改固定 Mapper checkout 的两个 CMake 文件和 `src/settings.cpp`，因此该 checkout 出现工作树改动是正常现象。补丁使用
`OCD2OMAP WASM` 标记，重复执行是幂等的。正常运行 `build-wasm.sh` 时会自动调用此安装步骤，单独执行
主要用于预先检查 checkout。

## 5. 配置与编译

示例：

```bash
export MAPPER_SRC=/absolute/path/to/mapper
export QT_WASM_CMAKE=/absolute/path/to/qt5-wasm/lib/cmake/Qt5
export PROJ_WASM_PREFIX=/absolute/path/to/proj-wasm-prefix

source /absolute/path/to/emsdk/emsdk_env.sh

./scripts/build-wasm.sh
```

默认构建目录是本项目的 `build/mapper-wasm`；可通过 `BUILD_DIR=/absolute/path` 覆盖。脚本会配置
Mapper 的 Qt/PROJ 查找路径、禁用 GDAL/COVE/桌面打包和测试，构建 `MapperConverter`，然后复制产物到
本项目的 `wasm/dist/`。CMake 4 环境也会传入兼容旧 Mapper CMake 文件所需的 policy 下限。

## 6. 构建产物

脚本成功后会自动放置：

```text
wasm/dist/mapper-converter.js
wasm/dist/mapper-converter.wasm
wasm/dist/mapper-converter.data
```

`.data` 由 `--preload-file` 生成，包含完整的 PROJ 数据目录，并在浏览器虚拟文件系统中挂载为
`/share/proj`。桥接入口把 `PROJ_LIB` 指向该目录，因此 `.data` 与 `.wasm` 一样是必需产物。
如果所选 Qt 配置另外生成 `mapper-converter.worker.js`，脚本也会复制它；当前已验证的单线程
Qt 5.15.2 构建不会生成该文件。

## 7. 验证

先执行不依赖浏览器的检查：

```bash
npm test
npm run check
bash -n scripts/build-wasm.sh
node --check scripts/install-bridge.mjs
```

`npm test` 包含 `samples/shahe.ocd` 的 JavaScript 兼容解析回归，但不会加载或执行 WASM。

启动静态服务器（不要直接双击 `index.html`）并打开 `http://localhost:8080/`：

```bash
python3 -m http.server 8080
```

转换后的结果页应显示：

```text
官方 Mapper WASM
OpenOrienteering Mapper 064e6c...
```

用 `samples/shahe.ocd` 执行一次转换，并在浏览器开发者工具中确认
`mapper-converter.js`、`mapper-converter.wasm`、`mapper-converter.data` 都返回成功，控制台没有模块初始化
错误。再下载 `.omap` 并在目标应用中导入。

产物存在、页面显示官方模式和 XML 可解析，只证明官方转换链已运行；与某份参考 OMAP 的可见内容或
Canvas 是否一致，需要在相同应用版本、视口、缩放和渲染设置下另行对比。本构建说明不把该集成结果
预设为已通过。

如果本机同时运行转换器与 O-Composer，可执行自动化集成验收：

```bash
PLAYWRIGHT_MODULE=/absolute/path/to/playwright/index.mjs npm run test:integration
```

## 导出的 C API

```c
int mapper_convert_ocd(const uint8_t* data, uint32_t size,
                       const char* legacy_encoding);
const uint8_t* mapper_output_data(void);
uint32_t mapper_output_size(void);
const char* mapper_warnings_json(void);
const char* mapper_error_text(void);
const char* mapper_core_revision(void);
```

输出内存由模块持有，下一次转换时失效；JS adapter 会立即复制为独立 `Uint8Array`。
