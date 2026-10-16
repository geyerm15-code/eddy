#!/bin/bash
# usage: new_project.sh <video> [carpeta_proyecto]
# Crea el proyecto junto al video (por defecto <dir_video>/reel-<nombre>) con studio.py, la marca y las fuentes.
# Marca: usa ~/.eddy/brand.json si existe; si no, el brand.json de la skill.
set -e
VID=$(cd "$(dirname "$1")" && pwd)/$(basename "$1")
STEM=$(basename "${VID%.*}")
DIR=${2:-$(dirname "$VID")/reel-$STEM}
SK=$(cd "$(dirname "$0")/.." && pwd)
mkdir -p "$DIR/audio"
cp -R "$SK/template/." "$DIR/"
cp -R "$SK/fonts" "$DIR/fonts"
cp "$SK/scripts/studio.py" "$SK/scripts/lite.py" "$DIR/"
cp "$SK/scripts/std.rnnn" "$DIR/audio/std.rnnn"
BRAND="$HOME/.eddy/brand.json"
[ -f "$BRAND" ] || BRAND="$SK/brand.json"
cp "$BRAND" "$DIR/brand.json"
# fuentes propias de la marca (si las hay) junto al brand.json del usuario
[ -d "$HOME/.eddy/fonts" ] && cp -R "$HOME/.eddy/fonts/." "$DIR/fonts/"
REL=$(python3 -c "import os,sys;print(os.path.relpath(sys.argv[1],sys.argv[2]))" "$VID" "$DIR")
python3 - "$DIR/studio.json" "$REL" "$DIR/brand.json" <<'PY'
import json, os, sys
p, src, brand = sys.argv[1], sys.argv[2], json.load(open(sys.argv[3]))
claude_ai = os.path.exists("/mnt/user-data")
cfg = {
    "source": src,
    "engine": "lite" if claude_ai else "remotion",
    "style": brand.get("style", "editorial"),
    "face_y": 780,
    "grade": "",
    "replace": {},
    "keywords": brand.get("captions", {}).get("keywords", []),
    "ranges": [],
    "overlays": [],
}
json.dump(cfg, open(p, "w"), indent=2, ensure_ascii=False)
PY
# dependencias Remotion compartidas (se instalan una sola vez) — solo si hay Node
if command -v npx >/dev/null 2>&1 && [ ! -d /mnt/user-data ]; then
  CACHE=~/.cache/eddy
  if [ ! -d "$CACHE/node_modules/remotion" ]; then
    mkdir -p "$CACHE" && cp "$SK/template/animations/package.json" "$CACHE/" && (cd "$CACHE" && npm install --no-audit --no-fund)
  fi
  ln -sfn "$CACHE/node_modules" "$DIR/animations/node_modules"
fi
echo "→ $DIR"
