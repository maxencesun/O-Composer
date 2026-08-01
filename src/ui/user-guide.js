const TOKEN_START = "\uE000";
const TOKEN_END = "\uE001";

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function safeGuideHref(value) {
  const href = String(value || "").trim().replace(/[\u0000-\u001f\u007f]/g, "");
  if (!href) return "#";
  if (href.startsWith("#")) return href;
  if (/^(?:https?:|mailto:)/i.test(href)) return href;
  if (/^[a-z][a-z\d+.-]*:/i.test(href) || href.startsWith("//")) return "#";
  return href;
}

function tokenStore() {
  const values = [];
  return {
    add(html) {
      const index = values.push(html) - 1;
      return `${TOKEN_START}${index}${TOKEN_END}`;
    },
    restore(html) {
      return html.replace(new RegExp(`${TOKEN_START}(\\d+)${TOKEN_END}`, "g"), (_match, index) => values[Number(index)] || "");
    }
  };
}

export function renderGuideInline(value) {
  const tokens = tokenStore();
  let source = String(value ?? "");
  source = source.replace(/`([^`]+)`/g, (_match, code) => tokens.add(`<code>${escapeHtml(code)}</code>`));
  source = source.replace(/!\[([^\]]*)\]\(([^\s)]+)(?:\s+["']([^"']*)["'])?\)/g, (_match, alt, href, title) => {
    const titleAttr = title ? ` title="${escapeHtml(title)}"` : "";
    return tokens.add(`<img src="${escapeHtml(safeGuideHref(href))}" alt="${escapeHtml(alt)}"${titleAttr} loading="lazy">`);
  });
  source = source.replace(/\[([^\]]+)\]\(([^\s)]+)(?:\s+["']([^"']*)["'])?\)/g, (_match, label, href, title) => {
    const safeHref = safeGuideHref(href);
    const titleAttr = title ? ` title="${escapeHtml(title)}"` : "";
    const externalAttrs = safeHref.startsWith("#") ? "" : ' target="_blank" rel="noopener noreferrer"';
    return tokens.add(`<a href="${escapeHtml(safeHref)}"${titleAttr}${externalAttrs}>${renderGuideInline(label)}</a>`);
  });
  let html = escapeHtml(source)
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/__([^_]+)__/g, "<strong>$1</strong>")
    .replace(/(^|[^*])\*([^*]+)\*/g, "$1<em>$2</em>")
    .replace(/~~([^~]+)~~/g, "<del>$1</del>");
  return tokens.restore(html);
}

function plainHeadingText(value) {
  return String(value || "")
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/[`*_~]/g, "")
    .trim();
}

export function guideHeadingSlug(value) {
  return plainHeadingText(value)
    .toLocaleLowerCase()
    .normalize("NFKC")
    .replace(/[^\p{Letter}\p{Number}\s-]/gu, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function tableCells(line) {
  return String(line || "")
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map(cell => cell.trim());
}

function isTableDivider(line) {
  const cells = tableCells(line);
  return cells.length > 0 && cells.every(cell => /^:?-{3,}:?$/.test(cell));
}

function renderTable(lines, start) {
  const headers = tableCells(lines[start]);
  let index = start + 2;
  const rows = [];
  while (index < lines.length && /^\s*\|.*\|\s*$/.test(lines[index])) {
    rows.push(tableCells(lines[index]));
    index += 1;
  }
  const head = headers.map(cell => `<th scope="col">${renderGuideInline(cell)}</th>`).join("");
  const body = rows.map(row => `<tr>${headers.map((_header, cellIndex) => `<td>${renderGuideInline(row[cellIndex] || "")}</td>`).join("")}</tr>`).join("");
  return {
    html: `<div class="user-guide-table-wrap"><table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></div>`,
    next: index
  };
}

function renderListEntries(entries) {
  const roots = [];
  const stack = [];
  for (const entry of entries) {
    while (stack.length && entry.indent < stack[stack.length - 1].indent) stack.pop();
    let list = stack[stack.length - 1];
    if (!list || entry.indent > list.indent || entry.type !== list.type) {
      const nextList = { type: entry.type, indent: entry.indent, items: [] };
      if (list?.items.length) list.items[list.items.length - 1].children.push(nextList);
      else roots.push(nextList);
      stack.push(nextList);
      list = nextList;
    }
    list.items.push({ html: renderGuideInline(entry.text), children: [] });
  }
  const renderList = list => {
    const tag = list.type === "ol" ? "ol" : "ul";
    return `<${tag}>${list.items.map(item => `<li>${item.html}${item.children.map(renderList).join("")}</li>`).join("")}</${tag}>`;
  };
  return roots.map(renderList).join("");
}

function renderRawGuideLine(line) {
  const trimmed = line.trim();
  if (trimmed === "<details>") return '<details class="user-guide-details">';
  if (trimmed === "</details>") return "</details>";
  const summary = trimmed.match(/^<summary>(.*)<\/summary>$/i);
  if (summary) {
    const text = summary[1].replace(/^<strong>|<\/strong>$/gi, "");
    return `<summary>${renderGuideInline(text)}</summary>`;
  }
  if (trimmed === "<figure>") return '<figure class="user-guide-figure">';
  if (trimmed === "</figure>") return "</figure>";
  const caption = trimmed.match(/^<figcaption>(.*)<\/figcaption>$/i);
  if (caption) return `<figcaption>${renderGuideInline(caption[1])}</figcaption>`;
  const image = trimmed.match(/^<img\s+([^>]+)>$/i);
  if (image) {
    const src = image[1].match(/\bsrc=["']([^"']+)["']/i)?.[1] || "";
    const alt = image[1].match(/\balt=["']([^"']*)["']/i)?.[1] || "";
    const width = Math.max(1, Math.min(2000, Number(image[1].match(/\bwidth=["']?(\d+)/i)?.[1]) || 1200));
    return `<img src="${escapeHtml(safeGuideHref(src))}" alt="${escapeHtml(alt)}" width="${width}" loading="lazy">`;
  }
  return null;
}

export function renderUserGuideMarkdown(markdown) {
  const lines = String(markdown ?? "").replace(/\r\n?/g, "\n").split("\n");
  const html = [];
  const usedHeadingIds = new Map();
  let paragraph = [];
  let index = 0;

  const flushParagraph = () => {
    if (!paragraph.length) return;
    html.push(`<p>${renderGuideInline(paragraph.join(" ").trim())}</p>`);
    paragraph = [];
  };

  while (index < lines.length) {
    const line = lines[index];
    if (!line.trim()) {
      flushParagraph();
      index += 1;
      continue;
    }

    const fence = line.match(/^```\s*([^\s]*)\s*$/);
    if (fence) {
      flushParagraph();
      const language = String(fence[1] || "text").replace(/[^a-z\d_-]/gi, "") || "text";
      const code = [];
      index += 1;
      while (index < lines.length && !/^```\s*$/.test(lines[index])) {
        code.push(lines[index]);
        index += 1;
      }
      if (index < lines.length) index += 1;
      html.push(`<pre class="language-${escapeHtml(language)}"><code>${escapeHtml(code.join("\n"))}</code></pre>`);
      continue;
    }

    const heading = line.match(/^(#{1,6})\s+(.+?)\s*#*$/);
    if (heading) {
      flushParagraph();
      const level = heading[1].length;
      const baseSlug = guideHeadingSlug(heading[2]) || "section";
      const duplicateCount = usedHeadingIds.get(baseSlug) || 0;
      usedHeadingIds.set(baseSlug, duplicateCount + 1);
      const id = duplicateCount ? `${baseSlug}-${duplicateCount}` : baseSlug;
      html.push(`<h${level} id="${escapeHtml(id)}">${renderGuideInline(heading[2])}</h${level}>`);
      index += 1;
      continue;
    }

    if (/^\s*\|.*\|\s*$/.test(line) && index + 1 < lines.length && isTableDivider(lines[index + 1])) {
      flushParagraph();
      const table = renderTable(lines, index);
      html.push(table.html);
      index = table.next;
      continue;
    }

    const listMatch = line.match(/^(\s*)([-+*]|\d+\.)\s+(.+)$/);
    if (listMatch) {
      flushParagraph();
      const entries = [];
      while (index < lines.length) {
        const item = lines[index].match(/^(\s*)([-+*]|\d+\.)\s+(.+)$/);
        if (!item) break;
        entries.push({
          indent: item[1].replace(/\t/g, "  ").length,
          type: /\d+\./.test(item[2]) ? "ol" : "ul",
          text: item[3]
        });
        index += 1;
      }
      html.push(renderListEntries(entries));
      continue;
    }

    if (/^>\s?/.test(line)) {
      flushParagraph();
      const quoteLines = [];
      while (index < lines.length && /^>\s?/.test(lines[index])) {
        quoteLines.push(lines[index].replace(/^>\s?/, ""));
        index += 1;
      }
      const admonition = quoteLines[0]?.match(/^\[!(TIP|IMPORTANT|WARNING|NOTE|CAUTION)\]$/i)?.[1]?.toLowerCase();
      if (admonition) quoteLines.shift();
      const label = admonition ? `<strong class="user-guide-callout-label">${escapeHtml(admonition.toUpperCase())}</strong>` : "";
      html.push(`<blockquote${admonition ? ` class="user-guide-callout ${admonition}"` : ""}>${label}${renderUserGuideMarkdown(quoteLines.join("\n"))}</blockquote>`);
      continue;
    }

    const raw = renderRawGuideLine(line);
    if (raw !== null) {
      flushParagraph();
      html.push(raw);
      index += 1;
      continue;
    }

    if (/^\s*(?:-{3,}|\*{3,}|_{3,})\s*$/.test(line)) {
      flushParagraph();
      html.push("<hr>");
      index += 1;
      continue;
    }

    paragraph.push(line.trim());
    index += 1;
  }
  flushParagraph();
  return html.join("\n");
}

export function clearUserGuideHighlights(container) {
  if (!container) return;
  for (const mark of container.querySelectorAll("mark.user-guide-search-match")) {
    mark.replaceWith(document.createTextNode(mark.textContent || ""));
  }
  container.normalize();
}

export function highlightUserGuideMatches(container, query) {
  clearUserGuideHighlights(container);
  const needle = String(query || "").trim().toLocaleLowerCase();
  if (!container || needle.length < 2 || typeof document === "undefined") return [];
  const nodes = [];
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const parent = node.parentElement;
      if (!node.textContent || !parent || parent.closest("script, style, mark")) return NodeFilter.FILTER_REJECT;
      return node.textContent.toLocaleLowerCase().includes(needle) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
    }
  });
  while (walker.nextNode()) nodes.push(walker.currentNode);
  for (const node of nodes) {
    const text = node.textContent || "";
    const lower = text.toLocaleLowerCase();
    const fragment = document.createDocumentFragment();
    let cursor = 0;
    let matchIndex = lower.indexOf(needle);
    while (matchIndex >= 0) {
      fragment.append(document.createTextNode(text.slice(cursor, matchIndex)));
      const mark = document.createElement("mark");
      mark.className = "user-guide-search-match";
      mark.textContent = text.slice(matchIndex, matchIndex + needle.length);
      fragment.append(mark);
      cursor = matchIndex + needle.length;
      matchIndex = lower.indexOf(needle, cursor);
    }
    fragment.append(document.createTextNode(text.slice(cursor)));
    node.replaceWith(fragment);
  }
  return [...container.querySelectorAll("mark.user-guide-search-match")];
}

export function focusUserGuideMatch(matches, index) {
  const items = Array.from(matches || []);
  for (const item of items) item.classList.remove("current");
  if (!items.length) return -1;
  const normalizedIndex = ((Number(index) || 0) % items.length + items.length) % items.length;
  const current = items[normalizedIndex];
  current.classList.add("current");
  for (let details = current.closest("details"); details; details = details.parentElement?.closest("details")) details.open = true;
  current.scrollIntoView({ block: "center", behavior: "smooth" });
  return normalizedIndex;
}
