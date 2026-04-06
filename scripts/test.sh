#!/bin/bash

set -e

echo "🧪 Running Neyrs Test Suite..."

echo "📝 Type checking..."
npm run type-check

echo "🎨 Linting..."
npm run lint

echo "🧪 Running unit tests..."
npm run test

echo "📊 Generating coverage report..."
npm run test:coverage

echo "🦀 Running Rust tests..."
cd core-parser
cargo test
cd ..

echo "✅ All tests passed!"
