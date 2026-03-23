# `create-jmrsquared-website-template`

Published scaffolder for:

```bash
yarn create jmrsquared-website-template
```

The generator creates a new Vite website project from the embedded template, rewrites the app name and Cloudflare Pages deployment settings, initializes Git, and can prepare GitHub Actions deployment when `wrangler` and `gh` are available.

## What It Generates

- React + Vite + TypeScript + Tailwind CSS single-page website
- Cloudflare Pages deploy config for `dist`
- GitHub Actions workflow for Cloudflare Pages deploys on `main`
- Local Git repository initialized on `main`

## Local Development

```bash
yarn install
node ./bin/create.js
```

## Publishing

Publish this package to the registry as `create-jmrsquared-website-template`. Once published, users can run:

```bash
yarn create jmrsquared-website-template
```

## Publish CI

The root package publish workflow lives at `.github/workflows/publish-package.yml`.

- Pushes to `main` try to publish the root scaffolder package.
- npm publishes the unscoped package: `create-jmrsquared-website-template`
- GitHub Packages publishes a scoped package prepared during CI: `@<owner>/create-jmrsquared-website-template`
- If the current version already exists in either registry, that registry is skipped instead of failing the workflow.

### Required Secrets

- `NPM_TOKEN`: npm access token with permission to publish `create-jmrsquared-website-template`
- `GITHUB_TOKEN`: built into GitHub Actions and used for the GitHub Packages publish

### Important Notes

- Bump the version in `package.json` before pushing to `main` when you want a new release.
- The root publish workflow only publishes this scaffolder package. It does not publish the generated app inside `template/`.
- The generated website deployment workflow remains in `template/_github/workflows/release-website.yml` and is copied into scaffolded projects.
