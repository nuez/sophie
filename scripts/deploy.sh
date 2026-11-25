#!/bin/sh
# Build and publish dist/ to the gh-pages branch (served at https://sophie.nuezweb.com).
# Uses a temporary index so the main branch and working tree are untouched.
set -e
cd "$(dirname "$0")/.."
npm run build
IDX=$(mktemp -u)
GIT_INDEX_FILE="$IDX" git --work-tree=dist add -A
TREE=$(GIT_INDEX_FILE="$IDX" git write-tree)
rm -f "$IDX"
COMMIT=$(git commit-tree "$TREE" -m "Deploy $(date '+%Y-%m-%d %H:%M')")
git push -q -f origin "$COMMIT:refs/heads/gh-pages"
echo "Deployed $COMMIT to gh-pages"
