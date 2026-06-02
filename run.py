#!/usr/bin/env python3
from __future__ import annotations

import http.server
import functools
import os
import socketserver
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
DIST = ROOT / "dist"
PORT = int(os.environ.get("PORT", "5180"))
HOST = os.environ.get("HOST", "0.0.0.0")


def main() -> None:
    subprocess.check_call([sys.executable, str(ROOT / "build.py")], cwd=ROOT)
    handler = functools.partial(NoCacheHTTPRequestHandler, directory=str(DIST))
    with ReusableTCPServer((HOST, PORT), handler) as server:
        print(f"Serving O-Composer at http://127.0.0.1:{PORT}/")
        print(f"Serving O-Composer at http://localhost:{PORT}/")
        server.serve_forever()


class NoCacheHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self) -> None:
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()


class ReusableTCPServer(socketserver.TCPServer):
    allow_reuse_address = True


if __name__ == "__main__":
    main()
