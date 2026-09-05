// Optional integration against a real sibling Quartz installation and Obsidian build.
import { resolve, join } from "node:path";
import { pathToFileURL } from "node:url";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { createRequire } from "node:module";
import { build } from "esbuild";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { VFile } from "vfile";
import { toHtml } from "hast-util-to-html";
import assert from "node:assert/strict";
import { ImageGridCaptions } from "../dist/index.js";

const quartzRoot = resolve(process.argv[2] ?? "../quartz-blog");
const obsidianRoot = resolve(process.argv[3] ?? "../obsidian-image-grid-captions");
const requireObsidian = createRequire(join(obsidianRoot, "package.json"));
const { chromium } = requireObsidian("@playwright/test");
const load = (name) => import(pathToFileURL(join(quartzRoot, ".quartz/plugins", name, "dist/index.js")));
const { ObsidianFlavoredMarkdown } = await load("obsidian-flavored-markdown");
const { ImageCaptions } = await load("quartz-image-captions");
const { CrawlLinks } = await load("crawl-links");
const { SyntaxHighlighting } = await load("syntax-highlighting");
const plugins = [SyntaxHighlighting(), ObsidianFlavoredMarkdown(), ImageCaptions(), CrawlLinks(), ImageGridCaptions()];
const ctx = { allSlugs: ["notes/page", "images/portrait.png", "images/landscape.png", "images/square.png"], cfg: { configuration: {} }, argv: {} };
const body = "columns: 3\ngap: 8\n![[portrait.png|外観]]\n![[landscape.png|長いキャプション [メモ] が折り返されても画像の高さは同じです。]]\n![[portrait.png]]";
const markdown = "```image-grid-captions\n" + body + "\n```\n\n![[images/square.png|通常の画像]]\n\n```js\nconst ordinary = 1\n```";
let transformed = markdown;
for (const plugin of plugins) transformed = plugin.textTransform?.(ctx, transformed) ?? transformed;
const processor = unified().use(remarkParse);
for (const plugin of plugins) if (plugin.markdownPlugins) processor.use(plugin.markdownPlugins(ctx));
processor.use(remarkRehype, { allowDangerousHtml: true });
for (const plugin of plugins) if (plugin.htmlPlugins) processor.use(plugin.htmlPlugins(ctx));
const file = new VFile(transformed); file.data.slug = "notes/page";
const html = toHtml(await processor.run(processor.parse(file), file));
assert.equal((html.match(/class="image-grid-captions__item"/g) ?? []).length, 3);
assert.equal((html.match(/class="image-captions-figure"/g) ?? []).length, 1);
assert.ok(html.includes("長いキャプション [メモ]"), html);
assert.ok(html.includes("data-rehype-pretty-code-figure"), "ordinary code still highlighted");
assert.ok(!html.includes("__QIC_CAPTION_"));
for (const name of ["parser.ts", "layout.ts", "renderer.ts"]) {
  assert.equal(await readFile(`src/shared/${name}`, "utf8"), await readFile(join(obsidianRoot, "src/shared", name), "utf8"));
}
assert.equal(await readFile("src/styles.css", "utf8"), await readFile(join(obsidianRoot, "styles.css"), "utf8"));
const obsidianBundle = await build({ entryPoints: [join(obsidianRoot, "test/browser-entry.ts")], bundle: true, write: false, format: "iife", globalName: "GridTest" });
const resources = ImageGridCaptions().externalResources(ctx);
const browser = await chromium.launch({ channel: "msedge", headless: true });
await mkdir("test-results", { recursive: true });
try {
  const page = await browser.newPage({ viewport: { width: 1100, height: 1000 } });
  const errors = []; page.on("pageerror", e => errors.push(String(e)));
  const pngs = await page.evaluate(() => Object.fromEntries([["portrait", 200, 400], ["landscape", 600, 400], ["square", 400, 400]].map(([name, w, h], i) => {
    const canvas = document.createElement("canvas"); canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext("2d"); ctx.fillStyle = ["#376b86", "#ad603e", "#477557"][i]; ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = "white"; ctx.lineWidth = 12; ctx.strokeRect(6, 6, w - 12, h - 12);
    ctx.fillStyle = "white"; ctx.font = "26px sans-serif"; ctx.fillText(name, 20, 50);
    return [name, canvas.toDataURL().split(",")[1]];
  })));
  await page.route("https://grid.test/**", route => {
    const url = route.request().url();
    const name = url.split("/").pop().replace(".png", "");
    if (pngs[name]) return route.fulfill({ contentType: "image/png", body: Buffer.from(pngs[name], "base64") });
    return route.fulfill({ contentType: "text/html; charset=utf-8", body: `<meta charset="utf-8"><style>${resources.css[0].content} body {font-family:sans-serif} main {width:800px} .ordinary {display:none}</style><h2>Quartz</h2><main id="quartz">${html}</main><h2>Obsidian renderer</h2><main id="obsidian"></main>` });
  });
  await page.goto("https://grid.test/notes/page");
  await page.addScriptTag({ content: resources.js[0].script });
  await page.addScriptTag({ content: obsidianBundle.outputFiles[0].text });
  await page.evaluate(body => {
    const grid = GridTest.parseGrid(body);
    GridTest.mountGrid(GridTest.renderGrid(document.getElementById("obsidian"), grid, grid.images.map(img => "../images/" + img.path)));
    // Keep the normal image in the DOM to verify the other plugin, but out of the comparison screenshot.
    document.querySelector(".image-captions-figure").classList.add("ordinary");
    document.querySelector("[data-rehype-pretty-code-figure]").classList.add("ordinary");
  }, body);
  for (const width of [800, 320, 160, 1000]) {
    await page.locator("main").evaluateAll((els, width) => els.forEach(el => { el.style.width = `${width}px`; }), width);
    await page.waitForFunction(() => [...document.querySelectorAll(".image-grid-captions")].every(el => el.dataset.ready));
    await page.waitForFunction(width => [...document.querySelectorAll(".image-grid-captions")].every(el => Math.abs([...el.querySelectorAll("img")].reduce((s, img) => s + img.getBoundingClientRect().width, 16) - width) < 0.2), width);
    const dimensions = await page.locator(".image-grid-captions").evaluateAll(rows => rows.map(row => [...row.querySelectorAll("img")].map(img => [img.getBoundingClientRect().width, img.getBoundingClientRect().height, img.alt])));
    assert.deepEqual(dimensions[0], dimensions[1]);
  }
  await page.locator("main").evaluateAll(els => els.forEach(el => { el.style.width = "800px"; }));
  await page.screenshot({ path: "test-results/comparison.png", fullPage: true });
  await page.evaluate(() => {
    const row = document.querySelector("#quartz .image-grid-captions");
    const clone = row.cloneNode(true);
    clone.querySelector(".image-grid-captions__error")?.remove();
    row.replaceWith(clone);
    document.dispatchEvent(new CustomEvent("nav"));
  });
  await page.waitForFunction(() => document.querySelectorAll("#quartz .image-grid-captions__error").length === 1);
  await page.locator("#quartz").evaluate(el => { el.style.width = "400px"; });
  await page.waitForFunction(() => Math.abs([...document.querySelectorAll("#quartz .image-grid-captions img")].reduce((s, img) => s + img.getBoundingClientRect().width, 16) - 400) < 0.2);
  assert.deepEqual(errors, []);
  for (const root of [".", obsidianRoot]) {
    await mkdir(join(root, "examples/images"), { recursive: true });
    for (const [name, data] of Object.entries(pngs)) await writeFile(join(root, "examples/images", `${name}.png`), Buffer.from(data, "base64"));
  }
  const report = { passed: true, quartzPlugins: plugins.map(p => p.name), comparisonWidths: [800, 320, 160, 1000], sharedSourceIdentical: true, spaReplacement: true, ordinaryImagesPreserved: true, bracketCaptionsPreserved: true };
  await writeFile("test-results/integration-report.json", JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report));
} finally { await browser.close(); }
