#!/usr/bin/env bash
# Refresh the read-only copy of meritum-design-system files in design-system/.
#   pnpm sync            copy from the design system's main
#   pnpm sync <ref>      copy from another branch, tag or commit
# Never edit the copied files by hand: pnpm test (tests/design-system-copy.test.ts)
# checks them against design-system/SHA256SUMS. Change them in meritum-design-system,
# then run this script. Mirrors contracts/sync.sh in meritum-design-system.
# Needs `gh` signed in with read access to Meritum-HackNation2026/meritum-design-system.
set -euo pipefail
cd "$(dirname "$0")/../design-system"
repo=Meritum-HackNation2026/meritum-design-system
ref=$(gh api "repos/$repo/commits/${1:-main}" --jq .sha)
files=(
  contracts/meritum.ts
  copy/pl.json
  tokens/meritum.css
  extension/widget.css
  extension/popup/popup.css
  extension/popup/popup.html
  extension/popup/popup.js
  extension/popup/states.html
)
for f in "${files[@]}"; do
  mkdir -p "$(dirname "$f")"
  # The contents API path is a URL: encode spaces, the array keeps names whole.
  gh api -H 'Accept: application/vnd.github.raw' "repos/$repo/contents/${f// /%20}?ref=$ref" >"$f"
done

printf 'meritum-design-system %s\n' "$ref" >SOURCE
sha256sum "${files[@]}" >SHA256SUMS
echo "design system synced from $repo@${ref:0:12}"
