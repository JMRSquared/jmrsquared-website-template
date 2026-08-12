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
- Author JSON-LD for the real business. The template ships a bare `WebSite` stub in `index.html`; leaving that stub as the final markup is a fail.
- Pick the type from what the business actually is, not from a default list. A physical local business takes `LocalBusiness` or the closest subtype (`Restaurant`, `HairSalon`, `BarOrPub`, `Plumber`, `AutoRepair`, `LodgingBusiness`, `HealthAndBeautyBusiness`). A product site takes `Product`. Multi-location adds `department`. A venue with a programme adds `Event`.
- For a local business fill `name`, `url`, `image`, `telephone`, `address` (`PostalAddress`), `geo`, `openingHoursSpecification`, `priceRange`, `areaServed`, and `sameAs` for real social profiles. This is the highest-value SEO these businesses are currently missing.
- Assert only verified facts. Never invent ratings, review counts, addresses, coordinates, or hours. Omit a field rather than guess it.
- Validate the final markup at https://validator.schema.org/ before calling the site done.
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
- **Mandatory 3D / WebGL** — React Three Fiber + Drei are installed; build a real hero canvas (or equivalent product scene). CSS decoration alone does not count
- **Mandatory scroll storytelling** — GSAP + ScrollTrigger are installed; build scrub/pin/parallax sequences. Fade-in-on-scroll alone does not count
- At least 2–3 intentional cinematic / interactive WOW moments (must appear on the board)
- Preserve full WOW factor on mobile (adapt complexity; do not strip to a flat page)
- Respect `prefers-reduced-motion` with polished fallbacks
- Original brand skin on studied craft; if the first viewport could belong to another brand after removing the nav, redesign
- **References are look-and-feel sources, not content sources.** Transplant the *experience* and rebuild it in the client's world. A restaurant site can take igloo.inc's scroll-driven hero journey wholesale — same pacing, same camera behaviour, same reveal structure — with every asset, colour, word, and 3D subject swapped for that restaurant. Keep the feel, replace the substance. Copying a reference's copy, logo, or literal subject matter is theft; copying its craft is the assignment
- **Do not rush.** Take the time the craft needs. A single demo can legitimately take an hour or more of building, scrolling, reviewing, and rebuilding. Budget several review-and-fix passes before the quality gate. Shipping early at "good enough" is a worse outcome than taking longer and shipping something stunning

A site without a posted board, stunning craft, real WOW, real 3D, and scroll-driven motion — or that looks AI-generated — is not done.

# Mobile-First (HARD REQUIREMENT)

Most visitors to these businesses arrive on a phone from a maps listing or a search result. The phone view is the real product; desktop is the secondary case.

- Design and build the mobile layout first, then scale up. Never design desktop and squeeze it down.
- Keep the WOW on mobile. Adapt or cap complexity (fewer particles, lower DPR, simpler camera path) but never fall back to a flat static page.
- Verify every breakpoint on a real viewport: 360x800, 390x844, 768x1024, 1440x900. Scroll the whole page at each.
- No horizontal overflow at any width. No text under 16px for body copy. Tap targets at least 44x44px with real spacing between them.
- Respect safe areas and the mobile URL bar: use `dvh` rather than `vh` for full-height sections.
- Test the 3D canvas on a throttled mobile profile. If it drops below ~30fps, reduce the scene until it holds; do not ship a stuttering hero.
- Mobile Lighthouse is part of the quality gate. A desktop-only pass is not a pass.

# Conversion (HARD REQUIREMENT)

Every site must make the next step obvious. Beautiful with no clear action is a fail.

- Decide the site's single primary action from what the business actually sells, then design the whole page around it. Call now for a plumber or locksmith. Book a table for a restaurant. WhatsApp for a salon or small trade. Get directions for a walk-in shop. Request a quote for a contractor. Order for a takeaway.
- The primary CTA must be reachable within one thumb movement at any scroll position on mobile. A persistent bar, dock, or floating action is usually right; decide the pattern from the design, not from habit.
- Every CTA uses a real, working mechanism: `tel:`, `https://wa.me/<number>`, a maps deep link, a mailto, or a real booking URL. No dead buttons, no `href="#"`, no fake forms.
- Say what happens next in the label. "Call the shop", "WhatsApp us", "Book a table" — never "Learn more", "Get started", or "Click here".
- Secondary actions support the primary one; they never compete with it visually.
- Contact details, address, and opening hours must be findable without scrolling the whole page, and must match the JSON-LD exactly.
- If a required detail is genuinely unknown, use a clearly-labelled placeholder and list it in the outreach issue as something to confirm. Never invent a phone number or address.

# Business Content Model

The generated `siteConfig` in `src/shared/config/site.ts` only carries app name, package name, description, and URL. That is a starting point, not the content model.

- Extend it with a typed model of the real business before writing sections: contact channels, address, hours, services or menu, service area, socials, and any credentials or affiliations worth showing.
- Design the shape to fit this business. A restaurant needs a menu and sittings; a plumber needs a call-out area and emergency availability; a salon needs a service list with prices and a booking link.
- One source of truth. Section copy, the contact UI, and the JSON-LD all read from it — never hardcode the same phone number in three components.
- Type it strictly and keep it in `src/shared/config/`. Mark anything unverified so it surfaces in the outreach issue instead of shipping as fact.

# Imagery Sourcing — pngimg.com (HARD REQUIREMENT)

Transparent cutout assets (products, food, people, objects, logos) come from the `pngimg-assets` skill. Do not invent placeholders, hotlink remote images, or fall back to generic AI illustration.

**Skill:** `/Users/lavhe/CODE/jmrsquared-skills/skills/pngimg-assets/SKILL.md` — invoke `/pngimg-assets`.

```bash
SKILL=/Users/lavhe/CODE/jmrsquared-skills/skills/pngimg-assets/scripts/pngimg.sh
"$SKILL" search "coffee beans" --limit 10
"$SKILL" download "coffee beans" --index 2 --out public/images
```

## Licence gate — CC BY-NC 4.0 (check before downloading)

pngimg.com assets require attribution and are **non-commercial only**. For sites built from this template:

| Stage | Allowed |
| --- | --- |
| Local comps, hero mockups, layout exploration — asset never committed | Yes |
| Free unsolicited demo carrying `DemoPreviewBanner` + `JmrSquaredAttribution` | Yes, with a `CREDITS.md` entry |
| Client pays (R150/pm or R4 000 once-off), or any monetised build | **No** — replace every pngimg asset before handover |

Every shipped pngimg asset needs a `CREDITS.md` line with its source URL and a link to https://pngimg.com. At conversion to a paying client, swap those assets for licensed, generated, or client-supplied imagery and drop the credit.

## Usage rules

- Search first, show the numbered results, let a human pick. Never blind `--all` on a vague query.
- Query like a filename: two or three nouns. `barber chair`, not a sentence. Empty result → retry with the single strongest noun.
- Run `file <path>` after download. pngimg mixes 200px thumbnails into full-res result sets; reject anything too small for its placement.
- Land assets in `public/images/`, never the repo root, never a temp path referenced from committed code.
- Optimise before commit. Raw 1–5 MB PNGs break the LCP < 2.5s bar in Production Readiness.
- Sequential downloads only, no parallel fan-out.
- A cutout supports the design, it does not replace it. A pngimg subject floated on a gradient is still an AI-template tell and still fails the premium bar.

Also enforced by: `.cursor/rules/pngimg-assets.mdc`

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
