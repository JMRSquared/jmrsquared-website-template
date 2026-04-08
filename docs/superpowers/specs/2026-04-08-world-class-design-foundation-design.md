# World-Class Design Foundation — Design Spec

## Goal

Transform the `jmrsquared-website-template` from a solid but instruction-light starter into a template that produces world-class websites by default. Two pillars:

1. **Shared foundation layer in code** — design tokens, primitive components, animation presets
2. **Deep design principle instructions** — CLAUDE.md + Cursor rules that teach the AI to produce premium visual output

The template remains neutral and brand-agnostic. It ships principles and building blocks, not opinions.

---

## 1. Design Token System

### File: `src/shared/tokens/theme.css`

A single CSS custom properties file that defines the entire visual identity. Organized by category:

**Colors:**
- `--color-primary-50` through `--color-primary-900` — brand primary (default: current blue scale)
- `--color-accent-50` through `--color-accent-900` — secondary accent (default: cyan/teal)
- `--color-neutral-50` through `--color-neutral-950` — grays (default: slate)
- `--color-surface` — page background
- `--color-surface-raised` — card/elevated surfaces
- `--color-surface-overlay` — modals, drawers
- `--color-text-primary`, `--color-text-secondary`, `--color-text-muted` — semantic text
- `--color-border` — default border

**Typography:**
- `--font-display` — headings/hero text (default: Inter 700-800)
- `--font-body` — body text (default: Inter 400-500)
- `--text-xs` through `--text-6xl` — size scale matching Tailwind but in custom properties
- `--leading-tight`, `--leading-normal`, `--leading-relaxed` — line heights
- `--tracking-tight`, `--tracking-normal`, `--tracking-wide`, `--tracking-widest` — letter spacing

**Spacing:**
- `--space-1` through `--space-20` — spacing scale (4px base)
- `--section-padding-x`, `--section-padding-y` — consistent section rhythm
- `--container-max` — max width for content

**Border Radius:**
- `--radius-sm`, `--radius-md`, `--radius-lg`, `--radius-xl`, `--radius-2xl`, `--radius-full`

**Shadows:**
- `--shadow-sm`, `--shadow-md`, `--shadow-lg`, `--shadow-xl`, `--shadow-2xl`
- `--shadow-color` — tintable shadow base

**Motion:**
- `--duration-fast` (150ms), `--duration-normal` (300ms), `--duration-slow` (500ms), `--duration-slower` (700ms)
- `--ease-out`, `--ease-in-out`, `--ease-spring` — named easings

### Tailwind Integration

`tailwind.config.js` updated to reference CSS variables:

```js
colors: {
  primary: {
    50: 'var(--color-primary-50)',
    // ... through 900
  },
  accent: { /* same pattern */ },
  neutral: { /* same pattern */ },
  surface: 'var(--color-surface)',
  'surface-raised': 'var(--color-surface-raised)',
}
```

This means all existing Tailwind classes (`bg-primary-600`, `text-neutral-500`) automatically pull from tokens. Rebranding = edit one file.

### Site Config Expansion

`src/shared/config/site.ts` expanded:

```ts
export const siteConfig = {
  appName: '__APP_NAME__',
  packageName: '__PACKAGE_NAME__',
  tagline: 'Mobile-first starter',
  menuTagline: 'Neutral starter',
  footerDescription: '...',
  fonts: {
    display: 'Inter',
    body: 'Inter',
    googleFontsUrl: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap',
  },
  meta: {
    title: '__APP_NAME__',
    description: '__SITE_DESCRIPTION__',
    url: '__SITE_URL__',
  },
};
```

---

## 2. Shared Primitive Components

Small, composable building blocks that every section can use. Located in `src/shared/components/`.

### 2a. Section Wrapper — `Section.tsx`

A layout primitive that enforces consistent section rhythm:

```tsx
type SectionProps = {
  id?: string;
  children: React.ReactNode;
  className?: string;
  background?: 'default' | 'muted' | 'dark' | 'gradient';
  spacing?: 'sm' | 'md' | 'lg';
};
```

Handles: padding, max-width container, background variants, consistent vertical rhythm. Eliminates the repeated `px-4 py-20 sm:px-6 lg:px-8` + `mx-auto max-w-7xl` pattern across every section.

### 2b. Animated Container — `AnimatedContainer.tsx`

A Framer Motion wrapper for scroll-triggered reveals:

```tsx
type AnimatedContainerProps = {
  children: React.ReactNode;
  className?: string;
  animation?: 'fade-up' | 'fade-in' | 'slide-left' | 'slide-right' | 'scale-up';
  delay?: number;
  stagger?: boolean;
  staggerDelay?: number;
};
```

Encapsulates the `useInView` + `motion.div` + variants pattern that's currently duplicated across every section. Supports staggered children.

### 2c. Button — `Button.tsx`

A polymorphic button with consistent styling:

```tsx
type ButtonProps = {
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  rounded?: boolean; // pill vs rounded-lg
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  as?: 'button' | 'a';
} & (ButtonHTMLAttributes | AnchorHTMLAttributes);
```

Uses motion for hover/tap interactions. Reads from design tokens for colors, radius, shadows.

### 2d. Card — `Card.tsx`

A composable card primitive:

```tsx
type CardProps = {
  children: React.ReactNode;
  className?: string;
  variant?: 'elevated' | 'outlined' | 'filled' | 'glass';
  hover?: boolean; // adds lift-on-hover
  padding?: 'sm' | 'md' | 'lg';
};
```

### 2e. SectionHeader — `SectionHeader.tsx`

The repeated eyebrow + title + copy pattern extracted:

```tsx
type SectionHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  alignment?: 'left' | 'center';
};
```

Uses the existing `.section-eyebrow`, `.section-title`, `.section-copy` classes.

### 2f. Icon Container — `IconContainer.tsx`

The repeated icon-in-colored-circle pattern:

```tsx
type IconContainerProps = {
  icon: LucideIcon;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'muted' | 'dark';
};
```

---

## 3. Animation Presets

### File: `src/shared/lib/motion.ts`

Named Framer Motion variant presets that components and sections reference:

```ts
export const presets = {
  fadeUp: { hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0 } },
  fadeIn: { hidden: { opacity: 0 }, visible: { opacity: 1 } },
  slideLeft: { hidden: { opacity: 0, x: -24 }, visible: { opacity: 1, x: 0 } },
  slideRight: { hidden: { opacity: 0, x: 24 }, visible: { opacity: 1, x: 0 } },
  scaleUp: { hidden: { opacity: 0, scale: 0.92 }, visible: { opacity: 1, scale: 1 } },
  stagger: (staggerDelay = 0.08) => ({
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: staggerDelay } },
  }),
};

export const transitions = {
  fast: { duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] },
  normal: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] },
  slow: { duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] },
  spring: { type: 'spring', damping: 25, stiffness: 300 },
};
```

This replaces the inline variant objects currently scattered across every section file.

---

## 4. AI Instruction Expansion

### 4a. New CLAUDE.md Sections

Add the following principle-based instruction sections to the template's CLAUDE.md (which gets copied into every scaffolded project):

**Visual Design Principles:**
- Use a clear typographic hierarchy: one size for hero headlines, one for section titles, one for card titles, one for body, one for captions. Never use more than 3 font weights on a single page.
- Maintain consistent vertical rhythm. Sections should breathe — use generous padding (80-120px vertical on desktop, 64-80px on mobile). Within sections, use a consistent spacing scale.
- Apply the 60-30-10 color rule: 60% neutral/background, 30% secondary, 10% primary accent. Never flood a section with primary color unless it's an intentional CTA break.
- Cards, containers, and interactive elements should use consistent border radius from the token scale. Don't mix sharp and rounded in the same visual context.
- Shadows should be subtle and purposeful. Use tinted shadows (matching the surface color) for premium feel. Reserve strong shadows for elevated interactive elements.
- White space is a design tool, not wasted space. When in doubt, add more space, not more content.

**Typography Rules:**
- Hero headlines: bold/extrabold, tight leading, tight tracking. Maximum 8-12 words.
- Section titles: semibold/bold, tight leading. Maximum 15 words.
- Body copy: regular weight, relaxed leading (1.6-1.8). Maximum 65-75 characters per line for readability.
- Eyebrow text: small, uppercase, wide tracking, muted or primary color. Used to categorize, not describe.
- Never center-align body paragraphs longer than 3 lines. Left-align for readability.

**Responsive Design:**
- Design mobile-first. Every section must look intentional on a 375px viewport, not just "shrunk."
- Stack horizontal layouts vertically on mobile. Don't just let flex-wrap handle it — intentionally reorder and resize.
- Touch targets must be minimum 44x44px. Buttons should be full-width on mobile unless side-by-side fits comfortably.
- Reduce section padding on mobile but never below 48px vertical.
- Image and card grids: 1 column on mobile, 2 on tablet, 3 on desktop. Never show a single lonely card on a wide row.

**Animation & Motion:**
- Use scroll-triggered animations for section entrances. Elements should fade-up or fade-in with subtle Y translation (16-24px).
- Stagger children by 60-100ms for lists and grids. Never stagger more than 6-8 items.
- Hover effects should be micro — 1-2px lift with shadow change, or subtle background color shift. Never scale more than 1.02-1.05x.
- Respect `prefers-reduced-motion`. All motion should degrade to instant transitions.
- Page load animations should complete within 1 second. Don't make users wait for content.
- Use the animation presets from `src/shared/lib/motion.ts`. Don't create inline variants.

**Accessibility:**
- All interactive elements must have visible focus states using `focus-visible` with a 2px ring.
- Color contrast must meet WCAG AA (4.5:1 for body text, 3:1 for large text and UI elements).
- Images must have meaningful alt text. Decorative images use `alt=""`.
- Navigation must be keyboard-accessible. Mobile menu must trap focus.
- Use semantic HTML: `<section>`, `<nav>`, `<header>`, `<footer>`, `<main>`, `<article>`.
- ARIA labels on icon-only buttons and non-obvious interactive elements.

**Component Patterns:**
- Use the shared primitives from `src/shared/components/` (Section, AnimatedContainer, Button, Card, SectionHeader, IconContainer) as building blocks for all new sections.
- When building a new section, compose it from these primitives rather than writing raw HTML with repeated utility classes.
- Content should be data-driven. Define section content in `content.ts` files within the feature folder, not inline in JSX.
- Every section should handle: normal state, empty state (no content), and graceful degradation when optional fields are missing.

**Image & Visual Direction:**
- Use gradient backgrounds sparingly — one per page as a hero or CTA accent, not on every section.
- When using decorative blurs or glows, keep opacity below 15% and blur above 40px for subtlety.
- Prefer image aspect ratios of 16:9, 4:3, or 1:1 for consistency. Avoid arbitrary crops.
- Use `object-cover` for hero and card images. Never stretch or distort.

### 4b. New Cursor Rules

Create additional `.mdc` rule files in `_cursor/rules/`:

**`visual-design-principles.mdc`** — The visual design, typography, responsive, and image/visual direction rules from above.

**`animation-motion.mdc`** — The animation & motion rules from above, including reference to the shared motion presets.

**`accessibility.mdc`** — The accessibility rules from above.

**`component-patterns.mdc`** — Rules about using shared primitives, data-driven content, and section composition.

---

## 5. Refactor Existing Sections

Update the 6 existing template sections to use the new shared primitives and motion presets. This serves as reference implementations that demonstrate how the primitives compose into real sections.

- Replace inline padding/container patterns with `<Section>`
- Replace inline `useInView` + motion boilerplate with `<AnimatedContainer>`
- Replace inline button markup with `<Button>`
- Replace inline card markup with `<Card>`
- Replace inline eyebrow/title/copy with `<SectionHeader>`
- Replace inline icon circles with `<IconContainer>`
- Replace inline motion variants with presets from `motion.ts`

The visual output should be identical — this is a refactor, not a redesign.

---

## 6. Enhanced index.html

Add:
- `<meta name="theme-color">` pulling from tokens
- Favicon link placeholders
- Preload hint for font files
- `prefers-color-scheme` meta (future dark mode readiness)

---

## 7. Scaffold Updates

The scaffolder (`lib/scaffold.js`) doesn't need changes — it already does token replacement and recursive file copy. The new files and updated files will be picked up automatically.

---

## Summary of New/Modified Files

**New files in `template/`:**
- `src/shared/tokens/theme.css`
- `src/shared/components/Section.tsx`
- `src/shared/components/AnimatedContainer.tsx`
- `src/shared/components/Button.tsx`
- `src/shared/components/Card.tsx`
- `src/shared/components/SectionHeader.tsx`
- `src/shared/components/IconContainer.tsx`
- `src/shared/components/index.ts` (barrel export)
- `src/shared/lib/motion.ts`
- `_cursor/rules/visual-design-principles.mdc`
- `_cursor/rules/animation-motion.mdc`
- `_cursor/rules/accessibility.mdc`
- `_cursor/rules/component-patterns.mdc`

**Modified files in `template/`:**
- `src/index.css` — import theme.css, update base styles to use tokens
- `tailwind.config.js` — reference CSS variables
- `src/shared/config/site.ts` — expanded config
- `index.html` — enhanced meta tags
- `src/features/site-template/sections/HeroSection.tsx` — use primitives
- `src/features/site-template/sections/FeaturesSection.tsx` — use primitives
- `src/features/site-template/sections/ShowcaseSection.tsx` — use primitives
- `src/features/site-template/sections/CtaSection.tsx` — use primitives
- `src/features/site-template/sections/HeaderSection.tsx` — use primitives where applicable
- `src/features/site-template/sections/FooterSection.tsx` — use primitives

**Modified files at project root:**
- `CLAUDE.md` — add all new instruction sections
