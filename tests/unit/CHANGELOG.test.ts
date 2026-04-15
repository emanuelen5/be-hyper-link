/**
 * Validates that the actual CHANGELOG.md in this repository has the required
 * markers in the correct positions so that the release scripts work properly.
 *
 * The required layout is:
 *   ## [Unreleased]
 *   <!-- releases -->
 *   ... unreleased content ...
 *   <!-- released -->
 *   ## [x.y.z] - date
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import {
  parseChangelog,
  RELEASES_MARKER,
  RELEASED_MARKER,
} from '../../src/release-notes/parse-changelog';

const changelogPath = resolve(__dirname, '../../CHANGELOG.md');
const content = readFileSync(changelogPath, 'utf-8');

describe('CHANGELOG.md structure', () => {
  it('contains the [Unreleased] heading', () => {
    expect(content).toContain('## [Unreleased]');
  });

  it('contains the <!-- releases --> marker', () => {
    expect(content).toContain(RELEASES_MARKER);
  });

  it('contains the <!-- released --> marker', () => {
    expect(content).toContain(RELEASED_MARKER);
  });

  it('<!-- releases --> marker appears before <!-- released --> marker', () => {
    const releasesIdx = content.indexOf(RELEASES_MARKER);
    const releasedIdx = content.indexOf(RELEASED_MARKER);
    expect(releasesIdx).toBeLessThan(releasedIdx);
  });

  it('<!-- releases --> marker appears immediately after the [Unreleased] heading', () => {
    // There must be no non-whitespace content between ## [Unreleased] and <!-- releases -->
    const headingIdx = content.indexOf('## [Unreleased]');
    const releasesIdx = content.indexOf(RELEASES_MARKER);
    const between = content.slice(headingIdx + '## [Unreleased]'.length, releasesIdx);
    expect(between.trim()).toBe('');
  });

  it('has non-empty unreleased content between the markers', () => {
    const { unreleased } = parseChangelog(content);
    expect(unreleased.trim()).not.toBe('');
  });
});
