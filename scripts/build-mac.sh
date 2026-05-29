#!/usr/bin/env bash
# Build the macOS app (.app). Run this ON A MAC. See BUILD.md.
set -e
cd "$(dirname "$0")/.."

if [ ! -f src/main/bundled-config.json ]; then
  echo "⚠  src/main/bundled-config.json is missing — the build will have NO baked API key."
  echo "   Run:  cp src/main/bundled-config.example.json src/main/bundled-config.json"
  echo "   then paste your key into it, and re-run this script."
  echo ""
fi

echo "→ installing dependencies…"
npm install

echo "→ building macOS app…"
npx electron-builder --mac dir

echo ""
echo "✓ Done. Look in release/ for 'Blog Generator.app'."
echo "  Zip it and share. First launch on each Mac: right-click the app → Open."
echo "  If macOS says it's damaged:  xattr -cr \"/path/to/Blog Generator.app\""
