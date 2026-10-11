# Working rules

Speak clearly. Push back when correctness requires it. Keep code, comments, and documentation concise.

## Stack and structure

- React, strict TypeScript, Vite, pnpm, TanStack Router/Query/Form, and Zod. Do not add competing libraries.
- Use stock shadcn Base UI components and theme. Add with `pnpm ui:add <component>`; never customize `src/components/ui` or theme tokens.
- Routes compose features; features use shared components and utilities. Business logic belongs in `src/features/<feature>`; follow [config/dependency-cruiser.cjs](config/dependency-cruiser.cjs).
- Use directory-based routes: folders express nesting, `route.tsx` defines a route/layout, and `index.tsx` its index. Keep `__root.tsx` at the routes root; prefix colocated support files/folders with `-` so the generator ignores them. No flat route filenames.
- Infer types and use type imports. No `any`, unchecked casts, non-null assertions, enums, or suppression comments. Handle rejected promises; `void` is not error handling.
- Use `type`, never `interface`, for authored contracts. The sole authored exception is TanStack's required `Register` declaration merging in `src/app/router.tsx`; its generated route declarations remain generator-owned.
- Keep TypeScript syntax erasable: no enums (including `const enum`), runtime namespaces, or constructor parameter properties. Use literal unions, or `as const` objects when runtime values are needed. Declare callbacks as function properties (`onSave: () => void`), not method signatures, so strict argument checking applies.

## One source of truth

- Each fact has one owner. Derive lists, totals, labels, validation flags, and selected records; never store copies to synchronize, including in event handlers. Store selected IDs. Drafts and historical results are distinct facts with explicit lifetimes.
- Query owns remote data. Memoization is only a performance cache; correctness must survive recomputation.
- Put shareable, reloadable navigation state in Router: resource IDs, committed search, filters, sort, pagination, and selected content views. Validate search/path parameters with Zod. Resource IDs must reject invalid input; harmless display preferences may have a deliberate fallback.
- Route modules own URL schemas, Router state/context/loader reads, and route-dependent behavior. Pass validated values and named callbacks into features and hooks; never pass a Route, router instance, navigation options, or raw `navigate` function. Features report meaningful events; the route decides their routing consequences. The app entry points may import only their Router construction/provider APIs. Dynamic imports, inline type imports, stock UI edits, and helpers outside `src` must not bypass this boundary.
- Plain typed `Link` components may live in features or shared UI. Use `Route.useNavigate()` at the route boundary for navigation after an action. Preserve unrelated parameters intentionally; reset pagination with changed filters. Push committed navigation; replace intermediate edits. Request-changing search values belong in `loaderDeps` and query keys; presentation-only values do not.
- Keep secrets, private fields, drafts, focus, hover, open menus, and pending/error feedback out of URLs. Form owns drafts; React/native controls own temporary interactions. Reset a draft by identity with a key.
- Configuration owns versions, rules, and thresholds. Generate route types with `pnpm routes:generate`; never hand-edit the route tree. Documentation links to these owners instead of copying their values.

## Information hiding

- Every layer owns its decisions. Pass meaningful data and events across boundaries, not flags or configuration telling another layer which workflow or screen to assemble. Compose separate screens with nested routes and `Outlet`; use children/slots for supplied content. Branch on genuine state variants within one responsibility, not on an ever-growing set of modes.
- A deep module does useful work behind a small, complete contract. Organize around shared knowledge, not execution order or the component tree. Split only when the parts can be understood independently; file length and helper counts are not design goals.
- Hide API formats, cache keys, invalidation, retries, and transition bookkeeping from controlled views. Expose app data and meaningful commands, not raw Query/Form objects, setters, or callbacks callers must coordinate.
- Keep an operation's required sequence with its owner: validation, adaptation, execution, and cache policy. Callers must not reconstruct it. Keep reusable lower-level tools available when needed.
- Abstractions must remove knowledge from callers. Avoid pass-through wrappers, catch-all contexts, and options that export unresolved decisions. Expose necessary failure and cancellation behavior. Review which callers must change when an implementation detail changes; lint cannot detect shared knowledge.

## Data and boundaries

- Design data around actual reads, writes, volume, and lifetime. Prefer simple records/collections. Normalize shared identity when it removes duplication; specialize layouts only for demonstrated needs. No speculative entity framework, repository layer, or generic adapter factory.
- Keep external data `unknown` until Zod accepts it: network responses, submissions, URL parameters, environment, stored JSON, and external messages. Validate at entry, infer schema outputs, and trust the internal contract.
- Adapt unsuitable API shapes with a pure schema transform or small boundary adapter. Validate invariants before returning the app shape; Query caches that shape. Derive observer-specific views through `select` or render-time functions.
- Use `getJson` for JSON reads. Reject broken data explicitly; never mask it with success-shaped defaults. Standard Schema form validation does not apply transforms to submitted values; parse the submission. Never put credentials in public `VITE_` configuration.
- Rendering, selectors, adapters, and transitions must be deterministic for their inputs: no I/O, input mutation, ambient clock, or randomness. Pass changing context explicitly. Define ordering, cancellation, and stale-result handling at the async owner; prefer library guarantees. Schemas and unions cannot make external systems deterministic.

## State and component contracts

- Model mutually exclusive states with discriminated unions. Each branch has one required literal tag (`kind` for app contracts), required data, and valid actions: `{ kind: 'A' } | { kind: 'B' }`, never `{ kind: 'A' | 'B' }`. Preserve the branch when forwarding props. Use optional `never` for forbidden fields/actions, including through variables and JSX spreads. Independent booleans are fine; contradictory combinations are not.
- A controlled widget accepts the union and switches exhaustively to semantic markup. No catch-all fallback. Extract state views for meaningful structure; a one-line branch needs no component.
- Declare each authored component's named props type immediately above the component in the same file. No inline props shapes or separate props-only files. Export that contract for consumers; components without props need no empty type.
- Widget props are the canonical view contract. A feature hook derives that type and its commands from Query/Form and explicit inputs supplied by its caller. Keep reusable query options, mutations, and smaller hooks independent of widget props. Extract a hook to hide coordination, not merely move lines.
- Compose independent operations; preserve combinations such as cached data while refreshing or a row mutation alongside a loaded list. A union defines valid states, not transitions. Use the owner's lifecycle; add a pure reducer only for custom transition rules.
- While pending, omit the initiating command and disable its native control with accessible progress. Model cancellation separately when supported. View commands handle their failures (for example, Query's `mutate`); promises requiring coordination stay at the owner. Preserve native form submission and keyboard behavior. Request deduplication belongs with the operation/API.
- Test transitions and rendered behavior, plus compile-time rejection of missing tags/payloads and forbidden actions through variables/spreads. Unions do not replace schemas or runtime guarantees.

For an action whose error can be retried and whose success is terminal:

```ts
type ActionProps =
  | { kind: 'ready'; onRun: () => void; message?: never }
  | { kind: 'pending'; onRun?: never; message?: never }
  | { kind: 'error'; onRun: () => void; message: string }
  | { kind: 'success'; onRun?: never; message?: never }
```

## Effects and browser responsibilities

- Handle actions in events and Query mutations. Application `useEffect`, `useLayoutEffect`, and `useInsertionEffect` imports are blocked; do not relocate effect work to renamed hooks or callback refs to evade the rule.
- Effects synchronize with external systems. Prefer Router/Query integrations, refs for element attachment, or `useSyncExternalStore` as appropriate. A necessary effect needs an exact-file Oxlint exception preserving unrelated restrictions, plus tests for cleanup, changed inputs, and Strict Mode remounting. Document the external contract, dependencies, and setup/cleanup beside it. No blanket exception or generic wrapper.
- Use semantic HTML and native interaction: headings, landmarks, lists, labels, links, buttons, and input attributes. ARIA fills gaps; stock components still need correct names and composition. Layout-only `div`s are fine.
- Use TanStack `Link` for internal destinations. For button styling, apply stock `buttonVariants` to `Link`; Base UI `Button` imposes button semantics even when rendered as an anchor. Use a component's documented `render` integration only when its intended semantics fit; use `createLink` for a reusable custom anchor when needed, preserving inferred route types and the anchor props/ref.
- CSS owns layout, responsiveness, visual states, and ordinary animation. Preserve focus and reduced motion. No JS viewport mirroring, style mutation, or animation loop for CSS work. Inline styles or advanced animation need a concrete reason and narrow exception; follow [config/stylelint.config.mjs](config/stylelint.config.mjs).
- Bound main-thread work and profile realistic data. Avoid repeated array copies; paginate large results. Add memoization, virtualization, Workers, or cooperative yielding for measured needs. `async` and transitions do not offload CPU work; CSS layout/paint also costs time.

## Documentation and verification

- README owns setup/operation; this file owns working rules; SECURITY owns dependency exceptions. Comments explain reasons or contracts types cannot express. Delete narration, repetition, and stale notes; preserve license notices.
- Oxlint is the only JS/TS linter; [oxlint.config.ts](oxlint.config.ts) is its only configuration. Each restriction must prevent a concrete mistake without forcing unnecessary abstractions. Changes need a reason and a guard test where practical; never weaken checks merely to pass.
- Run `pnpm check` for code changes and `pnpm test:e2e` for behavior changes. Test outcomes and failure handling, not implementation details. No focused, skipped, empty, or coverage-padding tests. Report actual results and limitations.

Module guidance: John Ousterhout, _A Philosophy of Software Design_, chapters 4–5 and 7–9.

Basis: [DOD: data and transformations](https://www.dataorienteddesign.com/dodbook/node2.html), [normalization](https://www.dataorienteddesign.com/dodbook/node3.html), [measured optimization](https://www.dataorienteddesign.com/dodbook/node9.html), [React state structure](https://react.dev/learn/choosing-the-state-structure), [effects](https://react.dev/learn/you-might-not-need-an-effect), [discriminated unions](https://www.typescriptlang.org/docs/handbook/2/narrowing#discriminated-unions), [Router search](https://tanstack.com/router/latest/docs/guide/search-params), [Zod transforms](https://zod.dev/api#transforms).
