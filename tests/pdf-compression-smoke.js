import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { inflateSync } from "node:zlib";
import { compressPdfStreamBytes, createVectorMapPdfBlob, mergePdfBlobs } from "../src/domain/pdf-exporter.js";

const originalCompressionStream = globalThis.CompressionStream;
const originalFetch = globalThis.fetch;
try {
  globalThis.CompressionStream = undefined;
  const source = new TextEncoder().encode("100.25 200.5 m\n101.25 201.5 l\n".repeat(10000));
  const compressed = await compressPdfStreamBytes(source);
  assert.ok(compressed.length < source.length / 4, "fallback should materially compress vector PDF commands");
  assert.deepEqual(inflateSync(compressed), Buffer.from(source), "fallback output must be a valid lossless zlib stream");

  globalThis.fetch = async input => {
    const path = resolve(process.cwd(), String(input).replace(/^\.\//, ""));
    return new Response(await readFile(path), { status: 200 });
  };
  const blob = await createVectorMapPdfBlob({
    pageWidthMm: 210,
    pageHeightMm: 297,
    canvasWidth: 1000,
    canvasHeight: 1400,
    losslessCompression: true,
    draw: ctx => {
      for (let index = 0; index < 10000; index += 1) {
        ctx.beginPath();
        ctx.moveTo(index % 1000, index % 1400);
        ctx.lineTo((index + 17) % 1000, (index + 31) % 1400);
        ctx.stroke();
      }
    }
  });
  const pdfBytes = new Uint8Array(await blob.arrayBuffer());
  const pdfText = new TextDecoder("latin1").decode(pdfBytes);
  assert.match(pdfText, /\/Filter \/FlateDecode/, "built PDF streams must reference their compressed bytes");
  assert.ok(pdfBytes.length < 1_500_000, "built PDF should not contain the five Latin fonts and vector commands uncompressed");
  const mergedBlob = await mergePdfBlobs([blob, blob]);
  const mergedBytes = new Uint8Array(await mergedBlob.arrayBuffer());
  const mergedText = new TextDecoder("latin1").decode(mergedBytes);
  assert.match(mergedText, /\/Filter \/FlateDecode/, "multi-page assembly must preserve compressed page and font streams");
  assert.ok(mergedBytes.length < 3_000_000, "multi-page assembly should not expand compressed streams");
}
finally {
  globalThis.CompressionStream = originalCompressionStream;
  globalThis.fetch = originalFetch;
}

console.log("PDF compression smoke test passed.");
