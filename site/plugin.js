// @ts-check

import fs from "node:fs/promises";
import path from "node:path";
import {
  DeclarationReflection,
  JSX,
  KindRouter,
  PageEvent,
  ProjectReflection,
  ReflectionKind,
  RendererEvent,
} from "typedoc";
import * as seo from "./seo.js";

/**
 * Cloudflare Pages treats a root `functions/` directory as Pages Functions and
 * omits those files from static assets, so TypeDoc's default `/functions/...`
 * pages 404 in production. Serve them from `funcs/` instead.
 */
export class CloudflareKindRouter extends KindRouter {
  /**
   * @param {import("typedoc").Application} app
   */
  constructor(app) {
    super(app);
    this.directories.set(ReflectionKind.Function, "funcs");
  }
}

/**
 * @param {import("typedoc").Application} app
 */
export function load(app) {
  app.renderer.defineRouter("cloudflare-kind", CloudflareKindRouter);

  app.renderer.on(RendererEvent.BEGIN, () => {
    app.renderer.hooks.on("head.end", (context) => {
      let tags = buildHeadTags(context);
      return JSX.createElement(JSX.Raw, { html: tags });
    });

    app.renderer.postRenderAsyncJobs.push(async (event) => {
      await writeDiscoveryFiles(event, app);
    });
  });

  app.renderer.on(PageEvent.END, (page) => {
    if (!page.contents || !page.isReflectionEvent()) {
      return;
    }

    let description = descriptionForPage(page);
    page.contents = seo.replaceDescription(page.contents, description);
  });
}

/**
 * @param {import("typedoc").DefaultThemeRenderContext} context
 */
function buildHeadTags(context) {
  let page = context.page;
  let model = context.model;
  let base = seo.hostedBaseUrl(context.options.getValue("hostedBaseUrl"));
  let canonical = seo.canonicalUrl(base, page.url);
  let title = pageTitle(model, page.project);
  let description = descriptionForPage(page);
  let jsonLd = structuredData({
    base,
    canonical,
    description,
    model,
    pageUrl: page.url,
    title,
    urlFor(reflection) {
      if (!context.router.hasUrl(reflection)) {
        return undefined;
      }
      return seo.canonicalUrl(base, context.router.getFullUrl(reflection));
    },
  });

  return seo.renderHeadTags({
    title,
    description,
    canonical,
    jsonLd,
    // TypeDoc already emits a homepage canonical when hostedBaseUrl is set.
    includeCanonical: page.url !== "index.html",
  });
}

/**
 * @param {import("typedoc").PageEvent<import("typedoc").Reflection>} page
 */
function descriptionForPage(page) {
  let model = page.model;
  if (page.url === "modules.html") {
    return `Module index for ${page.project.name} — API docs for @mcansh packages.`;
  }
  if (page.url === "hierarchy.html") {
    return `Type hierarchy for ${page.project.name}.`;
  }

  let readme;
  if (
    model instanceof ProjectReflection ||
    model instanceof DeclarationReflection
  ) {
    readme = model.readme;
  }

  let fromReadme = seo.firstParagraph(seo.displayPartsToPlainText(readme));
  if (fromReadme) {
    return fromReadme;
  }

  let comment = model.comment;
  if (
    !comment &&
    model instanceof DeclarationReflection &&
    model.signatures?.[0]?.comment
  ) {
    comment = model.signatures[0].comment;
  }

  let fromComment = seo.firstParagraph(
    seo.displayPartsToPlainText(
      comment?.getShortSummary(true) ?? comment?.summary,
    ),
  );
  if (fromComment) {
    return fromComment;
  }

  if (model.isProject()) {
    return seo.DEFAULT_DESCRIPTION;
  }

  if (isPackageModule(model)) {
    return `API documentation for ${model.name}.`;
  }

  return `${ReflectionKind.singularString(model.kind)} ${model.getFriendlyFullName()} in ${page.project.name}.`;
}

/**
 * @param {import("typedoc").Reflection} model
 * @param {import("typedoc").ProjectReflection} project
 */
function pageTitle(model, project) {
  if (model.isProject()) {
    return displayName(model);
  }
  return `${displayName(model)} | ${displayName(project)}`;
}

/**
 * @param {import("typedoc").Reflection} reflection
 */
function displayName(reflection) {
  let version = "";
  if (
    (reflection instanceof DeclarationReflection ||
      reflection instanceof ProjectReflection) &&
    reflection.packageVersion
  ) {
    version = ` - v${reflection.packageVersion}`;
  }
  return `${reflection.name}${version}`;
}

/**
 * @param {import("typedoc").Reflection} model
 */
function isPackageModule(model) {
  return model.kindOf(ReflectionKind.Module) && !!model.parent?.isProject();
}

/**
 * @param {{
 *   base: string,
 *   canonical: string,
 *   description: string,
 *   model: import("typedoc").Reflection,
 *   pageUrl: string,
 *   title: string,
 *   urlFor: (reflection: import("typedoc").Reflection) => string | undefined,
 * }} input
 */
function structuredData(input) {
  let crumbs = [
    { name: seo.SITE_NAME, url: seo.hostedBaseUrl(input.base) },
    ...breadcrumbTrail(input.model, input.urlFor),
  ];

  /** @type {seo.JsonLd[]} */
  let nodes = [seo.breadcrumbListSchema(crumbs)];

  if (input.pageUrl === "index.html") {
    // TypeDoc already emits a valid WebSite schema on the homepage.
    return nodes;
  }

  if (isPackageModule(input.model)) {
    nodes.unshift(
      seo.softwareSourceCodeSchema({
        name: input.model.name,
        description: input.description,
        url: input.canonical,
      }),
    );
    return nodes;
  }

  nodes.unshift(
    seo.techArticleSchema({
      headline: input.title,
      description: input.description,
      url: input.canonical,
    }),
  );
  return nodes;
}

/**
 * @param {import("typedoc").Reflection} model
 * @param {(reflection: import("typedoc").Reflection) => string | undefined} urlFor
 */
function breadcrumbTrail(model, urlFor) {
  /** @type {import("typedoc").Reflection[]} */
  let chain = [];
  /** @type {import("typedoc").Reflection | undefined} */
  let current = model;
  while (current && !current.isProject()) {
    chain.unshift(current);
    current = current.parent;
  }

  return chain.flatMap((reflection) => {
    let url = urlFor(reflection);
    if (!url) {
      return [];
    }
    return [{ name: reflection.name, url }];
  });
}

/**
 * @param {import("typedoc").RendererEvent} event
 * @param {import("typedoc").Application} app
 */
async function writeDiscoveryFiles(event, app) {
  let base = seo.hostedBaseUrl(app.options.getValue("hostedBaseUrl"));
  let sitemapPath = path.join(event.outputDirectory, "sitemap.xml");
  let lastmod = new Date(app.renderer.renderStartTime).toISOString();
  let pageUrls = event.pages.map((page) => page.url);

  let sitemap;
  try {
    sitemap = seo.rewriteSitemapLocs(
      await fs.readFile(sitemapPath, "utf8"),
      base,
    );
  } catch {
    sitemap = seo.buildSitemapXml(pageUrls, base, lastmod);
  }

  await fs.writeFile(sitemapPath, sitemap);
  await fs.writeFile(
    path.join(event.outputDirectory, "robots.txt"),
    seo.robotsTxt(new URL("sitemap.xml", base).toString()),
  );
}
