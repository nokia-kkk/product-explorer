# 0005 — shadcn Components on Tailwind 3, with Real Radix Primitives

**Date**: 2026-10-18
**Status**: Accepted

## Context

The products refactor asked for a shared UI layer so the toolbar, error banners, skeletons and
empty states stopped being hand-rolled markup repeated across files. shadcn/ui was requested
explicitly, and the requirement was that the components be **real shadcn**, not
native-element lookalikes styled to match.

That ran into two constraints:

1. **shadcn 4.x emits Tailwind v4 styles** — `ring-3`, `size-4`, `bg-popover`,
   `max-h-(--radix-select-content-available-height)`, `data-open:animate-in`, plus a
   `@theme`/`@custom-variant` stylesheet. This repo is on Tailwind **3.4.19**, where those
   resolve to nothing.
2. **Radix `Select` is not a `<select>`.** Its trigger is a `<button>` and its options only
   exist once the popup opens, so tests that drive a dropdown must click a trigger then an
   option rather than firing a `change` event.

## Decision

- **Stay on Tailwind 3.4.19** and pin the CLI to **shadcn 2.10.x**, the last line whose
  registry emits Tailwind-3-idiomatic output (`h-9`, `rounded-md`, `shadow-sm`,
  `focus:ring-1`, `ring-offset-background`).
- **Install the real Radix-based components.** `Select` is `@radix-ui/react-select`;
  `Button` uses `class-variance-authority`; icons come from `lucide-react`. No native
  element is substituted for a shadcn component.
- **Accept the test cost.** The four dropdown-driven tests were rewritten as click
  sequences (see `src/test/selectOption.ts`), rather than downgrading the component to keep
  the old `fireEvent.change` assertions green.
- **Keep `@/` as the import alias.** shadcn requires it, so it is live config even though
  the feature code uses relative paths.
- **Convert the palette to shadcn's semantic tokens** (`border`, `card`, `foreground`,
  `muted-foreground`, …), with the token values tuned to the previous `gray-*` palette so
  the visual change is minimal, rather than running two color systems side by side.

## Consequences

- ✅ One color language (`bg-card`, `border`, `text-muted-foreground`) across both shadcn
  components and feature components, instead of literals + tokens coexisting.
- ✅ Accessible dropdowns with keyboard navigation, typeahead and a portalled popup that a
  native `<select>` would not have given us.
- ✅ The a11y suite covers the Radix popup markup, not just a native control.
- ⚠️ The repo is pinned to an older shadcn CLI. Upgrading means an atomic Tailwind 4
  migration (`@theme`, oklch tokens, `@tailwindcss/postcss`, dropping `tailwind.config.js`)
  plus a visual re-verification of every screen.
- ⚠️ Dropdown tests are click sequences, not `fireEvent.change`. They are also slower.
- ⚠️ `vitest.setup.ts` must polyfill `hasPointerCapture`, `setPointerCapture`,
  `releasePointerCapture` and `scrollIntoView`, which Radix calls and jsdom lacks.
- ⚠️ Radix `Select` cannot take an empty-string value, so "All categories" uses a
  `__all__` sentinel that the toolbar maps back to `''`.
