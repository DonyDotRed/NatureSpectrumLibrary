#!/usr/bin/env sh
cd "$(dirname "$0")"
echo "NatureSpectrumLibrary: http://localhost:8000"
python3 -m http.server 8000 -d site
