#!/bin/bash
set -e

echo "========================================"
echo "Claude Code Visualizer - Local Install"
echo "========================================"
echo ""

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( cd "$SCRIPT_DIR/.." && pwd )"

cd "$PROJECT_ROOT"

echo "📦 Installing backend dependencies..."
pip install -e ".[dev]"
echo "✓ Backend dependencies installed"
echo ""

echo "📦 Installing frontend dependencies..."
cd frontend
npm install
echo "✓ Frontend dependencies installed"
echo ""

echo "🔨 Building frontend for production..."
npm run build
echo "✓ Frontend built"
echo ""

echo "📋 Copying built frontend to package..."
cd "$PROJECT_ROOT"
mkdir -p src/visualizer/static
rm -rf src/visualizer/static/*
cp -r frontend/dist/* src/visualizer/static/
echo "✓ Frontend copied to static/"
echo ""

echo "========================================"
echo "✅ Installation complete!"
echo "========================================"
echo ""
echo "You can now run:"
echo "  claude-visualizer"
echo ""
echo "For development with hot reload:"
echo "  Terminal 1: python -m visualizer"
echo "  Terminal 2: cd frontend && npm run dev"
echo "  Then visit: http://localhost:5173"
echo ""
