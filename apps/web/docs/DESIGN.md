# Design system

The visual language, its tokens, and the rules for extending it.

## Lineage

Two passes, both distilled from supplied reference designs rather than invented:

1. **2026-07 editorial refresh** (`d3ff7ad` → `e0ed167`) — massive display type with
   small-caps eyebrow labels, ink-black pill CTAs paired with white secondary pills,
   elevated rounded cards with glass and dark-ticket tones, chip taxonomies, stat rows,
   split-screen auth.
2. **This pass** — a real token layer, dark mode, an icon set, and the interaction
   patterns the references showed that the first pass had no vocabulary for: a theme
   toggle in the header, arrow-in-circle CTAs, divided stat ledgers, sparklines in glass
   metric cards, a ⌘K command palette with keyboard hints, and crafted empty states.

Deliberately **not** adopted from the references: a language switcher (i18n is a declared
V2 item in [ARCHITECTURE.md](./ARCHITECTURE.md)), 3D chrome renders, and licensed
photography — neither has an asset pipeline here and both would wreck the LCP budget.
The equivalent visual weight comes from type, dark surfaces, and the CSS-only ambient
canvas.

## Tokens

All of it lives in one file: [`app/globals.css`](../app/globals.css). There is no
`tailwind.config.*` — Tailwind v4 is configured in CSS.

```
:root  { --surface: #fff;    … }   raw values, light
.dark  { --surface: #121215; … }   raw values, dark
@theme inline { --color-surface: var(--surface); … }
```

`@theme **inline**` is load-bearing. It makes Tailwind emit
`.bg-surface{background-color:var(--surface)}` — a direct reference. With a plain
`@theme` the utility would point at an intermediate `--color-surface` that resolves once
at `:root`, and the dark override would never reach descendants.

**The rule for component code: never write a literal palette class.** No `neutral-700`,
no `white`, no `indigo-600`. Use the semantic name and dark mode is free.

| Group      | Tokens                                                                       | Use                                                                                                                                             |
| ---------- | ---------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| Surface    | `canvas` `surface` `surface-raised` `surface-sunken`                         | page · card · card-above-card · recessed well (kanban columns, table headers)                                                                   |
| Foreground | `fg` `fg-muted` `fg-subtle` `fg-inverse`                                     | body · secondary · captions · text on an inverted fill                                                                                          |
| Line       | `border` `border-strong`                                                     | hairlines · form-control borders                                                                                                                |
| Ink        | `ink` `ink-fg` `ink-hover`                                                   | primary CTAs, active pills, own chat bubbles. **Inverts** with the theme so a primary button is always the highest-contrast element on the page |
| Band       | `band` `band-fg` `band-fg-muted`                                             | footer, dark ticket cards, cookie banner. **Does not invert** — a dark band is a register, not "the opposite of the page"                       |
| Brand      | `brand` `brand-solid` `brand-fg` `brand-subtle` `brand-subtle-fg`            | indigo stays the _accent_: links, focus rings, eyebrows, badges — never the primary fill                                                        |
| Status     | `success` `warn` `danger` `info` (+ `-subtle`, `-subtle-fg`)                 | badges, alerts, deltas, inline validation                                                                                                       |
| Radius     | `rounded-control` (.75rem) `rounded-card` (1rem) `rounded-canvas` (2rem)     | inputs · every elevated surface · big inset hero panels. Pills stay `rounded-full`                                                              |
| Elevation  | `shadow-soft` `shadow-raised`                                                | resting · hover                                                                                                                                 |
| Glass      | `--glass-bg` `--glass-border` via `.glass`                                   | header, floating hero cards, kanban columns                                                                                                     |
| Ambient    | `--ambient-wash` `--ambient-aurora` `--ambient-grid` `--ambient-starfield-*` | whole gradient strings, so dark can restructure them freely                                                                                     |

`ink` vs `band` is the distinction most likely to be got wrong. Ink inverts; band does
not. `tests/e2e/design-regression.spec.ts` guards the footer against inverting.

**Dark elevation** is carried by surface lightness plus a hairline, not by shadow — drop
shadows are invisible on a near-black canvas. That is why `surface-raised` exists.

## Component classes

- `.display` — editorial headline. Archivo, weight 800, tight tracking, balanced wrap.
  Always paired with a size utility at the call site (`text-4xl`…`text-7xl`).
- `.eyebrow` — small-caps letterspaced label above a headline, brand-coloured.
- `.caption` — small-caps caption under a stat value. (Was duplicated inline at three
  call sites with two different tracking values.)
- `.glass` — frosted surface. Pair with `border` when a hairline is wanted.

## Typography

Self-hosted at build by `next/font` in [`app/layout.tsx`](../app/layout.tsx) — no runtime
request, so the `font-src 'self' data:` CSP in `next.config.ts` is unchanged.

- **Archivo** (variable) — display. Replaces the previous system-stack + `font-weight: 900`
  approach, which rendered as Arial Black on Windows and Roboto on Android and was what
  made the headlines read generic off macOS.
- **Inter** (variable) — body and UI.

Both emit a metric-matched local fallback, so swapping costs no layout shift.

## Dark mode

Class-based: `.dark` on `<html>`.

- Stored in `lib/stores/ui.ts` (`theme: 'light' | 'dark' | 'system'`, persisted to
  `joblify.ui`).
- Applied **before first paint** by [`app/components/theme-script.tsx`](../app/components/theme-script.tsx),
  a blocking inline script that is the first child of `<body>`. It reads `localStorage`
  only — deliberately. `cacheComponents` (PPR) is on, and anything at layout scope that
  reads _request_ data collapses every route's static shell to a fallback. A
  cookie-backed theme would do exactly that.
- Resolution rules live in [`lib/ui/theme.ts`](../lib/ui/theme.ts), shared by the header
  toggle and the command palette. The cycle is not a plain rotation: from `system` it
  jumps to the opposite of what's on screen, so the first click is always visibly
  different.
- `<html>` carries `suppressHydrationWarning` because the script mutates its class list
  before React hydrates.

Changing the storage key or shape means changing that script too.

## Primitives

[`app/components/ui/`](../app/components/ui/). Hand-rolled variant maps — no `cva`, no
`tailwind-variants` — but every one composes through [`cn()`](../lib/cn.ts)
(`clsx` + `tailwind-merge`), so a caller's `className` **wins** on a conflict instead of
appending and letting stylesheet order decide.

| File               | Exports                                                                                                                           |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| `button.tsx`       | `Button` (4 variants × 3 sizes, `loading`, icon slots), `IconButton` (circular, `label` required), `buttonClasses()` for `<Link>` |
| `card.tsx`         | `Card` (`default`/`glass`/`dark`/`sunken`, `interactive`), `CardHeader`/`CardTitle`/`CardBody`/`CardFooter`                       |
| `badge.tsx`        | `Badge` (7 tones, `corner` for overlay chips)                                                                                     |
| `form.tsx`         | `Input` `Textarea` `Select` `Field` `Checkbox` `Radio` `Switch`                                                                   |
| `stat.tsx`         | `Stat` (value, caption, delta, glyph, chart), `StatRow` (`divided`)                                                               |
| `empty-state.tsx`  | `EmptyState` — glyph, headline, one sentence of _why_, and a control that resolves it                                             |
| `toaster.tsx`      | `Toaster` + the `toast.*` helper in `lib/stores/ui.ts`                                                                            |
| `skeleton.tsx`     | `Skeleton` `SkeletonTitle` `SkeletonText` `SkeletonCard` `SkeletonList` `SkeletonPillNav`                                         |
| `kbd.tsx`          | `Kbd`, `KbdHint`                                                                                                                  |
| `sparkline.tsx`    | `Sparkline` — inline SVG polyline, no charting runtime                                                                            |
| `theme-toggle.tsx` | `ThemeToggle`                                                                                                                     |
| `ambient.tsx`      | `AmbientCanvas` (`hero` > `band` > `page`), `AmbientBand`, `PageHeader`                                                           |
| `container.tsx`    | `Container`                                                                                                                       |

Icons are [lucide-react](https://lucide.dev) — tree-shaken, ~1KB each.

### Rules of thumb

- **An empty list always offers the next step.** Never just report the absence. Every
  list surface uses `EmptyState` with an action.
- **Every mutation gives feedback — but pick the right channel.** Toasts are for
  _out-of-band_ mutations, where there is no field to attach a message to: save/unsave,
  delete, upload, a status change on a board. Errors stay until dismissed; success/info
  self-clear after 5s. **Forms surface errors inline** via `Field`'s `role="alert"` span
  instead, because an error belongs next to the input that caused it, and because a toast
  is gone by the time the user finishes reading the field. Don't do both for one failure.
- **Enum → label → tone lives in [`lib/ui/status.ts`](../lib/ui/status.ts).** Not in the
  component that happens to need it — that is how the same status ends up two different
  colours on two screens.
- **Skeletons match the real shape.** Sizes are chosen for CLS-neutrality, not decoration.
- **`prefers-reduced-motion` is honoured globally** in the base layer. The cobe globe
  additionally parks its `requestAnimationFrame` loop, because CSS cannot reach a canvas
  animation.

## Constraints that will bite

1. **PPR.** Nothing at layout scope may read request data. See the comment block in
   `app/layout.tsx:26`.
2. **CSP.** `font-src 'self' data:` — a webfont must be self-hosted. `script-src` allows
   `'unsafe-inline'`, which is what lets the theme script work.
3. **The axe gate runs in both themes** (`tests/e2e/a11y.spec.ts`) and fails on
   critical/serious. Dark contrast is the most likely place to break this: the footer
   already needed `band-fg-muted` at neutral-400 because neutral-500 fails AA at 4.17:1
   on ink.
4. **`tests/e2e/design-regression.spec.ts`** asserts pill radii, `.eyebrow`/`.display`
   presence, the token layer resolving, the light↔dark flip persisting, and the footer
   staying dark. Read it before changing any of those.
5. **Clerk paints from its own variables, not from ours.** `<SignIn>`, `<SignUp>` and
   `<UserButton>` are styled by the `appearance` prop in
   [`clerk-provider.tsx`](../app/components/clerk-provider.tsx), which holds a light and a
   dark set of **concrete hex values duplicated from `globals.css`** — Clerk derives
   hover/border/disabled shades by doing colour maths on them, so a `var(--surface)`
   reference is not usable there. Change a surface or foreground token and those two
   objects need the same change, or the auth pages drift out of step with the rest of the
   app. `fontFamily` is the exception: it is passed straight through to CSS, so it can and
   does reference `var(--font-inter)`.
