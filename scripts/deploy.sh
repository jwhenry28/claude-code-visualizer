#!/bin/bash
set -e

echo "Building frontend..."
cd frontend
npm run build
cd ..

echo "Copying frontend to package..."
mkdir -p src/visualizer/static
cp -r frontend/dist/* src/visualizer/static/

echo "Building Python package..."
python -m build

echo "Checking package with twine..."
twine check dist/*

echo "Build complete! Package ready in dist/"
echo ""
echo "To publish to PyPI:"
echo "  twine upload dist/*"
