# `create-jmrsquared-website-template`

Published scaffolder for:

```bash
yarn create jmrsquared-website-template
```

The generator creates a new Vite website project from the embedded template, rewrites app/deploy settings for Cloudflare Pages (default) or Firebase Hosting, initializes Git, and can prepare GitHub Actions deployment when required CLIs and `gh` are available.

## What It Generates

- React + Vite + TypeScript + Tailwind CSS single-page website
- Framer Motion + GSAP ScrollTrigger + React Three Fiber / Drei starter motion stack
- Demo preview banner, JMR Squared attribution, and clear unsolicited-demo wording
- Cloudflare Pages or Firebase Hosting deploy config for `dist`
- GitHub Actions workflow for provider-based deploys on `main`
- Local Git repository initialized on `main`
- `AGENTS.md` project instructions (`CLAUDE.md` only references `@AGENTS.md`)

## Requirements

```bash
node --version
yarn --version
gh --version
```

- Node.js 22+
- Yarn (Corepack-enabled Yarn is recommended)
- GitHub CLI (`gh`) authenticated with `gh auth login`
- Cloudflare CLI (`wrangler`) if you choose Cloudflare
- Firebase CLI (`firebase`) if you choose Firebase

## Create A Website Project

Run:

```bash
yarn create jmrsquared-website-template
```

During scaffolding:

1. Enter your project directory name.
2. Enter your app name.
3. Choose deploy provider:
   - `cloudflare` (default)
   - `firebase`
4. Enter GitHub repository (`owner/repo`) when prompted.
5. Provide a project brief (paste markdown, local `.md` path, or URL).
6. Choose a coding agent:
   - `agent` (default, Cursor Agent CLI)
   - `claude`
   - `pi`
   - `codex`

After you choose the coding agent, the scaffolder shows the exact command it will run and waits for Enter. From that point it scaffolds the app, installs dependencies, initializes git, creates/pushes the GitHub repo, configures secrets when available, writes an autonomous `mission.md` (premium design + quality gate + outreach), and launches the selected coding agent. The build runs without further prompts. Before outreach, the mission requires `yarn quality:gate` (Lighthouse + screenshots) with a **SHIP** decision. Every demo includes a preview banner and attribution; humans handle demo teardown manually.

## Alternative: Full-Stack Monorepo Template

Skip the default Vite + Cloudflare/Firebase flow and scaffold a `@geekmidas/toolbox` monorepo (apps/api + apps/web|app + packages/*) with beads + pi agents instead:

```bash
yarn create jmrsquared-website-template --template full --name my-app
```

All flags after `--template full` are forwarded to `bin/init-gkm-and-beads.sh`. Run with `--help` for the full option list:

```bash
yarn create jmrsquared-website-template --template full --help
```

Common flags:

- `--name <project-name>` (required, npm-safe)
- `--frontend nextjs|tanstack-start|expo`
- `--db true|false`
- `--cache true|false`
- `--mailer console|mailpit`
- `--logger pino|console`
- `--pkg-manager pnpm|npm|yarn|bun`
- `--provider claude|codex|cursor|cursor-provider`
- `--vsc`, `--warp`, `--skip-install`

Prerequisites: chosen package manager + Docker (for Postgres/Redis/Mailpit) + the chosen provider CLI (`claude`, `codex`, or `cursor`).

## Provider Setup

### Cloudflare (Default)

Required local environment variables before running the scaffolder:

```bash
export CLOUDFLARE_API_TOKEN="your_cloudflare_api_token"
export CLOUDFLARE_ACCOUNT_ID="your_cloudflare_account_id"
```

How to get values:

1. In Cloudflare dashboard, create an API token with Pages deploy permissions.
2. Copy your Cloudflare account ID from the dashboard.
3. Export both vars in your shell before running `yarn create jmrsquared-website-template`.

What happens:

- The scaffolder uses `wrangler` to resolve/create the Pages project.
- If GitHub setup is enabled, it writes `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` to repo secrets.
- Generated workflow deploys on push to `main`.

### Firebase

Required local environment variable before running the scaffolder:

```bash
export FIREBASE_TOKEN="your_firebase_cli_token"
```

How to get values:

1. Generate a token from Firebase CLI on a machine where you are logged in:
   ```bash
   firebase login:ci
   ```
2. Copy the token output.
3. Export it as `FIREBASE_TOKEN` before running `yarn create jmrsquared-website-template`.

What happens:

- The scaffolder creates a new Firebase project using the project name.
- If the Firebase project already exists, scaffolding fails by design.
- It writes Firebase hosting config (`firebase.json`, `.firebaserc`) in the generated app.
- If GitHub setup is enabled, it writes `FIREBASE_TOKEN` to repo secrets.
- Generated workflow deploys on push to `main`.

## GitHub Actions Secrets (Manual Fallback)

If secrets were not auto-set by the scaffolder, add them manually in:

- GitHub repo -> Settings -> Secrets and variables -> Actions -> New repository secret

Set based on provider:

- Cloudflare: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`
- Firebase: `FIREBASE_TOKEN`

## Deployment Behavior

- Every push to `main` in the generated project triggers `.github/workflows/release-website.yml`.
- Workflow installs deps, builds the website, then runs `yarn deploy`.
- `yarn deploy` is provider-specific in the generated app.

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
