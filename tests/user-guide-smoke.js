import assert from "node:assert/strict";
import fs from "node:fs";
import {
  guideHeadingSlug,
  renderGuideInline,
  renderUserGuideMarkdown
} from "../src/ui/user-guide.js";

assert.equal(guideHeadingSlug("14. 军事定向（军体定向）"), "14-军事定向军体定向");
assert.equal(guideHeadingSlug("8. PDF 导出弹窗"), "8-pdf-导出弹窗");

const inline = renderGuideInline("**粗体**、`代码`和[链接](https://example.com)");
assert.match(inline, /<strong>粗体<\/strong>/);
assert.match(inline, /<code>代码<\/code>/);
assert.match(inline, /target="_blank" rel="noopener noreferrer"/);
assert.equal(renderGuideInline("[危险](javascript:alert(1))").includes("javascript:"), false);

const unsafe = renderUserGuideMarkdown("# 标题\n\n<script>alert(1)</script>\n\n| A | B |\n| --- | --- |\n| 1 | 2 |");
assert.match(unsafe, /<h1 id="标题">标题<\/h1>/);
assert.equal(unsafe.includes("<script>"), false);
assert.match(unsafe, /&lt;script&gt;alert\(1\)&lt;\/script&gt;/);
assert.match(unsafe, /<table>/);

const markdown = fs.readFileSync(new URL("../USER_GUIDE.md", import.meta.url), "utf8");
const html = renderUserGuideMarkdown(markdown);
assert.match(html, /<h1 id="o-composer-项目级用户指南">/);
assert.match(html, /<details class="user-guide-details">/);
assert.match(html, /class="user-guide-callout tip"/);
assert.match(html, /class="language-python"/);
assert.match(html, /samples\/Kymen%20Rastiviesti/);
assert.ok((html.match(/<table>/g) || []).length >= 10, "the full guide should render its reference tables");

const headingIds = new Set([...html.matchAll(/\sid="([^"]+)"/g)].map(match => match[1]));
const internalLinks = [...html.matchAll(/href="#([^"]+)"/g)].map(match => match[1]);
assert.ok(internalLinks.length >= 25, "the guide table of contents should remain available");
assert.deepEqual([...new Set(internalLinks.filter(anchor => !headingIds.has(anchor)))], [], "every guide anchor should resolve inside the floating reader");

const englishMarkdown = fs.readFileSync(new URL("../USER_GUIDE.en.md", import.meta.url), "utf8");
const englishHtml = renderUserGuideMarkdown(englishMarkdown);
assert.match(englishHtml, /<h1 id="o-composer-project-user-guide">/);
assert.match(englishHtml, /<h2 id="12-score-courses">/);
assert.match(englishHtml, /<h2 id="14-military-orienteering">/);
assert.match(englishHtml, /<h2 id="15-forks-variations-and-relays">/);
assert.match(englishHtml, /samples\/Kymen%20Rastiviesti/);
assert.ok((englishHtml.match(/<table>/g) || []).length >= 6, "the English guide should retain detailed reference tables");
const englishHeadingIds = new Set([...englishHtml.matchAll(/\sid="([^"]+)"/g)].map(match => match[1]));
const englishInternalLinks = [...englishHtml.matchAll(/href="#([^"]+)"/g)].map(match => match[1]);
assert.ok(englishInternalLinks.length >= 25, "the English guide table of contents should remain available");
assert.deepEqual([...new Set(englishInternalLinks.filter(anchor => !englishHeadingIds.has(anchor)))], [], "every English guide anchor should resolve inside the floating reader");

console.log("user guide smoke test passed");
