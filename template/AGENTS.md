# Domain-Driven Architecture

- Organize code by domain or feature first, not by technical layer alone.
- Prefer folders such as `src/domains/<domain>/` or `src/features/<feature>/` with related UI, hooks, services, types, and tests colocated.
- Keep shared or cross-domain code in explicit shared locations such as `src/shared/`, `src/lib/`, or `src/common/`.
- Keep domain boundaries clear: UI should not own business rules, and reusable business logic should not live inside page or component files.
- Use named exports for components. Do not use default exports for React components.
- Follow SOLID principles in all new code: single responsibility, open/closed, Liskov substitution, interface segregation, and dependency inversion.
- Follow DRY and clean code practices: avoid duplication, use clear names, keep functions small, and remove dead code.
- Prefer composition over inheritance and extract reusable units only when the abstraction is justified by real usage.

# Production Readiness

- Treat every change as production-bound unless the user says otherwise.
- Ship complete implementations, not placeholders, fake mocks, or TODO-driven logic in production code.
- Handle loading, empty, error, and edge states for user-facing flows.
- Favor predictable, testable code paths and safe defaults over clever shortcuts.
- Keep configuration explicit and environment-aware; never hardcode secrets or deployment-specific values.
- Make failure modes observable with meaningful errors, guards, and logging where appropriate.
- Preserve accessibility, responsiveness, and maintainability as part of done criteria.
- Before closing work, verify the solution is suitable for production with the relevant `yarn` checks for the change.

## SEO (Search Engine Optimization)

Every website must be built with SEO best practices from the start:

### Meta Tags
- Unique, descriptive `<title>` under 60 characters
- Unique `<meta name="description">` under 160 characters
- Open Graph tags: `og:title`, `og:description`, `og:image`, `og:url`, `og:type`
- Twitter Card tags: `twitter:card`, `twitter:title`, `twitter:description`, `twitter:image`
- Canonical URL to prevent duplicate content issues
- `theme-color` meta tag matching brand

### Structured Data
- Add JSON-LD schema markup appropriate to content type (Organization, WebSite, Product, etc.)
- Use `Schema.org` vocabulary for rich snippets in search results

### Technical SEO
- Semantic HTML with proper heading hierarchy (single `<h1>`, logical `<h2>`-`<h6>`)
- Descriptive, keyword-appropriate `<title>` and `alt` text for all images
- Descriptive link text (avoid "click here", "read more")
- `robots.txt` with appropriate crawl directives
- `sitemap.xml` listing all public pages

### Performance (Core Web Vitals)
- Optimize Largest Contentful Paint (LCP) < 2.5s — preload fonts, optimize images
- Minimize Cumulative Layout Shift (CLS) < 0.1 — reserve space for images, use `aspect-ratio`
- Ensure good First Input Delay (FID) / Interaction to Next Paint (INP) — defer heavy JS

### Accessibility for SEO
- All images have meaningful `alt` text (empty `alt=""` for decorative)
- Color contrast meets WCAG AA minimums
- Focus states visible for keyboard navigation

# Yarn Workflow

- Use `yarn` as the package manager for this project. Do not use `npm`, `pnpm`, or `bun`.
- Install dependencies with `yarn install`.
- Run the local website with `yarn dev`.
- Validate production output with `yarn build` before considering work complete.
- Use `yarn preview` to verify the built site locally when needed.
- Run quality checks with `yarn lint`, `yarn typecheck`, and `yarn quality:gate` after meaningful changes.
- When documenting setup or commands, always show the `yarn` version of the command.

# Premium Web Design (HARD REQUIREMENT)

Every customer-facing website built or redesigned in this repo **must** honour the full `premium-web-design` skill. Skipping it is a failure condition.

The site must look **absolutely stunning**, deliver a clear **WOW factor**, and must **not look AI-generated**. "Pretty good for AI" is a fail.

Also enforced by: `.cursor/rules/premium-web-design-hard-requirement.mdc`

### Non-negotiable delivery bar

- Invoke and follow `premium-web-design` end to end before designing or coding (`Understand → Study references (≥10 board) → Design from board → Build board items → Interact → Test → Polish → Verify board`)
- Study the skill’s reference sites in a real browser; publish a **Reference Study Board** (≥10 attributed craft items) before any design or code; do not invent “premium” from memory
- Compose the entire site from board items; every major section must cite ≥1 board row; verify each item `SHIPPED` at the end
- **Stunning + WOW** — award-level craft with moments that stop the user; soft fades do not count
- **Zero AI-template look** — no purple SaaS kits, cream+terracotta clichés, card/pill soup, Inter/Roboto defaults, glassmorphism spam, generic AI illustration heroes, or fluff marketing copy
- **Mandatory 3D / WebGL** — React Three Fiber + Drei are already in the template; keep and evolve the hero canvas (or equivalent). CSS decoration alone does not count
- **Mandatory scroll storytelling** — GSAP + ScrollTrigger are already in the template; keep and evolve scrub/pin/parallax sequences. Fade-in-on-scroll alone does not count
- At least 2–3 intentional cinematic / interactive WOW moments (must appear on the board)
- Preserve full WOW factor on mobile (adapt complexity; do not strip to a flat page)
- Respect `prefers-reduced-motion` with polished fallbacks
- Original brand skin on studied craft; if the first viewport could belong to another brand after removing the nav, redesign

A site without a posted board, stunning craft, real WOW, real 3D, and scroll-driven motion — or that looks AI-generated — is not done.

# Quality Gate (HARD REQUIREMENT)

Before any outreach issue:

1. Run `yarn quality:gate` and keep `quality-gate/report.md`
2. Capture desktop + mobile screenshots into `quality-gate/desktop.png` and `quality-gate/mobile.png`
3. Complete the visual checklist in `quality-gate/report.md`
4. Decision must be **SHIP**. If **REDO**, fix and rerun. Outreach is forbidden until SHIP.

Also enforced by: `.cursor/rules/quality-gate.mdc`

# Demo Preview + Attribution (HARD REQUIREMENT)

Every demo must make consent/context obvious:

- Keep `DemoPreviewBanner` visible site-wide
- Keep `JmrSquaredAttribution` with unsolicited-demo wording, link to https://tech.jmrsquared.com/, and tech@jmrsquared.com
- Do not remove the demo banner or attribution

Takedown is manual. The outreach email still promises removal on request and within 2 weeks; humans handle the actual teardown.

# Company Outreach Email (HARD REQUIREMENT)

These sites are demo pitches for companies with reviews / search traffic but no strong website.

After the demo ships **and** the quality gate is SHIP, open a GitHub issue titled `Outreach draft: <Company> pitch email`. Put the **company email** first (`To:`), then findings, then a short polite human pitch email grounded in real findings. Do not invent reviews or email addresses. Do not email the company yourself. If no company email is found, write `Company email: not found — needs manual lookup`.

Required email points:

- Praise grounded in findings; quote a real review only if available
- Why a website matters for a trusted business
- Demo URL + offer to refine with logo/photos/services/contact details
- Plain-language SEO offer
- Pricing: **R150/pm** or **R4 000 once-off**, free maintenance for **2 years**, domain excluded
- Promise take-down anytime on request and within **2 weeks** (manual teardown by humans)
- Close with tech@jmrsquared.com and https://tech.jmrsquared.com/

See `.cursor/rules/company-outreach-email.mdc`.

# Release Command Mapping

When the user says "release the website" or anything related to asking the website to be released, execute exactly:

`git add . && git commit -m ":rocket: Deploy" && git push`
