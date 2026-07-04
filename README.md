# Ebisu

A local-first job search engine for generating focused Google queries and tracking saved jobs.

## Development

```bash
pnpm install
pnpm dev
```

Load the generated development extension in Chrome from Plasmo's build output.

## MVP

- Generate Google searches with role keywords, ATS domains, recency, remote, and optional excluded terms.
- Save the current browser tab as a job.
- Track jobs as `seen`, `saved`, or `applied`.
- Filter locally saved jobs by status.
