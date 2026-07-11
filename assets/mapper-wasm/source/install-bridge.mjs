#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import { copyFileSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const EXPECTED_COMMIT = '064e6c943ee963277f1e930bda595723acd3e8c6';
const START = '# >>> OCD2OMAP WASM BRIDGE >>>';
const END = '# <<< OCD2OMAP WASM BRIDGE <<<';
const PLATFORM_START = '# >>> OCD2OMAP WASM PLATFORM >>>';
const PLATFORM_END = '# <<< OCD2OMAP WASM PLATFORM <<<';
const SETTINGS_PERSISTENCE_START = '// >>> OCD2OMAP WASM SETTINGS PERSISTENCE >>>';
const SETTINGS_PERSISTENCE_END = '// <<< OCD2OMAP WASM SETTINGS PERSISTENCE <<<';
const SETTINGS_ACCESS_START = '// >>> OCD2OMAP WASM SETTINGS ACCESS >>>';
const SETTINGS_ACCESS_END = '// <<< OCD2OMAP WASM SETTINGS ACCESS <<<';
const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const mapperRoot = process.argv[2] ? resolve(process.argv[2]) : null;

if (!mapperRoot) {
  console.error('Usage: node scripts/install-bridge.mjs /absolute/path/to/mapper');
  process.exit(2);
}

const cmakePath = join(mapperRoot, 'src', 'CMakeLists.txt');
const rootCmakePath = join(mapperRoot, 'CMakeLists.txt');
const settingsPath = join(mapperRoot, 'src', 'settings.cpp');
if (!existsSync(cmakePath)) {
  console.error(`Not an OpenOrienteering Mapper checkout: ${mapperRoot}`);
  process.exit(2);
}

function replaceMarkedOrAnchored(source, startMarker, endMarker, startAnchor, endAnchor, replacement, label) {
  const markedStart = source.indexOf(startMarker);
  const markedEnd = source.indexOf(endMarker);
  if (markedStart !== -1 && markedEnd > markedStart) {
    return `${source.slice(0, markedStart)}${replacement}${source.slice(markedEnd + endMarker.length)}`;
  }
  const start = source.indexOf(startAnchor);
  const endStart = source.indexOf(endAnchor, start + startAnchor.length);
  if (start === -1 || endStart === -1) {
    throw new Error(`Could not locate ${label} in the pinned Mapper source.`);
  }
  return `${source.slice(0, start)}${replacement}${source.slice(endStart + endAnchor.length)}`;
}

function wrapAnchoredRange(source, startMarker, endMarker, startAnchor, endAnchor, label) {
  const markedStart = source.indexOf(startMarker);
  const markedEnd = source.indexOf(endMarker);
  if (markedStart !== -1 && markedEnd > markedStart) return source;

  const start = source.indexOf(startAnchor);
  const end = source.indexOf(endAnchor, start + startAnchor.length);
  if (start === -1 || end === -1) {
    throw new Error(`Could not locate ${label} in the pinned Mapper source.`);
  }
  const original = source.slice(start, end).trimEnd();
  const replacement = `${startMarker}
#if !defined(__EMSCRIPTEN__)
${original}
#endif
${endMarker}
`;
  return `${source.slice(0, start)}${replacement}${source.slice(end)}`;
}

function replaceMarkedOrBeforeAnchor(source, startMarker, endMarker, startAnchor, endAnchor, replacement, label) {
  const markedStart = source.indexOf(startMarker);
  const markedEnd = source.indexOf(endMarker);
  if (markedStart !== -1 && markedEnd > markedStart) {
    return `${source.slice(0, markedStart)}${replacement}${source.slice(markedEnd + endMarker.length)}`;
  }

  const start = source.indexOf(startAnchor);
  const end = source.indexOf(endAnchor, start + startAnchor.length);
  if (start === -1 || end === -1) {
    throw new Error(`Could not locate ${label} in the pinned Mapper source.`);
  }
  return `${source.slice(0, start)}${replacement}\n\n${source.slice(end)}`;
}

let commit = '';
try {
  commit = execFileSync('git', ['-C', mapperRoot, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
} catch (error) {
  console.error(`Could not inspect Mapper git commit: ${error.message}`);
  process.exit(2);
}
if (commit !== EXPECTED_COMMIT) {
  console.error(`Mapper commit mismatch. Expected ${EXPECTED_COMMIT}, got ${commit}.`);
  process.exit(2);
}

const bridgeSource = join(projectRoot, 'wasm', 'bridge', 'mapper_wasm_bridge.cpp');
const bridgeTarget = join(mapperRoot, 'src', 'mapper_wasm_bridge.cpp');
copyFileSync(bridgeSource, bridgeTarget);

const rootPlatformBlock = `${PLATFORM_START}
# The converter only needs Mapper_Common. Avoid configuring desktop applications,
# documentation, packaging, printing and sensor targets which are not available
# in Qt's WebAssembly SDK.
if(EMSCRIPTEN)
  if(Mapper_USE_GDAL OR Mapper_WITH_COVE)
    message(FATAL_ERROR "MapperConverter requires Mapper_USE_GDAL=OFF and Mapper_WITH_COVE=OFF")
  endif()
  macro(mapper_translations_sources)
  endmacro()
  add_subdirectory("src/sensors")
  add_subdirectory("src")
else()
  add_subdirectory("doc/manual")
  add_subdirectory("examples")
  add_subdirectory("symbol sets")
  add_subdirectory("translations")
  if(Mapper_WITH_COVE)
    add_feature_info(Mapper_WITH_COVE "\${Mapper_WITH_COVE}" "Contour line vectorization")
    add_subdirectory("3rd-party/cove")
  endif()
  if(NOT ANDROID)
    add_subdirectory("3rd-party/qtsingleapplication")
  endif()
  if(Mapper_USE_GDAL)
    add_subdirectory("src/gdal")
  endif()
  if(NOT ANDROID)
    add_subdirectory("src/printsupport")
  endif()
  add_subdirectory("src/sensors")
  add_subdirectory("src")
  add_subdirectory("packaging")
  add_subdirectory("doc/licensing")

  if(CMAKE_CROSSCOMPILING)
    add_custom_target(TEST_WARNING ALL
      COMMENT "Crosscompiling, skipping all tests")
    add_dependencies(TEST_WARNING Mapper)
  else()
    enable_testing()
    add_subdirectory("test")
  endif()

  add_subdirectory("doc/api")
  add_subdirectory("packaging/src")
endif()
${PLATFORM_END}`;

let rootCmake = readFileSync(rootCmakePath, 'utf8');
rootCmake = replaceMarkedOrAnchored(
  rootCmake,
  PLATFORM_START,
  PLATFORM_END,
  '# Subdirectories',
  'add_subdirectory("packaging/src")',
  rootPlatformBlock,
  'top-level subdirectory block',
);
writeFileSync(rootCmakePath, `${rootCmake.trimEnd()}\n`);

const executablePlatformBlock = `${PLATFORM_START}
# The browser converter has its own minimal entry point below. The desktop
# executable depends on QtSingleApplication and packaging-only platform code.
if(NOT EMSCRIPTEN)
# Mapper executable

set(Mapper_SRCS
  main.cpp
)

if(WIN32)
  enable_language(RC)
  configure_file(mingw/resources.rc.in \${CMAKE_CURRENT_BINARY_DIR}/resources.rc @ONLY)
  configure_file(\${PROJECT_SOURCE_DIR}/images/mapper-icon/Mapper.ico \${CMAKE_CURRENT_BINARY_DIR}/Mapper.ico COPYONLY)
  list(APPEND Mapper_SRCS \${CMAKE_CURRENT_BINARY_DIR}/resources.rc)
endif()

if(ANDROID)
  add_library(Mapper SHARED \${Mapper_SRCS})
else()
  add_executable(Mapper WIN32 MACOSX_BUNDLE \${Mapper_SRCS})
  target_compile_definitions(Mapper PRIVATE MAPPER_USE_QTSINGLEAPPLICATION)
  target_link_libraries(Mapper QtSingleApplication)
endif()

target_link_libraries(Mapper
  Mapper_Common
)
target_compile_definitions(Mapper PRIVATE
  QT_NO_CAST_FROM_ASCII
  QT_NO_CAST_TO_ASCII
  QT_USE_QSTRINGBUILDER
)
if(APPLE)
  add_custom_command(
    TARGET Mapper
    POST_BUILD
    COMMAND plutil -replace NSHighResolutionCapable -bool true
      $<TARGET_BUNDLE_DIR:Mapper>/Contents/Info.plist
  )
endif()

install(TARGETS Mapper
  RUNTIME DESTINATION "\${MAPPER_RUNTIME_DESTINATION}"
  BUNDLE DESTINATION "\${MAPPER_RUNTIME_DESTINATION}"
  LIBRARY DESTINATION "\${MAPPER_RUNTIME_DESTINATION}"
)
endif()
${PLATFORM_END}`;

let cmake = readFileSync(cmakePath, 'utf8');
cmake = replaceMarkedOrAnchored(
  cmake,
  PLATFORM_START,
  PLATFORM_END,
  '# Mapper executable',
  '  LIBRARY DESTINATION "${MAPPER_RUNTIME_DESTINATION}"  # Android\n)',
  executablePlatformBlock,
  'desktop Mapper executable block',
);

const addendum = readFileSync(join(projectRoot, 'wasm', 'bridge', 'CMakeLists.addendum.txt'), 'utf8').trim();
const startIndex = cmake.indexOf(START);
const endIndex = cmake.indexOf(END);
if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
  cmake = `${cmake.slice(0, startIndex).trimEnd()}\n\n${cmake.slice(endIndex + END.length).trimStart()}`;
}
const block = `${START}\nset(MAPPER_WASM_BRIDGE_SOURCE "${'${CMAKE_CURRENT_SOURCE_DIR}'}/mapper_wasm_bridge.cpp")\n${addendum}\n${END}`;
writeFileSync(cmakePath, `${cmake.trimEnd()}\n\n${block}\n`);

// Qt 5.15's QSettings implementation for WebAssembly ignores the requested
// format and always starts asynchronous IndexedDB operations. Mapper normally
// creates short-lived QSettings readers, so their callbacks can outlive the
// reader when the converter is embedded as a synchronous function. This
// target has no persistent preferences: use Mapper's registered defaults and
// let the bridge provide the requested legacy OCAD codec explicitly.
let settings = readFileSync(settingsPath, 'utf8');
settings = wrapAnchoredRange(
  settings,
  SETTINGS_PERSISTENCE_START,
  SETTINGS_PERSISTENCE_END,
  '\tQSettings settings;\n',
  '\n}\n\nvoid Settings::registerSetting',
  'Settings constructor persistence block',
);

const settingsAccessBlock = `${SETTINGS_ACCESS_START}
QVariant Settings::getSetting(Settings::SettingsEnum setting) const
{
#if defined(__EMSCRIPTEN__)
\treturn getDefaultValue(setting);
#else
\tQSettings settings;
\treturn settings.value(getSettingPath(setting), getDefaultValue(setting));
#endif
}

QVariant Settings::getSettingCached(Settings::SettingsEnum setting)
{
\tif (settings_cache.contains(setting))
\t\treturn settings_cache.value(setting);

#if defined(__EMSCRIPTEN__)
\tQVariant value = getDefaultValue(setting);
#else
\tQSettings settings;
\tQVariant value = settings.value(getSettingPath(setting), getDefaultValue(setting));
#endif
\tsettings_cache.insert(setting, value);
\treturn value;
}
${SETTINGS_ACCESS_END}`;

settings = replaceMarkedOrBeforeAnchor(
  settings,
  SETTINGS_ACCESS_START,
  SETTINGS_ACCESS_END,
  'QVariant Settings::getSetting(',
  'void Settings::setSettingInCache',
  settingsAccessBlock,
  'Settings default accessors',
);
writeFileSync(settingsPath, `${settings.trimEnd()}\n`);

console.log(`Installed Mapper WASM bridge into ${mapperRoot}`);
console.log(`Pinned source revision: ${commit}`);
