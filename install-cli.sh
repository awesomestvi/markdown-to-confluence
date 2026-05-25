#!/bin/bash

# Build and install CLI locally

set -e

echo "🔧 Building and installing CLI..."
echo ""

echo "📦 Installing dependencies..."
npm install

echo "🏗️  Building TypeScript..."
npm run build

echo "🔗 Creating global symlink..."
npm link

echo ""
echo "✅ CLI installed successfully!"
echo ""
echo "You can now use:"
echo "  mdc --help"
echo "  mdc upload README.md -t \"My Page\""
echo ""
