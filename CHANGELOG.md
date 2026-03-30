# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed
- Search box now uses fuzzy matching: words separated by spaces are matched independently (in any order) against link text

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
