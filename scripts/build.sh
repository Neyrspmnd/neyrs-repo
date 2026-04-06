#!/bin/bash

set -e

echo "🔨 Building Neyrs Core..."

echo "📦 Installing dependencies..."
npm install

echo "🦀 Building Rust parser..."
cd core-parser
cargo build --release
cd ..

echo "📝 Type checking..."
npm run type-check

echo "🎨 Linting code..."
npm run lint

echo "🧪 Running tests..."
npm run test

echo "🏗️  Building TypeScript..."
npm run build

echo "✅ Build complete!"
echo ""
echo "📊 Build artifacts:"
echo "  - TypeScript: ./dist/"
echo "  - Rust: ./core-parser/target/release/"
