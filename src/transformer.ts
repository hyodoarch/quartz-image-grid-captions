import type { QuartzTransformerPlugin } from "@quartz-community/types";
import type { Root as MdRoot, RootContent as MdContent } from "mdast";
import type { Element, ElementContent, Root } from "hast";
import type { VFile } from "vfile";
import { LANGUAGE, errorText, parseGrid } from "./shared/parser";
import { resolveImage } from "./resolve";
import { restoreProtectedCaptions } from "./compat";
import styles from "./styles.css";

const element = (tagName: string, properties: Element["properties"], children: ElementContent[] = []): Element => ({ type: "element", tagName, properties, children });
const text = (value: string): ElementContent => ({ type: "text", value });

export const ImageGridCaptions: QuartzTransformerPlugin = () => ({
  name: "ImageGridCaptions",
  markdownPlugins() {
    return [() => (tree: MdRoot) => {
      const walk = (parent: { children: MdContent[] }) => {
        parent.children.forEach((node, i) => {
          if (node.type === "code" && node.lang === LANGUAGE) {
            // No visible image nodes until other image transformers have finished.
            parent.children[i] = { type: "paragraph", children: [], data: { hName: "div", hProperties: { "data-image-grid-source": node.value } } };
          } else if ("children" in node) walk(node as { children: MdContent[] });
        });
      };
      walk(tree);
    }];
  },
  htmlPlugins(ctx) {
    return [() => (tree: Root, file: VFile) => {
      const walk = (parent: Root | Element) => {
        parent.children.forEach((node, i) => {
          if (node.type !== "element") return;
          const source = node.properties["data-image-grid-source"] ?? node.properties.dataImageGridSource;
          if (typeof source !== "string") { walk(node); return; }
          try {
            const grid = parseGrid(restoreProtectedCaptions(source));
            if (!file.data.slug) throw new Error("Quartz page slug is missing.");
            const slug = file.data.slug;
            const items = grid.images.map(image => {
              const src = resolveImage(slug, image.path, ctx.allSlugs);
              return element("figure", { className: ["image-grid-captions__item"] }, [
                element("img", { className: ["image-grid-captions__image"], src, alt: image.alt, "data-image-path": image.path }),
                ...(image.caption ? [element("figcaption", { className: ["image-grid-captions__caption"] }, [text(image.caption)])] : []),
              ]);
            });
            parent.children[i] = element("div", { className: ["image-grid-captions"], "data-columns": grid.columns, "data-gap": grid.gap }, items);
          } catch (error) {
            parent.children[i] = element("div", { className: ["image-grid-captions__error"], role: "alert" }, [text(errorText(error))]);
          }
        });
      };
      walk(tree);
    }];
  },
  externalResources() {
    return { css: [{ content: styles, inline: true }], js: [{ script: __GRID_CLIENT__, contentType: "inline", loadTime: "afterDOMReady", spaPreserve: true }] };
  },
});
