# Testing

1. Use Playwright with the test server to verify functionality.
2. If the playwright test is a new one, codify it so we can re-run the same tests to catch regressions
3. For popup UI changes, add or update a Playwright test under `tests/popup/` and run it with `pnpm exec playwright test <path-to-spec>`.
4. Before finishing popup UI work, run the full local verification flow in this order: `pnpm typecheck && pnpm build && pnpm exec playwright test <path-to-spec>`.

# Releases

1. The canonical release path is the GitHub Actions workflow `Release Extension` in `.github/workflows/release-extension.yml`.
2. Update `package.json` manually when you want to bump `major.minor.patch`.
3. Each workflow run automatically stamps a unique fourth version segment for the Chrome package build.
4. To publish a new build, push `main`, run `Release Extension`, then use the generated GitHub release asset or Actions artifact for the Chrome Web Store upload.
