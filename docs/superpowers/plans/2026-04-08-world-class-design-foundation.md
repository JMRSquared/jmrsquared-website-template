# World-Class Design Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a design token system, shared primitive components, animation presets, and comprehensive AI design instructions to the website template so every scaffolded project produces world-class visual output.

**Architecture:** A CSS custom properties token layer feeds into Tailwind config, shared primitive components compose from those tokens, animation presets centralize Framer Motion patterns, and expanded CLAUDE.md + Cursor rules teach the AI design principles. Existing sections are refactored to use the new primitives as reference implementations.

**Tech Stack:** React 19, TypeScript, Tailwind CSS 3, Framer Motion 12, Lucide React, Vite 8, CSS Custom Properties

---

## File Structure

**New files (all under `template/`):**

| File | Responsibility |
|------|----------------|
| `src/shared/tokens/theme.css` | All design tokens as CSS custom properties |
| `src/shared/lib/motion.ts` | Framer Motion variant presets and transition configs |
| `src/shared/components/Section.tsx` | Section layout wrapper with background/spacing variants |
| `src/shared/components/AnimatedContainer.tsx` | Scroll-triggered animation wrapper |
| `src/shared/components/Button.tsx` | Polymorphic button with variant/size props |
| `src/shared/components/Card.tsx` | Card primitive with variant/hover props |
| `src/shared/components/SectionHeader.tsx` | Eyebrow + title + description pattern |
| `src/shared/components/IconContainer.tsx` | Icon-in-shape primitive |
| `src/shared/components/index.ts` | Barrel export for all shared components |
| `_cursor/rules/visual-design-principles.mdc` | Visual design + typography + responsive rules |
| `_cursor/rules/animation-motion.mdc` | Animation & motion guidelines |
| `_cursor/rules/accessibility.mdc` | Accessibility requirements |
| `_cursor/rules/component-patterns.mdc` | Rules for using shared primitives |

**Modified files (all under `template/`):**

| File | Change |
|------|--------|
| `src/index.css` | Import theme.css, update base styles to use tokens |
| `tailwind.config.js` | Reference CSS variables instead of hardcoded hex values |
| `src/shared/config/site.ts` | Expand with font + meta config |
| `index.html` | Add theme-color meta, favicon placeholder, font preload |
| `src/features/site-template/sections/HeroSection.tsx` | Refactor to use shared primitives |
| `src/features/site-template/sections/FeaturesSection.tsx` | Refactor to use shared primitives |
| `src/features/site-template/sections/ShowcaseSection.tsx` | Refactor to use shared primitives |
| `src/features/site-template/sections/CtaSection.tsx` | Refactor to use shared primitives |
| `src/features/site-template/sections/HeaderSection.tsx` | Use Button primitive where applicable |
| `src/features/site-template/sections/FooterSection.tsx` | Use Section primitive |

**Modified files (project root):**

| File | Change |
|------|--------|
| `CLAUDE.md` | Add all new design principle instruction sections |

---

### Task 1: Design Token System

**Files:**
- Create: `template/src/shared/tokens/theme.css`
- Modify: `template/src/index.css`
- Modify: `template/tailwind.config.js`

- [ ] **Step 1: Create the token file**

Create `template/src/shared/tokens/theme.css`:

```css
:root {
  /* ── Colors: Primary ── */
  --color-primary-50: #eff6ff;
  --color-primary-100: #dbeafe;
  --color-primary-200: #bfdbfe;
  --color-primary-300: #93c5fd;
  --color-primary-400: #60a5fa;
  --color-primary-500: #3b82f6;
  --color-primary-600: #2563eb;
  --color-primary-700: #1d4ed8;
  --color-primary-800: #1e40af;
  --color-primary-900: #1e3a8a;

  /* ── Colors: Accent ── */
  --color-accent-50: #ecfdf5;
  --color-accent-100: #d1fae5;
  --color-accent-200: #a7f3d0;
  --color-accent-300: #6ee7b7;
  --color-accent-400: #34d399;
  --color-accent-500: #10b981;
  --color-accent-600: #059669;
  --color-accent-700: #047857;
  --color-accent-800: #065f46;
  --color-accent-900: #064e3b;

  /* ── Colors: Neutral ── */
  --color-neutral-50: #f8fafc;
  --color-neutral-100: #f1f5f9;
  --color-neutral-200: #e2e8f0;
  --color-neutral-300: #cbd5e1;
  --color-neutral-400: #94a3b8;
  --color-neutral-500: #64748b;
  --color-neutral-600: #475569;
  --color-neutral-700: #334155;
  --color-neutral-800: #1e293b;
  --color-neutral-900: #0f172a;
  --color-neutral-950: #020617;

  /* ── Semantic Surfaces ── */
  --color-surface: #ffffff;
  --color-surface-muted: var(--color-neutral-50);
  --color-surface-raised: #ffffff;
  --color-surface-overlay: rgba(0, 0, 0, 0.5);
  --color-surface-dark: var(--color-neutral-950);

  /* ── Semantic Text ── */
  --color-text-primary: var(--color-neutral-900);
  --color-text-secondary: var(--color-neutral-600);
  --color-text-muted: var(--color-neutral-400);
  --color-text-on-dark: #ffffff;
  --color-text-on-primary: #ffffff;

  /* ── Semantic Border ── */
  --color-border: var(--color-neutral-200);
  --color-border-muted: var(--color-neutral-100);

  /* ── Typography ── */
  --font-display: 'Inter', system-ui, sans-serif;
  --font-body: 'Inter', system-ui, sans-serif;

  /* ── Border Radius ── */
  --radius-sm: 0.375rem;
  --radius-md: 0.5rem;
  --radius-lg: 0.75rem;
  --radius-xl: 1rem;
  --radius-2xl: 1.5rem;
  --radius-3xl: 2rem;
  --radius-full: 9999px;

  /* ── Shadows ── */
  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.07), 0 2px 4px -2px rgba(0, 0, 0, 0.05);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -4px rgba(0, 0, 0, 0.04);
  --shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.04);
  --shadow-2xl: 0 25px 50px -12px rgba(0, 0, 0, 0.15);

  /* ── Motion ── */
  --duration-fast: 150ms;
  --duration-normal: 300ms;
  --duration-slow: 500ms;
  --duration-slower: 700ms;
  --ease-out: cubic-bezier(0.25, 0.46, 0.45, 0.94);
  --ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);

  /* ── Section Rhythm ── */
  --section-padding-x: 1rem;
  --section-padding-y: 5rem;
  --container-max: 80rem;
}

@media (min-width: 640px) {
  :root {
    --section-padding-x: 1.5rem;
  }
}

@media (min-width: 1024px) {
  :root {
    --section-padding-x: 2rem;
    --section-padding-y: 6rem;
  }
}
```

- [ ] **Step 2: Update index.css to import tokens and use them in base styles**

Replace the full contents of `template/src/index.css` with:

```css
@import './shared/tokens/theme.css';

@tailwind base;
@tailwind components;
@tailwind utilities;

@layer components {
  .section-eyebrow {
    @apply text-sm font-semibold uppercase tracking-[0.25em] text-primary-600;
  }

  .section-title {
    @apply mt-4 text-3xl font-semibold leading-tight text-neutral-950 sm:text-4xl lg:text-5xl;
  }

  .section-copy {
    @apply mt-5 text-base leading-8 text-neutral-600;
  }
}

@layer base {
  :root {
    color-scheme: light;
  }

  html {
    overflow-x: hidden;
    scroll-behavior: smooth;
    background: var(--color-surface-muted);
  }

  body {
    font-family: var(--font-body);
    overflow-x: hidden;
    background:
      radial-gradient(circle at top left, rgba(59, 130, 246, 0.08), transparent 28%),
      linear-gradient(180deg, var(--color-surface) 0%, var(--color-surface-muted) 100%);
    color: var(--color-text-primary);
    -webkit-font-smoothing: antialiased;
    text-rendering: optimizeLegibility;
  }

  * {
    box-sizing: border-box;
  }

  ::selection {
    background: rgba(59, 130, 246, 0.18);
    color: var(--color-text-primary);
  }

  a {
    color: inherit;
    text-decoration: none;
  }

  button {
    font: inherit;
  }

  img {
    display: block;
    max-width: 100%;
  }

  /* Focus-visible ring for accessibility */
  :focus-visible {
    outline: 2px solid var(--color-primary-500);
    outline-offset: 2px;
  }
}
```

- [ ] **Step 3: Update Tailwind config to reference CSS variables**

Replace the full contents of `template/tailwind.config.js` with:

```js
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: 'var(--font-display)',
        body: 'var(--font-body)',
        sans: 'var(--font-body)',
      },
      colors: {
        primary: {
          50: 'var(--color-primary-50)',
          100: 'var(--color-primary-100)',
          200: 'var(--color-primary-200)',
          300: 'var(--color-primary-300)',
          400: 'var(--color-primary-400)',
          500: 'var(--color-primary-500)',
          600: 'var(--color-primary-600)',
          700: 'var(--color-primary-700)',
          800: 'var(--color-primary-800)',
          900: 'var(--color-primary-900)',
        },
        accent: {
          50: 'var(--color-accent-50)',
          100: 'var(--color-accent-100)',
          200: 'var(--color-accent-200)',
          300: 'var(--color-accent-300)',
          400: 'var(--color-accent-400)',
          500: 'var(--color-accent-500)',
          600: 'var(--color-accent-600)',
          700: 'var(--color-accent-700)',
          800: 'var(--color-accent-800)',
          900: 'var(--color-accent-900)',
        },
        neutral: {
          50: 'var(--color-neutral-50)',
          100: 'var(--color-neutral-100)',
          200: 'var(--color-neutral-200)',
          300: 'var(--color-neutral-300)',
          400: 'var(--color-neutral-400)',
          500: 'var(--color-neutral-500)',
          600: 'var(--color-neutral-600)',
          700: 'var(--color-neutral-700)',
          800: 'var(--color-neutral-800)',
          900: 'var(--color-neutral-900)',
          950: 'var(--color-neutral-950)',
        },
        surface: {
          DEFAULT: 'var(--color-surface)',
          muted: 'var(--color-surface-muted)',
          raised: 'var(--color-surface-raised)',
          dark: 'var(--color-surface-dark)',
        },
      },
      borderRadius: {
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        xl: 'var(--radius-xl)',
        '2xl': 'var(--radius-2xl)',
        '3xl': 'var(--radius-3xl)',
        full: 'var(--radius-full)',
      },
      boxShadow: {
        sm: 'var(--shadow-sm)',
        md: 'var(--shadow-md)',
        lg: 'var(--shadow-lg)',
        xl: 'var(--shadow-xl)',
        '2xl': 'var(--shadow-2xl)',
      },
    },
  },
  plugins: [],
};
```

- [ ] **Step 4: Commit**

```bash
git add template/src/shared/tokens/theme.css template/src/index.css template/tailwind.config.js
git commit -m "feat: add design token system with CSS custom properties and Tailwind integration"
```

---

### Task 2: Animation Presets

**Files:**
- Create: `template/src/shared/lib/motion.ts`

- [ ] **Step 1: Create the motion presets file**

Create `template/src/shared/lib/motion.ts`:

```ts
import type { Variants, Transition } from 'framer-motion';

export const variants = {
  fadeUp: {
    hidden: { opacity: 0, y: 24 },
    visible: { opacity: 1, y: 0 },
  },
  fadeIn: {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  },
  slideLeft: {
    hidden: { opacity: 0, x: -24 },
    visible: { opacity: 1, x: 0 },
  },
  slideRight: {
    hidden: { opacity: 0, x: 24 },
    visible: { opacity: 1, x: 0 },
  },
  scaleUp: {
    hidden: { opacity: 0, scale: 0.92 },
    visible: { opacity: 1, scale: 1 },
  },
} satisfies Record<string, Variants>;

export function staggerContainer(staggerDelay = 0.08): Variants {
  return {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: staggerDelay, delayChildren: 0.1 },
    },
  };
}

export function delayedVariant(base: Variants, delay: number): Variants {
  const visible = base.visible as Record<string, unknown>;
  const existingTransition = (visible.transition ?? {}) as Record<string, unknown>;

  return {
    ...base,
    visible: {
      ...visible,
      transition: { ...existingTransition, delay },
    },
  };
}

export const transitions = {
  fast: { duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] } as Transition,
  normal: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] } as Transition,
  slow: { duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] } as Transition,
  spring: { type: 'spring', damping: 25, stiffness: 300 } as Transition,
};

export const hover = {
  lift: { y: -4, transition: { duration: 0.2 } },
  scale: { scale: 1.02, transition: { duration: 0.2 } },
  glow: { boxShadow: '0 20px 40px -12px rgba(0, 0, 0, 0.15)', transition: { duration: 0.2 } },
};

export const tap = {
  press: { scale: 0.95 },
  subtle: { scale: 0.98 },
};

export const VIEWPORT_MARGIN = '-120px';
```

- [ ] **Step 2: Commit**

```bash
git add template/src/shared/lib/motion.ts
git commit -m "feat: add centralized Framer Motion animation presets"
```

---

### Task 3: Shared Primitive Components

**Files:**
- Create: `template/src/shared/components/Section.tsx`
- Create: `template/src/shared/components/AnimatedContainer.tsx`
- Create: `template/src/shared/components/Button.tsx`
- Create: `template/src/shared/components/Card.tsx`
- Create: `template/src/shared/components/SectionHeader.tsx`
- Create: `template/src/shared/components/IconContainer.tsx`
- Create: `template/src/shared/components/index.ts`

- [ ] **Step 1: Create Section.tsx**

Create `template/src/shared/components/Section.tsx`:

```tsx
import type { ReactNode } from 'react';

const backgroundClasses = {
  default: 'bg-transparent',
  muted: 'bg-surface-muted',
  dark: 'bg-neutral-950 text-white',
  gradient:
    'bg-gradient-to-br from-primary-600 via-sky-600 to-cyan-500 text-white',
} as const;

const spacingClasses = {
  sm: 'py-12 sm:py-16',
  md: 'py-16 sm:py-20',
  lg: 'py-20 sm:py-28',
} as const;

type SectionProps = {
  id?: string;
  children: ReactNode;
  className?: string;
  background?: keyof typeof backgroundClasses;
  spacing?: keyof typeof spacingClasses;
};

export function Section({
  id,
  children,
  className = '',
  background = 'default',
  spacing = 'md',
}: SectionProps) {
  return (
    <section
      id={id}
      className={`px-[var(--section-padding-x)] ${spacingClasses[spacing]} ${backgroundClasses[background]} ${className}`.trim()}
    >
      <div className="mx-auto max-w-[var(--container-max)]">{children}</div>
    </section>
  );
}
```

- [ ] **Step 2: Create AnimatedContainer.tsx**

Create `template/src/shared/components/AnimatedContainer.tsx`:

```tsx
import { motion, useInView } from 'framer-motion';
import type { ReactNode } from 'react';
import { useRef } from 'react';

import {
  variants as motionVariants,
  staggerContainer,
  transitions,
  VIEWPORT_MARGIN,
} from '../lib/motion';

type AnimationName = keyof typeof motionVariants;

type AnimatedContainerProps = {
  children: ReactNode;
  className?: string;
  animation?: AnimationName;
  delay?: number;
  speed?: keyof typeof transitions;
  stagger?: boolean;
  staggerDelay?: number;
  as?: 'div' | 'article' | 'ul';
};

export function AnimatedContainer({
  children,
  className = '',
  animation = 'fadeUp',
  delay = 0,
  speed = 'normal',
  stagger = false,
  staggerDelay = 0.08,
  as = 'div',
}: AnimatedContainerProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const isInView = useInView(ref, { once: true, margin: VIEWPORT_MARGIN });

  const selectedVariants = stagger
    ? staggerContainer(staggerDelay)
    : motionVariants[animation];

  const transition = {
    ...transitions[speed],
    delay,
  };

  const Component = motion[as];

  return (
    <Component
      ref={ref}
      className={className}
      variants={selectedVariants}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
      transition={stagger ? undefined : transition}
    >
      {children}
    </Component>
  );
}
```

- [ ] **Step 3: Create Button.tsx**

Create `template/src/shared/components/Button.tsx`:

```tsx
import { motion } from 'framer-motion';
import type { ButtonHTMLAttributes, AnchorHTMLAttributes, ReactNode } from 'react';

import { hover, tap } from '../lib/motion';

const variantClasses = {
  primary:
    'bg-primary-600 text-white shadow-lg hover:bg-primary-700 hover:shadow-xl',
  secondary:
    'border-2 border-neutral-200 bg-white/80 text-neutral-900 backdrop-blur hover:bg-white',
  ghost: 'text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900',
  outline:
    'border border-white/30 text-white hover:bg-white/10',
} as const;

const sizeClasses = {
  sm: 'px-4 py-2 text-sm',
  md: 'px-6 py-3.5 text-sm sm:px-8 sm:py-4 sm:text-base',
  lg: 'px-8 py-4 text-base sm:px-10 sm:py-5 sm:text-lg',
} as const;

type CommonButtonProps = {
  variant?: keyof typeof variantClasses;
  size?: keyof typeof sizeClasses;
  rounded?: boolean;
  icon?: ReactNode;
  iconPosition?: 'left' | 'right';
  children: ReactNode;
  className?: string;
};

type AsButton = CommonButtonProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, keyof CommonButtonProps> & {
    as?: 'button';
    href?: never;
  };

type AsAnchor = CommonButtonProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof CommonButtonProps> & {
    as: 'a';
    href: string;
  };

type ButtonProps = AsButton | AsAnchor;

export function Button({
  variant = 'primary',
  size = 'md',
  rounded = true,
  icon,
  iconPosition = 'right',
  children,
  className = '',
  as = 'button',
  ...rest
}: ButtonProps) {
  const roundedClass = rounded ? 'rounded-full' : 'rounded-xl';
  const classes =
    `inline-flex items-center justify-center font-semibold transition-all ${roundedClass} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`.trim();

  const content = (
    <>
      {icon && iconPosition === 'left' && <span className="mr-2">{icon}</span>}
      {children}
      {icon && iconPosition === 'right' && <span className="ml-2">{icon}</span>}
    </>
  );

  if (as === 'a') {
    const anchorProps = rest as AnchorHTMLAttributes<HTMLAnchorElement>;

    return (
      <motion.a
        className={classes}
        whileHover={hover.scale}
        whileTap={tap.press}
        {...anchorProps}
      >
        {content}
      </motion.a>
    );
  }

  const buttonProps = rest as ButtonHTMLAttributes<HTMLButtonElement>;

  return (
    <motion.button
      className={classes}
      whileHover={hover.scale}
      whileTap={tap.press}
      {...buttonProps}
    >
      {content}
    </motion.button>
  );
}
```

- [ ] **Step 4: Create Card.tsx**

Create `template/src/shared/components/Card.tsx`:

```tsx
import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

import { variants as motionVariants, transitions, hover } from '../lib/motion';

const variantClasses = {
  elevated:
    'border border-neutral-200 bg-white/80 shadow-sm backdrop-blur',
  outlined: 'border border-neutral-200 bg-transparent',
  filled: 'bg-neutral-950 text-white',
  glass:
    'border border-white/60 bg-white/85 shadow-2xl backdrop-blur',
} as const;

const paddingClasses = {
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
} as const;

type CardProps = {
  children: ReactNode;
  className?: string;
  variant?: keyof typeof variantClasses;
  hover?: boolean;
  padding?: keyof typeof paddingClasses;
  delay?: number;
  animated?: boolean;
};

export function Card({
  children,
  className = '',
  variant = 'elevated',
  hover: enableHover = true,
  padding = 'md',
  delay = 0,
  animated = false,
}: CardProps) {
  const classes =
    `rounded-3xl transition-all duration-300 ${variantClasses[variant]} ${paddingClasses[padding]} ${enableHover ? 'hover:-translate-y-1 hover:shadow-xl' : ''} ${className}`.trim();

  if (animated) {
    return (
      <motion.div
        className={classes}
        variants={motionVariants.fadeUp}
        transition={{ ...transitions.normal, delay }}
        whileHover={enableHover ? hover.lift : undefined}
      >
        {children}
      </motion.div>
    );
  }

  return <div className={classes}>{children}</div>;
}
```

- [ ] **Step 5: Create SectionHeader.tsx**

Create `template/src/shared/components/SectionHeader.tsx`:

```tsx
import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';

import { transitions, VIEWPORT_MARGIN } from '../lib/motion';

type SectionHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  alignment?: 'left' | 'center';
  className?: string;
};

export function SectionHeader({
  eyebrow,
  title,
  description,
  alignment = 'center',
  className = '',
}: SectionHeaderProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const isInView = useInView(ref, { once: true, margin: VIEWPORT_MARGIN });

  const alignmentClass = alignment === 'center' ? 'mx-auto max-w-3xl text-center' : 'max-w-2xl';

  return (
    <motion.div
      ref={ref}
      className={`${alignmentClass} ${className}`.trim()}
      initial={{ opacity: 0, y: 24 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={transitions.normal}
    >
      {eyebrow ? <p className="section-eyebrow">{eyebrow}</p> : null}
      <h2 className="section-title">{title}</h2>
      {description ? <p className="section-copy">{description}</p> : null}
    </motion.div>
  );
}
```

- [ ] **Step 6: Create IconContainer.tsx**

Create `template/src/shared/components/IconContainer.tsx`:

```tsx
import type { LucideIcon } from 'lucide-react';

const sizeClasses = {
  sm: 'h-10 w-10',
  md: 'h-12 w-12',
  lg: 'h-14 w-14',
} as const;

const iconSizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-6 w-6',
} as const;

const variantClasses = {
  primary:
    'bg-primary-50 text-primary-600 group-hover:bg-primary-600 group-hover:text-white',
  muted: 'bg-neutral-100 text-neutral-600',
  dark: 'bg-white/10 text-primary-300',
  outlined: 'border border-neutral-200 text-neutral-500',
} as const;

type IconContainerProps = {
  icon: LucideIcon;
  size?: keyof typeof sizeClasses;
  variant?: keyof typeof variantClasses;
  className?: string;
};

export function IconContainer({
  icon: Icon,
  size = 'md',
  variant = 'primary',
  className = '',
}: IconContainerProps) {
  return (
    <div
      className={`flex items-center justify-center rounded-2xl transition-colors ${sizeClasses[size]} ${variantClasses[variant]} ${className}`.trim()}
    >
      <Icon className={iconSizeClasses[size]} />
    </div>
  );
}
```

- [ ] **Step 7: Create barrel export**

Create `template/src/shared/components/index.ts`:

```ts
export { Section } from './Section';
export { AnimatedContainer } from './AnimatedContainer';
export { Button } from './Button';
export { Card } from './Card';
export { SectionHeader } from './SectionHeader';
export { IconContainer } from './IconContainer';
```

- [ ] **Step 8: Commit**

```bash
git add template/src/shared/components/
git commit -m "feat: add shared primitive components (Section, AnimatedContainer, Button, Card, SectionHeader, IconContainer)"
```

---

### Task 4: Expand Site Config and index.html

**Files:**
- Modify: `template/src/shared/config/site.ts`
- Modify: `template/index.html`

- [ ] **Step 1: Expand site.ts**

Replace the full contents of `template/src/shared/config/site.ts` with:

```ts
export const siteConfig = {
  appName: '__APP_NAME__',
  packageName: '__PACKAGE_NAME__',
  tagline: 'Mobile-first starter',
  menuTagline: 'Neutral starter',
  footerDescription:
    'A neutral single-page starter built for fast customization, polished responsive layouts, and premium brand presentation.',
  fonts: {
    display: 'Inter',
    body: 'Inter',
    googleFontsUrl:
      'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap',
  },
  meta: {
    title: '__APP_NAME__',
    description: '__SITE_DESCRIPTION__',
    url: '__SITE_URL__',
  },
};
```

- [ ] **Step 2: Update index.html**

Replace the full contents of `template/index.html` with:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="theme-color" content="#2563eb" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
    <title>__APP_NAME__</title>
    <meta name="description" content="__SITE_DESCRIPTION__" />
    <meta property="og:title" content="__APP_NAME__" />
    <meta property="og:description" content="__SITE_DESCRIPTION__" />
    <meta property="og:url" content="__SITE_URL__" />
    <meta property="og:type" content="website" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="__APP_NAME__" />
    <meta name="twitter:description" content="__SITE_DESCRIPTION__" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 3: Commit**

```bash
git add template/src/shared/config/site.ts template/index.html
git commit -m "feat: expand site config with font/meta fields and enhance index.html meta tags"
```

---

### Task 5: Refactor Existing Sections to Use Primitives

**Files:**
- Modify: `template/src/features/site-template/sections/HeroSection.tsx`
- Modify: `template/src/features/site-template/sections/FeaturesSection.tsx`
- Modify: `template/src/features/site-template/sections/ShowcaseSection.tsx`
- Modify: `template/src/features/site-template/sections/CtaSection.tsx`
- Modify: `template/src/features/site-template/sections/HeaderSection.tsx`
- Modify: `template/src/features/site-template/sections/FooterSection.tsx`

- [ ] **Step 1: Refactor FeaturesSection.tsx**

Replace the full contents of `template/src/features/site-template/sections/FeaturesSection.tsx` with:

```tsx
import { motion } from 'framer-motion';

import { featureCards } from '../content';
import {
  AnimatedContainer,
  Card,
  IconContainer,
  Section,
  SectionHeader,
} from '../../../shared/components';
import { variants, transitions } from '../../../shared/lib/motion';

export function FeaturesSection() {
  return (
    <Section id="features">
      <SectionHeader
        eyebrow="Template foundation"
        title="A starter that is minimal, reusable, and ready for premium website work."
        description="Everything here is intentionally generic so you can shape it into the next brand, launch, studio, or product experience without carrying over old company content."
      />

      <AnimatedContainer
        className="mt-14 grid gap-5 sm:grid-cols-2 xl:grid-cols-3"
        stagger
      >
        {featureCards.map((feature, index) => (
          <motion.div
            key={feature.title}
            variants={variants.fadeUp}
            transition={{ ...transitions.normal, delay: index * 0.08 }}
          >
            <Card variant="elevated" className="group h-full">
              <IconContainer icon={feature.icon} />
              <h3 className="mt-5 text-xl font-semibold text-neutral-900">
                {feature.title}
              </h3>
              <p className="mt-3 text-sm leading-7 text-neutral-600">
                {feature.description}
              </p>
            </Card>
          </motion.div>
        ))}
      </AnimatedContainer>
    </Section>
  );
}
```

- [ ] **Step 2: Refactor ShowcaseSection.tsx**

Replace the full contents of `template/src/features/site-template/sections/ShowcaseSection.tsx` with:

```tsx
import { motion } from 'framer-motion';

import { showcaseItems, showcaseStats } from '../content';
import {
  AnimatedContainer,
  Card,
  IconContainer,
  Section,
  SectionHeader,
} from '../../../shared/components';
import { variants, transitions, VIEWPORT_MARGIN } from '../../../shared/lib/motion';

export function ShowcaseSection() {
  return (
    <Section id="showcase">
      <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
        <AnimatedContainer animation="slideLeft">
          <SectionHeader
            eyebrow="Showcase patterns"
            title="Use these starter patterns for featured work, proof, services, or stories."
            description="The layout stays intentionally broad so it can support many website types. Use this area for featured work, differentiators, testimonials, galleries, editorial blocks, or product proof."
            alignment="left"
          />

          <div className="mt-10 grid gap-4">
            {showcaseItems.map((item, index) => {
              const Icon = item.icon;

              return (
                <motion.article
                  key={item.title}
                  className="rounded-3xl border border-neutral-200 bg-white/85 p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                  variants={variants.fadeUp}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, margin: VIEWPORT_MARGIN }}
                  transition={{ ...transitions.normal, delay: index * 0.1 }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-xl font-semibold text-neutral-900">
                        {item.title}
                      </h3>
                      <p className="mt-3 max-w-xl text-sm leading-7 text-neutral-600">
                        {item.description}
                      </p>
                    </div>
                    <IconContainer icon={Icon} variant="outlined" size="sm" />
                  </div>
                </motion.article>
              );
            })}
          </div>
        </AnimatedContainer>

        <AnimatedContainer animation="slideRight" delay={0.1}>
          <Card variant="filled" padding="md" hover={false}>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <p className="text-xs uppercase tracking-[0.3em] text-neutral-400">
                Starter notes
              </p>
              <h3 className="mt-4 text-2xl font-semibold">
                Keep the stack. Change the story.
              </h3>
              <p className="mt-4 text-sm leading-7 text-neutral-300">
                Vite, React, Tailwind, Framer Motion, and Lucide already give you a
                strong base for world-class websites. Most of the impact comes from
                strong art direction, careful spacing, fast images, and intentional
                motion.
              </p>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
              {showcaseStats.map((item, index) => {
                const Icon = item.icon;

                return (
                  <motion.div
                    key={item.label}
                    className="rounded-3xl border border-white/10 bg-white/5 p-5"
                    variants={variants.fadeUp}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: VIEWPORT_MARGIN }}
                    transition={{
                      ...transitions.normal,
                      delay: 0.2 + index * 0.1,
                    }}
                  >
                    <Icon className="h-5 w-5 text-primary-300" />
                    <p className="mt-4 text-xs uppercase tracking-[0.25em] text-neutral-400">
                      {item.label}
                    </p>
                    <p className="mt-2 text-lg font-semibold text-white">
                      {item.value}
                    </p>
                  </motion.div>
                );
              })}
            </div>
          </Card>
        </AnimatedContainer>
      </div>
    </Section>
  );
}
```

- [ ] **Step 3: Refactor CtaSection.tsx**

Replace the full contents of `template/src/features/site-template/sections/CtaSection.tsx` with:

```tsx
import { motion } from 'framer-motion';
import { ArrowRight, Check } from 'lucide-react';

import { ctaChecklist } from '../content';
import { Section, Button } from '../../../shared/components';
import { transitions, VIEWPORT_MARGIN } from '../../../shared/lib/motion';
import { scrollToTop } from '../../../shared/lib/scroll';

export function CtaSection() {
  return (
    <Section id="start">
      <motion.div
        className="overflow-hidden rounded-3xl border border-primary-100 bg-gradient-to-br from-primary-600 via-sky-600 to-cyan-500 px-6 py-10 text-white shadow-2xl shadow-primary-200/40 sm:px-10 lg:px-12"
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: VIEWPORT_MARGIN }}
        transition={transitions.normal}
      >
        <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-white/70">
              Start here
            </p>
            <h2 className="mt-4 text-3xl font-semibold leading-tight sm:text-4xl lg:text-5xl">
              A clean launchpad for your next world-class website.
            </h2>
            <p className="mt-5 max-w-2xl text-sm leading-7 text-white/85 sm:text-base">
              This starter is intentionally neutral so you can keep the project
              setup, replace the current sections, and shape it into the exact site
              you need.
            </p>
            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <Button
                variant="secondary"
                onClick={scrollToTop}
                className="bg-white text-neutral-950 hover:bg-white border-0"
              >
                Back to top
              </Button>
              <Button
                as="a"
                href="#features"
                variant="outline"
                icon={<ArrowRight className="h-4 w-4" />}
              >
                Review starter sections
              </Button>
            </div>
          </div>

          <div className="rounded-[1.75rem] border border-white/15 bg-neutral-950/20 p-6 backdrop-blur-sm">
            <p className="text-sm font-semibold text-white">
              Suggested first steps
            </p>
            <div className="mt-5 space-y-4">
              {ctaChecklist.map((item) => (
                <div key={item} className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-white/15">
                    <Check className="h-4 w-4" />
                  </div>
                  <p className="text-sm leading-7 text-white/85">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </Section>
  );
}
```

- [ ] **Step 4: Refactor FooterSection.tsx**

Replace the full contents of `template/src/features/site-template/sections/FooterSection.tsx` with:

```tsx
import { Section } from '../../../shared/components';
import { siteConfig } from '../../../shared/config/site';

export function FooterSection() {
  return (
    <Section spacing="sm">
      <div className="rounded-3xl border border-neutral-200 bg-neutral-950 px-6 py-10 text-white sm:px-8">
        <div className="grid gap-8 md:grid-cols-3">
          <div>
            <p className="text-lg font-semibold">{siteConfig.appName}</p>
            <p className="mt-3 text-sm leading-7 text-neutral-400">
              {siteConfig.footerDescription}
            </p>
          </div>

          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-neutral-500">
              Included
            </p>
            <p className="mt-3 text-sm leading-7 text-neutral-400">
              Vite, React, TypeScript, Tailwind CSS, Framer Motion, Lucide, and
              the existing project configuration stay in place.
            </p>
          </div>

          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-neutral-500">
              Customize
            </p>
            <p className="mt-3 text-sm leading-7 text-neutral-400">
              Replace the current copy, connect your assets and forms, and expand
              this into the website structure your brand requires.
            </p>
          </div>
        </div>

        <div className="mt-8 border-t border-white/10 pt-6 text-sm text-neutral-500">
          &copy; {new Date().getFullYear()} {siteConfig.appName}. Ready to adapt.
        </div>
      </div>
    </Section>
  );
}
```

- [ ] **Step 5: Refactor HeroSection.tsx**

Replace the full contents of `template/src/features/site-template/sections/HeroSection.tsx` with:

```tsx
import { motion } from 'framer-motion';
import { ArrowRight, CheckCircle2, Layers3, Sparkles } from 'lucide-react';

import { heroHighlights, heroPreviewCards, heroStackSummary } from '../content';
import { Button } from '../../../shared/components';
import {
  staggerContainer,
  variants,
  transitions,
} from '../../../shared/lib/motion';
import { scrollToSection } from '../../../shared/lib/scroll';

export function HeroSection() {
  return (
    <section className="relative overflow-hidden px-[var(--section-padding-x)] pt-24 pb-20 sm:pt-32">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.14),_transparent_35%),radial-gradient(circle_at_bottom_right,_rgba(14,165,233,0.12),_transparent_30%)]" />
      <div className="mx-auto max-w-[var(--container-max)]">
        <motion.div
          className="relative flex flex-col items-center gap-10 lg:grid lg:grid-cols-2 lg:gap-14"
          variants={staggerContainer(0.2)}
          initial="hidden"
          animate="visible"
        >
          <motion.div variants={variants.fadeUp} transition={transitions.normal}>
            <motion.div
              className="mb-6 inline-flex items-center rounded-full border border-primary-100 bg-white/80 px-4 py-2 text-sm font-medium text-primary-700 shadow-sm backdrop-blur"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Sparkles className="mr-2 h-4 w-4" />
              Premium starter for modern websites
            </motion.div>

            <motion.h1
              className="mb-5 text-4xl font-bold leading-tight text-neutral-950 sm:mb-6 sm:text-5xl md:text-6xl"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={transitions.normal}
            >
              Build polished sites
              <motion.span
                className="text-primary-600"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.6 }}
              >
                {' '}
                without starting from zero.
              </motion.span>
            </motion.h1>

            <motion.p
              className="mb-6 text-base leading-relaxed text-neutral-600 sm:mb-8 sm:text-lg md:text-xl"
              variants={variants.fadeUp}
            >
              This template keeps the stack, configuration, and packages in place
              while giving you a clean mobile-first foundation for high-end
              launches, portfolios, product pages, and company sites.
            </motion.p>

            <motion.div
              className="flex flex-col gap-4 sm:flex-row"
              variants={variants.fadeUp}
            >
              <Button
                onClick={() => scrollToSection('start')}
                icon={<ArrowRight className="h-4 w-4 sm:h-5 sm:w-5" />}
              >
                Start With This Template
              </Button>

              <Button
                variant="secondary"
                onClick={() => scrollToSection('features')}
                icon={<Layers3 className="h-4 w-4 sm:h-5 sm:w-5" />}
                iconPosition="left"
              >
                Explore Sections
              </Button>
            </motion.div>

            <motion.div
              className="mt-8 space-y-3"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              {heroHighlights.map((item) => (
                <div
                  key={item}
                  className="flex items-start gap-3 text-sm text-neutral-600 sm:text-base"
                >
                  <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary-600" />
                  <span>{item}</span>
                </div>
              ))}
            </motion.div>
          </motion.div>

          <div className="w-full">
            <motion.div
              className="relative mx-auto max-w-xl"
              variants={variants.scaleUp}
              initial="hidden"
              animate="visible"
              transition={transitions.slow}
            >
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-primary-400 via-sky-400 to-cyan-300 opacity-90 blur-2xl" />
              <div className="relative overflow-hidden rounded-3xl border border-white/60 bg-white/85 p-5 shadow-2xl shadow-neutral-300/50 backdrop-blur xl:p-6">
                <div className="rounded-2xl border border-neutral-200 bg-neutral-950 p-4 text-white">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-[0.3em] text-neutral-400">
                        Starter Preview
                      </p>
                      <h2 className="mt-2 text-xl font-semibold">
                        World-class website base
                      </h2>
                    </div>
                    <div className="rounded-full bg-white/10 px-3 py-1 text-xs text-neutral-200">
                      Ready to adapt
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    {heroPreviewCards.map((card) => {
                      const Icon = card.icon;

                      return (
                        <div key={card.title} className="rounded-2xl bg-white/5 p-4">
                          <Icon className="h-5 w-5 text-primary-300" />
                          <p className="mt-4 text-sm font-medium text-white">
                            {card.title}
                          </p>
                          <p className="mt-2 text-sm text-neutral-300">
                            {card.description}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  {heroStackSummary.map((item) => (
                    <div
                      key={item.label}
                      className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm"
                    >
                      <p className="text-xs uppercase tracking-[0.2em] text-neutral-400">
                        {item.label}
                      </p>
                      <p className="mt-2 text-sm font-semibold text-neutral-900">
                        {item.value}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
```

- [ ] **Step 6: Refactor HeaderSection.tsx**

Replace the full contents of `template/src/features/site-template/sections/HeaderSection.tsx` with:

```tsx
import { AnimatePresence, motion } from 'framer-motion';
import { Menu, Sparkles, X } from 'lucide-react';
import { useEffect, useState } from 'react';

import { navigationSections } from '../content';
import { Button } from '../../../shared/components';
import { siteConfig } from '../../../shared/config/site';
import { scrollToSection, scrollToTop } from '../../../shared/lib/scroll';

function getNavLinkClass(
  activeSection: string,
  sectionId: string,
  isMobile = false,
): string {
  if (sectionId === 'start') {
    return activeSection === 'start'
      ? 'bg-primary-700 text-white px-5 py-2.5 rounded-full hover:bg-primary-800 transition-colors font-medium'
      : 'bg-primary-600 text-white px-5 py-2.5 rounded-full hover:bg-primary-700 transition-colors font-medium';
  }

  if (isMobile) {
    return activeSection === sectionId
      ? 'text-primary-600 font-semibold transition-colors'
      : 'text-neutral-700 hover:text-primary-600 transition-colors font-medium';
  }

  return activeSection === sectionId
    ? 'text-primary-600 border-b-2 border-primary-600 pb-1 transition-colors font-medium'
    : 'text-neutral-700 hover:text-primary-600 transition-colors font-medium';
}

export function HeaderSection() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('');

  useEffect(() => {
    const trackedSections: {
      id: string;
      element: HTMLElement;
      ratio: number;
    }[] = [];

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const index = trackedSections.findIndex(
            ({ id }) => id === entry.target.id,
          );

          if (index >= 0) {
            trackedSections[index].ratio = entry.intersectionRatio;
          }
        });

        const visibleSections = trackedSections.filter(
          ({ ratio }) => ratio > 0,
        );

        if (visibleSections.length === 0) {
          return;
        }

        const mostVisibleSection = visibleSections.reduce(
          (currentBest, candidate) =>
            candidate.ratio > currentBest.ratio ? candidate : currentBest,
        );

        setActiveSection(mostVisibleSection.id);
      },
      {
        threshold: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1],
        rootMargin: '-100px 0px -40% 0px',
      },
    );

    navigationSections.forEach(({ id }) => {
      const section = document.getElementById(id);

      if (!section) {
        return;
      }

      trackedSections.push({ id, element: section, ratio: 0 });
      observer.observe(section);
    });

    return () => {
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    document.body.style.overflow = isMenuOpen ? 'hidden' : '';

    return () => {
      document.body.style.overflow = '';
    };
  }, [isMenuOpen]);

  function handleScrollToSection(sectionId: string): void {
    scrollToSection(sectionId);
    setIsMenuOpen(false);
  }

  function handleScrollToTop(): void {
    scrollToTop();
    setIsMenuOpen(false);
    setActiveSection('');
  }

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 w-full overflow-hidden border-b border-white/60 bg-white/80 shadow-sm backdrop-blur-xl">
        <nav className="mx-auto w-full max-w-[var(--container-max)] px-[var(--section-padding-x)]">
          <div className="flex h-16 items-center justify-between md:h-20">
            <button
              onClick={handleScrollToTop}
              className="flex cursor-pointer items-center space-x-3 transition-opacity hover:opacity-80"
              aria-label="Scroll to top"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary-600 text-white shadow-lg shadow-primary-200/60">
                <Sparkles className="h-5 w-5" />
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-neutral-900">
                  {siteConfig.appName}
                </p>
                <p className="text-xs text-neutral-500">{siteConfig.tagline}</p>
              </div>
            </button>

            <div className="hidden items-center space-x-6 md:flex lg:space-x-8">
              {navigationSections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => handleScrollToSection(section.id)}
                  className={getNavLinkClass(activeSection, section.id)}
                >
                  {section.label}
                </button>
              ))}
            </div>

            <button
              className="relative z-50 -mr-2 p-2 md:hidden"
              onClick={() => setIsMenuOpen((currentValue) => !currentValue)}
              aria-label="Toggle menu"
              aria-expanded={isMenuOpen}
            >
              {isMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </nav>
      </header>

      <AnimatePresence>
        {isMenuOpen ? (
          <>
            <motion.div
              className="fixed inset-0 z-[60] bg-black/50 md:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setIsMenuOpen(false)}
            />
            <motion.div
              className="fixed top-0 right-0 z-[70] h-full w-72 max-w-[85vw] overflow-hidden bg-white shadow-2xl sm:w-80 md:hidden"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            >
              <div className="flex h-full flex-col">
                <div className="flex items-center justify-between border-b p-4 sm:p-6">
                  <div>
                    <p className="text-sm font-semibold text-neutral-900">
                      {siteConfig.appName}
                    </p>
                    <p className="text-xs text-neutral-500">
                      {siteConfig.menuTagline}
                    </p>
                  </div>
                  <button
                    onClick={() => setIsMenuOpen(false)}
                    className="rounded-lg p-2 transition-colors hover:bg-neutral-100"
                    aria-label="Close menu"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>
                <nav className="flex-1 overflow-y-auto p-4 sm:p-6">
                  <div className="flex flex-col space-y-1">
                    {navigationSections.map((section) => (
                      <button
                        key={section.id}
                        onClick={() => handleScrollToSection(section.id)}
                        className={`${getNavLinkClass(activeSection, section.id, true)} rounded-lg px-4 py-3 text-left transition-colors hover:bg-neutral-50 ${section.id === 'start' ? 'mt-2 w-full' : ''}`}
                      >
                        {section.label}
                      </button>
                    ))}
                  </div>

                  <div className="mt-8 rounded-2xl border border-primary-100 bg-primary-50 p-5">
                    <p className="text-sm font-semibold text-neutral-900">
                      Ready to customize
                    </p>
                    <p className="mt-2 text-sm leading-relaxed text-neutral-600">
                      Swap in your content, connect your forms, and replace the
                      starter sections with the exact experience you need.
                    </p>
                  </div>
                </nav>
              </div>
            </motion.div>
          </>
        ) : null}
      </AnimatePresence>
    </>
  );
}
```

- [ ] **Step 7: Update App.tsx to use semantic main tag**

Replace the full contents of `template/src/App.tsx` with:

```tsx
import {
  CtaSection,
  FeaturesSection,
  FooterSection,
  HeaderSection,
  HeroSection,
  ShowcaseSection,
} from './features/site-template';

export function App() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-surface">
      <HeaderSection />
      <main>
        <HeroSection />
        <FeaturesSection />
        <ShowcaseSection />
        <CtaSection />
      </main>
      <FooterSection />
    </div>
  );
}
```

- [ ] **Step 8: Commit**

```bash
git add template/src/features/site-template/sections/ template/src/App.tsx
git commit -m "refactor: update all sections to use shared primitives, motion presets, and design tokens"
```

---

### Task 6: AI Instruction Expansion — Cursor Rules

**Files:**
- Create: `template/_cursor/rules/visual-design-principles.mdc`
- Create: `template/_cursor/rules/animation-motion.mdc`
- Create: `template/_cursor/rules/accessibility.mdc`
- Create: `template/_cursor/rules/component-patterns.mdc`

- [ ] **Step 1: Create visual-design-principles.mdc**

Create `template/_cursor/rules/visual-design-principles.mdc`:

```markdown
---
description: Enforce world-class visual design quality in all UI work
alwaysApply: true
---

# Visual Design Principles

## Layout & Spacing
- Use generous whitespace. Sections should breathe with 80-120px vertical padding on desktop, 64-80px on mobile. When in doubt, add more space, not more content.
- Maintain consistent vertical rhythm using the spacing scale from the design tokens in `src/shared/tokens/theme.css`.
- Content containers max out at `var(--container-max)`. Never let body text span the full viewport width.

## Color
- Apply the 60-30-10 rule: 60% neutral/background, 30% secondary, 10% primary accent. Never flood a section with primary color unless it's an intentional CTA break.
- Use the semantic color tokens (`--color-surface`, `--color-text-primary`, etc.) for consistency. Avoid hardcoding hex values.
- To rebrand the site, edit `src/shared/tokens/theme.css` only. Every component reads from these tokens through Tailwind.

## Typography
- Hero headlines: bold or extrabold, tight leading, tight tracking. Maximum 8-12 words.
- Section titles: semibold or bold, tight leading. Maximum 15 words.
- Body copy: regular weight, relaxed leading (1.6-1.8 line height). Maximum 65-75 characters per line for readability.
- Eyebrow text: small, uppercase, wide tracking, muted or primary color. Used to categorize, not describe.
- Never center-align body paragraphs longer than 3 lines. Left-align for readability.
- Use a maximum of 3 font weights per page. More creates visual noise.

## Surfaces & Depth
- Cards, containers, and interactive elements should use consistent border radius from the token scale. Do not mix sharp and rounded corners in the same visual context.
- Shadows should be subtle and purposeful. Use tinted shadows matching the surface color for a premium feel. Reserve strong shadows for elevated interactive elements.
- Prefer the glassmorphism (backdrop-blur + semi-transparent bg) pattern for floating elements like the header nav.

## Imagery & Decoration
- Use gradient backgrounds sparingly — one per page as a hero or CTA accent, not on every section.
- Decorative blurs and glows should stay below 15% opacity and above 40px blur for subtlety.
- Prefer image aspect ratios of 16:9, 4:3, or 1:1 for consistency. Use `object-cover` for hero and card images. Never stretch or distort.

## Responsive Design
- Design mobile-first. Every section must look intentional on a 375px viewport, not just "shrunk."
- Stack horizontal layouts vertically on mobile. Do not rely solely on flex-wrap — intentionally reorder and resize for small screens.
- Touch targets must be minimum 44x44px. Buttons should be full-width on mobile unless two buttons fit comfortably side-by-side.
- Image and card grids: 1 column on mobile, 2 on tablet, 3 on desktop. Never show a single lonely card on a wide row.
```

- [ ] **Step 2: Create animation-motion.mdc**

Create `template/_cursor/rules/animation-motion.mdc`:

```markdown
---
description: Guide animation and motion implementation for premium feel
alwaysApply: true
---

# Animation & Motion

## General Principles
- Motion should enhance understanding and create polish, never distract. If an animation doesn't serve a purpose, remove it.
- Page load animations should complete within 1 second. Do not make users wait for content.
- Respect `prefers-reduced-motion`. All motion should degrade gracefully to instant transitions.

## Scroll-Triggered Entrances
- Use the `AnimatedContainer` component from `src/shared/components/` or the presets from `src/shared/lib/motion.ts` for scroll-triggered reveals.
- Default entrance: fade-up with 16-24px Y translation. This is the workhorse animation.
- Stagger children in grids and lists by 60-100ms. Never stagger more than 6-8 items — beyond that, use a single group entrance.
- Use `whileInView` or `useInView` with `once: true` so elements only animate on first appearance.

## Hover & Interaction
- Hover effects should be micro: 1-2px lift with shadow change, or subtle background color shift.
- Button hover: scale by 1.02-1.05x maximum. Use the `hover` and `tap` presets from `src/shared/lib/motion.ts`.
- Cards: translate-y by -4px on hover with increased shadow. Use the `hover.lift` preset.
- Never animate font-size, width, or height on hover — these cause layout shifts.

## Timing & Easing
- Use the named transitions from `src/shared/lib/motion.ts` (`transitions.fast`, `.normal`, `.slow`, `.spring`).
- Entrances: use `transitions.normal` (500ms) or `transitions.slow` (700ms).
- Hover/tap: use `transitions.fast` (300ms).
- Overlays and modals: use `transitions.spring` for natural feel.
- Never use linear easing for UI motion. Always use ease-out or spring.

## Presets Reference
- Variant presets: `variants.fadeUp`, `variants.fadeIn`, `variants.slideLeft`, `variants.slideRight`, `variants.scaleUp`
- Container: `staggerContainer(delay)` for staggered children
- Transitions: `transitions.fast`, `transitions.normal`, `transitions.slow`, `transitions.spring`
- Hover: `hover.lift`, `hover.scale`, `hover.glow`
- Tap: `tap.press`, `tap.subtle`
```

- [ ] **Step 3: Create accessibility.mdc**

Create `template/_cursor/rules/accessibility.mdc`:

```markdown
---
description: Enforce accessibility standards in all UI work
alwaysApply: true
---

# Accessibility

## Color & Contrast
- Color contrast must meet WCAG AA: 4.5:1 for body text, 3:1 for large text (18px+) and UI elements.
- Never rely on color alone to convey information. Pair color with icons, text, or patterns.
- Test light text on colored backgrounds. Primary-600 on white passes AA; primary-400 likely does not.

## Focus & Keyboard
- All interactive elements must have visible focus states using `focus-visible` with a 2px ring offset. The base style is already in `src/index.css`.
- Navigation must be fully keyboard-accessible: Tab through links, Enter to activate, Escape to close overlays.
- Mobile menu must trap focus while open and return focus to the trigger on close.
- Skip-link or logical heading hierarchy so screen reader users can navigate sections.

## Semantic HTML
- Use correct landmarks: `<header>`, `<nav>`, `<main>`, `<section>`, `<article>`, `<footer>`.
- Every page must have exactly one `<main>` element.
- Use `<h1>` through `<h6>` in proper order. Never skip heading levels.
- Use `<button>` for actions and `<a>` for navigation. Never use `<div onClick>`.

## ARIA & Screen Readers
- Icon-only buttons must have `aria-label` describing the action.
- Toggle buttons (like menu open/close) must have `aria-expanded`.
- Decorative images use `alt=""`. Meaningful images use descriptive alt text.
- Live regions (`aria-live`) for dynamic content that changes without page reload (toast notifications, form errors).

## Motion
- Wrap all animations so they respect `prefers-reduced-motion: reduce`. Framer Motion does this by default, but verify custom CSS animations also honor it.
```

- [ ] **Step 4: Create component-patterns.mdc**

Create `template/_cursor/rules/component-patterns.mdc`:

```markdown
---
description: Guide component composition using shared primitives
alwaysApply: true
---

# Component Patterns

## Shared Primitives
Use the shared primitives from `src/shared/components/` as building blocks for all new sections:

- `Section` — wraps every page section with consistent padding, container width, and background variants (`default`, `muted`, `dark`, `gradient`).
- `AnimatedContainer` — scroll-triggered animation wrapper. Pass `animation` (`fadeUp`, `fadeIn`, `slideLeft`, `slideRight`, `scaleUp`) and optional `stagger` for children.
- `Button` — polymorphic button/anchor with `variant` (`primary`, `secondary`, `ghost`, `outline`), `size`, and icon support. Use `as="a"` for links.
- `Card` — surface primitive with `variant` (`elevated`, `outlined`, `filled`, `glass`), optional hover lift, and padding control.
- `SectionHeader` — the eyebrow + title + description pattern. Use `alignment="left"` or `"center"`.
- `IconContainer` — icon in a colored container with size and variant options.

## Building New Sections
1. Start with `<Section>` as the outer wrapper. Choose the appropriate `background` and `spacing`.
2. Add a `<SectionHeader>` if the section has a heading block.
3. Compose the body from `Card`, `AnimatedContainer`, `Button`, and `IconContainer`.
4. Use motion presets from `src/shared/lib/motion.ts` for any custom animations.
5. Keep content data-driven: define section data in a `content.ts` file within the feature folder, not inline in JSX.

## Content Separation
- Every section's text, labels, and configuration should live in a `content.ts` file alongside the components that render it.
- Components receive content through imports or props — never hardcode user-facing strings in JSX.
- This makes it trivial to rebrand: change `content.ts` and `theme.css`, and the site transforms.

## File Organization
- New features go in `src/features/<feature-name>/` with sections, content, and any feature-specific hooks colocated.
- Shared components live in `src/shared/components/`. Only add to shared if the component is used by 2+ features.
- Shared utilities live in `src/shared/lib/`. Configuration in `src/shared/config/`.
```

- [ ] **Step 5: Commit**

```bash
git add template/_cursor/rules/visual-design-principles.mdc template/_cursor/rules/animation-motion.mdc template/_cursor/rules/accessibility.mdc template/_cursor/rules/component-patterns.mdc
git commit -m "feat: add Cursor rules for visual design, animation, accessibility, and component patterns"
```

---

### Task 7: Expand CLAUDE.md

**Files:**
- Modify: `template/CLAUDE.md` (this is the root CLAUDE.md that applies to the scaffolder project, but the instructions should also be added to a CLAUDE.md in the template itself)
- Create: `template/_CLAUDE.md` (will become `.CLAUDE.md` in scaffolded projects — but CLAUDE.md doesn't use underscore prefix convention, so we need to handle this in the scaffolder)

Note: The template uses underscore-prefix convention for dotfiles (`_gitignore` → `.gitignore`). However, `CLAUDE.md` is not a dotfile, so we should place it directly as `template/CLAUDE.md`.

Wait — looking at the scaffold code, it copies `template/` recursively and renames `_`-prefixed files to `.`-prefixed. There is no `template/CLAUDE.md` currently. We need to create one.

- [ ] **Step 1: Create template/CLAUDE.md**

Create `template/CLAUDE.md`:

```markdown
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

# Yarn Workflow

- Use `yarn` as the package manager for this project. Do not use `npm`, `pnpm`, or `bun`.
- Install dependencies with `yarn install`.
- Run the local website with `yarn dev`.
- Validate production output with `yarn build` before considering work complete.
- Use `yarn preview` to verify the built site locally when needed.
- Run quality checks with `yarn lint` and `yarn typecheck` after meaningful changes.
- When documenting setup or commands, always show the `yarn` version of the command.

# Release Command Mapping

When the user says "release the website" or anything related to asking the website to be released, execute exactly:

`git add . && git commit -m ":rocket: Deploy" && git push`

# Visual Design Principles

## Layout & Spacing
- Use generous whitespace. Sections should breathe with 80-120px vertical padding on desktop, 64-80px on mobile. When in doubt, add more space, not more content.
- Maintain consistent vertical rhythm using the spacing scale from the design tokens in `src/shared/tokens/theme.css`.
- Content containers max out at `var(--container-max)`. Never let body text span the full viewport width.

## Color
- Apply the 60-30-10 rule: 60% neutral/background, 30% secondary, 10% primary accent. Never flood a section with primary color unless it's an intentional CTA break.
- Use the semantic color tokens (`--color-surface`, `--color-text-primary`, etc.) for consistency. Avoid hardcoding hex values.
- To rebrand the site, edit `src/shared/tokens/theme.css` only. Every component reads from these tokens through Tailwind.

## Typography
- Hero headlines: bold or extrabold, tight leading, tight tracking. Maximum 8-12 words.
- Section titles: semibold or bold, tight leading. Maximum 15 words.
- Body copy: regular weight, relaxed leading (1.6-1.8 line height). Maximum 65-75 characters per line for readability.
- Eyebrow text: small, uppercase, wide tracking, muted or primary color. Used to categorize, not describe.
- Never center-align body paragraphs longer than 3 lines. Left-align for readability.
- Use a maximum of 3 font weights per page. More creates visual noise.

## Surfaces & Depth
- Cards, containers, and interactive elements should use consistent border radius from the token scale. Do not mix sharp and rounded corners in the same visual context.
- Shadows should be subtle and purposeful. Use tinted shadows matching the surface color for a premium feel. Reserve strong shadows for elevated interactive elements.
- Prefer the glassmorphism (backdrop-blur + semi-transparent bg) pattern for floating elements like the header nav.

## Imagery & Decoration
- Use gradient backgrounds sparingly — one per page as a hero or CTA accent, not on every section.
- Decorative blurs and glows should stay below 15% opacity and above 40px blur for subtlety.
- Prefer image aspect ratios of 16:9, 4:3, or 1:1 for consistency. Use `object-cover` for hero and card images. Never stretch or distort.

## Responsive Design
- Design mobile-first. Every section must look intentional on a 375px viewport, not just "shrunk."
- Stack horizontal layouts vertically on mobile. Do not rely solely on flex-wrap — intentionally reorder and resize for small screens.
- Touch targets must be minimum 44x44px. Buttons should be full-width on mobile unless two buttons fit comfortably side-by-side.
- Image and card grids: 1 column on mobile, 2 on tablet, 3 on desktop. Never show a single lonely card on a wide row.

# Animation & Motion

- Motion should enhance understanding and create polish, never distract. Remove purposeless animation.
- Page load animations should complete within 1 second. Do not make users wait for content.
- Respect `prefers-reduced-motion`. All motion should degrade gracefully.
- Use scroll-triggered entrances: default is fade-up with 16-24px Y translation.
- Stagger children in grids and lists by 60-100ms. Never stagger more than 6-8 items.
- Hover effects should be micro: 1-2px lift with shadow change, or scale by 1.02-1.05x maximum.
- Never animate font-size, width, or height on hover — these cause layout shifts.
- Use the named presets from `src/shared/lib/motion.ts`. Do not create inline variant objects.

# Accessibility

- Color contrast must meet WCAG AA: 4.5:1 for body text, 3:1 for large text and UI elements.
- All interactive elements must have visible focus states using `focus-visible`.
- Navigation must be fully keyboard-accessible. Mobile menu must trap focus.
- Use semantic HTML: `<header>`, `<nav>`, `<main>`, `<section>`, `<article>`, `<footer>`.
- Icon-only buttons must have `aria-label`. Toggle buttons must have `aria-expanded`.
- Images: meaningful images get descriptive alt text, decorative images use `alt=""`.

# Component Patterns

- Use the shared primitives from `src/shared/components/` (Section, AnimatedContainer, Button, Card, SectionHeader, IconContainer) as building blocks for all new sections.
- Compose new sections from these primitives rather than writing raw HTML with repeated utility classes.
- Content should be data-driven: define section content in `content.ts` files within the feature folder, not inline in JSX.
- New features go in `src/features/<feature-name>/` with sections, content, and hooks colocated.
- Shared components live in `src/shared/components/`. Only promote to shared when used by 2+ features.
- To rebrand: edit `src/shared/tokens/theme.css` for colors/fonts/spacing, and `content.ts` files for copy.
```

- [ ] **Step 2: Commit**

```bash
git add template/CLAUDE.md
git commit -m "feat: add comprehensive CLAUDE.md with design principles, animation, accessibility, and component guidance"
```

---

### Task 8: Build Verification

- [ ] **Step 1: Run lint and typecheck from a scaffolded test**

Since the template files use token replacements (`__APP_NAME__`, etc.), we cannot directly lint/typecheck the template directory. Instead, verify the template structure is internally consistent:

1. Confirm all imports reference files that exist in the template
2. Confirm all component exports match their usage in section files
3. Confirm the CSS import chain is correct: `main.tsx` → `index.css` → `theme.css`

Run a quick structural check:

```bash
cd /Users/lavhe/CODE/jmrsquared-website-template
# Verify all new template files exist
ls -la template/src/shared/tokens/theme.css
ls -la template/src/shared/components/Section.tsx
ls -la template/src/shared/components/AnimatedContainer.tsx
ls -la template/src/shared/components/Button.tsx
ls -la template/src/shared/components/Card.tsx
ls -la template/src/shared/components/SectionHeader.tsx
ls -la template/src/shared/components/IconContainer.tsx
ls -la template/src/shared/components/index.ts
ls -la template/src/shared/lib/motion.ts
ls -la template/_cursor/rules/visual-design-principles.mdc
ls -la template/_cursor/rules/animation-motion.mdc
ls -la template/_cursor/rules/accessibility.mdc
ls -la template/_cursor/rules/component-patterns.mdc
ls -la template/CLAUDE.md
```

- [ ] **Step 2: Verify no broken imports by grepping**

```bash
# Check that section files import from the correct paths
grep -r "from.*shared/components" template/src/features/
grep -r "from.*shared/lib/motion" template/src/features/
```

- [ ] **Step 3: Final commit if any fixes needed**

```bash
git add -A
git status
# Only commit if there are changes
git diff --staged --quiet || git commit -m "fix: address build verification issues"
```
