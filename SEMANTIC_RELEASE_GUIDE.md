# Semantic Release Migration Guide

## ✅ What Changed

- **Versioning**: Now automatic based on commit types (feat → minor, fix → patch, chore → no version bump)
- **Changelog**: Auto-generated from git history using `@semantic-release/changelog`
- **Publishing**: Triggered automatically on every push to `main` via GitHub Actions
- **Version bumps**: No longer manual; determined by commit messages

## 📝 Commit Message Format (Conventional Commits)

All new commits must follow this format:

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types:
- **feat**: A new feature (bumps MINOR version)
- **fix**: A bug fix (bumps PATCH version)
- **chore**: Maintenance, dependencies, tooling (no version bump)
- **docs**: Documentation only (no version bump)
- **refactor**: Code refactoring without behavior change (no version bump)
- **test**: Test additions/updates (no version bump)
- **perf**: Performance improvements (bumps PATCH version)

### Examples:

```
feat(api): add rate limiting support

Implements exponential backoff for API rate limits.

Closes #42
```

```
fix(types): correct athlete response interface

The StravaAthlete type was missing the profile_photo field.
```

```
chore: upgrade eslint to v10
```

## 🚀 Release Process (Automated)

1. **Merge PR to main** → GitHub Actions workflow triggered
2. **semantic-release analyzes commits** since last release
3. **Determines version bump** (major/minor/patch or no release)
4. **Updates CHANGELOG.md** with generated release notes
5. **Updates package.json** version
6. **Publishes to npm** with new version
7. **Creates GitHub tag & release** with release notes
8. **Git commits** CHANGELOG.md and package.json updates

**All automatic — no manual steps needed.**

## 🔐 Authentication (OIDC Trusted Publishing)

This repo uses **npm Trusted Publishing via OIDC**, which is more secure than NPM_TOKEN:

- ✅ No secrets stored in GitHub
- ✅ Token scoped to this repo only
- ✅ Cryptographic proof of origin (provenance)
- ✅ Automatic OIDC token exchange during CI

**No setup needed** — GitHub provides the OIDC token automatically. The workflow uses `id-token: write` permission and `GITHUB_TOKEN` to authenticate.

### Package Configuration
The `package.json` includes:
```json
{
  "publishConfig": {
    "provenance": true
  }
}
```

This enables npm to sign the package, proving it came directly from this GitHub repository.

## 🧪 Testing Locally (Optional)

```bash
# Dry-run to see what would be released
npx semantic-release --dry-run

# Show debug logs
DEBUG=semantic-release:* npx semantic-release --dry-run
```

## 📦 Version History

- **1.3.1** - Last manual release (2026-06-04)
- **Future releases** - Auto-generated from commits

## ⚠️ Breaking Changes

If you need to bump MAJOR version, use:

```
feat!: breaking API change

BREAKING CHANGE: removed legacy auth method
```

The `!` and `BREAKING CHANGE:` footer both trigger a major version bump.

## 🛑 Disabling a Release

If you need to prevent a release despite commits:

Add `[skip release]` or `[skip-release]` to the commit message:

```
chore: update readme [skip release]
```

## 🗂️ Migration Notes

- **CHANGELOG.backup.md**: Contains the old keep-a-changelog format for reference
- **.releaserc.json**: semantic-release configuration (don't edit unless needed)
- **Existing version**: 1.3.1 is now frozen; next release will auto-detect proper bump

## 📚 References

- [Conventional Commits](https://www.conventionalcommits.org/)
- [semantic-release docs](https://semantic-release.gitbook.io/)
- [Commit message best practices](https://chris.beams.io/posts/git-commit/)
