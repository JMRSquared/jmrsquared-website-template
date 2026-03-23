# __APP_NAME__

Single-page website starter built with Vite, React, TypeScript, Tailwind CSS, Framer Motion, Lucide, and Firebase Hosting.

## Scripts

- `yarn install`
- `yarn dev`
- `yarn build`
- `yarn lint`
- `yarn typecheck`
- `yarn deploy:hosting --project "__FIREBASE_PROJECT_ID__"`

## Deploy

This project is configured for Firebase Hosting with:

- Firebase project: `__FIREBASE_PROJECT_ID__`
- GitHub Actions secret: `__FIREBASE_TOKEN_SECRET__`

After your first push to `main`, the deploy workflow can publish the site to Firebase Hosting as long as the required GitHub secret is present.
