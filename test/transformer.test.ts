import { test } from "node:test";
import assert from "node:assert/strict";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { VFile } from "vfile";
import { toHtml } from "hast-util-to-html";
import { ImageGridCaptions } from "../dist/index.js";
import { resolveImage } from "../src/resolve";
import type { BuildCtx, FullSlug } from "@quartz-community/types";

const ctx = { allSlugs: ["notes/page", "images/portrait.jpg", "images/landscape.jpg", "images/日本語-画像.png"], cfg: { configuration: {} } } as BuildCtx;
export async function transform(markdown: string, context = ctx) {
  const plugin = ImageGridCaptions();
  const processor = unified().use(remarkParse).use(plugin.markdownPlugins!(context)).use(remarkRehype).use(plugin.htmlPlugins!(context));
  const file = new VFile(markdown);
  file.data.slug = "notes/page" as FullSlug;
  return toHtml(await processor.run(processor.parse(file), file));
}
const block = (body: string) => "```image-grid-captions\n" + body + "\n```";
test("nested note, shortest paths, captions and semantic structure", async () => {
  const html = await transform(block("columns: 2\n![[portrait.jpg|外観]]\n![[images/landscape.jpg]]"));
  assert.match(html, /src="\.\.\/images\/portrait.jpg"/);
  assert.match(html, /data-columns="2"/);
  assert.match(html, /data-gap="8"/);
  assert.equal((html.match(/<figure /g) ?? []).length, 2);
  assert.equal((html.match(/<figcaption /g) ?? []).length, 1);
  assert.match(html, /alt="landscape.jpg"/);
  assert.doesNotMatch(html, /<pre|data-image-grid-source/);
});
test("errors stay within their block", async () => {
  const html = await transform(block("columns: 2\n![[missing.jpg]]\n![[portrait.jpg]]") + "\n\n" + block("columns: 2\n![[portrait.jpg]]\n![[landscape.jpg]]"));
  assert.match(html, /Image not found: missing.jpg/);
  assert.equal((html.match(/<figure /g) ?? []).length, 2);
});
test("invalid columns and gap render errors instead of throwing", async () => {
  for (const params of ["columns: 3", "gap: 8", "columns: 2\ngap: -1", "colums: 2"]) {
    assert.match(await transform(block(params + "\n![[portrait.jpg]]\n![[landscape.jpg]]")), /Image Grid Captions Error:/);
  }
});
test("plain text captions cannot inject HTML", async () => {
  const html = await transform(block('columns: 2\n![[portrait.jpg|<script>alert("x")</script>]]\n![[landscape.jpg]]'));
  assert.doesNotMatch(html, /><script>/);
  assert.match(html, /&#x3C;script>/);
});
test("ordinary Markdown and other fences remain unchanged", async () => {
  const html = await transform('![ordinary](images/portrait.jpg)\n\n```image-grid\ncolumns: 2\n```');
  assert.match(html, /<p><img src="images\/portrait.jpg" alt="ordinary"><\/p>/);
  assert.match(html, /language-image-grid/);
  assert.doesNotMatch(html, /<figure/);
});
test("Japanese names and spaces use Quartz encoding", () => {
  const result = resolveImage("notes/page" as FullSlug, "日本語 画像.png", ctx.allSlugs);
  assert.equal(result, "../images/日本語-画像.png");
});
test("ambiguous basenames follow Quartz root fallback, then fail if absent", () => {
  const slugs = ["a/p.jpg", "b/p.jpg"] as FullSlug[];
  assert.throws(() => resolveImage("page" as FullSlug, "p.jpg", slugs), /Image not found/);
  assert.equal(resolveImage("page" as FullSlug, "a/p.jpg", slugs), "./a/p.jpg");
});
test("resources contain CSS and persistent SPA client", () => {
  const resources = ImageGridCaptions().externalResources!(ctx)!;
  assert.match(resources.css![0].content, /object-fit: contain/);
  assert.equal(resources.js![0].spaPreserve, true);
  assert.equal(resources.js![0].contentType, "inline");
});
