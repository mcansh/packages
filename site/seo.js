// @ts-check

export const SITE_NAME = "Packages";
export const CANONICAL_ORIGIN = "https://packages.mcan.sh";
export const CODE_REPOSITORY = "https://github.com/mcansh/packages";
export const DEFAULT_DESCRIPTION =
  "API documentation for @mcansh packages, including http-helmet, url, create-temporary-files, and vitest-response-matchers.";

/**
 * @param {string | undefined} url
 */
export function hostedBaseUrl(url) {
  let value = url?.trim() || `${CANONICAL_ORIGIN}/`;
  return value.endsWith("/") ? value : `${value}/`;
}

/**
 * @param {string} pageUrl
 */
export function toCanonicalPath(pageUrl) {
  if (!pageUrl || pageUrl === "/" || pageUrl === "index.html") {
    return "/";
  }

  let path = pageUrl.startsWith("/") ? pageUrl : `/${pageUrl}`;
  if (path.endsWith("/index.html")) {
    path = path.slice(0, -"index.html".length);
  } else if (path.endsWith(".html")) {
    path = path.slice(0, -".html".length);
  }

  return path || "/";
}

/**
 * @param {string | undefined} base
 * @param {string} pageUrl
 */
export function canonicalUrl(base, pageUrl) {
  let origin = hostedBaseUrl(base).replace(/\/$/, "");
  let path = toCanonicalPath(pageUrl);
  return path === "/" ? `${origin}/` : `${origin}${path}`;
}

/**
 * @param {readonly { kind: string, text: string }[] | undefined} parts
 */
export function displayPartsToPlainText(parts) {
  if (!parts?.length) {
    return "";
  }

  return parts.map((part) => part.text).join("");
}

/**
 * @param {string} text
 * @param {number} [max]
 */
export function firstParagraph(text, max = 160) {
  let withoutHeadings = text
    .replaceAll("\r\n", "\n")
    .split("\n")
    .filter((line) => !/^#{1,6}\s/.test(line.trim()))
    .join("\n")
    .trim();

  let paragraph = withoutHeadings.split(/\n\s*\n/)[0] ?? "";
  let stripped = paragraph
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/\s+/g, " ")
    .trim();

  return truncate(stripped, max);
}

/**
 * @param {string} text
 * @param {number} [max]
 */
export function truncate(text, max = 160) {
  if (text.length <= max) {
    return text;
  }

  let cut = text.slice(0, max - 1);
  let space = cut.lastIndexOf(" ");
  let value = (space > 80 ? cut.slice(0, space) : cut).trimEnd();
  return `${value}…`;
}

/**
 * @param {string} value
 */
export function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

/**
 * @param {unknown} data
 */
export function serializeJsonLd(data) {
  return JSON.stringify(data).replaceAll("<", "\\u003c");
}

/**
 * @typedef {{ name: string, url: string }} Breadcrumb
 * @typedef {Record<string, unknown>} JsonLd
 */

/**
 * @param {string} base
 * @param {string} name
 * @returns {JsonLd}
 */
export function websiteSchema(base, name) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name,
    url: hostedBaseUrl(base),
  };
}

/**
 * @param {{ name: string, description: string, url: string, codeRepository?: string }} input
 * @returns {JsonLd}
 */
export function softwareSourceCodeSchema(input) {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareSourceCode",
    name: input.name,
    description: input.description,
    url: input.url,
    codeRepository: input.codeRepository ?? CODE_REPOSITORY,
    programmingLanguage: "TypeScript",
  };
}

/**
 * @param {{ headline: string, description: string, url: string }} input
 * @returns {JsonLd}
 */
export function techArticleSchema(input) {
  return {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    headline: input.headline,
    description: input.description,
    url: input.url,
  };
}

/**
 * @param {Breadcrumb[]} crumbs
 * @returns {JsonLd}
 */
export function breadcrumbListSchema(crumbs) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.name,
      item: crumb.url,
    })),
  };
}

/**
 * @param {{
 *   title: string,
 *   description: string,
 *   canonical: string,
 *   jsonLd: JsonLd[],
 *   includeCanonical?: boolean,
 * }} input
 */
export function renderHeadTags(input) {
  let tags = [];

  if (input.includeCanonical !== false) {
    tags.push(`<link rel="canonical" href="${escapeHtml(input.canonical)}"/>`);
  }

  tags.push(
    `<meta property="og:type" content="website"/>`,
    `<meta property="og:site_name" content="${escapeHtml(SITE_NAME)}"/>`,
    `<meta property="og:title" content="${escapeHtml(input.title)}"/>`,
    `<meta property="og:description" content="${escapeHtml(input.description)}"/>`,
    `<meta property="og:url" content="${escapeHtml(input.canonical)}"/>`,
    `<meta name="twitter:card" content="summary"/>`,
    `<meta name="twitter:title" content="${escapeHtml(input.title)}"/>`,
    `<meta name="twitter:description" content="${escapeHtml(input.description)}"/>`,
  );

  for (let node of input.jsonLd) {
    tags.push(
      `<script type="application/ld+json">${serializeJsonLd(node)}</script>`,
    );
  }

  return tags.join("");
}

/**
 * @param {string} html
 * @param {string} description
 */
export function replaceDescription(html, description) {
  return html.replace(
    /<meta name="description" content="[^"]*"/,
    `<meta name="description" content="${escapeHtml(description)}"`,
  );
}

/**
 * @param {string} html
 * @param {string} snippet
 */
export function injectBeforeHeadEnd(html, snippet) {
  let index = html.lastIndexOf("</head>");
  if (index === -1) {
    return `${html}${snippet}`;
  }
  return `${html.slice(0, index)}${snippet}${html.slice(index)}`;
}

/**
 * @param {string} sitemapUrl
 */
export function robotsTxt(sitemapUrl) {
  return `User-agent: *\nAllow: /\n\nSitemap: ${sitemapUrl}\n`;
}

/**
 * @param {string} loc
 * @param {string} base
 */
export function canonicalizeSitemapLoc(loc, base) {
  let origin = new URL(hostedBaseUrl(base));
  let url = new URL(loc);
  url.protocol = origin.protocol;
  url.hostname = origin.hostname;
  url.port = origin.port;
  url.hash = "";
  url.search = "";
  url.pathname = toCanonicalPath(url.pathname);
  return url.toString();
}

/**
 * @param {string} xml
 * @param {string} base
 */
export function rewriteSitemapLocs(xml, base) {
  return xml.replace(/<loc>([^<]+)<\/loc>/g, (_match, loc) => {
    return `<loc>${escapeHtml(canonicalizeSitemapLoc(loc, base))}</loc>`;
  });
}

/**
 * @param {string[]} pageUrls
 * @param {string} base
 * @param {string} [lastmod]
 */
export function buildSitemapXml(
  pageUrls,
  base,
  lastmod = new Date().toISOString(),
) {
  let urls = pageUrls
    .map((pageUrl) => canonicalUrl(base, pageUrl))
    .map((loc) => {
      return `\t<url>\n\t\t<loc>${escapeHtml(loc)}</loc>\n\t\t<lastmod>${escapeHtml(lastmod)}</lastmod>\n\t</url>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}
