# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Trigger key now accepts modifier combinations (e.g. `ctrl+/`, `ctrl+shift+f`); click the field then press the desired key combo to set it

### Changed
- Settings are now saved immediately when any option is changed; the Save button has been removed

<!-- releases -->

<!-- released -->

## [0.1.0] - 2026-03-16

### Added
- Keyboard-based link navigation activated by a configurable trigger key (`/` by default)
- Two navigation modes: sequential (letter combinations) and keyboard-region (keyboard rows map to screen regions)
- Text-based link search with Tab / Shift+Tab to cycle results
- Dim and border highlight modes (independently toggleable)
- Settings popup for navigation mode, highlight modes, trigger key, and more
- Option to detect new links on scroll
- Optional confirmation before following a link
- Links sorted top-to-bottom, left-to-right for consistent ordering
