# ✅ Semantic Release Migration Complete

## What Was Corrected

You were absolutely right! npm changed its authentication approach. The migration now uses **OIDC Trusted Publishing** (the modern standard) instead of `NPM_TOKEN`.

### What This Means

| Aspect              | Old Approach                | New Approach                          |
| ------------------- | --------------------------- | ------------------------------------- |
| **Auth method**     | NPM_TOKEN secret (legacy)   | OIDC Trusted Publishing (recommended) |
| **Secret rotation** | Manual, every 90 days       | Not needed — expires automatically    |
| **Security scope**  | Can access all npm packages | Scoped to this repo only              |
| **Provenance**      | Not available               | ✅ Cryptographically signed           |
| **Setup effort**    | Add secret to GitHub        | One-time package config on npmjs.com  |

## What's Configured

✅ `.releaserc.json` — semantic-release config with changelog & git plugins  
✅ `.github/workflows/publish.yml` — OIDC workflow with proper permissions  
✅ `package.json` — includes `"provenance": true` for signed packages  
✅ Documentation — updated guides explaining the new approach

## The Only Setup Needed

**On npmjs.com (one-time):**

1. Go to your package settings
2. Enable **Automation & CI** under Publishing access
3. Done!

GitHub Actions will use OIDC to authenticate automatically from there.

## How It Works (Technical Details)

1. **On every push to main** → GitHub Actions workflow runs
2. **semantic-release analyzes** commits since last release
3. **Bump version** based on Conventional Commits
4. **Update CHANGELOG.md** with auto-generated notes
5. **Build package** (`bun run build` included in package.json)
6. **Request OIDC token** from GitHub (using `id-token: write` permission)
7. **Authenticate with npm** using the OIDC token (not a stored secret)
8. **Publish to npm** with provenance signature
9. **Commit & tag** the release

**Zero secrets stored. Zero token rotation needed. Provenance on every release.**

## References

- [npm Trusted Publishing docs](https://docs.npmjs.com/generating-provenance-statements)
- [GitHub OIDC in Actions](https://docs.github.com/en/actions/deployment/security-hardening-your-deployments/about-security-hardening-with-openid-connect)
- [semantic-release npm plugin (OIDC support)](https://github.com/semantic-release/npm#npm-provenance-on-github-actions)
