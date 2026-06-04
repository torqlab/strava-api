# Semantic Release Setup Checklist

## Completed ✅
- [x] Install semantic-release dependencies
- [x] Configure .releaserc.json
- [x] Update publish.yml workflow
- [x] Reset CHANGELOG.md
- [x] Commit migration changes
- [x] Create migration guide

## Before First Release 🔐

**No secret setup needed!** This repo uses **npm Trusted Publishing (OIDC)**, which is the modern, recommended approach:

✅ **OIDC Trusted Publishing** — uses GitHub's OIDC token instead of long-lived secrets  
✅ **npm Provenance** — package is cryptographically signed, proving it came from this repo  
✅ **No NPM_TOKEN required** — more secure than storing personal tokens as secrets  

### What's Already Configured:
- `permissions: id-token: write` in GitHub Actions (enables OIDC)
- `provenance: true` in package.json (signs the package)
- `GITHUB_TOKEN` (auto-provided, no manual setup needed)

### One-Time Setup on npmjs.com:
1. Go to your package page on npmjs.com
2. Navigate to **Settings** → **Publishing access**
3. Ensure **Automation & CI** is enabled (allows Trusted Publishing)
4. That's it! GitHub Actions can now publish with OIDC

If you haven't set this up before, you may need to manually publish once with your personal token to claim the package, then enable Automation & CI.

## First Test Release 🧪
Once the package is configured for OIDC on npmjs.com:

1. Merge this branch (`chore/0-claude-symlink`) to `main`
2. GitHub Actions runs semantic-release
3. It detects setup commits and bumps to **v1.4.0**
4. Package auto-publishes to npm **with OIDC provenance**
5. CHANGELOG.md auto-generated
6. GitHub creates a release with notes

## Going Forward 📝
- Write commits with Conventional Commits format
- Every merge to main triggers automatic release
- No secrets to rotate
- No token storage needed
- Provenance proof on every release

## 🛡️ Why OIDC Trusted Publishing?

| Feature | OIDC | NPM_TOKEN |
|---------|------|-----------|
| **Secret rotation** | Never needed | Every few months |
| **Compromise scope** | GitHub repo only | All npm packages |
| **Provenance** | ✅ Signed | ❌ Not available |
| **Audit trail** | GitHub OIDC logs | Token usage logs |
| **Industry standard** | ✅ Recommended | Legacy |

## References
- [npm Trusted Publishing docs](https://docs.npmjs.com/generating-provenance-statements)
- [GitHub OIDC in Actions](https://docs.github.com/en/actions/deployment/security-hardening-your-deployments/about-security-hardening-with-openid-connect)
- [@semantic-release/npm plugin](https://github.com/semantic-release/npm#npm-provenance-on-github-actions)

