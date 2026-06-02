#!/usr/bin/env python3
"""Build the static O-Composer app into dist/.

This is intentionally lightweight: there is no transpilation or bundling because
the app is written as browser-native ES modules.
"""

from __future__ import annotations

import re
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parent
DIST = ROOT / "dist"


def main() -> None:
    validate_imports()
    validate_no_network_runtime()
    if DIST.exists():
        shutil.rmtree(DIST)
    shutil.copytree(ROOT / "src", DIST / "src")
    shutil.copytree(ROOT / "samples", DIST / "samples")
    shutil.copytree(ROOT / "assets", DIST / "assets")
    shutil.copy2(ROOT / "index.html", DIST / "index.html")
    shutil.copy2(ROOT / "styles.css", DIST / "styles.css")
    shutil.copy2(ROOT / "README.md", DIST / "README.md")
    print(f"Built static app at {DIST}")


def validate_imports() -> None:
    for path in (ROOT / "src").rglob("*.js"):
        text = path.read_text(encoding="utf-8")
        for match in re.finditer(r"from\s+[\"']([^\"']+)[\"']", text):
            specifier = match.group(1)
            if not specifier.startswith("."):
                continue
            target = (path.parent / specifier).resolve()
            if not target.exists():
                raise SystemExit(f"Unresolved import in {path.relative_to(ROOT)}: {specifier}")


def validate_no_network_runtime() -> None:
    offenders = []
    for path in [ROOT / "index.html", ROOT / "styles.css", *list((ROOT / "src").rglob("*.js"))]:
        text = path.read_text(encoding="utf-8")
        has_runtime_url = re.search(r"""(?:src|href|import)\s*=\s*["']https?://|from\s+["']https?://|import\(["']https?://""", text)
        if has_runtime_url:
            offenders.append(path.relative_to(ROOT))
    if offenders:
        raise SystemExit(f"Network runtime URL found in: {', '.join(map(str, offenders))}")


if __name__ == "__main__":
    main()
