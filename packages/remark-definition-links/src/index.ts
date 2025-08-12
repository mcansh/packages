import slugify from "@sindresorhus/slugify";
import type {
  Definition,
  Image,
  ImageReference,
  Link,
  LinkReference,
  Parent,
  PhrasingContent,
  Root,
} from "mdast";
import { SKIP, visit } from "unist-util-visit";

function removeTrailingSlash(url: string): string {
  return url.endsWith("/") ? url.slice(0, -1) : url;
}

function aggregate(node: { children: Array<PhrasingContent> }): string {
  return node.children.reduce<string>((string, childNode) => {
    if ("value" in childNode) {
      string += childNode.value;
    }

    if ("children" in childNode) {
      string += aggregate(childNode);
    }

    return string;
  }, "");
}

function getTitle(node: Image | Link) {
  if (node.type === "link") return aggregate(node);
  if (node.type === "image" && node.alt) return node.alt;
  return null;
}

export function remarkDefinitionLinks() {
  let definitions: Record<string, Record<string, Definition>> = {};
  let existing: Array<string> = [];
  let references = Object.create(null);

  return (tree: Root) => {
    function definitionVisitor(node: Definition) {
      let url = removeTrailingSlash(node.url);
      existing.push(node.identifier);

      if (!definitions[url]) {
        definitions[url] = Object.create(null);
      }

      let title = node.label || "";

      if (!definitions[url]) return;

      definitions[url][title] = node;
    }

    function linkVisitor(
      node: Image | Link,
      index: number | undefined,
      parent?: Parent,
    ) {
      if (!parent) return;
      if (typeof index !== "number") return;

      let url = removeTrailingSlash(node.url);

      let title = getTitle(node);

      if (typeof title !== "string") {
        throw new Error("Cannot aggregate a non-link, non-image node");
      }

      let reference = slugify(title);

      // this is usually blank if the image is also a link
      if (!reference) {
        if (node.type === "link") {
          let image =
            "children" in node && Array.isArray(node.children)
              ? node.children.find((child) => child.type === "image")
              : null;
          if (image && image.type === "image") {
            reference = slugify(image.alt + "-image");
          } else {
            reference = slugify(removeTrailingSlash(node.url));
          }
        }
      }

      let urls: Record<string, Definition> = definitions[url]
        ? definitions[url]
        : (definitions[url] = Object.create(null));

      let identifier: string;

      if (urls[url]) {
        identifier = urls[url].identifier;
      } else {
        do {
          if (!(reference in references)) {
            references[reference] = 0;
          }

          if (references[reference] === 0) {
            identifier = reference;
            references[reference] += 1;
          } else {
            references[reference] += 1;
            identifier = reference + "-" + references[reference];
          }
        } while (existing.includes(identifier));

        let definition: Definition = {
          type: "definition",
          identifier,
          title: "",
          url,
        };

        urls[url] = definition;
        if (!("children" in tree) || !Array.isArray(tree.children)) return;
        tree.children.push(definition);
      }

      let replacement: ImageReference | LinkReference =
        node.type === "image"
          ? {
              type: "imageReference",
              identifier,
              referenceType: "full",
              alt: title,
            }
          : {
              type: "linkReference",
              identifier,
              referenceType: "full",
              children: node.children,
            };

      parent.children[index] = replacement;
      return [SKIP, index];
    }

    visit(tree, "definition", definitionVisitor);
    visit(tree, ["link", "image"], (node, index, parent) => {
      if (node.type !== "link" && node.type !== "image") return;
      linkVisitor(node, index, parent);
    });
  };
}
