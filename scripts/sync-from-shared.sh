#!/bin/bash
# sync-from-shared.sh — Pull shared code to local workspace
# Usage: sync-from-shared.sh [category] [dest_dir]

set -e

MESH_PROTOCOLS="/root/clawd/mesh-protocols"
CATEGORY="${1:-voltagent}"
DEST="${2:-/root/clawd/$CATEGORY}"

echo "🔄 Pulling latest from shared repo..."

cd "$MESH_PROTOCOLS"
git pull origin main

echo "📦 Copying $CATEGORY to $DEST..."

# Ensure dest exists
mkdir -p "$DEST"

# Copy files
rsync -av --exclude='node_modules' \
          --exclude='.git' \
          "$MESH_PROTOCOLS/shared/$CATEGORY/" "$DEST/"

echo "✅ Synced $CATEGORY from shared repo to $DEST"
