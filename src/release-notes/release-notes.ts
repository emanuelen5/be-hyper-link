import { marked, Renderer } from 'marked';
import changelogContent from '../../CHANGELOG.md?raw';
import { parseChangelog } from './parse-changelog';

// Escape raw HTML blocks so that the bundled markdown content
// cannot inject arbitrary HTML even if the source file is tampered with.
const renderer = new Renderer();
renderer.html = ({ text }) => text.replace(/</g, '&lt;').replace(/>/g, '&gt;');
marked.use({ renderer });

const { released } = parseChangelog(changelogContent);

const el = document.getElementById('changelog');
if (el) {
  const html = marked.parse(released) as string;
  const doc = new DOMParser().parseFromString(html, 'text/html');
  el.append(...Array.from(doc.body.childNodes));
}
