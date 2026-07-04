# Testing

1. Use Playwright with the test server to verify functionality.
2. If the playwright test is a new one, codify it so we can re-run the same tests to catch regressions
3. For popup UI changes, add or update a Playwright test under `tests/popup/` and run it with `pnpm exec playwright test <path-to-spec>`.
4. Before finishing popup UI work, run the full local verification flow in this order: `pnpm typecheck && pnpm build && pnpm exec playwright test <path-to-spec>`.
