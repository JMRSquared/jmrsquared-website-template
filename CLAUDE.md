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

# Premium Website Creation

For building or redesigning websites with stunning, premium, interactive experiences, use the comprehensive guide at:

`docs/superpowers/prompts/website-creation.md`

This prompt provides:
- Phase 1: Discovery questions to gather project context
- Phase 2: Design vision with award-winning agency inspiration
- Phase 3: Technical implementation guidelines (3D, WebGL, scroll-driven animations)
- Phase 4: Implementation checklist
- Phase 5: File organization patterns
- Phase 6: Definition of done

Read this prompt file when the user requests to build, create, redesign, remake, or overhaul a website.

# Release Command Mapping

When the user says "release the website" or anything related to asking the website to be released, execute exactly:

`git add . && git commit -m ":rocket: Deploy" && git push`
