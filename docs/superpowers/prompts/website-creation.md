# Premium Website Creation Prompt

> **For agentic workers:** Use this prompt when the user requests to build, create, redesign, remake, or overhaul a website. Execute the full mission end-to-end using the agents-execute skill.

---

## Phase 1: Discovery & Context Gathering

Before writing any code, **gather comprehensive context** about the website. Ask the user to provide as much unstructured information as possible about:

### Project Context

1. **What is this website for?**
   - Product/service launch, portfolio, company brand, event, app landing page, or something else?
   - Is there an existing website to redesign, or is this a new build?

2. **Who is the audience?**
   - Target demographics, industries, technical sophistication
   - What impression should visitors leave with?

3. **What are the core features/capabilities to showcase?**
   - What does this product/service actually do?
   - What are the key differentiators or highlights?

4. **What content do you have available?**
   - Logo assets, brand colors, typography guidelines
   - Images, videos, screenshots, or media files
   - Existing copy, taglines, key messages
   - Product screenshots or demo videos

5. **Are there any technical constraints?**
   - Must integrate with specific services or APIs
   - Performance targets or requirements
   - Accessibility requirements beyond WCAG AA

6. **What makes this project special or unique?**
   - Any specific aesthetic direction, creative references, or inspiration
   - Particular attention to certain interactions or experiences

7. **Success metrics?**
   - What defines a successful website for this project?
   - Key actions visitors should take

---

## Phase 2: Design Vision

Build and fully redesign this website into a **stunning, premium, interactive web experience**.

### Visual & Interaction Inspiration

Study these award-winning agencies for craft, interaction quality, and visual ambition:

- **https://igloo.inc** — Cinematic 3D, scroll-driven storytelling, award-winning visual design
- **https://www.lusion.co** — WebGL, particles, physics, and immersive interactions
- **https://www.activetheory.net** — Experimental 3D, motion, and scroll-driven storytelling

**Do NOT copy these websites.** Take inspiration from their level of craft, interaction, and visual quality. Create an original experience specifically for this website.

### Core Principles

1. **Visual-first, minimal text** — The website demonstrates its core features and how they work, rather than explaining everything with text. Show, don't tell.

2. **Scroll-driven experience** — The scroll itself drives the experience. As users scroll, the page transforms through:
   - 3D scenes and camera movements
   - Particle systems and physics-based animations
   - Smooth transitions and transformations
   - Parallax depth and layered motion
   - Dynamic lighting and atmospheric effects
   - Content reveals and choreographed entrances

3. **Cinematic pacing** — Think of the website as a narrative journey. Not every section needs the same intensity. Build moments of tension, release, and climax.

4. **Interactive demonstrations** — Core features should be demonstrated interactively, not just described. Let users experience the product through the interface itself.

5. **Original art direction** — Create new visual assets, imagery, 3D elements, materials, and animations wherever necessary. The aesthetic must feel intentionally designed by a world-class creative studio.

### Anti-Patterns to Avoid

The result must **NOT** look AI-generated or like a generic SaaS/landing-page template. Strictly avoid:

- Excessive card-based layouts with uniform sizing
- Generic gradients flooding entire sections
- Glassmorphism overuse (frosted glass on everything)
- Stock photography and generic AI illustrations
- Large blocks of explanatory copy
- Uniform section padding and predictable grid patterns
- Floating UI elements without spatial context
- "Dark mode toggle" or "isometric device mockup" clichés
- AI-generated faces or staged stock scenarios

---

## Phase 3: Technical Implementation

### Tech Stack

This project uses:
- **Vite** + **React 19** + **TypeScript** — Fast builds, modern React patterns
- **Tailwind CSS** — Utility-first styling with design tokens
- **Framer Motion** — Production-grade animations and interactions
- **Three.js / React Three Fiber** — 3D graphics and WebGL where appropriate
- **GSAP + ScrollTrigger** — Scroll-driven animations and timeline control
- **Lucide React** — Consistent iconography

### 3D & WebGL Guidelines

For sites requiring 3D elements:

1. **Use procedural geometry** — Create abstract, geometric 3D objects that complement the brand rather than literal product representations.

2. **Implement scroll-driven camera movement** — The camera position, rotation, and field of view should respond to scroll position, creating parallax depth.

3. **Apply realistic materials** — Use MeshStandardMaterial with appropriate metalness, roughness, and environmental lighting. Avoid flat or cartoonish rendering unless intentional.

4. **Optimize for performance** — Use instanced meshes for repeated geometry, LOD for complex objects, and lazy loading for 3D scenes. Target 60fps on mid-range devices.

5. **Graceful degradation** — Detect WebGL support and device capability. Provide fallback 2D experiences that maintain the visual intent.

### Animation Architecture

Build scroll-driven animations using:

1. **GSAP ScrollTrigger** — Primary scroll orchestration
2. **Framer Motion** — Component-level animations and transitions
3. **CSS animations** — Simple, performant effects for backgrounds and ambient motion

**Animation timing principles:**
- Micro-interactions: 150-250ms
- Section transitions: 400-600ms
- Dramatic reveals: 800-1200ms
- Never block content visibility with overly long animations

### Responsive Adaptations

Design for both desktop and mobile with appropriate adaptations:

1. **Touch vs. cursor** — Larger touch targets (min 44px), swipe gestures, and tap-focused interactions for mobile.

2. **Simplified 3D** — Reduce polygon count, particle counts, and shader complexity on mobile. Maintain the visual intent with fewer resources.

3. **Reduced motion option** — Respect `prefers-reduced-motion`. Provide instant transitions and static fallbacks.

4. **Performance-first loading** — Show meaningful content immediately. Defer heavy 3D scenes and decorative animations.

5. **Viewport-aware layouts** — Stack layouts vertically on mobile. Reorder content intentionally, not just auto-wrapping.

---

## Phase 4: Implementation Checklist

Execute the following in order:

### Foundation

- [ ] **Scaffold the project** — Run `yarn create jmrsquared-website-template` or work within existing project
- [ ] **Install dependencies** — Run `yarn install`
- [ ] **Verify dev server** — Run `yarn dev` and confirm hot reload works

### Design System

- [ ] **Define design tokens** — Colors, typography scale, spacing rhythm, motion timings in `src/shared/tokens/theme.css`
- [ ] **Update Tailwind config** — Reference CSS custom properties for consistent theming
- [ ] **Set up font loading** — Preload fonts, establish typography hierarchy

### 3D & Motion Foundation

- [ ] **Configure Three.js/R3F** — Set up canvas, lighting, camera controls, and environment
- [ ] **Create animation utilities** — Shared scroll-driven animation functions and hooks
- [ ] **Build reusable 3D primitives** — Geometric shapes, particle systems, material presets

### Section-by-Section Build

For each section of the website:

1. **Design the scroll-driven choreography** — Define how the section transforms as users scroll through it
2. **Create 3D elements or visual assets** — Procedural geometry, custom SVG illustrations, or styled imagery
3. **Implement scroll-triggered animations** — Entrance reveals, parallax layers, camera movements
4. **Add interactive demonstrations** — Where applicable, let users interact with features directly
5. **Ensure responsive behavior** — Test on mobile viewport sizes, adapt interactions for touch

### Content Integration

- [ ] **Replace placeholder content** — Integrate actual copy, images, and assets
- [ ] **Create or source imagery** — Generate abstract visuals, product shots, or illustrations as needed
- [ ] **Polish micro-interactions** — Hover states, button feedback, loading states

### Quality Assurance

- [ ] **Performance audit** — Check Lighthouse scores, fix render-blocking resources
- [ ] **Accessibility audit** — Verify keyboard navigation, screen reader support, color contrast
- [ ] **Cross-browser testing** — Test in Chrome, Firefox, Safari, and mobile browsers
- [ ] **Mobile testing** — Physical device or emulator verification for touch interactions

### Final Validation

- [ ] **Build verification** — `yarn build` completes without errors
- [ ] **Lint check** — `yarn lint` passes
- [ ] **Type check** — `yarn typecheck` passes
- [ ] **Preview production build** — `yarn preview` to verify locally

---

## Phase 5: File Organization

Organize code by domain/feature, not technical layer:

```
src/
├── domains/
│   └── website/
│       ├── components/      # Feature-specific components
│       ├── hooks/           # Feature-specific hooks
│       ├── sections/        # Page sections
│       └── content/         # Section data and copy
├── shared/
│   ├── components/           # Reusable primitives (Section, Button, Card, etc.)
│   ├── lib/                  # Utilities, animation helpers, 3D setup
│   ├── config/               # Site configuration
│   └── tokens/               # Design tokens (CSS custom properties)
└── assets/                   # Static images, 3D models, fonts
```

---

## Phase 6: Definition of Done

The website is **complete only when**:

1. ✅ Every requested feature and section is implemented with full functionality
2. ✅ Scroll-driven experience works smoothly — 3D scenes, transitions, and animations respond to scroll position
3. ✅ Visual quality meets premium studio standards — no generic patterns, no template aesthetics
4. ✅ Core features are demonstrated interactively, not just explained with text
5. ✅ Responsive design works on desktop and mobile with appropriate adaptations
6. ✅ Performance is acceptable — fast initial load, smooth 60fps animations on mid-range devices
7. ✅ `yarn build` completes without errors
8. ✅ `yarn lint` and `yarn typecheck` pass
9. ✅ No regressions in existing functionality
10. ✅ The website feels intentionally art-directed, not AI-generated

**Do not stop at "done enough." Stop when no meaningful, mission-relevant improvement remains.**
