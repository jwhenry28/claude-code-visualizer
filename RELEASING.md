# Release Process

## Prerequisites

- Bump version in `pyproject.toml`
- Update `CHANGELOG.md` with release notes
- Ensure all tests pass

## Build and Test

```bash
./scripts/deploy.sh
pip install dist/claude-code-visualizer-*.whl
claude-visualizer --help
```

## Publish to PyPI

```bash
twine upload dist/*
```

## Create GitHub Release

1. Tag the release: `git tag v0.1.0`
2. Push tag: `git push origin v0.1.0`
3. Create release on GitHub with changelog
4. Upload wheel and tarball as release assets
