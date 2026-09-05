import { test } from "node:test";
import assert from "node:assert/strict";
import { parseGrid } from "../src/shared/parser";
import { calculateLayout } from "../src/shared/layout";

const embeds = "![[portrait.jpg|外観]]\n![[images/landscape.jpg]]";
test("defaults, local paths, alt and captions", () => {
  const grid = parseGrid(`columns: 2\r\n${embeds}`);
  assert.equal(grid.gap, 8);
  assert.equal(grid.images[0].alt, "外観");
  assert.equal(grid.images[1].alt, "landscape.jpg");
});
for (const columns of [2, 3, 4]) test(`accept ${columns} images`, () => {
  assert.equal(parseGrid(`columns: ${columns}\n` + "![[a.jpg]]\n".repeat(columns)).images.length, columns);
});
for (const header of ["", "columns: 1", "columns: 5", "columns: abc", "columns: 2.5", "colums: 2", "columns: 2\ngap: -1", "columns: 2\ngap: abc", "columns: 2\ngap: 1rem", "columns: 2\ngap: 1.5", "columns: 2\ngap: 9007199254740992", "columns: 2\ncolumns: 2", "columns: 3"]) {
  test(`reject invalid header ${JSON.stringify(header)}`, () => assert.throws(() => parseGrid(`${header}\n${embeds}`)));
}
for (const image of ["![[https://example.com/a.jpg]]", "![[a.jpg|caption|right|300]]", "![[a.mp4]]", "![a](a.jpg)", "![[a.jpg]] ![[b.jpg]]"]) {
  test(`reject unsupported embed ${image}`, () => assert.throws(() => parseGrid(`columns: 2\n${image}\n![[a.jpg]]`)));
}
test("caption markup is plain text", () => assert.equal(parseGrid(`columns: 2\n![[a.jpg|<script>alert(1)</script>]]\n![[b.jpg]]`).images[0].caption, "<script>alert(1)</script>"));
for (const ratios of [[1.5, 1.5], [0.5, 1.5], [0.5, 1.5, 0.5], [0.5, 1, 1.5, 2]]) {
  for (const gap of [0, 4, 8, 20]) test(`layout ${ratios} gap ${gap}`, () => {
    for (const width of [160, 320, 800, 1200]) {
      const layout = calculateLayout(width, gap, ratios);
      assert.ok(Math.abs(layout.widths.reduce((a, b) => a + b) + gap * (ratios.length - 1) - width) < 1e-8);
      layout.widths.forEach((w, i) => assert.ok(Math.abs(w / ratios[i] - layout.height) < 1e-8));
    }
  });
}
test("impossible gap and invalid dimensions fail explicitly", () => {
  assert.throws(() => calculateLayout(10, 20, [1, 1]));
  assert.throws(() => calculateLayout(100, 8, [0, 1]));
});
