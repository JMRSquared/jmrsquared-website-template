# __APP_NAME__

Single-page website starter built with Vite, React, TypeScript, Tailwind CSS, Framer Motion, Lucide, and Cloudflare Pages.

## Scripts

- `yarn install`
- `yarn dev`
- `yarn build`
- `yarn lint`
- `yarn typecheck`
- `yarn deploy:pages`

## Deploy

This project is configured for Cloudflare Pages with:

- Cloudflare Pages project: `__CLOUDFLARE_PROJECT_NAME__`
- GitHub Actions secret: `__CLOUDFLARE_API_TOKEN_SECRET__`
- GitHub Actions variable: `__CLOUDFLARE_ACCOUNT_ID_VAR__`

After your first push to `main`, the deploy workflow can publish the site to Cloudflare Pages as long as the required GitHub secret and variable are present.
