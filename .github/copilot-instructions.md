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
- **Two navigation modes**: sequential (letter combos a, b, …, aa, ab, …) and keyboard-region (keyboard layout rows → vertical screen regions)
- **Two highlight toggles**: dim (dim everything except link labels) and border (outline each link), independently enabled
- **Trigger key** (default: `f`) activates the overlay only when not focused on an input/textarea

## State Machine (KeyboardHandler)
- `idle` → press trigger key (not in input) → `active`
- `active`/`typing` → type chars → narrow matches → `typing`
- `typing` → unique match → follow link → `idle`
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

## Changes in purpose/functionality
If the extension's purpose or functionality changes significantly (e.g. adding form navigation, changing the trigger key behavior, browser support, etc.), update this instructions file to reflect the new design and architecture.

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

## Future: Form Navigation
The architecture supports form navigation (inputs, textareas, selects). When implementing:
- Add a `targetType` setting: `'links' | 'inputs' | 'all'`
- Extend `LinkDetector.ts` into a more general `ElementDetector.ts`
- Use different label colors/styles for inputs vs links
