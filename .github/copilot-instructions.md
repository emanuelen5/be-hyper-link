# hyper-link Copilot Instructions

## Project Overview

Firefox and Chrome browser extension for keyboard-based link navigation. TypeScript + React. Firefox uses Manifest V2; Chrome uses Manifest V3.

## Architecture

- `src/content/`: Content script injected into pages (link detection, overlay, keyboard handler)
- `src/background/`: Background script (settings storage, message routing)
- `src/popup/`: Extension popup UI (settings, React)
- `src/release-notes/`: Release-notes page shown after an update (parses CHANGELOG.md, rendered as an HTML page)
- `src/shared/`: Shared types and utilities used across extension contexts
- `src/utils/`: Pure utility functions (label filtering, etc.)

## Testing

- Unit tests: Vitest + jsdom (`npm test`) — live in `tests/unit/`
- E2E tests: Playwright (`npm run test:e2e`) — live in `tests/e2e/`
- Both run in GitHub Actions CI on push/PR to main
- Unit test setup stub is in `tests/unit/setup.ts` (stubs `browser` global)

## Key Design Decisions

- **Shadow DOM** in `Overlay.tsx`: the label overlay uses `attachShadow` to prevent the page's CSS from bleeding into overlay styles
- **Fixed positioning** in label badges: no `scrollY` correction needed since `position: fixed` is already relative to the viewport
- **Keyboard capture**: `document.addEventListener('keydown', ..., { capture: true })` ensures the extension sees keys before the page does
- **React** for both the overlay (content script) and popup UI
- **Dual-manifest setup**: `manifest.json` (Firefox, MV2) and `manifest.chrome.json` (Chrome, MV3); selected at build time via the `BROWSER` environment variable
- **Two navigation modes**: sequential and keyboard-region (keyboard layout rows → vertical screen regions)
- **Prefix-free labels**: sequential mode generates uniform-length labels (a–z for ≤26 links, aa–zz for ≤676, etc.) so no label is a prefix of another. When scrolling reveals new links past a length boundary, all existing labels are relabeled.
- **Two highlight toggles**: dim (dim everything except link labels) and border (outline each link), independently enabled
- **Trigger key** (default: `/`, configurable as a key+modifier combo) activates the overlay only when not focused on an input/textarea
- **Confirm before follow**: optional setting to require Enter before navigating to the matched link
- **Search mode**: pressing the search key (default `/`) while active switches to a text-search mode that filters links by their visible text

## State Machine (KeyboardHandler)

Managed via a centralized `setState()` method with `onExitState()`/`onEnterState()` hooks.

- `idle` → press trigger key (not in input) → `active`
- `active`/`typing` → type label chars → narrow matches → `typing`
- `typing` → unique match → follow link (or wait for Enter if confirm mode) → `idle`
- `active` → press search key → `searching`
- `searching` → type search text → filter links by visible text
- `searching` → Enter → `search-selecting` (navigate filtered results)
- `search-selecting` → Enter → follow selected link → `idle`
- `idle` → press trigger key in input/textarea → `form`
- `form` → type label chars → `form-focused` (focus the selected form element)
- any state → Escape → `idle`
- keyboard-region mode: first key picks vertical region, subsequent keys select within region

## Adding New Modes

- **Navigation modes**: implement logic in `src/content/KeyboardHandler.ts`; add type to `NavigationMode` in `src/shared/types.ts`
- **Highlight modes**: implement in `src/content/HighlightManager.ts`; add boolean setting to `Settings` in `src/shared/types.ts`
- Add UI controls in `src/popup/Popup.tsx`

## Build

- `npm run build:firefox` (alias: `npm run build`) — production Firefox build into `dist-firefox/`, zipped as `hyper-link-firefox.zip`
- `npm run build:chrome` — production Chrome build into `dist-chrome/`, zipped as `hyper-link-chrome.zip`
- `npm run build:dev:firefox` (alias: `npm run build:dev`) — development Firefox build with source maps
- `npm run build:dev:chrome` — development Chrome build with source maps
- Build is powered by `vite` + `vite-plugin-web-extension` + `@vitejs/plugin-react`
- The target browser is selected via the `BROWSER` environment variable (`firefox` by default)
- `manifest.json` (Firefox, MV2) and `manifest.chrome.json` (Chrome, MV3) are selected at build time; `vite-plugin-web-extension` auto-detects entry points and rewrites manifest paths to built files
- Static assets (icons) live in `assets/` and are copied to the output directory unchanged
- Always format code with `npm run format` (Prettier) after editing

## Keeping these instructions up to date

If you notice that any part of these instructions is out of date or inaccurate, update this file as part of your change. This includes adding new source directories, updating build commands, correcting architecture descriptions, or any other details that no longer reflect the actual codebase.

In particular, if the extension's purpose or functionality changes significantly (e.g. adding form navigation, changing the trigger key behavior, browser support, etc.), update this file to reflect the new design and architecture.

## Changelog

Only add a changelog entry when the change is **user-visible** — meaning it affects the extension's GUI or observable behavior. Do **not** add entries for internal refactors, file renames, code formatting, test changes, or other implementation details that users never see.

Always add an entry to the `[Unreleased]` section in `CHANGELOG.md` when making a user-visible change. Follow the [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) format:

- **Added** – new features
- **Changed** – changes to existing functionality
- **Deprecated** – features that will be removed in a future release
- **Removed** – features removed in this release
- **Fixed** – bug fixes
- **Security** – fixes for vulnerabilities

Each entry should reference the relevant pull request (but only if there is one), e.g.:

```markdown
## [Unreleased]

### Fixed

- Corrected label positioning on scrolled pages ([#42](https://github.com/emanuelen5/be-hyper-link/pull/42))
```

## Form Navigation

Form navigation is implemented: pressing the trigger key while focused on an input/textarea enters `form` mode, which labels visible form elements (inputs, textareas, selects) for quick focus switching. The `form` → `form-focused` states handle this flow.
