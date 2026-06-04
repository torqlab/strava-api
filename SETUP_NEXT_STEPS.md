# Semantic Release Setup Checklist

## Completed ✅
- [x] Install semantic-release dependencies
- [x] Configure .releaserc.json
- [x] Update publish.yml workflow
- [x] Reset CHANGELOG.md
- [x] Commit migration changes
- [x] Create migration guide

## Before First Release 🔧
You need to set up **NPM_TOKEN** in GitHub Secrets:

1. Go to your GitHub repo
2. Settings → Secrets and variables → Actions
3. Click "New repository secret"
4. Name: `NPM_TOKEN`
5. Value: Generate at https://www.npmjs.com/settings/tokens (auth-only or publish)
6. Click "Add secret"

**GITHUB_TOKEN is automatic** (provided by GitHub Actions)

## First Test Release 🧪
Once NPM_TOKEN is set:

1. Merge this branch (`chore/0-claude-symlink`) to `main`
2. GitHub Actions will run semantic-release
3. It will detect the semantic-release setup commit and bump to **v1.4.0** (feat commits detected)
4. Package will auto-publish to npm
5. CHANGELOG.md will be auto-generated with release notes

## Going Forward 📝
- Write commits with Conventional Commits format (see SEMANTIC_RELEASE_GUIDE.md)
- Every merge to main triggers automatic release
- No more manual versioning or changelog editing
- Git history becomes the source of truth

## Optional: GitHub Release Notes
After first release, you'll see:
- Automatic GitHub Releases created with release notes
- Git tags with version numbers (v1.4.0, etc.)
- Release notes pulled from commit messages and PR descriptions
