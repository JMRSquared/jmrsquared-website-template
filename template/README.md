# __APP_NAME__

Blank single-page website, deploy-ready on __DEPLOY_PROVIDER_NAME__. Vite, React, TypeScript, and Tailwind CSS are configured, and the motion stack (Framer Motion, GSAP ScrollTrigger, React Three Fiber / Drei, Lucide) is installed and ready to use. No starter design ships with it — build the site from the empty shell in `src/App.tsx`.

## Scripts

- `yarn install`
- `yarn dev`
- `yarn build`
- `yarn lint`
- `yarn typecheck`
- `yarn quality:gate`
- `yarn deploy`

## Structure

- `src/App.tsx` — empty page shell with the demo banner and JMR Squared attribution
- `src/shared/components/` — demo banner and attribution components (keep both)
- `src/shared/config/` — site, demo preview, and attribution values
- `src/shared/tokens/theme.css` — design tokens wired into `tailwind.config.js`

Add your own work under `src/features/<feature>/` or `src/domains/<domain>/`.

## Deploy

This project is configured for __DEPLOY_PROVIDER_NAME__ with:

- __DEPLOY_PROJECT_REFERENCE__
- GitHub Actions secrets are already wired in `.github/workflows/release-website.yml`

After your first push to `main`, the deploy workflow can publish the site as long as the required GitHub secrets are present.
