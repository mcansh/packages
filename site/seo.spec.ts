import { describe, expect, it } from "vitest";
import {
  buildSitemapXml,
  canonicalizeSitemapLoc,
  canonicalUrl,
  DEFAULT_DESCRIPTION,
  displayPartsToPlainText,
  firstParagraph,
  injectBeforeHeadEnd,
  renderHeadTags,
  replaceDescription,
  rewriteSitemapLocs,
  robotsTxt,
  serializeJsonLd,
  softwareSourceCodeSchema,
  techArticleSchema,
  toCanonicalPath,
  truncate,
} from "./seo.js";

describe("canonical URLs", () => {
  it("maps the homepage to the trailing-slash origin", () => {
    expect(canonicalUrl("https://packages.mcan.sh/", "index.html")).toBe(
      "https://packages.mcan.sh/",
    );
    expect(toCanonicalPath("index.html")).toBe("/");
  });

  it("strips .html so Cloudflare html_handling does not 307 sitemap URLs", () => {
    expect(
      canonicalUrl(
        "https://packages.mcan.sh/",
        "modules/_mcansh_http-helmet.html",
      ),
    ).toBe("https://packages.mcan.sh/modules/_mcansh_http-helmet");
    expect(
      canonicalUrl(
        "https://packages.mcan.sh/",
        "funcs/_mcansh_http-helmet.index.createNonce.html",
      ),
    ).toBe(
      "https://packages.mcan.sh/funcs/_mcansh_http-helmet.index.createNonce",
    );
  });

  it("rewrites TypeDoc sitemap locs onto the canonical host without .html", () => {
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
	<url>
		<loc>https://packages.mcan.sh/index.html</loc>
	</url>
	<url>
		<loc>https://packages.mcan.sh/functions/_mcansh_url.urlString.html</loc>
	</url>
</urlset>
`;

    expect(rewriteSitemapLocs(xml, "https://packages.mcan.sh/")).toContain(
      "<loc>https://packages.mcan.sh/</loc>",
    );
    expect(rewriteSitemapLocs(xml, "https://packages.mcan.sh/")).toContain(
      "<loc>https://packages.mcan.sh/functions/_mcansh_url.urlString</loc>",
    );
    expect(
      canonicalizeSitemapLoc(
        "http://localhost:8787/modules.html",
        "https://packages.mcan.sh/",
      ),
    ).toBe("https://packages.mcan.sh/modules");
  });

  it("builds a sitemap of public doc URLs", () => {
    let xml = buildSitemapXml(
      ["index.html", "modules/_mcansh_url.html"],
      "https://packages.mcan.sh/",
      "2026-10-28T00:00:00.000Z",
    );

    expect(xml).toContain(
      'xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"',
    );
    expect(xml).toContain("<loc>https://packages.mcan.sh/</loc>");
    expect(xml).toContain(
      "<loc>https://packages.mcan.sh/modules/_mcansh_url</loc>",
    );
    expect(xml).not.toContain("index.html");
  });
});

describe("copy", () => {
  it("turns README display parts into a meta description", () => {
    let text = displayPartsToPlainText([
      { kind: "text", text: "# HTTP Helmet\n\n" },
      {
        kind: "text",
        text: "easily add CSP and other security headers to your web application.\n",
      },
    ]);

    expect(firstParagraph(text)).toBe(
      "easily add CSP and other security headers to your web application.",
    );
  });

  it("strips markdown and truncates long copy", () => {
    expect(
      firstParagraph(
        "Collection of packages created by [@mcansh](https://github.com/mcansh)\n\nAll packages are packaged underneath the @mcansh scope",
      ),
    ).toBe("Collection of packages created by @mcansh");
    expect(truncate("a".repeat(200), 160).endsWith("…")).toBe(true);
    expect(DEFAULT_DESCRIPTION.length).toBeLessThanOrEqual(160);
  });
});

describe("html injection", () => {
  it("replaces TypeDoc's generic description and injects social + JSON-LD tags", () => {
    let html = `<!DOCTYPE html><html><head><title>@mcansh/url | Packages</title><meta name="description" content="Documentation for Packages"/></head><body></body></html>`;
    let canonical = "https://packages.mcan.sh/modules/_mcansh_url";
    let description =
      "a template string function to create urls and only keeping search params with values";
    let tags = renderHeadTags({
      title: "@mcansh/url | Packages",
      description,
      canonical,
      jsonLd: [
        softwareSourceCodeSchema({
          name: "@mcansh/url",
          description,
          url: canonical,
        }),
        {
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            {
              "@type": "ListItem",
              position: 1,
              name: "Packages",
              item: "https://packages.mcan.sh/",
            },
          ],
        },
      ],
    });

    let next = injectBeforeHeadEnd(replaceDescription(html, description), tags);

    expect(next).toContain(`content="${description}"`);
    expect(next).not.toContain("Documentation for Packages");
    expect(next).toContain(`<link rel="canonical" href="${canonical}"/>`);
    expect(next).toContain(
      `<meta property="og:title" content="@mcansh/url | Packages"/>`,
    );
    expect(next).toContain(`<meta name="twitter:card" content="summary"/>`);
    expect(next).toContain('"@type":"SoftwareSourceCode"');
    expect(next).toContain('"@type":"BreadcrumbList"');
    expect(next).not.toContain('"@type":"WebSite"');
  });

  it("keeps a homepage WebSite schema distinct from added TechArticle tags", () => {
    let tags = renderHeadTags({
      title: "Packages",
      description: DEFAULT_DESCRIPTION,
      canonical: "https://packages.mcan.sh/",
      includeCanonical: false,
      jsonLd: [
        techArticleSchema({
          headline: "Packages",
          description: DEFAULT_DESCRIPTION,
          url: "https://packages.mcan.sh/modules",
        }),
      ],
    });

    expect(tags).not.toContain('rel="canonical"');
    expect(tags).toContain('"@type":"TechArticle"');
    expect(serializeJsonLd({ html: "<script>" })).toContain("\\u003cscript>");
  });
});

describe("robots.txt", () => {
  it("points crawlers at the canonical sitemap", () => {
    expect(robotsTxt("https://packages.mcan.sh/sitemap.xml")).toBe(
      "User-agent: *\nAllow: /\n\nSitemap: https://packages.mcan.sh/sitemap.xml\n",
    );
  });
});
