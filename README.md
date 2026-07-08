# Ebisu

## See the job before everyone else does.

Ebisu surfaces openings directly from Greenhouse, Lever, Ashby, and other ATS platforms, helping you discover fresh roles earlier than the big job boards and stay organized as you search.

## Development

```bash
pnpm install
pnpm dev
```

Load the generated development extension in Chrome from Plasmo's build output.

## Release Packaging

- Run the `Release Extension` GitHub Actions workflow when you want a store-uploadable package.
- The workflow stamps the extension version as `MAJOR.MINOR.PATCH.BUILD`, where `BUILD` is derived from the GitHub Actions run number and rerun attempt, runs `pnpm typecheck`, builds the production zip, verifies it with Playwright, uploads it as a GitHub Actions artifact, and creates a matching GitHub release.
- Update `package.json`'s base `version` when you want to start a new release line. Each workflow run then gets a unique fourth segment automatically.

## MVP

- Generate Google searches with role keywords, ATS domains, recency, remote, and optional excluded terms.
- Save the current browser tab as a job.
- Track jobs as `seen`, `saved`, or `applied`.
- Filter locally saved jobs by status.
