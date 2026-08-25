# Design system

The visual language, its tokens, and the rules for extending it.

## Lineage

Two passes, both distilled from supplied reference designs rather than invented:

1. **2026-07 editorial refresh** (`d3ff7ad` → `e0ed167`) — massive display type with
   small-caps eyebrow labels, ink-black pill CTAs paired with white secondary pills,
   elevated rounded cards with glass and dark-ticket tones, chip taxonomies, stat rows,
   split-screen auth.
2. **2026-08 token layer** (`d3ff7ad` → `144af03`) — a real token layer, dark mode, an
   icon set, and the interaction patterns the references showed that the first pass had no
   vocabulary for: a theme toggle in the header, arrow-in-circle CTAs, divided stat
   ledgers, sparklines in glass metric cards, a ⌘K command palette with keyboard hints,
   and crafted empty states.
3. **This pass — the Odoo-enterprise console.** The first two passes applied one visual
   language to the whole product. That works for the public funnel and fights the back
   office, where the job is scanning and mutating records, not being persuaded: at
   `px-4 py-3` rows, 1rem radii and `py-10` page headers, a laptop showed six or seven
   jobs. The console now runs its own register — dense, flat, 4px corners, hairline
   borders, plum ink — with Odoo's structural vocabulary: control panel, breadcrumb,
   record pager, view switcher, searchview facets, form sheet, notebook, statusbar.
   See [Two registers](#two-registers) below.

Deliberately **not** adopted from the references: a language switcher (i18n is a declared
V2 item in [ARCHITECTURE.md](./ARCHITECTURE.md)), 3D chrome renders, and licensed
photography — neither has an asset pipeline here and both would wreck the LCP budget.
The equivalent visual weight comes from type, dark surfaces, and the CSS-only ambient
canvas.

## Two registers

The product is two things, and the design system says so:

| Register      | Where                                                          | Reads as                                                                      |
| ------------- | -------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| **Editorial** | `/`, `/jobs`, `/companies`, auth, legal, error pages           | Display type, pill CTAs, ambient wash, glass, 1rem radii, generous padding    |
| **Console**   | `/company/*`, `/jobseeker/*`, `/admin`, onboarding, account/\* | 13px base, flat 4px corners, hairline borders, plum ink, opaque sticky chrome |

Both are the **same token names** with different values. `.o-console` — applied by
[`ConsoleShell`](../app/components/console/shell.tsx) at the root of every back-office
page — re-declares `--surface`, `--fg`, `--ink`, `--border`, the radii and the shadows, so
`Card`, `Badge`, `Input`, `Select` and `Button` re-skin inside it with **zero call-site
changes**. Nothing below `ConsoleShell` knows which register it is in.

Two consequences worth knowing before editing `globals.css`:

- **`.o-console` must stay after `.dark` in source order.** Both are single-class
  selectors, so for tokens they both declare, source order decides. `.dark .o-console`
  follows for the same reason.
- **Radii are declared as raw `--r-*` vars and only _referenced_ from `@theme inline`.**
  An inline `@theme` entry with a literal value (`--radius-card: 1rem`) bakes that literal
  into the emitted utility, and no scope class can ever override it. That indirection is
  the only reason `rounded-card` can mean 16px on marketing and 4px in the console.
  `--r-pill` is why the same `Button` is a capsule on a landing page and an Odoo control
  in a list view.

The shared accent (`--brand`) was retuned from indigo to the Odoo plum family in this pass
so the funnel and the console read as one product; it is 7.23:1 on `--surface`, so it stays
AA as body-size link text.

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
no `white`, no `indigo-600`. Use the semantic name and both dark mode **and** the
console register come for free.

| Group      | Tokens                                                                       | Use                                                                                                                                             |
| ---------- | ---------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| Surface    | `canvas` `surface` `surface-raised` `surface-sunken`                         | page · card · card-above-card · recessed well (kanban columns, table headers)                                                                   |
| Foreground | `fg` `fg-muted` `fg-subtle` `fg-inverse`                                     | body · secondary · captions · text on an inverted fill                                                                                          |
| Line       | `border` `border-strong`                                                     | hairlines · form-control borders                                                                                                                |
| Ink        | `ink` `ink-fg` `ink-hover`                                                   | primary CTAs, active pills, own chat bubbles. **Inverts** with the theme so a primary button is always the highest-contrast element on the page |
| Band       | `band` `band-fg` `band-fg-muted`                                             | footer, dark ticket cards, cookie banner. **Does not invert** — a dark band is a register, not "the opposite of the page"                       |
| Brand      | `brand` `brand-solid` `brand-fg` `brand-subtle` `brand-subtle-fg`            | the _accent_: links, focus rings, eyebrows, badges — never the primary fill. Plum on marketing, teal in the console                             |
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
| `skeleton.tsx`     | `Skeleton` `SkeletonTitle` `SkeletonText` `SkeletonCard` `SkeletonList`                                                           |
| `kbd.tsx`          | `Kbd`, `KbdHint`                                                                                                                  |
| `sparkline.tsx`    | `Sparkline` — inline SVG polyline, no charting runtime                                                                            |
| `theme-toggle.tsx` | `ThemeToggle` — Radix `DropdownMenu` exposing Light/Dark/System explicitly                                                        |
| `ambient.tsx`      | `AmbientCanvas` (`hero` > `band` > `page`), `AmbientBand`, `PageHeader`                                                           |
| `container.tsx`    | `Container`                                                                                                                       |

Icons are [lucide-react](https://lucide.dev) — tree-shaken, ~1KB each. No Material UI icons or
components anywhere in the app; mixing icon sets is a visual-consistency footgun (Material's
filled/circular glyphs read as a different product next to Lucide's stroke-line style). Where an
interaction needs real accessible menu/dialog mechanics rather than a static glyph — `ThemeToggle`
is the first case — reach for [Radix UI Primitives](https://www.radix-ui.com/primitives) rather
than hand-rolling roving-focus/Escape/typeahead handling again; `CommandPalette` predates this and
still hand-rolls its own listbox, which is why it's more code than `ThemeToggle` for a similar
amount of behavior.

**No Unicode glyphs standing in for icons.** `→` `←` `↗` `✓` in JSX text used to do duty for
"go to", "back", "opens externally" and "done" — replace with `ArrowRight`/`ArrowLeft`/
`ExternalLink`/`CheckCircle2` etc. The one deliberate exception is the command palette's `Kbd`
footer legend (`↑↓` `navigate`, `↵` `open`): those glyphs represent literal keyboard keys, which is
how virtually every app with a command palette shows a shortcut legend — a Lucide icon doesn't
read as "the Enter key" the way `↵` does inside a `<kbd>`-styled tag.

### Console primitives

[`app/components/console/`](../app/components/console/). The Odoo vocabulary. These are
_structure_, not styling — the token register above already did the styling — so each one
encodes a pattern the editorial primitives had no word for.

| File                | Exports                                                                                                            | Solves                                                                                                                      |
| ------------------- | ------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------- |
| `shell.tsx`         | `ConsoleShell` (applies `.o-console`), `ConsoleWidth`, `ConsoleBody`                                               | One place that switches registers; one width every console surface aligns to                                                |
| `nav.tsx`           | `ConsoleNav` — module menu, active = longest matching prefix                                                       | Replaces the flat pill strip. Icons are **string names** into a local map, not components (see the RSC note below)          |
| `control-panel.tsx` | `ControlPanel`, `Breadcrumb`, `RecordPager`, `ViewSwitcher`                                                        | "Where am I / what can I do / how do I look at it", answered identically on every screen                                    |
| `list-view.tsx`     | `ListView` (sortable headers, footer aggregates), `Pager`                                                          | Dense rows, DB-side sort, real paging, and a total the user can see                                                         |
| `kanban.tsx`        | `KanbanBoard`, `KanbanColumn` (count + aggregate + segmented progress bar), `KanbanCard`                           | A column that says something about its contents, not just how many                                                          |
| `sheet.tsx`         | `FormSheet`, `SheetTitle`, `SheetGroups`, `SheetGroup`, `SheetField`, `SheetValue`                                 | Two columns of label:value pairs instead of one long stack. `SheetField` is prop-compatible with `ui/form.tsx`'s `Field`    |
| `notebook.tsx`      | `Notebook` — full WAI-ARIA tabs (roving tabindex, arrows, Home/End)                                                | Long-form sections of one record become one keystroke apart instead of 400px of scroll each                                 |
| `statusbar.tsx`     | `Statusbar` — the chevron stage pipeline                                                                           | Position in a process _and_ what comes next, which a `<select>` shows neither of                                            |
| `search-view.tsx`   | `SearchBox` (zero-JS GET form), `FacetChips`                                                                       | The active query, stated once, each part individually removable                                                             |
| `filter-menu.tsx`   | `FilterMenu` — Radix `DropdownMenu` of `Link`s                                                                     | Filters stay shareable URLs; the menu is only the picker                                                                    |
| `dirty-bar.tsx`     | `DirtyBar` — sticky save/discard + `beforeunload`                                                                  | A reachable save button, and the first unsaved-changes signal these forms have ever had                                     |
| `skeleton.tsx`      | `ConsoleNavSkeleton`, `ControlPanelSkeleton`, `ConsoleListSkeleton`, `ConsoleSheetSkeleton`, `ConsolePageSkeleton` | Chrome fallbacks at the real heights — the sticky bars compute offsets from `--o-nav-h`, so a short fallback jumps the page |

URL state for every list view is parsed and built by
[`lib/ui/list-params.ts`](../lib/ui/list-params.ts) (`readListQuery`, `makeHref`), unit-tested
in `tests/unit/list-params.test.ts`. Two rules it enforces that were previously per-page and
inconsistent: `order`/`view` are **allow-listed** before reaching a Prisma `orderBy`, and any
patch that isn't itself an offset change **resets `offset`** — otherwise re-sorting from page 4
lands on a page-4 window of a differently-sized result set, which reads as an empty table.

**Icons cross the RSC boundary as strings.** A lucide icon is a function; a server layout
passing one to `ConsoleNav` fails the build with _"Functions cannot be passed directly to
Client Components"_. `ConsoleNav` keeps a local name→component map, exactly as
[`lib/ui/commands.ts`](../lib/ui/commands.ts) already does for the command palette.

**Deliberately not built.** Row-selection checkboxes (Odoo's exist to drive bulk actions, and
no bulk mutation exists server-side yet — the control would do nothing) and the chatter/activity
log (`recruiterNotes` is a single overwritten string; a threaded log needs a data model, not a
component). Drag-and-drop kanban was skipped in favour of the one-click stage stepper, which is
keyboard-operable without a parallel a11y implementation.

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
   staying dark. Read it before changing any of those. Its console counterpart is
   **`tests/e2e/console-design.spec.ts`**, which asserts the `.o-console` scope actually
   flattens the radii, that the same `Button` lands under 6px there while marketing stays
   ≥ 24px, and that the editorial footer is hidden on a console page. The failure mode both
   exist to catch is one register leaking into the other.
5. **The console hides the footer with `:has()`, not a route check.** The root layout renders
   the footer outside any Suspense boundary, where `usePathname()` is uncached data at layout
   scope and collapses every route's PPR shell. Same trap as constraint 1.
6. **Clerk paints from its own variables, not from ours.** `<SignIn>`, `<SignUp>` and
   `<UserButton>` are styled by the `appearance` prop in
   [`clerk-provider.tsx`](../app/components/clerk-provider.tsx), which holds a light and a
   dark set of **concrete hex values duplicated from `globals.css`** — Clerk derives
   hover/border/disabled shades by doing colour maths on them, so a `var(--surface)`
   reference is not usable there. Change a surface or foreground token and those two
   objects need the same change, or the auth pages drift out of step with the rest of the
   app. `fontFamily` is the exception: it is passed straight through to CSS, so it can and
   does reference `var(--font-inter)`.
