# Frontend Agent Engineering Rules

> **Purpose:** Build production-ready frontend features that are secure,
> accessible, responsive, maintainable, and performant. Prefer the
> simplest correct solution that fits the existing project. These rules
> guide decisions; they are not a reason to add unnecessary complexity.

------------------------------------------------------------------------

## 1. Core Principles

1.  Understand the requirement and existing code before changing
    anything.
2.  Prefer correctness, clarity, security, and maintainability over
    speed or cleverness.
3.  Follow the project's established conventions unless there is a clear
    technical reason to improve them.
4.  Make the smallest focused change that fully solves the task.
5.  Do not refactor unrelated code without a good reason.
6.  Do not invent requirements, APIs, files, dependencies, or project
    conventions.
7.  When requirements are ambiguous and the ambiguity materially affects
    implementation, ask one concise clarifying question. Otherwise, make
    a reasonable, low-risk assumption and state it.
8.  Do not claim that code works, tests pass, or a task is complete
    unless the relevant checks were actually performed.
9.  Think through likely user behavior, edge cases, failure states, and
    the impact of changes before implementation.
10. Prefer well-supported platform features over adding a dependency.

## 2. Framework, Language, and Version Awareness

-   This project uses **Next.js 16** and **TypeScript**.
-   Use APIs and conventions compatible with the versions installed in
    the project.
-   Check `package.json`, lockfiles, and existing implementation before
    assuming a library or framework version.
-   For unfamiliar or version-sensitive behavior, consult the official
    documentation when available.
-   Never invent API methods, configuration options, or framework
    behavior.
-   Do not use outdated Next.js patterns when a supported Next.js 16
    approach is available.
-   Use strongly typed code.
-   Avoid `any` completely unless there is a genuinely unavoidable
    technical reason. If unavoidable, isolate it, explain why, and
    narrow the value immediately.
-   Prefer type inference when it improves readability; define explicit
    types for component props, API responses, form data, Server Actions,
    and important domain structures.
-   Avoid unsafe type assertions and non-null assertions. Validate or
    narrow values instead.
-   Never silence errors with `@ts-ignore`. Use `@ts-expect-error` only
    for a documented, intentional, verified case.

## 3. Required Agent Workflow

Follow this workflow for every meaningful task.

### 3.1 Understand

-   Identify the requested outcome and acceptance criteria.
-   Understand the user flow and expected behavior.
-   Identify constraints, edge cases, and affected areas.

### 3.2 Inspect

-   Inspect the relevant files and existing architecture before editing.
-   Check for reusable components, hooks, utilities, schemas, services,
    and established patterns.
-   Inspect installed dependencies and their versions before using them.
-   Do not assume a file's contents from its name.

### 3.3 Plan

-   Decide which files need to change and why.
-   Decide whether the work belongs on the server or client.
-   Decide whether React Query, Zustand, React Hook Form, or another
    library is actually needed.
-   Consider caching, validation, security, accessibility, responsive
    behavior, and performance.
-   Keep the plan proportional to the task. Do not create a lengthy plan
    for a trivial change.

### 3.4 Implement

-   Make focused, incremental changes.
-   Reuse existing project patterns and design-system components.
-   Keep business logic separate from presentation where practical.
-   Avoid unrelated formatting churn and broad rewrites.

### 3.5 Verify

-   Run the most relevant checks available, such as TypeScript, linting,
    tests, and production build.
-   Test the changed behavior and important edge cases when practical.
-   Inspect the final diff for regressions, accidental changes, debug
    code, and incomplete work.
-   If a check cannot be run, say so clearly. Never report an unrun
    check as passing.

### 3.6 Report

At completion, briefly report: - What changed. - Important
implementation decisions. - Which checks were actually run and their
results. - Any known limitations, assumptions, or remaining work.

------------------------------------------------------------------------

## 4. Server-First Architecture

-   The default architecture is **React Server Components**.
-   Prefer fetching initial data in Server Components.
-   Do not use Client Components for data fetching unless there is a
    real client-side requirement.
-   Do not add `"use client"` unnecessarily.
-   Keep Client Component boundaries as small as possible.
-   Prefer passing server-fetched data to Client Components as
    serializable props.
-   Avoid fetching the same data again on the client when it is already
    available from the server.
-   Before creating a Client Component, determine whether it needs React
    state, browser APIs, event handlers, client-only libraries, or
    client-side query behavior.
-   If none are needed, keep it as a Server Component.
-   Keep server-only modules, secrets, database clients, and privileged
    operations out of the client bundle.
-   Do not import server-only modules into Client Components.
-   Use the project's existing server/client separation conventions.

## 5. Sensitive Data, Authentication, and Authorization

-   Never expose credentials, API secrets, access tokens, refresh
    tokens, private keys, or private authentication data to the browser.
-   Never expose server-only environment variables through client-side
    code or public environment variable prefixes.
-   Prefer server-side authentication and authorization checks.
-   Authentication is not authorization: verify that the current user is
    allowed to perform the requested action on the requested resource.
-   Never trust client-provided user IDs, roles, permissions, prices,
    ownership, or other security-sensitive values.
-   When a client-side request genuinely needs privileged credentials,
    route it through a server-side endpoint or Server Action; keep
    credential handling on the server.
-   Apply authorization checks to every protected Server Action and
    Route Handler, not only to the page that calls it.
-   Avoid leaking whether protected resources exist when that
    information is sensitive.
-   Never weaken security to make implementation easier.

## 6. Data Fetching and API Boundaries

-   Prefer Server Components for initial and server-rendered data
    fetching.
-   Fetch data as close to the server boundary as practical.
-   Avoid unnecessary client-side requests and duplicate requests.
-   Avoid waterfalls by running independent server requests in parallel
    when possible.
-   Reuse existing server-side fetching utilities instead of duplicating
    API logic.
-   Keep API communication, response validation, and data transformation
    separate from UI components.
-   Validate external API responses at runtime when their shape is not
    guaranteed.
-   Handle network failures, timeouts, missing data, and unexpected
    response shapes intentionally.
-   Do not expose internal service details or sensitive upstream error
    messages to users.
-   Use Route Handlers for HTTP interfaces such as public APIs,
    webhooks, and integrations that need an HTTP endpoint.
-   Do not create a Route Handler solely to proxy an internal server
    call when a direct server-side function or Server Action is more
    appropriate.

## 7. Caching and Revalidation

Caching must be considered for every data-fetching implementation.

Before writing a fetch, determine: 1. Is the data public, shared, or
user-specific? 2. Can it be cached safely? 3. How long should it remain
fresh? 4. What event should invalidate or revalidate it? 5. Could
caching return stale, incorrect, or another user's data?

Rules: - Prefer caching when data can safely be shared. - Never cache
private or user-specific data in a way that can leak between users. -
Use the caching and revalidation APIs supported by the installed Next.js
16 version. - Do not assume caching defaults; verify the current
framework behavior and configure intentionally. - Avoid `no-store` as a
blanket default. Use it when the data's sensitivity or freshness
requirements justify it. - After mutations, invalidate or revalidate the
relevant data rather than disabling caching globally. - Avoid duplicate
cache layers unless each layer has a clear responsibility. - Define
clear responsibilities between Next.js server caching and React Query
caching. - Document non-obvious caching decisions when they affect
correctness or security.

## 8. Mutations and Server Actions

-   Prefer Server Actions for mutations initiated by the Next.js
    application when they fit the use case.
-   Use Route Handlers when an HTTP endpoint is required, such as for
    webhooks, public APIs, or external integrations.
-   Server Actions must perform, as appropriate:
    -   Authentication and authorization.
    -   Runtime input validation.
    -   Business logic.
    -   Database or upstream API mutation.
    -   Intentional error handling.
    -   Cache invalidation or revalidation.
-   Validate all untrusted mutation input on the server, preferably with
    Zod.
-   Never rely on client-side validation alone.
-   Never trust hidden form fields or client-provided ownership and
    permission values.
-   Keep Server Actions focused and reusable.
-   Return safe, predictable result shapes for expected validation or
    business errors.
-   Do not expose stack traces, secrets, or internal server details.
-   Revalidate only the affected paths, tags, or data.

### React Query and Mutations

-   Use React Query for mutation lifecycle management only when it
    provides real value, such as optimistic updates, client-side cache
    coordination, or complex interactive mutation state.
-   When React Query manages a mutation, the mutation function should
    call the Server Action or appropriate server endpoint.
-   Keep business logic and authorization on the server.
-   Update or invalidate relevant React Query caches after successful
    mutations.
-   Avoid maintaining conflicting copies of the same server data.

## 9. React Query

-   Do not use React Query automatically for every query.
-   Prefer Server Components for initial and server-rendered data.
-   Use React Query when client-side caching, refetching, polling,
    optimistic updates, infinite loading, or interactive query state
    provides real value.
-   Avoid fetching the same data through both Server Components and
    React Query unless hydration/dehydration or a clear client-side
    requirement justifies it.
-   Configure query keys, stale times, garbage collection, retries, and
    refetch behavior intentionally.
-   Use stable, predictable, correctly scoped query keys.
-   Include relevant user, tenant, filter, and pagination scope in keys
    when needed; never let one user's data appear in another user's
    cache.
-   Keep query logic in dedicated hooks or utilities rather than
    scattering it throughout components.
-   Avoid unnecessary refetches, duplicate requests, and aggressive
    polling.
-   Handle loading, error, empty, and success states.

## 10. State Management

### Local React State

-   Keep state local to the smallest component subtree that needs it.
-   Do not create state for values that can be derived from props or
    existing state.
-   Avoid duplicating server data in local state.
-   Avoid unnecessary state and effects.
-   Use `useReducer` when several related state values transition
    together or when state transitions are complex; do not use it merely
    for style.

### Zustand

-   Use Zustand only when client-side state genuinely needs to be shared
    across Client Components.
-   Do not use Zustand for server data that belongs in Server Components
    or React Query.
-   Do not duplicate server state in Zustand.
-   Keep stores small, focused, and appropriately scoped.
-   Avoid unnecessary global state.

### Context

-   Use Context for values that need to be shared through a component
    subtree and change infrequently or have a clear provider boundary.
-   Avoid putting frequently changing, unrelated state into one broad
    context.
-   Split contexts or use a suitable state solution when context updates
    cause avoidable re-renders.
-   Do not introduce a state-management library for simple local state.

## 11. Forms and Validation

-   Use React Hook Form for complex or interactive forms where it
    meaningfully simplifies form state and validation.
-   Keep form state local whenever possible.
-   Avoid unnecessary controlled inputs when React Hook Form can manage
    them efficiently.
-   Use Zod as the runtime validation source of truth where appropriate.
-   Validate form input on the client for user experience and again on
    the server for security.
-   Reuse schemas when appropriate instead of duplicating rules.
-   Infer TypeScript types from Zod schemas when possible.
-   Provide accessible labels, descriptions, and clear validation
    messages.
-   Preserve user input when recoverable errors occur.
-   Prevent duplicate submissions and communicate pending, success, and
    failure states.
-   Do not treat client-side validation as a security boundary.

## 12. UI Components and Design System

-   Use **shadcn/ui** as the primary UI component system when it is part
    of the project.
-   Prefer existing project components and shadcn/ui components before
    creating custom equivalents.
-   Do not recreate an existing component without a strong reason.
-   Follow the project's existing shadcn/ui conventions and component
    variants.
-   Keep components reusable, composable, and focused.
-   Keep business logic out of presentational components whenever
    practical.
-   If the project contains a Design System, follow it consistently.
-   Reuse design tokens for colors, typography, spacing, radius,
    shadows, and component states.
-   Do not introduce arbitrary colors or one-off design values when
    suitable tokens exist.
-   Do not invent new UI patterns unnecessarily.
-   New components must look and behave consistently with the existing
    product.
-   Avoid generic, visually outdated, or unpolished interfaces.
-   Establish clear visual hierarchy and information architecture.
-   Use typography, spacing, and contrast intentionally.
-   Avoid unnecessary borders, shadows, gradients, animations, and
    decorative elements.
-   Do not sacrifice clarity for visual effects.
-   Every interactive control must have a clear purpose and visible
    interaction states.
-   Use consistent hover, focus, active, disabled, pending, success, and
    error states as appropriate.

## 13. Responsive Design

-   All user-facing UI must be responsive.
-   Use mobile-first design when appropriate.
-   Consider mobile, tablet, laptop, and desktop layouts.
-   Test relevant breakpoints rather than assuming a desktop layout will
    shrink correctly.
-   Prevent unintended horizontal overflow.
-   Avoid fixed dimensions when they cause clipping or broken layouts.
-   Prefer flexible layouts using Grid, Flexbox, intrinsic sizing, and
    design tokens.
-   Ensure touch targets are comfortable on touch devices.
-   Handle long text, translated content, dynamic data, and empty states
    gracefully.
-   Check dialogs, dropdowns, tables, navigation, and forms on small
    screens.
-   Do not hide essential functionality on mobile without a valid
    product reason.

## 14. Accessibility

-   Use semantic HTML elements whenever possible.
-   Use native controls before custom interactive implementations.
-   Associate form controls with accessible labels and descriptions.
-   Ensure keyboard accessibility for all interactive elements.
-   Maintain visible and consistent focus indicators.
-   Use ARIA only when needed; do not add incorrect or redundant ARIA
    attributes.
-   Provide meaningful alternative text for informative images and empty
    alt text for decorative images.
-   Do not communicate status using color alone.
-   Respect reduced-motion preferences.
-   Ensure reasonable text contrast and readable typography.
-   Manage focus correctly in dialogs, menus, and other overlays.
-   Use correct heading hierarchy and landmark elements.
-   Test important flows using keyboard navigation.

## 15. Performance

-   Treat performance as a first-class requirement, but do not optimize
    prematurely.
-   Minimize Client Components and JavaScript sent to the browser.
-   Prefer server-side computation when it reduces client work without
    creating server bottlenecks.
-   Avoid unnecessary re-renders and state updates.
-   Avoid unnecessary `useEffect`.
-   Use `memo`, `useMemo`, and `useCallback` only when they provide a
    measurable or meaningful benefit.
-   Avoid unnecessary network requests and duplicate data fetching.
-   Lazy-load heavy client-side components when appropriate.
-   Use Next.js image optimization and appropriate image sizes, formats,
    and loading priorities.
-   Avoid importing large libraries when native browser or framework
    features are sufficient.
-   Debounce or throttle expensive event-driven work when appropriate.
-   Clean up event listeners, subscriptions, observers, and timers when
    their lifecycle ends.
-   Avoid memory leaks and stale asynchronous updates.
-   Consider time and space complexity for data-heavy operations.
-   Prefer `Set` or `Map` when their lookup characteristics fit the
    problem; do not choose data structures by slogan.
-   Store repeated expensive calculations only when doing so improves
    clarity or performance.
-   Keep non-component-dependent constants and pure helpers outside
    component bodies when appropriate.
-   Avoid unnecessary wrapper elements; use fragments when no DOM
    element is needed.
-   Use virtualization for genuinely large lists when it improves
    real-world performance.
-   Measure or profile before applying complex optimizations.

## 16. Clean Code and Maintainability

-   Prefer clean, simple, maintainable solutions.
-   Do not over-engineer or create premature abstractions.
-   Avoid duplicated logic; extract shared code when duplication is
    meaningful.
-   Keep functions and components focused on a single responsibility.
-   Prefer composition over deeply nested conditionals or components
    with many unrelated boolean props.
-   Separate concerns into small, understandable modules.
-   Avoid deep nesting when early returns or clearer decomposition
    improve readability.
-   Avoid unnecessary variables, wrappers, and one-use abstractions that
    make code harder to follow.
-   Avoid side effects in pure transformation functions.
-   Make side effects explicit and keep them at appropriate boundaries.
-   Read the code after writing it; check spelling, naming, logic, and
    consistency.
-   Remove dead code when safe and relevant.
-   Do not leave temporary debugging code such as `console.log` in
    production code.
-   Do not modify unrelated files just to apply personal style
    preferences.

## 17. Formatting and Naming Conventions

-   Follow the repository's established formatting and linting
    configuration.
-   Use ESLint and Prettier when configured; do not introduce
    conflicting formatting rules.
-   Do not reformat unrelated files.
-   Keep indentation, spacing, imports, and code layout consistent.
-   Separate logical scopes and related code clearly.
-   Use meaningful names for variables, functions, types, and files.
-   Prefer `camelCase` for variables and functions.
-   Prefer `PascalCase` for React components, classes, and
    types/interfaces.
-   Use the project's convention for constants; use uppercase names for
    true global constants when appropriate.
-   Follow the repository's existing file and folder naming conventions.
    Use kebab-case when that is the established convention.
-   Use short names only for obvious, small scopes such as simple array
    callbacks.
-   Name files by their responsibility when it improves discoverability,
    for example `user.api.ts`, `user.schema.ts`, or `user.types.ts`.
-   Avoid cryptic abbreviations and misleading names.

## 18. JavaScript and TypeScript Practices

-   Prefer `async/await` for readable asynchronous control flow, while
    following existing conventions where chaining is clearer.
-   Use template literals when interpolation or multiline strings
    benefit from them; ordinary short strings do not need them.
-   Use `structuredClone` for supported structured-cloneable data when a
    deep clone is genuinely needed; do not use it blindly or for values
    it cannot clone.
-   Prefer built-in platform APIs over dependencies when they are
    suitable and supported.
-   Choose loops and collection methods based on readability and
    semantics, not blanket rules. For example, `for...of`, `forEach`,
    `map`, `filter`, and `reduce` serve different purposes.
-   Use `for...in` only when enumerating object keys intentionally, and
    guard against inherited properties when necessary; prefer
    `Object.keys`, `Object.entries`, or `Object.hasOwn` when they make
    intent safer or clearer.
-   Avoid repeatedly performing expensive property access or
    calculations when a clear local variable improves readability.
-   Do not mutate data unexpectedly. Prefer immutable transformations
    when they make state changes predictable.
-   Use `Map` and `Set` when their semantics and lookup behavior suit
    the task.
-   Handle nullable and optional values explicitly.
-   Use discriminated unions and narrowing for complex state and result
    types.
-   Avoid broad casts that conceal incorrect assumptions.

## 19. React Best Practices

-   Use state-driven derived values instead of maintaining duplicate
    state.
-   Minimize `useEffect`; do not use it to derive values, respond to
    user events, or synchronize state that can be handled directly.
-   Use effects only to synchronize with external systems such as
    browser APIs, subscriptions, or imperative libraries.
-   Clean up effects when they create subscriptions, listeners, timers,
    or other ongoing resources.
-   Avoid unnecessary `useState`; props and state updates can cause
    re-renders.
-   Use `useReducer` for coordinated or complex state transitions when
    it improves clarity.
-   Use `useMemo` and `memo` for expensive computations or demonstrably
    useful render optimization, not by default.
-   Keep hooks at the top level and follow the Rules of Hooks.
-   Keep component props focused and stable where useful.
-   Avoid prop drilling when a clear composition or context boundary is
    better, but do not introduce global state prematurely.
-   Apply DRY to meaningful repetition without making components
    excessively generic.
-   Do not use array indexes as keys when list items can be inserted,
    removed, or reordered; prefer stable identifiers.
-   Avoid defining components inside other components unless there is a
    clear reason, as this can reset state or cause remounting.
-   Do not use effects as a substitute for proper event handlers or
    server-side data loading.

## 20. CSS and Styling

-   Follow the project's styling approach, whether Tailwind CSS, CSS
    Modules, or another established system.
-   Keep styling conventions consistent.
-   Prefer design tokens and relative or fluid sizing where appropriate.
-   Use `rem`, `em`, `clamp()`, Grid, and Flexbox when they improve
    adaptability; fixed pixel values are acceptable for borders, icons,
    and deliberate constraints.
-   Do not treat percentages as universally bad; use them when they
    express the intended relationship to a parent.
-   Choose Grid or Flexbox based on the content and layout requirements.
-   Use flexible sizing properties such as `minmax()`, `min-width: 0`,
    `flex`, `grow`, and `shrink` when they prevent overflow or improve
    layout behavior.
-   Be deliberate with `z-index`; define a consistent stacking strategy
    for overlays and layered UI.
-   Avoid `!important` unless a documented integration or specificity
    constraint makes it necessary.
-   Avoid repetitive styles; reuse tokens, utilities, and shared
    patterns when appropriate.
-   Prefer component-scoped styles where that matches the project
    architecture.
-   Use global styles only for genuinely global concerns such as resets,
    tokens, and base typography.
-   Keep style declarations logically grouped and easy to scan.
-   Use modern CSS features only when supported by the project's browser
    targets.
-   Avoid unnecessary animation and respect reduced-motion preferences.

## 21. Error Handling and User Feedback

-   Handle errors intentionally; do not silently swallow them.
-   Use concise, meaningful, consistent error messages.
-   Catch errors at the boundary where they can be handled meaningfully.
-   Do not add broad `try/catch` blocks that hide programming errors or
    convert every failure into success-shaped data.
-   Throw or propagate errors when a required invariant is violated and
    no safe recovery exists.
-   Use the framework's error boundaries and route-level error handling
    where appropriate.
-   Distinguish expected validation/business errors from unexpected
    system failures.
-   Never expose stack traces, SQL errors, internal URLs, credentials,
    or sensitive server details to users.
-   Validate all external and user input.
-   Handle loading, error, empty, success, and pending states where
    appropriate.
-   Provide actionable feedback without overwhelming the user.
-   Log server errors safely when the project has an established logging
    system; do not log secrets or sensitive personal data.
-   Do not create a global async error handler that obscures local error
    ownership or framework behavior.

## 22. Comments and Documentation

-   Write comments that explain **why**, not merely what obvious code is
    doing.
-   Keep comments clear, concise, accurate, and grammatically correct.
-   Add comments for complex business logic, non-obvious architecture,
    caching decisions, performance optimizations, workarounds, security
    considerations, and complex algorithms.
-   Do not add meaningless comments to self-explanatory code.
-   Update or remove comments when implementation changes.
-   Use JSDoc for public or complex utilities when it clarifies
    parameters, return values, constraints, or side effects.
-   Do not document every trivial function.
-   Use short section comments to organize long components only when
    they genuinely improve navigation.
-   A suggested component organization, when it fits the component, is:
    1.  Imports and types.
    2.  Translation and localization.
    3.  Navigation and routing.
    4.  State and refs.
    5.  Context.
    6.  Queries.
    7.  Mutations.
    8.  Other hooks.
    9.  Form and validation.
    10. Derived variables.
    11. Event handlers and functions.
    12. Effects. This order is a flexible convention, not a rigid
        requirement. Keep code organized according to the actual use
        case.

## 23. File and Project Architecture

-   Follow the existing project folder structure.
-   Reuse existing utilities, hooks, components, schemas, and services
    before creating new ones.
-   Keep related code close together when the project uses feature-based
    organization.
-   Do not move files or change architecture without a clear benefit.
-   Do not create unnecessary abstraction layers.
-   Keep server-only code server-only and client-only code isolated
    behind Client Component boundaries.
-   Separate API clients, schemas, types, business logic, and UI when
    that separation improves clarity and maintainability.
-   Avoid circular dependencies.
-   Avoid creating a new dependency for functionality already available
    in the project or platform.
-   If adding a dependency is necessary, explain why and consider bundle
    size, maintenance, security, and compatibility.

## 24. Testing and Verification

-   Inspect available scripts and test setup before choosing commands.
-   Run the narrowest relevant checks first, then broader checks when
    appropriate.
-   Run TypeScript checks using the project's configured command.
-   Run ESLint or the configured lint command.
-   Run relevant unit, integration, or end-to-end tests when available.
-   Run a production build when the scope or risk justifies it.
-   Test success paths, validation failures, empty data, loading states,
    authorization failures, and important edge cases as applicable.
-   Verify responsive layouts and keyboard interactions for UI changes
    when practical.
-   Do not change tests merely to make an incorrect implementation pass.
-   Do not disable lint rules, tests, or type checking to hide a defect.
-   If the repository has no tests or a check cannot run, state that
    limitation rather than implying verification.
-   Review the final diff and remove accidental changes, debug
    statements, unused imports, and temporary code.

## 25. Before Making Changes: Checklist

Before implementing a feature, consider:

1.  Have I understood the requirement and acceptance criteria?
2.  Have I inspected the existing architecture and relevant files?
3.  Can I reuse an existing component, utility, hook, schema, or
    service?
4.  Does this belong on the server or client?
5.  Is React Query actually necessary?
6.  Is Zustand actually necessary?
7.  Is the caching strategy safe and appropriate?
8.  Are authentication and authorization enforced on the server?
9.  Is runtime validation needed?
10. Does shadcn/ui or the existing Design System already provide the
    required UI?
11. Is the design responsive and accessible?
12. Could this introduce unnecessary JavaScript, requests, re-renders,
    or dependencies?
13. What errors and edge cases should be handled?
14. How will I verify the implementation?

Do not mechanically write out this checklist for every task. Use it as a
decision guide.

## 26. Final Decision Principles

When multiple implementations are valid, prefer the one that:

1.  Keeps more code on the server when appropriate.
2.  Sends less unnecessary JavaScript to the client.
3.  Protects sensitive data and enforces authorization.
4.  Uses safe, intentional caching and revalidation.
5.  Minimizes duplicate requests and unnecessary rendering.
6.  Reuses existing project patterns and components.
7.  Follows shadcn/ui and the existing Design System.
8.  Uses strong TypeScript types and runtime validation.
9.  Is accessible and responsive.
10. Is easy to understand, test, debug, and maintain.
11. Solves the actual requirement without over-engineering.
12. Can be verified honestly.

------------------------------------------------------------------------

## 27. Final Principle

A good implementation is not the one with the most abstractions, the
newest library, or the fewest lines. It is the simplest reliable
implementation that satisfies the user's needs, fits the project,
handles realistic failure cases, and remains understandable to the next
developer.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

<!-- BEGIN:nextjs-agent-feedback -->

## Report Next.js feedback

The project owner enabled `experimental.agentFeedback`, authorizing this feedback pass. When enabled, `next dev` writes this block and restores it if removed. Commit `AGENTS.md` with your work to keep the tree clean.

During the current user request, retain anonymized facts as feedback candidates for meaningful or recurring Next.js issues:

- Crashes, hangs, OOMs, or unexpected slowness
- Incorrect behavior, output, errors, or diagnostics
- Missing, unclear, or conflicting documentation
- Unexpected CLI, codemod, Skill, or upgrade behavior and non-obvious workarounds

Continue the current user request without reporting immediately. Routine debugging is not feedback. Verify changes before retaining them as feedback candidates. Never retain code, logs, paths, URLs, secrets, personal information, or project-specific data.

Retain qualifying friction even if it is later fixed or worked around; record the final outcome during the reporting pass.

Before the final response, run one reporting pass. If candidates remain, from this file's directory run `npx --no-install next internal agent-feedback-instructions` once without piping or truncating its output. Follow its output or error guidance. If a network sandbox blocks it, retry with network access; if it still returns no output, continue normally.

<!-- END:nextjs-agent-feedback -->
