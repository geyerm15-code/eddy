#!/bin/bash
# Genera dist/eddy.zip para subir en claude.ai → Ajustes → Capacidades → Skills.
set -e
cd "$(dirname "$0")"
mkdir -p dist && rm -f dist/eddy.zip
(cd plugins/eddy/skills && zip -qr ../../../dist/eddy.zip eddy -x '*/node_modules/*' '*.DS_Store' '*/__pycache__/*')
ls -lh dist/eddy.zip
