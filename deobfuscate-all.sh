#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT/deobfuscator"

npx tsc

find "$ROOT/archived_game1_scripts" -name 'game1.js' ! -name '*.deobfuscated.js' -print0 | sort -zr | while IFS= read -r -d '' f; do
  echo "==> $f"
  node dist/index.js deobfuscate "$f" "${f}.deobfuscated.js"
done
