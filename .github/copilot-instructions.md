# hyper-link Copilot Instructions

## Project Overview
Firefox browser extension for keyboard-based link navigation. TypeScript + React, Manifest V2.

## Architecture
- `src/content/`: Content script injected into pages (link detection, overlay, keyboard handler)
- `src/background/`: Background script (settings storage, message routing)
- `src/popup/`: Extension popup UI (settings, React)
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
- **Manifest V2** for Firefox compatibility (MV3 has limited cross-browser support)
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
- `npm run build` — production Vite build into `dist/`
- `npm run build:dev` — development build with source maps
- Build is powered by `vite` + `vite-plugin-web-extension` + `@vitejs/plugin-react`
- Entry points are auto-detected from `manifest.json` by `vite-plugin-web-extension`
- `manifest.json` at the project root references source files (e.g. `src/content/index.tsx`); the plugin rewrites paths in the output manifest to point to the built files
- Static assets (icons) live in `public/` and are copied to `dist/` unchanged
- Always format code with `npm run format` (Prettier) after editing

## Changes in purpose/functionality
If the extension's purpose or functionality changes significantly (e.g. adding form navigation, changing the trigger key behavior, browser support, etc.), update this instructions file to reflect the new design and architecture.

## Changelog
Always add an entry to the `[Unreleased]` section in `CHANGELOG.md` when making any user-visible change. Follow the [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) format:

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
