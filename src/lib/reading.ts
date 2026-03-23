import sanitizeHtml from "sanitize-html";

export type ArticleHeadingLevel = 2 | 3 | 4;

export type ArticleHeading = {
  id: string;
  text: string;
  level: ArticleHeadingLevel;
};

export type ReadingStats = {
  minutes: number;
  characterCount: number;
  cjkCharacterCount: number;
  latinWordCount: number;
};

const PLAIN_TEXT_SANITIZE_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [],
  allowedAttributes: {},
};

const HEADING_REGEX = /<h([2-4])([^>]*)>([\s\S]*?)<\/h\1>/gi;
const FIRST_PARAGRAPH_REGEX = /<p([^>]*)>/i;
const LEADING_COMMENT_REGEX = /^<!--[\s\S]*?-->/;
const MEDIA_TAG_REGEX = /<(?:img|picture|video)\b/i;
const LEADING_MEDIA_WRAPPER_REGEX =
  /<\/?(?:section|div|p|span|a|figure|picture)\b[^>]*>/gi;
const LEADING_MEDIA_ELEMENT_REGEX = /<(?:img|video|source)\b[^>]*\/?>/gi;
const BREAK_TAG_REGEX = /<br\s*\/?>/gi;

const VOID_TAGS = new Set([
  "area",
  "base",
  "br",
  "col",
  "embed",
  "hr",
  "img",
  "input",
  "link",
  "meta",
  "param",
  "source",
  "track",
  "wbr",
]);

type LeadingElement = {
  tagName: string;
  end: number;
};

type PrepareArticleOptions = {
  suppressLeadingMedia?: boolean;
};

function getPlainTextFromHtml(html: string): string {
  return sanitizeHtml(html, PLAIN_TEXT_SANITIZE_OPTIONS)
    .replace(/\s+/g, " ")
    .trim();
}

function skipLeadingNonContent(html: string): number {
  let offset = 0;

  while (offset < html.length) {
    const whitespaceMatch = html.slice(offset).match(/^\s+/);
    if (whitespaceMatch) {
      offset += whitespaceMatch[0].length;
      continue;
    }

    const commentMatch = html.slice(offset).match(LEADING_COMMENT_REGEX);
    if (commentMatch) {
      offset += commentMatch[0].length;
      continue;
    }

    break;
  }

  return offset;
}

function findTagEnd(html: string, start: number): number {
  let quote: '"' | "'" | null = null;

  for (let index = start + 1; index < html.length; index += 1) {
    const char = html[index];

    if (quote) {
      if (char === quote) {
        quote = null;
      }
      continue;
    }

    if (char === '"' || char === "'") {
      quote = char;
      continue;
    }

    if (char === ">") {
      return index + 1;
    }
  }

  return -1;
}

function parseTagAt(
  html: string,
  start: number,
): (LeadingElement & { isClosing: boolean; selfClosing: boolean }) | null {
  const end = findTagEnd(html, start);
  if (end === -1) return null;

  const rawTag = html.slice(start + 1, end - 1).trim();
  if (!rawTag || rawTag.startsWith("!") || rawTag.startsWith("?")) {
    return null;
  }

  const isClosing = rawTag.startsWith("/");
  const normalized = isClosing ? rawTag.slice(1).trim() : rawTag;
  const tagNameMatch = normalized.match(/^([A-Za-z][\w:-]*)/);
  if (!tagNameMatch) return null;

  return {
    tagName: tagNameMatch[1].toLowerCase(),
    end,
    isClosing,
    selfClosing: !isClosing && /\/\s*$/.test(normalized),
  };
}

function getLeadingElement(html: string): LeadingElement | null {
  const start = skipLeadingNonContent(html);
  if (start >= html.length || html[start] !== "<") return null;

  const openingTag = parseTagAt(html, start);
  if (!openingTag || openingTag.isClosing) return null;

  if (openingTag.selfClosing || VOID_TAGS.has(openingTag.tagName)) {
    return {
      tagName: openingTag.tagName,
      end: openingTag.end,
    };
  }

  let depth = 1;
  let cursor = openingTag.end;

  while (cursor < html.length) {
    const nextTagStart = html.indexOf("<", cursor);
    if (nextTagStart === -1) return null;

    if (html.startsWith("<!--", nextTagStart)) {
      const commentEnd = html.indexOf("-->", nextTagStart + 4);
      if (commentEnd === -1) return null;
      cursor = commentEnd + 3;
      continue;
    }

    const tag = parseTagAt(html, nextTagStart);
    if (!tag) {
      cursor = nextTagStart + 1;
      continue;
    }

    if (!tag.selfClosing && !VOID_TAGS.has(tag.tagName)) {
      if (tag.tagName === openingTag.tagName) {
        depth += tag.isClosing ? -1 : 1;
        if (depth === 0) {
          return {
            tagName: openingTag.tagName,
            end: tag.end,
          };
        }
      }
    }

    cursor = tag.end;
  }

  return null;
}

function isMediaOnlyBlock(html: string, tagName: string): boolean {
  if (tagName === "img" || tagName === "picture" || tagName === "video") {
    return true;
  }

  if (getPlainTextFromHtml(html)) {
    return false;
  }

  if (!MEDIA_TAG_REGEX.test(html)) {
    return false;
  }

  const nonMediaResidue = html
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(LEADING_MEDIA_WRAPPER_REGEX, "")
    .replace(LEADING_MEDIA_ELEMENT_REGEX, "")
    .replace(BREAK_TAG_REGEX, "")
    .replace(/\s+/g, "");

  return nonMediaResidue.length === 0;
}

function stripLeadingMediaBlock(html: string): string {
  const start = skipLeadingNonContent(html);
  const leadingElement = getLeadingElement(html);
  if (!leadingElement) return html;

  const leadingHtml = html.slice(start, leadingElement.end);
  if (!isMediaOnlyBlock(leadingHtml, leadingElement.tagName)) {
    return html;
  }

  return html.slice(leadingElement.end).trimStart();
}

function slugifyHeading(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function appendClassAttribute(attributes: string, className: string): string {
  if (/class\s*=\s*"[^"]*"/i.test(attributes)) {
    return attributes.replace(
      /class\s*=\s*"([^"]*)"/i,
      (_match, existing) => `class="${`${existing} ${className}`.trim()}"`,
    );
  }

  if (/class\s*=\s*'[^']*'/i.test(attributes)) {
    return attributes.replace(
      /class\s*=\s*'([^']*)'/i,
      (_match, existing) => `class="${`${existing} ${className}`.trim()}"`,
    );
  }

  return `${attributes} class="${className}"`;
}

function ensureIdAttribute(attributes: string, id: string): string {
  if (/\sid\s*=\s*["'][^"']+["']/i.test(attributes)) {
    return attributes;
  }

  return `${attributes} id="${id}"`;
}

export function extractHeadingsFromHtml(html: string): ArticleHeading[] {
  const headings: ArticleHeading[] = [];
  const seen = new Map<string, number>();

  html.replace(HEADING_REGEX, (_match, level, _attributes, innerHtml) => {
    const text = getPlainTextFromHtml(innerHtml);
    if (!text) return "";

    const baseId = slugifyHeading(text) || `section-${headings.length + 1}`;
    const nextCount = (seen.get(baseId) ?? 0) + 1;
    seen.set(baseId, nextCount);

    headings.push({
      id: nextCount === 1 ? baseId : `${baseId}-${nextCount}`,
      text,
      level: Number(level) as ArticleHeadingLevel,
    });

    return "";
  });

  return headings;
}

export function enhanceArticleHtml(
  html: string,
  headings: ArticleHeading[],
): string {
  let headingIndex = 0;

  const withHeadingIds = html.replace(
    HEADING_REGEX,
    (match, level, attributes, innerHtml) => {
      const heading = headings[headingIndex];
      headingIndex += 1;

      if (!heading) return match;

      const withId = ensureIdAttribute(attributes, heading.id);
      const withClass = appendClassAttribute(
        withId,
        level === "2" ? "article-heading-anchor" : "article-subheading-anchor",
      );

      return `<h${level}${withClass}>${innerHtml}</h${level}>`;
    },
  );

  return withHeadingIds.replace(
    FIRST_PARAGRAPH_REGEX,
    (_match, attributes) =>
      `<p${appendClassAttribute(attributes, "article-lead")}>`,
  );
}

export function estimateReadingStatsFromHtml(html: string): ReadingStats {
  const plainText = getPlainTextFromHtml(html);
  const cjkCharacterCount = (plainText.match(/\p{Script=Han}/gu) ?? []).length;
  const latinWordCount = (
    plainText.match(/[A-Za-z0-9]+(?:['’-][A-Za-z0-9]+)*/g) ?? []
  ).length;
  const characterCount = plainText.replace(/\s+/g, "").length;
  const minutes = Math.max(
    1,
    Math.ceil(cjkCharacterCount / 320 + latinWordCount / 180),
  );

  return {
    minutes,
    characterCount,
    cjkCharacterCount,
    latinWordCount,
  };
}

export function formatReadingTime(minutes: number): string {
  return `${minutes} 分钟阅读`;
}

export function formatCharacterCount(characterCount: number): string {
  return `${new Intl.NumberFormat("zh-CN").format(characterCount)} 字`;
}

export function prepareArticleHtml(
  html: string,
  options: PrepareArticleOptions = {},
): {
  html: string;
  headings: ArticleHeading[];
  stats: ReadingStats;
} {
  // When the page already has a dedicated cover hero, remove a duplicated
  // lead-media block from the imported article body so reading starts once.
  const visibleHtml = options.suppressLeadingMedia
    ? stripLeadingMediaBlock(html)
    : html;
  const headings = extractHeadingsFromHtml(visibleHtml);

  return {
    html: enhanceArticleHtml(visibleHtml, headings),
    headings,
    stats: estimateReadingStatsFromHtml(visibleHtml),
  };
}
