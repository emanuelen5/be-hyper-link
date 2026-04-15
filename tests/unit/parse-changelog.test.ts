import { describe, it, expect } from 'vitest';
import { parseChangelog, RELEASES_MARKER, RELEASED_MARKER } from '../../src/release-notes/parse-changelog';

const PREAMBLE = `All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).`;

const UNRELEASED_CONTENT = `### Added
- Some new feature

### Fixed
- Some bug fix`;

const RELEASED_CONTENT = `## [1.0.0] - 2025-01-01

### Added
- Initial release`;

function buildChangelog({
  preamble = PREAMBLE,
  unreleased = UNRELEASED_CONTENT,
  released = RELEASED_CONTENT,
}: {
  preamble?: string;
  unreleased?: string;
  released?: string;
} = {}) {
  return `# Changelog

${preamble}

## [Unreleased]
${RELEASES_MARKER}

${unreleased}

${RELEASED_MARKER}

${released}
`;
}

describe('parseChangelog', () => {
  it('extracts unreleased content between markers', () => {
    const content = buildChangelog();
    const { unreleased } = parseChangelog(content);
    expect(unreleased).toBe(UNRELEASED_CONTENT);
  });

  it('extracts released content after the released marker', () => {
    const content = buildChangelog();
    const { released } = parseChangelog(content);
    expect(released).toBe(RELEASED_CONTENT);
  });

  it('extracts preamble before the [Unreleased] heading', () => {
    const content = buildChangelog();
    const { preamble } = parseChangelog(content);
    expect(preamble).toBe(PREAMBLE);
  });

  it('returns empty unreleased when the section between markers is empty', () => {
    const content = buildChangelog({ unreleased: '' });
    const { unreleased } = parseChangelog(content);
    expect(unreleased).toBe('');
  });

  it('returns empty preamble when there is no content before [Unreleased]', () => {
    const content = `# Changelog\n\n## [Unreleased]\n${RELEASES_MARKER}\n\n${RELEASED_MARKER}\n\n${RELEASED_CONTENT}\n`;
    const { preamble } = parseChangelog(content);
    expect(preamble).toBe('');
  });

  it('returns full content as released when the released marker is absent', () => {
    const content = `# Changelog\n\n## [Unreleased]\n${RELEASES_MARKER}\n\n${UNRELEASED_CONTENT}\n\n${RELEASED_CONTENT}\n`;
    const { released } = parseChangelog(content);
    expect(released).toContain('# Changelog');
  });

  it('reflects the typical post-release CHANGELOG structure (empty unreleased section)', () => {
    // After update-changelog.py runs the unreleased section is emptied and the
    // content moves under a versioned heading between released marker and the
    // next version.
    const postRelease = `# Changelog\n\n## [Unreleased]\n${RELEASES_MARKER}\n\n${RELEASED_MARKER}\n\n## [1.1.0] - 2025-06-01\n\n${UNRELEASED_CONTENT}\n\n${RELEASED_CONTENT}\n`;
    const { unreleased, released } = parseChangelog(postRelease);
    expect(unreleased).toBe('');
    expect(released).toContain('[1.1.0]');
    expect(released).toContain(UNRELEASED_CONTENT);
    expect(released).toContain('[1.0.0]');
  });
});
