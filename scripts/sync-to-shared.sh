#!/bin/bash
# sync-to-shared.sh — Push local code to shared repo
# Usage: sync-to-shared.sh [category] [source_dir]

set -e

MESH_PROTOCOLS="/root/clawd/mesh-protocols"
CATEGORY="${1:-voltagent}"
SOURCE="${2:-/root/clawd/voltagent}"

echo "🔄 Syncing $CATEGORY from $SOURCE to shared repo..."

# Ensure shared dir exists
mkdir -p "$MESH_PROTOCOLS/shared/$CATEGORY"

# Copy files (excluding node_modules, state files, etc.)
rsync -av --exclude='node_modules' \
          --exclude='*.session' \
          --exclude='*state*.json' \
          --exclude='*.log' \
          --exclude='.git' \
          "$SOURCE/" "$MESH_PROTOCOLS/shared/$CATEGORY/"

cd "$MESH_PROTOCOLS"

# Check if there are changes
if git diff --quiet && git diff --staged --quiet; then
    echo "✅ No changes to sync"
    exit 0
fi

# Commit and push
git add .
git commit -m "sync($CATEGORY): push latest from $(hostname)"
git push origin main

echo "✅ Synced $CATEGORY to shared repo"
