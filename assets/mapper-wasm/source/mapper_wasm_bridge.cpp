/*
 * Thin WebAssembly bridge around OpenOrienteering Mapper's real
 * OcdFileImport -> Map -> XMLFileExporter pipeline.
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

#include <cstdint>
#include <exception>
#include <limits>
#include <new>
#include <vector>

#include <QApplication>
#include <QBuffer>
#include <QByteArray>
#include <QJsonArray>
#include <QJsonDocument>
#include <QString>
#include <QTextCodec>

#include <emscripten/emscripten.h>

#include "core/map.h"
#include "core/map_view.h"
#include "fileformats/ocd_file_import.h"
#include "fileformats/xml_file_format_p.h"

using namespace OpenOrienteering;

namespace {
QByteArray output_data;
QByteArray warnings_json{"[]"};
QByteArray error_text;

QByteArray warningsToJson(const std::vector<QString>& first,
                          const std::vector<QString>& second = {})
{
    QJsonArray array;
    for (const auto& warning : first)
        array.append(warning);
    for (const auto& warning : second)
        array.append(warning);
    return QJsonDocument(array).toJson(QJsonDocument::Compact);
}

void setFailure(const QString& message)
{
    output_data.clear();
    error_text = message.toUtf8();
}
}

extern "C" {

EMSCRIPTEN_KEEPALIVE
int mapper_convert_ocd(const std::uint8_t* data,
                       std::uint32_t size,
                       const char* legacy_encoding)
{
    output_data.clear();
    warnings_json = "[]";
    error_text.clear();

    if (!data && size != 0) {
        setFailure(QStringLiteral("Input pointer is null."));
        return 0;
    }
    if (size > static_cast<std::uint32_t>(std::numeric_limits<int>::max())) {
        setFailure(QStringLiteral("The OCAD input is too large for Qt's in-memory buffer."));
        return 0;
    }

    try {
        QByteArray input(reinterpret_cast<const char*>(data), static_cast<int>(size));
        QBuffer input_device(&input);
        if (!input_device.open(QIODevice::ReadOnly)) {
            setFailure(QStringLiteral("Could not open the in-memory OCAD input."));
            return 0;
        }

        Map map;
        MapView view(nullptr, &map);
        OcdFileImport importer(QStringLiteral("/input.ocd"), &map, &view);
        importer.setDevice(&input_device);

        const QByteArray codec_name = legacy_encoding && *legacy_encoding
                ? QByteArray(legacy_encoding)
                : QByteArrayLiteral("Windows-1252");
        if (auto* codec = QTextCodec::codecForName(codec_name))
            importer.setCustom8BitEncoding(codec);
        else {
            setFailure(QStringLiteral("Qt does not provide the requested legacy encoding: %1")
                       .arg(QString::fromUtf8(codec_name)));
            return 0;
        }

        if (!importer.doImport()) {
            warnings_json = warningsToJson(importer.warnings());
            const auto& warnings = importer.warnings();
            setFailure(warnings.empty()
                       ? QStringLiteral("OpenOrienteering Mapper failed to import the OCAD data.")
                       : warnings.back());
            return 0;
        }

        QBuffer output_device(&output_data);
        if (!output_device.open(QIODevice::WriteOnly)) {
            setFailure(QStringLiteral("Could not open the in-memory OMAP output."));
            return 0;
        }

        std::vector<QString> exporter_warnings;
        {
            XMLFileExporter exporter(QStringLiteral("/output.omap"), &map, &view);
            exporter.setDevice(&output_device);
            exporter.setOption(QStringLiteral("autoFormatting"), false);
            if (!exporter.doExport()) {
                warnings_json = warningsToJson(importer.warnings(), exporter.warnings());
                const auto& warnings = exporter.warnings();
                setFailure(warnings.empty()
                           ? QStringLiteral("OpenOrienteering Mapper failed to export OMAP XML.")
                           : warnings.back());
                return 0;
            }
            exporter_warnings = exporter.warnings();
        }

        output_device.close();
        if (output_data.isEmpty()) {
            setFailure(QStringLiteral("OpenOrienteering Mapper produced an empty OMAP document."));
            return 0;
        }
        warnings_json = warningsToJson(importer.warnings(), exporter_warnings);
        return 1;
    }
    catch (const std::exception& exception) {
        setFailure(QString::fromUtf8(exception.what()));
        return 0;
    }
    catch (...) {
        setFailure(QStringLiteral("Unknown exception in the Mapper WebAssembly converter."));
        return 0;
    }
}

EMSCRIPTEN_KEEPALIVE
const std::uint8_t* mapper_output_data()
{
    return reinterpret_cast<const std::uint8_t*>(output_data.constData());
}

EMSCRIPTEN_KEEPALIVE
std::uint32_t mapper_output_size()
{
    return static_cast<std::uint32_t>(output_data.size());
}

EMSCRIPTEN_KEEPALIVE
const char* mapper_warnings_json()
{
    return warnings_json.constData();
}

EMSCRIPTEN_KEEPALIVE
const char* mapper_error_text()
{
    return error_text.constData();
}

EMSCRIPTEN_KEEPALIVE
const char* mapper_core_revision()
{
    return "OpenOrienteering Mapper 064e6c943ee963277f1e930bda595723acd3e8c6";
}

} // extern "C"

int main(int argc, char** argv)
{
    // Keep Qt's WebAssembly event dispatcher alive for the GUI, font and image
    // services used synchronously by later bridge calls.
    auto* app = new QApplication(argc, argv);
    app->setApplicationName(QStringLiteral("MapperConverter"));
    app->setOrganizationName(QStringLiteral("OpenOrienteering"));
    qputenv("PROJ_LIB", QByteArrayLiteral("/share/proj"));
    return app->exec();
}
