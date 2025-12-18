# GitHub Actions Workflows

This directory contains CI/CD workflows for the MySQL VS Code extension.

## Workflows

### CI (`ci.yml`)
**Triggers:**
- Every push to any branch
- Pull requests to `main` branch

**What it does:**
- Tests on Node.js 18.x and 20.x
- Runs linter (ESLint)
- Compiles TypeScript
- Builds VSIX package
- Uploads VSIX as artifact (available for 30 days)

**Artifacts:** You can download the built VSIX from the "Actions" tab after each run.

### Release (`release.yml`)
**Triggers:**
- Push to `main` branch (when PRs are merged)
- Tags matching `v*.*.*` (e.g., v1.0.0)

**What it does:**
- Builds production VSIX with optimizations
- Creates GitHub Release with version from package.json
- Attaches VSIX file to the release
- Generates release notes with installation instructions

## Usage

### For Development (CI)
1. Push code to any branch
2. CI automatically runs and validates the build
3. Check "Actions" tab for build status
4. Download VSIX artifact to test locally

### For Releases
**Option 1: Merge to main (automatic versioning)**
1. Merge PR to `main` branch
2. Release workflow automatically creates a release with the version from package.json
3. Release is created as `v{version}` (e.g., v1.0.0)

**Option 2: Manual release with tags**
1. Update version in `package.json`
2. Commit and push to main
3. Create and push a tag:
   ```bash
   git tag v1.0.0
   git push origin v1.0.0
   ```
4. Release workflow creates GitHub release

### Versioning
- Version is automatically read from `package.json`
- Update the version number before merging to main for a new release
- Follow semantic versioning: MAJOR.MINOR.PATCH

## Permissions
The release workflow requires `contents: write` permission to create releases. This is configured in the workflow file.
