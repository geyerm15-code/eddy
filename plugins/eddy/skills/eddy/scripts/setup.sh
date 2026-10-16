#!/bin/bash
# Instala lo que Eddy necesita. Seguro de repetir: solo instala lo que falta.
#   bash setup.sh          -> dependencias base (ffmpeg, Pillow, numpy, faster-whisper)
#   bash setup.sh --full   -> además Node (motor Remotion 4K) si no está
set -e
FULL=$([ "$1" = "--full" ] && echo 1 || echo 0)
have() { command -v "$1" >/dev/null 2>&1; }
PIP="python3 -m pip install --quiet --upgrade"

if [ -d /mnt/user-data ]; then
  echo "· claude.ai: instalando paquetes de Python (ffmpeg viene en imageio-ffmpeg)"
  $PIP pillow numpy imageio-ffmpeg faster-whisper 2>/dev/null || $PIP --break-system-packages pillow numpy imageio-ffmpeg faster-whisper
  echo "✓ listo (motor lite)"; exit 0
fi

OS=$(uname -s)
if ! have ffmpeg; then
  echo "· instalando ffmpeg"
  if [ "$OS" = "Darwin" ]; then
    have brew || { echo "✗ falta Homebrew: instálalo desde https://brew.sh y vuelve a correr este script"; exit 1; }
    brew install ffmpeg
  elif have apt-get; then sudo apt-get update -qq && sudo apt-get install -y ffmpeg
  elif have winget; then winget install --id Gyan.FFmpeg -e
  else echo "✗ instala ffmpeg manualmente: https://ffmpeg.org/download.html"; exit 1; fi
fi
have python3 || { echo "✗ falta Python 3.10+: https://www.python.org/downloads/"; exit 1; }
echo "· paquetes de Python"
$PIP pillow numpy faster-whisper 2>/dev/null || $PIP --user pillow numpy faster-whisper \
  || $PIP --break-system-packages pillow numpy faster-whisper
if [ "$FULL" = 1 ] && ! have npx; then
  echo "· instalando Node (motor Remotion)"
  if [ "$OS" = "Darwin" ]; then brew install node
  elif have apt-get; then sudo apt-get install -y nodejs npm
  elif have winget; then winget install --id OpenJS.NodeJS.LTS -e
  else echo "✗ instala Node 18+: https://nodejs.org"; fi
fi
echo "✓ Eddy listo. Motor: $(have npx && echo 'remotion (4K)' || echo 'lite (1080p) — bash setup.sh --full para 4K')"
